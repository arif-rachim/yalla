/**
 * Created by arif on 2/1/2017.
 */

function $render (params) {
    var code = params.code || 'bookmark-outline';
    var size = params.size || '1em';
    var style = {
        "font-size": size
    };
    yalla.merge(style, params.style || {});
    return ['id.zmdi.zmdi-' + code, {
        style: style,
        onclick : params.onclick
    }, '']
}
