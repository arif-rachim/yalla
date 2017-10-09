"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var isTextNode = function isTextNode(el) {
    return el.nodeType === 3;
};
var isAttributeNode = function isAttributeNode(el) {
    return el.nodeType === 2;
};
var itIsNotInitialized = function itIsNotInitialized(node) {
    return !node.yallaTemplate;
};
var isMinimizationAttribute = function isMinimizationAttribute(node) {
    return ['checked', 'compact', 'declare', 'defer', 'disabled', 'ismap', 'noresize', 'noshade', 'nowrap', 'selected'].indexOf(node.nodeName) >= 0;
};

var DATA_SEPARATOR = '↭';
var SEPARATOR = '<!--' + DATA_SEPARATOR + '-->';
var _mapExistingNode = {};

var HtmlTemplate = function () {
    function HtmlTemplate() {
        var string = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
        var values = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

        _classCallCheck(this, HtmlTemplate);

        this.templateStatics = string;
        this.templateStaticString = string.join(SEPARATOR);
        this.templateValues = values;
    }

    _createClass(HtmlTemplate, [{
        key: 'buildNodeTree',
        value: function buildNodeTree() {
            var el = null;
            if (this.templateStaticString in _mapExistingNode) {
                el = _mapExistingNode[this.templateStaticString];
            } else {
                el = document.createElement('template');
                el.innerHTML = this.templateStaticString;
                _mapExistingNode[this.templateStaticString] = el;
            }
            this.nodeTree = Array.from(el.content.cloneNode(true).childNodes);
            return this;
        }
    }, {
        key: 'lookupDynamicNodes',
        value: function lookupDynamicNodes() {
            var nodes = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.nodeTree;
            var results = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

            if (!nodes) {
                throw new Error('nodeTree does not exist in HtmlTemplate probably you need to call buildNodeTree');
            }
            for (var iNode = 0, len = nodes.length; iNode < len; iNode++) {
                var node = nodes[iNode];
                if (node instanceof Comment && node.textContent == DATA_SEPARATOR) {
                    results.push(node);
                }
                if (node.attributes) {
                    var nodeAttributes = Array.from(node.attributes);
                    for (var iNodeAttributes = 0, _len = nodeAttributes.length; iNodeAttributes < _len; iNodeAttributes++) {
                        var attribute = nodeAttributes[iNodeAttributes];
                        if (attribute.nodeValue.indexOf(SEPARATOR) >= 0) {
                            var dynamicLength = attribute.nodeValue.split(SEPARATOR).length - 1;
                            for (var i = 0; i < dynamicLength; i++) {
                                results.push(attribute);
                            }
                        }
                    }
                    this.lookupDynamicNodes(Array.from(node.childNodes), results);
                }
            }
            this.dynamicNodes = results;
            return this;
        }
    }, {
        key: 'appendSiblingFrom',
        value: function appendSiblingFrom(node) {
            for (var i = 0, len = this.nodeTree.length; i < len; i++) {
                var n = this.nodeTree[i];
                node.parentNode.insertBefore(n, node);
            }
            return this;
        }
    }, {
        key: 'appendChildrenTo',
        value: function appendChildrenTo(node) {
            for (var i = 0, len = this.nodeTree.length; i < len; i++) {
                var n = this.nodeTree[i];
                node.appendChild(n);
            }
            return this;
        }
    }, {
        key: 'applyValues',
        value: function applyValues() {
            var templateValues = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.templateValues;

            for (var index = 0, len = this.dynamicNodes.length; index < len; index++) {
                var value = templateValues[index];
                var dynamicNode = this.dynamicNodes[index];
                HtmlTemplate._applyValue(dynamicNode, value);
            }
            return this;
        }
    }, {
        key: 'saveTemplateToNode',
        value: function saveTemplateToNode(node) {
            node.yallaTemplate = this;
        }
    }, {
        key: 'destroy',
        value: function destroy() {
            for (var i = 0, len = this.nodeTree.length; i < len; i++) {
                var n = this.nodeTree[i];
                if (n instanceof Comment && isTextNode(n.yallaTemplate)) {
                    n.yallaTemplate.parentNode.removeChild(n.yallaTemplate);
                }
                n.parentNode.removeChild(n);
            }
        }
    }], [{
        key: '_applyValue',
        value: function _applyValue(node, value) {
            if (isAttributeNode(node)) {
                HtmlTemplate._applyAttributeNode(node, value);
            } else {
                HtmlTemplate._applyComponentNode(node, value);
            }
        }
    }, {
        key: '_applyComponentNode',
        value: function _applyComponentNode(node, value) {
            value = value || '';
            if (value instanceof HtmlTemplate) {
                if (itIsNotInitialized(node)) {
                    value.buildNodeTree().lookupDynamicNodes().appendSiblingFrom(node).applyValues().saveTemplateToNode(node);
                } else {
                    if (node.yallaTemplate instanceof HtmlTemplate) {

                        if (node.yallaTemplate.templateStaticString == value.templateStaticString) {
                            node.yallaTemplate.applyValues(value.templateValues);
                        } else {
                            node.yallaTemplate.destroy();
                            node.yallaTemplate = value.buildNodeTree().lookupDynamicNodes().appendSiblingFrom(node).applyValues();
                        }
                    } else {
                        node.parentNode.removeChild(node.yallaTemplate);
                        node.yallaTemplate = value.buildNodeTree().lookupDynamicNodes().appendSiblingFrom(node).applyValues();
                    }
                }
            } else if (value instanceof HtmlTemplateCollections) {
                if (itIsNotInitialized(node)) {
                    value.initializeCollections(node);
                } else {
                    if (node.yallaTemplate instanceof HtmlTemplateCollections) {
                        node.yallaTemplate.applyValues(value);
                    } else {
                        throw new Error('You seems to have different template !!');
                    }
                }
            } else {
                HtmlTemplate._applyTextToNode(value, node);
            }
        }
    }, {
        key: '_applyTextToNode',
        value: function _applyTextToNode(value, node) {
            value = value || '';
            var text = document.createTextNode(value.toString());
            if (node.yallaTemplate && isTextNode(node.yallaTemplate)) {
                node.parentNode.removeChild(node.yallaTemplate);
            }
            if (node.yallaTemplate && node.yallaTemplate instanceof HtmlTemplate) {
                node.yallaTemplate.destroy();
            }
            node.parentNode.insertBefore(text, node);
            node.yallaTemplate = text;
        }
    }, {
        key: '_applyAttributeNode',
        value: function _applyAttributeNode(node, value) {
            if (typeof value === 'function' && node.name.indexOf('on') === 0) {
                node.nodeValue = DATA_SEPARATOR;
                node.ownerElement[node.name] = value;
            } else {
                if (!node.valueOriginal) {
                    node.valueOriginal = node.value;
                }
                if (node.value.indexOf(SEPARATOR) < 0) {
                    node.value = node.valueOriginal;
                }
                if (isMinimizationAttribute(node)) {
                    node.ownerElement[node.nodeName] = value;
                } else {
                    var values = node.value.split(SEPARATOR);
                    var result = '';
                    for (var index = 0, len = values.length; index < len; index++) {
                        var data = values[index];
                        result = index == 0 ? data : '' + result + (index == 1 ? value : SEPARATOR) + data;
                    }
                    node.value = result;
                }
            }
        }
    }]);

    return HtmlTemplate;
}();

