'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

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

var PLACEHOLDER_CONTENT = '∞';
var PLACEHOLDER = '<!--' + PLACEHOLDER_CONTENT + '-->';
var isMinimizationAttribute = function isMinimizationAttribute(node) {
    return ['checked', 'compact', 'declare', 'defer', 'disabled', 'ismap', 'noresize', 'noshade', 'nowrap', 'selected'].indexOf(node.nodeName) >= 0;
};

function render(val, node) {

    if (!node.$content) {
        var placeHolder = document.createComment(PLACEHOLDER_CONTENT);
        node.appendChild(placeHolder);
        _render(val, placeHolder);
        node.$content = placeHolder;
    } else {
        _render(val, node.$content);
    }
}

function destroy(val) {
    if (val instanceof HtmlTemplate) {
        val.destroy();
    } else if (val instanceof HtmlTemplateCollection) {
        val.destroy();
    } else if (val.parentNode) {
        val.parentNode.removeChild(val);
    }
}

function _render(val, node) {
    if (val instanceof HtmlTemplate) {
        _renderHtmlTemplate(val, node);
    } else if (val instanceof HtmlTemplateCollection) {
        _renderHtmlTemplateCollection(val, node);
    } else {
        _renderText(val, node);
    }
}

function getFirstNodeFromTemplate(template, placeHolder) {
    if (template instanceof HtmlTemplate) {
        return template.nodeTree[0];
    } else if (template instanceof HtmlTemplateCollection) {
        return getFirstNodeFromTemplate(template.htmlTemplates[template.keys[0]], placeHolder);
    } else {
        return placeHolder.$content;
    }
}
function _renderHtmlTemplateCollection(newTemplateCollection, newPlaceHolder) {

    var placeHolders = {};
    var oldPlaceHolders = {};
    var oldHtmlTemplateCollection = newPlaceHolder.$content;

    if (oldHtmlTemplateCollection && !(oldHtmlTemplateCollection instanceof HtmlTemplateCollection)) {
        destroy(oldHtmlTemplateCollection);
        oldHtmlTemplateCollection = null;
    }

    if (oldHtmlTemplateCollection) {
        oldPlaceHolders = oldHtmlTemplateCollection.placeHolders;
        oldHtmlTemplateCollection.keys.forEach(function (oldKey) {
            if (newTemplateCollection.keys.indexOf(oldKey) < 0) {
                var oldPlaceHolder = oldPlaceHolders[oldKey];
                removePlaceholder(oldPlaceHolder);
            }
        });
    }

    newTemplateCollection.keys.reduceRight(function (prev, key) {
        var htmlTemplate = newTemplateCollection.htmlTemplates[key];

        var placeHolder = document.createComment(PLACEHOLDER_CONTENT);
        if (oldPlaceHolders[key]) {
            placeHolder = oldPlaceHolders[key];
        }

        if (!placeHolder.nextSibling || placeHolder.nextSibling != prev) {
            newPlaceHolder.parentNode.insertBefore(placeHolder, prev);
        }

        placeHolders[key] = placeHolder;
        if (oldPlaceHolders[key]) {
            var oldHtmlTemplate = oldHtmlTemplateCollection.htmlTemplates[key];
            _render(htmlTemplate, placeHolder);
            if (oldHtmlTemplate instanceof HtmlTemplate && htmlTemplate instanceof HtmlTemplate && oldHtmlTemplate.key == htmlTemplate.key) {
                newTemplateCollection.htmlTemplates[key] = oldHtmlTemplate;
            }
        } else {
            _render(htmlTemplate, placeHolder);
        }
        return getFirstNodeFromTemplate(newTemplateCollection.htmlTemplates[key], placeHolder);
    }, newPlaceHolder);
    newTemplateCollection.placeHolders = placeHolders;
    newPlaceHolder.$content = newTemplateCollection;
}

function removePlaceholder(placeHolder) {
    if (placeHolder.$content instanceof HtmlTemplate) {
        placeHolder.$content.nodeTree.forEach(function (n) {
            return n.parentNode.removeChild(n);
        });
    } else if (Array.isArray(placeHolder.$content)) {
        placeHolder.$content.forEach(function (pc) {
            return removePlaceholder(pc);
        });
    }
    placeHolder.parentNode.removeChild(placeHolder);
}

