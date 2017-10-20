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

/*
 PLACEHOLDER_CONTENT is a constant used to mark a placeholder
 */
//const PLACEHOLDER_CONTENT = '∞';
var PLACEHOLDER_CONTENT = 'placeholder';
/*
 PlaceHolder is a Comment node that contains a PLACEHOLDER_CONTENT value
 */
var PLACEHOLDER = '<!--' + PLACEHOLDER_CONTENT + '-->';

/*
 Function to validate whether the node is a minimization
 */
var isMinimizationAttribute = function isMinimizationAttribute(node) {
    return ['checked', 'compact', 'declare', 'defer', 'disabled', 'ismap', 'noresize', 'noshade', 'nowrap', 'selected'].indexOf(node.nodeName) >= 0;
};

/*
 TemplateRoot is a mapping of elements that require certain tag as their parent
 */
var templateRoot = {
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

/*
Convert Nodelist to Array
 */
var arrayFrom = function arrayFrom(nodeList) {
    var arr = [];
    for (var i = nodeList.length; i--; arr.unshift(nodeList[i])) {}
    return arr;
};
/*
 Function used to render values into an Element. Value can be HtmlTemplate, HtmlTemplateCollection,
 or a Text while the element is a dom element.
 */
function render(templateValue, element) {
    // if the element has never rendered the 'templateValue' then it has no content.
    if (!element.$content) {
        // placeHolder is Node.COMMENT used as a marker where templateValue will be rendered
        var placeHolder = document.createComment(PLACEHOLDER_CONTENT);
        // we add placeholder to the element to be rendered.
        element.appendChild(placeHolder);
        element.$content = placeHolder;
    }
    _render(templateValue, element.$content);
}

/*
 Function used to destroy templateValue. TemplateValue can be HtmlTemplate, HtmlTemplateCollection or Text.
 */
function destroy(templateValue) {
    if (templateValue instanceof HtmlTemplate) {
        templateValue.destroy();
    } else if (templateValue instanceof HtmlTemplateCollection) {
        templateValue.destroy();
    } else if (templateValue.parentNode) {
        templateValue.parentNode.removeChild(templateValue);
    }
}

/*
 Function used to render templateValue in placeHolder position.
 PlaceHolder is a Node.COMMENT that is used as a placemark where templateValue will be rendered
 */
function _render(templateValue, placeHolder) {
    if (templateValue instanceof HtmlTemplate) {
        // if templateValue is an instance of HtmlTemplate, we will call _renderHtmlTemplate
        _renderHtmlTemplate(templateValue, placeHolder);
    } else if (templateValue instanceof HtmlTemplateCollection) {
        // if templateValue is an HtmlTemplateCollection we will call _renderHtmlTemplateCollection
        _renderHtmlTemplateCollection(templateValue, placeHolder);
    } else {
        // apart from HtmlTemplate or HtmlTemplateCollection we will call _renderText
        _renderText(templateValue, placeHolder);
    }
}

/*
 Function that return the first node of a templateValue or a placeHolder.
 */
function getFirstNodeFromTemplate(templateValue, placeHolder) {
    if (templateValue instanceof HtmlTemplate) {
        // If the template value is HtmlTemplate then we will return the nodeTree index 0.
        return templateValue.nodeTree[0];
    } else if (templateValue instanceof HtmlTemplateCollection) {
        // If the template value is HtmlTemplateCollection then we will return it based on key index position to 0.
        return getFirstNodeFromTemplate(templateValue.templateValuesContainer[templateValue.keys[0]], placeHolder);
    } else {
        // If the template value is Text, then we will return the content.
        return placeHolder.$content;
    }
}

/*
 Function used to render templateCollectionValue into placeHolder.
 */
function _renderHtmlTemplateCollection(templateCollectionValue, placeHolder) {
    // variable yang menyimpan placeHolder children yang baru
    var placeHolderContainer = {};
    // variable yang menyimpan placeHolder children yang lama
    var oldPlaceHolderContainer = {};
    // variable yang menyimpan templateCollectionValue yang lama
    var oldTemplateCollectionValue = placeHolder.$content;

    /*
     If there is an old templateCollectionValue, then we will remove the existing templateValue children in the new templateCollectionValue.
     But if the old templateCollection is not HtmlTemplateCollection then we will destroy the old template collection
     */
    if (oldTemplateCollectionValue) {
        /*
         If the oldTemplateCollection value instance of HtmlTemplateCollection, then we will remove all the children the key is not listed in the new templateCollection.
         */
        if (oldTemplateCollectionValue instanceof HtmlTemplateCollection) {
            oldPlaceHolderContainer = oldTemplateCollectionValue.placeHolderContainer;
            oldTemplateCollectionValue.keys.forEach(function (oldKey) {
                if (templateCollectionValue.keys.indexOf(oldKey) < 0) {
                    var oldPlaceHolder = oldPlaceHolderContainer[oldKey];
                    removePlaceholder(oldPlaceHolder);
                }
            });
        } else {
            /*
             If it turns out the old templateCollection is not HtmlTemplateCollection then we will destroy the oldTemplateCollectionValue
             */
            destroy(oldTemplateCollectionValue);
            oldTemplateCollectionValue = null;
        }
    }

    /*
     We iterate templateCollectionValue keys from right by using reduce right, then will do the checking
     if there is oldChildPlaceholder from oldPlaceHolderContainer, then we will use oldChildPlaceHolder
     rather than the new childPlaceholder.
     */
    templateCollectionValue.keys.reduceRight(function (expectedSibling, key) {
        // disini kita panggil childTemplateValue dari templateCollectionValue
        var childTemplateValue = templateCollectionValue.templateValuesContainer[key];

        // kemudian kita create childPlaceHolder
        var childPlaceHolder = document.createComment(PLACEHOLDER_CONTENT);
        if (oldPlaceHolderContainer[key]) {
            // bila terdapat key dari oldPlaceHolderContainer maka kita gunakan oldChildPlaceHolder dari oldPlaceHolderContainer.
            childPlaceHolder = oldPlaceHolderContainer[key];

            // bila terdapat oldChildTemplateValue dari oldTemplateCollectionValue maka kita akan gunakan oldChildTemplateValue sebagai
            // templateValue yang baru.
            var oldChildTemplateValue = oldTemplateCollectionValue.templateValuesContainer[key];
            if (oldChildTemplateValue instanceof HtmlTemplate && childTemplateValue instanceof HtmlTemplate && oldChildTemplateValue.key == childTemplateValue.key) {
                templateCollectionValue.templateValuesContainer[key] = oldChildTemplateValue;
            }
        }
        /* Jika childPlaceHolder nextSibling tidak ada, atau nextSibling bukan expectedSibling, maka kita tempatkan
         childPlaceHolder ini disebelah expectedSibling.
         */
        if (!childPlaceHolder.nextSibling || childPlaceHolder.nextSibling != expectedSibling) {
            placeHolder.parentNode.insertBefore(childPlaceHolder, expectedSibling);
        }
        // kemudian kita tempatekan childPlaceHolder kedalam placeHolderContainer yang baru
        placeHolderContainer[key] = childPlaceHolder;
        // Kemudian kita render childTemplateValue ke dalam childPlaceHolder
        _render(childTemplateValue, childPlaceHolder);

        // mengembalikan first node dari templateCollectionValue
        return getFirstNodeFromTemplate(templateCollectionValue.templateValuesContainer[key], childPlaceHolder);
    }, placeHolder);
    // menempatkan placeHolderContainer kedalam templateCollectionValue yang baru
    templateCollectionValue.placeHolderContainer = placeHolderContainer;
    // menempatkan $content kedalam placeHolder.
    placeHolder.$content = templateCollectionValue;
}

/*
 Function used to remove placeHolder
 */
function removePlaceholder(placeHolder) {
    if (placeHolder.$content instanceof HtmlTemplate || placeHolder.$content instanceof HtmlTemplateCollection) {
        // Jika placeHolder.$content merupakan HtmlTemplate kita kita akan mendestroy dulu kemudian remove.
        placeHolder.$content.destroy();
    }
    placeHolder.parentNode.removeChild(placeHolder);
}

/*
 function used to build templateValue, on its placeholder
 */
function _buildTemplate(templateValue, placeHolder) {
    templateValue.generateNodeTree().forEach(function (node) {
        return placeHolder.parentNode.insertBefore(node, placeHolder);
    });
    placeHolder.$content = templateValue;
}

/*
 Function to render HtmlTemplate on its placeHolder
 */
function _renderHtmlTemplate(templateValue, placeHolder) {
    // Jika placeHolder memiliki $content artinya placeHolder sudah pernah merender content.
    if (placeHolder.$content) {
        var oldTemplateValue = placeHolder.$content;
        // Jika oldTemplateValue merukanan HtmlTemplate maka kita akan melakukan update
        if (oldTemplateValue instanceof HtmlTemplate) {
            // mengupdate oldTemplateValue(HtmlTemplate) dengan values yang baru
            oldTemplateValue.applyValues(templateValue.values);
            // kemudian kita me-reallign apakah nodeTree sudah berada di posisi sibling yang benar
            oldTemplateValue.nodeTree.reduceRight(function (sibling, item) {
                if (item.nextSibling && item.nextSibling != sibling && sibling.parentNode) {
                    sibling.parentNode.insertBefore(item, sibling);
                }
                return item;
            }, placeHolder);
        } else {
            // Jika ternyata placeholder.$content bukan merupakan HtmlTemplate, maka kita destroy templateValue tersebut.
            destroy(oldTemplateValue);
            // sekarang kita buat lagi templatenya berdasarkan placeHolder yang sama
            _buildTemplate(templateValue, placeHolder);
        }
    } else {
        // kita buat templateValue yang baru dari placeholder
        _buildTemplate(templateValue, placeHolder);
    }
}

/*
 Function to render templateValue as Text on its placeHolder.
 */
function _renderText(templateValue, placeHolder) {
    if (placeHolder.parentNode == null) {
        return;
    }
    // Jika sudah terdapat oldTemplateValue kita gunakan template value yang lama, atau kita destroy dan gunakan yang baru
    var oldTemplateValue = placeHolder.$content;
    if (oldTemplateValue) {
        if (oldTemplateValue.nodeType && oldTemplateValue.nodeType === Node.TEXT_NODE) {
            if (oldTemplateValue.nodeValue == templateValue) {
                return;
            }
            oldTemplateValue.nodeValue = templateValue;
            return;
        } else {
            destroy(oldTemplateValue);
        }
    }
    // kemudian kita buat text node dari templateValue
    var textNode = document.createTextNode(templateValue);
    // setelah itu kita insert textNode ke sebelah placeHolder
    placeHolder.parentNode.insertBefore(textNode, placeHolder);
    // kemudian kita simpan textNode ke placeHolder
    placeHolder.$content = textNode;
}

/*
 html is a function to create an HtmlTemplate object
 */
function html(strings) {
    var key = strings.join('').replace(/\s/g, '');

    for (var _len = arguments.length, values = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        values[_key - 1] = arguments[_key];
    }

    return new HtmlTemplate(strings, values, key);
}

/*
 The cache used to save the HtmlTemplate, thus speeding up the key creation.
 */
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

/*
 htmlCollection is a function to create an HtmlTemplateCollection object
 */
function htmlCollection(items, keyFn, templateFn) {
    return new HtmlTemplateCollection(items, keyFn, templateFn);
}

var _cache = {};

/*
 Class that stores information about the collection template
   HtmlTemplateCollection has several attributes:
   1. items: attribute that contains items or data
   2. keyFn: function that map object and its key, receive input item and return string from key
   3. templatefn: function that returns a templateValue instance eg HtmlTemplate, HtmlTemplateCollection, or Text
   4. keys: arrays containing sequences of keys based on their order
   5. templateValuesContainer: container from templateValues
   6. placeHolderContainer: container from placeHolder used to render the collection
 */

var HtmlTemplateCollection = function () {
    function HtmlTemplateCollection(items, keyFn, templateFn) {
        _classCallCheck(this, HtmlTemplateCollection);

        this.items = items;
        this.keyFn = typeof keyFn === 'function' ? keyFn : function (i) {
            return i[keyFn];
        };
        this.templateFn = templateFn;
        this.keys = [];
        this.templateValuesContainer = {};
        this.placeHolderContainer = {};
        this._init();
    }

    /*
     Function to initialize item, key into HtmlTemplateCollection
     */


    _createClass(HtmlTemplateCollection, [{
        key: '_init',
        value: function _init() {
            var index = this.items.length;
            while (index--) {
                var item = this.items[index];
                var key = this.keyFn.apply(this, [item]);
                this.templateValuesContainer[key] = this.templateFn.apply(this, [item, index, this.items]);
                this.keys.push(key);
            }
            this.keys.reverse();
        }

        /*
         Function called to destroy HtmlTemplateCollection
         */

    }, {
        key: 'destroy',
        value: function destroy() {
            var _this = this;

            this.keys.forEach(function (key) {
                if (_this.templateValuesContainer[key] instanceof HtmlTemplate) {
                    _this.templateValuesContainer[key].destroy();
                    _this.placeHolderContainer[key].parentNode.removeChild(_this.placeHolderContainer[key]);
                }
            });

            this.keys = [];
            this.templateValuesContainer = {};
            this.items = {};
            this.placeHolderContainer = {};
        }
    }]);

    return HtmlTemplateCollection;
}();

/*
 Function to take the path of a node up in documentFragment
 */


function getPath(node) {
    var i = 0;
    var child = node;
    while ((child = child.previousSibling) != null) {
        i++;
    }
    var path = [];
    path.push(i);
    if (node.parentNode && node.parentNode.parentNode) {
        return path.concat(getPath(node.parentNode));
    }
    return path;
}

/*
 Class that stores information about templateValue. HtmlTemplate has attribute
   1. strings: static strings
   2. values: or dynamic values
   3. key: used as cache or name of template
 */

var HtmlTemplate = function () {
    function HtmlTemplate(strings, values, key) {
        _classCallCheck(this, HtmlTemplate);

        this.strings = strings;
        this.values = values;
        this.key = key;
    }

    /*
     Function to generate nodeTree
     */


    _createClass(HtmlTemplate, [{
        key: 'generateNodeTree',
        value: function generateNodeTree() {
            var key = this.key;
            // jika key sudah terdapat di cache, maka kita gunakan template untuk mempercepat pembuatan htmlTemplate.
            if (!_cache[key]) {
                var _template = this._getProperTemplateTag(this.strings.join(PLACEHOLDER).trim());
                _cache[key] = _template;
            }
            var template = _cache[key];
            // kita clone document fragment dari template
            var documentFragment = template.cloneNode(true);
            /*
             if the template does not have dynamicNode Path, it means that this is the first time the tempalte has been created,
             then we will create dynamicNodesPath by calling coldStart.
             */
            if (!template.dynamicNodesPath) {
                this._coldStart(documentFragment);
                template.dynamicNodesPath = this.dynamicNodesPath;
            } else {
                /*
                 If the template already has dynamicNodesPath, then we will use dynamicNodesPath template
                 to pull dynamicNodes by using warmStart.
                 */
                this.dynamicNodesPath = template.dynamicNodesPath;
                this._warmStart(documentFragment);
            }
            // after we get the dynamicNodes we save the childNodes document fragment to nodeTree.
            this.nodeTree = arrayFrom(documentFragment.childNodes);
            return this.nodeTree;
        }
    }, {
        key: '_getProperTemplateTag',
        value: function _getProperTemplateTag(contentText) {
            var template = null;
            var openTag = contentText.substring(1, contentText.indexOf('>'));
            openTag = (openTag.indexOf(' ') > 0 ? openTag.substring(0, openTag.indexOf(' ')) : openTag).toLowerCase();
            var rootTag = templateRoot[openTag];
            if (rootTag) {
                template = document.createElement(rootTag);
            } else {
                template = document.createElement('div');
            }
            template.innerHTML = contentText;
            return template;
        }

        /*
         The Coldstart function will populate dynamicNodes, and dynamicNodesPath from document fragment
         */

    }, {
        key: '_coldStart',
        value: function _coldStart(documentFragment) {
            var dynamicNodes = [];
            var dynamicNodesPath = [];
            // fungsi yang akan mengambil dynamicNodes dari path.
            this._lookDynamicNodes(arrayFrom(documentFragment.childNodes), dynamicNodes, dynamicNodesPath);
            this.dynamicNodes = dynamicNodes;
            this.dynamicNodesPath = dynamicNodesPath.map(function (path) {
                return path.reverse();
            });
            this.applyValues(this.values);
        }

        /*
         Warm start, will assign dynamic nodes of dynamicNodesPath, then apply values based on dynamicNodes that have been adapted.
         */

    }, {
        key: '_warmStart',
        value: function _warmStart(documentFragment) {
            this.dynamicNodes = this._lookDynamicNodesFromPath(documentFragment, this.dynamicNodesPath);
            this.applyValues(this.values);
        }

        /*
         Function that searches dynamicNodes in a documentFragment with dynamicNodesPath
         */

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

        /*
         Function that looks for dynamicNodes, from documentFragment.childNodes, then saves the result into dynamicNodes, dynamicNodesPath
         */

    }, {
        key: '_lookDynamicNodes',
        value: function _lookDynamicNodes(documentFragmentChildNodes, dynamicNodes, dynamicNodesPath) {
            var _this2 = this;

            documentFragmentChildNodes.forEach(function (node) {
                if (node instanceof Comment && node.nodeValue == PLACEHOLDER_CONTENT) {
                    dynamicNodes.push(node);
                    dynamicNodesPath.push(getPath(node));
                } else if (node.attributes) {
                    arrayFrom(node.attributes).reduce(function (results, attribute) {
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
                                dynamicNodesPath.push(path);
                            }
                        }
                        return results;
                    }, dynamicNodes);
                    _this2._lookDynamicNodes(arrayFrom(node.childNodes), dynamicNodes, dynamicNodesPath);
                }
            });
        }

        /*
         Function that will apply templateValues
         */

    }, {
        key: 'applyValues',
        value: function applyValues(templateValues) {
            this.dynamicNodes.forEach(function (dynamicNode, index) {
                if (dynamicNode.nodeType === Node.ATTRIBUTE_NODE) {
                    HtmlTemplate._applyAttributeNode(dynamicNode, templateValues[index]);
                } else {
                    _render(templateValues[index], dynamicNode);
                }
            });
        }

        /*
         Function to destroy HtmlTemplate
         */

    }, {
        key: 'destroy',
        value: function destroy() {
            this.nodeTree.forEach(function (n) {
                return n.parentNode.removeChild(n);
            });
        }

        /*
         Function to apply attribute node.
         */

    }], [{
        key: '_applyAttributeNode',
        value: function _applyAttributeNode(node, value) {
            /*
             If the attribute is a function, and the node name has a prefix on, then we assume it's an attribute event so we will call ownerElement [node.name]
             */
            if (typeof value === 'function' && node.name.indexOf('on') === 0) {
                node.nodeValue = false;
                var eventName = node.name.substring(2, node.name.length);
                node.ownerElement.addEventListener(eventName, value);
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