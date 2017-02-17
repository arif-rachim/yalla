/**
 * Created by arif on 2/15/2017.
 */
var leftNavigation = $inject('shell/left-navigation');
var mainPage = $inject('shell/main-page');
function $render(){
    return ['div',{
        style : {
            position : 'absolute',
            left : '0',
            right : '0',
            top : '0',
            bottom : '0'
        }
    },[mainPage],
    [leftNavigation]];
}