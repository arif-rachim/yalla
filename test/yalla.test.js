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

        it('Should render collection in collection',function(done){
            let items = ['One','Two','Three'];
            let itemsTwo = ['Four','Five','Six'];
            let dom = document.createElement('div');
            render(html`<ul>${htmlCollection(items,i=>i,i => {
                return htmlCollection(itemsTwo,i=>i,i=> html`<li>${i}</li>`)
            })}</ul>`,dom);

            function validateDom(){
                let expectedResult = items.map(i => {
                    let result = itemsTwo.map(i => `<li>${i}<!--placeholder--></li><!--placeholder-->`);
                    result.push('<!--placeholder-->');
                    return result
                }).reduce((a,b) => {
                    return a.concat(b);
                });
                expectedResult = ['<ul>',...expectedResult,'<!--placeholder--></ul><!--placeholder-->'];
                expect(dom.innerHTML).to.equal(expectedResult.join(''));
            }
            validateDom();
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
        it('Should render HtmlTemplate',function(done){
            let dom = document.createElement('div');
            render(html`Hello World`,dom);
            expect(dom.innerHTML).to.equal('Hello World<!--placeholder-->');
            done();
        });

        it('Should render Component in component',function(done){
            let dom = document.createElement('div');
            render(html`<div>Hello ${html`Yalla`} World</div>`,dom).then(function(){
                render(html`Hello ${html`Amazing`} World`,dom);
                expect(dom.innerHTML).to.equal('<div>Hello Amazing<!--placeholder--> World</div><!--placeholder-->');
                done();
            });
            expect(dom.innerHTML).to.equal('<div>Hello Yalla<!--placeholder--> World</div><!--placeholder-->');
        });

        it('Should Promote the component and depromote them',function(done){
            let dom = document.createElement('div');
            render(html`<div>Hello ${html`Yalla`} World</div>`,dom).then(function(){
                render(html`Hello World`,dom).then(function(){
                    render(html`<div>Hello ${true} World</div>`,dom);
                    expect(dom.innerHTML).to.equal('<div>Hello true<!--placeholder--> World</div><!--placeholder-->');
                    done();
                });
                expect(dom.innerHTML).to.equal('<div>Hello <!--placeholder--> World</div><!--placeholder-->');
            });
            expect(dom.innerHTML).to.equal('<div>Hello Yalla<!--placeholder--> World</div><!--placeholder-->');
        });

        it('Should render an array',function(done){
            let dom = document.createElement('div');
            let items = ["one","two","three"];
            render(html`<div>Hello ${items} World</div>`,dom).then(function(){
                done();
            });
            expect(dom.innerHTML).to.equal('<div>Hello one,two,three<!--placeholder--> World</div><!--placeholder-->');
        });
    });

    describe("Element Attribute",function(){
        it('Should render attribute modification',function(done){
            let dom = document.createElement('div');
            let color = 'red';
            let textAlign = 'center';
            let backgroundColor = 'blue';
            function validateDom(){
                expect(dom.innerHTML).to.equal(`<div style="color: ${color}; text-align: ${textAlign}; background-color: ${backgroundColor}">Hello World</div><!--placeholder-->`);
            }
            function renderDom(){
                return render(html`<div style="color: ${color}; text-align: ${textAlign}; background-color: ${backgroundColor}">Hello World</div>`,dom)
            }
            renderDom().then(function(){
                color = 'black';
                textAlign = 'left';
                backgroundColor = 'yellow';
                renderDom();
                validateDom();
                done();
            });
            validateDom();
        });

    });

    describe('Todo Application',function(){

        let dom = document.createElement('div');
        document.getElementsByTagName('body')[0].appendChild(dom);

        let todos = [
            {id:Math.round(Math.random()*1000000),todo : 'Todo app testing sample data one',done : false},
            {id:Math.round(Math.random()*1000000),todo : 'Todo app testing sample data two',done : true},
            {id:Math.round(Math.random()*1000000),todo : 'Todo app testing sample data three',done : false},
        ];

        function toggleDone(e){
            let index = Math.round(Math.random() * (todos.length - 1));
            let id = todos[index].id;
            console.log(id);
            let styleBefore = document.getElementById(id).getAttribute('style').toString();
            let selectedTodo = todos.filter(t => t.id == id)[0];
            console.log('done before ',selectedTodo.done);
            selectedTodo.done = !selectedTodo.done;
            console.log('done after ',selectedTodo.done);
            return update();
        }

        function deleteTodo(e){
            let indexId = Math.round(Math.random() * (todos.length - 1));
            let id = todos[indexId].id;
            let selectedTodo = todos.filter(t => t.id == id)[0];
            let index = todos.indexOf(selectedTodo);
            todos.splice(index,1);
            return update();
        }

        function addTodo(e){
            todos.push({id:Math.round(Math.random()*1000000),todo : Math.round(Math.random()*1000000) ,done : false});
            update();
            return false;
        }

        let app = () => html`<div>
                <form onsubmit="${addTodo}">
                    <input type="text" name="todo" value="" />
                    <input type="submit" value="Save" />
                </form>
                <ul>
                    ${htmlCollection(todos,'id',(todo,index)=>{
            return html`<li id="${todo.id}" style="text-decoration: ${todo.done ? 'line-through' : ''}">
                            <button onclick="${toggleDone}" data-id="${todo.id}">Done</button>
                            ${todo.todo}<button onclick="${deleteTodo}" data-id="${todo.id}">Delete</button>
                            </li>`
        })}
                </ul>
            </div>`;

        function update(){
            return render(app(),dom);
        }
        update();
        toggleDone().then(function(){
            deleteTodo().then(function () {
                addTodo();
            });
        });
    });
});