function _buildTemplate(htmlTemplate, node) {
    htmlTemplate.generateNodeTree().forEach(function (n) {
        return node.parentNode.insertBefore(n, node);
    });
    node.$content = htmlTemplate;
}
function _renderHtmlTemplate(htmlTemplate, node) {
    if (node.$content) {
        if (node.$content instanceof HtmlTemplate) {
            node.$content.applyValues(htmlTemplate.values);
            node.$content.nodeTree.reduceRight(function (next, item) {
                if (item.nextSibling && item.nextSibling != next && next.parentNode) {
                    next.parentNode.insertBefore(item, next);
                }
                return item;
            }, node);
        } else {
            destroy(node.$content);
            _buildTemplate(htmlTemplate, node);
        }
    } else {
        _buildTemplate(htmlTemplate, node);
    }
}

function _renderText(val, node) {
    if (node.parentNode == null) {
        return;
    }
    if (node.$content) {
        destroy(node.$content);
    }
    var textNode = document.createTextNode(val);
    node.parentNode.insertBefore(textNode, node);
    node.$content = textNode;
}

function html(strings) {
    var key = strings.join('').replace(/\s/g, '');

    for (var _len = arguments.length, values = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        values[_key - 1] = arguments[_key];
    }

    return new HtmlTemplate(strings, values, key);
}

function cache(key) {
    return {
        html: function html(strings) {
            for (var _len2 = arguments.length, values = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
                values[_key2 - 1] = arguments[_key2];
            }

            return new HtmlTemplate(strings, values, key);
        }
    };
}

function htmlCollection(items, keyFn, templateFn) {
    return new HtmlTemplateCollection(items, keyFn, templateFn);
}

var _cache = {};

var HtmlTemplateCollection = function () {
    function HtmlTemplateCollection(items, keyFn, templateFn) {
        _classCallCheck(this, HtmlTemplateCollection);

        this.items = items;
        this.keyFn = typeof keyFn === 'function' ? keyFn : function (i) {
            return i[keyFn];
        };
        this.templateFn = templateFn;
        this.keys = [];
        this.htmlTemplates = {};
        this._init();
    }

    _createClass(HtmlTemplateCollection, [{
        key: '_init',
        value: function _init() {
            var self = this;
            var index = self.items.length;
            while (index--) {
                var item = self.items[index];
                var key = self.keyFn.apply(self, [item]);
                self.htmlTemplates[key] = self.templateFn.apply(self, [item, index, self.items]);
                self.keys.push(key);
            }
            self.keys.reverse();
        }
    }, {
        key: 'destroy',
        value: function destroy() {
            var _this = this;

            this.keys.forEach(function (key) {
                if (_this.htmlTemplates[key] instanceof HtmlTemplate) {
                    _this.htmlTemplates[key].destroy();
                    _this.placeHolders[key].parentNode.removeChild(_this.placeHolders[key]);
                }
            });

            this.keys = [];
            this.htmlTemplates = {};
            this.items = {};
            delete this.placeHolders;
        }
    }]);

    return HtmlTemplateCollection;
}();

function getPath(node) {
    var i = 0;
    var child = node;
    while ((child = child.previousSibling) != null) {
        i++;
    }
    var path = [];
    path.push(i);
    if (node.parentNode && node.parentNode.nodeType != Node.DOCUMENT_FRAGMENT_NODE) {
        return path.concat(getPath(node.parentNode));
    }
    return path;
}

