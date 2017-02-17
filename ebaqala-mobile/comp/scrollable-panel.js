/**
 * Created by arif on 2/11/2017.
 */

function onScroll(e) {

    var params = yalla.getElementAttribute(this);
    var scrollPos = e.target.scrollTop;
    var _lastScrollPos = params._lastScrollPos || 0;
    var scrollMovement = 'none';
    if (_lastScrollPos > scrollPos) {
        scrollMovement = 'up';
    } else {
        scrollMovement = 'down';
    }
    params._lastScrollPos = scrollPos;
    if(params._scrollMovement != scrollMovement){
        params._scrollMovement = scrollMovement;
        if(params.onScroll && typeof params.onScroll === 'function'){
            params.onScroll({
                movement : scrollMovement,
                isDown : scrollMovement == 'down'
            });
        }
    }
}

function $render(params){
    var content = params.content;
    return ['div',{
        style : {
            position : 'absolute',
            top : '0',
            left : 0,
            right : 0,
            bottom : 0,
            overflow : 'auto',
            textAlign : 'center',
            backgroundColor : '#EEEEEE'
        },
        onscroll : onScroll.bind(params),
        onScroll : params.onScroll
    },['div',{style : {
        height : '70px'
    }},''],content]
}