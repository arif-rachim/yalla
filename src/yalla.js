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

const PLACEHOLDER_CONTENT = '∞';
const PLACEHOLDER = `<!--${PLACEHOLDER_CONTENT}-->`;
const isMinimizationAttribute = node => {
    return ['checked', 'compact', 'declare', 'defer', 'disabled', 'ismap',
            'noresize', 'noshade', 'nowrap', 'selected'].indexOf(node.nodeName) >= 0;
};


function render(templateValue, node) {

    if (!node.$content) {
        let placeHolder = document.createComment(PLACEHOLDER_CONTENT);
        node.appendChild(placeHolder);
        _render(templateValue, placeHolder);
        node.$content = placeHolder;
    } else {
        _render(templateValue, node.$content);
    }
}

function destroy(templateValue) {
    if (templateValue instanceof HtmlTemplate) {
        templateValue.destroy();
    } else if (templateValue instanceof HtmlTemplateCollection) {
        templateValue.destroy();
    } else if (templateValue.parentNode) {
        templateValue.parentNode.removeChild(templateValue);
    }
}

function _render(templateValue, placeHolder) {
    if (templateValue instanceof HtmlTemplate) {
        _renderHtmlTemplate(templateValue, placeHolder);
    } else if (templateValue instanceof HtmlTemplateCollection) {
        _renderHtmlTemplateCollection(templateValue, placeHolder);
    } else {
        _renderText(templateValue, placeHolder);
    }
}

function getFirstNodeFromTemplate(templateValue, placeHolder) {
    if (templateValue instanceof HtmlTemplate) {
        return templateValue.nodeTree[0];
    } else if (templateValue instanceof HtmlTemplateCollection) {
        return getFirstNodeFromTemplate(templateValue.htmlTemplates[templateValue.keys[0]], placeHolder);
    } else {
        return placeHolder.$content;
    }
}
function _renderHtmlTemplateCollection(templateCollectionValue, newPlaceHolder) {

    let placeHolderContainer = {};
    let oldPlaceHolderContainer = {};
    let oldTemplateCollectionValue = newPlaceHolder.$content;

    if (oldTemplateCollectionValue && (!(oldTemplateCollectionValue instanceof HtmlTemplateCollection))) {
        destroy(oldTemplateCollectionValue);
        oldTemplateCollectionValue = null;
    }

    if (oldTemplateCollectionValue) {
        oldPlaceHolderContainer = oldTemplateCollectionValue.placeHolders;
        oldTemplateCollectionValue.keys.forEach(oldKey => {
            if (templateCollectionValue.keys.indexOf(oldKey) < 0) {
                let oldPlaceHolder = oldPlaceHolderContainer[oldKey];
                removePlaceholder(oldPlaceHolder);
            }
        });
    }

    templateCollectionValue.keys.reduceRight((sibling, key) => {
        let childTemplateValue = templateCollectionValue.htmlTemplates[key];

        let childPlaceHolder = document.createComment(PLACEHOLDER_CONTENT);
        if (oldPlaceHolderContainer[key]) {
            childPlaceHolder = oldPlaceHolderContainer[key];
        }

        if( (!childPlaceHolder.nextSibling) || (childPlaceHolder.nextSibling != sibling) ){
            newPlaceHolder.parentNode.insertBefore(childPlaceHolder, sibling);
        }

        placeHolderContainer[key] = childPlaceHolder;
        if (oldPlaceHolderContainer[key]) {
            let oldChildTemplateValue = oldTemplateCollectionValue.htmlTemplates[key];
            _render(childTemplateValue, childPlaceHolder);
            if (oldChildTemplateValue instanceof HtmlTemplate && childTemplateValue instanceof HtmlTemplate && oldChildTemplateValue.key == childTemplateValue.key) {
                templateCollectionValue.htmlTemplates[key] = oldChildTemplateValue;
            }
        } else {
            _render(childTemplateValue, childPlaceHolder);
        }
        return getFirstNodeFromTemplate(templateCollectionValue.htmlTemplates[key], childPlaceHolder);

    }, newPlaceHolder);
    templateCollectionValue.placeHolders = placeHolderContainer;
    newPlaceHolder.$content = templateCollectionValue;
}

