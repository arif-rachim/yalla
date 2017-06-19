#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var chokidar = require('chokidar');
var beautify = require('js-beautify').js_beautify;
var xmldom = require('xmldom');
var pjson = require('./package.json');

var DOMParser = xmldom.DOMParser;

var YALLA_SUFFIX = '.js';
var JS_SUFFIX = ".js";
var HTML_SUFFIX = ".html";
var PROMISE_JS = "yalla-promise.js";
var IDOM_JS = "yalla-idom.js";
var CORE_JS = "yalla-core.js";


String.prototype.isEmpty = function () {
    return (this.length === 0 || !this.trim());
};

var OPEN_BRACKET = '%7B';
var CLOSE_BRACKET = '%7D';

function wrapWithBind(value, s) {
    value = value.replace(/this\./g,'self.');
    if (value && value.length > 0 && s && s.length > 0 && value.indexOf('(') > 0) {
        var result = value.match(/[a-zA-Z]\(/g).reduce(function (current, matches) {
            current.pointerIndex = current.value.indexOf(matches, current.pointerIndex);
            current.value = current.value.substring(0, current.pointerIndex + 1) + '.bind(' + s + ')' + current.value.substring(current.pointerIndex + 1, current.length);
            current.pointerIndex = current.value.indexOf(')', current.pointerIndex);
            return current;
        }, {value: value, pointerIndex: 0});
        return result.value;
    }
    return value;
}

function convertAttributes(attributes) {
    return attributes.reduce(function (result, attribute) {
        var name = attribute.name;
        var value = attribute.value.replace(/"/g, "'");
        var convertedName = name;
        var convertedValue = value;

        if (attribute.name.indexOf('.trigger') >= 0) {
            convertedName = 'on' + name.substring(0, (name.length - '.trigger'.length));
            var selfWrapper = ["var self = " + OPEN_BRACKET + " target : event.target " + CLOSE_BRACKET + ";"];
            selfWrapper.push("self.properties = _props;");
            selfWrapper.push("if('elements' in self.target) " + OPEN_BRACKET + "self.elements = self.target.elements;" + CLOSE_BRACKET);
            selfWrapper.push("self.currentTarget = this == event.target ? self.target : _parentComponent(event.currentTarget);");
            selfWrapper.push("self.component = _component;");
            selfWrapper.push("self.state = self.component._state;");
            selfWrapper.push("self.emitEvent = function(eventName,data)" + OPEN_BRACKET + " var event = new ComponentEvent(eventName,data,self.target,self.currentTarget); if('on'+eventName in _props) " + OPEN_BRACKET + " _props['on'+eventName](event); " + CLOSE_BRACKET + ' ' + CLOSE_BRACKET + ";");
            value = wrapWithBind(value, 'self');
            var functionContent = (attribute.name !== 'submit.trigger' ? value + ';' : value + '; return false; ');
            convertedValue = '{{function(event) %7B ' + selfWrapper.join('') + ' ' + functionContent + ' %7D}}';
        }
        else if (attribute.name.indexOf('.bind') >= 0) {
            value = wrapWithBind(value, '_self');
            convertedName = name.substring(0, (name.length - '.bind'.length));
            convertedValue = '{{bind:' + value + ' }}';
        }
        result[convertedName] = convertedValue;
        return result;
    }, {});

}

function lengthableObjectToArray(object) {
    var result = [];
    if (object && object.length > 0) {
        for (var i = 0; i < object.length; i++) {
            var item = object[i];
            result.push(item);
        }
    }
    return result;
}

function textToExpression(text, replaceDoubleQuote) {
    if (text.trim() == '') {
        return text;
    }
    var matches = text.match(/{{.*?}}/g) || [];
    var matchesReplacement = matches.map(function (match) {

        var isFunction = match.indexOf('{{function') == 0;
        var isBind = match.indexOf('{{bind') == 0;
        return {
            text: match,
            replacement: isFunction || isBind ? ('<{{ ' + textToExpressionValue(match, true) + ' }}>') : textToExpressionValue(match, true)
        };
    });
    var replacedScript = matchesReplacement.reduce(function (script, replacement) {
        return script.replace(replacement.text, replacement.replacement);
    }, text);
    replacedScript = replacedScript.replace(/"<{{/g, '').replace(/}}>"/g, '').replace(/%7B/g, '{').replace(/%7D/g, '}');

    if (replaceDoubleQuote == undefined || replaceDoubleQuote == false) {
        replacedScript = replacedScript.replace(/"/g, '\\"').replace(/%34/g, '"').trim();
    } else {
        replacedScript = replacedScript.replace(/%34/g, '"').trim();
    }
    return replacedScript;
}


function textToExpressionValue(match, encodeDoubleQuote) {
    if (match.indexOf('{{') == 0) {
        var variable = match.substring(2, match.length - 2).replace(/\$/g, '_props.').replace(/@/g, '_state.').replace(/%7B/g, '{').replace(/%7D/g, '}').trim();
        var isFunction = variable.indexOf('function') == 0;
        var isBinding = variable.indexOf('bind:') == 0;
        if (isBinding) {
            variable = variable.substring('bind:'.length, variable.length);
        }
        var doubleQuote = encodeDoubleQuote ? '%34' : '"';
        var replacement = isFunction || isBinding ? variable : (doubleQuote + '+(' + variable + ')+' + doubleQuote);
        replacement = replacement.replace(/%7B/g, '{').replace(/%7D/g, '}').trim();
        return replacement;
    }
    return '"' + match + '"';
}

function escapeBracket(text) {
    return '%7B' + text.substring(1, text.length - 1) + '%7D';
}

function convertToIdomString(node, context, elementName, scriptTagContent, level) {
    var result = [];
    if (node.constructor.name == "Element") {
        var attributes = node.attributes;
        switch (node.nodeName) {
            case 'slot-view' : {
                // lets pass the name
                var slot = lengthableObjectToArray(attributes).reduce(function (output, node) {
                    if (node.name == 'name') {
                        output.name = node.value;
                    } else {
                        if (node.name.indexOf('.bind') > 0) {
                            var propName = node.name.substring(0, node.name.indexOf('.bind'));
                            output.props[propName] = '#' + textToExpressionValue('{{bind:' + node.value + '}}') + '#';
                        }
                    }
                    return output;
                }, {name: 'default', props: {}});
                result.push('_slotView("' + slot.name + '",' + JSON.stringify(slot.props).replace(/"#/g, '').replace(/#"/g, '') + ');');
                break;
            }
            case 'skip-to-end' : {
                result.push('_skip();');
                break;
            }
            case 'inject' : {
                var mapObject = lengthableObjectToArray(attributes).reduce(function (labelValue, node) {
                    labelValue[node.name] = node.value;
                    return labelValue;
                }, {});
                context[mapObject.name] = mapObject['from'];
                result.push('_context["' + mapObject.name + '"] = $inject("' + mapObject['from'] + '");');
                var camelCaseName = mapObject.name.split('-').map(function (word, index) {
                    return index == 0 ? word : (word.charAt(0).toUpperCase() + word.substring(1, word.length));
                }).join('');
                result.push('var ' + camelCaseName + ' = _context["' + mapObject.name + '"];');
                break;
            }
            default : {
                var nodeIsComponent = node.nodeName in context;
                var attributesArray = lengthableObjectToArray(attributes);
                var initialValue = {
                    refName: false,
                    refNameBind: false,
                    foreach: false,
                    foreachArray: false,
                    foreachItem: false,
                    if: false,
                    slotName: false,
                    cleanAttributes: [],
                    dataLoad: false,
                    dataName: 'data'
                };

                if (level == 0 && (['script', 'style'].indexOf(node.nodeName) < 0)) {
                    initialValue.cleanAttributes.push({name: 'element', value: elementName});
                }

                var condition = attributesArray.reduce(function (condition, attribute) {
                    if ([
                            'ref.name',
                            'ref.name.bind',
                            'for.each',
                            'if.bind',
                            'slot.name',
                            'data.load',
                            'data.name'].indexOf(attribute.name) >= 0) {

                        if(attribute.name === 'ref.name'){
                            condition.refName = attribute.value;
                        }

                        if(attribute.name === 'ref.name.bind'){
                            condition.refNameBind = textToExpressionValue('{{bind:'+attribute.value+'}}');
                        }

                        if (attribute.name === 'for.each') {
                            condition.foreach = attribute.value;
                            var foreachType = attribute.value.split(" in ");
                            condition.foreachArray = textToExpressionValue('{{bind:' + foreachType[1] + '}}');
                            condition.foreachItem = foreachType[0];
                        }
                        if (attribute.name == 'slot.name') {
                            condition.slotName = attribute.value;
                        }
                        if (attribute.name === 'if.bind') {
                            condition.if = textToExpressionValue('{{bind:' + attribute.value + '}}');
                        }
                        if (attribute.name === 'data.load') {
                            condition.dataLoad = textToExpressionValue('{{bind:' + attribute.value + '}}');
                        }
                        if (attribute.name === 'data.name') {
                            condition.dataName = attribute.value;
                        }

                    } else {
                        condition.cleanAttributes.push(attribute);
                    }
                    return condition;
                }, initialValue);

                var nonComponentNode = ['title','style','base','link','meta','script','noscript','head'];
                if (level == 0 && nonComponentNode.indexOf(node.nodeName) < 0) {
                    result.push('var _nextComponent = IncrementalDOM.currentPointer();');
                    result.push('var _validComponent = yalla.framework.validComponentName(_nextComponent,_elementName,_props.key)');
                    result.push('var _state = {};');
                    result.push('if(_validComponent ){ _state = _nextComponent._state }else{ _state = initState(_props)}');
                    result.push("var _self = {properties : _props, state : _state};");
                }
                
                if (condition.if) {
                    result.push('if(' + wrapWithBind(condition.if, '_self') + '){');
                }

                if (condition.slotName && condition.slotName != 'default') {
                    result.push('if(slotName === "' + condition.slotName + '"){');
                }

                if (condition.foreach) {
                    result.push(' var _array = ' + condition.foreachArray + ' || [];');
                    result.push(' _array.forEach(function(' + condition.foreachItem + '){');
                }

                if (nodeIsComponent) {
                    var convertedAttributes = convertAttributes(condition.cleanAttributes);
                    var escapedBracketJson = escapeBracket(JSON.stringify(convertedAttributes));
                    result.push('var _params = ' + textToExpression(escapedBracketJson, true) + ';');
                    result.push('_params.key = '+(Math.random()* 10000000000000000).toFixed(0)+';');
                    result.push('_context["' + node.nodeName + '"].render( typeof arguments[1] === "object" ? _merge(arguments[1],_params) : _params ,function(slotName,slotProps){');
                    lengthableObjectToArray(node.childNodes).forEach(function (childNode) {
                        result = result.concat(convertToIdomString(childNode, context, elementName, scriptTagContent, ++level));
                    });
                    result.push('});');
                } else if (node.nodeName === 'script') {
                    lengthableObjectToArray(node.childNodes).forEach(function (childNode) {
                        result = result.concat(convertToIdomString(childNode, context, elementName, scriptTagContent, ++level));
                    });
                } else {


                    var incrementalDomNode = '{element : IncrementalDOM.currentElement(), pointer : IncrementalDOM.currentPointer()}';
                    result.push('_elementOpenStart("' + node.nodeName + '",_props.key);');
                    var attributesObject = convertAttributes(condition.cleanAttributes);
                    for (var key in attributesObject) {
                        if(attributesObject.hasOwnProperty(key)){
                            result.push('_attr("' + key + '", ' + textToExpressionValue(attributesObject[key]) + ');');
                        }
                    }

                    result.push('_elementOpenEnd("' + node.nodeName + '");');

                    if (level == 0 && nonComponentNode.indexOf(node.nodeName) < 0) {
                        result.push('var _component = IncrementalDOM.currentElement();');
                        result.push('_component._state = _state;');
                        result.push('_component._state._name = _elementName;');
                        result.push('_component._state._key = _props.key;');
                        result.push('_component._state._onCreated = onCreated;');
                        result.push('_component._state._onDeleted = onDeleted;');
                        result.push('_self.emitEvent = function(eventName,data) { var event = new ComponentEvent(eventName,data,_component,_component); if("on"+eventName in _props) { _props["on"+eventName](event); }} ;');
                        result.push('if(_validComponent){yalla.framework.propertyCheckChanges(_component._properties,_props,onPropertyChange.bind(_self));}');
                        result.push('_component._properties = _props;');
                    }

                    if(condition.refName){
                        result.push('yalla.framework.registerRef("'+condition.refName+'",IncrementalDOM.currentElement(),function(){');
                    }

                    if(condition.refNameBind){
                        result.push('yalla.framework.registerRef('+condition.refNameBind+',IncrementalDOM.currentElement(),function(){');
                    }

                    if (condition.dataLoad) {
                        context.asyncFuncSequence = context.asyncFuncSequence || 0;
                        context.asyncFuncSequence += 1;
                        result.push('(function(domNode) { ');
                        result.push('var node = domNode.element;');
                        result.push("var self = {target:node};");
                        result.push("self.properties = _props;");
                        result.push("if('elements' in self.target){ self.elements = self.target.elements;}");
                        result.push("self.currentTarget = self.target;");
                        result.push("self.component = _component;");
                        result.push("self.component._state = self.component._state || {};");
                        result.push("self.state = self.component._state;");
                        result.push("self.emitEvent = function(eventName,data) { var event = new ComponentEvent(eventName,data,self.target,self.currentTarget); if('on'+eventName in _props) { _props['on'+eventName](event); }} ;");
                        result.push('function asyncFunc_' + context.asyncFuncSequence + '(' + condition.dataName + '){');
                    }

                    lengthableObjectToArray(node.childNodes).forEach(function (childNode) {
                        result = result.concat(convertToIdomString(childNode, context, elementName, scriptTagContent, ++level));
                    });


                    if (condition.dataLoad) {
                        result.push('}');
                        result.push('var promise = ' + wrapWithBind(condition.dataLoad, 'self') + ';');
                        result.push('promise = typeof promise === "function" ? new Promise(promise) : promise; ');
                        result.push('if(promise && typeof promise == "object" && "then" in promise){');
                        result.push('_skip();');
                        result.push('promise.then(function(_result){ $patchChanges(node,function(){ ');
                        result.push('asyncFunc_' + context.asyncFuncSequence + '.call(self,_result)');
                        result.push('}); }).catch(function(err){ console.log(err); }); }else { ');
                        result.push('asyncFunc_' + context.asyncFuncSequence + '.call(self,promise)');
                        result.push('}})(' + incrementalDomNode + ');');
                        context.asyncFuncSequence -= 1;
                    }

                    if(condition.refName || condition.refNameBind){
                        result.push('})()');
                    }
                    result.push('_elementClose("' + node.nodeName + '");');
                }

                if (condition.foreach) {
                    result.push('});');
                }

                if (condition.slotName && condition.slotName != 'default') {
                    result.push('}');
                }

                if (condition.if) {
                    result.push('}');
                }

            }
        }

    } else if (node.constructor.name == "Text") {

        if (!node.nodeValue.isEmpty()) {
            var isStyle = node.parentNode.nodeName == 'style';
            var isScript = node.parentNode.nodeName == 'script';
            var isRawText = lengthableObjectToArray(node.parentNode.attributes).reduce(function (rawText, attribute) {
                if (attribute.name == 'raw.text') {
                    return true;
                }
                return rawText;
            }, false);

            if (isStyle) {
                var elementSelector = "[element='" + elementName.trim() + "']";
                var text = node.nodeValue.replace(/\r\n/g, '').replace(/\n/g, '').replace(/  /g, '').replace(/"/g, '\'');
                var cleanScript = text.match(/([^\n,{}]+)(,(?=[^}]*\{)|\s*\{)/g).reduce(function (script, match) {
                    var selector = match.substring(0,match.length-1);
                    return script.replace(match, '\\n' + elementSelector + selector+','+ elementSelector +' '+ match);
                }, text);
                result.push('_text("' + cleanScript + '");');
            } else if (isScript) {
                scriptTagContent.push(node.nodeValue);
            } else if (isRawText) {
                result.push('_text("' + node.nodeValue.replace(/\r\n/g, '\\r\\n') + '");');
            } else {
                var cleanText = node.nodeValue.replace(/[\r\n]/g, "");
                var replaceExpression = textToExpression(cleanText);
                result.push('_text("' + replaceExpression + '");');
            }
        }
    }
    return result;
}

function convertHtmlToJavascript(file, originalUrl) {
    var path = originalUrl.substring(1, originalUrl.length - YALLA_SUFFIX.length);
    var doc = new DOMParser().parseFromString(file);
    var result = [];
    var elementName = path.replace(/\\/g, '.').replace(/\//g, '.');
    if (file && doc) {
        result.push('var _elementOpen = IncrementalDOM.elementOpen;');
        result.push('var _elementClose = IncrementalDOM.elementClose;');
        result.push('var _elementOpenStart = IncrementalDOM.elementOpenStart;');
        result.push('var _elementOpenEnd = IncrementalDOM.elementOpenEnd;');
        result.push('var _elementVoid = IncrementalDOM.elementVoid;');
        result.push('var _skip = IncrementalDOM.skip;');
        result.push('var _text = IncrementalDOM.text;');
        result.push('var _attr = IncrementalDOM.attr;');
        result.push('function initState(props){ return {} };');
        result.push('function onCreated(){};');
        result.push('function onPropertyChange(props){};');
        result.push('function onDeleted(){};');
        var functionContent = [];
        functionContent.push('function $render(_props,_slotView){');
        var context = {};
        var scriptTagContent = [];
        lengthableObjectToArray(doc.childNodes).forEach(function (node) {
            functionContent = functionContent.concat(convertToIdomString(node, context, elementName, scriptTagContent, 0));
        });
        functionContent.push('}');
        result = result.concat(scriptTagContent).concat(functionContent);
    }
    return result.join('\n');
}

function compileHTML(file, originalUrl) {
    try {
        return beautify(encapsulateScript(convertHtmlToJavascript(file, originalUrl), originalUrl), {indent_size: 2});
    } catch (err) {
        console.log('ERROR COMPILING ' + originalUrl);
        console.warn(err);
        return '';
    }

}

function compileJS(file, originalUrl) {
    try {
        return beautify(encapsulateScript(file, originalUrl), {indent_size: 2});
    } catch (err) {
        console.log('ERROR COMPILING ' + originalUrl);
        console.warn(err);
        return '';
    }
}

var encapsulateScript = function (text, path) {
    var componentPath = path.substring(0, path.length - (YALLA_SUFFIX.length)).replace(/\\/g, '/');
    var result = [];

    result.push('yalla.framework.addComponent("' + componentPath + '",(function (){');
    result.push('var $patchChanges = yalla.framework.renderToScreen;');
    result.push('var $navigateTo = yalla.framework.navigateTo;');

    result.push('var $inject = yalla.framework.createInjector("' + componentPath + '");');
    result.push('var $export = {};');
    result.push('var $path = "' + componentPath + '";');
    result.push('var _elementName = "' + componentPath.replace(/\//g, '.').substring(1, componentPath.length) + '";');
    result.push('var _context = {};');
    result.push('var _parentComponent = yalla.framework.getParentComponent;');
    result.push('var _merge = yalla.utils.merge;');
    result.push('function ComponentEvent(type,data,target,currentTarget){ this.data = data; this.target = target; this.type = type; this.currentTarget = currentTarget;}\n');
    result.push(text);
    result.push('if(typeof $render === "function"){$export.render = $render;}');
    result.push('return $export;');
    result.push('})());');
    return result.join("\n");
};

function ensureDirectoryExistence(filePath) {
    var dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
}

var walk = function (dir) {
    var results = [];
    var list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = dir + '/' + file;
        var stat = fs.statSync(file);
        if (stat && stat.isDirectory()) results = results.concat(walk(file));
        else results.push(file)
    });
    return results;
};

function buildYallaJs() {
    var result = [];
    result.push('/*');
    result.push('version : ' + pjson.version);
    result.push('*/\n');

    result.push(fs.readFileSync(__dirname + '/' + PROMISE_JS, "utf-8"));
    result.push(fs.readFileSync(__dirname + '/' + IDOM_JS, "utf-8"));
    result.push(fs.readFileSync(__dirname + '/' + CORE_JS, "utf-8"));
    return result.join('\n');
}

function runCompiler(sourceDir, targetDir) {
    if (!fs.existsSync(sourceDir)) {
        fs.mkdirSync(sourceDir);
    }
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir);
    }
    var files = walk(sourceDir);
    fs.writeFile(targetDir + "/yalla.js", buildYallaJs());
    files.forEach(function (file) {
        var targetFile = file.replace(sourceDir, targetDir).replace(HTML_SUFFIX, YALLA_SUFFIX).replace(JS_SUFFIX, YALLA_SUFFIX);
        ensureDirectoryExistence(targetFile);
        fs.readFile(file, 'utf8', function (err, data) {
            if (file.indexOf(".html") >= 0) {
                fs.writeFile(targetFile, compileHTML(data, targetFile.substring(1, targetFile.length)));
            }
            if (file.indexOf(".js") >= 0) {
                fs.writeFile(targetFile, compileJS(data, targetFile.substring(1, targetFile.length)));
            }
        });
    });

    function compileSource(event) {
        var validExtension = event.indexOf(HTML_SUFFIX) === (event.length - HTML_SUFFIX.length) || event.indexOf(JS_SUFFIX) === (event.length - JS_SUFFIX.length);
        if (!validExtension) {
            return false;
        }
        event = './' + event.replace('\\', '/');
        var targetFile = event.replace(sourceDir, targetDir).replace(HTML_SUFFIX, YALLA_SUFFIX).replace(JS_SUFFIX, YALLA_SUFFIX);
        ensureDirectoryExistence(targetFile);
        fs.readFile(event, 'utf8', function (err, data) {
            if (!err) {
                if (event.indexOf(".html") >= 0) {
                    fs.writeFile(targetFile, compileHTML(data, targetFile.substring(targetDir.length, targetFile.length)));
                }
                if (event.indexOf(".js") >= 0) {
                    fs.writeFile(targetFile, compileJS(data, targetFile.substring(targetDir.length, targetFile.length)));
                }
            }
        });
        return true;
    }

    chokidar.watch(sourceDir, {persistent: true})
        .on('add', function (event) {
            if (compileSource(event)) {
                console.log('[+]', event);
            }
        })
        .on('change', function (event) {
            if (compileSource(event)) {
                console.log('[#]', event);
            }
        })
        .on('unlink', function (event, path) {
            var validExtension = event.indexOf(HTML_SUFFIX) === (event.length - HTML_SUFFIX.length) || event.indexOf(JS_SUFFIX) === (event.length - JS_SUFFIX.length);
            if (!validExtension) {
                return;
            }

            var cleanEvent = './' + event.replace('\\', '/');
            var targetFile = cleanEvent.replace(sourceDir, targetDir).replace(HTML_SUFFIX, YALLA_SUFFIX).replace(JS_SUFFIX, YALLA_SUFFIX);
            fs.unlink(targetFile, function (err) {
                if (!err) {
                    console.log('[-]', event);
                    setTimeout(function () {
                        if (fs.existsSync(event)) {
                            if (compileSource(event)) {
                                console.log('[+]', event);
                            }
                        }
                    }, 100);
                }
            });
        });
}


var argv = require('minimist')(process.argv.slice(2));

var mode = argv.m;
var port = argv.p;
var sourceDir = argv.s;
var targetDir = argv.d;
var help = argv.h;
var version = argv.v;

if (help) {
    var helpDoc = [];
    helpDoc.push('');
    helpDoc.push('  Usage : yalla [options]');
    helpDoc.push('');
    helpDoc.push('      -s src                                   base directory for the source code');
    helpDoc.push('      -d dist                                  base directory for the compiled code');
    helpDoc.push('      -v version                               version of yallajs library');
    helpDoc.push('');
    helpDoc.push('  Example : ');
    helpDoc.push('');
    helpDoc.push('      yalla -s source -d build                 run yalla compiler watch directory source and generate result in build directory"');
    helpDoc.push('');
    console.log(helpDoc.join('\n'));
} else if (version) {
    console.log('YallaJS version : ' + pjson.version);
} else {
    if (!sourceDir) {
        console.log('-s default set to "src"');
        sourceDir = 'src';
    }
    if (!targetDir) {
        console.log('-d default set to "dist"');
        targetDir = 'dist';
    }
    sourceDir = './' + sourceDir;
    targetDir = './' + targetDir;
    runCompiler(sourceDir, targetDir);
}
