/**
 * Created by gal2729 on 3/7/2017.
 */
function $render(props){
    var store = props.$store(reducer,{valA : 0,valB : 0,valC:0});
    var state = store.getState();
    var valA = state.valA || props.valA;
    var valB = state.valB || props.valB;
    var valC = state.valC;

    return ['div',['input',{type:'text',value:valA,onkeyup:function(e){
        store.dispatch({
            type : 'set',
            name : 'valA',
            value : e.target.value
        });
        store.dispatch({
            type : 'add'
        });
    }}],['input',{type:'text',value:valB,onkeyup:function(e){
        store.dispatch({
            type : 'set',
            name : 'valB',
            value : e.target.value
        });
        store.dispatch({
            type : 'add'
        });
    }}],['button',{value:'add',onclick:function(e){
        store.dispatch({
            type : 'add'
        });
    }},'Add'],['input',{type:'text',value:valC}],[props.$subView]]
}

function reducer(state,action){
    var newState = yalla.clone(state);
    if(action.type == 'add'){
        newState.valC = newState.valA + newState.valB
    }
    if(action.type == 'set'){
        newState[action.name] = action.value
    }
    return newState;
}