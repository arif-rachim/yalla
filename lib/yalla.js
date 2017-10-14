'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PLACEHOLDER_CONTENT = 'place-holder';
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
    var oldKeys = [];
    var oldHtmlTemplateCollection = newPlaceHolder.$content;

    if (oldHtmlTemplateCollection && !(oldHtmlTemplateCollection instanceof HtmlTemplateCollection)) {
        destroy(oldHtmlTemplateCollection);
        oldHtmlTemplateCollection = null;
    }

    if (oldHtmlTemplateCollection) {
        oldKeys = oldHtmlTemplateCollection.keys;
        oldPlaceHolders = oldHtmlTemplateCollection.placeHolders;
    }

    oldKeys.forEach(function (oldKey) {
        if (newTemplateCollection.keys.indexOf(oldKey) < 0) {
            var oldPlaceHolder = oldPlaceHolders[oldKey];
            removePlaceholder(oldPlaceHolder);
        }
    });

    newTemplateCollection.keys.reduceRight(function (prev, key, index, array) {
        var htmlTemplate = newTemplateCollection.htmlTemplates[key];

        var placeHolder = document.createComment(PLACEHOLDER_CONTENT);
        if (oldPlaceHolders[key]) {
            placeHolder = oldPlaceHolders[key];
        }
        if (placeHolder.nextSibling) {
            if (placeHolder.nextSibling != prev) {
                newPlaceHolder.parentNode.insertBefore(placeHolder, prev);
            }
        } else {
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
        var firstNode = getFirstNodeFromTemplate(newTemplateCollection.htmlTemplates[key], placeHolder);
        return firstNode;
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

function _renderHtmlTemplate(htmlTemplate, node) {
    if (node.$content) {
        if (node.$content instanceof HtmlTemplate) {
            node.$content.applyValues(htmlTemplate.values);
            node.$content.nodeTree.reduceRight(function (next, item, index) {
                if (item.nextSibling && item.nextSibling != next && next.parentNode) {
                    next.parentNode.insertBefore(item, next);
                }
                return item;
            }, node);
        } else {
            destroy(node.$content);
            htmlTemplate.generateNodeTree().forEach(function (n) {
                return node.parentNode.insertBefore(n, node);
            });
            node.$content = htmlTemplate;
        }
    } else {
        htmlTemplate.generateNodeTree().forEach(function (n) {
            return node.parentNode.insertBefore(n, node);
        });
        node.$content = htmlTemplate;
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
    for (var _len = arguments.length, values = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        values[_key - 1] = arguments[_key];
    }

    return new HtmlTemplate(strings, values);
}
function htmlMap(items, keyFn, templateFn) {
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
            var _this = this;

            this.items.forEach(function (item, index, array) {
                var key = _this.keyFn.apply(_this, [item]);
                var htmlTemplate = _this.templateFn.apply(_this, [item, index, array]);
                _this.htmlTemplates[key] = htmlTemplate;
                _this.keys.push(key);
            });
        }
    }, {
        key: 'destroy',
        value: function destroy() {
            var _this2 = this;

            this.keys.forEach(function (key) {
                if (_this2.htmlTemplates[key] instanceof HtmlTemplate) {
                    _this2.htmlTemplates[key].destroy();
                    _this2.placeHolders[key].parentNode.removeChild(_this2.placeHolders[key]);
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

var HtmlTemplate = function () {
    function HtmlTemplate(strings, values) {
        _classCallCheck(this, HtmlTemplate);

        this.strings = strings;
        this.values = values;
        this.key = this.strings.join('');
    }

    _createClass(HtmlTemplate, [{
        key: 'generateNodeTree',
        value: function generateNodeTree() {
            var key = this.key;
            if (!(key in _cache)) {
                var template = document.createElement('template');
                template.innerHTML = this.strings.join(PLACEHOLDER);
                _cache[key] = template;
            }
            this.content = _cache[key].content.cloneNode(true);
            this._init();
            this.nodeTree = Array.from(this.content.childNodes);
            return this.nodeTree;
        }
    }, {
        key: '_init',
        value: function _init() {
            var results = [];
            this._lookDynamicNodes(Array.from(this.content.childNodes), results);
            this.dynamicNodes = results;
            this.applyValues(this.values);
        }
    }, {
        key: '_lookDynamicNodes',
        value: function _lookDynamicNodes(childNodes, results) {
            var _this3 = this;

            childNodes.forEach(function (node) {
                if (node instanceof Comment) {
                    results.push(node);
                } else if (node.attributes) {
                    Array.from(node.attributes).reduce(function (results, attribute) {
                        if (attribute.nodeValue.indexOf(PLACEHOLDER) >= 0) {
                            var dynamicLength = attribute.nodeValue.split(PLACEHOLDER).length - 1;
                            for (var i = 0; i < dynamicLength; i++) {
                                attribute.$dynamicAttributeLength = dynamicLength;
                                attribute.$dynamicAttributeLengthPos = 0;
                                results.push(attribute);
                            }
                        }
                        return results;
                    }, results);
                    _this3._lookDynamicNodes(Array.from(node.childNodes), results);
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
                node.nodeValue = PLACEHOLDER;
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