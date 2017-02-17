
/**
 * Created by arif on 2/15/2017.
 */

function $render(params){
    return ['div',{
        style : {
            position : 'relative',
            left : 0,
            right : 0,
            top : 0,
            backgroundColor : "aqua",
            padding : '1em'
        }
    }
    ].concat(params.$children);
}