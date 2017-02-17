/**
 * Created by arif on 2/8/2017.
 */

var icon = $inject('comp/icon');


function $render(element){
    var size = element.size || '32px';
    var label = element.label  || 'label';
    var code = element.code || '';
    var onclick = element.onclick || function(){
            yalla.markAsDirty()
        };
    var hasSeparator = element.hasSeparator;
    var paddingTop = element.paddingTop || '5px';
    var _private = element._private || 'setan';
    
    return ['div',{
        style : yalla.merge({
            textAlign : 'center',
            color : 'white',
            padding : '0',
            margin : '0',
            display : 'inline-block',
            position : 'relative',
            height : '60px'
        },element.style),
        _private : Math.round(Math.random() * 100),
        onclick : onclick
    },[icon,{
        code : code,
        size : size,
        style : {
            position  :'absolute',
            top : paddingTop,
            left : 0,
            right : 0
        }
    },''],['div',{
        style : {
            position : 'absolute',
            left : '0',
            right : '0',
            bottom : '5px',
            fontSize : '12px'
        }
    },label],
        (function(){
            return hasSeparator ? ['div',{
                style : {
                    position : 'absolute',
                    left : '0px',
                    top : '-5px',
                    bottom : '0px',
                    width : '1px',
                    backgroundColor : '#018377'
                }
            },''] : undefined
        })()
        ]
}
