const PLACEHOLDER_CONTENT = 'place-holder';
const PLACEHOLDER = `<!--${PLACEHOLDER_CONTENT}-->`;

const isMinimizationAttribute = node => {
    return ['checked', 'compact', 'declare', 'defer', 'disabled', 'ismap',
            'noresize', 'noshade', 'nowrap', 'selected'].indexOf(node.nodeName) >= 0;
};

function render(val,node){
    if(!node.$content){
        let placeHolder = document.createComment(PLACEHOLDER_CONTENT);
        node.appendChild(placeHolder);
        _render(val,placeHolder);
        node.$content = placeHolder;
    }else{
        _render(val,node.$content);
    }
}

function destroy(val){
    if(val instanceof HtmlTemplate){
        val.destroy();
    }else if(val instanceof HtmlTemplateCollection){
        val.destroy();
    }else if(val.parentNode){
        val.parentNode.removeChild(val);
    }
}

function _render(val, node){
    if(val instanceof HtmlTemplate){
        _renderHtmlTemplate(val,node);
    }else if(val instanceof HtmlTemplateCollection){
        _renderHtmlTemplateCollection(val,node);
    }else{
        _renderText(val,node);
    }
}

function getFirstNodeFromTemplate(template,placeHolder) {
    if(template instanceof HtmlTemplate){
        return template.nodeTree[0];
    }else if(template instanceof HtmlTemplateCollection){
        return getFirstNodeFromTemplate(template.htmlTemplates[template.keys[0]],placeHolder);
    }else{
        return placeHolder.$content;
    }
}
function _renderHtmlTemplateCollection(newTemplateCollection, newPlaceHolder){

    let placeHolders = {};
    let oldPlaceHolders = {};
    let oldKeys = [];
    let oldHtmlTemplateCollection = newPlaceHolder.$content;

    if(oldHtmlTemplateCollection && (!(oldHtmlTemplateCollection instanceof HtmlTemplateCollection))){
        destroy(oldHtmlTemplateCollection);
        oldHtmlTemplateCollection = null;
    }

    if(oldHtmlTemplateCollection){
        oldKeys = oldHtmlTemplateCollection.keys;
        oldPlaceHolders = oldHtmlTemplateCollection.placeHolders;
    }

    oldKeys.forEach(oldKey => {
        if(newTemplateCollection.keys.indexOf(oldKey) < 0){
            let oldPlaceHolder = oldPlaceHolders[oldKey];
            removePlaceholder(oldPlaceHolder);
        }
    });

    newTemplateCollection.keys.reduceRight((prev,key,index,array) => {
        let htmlTemplate = newTemplateCollection.htmlTemplates[key];

        let placeHolder = document.createComment(PLACEHOLDER_CONTENT);
        if(oldPlaceHolders[key]){
            placeHolder = oldPlaceHolders[key];
        }
        if(placeHolder.nextSibling){
            if(placeHolder.nextSibling != prev){
                newPlaceHolder.parentNode.insertBefore(placeHolder,prev);
            }
        }else{
            newPlaceHolder.parentNode.insertBefore(placeHolder,prev);
        }
        placeHolders[key] = placeHolder;
        if(oldPlaceHolders[key]){
            let oldHtmlTemplate = oldHtmlTemplateCollection.htmlTemplates[key];
            _render(htmlTemplate,placeHolder);
            if(oldHtmlTemplate instanceof HtmlTemplate && htmlTemplate instanceof HtmlTemplate && oldHtmlTemplate.key == htmlTemplate.key){
                newTemplateCollection.htmlTemplates[key] = oldHtmlTemplate;
            }
        }else{
            _render(htmlTemplate,placeHolder);
        }
        let firstNode = getFirstNodeFromTemplate(newTemplateCollection.htmlTemplates[key],placeHolder);
        return firstNode;

    },newPlaceHolder);
    newTemplateCollection.placeHolders = placeHolders;
    newPlaceHolder.$content = newTemplateCollection;
}

function removePlaceholder(placeHolder){
    if(placeHolder.$content instanceof HtmlTemplate){
        placeHolder.$content.nodeTree.forEach(n => n.parentNode.removeChild(n));
    }else if(Array.isArray(placeHolder.$content)) {
        placeHolder.$content.forEach(pc => removePlaceholder(pc));
    }
    placeHolder.parentNode.removeChild(placeHolder);
}

