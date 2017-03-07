/**
 * Created by gal2729 on 3/7/2017.
 */

var compA = $inject('comp/com-a');
function $render(){
    return ['div','hello world',[compA]];
}