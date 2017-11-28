(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.yalla = factory();
        root.Context = root.yalla.Context;
        root.render = root.yalla.render;
        root.plug = root.yalla.plug;
    }
}(typeof self !== 'undefined' ? self : eval('this'), function () {


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
    let isChrome = !!window.chrome && !!window.chrome.webstore;


    /*
    * Context merupakan Cache terhadap Tagged Template Literal `html` dan `htmlCollection`.
    */
    class Context {

        constructor() {
            /*Private variable untuk menyimpan cache object*/
            this._cache = {};
            /*
            * Private variable untuk menyimpan syncCallback
            */
            this._synccallbacks = [];
            /*
            * Tagged Template Literal yang menghasilkan object HtmlTemplate
            * */
            this.html = (strings, ...values) => new HtmlTemplate(strings, values, this);
            /*
            * Tagged Template Literal yang menghasilkan HtmlTemplateCollection object
            * */
            this.htmlCollection = (arrayItems, keyFn, templateFn) => new HtmlTemplateCollection(arrayItems, keyFn, templateFn, this);
        }

        /*
        * Mengembalikan nilai true jika terdapat cache berdasarkan key
        */
        hasCache(key) {
            return key in this._cache;
        }

        /*
        * Berfungsi untuk menyimpan value kedalam cache dan mengembalikan value yang disimpan di dalam cache.
        * Jika key tidak terdapat cache, maka value (parameter kedua) akan disimpan kedalam cache. Jika key sudah ada didalam cache
        * maka value yang disimpan didalam cache akan dikembalikan.
        */
        cache(key, value) {
            if (!this.hasCache(key)) {
                this._cache[key] = value;
            }
            return this._cache[key];
        }

        /*
        * Function yang berfungsi untuk menyimpan syncCallback closure. Synccallback closure adalah function yg berfungsi
        * untuk mensinkronisasikan node yang baru saja di clone oleh yalla.
        */
        addSyncCallback(callback) {
            this._synccallbacks.push(callback);
        }

        /*
        * Function yang berfungsi untuk mengeksekusi semua syncallback stack, kemudian membersihkan callback tersebut.
        */
        clearSyncCallbacks() {
            this._synccallbacks.forEach(cb => {
                cb.apply();
            });
            this._synccallbacks = [];
        }
    }

    /*
    * Berfungsi untuk mengcloning seluruh node tree.
    */
    const deepCloneNode = (node) => {
        if (isChrome) {
            return node.cloneNode(true);
        } else {
            let clone = node.nodeType == 3 ? document.createTextNode(node.nodeValue) : node.cloneNode(false);
            let child = node.firstChild;
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
    const isPromise = (object) =>{
        return !!(typeof object === 'object' && 'constructor' in object && object.constructor.name === 'Promise');

    };

    /*
    * Berfungsi untuk menggenerate Global UID
    * */
    const guid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });

    /*
    * Class Template adalah parent dari HtmlTempalte dan HtmlTemplateCollection. Method ini memiliki abstract function
    * destroy.
    * */
    class Template {
        destroy() {
            console.log('WARNING NOT IMPLEMENTED YET ');
        }
    }

    /*
    * Function yang berfungsi untuk mengecek apakah attribute merupakan value dari node input.
    * */
    const isValueAttributeOfInput = (attributeName,nodeName) => {
        return !!(attributeName.toUpperCase() === 'VALUE' && nodeName.toUpperCase() === 'INPUT');
    };

    /*
    * Mapping dari nama node dan parent nya.
    * */
    const TEMPLATE_ROOT = {
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
        'g' : 'svg',
        'circle' : 'svg',
        'rect' : 'svg',
        'polygon' : 'svg',
        'eclipse' : 'svg',
        'text' : 'svg'
    };

    /*
    * Function yang berfungsi untuk mengecek apakah node merupakan minimizationNode
    * */
    const isMinimizationAttribute = node => {
        return ['checked', 'compact', 'declare', 'defer', 'disabled', 'ismap',
                'noresize', 'noshade', 'nowrap', 'selected'].indexOf(node.nodeName) >= 0;
    };

    /*
    * Ketika kita memanggil htmlCollection template Tag, yalla akan menggenerate HtmlTemplateCollection object.
    * HtmlTemplateCollection object berisi informasi mengenai nilai dari daynamic part yang akan kita render ke dalam node.
    * Untuk render yang pertama kali, yalla akan membuat HtmlTemplateCollectionInstance object, HtmlTemplateCollectionInstance object
    * berisikan informasi mengenai template, outlet, dan node (instance) yang  digenerate oleh yalla.
    * */
    class HtmlTemplateCollectionInstance extends Template {
        /*
        * Constructor dari HtmlTemplateCollectionInstance
        * */
        constructor(templateCollection, outlet) {
            super();
            /*
            * template berisi nilai dari HtmlTemplateCollection
            * */
            this.template = templateCollection;
            /*
            * Outlet yang dipakai oleh instance
            * */
            this.outlet = outlet;
            /*
            * Instance berisi nilai dari node yang dirender oleh HtmlTemplateCollection.
            * */
            this.instance = null;
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
        applyValues(newHtmlTemplateCollection) {
            if (this.instance === null) {
                this.instance = {};
                let outletPointer = this.outlet.commentNode;
                newHtmlTemplateCollection.iterateRight((item, key, template) => {
                    let outletChild = Outlet.from(document.createComment('outlet-child'));
                    outletPointer.parentNode.insertBefore(outletChild.commentNode, outletPointer);
                    Outlet.from(outletChild.commentNode).setContent(template);
                    outletPointer = outletChild.firstChildNode();
                    this.instance[key] = outletChild.commentNode;
                });
            } else {
                newHtmlTemplateCollection.iterateRight();
                if(newHtmlTemplateCollection.items.length == 0){
                    if(this.outlet.commentNode.parentNode.$htmlCollectionInstanceChild && this.outlet.commentNode.parentNode.$htmlCollectionInstanceChild.length == 1){
                        let parentNode = this.outlet.commentNode.parentNode;
                        parentNode.innerText = '';
                        parentNode.appendChild(this.outlet.commentNode);
                        this.instance = {};
                    }
                }else{
                    let oldHtmlTemplateCollection = this.template;
                    oldHtmlTemplateCollection.keys.forEach(key => {
                        let keyIsDeleted = newHtmlTemplateCollection.keys.indexOf(key) < 0;
                        if (keyIsDeleted) {
                            let commentNode = this.instance[key];
                            Outlet.from(commentNode).clearContent();
                            commentNode.remove();
                            delete this.instance[key];
                        }
                    });
                }
                let outletPointer = this.outlet.commentNode;
                newHtmlTemplateCollection.iterateRight((item, key, template) => {
                    let commentNode = this.instance[key];
                    if (commentNode) {
                        let childPlaceholder = Outlet.from(commentNode);
                        if (childPlaceholder.content instanceof HtmlTemplateInstance) {
                            childPlaceholder.setHtmlTemplateContent(template);
                        } else if (childPlaceholder.content instanceof HtmlTemplateCollectionInstance) {
                            childPlaceholder.setHtmlTemplateCollectionContent(template);
                        } else {
                            childPlaceholder.setTextContent(template);
                        }
                        if (outletPointer.previousSibling != commentNode) {
                            outletPointer.parentNode.insertBefore(commentNode, outletPointer);
                            childPlaceholder.validateInstancePosition();
                        }
                        outletPointer = childPlaceholder.firstChildNode();
                    } else {
                        let childPlaceholder = Outlet.from(document.createComment('outlet-child'));
                        outletPointer.parentNode.insertBefore(childPlaceholder.commentNode, outletPointer);
                        Outlet.from(childPlaceholder.commentNode).setContent(template);
                        outletPointer = childPlaceholder.firstChildNode();
                        this.instance[key] = childPlaceholder.commentNode;
                        this.template.context.addSyncCallback(function () {
                            syncNode(template,childPlaceholder.commentNode);
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
        destroy() {
            this.template.keys.forEach(key => {
                let outletChildCommentNode = this.instance[key];
                let outletChild = Outlet.from(outletChildCommentNode);
                if (outletChild.content instanceof Template) {
                    outletChild.content.destroy();
                } else {
                    outletChild.content.remove();
                }
                outletChildCommentNode.remove();
                delete this.instance[key];
            });

            this.outlet = null;
            this.instance = null;
            this.template = null;
        }
    }

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
    class HtmlTemplateInstance extends Template {
        /*
        * Constructor dari HtmlTemplateInstance
        * */
        constructor(template, outlet) {
            super();
            this.template = template;
            this.outlet = outlet;
            this.instance = [];
            this.nodeValueIndexArray = null;
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
        applyValues(newHtmlTemplate) {
            if (this.instance === null || this.instance.length === 0) {
                HtmlTemplate.applyValues(newHtmlTemplate, this.template.nodeValueIndexArray);
                let documentFragment = this.template.documentFragment;
                let cloneNode = deepCloneNode(documentFragment);
                let commentNode = this.outlet.commentNode;
                let cloneChildNode = cloneNode.childNodes[0];
                let nextSibling = null;
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
        destroy() {
            this.instance.forEach(i => i.remove());
            this.nodeValueIndexArray = null;
            this.outlet = null;
            this.template = null;
        }

    }

    /*
    * getPath merupakan function yang digunakan untuk mengambil path dari sebuah node.
    * */
    const getPath = (node) => {
        if (node.nodeType === Node.ATTRIBUTE_NODE) {
            return getPath(node.ownerElement).concat([{name: node.nodeName}]);
        }
        let i = 0;
        let child = node;
        while ((child = child.previousSibling) != null) {
            i++;
        }
        let path = [];
        path.push(i);
        if (node.parentNode && node.parentNode.parentNode) {
            return getPath(node.parentNode).concat(path);
        }
        return path;
    }

    /*
    * Function yang digunakan untuk mengambil node dari document fragment berdasarkan pathnya.
    * */
    const getNode = (path, documentFragment) => {
        return path.reduce(function (content, path) {
            if (typeof path == 'number') {
                return content.childNodes[path];
            } else {
                return content.attributes[path.name];
            }
        }, documentFragment);

    }

    /*
    * HtmlTemplateCollection adalah object yang dihasilkan oleh template tag `htmlCollection`. HtmlTemplateCollection
    * memiliki property seperti items yang akan dirender, keyFunction, templateFunction, context object.
    * */
    class HtmlTemplateCollection extends Template {
        constructor(items, keyFn, templateFn, context) {
            super();
            this.items = items;
            this.keyFn = typeof keyFn === 'string' ? (item => item[keyFn]) : keyFn;
            this.templateFn = templateFn;
            this.context = context;
            /*
            * Keys menyimpan urutan informasi dari item key.
            * */
            this.keys = [];
            /*
            * Templates merupakan map dari key dan template object.
            * */
            this.templates = {};
            this.initialzed = false;
        }

        /*
        * Function iterateRight merupakan function yang dipanggil untuk mengiterasi array items. iterateRight juga bisa
        * menerima parameter callback. callback parameter yang dipanggil akan diberikan parameter item, key, template, dan index.
        * Apabila object ini belom di inisialisasi, maka key function akan dipanggil, tetapi apabila sudah pernah
        * diinisialisasi maka keyFunction dan templateFunction tidak akan dipanggil lagi.
        * */
        iterateRight(callback) {
            if (!this.initialzed) {
                let index = this.items.length - 1;
                while (index >= 0) {
                    let item = this.items[index];
                    let key = this.keyFn.apply(this, [item, index]);

                    let template = this.templateFn.apply(this, [item, index]);
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
                let index = this.keys.length - 1;
                while (index >= 0) {
                    let item = this.items[index];
                    let key = this.keys[index];
                    let template = this.templates[key];
                    if (callback) {
                        callback.apply(null, [item, key, template, index]);
                    }
                    index--;
                }
            }
        }
    }

    /*
    * Function yang akan membandingkan dua parameter apakah nilai didalam kedua parameter sama atau tidak.
    * Jika nilai dari parameter adalah berupa array, maka function ini akan mengcompare ke setiap item didalamnya.
    * */
    const isMatch = (newActualValues, values) => {
        if (newActualValues === values) {
            return true;
        } else if (Array.isArray(newActualValues) && Array.isArray(values) && newActualValues.length == values.length) {
            let isMatch = true;
            for (let i = 0; i < values.length; i++) {
                isMatch = isMatch && (newActualValues[i] === values[i]);
                if (!isMatch) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }

    /*
    * HtmlTemplate adalah object yang dibuat ketika kita memanggil html template tag. HtmlTemplate object berisi informasi
    * mengenai static strings, nilai dari values yang baru, dan context object.
    * */
    class HtmlTemplate extends Template {

        /*
        * Constructor dari HtmlTemplate
        * */
        constructor(strings, values, context) {
            super();
            this.strings = strings;
            this.values = values;
            this.context = context;
            /*
            * Key berisikan informasi mengenai strings yang di join.
            * */
            this.key = this.strings.join('').trim();
            /*
            * nodeValueIndexArray adalah property yg berisi nilai value dari node, dan indexnya.
            * */
            this.nodeValueIndexArray = null;
            /*
            * Property yang berisikan documentFragment yang berisikan node.
            * */
            this.documentFragment = null;
        }

        buildTemplate(templateString) {
            this.documentFragment = HtmlTemplate.getProperTemplateTag(templateString);
            this.nodeValueIndexArray = this.buildNodeValueIndex(this.documentFragment,this.documentFragment.nodeName);
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
        buildNodeValueIndex(documentFragment,documentFragmentNodeName) {

            let childNodes = documentFragment.childNodes;
            let nodeValueIndexArray = [];
            let node = childNodes[0];
            if (undefined === node) {
                return nodeValueIndexArray;
            }
            do {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    let attributes = node.attributes;
                    let k = attributes.length;
                    for (let attributeIndex = 0; attributeIndex < k; attributeIndex++) {
                        let nodeValue = attributes[attributeIndex].nodeValue;
                        let nodeValueIndexMap = HtmlTemplate.lookNodeValueArray(nodeValue);
                        if (nodeValueIndexMap.length == 0) {
                            continue;
                        }
                        let valueIndexes = nodeValueIndexMap.map(function (x) {
                            return x.match(/[\w\.]+/)[0];
                        }).map(i => parseInt(i));
                        if (valueIndexes && valueIndexes.length > 0) {
                            nodeValueIndexArray.push({
                                node: attributes[attributeIndex],
                                valueIndexes: valueIndexes,
                                nodeValue: nodeValue
                            });
                        }
                    }
                    nodeValueIndexArray = nodeValueIndexArray.concat(this.buildNodeValueIndex(node,node.nodeName));
                }
                if (node.nodeType === Node.TEXT_NODE && documentFragmentNodeName.toUpperCase() === 'STYLE') {
                    let nodeValue = node.nodeValue;
                    let nodeValueIndexMap = HtmlTemplate.lookNodeValueArray(nodeValue);
                    if (nodeValueIndexMap.length == 0) {
                        continue;
                    }

                    let valueIndexes = nodeValueIndexMap.map(function (x) {
                        return x.match(/[\w\.]+/)[0];
                    }).map(i => parseInt(i));

                    if (valueIndexes && valueIndexes.length > 0) {
                        nodeValueIndexArray.push({node: node, valueIndexes: valueIndexes, nodeValue: nodeValue});
                    }
                }
                if (node.nodeType === Node.COMMENT_NODE) {
                    let nodeValue = node.nodeValue;
                    node.nodeValue = 'outlet';
                    nodeValueIndexArray.push({node: node, valueIndexes: parseInt(nodeValue)});
                }
            } while (node = node.nextSibling);
            return nodeValueIndexArray;
        }

        /*
        * LookNodeValueArray function ini digunakan untuk mencari nodeValueArray dari parameter nodeValue, ini digunakan
        * terutama untuk pencarian nodeValueArray dari attribute atau style text.
        * */
        static lookNodeValueArray(nodeValue) {
            let result = [];
            let pointerStart = nodeValue.indexOf('<!--');
            let pointerEnd = nodeValue.indexOf('-->', pointerStart);

            while (pointerEnd < nodeValue.length && pointerEnd >= 0 && pointerStart >= 0) {
                result.push(nodeValue.substring((pointerStart + 4), pointerEnd));
                pointerStart = nodeValue.indexOf('<!--', (pointerEnd + 3));
                pointerEnd = nodeValue.indexOf('-->', pointerStart);
            }
            return result;
        }

        /*
        * Function yang digunakan untuk mencari parent template tag yang tepat berdasarkan contentText.
        * */
        static getProperTemplateTag(contentText) {
            let openTag = contentText.substring(1, contentText.indexOf('>'));
            openTag = (openTag.indexOf(' ') > 0 ? openTag.substring(0, openTag.indexOf(' ')) : openTag).toLowerCase();
            let rootTag = TEMPLATE_ROOT[openTag];
            rootTag = rootTag || 'div';
            let template = document.createElement(rootTag);
            template.innerHTML = contentText;
            return template;
        }

        /*
        * Function yang digunakan untuk meng-construct template. Function ini akan mengecek apakah cache sudah memiliki
        * htmlTemplate, jika tidak maka function in akan memanggil buildTemplate kemudian menempatkannya kedalam cache.
        * */
        constructTemplate() {
            if (!this.context.hasCache(this.key)) {
                let templateString = this.buildStringSequence();
                this.buildTemplate(templateString);
                return this.context.cache(this.key, this);
            }
            return this.context.cache(this.key);
        }

        /*
        * Function yang digunakan untuk membuat string sequence.
        * */
        buildStringSequence() {
            return this.strings.reduce((result, string, index)=> {
                return index == 0 ? string : `${result}<!--${(index - 1)}-->${string}`;
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
        static applyValues(nextHtmlTemplate, nodeValueIndexArray) {
            let newValues = nextHtmlTemplate.values;

            if (!nodeValueIndexArray) {
                return;
            }

            nodeValueIndexArray.forEach((nodeValueIndex, index)=> {
                let {node, valueIndexes, values} = nodeValueIndex;
                let newActualValues = Array.isArray(valueIndexes) ? valueIndexes.map(valueIndex => newValues[(valueIndex)]) : newValues[valueIndexes];

                let nodeName = node.nodeName;
                let isEvent = node.nodeType === Node.ATTRIBUTE_NODE && nodeName.indexOf('on') === 0;

                // if values are match, or ifts named eventListener then we dont need to perform update
                if (isMatch(newActualValues, values) || (isEvent && newActualValues[0].name)) {
                    return;
                }
                if (node.nodeType === Node.ATTRIBUTE_NODE) {
                    let marker = Marker.from(node);
                    let nodeValue = nodeValueIndex.nodeValue;
                    if (isEvent) {
                        let valueIndex = valueIndexes[0];
                        node.ownerElement[nodeName] = newValues[valueIndex];
                        marker.attributes[nodeName] = newValues[valueIndex];
                    } else {
                        let actualAttributeValue = nodeValue;
                        let valFiltered = valueIndexes.map(valueIndex => newValues[(valueIndex)]);
                        valueIndexes.forEach((valueIndex, index) => {
                            actualAttributeValue = actualAttributeValue.replace(`<!--${valueIndex}-->`, valFiltered[index]);
                        });
                        if (isMinimizationAttribute(node)) {
                            node.ownerElement[nodeName] = actualAttributeValue.trim() == 'true';
                            node.ownerElement.setAttribute(nodeName, '');
                        } else {
                            node.ownerElement.setAttribute(nodeName, actualAttributeValue);
                            if(isValueAttributeOfInput(nodeName,node.ownerElement.nodeName)){
                                node.ownerElement[nodeName] = actualAttributeValue;
                            }
                        }
                        if (nodeName.indexOf('.bind') >= 0) {
                            let attributeName = nodeName.substring(0, nodeName.indexOf('.bind'));
                            node.ownerElement.setAttribute(attributeName, actualAttributeValue);
                        }
                        marker.attributes[nodeName] = actualAttributeValue;
                    }
                }
                if (node.nodeType === Node.TEXT_NODE) {
                    let actualAttributeValue = nodeValueIndex.nodeValue;
                    let valFiltered = valueIndexes.map(valueIndex => newValues[(valueIndex)]);
                    valueIndexes.forEach((valueIndex, index) => {
                        actualAttributeValue = actualAttributeValue.replace(`<!--${valueIndex}-->`, valFiltered[index]);
                    });
                    node.nodeValue = actualAttributeValue;
                }
                if (node.nodeType === Node.COMMENT_NODE) {
                    let nodeValue = node.nodeValue;
                    let value = newValues[valueIndexes];
                    Outlet.from(node).setContent(value);
                }
                nodeValueIndex.values = newActualValues;
            });

        }
    }

    /*
    * SyncNode merupakan function yang digunakan untuk mensinkronisasikan node dan template yang baru. Jika outlet
    * content merupakan htmlTemplateInstance, maka kita akan memanggil nodeValueIndexArray.
    * */
    const syncNode = (nextTemplate,node) => {
        let outlet = Outlet.from(node);
        if (outlet.content && outlet.content instanceof HtmlTemplateInstance) {
            let htmlTemplateInstance = outlet.content;
            let originalTemplate = htmlTemplateInstance.template;
            let templateValues = nextTemplate.values;
            let docFragment = {childNodes: htmlTemplateInstance.instance};
            if(originalTemplate.nodeValueIndexArray == null){
                let cacheTemplate = originalTemplate.context.cache(originalTemplate.key);

                let documentFragment = {childNodes:outlet.content.instance};
                htmlTemplateInstance.nodeValueIndexArray = cacheTemplate.nodeValueIndexArray.map(nodeValueIndex => {
                    let {node,nodeValue,valueIndexes} = nodeValueIndex;
                    let actualNode = getNode(getPath(node),documentFragment);
                    let values = Array.isArray(valueIndexes) ? valueIndexes.map(index => templateValues[index]) : templateValues[valueIndexes];
                    let newNodeValueIndex = {node : actualNode,valueIndexes,values};
                    let isStyleNode = actualNode.parentNode && actualNode.parentNode.nodeName.toUpperCase() === 'STYLE';
                    if (isStyleNode) {
                        return {node: actualNode, valueIndexes, nodeValue, values}
                    } else if (actualNode.nodeType === Node.ATTRIBUTE_NODE) {
                        let marker = Marker.from(actualNode);
                        let nodeName = actualNode.nodeName;
                        let isEvent = nodeName.indexOf('on') === 0;
                        if (isEvent) {
                            let valueIndex = valueIndexes[0];
                            marker.attributes[nodeName] = templateValues[valueIndex];
                            let eventName = nodeName.substring(2, nodeName.length);
                            actualNode.ownerElement.setAttribute(nodeName, 'return false;');
                            actualNode.ownerElement[nodeName] = templateValues[valueIndex];
                        } else {
                            let actualAttributeValue = nodeValue;
                            let valFiltered = valueIndexes.map(valueIndex => templateValues[(valueIndex)]);
                            valueIndexes.forEach((valueIndex, index) => {
                                actualAttributeValue = actualAttributeValue.replace(`<!--${valueIndex}-->`, valFiltered[index]);
                            });
                            marker.attributes[nodeName] = actualAttributeValue;
                        }
                        return {node: actualNode, valueIndexes, nodeValue, values}
                    } else {
                        let outlet = Outlet.from(actualNode);
                        let value = templateValues[valueIndexes];
                        if (value instanceof HtmlTemplate) {
                            outlet.constructHtmlTemplateContent(value);
                            syncNode(value,outlet.commentNode);
                        }
                        else if (value instanceof HtmlTemplateCollection) {
                            outlet.constructHtmlTemplateCollectionContent(value);
                            syncNode(value,outlet.commentNode);
                        }
                        else {
                            outlet.constructTextContent();
                        }

                        return {node: actualNode, valueIndexes, values}
                    }
                });
            }else{
                htmlTemplateInstance.nodeValueIndexArray = originalTemplate.nodeValueIndexArray.map(nodeValueIndex => {
                    let {nodeValue, valueIndexes} = nodeValueIndex;
                    let path = getPath(nodeValueIndex.node);
                    let actualNode = getNode(path, docFragment);
                    let values = Array.isArray(valueIndexes) ? valueIndexes.map(index => templateValues[index]) : templateValues[valueIndexes];
                    let isStyleNode = actualNode.parentNode && actualNode.parentNode.nodeName.toUpperCase() === 'STYLE';
                    if (isStyleNode) {
                        return {node: actualNode, valueIndexes, nodeValue, values}
                    } else if (actualNode.nodeType === Node.ATTRIBUTE_NODE) {
                        let marker = Marker.from(actualNode);
                        let nodeName = actualNode.nodeName;
                        let isEvent = nodeName.indexOf('on') === 0;
                        if (isEvent) {
                            let valueIndex = valueIndexes[0];
                            marker.attributes[nodeName] = templateValues[valueIndex];
                            let eventName = nodeName.substring(2, nodeName.length);
                            actualNode.ownerElement.setAttribute(nodeName, 'return false;');
                            actualNode.ownerElement[nodeName] = templateValues[valueIndex];
                        } else {
                            let actualAttributeValue = nodeValue;
                            let valFiltered = valueIndexes.map(valueIndex => templateValues[(valueIndex)]);
                            valueIndexes.forEach((valueIndex, index) => {
                                actualAttributeValue = actualAttributeValue.replace(`<!--${valueIndex}-->`, valFiltered[index]);
                            });
                            marker.attributes[nodeName] = actualAttributeValue;
                        }
                        return {node: actualNode, valueIndexes, nodeValue, values}
                    } else {
                        let outlet = Outlet.from(actualNode);
                        let value = templateValues[valueIndexes];
                        if (value instanceof HtmlTemplate) {
                            outlet.constructHtmlTemplateContent(value);
                            syncNode(value,outlet.commentNode);
                        }
                        else if (value instanceof HtmlTemplateCollection) {
                            outlet.constructHtmlTemplateCollectionContent(value);
                            syncNode(value,outlet.commentNode);
                        }
                        else {
                            outlet.constructTextContent();
                        }

                        return {node: actualNode, valueIndexes, values}
                    }
                });
            }
        }
        if (outlet.content && outlet.content instanceof HtmlTemplateCollectionInstance) {
            let htmlTemplateCollectionInstance = outlet.content;
            let templates = htmlTemplateCollectionInstance.template.templates;
            let keys = htmlTemplateCollectionInstance.template.keys;
            outlet.commentNode.parentNode.$htmlCollectionInstanceChild = outlet.commentNode.parentNode.$htmlCollectionInstanceChild || [];
            outlet.commentNode.parentNode.$htmlCollectionInstanceChild.push(outlet.commentNode);
            keys.forEach(key => {
                let template = templates[key];
                let commentNode = htmlTemplateCollectionInstance.instance[key];
                let outlet = Outlet.from(commentNode);
                if (outlet.content === null) {
                    if (template instanceof HtmlTemplate) {
                        outlet.constructHtmlTemplateContent(template.context.cache(template.key));
                        syncNode(template,commentNode);
                    }
                } else {
                    if (outlet.content instanceof HtmlTemplateInstance) {
                        syncNode(template,commentNode);
                    }
                }
            });
        }
    }

    /*
    * Function yang berfungsi untuk merender templateValue ke dalam node container.
    * */
    const render = (templateValue, node) => {
        let updateFunction = () => {
            Outlet.from(node).setContent(templateValue);
            if (!node.$synced) {
                syncNode(templateValue,node);
                node.$synced = true;
            }
        };
        if(requestAnimationFrame in window){
            requestAnimationFrame(()=>{
                updateFunction();
            });
        }else{
            updateFunction();
        }

        if ('Promise' in window) {
            return new Promise(function (resolve) {
                setTimeout(() => {
                    templateValue.context.clearSyncCallbacks();
                    resolve();
                }, 300);
            });
        } else {
            setTimeout(() => {
                templateValue.context.clearSyncCallbacks();
            }, 300);
        }
    }

    /*
    * Marker adalah object yang berisikan informasi mengenai attribute dengan keynya yang terdapat di dalam node.
    * */
    class Marker {

        constructor(node) {
            this.node = node;
            this.attributes = {};
        }

        static from(node) {
            let element = node;
            if (node.nodeType === Node.ATTRIBUTE_NODE) {
                element = node.ownerElement;
            }
            element.$data = element.$data || new Marker(element);
            return element.$data;
        }
    }

    const {html} = new Context();

    /*
    * Outlet adalah object yang menyimpan informasi mengenai content dan comment node.
    * */
    class Outlet {
        /*
        * Constructor dari Outlet
        * */
        constructor(commentNode) {
            this.commentNode = commentNode;
            this.content = null;
        }

        /*
        * Fungsi yang berfungsi untuk mengconstruct text kedalam outlet
        * */
        constructTextContent() {
            this.content = this.commentNode.previousSibling;
        }

        /*
        * Fungsi untuk mengconstruct htmlTemplateCollection kedalam outlet
        * */
        constructHtmlTemplateCollectionContent(htmlTemplateCollection) {
            this.content = new HtmlTemplateCollectionInstance(htmlTemplateCollection, this);
            this.content.instance = {};
            let pointer = this.commentNode;
            htmlTemplateCollection.iterateRight((item, key, template, index) => {
                do {
                    pointer = pointer.previousSibling
                } while (pointer.nodeType != Node.COMMENT_NODE && pointer.nodeValue !== 'outlet-child');
                this.content.instance[key] = pointer;
            });
        }

        /*
        * Fungsi untuk mengconstruct htmlTemplate kedalam outlet
        * */
        constructHtmlTemplateContent(htmlTemplate) {
            let childNodesLength = htmlTemplate.context.cache(htmlTemplate.key).documentFragment.childNodes.length;
            this.content = new HtmlTemplateInstance(htmlTemplate, this);
            let sibling = this.commentNode;
            while (childNodesLength--) {
                sibling = sibling.previousSibling;
                this.content.instance.push(sibling)
            }
            this.content.instance.reverse();

        }

        /*
        * Generic function untuk menset content dari outlet.
        * */
        setContent(template){
            if(isPromise(template)){
                if(this.content === null){
                    let self = this;
                    let id = guid();
                    this.setHtmlTemplateContent(html`<span id="${id}" style="display: none">outlet</span>`);
                    template.then((result) => {
                        let templateContent = document.getElementById(id);
                        let newCommentNode = templateContent.nextSibling;
                        Outlet.from(newCommentNode).setContent(result);
                        self.clearContent();
                    });
                }else{
                    template.then((result) => {
                        this.setContent(result);
                    });
                }
            }else if(template instanceof Plug){
                template.factory.apply(null,[this]);
            }else if (template instanceof HtmlTemplate) {
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
        setTextContent(text) {
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
        setHtmlTemplateCollectionContent(htmlTemplateCollection) {
            let clearContentWasCalled = false;
            let contentHasSameStructure = this.content && this.content instanceof HtmlTemplateCollectionInstance;
            if (this.content !== null && !contentHasSameStructure) {
                clearContentWasCalled = true;
                this.clearContent();
            }
            if (!this.content) {
                this.content = new HtmlTemplateCollectionInstance(htmlTemplateCollection, this);
            }
            this.content.applyValues(htmlTemplateCollection);
            if (clearContentWasCalled) {
                syncNode(htmlTemplateCollection,this.commentNode);
            }
        }


        /*
        * Function yang berguna untuk menset htmlTemplateContent
        * */
        setHtmlTemplateContent(htmlTemplate) {
            let clearContentWasCalled = false;
            let contentHasSameKey = this.content && this.content instanceof HtmlTemplateInstance ? this.content.template.key === htmlTemplate.key : false;
            if (this.content !== null && !contentHasSameKey) {
                this.clearContent();
                clearContentWasCalled = true;
            }
            if (!this.content) {
                let template = htmlTemplate.constructTemplate();
                this.content = new HtmlTemplateInstance(template, this);
            }
            this.content.applyValues(htmlTemplate);
            if (clearContentWasCalled) {
                syncNode(htmlTemplate,this.commentNode);
            }
        }

        /*
        * Function yang berguna untuk membersihkan content
        * */
        clearContent() {
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
        static from(node) {
            if (node instanceof Comment) {
                node.$data = node.$data || new Outlet(node);
                return node.$data
            } else {
                if (!node.$outlet) {
                    node.$outlet = document.createComment('outlet');
                    node.appendChild(node.$outlet);
                }
                return Outlet.from(node.$outlet);
            }
        }

        /*
        * Function yang berguna untuk mengembalikan node pertama dari content.
        * */
        firstChildNode() {
            if (this.content instanceof HtmlTemplateInstance) {
                return this.content.instance[0];
            } else if (this.content instanceof HtmlTemplateCollectionInstance) {
                let firstKey = this.content.template.keys[0];
                let outlet = Outlet.from(this.content.instance[firstKey]);
                return outlet.firstChildNode();
            } else {
                return this.content;
            }
        }

        /*
        * Function yang berguna untuk mem-validate instance position dari node.
        * */
        validateInstancePosition() {
            if (this.content instanceof HtmlTemplateInstance) {
                this.content.instance.reduceRight((pointer, ctn)=> {
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
    }

    /*
    * Plug adalah object yang meyimpan informasi mengenai factory dari plug.
    * */
    class Plug{
        constructor(factory){
            this.factory = factory;
        }
    }

    /*
    * Function yang digunakan untuk membuat object plug.
    * */
    const plug = (callback)=>{
        return new Plug(callback);
    }
    return {Context,render,plug};
}));