(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        let {Context,render} = factory();
        root.Context = Context;
        root.render = render;
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

    class Template {
        destroy() {
            console.log('WARNING NOT IMPLEMENTED YET ');
        }
    }

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
        'li': 'ul'
    };


    const isMinimizationAttribute = node => {
        return ['checked', 'compact', 'declare', 'defer', 'disabled', 'ismap',
                'noresize', 'noshade', 'nowrap', 'selected'].indexOf(node.nodeName) >= 0;
    };

    class HtmlTemplateCollectionInstance extends Template {
        constructor(templateCollection, placeholder) {
            super();
            this.template = templateCollection;
            this.placeholder = placeholder;
            this.instance = null;
        }

        applyValues(newHtmlTemplateCollection) {
            if (this.instance === null) {
                this.instance = {};
                let placeholderPointer = this.placeholder.commentNode;
                newHtmlTemplateCollection.iterateRight((item, key, template) => {
                    let childPlaceholder = Placeholder.from(document.createComment('placeholder-child'));
                    placeholderPointer.parentNode.insertBefore(childPlaceholder.commentNode, placeholderPointer);
                    renderTemplate(template, childPlaceholder.commentNode);
                    placeholderPointer = childPlaceholder.firstChildNode();
                    this.instance[key] = childPlaceholder.commentNode;
                });
            } else {

                newHtmlTemplateCollection.iterateRight();
                let oldHtmlTemplateCollection = this.template;

                oldHtmlTemplateCollection.keys.forEach(key => {
                    let keyIsDeleted = newHtmlTemplateCollection.keys.indexOf(key) < 0;
                    if (keyIsDeleted) {
                        let commentNode = this.instance[key];
                        Placeholder.from(commentNode).clearContent();
                        commentNode.parentNode.removeChild(commentNode);
                        delete this.instance[key];
                    }
                });

                let placeholderPointer = this.placeholder.commentNode;
                newHtmlTemplateCollection.iterateRight((item, key, template) => {
                    let commentNode = this.instance[key];
                    if (commentNode) {
                        let childPlaceholder = Placeholder.from(commentNode);
                        if (childPlaceholder.content instanceof HtmlTemplateInstance) {
                            childPlaceholder.setHtmlTemplateContent(template);
                        } else if (childPlaceholder.content instanceof HtmlTemplateCollectionInstance) {
                            childPlaceholder.setHtmlTemplateCollectionContent(template);
                        } else {
                            childPlaceholder.setTextContent(template);
                        }
                        if (placeholderPointer.previousSibling != commentNode) {
                            placeholderPointer.parentNode.insertBefore(commentNode, placeholderPointer);
                            childPlaceholder.validateInstancePosition();
                        }
                        placeholderPointer = childPlaceholder.firstChildNode();
                    } else {
                        let childPlaceholder = Placeholder.from(document.createComment('placeholder-child'));
                        placeholderPointer.parentNode.insertBefore(childPlaceholder.commentNode, placeholderPointer);
                        renderTemplate(template, childPlaceholder.commentNode);
                        placeholderPointer = childPlaceholder.firstChildNode();
                        this.instance[key] = childPlaceholder.commentNode;
                        this.template.context.addSyncCallback(function () {
                            syncNode(template, childPlaceholder.commentNode);
                        });
                    }
                });
                this.template = newHtmlTemplateCollection;
            }
        }

        destroy() {
            this.template.getKeys().forEach(key => {
                let childPlaceholderCommentNode = this.instance[key];
                let childPlaceholder = Placeholder.from(childPlaceholderCommentNode);
                if (childPlaceholder.content instanceof Template) {
                    childPlaceholder.content.destroy();
                } else {
                    childPlaceholder.content.parentNode.removeChild(childPlaceholder.content);
                }
                childPlaceholderCommentNode.parentNode.removeChild(childPlaceholderCommentNode);
                delete this.instance[key];
            });

            this.placeholder = null;
            this.instance = null;
            this.template = null;
        }
    }

    class HtmlTemplateInstance extends Template {
        constructor(template, placeholder) {
            super();
            this.template = template;
            this.placeholder = placeholder;
            this.instance = [];
            this.nodeValueIndexArray = null;
        }

        applyValues(newHtmlTemplate) {
            if (this.instance === null || this.instance.length === 0) {
                HtmlTemplate.applyValues(newHtmlTemplate, this.template.nodeValueIndexArray);
                let documentFragment = this.template.documentFragment;
                let cloneNode = cloneNodeDeep(documentFragment);
                let commentNode = this.placeholder.commentNode;
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
            this.instance.forEach(i => i.parentNode.removeChild(i));
            this.nodeValueIndexArray = null;
            this.placeholder = null;
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
        let node = path.reduce(function (content, path) {
            if (typeof path == 'number') {
                return content.childNodes[path];
            } else {
                let attribute = content.attributes[path.name];
                return attribute;
            }
        }, documentFragment);
        return node;
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

        getKeys() {
            if (!this.initialzed) {
                throw new Error('Yikes its not initialized yet');
            }
            return this.keys;
        }

        getTemplates() {
            if (!this.initialzed) {
                throw new Error('Yikes its not initialized yet');
            }
            return this.templates;
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
            this.documentFragment = this.getProperTemplateTag(templateString);
            this.nodeValueIndexArray = this.buildNodeValueIndex(this.documentFragment, []);
            HtmlTemplate.applyValues(this, this.nodeValueIndexArray);
        }

        buildNodeValueIndex(documentFragment) {

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
                        let nodeValueIndexMap = this.lookNodeValueArray(nodeValue);
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
                    nodeValueIndexArray = nodeValueIndexArray.concat(this.buildNodeValueIndex(node));
                }
                if (node.nodeType === Node.TEXT_NODE && documentFragment.nodeName.toUpperCase() === 'STYLE') {
                    let nodeValue = node.nodeValue;
                    let nodeValueIndexMap = this.lookNodeValueArray(nodeValue);
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
                    node.nodeValue = 'placeholder';
                    nodeValueIndexArray.push({node: node, valueIndexes: parseInt(nodeValue)});
                }
            } while (node = node.nextSibling);
            return nodeValueIndexArray;
        }

        lookNodeValueArray(nodeValue) {
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

        getProperTemplateTag(contentText) {
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
                    let valueIndex = valueIndexes;
                    let value = newValues[valueIndex];
                    renderTemplate(value, node);
                }
                nodeValueIndex.values = newActualValues;
            });
        }
    }

    function renderText(text, node) {
        let placeholder = Placeholder.from(node);
        placeholder.setTextContent(text);
    }

    function renderHtmlTemplate(htmlTemplate, node) {
        let placeholder = Placeholder.from(node);
        placeholder.setHtmlTemplateContent(htmlTemplate);
    }

    function renderHtmlTemplateCollection(htmlTemplateCollection, node) {
        let placeholder = Placeholder.from(node);
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
        let placeholder = Placeholder.from(node);
        let templateValues = template.values;
        if (placeholder.content && placeholder.content instanceof HtmlTemplateInstance) {
            let htmlTemplateInstance = placeholder.content;
            let template = htmlTemplateInstance.template;
            let docFragment = {childNodes: htmlTemplateInstance.instance};

            if (template.nodeValueIndexArray) {
                let actualNodeValueIndexArray = template.nodeValueIndexArray.map(nodeValueIndex => {
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
                            actualNode.ownerElement.addEventListener(eventName, templateValues[valueIndex]);
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
                        let placeholder = Placeholder.from(actualNode);
                        let value = templateValues[valueIndexes];
                        if (value instanceof HtmlTemplate) {
                            placeholder.constructHtmlTemplateContent(value);
                            syncNode(value, placeholder.commentNode);
                        }
                        else if (value instanceof HtmlTemplateCollection) {
                            placeholder.constructHtmlTemplateCollectionContent(value);
                            syncNode(value, placeholder.commentNode);
                        }
                        else {
                            placeholder.constructTextContent();
                        }
                        return {node: actualNode, valueIndexes, values}
                    }
                });
                htmlTemplateInstance.nodeValueIndexArray = actualNodeValueIndexArray;
            }
        }
        if (placeholder.content && placeholder.content instanceof HtmlTemplateCollectionInstance) {
            let htmlTemplateCollectionInstance = placeholder.content;
            let templates = htmlTemplateCollectionInstance.template.templates;
            let keys = htmlTemplateCollectionInstance.template.keys;
            keys.forEach(key => {
                let template = templates[key];
                let commentNode = htmlTemplateCollectionInstance.instance[key];
                let placeholder = Placeholder.from(commentNode);
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

    class Placeholder {
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
                } while (pointer.nodeType != Node.COMMENT_NODE && pointer.nodeValue !== 'placeholder-child');
                this.content.instance[key] = pointer;
            });
        }

        constructHtmlTemplateContent(htmlTemplate) {
            let childNodesLength = htmlTemplate.documentFragment.childNodes.length;
            this.content = new HtmlTemplateInstance(htmlTemplate, this);
            let sibling = this.commentNode;
            while (childNodesLength--) {
                sibling = sibling.previousSibling;
                this.content.instance.push(sibling)
            }
            this.content.instance.reverse();
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
                syncNode(this.content.template, this.commentNode);
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
                syncNode(this.content.template, this.commentNode);
            }
        }

        clearContent() {
            if (this.content !== null) {
                if (this.content instanceof Template) {
                    this.content.destroy();
                } else {
                    this.content.parentNode.removeChild(this.content);
                }
                this.content = null;
            }
        }

        hasEmptyContent() {
            return this.content === null;
        }

        static from(node) {
            if (node instanceof Comment) {
                node.$data = node.$data || new Placeholder(node);
                return node.$data
            } else {
                if (!node.$placeholder) {
                    node.$placeholder = document.createComment('placeholder');
                    node.appendChild(node.$placeholder);
                }
                return Placeholder.from(node.$placeholder);
            }
        }

        firstChildNode() {
            if (this.content instanceof HtmlTemplateInstance) {
                return this.content.instance[0];
            } else if (this.content instanceof HtmlTemplateCollectionInstance) {
                let firstKey = this.content.template.keys[0];
                let placeholder = Placeholder.from(this.content.instance[firstKey]);
                return placeholder.firstChildNode();
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
    return {Context,render};
}));