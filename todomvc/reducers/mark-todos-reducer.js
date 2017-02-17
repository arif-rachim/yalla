/**
 * Created by arif on 2/17/2017.
 */

$export = function(state,action){
    var result = [].concat(state);
    switch (action.type){
        case 'MARK_DONE' : {
            result.push(action.todo);
            break;
        }
        case 'MARK_UNDONE' : {
            result.splice(result.indexOf(action.todo),1);
            break;
        }
        case 'DELETE_TODO' :{
            if(result.indexOf(action.todo)>=0){
                result.splice(result.indexOf(action.todo),1);
            }
            break;
        }
    }
    return result;
}