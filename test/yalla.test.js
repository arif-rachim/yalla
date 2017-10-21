/**
 * Created by arif on 10/6/2017.
 */

"use strict";

let SEPARATOR = PLACEHOLDER;
describe('yalla.js',function(){

    describe("Element compatibility checking ",function(){
        // singleton element
        ['area','base','br','col','embed','hr','img','input','keygen','link','meta','param','source','track','wbr'].forEach(function(tag){
            it(`Should render singleton ${tag}`,function () {
                let dom = document.createElement('div');
                let display = true;
                render(html(['<'+tag+'>']),dom);
                expect(dom.innerHTML).to.satisfy(function (innerHtml) {
                    return innerHtml == `<${tag}>${PLACEHOLDER}`;
                });
            });
        });
        // element with optional content
        ['a','abbr','acronym','address','article','aside','audio','b','bdi','bdo','big','blockquote','button',
            'canvas','caption','center','cite','code','colgroup','data','datalist','dd','del','details','dfn','dialog',
            'dir','dl','dt','em','fieldset','figcaption','figure','font','footer','form','h1','h2',
            'h3','h4','h5','h6','header','i','iframe','ins','kbd','legend','main',
            'map','mark','menu','menuitem','meter','nav','noframes','ol','optgroup','option','output','p','picture',
            'pre','progress','q','rp','rt','ruby','s','samp','section','select','small','span','strike','strong',
            'style','sub','summary','sup','table','tbody','td','textarea','tfoot','th','thead','time','tr','tt',
            'u','var','video'].forEach(function(tag){
            it(`Should render optional content ${tag}`,function () {
                let dom = document.createElement('div');
                let display = true;
                render(html(['<'+tag+'></'+tag+'>']),dom);
                expect(dom.innerHTML).to.satisfy(function (innerHtml) {
                    return innerHtml == `<${tag}></${tag}>${PLACEHOLDER}`;
                });
            });
        });
        // element with mandatory content
        ['div','label','li','ul'].forEach(function(tag){
            it(`Should render special tag ${tag}`,function () {
                let dom = document.createElement('div');
                let display = true;
                render(cache(tag).html(['<'+tag+'>content</'+tag+'>']),dom);
                expect(dom.innerHTML).to.satisfy(function (innerHtml) {
                    return innerHtml == `<${tag}>content</${tag}>${PLACEHOLDER}`;
                });
            });
        });

        it('should validate attribute minimization',function(){
            let dom = document.createElement('div');
            let checked = true;
            render(html`<input type="checkbox" checked=" ${checked} ">`,dom);
            expect(dom).to.satisfy(function (dom) {
                return dom.firstElementChild.checked == true;
            });
        });
    });

    describe("Text modification based on update",function(){
        it('Should bind event attribute',function(done){
            let label = 'Hello World';
            function updateLabel(){
                label = 'Hello Ardy';
            }
            let dom = document.createElement('div');
            render(html`<input type="button" onclick="${updateLabel}">${label}`,dom).then(function(){
                updateLabel();
                render(html`<input type="button" onclick="${updateLabel}">${label}`,dom);
                expect(dom.childNodes[1].nodeValue).to.equal(label);
                done();
            });
            expect(dom.childNodes[0]).to.satisfy(function(input){
                return input.onclick != null;
            });
            expect(dom.childNodes[1].nodeValue).to.equal(label);
        })
    });
    //
    describe("HtmlTemplateCollection features",function(){
        it('Should render collection',function(done){
            let items = ['One','Two','Three'];
            let dom = document.createElement('div');
            render(html`<ul>${htmlCollection(items,i=>i,i => html`<li>${i}</li>`)}</ul>`,dom);
            expect(dom.innerHTML).to.equal('<ul><li>One<!--placeholder--></li><!--placeholder--><li>Two<!--placeholder--></li><!--placeholder--><li>Three<!--placeholder--></li><!--placeholder--><!--placeholder--></ul><!--placeholder-->');
            done();
        })

        it('Should render collection Addition',function(done){
            let items = ['One','Two','Three'];
            let dom = document.createElement('div');
            function update(){
                return render(html`<ul>${htmlCollection(items,i=>i,i => html`<li>${i}</li>`)}</ul>`,dom);
            }
            function validateDom(){
                let expectedResult = items.map(i => `<li>${i}<!--placeholder--></li><!--placeholder-->`);
                expectedResult = ['<ul>',...expectedResult,'<!--placeholder--></ul><!--placeholder-->'];
                expect(dom.innerHTML).to.equal(expectedResult.join(''));
            }
            update().then(function(){
                items.push('four');
                update();
                validateDom();
                done();
            });
            validateDom();
        })

        it('Should render collection removal',function(done){
            let items = ['One','Two','Three'];
            let dom = document.createElement('div');
            function update(){
                return render(html`<ul>${htmlCollection(items,i=>i,i => html`<li>${i}</li>`)}</ul>`,dom);
            }
            function validateDom(){
                let expectedResult = items.map(i => `<li>${i}<!--placeholder--></li><!--placeholder-->`);
                expectedResult = ['<ul>',...expectedResult,'<!--placeholder--></ul><!--placeholder-->'];
                expect(dom.innerHTML).to.equal(expectedResult.join(''));
            }

            update().then(function(){
                items.splice(0,1);
                update().then(function () {
                    validateDom();
                    done();
                });
            });
            validateDom();
        })

        it('Should handle swap element',function(done){
            let items = ['One','Two','Three'];
            let dom = document.createElement('div');
            function update(){
                return render(html`<ul>${htmlCollection(items,i=>i,i => html`<li>${i}</li>`)}</ul>`,dom);
            }
            function validateDom(){
                let expectedResult = items.map(i => `<li>${i}<!--placeholder--></li><!--placeholder-->`);
                expectedResult = ['<ul>',...expectedResult,'<!--placeholder--></ul><!--placeholder-->'];
                expect(dom.innerHTML).to.equal(expectedResult.join(''));
            }

            update().then(function(){
                let tmp = items[1];
                items[1] = items[0];
                items[0] = tmp;
                update().then(function () {
                    validateDom();
                    done();
                });
            });
            validateDom();
        })

    });

    describe("HtmlTemplate features",function(){

    });
});
