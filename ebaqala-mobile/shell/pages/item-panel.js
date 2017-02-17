/**
 * Created by arif on 2/12/2017.
 */
function $render(){
    return ['div',
        {
            style : {
                padding : '1em'
            }
        },
        ['div',{
            style : {
                display : 'inline-block',
                padding : 0,
                margin : 0,
                background : '#FFF',
                "-webkit-box-shadow": "0px 0px 15px 1px rgba(0,0,0,0.5)",
                "-moz-box-shadow": "0px 0px 15px 1px rgba(0,0,0,0.5)",
                "box-shadow": "0px 0px 15px 1px rgba(0,0,0,0.5)",
                fontSize : 0
            }
        },['img',{
            src : 'http://lorempixel.com/300/300/food?_uid='+Math.round(Math.random()*100000)
        }]]

    ]
}