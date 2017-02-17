/**
 * Created by arif on 2/11/2017.
 */


function $render(params) {
    var show = params.show;
    var length = params.length || '100px';
    // position can be used for top, left, right, bottom
    var position = params.position || 'top';

    var style = {
        position: 'absolute',
        opacity: 1,
        transition: 'transform 0.5s ease'
    };

    if(position === 'top'){
        style.top = 0;
        style.left = 0;
        style.right = 0;
        style.height = length;
        if(show){
            style.transform = 'translatey(0)';
        }else{
            style.transform = 'translatey(-'+length+')';
        }
    }

    if(position === 'bottom'){
        style.bottom = 0;
        style.left = 0;
        style.right = 0;
        style.height = length;
        if(show){
            style.transform = 'translatey(0)';
        }else{
            style.transform = 'translatey('+length+')';
        }
    }

    if(position === 'left'){
        style.left = 0;
        style.top = 0;
        style.bottom = 0;
        style.width = length;
        if(show){
            style.transform = 'translatex(0)';
        }else{
            style.transform = 'translatex(-'+length+')';
        }
    }


    if(position === 'right'){
        style.right = 0;
        style.top = 0;
        style.bottom = 0;
        style.width = length;
        if(show){
            style.transform = 'translatex(0)';
        }else{
            style.transform = 'translatex('+length+')';
        }
    }

    return ['div', {
        style: yalla.merge(params.style,style)
    }, ].concat(params.$children);
}