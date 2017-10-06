/**
 * Created by arif on 10/6/2017.
 */
var expect = require('chai').expect;
var yalla = require('./../src/yalla');
var HtmlTemplate = yalla.HtmlTemplate;
var HtmlTemplateCollections = yalla.HtmlTemplateCollections;
var render = yalla.render;
var html = yalla.html;
var htmlMap = yalla.htmlMap;

describe('yalla',function(){
    describe('html',function () {
        it('Should generate HtmlTemplate',function () {
            expect(html`Hello World`).to.satisfy(function(template){
                return template instanceof HtmlTemplate
            });
        })

    });

});