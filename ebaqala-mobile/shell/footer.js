var button = $inject('shell/footer/button');

function $render(params){
    return ['div',
        {
            style : yalla.merge({
                textAlign:'center'
            },params.style)
        },
        [button,{
            id : 'footer:button1',
            code : 'home',
            label : 'Home',
            style : {
                width : '33%',
                paddingBottom : '0em',
                marginTop : '0.3em'
            }
        }],
        [button,{
            code : 'local-grocery-store',
            label : 'Item',
            hasSeparator : true,
            style : {
                width : '33%',
                paddingBottom : '0em',
                marginTop : '0.3em'
            }
        }],
        [button,{
            code : 'local-store',
            label : 'Baqala',
            hasSeparator : true,
            style : {
                width : '33%',
                paddingBottom : '0em',
                marginTop : '0.3em'
            }
        }]
    ]
}
