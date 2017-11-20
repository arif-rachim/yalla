<p align="center">
<img align="center" class="image" src="http://yallajs.io/images/yallajs.svg" width="150px">
</p>

<p align="center">
<a href="https://travis-ci.org/yallajs/yalla"><img src="https://travis-ci.org/yallajs/yalla.svg?branch=master" alt="Build Status"></a>
<a href="https://codecov.io/gh/yallajs/yalla"><img src="https://img.shields.io/codecov/c/github/yallajs/yalla.svg" alt="Coverage"></a>
<a href="http://yallajs.io"><img src="https://img.shields.io/website-up-down-green-red/http/yallajs.io.svg?label=yallajs.io" alt="Build Status"></a>
<a href="https://github.com/yallajs/yalla/blob/master/package.json"><img src="https://img.shields.io/david/expressjs/express.svg" alt="Build Status"></a>
<a href="https://github.com/yallajs/yalla/tree/master/lib/yalla.min.js"><img src="https://img.shields.io/github/size/yallajs/yalla/lib/yalla.min.js.gzip.svg" alt="Build Status"></a>
<a href="https://travis-ci.org/yallajs/yalla"><img src="https://img.shields.io/github/license/yallajs/yalla.svg" alt="License"></a>
</p>

----
<p align="center">
<img width='46px' src="http://browserbadge.com/ie/9">
<img width='46px' src="http://browserbadge.com/opera/20">
<img width='46px' src="http://browserbadge.com/safari/6">
<img width='46px' src="http://browserbadge.com/firefox/28">
<img width='46px' src="http://browserbadge.com/chrome/39">
</p>

**YallaJS** makes it easy to create HtmlTemplate and render it to DOM efficiently.

```javascript
import {Context,render} from 'yallajs';

// we pull html Tagged Template literals from the Context object.
let {html} = new Context();

// create template function that produce HtmlTemplate "<div>Hello xxx </div>"
let hello = (name) => html`<div>Hello ${name}</div>`;

// render <div>Hello world</div> to document.body.
render(hello('world'),document.body);

// render <div>Hello yallajs</div> to document.body.
render(hello('yallajs'),document.body);
```


`yallajs`  has 3 main API

 1. `render` : Render is a function that renders an HtmlTemplate or HtmlTemplateCollection into node.
 2. `html` : html is contextual Tagged Template Literal that generates HtmlTemplate object from Html strings
 3. `htmlCollection` : htmlCollection is contextual Tagged Template Literals that generates HtmlTemplateCollection for rendering arrays of object.
 4. `Context` : Context is an object that stores local information such as HtmlTemplate cache (in most cases you dont have to do anything with this object).

**Motivation**
---

