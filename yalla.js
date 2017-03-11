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

        var loadScript = function (path) {

            function lookDependency(responseText) {
                var injectText = "$inject(";
                var position = 0;
                var dependency = [];
                while ((position = responseText.indexOf(injectText, position + 1)) > 0) {
                    var closingIndex = responseText.indexOf(")", position);
                    var dep = responseText.substring(position + injectText.length, closingIndex).split(",")[0].replace(/['|"]/g, '');
                    dependency.push(dep);
                }
                return dependency;
            }


            function executeScript(responseText, path) {
                var evalString = "";
                if (responseText.indexOf('$render') > 0) {
                    evalString = "(function($inject)" +
                        "{\n//" + path + "\n" +
                        "\n\n" + responseText + ";\n\n" +
                        "return $render;})" +
                        "(yalla.inject.bind(yalla));";
                } else {
                    evalString = "(function($inject)" +
                        "{\n//" + path + "\nvar $export = {};" +
                        "\n\n" + responseText + ";\n\n" +
                        "return $export;})" +
                        "(yalla.inject.bind(yalla));";
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
                        loadScript(path + ".js").then(function (object) {
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

            function YallaComponent(attributes) {
                attributes = attributes || {};
                var elements = $render(attributes);
                if(!elements){
                    throw new Error('There is no return in $render function "'+path+'", did you forget the return keyword ?');
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
            }

            YallaComponent.prototype.elementName = elementName;
            YallaComponent.prototype.path = path;
            return YallaComponent;
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

        nodes.splice().reverse().forEach(function (node) {
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
                            if(currentPointer && DATA_PROP in currentPointer){
                                if(currentPointer[DATA_PROP].attrs.element == params.$elementName && currentPointer.$store){
                                    return currentPointer.$store;
                                }else if(currentPointer.children && currentPointer.children.length == 1){
                                    // kita harus tambahin check kalau dia levelnya body
                                    var child = currentPointer.children[0];
                                    if(child[DATA_PROP] && child[DATA_PROP].attrs.element == params.$elementName && child.$store){
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
                if(main && base){
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
