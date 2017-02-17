/**
 * Created by arif on 2/15/2017.
 */

var titleBar = $inject('shell/title-bar');

var titleBarOpen = yalla.config.device != 'MOBILE';

yalla.addEventListener('onResize',function(){
    titleBarOpen = yalla.config.device != 'MOBILE';
})

function calculateTransformPosition() {
    if(titleBarOpen){
        return 'translateX(0)'
    }
    return 'translateX(-110%)'
}

function onButtonClicked(){
    titleBarOpen = !titleBarOpen;
    yalla.markAsDirty();
}

function $render(){
    return ['div',{
        style : {
            position : 'absolute',
            top : 0,
            left : 0,
            bottom : 0,
            backgroundColor : 'blue',
            transform : calculateTransformPosition(),
            transition : 'transform 0.5s ease'
        }
    },[titleBar,{},['div',{
        style : {
            fontSize : '1.5em',
            paddingRight : '8em'
        }
    },'HavanaJS']]];
}