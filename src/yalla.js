"use strict";

const isTextNode = el => el.nodeType === 3;
const isAttributeNode = el => el.nodeType === 2;
const itIsNotInitialized = node => !node.yallaTemplate;
const isMinimizationAttribute = node => {
    return ['checked', 'compact', 'declare', 'defer', 'disabled', 'ismap',
            'noresize', 'noshade', 'nowrap', 'selected'].indexOf(node.nodeName) >= 0;
};

const DATA_SEPARATOR = '↭';
const SEPARATOR = `<!--${DATA_SEPARATOR}-->`;
const _mapExistingNode = {};

class HtmlTemplate {
    constructor(string = [], values = []) {
        this.templateStatics = string;
        this.templateStaticString = string.join(SEPARATOR);
        this.templateValues = values;
    }

    buildNodeTree() {
        let el = null;
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

    lookupDynamicNodes(nodes = this.nodeTree, results = []) {
        if (!nodes) {
            throw new Error('nodeTree does not exist in HtmlTemplate probably you need to call buildNodeTree');
        }
        for (let iNode = 0, len = nodes.length; iNode < len; iNode++) {
            let node = nodes[iNode];
            if (node instanceof Comment && node.textContent == DATA_SEPARATOR) {
                results.push(node);
            }
            if (node.attributes) {
                let nodeAttributes = Array.from(node.attributes);
                for (let iNodeAttributes = 0, _len = nodeAttributes.length; iNodeAttributes < _len; iNodeAttributes++) {
                    let attribute = nodeAttributes[iNodeAttributes];
                    if (attribute.nodeValue.indexOf(SEPARATOR) >= 0) {
                        let dynamicLength = attribute.nodeValue.split(SEPARATOR).length - 1;
                        for (let i = 0; i < dynamicLength; i++)results.push(attribute);
                    }
                }
                this.lookupDynamicNodes(Array.from(node.childNodes), results);
            }
        }
        this.dynamicNodes = results;
        return this;
    }

    appendSiblingFrom(node) {
        for (let i = 0, len = this.nodeTree.length; i < len; i++) {
            let n = this.nodeTree[i];
            node.parentNode.insertBefore(n, node)
        }
        return this;
    }

    appendChildrenTo(node) {
        for (let i = 0, len = this.nodeTree.length; i < len; i++) {
            let n = this.nodeTree[i];
            node.appendChild(n);
        }
        return this;
    }

    applyValues(templateValues = this.templateValues) {
        for (let index = 0, len = this.dynamicNodes.length; index < len; index++) {
            let value = templateValues[index];
            let dynamicNode = this.dynamicNodes[index];
            HtmlTemplate._applyValue(dynamicNode, value);
        }
        return this;
    }

    static _applyValue(node, value) {
        if (isAttributeNode(node)) {
            HtmlTemplate._applyAttributeNode(node, value);
        } else {
            HtmlTemplate._applyComponentNode(node, value);
        }
    }

    saveTemplateToNode(node) {
        node.yallaTemplate = this;
    }

    static _applyComponentNode(node, value) {
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

    static _applyTextToNode(value, node) {
        value = value || '';
        let text = document.createTextNode(value.toString());
        if (node.yallaTemplate && isTextNode(node.yallaTemplate)) {
            node.parentNode.removeChild(node.yallaTemplate);
        }
        if (node.yallaTemplate && node.yallaTemplate instanceof HtmlTemplate) {
            node.yallaTemplate.destroy();
        }
        node.parentNode.insertBefore(text, node);
        node.yallaTemplate = text;
    }

    static _applyAttributeNode(node, value) {
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
                let values = node.value.split(SEPARATOR);
                let result = '';
                for (let index = 0, len = values.length; index < len; index++) {
                    let data = values[index];
                    result = index == 0 ? data : `${result}${index == 1 ? value : SEPARATOR}${data}`;
                }
                node.value = result;
            }
        }
    }

