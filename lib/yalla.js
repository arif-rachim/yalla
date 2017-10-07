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
            var el = document.createElement('div');
            var innerHtml = this.templateStaticString;
            el.innerHTML = innerHtml;
            this.nodeTree = Array.from(el.childNodes);
            return this;
        }
    }, {
        key: 'lookupDynamicNodes',
        value: function lookupDynamicNodes() {
            var _this = this;

            var nodes = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.nodeTree;
            var results = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

            if (!nodes) {
                throw new Error('nodeTree does not exist in HtmlTemplate probably you need to call buildNodeTree');
            }
            this.dynamicNodes = nodes.reduce(function (results, node) {
                if (node instanceof Comment && node.textContent == DATA_SEPARATOR) {
                    results.push(node);
                }
                if (node.attributes) {
                    Array.from(node.attributes).reduce(function (results, attribute) {
                        if (attribute.nodeValue.indexOf(SEPARATOR) >= 0) {
                            var dynamicLength = attribute.nodeValue.split(SEPARATOR).length - 1;
                            for (var i = 0; i < dynamicLength; i++) {
                                results.push(attribute);
                            }
                        }
                        return results;
                    }, results);
                    _this.lookupDynamicNodes(Array.from(node.childNodes), results);
                }
                return results;
            }, results);
            return this;
        }
    }, {
        key: 'appendSiblingFrom',
        value: function appendSiblingFrom(node) {
            this.nodeTree.forEach(function (n) {
                return node.parentElement.insertBefore(n, node);
            });
            return this;
        }
    }, {
        key: 'appendChildrenTo',
        value: function appendChildrenTo(node) {
            this.nodeTree.forEach(function (n) {
                return node.appendChild(n);
            });
            return this;
        }
    }, {
        key: 'applyValues',
        value: function applyValues() {
            var templateValues = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.templateValues;

            this.dynamicNodes.reduce(function (templateValues, dynamicNode, index) {
                var value = templateValues[index];
                HtmlTemplate._applyValue(dynamicNode, value);
                return templateValues;
            }, templateValues);
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
            this.nodeTree.forEach(function (n) {
                return n.parentElement.removeChild(n);
            });
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
                        node.parentElement.removeChild(node.yallaTemplate);
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
                node.parentElement.removeChild(node.yallaTemplate);
            }
            if (node.yallaTemplate && node.yallaTemplate instanceof HtmlTemplate) {
                node.yallaTemplate.destroy();
            }
            node.parentElement.insertBefore(text, node);
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
                    node.value = node.value.split(SEPARATOR).reduce(function (result, data, index) {
                        return index == 0 ? data : '' + result + (index == 1 ? value : SEPARATOR) + data;
                    }, '');
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
        source.reduce(function (token, item, index, source) {
            var templateCollections = token.templateCollections,
                keyFunction = token.keyFunction,
                mapFunction = token.mapFunction,
                orders = token.orders;

            var key = keyFunction.apply(token.templateCollections, [item, index, source]);
            templateCollections.dictionary[key] = mapFunction.apply(templateCollections, [item, index, source]);
            if (!(templateCollections.dictionary[key] instanceof HtmlTemplate)) {
                templateCollections.dictionary[key] = new HtmlTemplate([templateCollections.dictionary[key]], []);
            }
            orders.push(key);
            return token;
        }, {
            templateCollections: this,
            keyFunction: this.keyFunction,
            mapFunction: this.mapFunction,
            orders: this.keyOrders
        });
    }

    _createClass(HtmlTemplateCollections, [{
        key: 'initializeCollections',
        value: function initializeCollections(node) {
            var _this2 = this;

            this.keyOrders.forEach(function (key) {
                var v = _this2.dictionary[key];
                v.buildNodeTree().lookupDynamicNodes().appendSiblingFrom(node).applyValues();
            });
            node.yallaTemplate = this;
            this.node = node;
        }
    }, {
        key: 'applyValues',
        value: function applyValues(newTemplateCollections) {
            var _this3 = this;

            this.keyOrders.filter(function (key) {
                return newTemplateCollections.keyOrders.indexOf(key) < 0;
            }).forEach(function (key) {
                _this3.keyOrders.splice(_this3.keyOrders.indexOf(key), 1);
                var dict = _this3.dictionary;
                dict[key].destroy();
                delete dict[key];
            });

            newTemplateCollections.keyOrders.reduceRight(function (token, key) {
                var currentDict = token.currentDict,
                    newDict = token.newDict,
                    node = token.node;

                var dict = newDict[key];

                if (key in currentDict) {
                    dict = currentDict[key];
                    dict.applyValues(newDict[key].templateValues);
                    if (dict.nodeTree[dict.nodeTree.length - 1].nextSibling != node) {
                        dict.nodeTree.forEach(function (n) {
                            return node.parentElement.insertBefore(n, node);
                        });
                    }
                    token.node = dict.nodeTree[0];
                    newDict[key] = dict;
                } else {
                    dict.buildNodeTree().lookupDynamicNodes().appendSiblingFrom(node).applyValues();
                }
                token.node = dict.nodeTree[0];
                return token;
            }, {
                currentDict: this.dictionary,
                newDict: newTemplateCollections.dictionary,
                keyOrderPos: this.keyOrders.map(function (key) {
                    return { key: key, pos: newTemplateCollections.keyOrders.indexOf(key) };
                }).sort(function (a, b) {
                    return a.pos - b.pos;
                }),
                node: this.node
            });

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
    for (var _len = arguments.length, values = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        values[_key - 1] = arguments[_key];
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