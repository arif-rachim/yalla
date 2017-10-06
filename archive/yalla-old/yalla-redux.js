(function () {
    var redux = {};

    redux.clone = function (obj) {
        var copy;
        if (null == obj || "object" != typeof obj) return obj;
        if (obj instanceof Date) {
            copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }
        if (obj instanceof Array) {
            copy = [];
            for (var i = 0, len = obj.length; i < len; i++) {
                copy[i] = clone(obj[i]);
            }
            return copy;
        }
        if (obj instanceof Object) {
            copy = {};
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
            }
            return copy;
        }
        throw new Error("Unable to copy obj! Its type isn't supported.");
    };

    redux.createStore = function (reducer, _state, _middleware) {
        var middleware = _enhancer;
        var state = _state;
        if (_state) {
            if (typeof _state === 'function') {
                middleware = _state;
                state = {};
            }
        }
        if (middleware) {
            return middleware(redux.createStore)(reducer, state);
        }

        function Store() {
            this._subscribers = this._subscribers || [];
        }

        Store.prototype.reducer = reducer;
        Store.prototype.state = state;

        Store.prototype.dispatch = function (action) {
            if (action == null) {
                throw new Error('You are calling dispatch but did not pass action to it');
            }
            if (!('type' in action)) {
                throw new Error('You are calling dispatch but did not pass type to it');
            }
            if (this.reducer) {
                this.state = this.reducer(this.state, action);
                this.updateSubscribers();
            }
        };

        Store.prototype.updateSubscribers = function () {
            for (var i = 0; i < this._subscribers.length; i++) {
                this._subscribers[i].apply(this);
            }
        };

        Store.prototype.subscribe = function (fct) {
            this._subscribers.push(fct);
        };
        Store.prototype.unSubscribe = function (fct) {
            this._subscribers.splice(this._subscribers.indexOf(fct), 1);
        };
        Store.prototype.getState = function () {
            return this.state;
        };
        return new Store();
    };

    redux.combineReducers = function (stateReducers) {
        return function (state, action) {
            var resultState = redux.clone(state);
            for (var key in stateReducers) {
                if (stateReducers.hasOwnProperty(key)) {
                    var reducer = stateReducers[key];
                    var stateVal = state[key];
                    var newState = reducer(stateVal, action);
                    resultState[key] = newState;
                }
            }
            return resultState;
        }
    };

    redux.applyMiddleware = function (middlewares) {
        // the first next will be create store !!
        return function (next) {
            return function (reducer, initialState) {
                var store = next(reducer, initialState);
                var dispatch = store.dispatch.bind(store);
                var getState = store.getState.bind(store);
                var chain = [];

                var middlewareStore = {
                    getState: store.getState.bind(store),
                    dispatch: function (action) {
                        dispatch(action);
                    }
                };

                chain = middlewares.map(function (middleware) {
                    return middleware(middlewareStore);
                });
                chain.push(store.dispatch.bind(store));
                dispatch = chain.reduceRight(function (composed, f) {
                    return f(composed);
                });

                store.dispatch = dispatch;
                return store;
            };
        }
    };

    return redux;

})();