var HtmlTemplate = function () {
    function HtmlTemplate(strings, values, key) {
        _classCallCheck(this, HtmlTemplate);

        this.strings = strings;
        this.values = values;
        this.key = key;
    }

    _createClass(HtmlTemplate, [{
        key: 'generateNodeTree',
        value: function generateNodeTree() {
            var key = this.key;
            if (!_cache[key]) {
                var _template = document.createElement('template');
                _template.innerHTML = this.strings.join(PLACEHOLDER);
                _cache[key] = _template;
            }
            var template = _cache[key];
            this.content = template.content.cloneNode(true);
            if (!template.dynamicNodesPath) {
                this._coldStart();
                template.dynamicNodesPath = this.dynamicNodesPath;
            } else {
                this.dynamicNodesPath = template.dynamicNodesPath;
                this._warmStart();
            }

            this.nodeTree = Array.from(this.content.childNodes);
            return this.nodeTree;
        }
    }, {
        key: '_coldStart',
        value: function _coldStart() {
            var results = [];
            var resultsPath = [];
            this._lookDynamicNodes(Array.from(this.content.childNodes), results, resultsPath);
            this.dynamicNodes = results;
            this.dynamicNodesPath = resultsPath.map(function (path) {
                return path.reverse();
            });
            this.applyValues(this.values);
        }
    }, {
        key: '_warmStart',
        value: function _warmStart() {
            this._lookDynamicNodesFromPath();
            this.applyValues(this.values);
        }
    }, {
        key: '_lookDynamicNodesFromPath',
        value: function _lookDynamicNodesFromPath() {
            var _this2 = this;

            this.dynamicNodes = this.dynamicNodesPath.map(function (path) {
                return path.reduce(function (content, path) {
                    if (typeof path == 'number') {
                        return content.childNodes[path];
                    } else {
                        var attribute = content.attributes[path.name];
                        attribute.$dynamicAttributeLength = path.dynamicLength;
                        attribute.$dynamicAttributeLengthPos = 0;
                        return attribute;
                    }
                }, _this2.content);
            });
        }
    }, {
        key: '_lookDynamicNodes',
        value: function _lookDynamicNodes(childNodes, results, resultsPath) {
            var _this3 = this;

            childNodes.forEach(function (node) {
                if (node instanceof Comment && node.nodeValue == PLACEHOLDER_CONTENT) {
                    results.push(node);
                    resultsPath.push(getPath(node));
                } else if (node.attributes) {
                    Array.from(node.attributes).reduce(function (results, attribute) {
                        if (attribute.nodeValue.indexOf(PLACEHOLDER) >= 0) {
                            var dynamicLength = attribute.nodeValue.split(PLACEHOLDER).length - 1;
                            for (var i = 0; i < dynamicLength; i++) {
                                attribute.$dynamicAttributeLength = dynamicLength;
                                attribute.$dynamicAttributeLengthPos = 0;
                                results.push(attribute);
                                var path = [{
                                    name: attribute.nodeName,
                                    dynamicLength: dynamicLength
                                }].concat(getPath(attribute.ownerElement));
                                resultsPath.push(path);
                            }
                        }
                        return results;
                    }, results);
                    _this3._lookDynamicNodes(Array.from(node.childNodes), results, resultsPath);
                }
            });
        }
    }, {
        key: 'applyValues',
        value: function applyValues(values) {
            this.dynamicNodes.forEach(function (dn, index) {
                if (dn.nodeType === Node.ATTRIBUTE_NODE) {
                    HtmlTemplate._applyAttributeNode(dn, values[index]);
                } else {
                    _render(values[index], dn);
                }
            });
        }
    }, {
        key: 'destroy',
        value: function destroy() {
            this.nodeTree.forEach(function (n) {
                return n.parentNode.removeChild(n);
            });
            this.content = null;
        }
    }], [{
        key: '_applyAttributeNode',
        value: function _applyAttributeNode(node, value) {
            if (typeof value === 'function' && node.name.indexOf('on') === 0) {
                node.nodeValue = PLACEHOLDER_CONTENT;
                node.ownerElement[node.name] = value;
            } else {
                if (!node.$valueOriginal) {
                    node.$valueOriginal = node.value;
                }
                if (node.$dynamicAttributeLengthPos == node.$dynamicAttributeLength) {
                    node.$dynamicAttributeLengthPos = 0;
                }
                if (node.$dynamicAttributeLengthPos == 0) {
                    node.$value = node.$valueOriginal;
                }
                if (isMinimizationAttribute(node)) {
                    node.ownerElement[node.nodeName] = value;
                } else {
                    node.$value = node.$value.split(PLACEHOLDER).reduce(function (result, data, index) {
                        return index == 0 ? data : '' + result + (index == 1 ? value : PLACEHOLDER) + data;
                    }, '');
                    node.$dynamicAttributeLengthPos++;
                    if (node.$dynamicAttributeLengthPos == node.$dynamicAttributeLength && node.value != node.$value) {
                        node.value = node.$value;
                    }
                }
            }
        }
    }]);

    return HtmlTemplate;
}();