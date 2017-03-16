/**
 * Created by developer on 3/15/2017.
 */

var store = yalla.createStore(function(prevState,action){
    var state = yalla.clone(prevState);
    if(action.type == 'set'){
        state.label = action.label;
    }
    return state;
},{
    label : '',
    items : ['one','two','three']
});

store.setLabel = function(e){
    store.dispatch({
        type : 'set',
        label : e.target.value
    });
};

store.subscribe(function(){
    yalla.markAsDirty();
});

store.onClicked = function(){
    alert('shit');
}

$export = store;