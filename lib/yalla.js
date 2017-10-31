'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

var isChrome = !!window.chrome && !!window.chrome.webstore;

var Context = function () {
    function Context() {
        var _this = this;

        _classCallCheck(this, Context);

        this._cache = {};
        this._synccallbacks = [];
        this.html = function (strings) {
            for (var _len = arguments.length, values = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                values[_key - 1] = arguments[_key];
            }

            return new HtmlTemplate(strings, values, _this);
        };
        this.htmlCollection = function (arrayItems, keyFn, templateFn) {
            return new HtmlTemplateCollection(arrayItems, keyFn, templateFn, _this);
        };
    }

    _createClass(Context, [{
        key: 'hasCache',
        value: function hasCache(key) {
            return key in this._cache;
        }
    }, {
        key: 'cache',
        value: function cache(key, data) {
            if (!this.hasCache(key)) {
                this._cache[key] = data;
            }
            return this._cache[key];
        }
    }, {
        key: 'addSyncCallback',
        value: function addSyncCallback(callback) {
            this._synccallbacks.push(callback);
        }
    }, {
        key: 'clearSyncCallbacks',
        value: function clearSyncCallbacks() {
            this._synccallbacks.forEach(function (cb) {
                cb.apply();
            });
            this._synccallbacks = [];
        }
    }]);

    return Context;
}();

/**
 * Deep clone node is broken in IE, following for the fix
 */


var cloneNodeDeep = function cloneNodeDeep(node) {
    if (isChrome) {
        return node.cloneNode(true);
    } else {
        var clone = node.nodeType == 3 ? document.createTextNode(node.nodeValue) : node.cloneNode(false);
        var child = node.firstChild;
        while (child) {
            clone.appendChild(cloneNodeDeep(child));
            child = child.nextSibling;
        }
        return clone;
    }
};

var Template = function () {
    function Template() {
        _classCallCheck(this, Template);
    }

    _createClass(Template, [{
        key: 'destroy',
        value: function destroy() {
            console.log('WARNING NOT IMPLEMENTED YET ');
        }
    }]);

    return Template;
}();

var TEMPLATE_ROOT = {
    'col': 'colgroup',
    'td': 'tr',
    'area': 'map',
    'tbody': 'table',
    'tfoot': 'table',
    'th': 'tr',
    'thead': 'table',
    'tr': 'tbody',
    'caption': 'table',
    'colgroup': 'table',
    'li': 'ul'
};

var isMinimizationAttribute = function isMinimizationAttribute(node) {
    return ['checked', 'compact', 'declare', 'defer', 'disabled', 'ismap', 'noresize', 'noshade', 'nowrap', 'selected'].indexOf(node.nodeName) >= 0;
};

