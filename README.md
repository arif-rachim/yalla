# _**YallaJS**_

##### **YallaJS** makes it easy to create HtmlTemplate and render it to DOM efficiently.

[![](https://travis-ci.org/yallajs/yalla.svg?branch=master "Build Status")](https://travis-ci.org/yallajs/yalla)[![](https://img.shields.io/codecov/c/github/yallajs/yalla.svg "Coverage")](https://codecov.io/gh/yallajs/yalla)[![](https://img.shields.io/website-up-down-green-red/http/yallajs.io.svg?label=yallajs.io "Build Status")](http://yallajs.io)[![](https://img.shields.io/david/expressjs/express.svg "Build Status")](https://github.com/yallajs/yalla/blob/master/package.json)[![](https://img.shields.io/github/size/yallajs/yalla/lib/yalla.min.js.gzip.svg "Build Status")](https://github.com/yallajs/yalla/tree/master/lib/yalla.min.js)[![](https://img.shields.io/github/license/yallajs/yalla.svg "License")](https://travis-ci.org/yallajs/yalla)

![](http://browserbadge.com/ie/9)![](http://browserbadge.com/opera/20)![](http://browserbadge.com/safari/6)![](http://browserbadge.com/firefox/28)![](http://browserbadge.com/chrome/39)

**YallaJS** makes it easy to create HtmlTemplate and render it to DOM efficiently.

    import {Context,render} from 'yallajs';

    // we pull html Tagged Template literals from the Context object.
    let {html} = new Context();

    // create template function that produce HtmlTemplate "<div>Hello xxx </div>"
    let hello = (param) => html`<div>Hello ${name}</div>`;

    // render <div>Hello world</div> to document.body.
    render(hello('world'),document.body);

    // render <div>Hello yallajs</div> to document.body.
    render(hello('yallajs'),document.body);

`yallajs` has 3 main API

1. `render` : Render is a function that renders an HtmlTemplate or HtmlTemplateCollection into node.
2. `html` : html is contextual Tagged Template Literal that generates HtmlTemplate object from Html strings
3. `htmlCollection` : htmlCollection is contextual Tagged Template Literals that generates HtmlTemplateCollection for rendering arrays of object.
4. `Context` : Context is an object that stores local information such as HtmlTemplate cache \(in most cases you dont have to do anything with this object\).

## [**Motivation**](#motivation) {#motivation}

`yallajs` has following main goals :

1. Highly efficient in DOM creation, updates and deletion.
2. Easy to use and very simple to understand
3. Using web standards instead of creating new ones
4. Very small size and no dependency.
5. Support ES 5 browsers suchas IE 9, IOS 6 and Android 5.

## [**How it works**](#how-it-works) {#how-it-works}

## [`html`** Tagged Template Literals**](#html-tagged-template-literals) {#html-tagged-template-literals}

`html` tag expression processed Template Literal, and generate HtmlTemplate object out of it. Template literals are string literals allowing embedded expressions. You can use multi-line strings and string interpolation features with them.

Template literals are enclosed by the back-tick \(\` \`\) character instead of double or single quotes. Template literals can contain place holders. These are indicated by the Dollar sign and curly braces \(${expression}\). The expressions in the place holders and the text between them get passed to a `html` Tagged Template Literals.

## [`render`** HtmlTemplate rendering**](#render-htmltemplate-rendering) {#render-htmltemplate-rendering}

`render()` takes a `HtmlTemplate`, `HtmlTemplateCollection`, `Text` or `Promise`, and renders it to a DOM Container. The process of rendering is describe in following orders :

1. `yallajs` take the static strings in `HtmlTemplate` and join the strings with `<!--outlet-->` to mark the position of dynamic parts.
2. `yallajs` passes joined strings to innerHTML to create `DOMTemplate`
3. It walks through the `DOMTemplate` and identify the comment tag `outlet`.
4. On initial rendering `yallajs` update the `outlet` with actual values.
5. After that `yallajs` store the updated `DOMTemplate` into `Context` object.
6. Lastly `yallajs` clone the `DOMTemplate` to create `HtmlTemplateInstance` and append it to DOM Container.

   By keeping the template DOM in the cache, next DOM creation will be done in two steps only :

7. look the template DOM, and update the outlet with next value,

8. clone the template DOM and append it to DOM Container.

   In this way we can also perform the DOM update process very efficiently because we already know the location of the placeholder. So if there is a new value that changes, we simply update the placeholder without having to touch other DOM

## [**Performance**](#performance) {#performance}

The Benchmark result of yallajs 2.0 beta version is very promising. With very early stage of performance tuning, yallajs wins against angular, react and vue, both on rendering and memory allocation. Following benchmark result using [Stefan Krause performance benchmark](https://github.com/krausest/js-framework-benchmark).

![](https://docs.google.com/spreadsheets/d/e/2PACX-1vRBa5mvSRr6DdMYSZAsLOFowM7P5Jlo1pVRp6BwfyoYtrte3bcvxhIHuJ0Meg8gGMilTsGoSxIqvq9f/pubchart?oid=1459873274&format=image)

## [**Memory**](#memory) {#memory}

On the other hand, yallajs memory usage is showing very promising result.

![](https://docs.google.com/spreadsheets/d/e/2PACX-1vRBa5mvSRr6DdMYSZAsLOFowM7P5Jlo1pVRp6BwfyoYtrte3bcvxhIHuJ0Meg8gGMilTsGoSxIqvq9f/pubchart?oid=1555194057&format=image)

You can find the details [here](http://yallajs.io/benchmark-result.html), and the code that we use in this benchmark [here](https://github.com/yallajs/js-framework-benchmark/tree/master/yallajs-v2.0.0-keyed).

## [**Features**](#features) {#features}

Yalla uses ES 2015 String literal for html templating, yallajs API is very simple, making yalla js almost invisible in your code. This makes your application smells good and no boilerplate.

## [Overview](#overview) {#overview}

## [**Events**](#events) {#events}

    function buttonListener(){
        alert('hello');
    }

    render(html`<input type="button" onclick="${e => buttonListener()}">`,document.body);

## [**Attribute**](#attribute) {#attribute}

    render(html`<div style="color : ${dynamicColor};font-size : ${fontSize};">This is a Node</div>`,document.body);

## [**HtmlTemplate in HtmlTemplate**](#htmltemplate-in-htmltemplate) {#htmltemplate-in-htmltemplate}

    render(html`<div>This is Parent Node
            ${html`<div>This is Child Node</div>`}
            </div>`,document.body);

## [`htmlCollection`** HtmlTemplateCollection**](#htmlcollection-htmltemplatecollection) {#htmlcollection-htmltemplatecollection}

HtmlTemplateCollection is high performance Object that map array of items to HtmlTemplate Array. HtmlTemplateCollection requires key of the item to update the collection effectively.

```
htmlCollection(arrayItems,keyFunction,templateFunction);
```

_Example_

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

## [**Sample Project**](#sample-project) {#sample-project}

1. [TodoMVC](http://yallajs.io/todomvc.html) : a simple todomvc application
2. [Benchmark](http://yallajs.io/benchmark.html) : benchmark tools for measuring performance, fork of [Stefan Krause](http://www.stefankrause.net/wp/) github project

## [**Codepen sample**](#codepen-sample) {#codepen-sample}

1. [Hello world](https://codepen.io/yallajs/pen/NwGpGZ) : Basic hello world application
2. [Simple Calculator](https://codepen.io/yallajs/pen/POPppL/) : Simple calculator with yallajs
3. [Color Picker](https://codepen.io/yallajs/pen/wPKdJo) : Simple color picker
4. [Async](https://codepen.io/yallajs/pen/XzKqBb) : Example using Promise for async
5. [Html Collection](https://codepen.io/yallajs/pen/BmzxvO) : Using HtmlCollection to render arrays
6. [Hero Editor](https://codepen.io/yallajs/project/editor/AxKoNY#0) : Hero Editor tutorial from Angular JS rewritten in Yallajs



