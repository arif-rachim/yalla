YallaJS
=======

*[Check our Official site](http://yallajs.io)*

*Build HTML Component with Zero Boilerplate*

Component in Yallajs is just an *HTML*, 
there is no need to create javascript controller. Behind the screen, it is
a **stateless functional component**.

Yallajs is bundled with **its own state-container** inspired by Redux. Therefore, Yallajs enforce the 
component to remain stateles and work only in accordance to the state container.

Yallajs is equipped with routing and module management. Yallajs routing mechanism in very simple 
but quite powerful. Each component can be called directly from the browser address bar 
by using hashbang operator. If the component is invoked via the browser address bar, then these 
components function as a View, but when its being used as a component of a ***composite component***, then 
it works as a subcomponent.

Youtube creating Todoapp with yallajs.

[![IMAGE ALT TEXT HERE](http://img.youtube.com/vi/GVQDfolFo5A/0.jpg)](http://www.youtube.com/watch?v=GVQDfolFo5A)


Setup
---------
To setup yallajs application you can add following script tag in the head element in your index.html

```html
<script src="http://yallajs.io/yalla.js" data-main="first-component" data-base="src">
```
When importing yalla.js, we need to specify two attributes in the script tag : 
> 
> * data-main : This is the main component which will be called if there is no value in hashbang operator.
> * data-base : This is the base folder where we keep our source code.>

```
.
├── src
|   └── first-component.html
└── index.html
```
Creating first-component.html
-----------------------------
Inside first-component.html we can start writing our html code. 
```html
<div>Hello World</div>
```

Now if we run index html from browser it should print Hello World.

#### *When building yalla component, there are some rules that we need to follow:*
>
>* Component should only return single element.
>* Script tag is not allowed (or yallajs will ignore them)


Yallajs is equiped with its own routing framework 

Therefore Component can be **called directly** from browser by using hashbang operator :
```
http://localhost:8080/index.html#first-component
```
Component Routing  
--------------------
Yallajs equipped with simple but powerful routing framework. We can call a component directly from the 
browser by using hashbang. 

For example,if we have a component named component-a.html placed directly below the base folder, 
we can call component-a from browser with following address (assuming the localserver port is 8080):
```html
http://localhost:8080/index.html#component-a
```

In order to access to component which is stored under subfolder or package, we can use  dot `.` to access them :

```
.
└── src
    ├── first-component.html
    └── package-a
         ├── second-component.html
         └── package-b
             └── third-compoent.html
```
To render first-component in browser :
```html
http://localhost:8080/index.html#first-component
```

To render second-component in browser :
```html
http://localhost:8080/index.html#package-a.second-component
```

To render third-component in browser :
```html
http://localhost:8080/index.html#package-a.package-b.third-component
```


### Routing with `<router-view>`
Yallajs also support subrouting using slash `/`. Subrouting in yallajs means we call the other components 
to be rendered in the browser.

For Example:
We can request to render second-component after first-component in the browser address bar with following address :

```
http://localhost:8080/index.html#first-component/package-a.second-component
```

And in our first-component we need to place the `<router-view>` tag, to inform the browser where they should place the second-component.

```html
<!-- fisrt-component.html -->
<div>
    Hello World
    <router-view></router-view>
</div>

<!-- package-a/second-component.html -->
<div>
    <label>This is second component</label>
</div>
```

Above code will generate following code in browser :
```html
<!-- browser result -->
<div>
     Hello World
     <div>
        <label>This is second component</label>
     </div>
</div>
```

`{expression}` with Bracket
-------------------------
We can use bracket to render simple expression. For example :
```html
<div>What is 1 + 2 = {1+2} </div>
```

This will print in the browser *What is 1 + 2 = 3*

#### *Rules on yallajs `{expression}` :*

>
>* There should not be new line in the expression
>```html
>WRONG !!!
><div>What is 1 + 2 = {1 
>                     + 2} </div>
>```
>* It doesn't accept function
> ```html
> WRONG !!!
> <div>What is 1 + 2 = {function(){return 1 + 2}()} </div>
> ```
> * It should not contain bracket
> ```html
> WRONG !!!
> <div>What is 1 + 2 = { {one : 1 + 2}.one } </div>
> ```


Following expression are valid

> * Ternary operator
> ```html
> CORRECT !!
> <div>What is 1 + 2 = { (1 + 1) == 2 ? 'ITS TWO' : 'I DONT KNOW' } </div>
> ```
> * Calling actions method
> ```html
> CORRECT !!
> <div>What is 1 + 2 = { actions.getTheResult(1+2) } </div>
> ```
> * Used in component attribute except 'style' attribute
> ```html
> CORRECT !!
> <div>
>   <first-component 
>       name="{user.name}" 
>       address="{user.address}" 
>       class="{user.active ? 'green' : 'grey'}"></first-component>
> <div>
>
> WRONG !!!
> <div style="{'name'}"></div>
> ```


If the component is used in the component attribute, these same rules applies.

Component Properties with $props
--------------------------------
At the heart of Yalla components is the $props. $props is the object that holds parameter 
from outside. Parameters can come from the browser address bar, or from the composite component.

For example using $props.
```html
<div>Hello {$props.firstName} {$props.lastName}</div>
```
Now if called the component from browser we can pass the properties **separated with colon**.
```
http://localhost:8080/index.html#first-component:firstName=Bruno:lastName=Mars
```
We can also give each routing component properties
```
http://localhost:8080/index.html#first-component:firstName=Bruno:lastName=Mars/package-a.second-component:location=Barcelona:date=April-7
```

Or if we use them in composite component, we need to use **hyphen-case instead camelCase**.
```html
<div>
    <first-component first-name="Bruno" last-name="Mars"></first-component>
</div>
```


Composite Component  
--------------------

Composite components are components formed from other components. With composite 
components we can put more features on the component, and make them reusable. 

Composite component divided into two chapter. First is about Dependency Injection, *how to 
inject outside component into composite component*. Second is about Children, 
*how to render the elements given by the parent container* into our the component.

###Dependency Injection
Lets create another component named 'composite-component'

```
.
├── src
|   ├── first-component.html
|   └── composite-component.html
└── index.html
```

To include smaller components in 
composite components, we can use the `<inject>` tag.

The `<inject>` tag basicly is a dependency injection in Yallajs. We can inject a *component or an object*.

### To inject a component or object in composite component we can use following :
 Injecting a Component
```html
<div>
    <inject name="myFirstComponent" value="first-component"></inject>
</div>
```

Injecting an Object
```html
<div>
    <inject name="myActions" value="@my-actions"></inject>
</div>
```

* **name** : is the variable name, we should use **camelCase** for name attribute.
> When we want to use the component, we need to use hyphen-case instead camelCase. `<my-first-component>`
* **value** : is the javascript file name that we want to inject. If we want to inject an Object we need to add prefix "@" in it `<inject name="actions" value="@actions-object">`

>Inside our composite component we can use firstComponent with *hyphen-case instead camelCase*
```html
<div>
    <inject name="myFirstComponent" value="first-component"></inject>
    <my-first-component first-name="Bruno" last-name="Mars"></my-first-component>
</div>
```

#### *Rules on yallajs `inject` tag:*
>
>* Inject tag should have attribute name and value
>```html
>WRONG !!!
><inject var="myFirstComponent" value="first-component"></inject>
>```
>* Inject tag name and value cannot contain expression
>```html
>WRONG !!!
><inject name="{'myFirstComponent'}" value="first-component"></inject>
><inject name="myFirstComponent" value="{nameOfHtmlFile}"></inject>
>```
>* name should use camelCase
>```html
>WRONG !!!
><inject name="my-first-component" value="first-component"></inject>
>```
>* To inject javascript object value should start with @
>```html
>WRONG !!!
><inject name="myActions" value="@my-actions"></inject>
>```

### Children `$children`

Children are the components given by the parent component (Composite component) to be rendered in the component.

Lets take a look on example

```html
<!-- composite-component.html -->
<div>
    ...
    <first-component>
        <!-- start childrens of first component -->
        <h1>Hello World</h1>
        <label>This is a label</label>
        <!-- end childrens of first component -->
    </first-component> 
</div>
```
Above example, The composite-component.html define the children of first-component. Next in the first-component.html
we can place the children in using `$children` tag.

```html
<!-- first-component.html --> 
<div>
    Hello World
    <div $children></div>
</div>
```

Above code means that we are going to place the `children` given by the parent component into div tag.
#### *Rules on yallajs `$children`:*
>* When we define `$children` into a tag, the children will be included from the last index
> ```html 
> <!-- composite-component.html -->
> <div> 
>    ...
>    <first-component>
>        <!-- start childrens of first component -->
>        <h1>Hello World</h1>
>        <label>This is a label</label>
>        <!-- end childrens of first component -->
>    </first-component> 
> </div>
>
> <!-- first-component.html -->
> <div>
>    Hello World
>    <div $children>
>        <div>Label One</div>
>        <div>Label Two</div>
>    </div>
> </div>
> ```
Above code will render following in the browser.
```html
<div>
    Hello World
    <div>
        <div>Label One</div>
        <div>Label Two</div>
        <h1>Hello World</h1>
        <label>This is a label</label>
    </div>
</div>
```

Iterating array using `foreach`
--------------------
We can iterate an Array inside components by using `foreach` attribute. 
Foreach attribute value in yallajs components is similiar with javascript foreach statement : 
it is separated with in operator.
`foreach="item in array"`. 

For example :

```html
<div>
    <inject name="actions" value="@my-actions"></inject>
    <ul>
        <li foreach="item in actions.getItems()">
            {item.name}
        </li>
    </ul>
</div>
```
Above code means we iterate the array, results of function getItems in actions object.

We can get the index, and the array that we iterate by using as the second and third parameter.

```html
<div>
    <inject name="actions" value="@my-actions"></inject>
    <ul>
        <li foreach="item,index,array in actions.getItems()">
            No : {index+1} Name : {item.name}
        </li>
    </ul>
</div>
```

#### *Rules on yallajs `foreach` attribute:*
>
>* `foreach` attribute accepts string not `{expression}`
>```html
>WRONG !!!
><li foreach="{item in actions.getItems()}">
>```
>* First parameter is the currentValue, second is the index, thrid is the array
>```html
>CORRECT !!!
><li foreach="item,index,array in actions.getItems()">
>```

State Container with Redux
------
Yallajs is equiped state container redux. 
Redux is a predictable state container for JavaScript apps.

Inorder to understand Redux, you can follow this link

http://redux.js.org/docs/basics/

State container is a very powerfull tools in order to manage the application scalability. 

What is available in Yallajs Redux :

* Create Store using yalla.createStore.
* Combine Reducer using yalla.combineReducer.
* Applymiddleware using yalla.applyMiddleware.