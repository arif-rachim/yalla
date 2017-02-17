/**
 * Created by arif on 2/16/2017.
 */
var store = $inject('stores/todos-store');

function filteredTodos(){
    return store.getState().todos.filter(function(todo){
        var isDone = store.getState().done.indexOf(todo)>=0;
        debugger;
        if(store.getState().filterType == 'ACTIVE'){
            return !isDone;
        }
        if(store.getState().filterType == 'COMPLETED'){
            return isDone;
        }
        return true;
    });
}

function $render() {
    var todos = filteredTodos();
    return ['div', {
        style: {
            backgroundColor: "#FFF",
            width: '100%',
            position: 'absolute',
            top: '100px',
            maxWidth : '600px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: 0,
            margin: 0,
            boxShadow: ' 0px 10px 22px 2px rgba(0,0,0,0.3)'
        }
    },
        ['div.grid-container',
            ['div.row',{
                style : {
                    borderBottom : '1px solid #CCCCCC',
                    boxShadow : ' inset 0px -45px 50px -25px rgba(107,107,107,0.1)'
                }
            },
                ['div.col-1', ''],
                ['div.col-5', {
                    style: {
                        position: 'relative'
                    }
                }, ['input', {
                    type: 'text',
                    style: {
                        position: 'relative',
                        left: 0,
                        width: '100%',
                        paddingTop :'0.7em',
                        paddingBottom:'0.5em',
                        fontSize:'1.5em',
                        border:'none',
                        background : 'none',
                        color : '#666'
                    },
                    placeHolder : 'What needs to be done ?',
                    onkeypress:function(e){
                        if(e.charCode === 13){
                            store.dispatch({
                                type : 'ADD_TODO',
                                todo : e.target.value
                            });
                            e.target.value = '';
                        }
                    }
                }]
                ]
            ]
        ].concat(todos.map(todoRenderer)).concat(includeFooter()).concat(includeBrandFooter())
    ];
}

var todoElement = $inject('panels/todo-element');
function todoRenderer(todo){
    return [todoElement,{
        todo : todo
    }]
};

var footerElement = $inject('panels/footer-element');
function includeFooter() {
    if(store.getState().todos.length > 0){
        return [[footerElement]];
    }
    return [];
}

var brandFooter = $inject('panels/brand-footer');
function includeBrandFooter(){
    return [[brandFooter,{
        style : {
            position : 'absolute',
            textAlign : 'center',
            left : '50%',
            bottom : '-5em',
            transform : 'translateX(-50%)',
            fontSize : '0.8em',
            color : '#888'
        }
    }]];
}
