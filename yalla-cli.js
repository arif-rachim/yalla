#!/usr/bin/env node

var express = require('express');
var fs = require('fs');
var path = require('path');
var chokidar = require('chokidar');
var beautify = require('js-beautify').js_beautify;
var xmldom = require('xmldom');
var endOfLine = require('os').EOL;

var DOMParser = xmldom.DOMParser;

var YALLA_SUFFIX = '.js';
var JS_SUFFIX = ".js";
var HTML_SUFFIX = ".html";
var PROMISE_JS = "yalla-promise.js";
var IDOM_JS = "yalla-idom.js";
var REDUX_JS = "yalla-redux.js";
var CORE_JS = "yalla-core.js";

String.prototype.isEmpty = function () {
    return (this.length === 0 || !this.trim());
};

var OPEN_BRACKET = '%7B';
var CLOSE_BRACKET = '%7D';

function convertAttributes(attributes) {
    return attributes.reduce(function (result, attribute) {
        var name = attribute.name;
        var value = attribute.value.replace(/"/g,"'");
        var convertedName = name;
        var convertedValue = value;

        if (attribute.name.indexOf('.trigger') >= 0) {
            convertedName = 'on' + name.substring(0, (name.length - '.trigger'.length));
            var selfWrapper = ["var self = "+OPEN_BRACKET+" target : event.target "+CLOSE_BRACKET+";"];
            selfWrapper.push("self.properties = _props;");
            selfWrapper.push("if('elements' in self.target) "+OPEN_BRACKET+"self.elements = self.target.elements;"+CLOSE_BRACKET);
            selfWrapper.push("self.currentTarget = this == event.target ? self.target : _parentComponent(event.currentTarget);");
            selfWrapper.push("self.component = __component;");
            selfWrapper.push("self.component.__state = self.component.__state || {};");
            selfWrapper.push("self.state = self.component.__state;");
            selfWrapper.push("self.emitEvent = function(eventName,data)"+OPEN_BRACKET+" var event = new ComponentEvent(eventName,data,self.target,self.currentTarget); if('on'+eventName in _props) "+OPEN_BRACKET+" _props['on'+eventName](event); "+CLOSE_BRACKET+' '+CLOSE_BRACKET+";");
            var value = value.substring(0,value.indexOf('('))+'.bind(self)'+value.substring(value.indexOf('('),value.length);
            var functionContent = (attribute.name !== 'submit.trigger' ? 'return '+value+';' : value+'; return false; ');
            convertedValue = '{{function(event) %7B ' + selfWrapper.join('') +' '+ functionContent + ' %7D}}';
        }
        else if (attribute.name.indexOf('.bind') >= 0) {

            convertedName = name.substring(0, (name.length - '.bind'.length));
            convertedValue = '{{bind:' + value + ' }}';
        }
        result[convertedName] = convertedValue;
        return result;
    }, {});

}

function lengthableObjectToArray(object) {
    var result = [];
    if(object && object.length > 0){
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
        /// SHIT
        var variable = match.substring(2, match.length - 2).replace(/\$/g, '_props.').replace(/@/g, '__state.').replace(/%7B/g, '{').replace(/%7D/g, '}').trim();
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
                var slotName = lengthableObjectToArray(attributes).reduce(function (name, node) {
                    if (node.name == 'name') {
                        return node.value;
                    }
                    return name;
                }, 'default');
                result.push('_slotView("' + slotName + '");');
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
                context[mapObject.name] = mapObject.from;
                result.push('$context["' + mapObject.name + '"] = $inject("' + mapObject.from + '");');
                var camelCaseName = mapObject.name.split('-').map(function (word, index) {
                    return index == 0 ? word : (word.charAt(0).toUpperCase() + word.substring(1, word.length));
                }).join('');
                result.push('var ' + camelCaseName + ' = $context["' + mapObject.name + '"];');
                break;
            }
            default : {
                var nodeIsComponent = node.nodeName in context;
                var attributesArray = lengthableObjectToArray(attributes);
                var initialValue = {
                    foreach: false,
                    foreachArray: false,
                    foreachItem: false,
                    if: false,
                    slotName: false,
                    cleanAttributes: [],
                    dataLoad: false,
                    dataName: 'data',
                    beforePatchElement: false,
                    afterPatchElement: false,
                    beforePatchAttribute: false,
                    afterPatchAttribute: false,
                    beforePatchContent: false,
                    afterPatchContent: false
                };

                if (level == 0 && (['script', 'style'].indexOf(node.nodeName) < 0)) {
                    initialValue.cleanAttributes.push({name: 'element', value: elementName});
                }

                var condition = attributesArray.reduce(function (condition, attribute) {
                    if (['for.each',
                            'if.bind',
                            'slot.name',
                            'data.load',
                            'data.name',
                            'before.patch-element',
                            'after.patch-element',
                            'before.patch-attribute',
                            'after.patch-attribute',
                            'before.patch-content',
                            'after.patch-content'].indexOf(attribute.name) >= 0) {

                        if (attribute.name == 'for.each') {
                            condition.foreach = attribute.value;
                            var foreachType = attribute.value.split(" in ");
                            condition.foreachArray = textToExpressionValue('{{bind:' + foreachType[1] + '}}');
                            condition.foreachItem = foreachType[0];
                        }
                        if (attribute.name == 'slot.name') {
                            condition.slotName = attribute.value;
                        }
                        if (attribute.name == 'if.bind') {
                            condition.if = textToExpressionValue('{{bind:' + attribute.value + '}}');
                        }
                        if (attribute.name == 'data.load') {
                            condition.dataLoad = textToExpressionValue('{{bind:' + attribute.value + '}}');
                        }
                        if (attribute.name == 'data.name') {
                            condition.dataName = attribute.value;
                        }
                        //before patch element start
                        if (attribute.name == 'before.patch-element') {
                            condition.beforePatchElement = attribute.value;
                        }
                        if (attribute.name == 'before.patch-attribute') {
                            condition.beforePatchAttribute = attribute.value;
                        }
                        if (attribute.name == 'after.patch-attribute') {
                            condition.afterPatchAttribute = attribute.value;
                        }
                        if (attribute.name == 'before.patch-content') {
                            condition.beforePatchContent = attribute.value;
                        }
                        if (attribute.name == 'after.patch-content') {
                            condition.afterPatchContent = attribute.value;
                        }
                        if (attribute.name == 'after.patch-element') {
                            condition.afterPatchElement = attribute.value;
                        }
                    } else {
                        condition.cleanAttributes.push(attribute);
                    }
                    return condition;
                }, initialValue);

                if (condition.if) {
                    result.push('if(' + condition.if + '){');
                }

                if (condition.slotName && condition.slotName != 'default') {
                    result.push('if(slotName == "' + condition.slotName + '"){');
                }

                if (condition.foreach) {
                    result.push(' var _array = ' + condition.foreachArray + ' || [];');
                    result.push(' _array.forEach(function(' + condition.foreachItem + '){');
                }

                if (nodeIsComponent) {
                    var convertedAttributes = convertAttributes(condition.cleanAttributes);
                    var escapedBracketJson = escapeBracket(JSON.stringify(convertedAttributes));
                    var expressionObjectInString = textToExpression(escapedBracketJson, true);
                    result.push('$context["' + node.nodeName + '"].render(' + expressionObjectInString + ',function(slotName){');
                    lengthableObjectToArray(node.childNodes).forEach(function (childNode) {
                        result = result.concat(convertToIdomString(childNode, context, elementName, scriptTagContent, ++level));
                    });
                    result.push('});');
                } else if(node.nodeName === 'script'){
                    lengthableObjectToArray(node.childNodes).forEach(function (childNode) {
                        result = result.concat(convertToIdomString(childNode, context, elementName, scriptTagContent, ++level));
                    });
                } else {

                    var incrementalDomNode = '{element : IncrementalDOM.currentElement(), pointer : IncrementalDOM.currentPointer()}';
                    if (condition.beforePatchElement) {
                        result.push('(function (event){ return ' + condition.beforePatchElement + ' })(' + incrementalDomNode + ');');
                    }
                    result.push('_elementOpenStart("' + node.nodeName + '","");');
                    if (condition.beforePatchAttribute) {
                        result.push('(function (event){ return ' + condition.beforePatchAttribute + ' })(' + incrementalDomNode + ');');
                    }
                    var attributesObject = convertAttributes(condition.cleanAttributes);
                    for (var key in attributesObject) {
                        result.push('_attr("' + key + '", ' + textToExpressionValue(attributesObject[key]) + ');');
                    }

                    if (condition.afterPatchAttribute) {
                        result.push('(function (event){ return ' + condition.afterPatchAttribute + ' })(' + incrementalDomNode + ');');
                    }
                    result.push('_elementOpenEnd("' + node.nodeName + '");');
                    if(level == 0){
                        result.push('// The component of this object');
                        result.push('var __component = IncrementalDOM.currentElement();');
                        result.push('__component.__state = __component.__state || initState.bind(__component)(_props);');
                        result.push('var __state = __component.__state;');

                    }
                    if (condition.beforePatchContent) {
                        result.push('(function (event){ return ' + condition.beforePatchContent + ' })(' + incrementalDomNode + ');');
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
                        result.push("self.component = __component;");
                        result.push("self.component.__state = self.component.__state || {};");
                        result.push("self.state = self.component.__state;");

                        result.push('function asyncFunc__' + context.asyncFuncSequence + '(' + condition.dataName + '){');
                    }

                    lengthableObjectToArray(node.childNodes).forEach(function (childNode) {
                        result = result.concat(convertToIdomString(childNode, context, elementName, scriptTagContent, ++level));
                    });


                    if (condition.dataLoad) {
                        result.push('}');
                        var functionName = condition.dataLoad.substring(0,condition.dataLoad.indexOf('('));
                        var functionParam = condition.dataLoad.substring(condition.dataLoad.indexOf('('),condition.dataLoad.length);
                        result.push('var promise = ' + functionName+'.bind(self)'+functionParam+ ';');
                        result.push('if(promise && typeof promise == "object" && "then" in promise){');
                        result.push('_skip();');
                        result.push('promise.then(function(_result){ $patchChanges(node,function(){ ');
                        result.push('asyncFunc__' + context.asyncFuncSequence + '.call(self,_result)');
                        result.push('}); }).catch(function(err){ console.log(err); }); }else { ');
                        result.push('asyncFunc__' + context.asyncFuncSequence + '.call(self,promise)');
                        result.push('}})(' + incrementalDomNode + ');');
                        context.asyncFuncSequence -= 1;
                    }

                    if (condition.afterPatchContent) {
                        result.push('(function (event){ return ' + condition.afterPatchContent + ' })(' + incrementalDomNode + ');');
                    }

                    result.push('_elementClose("' + node.nodeName + '");');
                    if (condition.afterPatchElement) {
                        result.push('(function (event){ return ' + condition.afterPatchElement + ' })(' + incrementalDomNode + ');');
                    }
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
            var isRawText =  lengthableObjectToArray(node.parentNode.attributes).reduce(function(rawText,attribute){
                if(attribute.name == 'raw.text'){
                    return true;
                }
                return rawText;
            },false);

            if (isStyle) {
                var elementSelector = "[element='" + elementName.trim() + "'] ";
                var text = node.nodeValue.replace(/\r\n/g, '').replace(/\n/g,'').replace(/  /g, '').replace(/"/g,'\'');
                var cleanScript = text.match(/([^\n,{}]+)(,(?=[^}]*\{)|\s*\{)/g).reduce(function (script, match) {
                    return script.replace(match, '\\n' + elementSelector + match);
                }, text).replace("[element='" + elementName.trim() + "'] root", "[element='" + elementName.trim() + "']");
                result.push('_text("' + cleanScript + '");');
            } else if (isScript) {
                scriptTagContent.push(node.nodeValue);
            } else if (isRawText){
                result.push('_text("' + node.nodeValue.replace(/\r\n/g, '\\r\\n') + '");');
            }else {
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
        result.push('var _elementOpen = IncrementalDOM.elementOpen, _elementClose = IncrementalDOM.elementClose, ' +
            '_elementOpenStart = IncrementalDOM.elementOpenStart, _elementOpenEnd = IncrementalDOM.elementOpenEnd, ' +
            '_elementVoid = IncrementalDOM.elementVoid, _text = IncrementalDOM.text, _attr = IncrementalDOM.attr, _skip = IncrementalDOM.skip;');
        result.push('function initState(props){ return {} };');
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
    try{
        return beautify(encapsulateScript(convertHtmlToJavascript(file, originalUrl), originalUrl), {indent_size: 2});
    }catch(err){
        console.warn(err)
        return '';
    }

}

function compileJS(file, originalUrl) {
    try{
        return beautify(encapsulateScript(file, originalUrl), {indent_size: 2});
    }catch(err){
        console.warn(err);
        return '';
    }
}

var encapsulateScript = function (text, path) {
    var componentPath = path.substring(0, path.length - (YALLA_SUFFIX.length)).replace(/\\/g, '/');
    var result = [];

    result.push('yalla.framework.addComponent("' + componentPath + '",(function (){');
    result.push('var $path = "' + componentPath + '";');
    result.push('var $patchChanges = yalla.framework.renderToScreen;');
    result.push('var $export = {};');
    result.push('var $context = {};');
    result.push('var _parentComponent = yalla.framework.getParentComponent;');
    result.push('var $inject = yalla.framework.createInjector("' + componentPath + '");');
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
    result.push(fs.readFileSync(__dirname + '/' + PROMISE_JS, "utf-8"));
    result.push(fs.readFileSync(__dirname + '/' + IDOM_JS, "utf-8"));
    result.push(fs.readFileSync(__dirname + '/' + REDUX_JS, "utf-8"));
    result.push(fs.readFileSync(__dirname + '/' + CORE_JS, "utf-8"));
    return result.join('\n\n');
}
function runServer(sourceDir, port) {
    var app = express();
    app.use(function (req, res, next) {
        var url = req.originalUrl;
        var isRequestingYallaComponent = url.indexOf(sourceDir.substring(1, sourceDir.length)) >= 0;
        var isRequestingYallaLib = url.indexOf('yalla.js') >= 0;
        if (isRequestingYallaLib) {
            res.writeHead(200, {"Content-Type": "application/javascript"});
            res.write(buildYallaJs());
            res.end();
        } else if (isRequestingYallaComponent) {
            var path = url.substring(1, url.length - YALLA_SUFFIX.length);
            var pathJS = path + JS_SUFFIX;
            var pathHTML = path + HTML_SUFFIX;
            fs.readFile(pathJS, "utf-8", function (err, file) {
                if (err) {
                    return err;
                }
                console.log('PATH:' + pathJS);
                res.send(compileJS(file, url));
            });
            fs.readFile(pathHTML, "utf-8", function (err, file) {
                if (err) {
                    return err;
                }
                console.log('PATH:' + pathHTML);
                res.send(compileHTML(file, url));
            });
        } else {
            next();
        }
    });

    app.use(express.static('.'));
    app.listen(port, function () {
        console.log('\n\nYallaJS Running on port ' + port);
    });
}

function runCompiler(sourceDir, targetDir) {
    if(!fs.existsSync(sourceDir)){
        fs.mkdirSync(sourceDir);
    }
    if(!fs.existsSync(targetDir)){
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
        if(!validExtension){
            return false;
        }
        event = './' + event.replace('\\', '/');
        var targetFile = event.replace(sourceDir, targetDir).replace(HTML_SUFFIX, YALLA_SUFFIX).replace(JS_SUFFIX, YALLA_SUFFIX);
        ensureDirectoryExistence(targetFile);
        fs.readFile(event, 'utf8', function (err, data) {
            if (!err) {
                if (event.indexOf(".html") >= 0) {
                    fs.writeFile(targetFile, compileHTML(data, targetFile.substring(1, targetFile.length)));
                }
                if (event.indexOf(".js") >= 0) {
                    fs.writeFile(targetFile, compileJS(data, targetFile.substring(1, targetFile.length)));
                }
            }
        });
        return true;
    }

    chokidar.watch(sourceDir, {persistent: true})
        .on('add', function (event) {
            if(compileSource(event)){
                console.log('[+]', event);
            }
        })
        .on('change', function (event) {
            if(compileSource(event)){
                console.log('[#]', event);
            }
        })
        .on('unlink', function (event, path) {
            var validExtension = event.indexOf(HTML_SUFFIX) === (event.length - HTML_SUFFIX.length) || event.indexOf(JS_SUFFIX) === (event.length - JS_SUFFIX.length);
            if(!validExtension){
                return;
            }

            var cleanEvent = './' + event.replace('\\', '/');
            var targetFile = cleanEvent.replace(sourceDir, targetDir).replace(HTML_SUFFIX, YALLA_SUFFIX).replace(JS_SUFFIX, YALLA_SUFFIX);
            fs.unlink(targetFile,function(err){
                if(!err){
                    console.log('[-]',event);
                    setTimeout(function(){
                        if(fs.existsSync(event)){
                            if(compileSource(event)){
                                console.log('[+]', event);
                            }
                        }
                    },100);
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

if(help){
    var helpDoc = [];
    helpDoc.push('');
    helpDoc.push('  Usage : yalla [options]');
    helpDoc.push('');
    helpDoc.push('      -m compiler                              run yalla as compiler mode (watch source dir and generate result in dist dir) or as server ');
    helpDoc.push('      -m server                                run yalla as server mode (watch http request, pull code from source dir and return compiled code to client)');
    helpDoc.push('      -p 8080                                  port number when yalla run as server');
    helpDoc.push('      -s src                                   base directory for the source code');
    helpDoc.push('      -d dist                                  base directory for the compiled code');
    helpDoc.push('');
    helpDoc.push('  Example : ');
    helpDoc.push('');
    helpDoc.push('      yalla -p 9090                            run yalla server in port 9090 with source directory name "src"');
    helpDoc.push('      yalla -p 9090 -s source                  run yalla server in port 9090 with source directory name "source"');
    helpDoc.push('      yalla -m compiler                        run yalla compiler, watch changes in "src" directory and compile result to "dist" directory');
    helpDoc.push('      yalla -m compiler -s source -d output    run yalla compiler, watch changes in "source" directory and compile result to "output" directory');
    helpDoc.push('');
    console.log(helpDoc.join('\n'));
}else{
    if (!mode) {
        console.log('-m default set to "server"');
        mode = 'server';
    }
    if (mode === 'server' && !port) {
        console.log('-p default set to "8080"');
        port = '8080';
    }

    if (!sourceDir) {
        console.log('-s default set to "src"');
        sourceDir = 'src';
    }

    if (mode === 'compiler' && !targetDir) {
        console.log('-d default set to "dist"');
        targetDir = 'dist';
    }

    sourceDir = './' + sourceDir;
    targetDir = './' + targetDir;

    if (mode == 'server') {
        runServer(sourceDir, parseInt(port));
    } else {
        runCompiler(sourceDir, targetDir);
    }
}
