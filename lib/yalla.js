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

function render(templateValue, node) {

    if (!node.$content) {
        var placeHolder = document.createComment(PLACEHOLDER_CONTENT);
        node.appendChild(placeHolder);
        _render(templateValue, placeHolder);
        node.$content = placeHolder;
    } else {
        _render(templateValue, node.$content);
    }
}

function destroy(templateValue) {
    if (templateValue instanceof HtmlTemplate) {
        templateValue.destroy();
    } else if (templateValue instanceof HtmlTemplateCollection) {
        templateValue.destroy();
    } else if (templateValue.parentNode) {
        templateValue.parentNode.removeChild(templateValue);
    }
}

function _render(templateValue, placeHolder) {
    if (templateValue instanceof HtmlTemplate) {
        _renderHtmlTemplate(templateValue, placeHolder);
    } else if (templateValue instanceof HtmlTemplateCollection) {
        _renderHtmlTemplateCollection(templateValue, placeHolder);
    } else {
        _renderText(templateValue, placeHolder);
    }
}

function getFirstNodeFromTemplate(templateValue, placeHolder) {
    if (templateValue instanceof HtmlTemplate) {
        return templateValue.nodeTree[0];
    } else if (templateValue instanceof HtmlTemplateCollection) {
        return getFirstNodeFromTemplate(templateValue.htmlTemplates[templateValue.keys[0]], placeHolder);
    } else {
        return placeHolder.$content;
    }
}
function _renderHtmlTemplateCollection(templateCollectionValue, newPlaceHolder) {

    var placeHolderContainer = {};
    var oldPlaceHolderContainer = {};
    var oldTemplateCollectionValue = newPlaceHolder.$content;

    if (oldTemplateCollectionValue && !(oldTemplateCollectionValue instanceof HtmlTemplateCollection)) {
        destroy(oldTemplateCollectionValue);
        oldTemplateCollectionValue = null;
    }

    if (oldTemplateCollectionValue) {
        oldPlaceHolderContainer = oldTemplateCollectionValue.placeHolders;
        oldTemplateCollectionValue.keys.forEach(function (oldKey) {
            if (templateCollectionValue.keys.indexOf(oldKey) < 0) {
                var oldPlaceHolder = oldPlaceHolderContainer[oldKey];
                removePlaceholder(oldPlaceHolder);
            }
        });
    }

    templateCollectionValue.keys.reduceRight(function (sibling, key) {
        var childTemplateValue = templateCollectionValue.htmlTemplates[key];

        var childPlaceHolder = document.createComment(PLACEHOLDER_CONTENT);
        if (oldPlaceHolderContainer[key]) {
            childPlaceHolder = oldPlaceHolderContainer[key];
        }

        if (!childPlaceHolder.nextSibling || childPlaceHolder.nextSibling != sibling) {
            newPlaceHolder.parentNode.insertBefore(childPlaceHolder, sibling);
        }

        placeHolderContainer[key] = childPlaceHolder;
        if (oldPlaceHolderContainer[key]) {
            var oldChildTemplateValue = oldTemplateCollectionValue.htmlTemplates[key];
            _render(childTemplateValue, childPlaceHolder);
            if (oldChildTemplateValue instanceof HtmlTemplate && childTemplateValue instanceof HtmlTemplate && oldChildTemplateValue.key == childTemplateValue.key) {
                templateCollectionValue.htmlTemplates[key] = oldChildTemplateValue;
            }
        } else {
            _render(childTemplateValue, childPlaceHolder);
        }
        return getFirstNodeFromTemplate(templateCollectionValue.htmlTemplates[key], childPlaceHolder);
    }, newPlaceHolder);
    templateCollectionValue.placeHolders = placeHolderContainer;
    newPlaceHolder.$content = templateCollectionValue;
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

function _buildTemplate(templateValue, placeHolder) {
    templateValue.generateNodeTree().forEach(function (node) {
        return placeHolder.parentNode.insertBefore(node, placeHolder);
    });
    placeHolder.$content = templateValue;
}
function _renderHtmlTemplate(templateValue, placeHolder) {
    if (placeHolder.$content) {
        if (placeHolder.$content instanceof HtmlTemplate) {
            placeHolder.$content.applyValues(templateValue.values);
            placeHolder.$content.nodeTree.reduceRight(function (next, item) {
                if (item.nextSibling && item.nextSibling != next && next.parentNode) {
                    next.parentNode.insertBefore(item, next);
                }
                return item;
            }, placeHolder);
        } else {
            destroy(placeHolder.$content);
            _buildTemplate(templateValue, placeHolder);
        }
    } else {
        _buildTemplate(templateValue, placeHolder);
    }
}

function _renderText(templateValue, placeHolder) {
    if (placeHolder.parentNode == null) {
        return;
    }
    if (placeHolder.$content) {
        destroy(placeHolder.$content);
    }
    var textNode = document.createTextNode(templateValue);
    placeHolder.parentNode.insertBefore(textNode, placeHolder);
    placeHolder.$content = textNode;
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
            var documentFragment = template.content.cloneNode(true);
            if (!template.dynamicNodesPath) {
                this._coldStart(documentFragment);
                template.dynamicNodesPath = this.dynamicNodesPath;
            } else {
                this.dynamicNodesPath = template.dynamicNodesPath;
                this._warmStart(documentFragment);
            }
            this.nodeTree = Array.from(documentFragment.childNodes);
            return this.nodeTree;
        }
    }, {
        key: '_coldStart',
        value: function _coldStart(documentFragment) {
            var results = [];
            var resultsPath = [];
            this._lookDynamicNodes(Array.from(documentFragment.childNodes), results, resultsPath);
            this.dynamicNodes = results;
            this.dynamicNodesPath = resultsPath.map(function (path) {
                return path.reverse();
            });
            this.applyValues(this.values);
        }
    }, {
        key: '_warmStart',
        value: function _warmStart(documentFragment) {
            this.dynamicNodes = this._lookDynamicNodesFromPath(documentFragment, this.dynamicNodesPath);
            this.applyValues(this.values);
        }
    }, {
        key: '_lookDynamicNodesFromPath',
        value: function _lookDynamicNodesFromPath(documentFragment, dynamicNodesPath) {
            return dynamicNodesPath.map(function (path) {
                return path.reduce(function (content, path) {
                    if (typeof path == 'number') {
                        return content.childNodes[path];
                    } else {
                        var attribute = content.attributes[path.name];
                        attribute.$dynamicAttributeLength = path.dynamicLength;
                        attribute.$dynamicAttributeLengthPos = 0;
                        return attribute;
                    }
                }, documentFragment);
            });
        }
    }, {
        key: '_lookDynamicNodes',
        value: function _lookDynamicNodes(childNodes, results, resultsPath) {
            var _this2 = this;

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
                    _this2._lookDynamicNodes(Array.from(node.childNodes), results, resultsPath);
                }
            });
        }
    }, {
        key: 'applyValues',
        value: function applyValues(templateValue) {
            this.dynamicNodes.forEach(function (dn, index) {
                if (dn.nodeType === Node.ATTRIBUTE_NODE) {
                    HtmlTemplate._applyAttributeNode(dn, templateValue[index]);
                } else {
                    _render(templateValue[index], dn);
                }
            });
        }
    }, {
        key: 'destroy',
        value: function destroy() {
            this.nodeTree.forEach(function (n) {
                return n.parentNode.removeChild(n);
            });
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