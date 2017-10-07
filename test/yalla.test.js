/**
 * Created by arif on 10/6/2017.
 */

"use strict";

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
            render(html`Hello ${html`World`} Yay !!`,dom);
            expect(dom).to.satisfy(function(dom){
                return dom.innerText == 'Hello World Yay !!';
            });
        });

        it('Should generate list of collections',function () {
            let dom = document.createElement('div');
            let items = [{name:'alpha'},{name:'beta'},{name:'charlie'},{name:'delta'}];
            let template = html`${htmlMap(items,'name',i => html`<li>${i.name}</li>`)}`;
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
                    ${htmlMap(items,'id',i => html`<label>${i.label} ${i.value}</label>`)}
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
                    ${htmlMap(items,'id',i => html`<label>${i.label} ${i.value}</label>`)}
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
            render(html`<button style="display: ${'block'};color: ${color}" onclick="${onclick}"></button>`,dom);
            expect(dom).to.satisfy(function (dom) {
                return dom.firstElementChild.onclick == onclick;
            });
        });

    });
});
