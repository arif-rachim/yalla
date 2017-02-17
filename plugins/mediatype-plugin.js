/**
 * Created by arif on 2/15/2017.
 */

// SETUP ENVIRONMENT
yalla.config = yalla.config || {};
(function(){

    // detect the window resize
    function calculateMediaType() {
        var config = yalla.config;
        if(window.innerWidth < 480){
            config.device = 'MOBILE';
        }else if(window.innerWidth < 768){
            config.device = 'TABLET';
        }else if(window.innerWidth < 992){
            config.device = 'DESKTOP';
        }else {
            config.device = 'FULL'
        }
        config.width = window.innerWidth;
        config.height = window.innerHeight;
    }

    calculateMediaType();

    if ("onresize" in window) {
        window.onresize = function () {
            calculateMediaType();
            yalla.dispatchEvent('onResize');
            yalla.markAsDirty();
        }
    }

})();
