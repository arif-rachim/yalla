/**
 * Created by arif on 2/11/2017.
 */
function $render(params){
    var dataProvider = params.dataProvider;
    var dataRenderer = params.dataRenderer;
    var style = params.style || {};

    return ['div',style].concat(dataProvider.map(function(data){
        return dataRenderer(data);
    }))
}