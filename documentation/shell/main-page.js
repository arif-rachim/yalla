/**
 * Created by arif on 2/15/2017.
 */
var icon = $inject('comp/icon');
var titleBar = $inject('shell/title-bar');
function $render(params) {
    return ['div',{
        style : {
            position : 'absolute',
            top : 0,
            left : 0,
            right : 0,
            bottom :0
        }
    },[titleBar,[icon,{size:'1.5em'}]],'Hello']
}