var HtmlTemplateCollections = function () {
    function HtmlTemplateCollections(keyFunction, mapFunction, source) {
        _classCallCheck(this, HtmlTemplateCollections);

        this.dictionary = {};
        this.keyFunction = keyFunction;
        this.mapFunction = mapFunction;
        this.keyOrders = [];

        for (var index = 0, len = source.length; index < len; index++) {
            var item = source[index];
            var key = this.keyFunction.apply(this, [item, index, source]);
            this.dictionary[key] = this.mapFunction.apply(this, [item, index, source]);
            if (!(this.dictionary[key] instanceof HtmlTemplate)) {
                this.dictionary[key] = new HtmlTemplate([this.dictionary[key]], []);
            }
            this.keyOrders.push(key);
        }
    }

    _createClass(HtmlTemplateCollections, [{
        key: 'initializeCollections',
        value: function initializeCollections(node) {
            for (var i = 0, len = this.keyOrders.length; i < len; i++) {
                var key = this.keyOrders[i];
                var v = this.dictionary[key];
                v.buildNodeTree().lookupDynamicNodes().appendSiblingFrom(node).applyValues();
            }
            node.yallaTemplate = this;
            this.node = node;
        }
    }, {
        key: 'applyValues',
        value: function applyValues(newTemplateCollections) {
            var newKeyOrders = [];
            for (var j = 0, len = this.keyOrders.length; j < len; j++) {
                var key = this.keyOrders[j];
                if (newTemplateCollections.keyOrders.indexOf(key) < 0) {
                    var dict = this.dictionary;
                    dict[key].destroy();
                    delete dict[key];
                } else {
                    newKeyOrders.push(key);
                }
            }
            this.keyOrders = newKeyOrders;
            var currentDict = this.dictionary;
            var newDict = newTemplateCollections.dictionary;
            var node = this.node;
            for (var i = newTemplateCollections.keyOrders.length - 1; i >= 0; i--) {
                var _key = newTemplateCollections.keyOrders[i];
                var _dict = newDict[_key];
                if (_key in currentDict) {
                    _dict = currentDict[_key];
                    _dict.applyValues(newDict[_key].templateValues);
                    if (_dict.nodeTree[_dict.nodeTree.length - 1].nextSibling != node) {

                        for (var _i = 0, _len2 = _dict.nodeTree.length; _i < _len2; _i++) {
                            var n = _dict.nodeTree[_i];
                            node.parentNode.insertBefore(n, node);
                        }
                    }
                    node = _dict.nodeTree[0];
                    newDict[_key] = _dict;
                } else {
                    _dict.buildNodeTree().lookupDynamicNodes().appendSiblingFrom(node).applyValues();
                }
                node = _dict.nodeTree[0];
                if (node instanceof Comment && node.yallaTemplate instanceof Text) {
                    node = node.yallaTemplate;
                }
            }
            this.dictionary = newTemplateCollections.dictionary;
            this.keyOrders = newTemplateCollections.keyOrders;
        }
    }]);

    return HtmlTemplateCollections;
}();

function htmlMap(source, keyFunction, mapFunction) {
    var keyFunc = typeof keyFunction === 'string' ? function (i) {
        return i[keyFunction];
    } : keyFunction;
    if (typeof keyFunc !== 'function') {
        throw new Error('Please provide keyFunction in htmlMap');
    }
    return new HtmlTemplateCollections(keyFunc, mapFunction, source);
}

function html(string) {
    for (var _len3 = arguments.length, values = Array(_len3 > 1 ? _len3 - 1 : 0), _key2 = 1; _key2 < _len3; _key2++) {
        values[_key2 - 1] = arguments[_key2];
    }

    return new HtmlTemplate(string, values);
}

function render(htmlTemplate, rootNode) {
    if (!rootNode || !htmlTemplate) {
        console.error('render(htmlTemplate,node) : htmlTemplate and node are mandatory');
        return;
    }
    var yallaTemplate = rootNode.yallaTemplate;

    if (!yallaTemplate) {
        htmlTemplate.buildNodeTree().lookupDynamicNodes().appendChildrenTo(rootNode).applyValues().saveTemplateToNode(rootNode);
    } else {
        rootNode.yallaTemplate.applyValues(htmlTemplate.templateValues);
    }
}