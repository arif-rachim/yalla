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
const PLACEHOLDER_CONTENT = 'placeholder';

/*
 PlaceHolder is a Comment node that contains a PLACEHOLDER_CONTENT value
 */
const PLACEHOLDER = `<!--${PLACEHOLDER_CONTENT}-->`;

/*
 Function to validate whether the node is a minimization
 */
const isMinimizationAttribute = node => {
    return ['checked', 'compact', 'declare', 'defer', 'disabled', 'ismap',
        'noresize', 'noshade', 'nowrap', 'selected'].indexOf(node.nodeName) >= 0;
};

/*
 TemplateRoot is a mapping of elements that require certain tag as their parent
 */
const templateRoot = {
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
const arrayFrom = nodeList => {
    let arr = [];
    for (let i = nodeList.length; i--; arr.unshift(nodeList[i])) ;
    return arr;
};


function findPreviousPlaceHolder(clonedNode) {
    if (!clonedNode.previousSibling) {
        return null;
    }
    let sibling = clonedNode.previousSibling;
    if (sibling instanceof Comment && sibling.nodeValue == PLACEHOLDER_CONTENT) {
        return sibling;
    }
    return findPreviousPlaceHolder(sibling);
}

function syncTree(cloneTree, baseTree) {
    cloneTree.forEach((clonedNode, index) => {
        let baseNode = baseTree[index];
        if (clonedNode instanceof Comment && clonedNode.nodeValue === PLACEHOLDER_CONTENT && (!clonedNode.$content)) {

            let content = baseNode.$content;

            if (content instanceof HtmlTemplate) {
                let i = content.nodeTree.length;
                let newNodeTree = [];
                let prevSibling = clonedNode.previousSibling;
                while (i--) {
                    newNodeTree.push(prevSibling);
                    prevSibling = prevSibling.previousSibling;
                }
                // ok we have new node here
                clonedNode.$content = content.clone(newNodeTree);
                // ok now we need to reapply the value here !!

            } else if (content instanceof HtmlTemplateCollection) {
                clonedNode.$content = content.clone();
                let i = content.keys.length;
                let placeHolder = findPreviousPlaceHolder(clonedNode);
                while (i--) {
                    let key = content.keys[i];
                    clonedNode.$content.placeHolderContainer[key] = placeHolder;
                    clonedNode.$content.templateValuesContainer[key] = placeHolder.$content;
                    placeHolder = findPreviousPlaceHolder(placeHolder);
                }
            } else {
                clonedNode.$content = clonedNode.previousSibling;
            }

        } else if (clonedNode.childNodes && clonedNode.childNodes.length > 0) {
            syncTree(arrayFrom(clonedNode.childNodes), arrayFrom(baseNode.childNodes));
        }
    });
}

/*
 Function used to render values into an Element. Value can be HtmlTemplate, HtmlTemplateCollection,
 or a Text while the element is a dom element.
 */
function render(templateValue, element) {
    let callback = {
        then: function (successFn) {
            callback.successFn = successFn;
        }
    };

    // if the element has never rendered the 'templateValue' then it has no content.
    if (!element.$content) {
        // placeHolder is Node.COMMENT used as a marker where templateValue will be rendered
        let placeHolder = document.createComment(PLACEHOLDER_CONTENT);
        // we add placeholder to the element to be rendered.
        element.appendChild(placeHolder);
        element.$content = placeHolder;
    }
    _render(templateValue, element.$content);
    // setelah berhasil dirender kita akan mengupdate nilai dari template $content
    setTimeout(function () {
        _templateToUpdate.forEach(fn => fn());
        _templateToUpdate = [];
        syncTree(_rootTree.cloneTree, _rootTree.baseTree);
        if (callback.successFn) {
            callback.successFn();
        }
    }, 100);
    return callback;
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
    let placeHolderContainer = {};
    // variable yang menyimpan placeHolder children yang lama
    let oldPlaceHolderContainer = {};
    // variable yang menyimpan templateCollectionValue yang lama
    let oldTemplateCollectionValue = placeHolder.$content;

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
            oldTemplateCollectionValue.keys.forEach(oldKey => {
                if (templateCollectionValue.keys.indexOf(oldKey) < 0) {
                    let oldPlaceHolder = oldPlaceHolderContainer[oldKey];
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
    templateCollectionValue.keys.reduceRight((expectedSibling, key) => {
        // disini kita panggil childTemplateValue dari templateCollectionValue
        let childTemplateValue = templateCollectionValue.templateValuesContainer[key];

        // kemudian kita create childPlaceHolder
        let childPlaceHolder = document.createComment(PLACEHOLDER_CONTENT);
        if (oldPlaceHolderContainer[key]) {
            // bila terdapat key dari oldPlaceHolderContainer maka kita gunakan oldChildPlaceHolder dari oldPlaceHolderContainer.
            childPlaceHolder = oldPlaceHolderContainer[key];

            // bila terdapat oldChildTemplateValue dari oldTemplateCollectionValue maka kita akan gunakan oldChildTemplateValue sebagai
            // templateValue yang baru.
            let oldChildTemplateValue = oldTemplateCollectionValue.templateValuesContainer[key];
            if (oldChildTemplateValue instanceof HtmlTemplate && childTemplateValue instanceof HtmlTemplate && oldChildTemplateValue.key == childTemplateValue.key) {
                templateCollectionValue.templateValuesContainer[key] = oldChildTemplateValue;
            }
        }
        /*
         Jika childPlaceHolder nextSibling tidak ada, atau nextSibling bukan expectedSibling, maka kita tempatkan
         childPlaceHolder ini disebelah expectedSibling.
         */
        if ((!childPlaceHolder.nextSibling) || (childPlaceHolder.nextSibling != expectedSibling)) {
            placeHolder.parentNode.insertBefore(childPlaceHolder, expectedSibling);
        }
        // kemudian kita tempatkan childPlaceHolder kedalam placeHolderContainer yang baru
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
    if ((placeHolder.$content instanceof HtmlTemplate) || (placeHolder.$content instanceof HtmlTemplateCollection)) {
        // Jika placeHolder.$content merupakan HtmlTemplate kita kita akan mendestroy dulu kemudian remove.
        placeHolder.$content.destroy();
    }
    placeHolder.parentNode.removeChild(placeHolder);
}

/*
 function used to build templateValue, on its placeholder
 */
function _buildTemplate(templateValue, placeHolder) {
    templateValue.generateNodeTree(placeHolder).forEach(node => placeHolder.parentNode.insertBefore(node, placeHolder));
    placeHolder.$content = templateValue;
}

/*
 Function to render HtmlTemplate on its placeHolder
 */
function _renderHtmlTemplate(templateValue, placeHolder) {
    // Jika placeHolder memiliki $content artinya placeHolder sudah pernah merender content.
    if (placeHolder.$content) {
        let oldTemplateValue = placeHolder.$content;
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
    let oldTemplateValue = placeHolder.$content;
    if (oldTemplateValue) {
        if (oldTemplateValue.nodeType && oldTemplateValue.nodeType === Node.TEXT_NODE) {
            if (oldTemplateValue.nodeValue === templateValue) {
                return;
            }
            oldTemplateValue.nodeValue = templateValue;
            return;
        } else {
            destroy(oldTemplateValue);
        }
    }
    // kemudian kita buat text node dari templateValue
    let textNode = document.createTextNode(templateValue);
    // setelah itu kita insert textNode ke sebelah placeHolder
    placeHolder.parentNode.insertBefore(textNode, placeHolder);
    // kemudian kita simpan textNode ke placeHolder
    placeHolder.$content = textNode;
}

/*
 html is a function to create an HtmlTemplate object
 */
function html(strings, ...values) {
    let key = strings.join('').replace(/\s/g, '');
    return new HtmlTemplate(strings, values, key);
}

/*
 The cache used to save the HtmlTemplate, thus speeding up the key creation.
 */
function cache(key) {
    return {
        html: function (strings, ...values) {
            return new HtmlTemplate(strings, values, key);
        }
    }
}

/*
 htmlCollection is a function to create an HtmlTemplateCollection object
 */
function htmlCollection(items, keyFn, templateFn) {
    return new HtmlTemplateCollection(items, keyFn, templateFn);
}

const _cache = {};
let _templateToUpdate = [];
let _rootTree = [];

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
class HtmlTemplateCollection {
    constructor(items, keyFn, templateFn, ignoreInit) {
        this.items = items;
        this.keyFn = typeof keyFn === 'function' ? keyFn : (i) => i[keyFn];
        this.templateFn = templateFn;
        this.keys = [];
        this.templateValuesContainer = {};
        this.placeHolderContainer = {};
        if (!ignoreInit) {
            this._init();
        }

    }

    /*
     Function to initialize item, key into HtmlTemplateCollection
     */
    _init() {
        let index = this.items.length;
        while (index--) {
            let item = this.items[index];
            let key = this.keyFn.apply(this, [item]);
            this.templateValuesContainer[key] = this.templateFn.apply(this, [item, index, this.items]);
            this.keys.push(key);
        }
        this.keys.reverse();
    }

    /*
     Function called to destroy HtmlTemplateCollection
     */
    destroy() {
        this.keys.forEach(key => {
            if (this.templateValuesContainer[key] instanceof HtmlTemplate) {
                this.templateValuesContainer[key].destroy();
                this.placeHolderContainer[key].parentNode.removeChild(this.placeHolderContainer[key]);
            }
        });

        this.keys = [];
        this.templateValuesContainer = {};
        this.items = {};
        this.placeHolderContainer = {};
    }

    clone() {
        let clone = new HtmlTemplateCollection(this.items, this.keyFn, this.templateFn, true);
        clone.keys = this.keys;
        clone.templateValuesContainer = {};
        clone.placeHolderContainer = {};
        return clone;
    }

}

/*
 Function to take the path of a node up in documentFragment
 */
function getPath(node) {
    let i = 0;
    let child = node;
    while ((child = child.previousSibling) != null) {
        i++;
    }
    let path = [];
    path.push(i);
    if (node.parentNode && node.parentNode.parentNode) {
        return path.concat(getPath(node.parentNode));
    }
    return path;
}


function getNode(path, documentFragment) {
    let node = path.reduce(function (content, path) {
        if (typeof path == 'number') {
            return content.childNodes[path];
        } else {
            let attribute = content.attributes[path.name];
            attribute.$dynamicAttributeLength = path.dynamicLength;
            attribute.$dynamicAttributeLengthPos = 0;
            return attribute;
        }
    }, documentFragment);
    return node;
}


/*
 Class that stores information about templateValue. HtmlTemplate has attribute
   1. strings: static strings
   2. values: or dynamic values
   3. key: used as cache or name of template
 4. documentFragment : the template root
 5. nodeTree : the array of childNodes
 6. dynamicNodes : the dynamicNodes of this element
 7. dynamicNodesPath : the path of the dynamicNodes
 */
class HtmlTemplate {
    constructor(strings, values, key) {
        this.strings = strings;
        this.values = values;
        this.key = key;
    }

    /*
     Function to generate nodeTree
     */
    generateNodeTree(placeholder) {

        let key = this.key;
        // jika key sudah terdapat di cache, maka kita gunakan template untuk mempercepat pembuatan htmlTemplate.
        if (!_cache[key]) {
            let templateRoot = this._getProperTemplateTag(this.strings.join(PLACEHOLDER).trim());
            let htmlTemplate = new HtmlTemplate(this.strings, this.values, this.key);
            htmlTemplate.documentFragment = templateRoot;
            let dynamicNodes = [];
            // fungsi yang akan mengambil dynamicNodes dari path.
            htmlTemplate._lookDynamicNodes(arrayFrom(htmlTemplate.documentFragment.childNodes), dynamicNodes);
            htmlTemplate.dynamicNodes = dynamicNodes;
            _cache[key] = htmlTemplate;
        }
        let template = _cache[key];
        template.applyValues(this.values, true);
        this.documentFragment = template.documentFragment.cloneNode(true);
        this.nodeTree = arrayFrom(this.documentFragment.childNodes);
        _templateToUpdate.push(() => {
            this.dynamicNodesPath = template._generateDynamicNodesPath();
            this.dynamicNodes = this._lookDynamicNodesFromPath({childNodes: this.nodeTree}, this.dynamicNodesPath, template.dynamicNodes);
            // this is the flag to set the base tree in the root tree for match the result later
            _rootTree = {
                cloneTree: this.nodeTree,
                baseTree: template.documentFragment.childNodes
            };
        });
        return this.nodeTree;
    }

    _generateDynamicNodesPath() {
        if (!this.dynamicNodesPath) {
            this.dynamicNodesPath = this.dynamicNodes.map((dn) => {
                if (dn.nodeType === Node.ATTRIBUTE_NODE) {
                    return ([{
                        name: dn.nodeName,
                        dynamicLength: dn.$dynamicAttributeLength
                    }].concat(getPath(dn.ownerElement))).reverse();
                } else {
                    return getPath(dn).reverse();
                }
            });
        }
        return this.dynamicNodesPath;
    }

    _getProperTemplateTag(contentText) {
        let template = null;
        let openTag = contentText.substring(1, contentText.indexOf('>'));
        openTag = (openTag.indexOf(' ') > 0 ? openTag.substring(0, openTag.indexOf(' ')) : openTag).toLowerCase();
        let rootTag = templateRoot[openTag];
        if (rootTag) {
            template = document.createElement(rootTag);
        } else {
            template = document.createElement('div');
        }
        template.innerHTML = contentText;
        return template;
    }

    /*
     Function that searches dynamicNodes in a documentFragment with dynamicNodesPath
     */
    _lookDynamicNodesFromPath(documentFragment, dynamicNodesPath, dynamicNodesFromTemplate) {
        return dynamicNodesPath.map((path, index) => {
            let dynamicNode = getNode(path, documentFragment);
            // if we have dynamicNodes from template that means we need to update them
            if (dynamicNodesFromTemplate) {
                if (dynamicNode.nodeType === Node.COMMENT_NODE) {
                    if (dynamicNode.previousSibling instanceof Text) {
                        dynamicNode.$content = dynamicNode.previousSibling;
                    }
                }
                if (dynamicNode.nodeType === Node.ATTRIBUTE_NODE) {
                    if (dynamicNode.nodeName.indexOf("on") === 0) {
                        let eventName = dynamicNode.nodeName.substring(2, dynamicNode.nodeName.length);
                        dynamicNode.ownerElement.addEventListener(eventName, this.values[index]);
                    } else {
                        let templateDynamicNodes = dynamicNodesFromTemplate[index];
                        dynamicNode.$value = templateDynamicNodes.$value;
                        dynamicNode.$valueOriginal = templateDynamicNodes.$valueOriginal;
                    }
                }
            }
            return dynamicNode;
        });
    }

    /*
     Function that looks for dynamicNodes, from documentFragment.childNodes, then saves the result into dynamicNodes, dynamicNodesPath
     */
    _lookDynamicNodes(documentFragmentChildNodes, dynamicNodes, dynamicNodesPath) {
        documentFragmentChildNodes.forEach(node => {
            if (node instanceof Comment && node.nodeValue == PLACEHOLDER_CONTENT) {
                dynamicNodes.push(node);
                if (dynamicNodesPath) {
                    dynamicNodesPath.push(getPath(node));
                }
            }
            else if (node.attributes) {
                arrayFrom(node.attributes).reduce((results, attribute) => {
                    if (attribute.nodeValue.indexOf(PLACEHOLDER) >= 0) {
                        let dynamicLength = attribute.nodeValue.split(PLACEHOLDER).length - 1;
                        for (let i = 0; i < dynamicLength; i++) {
                            attribute.$dynamicAttributeLength = dynamicLength;
                            attribute.$dynamicAttributeLengthPos = 0;
                            results.push(attribute);
                            if (dynamicNodesPath) {
                                let path = [{
                                    name: attribute.nodeName,
                                    dynamicLength: dynamicLength
                                }].concat(getPath(attribute.ownerElement));
                                dynamicNodesPath.push(path);
                            }
                        }
                    }
                    return results;
                }, dynamicNodes);
                this._lookDynamicNodes(arrayFrom(node.childNodes), dynamicNodes, dynamicNodesPath);
            }
        });
    }

    /*
     Function that will apply templateValues
     */
    applyValues(templateValues, noEvents) {
        this.dynamicNodes = this.dynamicNodes || [];
        this.dynamicNodes.forEach((dynamicNode, index) => {
            if (dynamicNode.nodeType === Node.ATTRIBUTE_NODE) {
                HtmlTemplate._applyAttributeNode(dynamicNode, templateValues[index], noEvents);
            } else {
                _render(templateValues[index], dynamicNode);
            }
        });
    }

    /*
     Function to destroy HtmlTemplate
     */
    destroy() {
        this.nodeTree.forEach(n => n.parentNode.removeChild(n));
    }

    /*
     Function to apply attribute node.
     */
    static _applyAttributeNode(node, value, noEvents) {
        /*
         If the attribute is a function, and the node name has a prefix on, then we assume it's an attribute event so we will call ownerElement [node.name]
         */
        if (typeof value === 'function' && node.name.indexOf("on") === 0) {
            if (!noEvents) {
                // we are ignoring events here
                return;
            }
            node.nodeValue = "return false;";
            let eventName = node.name.substring(2, node.name.length);
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
                node.$value = node.$value.split(PLACEHOLDER).reduce((result, data, index) => {
                    return index == 0 ? data : `${result}${index == 1 ? value : PLACEHOLDER}${data}`;
                }, '');
                node.$dynamicAttributeLengthPos++;
                if (node.$dynamicAttributeLengthPos == node.$dynamicAttributeLength && node.value != node.$value) {
                    node.value = node.$value;
                }
            }
        }
    }

    clone(nodeTree) {
        let clone = new HtmlTemplate(this.strings, this.values, this.key);
        clone.documentFragment = this.documentFragment;
        clone.nodeTree = nodeTree;
        clone.dynamicNodesPath = this.dynamicNodesPath;
        clone.dynamicNodes = this._lookDynamicNodesFromPath({childNodes: nodeTree}, this.dynamicNodesPath);
        clone.dynamicNodes.forEach((dn, index) => {
            if (dn.nodeType === Node.ATTRIBUTE_NODE) {
                if (dn.nodeName.indexOf("on") === 0) {
                    // this is function attribute, lets register their event listener
                    let eventName = dn.nodeName.substring(2, dn.nodeName.length);
                    dn.ownerElement.addEventListener(eventName, this.values[index]);
                } else {
                    dn.$valueOriginal = this.dynamicNodes[index].$valueOriginal;
                    dn.$value = this.dynamicNodes[index].$value;
                    dn.$dynamicAttributeLength = this.dynamicNodes[index].$dynamicAttributeLength;
                    dn.$dynamicAttributeLengthPos = this.dynamicNodes[index].$dynamicAttributeLengthPos;
                }

            }
        });
        return clone;
    }
}