var HtmlTemplateCollectionInstance = function (_Template) {
    _inherits(HtmlTemplateCollectionInstance, _Template);

    function HtmlTemplateCollectionInstance(templateCollection, placeholder) {
        _classCallCheck(this, HtmlTemplateCollectionInstance);

        var _this2 = _possibleConstructorReturn(this, (HtmlTemplateCollectionInstance.__proto__ || Object.getPrototypeOf(HtmlTemplateCollectionInstance)).call(this));

        _this2.template = templateCollection;
        _this2.placeholder = placeholder;
        _this2.instance = null;
        return _this2;
    }

    _createClass(HtmlTemplateCollectionInstance, [{
        key: 'applyValues',
        value: function applyValues(newHtmlTemplateCollection) {
            var _this3 = this;

            if (this.instance === null) {
                this.instance = {};
                var placeholderPointer = this.placeholder.commentNode;
                newHtmlTemplateCollection.iterateRight(function (item, key, template) {
                    var childPlaceholder = Placeholder.from(document.createComment('placeholder-child'));
                    placeholderPointer.parentNode.insertBefore(childPlaceholder.commentNode, placeholderPointer);
                    renderTemplate(template, childPlaceholder.commentNode);
                    placeholderPointer = childPlaceholder.firstChildNode();
                    _this3.instance[key] = childPlaceholder.commentNode;
                });
            } else {

                newHtmlTemplateCollection.iterateRight();
                var oldHtmlTemplateCollection = this.template;

                oldHtmlTemplateCollection.keys.forEach(function (key) {
                    var keyIsDeleted = newHtmlTemplateCollection.keys.indexOf(key) < 0;
                    if (keyIsDeleted) {
                        var commentNode = _this3.instance[key];
                        Placeholder.from(commentNode).clearContent();
                        commentNode.parentNode.removeChild(commentNode);
                        delete _this3.instance[key];
                    }
                });

                var _placeholderPointer = this.placeholder.commentNode;
                newHtmlTemplateCollection.iterateRight(function (item, key, template) {
                    var commentNode = _this3.instance[key];
                    if (commentNode) {
                        var childPlaceholder = Placeholder.from(commentNode);
                        if (childPlaceholder.content instanceof HtmlTemplateInstance) {
                            childPlaceholder.setHtmlTemplateContent(template);
                        } else if (childPlaceholder.content instanceof HtmlTemplateCollectionInstance) {
                            childPlaceholder.setHtmlTemplateCollectionContent(template);
                        } else {
                            childPlaceholder.setTextContent(template);
                        }
                        if (_placeholderPointer.previousSibling != commentNode) {
                            _placeholderPointer.parentNode.insertBefore(commentNode, _placeholderPointer);
                            childPlaceholder.validateInstancePosition();
                        }
                        _placeholderPointer = childPlaceholder.firstChildNode();
                    } else {
                        var _childPlaceholder = Placeholder.from(document.createComment('placeholder-child'));
                        _placeholderPointer.parentNode.insertBefore(_childPlaceholder.commentNode, _placeholderPointer);
                        renderTemplate(template, _childPlaceholder.commentNode);
                        _placeholderPointer = _childPlaceholder.firstChildNode();
                        _this3.instance[key] = _childPlaceholder.commentNode;
                        _this3.template.context.addSyncCallback(function () {
                            syncNode(template, _childPlaceholder.commentNode);
                        });
                    }
                });
                this.template = newHtmlTemplateCollection;
            }
        }
    }, {
        key: 'destroy',
        value: function destroy() {
            var _this4 = this;

            this.template.getKeys().forEach(function (key) {
                var childPlaceholderCommentNode = _this4.instance[key];
                var childPlaceholder = Placeholder.from(childPlaceholderCommentNode);
                if (childPlaceholder.content instanceof Template) {
                    childPlaceholder.content.destroy();
                } else {
                    childPlaceholder.content.parentNode.removeChild(childPlaceholder.content);
                }
                childPlaceholderCommentNode.parentNode.removeChild(childPlaceholderCommentNode);
                delete _this4.instance[key];
            });

            this.placeholder = null;
            this.instance = null;
            this.template = null;
        }
    }]);

    return HtmlTemplateCollectionInstance;
}(Template);

