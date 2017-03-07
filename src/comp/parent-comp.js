/**
 * Created by developer on 3/7/2017.
 */
var comA = $inject('comp/com-a');
function $render(props){
    return ['div','COMPONENT !!!',[comA],[comA],[props.$subView]]
}