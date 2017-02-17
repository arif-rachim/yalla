var icon = $inject('comp/icon')
function $render(){
    return ['div',{
        style : {
            backgroundColor : 'black',
            backgroundImage : 'url("https://t4.ftcdn.net/jpg/01/12/45/35/240_F_112453582_hH3MQCB0hXyAPGmYBYmxCTBydAgCIwqp.jpg")',
            backgroundSize : 'cover',
            color : 'white',
            padding : '1em'
        }
    },
        [icon,{code:'account-circle',size:'4em'}],['div',{
            style : {
                paddingTop : '1em'
            }
        },'Arif Rachim'],['div',{
            style : {
                fontSize: '0.8em'
            }
        },'a.arif.r@gmail.com']
    ]
}