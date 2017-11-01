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

**YallaJS** is a javascript framework for building web applications swiftly. 

**Performance**
---
The Benchmark result of yallajs 2.0 beta version is very promising. Without any performance tuning, yallajs wins against angular, react and vue, both on rendering and memory allocation.
 Following benchmark result using <a href="https://github.com/krausest/js-framework-benchmark">Stefan Krause performance benchmark</a>.

<img class="image" src="https://docs.google.com/spreadsheets/d/e/2PACX-1vRBa5mvSRr6DdMYSZAsLOFowM7P5Jlo1pVRp6BwfyoYtrte3bcvxhIHuJ0Meg8gGMilTsGoSxIqvq9f/pubchart?oid=1459873274&format=image" >


**Memory**
---
On the other hand, yallajs memory usage is showing very promising result.

<img class="image" src="https://docs.google.com/spreadsheets/d/e/2PACX-1vRBa5mvSRr6DdMYSZAsLOFowM7P5Jlo1pVRp6BwfyoYtrte3bcvxhIHuJ0Meg8gGMilTsGoSxIqvq9f/pubchart?oid=1555194057&format=image" >


You can find the details <a href="http://yallajs.io/benchmark-result.html">here</a>, and the code that we use in this benchmark <a href="#">here</a>.


**API**
---

Yalla uses ES 2015 String literal for html templating, yallajs API is very simple, making yalla js almost invisible in your code. This makes your application smells good and no boilerplate.

Overview
--------
Print **Hello World** in the screen.

```javascript
import {Context, render} from 'yallajs';

let {html,htmlCollection} = new Context();
render(html`Hello World`,document.body);
```

YallaJS <a href="http://yallajs.io/todomvc.html">TodoMVC</a>


YallaJS Project is supported by :

<img align="center" class="image" src="http://yallajs.io/images/browser-stack.svg" width="150px">