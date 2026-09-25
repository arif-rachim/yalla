# YallaJS

<p align="center">
<img src="assets/yalla.png" width="150px" alt="YallaJS logo">
</p>

<p align="center">
<a href="https://www.npmjs.com/package/yallajs"><img src="https://img.shields.io/npm/v/yallajs.svg" alt="npm version"></a>
<a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT"></a>
</p>

YallaJS is a small JavaScript templating and rendering library that builds and updates DOM from ES2015 tagged template literals, without a virtual DOM, a compiler or any dependencies. You write markup as `` html`<div>Hello ${name}</div>` `` and call `render(template, container)`; YallaJS joins the static parts of the template with comment markers, turns them into a DOM template once, caches it in a `Context`, and on each later render only updates the dynamic parts it has already located, so repeated renders do not rebuild unchanged DOM. It supports event handlers, attribute and style values, keyed lists through `htmlCollection`, Promises as values, and `plug` for custom content and attribute logic. It was written for developers who want to use plain modern JavaScript in the browser instead of adopting a framework and build toolchain, and it targets ES5-era browsers such as IE 9 as well. The library is a single UMD file (`src/yalla.js`, about 1,000 lines), transpiled with Babel and tested with Karma, Mocha and Chai in headless Chrome. It reached version 2.0.0-beta.40 on npm, and development stopped at the end of 2017.

> Status: 2.0.0 beta, last updated December 2017. Not actively maintained. The former project website, yallajs.io, now redirects to an unrelated site, so links to it have been removed.

Supported browsers (as listed by the project): Internet Explorer 9, Opera 20, Safari 6, Firefox 28, Chrome 39 and newer.

## Installation

```bash
npm install yallajs
```

Or load the UMD build directly, which defines `yalla`, `Context`, `render`, `plug`, `uuidv4` and `Event` on the global object:

```html
<script src="lib/yalla.min.js"></script>
```

## Quick start

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