var HtmlTemplateInstance = function (_Template2) {
    _inherits(HtmlTemplateInstance, _Template2);

    function HtmlTemplateInstance(template, placeholder) {
        _classCallCheck(this, HtmlTemplateInstance);

        var _this5 = _possibleConstructorReturn(this, (HtmlTemplateInstance.__proto__ || Object.getPrototypeOf(HtmlTemplateInstance)).call(this));

        _this5.template = template;
        _this5.placeholder = placeholder;
        _this5.instance = [];
        _this5.nodeValueIndexArray = null;
        return _this5;
    }

    _createClass(HtmlTemplateInstance, [{
        key: 'applyValues',
        value: function applyValues(newHtmlTemplate) {
            if (this.instance === null || this.instance.length === 0) {
                HtmlTemplate.applyValues(newHtmlTemplate, this.template.nodeValueIndexArray);
                var documentFragment = this.template.documentFragment;
                var cloneNode = cloneNodeDeep(documentFragment);
                var commentNode = this.placeholder.commentNode;
                var cloneChildNode = cloneNode.childNodes[0];
                var nextSibling = null;
                do {
                    this.instance.push(cloneChildNode);
                    nextSibling = cloneChildNode.nextSibling;
                    commentNode.parentNode.insertBefore(cloneChildNode, commentNode);
                } while (cloneChildNode = nextSibling);
            } else if (this.nodeValueIndexArray) {
                HtmlTemplate.applyValues(newHtmlTemplate, this.nodeValueIndexArray);
            }
        }
    }, {
        key: 'destroy',
        value: function destroy() {
            this.instance.forEach(function (i) {
                return i.parentNode.removeChild(i);
            });
            this.nodeValueIndexArray = null;
            this.placeholder = null;
            this.template = null;
        }
    }]);

    return HtmlTemplateInstance;
}(Template);

/*
 Function to take the path of a node up in documentFragment
 */


function getPath(node) {
    if (node.nodeType === Node.ATTRIBUTE_NODE) {
        return getPath(node.ownerElement).concat([{ name: node.nodeName }]);
    }
    var i = 0;
    var child = node;
    while ((child = child.previousSibling) != null) {
        i++;
    }
    var path = [];
    path.push(i);
    if (node.parentNode && node.parentNode.parentNode) {
        return getPath(node.parentNode).concat(path);
    }
    return path;
}

function getNode(path, documentFragment) {
    var node = path.reduce(function (content, path) {
        if (typeof path == 'number') {
            return content.childNodes[path];
        } else {
            var attribute = content.attributes[path.name];
            return attribute;
        }
    }, documentFragment);
    return node;
}

var HtmlTemplateCollection = function (_Template3) {
    _inherits(HtmlTemplateCollection, _Template3);

    function HtmlTemplateCollection(items, keyFn, templateFn, context) {
        _classCallCheck(this, HtmlTemplateCollection);

        var _this6 = _possibleConstructorReturn(this, (HtmlTemplateCollection.__proto__ || Object.getPrototypeOf(HtmlTemplateCollection)).call(this));

        _this6.items = items;
        _this6.keyFn = typeof keyFn === 'string' ? function (item) {
            return item[keyFn];
        } : keyFn;
        _this6.templateFn = templateFn;
        _this6.context = context;
        _this6.keys = [];
        _this6.templates = {};
        _this6.initialzed = false;
        return _this6;
    }

    _createClass(HtmlTemplateCollection, [{
        key: 'iterateRight',
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
                    var _key2 = this.keys[_index];
                    var _template = this.templates[_key2];
                    if (callback) {
                        callback.apply(null, [_item, _key2, _template, _index]);
                    }
                    _index--;
                }
            }
        }
    }, {
        key: 'getKeys',
        value: function getKeys() {
            if (!this.initialzed) {
                throw new Error('Yikes its not initialized yet');
            }
            return this.keys;
        }
    }, {
        key: 'getTemplates',
        value: function getTemplates() {
            if (!this.initialzed) {
                throw new Error('Yikes its not initialized yet');
            }
            return this.templates;
        }
    }]);

    return HtmlTemplateCollection;
}(Template);

