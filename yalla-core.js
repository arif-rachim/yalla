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
        showErrorInBrowser(message);
    };

    function showErrorInBrowser(message){
        var errorDiv = document.createElement('div');
        errorDiv.style = 'background:#000;color: red;padding:10px;position:fixed;bottom:0px;right:0px;left:0px;z-index:10000;';
        var deleteButton = document.createElement('button');
        deleteButton.innerText = 'OK';
        deleteButton.style = 'float:right;background-color: #4CAF50; /* Green */ border: none; padding:5px; color: white; text-align: center; text-decoration: none; display: inline-block; font-size: 12px;';
        deleteButton.onclick = function(event){
            event.target.parentNode.remove();
        };
        var messageDiv = document.createElement('div');
        messageDiv.innerText = message;
        messageDiv.style = 'font-size:20px';
        errorDiv.appendChild(deleteButton);
        errorDiv.appendChild(messageDiv);
        document.body.appendChild(errorDiv);
    }

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

    utils.merge = function(objectOne,objectTwo){
        var result = {};
        for(var prop in objectOne){
            if(objectOne.hasOwnProperty(prop)){
                result[prop] = objectOne[prop];
            }
        }
        for(var prop in objectTwo){
            if(objectTwo.hasOwnProperty(prop)){
                result[prop] = objectTwo[prop];
            }
        }
        return result;
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
            req.timeout = 2000;
            if (!req) return;
            var method = (postData) ? "POST" : "GET";
            req.open(method, url, true);
            if (postData) {
                req.setRequestHeader('Content-type', 'application/json');
            }
            req.ontimeout = function (e) {
                reject(req);
            };
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
        if (path in framework.componentLoadListener) {
            framework.componentLoadListener[path].call();
        }
    };

    framework.attachScriptToDocument = function (url) {
        var componentPath = url.substring(0, url.length - ".js".length);
        if (componentPath in yalla.components) {
            return Promise.resolve(true);
        }
        if (url in framework.componentLoadListener) {
            return Promise.resolve(true);
        }
        return new Promise(function (resolve) {
            var s = document.createElement('script');
            s.setAttribute("src", '.' + url);
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
        if(component.indexOf('.')>0){
            log.error('Invalid dependency : '+component);
            return Promise.reject();
        }
        var componentPath = framework.composePathFromBase(component);
        if (componentPath in yalla.components) {
            return Promise.resolve(true);
        }
        var url = componentPath + framework.filePrefix;

        var relativePath = component.substring(0, component.lastIndexOf("/") + 1);
        return new Promise(function (resolve) {
            utils.fetch('.' + url).then(function (req) {
                var injects = (req.responseText.match(/\$inject\(.*?\)/g) || []).map(function (inject) {
                    return inject.substring('$inject("'.length, inject.length - 2);
                });

                if (utils.nonEmptyArray(injects)) {
                    var injectsPromise = injects.map(function (inject) {
                        if (inject.charAt(0) != '/') {
                            inject = "/" + inject;
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

    framework.getParentComponent = function(node){
        var _node = node;
        do{
            if('element' in _node.attributes || _node.nodeName == 'BODY'){
                return _node;
            }
            _node = _node.parentNode;
        }while(_node);
        return null;
    };

    framework.validComponentName = function(component,componentName){
        return component._state && component._state._name == componentName;
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

    framework.propertyCheckChanges = function(oldProperties, newProperties, onPropertyChange){
        if(oldProperties == null || newProperties == null || onPropertyChange == null){
            return;
        }
        var result = {};
        var comparedProps = [];
        for (var prop in oldProperties) {
            comparedProps.push(prop);
            if(oldProperties.hasOwnProperty(prop)){
                if(typeof oldProperties[prop] == 'function'){
                    continue;
                }
                if(newProperties.hasOwnProperty(prop)){
                    result[prop] = {
                        leftValue : oldProperties[prop],
                        rightValue : newProperties[prop]
                    }
                }else{
                    result[prop] = {
                        leftValue : oldProperties[prop],
                        rightValue : null
                    }
                }

            }
        }
        for (var prop in newProperties){
            if(newProperties.hasOwnProperty(prop) && comparedProps.indexOf(prop) < 0){
                if(typeof newProperties[prop] == 'function'){
                    continue;
                }
                result[prop] = {
                    leftValue : null,
                    rightValue : newProperties[prop]
                }
            }
        }
        for (var prop in result){
            if(result[prop].leftValue !== result[prop].rightValue){
                var operation = '';
                if(result[prop].leftValue == null){
                    operation = 'add';
                }else if(result[prop].rightValue == null){
                    operation = 'remove';
                }else{
                    operation = 'change';
                }
                onPropertyChange({property:prop,type:operation,oldVal:result[prop].leftValue,newVal:result[prop].rightValue});
            }
        }
    };


    framework.start = function () {
        var scripts = document.querySelector("script[src$='yalla.js']") || [];
        if (!utils.assertNotNull(scripts.attributes['yalla-component'], scripts.attributes['yalla-base'], scripts.attributes['yalla-domtarget'])) {
            throw new Error("script tag should contain attributes 'yalla-component', 'yalla-base' and 'yalla-domtarget'");
        }
        var component = scripts.attributes['yalla-component'].nodeValue;
        var base = scripts.attributes['yalla-base'].nodeValue;
        var domTarget = scripts.attributes['yalla-domtarget'].nodeValue;
        var routingCallback = scripts.attributes['yalla-routing'] ? scripts.attributes['yalla-routing'].nodeValue : false;

        framework.base = base;
        framework.domTarget = domTarget;
        framework.defaultComponent = component;
        framework.beforeRenderToScreen = function(){
            return new Promise(function (resolve){
                if(routingCallback && typeof window[routingCallback] == 'function'){
                    var path = window.location.hash;
                    window[routingCallback](path).then(function(newPath){
                        if(newPath && newPath != path){
                            resolve(false);
                            log.info('Re-routing path to new location');
                            window.location.hash = newPath;
                        }else{
                            resolve(true);
                        }
                    });
                }else{
                    resolve(true);
                }
            });
        };
        framework.renderToScreen();
    };

    function patchGlobal() {
        var address = [framework.defaultComponent];
        var addressString = '';
        var googleEscapedFragment = '?_escaped_fragment_=';
        if (window.location.hash != "") {
            addressString = window.location.hash.substring(1, window.location.hash.length);
        }else if(window.location.search.indexOf(googleEscapedFragment) == 0){
            addressString = decodeURIComponent(window.location.search.substring(googleEscapedFragment.length,window.location.search.length));
        }
        if(addressString && addressString.length > 0){
            address = addressString.split("/").map(function(addr){
                if(addr && addr.indexOf('!') == 0 && addr.length > 1){
                    addr = addr.substring(1,addr.length);
                }
                return addr;
            }).filter(function(addr){
                if(addr && addr.length > 0 && addr.indexOf('!') < 0){
                    return true;
                }
                return false;
            });
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
                    if (comp && (undefined == slotName || slotName == 'default')) {
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
        var args = arguments;
        framework.beforeRenderToScreen().then(function (ok) {
            if(!ok){
                return;
            }
            if (args.length == 2) {
                IncrementalDOM.patch(args[0], args[1]);
            } else {
                patchGlobal();
            }
        });
    };

    framework.beforeRenderToScreen = function () {
        return Promise.resolve(true);
    };


    var attributes = IncrementalDOM.attributes;
    // html5 boolean attributes
    /*
     checked             (input type=checkbox/radio)
     selected            (option)
     disabled            (input, textarea, button, select, option, optgroup)
     readonly            (input type=text/password, textarea)
     multiple            (select)
     ismap     isMap     (img, input type=image)

     defer               (script)
     declare             (object; never used)
     noresize  noResize  (frame)
     nowrap    noWrap    (td, th; deprecated)
     noshade   noShade   (hr; deprecated)
     compact             (ul, ol, dl, menu, dir; deprecated)
     */
    ['checked','selected','disabled','readonly','required','multiple','ismap'].forEach(function(key){
        attributes[key] = function (element, name, value) {
            if (value) {
                element.setAttribute(key, true);
            } else {
                element.removeAttribute(key);
            }
        };
    });

    // BUG Fix for the attributes.value not updating in IncrementalDOM
    attributes.value = function(element,name,value){
        element.value = value;
    };


    IncrementalDOM.notifications.nodesCreated = function (nodes) {
        nodes.forEach(function (node) {
            if (node.oncreated) {
                node.oncreated.call(node, {target:node,currentTarget:node});
            }
        });
    };

    IncrementalDOM.notifications.nodesDeleted = function (nodes) {
        nodes.forEach(function (node) {
            if (node.ondeleted) {
                node.ondeleted.call(node, {target:node,currentTarget:node});
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