The main API:

 1. `render`: renders an HtmlTemplate, HtmlTemplateCollection, text or Promise into a DOM node.
 2. `html`: a tagged template literal, taken from a `Context`, that creates an HtmlTemplate object from HTML strings.
 3. `htmlCollection`: a function, taken from a `Context`, that creates an HtmlTemplateCollection for rendering arrays of objects.
 4. `Context`: stores local information such as the HtmlTemplate cache. In most cases you only use it to get `html` and `htmlCollection`.
 5. `plug`: wraps a callback that receives an `outlet` and sets custom content (see [Advanced](#advanced)).

The module also exports `uuidv4` and `Event` helpers.

## Motivation

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

## How it works

### `html` tagged template literals

`html` tag expression processed Template Literal, and generate HtmlTemplate object out of it.
Template literals are string literals allowing embedded expressions. You can use multi-line strings and string interpolation features with them.

Template literals are enclosed by the back-tick (\` \`) character instead of double or single quotes. Template literals can contain place holders. These are indicated by the Dollar sign and curly braces (${expression}). The expressions in the place holders and the text between them get passed to a `html` Tagged Template Literals.

### `render`: HtmlTemplate rendering

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


## Performance

The author measured yallajs 2.0 beta with [Stefan Krause's js-framework-benchmark](https://github.com/krausest/js-framework-benchmark) and reported that, at an early stage of performance tuning, it beat Angular, React and Vue on both rendering and memory allocation. The benchmark implementation is in [arif-rachim/js-framework-benchmark](https://github.com/arif-rachim/js-framework-benchmark/tree/master/yallajs-v2.0.0-beta-keyed). The result charts that used to be embedded here are no longer available.

## Features

YallaJS uses ES2015 template literals for HTML templating. The API is small, so it stays out of the way of your application code and needs no boilerplate.

## Usage

### Hello world

To render hello world we can write as follows :

```javascript
render(`Hello World`,document.body);
```

The above code means we want to render 'Hello World' string into the body tag.

### `render`

`render` is a function that accepts 2 parameters, the first parameter is 
the object to be rendered and the second parameter is the container where the object will be rendered.

The first parameter of `render` can be a `string`, `boolean`, `date`, `number`, `Promise`, `HtmlTemplate` or `HtmlTemplateCollection`.
The second parameter is the DOM node, for example `document.body` or the result of `document.getElementById`.

To render html we can pass it to the first parameter `HtmlTemplate` object by using tag `html` like the following example :

```javascript
render(html`<button>Hello World</button>`,document.body);
```

The above code means that we want to render the Hello World button to the document.body element.

### `html`

`html` tag behind the screen is an ES6 Template Tag.
`html` generate HtmlTemplate object, which contains information about static strings, and dynamic values.
The `html` tag is retrieved from a `yalla.Context` object.

> `yalla.Context` is the object that stores the cache of `html` and` htmlCollection` Tags. 
For hybrid application cases where we can have multiple sub-applications (not single page app),
we can separate contexts from sub-applications by providing aliases of `html` and `htmlCollection` of each `Context`.

**Examples:**

Rendering `div` :
```javascript
render(html`<div>This is Div</div>`,document.body);
```

Rendering `html in html` :
```javascript
render(html`<div>This is Div ${html`<div>This is Sub-Div</div>`} </div>`,document.body);
```

Rendering with expression :
```javascript
let displayMe = false;
render(html`<div>This is Div ${displayMe ? html`<div>This is Sub-Div</div>` : ''} </div>`,document.body);
```

We can also listen to DOM events by setting the value of `oneventname` to an expression `e => {}`.

### Events


Event in HtmlTemplate can be called by using callback expression `e => {}`.
Here is an example to listen to the `onclick` event of a` button`.


```javascript

function buttonListener(){
    alert('hello');
}

render(html`<button onclick="${e => buttonListener()}">Hello World</button>`,document.body);
```

We can also pass parameters into our callback.

```javascript
let alertSomething = (something) => {
  alert(something);
}

render(html`<button onclick="${e => alertSomething(e.target.innerText)}">Hello World</button>`,document.body);
```

In addition to Event, HtmlTemplate can also set values of attributes & styles using Template Literal.


### Attributes and styles


Attribute values in an HtmlTemplate can be set with `${}`.
The following example sets the color and font size.

```javascript

let dynamicColor = '#CCCCCC';
let fontSize = '32px';

render(html`<div
        style="color : ${dynamicColor};
        font-size : ${fontSize};" >This is a Node</div>`,document.body);
```

Attributes can only render primitive types such as `text`, `number` and `boolean`.

If you need a style attribute that has a combination of values, it is recommended to use the `style` tag.

The following example uses yalla in a `style` tag:

```javascript
let fontColor = '#666666';
let backgroundColor = '#CCCCCC';
render(html`
<style>
    .my-class {
        color : ${fontColor};
        background-color : ${backgroundColor};
    }
</style>
<div class="my-class">Hello Class</div>
`,document.body);
```


### `htmlCollection`

To render an array, use `htmlCollection`, which maps an array of items to an array of HtmlTemplates.
It requires a key for each item so it can update the collection efficiently.

htmlCollection has 3 parameters:

```javascript
htmlCollection(arrayItems,keyFunction,templateFunction);
```

*Example*
```javascript
let marshalArtArtist = [
    {id:1,name:'Yip Man'},
    {id:2,name:'Bruce Lee'},
    {id:3,name:'Jackie Chan'}]

render(html`
<table>
    <tbody>
        ${htmlCollection(marshalArtArtist,(data) => data.id, (data,index) => html`
            <tr><td>${data.name}</td></tr>
        `)}
    </tbody>
</table>
`,document.body);
```

## Advanced

The following features can be used to extend yallajs.

1. Promise :

We can render the result of an asynchronous process by using a Promise. IE9 does not support Promise natively, so
to use this feature there you need a third-party library such as bluebird.js.

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


## Examples

The examples below are hosted on CodePen.

### Sample projects
1. <a href="https://codepen.io/yallajs/project/editor/AxKoNY#0">Hero Editor</a> : Hero Editor tutorial from Angular JS rewritten in Yallajs
2. <a href="https://codepen.io/yallajs/pen/vWjdqe">React Fiber Demo</a> : React Fiber Triangle rewritten with YallaJS
3. <a href="https://codepen.io/yallajs/pen/wPpVNj">SAM Pattern Todo</a> : Example of how to use YallaJS with <a href="http://sam.js.org/">SAM Pattern</a>
4. [`yallajs-indexeddb.html`](yallajs-indexeddb.html) in this repository: an IndexedDB admin page built with yallajs

### Basic Example
1. <a href="https://codepen.io/yallajs/pen/NwGpGZ">Hello world</a> : Basic hello world application
2. <a href="https://codepen.io/yallajs/pen/POPppL/">Simple Calculator</a> : Simple calculator with yallajs
3. <a href="https://codepen.io/yallajs/pen/zpxpaY">SVG - Sample</a> : Showcase on using SVG with yallajs

### Event Example
1. <a href="https://codepen.io/yallajs/pen/wPKdJo">Color Picker</a> : Simple color picker

### Html Collection Example
1. <a href="https://codepen.io/yallajs/pen/BmzxvO">Array with Html Collection</a> : Using HtmlCollection to render arrays
2. <a href="https://codepen.io/yallajs/pen/gXQrgE">Html Collection with Promise</a> : HtmlCollection with Promise

### Async Example
1. <a href="https://codepen.io/yallajs/pen/XzKqBb">Node with Promise</a> : Example using Promise on Node
2. <a href="https://codepen.io/yallajs/pen/eyNvNj">Attribute with Promise</a> : Example using Promise on Attribute

### Plug Example
1. <a href="https://codepen.io/yallajs/pen/YYXZRp">Node With Plug</a> : Example using Plug on Node
2. <a href="https://codepen.io/yallajs/pen/jYPBzK">Attribute With Plug</a> : Example using Plug on Attribute

### Animate.css
1. <a href="https://codepen.io/yallajs/pen/VyvbVr">Animation.css</a> : Example with Animation.CSS


## Documentation

The [docs](docs/README.md) folder contains a longer manual, indexed in [SUMMARY.md](SUMMARY.md): introduction, motivation, core concepts, the `render`, `html` and `htmlCollection` basics with a to-do list example, and advanced topics (async values, `plug` and custom elements).

## Development

```bash
npm install
npm run build      # Babel: src/ -> lib/
npm run compress   # UglifyJS: lib/yalla.js -> lib/yalla.min.js
npm run zip        # gzip lib/yalla.min.js -> lib/yalla.min.js.gzip
npm test           # build, run Karma tests in headless Chrome, then compress and gzip
```

Tests are in `test/yalla.test.js` (Mocha and Chai via Karma). The Travis CI configuration in `.travis.yml` is from 2017 and no longer runs.

## Acknowledgements

The YallaJS project was supported by BrowserStack.

## License

[MIT](LICENSE)
