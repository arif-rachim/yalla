/**
 * Created by arif on 10/6/2017.
 */

"use strict";
let SEPARATOR = PLACEHOLDER;
describe('yalla',function(){
    describe('html',function () {

        it('Should generate HtmlTemplate',function () {
            expect(html`Hello World`).to.satisfy(function(template){
                return template instanceof HtmlTemplate
            });
        });
        it('Should generate Button',function () {
            let dom = document.createElement('div');
            render(html`<button></button>`,dom);
            expect(dom).to.satisfy(function (dom) {
                return dom.firstElementChild.tagName == 'BUTTON'
            });
        });
        it('Should generate input type text',function () {
            let dom = document.createElement('div');
            render(html`<input type="text">`,dom);
            expect(dom).to.satisfy(function (dom) {
                return dom.firstElementChild.tagName == 'INPUT'
            });
            expect(dom).to.satisfy(function (dom) {
                return dom.firstElementChild.getAttribute('type') == 'text'
            });
        });
        it('Should generate dynamic',function () {
            let dom = document.createElement('div');
            render(html`<input type="${'text'}">`,dom);
            expect(dom).to.satisfy(function (dom) {
                return dom.firstElementChild.tagName == 'INPUT'
            });
            expect(dom).to.satisfy(function (dom) {
                return dom.firstElementChild.getAttribute('type') == 'text'
            });
        });

        it('Should generate javascript operation',function () {
            let dom = document.createElement('div');
            let toDisplayText = true;
            render(html`<input type="${toDisplayText ? 'text' : ''}">`,dom);
            expect(dom).to.satisfy(function (dom) {
                return dom.firstElementChild.tagName == 'INPUT'
            });
            expect(dom).to.satisfy(function (dom) {
                return dom.firstElementChild.getAttribute('type') == 'text'
            });
        });

        it('Should generate Component in Component',function () {
            let dom = document.createElement('dom');
            render(html`<label>Hello ${html`<label>World</label>`} Yay !!</label>`,dom);
            expect(dom).to.satisfy(function(dom){
                return dom.innerText == 'Hello World Yay !!';
            });
        });

        it('Should generate Component and replace with non Component',function () {
            let dom = document.createElement('dom');
            let toggleComponent = true;
            render(html`Hello ${toggleComponent ? html`World` : 'World'} Yay !!`,dom);
            expect(dom).to.satisfy(function(dom){
                return dom.innerText == 'Hello World Yay !!';
            });
            toggleComponent = false;
            render(html`Hello ${toggleComponent ? html`World` : 'World'} Yay !!`,dom);
            expect(dom).to.satisfy(function(dom){
                return dom.innerText == 'Hello World Yay !!';
            });
            toggleComponent = true;
            render(html`Hello ${toggleComponent ? html`World` : 'World'} Yay !!`,dom);
            expect(dom).to.satisfy(function(dom){
                return dom.innerText == 'Hello World Yay !!';
            });
        });



        it('Should generate list of collections',function () {
            let dom = document.createElement('div');
            let items = [{name:'alpha'},{name:'beta'},{name:'charlie'},{name:'delta'}];
            let template = html`${htmlCollection(items,'name', i => html`<li>${i.name}</li>`)}`;
            render(template,dom);
            expect(dom).to.satisfy(function (dom) {
                return dom.childElementCount == items.length;
            });
            expect(dom).to.satisfy(function (dom) {
                return dom.firstElementChild.tagName == 'LI'
            });
        });

        it('Should perform updates',function () {
            let dom = document.createElement('div');
            let state = {
                value : 'ValueOne'
            };
            render(html`<label>${state.value}</label>`,dom);
            expect(dom).to.satisfy(function (dom) {
                return dom.firstElementChild.textContent == state.value;
            });
            state.value = 'ValueTwo';
            render(html`<label>${state.value}</label>`,dom);
            expect(dom).to.satisfy(function (dom) {
                return dom.firstElementChild.textContent == state.value;
            });
        });

        it('Should perform addition on collections',function () {
            let dom = document.createElement('div');
            let items = [];


            function update(){
                render(html`
                    ${htmlCollection(items,'id', i => html`<label>${i.label} ${i.value}</label>`)}
                `,dom);
            }

            for(let i = 0;i < 10;i++){
                items.push({id : i,label:`LABEL-${i}`,value:`VALUE-${i}`});
                update();
                expect(dom).to.satisfy(function (dom) {
                    return dom.childElementCount == i+1;
                });
            }
        });

        it('Should perform deletion on collections',function () {
            let dom = document.createElement('div');
            let items = [];


            function update(){
                render(html`
                    ${htmlCollection(items,'id', i => html`<label>${i.label} ${i.value}</label>`)}
                `,dom);
            }

            for(let i = 0;i < 10;i++){
                items.push({id : i,label:`LABEL-${i}`,value:`VALUE-${i}`});
                update();
                expect(dom).to.satisfy(function (dom) {
                    return dom.childElementCount == i+1;
                });
            }

            for(let i = 0;i < 10;i++){
                items.splice(0,1);
                update();
                expect(dom).to.satisfy(function (dom) {
                    return dom.childElementCount == (9-i);
                });
            }
        });

        // perform update and remove update
        it('Should promote component from text to html',function(){
            let dom = document.createElement('div');
            let state = {
                displayHtml : false
            };
            let update = () => {
                render(html`<div>${state.displayHtml ? html`<div>Hello World</div>` : ''}</div>`,dom);
            }
            update();
            expect(dom).to.satisfy(function (dom) {
                return dom.innerText == '';
            });
            state.displayHtml=true;
            update();
            expect(dom).to.satisfy(function (dom) {
                return dom.innerText == `Hello World`;
            });
            state.displayHtml=false;

            update();
            expect(dom).to.satisfy(function (dom) {
                return dom.innerText == ``;
            });

            state.displayHtml=true;
            update();
            expect(dom).to.satisfy(function (dom) {
                return dom.innerText == `Hello World`;
            });
        });

        it('should bind with attribute whitespace',function(){
            let dom = document.createElement('div');
            let color = 'blue';

            render(html`<div style="display: ${'block'};color: ${color}"></div>`,dom);
            expect(dom).to.satisfy(function (dom) {
                return dom.firstElementChild.style.color == 'blue';
            });
        });

        it('should bind to event listener',function(){
            let dom = document.createElement('div');
            let color = 'blue';
            let onclick = function(){
                alert('Hello World');
            };
            // render(html`<button style="display: ${'block'};color: ${color}" onclick="${onclick}"></button>`,dom);
            // expect(dom).to.satisfy(function (dom) {
            //     return dom.innerHTML ==  ;
            // });
        });

        it('should validate attribute minimization',function(){
            let dom = document.createElement('div');
            let checked = true;
            render(html`<input type="checkbox" checked=" ${checked} ">`,dom);
            expect(dom).to.satisfy(function (dom) {
                return dom.firstElementChild.checked == true;
            });

            checked = false;
            render(html`<input type="checkbox" checked=" ${checked} ">`,dom);
            expect(dom).to.satisfy(function (dom) {
                return dom.firstElementChild.checked == false;
            });
        });

        it('should validate swapped collections',function(){
            let dom = document.createElement('div');
            let items = [
                {key:'one',label:'one',value:'one'},
                {key:'two',label:'two',value:'two'},
                {key:'three',label:'three',value:'three'},
            ];
            function update(){
                render(html`<ul>
                ${htmlCollection(items, i => i.key, (item, index) => html`
                    <li>${item.label}</li>
                `)}
            </ul>`,dom);
            }
            update();
            let tags = dom.getElementsByTagName('li');

            items.forEach((item,index) => {
                expect(item).to.satisfy(function (item) {
                    return tags[index].innerText == item.label;
                });
            });
            let t = items[1];
            items[1] = items[0];
            items[0] = t;
            update();

            tags = dom.getElementsByTagName('li');
            items.forEach((item,index) => {
                expect(item).to.satisfy(function (item) {
                    return tags[index].innerText == item.label;
                });
            });
        });

        it('should validate swapped content inside',function(){
            let dom = document.createElement('div');
            let items = [
                {key:'one',label:'one',value:'one',hasInputField:false},
                {key:'two',label:'two',value:'two',hasInputField:true},
                {key:'three',label:'three',value:'three',hasInputField:false},
            ];
            function update(){
                render(html`<ul>
                ${htmlCollection(items, i => i.key, (item, index) => html`
                    <li>${item.label}${item.hasInputField ? html`<input type='text'>` : ''}</li>
                `)}
            </ul>`,dom);
            }
            update();
            let tags = dom.getElementsByTagName('li');

            expect(tags[0]).to.satisfy(function (tag) {
                return tag.getElementsByTagName('input').length == 0;
            });
            expect(tags[1]).to.satisfy(function (tag) {
                return tag.getElementsByTagName('input').length == 0;
            });
            let t = items[1];
            items[1] = items[0];
            items[0] = t;
            update();
            tags = dom.getElementsByTagName('li');
            expect(tags[0]).to.satisfy(function (tag) {
                return tag.getElementsByTagName('input').length == 0;
            });
            expect(tags[1]).to.satisfy(function (tag) {
                return tag.getElementsByTagName('input').length == 0;
            });
        });

        it('should validate swapped content inside and removed',function(){
            let dom = document.createElement('div');
            let items = [
                {key:'one',label:'one',value:'one',hasInputField:false},
                {key:'two',label:'two',value:'two',hasInputField:true},
                {key:'three',label:'three',value:'three',hasInputField:false},
            ];
            function update(){
                render(html`<ul>${htmlCollection(items, i => i.key, (item, index) => {return item.hasInputField ? html`<li>${item.hasInputField ? html`<input type='text'>` : ''}</li>`:'Hello Yalla!';})}</ul>`,dom);
            }
            update();
            expect(dom.innerHTML.replace(/\s/g, '')).to.satisfy(function (innerHTML) {
                return innerHTML ==  `<ul>Hello Yalla!${PLACEHOLDER}<li><input type="text">${PLACEHOLDER}</li>${PLACEHOLDER}Hello Yalla!${PLACEHOLDER}${PLACEHOLDER}</ul>${PLACEHOLDER}`.replace(/\s/g, '');
            });
            let t = items[1];
            items[1] = items[0];
            items[0] = t;
            update();
            expect(dom.innerHTML.replace(/\s/g, '')).to.satisfy(function (innerHtml) {
                return innerHtml == `<ul><li><input type="text">${PLACEHOLDER}</li>${PLACEHOLDER}Hello Yalla!${PLACEHOLDER}Hello Yalla!${PLACEHOLDER}${PLACEHOLDER}</ul>${PLACEHOLDER}`.replace(/\s/g, '');
            });
        });

        it('should validate swapped content inside and replace with string',function(){
            let dom = document.createElement('div');
            let items = [
                {key:'one',label:'one',value:'one',hasInputField:false},
                {key:'two',label:'two',value:'two',hasInputField:true},
                {key:'three',label:'three',value:'three',hasInputField:false},
            ];
            function update(){
                render(html`<ul>${htmlCollection(items, i => i.key, (item, index) => {return html`<li>${item.hasInputField ? html`<input type='text'>` : 'Hello Yalla!'}</li>`})}<ul>`,dom);
            }
            update();
            expect(dom.innerHTML).to.satisfy(function (innerHtml) {
                return innerHtml == `<ul><li>Hello Yalla!${PLACEHOLDER}</li>${PLACEHOLDER}<li><input type="text">${PLACEHOLDER}</li>${PLACEHOLDER}<li>Hello Yalla!${PLACEHOLDER}</li>${PLACEHOLDER}${PLACEHOLDER}<ul></ul></ul>${PLACEHOLDER}`;
            });
            let t = items[1];
            items[1] = items[0];
            items[0] = t;
            update();
            expect(dom.innerHTML).to.satisfy(function (innerHtml) {
                return innerHtml == `<ul><li><input type="text">${PLACEHOLDER}</li>${PLACEHOLDER}<li>Hello Yalla!${PLACEHOLDER}</li>${PLACEHOLDER}<li>Hello Yalla!${PLACEHOLDER}</li>${PLACEHOLDER}${PLACEHOLDER}<ul></ul></ul>${PLACEHOLDER}`;
            });
        });

        it('Should render array',function () {
            let dom = document.createElement('dom');
            let items = [{label:'one'},{label:'two'},{label:'three'}];
            render(html`${htmlCollection(items,'label', i => html`${i.label}`) }`,dom);
            expect(dom.innerHTML).to.satisfy(function (innerHtml) {
                return innerHtml == `one${PLACEHOLDER}${PLACEHOLDER}two${PLACEHOLDER}${PLACEHOLDER}three${PLACEHOLDER}${PLACEHOLDER}${PLACEHOLDER}${PLACEHOLDER}`;
            });


            items = [{label:'four'},{label:'five'},{label:'six'}];
            //render(html`${items.map(i => `${i.label}`)}`,dom);
            render(html`${htmlCollection(items,'label', i =>html`${i.label}`) }`,dom);
            expect(dom.innerHTML).to.satisfy(function (innerHtml) {
                return innerHtml == `four${PLACEHOLDER}${PLACEHOLDER}five${PLACEHOLDER}${PLACEHOLDER}six${PLACEHOLDER}${PLACEHOLDER}${PLACEHOLDER}${PLACEHOLDER}`;
            });
        });

        // i think we have bug here !!
        it('Should render array two',function () {
            let dom = document.createElement('dom');
            let items = [{label:'one'},{label:'two'},{label:'three'}];
            render(html`${htmlCollection(items,'label', i => html`${i.label}`) }`,dom);
            expect(dom.innerHTML).to.satisfy(function (innerHtml) {
                return innerHtml == `one${PLACEHOLDER}${PLACEHOLDER}two${PLACEHOLDER}${PLACEHOLDER}three${PLACEHOLDER}${PLACEHOLDER}${PLACEHOLDER}${PLACEHOLDER}`;
            });
            // items = [{label:'three'},{label:'two'},{label:'one'}];
            // render(html`${htmlCollection(items,'label',i =>html`${i.label}`) }`,dom);
        });

        it('Should be able to render td',function () {
            let dom = document.createElement('dom');
            let display = true;
            render(html`<td>Hello World</td>`,dom);
            expect(dom.innerHTML).to.satisfy(function (innerHtml) {
                return innerHtml == `<td>Hello World</td>${PLACEHOLDER}`;
            });
        });

        it('Should be able have onclick',function () {
            let dom = document.createElement('dom');
            let display = true;
            function clickme(e){

            }
            render(html`<button onclick="${clickme}"></button>`,dom);
            expect(dom.innerHTML).to.satisfy(function (innerHtml) {
                return innerHtml == `<button onclick="false"></button>${PLACEHOLDER}`;
            });
        });

        // singleton element
        ['area','base','br','col','embed','hr','img','input','keygen','link','meta','param','source','track','wbr'].forEach(function(tag){
            it(`Should be able to render singleton ${tag}`,function () {
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
            it(`Should be able to render ${tag}`,function () {
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
            it(`Should be able to render ${tag}`,function () {
                let dom = document.createElement('div');
                let display = true;
                render(cache(tag).html(['<'+tag+'>content</'+tag+'>']),dom);
                expect(dom.innerHTML).to.satisfy(function (innerHtml) {
                    return innerHtml == `<${tag}>content</${tag}>${PLACEHOLDER}`;
                });
            });
        });



    });
});
