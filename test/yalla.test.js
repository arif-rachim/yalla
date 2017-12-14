/**
 * Created by arif on 11/6/2017.
 */

"use strict";

let OUTLET = '<!--outlet-->';


let {html,htmlCollection} = new Context();

describe('yalla.js',function(){

    describe("Element compatibility checking ",function(){
        // singleton element
        ['area','base','br','col','embed','hr','img','input','keygen','link','meta','param','source','track','wbr'].forEach(function(tag){
            it(`Should render singleton ${tag}`,function (done) {
                let dom = document.createElement('div');
                let display = true;
                render(html(['<'+tag+'>']),dom).then(function(){
                    expect(dom.innerHTML).to.satisfy(function (innerHtml) {
                        return innerHtml == `<${tag}>${OUTLET}`;
                    });
                    done();
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
            it(`Should render optional content ${tag}`,function (done) {
                let dom = document.createElement('div');
                let display = true;
                render(html(['<'+tag+'></'+tag+'>']),dom).then(function(){
                    expect(dom.innerHTML).to.satisfy(function (innerHtml) {
                        return innerHtml == `<${tag}></${tag}>${OUTLET}`;
                    });
                    done();
                });
            });
        });
        // element with mandatory content
        ['div','label','li','ul'].forEach(function(tag){
            it(`Should render special tag ${tag}`,function (done) {
                let dom = document.createElement('div');
                let display = true;
                render(html(['<'+tag+'>content</'+tag+'>']),dom).then(function(){
                    expect(dom.innerHTML).to.satisfy(function (innerHtml) {
                        return innerHtml == `<${tag}>content</${tag}>${OUTLET}`;
                    });
                    done();
                });

            });
        });

        it('should validate attribute minimization',function(done){
            let dom = document.createElement('div');
            let checked = true;
            render(html`<input type="checkbox" checked=" ${checked} ">`,dom).then(function(){
                expect(dom).to.satisfy(function (dom) {
                    return dom.firstElementChild.checked == true;
                });
                done();
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
                return render(html`<input type="button" onclick="${updateLabel}">${label}`,dom)
            }).then(function(){
                expect(dom.childNodes[1].nodeValue).to.equal(label);
                done();
            })

        })
    });
    //
    describe("HtmlTemplateCollection features",function(){
        it('Should render collection',function(done){
            let items = ['One','Two','Three'];
            let dom = document.createElement('div');
            render(html`<ul>${htmlCollection(items,i=>i,i => html`<li>${i}</li>`)}</ul>`,dom).then(function(){
                expect(dom.innerHTML).to.equal('<ul><li>One<!--outlet--></li><!--outlet-child--><li>Two<!--outlet--></li><!--outlet-child--><li>Three<!--outlet--></li><!--outlet-child--><!--outlet--></ul><!--outlet-->');
                done();
            });
        });

        it('Should render collection Addition',function(done){
            let items = ['One','Two','Three'];
            let dom = document.createElement('div');
            function update(){
                return render(html`<ul>${htmlCollection(items,i=>i,i => html`<li>${i}</li>`)}</ul>`,dom);
            }
            function validateDom(){
                let expectedResult = items.map(i => `<li>${i}<!--outlet--></li><!--outlet-child-->`);
                expectedResult = ['<ul>',...expectedResult,'<!--outlet--></ul><!--outlet-->'];
                expect(dom.innerHTML).to.equal(expectedResult.join(''));

            }
            update().then(function(){
                items.push('four');
                return update();
            }).then(function(){
                validateDom();
                done();
            });
        });

        it('Should render collection removal',function(done){
            let items = ['One','Two','Three'];
            let dom = document.createElement('div');
            function update(){
                return render(html`<ul>${htmlCollection(items,i=>i,i => html`<li>${i}</li>`)}</ul>`,dom);
            }
            function validateDom(){
                let expectedResult = items.map(i => `<li>${i}<!--outlet--></li><!--outlet-child-->`);
                expectedResult = ['<ul>',...expectedResult,'<!--outlet--></ul><!--outlet-->'];
                expect(dom.innerHTML).to.equal(expectedResult.join(''));
            }

            update().then(function(){
                validateDom();
            }).then(function(){
                items.splice(0,1);
                return update();
            }).then(function () {
                validateDom();
                done();
            });

        });

        it('Should handle swap element',function(done){
            let items = ['One','Two','Three'];
            let dom = document.createElement('div');
            function update(){
                return render(html`<ul>${htmlCollection(items,i=>i,i => html`<li>${i}</li>`)}</ul>`,dom);
            }
            function validateDom(){
                let expectedResult = items.map(i => `<li>${i}<!--outlet--></li><!--outlet-child-->`);
                expectedResult = ['<ul>',...expectedResult,'<!--outlet--></ul><!--outlet-->'];
                expect(dom.innerHTML).to.equal(expectedResult.join(''));
            }

            update().then(()=> validateDom()).then(function(){
                let tmp = items[1];
                items[1] = items[0];
                items[0] = tmp;
                return update()
            }).then(function () {
                validateDom();
                done();
            });

        });

        it('Should render promotion and depromotion',function(done){
            let items = ['One','Two','Three'];
            let dom = document.createElement('div');
            render(html`<ul>${htmlCollection(items,i=>i,i => html`<li>${i}</li>`)}</ul>`,dom).then(function(){
                expect(dom.innerHTML).to.equal('<ul><li>One<!--outlet--></li><!--outlet-child--><li>Two<!--outlet--></li><!--outlet-child--><li>Three<!--outlet--></li><!--outlet-child--><!--outlet--></ul><!--outlet-->');
                return render(html`<ul>${''}</ul>`,dom);
            }).then(function(){
                expect(dom.innerHTML).to.equal('<ul><!--outlet--></ul><!--outlet-->');
                return render(html`<ul>${htmlCollection(items,i=>i,i => html`<li>${i}</li>`)}</ul>`,dom);
            }).then(function(){
                expect(dom.innerHTML).to.equal('<ul><li>One<!--outlet--></li><!--outlet-child--><li>Two<!--outlet--></li><!--outlet-child--><li>Three<!--outlet--></li><!--outlet-child--><!--outlet--></ul><!--outlet-->');
                done();
            });
        })

    });

    describe("HtmlTemplate features",function(){
        it('Should render HtmlTemplate',function(done){
            let dom = document.createElement('div');
            render(html`Hello World`,dom).then(()=>{
                expect(dom.innerHTML).to.equal('Hello World<!--outlet-->');
                done();
            });
        });

        it('Should render Component in component',function(done){
            let dom = document.createElement('div');
            render(html`<div>Hello ${html`Yalla`} World</div>`,dom).then(function(){
                expect(dom.innerHTML).to.equal('<div>Hello Yalla<!--outlet--> World</div><!--outlet-->');
                return render(html`Hello ${html`Amazing`} World`,dom)
            }).then(function(){
                expect(dom.innerHTML).to.equal('<div>Hello Amazing<!--outlet--> World<!--outlet-->');
                done();
            }).catch(function(err){
                done();
            })

        });

        it('Should Promote the component and depromote them',function(done){
            let dom = document.createElement('div');
            render(html`<div>Hello ${html`Yalla`} World</div>`,dom).then(function(){
                expect(dom.innerHTML).to.equal('<div>Hello Yalla<!--outlet--> World</div><!--outlet-->');
                return render(html`Hello World`,dom)
            }).then(function(){
                expect(dom.innerHTML).to.equal('Hello World<!--outlet-->');
                return render(html`<div>Hello ${true} World</div>`,dom);
            }).then(() => {
                expect(dom.innerHTML).to.equal('<div>Hello true<!--outlet--> World</div><!--outlet-->');
                done();
            }).catch(function(err){
                console.error(err);
                done();
            })

        });


        it('Should render an array',function(done){
            let dom = document.createElement('div');
            let items = ["one","two","three"];
            render(html`<div>Hello ${items} World</div>`,dom).then(function(){
                expect(dom.innerHTML).to.equal('<div>Hello one,two,three<!--outlet--> World</div><!--outlet-->');
                done();
            });
        });

        it('should render duplicate node',function(done){
            let dom = document.createElement('div');
            render(html`<div>${html`<button style="font-size: ${'13px'};background-color: ${'red'}" onclick="${e => alert('one')}">${'buttonone'}</button>`}${html`<button style="font-size: ${'10px'};background-color: ${'blue'}" onclick="${e => alert('two')}">${'buttontwo'}</button>`}</div>`,dom).then(function(){
                expect(dom.innerHTML).to.equal('<div><button style="font-size: 13px;background-color: red" onclick="return false;">buttonone<!--outlet--></button><!--outlet--><button style="font-size: 10px;background-color: blue" onclick="return false;">buttontwo<!--outlet--></button><!--outlet--></div><!--outlet-->');
                done();
            });
        });

        it('should render duplicate node',function(done){
            let dom = document.createElement('div');
            render(html`<div>${html`<button onclick="${e => alert('one')}">${'buttonone'}</button>`}${html`<button onclick="${e => alert('two')}">${'buttontwo'}</button>`}</div>`,dom).then(function(){
                expect(dom.innerHTML).to.equal('<div><button onclick="return false;">buttonone<!--outlet--></button><!--outlet--><button onclick="return false;">buttontwo<!--outlet--></button><!--outlet--></div><!--outlet-->');
                done();
            });
        });
    });

    describe("Element Attribute",function(){
        it('Should render attribute modification',function(done){
            let dom = document.createElement('div');
            let color = 'red';
            let textAlign = 'center';
            let backgroundColor = 'blue';
            function validateDom(){
                expect(dom.innerHTML).to.equal(`<div style="color: ${color}; text-align: ${textAlign}; background-color: ${backgroundColor}">Hello World</div><!--outlet-->`);
            }
            function renderDom(){
                return render(html`<div style="color: ${color}; text-align: ${textAlign}; background-color: ${backgroundColor}">Hello World</div>`,dom)
            }
            renderDom().then(function(){
                validateDom();
                color = 'black';
                textAlign = 'left';
                backgroundColor = 'yellow';
                return renderDom();

            }).then(()=>{
                validateDom();
                done();
            });

        });

    });

    describe("Styling",function(){
        it('Should render styling properly',function(done){
            let dom = document.createElement('div');
            let backgroundColor = 'blue';
            let color = 'red';
            let update = () => {
                return render(html`<style>.my-style{background-color:${backgroundColor};color:${color};}</style><div class="my-style"></div>`,dom);
            };
            update().then(()=> expect(dom.innerHTML).to.equal('<style>.my-style{background-color:blue;color:red;}</style><div class="my-style"></div><!--outlet-->')).then(()=>{
                backgroundColor = '#CCC';
                color = '#ddd';
                return update();
            }).then(()=>{
                expect(dom.innerHTML).to.equal('<style>.my-style{background-color:#CCC;color:#ddd;}</style><div class="my-style"></div><!--outlet-->');
                done();
            });

        });
    });

    describe('Todo Application',function(){
        let dom = document.createElement('div');
        document.getElementsByTagName('body')[0].appendChild(dom);

        let todos = [
            {id:uuidv4(),todo : 'Todo app testing sample data one',done : false},
            {id:uuidv4(),todo : 'Todo app testing sample data two',done : true},
            {id:uuidv4(),todo : 'Todo app testing sample data three',done : false},
        ];

        function toggleDone(e){
            let index = Math.round(Math.random() * (todos.length - 1));
            let id = todos[index].id;
            let selectedTodo = todos.filter(t => t.id == id)[0];
            selectedTodo.done = !selectedTodo.done;
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


    describe("Promise and async",function(){

        it('Should render html in async',function(done){
            let {html,htmlCollection} = new Context();
            let dom = document.createElement('div');
            render(html`<div> ${new Promise(function (resolve){resolve(html`Hello World`)})} </div>`,dom).then(function(){
                expect(dom.innerHTML).to.equal(`<div> Hello World<!--outlet--> </div><!--outlet-->`);
                done();
            });
        });

        it('Should render text in async',function(done){
            let {html,htmlCollection} = new Context();
            let dom = document.createElement('div');
            render(html`<div> ${new Promise(function (resolve){resolve(`Hello World`)})} </div>`,dom).then(function(){
                expect(dom.innerHTML).to.equal(`<div> Hello World<!--outlet--> </div><!--outlet-->`);
                done();
            });
        });

        it('Should render text in async',function(done){
            let {html,htmlCollection} = new Context();
            let dom = document.createElement('div');
            render(html`<div> ${new Promise(function (resolve){resolve(html`<div>Hello World</div>`)})} </div>`,dom).then(function(){
                expect(dom.innerHTML).to.equal(`<div> <div>Hello World</div><!--outlet--> </div><!--outlet-->`);
                done();
            });
        });

        it('Should render collection in async',function(done){
            let {html,htmlCollection} = new Context();
            let dom = document.createElement('div');
            const asyncList = () =>{
                return htmlCollection([{id:uuidv4(),label:'One'},{id:uuidv4(),label:'Two'},{id:uuidv4(),label:'Three'}],'id',data => {
                    return new Promise(resolve => {
                        resolve(html`<li>${data.label}</li>`)
                    });
                })
            }
            render(html`<ul> ${asyncList()} </ul>`,dom).then(function(){
                expect(dom.innerHTML).to.equal(`<ul> <li>One<!--outlet--></li><!--outlet-child--><li>Two<!--outlet--></li><!--outlet-child--><li>Three<!--outlet--></li><!--outlet-child--><!--outlet--> </ul><!--outlet-->`);
                done();
            });
        });

        it('Should render collection in async',function(done){
            let {html,htmlCollection} = new Context();
            let dom = document.createElement('div');
            const asyncList = () =>{
                return htmlCollection([{id:uuidv4(),label:'One'},{id:uuidv4(),label:'Two'},{id:uuidv4(),label:'Three'}],'id',data => {
                    return html`<li>${new Promise(resolve => resolve(data.label))}</li>`
                })
            }
            render(html`<ul> ${asyncList()} </ul>`,dom).then(function(){
                expect(dom.innerHTML).to.equal(`<ul> <li>One<!--outlet--></li><!--outlet-child--><li>Two<!--outlet--></li><!--outlet-child--><li>Three<!--outlet--></li><!--outlet-child--><!--outlet--> </ul><!--outlet-->`);
                done();
            });
        });

        it('Should render collection in async and removal',function(done){
            let {html,htmlCollection} = new Context();
            let dom = document.createElement('div');
            let items = [{id:uuidv4(),label:'One'},{id:uuidv4(),label:'Two'},{id:uuidv4(),label:'Three'}];
            const asyncList = () =>{
                return htmlCollection(items,'id',data => {
                    return html`<li>${new Promise(resolve => resolve(data.label))}</li>`
                })
            }

            render(html`<ul> ${asyncList()} </ul>`,dom).then(function(){
                expect(dom.innerHTML).to.equal(`<ul> <li>One<!--outlet--></li><!--outlet-child--><li>Two<!--outlet--></li><!--outlet-child--><li>Three<!--outlet--></li><!--outlet-child--><!--outlet--> </ul><!--outlet-->`);
                items = [];
                render(html`<ul> ${asyncList()} </ul>`,dom).then(function(){
                    expect(dom.innerHTML).to.equal(`<ul><!--outlet--></ul><!--outlet-->`);
                    done();
                });
            });

        });

    });

    describe("Plug and async",function(){
        it('Should render html in async',function(done){
            let {html,htmlCollection} = new Context();
            let dom = document.createElement('div');
            render(html`<div> ${plug(outlet => {
                setTimeout(()=>{
                    outlet.setContent(html`<div>Hello World</div>`);
                    expect(dom.innerHTML).to.equal(`<div> <div>Hello World</div><!--outlet--> </div><!--outlet-->`);
                    outlet.setContent(html`<div>YallaJS</div>`);
                    expect(dom.innerHTML).to.equal(`<div> <div>YallaJS</div><!--outlet--> </div><!--outlet-->`);
                },100);
            })} </div>`,dom).then(function(){
                render(html`<div> ${plug(outlet => {
                    setTimeout(()=>{
                        outlet.setContent(html`<div>Hello World</div>`);
                        expect(dom.innerHTML).to.equal(`<div> <div>Hello World</div><!--outlet--> </div><!--outlet-->`);
                        outlet.setContent(html`<div>YallaJS</div>`);
                        expect(dom.innerHTML).to.equal(`<div> <div>YallaJS</div><!--outlet--> </div><!--outlet-->`);
                        done();
                    },100);
                })} </div>`,dom);
            })
        });

        it('Should render Promise in async',function(done){
            let context = new Context();
            let {html,htmlCollection} = context;
            let dom = document.createElement('div');
            render(html`<div> ${new Promise(resolve => {resolve(html`<div>Hello World</div>`);})}</div>`,dom).then(function(){
                expect(dom.innerHTML).to.equal(`<div> <div>Hello World</div><!--outlet--></div><!--outlet-->`);
            }).then(function(){
                render(html`<div> ${new Promise(resolve => {resolve(html`<div>Hello YallaJS</div>`);})}</div>`,dom).then(function(){
                    expect(dom.innerHTML).to.equal(`<div> <div>Hello YallaJS</div><!--outlet--></div><!--outlet-->`);
                    done();
                });
            });
        });


        it('Should render Promise in attribute',function(done){
            let context = new Context();
            let {html,htmlCollection} = context;
            let dom = document.createElement('div');
            render(html`<div style="background-color: ${new Promise(resolve => {resolve('blue')})};color: ${new Promise(resolve => {resolve('red')})}"> Hello World</div>`,dom).then(function(){
                expect(dom.innerHTML.indexOf('background-color: blue')>0).to.equal(true);
                expect(dom.innerHTML.indexOf('color: red')>0).to.equal(true);
                done();
            });
        });

        it('Should render Plug in attribute',function(done){
            let context = new Context();
            let {html,htmlCollection} = context;
            let dom = document.createElement('div');
            render(html`<div style="background-color: ${plug(outlet => outlet.setContent('blue'))};color: ${plug(outlet => outlet.setContent('red'))}"> Hello World</div>`,dom).then(function(){
                expect(dom.innerHTML.indexOf('background-color: blue')>0).to.equal(true);
                expect(dom.innerHTML.indexOf('color: red')>0).to.equal(true);
                done();
            });
        });
    });


});