var HtmlTemplate = function (_Template4) {
    _inherits(HtmlTemplate, _Template4);

    function HtmlTemplate(strings, values, context) {
        _classCallCheck(this, HtmlTemplate);

        var _this7 = _possibleConstructorReturn(this, (HtmlTemplate.__proto__ || Object.getPrototypeOf(HtmlTemplate)).call(this));

        _this7.strings = strings;
        _this7.values = values;
        _this7.context = context;
        _this7.key = _this7.strings.join('').trim();
        _this7.nodeValueIndexArray = null;
        _this7.documentFragment = null;
        return _this7;
    }

    _createClass(HtmlTemplate, [{
        key: 'buildTemplate',
        value: function buildTemplate(templateString) {
            this.documentFragment = this.getProperTemplateTag(templateString);
            this.nodeValueIndexArray = this.buildNodeValueIndex(this.documentFragment, []);
            HtmlTemplate.applyValues(this, this.nodeValueIndexArray);
        }
    }, {
        key: 'buildNodeValueIndex',
        value: function buildNodeValueIndex(documentFragment) {

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
                        var nodeValueIndexMap = this.lookNodeValueArray(nodeValue);
                        if (nodeValueIndexMap.length == 0) {
                            continue;
                        }
                        var valueIndexes = nodeValueIndexMap.map(function (x) {
                            return x.match(/[\w\.]+/)[0];
                        }).map(function (i) {
                            return parseInt(i);
                        });
                        if (valueIndexes && valueIndexes.length > 0) {
                            nodeValueIndexArray.push({
                                node: attributes[attributeIndex],
                                valueIndexes: valueIndexes,
                                nodeValue: nodeValue
                            });
                        }
                    }
                    nodeValueIndexArray = nodeValueIndexArray.concat(this.buildNodeValueIndex(node));
                }
                if (node.nodeType === Node.TEXT_NODE && documentFragment.nodeName.toUpperCase() === 'STYLE') {
                    var _nodeValue = node.nodeValue;
                    var _nodeValueIndexMap = this.lookNodeValueArray(_nodeValue);
                    if (_nodeValueIndexMap.length == 0) {
                        continue;
                    }

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
                    node.nodeValue = 'placeholder';
                    nodeValueIndexArray.push({ node: node, valueIndexes: parseInt(_nodeValue2) });
                }
            } while (node = node.nextSibling);
            return nodeValueIndexArray;
        }
    }, {
        key: 'lookNodeValueArray',
        value: function lookNodeValueArray(nodeValue) {
            var result = [];
            var pointerStart = nodeValue.indexOf('<!--');
            var pointerEnd = nodeValue.indexOf('-->', pointerStart);

            while (pointerEnd < nodeValue.length && pointerEnd >= 0 && pointerStart >= 0) {
                result.push(nodeValue.substring(pointerStart + 4, pointerEnd));
                pointerStart = nodeValue.indexOf('<!--', pointerEnd + 3);
                pointerEnd = nodeValue.indexOf('-->', pointerStart);
            }
            return result;
        }
    }, {
        key: 'getProperTemplateTag',
        value: function getProperTemplateTag(contentText) {
            var openTag = contentText.substring(1, contentText.indexOf('>'));
            openTag = (openTag.indexOf(' ') > 0 ? openTag.substring(0, openTag.indexOf(' ')) : openTag).toLowerCase();
            var rootTag = TEMPLATE_ROOT[openTag];
            rootTag = rootTag || 'div';
            var template = document.createElement(rootTag);
            template.innerHTML = contentText;
            return template;
        }
    }, {
        key: 'constructTemplate',
        value: function constructTemplate() {
            if (!this.context.hasCache(this.key)) {
                var templateString = this.buildStringSequence();
                this.buildTemplate(templateString);
                return this.context.cache(this.key, this);
            }
            return this.context.cache(this.key);
        }
    }, {
        key: 'buildStringSequence',
        value: function buildStringSequence() {
            return this.strings.reduce(function (result, string, index) {
                return index == 0 ? string : result + '<!--' + (index - 1) + '-->' + string;
            }, '').trim();
        }
    }], [{
        key: 'applyValues',
        value: function applyValues(nextHtmlTemplate, nodeValueIndexArray) {
            var values = nextHtmlTemplate.values;
            if (!nodeValueIndexArray) {
                return;
            }
            nodeValueIndexArray.forEach(function (nodeValueIndex, index) {
                var node = nodeValueIndex.node,
                    valueIndexes = nodeValueIndex.valueIndexes;

                var nodeName = node.nodeName;
                if (node.nodeType === Node.ATTRIBUTE_NODE) {
                    var marker = Marker.from(node);
                    var isEvent = nodeName.indexOf('on') === 0;
                    var nodeValue = nodeValueIndex.nodeValue;
                    if (isEvent) {
                        var valueIndex = valueIndexes[0];
                        marker.attributes[nodeName] = values[valueIndex];
                    } else {
                        var actualAttributeValue = nodeValue;
                        var valFiltered = valueIndexes.map(function (valueIndex) {
                            return values[valueIndex];
                        });
                        valueIndexes.forEach(function (valueIndex, index) {
                            actualAttributeValue = actualAttributeValue.replace('<!--' + valueIndex + '-->', valFiltered[index]);
                        });
                        if (isMinimizationAttribute(node)) {
                            node.ownerElement[nodeName] = actualAttributeValue.trim() == 'true';
                            node.ownerElement.setAttribute(nodeName, '');
                        } else {
                            node.ownerElement.setAttribute(nodeName, actualAttributeValue);
                        }

                        if (nodeName.indexOf('.bind') >= 0) {
                            var attributeName = nodeName.substring(0, nodeName.indexOf('.bind'));
                            node.ownerElement.setAttribute(attributeName, actualAttributeValue);
                        }
                        marker.attributes[nodeName] = actualAttributeValue;
                    }
                }
                if (node.nodeType === Node.TEXT_NODE) {
                    var _actualAttributeValue = nodeValueIndex.nodeValue;
                    var _valFiltered = valueIndexes.map(function (valueIndex) {
                        return values[valueIndex];
                    });
                    valueIndexes.forEach(function (valueIndex, index) {
                        _actualAttributeValue = _actualAttributeValue.replace('<!--' + valueIndex + '-->', _valFiltered[index]);
                    });
                    node.nodeValue = _actualAttributeValue;
                }
                if (node.nodeType === Node.COMMENT_NODE) {
                    var _nodeValue3 = node.nodeValue;
                    var _valueIndex = valueIndexes;
                    var value = values[_valueIndex];
                    renderTemplate(value, node);
                }
            });
        }
    }]);

    return HtmlTemplate;
}(Template);

