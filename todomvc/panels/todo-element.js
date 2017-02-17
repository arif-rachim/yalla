/**
 * Created by arif on 2/16/2017.
 */
var store = $inject('stores/todos-store');
var icon = $inject('panels/icon');

function $render(params){
    var todo = params.todo;
    var checked = store.getState().done.indexOf(todo)>=0;

    return ['div.row',{
        style : {
            position : 'relative',
            paddingTop : '0.8em',
            paddingBottom : '0.8em',
            borderBottom : '1px solid #CCC',
            overflow : 'none',
            color : '#666',
            fontSize : '1.5em'
        }
    },
        ['div.col-1',
        ['div',{
            style : {
                position : 'absolute',
                left : '1.5em',
                top : '50%',
                transform : 'translateY(-50%)'
            }
        },[icon,{
            code : checked ? 'check' :'circle-o',
            style : {
                color : '#888'
            },
            onclick : function(){
                store.dispatch({
                    type : checked ? 'MARK_UNDONE' : 'MARK_DONE',
                    todo : todo
                })
            }
        }]]

        ],
        ['div.col-5',{
            style : {
                wordWrap : 'break-word',
                textDecoration : checked ? 'line-through' : 'none',
                color : checked ? '#CCC' : '#666',
            }
        },todo],
        ['span',{
            style : {
                position : 'absolute',
                right : '1em',
                top : '50%',
                transform : 'translateY(-50%)'
            }
        },[icon,{
            code : 'delete',
            onclick : function(){
                store.dispatch({
                    type :'DELETE_TODO',
                    todo : todo
                });
            },
            style : {
                color : '#888'
            }
        }]]
    ]
}