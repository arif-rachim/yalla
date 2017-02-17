/**
 * Created by arif on 2/5/2017.
 */
var flex = $inject('comp/layout/flex');
var flexItem = $inject('comp/layout/flex-item');
var icon = $inject('comp/icon');
/**
 * Code to check for the geolocation
 */
(function(){
    var supportGeoLocation = "geolocation" in navigator;

    if(supportGeoLocation){
        var geocoder = new google.maps.Geocoder();
        function codeLatLng(lat, lng) {
            return new Promise(function(resolve,reject){
                var latlng = new google.maps.LatLng(lat, lng);
                geocoder.geocode({'latLng': latlng}, function(results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        console.log(results);
                        if(results[0]){
                            resolve(results[0].address_components[0].long_name);
                        }
                    } else {
                        resolve("Geocoder failed " + status);
                    }
                });
            });
        }
        navigator.geolocation.getCurrentPosition(function(position){
            codeLatLng(position.coords.latitude,position.coords.longitude).then(function(address){
                localStorage.setItem('user.location',address);
                yalla.markAsDirty();
            });
            localStorage.setItem('user.coordinate',{lat:position.coords.latitude,long:position.coords.longitude});
        });
    }

})();

function $render(){
    var location = localStorage.getItem('user.location');

    return [flex,{col:true},
        [flexItem,'Your Location'],
        [flexItem,{style:{'font-size':'1.5em'}},location,' ',[icon, {
            size: '1em',
            code: 'chevron-down'
        }]],

    ]
}