    destroy() {
        for (let i = 0, len = this.nodeTree.length; i < len; i++) {
            let n = this.nodeTree[i];
            if (n instanceof Comment && isTextNode(n.yallaTemplate)) {
                n.yallaTemplate.parentNode.removeChild(n.yallaTemplate);
            }
            n.parentNode.removeChild(n);
        }
    }
}

class HtmlTemplateCollections {
    constructor(keyFunction, mapFunction, source) {
        this.dictionary = {};
        this.keyFunction = keyFunction;
        this.mapFunction = mapFunction;
        this.keyOrders = [];

        for (let index = 0, len = source.length; index < len; index++) {
            let item = source[index];
            let key = this.keyFunction.apply(this, [item, index, source]);
            this.dictionary[key] = this.mapFunction.apply(this, [item, index, source]);
            if (!(this.dictionary[key] instanceof HtmlTemplate)) {
                this.dictionary[key] = new HtmlTemplate([this.dictionary[key]], [])
            }
            this.keyOrders.push(key);
        }

    }

    initializeCollections(node) {
        for (let i = 0, len = this.keyOrders.length; i < len; i++) {
            let key = this.keyOrders[i];
            let v = this.dictionary[key];
            v.buildNodeTree().lookupDynamicNodes().appendSiblingFrom(node).applyValues();
        }
        node.yallaTemplate = this;
        this.node = node;
    }

    applyValues(newTemplateCollections) {
        let newKeyOrders = [];
        for (let j = 0, len = this.keyOrders.length; j < len; j++) {
            let key = this.keyOrders[j];
            if (newTemplateCollections.keyOrders.indexOf(key) < 0) {
                let dict = this.dictionary;
                dict[key].destroy();
                delete dict[key];
            } else {
                newKeyOrders.push(key);
            }
        }
        this.keyOrders = newKeyOrders;
        let currentDict = this.dictionary;
        let newDict = newTemplateCollections.dictionary;
        let node = this.node;
        for (let i = newTemplateCollections.keyOrders.length - 1; i >= 0; i--) {
            let key = newTemplateCollections.keyOrders[i];
            let dict = newDict[key];
            if (key in currentDict) {
                dict = currentDict[key];
                dict.applyValues(newDict[key].templateValues);
                if (dict.nodeTree[dict.nodeTree.length - 1].nextSibling != node) {

                    for (let i = 0, len = dict.nodeTree.length; i < len; i++) {
                        let n = dict.nodeTree[i];
                        node.parentNode.insertBefore(n, node);
                    }
                }
                node = dict.nodeTree[0];
                newDict[key] = dict;
            } else {
                dict.buildNodeTree().lookupDynamicNodes().appendSiblingFrom(node).applyValues();
            }
            node = dict.nodeTree[0];
            if (node instanceof Comment && node.yallaTemplate instanceof Text) {
                node = node.yallaTemplate;
            }
        }
        this.dictionary = newTemplateCollections.dictionary;
        this.keyOrders = newTemplateCollections.keyOrders;
    }
}

function htmlMap(source, keyFunction, mapFunction) {
    let keyFunc = typeof keyFunction === 'string' ? i => i[keyFunction] : keyFunction;
    if (typeof keyFunc !== 'function') {
        throw new Error('Please provide keyFunction in htmlMap')
    }
    return new HtmlTemplateCollections(keyFunc, mapFunction, source);
}

function html(string, ...values) {
    return new HtmlTemplate(string, values);
}

function render(htmlTemplate, rootNode) {
    if (!rootNode || !htmlTemplate) {
        console.error('render(htmlTemplate,node) : htmlTemplate and node are mandatory');
        return;
    }
    let {yallaTemplate} = rootNode;
    if (!yallaTemplate) {
        htmlTemplate
            .buildNodeTree()
            .lookupDynamicNodes()
            .appendChildrenTo(rootNode)
            .applyValues().saveTemplateToNode(rootNode);
    } else {
        rootNode.yallaTemplate.applyValues(htmlTemplate.templateValues)
    }
}