/**
 * Created by arif on 2/16/2017.
 */

var calculatorReducer = function(state, action){
    if(action.type == 'INC'){
        return state + 1;
    }
    if(action.type == 'DEC'){
        return state - 1;
    }
    return state;
};

var calculationLogic = function(state,action){
    switch (action.type){
        case 'OPERATION_ADDING' : {
            return 'INC';
        }
        case 'OPERATION_REDUCING' : {
            return 'DEC';
        }
    }
    return state;
};


var combinedReducers = yalla.combineReducers({
    value : calculatorReducer,
    operation : calculationLogic
});

var logMiddleware = function (store) {
    return function(next) {
        return function (action) {
            console.log('we have action ',action);
            if(typeof action == 'function'){
                return action(store.dispatch,store.getState);
            }else{
                return next(action);
            }
        }
    }
};

var createStoreWithMiddleware = yalla.applyMiddleware([logMiddleware])(yalla.createStore);

var store = createStoreWithMiddleware(combinedReducers,{
    value : 0,
    operation : 'INC'
});

store.subscribe(function(){
    yalla.markAsDirty();
})

var addingAction = function(){
    store.dispatch({
        type : 'OPERATION_ADDING'
    });
}

var reducingAction = function(){
    store.dispatch({
        type : 'OPERATION_REDUCING'
    });
}

var operationAction = function(){
    var type = store.getState().operation;
    store.dispatch({
        type : type
    });
}

function $render(){
    return ['div',['input',{type:'button',value:'ADD',onclick:addingAction}],['input',{type:'button',value:'DEC',onclick:reducingAction}],['input',{type : 'button',value:'OPERATION',onclick:operationAction}], ['span',store.getState().value]]
}