The original motivation of yallajs is perfectly described in this story :
[How it feels to learn javascript in 2018](https://codeburst.io/how-it-feels-to-learn-javascript-in-2018-6b2cf7abb6aa)

>YallaJS hopes one day we will no longer need yallajs after the browser incorporates ES6 Templating library. 


>An example of a rewritten infamous angular Hero Editor tutorial using ES6 module and ES6 String Template
<img class="progressiveMedia-image js-progressiveMedia-image" data-src="https://cdn-images-1.medium.com/max/800/1*1VizDFqW5wzHrPKzVarE6w.gif" src="https://cdn-images-1.medium.com/max/800/1*1VizDFqW5wzHrPKzVarE6w.gif">

*No babel, no transpiler, just your hand written ES6 straight into the browser stomach*


`yallajs` has following main goals :

1. Highly efficient in DOM creation, updates and deletion.
2. Easy to use and very simple to understand
3. Using web standards instead of creating new ones
4. Very small size and no dependency.
5. Support ES 5 browsers suchas IE 9, IOS 6 and Android 5.

**How it works**
---


**`html` Tagged Template Literals**
---
`html` tag expression processed Template Literal, and generate HtmlTemplate object out of it.
Template literals are string literals allowing embedded expressions. You can use multi-line strings and string interpolation features with them.

Template literals are enclosed by the back-tick (\` \`) character instead of double or single quotes. Template literals can contain place holders. These are indicated by the Dollar sign and curly braces (${expression}). The expressions in the place holders and the text between them get passed to a `html` Tagged Template Literals.

**`render` HtmlTemplate rendering**
----
`render()` takes a `HtmlTemplate`, `HtmlTemplateCollection`, `Text` or `Promise`, and renders it to a DOM Container. The process of rendering is describe in following orders :

1. `yallajs` take the static strings in `HtmlTemplate` and join the strings with `<!--outlet-->` to mark the position of dynamic parts.
2. `yallajs` passes joined strings to innerHTML to create `DOMTemplate`.
3. It walks through the `DOMTemplate` and identify the comment tag `outlet`.
4. On initial rendering `yallajs` update the `outlet` with actual values.
5. After that `yallajs` store the updated `DOMTemplate` into `Context` object.
6. Lastly `yallajs` clone the `DOMTemplate` to create `HtmlTemplateInstance` and append it to DOM Container.

By keeping the template DOM in the cache, next DOM creation will be done in two steps only :

1. look the template DOM, and update the outlet with next value,
2. clone the template DOM and append it to DOM Container.

In this way we can also perform the DOM update process very efficiently because we already know the location of the placeholder. So if there is a new value that changes, we simply update the placeholder without having to touch other DOM


**Performance**
---
The Benchmark result of yallajs 2.0 beta version is very promising. With very early stage of performance tuning, yallajs wins against angular, react and vue, both on rendering and memory allocation.
 Following benchmark result using <a href="https://github.com/krausest/js-framework-benchmark">Stefan Krause performance benchmark</a>.

<img class="image" src="https://docs.google.com/spreadsheets/d/e/2PACX-1vSjhBLod7UG28QeMS9I1WEmWW4o_RYO2a27GX4GhBW9cTBS_0i_N2FyGgaUsBavKq1KmnUMWRPhsPxm/pubchart?oid=106908939&format=image" >


**Memory**
---
On the other hand, yallajs memory usage is showing very promising result.

<img class="image" src="https://docs.google.com/spreadsheets/d/e/2PACX-1vRBa5mvSRr6DdMYSZAsLOFowM7P5Jlo1pVRp6BwfyoYtrte3bcvxhIHuJ0Meg8gGMilTsGoSxIqvq9f/pubchart?oid=1555194057&format=image" >


You can find the details <a href="http://yallajs.io/benchmark-result.html">here</a>, and the code that we use in this benchmark <a href="https://github.com/yallajs/js-framework-benchmark/tree/master/yallajs-v2.0.0-keyed">here</a>.


**Features**
---

Yalla uses ES 2015 String literal for html templating, yallajs API is very simple, making yalla js almost invisible in your code. This makes your application smells good and no boilerplate.

Overview
--------

**hello world**
---
To render hello world we can write as follows :

```javascript
render(`Hello World`,document.body);
```

The above code means we want to render 'Hello World' string into the body tag.

**`render`**
---
`render` is a function that accepts 2 parameters, the first parameter is 
the object to be rendered and the second parameter is the container where the object will be rendered.

The first parameter of `render` can be` string`, `boolean`,` date`, `number`,` Promise`, `HtmlTemplate` and` HtmlTemplateCollection`.
The second parameter is the DOM node, we can use `document.body` or` document.getElementById` for the second parameter

To render html we can pass it to the first parameter `HtmlTemplate` object by using tag `html` like the following example :

```javascript
render(html`<button>Hello World</button>`,document.body);
```

The above code means that we want to render the Hello World button to the document.body element.

**`html`**
---
`html` tag behind the screen is an ES6 Template Tag.
`html` generate HtmlTemplate object, which contains information about static strings, and dynamic values.
`html` tag can be retrieved from ` yalla.Context` object.

> `yalla.Context` is the object that stores the cache of `html` and` htmlCollection` Tags. 
For hybrid application cases where we can have multiple sub-applications (not single page app),
we can separate contexts from sub-applications by providing aliases of `html` and` htmlCollection` of each `Context`

**Examples:**

Rendering `div` :
```javascript
render(html`<div>This is Div</div>`,document.body);
```

Rendering `html in html` :
```javascript
render(html`<div>This is Div ${html`<div>This is Sub-Div</div>`} </div>,document.body);
```

Rendering with expression :
```javascript
let displayMe = false;
render(html`<div>This is Div ${displayMe ? html`<div>This is Sub-Div</div>` : ''} </div>,document.body);
```

We can also listen to the DOM event by setting the value of `oneventname` with expression ` e => {} `

**Events**
---

Event in HtmlTemplate can be called by using callback expression `e => {}`.
Here is an example to listen to the `onclick` event of a` button`.


```javascript

function buttonListener(){
    alert('hello');
}

render(html`<input type="button" onclick="${e => buttonListener()}">Hello World</button>`,document.body);
```

We can also mempassing parameters into our callback.

```javascript
let alertSomething = (something) => {
  alert(something);
}

render(html`<button onclick="${e => alertSomething(e.target.innerText)}">Hello World</button>`,document.body);
```

In addition to Event, HtmlTemplate can also set values of attributes & styles using Template Literal.


**Attribute & Style**
---

Attribute in HtmlTemplate can be set its value by using $ {}. 
Following is an example on how to set the value of the color and color attribute.

```javascript

let dynamicColor = '#CCCCCC';
let fontSize = '32px';

render(html`<div
        style="color : ${dynamicColor};
        font-size : ${fontSize};" >This is a Node</div>`,document.body);
```

Attributes can only render primitive object types such as `text`,` number` and `boolean`.

If you need a style attribute that has a combination of values, it is recommended to use the `style` tag.

Following an example on how to use yalla in `style`

```javascript
let fontColor = '#666666';
let backgroundColor = '#CCCCCC';
render(`
<style>
    .my-class {
        color : ${fontColor};
        background-color : ${backgroundColor};
    }
</style>
<div class="my-class">Hello Class</div>
`);
```


**`htmlCollection`**
---
To render an Array, we can use `Html Template Collection`. HtmlTemplateCollection is high performance Object that map array of items to HtmlTemplate Array.
HtmlTemplateCollection requires key of the item to update the collection effectively.

htmlCollection has 3 parameters:

```javascript
htmlCollection(arrayItems,keyFunction,templateFunction);
```

*Example*
```javascript
let marshalArtArtist = [
    {id:1,name:'Yip Man'},
    {id:2,name:'Bruce Lee'},
    {id:3,label:'Jackie Chan'}]

render(html`
<table>
    <tbody>
        ${htmlCollection(marshalArtArtist,(data) => data.id, (data,index) => html`
            <tr><td>${data.name}</td></tr>
        `)}
    <tbody>
</table>
`,document.body);
```

**Sample Project**
---
1. <a href="http://yallajs.io/todomvc.html">TodoMVC</a> : a simple todomvc application
2. <a href="http://yallajs.io/benchmark.html">Benchmark</a> : benchmark tools for measuring performance, fork of <a href="http://www.stefankrause.net/wp/">Stefan Krause</a> github project



**Codepen sample**
---
1. <a href="https://codepen.io/yallajs/pen/NwGpGZ">Hello world</a> : Basic hello world application
2. <a href="https://codepen.io/yallajs/pen/POPppL/">Simple Calculator</a> : Simple calculator with yallajs
3. <a href="https://codepen.io/yallajs/pen/wPKdJo">Color Picker</a> : Simple color picker
4. <a href="https://codepen.io/yallajs/pen/XzKqBb">Async</a> : Example using Promise for async
5. <a href="https://codepen.io/yallajs/pen/BmzxvO">Html Collection</a> : Using HtmlCollection to render arrays
6. <a href="https://codepen.io/yallajs/project/editor/AxKoNY#0">Hero Editor</a> : Hero Editor tutorial from Angular JS rewritten in Yallajs
7. <a href="https://codepen.io/yallajs/pen/wPpVNj">SAM Pattern Todo</a> : Example of how to use YallaJS with <a href="http://sam.js.org/">SAM Pattern</a>

**Advance**
---
Following is an advanced topic that can be used to extend yallajs.

1. Promise :

We can call asynchronous process by using Promise. Promise by default is not supported by IE9, therefore
to use this feature you should use a 3rd party libray like bluebird.js

Example of how to use Promise :
```javascript
render(html`<div>
${new Promise(resolve => {
    setTimeout(()=>{
        resolve(html`<div>This will be visible after 1s.</div>`);
    },1000);
})}
</div>`,document.body);
```

2. Manual content decorator with `Plug`

Plug is a special function that will receive a callback function that contains the `outlet` object as its parameter.
With the object `outlet`, we can customize what content to be rendered to dom.

Here is an example of using `plug`.

```javascript
render(html`<div>
${plug(outlet => {
    // here we can put some logic to intercept and set our own content.
    outlet.setContent(html`<div>This is my custom content</div>`)
})}
</div>`,document.body);
```


YallaJS Project is supported by :

<img align="center" class="image" src="http://yallajs.io/images/browser-stack.svg" width="150px">