function removePlaceholder(placeHolder) {
    if (placeHolder.$content instanceof HtmlTemplate) {
        placeHolder.$content.nodeTree.forEach(n => n.parentNode.removeChild(n));
    } else if (Array.isArray(placeHolder.$content)) {
        placeHolder.$content.forEach(pc => removePlaceholder(pc));
    }
    placeHolder.parentNode.removeChild(placeHolder);
}

function _buildTemplate(templateValue, placeHolder) {
    templateValue.generateNodeTree().forEach(node => placeHolder.parentNode.insertBefore(node, placeHolder));
    placeHolder.$content = templateValue;
}
function _renderHtmlTemplate(templateValue, placeHolder) {
    if (placeHolder.$content) {
        if (placeHolder.$content instanceof HtmlTemplate) {
            placeHolder.$content.applyValues(templateValue.values);
            placeHolder.$content.nodeTree.reduceRight(function (next, item) {
                if (item.nextSibling && item.nextSibling != next && next.parentNode) {
                    next.parentNode.insertBefore(item, next);
                }
                return item;
            }, placeHolder);
        } else {
            destroy(placeHolder.$content);
            _buildTemplate(templateValue, placeHolder);
        }
    } else {
        _buildTemplate(templateValue, placeHolder);
    }
}

function _renderText(templateValue, placeHolder) {
    if (placeHolder.parentNode == null) {
        return;
    }
    if (placeHolder.$content) {
        destroy(placeHolder.$content);
    }
    let textNode = document.createTextNode(templateValue);
    placeHolder.parentNode.insertBefore(textNode, placeHolder);
    placeHolder.$content = textNode;
}

function html(strings, ...values) {
    let key = strings.join('').replace(/\s/g, '');
    return new HtmlTemplate(strings, values, key);
}

function cache(key) {
    return {
        html: function (strings, ...values) {
            return new HtmlTemplate(strings, values, key);
        }
    }
}

function htmlCollection(items, keyFn, templateFn) {
    return new HtmlTemplateCollection(items, keyFn, templateFn);
}

const _cache = {};

class HtmlTemplateCollection {
    constructor(items, keyFn, templateFn) {
        this.items = items;
        this.keyFn = typeof keyFn === 'function' ? keyFn : (i) => i[keyFn];
        this.templateFn = templateFn;
        this.keys = [];
        this.htmlTemplates = {};
        this._init();
    }

    _init() {
        let self = this;
        let index = self.items.length;
        while (index--) {
            let item = self.items[index];
            let key = self.keyFn.apply(self, [item]);
            self.htmlTemplates[key] = self.templateFn.apply(self, [item, index, self.items]);
            self.keys.push(key);
        }
        self.keys.reverse();
    }

    destroy() {
        this.keys.forEach(key => {
            if (this.htmlTemplates[key] instanceof HtmlTemplate) {
                this.htmlTemplates[key].destroy();
                this.placeHolders[key].parentNode.removeChild(this.placeHolders[key]);
            }
        });

        this.keys = [];
        this.htmlTemplates = {};
        this.items = {};
        delete this.placeHolders;
    }

}

function getPath(node) {
    let i = 0;
    let child = node;
    while ((child = child.previousSibling) != null) {
        i++;
    }
    let path = [];
    path.push(i);
    if (node.parentNode && node.parentNode.nodeType != Node.DOCUMENT_FRAGMENT_NODE) {
        return path.concat(getPath(node.parentNode));
    }
    return path;
}

class HtmlTemplate {
    constructor(strings, values, key) {
        this.strings = strings;
        this.values = values;
        this.key = key;
    }

