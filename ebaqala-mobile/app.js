/**
 * Created by arif on 2/11/2017.
 */
var slidePanel = $inject('comp/slide-panel');
var icon = $inject('comp/icon');
var footer = $inject('shell/footer');
var page = $inject('shell/pages/page');
var profileMenu = $inject('shell/menu/profile-menu');
var navigationMenu = $inject('shell/menu/navigation-menu');

function onMenuClicked(){
    var params = yalla.getElementAttribute(this);
    params._displayNavigation = true;
    yalla.markAsDirty();
}

function onBackgroundDisplayClicked(){
    var params = yalla.getElementAttribute(this);
    params._displayNavigation = false;
    yalla.markAsDirty();
}

function onscroll(e){
    var params = yalla.getElementAttribute(this);
    params._scrollMovement = e.movement;
    yalla.markAsDirty();
}

function $render(params) {

    var displayHeader = (function () {
        var pars = yalla.getElementAttribute(params);
        return pars._scrollMovement != 'down'
    })();


    return ['div', {
        style: {
            height: '100%',
            overflow: 'hidden',
            position: 'relative'
        }
    },
        ['div', {
            style: {
                height: '100%',
                backgroundColor: 'white',
                overflow: 'auto'
            },
        }, [page,{
            id : 'page:main-page',
            onscroll : onscroll.bind(params)
        }],
            [slidePanel, {
                position: 'top', length: '4em', show: displayHeader, style: {
                    backgroundColor: '#009688',
                    color : 'white',
                    boxShadow : '0px 1px 5px #888888'
                }
            }, ['div',{
                style : {
                    paddingLeft : '1.2em',
                    paddingRight : '1.2em',
                    paddingTop : '1em',
                    position : 'relative'
                }
            },
                ['div',{
                    style : {
                        display : 'inline-block'
                    }
                },[icon,{
                    size : '2em',
                    code : 'menu',
                    onclick : onMenuClicked.bind(params)
                }]],
                ['div',{
                    style : {
                        position : 'absolute',
                        left : '5em',
                        right : '3em',
                        bottom  : '0.2em'
                    }
                },['input',{type : 'text',style : {
                    width : '100%',
                    border :'none',
                    padding : '0.2em',
                    paddingLeft : '0.5em',
                    background : 'none',
                    borderBottom : '1px solid white',
                    color : 'white',
                    fontSize : '1.2em'
                }}]]



/*

                [icon,{
                size : '2em',
                code : 'menu',
                onclick : onMenuClicked.bind(params)
            }],
                ['input',{type : 'text',style : {
                    position : 'absolute',
                    left : '20px',
                    right : 0,
                }}]*/
            ]],
            [slidePanel, {
                position: 'bottom', length: '4em', show: displayHeader, style: {
                    backgroundColor: '#009688',
                    color : 'white'
                }
            }, [footer]],

            ['div',{
                style : {
                    position : 'absolute',
                    top : 0,
                    left : 0,
                    right : 0,
                    bottom : 0,
                    backgroundColor : 'black',
                    opacity : 0.3,
                    display : params._displayNavigation ? 'block' : 'none'
                },
                onclick : onBackgroundDisplayClicked.bind(params)
            },''],
            [slidePanel, {
                position: 'left', length: '18em', show: params._displayNavigation, style: {
                    backgroundColor: 'white'
                }
            }, [profileMenu],[navigationMenu]]

        ]

    ];

}