/**
 * Created by arif on 2/16/2017.
 */

var todosReducer = $inject('reducers/todos-reducer');
var markTodosReducer = $inject('reducers/mark-todos-reducer');
var filterTodosReducer = $inject('reducers/filter-todos-reducer');

var combinedReducers = yalla.combineReducers({
    todos : todosReducer,
    done : markTodosReducer,
    filterType : filterTodosReducer
});
var initialState = {
    todos : [],
    done : [],
    filterType : 'ALL'
};

if(localStorage.getItem('state')){
    var initialState = JSON.parse(localStorage.getItem('state'));
}

var store = yalla.createStore(combinedReducers,initialState);

store.subscribe(function(){
    localStorage.setItem('state',JSON.stringify(store.getState()));
    yalla.markAsDirty();
});


$export = store;