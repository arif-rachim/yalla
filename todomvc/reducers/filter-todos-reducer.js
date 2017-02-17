/**
 * Created by arif on 2/17/2017.
 */

$export = function(state,action){
    switch (action.type){
        case 'FILTER_TODO' :{
            return action.filterType;
            break;
        }
    }
    return state;
}