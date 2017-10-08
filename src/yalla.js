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
        if(this.templateStaticString in _mapExistingNode){
            el = _mapExistingNode[this.templateStaticString];
        }else{
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
        this.dynamicNodes = nodes.reduce((results, node) => {
            if (node instanceof Comment && node.textContent == DATA_SEPARATOR) {
                results.push(node);
            }
            if (node.attributes) {
                Array.from(node.attributes).reduce((results, attribute) => {
                    if (attribute.nodeValue.indexOf(SEPARATOR) >= 0) {
                        let dynamicLength = attribute.nodeValue.split(SEPARATOR).length - 1;
                        for(let i = 0;i<dynamicLength;i++)results.push(attribute);
                    }
                    return results;
                }, results);
                this.lookupDynamicNodes(Array.from(node.childNodes), results);
            }
            return results;
        }, results);
        return this;
    }

    appendSiblingFrom(node) {
        this.nodeTree.forEach(n => {
            return node.parentNode.insertBefore(n, node);
        });
        return this;
    }

    appendChildrenTo(node) {
        this.nodeTree.forEach(n => node.appendChild(n));
        return this;
    }

    applyValues(templateValues = this.templateValues) {
        this.dynamicNodes.reduce((templateValues, dynamicNode, index) => {
            let value = templateValues[index];
            HtmlTemplate._applyValue(dynamicNode, value);
            return templateValues;
        }, templateValues);
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
                node.value = node.value.split(SEPARATOR).reduce((result, data, index)=> {
                    return index == 0 ? data : `${result}${index == 1 ? value : SEPARATOR}${data}`;
                }, '');
            }
        }
    }

    destroy() {
        this.nodeTree.forEach(n =>{
            if(n instanceof Comment && isTextNode(n.yallaTemplate)){
                n.yallaTemplate.parentNode.removeChild(n.yallaTemplate);
            }
            n.parentNode.removeChild(n);
        });
    }
}

class HtmlTemplateCollections {
    constructor(keyFunction, mapFunction, source) {
        this.dictionary = {};
        this.keyFunction = keyFunction;
        this.mapFunction = mapFunction;
        this.keyOrders = [];
        source.reduce(function (token, item, index, source) {
            let {templateCollections, keyFunction, mapFunction, orders} = token;
            let key = keyFunction.apply(token.templateCollections, [item, index, source]);
            templateCollections.dictionary[key] = mapFunction.apply(templateCollections, [item, index, source]);
            if(!(templateCollections.dictionary[key] instanceof HtmlTemplate)){
                templateCollections.dictionary[key] = new HtmlTemplate([templateCollections.dictionary[key]],[])
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

    initializeCollections(node) {
        this.keyOrders.forEach(key => {
            let v = this.dictionary[key];
            v.buildNodeTree().lookupDynamicNodes().appendSiblingFrom(node).applyValues();
        });
        node.yallaTemplate = this;
        this.node = node;
    }

    applyValues(newTemplateCollections) {
        this.keyOrders.filter(key => newTemplateCollections.keyOrders.indexOf(key) < 0).forEach(key => {
            this.keyOrders.splice(this.keyOrders.indexOf(key), 1);
            let dict = this.dictionary;
            dict[key].destroy();
            delete dict[key];
        });

        newTemplateCollections.keyOrders.reduceRight((token, key) => {
            let {currentDict, newDict, node} = token;
            let dict = newDict[key];

            if (key in currentDict) {
                dict = currentDict[key];
                dict.applyValues(newDict[key].templateValues);
                if (dict.nodeTree[dict.nodeTree.length - 1].nextSibling != node) {
                    dict.nodeTree.forEach(n => node.parentNode.insertBefore(n, node));
                }
                token.node = dict.nodeTree[0];
                newDict[key] = dict;
            } else {
                dict.buildNodeTree().lookupDynamicNodes().appendSiblingFrom(node).applyValues();
            }
            token.node = dict.nodeTree[0];
            if(token.node instanceof Comment && token.node.yallaTemplate instanceof Text){
                token.node = token.node.yallaTemplate;
            }
            return token;
        }, {
            currentDict: this.dictionary,
            newDict: newTemplateCollections.dictionary,
            keyOrderPos: this.keyOrders.map(function (key) {
                return {key: key, pos: newTemplateCollections.keyOrders.indexOf(key)};
            }).sort((a, b) => a.pos - b.pos),
            node: this.node
        });

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

