/**
 * Created by arif on 2/16/2017.
 */
$export = function(initialTodos,action){
    var todos = [].concat(initialTodos);
    switch (action.type){
        case 'ADD_TODO' :{
            todos.push(action.todo);
            break;
        }
        case 'DELETE_TODO' :{
            todos.splice(todos.indexOf(action.todo),1);
            break;
        }
    }
    return todos;
}