/**
 * Created by arif on 2/17/2017.
 */

var store = $inject('stores/todos-store');
function $render(){
    var numberOfItemsLeft = store.getState().todos.length - store.getState().done.length;
    var filterType = store.getState().filterType;
    return ['div.row',{
        style : {
            paddingTop : '0.5em',
            paddingBottom : '0.5em'
        }
    },
        ['div.col-1',{
            style : {
                color : '#666',
                fontSize : '0.8em',
                overflow:'hidden'
            }
        },['div',{
            style : {
                position : 'relative',
                textAlign : 'right',
                right : '1em'
            }
        },numberOfItemsLeft+' item'+(numberOfItemsLeft>1?'s':'')+' left']],
        ['div.col-5',{
            style : {
                color : '#666',
                fontSize : '0.8em',
                textAlign:'center'
            }
        },['a',{
            style : {
                cursor : 'hand',
                paddingLeft : '1em',
                paddingRight : '1em',
                paddingTop : '0.2em',
                paddingBottom : '0.2em',
                backgroundColor : filterType == 'ALL' ? '#CCC':'none',
                borderRadius : '1em',
                textDecoration : 'none',
                color : '#666'
            },
            href : '#',
            onclick : function(){
                store.dispatch({
                    type : 'FILTER_TODO',
                    filterType : 'ALL'
                });
            }
        },'All'],['a',{
            style : {
                cursor : 'hand',
                paddingLeft : '1em',
                paddingRight : '1em',
                paddingTop : '0.2em',
                paddingBottom : '0.2em',
                backgroundColor : filterType == 'ACTIVE' ? '#CCC':'none',
                borderRadius : '1em',
                textDecoration : 'none',
                color : '#666'

            },
            href : '#',
            onclick : function(){
                store.dispatch({
                    type : 'FILTER_TODO',
                    filterType : 'ACTIVE'
                });
            }
        },'Active'],['a',{
            style : {
                cursor : 'hand',
                paddingLeft : '1em',
                paddingRight : '1em',
                paddingTop : '0.2em',
                paddingBottom : '0.2em',
                backgroundColor : filterType == 'COMPLETED' ? '#CCC':'none',
                borderRadius : '1em',
                textDecoration : 'none',
                color : '#666'
            },
            href : '#',
            onclick : function(){
                store.dispatch({
                    type : 'FILTER_TODO',
                    filterType : 'COMPLETED'
                });
            }
        },'Completed']]
    ]
}