var yalla = (function () {

    "use strict";
    var yalla = {
        utils: {},
        framework: {},
        log: {},
        components: {}
    };

    var log = yalla.log;

    log.debug = function (message) {
        console.log('%c' + message, 'font-size:0.9em;color:#999999;font-family=verdana');
    };

    log.info = function (message) {
        console.log('%c' + message, 'font-size:1.2em;color:#666666;font-family=verdana');
    };

    log.error = function (message) {
        console.log('%c' + message, 'font-size:1.2em;color:red;font-family=verdana');
    };

    var utils = yalla.utils;

    utils.nonEmptyArray = function (array) {
        return Array.isArray(array) && array.length > 0;
    };

    utils.firstItemInArray = function (array) {
        if (utils.nonEmptyArray(array)) {
            return array[0];
        }
        return false;
    };

    utils.argumentsToArray = function (array) {
        var result = [];
        for (var arg = 0; arg < array.length; ++arg) {
            var item = array[arg];
            result.push(item);
        }
        return result;
    };

    utils.assertNotNull = function () {
        for (var i = 0; i < arguments.length; i++) {
            if (arguments[i] == null || arguments[i] == undefined) {
                return false;
            }
        }
        return true;
    };

    utils.fetch = function (url, postData) {

        var XMLHttpFactories = [
            function () {
                return new XMLHttpRequest()
            },
            function () {
                return new ActiveXObject("Msxml2.XMLHTTP")
            },
            function () {
                return new ActiveXObject("Msxml3.XMLHTTP")
            },
            function () {
                return new ActiveXObject("Microsoft.XMLHTTP")
            }
        ];

        function createXMLHTTPObject() {
            var xmlhttp = false;
            for (var i = 0; i < XMLHttpFactories.length; i++) {
                try {
                    xmlhttp = XMLHttpFactories[i]();
                }
                catch (e) {
                    continue;
                }
                break;
            }
            return xmlhttp;
        }

        return new Promise(function (resolve, reject) {
            var req = createXMLHTTPObject();
            if (!req) return;
            var method = (postData) ? "POST" : "GET";
            req.open(method, url, true);
            if (postData) {
                req.setRequestHeader('Content-type', 'application/json');
            }
            req.onreadystatechange = function () {
                if (req.readyState != 4) return;
                if (req.status != 200 && req.status != 304) {
                    reject(req);
                    return;
                }
                resolve(req);
            };
            if (req.readyState == 4) {
                return;
            }
            req.send(JSON.stringify(postData));
        });
    };

    var framework = yalla.framework;
    framework.filePrefix = '.js';
    framework.base = 'src';
    framework.componentLoadListener = {};
    framework.createInjector = function (componentPath) {
        var relativePath = componentPath.substring(0, componentPath.lastIndexOf("/"));

        function Injector(inject) {
            var path = relativePath + "/" + inject;
            if (inject.charAt(0) == '/') {
                path = framework.composePathFromBase(inject)
            }
            return yalla.components[path];
        }

        return Injector;
    };

    framework.addComponent = function (name, component) {
        yalla.components[name] = component;
        var path = name + framework.filePrefix;
        if(path in framework.componentLoadListener){
            framework.componentLoadListener[path].call();
        }
    };

    framework.attachScriptToDocument = function (url) {
        return new Promise(function (resolve) {
            var s = document.createElement('script');
            s.setAttribute("src", '.'+url);
            document.head.appendChild(s);
            framework.componentLoadListener[url] = function () {
                resolve(url);
                delete framework.componentLoadListener[url];
            };
        });
    };

    framework.composePathFromBase = function (component) {
        var fromRoot = (component.charAt(0) == '/');
        return "/" + framework.base + (fromRoot ? '' : '/') + component;
    };

    framework.loadScriptAndDependency = function (component) {
        var componentPath = framework.composePathFromBase(component);
        if (componentPath in yalla.components) {
            return Promise.resolve(true);
        }
        var url = componentPath + framework.filePrefix;
        var relativePath = component.substring(0, component.lastIndexOf("/") + 1);
        return new Promise(function (resolve) {
            utils.fetch('.'+url).then(function (req) {
                var injects = (req.responseText.match(/\$inject\(.*?\)/g) || []).map(function (inject) {
                    return inject.substring('$inject("'.length, inject.length - 2);
                });

                if (utils.nonEmptyArray(injects)) {
                    var injectsPromise = injects.map(function (inject) {
                        if (inject.charAt(0) != '/') {
                            inject = "/" + relativePath + inject;
                        }
                        return framework.loadScriptAndDependency(inject);
                    });
                    Promise.all(injectsPromise).then(function () {
                        framework.attachScriptToDocument(url).then(function () {
                            resolve(url);
                        });
                    });
                } else {
                    framework.attachScriptToDocument(url).then(function () {
                        resolve(url);
                    });
                }
            }, function () {
                log.error('Unable to fetch ' + url);
            });
        });
    };

    framework.renderChain = function (address) {
        return address.reduceRight(function (current, path) {
            return current.then(function () {
                return new Promise(function (resolve) {
                    framework.loadScriptAndDependency(path).then(function () {
                        resolve(true);
                    });
                });
            });
        }, Promise.resolve(false));
    };


    framework.start = function () {
        var scripts = document.querySelector("script[yalla-component]") || [];
        if (!utils.assertNotNull(scripts.attributes['yalla-component'],scripts.attributes['yalla-base'], scripts.attributes['yalla-domtarget'])) {
            throw new Error("script tag should contain attributes 'yalla-component', 'yalla-base' and 'yalla-domtarget'");
        }
        var component = scripts.attributes['yalla-component'].nodeValue;
        var base = scripts.attributes['yalla-base'].nodeValue;
        var domTarget = scripts.attributes['yalla-domtarget'].nodeValue;

        framework.base = base;
        framework.domTarget = domTarget;
        framework.defaultComponent = component;
        framework.renderToScreen();
    };

    function patchGlobal(){
        var address = [framework.defaultComponent];
        if (window.location.hash != "") {
            address = window.location.hash.substring(1, window.location.hash.length).split("/");
        }
        var componentAndParams = address.map(function (pathQuery) {
            var valParams = pathQuery.split(':');
            var path = valParams[0].replace(/\./g, '/');
            valParams.splice(0, 1);
            var params = valParams.reduce(function (current, param) {
                var parVal = param.split('=');
                current[parVal[0]] = parVal[1];
                return current;
            }, {});
            return {
                componentPath: path,
                params: params
            }
        });
        var addressToChain = componentAndParams.map(function (item) {
            return item.componentPath;
        });

        framework.renderChain(addressToChain).then(function () {
            var render = componentAndParams.reduceRight(function (slotView, compAndParam) {
                var component = compAndParam;
                var path = framework.composePathFromBase(component.componentPath);
                var comp = yalla.components[path];
                return function (slotName) {
                    if(undefined == slotName || slotName == 'default'){
                        comp.render(component.params, slotView);
                    }
                }
            }, function () {
            });
            IncrementalDOM.patch(document.querySelector(framework.domTarget), function () {
                render();
            });
        }).catch(function (err) {
            log.error(err.stack);
        });
    }

    framework.renderToScreen = function () {
        if(arguments.length == 2){
            IncrementalDOM.patch(arguments[0],arguments[1]);
        }else{
            patchGlobal();
        }
    };


    var attributes = IncrementalDOM.attributes;
    attributes['checked'] = function(element, name, value) {
        if(value){
            element.setAttribute('checked',true);
        }else{
            element.removeAttribute('checked');
        }
    };

    IncrementalDOM.notifications.nodesCreated = function(nodes){
        nodes.forEach(function(node){
            if(node.oncreated){
                node.oncreated.call(node,node)
            }
        });
    };

    IncrementalDOM.notifications.nodesDeleted = function(nodes){
        nodes.forEach(function(node){
            if(node.ondeleted){
                node.ondeleted.call(node,node);
            }
        });
    };

    return yalla;
})();



window.onload = function () {
    yalla.framework.start();
};

if ("onhashchange" in window) {
    window.onhashchange = function () {
        yalla.framework.renderToScreen();
    }
} else {
    alert('Browser not supported');
}