function _renderHtmlTemplate(htmlTemplate, node) {
    if(node.$content){
        if(node.$content instanceof  HtmlTemplate){
            node.$content.applyValues(htmlTemplate.values);
            node.$content.nodeTree.reduceRight(function(next,item,index){
                if(item.nextSibling && item.nextSibling != next && next.parentNode){
                    next.parentNode.insertBefore(item,next);
                }
                return item;
            },node);
        }else {
            destroy(node.$content);
            htmlTemplate.generateNodeTree().forEach(n => node.parentNode.insertBefore(n,node));
            node.$content = htmlTemplate;
        }
    }else{
        htmlTemplate.generateNodeTree().forEach(n => node.parentNode.insertBefore(n,node));
        node.$content = htmlTemplate;
    }
}

function _renderText(val, node){
    if(node.parentNode == null){
        return;
    }
    if(node.$content){
        destroy(node.$content);
    }
    let textNode = document.createTextNode(val);
    node.parentNode.insertBefore(textNode,node);
    node.$content = textNode;
}

function html(strings,...values){
    return new HtmlTemplate(strings,values);
}
function htmlMap(items,keyFn,templateFn){
    return new HtmlTemplateCollection(items,keyFn,templateFn);
}

const _cache = {};

class HtmlTemplateCollection{
    constructor(items,keyFn,templateFn){
        this.items = items;
        this.keyFn = typeof keyFn === 'function' ? keyFn : (i) => i[keyFn];
        this.templateFn = templateFn;

        this.keys = [];
        this.htmlTemplates = {};

        this._init();
    }

    _init(){
        this.items.forEach((item,index,array) => {
            let key = this.keyFn.apply(this,[item]);
            let htmlTemplate = this.templateFn.apply(this,[item,index,array]);
            this.htmlTemplates[key] = htmlTemplate;
            this.keys.push(key);
        });
    }

    destroy(){
        this.keys.forEach(key => {
            if(this.htmlTemplates[key] instanceof HtmlTemplate){
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

class HtmlTemplate{
    constructor(strings,values){
        this.strings = strings;
        this.values = values;
        this.key = this.strings.join('');
    }

    generateNodeTree(){
        let key = this.key;
        if(!(key in _cache)){
            let template = document.createElement('template');
            template.innerHTML = this.strings.join(PLACEHOLDER);
            _cache[key] = template;
        }
        this.content = _cache[key].content.cloneNode(true);
        this._init();
        this.nodeTree = Array.from(this.content.childNodes);
        return this.nodeTree;
    }

    _init(){
        let results = [];
        this._lookDynamicNodes(Array.from(this.content.childNodes),results);
        this.dynamicNodes = results;
        this.applyValues(this.values);
    }

    _lookDynamicNodes(childNodes, results) {
        childNodes.forEach(node => {
            if(node instanceof Comment){
                results.push(node);
            }
            else if (node.attributes) {
                Array.from(node.attributes).reduce((results, attribute) => {
                    if (attribute.nodeValue.indexOf(PLACEHOLDER) >= 0) {
                        let dynamicLength = attribute.nodeValue.split(PLACEHOLDER).length - 1;
                        for(let i = 0;i<dynamicLength;i++){
                            attribute.$dynamicAttributeLength = dynamicLength;
                            attribute.$dynamicAttributeLengthPos = 0;
                            results.push(attribute);
                        }
                    }
                    return results;
                }, results);
                this._lookDynamicNodes(Array.from(node.childNodes), results);
            }
        });
    }

    applyValues(values){
        this.dynamicNodes.forEach((dn,index) => {
            if (dn.nodeType === Node.ATTRIBUTE_NODE) {
                HtmlTemplate._applyAttributeNode(dn, values[index]);
            } else {
                _render(values[index],dn);
            }
        });
    }

    destroy(){
        this.nodeTree.forEach(n => n.parentNode.removeChild(n));
        this.content = null;
    }

    static _applyAttributeNode(node, value) {
        if (typeof value === 'function' && node.name.indexOf('on') === 0) {
            node.nodeValue = PLACEHOLDER;
            node.ownerElement[node.name] = value;
        } else {
            if (!node.$valueOriginal) {
                node.$valueOriginal = node.value;
            }
            if(node.$dynamicAttributeLengthPos == node.$dynamicAttributeLength){
                node.$dynamicAttributeLengthPos = 0;
            }
            if(node.$dynamicAttributeLengthPos == 0) {
                node.$value = node.$valueOriginal;
            }
            if (isMinimizationAttribute(node)) {
                node.ownerElement[node.nodeName] = value;
            } else {
                node.$value = node.$value.split(PLACEHOLDER).reduce((result, data, index)=> {
                    return index == 0 ? data : `${result}${index == 1 ? value : PLACEHOLDER}${data}`;
                }, '');
                node.$dynamicAttributeLengthPos++;
                if(node.$dynamicAttributeLengthPos == node.$dynamicAttributeLength && node.value != node.$value){
                    node.value = node.$value;
                }
            }
        }
    }
}