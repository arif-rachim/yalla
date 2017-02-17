/**
 * Created by arif on 2/5/2017.
 */

var flex = $inject('comp/layout/flex');
var flexItem = $inject('comp/layout/flex-item');

function updateMap(){

    if(document.getElementById('map')){
        var map = new google.maps.Map(document.getElementById('map'), {
            zoom: 18
        });
        var infoWindow = new google.maps.InfoWindow({map: map});
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                var pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                infoWindow.setPosition(pos);
                infoWindow.setContent('Your location');
                map.setCenter(pos);
            }, function() {
                alert('Browser does not support GEOLOCATION');
            });
        } else {
            alert('Browser does not support GEOLOCATION');
        }
    }
}

(function(){
    function onNodesCreated(nodes) {
        if(nodes.filter(function(node){
            return (node.id == 'map');
        }).length > 0){
            updateMap();
        }
    }
    yalla.addEventListener('nodesCreated',onNodesCreated);
})();


function $render(){
    setTimeout(updateMap,0);
    return [flex,{col:true,height : '50em'},
        [flexItem,{stretch:'true',id:'map',style : {'background-color':'blue'}}]]
}