    generateNodeTree() {
        let key = this.key;
        if (!_cache[key]) {
            let template = document.createElement('template');
            template.innerHTML = this.strings.join(PLACEHOLDER);
            _cache[key] = template;
        }
        let template = _cache[key];
        let documentFragment = template.content.cloneNode(true);
        if (!template.dynamicNodesPath) {
            this._coldStart(documentFragment);
            template.dynamicNodesPath = this.dynamicNodesPath;
        } else {
            this.dynamicNodesPath = template.dynamicNodesPath;
            this._warmStart(documentFragment);
        }
        this.nodeTree = Array.from(documentFragment.childNodes);
        return this.nodeTree;
    }

    _coldStart(documentFragment) {
        let results = [];
        let resultsPath = [];
        this._lookDynamicNodes(Array.from(documentFragment.childNodes), results, resultsPath);
        this.dynamicNodes = results;
        this.dynamicNodesPath = resultsPath.map(path => {
            return path.reverse();
        });
        this.applyValues(this.values);
    }

    _warmStart(documentFragment) {
        this.dynamicNodes = this._lookDynamicNodesFromPath(documentFragment,this.dynamicNodesPath);
        this.applyValues(this.values);
    }

    _lookDynamicNodesFromPath(documentFragment,dynamicNodesPath) {
        return dynamicNodesPath.map((path) => {
            return path.reduce(function (content, path) {
                if (typeof path == 'number') {
                    return content.childNodes[path];
                } else {
                    let attribute = content.attributes[path.name];
                    attribute.$dynamicAttributeLength = path.dynamicLength;
                    attribute.$dynamicAttributeLengthPos = 0;
                    return attribute;
                }
            }, documentFragment)
        });
    }

    _lookDynamicNodes(childNodes, results, resultsPath) {
        childNodes.forEach(node => {
            if (node instanceof Comment && node.nodeValue == PLACEHOLDER_CONTENT) {
                results.push(node);
                resultsPath.push(getPath(node));
            }
            else if (node.attributes) {
                Array.from(node.attributes).reduce((results, attribute) => {
                    if (attribute.nodeValue.indexOf(PLACEHOLDER) >= 0) {
                        let dynamicLength = attribute.nodeValue.split(PLACEHOLDER).length - 1;
                        for (let i = 0; i < dynamicLength; i++) {
                            attribute.$dynamicAttributeLength = dynamicLength;
                            attribute.$dynamicAttributeLengthPos = 0;
                            results.push(attribute);
                            let path = [{
                                name: attribute.nodeName,
                                dynamicLength: dynamicLength
                            }].concat(getPath(attribute.ownerElement));
                            resultsPath.push(path);
                        }
                    }
                    return results;
                }, results);
                this._lookDynamicNodes(Array.from(node.childNodes), results, resultsPath);
            }
        });
    }

    applyValues(templateValue) {
        this.dynamicNodes.forEach((dn, index) => {
            if (dn.nodeType === Node.ATTRIBUTE_NODE) {
                HtmlTemplate._applyAttributeNode(dn, templateValue[index]);
            } else {
                _render(templateValue[index], dn);
            }
        });
    }

    destroy() {
        this.nodeTree.forEach(n => n.parentNode.removeChild(n));
    }

    static _applyAttributeNode(node, value) {
        if (typeof value === 'function' && node.name.indexOf('on') === 0) {
            node.nodeValue = PLACEHOLDER_CONTENT;
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
                node.$value = node.$value.split(PLACEHOLDER).reduce((result, data, index)=> {
                    return index == 0 ? data : `${result}${index == 1 ? value : PLACEHOLDER}${data}`;
                }, '');
                node.$dynamicAttributeLengthPos++;
                if (node.$dynamicAttributeLengthPos == node.$dynamicAttributeLength && node.value != node.$value) {
                    node.value = node.$value;
                }
            }
        }
    }
}