function renderText(text, node) {
    var placeholder = Placeholder.from(node);
    placeholder.setTextContent(text);
}

function renderHtmlTemplate(htmlTemplate, node) {
    var placeholder = Placeholder.from(node);
    placeholder.setHtmlTemplateContent(htmlTemplate);
}

function renderHtmlTemplateCollection(htmlTemplateCollection, node) {
    var placeholder = Placeholder.from(node);
    placeholder.setHtmlTemplateCollectionContent(htmlTemplateCollection);
}

function renderTemplate(template, node) {
    if (template instanceof HtmlTemplate) {
        renderHtmlTemplate(template, node);
    } else if (template instanceof HtmlTemplateCollection) {
        renderHtmlTemplateCollection(template, node);
    } else {
        renderText(template, node);
    }
}

function syncNode(template, node) {
    var placeholder = Placeholder.from(node);
    var values = template.values;
    if (placeholder.content && placeholder.content instanceof HtmlTemplateInstance) {
        var htmlTemplateInstance = placeholder.content;
        var _template2 = htmlTemplateInstance.template;
        var docFragment = { childNodes: htmlTemplateInstance.instance };

        if (_template2.nodeValueIndexArray) {
            var actualNodeValueIndexArray = _template2.nodeValueIndexArray.map(function (nodeValueIndex) {
                var nodeValue = nodeValueIndex.nodeValue,
                    valueIndexes = nodeValueIndex.valueIndexes;

                var path = getPath(nodeValueIndex.node);
                var actualNode = getNode(path, docFragment);
                //let actualValues = valueIndexes.map(index => values[index]);
                var isStyleNode = actualNode.parentNode && actualNode.parentNode.nodeName.toUpperCase() === 'STYLE';
                if (isStyleNode) {
                    return { node: actualNode, valueIndexes: valueIndexes, nodeValue: nodeValue };
                } else if (actualNode.nodeType === Node.ATTRIBUTE_NODE) {
                    var marker = Marker.from(actualNode);
                    var nodeName = actualNode.nodeName;
                    var isEvent = nodeName.indexOf('on') === 0;
                    if (isEvent) {
                        var valueIndex = valueIndexes[0];
                        marker.attributes[nodeName] = values[valueIndex];
                        var eventName = nodeName.substring(2, nodeName.length);
                        actualNode.ownerElement.setAttribute(nodeName, 'return false;');
                        actualNode.ownerElement.addEventListener(eventName, values[valueIndex]);
                    } else {
                        var actualAttributeValue = nodeValue;
                        var valFiltered = valueIndexes.map(function (valueIndex) {
                            return values[valueIndex];
                        });
                        valueIndexes.forEach(function (valueIndex, index) {
                            actualAttributeValue = actualAttributeValue.replace('<!--' + valueIndex + '-->', valFiltered[index]);
                        });

                        marker.attributes[nodeName] = actualAttributeValue;
                    }
                    return { node: actualNode, valueIndexes: valueIndexes, nodeValue: nodeValue };
                } else {
                    var _placeholder = Placeholder.from(actualNode);
                    var value = values[valueIndexes];
                    if (value instanceof HtmlTemplate) {
                        _placeholder.constructHtmlTemplateContent(value);
                        syncNode(value, _placeholder.commentNode);
                    } else if (value instanceof HtmlTemplateCollection) {
                        _placeholder.constructHtmlTemplateCollectionContent(value);
                        syncNode(value, _placeholder.commentNode);
                    } else {
                        _placeholder.constructTextContent();
                    }
                    return { node: actualNode, valueIndexes: valueIndexes };
                }
            });
            htmlTemplateInstance.nodeValueIndexArray = actualNodeValueIndexArray;
        }
    }
    if (placeholder.content && placeholder.content instanceof HtmlTemplateCollectionInstance) {
        var htmlTemplateCollectionInstance = placeholder.content;
        var templates = htmlTemplateCollectionInstance.template.templates;
        var keys = htmlTemplateCollectionInstance.template.keys;
        keys.forEach(function (key) {
            var template = templates[key];
            var commentNode = htmlTemplateCollectionInstance.instance[key];
            var placeholder = Placeholder.from(commentNode);
            if (placeholder.content === null) {
                if (template instanceof HtmlTemplate) {
                    placeholder.constructHtmlTemplateContent(template.context.cache(template.key));
                    syncNode(template, commentNode);
                }
            } else {
                if (placeholder.content instanceof HtmlTemplateInstance) {
                    syncNode(template, commentNode);
                }
            }
        });
    }
}

