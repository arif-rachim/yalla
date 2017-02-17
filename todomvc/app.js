/**
 * Created by arif on 2/16/2017.
 */

var inputPanel = $inject('panels/input-panel');
var brand = $inject('panels/brand');
function $render(){
    return ['div',{
        style : {
            position : 'absolute',
            left : 0,
            right : 0,
            top : 0,
            bottom : 0,
            backgroundColor : '#DDD'
        }
    },[inputPanel],[brand]]
}