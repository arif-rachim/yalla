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


    let isChrome = !!window.chrome && !!window.chrome.webstore;


    class Context {
        constructor() {
            this._cache = {};
            this._synccallbacks = [];
            this.html = (strings, ...values) => new HtmlTemplate(strings, values, this);
            this.htmlCollection = (arrayItems, keyFn, templateFn) => new HtmlTemplateCollection(arrayItems, keyFn, templateFn, this);
        }

        hasCache(key) {
            return key in this._cache;
        }

        cache(key, data) {
            if (!this.hasCache(key)) {
                this._cache[key] = data;
            }
            return this._cache[key];
        }

        addSyncCallback(callback) {
            this._synccallbacks.push(callback);
        }

        clearSyncCallbacks() {
            this._synccallbacks.forEach(cb => {
                cb.apply();
            });
            this._synccallbacks = [];
        }
    }

    /**
     * Deep clone node is broken in IE, following for the fix
     */
    const cloneNodeDeep = (node) => {
        if (isChrome) {
            return node.cloneNode(true);
        } else {
            let clone = node.nodeType == 3 ? document.createTextNode(node.nodeValue) : node.cloneNode(false);
            let child = node.firstChild;
            while (child) {
                clone.appendChild(cloneNodeDeep(child));
                child = child.nextSibling;
            }
            return clone;
        }
    };

    const isPromise = (object) =>{
        return !!(typeof object === 'object' && 'constructor' in object && object.constructor.name === 'Promise');

    };

    const guid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });

    class Template {
        destroy() {
            console.log('WARNING NOT IMPLEMENTED YET ');
        }
    }

    const attributeChangesReflectToProperties = (attributeName,nodeName) => {
        return !!(attributeName.toUpperCase() === 'VALUE' && nodeName.toUpperCase() === 'INPUT');

    };

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


    const isMinimizationAttribute = node => {
        return ['checked', 'compact', 'declare', 'defer', 'disabled', 'ismap',
                'noresize', 'noshade', 'nowrap', 'selected'].indexOf(node.nodeName) >= 0;
    };

    class HtmlTemplateCollectionInstance extends Template {
        constructor(templateCollection, outlet) {
            super();
            this.template = templateCollection;
            this.outlet = outlet;
            this.instance = null;
        }

        applyValues(newHtmlTemplateCollection) {
            if (this.instance === null) {
                this.instance = {};
                let outletPointer = this.outlet.commentNode;
                newHtmlTemplateCollection.iterateRight((item, key, template) => {
                    let childPlaceholder = Outlet.from(document.createComment('outlet-child'));
                    outletPointer.parentNode.insertBefore(childPlaceholder.commentNode, outletPointer);
                    Outlet.from(childPlaceholder.commentNode).setContent(template);
                    outletPointer = childPlaceholder.firstChildNode();
                    this.instance[key] = childPlaceholder.commentNode;
                });
            } else {
                newHtmlTemplateCollection.iterateRight();
                if(newHtmlTemplateCollection.items.length == 0){
                    if(this.outlet.commentNode.parentNode.$htmlCollectionInstanceChild && this.outlet.commentNode.parentNode.$htmlCollectionInstanceChild.length == 1){
                        let parentNode = this.outlet.commentNode.parentNode;
                        parentNode.innerText = '';
                        parentNode.appendChild(this.outlet.commentNode);
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

        destroy() {
            this.template.keys.forEach(key => {
                let childPlaceholderCommentNode = this.instance[key];
                let childPlaceholder = Outlet.from(childPlaceholderCommentNode);
                if (childPlaceholder.content instanceof Template) {
                    childPlaceholder.content.destroy();
                } else {
                    childPlaceholder.content.remove();
                }
                childPlaceholderCommentNode.remove();
                delete this.instance[key];
            });

            this.outlet = null;
            this.instance = null;
            this.template = null;
        }
    }

    class HtmlTemplateInstance extends Template {
        constructor(template, outlet) {
            super();
            this.template = template;
            this.outlet = outlet;
            this.instance = [];
            this.nodeValueIndexArray = null;
        }

        applyValues(newHtmlTemplate) {
            if (this.instance === null || this.instance.length === 0) {
                HtmlTemplate.applyValues(newHtmlTemplate, this.template.nodeValueIndexArray);
                let documentFragment = this.template.documentFragment;
                let cloneNode = cloneNodeDeep(documentFragment);
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

        destroy() {
            this.instance.forEach(i => i.remove());
            this.nodeValueIndexArray = null;
            this.outlet = null;
            this.template = null;
        }

    }

    /*
     Function to take the path of a node up in documentFragment
     */
    function getPath(node) {
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


    function getNode(path, documentFragment) {
        return path.reduce(function (content, path) {
            if (typeof path == 'number') {
                return content.childNodes[path];
            } else {
                return content.attributes[path.name];
            }
        }, documentFragment);

    }

    class HtmlTemplateCollection extends Template {
        constructor(items, keyFn, templateFn, context) {
            super();
            this.items = items;
            this.keyFn = typeof keyFn === 'string' ? (item => item[keyFn]) : keyFn;
            this.templateFn = templateFn;
            this.context = context;
            this.keys = [];
            this.templates = {};
            this.initialzed = false;
        }

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
    function isMatch(newActualValues, values) {
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

    class HtmlTemplate extends Template {
        constructor(strings, values, context) {
            super();
            this.strings = strings;
            this.values = values;
            this.context = context;
            this.key = this.strings.join('').trim();
            this.nodeValueIndexArray = null;
            this.documentFragment = null;
        }

        buildTemplate(templateString) {
            this.documentFragment = HtmlTemplate.getProperTemplateTag(templateString);
            this.nodeValueIndexArray = this.buildNodeValueIndex(this.documentFragment,this.documentFragment.nodeName);
            HtmlTemplate.applyValues(this, this.nodeValueIndexArray);
        }

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

        static getProperTemplateTag(contentText) {
            let openTag = contentText.substring(1, contentText.indexOf('>'));
            openTag = (openTag.indexOf(' ') > 0 ? openTag.substring(0, openTag.indexOf(' ')) : openTag).toLowerCase();
            let rootTag = TEMPLATE_ROOT[openTag];
            rootTag = rootTag || 'div';
            let template = document.createElement(rootTag);
            template.innerHTML = contentText;
            return template;
        }

        constructTemplate() {
            if (!this.context.hasCache(this.key)) {
                let templateString = this.buildStringSequence();
                this.buildTemplate(templateString);
                return this.context.cache(this.key, this);
            }
            return this.context.cache(this.key);
        }

        buildStringSequence() {
            return this.strings.reduce((result, string, index)=> {
                return index == 0 ? string : `${result}<!--${(index - 1)}-->${string}`;
            }, '').trim();
        }

        static applyValues(nextHtmlTemplate, nodeValueIndexArray) {
            let newValues = nextHtmlTemplate.values;
            if (!nodeValueIndexArray) {
                return;
            }

            nodeValueIndexArray.forEach((nodeValueIndex, index)=> {
                let {node, valueIndexes, values} = nodeValueIndex;
                let newActualValues = Array.isArray(valueIndexes) ? valueIndexes.map(valueIndex => newValues[(valueIndex)]) : newValues[valueIndexes];

                if (isMatch(newActualValues, values)) {
                    return;
                }

                let nodeName = node.nodeName;
                if (node.nodeType === Node.ATTRIBUTE_NODE) {
                    let marker = Marker.from(node);
                    let isEvent = nodeName.indexOf('on') === 0;
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
                            if(attributeChangesReflectToProperties(nodeName,node.ownerElement.nodeName)){
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

    function syncNode(nextTemplate,node) {
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
                debugger;
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

    function render(templateValue, node) {
        Outlet.from(node).setContent(templateValue);
        if (!node.$synced) {
            syncNode(templateValue,node);
            node.$synced = true;
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

    class Outlet {
        constructor(commentNode) {
            this.commentNode = commentNode;
            this.content = null;
        }

        constructTextContent() {
            this.content = this.commentNode.previousSibling;
        }

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

        setContent(template){
            if(isPromise(template)){
                if(this.content === null){
                    let self = this;
                    let id = guid();
                    this.setHtmlTemplateContent(html`<span id="${id}" style="color : #bbbbbb;border : 1px solid #bbbbbb;border-radius: 5px;padding: 2px;">outlet</span>`);
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

        setTextContent(text) {
            if (this.content instanceof Text) {
                this.content.nodeValue = text;
            } else {
                this.clearContent();
                this.content = document.createTextNode(text);
                this.commentNode.parentNode.insertBefore(this.content, this.commentNode);
            }
        }

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

        validateInstancePosition() {
            if (this.content instanceof HtmlTemplateInstance) {
                this.content.instance.reduceRight((pointer, ctn)=> {
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
    }

    class Plug{
        constructor(factory){
            this.factory = factory;
        }
    }

    function plug(callback){
        return new Plug(callback);
    }
    return {Context,render,plug};
}));