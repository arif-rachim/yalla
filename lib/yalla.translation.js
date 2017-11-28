'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _templateObject = _taggedTemplateLiteral(['<span id="', '" style="display: none">outlet</span>'], ['<span id="', '" style="display: none">outlet</span>']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if ((typeof module === 'undefined' ? 'undefined' : _typeof(module)) === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.yalla = factory();
        root.Context = root.yalla.Context;
        root.render = root.yalla.render;
        root.plug = root.yalla.plug;
    }
})(typeof self !== 'undefined' ? self : eval('this'), function () {

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
    * Variable yang menunjukan jika windows adalah Chrome atau bukan.
    */
    var isChrome = !!window.chrome && !!window.chrome.webstore;

    /*
    * Context merupakan Cache terhadap Tagged Template Literal `html` dan `htmlCollection`.
    */

    var Context = function () {
        function Context() {
            var _this = this;

            _classCallCheck(this, Context);

            /*Private variable untuk menyimpan cache object*/
            this._cache = {};
            /*
            * Private variable untuk menyimpan syncCallback
            */
            this._synccallbacks = [];
            /*
            * Tagged Template Literal yang menghasilkan object HtmlTemplate
            * */
            this.html = function (strings) {
                for (var _len = arguments.length, values = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                    values[_key - 1] = arguments[_key];
                }

                return new HtmlTemplate(strings, values, _this);
            };
            /*
            * Tagged Template Literal yang menghasilkan HtmlTemplateCollection object
            * */
            this.htmlCollection = function (arrayItems, keyFn, templateFn) {
                return new HtmlTemplateCollection(arrayItems, keyFn, templateFn, _this);
            };
        }

        /*
        * Mengembalikan nilai true jika terdapat cache berdasarkan key
        */


        _createClass(Context, [{
            key: 'hasCache',
            value: function hasCache(key) {
                return key in this._cache;
            }

            /*
            * Berfungsi untuk menyimpan value kedalam cache dan mengembalikan value yang disimpan di dalam cache.
            * Jika key tidak terdapat cache, maka value (parameter kedua) akan disimpan kedalam cache. Jika key sudah ada didalam cache
            * maka value yang disimpan didalam cache akan dikembalikan.
            */

        }, {
            key: 'cache',
            value: function cache(key, value) {
                if (!this.hasCache(key)) {
                    this._cache[key] = value;
                }
                return this._cache[key];
            }

            /*
            * Function yang berfungsi untuk menyimpan syncCallback closure. Synccallback closure adalah function yg berfungsi
            * untuk mensinkronisasikan node yang baru saja di clone oleh yalla.
            */

        }, {
            key: 'addSyncCallback',
            value: function addSyncCallback(callback) {
                this._synccallbacks.push(callback);
            }

            /*
            * Function yang berfungsi untuk mengeksekusi semua syncallback stack, kemudian membersihkan callback tersebut.
            */

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

    /*
    * Berfungsi untuk mengcloning seluruh node tree.
    */


    var deepCloneNode = function deepCloneNode(node) {
        if (isChrome) {
            return node.cloneNode(true);
        } else {
            var clone = node.nodeType == 3 ? document.createTextNode(node.nodeValue) : node.cloneNode(false);
            var child = node.firstChild;
            while (child) {
                clone.appendChild(deepCloneNode(child));
                child = child.nextSibling;
            }
            return clone;
        }
    };

    /*
    * Berfungsi untuk mengecek apakah parameter yang diberikan merupakan object Promise.
    */
    var isPromise = function isPromise(object) {
        return !!((typeof object === 'undefined' ? 'undefined' : _typeof(object)) === 'object' && 'constructor' in object && object.constructor.name === 'Promise');
    };

    /*
    * Berfungsi untuk menggenerate Global UID
    * */
    var guid = function guid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : r & 0x3 | 0x8;
            return v.toString(16);
        });
    };

    /*
    * Class Template adalah parent dari HtmlTempalte dan HtmlTemplateCollection. Method ini memiliki abstract function
    * destroy.
    * */

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

    /*
    * Function yang berfungsi untuk mengecek apakah attribute merupakan value dari node input.
    * */


    var isValueAttributeOfInput = function isValueAttributeOfInput(attributeName, nodeName) {
        return !!(attributeName.toUpperCase() === 'VALUE' && nodeName.toUpperCase() === 'INPUT');
    };

    /*
    * Mapping dari nama node dan parent nya.
    * */
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
        'li': 'ul',
        'g': 'svg',
        'circle': 'svg',
        'rect': 'svg',
        'polygon': 'svg',
        'eclipse': 'svg',
        'text': 'svg'
    };

    /*
    * Function yang berfungsi untuk mengecek apakah node merupakan minimizationNode
    * */
    var isMinimizationAttribute = function isMinimizationAttribute(node) {
        return ['checked', 'compact', 'declare', 'defer', 'disabled', 'ismap', 'noresize', 'noshade', 'nowrap', 'selected'].indexOf(node.nodeName) >= 0;
    };

    /*
    * Ketika kita memanggil htmlCollection template Tag, yalla akan menggenerate HtmlTemplateCollection object.
    * HtmlTemplateCollection object berisi informasi mengenai nilai dari daynamic part yang akan kita render ke dalam node.
    * Untuk render yang pertama kali, yalla akan membuat HtmlTemplateCollectionInstance object, HtmlTemplateCollectionInstance object
    * berisikan informasi mengenai template, outlet, dan node (instance) yang  digenerate oleh yalla.
    * */

    var HtmlTemplateCollectionInstance = function (_Template) {
        _inherits(HtmlTemplateCollectionInstance, _Template);

        /*
        * Constructor dari HtmlTemplateCollectionInstance
        * */
        function HtmlTemplateCollectionInstance(templateCollection, outlet) {
            _classCallCheck(this, HtmlTemplateCollectionInstance);

            /*
            * template berisi nilai dari HtmlTemplateCollection
            * */
            var _this2 = _possibleConstructorReturn(this, (HtmlTemplateCollectionInstance.__proto__ || Object.getPrototypeOf(HtmlTemplateCollectionInstance)).call(this));

            _this2.template = templateCollection;
            /*
            * Outlet yang dipakai oleh instance
            * */
            _this2.outlet = outlet;
            /*
            * Instance berisi nilai dari node yang dirender oleh HtmlTemplateCollection.
            * */
            _this2.instance = null;
            return _this2;
        }

        /*
        * Function yang digunakan untuk mengapply htmlCollectionTemplate yang baru.
        *
        * Jika properties instance masih null, artinya ini adalah initial rendering. Untuk initial rendering
        * maka function ini akan meng-iterate items dari htmlTemplateCollection, kemudian membuat outlet-child dari setiap item.
        * Kemudian function ini akan memanggil outlet-child.setContent, dan menyimpan outlet-child ke instance object
        * berdasarkan key dari item tersebut.
        *
        * Jika property instance memiliki nilai, maka pertama kali dipanggil newHtmlTemplateCollection iterateRight, untuk
        * menggenerate semua key dan templatenya. Kemudian funcion ini akan mengecek, apabila newHtmlTemplateCollection berisikan
        * items yang kosong, maka function ini akan men-delete content dengan menggunakan innerText = ''. Ini akan lebih cepat
        * dari pada mendelete item satu persatu.
        *
        * Tetapi jika items yang didalam newHtmlTemplateCollection tidak kosong, maka function ini akan mencari key yang diremove,
        * kemudian medelete item yang terasosiasi dengan key tersebut.
        *
        * Selanjutnya berdasarkan items dari newHtmlTemplateCollection, function ini akan mengiterate dari kanan satu persatu
        * outlet-child yang sudah terdaftar di instance. Jika outlet-child sudah terdaftar di instance, maka function ini akan memanggil setContent
        * dari outlet-child yang terdaftar di instance.
        *
        * Jika outlet-child belum terdaftar di instance berdasarkan key, maka function ini akan meng-create outlet-child, kemudian
        * memanggil outlet-child.setContent.
        *
        */


        _createClass(HtmlTemplateCollectionInstance, [{
            key: 'applyValues',
            value: function applyValues(newHtmlTemplateCollection) {
                var _this3 = this;

                if (this.instance === null) {
                    this.instance = {};
                    var outletPointer = this.outlet.commentNode;
                    newHtmlTemplateCollection.iterateRight(function (item, key, template) {
                        var outletChild = Outlet.from(document.createComment('outlet-child'));
                        outletPointer.parentNode.insertBefore(outletChild.commentNode, outletPointer);
                        Outlet.from(outletChild.commentNode).setContent(template);
                        outletPointer = outletChild.firstChildNode();
                        _this3.instance[key] = outletChild.commentNode;
                    });
                } else {
                    newHtmlTemplateCollection.iterateRight();
                    if (newHtmlTemplateCollection.items.length == 0) {
                        if (this.outlet.commentNode.parentNode.$htmlCollectionInstanceChild && this.outlet.commentNode.parentNode.$htmlCollectionInstanceChild.length == 1) {
                            var parentNode = this.outlet.commentNode.parentNode;
                            parentNode.innerText = '';
                            parentNode.appendChild(this.outlet.commentNode);
                            this.instance = {};
                        }
                    } else {
                        var oldHtmlTemplateCollection = this.template;
                        oldHtmlTemplateCollection.keys.forEach(function (key) {
                            var keyIsDeleted = newHtmlTemplateCollection.keys.indexOf(key) < 0;
                            if (keyIsDeleted) {
                                var commentNode = _this3.instance[key];
                                Outlet.from(commentNode).clearContent();
                                commentNode.remove();
                                delete _this3.instance[key];
                            }
                        });
                    }
                    var _outletPointer = this.outlet.commentNode;
                    newHtmlTemplateCollection.iterateRight(function (item, key, template) {
                        var commentNode = _this3.instance[key];
                        if (commentNode) {
                            var childPlaceholder = Outlet.from(commentNode);
                            if (childPlaceholder.content instanceof HtmlTemplateInstance) {
                                childPlaceholder.setHtmlTemplateContent(template);
                            } else if (childPlaceholder.content instanceof HtmlTemplateCollectionInstance) {
                                childPlaceholder.setHtmlTemplateCollectionContent(template);
                            } else {
                                childPlaceholder.setTextContent(template);
                            }
                            if (_outletPointer.previousSibling != commentNode) {
                                _outletPointer.parentNode.insertBefore(commentNode, _outletPointer);
                                childPlaceholder.validateInstancePosition();
                            }
                            _outletPointer = childPlaceholder.firstChildNode();
                        } else {
                            var _childPlaceholder = Outlet.from(document.createComment('outlet-child'));
                            _outletPointer.parentNode.insertBefore(_childPlaceholder.commentNode, _outletPointer);
                            Outlet.from(_childPlaceholder.commentNode).setContent(template);
                            _outletPointer = _childPlaceholder.firstChildNode();
                            _this3.instance[key] = _childPlaceholder.commentNode;
                            _this3.template.context.addSyncCallback(function () {
                                syncNode(template, _childPlaceholder.commentNode);
                            });
                        }
                    });
                    this.template = newHtmlTemplateCollection;
                }
            }

            /*
            * Method yang dipakai untuk men-destroy HtmlTemplateCollectionInstance. Function ini akan
            * mengiterate satu persatu outlet-child kemudian mendestroy outlet-child tersebut.
            * */

        }, {
            key: 'destroy',
            value: function destroy() {
                var _this4 = this;

                this.template.keys.forEach(function (key) {
                    var outletChildCommentNode = _this4.instance[key];
                    var outletChild = Outlet.from(outletChildCommentNode);
                    if (outletChild.content instanceof Template) {
                        outletChild.content.destroy();
                    } else {
                        outletChild.content.remove();
                    }
                    outletChildCommentNode.remove();
                    delete _this4.instance[key];
                });

                this.outlet = null;
                this.instance = null;
                this.template = null;
            }
        }]);

        return HtmlTemplateCollectionInstance;
    }(Template);

    /*
    * HtmlTemplateInstance adalah instance object dari HtmlTemplate. Ketika kita memanggil Template Tag `html`,
    * maka template tag tersebut akan mengembalikan object HtmlTemplate. HtmlTemplate berisikan nilai dari value yang terbaru.
    *
    * Ketika yalla merender HtmlTemplate kedalam node, maka yalla akan membuatkan object dari HtmlTemplateInstance berdasarkan
    * HtmlTemplate object. HtmlTemplateInstance memiliki informasi seperti HtmlTemplate yang digunakan, outlet object,
    * dan instance object yang berisikan node node yang akan dibuat. HtmlTemplateInstance juga memiliki nodeVaueIndexArray,
    * sebuah array object yang berisi informasi mengenai node yang akan dicreate, dan values yang berasosiasi dengan node tersebut.
    *
    * */


    var HtmlTemplateInstance = function (_Template2) {
        _inherits(HtmlTemplateInstance, _Template2);

        /*
        * Constructor dari HtmlTemplateInstance
        * */
        function HtmlTemplateInstance(template, outlet) {
            _classCallCheck(this, HtmlTemplateInstance);

            var _this5 = _possibleConstructorReturn(this, (HtmlTemplateInstance.__proto__ || Object.getPrototypeOf(HtmlTemplateInstance)).call(this));

            _this5.template = template;
            _this5.outlet = outlet;
            _this5.instance = [];
            _this5.nodeValueIndexArray = null;
            return _this5;
        }

        /*
        * Function applyValues adalah function yang digunakan untuk mengapply nilai dari htmlTemplate ke htmlTemplateInstance.
        * Apabila nilai dari property instance null, artinya ini adalah inisializasi awal dari htmlTemplateInstance. Kemudian
        * function ini akan memanggil htmlTemplate.applyValues dan mempassing nilai dari nodeValueIndexArray. Setelah itu
        * function ini memanggil cloneNode terhadap document fragment yang telah dicopy.
        * Setelah dicopy kemudian node yang baru disimpan kedalam property instance.
        *
        * Jika ternyata instance tidak null, maka kita langsung memanggil htmlTemplate.applyValues.
        * */


        _createClass(HtmlTemplateInstance, [{
            key: 'applyValues',
            value: function applyValues(newHtmlTemplate) {
                if (this.instance === null || this.instance.length === 0) {
                    HtmlTemplate.applyValues(newHtmlTemplate, this.template.nodeValueIndexArray);
                    var documentFragment = this.template.documentFragment;
                    var cloneNode = deepCloneNode(documentFragment);
                    var commentNode = this.outlet.commentNode;
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

            /*
            * Destroy adalah function yang digunakan untuk mendestroy htmlTemplateInstance. Destroy akan membersihkan
            * instance, nodeValueIndexArray, outlet, dan htmlTemplate
            * */

        }, {
            key: 'destroy',
            value: function destroy() {
                this.instance.forEach(function (i) {
                    return i.remove();
                });
                this.nodeValueIndexArray = null;
                this.outlet = null;
                this.template = null;
            }
        }]);

        return HtmlTemplateInstance;
    }(Template);

    /*
    * getPath merupakan function yang digunakan untuk mengambil path dari sebuah node.
    * */


    var getPath = function getPath(node) {
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
    };

    /*
    * Function yang digunakan untuk mengambil node dari document fragment berdasarkan pathnya.
    * */
    var getNode = function getNode(path, documentFragment) {
        return path.reduce(function (content, path) {
            if (typeof path == 'number') {
                return content.childNodes[path];
            } else {
                return content.attributes[path.name];
            }
        }, documentFragment);
    };

    /*
    * HtmlTemplateCollection adalah object yang dihasilkan oleh template tag `htmlCollection`. HtmlTemplateCollection
    * memiliki property seperti items yang akan dirender, keyFunction, templateFunction, context object.
    * */

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
            /*
            * Keys menyimpan urutan informasi dari item key.
            * */
            _this6.keys = [];
            /*
            * Templates merupakan map dari key dan template object.
            * */
            _this6.templates = {};
            _this6.initialzed = false;
            return _this6;
        }

        /*
        * Function iterateRight merupakan function yang dipanggil untuk mengiterasi array items. iterateRight juga bisa
        * menerima parameter callback. callback parameter yang dipanggil akan diberikan parameter item, key, template, dan index.
        * Apabila object ini belom di inisialisasi, maka key function akan dipanggil, tetapi apabila sudah pernah
        * diinisialisasi maka keyFunction dan templateFunction tidak akan dipanggil lagi.
        * */


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
        }]);

        return HtmlTemplateCollection;
    }(Template);

    /*
    * Function yang akan membandingkan dua parameter apakah nilai didalam kedua parameter sama atau tidak.
    * Jika nilai dari parameter adalah berupa array, maka function ini akan mengcompare ke setiap item didalamnya.
    * */


    var isMatch = function isMatch(newActualValues, values) {
        if (newActualValues === values) {
            return true;
        } else if (Array.isArray(newActualValues) && Array.isArray(values) && newActualValues.length == values.length) {
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

    /*
    * HtmlTemplate adalah object yang dibuat ketika kita memanggil html template tag. HtmlTemplate object berisi informasi
    * mengenai static strings, nilai dari values yang baru, dan context object.
    * */

    var HtmlTemplate = function (_Template4) {
        _inherits(HtmlTemplate, _Template4);

        /*
        * Constructor dari HtmlTemplate
        * */
        function HtmlTemplate(strings, values, context) {
            _classCallCheck(this, HtmlTemplate);

            var _this7 = _possibleConstructorReturn(this, (HtmlTemplate.__proto__ || Object.getPrototypeOf(HtmlTemplate)).call(this));

            _this7.strings = strings;
            _this7.values = values;
            _this7.context = context;
            /*
            * Key berisikan informasi mengenai strings yang di join.
            * */
            _this7.key = _this7.strings.join('').trim();
            /*
            * nodeValueIndexArray adalah property yg berisi nilai value dari node, dan indexnya.
            * */
            _this7.nodeValueIndexArray = null;
            /*
            * Property yang berisikan documentFragment yang berisikan node.
            * */
            _this7.documentFragment = null;
            return _this7;
        }

        _createClass(HtmlTemplate, [{
            key: 'buildTemplate',
            value: function buildTemplate(templateString) {
                this.documentFragment = HtmlTemplate.getProperTemplateTag(templateString);
                this.nodeValueIndexArray = this.buildNodeValueIndex(this.documentFragment, this.documentFragment.nodeName);
                HtmlTemplate.applyValues(this, this.nodeValueIndexArray);
            }

            /*
            * Function ini untuk membuat nodeValueIndexArray dari document fragment. Function ini akan meng iterate
            * documentFragment childNodes, kemudian akan mengecek seandainya node berupa Element, maka function ini
            * akan mengiterate attribute didalamnya. Jika attribute memiliki yalla outlet comment node maka attribute tersebut
            * akan dibuatkan nodeValueIndex arraynya dengan disimpan attributenya, valueIndex dan nodeValuenya.
            *
            * Jika elementnya berupa style, maka function ini akan menyimpan nodenya, valueIndex dan nodeValuenya.
            *
            * Jika node berupa comment dengan nilai outlet, maka function ini akan menyimpan nodenya, kemudian valueIndexnya.
            *
            * */

        }, {
            key: 'buildNodeValueIndex',
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
                        nodeValueIndexArray = nodeValueIndexArray.concat(this.buildNodeValueIndex(node, node.nodeName));
                    }
                    if (node.nodeType === Node.TEXT_NODE && documentFragmentNodeName.toUpperCase() === 'STYLE') {
                        var _nodeValue = node.nodeValue;
                        var _nodeValueIndexMap = HtmlTemplate.lookNodeValueArray(_nodeValue);
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
                        node.nodeValue = 'outlet';
                        nodeValueIndexArray.push({ node: node, valueIndexes: parseInt(_nodeValue2) });
                    }
                } while (node = node.nextSibling);
                return nodeValueIndexArray;
            }

            /*
            * LookNodeValueArray function ini digunakan untuk mencari nodeValueArray dari parameter nodeValue, ini digunakan
            * terutama untuk pencarian nodeValueArray dari attribute atau style text.
            * */

        }, {
            key: 'constructTemplate',


            /*
            * Function yang digunakan untuk meng-construct template. Function ini akan mengecek apakah cache sudah memiliki
            * htmlTemplate, jika tidak maka function in akan memanggil buildTemplate kemudian menempatkannya kedalam cache.
            * */
            value: function constructTemplate() {
                if (!this.context.hasCache(this.key)) {
                    var templateString = this.buildStringSequence();
                    this.buildTemplate(templateString);
                    return this.context.cache(this.key, this);
                }
                return this.context.cache(this.key);
            }

            /*
            * Function yang digunakan untuk membuat string sequence.
            * */

        }, {
            key: 'buildStringSequence',
            value: function buildStringSequence() {
                return this.strings.reduce(function (result, string, index) {
                    return index == 0 ? string : result + '<!--' + (index - 1) + '-->' + string;
                }, '').trim();
            }

            /*
            * Function yang akan meng-apply values dari htmlTemplate yang baru, kedalam nodeValueIndexArray.
            * Function ini akan meng-iterate nodeValueIndexArray, kemudian setiap nodeValueIndex dilakukan pengecekan,
            * jika value yang lama dan value yang baru nilainya sama, maka proses akan di skip. Jika berbeda kemudian akan
            * dilakukan pengecekan lagi node yang akan di apply.
            *
            * Jika node merupakan event node, maka akan di assign function callback yang baru. Akan tetapi jika node merupakan
            * attribute node biasa maka akan di assign nilai baru
            *
            * Jika attribute node merupakan minization attribute, maka kita akan assign attribute tersebut dengan nilai kosong,
            * tetapi akan assign property dengan nilai sesuai dengan boolean valuenya.
            *
            * Jika attribute merupakan .bind maka kita akan menset nilai attribute dengan meremove nama .bind di element.
            *
            * Kalau tipe node adalah Text, maka kita akan mereplace nama text tersebut dengan nilai attribute yang baru.
            *
            */

        }], [{
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

            /*
            * Function yang digunakan untuk mencari parent template tag yang tepat berdasarkan contentText.
            * */

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
            key: 'applyValues',
            value: function applyValues(nextHtmlTemplate, nodeValueIndexArray) {
                var newValues = nextHtmlTemplate.values;

                if (!nodeValueIndexArray) {
                    return;
                }

                nodeValueIndexArray.forEach(function (nodeValueIndex, index) {
                    var node = nodeValueIndex.node,
                        valueIndexes = nodeValueIndex.valueIndexes,
                        values = nodeValueIndex.values;

                    var newActualValues = Array.isArray(valueIndexes) ? valueIndexes.map(function (valueIndex) {
                        return newValues[valueIndex];
                    }) : newValues[valueIndexes];

                    var nodeName = node.nodeName;
                    var isEvent = node.nodeType === Node.ATTRIBUTE_NODE && nodeName.indexOf('on') === 0;

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
                            var actualAttributeValue = nodeValue;
                            var valFiltered = valueIndexes.map(function (valueIndex) {
                                return newValues[valueIndex];
                            });
                            valueIndexes.forEach(function (valueIndex, index) {
                                actualAttributeValue = actualAttributeValue.replace('<!--' + valueIndex + '-->', valFiltered[index]);
                            });
                            if (isMinimizationAttribute(node)) {
                                node.ownerElement[nodeName] = actualAttributeValue.trim() == 'true';
                                node.ownerElement.setAttribute(nodeName, '');
                            } else {
                                node.ownerElement.setAttribute(nodeName, actualAttributeValue);
                                if (isValueAttributeOfInput(nodeName, node.ownerElement.nodeName)) {
                                    node.ownerElement[nodeName] = actualAttributeValue;
                                }
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
                            return newValues[valueIndex];
                        });
                        valueIndexes.forEach(function (valueIndex, index) {
                            _actualAttributeValue = _actualAttributeValue.replace('<!--' + valueIndex + '-->', _valFiltered[index]);
                        });
                        node.nodeValue = _actualAttributeValue;
                    }
                    if (node.nodeType === Node.COMMENT_NODE) {
                        var _nodeValue3 = node.nodeValue;
                        var value = newValues[valueIndexes];
                        Outlet.from(node).setContent(value);
                    }
                    nodeValueIndex.values = newActualValues;
                });
            }
        }]);

        return HtmlTemplate;
    }(Template);

    /*
    * SyncNode merupakan function yang digunakan untuk mensinkronisasikan node dan template yang baru. Jika outlet
    * content merupakan htmlTemplateInstance, maka kita akan memanggil nodeValueIndexArray.
    * */


    var syncNode = function syncNode(nextTemplate, node) {
        var outlet = Outlet.from(node);
        if (outlet.content && outlet.content instanceof HtmlTemplateInstance) {
            var htmlTemplateInstance = outlet.content;
            var originalTemplate = htmlTemplateInstance.template;
            var templateValues = nextTemplate.values;
            var docFragment = { childNodes: htmlTemplateInstance.instance };
            if (originalTemplate.nodeValueIndexArray == null) {
                var cacheTemplate = originalTemplate.context.cache(originalTemplate.key);

                var documentFragment = { childNodes: outlet.content.instance };
                htmlTemplateInstance.nodeValueIndexArray = cacheTemplate.nodeValueIndexArray.map(function (nodeValueIndex) {
                    var node = nodeValueIndex.node,
                        nodeValue = nodeValueIndex.nodeValue,
                        valueIndexes = nodeValueIndex.valueIndexes;

                    var actualNode = getNode(getPath(node), documentFragment);
                    var values = Array.isArray(valueIndexes) ? valueIndexes.map(function (index) {
                        return templateValues[index];
                    }) : templateValues[valueIndexes];
                    var newNodeValueIndex = { node: actualNode, valueIndexes: valueIndexes, values: values };
                    var isStyleNode = actualNode.parentNode && actualNode.parentNode.nodeName.toUpperCase() === 'STYLE';
                    if (isStyleNode) {
                        return { node: actualNode, valueIndexes: valueIndexes, nodeValue: nodeValue, values: values };
                    } else if (actualNode.nodeType === Node.ATTRIBUTE_NODE) {
                        var marker = Marker.from(actualNode);
                        var nodeName = actualNode.nodeName;
                        var isEvent = nodeName.indexOf('on') === 0;
                        if (isEvent) {
                            var valueIndex = valueIndexes[0];
                            marker.attributes[nodeName] = templateValues[valueIndex];
                            var eventName = nodeName.substring(2, nodeName.length);
                            actualNode.ownerElement.setAttribute(nodeName, 'return false;');
                            actualNode.ownerElement[nodeName] = templateValues[valueIndex];
                        } else {
                            var actualAttributeValue = nodeValue;
                            var valFiltered = valueIndexes.map(function (valueIndex) {
                                return templateValues[valueIndex];
                            });
                            valueIndexes.forEach(function (valueIndex, index) {
                                actualAttributeValue = actualAttributeValue.replace('<!--' + valueIndex + '-->', valFiltered[index]);
                            });
                            marker.attributes[nodeName] = actualAttributeValue;
                        }
                        return { node: actualNode, valueIndexes: valueIndexes, nodeValue: nodeValue, values: values };
                    } else {
                        var _outlet = Outlet.from(actualNode);
                        var value = templateValues[valueIndexes];
                        if (value instanceof HtmlTemplate) {
                            _outlet.constructHtmlTemplateContent(value);
                            syncNode(value, _outlet.commentNode);
                        } else if (value instanceof HtmlTemplateCollection) {
                            _outlet.constructHtmlTemplateCollectionContent(value);
                            syncNode(value, _outlet.commentNode);
                        } else {
                            _outlet.constructTextContent();
                        }

                        return { node: actualNode, valueIndexes: valueIndexes, values: values };
                    }
                });
            } else {
                htmlTemplateInstance.nodeValueIndexArray = originalTemplate.nodeValueIndexArray.map(function (nodeValueIndex) {
                    var nodeValue = nodeValueIndex.nodeValue,
                        valueIndexes = nodeValueIndex.valueIndexes;

                    var path = getPath(nodeValueIndex.node);
                    var actualNode = getNode(path, docFragment);
                    var values = Array.isArray(valueIndexes) ? valueIndexes.map(function (index) {
                        return templateValues[index];
                    }) : templateValues[valueIndexes];
                    var isStyleNode = actualNode.parentNode && actualNode.parentNode.nodeName.toUpperCase() === 'STYLE';
                    if (isStyleNode) {
                        return { node: actualNode, valueIndexes: valueIndexes, nodeValue: nodeValue, values: values };
                    } else if (actualNode.nodeType === Node.ATTRIBUTE_NODE) {
                        var marker = Marker.from(actualNode);
                        var nodeName = actualNode.nodeName;
                        var isEvent = nodeName.indexOf('on') === 0;
                        if (isEvent) {
                            var valueIndex = valueIndexes[0];
                            marker.attributes[nodeName] = templateValues[valueIndex];
                            var eventName = nodeName.substring(2, nodeName.length);
                            actualNode.ownerElement.setAttribute(nodeName, 'return false;');
                            actualNode.ownerElement[nodeName] = templateValues[valueIndex];
                        } else {
                            var actualAttributeValue = nodeValue;
                            var valFiltered = valueIndexes.map(function (valueIndex) {
                                return templateValues[valueIndex];
                            });
                            valueIndexes.forEach(function (valueIndex, index) {
                                actualAttributeValue = actualAttributeValue.replace('<!--' + valueIndex + '-->', valFiltered[index]);
                            });
                            marker.attributes[nodeName] = actualAttributeValue;
                        }
                        return { node: actualNode, valueIndexes: valueIndexes, nodeValue: nodeValue, values: values };
                    } else {
                        var _outlet2 = Outlet.from(actualNode);
                        var value = templateValues[valueIndexes];
                        if (value instanceof HtmlTemplate) {
                            _outlet2.constructHtmlTemplateContent(value);
                            syncNode(value, _outlet2.commentNode);
                        } else if (value instanceof HtmlTemplateCollection) {
                            _outlet2.constructHtmlTemplateCollectionContent(value);
                            syncNode(value, _outlet2.commentNode);
                        } else {
                            _outlet2.constructTextContent();
                        }

                        return { node: actualNode, valueIndexes: valueIndexes, values: values };
                    }
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

    /*
    * Function yang berfungsi untuk merender templateValue ke dalam node container.
    * */
    var render = function render(templateValue, node) {
        var updateFunction = function updateFunction() {
            Outlet.from(node).setContent(templateValue);
            if (!node.$synced) {
                syncNode(templateValue, node);
                node.$synced = true;
            }
        };
        if (requestAnimationFrame in window) {
            requestAnimationFrame(function () {
                updateFunction();
            });
        } else {
            updateFunction();
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
    };

    /*
    * Marker adalah object yang berisikan informasi mengenai attribute dengan keynya yang terdapat di dalam node.
    * */

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

    var _ref = new Context(),
        html = _ref.html;

    /*
    * Outlet adalah object yang menyimpan informasi mengenai content dan comment node.
    * */


    var Outlet = function () {
        /*
        * Constructor dari Outlet
        * */
        function Outlet(commentNode) {
            _classCallCheck(this, Outlet);

            this.commentNode = commentNode;
            this.content = null;
        }

        /*
        * Fungsi yang berfungsi untuk mengconstruct text kedalam outlet
        * */


        _createClass(Outlet, [{
            key: 'constructTextContent',
            value: function constructTextContent() {
                this.content = this.commentNode.previousSibling;
            }

            /*
            * Fungsi untuk mengconstruct htmlTemplateCollection kedalam outlet
            * */

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
                    } while (pointer.nodeType != Node.COMMENT_NODE && pointer.nodeValue !== 'outlet-child');
                    _this8.content.instance[key] = pointer;
                });
            }

            /*
            * Fungsi untuk mengconstruct htmlTemplate kedalam outlet
            * */

        }, {
            key: 'constructHtmlTemplateContent',
            value: function constructHtmlTemplateContent(htmlTemplate) {
                var childNodesLength = htmlTemplate.context.cache(htmlTemplate.key).documentFragment.childNodes.length;
                this.content = new HtmlTemplateInstance(htmlTemplate, this);
                var sibling = this.commentNode;
                while (childNodesLength--) {
                    sibling = sibling.previousSibling;
                    this.content.instance.push(sibling);
                }
                this.content.instance.reverse();
            }

            /*
            * Generic function untuk menset content dari outlet.
            * */

        }, {
            key: 'setContent',
            value: function setContent(template) {
                var _this9 = this;

                if (isPromise(template)) {
                    if (this.content === null) {
                        var _self = this;
                        var id = guid();
                        this.setHtmlTemplateContent(html(_templateObject, id));
                        template.then(function (result) {
                            var templateContent = document.getElementById(id);
                            var newCommentNode = templateContent.nextSibling;
                            Outlet.from(newCommentNode).setContent(result);
                            _self.clearContent();
                        });
                    } else {
                        template.then(function (result) {
                            _this9.setContent(result);
                        });
                    }
                } else if (template instanceof Plug) {
                    template.factory.apply(null, [this]);
                } else if (template instanceof HtmlTemplate) {
                    this.setHtmlTemplateContent(template);
                } else if (template instanceof HtmlTemplateCollection) {
                    this.setHtmlTemplateCollectionContent(template);
                } else {
                    this.setTextContent(template);
                }
            }

            /*
            * Function yang berguna untuk menset text content.
            * */

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

            /*
            * Function yang berguna untuk men set htmlTemplateCollection
            * */

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
                    syncNode(htmlTemplateCollection, this.commentNode);
                }
            }

            /*
            * Function yang berguna untuk menset htmlTemplateContent
            * */

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
                    syncNode(htmlTemplate, this.commentNode);
                }
            }

            /*
            * Function yang berguna untuk membersihkan content
            * */

        }, {
            key: 'clearContent',
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

            /*
            * Function yang berguna untuk mengconstruct Outlet dari node.
            * */

        }, {
            key: 'firstChildNode',


            /*
            * Function yang berguna untuk mengembalikan node pertama dari content.
            * */
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

            /*
            * Function yang berguna untuk mem-validate instance position dari node.
            * */

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
                    // not required since we already sync when rendering
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
                    node.$data = node.$data || new Outlet(node);
                    return node.$data;
                } else {
                    if (!node.$outlet) {
                        node.$outlet = document.createComment('outlet');
                        node.appendChild(node.$outlet);
                    }
                    return Outlet.from(node.$outlet);
                }
            }
        }]);

        return Outlet;
    }();

    /*
    * Plug adalah object yang meyimpan informasi mengenai factory dari plug.
    * */


    var Plug = function Plug(factory) {
        _classCallCheck(this, Plug);

        this.factory = factory;
    };

    /*
    * Function yang digunakan untuk membuat object plug.
    * */


    var plug = function plug(callback) {
        return new Plug(callback);
    };
    return { Context: Context, render: render, plug: plug };
});