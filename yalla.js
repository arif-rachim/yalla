/*
 UI Framework Callback
 $render : callback function
 $render : function(
 {
 $subView : // for placing subView element,
 $children : // for placing children as An Element
 $store(reducer,initialState,middleware) : // mechanism to create componentStore
 }
 )
 */

var yalla = (function () {
    "use strict";
    var mixin = function (destObject, sourceClass) {
        var props = Object.keys(sourceClass.prototype);
        for (var i = 0; i < props.length; i++) {
            if (typeof destObject === 'function') {
                destObject.prototype[props[i]] = sourceClass.prototype[props[i]];
            } else {
                if (!(props[i] in destObject)) {
                    destObject[props[i]] = sourceClass.prototype[props[i]];
                }
            }
        }
        return destObject;
    };

    var merge = function (obj, outAttributes) {
        for (var property in outAttributes) {
            if (outAttributes.hasOwnProperty(property)) {
                if (obj[property] !== outAttributes[property]) {
                    obj[property] = outAttributes[property];
                }
            }
        }
        return obj;
    };

    var clone = function (obj) {
        var copy;
        if (null == obj || "object" != typeof obj) return obj;
        if (obj instanceof Date) {
            copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }
        if (obj instanceof Array) {
            copy = [];
            for (var i = 0, len = obj.length; i < len; i++) {
                copy[i] = clone(obj[i]);
            }
            return copy;
        }
        if (obj instanceof Object) {
            copy = {};
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
            }
            return copy;
        }
        throw new Error("Unable to copy obj! Its type isn't supported.");
    };

    var yalla = {};

    yalla.mixin = mixin;
    yalla.merge = merge;
    yalla.clone = clone;
    yalla.baselib = "libs";
    yalla.globalContext = {};

    var DATA_PROP = '$domData';

    yalla.loader = (function (context) {
        context._promisesToResolve = {};

        var loadScript = function (uri) {
            var path = uri;
            if (path.indexOf('@') == 0) {
                path = path.substr(1, path.length) + '.html';
            } else {
                path = path + '.js';
            }

            function pullOutChildren(element) {
                var result = [];
                if (!element.children) {
                    return result;
                }
                for (var i = 0; i < element.children.length; i++) {
                    var attributes = element.children[i].attributes;
                    for (var j = 0; j < attributes.length; j++) {
                        var attribute = attributes[j];
                        if (attribute.name == 'value') {
                            result.push(attribute.value);
                        }
                    }
                    result = result.concat(pullOutChildren(element.children[i]));
                }
                return result;
            }

            function lookDependency(responseText) {
                var dependenciesRaw = responseText.match(/\$inject\(.*?\)/g) || [];
                var dependency = dependenciesRaw.map(function (dep) {
                    return dep.substring('$inject("'.length, dep.length - 2);
                });
                dependenciesRaw = responseText.match(/<injec.*?>/g) || [];
                var doc = document.createElement('div');
                doc.innerHTML = dependenciesRaw.join('');
                dependency = dependency.concat(pullOutChildren(doc));
                return dependency;
            }


            function generateEvalStringForJS(responseText, path) {
                var evalString = "";
                if (responseText.indexOf('$render') > 0) {
                    evalString = "(function($inject)" +
                        "{\n//" + path + "------------------------------------------------------------\n" +
                        "" + responseText + ";\n//--------------------------------------------------------------------\n" +
                        "return $render;})" +
                        "(yalla.inject.bind(yalla));";
                } else {
                    evalString = "(function($inject)" +
                        "{\n//" + path + "-------------------------------------------------------------\nvar $export = {};" +
                        "" + responseText + ";\n//--------------------------------------------------------------------\n" +
                        "return $export;})" +
                        "(yalla.inject.bind(yalla));";
                }
                return evalString;
            }

            function removeItemIfItsEmptyString(array) {
                return array.filter(function (item) {
                    return item && item !== '';
                }).map(function (item) {
                    if (item.constructor.name === 'Array') {
                        return removeItemIfItsEmptyString(item);
                    }
                    return item;
                });
            }

            function replaceBracket(string) {

                return (string.match(/{.*?}/g) || []).reduce(function (text, match) {
                    var newMatch = '"+(' + match.substring(1, match.length - 1) + ')+"';
                    return text.replace(match, newMatch);
                }, string);
            }

            function replaceBracketWithExpression(array) {
                return array.map(function (item) {
                    if (typeof item == 'string') {
                        return replaceBracket(item);
                    }
                    if (typeof item == 'object') {
                        if (item.constructor.name == 'Array') {
                            return replaceBracketWithExpression(item);
                        } else {
                            for (var key in item) {
                                item[key] = replaceBracket(item[key]);
                            }
                            return item;
                        }
                    }
                    return item;
                });
            }

            function markTagIfItsVariable(variables, array) {
                return array.map(function (item, index) {
                    if (index == 0 && typeof item == 'string') {
                        if (item in variables) {
                            return "#@" + variables[item] + "@#";
                        }
                    }
                    if (typeof item == 'object' && item.constructor.name == 'Array') {
                        return markTagIfItsVariable(variables, item);
                    }
                    return item;
                });
            }

            function checkForDataChildrenAndPatchToSibling(array) {
                var hasChildrenFlag = false;
                array.forEach(function(item){
                    if(typeof item == 'object' && item.constructor.name != 'Array'){
                        if('data-$children' in item){
                            hasChildrenFlag = true;
                        }
                        delete item['data-$children'];
                    }
                    if(typeof item == 'object' && item.constructor.name == 'Array'){
                        checkForDataChildrenAndPatchToSibling(item);
                    }
                });
                if(hasChildrenFlag){
                    array.push('$props.$children');
                }
                return array;
            }

            function checkForForEachAndPatchToSibling(array) {
                var hasForEach = false;
                var forEachValue = "";
                array.forEach(function(item){
                    if(typeof item == 'object' && item.constructor.name != 'Array'){
                        if('foreach' in item){
                            hasForEach = true;
                            forEachValue = item.foreach;
                        }
                    }
                    if(typeof item == 'object' && item.constructor.name == 'Array'){
                        checkForForEachAndPatchToSibling(item);
                    }
                });
                if(hasForEach){
                    array.push('$foreach:'+forEachValue.trim());
                }
                return array;
            }


            function updateScriptForChildrenTag(script) {
                var propsChildren = script.match(/"\$props\.\$children"/g) || [];
                script = propsChildren.reduce(function(text,match){
                    var positionOfMatchItem = text.indexOf(match);
                    var endIndexOfPropsChildren = text.indexOf("]",positionOfMatchItem);
                    var beginComma = script.substring(0,positionOfMatchItem).lastIndexOf(",");
                    text = text.substring(0,beginComma)+'].concat($props.$children)'+text.substring(endIndexOfPropsChildren+1,script.length);
                    return text;
                },script);
                return script;

            }

            function updateScriptForForeachTag(script) {
                var forEachAttributes = script.match(/"\$foreach:.*?"/g) || [];
                script = forEachAttributes.reduce(function(text,forEachAttr){
                    var forEachAttrIndex = text.indexOf(forEachAttr);
                    // lets find last comma
                    var firstClosingBracketAfterForEachAttrIndex = text.indexOf(']',forEachAttrIndex);

                    var forEachArraySource = forEachAttr.substring(forEachAttr.indexOf(" in ")+4,forEachAttr.length-1) ;
                    var forEachItem = forEachAttr.substring('"$foreach:'.length,forEachAttr.indexOf(" in "));

                    var endOfBracket = text.substring(0,forEachAttrIndex).lastIndexOf(",");
                    var forEachExpression = forEachAttr.substring(forEachAttr.indexOf(":")+1,forEachAttr.length-1);
                    var forEachString =  '"foreach": "'+forEachExpression+'"';
                    var beginOfTag = text.substring(0,forEachAttrIndex).lastIndexOf(forEachString);
                    var startOfBracket = text.indexOf("[",beginOfTag);
                    var childExpression = text.substring(startOfBracket,endOfBracket);

                    var beginComma = text.substring(0,startOfBracket).lastIndexOf(",");

                    text = text.substring(0,beginComma)+'].concat('+forEachArraySource+'.map(function('+forEachItem+'){ console.log('+forEachItem+');return  '+childExpression+';}))'+text.substring(firstClosingBracketAfterForEachAttrIndex+1,script.length);
                    text = text.replace(forEachString,'');
                    debugger;
                    return text;
                },script);
                return script;
            }



            function generateEvalStringForHTML(responseText, path) {
                // this line we are cleaning the text wich have immediate closing bracket
                responseText = (responseText.match(/<.*?\/>/g) || []).reduce(function (text, match, index, array) {
                    var emptyStringIndex = match.indexOf(" ");
                    if (emptyStringIndex < 0) {
                        emptyStringIndex = match.indexOf("/>");
                    }
                    var tagName = match.substring(1, emptyStringIndex);
                    if (tagName == 'br') {
                        return text;
                    }
                    var newText = match.substring(0, match.length - 2) + '></' + tagName + '>';
                    return text.replace(match, newText);
                }, responseText);
                var jsonMl = yalla.jsonMlFromText(responseText);

                jsonMl = checkForDataChildrenAndPatchToSibling(jsonMl);
                jsonMl = checkForForEachAndPatchToSibling(jsonMl);

                // here we convert to JSONML then we stringify them. We need to do this to get consistent format of the code
                var resultString = JSON.stringify(jsonMl);

                // take out all var
                var vars = resultString.match(/\["var".*?}]/g) || [];
                var injects = resultString.match(/\["inject".*?}]/g) || [];

                var varsJson = JSON.parse('[' + vars.join(',') + ']');
                var injectsJson = JSON.parse('[' + injects.join(',') + ']');

                var variablesJson = varsJson.reduce(function (result, _var) {
                    var item = _var[1];
                    var value = item.value;
                    if (value.indexOf('{') == 0) {
                        value = '(' + value.substring(1, value.length - 1) + ')';
                    } else {
                        value = '"' + replaceBracket(value) + '"';
                    }
                    result.text += 'var ' + item.name + ' = ' + value + ';\n';

                    var name = item.name.replace(/([A-Z]+)/g, ' $1').trim().replace(/\s/g, '-').toLowerCase();
                    result.variables[name] = item.name;
                    return result;
                }, {text: '', variables: {}});

                variablesJson = injectsJson.reduce(function (result, _var) {
                    var item = _var[1];
                    var value = '$inject("' + item.value + '")';
                    result.text += 'var ' + item.name + ' = ' + value + ';\n';
                    var name = item.name.replace(/([A-Z]+)/g, ' $1').trim().replace(/\s/g, '-').toLowerCase();
                    result.variables[name] = item.name;
                    return result;
                }, variablesJson);
                var arrayToBeCleanedString = vars.concat(injects).reduce(function (text, match) {
                    return text.replace(match, '""');
                }, resultString);
                var arrayToBeCleaned = JSON.parse(arrayToBeCleanedString);
                var afterVarsRemoved = markTagIfItsVariable(variablesJson.variables, replaceBracketWithExpression(removeItemIfItsEmptyString(arrayToBeCleaned)));
                //later we need to compose the vars again to script
                var script = JSON.stringify(afterVarsRemoved, false, '  ');
                script = script.replace(/\\"\+\(/g, '"+(').replace(/\)\+\\"/g, ')+"');
                script = script.replace(/": ""\+\(/g, '":(').replace(/\)\+""/g, ')');
                script = script.replace(/"#@/g, '').replace(/@#"/g, '');
                script = script.replace(/"sub-view"/g, '$props.$subView');
                script = updateScriptForChildrenTag(script);
                debugger;
                script = updateScriptForForeachTag(script);

                return generateEvalStringForJS(variablesJson.text + 'function $render($props){ return ' + script + '; }', path);
            }

            function executeScript(responseText, path) {
                var evalString = "";
                if (path.indexOf(".html") >= 0) {
                    evalString = generateEvalStringForHTML(responseText, path);
                } else {
                    evalString = generateEvalStringForJS(responseText, path);
                }
                return eval(evalString);
            }

            return new Promise(function (resolve, reject) {
                var xmlhttp = new XMLHttpRequest();
                xmlhttp.open("GET", yalla.baselib + "/" + path);
                xmlhttp.onreadystatechange = function () {
                    if (xmlhttp.readyState == 4) {
                        var dependency = lookDependency(xmlhttp.responseText);
                        if (dependency.length > 0) {
                            Promise.all(dependency.map(function (dependency) {
                                return yalla.loader(dependency);
                            })).then(function () {
                                resolve(executeScript(xmlhttp.responseText, path));
                            }).catch(function (err) {
                                reject(err);
                            });
                        } else {
                            try {
                                resolve(executeScript(xmlhttp.responseText, path));
                            } catch (err) {
                                reject(err);
                            }
                        }
                    }
                };
                xmlhttp.send();
            });
        };

        return function (path) {
            if (path in context._promisesToResolve) {
                return context._promisesToResolve[path];
            } else {
                var promise = new Promise(function (resolve, reject) {
                    if (path in context && (typeof context[path] !== 'undefined')) {
                        resolve(context[path]);
                    } else {
                        loadScript(path).then(function (object) {
                            context[path] = object;
                            resolve(object);
                            delete context._promisesToResolve[path];
                        }).catch(function (err) {
                            reject(err);
                            delete context._promisesToResolve[path];
                        });
                    }
                });
                context._promisesToResolve[path] = promise;
                return promise;
            }
        }
    })(yalla.globalContext);

    yalla.inject = function (path) {
        var dependencyObject = this.globalContext[path];
        if (typeof dependencyObject === 'function') {
            var $render = dependencyObject;
            var elementName = path.replace(/\//g, '.');

            var yallaComponent = function (attributes) {
                attributes = attributes || {};
                var elements = $render(attributes);
                if (!elements) {
                    throw new Error('There is no return in $render function "' + path + '", did you forget the return keyword ?');
                }
                var prop = elements[1];
                if (typeof prop !== 'object' || prop.constructor === Array) {
                    prop = {};
                    elements.splice(1, 0, prop);
                }
                prop.element = elementName;
                prop.id = attributes.id;
                prop.$storeTobeAttachedToDom = attributes.$storeTobeAttachedToDom;
                return elements;
            };

            yallaComponent.prototype.elementName = elementName;
            yallaComponent.prototype.path = path;
            return yallaComponent;
        } else {
            return dependencyObject;
        }

    };

    yalla.idom = (function () {
        var exports = {};

        var hasOwnProperty = Object.prototype.hasOwnProperty;

        function Blank() {
        }

        Blank.prototype = Object.create(null);

        var has = function (map, property) {
            return hasOwnProperty.call(map, property);
        };

        var createMap = function () {
            return new Blank();
        };


        function NodeData(nodeName, key) {
            this.attrs = createMap();
            this.attrsArr = [];
            this.newAttrs = createMap();
            this.staticsApplied = false;
            this.key = key;
            this.keyMap = createMap();
            this.keyMapValid = true;
            this.focused = false;
            this.nodeName = nodeName;
            this.text = null;
        }

        var initData = function (node, nodeName, key) {
            var data = new NodeData(nodeName, key);
            node[DATA_PROP] = data;
            return data;
        };

        var getData = function (node) {
            importNode(node);
            return node[DATA_PROP];
        };

        var importNode = function (node) {
            if (node[DATA_PROP]) {
                return;
            }

            var isElement = node instanceof Element;
            var nodeName = isElement ? node.localName : node.nodeName;
            var key = isElement ? node.getAttribute('key') : null;
            var data = initData(node, nodeName, key);

            if (key) {
                getData(node.parentNode).keyMap[key] = node;
            }

            if (isElement) {
                var attributes = node.attributes;
                var attrs = data.attrs;
                var newAttrs = data.newAttrs;
                var attrsArr = data.attrsArr;

                for (var i = 0; i < attributes.length; i += 1) {
                    var attr = attributes[i];
                    var name = attr.name;
                    var value = attr.value;

                    attrs[name] = value;
                    newAttrs[name] = undefined;
                    attrsArr.push(name);
                    attrsArr.push(value);
                }
            }

            for (var child = node.firstChild; child; child = child.nextSibling) {
                importNode(child);
            }
        };

        var getNamespaceForTag = function (tag, parent) {
            if (tag === 'svg') {
                return 'http://www.w3.org/2000/svg';
            }

            if (getData(parent).nodeName === 'foreignObject') {
                return null;
            }

            return parent.namespaceURI;
        };

        var createElement = function (doc, parent, tag, key) {
            var namespace = getNamespaceForTag(tag, parent);
            var el = undefined;

            if (namespace) {
                el = doc.createElementNS(namespace, tag);
            } else {
                el = doc.createElement(tag);
            }

            initData(el, tag, key);

            return el;
        };

        var createText = function (doc) {
            var node = doc.createTextNode('');
            initData(node, '#text', null);
            return node;
        };


        var notifications = {
            nodesCreated: null,
            nodesDeleted: null
        };

        function Context() {
            this.created = notifications.nodesCreated && [];
            this.deleted = notifications.nodesDeleted && [];
        }

        Context.prototype.markCreated = function (node) {
            if (this.created) {
                this.created.push(node);
            }
        };

        Context.prototype.markDeleted = function (node) {
            if (this.deleted) {
                this.deleted.push(node);
            }
        };

        Context.prototype.notifyChanges = function () {
            if (this.created && this.created.length > 0) {
                notifications.nodesCreated(this.created);
            }
            if (this.deleted && this.deleted.length > 0) {
                notifications.nodesDeleted(this.deleted);
            }
        };


        var isDocumentRoot = function (node) {
            return node instanceof Document || node instanceof DocumentFragment;
        };

        var getAncestry = function (node, root) {
            var ancestry = [];
            var cur = node;
            while (cur !== root) {
                ancestry.push(cur);
                cur = cur.parentNode;
            }
            return ancestry;
        };

        var getRoot = function (node) {
            var cur = node;
            var prev = cur;

            while (cur) {
                prev = cur;
                cur = cur.parentNode;
            }

            return prev;
        };

        var getActiveElement = function (node) {
            var root = getRoot(node);
            return isDocumentRoot(root) ? root.activeElement : null;
        };

        var getFocusedPath = function (node, root) {
            var activeElement = getActiveElement(node);
            if (!activeElement || !node.contains(activeElement)) {
                return [];
            }
            return getAncestry(activeElement, root);
        };

        var moveBefore = function (parentNode, node, referenceNode) {
            var insertReferenceNode = node.nextSibling;
            var cur = referenceNode;
            while (cur !== node) {
                var next = cur.nextSibling;
                parentNode.insertBefore(cur, insertReferenceNode);
                cur = next;
            }
        };

        var context = null;
        var currentNode = null;
        var currentParent = null;
        var doc = null;

        var markFocused = function (focusPath, focused) {
            for (var i = 0; i < focusPath.length; i += 1) {
                getData(focusPath[i]).focused = focused;
            }
        };

        var patchFactory = function (run) {
            var f = function (node, fn, data) {
                var prevContext = context;
                var prevDoc = doc;
                var prevCurrentNode = currentNode;
                var prevCurrentParent = currentParent;
                var previousInAttributes = false;
                var previousInSkip = false;

                context = new Context();
                doc = node.ownerDocument;
                currentParent = node.parentNode;

                if ('production' !== 'production') {
                }

                var focusPath = getFocusedPath(node, currentParent);
                markFocused(focusPath, true);
                var retVal = run(node, fn, data);
                markFocused(focusPath, false);

                if ('production' !== 'production') {
                }

                context.notifyChanges();
                context = prevContext;
                doc = prevDoc;
                currentNode = prevCurrentNode;
                currentParent = prevCurrentParent;
                return retVal;
            };
            return f;
        };

        var patchInner = patchFactory(function (node, fn, data) {
            currentNode = node;

            enterNode();
            fn(data);
            exitNode();

            if ('production' !== 'production') {
            }

            return node;
        });

        var patchOuter = patchFactory(function (node, fn, data) {
            var startNode = {nextSibling: node};
            var expectedNextNode = null;
            var expectedPrevNode = null;

            if ('production' !== 'production') {
            }

            currentNode = startNode;
            fn(data);

            if ('production' !== 'production') {
            }

            if (node !== currentNode && node.parentNode) {
                removeChild(currentParent, node, getData(currentParent).keyMap);
            }

            return startNode === currentNode ? null : currentNode;
        });

        var matches = function (matchNode, nodeName, key) {
            var data = getData(matchNode);

            return nodeName === data.nodeName && key == data.key;
        };

        var alignWithDOM = function (nodeName, key) {
            if (currentNode && matches(currentNode, nodeName, key)) {
                return;
            }
            var parentData = getData(currentParent);
            var currentNodeData = currentNode && getData(currentNode);
            var keyMap = parentData.keyMap;
            var node = undefined;

            if (key) {
                var keyNode = keyMap[key];
                if (keyNode) {
                    if (matches(keyNode, nodeName, key)) {
                        node = keyNode;
                    } else if (keyNode === currentNode) {
                        context.markDeleted(keyNode);
                    } else {
                        removeChild(currentParent, keyNode, keyMap);
                    }
                }
            }

            if (!node) {
                if (nodeName === '#text') {
                    node = createText(doc);
                } else {
                    node = createElement(doc, currentParent, nodeName, key);
                }

                if (key) {
                    keyMap[key] = node;
                }

                context.markCreated(node);
            }

            if (getData(node).focused) {
                moveBefore(currentParent, node, currentNode);
            } else if (currentNodeData && currentNodeData.key && !currentNodeData.focused) {
                currentParent.replaceChild(node, currentNode);
                parentData.keyMapValid = false;
            } else {
                currentParent.insertBefore(node, currentNode);
            }

            currentNode = node;
        };

        var removeChild = function (node, child, keyMap) {
            node.removeChild(child);
            context.markDeleted(child);
            var key = getData(child).key;
            if (key) {
                delete keyMap[key];
            }
        };

        var clearUnvisitedDOM = function () {
            var node = currentParent;
            var data = getData(node);
            var keyMap = data.keyMap;
            var keyMapValid = data.keyMapValid;
            var child = node.lastChild;
            var key = undefined;

            if (child === currentNode && keyMapValid) {
                return;
            }

            while (child !== currentNode) {
                removeChild(node, child, keyMap);
                child = node.lastChild;
            }

            if (!keyMapValid) {
                for (key in keyMap) {
                    child = keyMap[key];
                    if (child.parentNode !== node) {
                        context.markDeleted(child);
                        delete keyMap[key];
                    }
                }

                data.keyMapValid = true;
            }
        };

        var enterNode = function () {
            currentParent = currentNode;
            currentNode = null;
        };

        var getNextNode = function () {
            if (currentNode) {
                return currentNode.nextSibling;
            } else if (currentParent) {
                return currentParent.firstChild;
            } else {
                return document.getElementsByTagName('body')[0];
            }
        };

        var nextNode = function () {
            currentNode = getNextNode();
        };

        var exitNode = function () {
            clearUnvisitedDOM();
            currentNode = currentParent;
            currentParent = currentParent.parentNode;
        };

        var coreElementOpen = function (tag, key) {
            nextNode();
            alignWithDOM(tag, key);
            enterNode();
            return (currentParent
            );
        };

        var coreElementClose = function () {
            if ('production' !== 'production') {
            }
            exitNode();
            return (currentNode
            );
        };

        var coreText = function () {
            nextNode();
            alignWithDOM('#text', null);
            return (currentNode
            );
        };

        var currentElement = function () {
            if ('production' !== 'production') {
            }
            return (currentParent
            );
        };

        var currentPointer = function () {
            if ('production' !== 'production') {
            }
            return getNextNode();
        };

        var skip = function () {
            if ('production' !== 'production') {
            }
            currentNode = currentParent.lastChild;
        };

        var skipNode = nextNode;


        var symbols = {
            default: '__default'
        };

        var getNamespace = function (name) {
            if (name.lastIndexOf('xml:', 0) === 0) {
                return 'http://www.w3.org/XML/1998/namespace';
            }

            if (name.lastIndexOf('xlink:', 0) === 0) {
                return 'http://www.w3.org/1999/xlink';
            }
        };

        var applyAttr = function (el, name, value) {
            if (value == null) {
                el.removeAttribute(name);
            } else {
                var attrNS = getNamespace(name);
                if (attrNS) {
                    el.setAttributeNS(attrNS, name, value);
                } else {
                    el.setAttribute(name, value);
                }
            }
        };

        var applyProp = function (el, name, value) {
            el[name] = value;
        };

        var setStyleValue = function (style, prop, value) {
            if (prop.indexOf('-') >= 0) {
                style.setProperty(prop, value);
            } else {
                style[prop] = value;
            }
        };

        var applyStyle = function (el, name, style) {
            if (typeof style === 'string') {
                el.style.cssText = style;
            } else {
                el.style.cssText = '';
                var elStyle = el.style;
                var obj = style;

                for (var prop in obj) {
                    if (has(obj, prop)) {
                        setStyleValue(elStyle, prop, obj[prop]);
                    }
                }
            }
        };

        var applyAttributeTyped = function (el, name, value) {
            var type = typeof value;

            if (type === 'object' || type === 'function') {
                applyProp(el, name, value);
            } else {
                applyAttr(el, name, value);
            }
        };

        var updateAttribute = function (el, name, value) {
            var data = getData(el);
            var attrs = data.attrs;

            if (attrs[name] === value) {
                return;
            }

            var mutator = attributes[name] || attributes[symbols.default];
            mutator(el, name, value);

            attrs[name] = value;
        };

        var attributes = createMap();

        attributes[symbols.default] = applyAttributeTyped;

        attributes['style'] = applyStyle;

        var ATTRIBUTES_OFFSET = 3;

        var argsBuilder = [];

        var elementOpen = function (tag, key, statics, var_args) {
            if ('production' !== 'production') {
            }

            var node = coreElementOpen(tag, key);
            var data = getData(node);

            if (!data.staticsApplied) {
                if (statics) {
                    for (var _i = 0; _i < statics.length; _i += 2) {
                        var name = statics[_i];
                        var value = statics[_i + 1];
                        updateAttribute(node, name, value);
                    }
                }
                data.staticsApplied = true;
            }

            var attrsArr = data.attrsArr;
            var newAttrs = data.newAttrs;
            var isNew = !attrsArr.length;
            var i = ATTRIBUTES_OFFSET;
            var j = 0;

            for (; i < arguments.length; i += 2, j += 2) {
                var _attr = arguments[i];
                if (isNew) {
                    attrsArr[j] = _attr;
                    newAttrs[_attr] = undefined;
                } else if (attrsArr[j] !== _attr) {
                    break;
                }

                var value = arguments[i + 1];
                if (isNew || attrsArr[j + 1] !== value) {
                    attrsArr[j + 1] = value;
                    updateAttribute(node, _attr, value);
                }
            }

            if (i < arguments.length || j < attrsArr.length) {
                for (; i < arguments.length; i += 1, j += 1) {
                    attrsArr[j] = arguments[i];
                }

                if (j < attrsArr.length) {
                    attrsArr.length = j;
                }

                for (i = 0; i < attrsArr.length; i += 2) {
                    var name = attrsArr[i];
                    var value = attrsArr[i + 1];
                    newAttrs[name] = value;
                }

                for (var _attr2 in newAttrs) {
                    updateAttribute(node, _attr2, newAttrs[_attr2]);
                    newAttrs[_attr2] = undefined;
                }
            }
            return node;
        };

        var elementOpenStart = function (tag, key, statics) {
            if ('production' !== 'production') {
            }

            argsBuilder[0] = tag;
            argsBuilder[1] = key;
            argsBuilder[2] = statics;
        };

        var attr = function (name, value) {
            if ('production' !== 'production') {
            }

            argsBuilder.push(name);
            argsBuilder.push(value);
        };

        var elementOpenEnd = function () {
            if ('production' !== 'production') {
            }

            var node = elementOpen.apply(null, argsBuilder);
            argsBuilder.length = 0;
            return node;
        };

        var elementClose = function (tag) {
            if ('production' !== 'production') {
            }
            var node = coreElementClose();
            if ('production' !== 'production') {
            }
            return node;
        };

        var elementVoid = function (tag, key, statics, var_args) {
            elementOpen.apply(null, arguments);
            return elementClose(tag);
        };

        var text = function (value, var_args) {
            if ('production' !== 'production') {
            }

            var node = coreText();
            var data = getData(node);

            if (data.text !== value) {
                data.text = value;

                var formatted = value;
                for (var i = 1; i < arguments.length; i += 1) {
                    var fn = arguments[i];
                    formatted = fn(formatted);
                }

                node.data = formatted;
            }

            return node;
        };

        exports.patch = patchInner;
        exports.patchInner = patchInner;
        exports.patchOuter = patchOuter;
        exports.currentElement = currentElement;
        exports.currentPointer = currentPointer;
        exports.skip = skip;
        exports.skipNode = skipNode;
        exports.elementVoid = elementVoid;
        exports.elementOpenStart = elementOpenStart;
        exports.elementOpenEnd = elementOpenEnd;
        exports.elementOpen = elementOpen;
        exports.elementClose = elementClose;
        exports.text = text;
        exports.attr = attr;
        exports.symbols = symbols;
        exports.attributes = attributes;
        exports.applyAttr = applyAttr;
        exports.applyProp = applyProp;
        exports.notifications = notifications;
        exports.importNode = importNode;
        return exports;
    })();

    yalla.toDom = (function () {
        var elementOpenStart = yalla.idom.elementOpenStart;
        var elementOpenEnd = yalla.idom.elementOpenEnd;
        var elementClose = yalla.idom.elementClose;
        var currentElement = yalla.idom.currentElement;
        var currentPointer = yalla.idom.currentPointer;
        var skip = yalla.idom.skip;
        var attr = yalla.idom.attr;
        var text = yalla.idom.text;

        function openTag(head, keyAttr) {
            try {
                var dotSplit = head.split('.');
                var hashSplit = dotSplit[0].split('#');
                var tagName = hashSplit[0] || 'div';
                var id = hashSplit[1];
                var className = dotSplit.slice(1).join(' ');
                elementOpenStart(tagName, keyAttr);
                if (id) attr('id', id);
                if (className) attr('class', className);
                return tagName
            } catch (err) {
                debugger;
            }

        }

        function applyAttrsObj(attrsObj) {
            for (var k in attrsObj) {
                attr(k, attrsObj[k])
            }
        }

        function parse(markup) {
            var head = markup[0];
            if (head === false || head === undefined) {
                return undefined;
            }
            var attrsObj = markup[1];
            var hasAttrs = attrsObj && attrsObj.constructor === Object;
            var firstChildPos = hasAttrs ? 2 : 1;
            var keyAttr = hasAttrs && attrsObj.key;
            var skipAttr = hasAttrs && attrsObj.skip;

            var isComponent = typeof head === 'function';
            var isView = typeof head === 'object' && '$view' in head;
            if (isComponent) {
                attrsObj = hasAttrs ? attrsObj : {};
                attrsObj.$view = head;
                attrsObj.$subView = false;
                attrsObj.$elementName = head.prototype.elementName;
                attrsObj.$children = markup.slice(firstChildPos, markup.length);

                if (!head.prototype.elementName) {
                    throw new Error('Something wrong elementName does not exist in the ' + head);
                }

                // lets assign the node here!
                var currentNode = currentPointer();
                if (currentNode && currentNode[DATA_PROP].attrs.element == attrsObj.$elementName) {
                    attrsObj.$node = attrsObj.$node || currentNode;
                }

                // ok after node is assigned lets create the $store function here
                attrsObj.$store = function (reducer, state, middleware) {
                    if (attrsObj.$node) {
                        return attrsObj.$node.$store;
                    } else {
                        attrsObj.$storeTobeAttachedToDom = yalla.createStore(reducer, state, middleware);
                        return attrsObj.$storeTobeAttachedToDom;
                    }
                };

                var jsonmlData = head(attrsObj);

                jsonmlData = jsonmlData.length == 1 ? jsonmlData.push({}) : jsonmlData;
                if (typeof jsonmlData[1] === 'object' && jsonmlData[1].constructor.name === 'Array') {
                    jsonmlData.splice(1, 0, {});
                }

                var elementAttributes = jsonmlData[1];
                // ok now its time to delegate all of this to the constructor
                elementAttributes.$storeTobeAttachedToDom = attrsObj.$storeTobeAttachedToDom;
                elementAttributes.$view = attrsObj.$view;
                parse(jsonmlData);
            } else if (isView) {
                parse(head.$view(head));
            } else {
                var tagName = openTag(head, keyAttr);
                if (hasAttrs) {
                    applyAttrsObj(attrsObj);
                }
                elementOpenEnd();
                if (skipAttr) {
                    skip()
                } else {
                    for (var i = firstChildPos, len = markup.length; i < len; i++) {
                        var node = markup[i];

                        if (node === null || node === undefined) continue;
                        switch (node.constructor) {
                            case Array:
                                parse(node);
                                break;
                            case Function:
                                node(currentElement());
                                break;
                            default:
                                text(node)
                        }
                    }
                }
                elementClose(tagName);
            }
        }

        return parse
    })();


    yalla.idom.notifications.nodesCreated = function (nodes) {
        nodes.forEach(function (node) {
            var nodeAttrs = node[DATA_PROP].attrs;
            nodeAttrs.$node = node;
            if (nodeAttrs.$storeTobeAttachedToDom) {
                node.$store = nodeAttrs.$storeTobeAttachedToDom;
                node.$store.subscribe(function () {
                    yalla.markAsDirty();
                });
            }
        });

        nodes.slice().reverse().forEach(function (node) {
            if (node.onload) {
                node.onload(node);
            }
        })

    };

    yalla.idom.notifications.nodesDeleted = function (nodes) {
        nodes.forEach(function (node) {
            delete node[DATA_PROP].attrs.$node;
            if (node.onunload) {
                node.onunload(node);
            }
        });
    };

    yalla.debounce = function (func, wait, immediate) {
        var timeout;
        return function () {
            var context = this, args = arguments;
            var later = function () {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    };

    function renderChain(address) {
        address.reverse().reduce(function (current, pathQuery, index, array) {
            return current.then(function (subView) {
                // first we need to remove all params
                var valParams = pathQuery.split(':');
                var path = valParams[0];
                valParams.splice(0, 1);
                var params = valParams.reduce(function (current, param) {
                    var parVal = param.split('=');
                    current[parVal[0]] = parVal[1];
                    return current;
                }, {});
                return new Promise(function (resolve) {
                    var pathUi = path.split(".").join("/");
                    yalla.loader(pathUi).then(function () {
                        params.$view = yalla.inject(pathUi);
                        params.$subView = subView;
                        params.$elementName = pathUi.split('/').join('.');
                        params.$children = [];
                        params.$store = function (reducer, state, middleware) {
                            var currentPointer = yalla.idom.currentPointer();
                            if (currentPointer && DATA_PROP in currentPointer) {
                                if (currentPointer[DATA_PROP].attrs.element == params.$elementName && currentPointer.$store) {
                                    return currentPointer.$store;
                                } else if (currentPointer.children && currentPointer.children.length == 1) {
                                    // kita harus tambahin check kalau dia levelnya body
                                    var child = currentPointer.children[0];
                                    if (child[DATA_PROP] && child[DATA_PROP].attrs.element == params.$elementName && child.$store) {
                                        return child.$store;
                                    }
                                }

                            }
                            params.$storeTobeAttachedToDom = params.$storeTobeAttachedToDom || yalla.createStore(reducer, state, middleware);
                            return params.$storeTobeAttachedToDom;
                        };

                        if (index == array.length - 1) {
                            yalla.uiRoot = params;
                            yalla.markAsDirty();
                        }
                        resolve(params);
                    });
                });
            });
        }, Promise.resolve(false));
    }

    yalla.markAsDirty = function () {
        var dom = yalla.rootElement;
        var renderer = yalla.uiRoot.$view;
        var attributes = yalla.uiRoot;
        var output = [];
        if (arguments.length === 2) {
            dom = arguments[0];
            output = arguments[1];
        } else {
            output = renderer(attributes);
        }
        yalla.idom.patch(dom, yalla.toDom, output);
    };

    yalla.start = function (startFile, el, baseLib) {
        yalla.baselib = baseLib || yalla.baseLib;
        yalla.rootElement = el || document.getElementsByTagName("body")[0];
        var address = window.location.hash.substring(1, window.location.hash.length).split("/");
        address = (address.length > 0 && address[0] != "") ? address : [startFile];
        renderChain(address);
    };

    if ("onhashchange" in window) {
        window.onhashchange = function () {
            var address = location.hash.substring(1, window.location.hash.length).split("/");
            renderChain(address);
        }
    } else {
        alert('Browser not supported');
    }

    yalla.createStore = function (reducer, _state, _middleware) {
        var middleware = _middleware;
        var state = _state;
        if (_state) {
            if (typeof _state === 'function') {
                middleware = _state;
                state = {};
            }
        }

        function Store() {
            this._subscribers = this._subscribers || [];
        }

        Store.prototype.reducer = reducer;
        Store.prototype.state = state;

        Store.prototype.dispatch = function (action) {
            if (action == null) {
                throw new Error('You are calling dispatch but did not pass action to it');
            }
            if (!('type' in action)) {
                throw new Error('You are calling dispatch but did not pass type to it');
            }
            if (this.reducer) {
                this.state = this.reducer(this.state, action);
                this.updateSubscribers();
            }
        };

        Store.prototype.updateSubscribers = function () {
            for (var i = 0; i < this._subscribers.length; i++) {
                this._subscribers[i].apply(this);
            }
        };

        Store.prototype.subscribe = function (fct) {
            this._subscribers.push(fct);
        };
        Store.prototype.unSubscribe = function (fct) {
            this._subscribers.splice(this._subscribers.indexOf(fct), 1);
        };
        Store.prototype.getState = function () {
            return this.state;
        };
        return new Store();
    };

    yalla.combineReducers = function (stateReducers) {
        return function (state, action) {
            var resultState = yalla.clone(state);
            for (var key in stateReducers) {
                if (stateReducers.hasOwnProperty(key)) {
                    var reducer = stateReducers[key];
                    var stateVal = state[key];
                    var newState = reducer(stateVal, action);
                    resultState[key] = newState;
                }
            }
            return resultState;
        }
    };

    yalla.applyMiddleware = function (middlewares) {
        // the first next will be create store !!
        return function (createStoreFunction) {
            return function (reducer, initialState) {
                var store = createStoreFunction(reducer, initialState);
                var dispatch = store.dispatch.bind(store);
                var getState = store.getState.bind(store);
                var chain = [];

                var middlewareStore = {
                    getState: store.getState.bind(store),
                    dispatch: function (action) {
                        dispatch(action);
                    }
                };

                chain = middlewares.map(function (middleware) {
                    return middleware(middlewareStore);
                });
                chain.push(store.dispatch.bind(store));
                dispatch = chain.reduceRight(function (composed, f) {
                    return f(composed);
                });

                store.dispatch = dispatch;
                return store;
            };
        }
    };

    yalla.jsonMlFromText = (function () {

        var addChildren = function (/*DOM*/ elem, /*function*/ filter, /*JsonML*/ jml) {
            if (elem.hasChildNodes()) {
                for (var i = 0; i < elem.childNodes.length; i++) {
                    var child = elem.childNodes[i];
                    child = fromHTML(child, filter);
                    if (child) {
                        jml.push(child);
                    }
                }
                return true;
            }
            return false;
        };

        /**
         * @param {Node} elem
         * @param {function} filter
         * @return {array} JsonML
         */
        var fromHTML = function (elem, filter) {
            if (!elem || !elem.nodeType) {
                // free references
                return (elem = null);
            }

            var i, jml;
            switch (elem.nodeType) {
                case 1:  // element
                case 9:  // document
                case 11: // documentFragment
                    jml = [elem.tagName || ''];

                    var attr = elem.attributes,
                        props = {},
                        hasAttrib = false;

                    for (i = 0; attr && i < attr.length; i++) {
                        if (attr[i].specified) {
                            if (attr[i].name === 'style') {
                                props.style = elem.style.cssText || attr[i].value;
                            } else if ('string' === typeof attr[i].value) {
                                props[attr[i].name] = attr[i].value;
                            }
                            hasAttrib = true;
                        }
                    }
                    if (hasAttrib) {
                        jml.push(props);
                    }

                    var child;

                    switch (jml[0].toLowerCase()) {
                        case 'frame':
                        case 'iframe':
                            try {
                                if ('undefined' !== typeof elem.contentDocument) {
                                    // W3C
                                    child = elem.contentDocument;
                                } else if ('undefined' !== typeof elem.contentWindow) {
                                    // Microsoft
                                    child = elem.contentWindow.document;
                                } else if ('undefined' !== typeof elem.document) {
                                    // deprecated
                                    child = elem.document;
                                }

                                child = fromHTML(child, filter);
                                if (child) {
                                    jml.push(child);
                                }
                            } catch (ex) {
                            }
                            break;
                        case 'style':
                            child = elem.styleSheet && elem.styleSheet.cssText;
                            if (child && 'string' === typeof child) {
                                // unwrap comment blocks
                                child = child.replace('<!--', '').replace('-->', '');
                                jml.push(child);
                            } else if (elem.hasChildNodes()) {
                                for (i = 0; i < elem.childNodes.length; i++) {
                                    child = elem.childNodes[i];
                                    child = fromHTML(child, filter);
                                    if (child && 'string' === typeof child) {
                                        // unwrap comment blocks
                                        child = child.replace('<!--', '').replace('-->', '');
                                        jml.push(child);
                                    }
                                }
                            }
                            break;
                        case 'input':
                            addChildren(elem, filter, jml);
                            child = (elem.type !== 'password') && elem.value;
                            if (child) {
                                if (!hasAttrib) {
                                    // need to add an attribute object
                                    jml.shift();
                                    props = {};
                                    jml.unshift(props);
                                    jml.unshift(elem.tagName || '');
                                }
                                props.value = child;
                            }
                            break;
                        case 'textarea':
                            if (!addChildren(elem, filter, jml)) {
                                child = elem.value || elem.innerHTML;
                                if (child && 'string' === typeof child) {
                                    jml.push(child);
                                }
                            }
                            break;
                        default:
                            addChildren(elem, filter, jml);
                            break;
                    }

                    // filter result
                    if ('function' === typeof filter) {
                        jml = filter(jml, elem);
                    }

                    // free references
                    elem = null;
                    return jml;
                case 3: // text node
                case 4: // CDATA node
                    var str = String(elem.nodeValue);
                    // free references
                    elem = null;
                    return str;
                case 10: // doctype
                    jml = ['!'];
                    var type = ['DOCTYPE', (elem.name || 'html').toLowerCase()];

                    if (elem.publicId) {
                        type.push('PUBLIC', '"' + elem.publicId + '"');
                    }

                    if (elem.systemId) {
                        type.push('"' + elem.systemId + '"');
                    }

                    jml.push(type.join(' '));

                    // filter result
                    if ('function' === typeof filter) {
                        jml = filter(jml, elem);
                    }

                    // free references
                    elem = null;
                    return jml;
                case 8: // comment node
                    if ((elem.nodeValue || '').indexOf('DOCTYPE') !== 0) {
                        // free references
                        elem = null;
                        return null;
                    }

                    jml = ['!',
                        elem.nodeValue];

                    // filter result
                    if ('function' === typeof filter) {
                        jml = filter(jml, elem);
                    }

                    // free references
                    elem = null;
                    return jml;
                default: // etc.
                    // free references
                    return (elem = null);
            }
        };

        /**
         * @param {string} html HTML text
         * @param {function} filter
         * @return {array} JsonML
         */
        return function (html, filter) {
            filter = filter || function (jml, el) {
                    jml.splice(0, 1);
                    return [el.localName].concat(jml.filter(function (item) {
                        if (typeof item === 'string') {
                            return item.trim().length > 0
                        }
                        return true;
                    }));
                };

            var elem = document.createElement('div');
            elem.innerHTML = html;
            var jml = fromHTML(elem, filter);
            // free references
            elem = null;

            if (jml.length === 2) {
                return jml[1];
            }

            // make wrapper a document fragment
            jml[0] = '';
            return jml;
        };
    })();

    return yalla;
})();

function scriptStart() {
    if (document.readyState == 'complete') {
        var list = document.getElementsByTagName('script');
        for (var i = 0; i < list.length; i++) {
            var script = list[i];
            if (script.getAttribute('src').indexOf('yalla.js') >= 0) {
                var main = script.getAttribute('data-main');
                var base = script.getAttribute('data-base');
                if (main && base) {
                    yalla.start(main, document.getElementsByName('body')[0], base);
                    return true;
                }
                throw new Error('Please specify data-main and data-base in the script tag');
            }
        }
    }
    return false;
}

function startYalla() {
    if (!scriptStart()) {
        setTimeout(function () {
            startYalla();
        }, 0);
    }
}
startYalla();
