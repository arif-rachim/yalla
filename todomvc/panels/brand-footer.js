/**
 * Created by arif on 2/17/2017.
 */
function $render(params){
    var style = yalla.merge({},params.style);
    return ['div',{
        style : style
    },['div','Created by Arif Rachim (2017)'],['div',{
        style : {
            paddingTop : '0.5em'
        }
    },'Powered by yalla.js']]
}