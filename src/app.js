/**
 * Created by developer on 3/15/2017.
 */
var data = $inject('@comp/my-button');
var dataTwo = $inject('@comp/my-button-two');

function $render($props){
    debugger;
    return ['hello','world'].concat($props.$children);
}