function render(templateValue, node) {
    renderTemplate(templateValue, node);
    if (!node.$synced) {
        syncNode(templateValue, node);
        node.$synced = true;
    }
    if ('Promise' in window) {
        return new Promise(function (resolve) {
            setTimeout(function () {
                templateValue.context.clearSyncCallbacks();
                resolve();
            }, 300);
        });
    } else {
        setTimeout(function () {
            templateValue.context.clearSyncCallbacks();
        }, 300);
    }
}

var Marker = function () {
    function Marker(node) {
        _classCallCheck(this, Marker);

        this.node = node;
        this.attributes = {};
    }

    _createClass(Marker, null, [{
        key: 'from',
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

var Placeholder = function () {
    function Placeholder(commentNode) {
        _classCallCheck(this, Placeholder);

        this.commentNode = commentNode;
        this.content = null;
    }

    _createClass(Placeholder, [{
        key: 'constructTextContent',
        value: function constructTextContent() {
            this.content = this.commentNode.previousSibling;
        }
    }, {
        key: 'constructHtmlTemplateCollectionContent',
        value: function constructHtmlTemplateCollectionContent(htmlTemplateCollection) {
            var _this8 = this;

            this.content = new HtmlTemplateCollectionInstance(htmlTemplateCollection, this);
            this.content.instance = {};
            var pointer = this.commentNode;
            htmlTemplateCollection.iterateRight(function (item, key, template, index) {
                do {
                    pointer = pointer.previousSibling;
                } while (pointer.nodeType != Node.COMMENT_NODE && pointer.nodeValue !== 'placeholder-child');
                _this8.content.instance[key] = pointer;
            });
        }
    }, {
        key: 'constructHtmlTemplateContent',
        value: function constructHtmlTemplateContent(htmlTemplate) {
            var childNodesLength = htmlTemplate.documentFragment.childNodes.length;
            this.content = new HtmlTemplateInstance(htmlTemplate, this);
            var sibling = this.commentNode;
            while (childNodesLength--) {
                sibling = sibling.previousSibling;
                this.content.instance.push(sibling);
            }
            this.content.instance.reverse();
        }
    }, {
        key: 'setTextContent',
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
        key: 'setHtmlTemplateCollectionContent',
        value: function setHtmlTemplateCollectionContent(htmlTemplateCollection) {
            var clearContentWasCalled = false;
            var contentHasSameStructure = this.content && this.content instanceof HtmlTemplateCollectionInstance;
            if (this.content !== null && !contentHasSameStructure) {
                clearContentWasCalled = true;
                this.clearContent();
            }
            if (!this.content) {
                this.content = new HtmlTemplateCollectionInstance(htmlTemplateCollection, this);
            }
            this.content.applyValues(htmlTemplateCollection);
            if (clearContentWasCalled) {
                syncNode(this.content.template, this.commentNode);
            }
        }
    }, {
        key: 'setHtmlTemplateContent',
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
                syncNode(this.content.template, this.commentNode);
            }
        }
    }, {
        key: 'clearContent',
        value: function clearContent() {
            if (this.content !== null) {
                if (this.content instanceof Template) {
                    this.content.destroy();
                } else {
                    this.content.parentNode.removeChild(this.content);
                }
                this.content = null;
            }
        }
    }, {
        key: 'hasEmptyContent',
        value: function hasEmptyContent() {
            return this.content === null;
        }
    }, {
        key: 'firstChildNode',
        value: function firstChildNode() {
            if (this.content instanceof HtmlTemplateInstance) {
                return this.content.instance[0];
            } else if (this.content instanceof HtmlTemplateCollectionInstance) {
                var firstKey = this.content.template.keys[0];
                var placeholder = Placeholder.from(this.content.instance[firstKey]);
                return placeholder.firstChildNode();
            } else {
                return this.content;
            }
        }
    }, {
        key: 'validateInstancePosition',
        value: function validateInstancePosition() {
            if (this.content instanceof HtmlTemplateInstance) {
                this.content.instance.reduceRight(function (pointer, ctn) {
                    if (pointer.previousSibling != ctn) {
                        pointer.parentNode.insertBefore(ctn, pointer);
                    }
                    return ctn;
                }, this.commentNode);
            } else if (this.content instanceof HtmlTemplateCollectionInstance) {
                // we need to investigate how to sort this
            } else {
                if (this.commentNode.previousSibling != this.content) {
                    this.commentNode.parentNode.insertBefore(this.content, this.commentNode);
                }
            }
        }
    }], [{
        key: 'from',
        value: function from(node) {
            if (node instanceof Comment) {
                node.$data = node.$data || new Placeholder(node);
                return node.$data;
            } else {
                if (!node.$placeholder) {
                    node.$placeholder = document.createComment('placeholder');
                    node.appendChild(node.$placeholder);
                }
                return Placeholder.from(node.$placeholder);
            }
        }
    }]);

    return Placeholder;
}();