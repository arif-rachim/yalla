"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _templateObject = _taggedTemplateLiteral(["<span id=\"", "\" style=\"display: none\" data-async-outlet>outlet</span>"], ["<span id=\"", "\" style=\"display: none\" data-async-outlet>outlet</span>"]);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define([], factory);
    } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) === "object" && module.exports) {
        module.exports = factory();
    } else {
        root.yalla = factory();
        root.Context = root.Context || root.yalla.Context;
        root.render = root.render || root.yalla.render;
        root.plug = root.plug || root.yalla.plug;
        root.uuidv4 = root.uuidv4 || root.yalla.uuidv4;
        root.Event = root.Event || root.yalla.Event;
    }
})(typeof self !== "undefined" ? self : eval("this"), function () {
    /*
     The MIT License (MIT)
       Copyright (c) 2017-present, Arif Rachim
       Permission is hereby granted, free of charge, to any person obtaining a copy
     of this software and associated documentation files (the "Software"), to deal
     in the Software without restriction, including without limitation the rights
     to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     copies of the Software, and to permit persons to whom the Software is
     furnished to do so, subject to the following conditions:
       The above copyright notice and this permission notice shall be included in
     all copies or substantial portions of the Software.
       THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     THE SOFTWARE.
     */

    var isChrome = "chrome" in window && "webstore" in window.chrome;

    var Event = {
        SYNCING_DONE: "syncingdone"
    };

    var cloneNodeTree = function cloneNodeTree(node) {
        if (isChrome) {
            return node.cloneNode(true);
        } else {
            var clone = node.nodeType === 3 ? document.createTextNode(node.nodeValue) : node.cloneNode(false);
            var child = node.firstChild;
            while (child) {
                clone.appendChild(cloneNodeTree(child));
                child = child.nextSibling;
            }
            return clone;
        }
    };

    var isPromise = function isPromise(object) {
        return (typeof object === "undefined" ? "undefined" : _typeof(object)) === "object" && "constructor" in object && object.constructor.name === "Promise";
    };

    var uuidv4 = function uuidv4() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0,
                v = c === "x" ? r : r & 0x3 | 0x8;
            return v.toString(16);
        });
    };

    var Template = function () {
        function Template() {
            _classCallCheck(this, Template);
        }

        _createClass(Template, [{
            key: "destroy",
            value: function destroy() {
                throw new Error("Please implement template.destroy ");
            }
        }]);

        return Template;
    }();

    var attributeReflectToPropsMap = {
        "INPUT": ["VALUE"]
    };

    var attributeChangesReflectToProperties = function attributeChangesReflectToProperties(attributeName, nodeName) {
        attributeName = attributeName.toUpperCase();
        nodeName = nodeName.toUpperCase();
        return attributeReflectToPropsMap[nodeName] ? attributeReflectToPropsMap[nodeName].indexOf(attributeName) >= 0 : false;
    };

    var parentTagMap = {
        "col": "colgroup",
        "td": "tr",
        "area": "map",
        "tbody": "table",
        "tfoot": "table",
        "th": "tr",
        "thead": "table",
        "tr": "tbody",
        "caption": "table",
        "colgroup": "table",
        "li": "ul",
        "g": "svg",
        "circle": "svg",
        "rect": "svg",
        "polygon": "svg",
        "eclipse": "svg",
        "text": "svg"
    };

    var isMinimizationAttribute = function isMinimizationAttribute(node) {
        return ["checked", "compact", "declare", "defer", "disabled", "ismap", "noresize", "noshade", "nowrap", "selected"].indexOf(node.nodeName) >= 0;
    };

    var getPath = function getPath(node) {
        if (node.nodeType === Node.ATTRIBUTE_NODE) {
            return getPath(node.ownerElement).concat([{ name: node.nodeName }]);
        }
        var i = 0;
        var child = node;
        while ((child = child.previousSibling) !== null) {
            i++;
        }
        var path = [];
        path.push(i);
        if (node.parentNode && node.parentNode.parentNode) {
            return getPath(node.parentNode).concat(path);
        }
        return path;
    };

    var getNode = function getNode(path, documentFragment) {
        return path.reduce(function (content, path) {
            if (typeof path === "number") {
                return content.childNodes[path];
            } else {
                return content.attributes[path.name];
            }
        }, documentFragment);
    };

    var buildActualAttributeValue = function buildActualAttributeValue(nodeValue, valueIndexes, templateValues) {
        var actualAttributeValue = nodeValue;
        var valFiltered = valueIndexes.map(function (valueIndex) {
            return templateValues[valueIndex];
        });
        valueIndexes.forEach(function (valueIndex, index) {
            actualAttributeValue = actualAttributeValue.replace("<!--" + valueIndex + "-->", valFiltered[index]);
        });
        return actualAttributeValue;
    };

    var HtmlTemplateCollection = function (_Template) {
        _inherits(HtmlTemplateCollection, _Template);

        function HtmlTemplateCollection(items, keyFn, templateFn, context) {
            _classCallCheck(this, HtmlTemplateCollection);

            var _this = _possibleConstructorReturn(this, (HtmlTemplateCollection.__proto__ || Object.getPrototypeOf(HtmlTemplateCollection)).call(this));

            _this.items = items;
            _this.keyFn = typeof keyFn === "string" ? function (item) {
                return item[keyFn];
            } : keyFn;
            _this.templateFn = templateFn;
            _this.context = context;
            _this.keys = [];
            _this.templates = {};
            _this.initialzed = false;
            return _this;
        }

        _createClass(HtmlTemplateCollection, [{
            key: "iterateRight",
            value: function iterateRight(callback) {
                if (!this.initialzed) {
                    var index = this.items.length - 1;
                    while (index >= 0) {
                        var item = this.items[index];
                        var key = this.keyFn.apply(this, [item, index]);
                        var template = this.templateFn.apply(this, [item, index]);
                        if (callback) {
                            callback.apply(null, [item, key, template, index]);
                        }
                        index--;
                        this.keys.push(key);
                        this.templates[key] = template;
                    }
                    this.initialzed = true;
                    this.keys.reverse();
                } else {
                    var _index = this.keys.length - 1;
                    while (_index >= 0) {
                        var _item = this.items[_index];
                        var _key = this.keys[_index];
                        var _template = this.templates[_key];
                        if (callback) {
                            callback.apply(null, [_item, _key, _template, _index]);
                        }
                        _index--;
                    }
                }
            }
        }]);

        return HtmlTemplateCollection;
    }(Template);

    var isMatch = function isMatch(newActualValues, values) {
        if (newActualValues === values) {
            return true;
        } else if (Array.isArray(newActualValues) && Array.isArray(values) && newActualValues.length === values.length) {
            var _isMatch = true;
            for (var i = 0; i < values.length; i++) {
                _isMatch = _isMatch && newActualValues[i] === values[i];
                if (!_isMatch) {
                    return false;
                }
            }
            return true;
        }
        return false;
    };

    var Marker = function () {
        function Marker(node) {
            _classCallCheck(this, Marker);

            this.node = node;
            this.attributes = {};
        }

        _createClass(Marker, null, [{
            key: "from",
            value: function from(node) {
                var element = node;
                if (node.nodeType === Node.ATTRIBUTE_NODE) {
                    element = node.ownerElement;
                }
                element.$data = element.$data || new Marker(element);
                return element.$data;
            }
        }]);

        return Marker;
    }();

    var HtmlTemplate = function (_Template2) {
        _inherits(HtmlTemplate, _Template2);

        function HtmlTemplate(strings, values, context) {
            _classCallCheck(this, HtmlTemplate);

            var _this2 = _possibleConstructorReturn(this, (HtmlTemplate.__proto__ || Object.getPrototypeOf(HtmlTemplate)).call(this));

            _this2.strings = strings;
            _this2.values = values;
            _this2.context = context;
            _this2.key = _this2.strings.join("").trim();
            _this2.nodeValueIndexArray = null;
            _this2.documentFragment = null;
            return _this2;
        }

        _createClass(HtmlTemplate, [{
            key: "buildTemplate",
            value: function buildTemplate(templateString) {
                this.documentFragment = HtmlTemplate.getProperTemplateTag(templateString);
                this.nodeValueIndexArray = this.buildNodeValueIndex(this.documentFragment, this.documentFragment.nodeName);
                HtmlTemplate.applyValues(this, this.nodeValueIndexArray);
            }
        }, {
            key: "buildNodeValueIndex",
            value: function buildNodeValueIndex(documentFragment, documentFragmentNodeName) {
                var childNodes = documentFragment.childNodes;
                var nodeValueIndexArray = [];
                var node = childNodes[0];
                if (undefined === node) {
                    return nodeValueIndexArray;
                }
                do {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        var attributes = node.attributes;
                        var k = attributes.length;
                        for (var attributeIndex = 0; attributeIndex < k; attributeIndex++) {
                            var nodeValue = attributes[attributeIndex].nodeValue;
                            var nodeValueIndexMap = HtmlTemplate.lookNodeValueArray(nodeValue);
                            var valueIndexes = nodeValueIndexMap.map(function (x) {
                                return x.match(/[\w\.]+/)[0];
                            }).map(function (i) {
                                return parseInt(i);
                            });
                            if (valueIndexes && valueIndexes.length > 0) {
                                nodeValueIndexArray.push({ node: attributes[attributeIndex], valueIndexes: valueIndexes, nodeValue: nodeValue });
                            }
                        }
                        nodeValueIndexArray = nodeValueIndexArray.concat(this.buildNodeValueIndex(node, node.nodeName));
                    }
                    if (node.nodeType === Node.TEXT_NODE && documentFragmentNodeName.toUpperCase() === "STYLE") {
                        var _nodeValue = node.nodeValue;
                        var _nodeValueIndexMap = HtmlTemplate.lookNodeValueArray(_nodeValue);
                        var _valueIndexes = _nodeValueIndexMap.map(function (x) {
                            return x.match(/[\w\.]+/)[0];
                        }).map(function (i) {
                            return parseInt(i);
                        });
                        if (_valueIndexes && _valueIndexes.length > 0) {
                            nodeValueIndexArray.push({ node: node, valueIndexes: _valueIndexes, nodeValue: _nodeValue });
                        }
                    }
                    if (node.nodeType === Node.COMMENT_NODE) {
                        var _nodeValue2 = node.nodeValue;
                        node.nodeValue = "outlet";
                        nodeValueIndexArray.push({ node: node, valueIndexes: parseInt(_nodeValue2) });
                    }
                    node = node.nextSibling;
                } while (node);
                return nodeValueIndexArray;
            }
        }, {
            key: "constructTemplate",
            value: function constructTemplate() {
                if (!this.context.hasCache(this.key)) {
                    var templateString = this.buildStringSequence();
                    this.buildTemplate(templateString);
                    return this.context.cache(this.key, this);
                }
                var htmlTemplate = this.context.cache(this.key);
                var promisesPlaceholder = htmlTemplate.documentFragment.querySelectorAll("span[data-async-outlet]");
                var promisesPlaceHolderLength = promisesPlaceholder.length;
                while (promisesPlaceHolderLength--) {
                    var promisePlaceholder = promisesPlaceholder[promisesPlaceHolderLength];
                    if (promisePlaceholder.nextSibling) {
                        var outlet = Outlet.from(promisePlaceholder.nextSibling);
                        outlet.clearContent();
                    }
                }
                return htmlTemplate;
            }
        }, {
            key: "buildStringSequence",
            value: function buildStringSequence() {
                return this.strings.reduce(function (result, string, index) {
                    return index === 0 ? string : result + "<!--" + (index - 1) + "-->" + string;
                }, "").trim();
            }
        }], [{
            key: "lookNodeValueArray",
            value: function lookNodeValueArray(nodeValue) {
                var result = [];
                var pointerStart = nodeValue.indexOf("<!--");
                var pointerEnd = nodeValue.indexOf("-->", pointerStart);

                while (pointerEnd < nodeValue.length && pointerEnd >= 0 && pointerStart >= 0) {
                    result.push(nodeValue.substring(pointerStart + 4, pointerEnd));
                    pointerStart = nodeValue.indexOf("<!--", pointerEnd + 3);
                    pointerEnd = nodeValue.indexOf("-->", pointerStart);
                }
                return result;
            }
        }, {
            key: "getProperTemplateTag",
            value: function getProperTemplateTag(contentText) {
                var openTag = contentText.substring(1, contentText.indexOf(">"));
                openTag = (openTag.indexOf(" ") > 0 ? openTag.substring(0, openTag.indexOf(" ")) : openTag).toLowerCase();
                var rootTag = parentTagMap[openTag];
                rootTag = rootTag || "div";
                var template = rootTag === "svg" ? document.createElementNS("http://www.w3.org/2000/svg", "svg") : document.createElement(rootTag);
                template.innerHTML = contentText;
                return template;
            }
        }, {
            key: "applyValues",
            value: function applyValues(nextHtmlTemplate, nodeValueIndexArray) {
                var newValues = nextHtmlTemplate.values;
                var context = nextHtmlTemplate.context;
                if (!nodeValueIndexArray) {
                    return;
                }
                nodeValueIndexArray.forEach(function (nodeValueIndex) {
                    if (nodeValueIndex == null) {
                        return;
                    }
                    var node = nodeValueIndex.node,
                        valueIndexes = nodeValueIndex.valueIndexes,
                        values = nodeValueIndex.values;

                    var newActualValues = Array.isArray(valueIndexes) ? valueIndexes.map(function (valueIndex) {
                        return newValues[valueIndex];
                    }) : newValues[valueIndexes];

                    var nodeName = node.nodeName;
                    var isEvent = node.nodeType === Node.ATTRIBUTE_NODE && nodeName.indexOf("on") === 0;

                    // if values are match, or ifts named eventListener then we dont need to perform update
                    if (isMatch(newActualValues, values) || isEvent && newActualValues[0].name) {
                        return;
                    }
                    if (node.nodeType === Node.ATTRIBUTE_NODE) {
                        var marker = Marker.from(node);
                        var nodeValue = nodeValueIndex.nodeValue;
                        if (isEvent) {
                            var valueIndex = valueIndexes[0];
                            node.ownerElement[nodeName] = newValues[valueIndex];
                            marker.attributes[nodeName] = newValues[valueIndex];
                        } else {
                            var plugOrPromiseValue = newValues.reduce(function (plugOrPromise, newValue, index) {
                                if (newValue instanceof Plug || isPromise(newValue)) {
                                    plugOrPromise.push({ index: index, value: newValue });
                                }
                                return plugOrPromise;
                            }, []);

                            if (plugOrPromiseValue.length > 0) {
                                node.ownerElement.id = node.ownerElement.id || uuidv4();
                                var id = node.ownerElement.id;
                                context.addEventListener(Event.SYNCING_DONE, function () {
                                    var node = document.getElementById(id);
                                    if (!node) {
                                        node = context.root.getElementsByTagName("*")[id];
                                    }
                                    plugOrPromiseValue.forEach(function (_ref) {
                                        var index = _ref.index,
                                            value = _ref.value;

                                        var valueIndex = index;
                                        var attributeNode = node.getAttributeNode(nodeName);

                                        var setContent = function setContent(value) {
                                            var marker = Marker.from(node);
                                            var _marker$attributes$no = marker.attributes[nodeName],
                                                template = _marker$attributes$no.nodeValue,
                                                valueIndexes = _marker$attributes$no.valueIndexes,
                                                templateValue = _marker$attributes$no.newValues;

                                            newValues[valueIndex] = value;
                                            HtmlTemplate.updateAttributeValue(nodeValue, valueIndexes, newValues, attributeNode);
                                        };

                                        if (value instanceof Plug) {
                                            value.factory.apply(null, [{
                                                node: attributeNode,
                                                name: nodeName,
                                                getContent: function getContent() {
                                                    var marker = Marker.from(node);
                                                    var templateValue = marker.attributes[nodeName].newValues;

                                                    return newValues[valueIndex];
                                                },
                                                setContent: setContent
                                            }]);
                                        }
                                        if (isPromise(value)) {
                                            value.then(setContent);
                                        }
                                    });
                                });
                            } else {
                                HtmlTemplate.updateAttributeValue(nodeValue, valueIndexes, newValues, node);
                            }
                            marker.attributes[nodeName] = { template: nodeValue, valueIndexes: valueIndexes, templateValue: newValues };
                        }
                    }
                    if (node.nodeType === Node.TEXT_NODE) {
                        node.nodeValue = buildActualAttributeValue(nodeValueIndex.nodeValue, valueIndexes, newValues);
                    }
                    if (node.nodeType === Node.COMMENT_NODE) {
                        var value = newValues[valueIndexes];
                        Outlet.from(node).setContent(value, context);
                    }
                    nodeValueIndex.values = newActualValues;
                });
            }
        }, {
            key: "updateAttributeValue",
            value: function updateAttributeValue(attributeValue, valueIndexes, newValues, attributeNode) {
                var nodeName = attributeNode.nodeName;
                var actualAttributeValue = buildActualAttributeValue(attributeValue, valueIndexes, newValues);
                if (isMinimizationAttribute(attributeNode)) {
                    attributeNode.ownerElement[nodeName] = actualAttributeValue.trim() === "true";
                    attributeNode.ownerElement.setAttribute(nodeName, "");
                } else {
                    attributeNode.ownerElement.setAttribute(nodeName, actualAttributeValue);
                    if (attributeChangesReflectToProperties(nodeName, attributeNode.ownerElement.nodeName)) {
                        attributeNode.ownerElement[nodeName] = actualAttributeValue;
                    }
                }
                if (nodeName.indexOf(".bind") >= 0) {
                    var attributeName = nodeName.substring(0, nodeName.indexOf(".bind"));
                    attributeNode.ownerElement.setAttribute(attributeName, actualAttributeValue);
                    attributeNode.ownerElement.removeAttribute(nodeName);
                }
                return actualAttributeValue;
            }
        }]);

        return HtmlTemplate;
    }(Template);

    var Context = function () {
        function Context() {
            var _this3 = this;

            _classCallCheck(this, Context);

            this.cacheInstance = {};
            this.syncCallbackStack = [];
            this.html = function (strings) {
                for (var _len = arguments.length, values = Array(_len > 1 ? _len - 1 : 0), _key2 = 1; _key2 < _len; _key2++) {
                    values[_key2 - 1] = arguments[_key2];
                }

                return new HtmlTemplate(strings, values, _this3);
            };
            this.htmlCollection = function (arrayItems, keyFn, templateFn) {
                return new HtmlTemplateCollection(arrayItems, keyFn, templateFn, _this3);
            };
            this.listeners = {};
        }

        _createClass(Context, [{
            key: "hasCache",
            value: function hasCache(key) {
                return key in this.cacheInstance;
            }
        }, {
            key: "cache",
            value: function cache(key, data) {
                if (!this.hasCache(key)) {
                    this.cacheInstance[key] = data;
                }
                return this.cacheInstance[key];
            }
        }, {
            key: "addSyncCallback",
            value: function addSyncCallback(callback) {
                this.syncCallbackStack.push(callback);
            }
        }, {
            key: "addEventListener",
            value: function addEventListener(event, callback) {
                var calledOnce = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

                var token = event + ":" + uuidv4();
                this.listeners[event] = this.listeners[event] || [];
                var listener = this.listeners[event];
                listener.push({ token: token, callback: callback, calledOnce: calledOnce });
                return token;
            }
        }, {
            key: "removeEventListener",
            value: function removeEventListener(token) {
                var _token$split = token.split(":"),
                    _token$split2 = _slicedToArray(_token$split, 2),
                    event = _token$split2[0],
                    tokenId = _token$split2[1];

                var listener = this.listeners[event];
                listener = listener.filter(function (callbackItem) {
                    return callbackItem.token != tokenId;
                });
                this.listeners[event] = listener;
            }
        }, {
            key: "dispatchEvent",
            value: function dispatchEvent(event) {
                for (var _len2 = arguments.length, payload = Array(_len2 > 1 ? _len2 - 1 : 0), _key3 = 1; _key3 < _len2; _key3++) {
                    payload[_key3 - 1] = arguments[_key3];
                }

                if (!(event in this.listeners)) {
                    return;
                }
                var listener = this.listeners[event];

                var markForRemoval = [];
                listener.forEach(function (callbackItem) {
                    callbackItem.callback.apply(null, payload);
                    if (callbackItem.calledOnce) {
                        var _callbackItem$token$s = callbackItem.token.split(":"),
                            _callbackItem$token$s2 = _slicedToArray(_callbackItem$token$s, 2),
                            _event = _callbackItem$token$s2[0],
                            tokenId = _callbackItem$token$s2[1];

                        markForRemoval.push(tokenId);
                    }
                });
                if (markForRemoval.length > 0) {
                    listener = listener.filter(function (callbackItem) {
                        return markForRemoval.indexOf(callbackItem.token) < 0;
                    });
                }
                this.listeners[event] = listener;
            }
        }, {
            key: "clearSyncCallbacks",
            value: function clearSyncCallbacks() {
                this.syncCallbackStack.forEach(function (callback) {
                    return callback.apply();
                });
                this.syncCallbackStack = [];
                this.dispatchEvent(Event.SYNCING_DONE);
            }
        }]);

        return Context;
    }();

    var getTemporaryOutlet = function getTemporaryOutlet(id, context) {
        var templateContent = document.getElementById(id);
        if (!templateContent) {
            templateContent = context.root.getElementsByTagName("*")[id];
        }
        if (templateContent) {
            var commentNode = templateContent.nextSibling;
            templateContent.remove();
            return Outlet.from(commentNode);
        }
        return false;
    };

    var Outlet = function () {
        function Outlet(commentNode) {
            _classCallCheck(this, Outlet);

            this.commentNode = commentNode;
            this.content = null;
        }

        _createClass(Outlet, [{
            key: "constructTextContent",
            value: function constructTextContent() {
                this.content = this.commentNode.previousSibling;
            }
        }, {
            key: "constructHtmlTemplateCollectionContent",
            value: function constructHtmlTemplateCollectionContent(htmlTemplateCollection) {
                var _this4 = this;

                this.content = new HtmlTemplateCollectionInstance(htmlTemplateCollection, this);
                this.content.instance = {};
                var pointer = this.commentNode;
                htmlTemplateCollection.iterateRight(function (item, key) {
                    do {
                        pointer = pointer.previousSibling;
                    } while (pointer.nodeType !== Node.COMMENT_NODE && pointer.nodeValue !== "outlet-child");
                    _this4.content.instance[key] = pointer;
                });
            }
        }, {
            key: "constructHtmlTemplateContent",
            value: function constructHtmlTemplateContent(htmlTemplate) {
                if (htmlTemplate === undefined) {
                    return;
                }
                var childNodesLength = htmlTemplate.context.cache(htmlTemplate.key).documentFragment.childNodes.length;
                this.content = new HtmlTemplateInstance(htmlTemplate, this);
                var sibling = this.commentNode;
                while (childNodesLength--) {
                    sibling = sibling.previousSibling;
                    this.content.instance.push(sibling);
                }
                this.content.instance.reverse();
            }
        }, {
            key: "makeTemporaryOutlet",
            value: function makeTemporaryOutlet(context) {
                var id = uuidv4();
                this.setHtmlTemplateContent(context.html(_templateObject, id));
                return id;
            }
        }, {
            key: "setContent",
            value: function setContent(template, context) {
                var _this5 = this;

                if (isPromise(template)) {
                    if (this.content === null) {
                        var id = this.makeTemporaryOutlet(context);
                        template.then(function (result) {
                            var outlet = getTemporaryOutlet(id, context);
                            if (outlet) {
                                outlet.setContent(result);
                                syncNode(result, outlet.commentNode);
                            }
                        });
                    } else {
                        template.then(function (result) {
                            _this5.setContent(result);
                        });
                    }
                } else if (template instanceof Plug) {
                    if (this.content === null) {
                        var _id = this.makeTemporaryOutlet(context);
                        context.addEventListener(Event.SYNCING_DONE, function () {
                            var outlet = getTemporaryOutlet(_id, context);
                            if (outlet) {
                                template.factory.apply(null, [{
                                    getContent: function getContent() {
                                        return outlet.currentContent;
                                    },
                                    setContent: function setContent(value) {
                                        outlet.setContent.apply(outlet, [value]);
                                        outlet.currentContent = value;
                                    }
                                }]);
                            }
                        }, true);
                    } else {
                        var _self = this;
                        template.factory.apply(null, [{
                            getContent: function getContent() {
                                return _self.currentContent;
                            },
                            setContent: function setContent(value) {
                                _self.setContent.apply(_self, [value]);
                                _self.currentContent = value;
                            }
                        }]);
                    }
                } else if (template instanceof HtmlTemplate) {
                    this.setHtmlTemplateContent(template);
                } else if (template instanceof HtmlTemplateCollection) {
                    this.setHtmlTemplateCollectionContent(template);
                } else {
                    this.setTextContent(template);
                }
            }
        }, {
            key: "setTextContent",
            value: function setTextContent(text) {
                if (this.content instanceof Text) {
                    this.content.nodeValue = text;
                } else {
                    this.clearContent();
                    this.content = document.createTextNode(text);
                    this.commentNode.parentNode.insertBefore(this.content, this.commentNode);
                }
            }
        }, {
            key: "setHtmlTemplateCollectionContent",
            value: function setHtmlTemplateCollectionContent(htmlTemplateCollection) {
                var clearContentWasCalled = false;
                if (this.content && !(this.content instanceof HtmlTemplateCollectionInstance)) {
                    clearContentWasCalled = true;
                    this.clearContent();
                }
                this.content = this.content || new HtmlTemplateCollectionInstance(htmlTemplateCollection, this);
                this.content.applyValues(htmlTemplateCollection);
                if (clearContentWasCalled) {
                    syncNode(htmlTemplateCollection, this.commentNode);
                }
            }
        }, {
            key: "setHtmlTemplateContent",
            value: function setHtmlTemplateContent(htmlTemplate) {
                var clearContentWasCalled = false;
                var contentHasSameKey = this.content && this.content instanceof HtmlTemplateInstance ? this.content.template.key === htmlTemplate.key : false;
                if (this.content !== null && !contentHasSameKey) {
                    this.clearContent();
                    clearContentWasCalled = true;
                }
                if (!this.content) {
                    var template = htmlTemplate.constructTemplate();
                    this.content = new HtmlTemplateInstance(template, this);
                }
                this.content.applyValues(htmlTemplate);
                if (clearContentWasCalled) {
                    syncNode(htmlTemplate, this.commentNode);
                }
            }
        }, {
            key: "clearContent",
            value: function clearContent() {
                if (this.content !== null) {
                    if (this.content instanceof Template) {
                        this.content.destroy();
                    } else {
                        this.content.remove();
                    }
                    this.content = null;
                }
            }
        }, {
            key: "firstChildNode",
            value: function firstChildNode() {
                if (this.content instanceof HtmlTemplateInstance) {
                    return this.content.instance[0];
                } else if (this.content instanceof HtmlTemplateCollectionInstance) {
                    var firstKey = this.content.template.keys[0];
                    var outlet = Outlet.from(this.content.instance[firstKey]);
                    return outlet.firstChildNode();
                } else {
                    return this.content;
                }
            }
        }, {
            key: "validateInstancePosition",
            value: function validateInstancePosition() {
                if (this.content instanceof HtmlTemplateInstance) {
                    this.content.instance.reduceRight(function (pointer, ctn) {
                        if (pointer.previousSibling !== ctn) {
                            pointer.parentNode.insertBefore(ctn, pointer);
                        }
                        return ctn;
                    }, this.commentNode);
                } else if (this.content instanceof HtmlTemplateCollectionInstance) {
                    // not required since we already sync when rendering
                } else {
                    if (this.commentNode.previousSibling !== this.content) {
                        this.commentNode.parentNode.insertBefore(this.content, this.commentNode);
                    }
                }
            }
        }], [{
            key: "from",
            value: function from(node) {
                if (node instanceof Comment) {
                    node.$data = node.$data || new Outlet(node);
                    return node.$data;
                } else {
                    if (!node.$outlet) {
                        node.$outlet = document.createComment("outlet");
                        node.appendChild(node.$outlet);
                    }
                    return Outlet.from(node.$outlet);
                }
            }
        }]);

        return Outlet;
    }();

    var HtmlTemplateCollectionInstance = function (_Template3) {
        _inherits(HtmlTemplateCollectionInstance, _Template3);

        function HtmlTemplateCollectionInstance(templateCollection, outlet) {
            _classCallCheck(this, HtmlTemplateCollectionInstance);

            var _this6 = _possibleConstructorReturn(this, (HtmlTemplateCollectionInstance.__proto__ || Object.getPrototypeOf(HtmlTemplateCollectionInstance)).call(this));

            _this6.template = templateCollection;
            _this6.outlet = outlet;
            _this6.instance = null;
            return _this6;
        }

        _createClass(HtmlTemplateCollectionInstance, [{
            key: "applyValues",
            value: function applyValues(newHtmlTemplateCollection) {
                var _this7 = this;

                var context = newHtmlTemplateCollection.context;
                if (this.instance === null) {
                    this.instance = {};
                    var outletPointer = this.outlet.commentNode;
                    newHtmlTemplateCollection.iterateRight(function (item, key, template) {
                        var childPlaceholder = Outlet.from(document.createComment("outlet-child"));
                        outletPointer.parentNode.insertBefore(childPlaceholder.commentNode, outletPointer);
                        Outlet.from(childPlaceholder.commentNode).setContent(template, context);
                        outletPointer = childPlaceholder.firstChildNode();
                        _this7.instance[key] = childPlaceholder.commentNode;
                    });
                } else {
                    newHtmlTemplateCollection.iterateRight();
                    if (newHtmlTemplateCollection.items.length === 0) {
                        if (this.outlet.commentNode.parentNode.$htmlCollectionInstanceChild && this.outlet.commentNode.parentNode.$htmlCollectionInstanceChild.length === 1) {
                            var parentNode = this.outlet.commentNode.parentNode;
                            parentNode.innerText = "";
                            parentNode.appendChild(this.outlet.commentNode);
                            this.instance = {};
                        }
                    } else {
                        var oldHtmlTemplateCollection = this.template;
                        oldHtmlTemplateCollection.keys.forEach(function (key) {
                            var keyIsDeleted = newHtmlTemplateCollection.keys.indexOf(key) < 0;
                            if (keyIsDeleted) {
                                var commentNode = _this7.instance[key];
                                Outlet.from(commentNode).clearContent();
                                commentNode.remove();
                                delete _this7.instance[key];
                            }
                        });
                    }
                    var _outletPointer = this.outlet.commentNode;
                    newHtmlTemplateCollection.iterateRight(function (item, key, template) {
                        var commentNode = _this7.instance[key];
                        if (commentNode) {
                            var childOutlet = Outlet.from(commentNode);
                            childOutlet.setContent(template);
                            if (_outletPointer.previousSibling !== commentNode) {
                                _outletPointer.parentNode.insertBefore(commentNode, _outletPointer);
                                childOutlet.validateInstancePosition();
                            }
                            _outletPointer = childOutlet.firstChildNode();
                        } else {
                            var childPlaceholder = Outlet.from(document.createComment("outlet-child"));
                            _outletPointer.parentNode.insertBefore(childPlaceholder.commentNode, _outletPointer);
                            Outlet.from(childPlaceholder.commentNode).setContent(template, context);
                            _outletPointer = childPlaceholder.firstChildNode();
                            _this7.instance[key] = childPlaceholder.commentNode;
                            _this7.template.context.addSyncCallback(function () {
                                return syncNode(template, childPlaceholder.commentNode);
                            });
                        }
                    });
                    this.template = newHtmlTemplateCollection;
                }
            }
        }, {
            key: "destroy",
            value: function destroy() {
                var _this8 = this;

                this.template.keys.forEach(function (key) {
                    var childPlaceholderCommentNode = _this8.instance[key];
                    Outlet.from(childPlaceholderCommentNode).clearContent();
                    childPlaceholderCommentNode.remove();
                    delete _this8.instance[key];
                });

                this.outlet = null;
                this.instance = null;
                this.template = null;
            }
        }]);

        return HtmlTemplateCollectionInstance;
    }(Template);

    var HtmlTemplateInstance = function (_Template4) {
        _inherits(HtmlTemplateInstance, _Template4);

        function HtmlTemplateInstance(template, outlet) {
            _classCallCheck(this, HtmlTemplateInstance);

            var _this9 = _possibleConstructorReturn(this, (HtmlTemplateInstance.__proto__ || Object.getPrototypeOf(HtmlTemplateInstance)).call(this));

            _this9.template = template;
            _this9.outlet = outlet;
            _this9.instance = [];
            _this9.nodeValueIndexArray = null;
            return _this9;
        }

        _createClass(HtmlTemplateInstance, [{
            key: "applyValues",
            value: function applyValues(newHtmlTemplate) {
                if (this.instance === null || this.instance.length === 0) {
                    HtmlTemplate.applyValues(newHtmlTemplate, this.template.nodeValueIndexArray);
                    var documentFragment = this.template.documentFragment;
                    var cloneNode = cloneNodeTree(documentFragment);
                    var commentNode = this.outlet.commentNode;
                    var cloneChildNode = cloneNode.childNodes[0];
                    var nextSibling = null;
                    do {
                        this.instance.push(cloneChildNode);
                        nextSibling = cloneChildNode.nextSibling;
                        commentNode.parentNode.insertBefore(cloneChildNode, commentNode);
                        cloneChildNode = nextSibling;
                    } while (cloneChildNode);
                } else if (this.nodeValueIndexArray) {
                    HtmlTemplate.applyValues(newHtmlTemplate, this.nodeValueIndexArray);
                }
            }
        }, {
            key: "destroy",
            value: function destroy() {
                this.instance.forEach(function (instance) {
                    return instance.remove();
                });
                this.nodeValueIndexArray = null;
                this.outlet = null;
                this.template = null;
            }
        }]);

        return HtmlTemplateInstance;
    }(Template);

    var validateIsFunction = function validateIsFunction(functionToCheck, error) {
        var isFunction = functionToCheck && typeof functionToCheck === 'function';
        if (!isFunction) {
            throw new Error(error);
        }
    };

    var applyAttributeValue = function applyAttributeValue(actualNode, valueIndexes, templateValues, nodeValue) {
        var marker = Marker.from(actualNode);
        var nodeName = actualNode.nodeName;
        var isEvent = nodeName.indexOf("on") === 0;
        if (isEvent) {
            var valueIndex = valueIndexes[0];
            validateIsFunction(templateValues[valueIndex], "Event listener " + actualNode.nodeName + " should be a function (event) => {}'");
            marker.attributes[nodeName] = templateValues[valueIndex];
            actualNode.ownerElement.setAttribute(nodeName, "return false;");
            actualNode.ownerElement[nodeName] = templateValues[valueIndex];
        } else {
            marker.attributes[nodeName] = {
                template: nodeValue,
                valueIndexes: valueIndexes,
                templateValue: templateValues
            };
        }
    };

    var applyOutletValue = function applyOutletValue(actualNode, templateValues, valueIndexes) {
        var outlet = Outlet.from(actualNode);
        var value = templateValues[valueIndexes];
        if (value instanceof HtmlTemplate) {
            outlet.constructHtmlTemplateContent(value);
            syncNode(value, outlet.commentNode);
        } else if (value instanceof HtmlTemplateCollection) {
            outlet.constructHtmlTemplateCollectionContent(value);
            syncNode(value, outlet.commentNode);
        } else {
            outlet.constructTextContent();
        }
    };

    var mapNodeValueIndexArray = function mapNodeValueIndexArray(nodeValueIndex, docFragment) {
        var templateValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
        var nodeValue = nodeValueIndex.nodeValue,
            valueIndexes = nodeValueIndex.valueIndexes;

        var path = getPath(nodeValueIndex.node);
        var actualNode = getNode(path, docFragment);
        if (!actualNode) {
            return;
        }
        var values = Array.isArray(valueIndexes) ? valueIndexes.map(function (index) {
            return templateValues[index];
        }) : templateValues[valueIndexes];
        var isStyleNode = actualNode.parentNode && actualNode.parentNode.nodeName.toUpperCase() === "STYLE";
        if (isStyleNode) {
            return { node: actualNode, valueIndexes: valueIndexes, nodeValue: nodeValue, values: values };
        } else if (actualNode.nodeType === Node.ATTRIBUTE_NODE) {
            applyAttributeValue(actualNode, valueIndexes, templateValues, nodeValue);
            return { node: actualNode, valueIndexes: valueIndexes, nodeValue: nodeValue, values: values };
        } else {
            applyOutletValue(actualNode, templateValues, valueIndexes);
            return { node: actualNode, valueIndexes: valueIndexes, values: values };
        }
    };

    var syncNode = function syncNode(nextTemplate, node) {
        var outlet = Outlet.from(node);
        if (outlet.content && outlet.content instanceof HtmlTemplateInstance) {
            var htmlTemplateInstance = outlet.content;
            var originalTemplate = htmlTemplateInstance.template;
            var templateValues = nextTemplate.values;
            var docFragment = { childNodes: htmlTemplateInstance.instance };
            if (originalTemplate.nodeValueIndexArray === null) {
                var cacheTemplate = originalTemplate.context.cache(originalTemplate.key);
                docFragment = { childNodes: outlet.content.instance };
                htmlTemplateInstance.nodeValueIndexArray = cacheTemplate.nodeValueIndexArray.map(function (nodeValueIndex) {
                    return mapNodeValueIndexArray(nodeValueIndex, docFragment, templateValues);
                });
            } else {
                htmlTemplateInstance.nodeValueIndexArray = originalTemplate.nodeValueIndexArray.map(function (nodeValueIndex) {
                    return mapNodeValueIndexArray(nodeValueIndex, docFragment, templateValues);
                });
            }
        }
        if (outlet.content && outlet.content instanceof HtmlTemplateCollectionInstance) {
            var htmlTemplateCollectionInstance = outlet.content;
            var templates = htmlTemplateCollectionInstance.template.templates;
            var keys = htmlTemplateCollectionInstance.template.keys;
            outlet.commentNode.parentNode.$htmlCollectionInstanceChild = outlet.commentNode.parentNode.$htmlCollectionInstanceChild || [];
            outlet.commentNode.parentNode.$htmlCollectionInstanceChild.push(outlet.commentNode);
            keys.forEach(function (key) {
                var template = templates[key];
                var commentNode = htmlTemplateCollectionInstance.instance[key];
                var outlet = Outlet.from(commentNode);
                if (outlet.content === null) {
                    if (template instanceof HtmlTemplate) {
                        outlet.constructHtmlTemplateContent(template.context.cache(template.key));
                        syncNode(template, commentNode);
                    }
                } else {
                    if (outlet.content instanceof HtmlTemplateInstance) {
                        syncNode(template, commentNode);
                    }
                }
            });
        }
    };

    var syncContent = function syncContent(templateValue, node) {
        if (!node.$synced) {
            syncNode(templateValue, node);
            node.$synced = true;
        }
    };
    var setContent = function setContent(templateValue, node) {
        templateValue.context.root = templateValue.context.root || node;
        Outlet.from(node).setContent(templateValue);
    };

    var executeWithIdleCallback = function executeWithIdleCallback(callback) {
        if ("requestIdleCallback" in window) {
            requestIdleCallback(callback);
        } else {
            callback();
        }
    };
    var executeWithRequestAnimationFrame = function executeWithRequestAnimationFrame(callback) {
        if ("requestAnimationFrame" in window) {
            requestAnimationFrame(callback);
        } else {
            callback();
        }
    };

    var render = function render(templateValue, node) {
        var immediateEffect = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

        if ("Promise" in window) {
            return new Promise(function (resolve) {
                var update = function update() {
                    setContent.apply(null, [templateValue, node]);
                    resolve();
                };
                if (immediateEffect) {
                    executeWithRequestAnimationFrame(update);
                } else {
                    executeWithIdleCallback(update);
                }
            }).then(function () {
                return new Promise(function (resolve) {
                    executeWithIdleCallback(function () {
                        syncContent.apply(null, [templateValue, node]);
                        resolve();
                    });
                });
            }).then(function () {
                return new Promise(function (resolve) {
                    executeWithIdleCallback(function () {
                        templateValue.context.clearSyncCallbacks();
                        resolve();
                    });
                });
            });
        } else {
            var thencallback = { then: function then() {} };
            setTimeout(function () {
                setContent(templateValue, node);
                syncContent(templateValue, node);
                templateValue.context.clearSyncCallbacks();
                thencallback.then.apply(null, []);
            }, 0);
            return thencallback;
        }
    };

    var Plug = function Plug(factory) {
        _classCallCheck(this, Plug);

        this.factory = factory;
    };

    var plug = function plug(callback) {
        return new Plug(callback);
    };

    return { Context: Context, render: render, plug: plug, uuidv4: uuidv4, Event: Event };
});