YallaJS
=======

*Build HTML Component with Zero Boilerplate*

Component in Yallajs is just an *HTML*, 
there is no need to create javascript controller. HTML Component in Yallajs basicly its just
a **stateless functional component**, it has the same features like react *stateless functional 
component*, which is *No Features at all*. However instead using javascript with render function 
and jsx, yallajs is using HTML file.

Yallajs is bundled with **its own state-container** inspired by Redux. Therefore, Yallajs enforce the 
component to remain stateles and work only in accordance to the state container.

Yallajs is equipped with routing and module management. Yallajs routing mechanism in very simple 
but quite powerful. Each component can be called directly from the browser address bar 
by using hashbang operator. If the component is invoked via the browser address bar, then these 
components function as a View, but when its being used as a component of a ***composite component***, then 
it works as a subcomponent.

Setup
---------
To setup yallajs application you can add following script tag in the head element in your index.html

```html
<script src="http://yallajs.io/yalla.js" data-main="first-component" data-base="src">
```
When importing yalla.js, we need to specify two attributes in the script tag : 
> 
>* data-main : This is the main component which will be called if there is no value in hashbang operator.
>* data-base : This is the base folder where we keep our source code.>

```
.
├── src
|   └── first-component.html
└── index.html
```
Creating first-component.html
-----------------------------
Inside first-component.html we can start writing our html code. 
```
<div>Hello World</div>
```

Now if we run index html from browser it should print Hello World.

When building yalla component, there are some rules that we need to follow :
* Component should only return single element.
* Script tag is not allowed (or yallajs will ignore them)

Yallajs is equiped with its own routing framework 

Therefore Component can be **called directly** from browser by using hashbang operator :
```
http://localhost:8080/index.html#first-component
```


`{expression}` with Bracket
-------------------------
We can use bracket to render simple expression. For example :
```
<div>What is 1 + 2 = {1+2} </div>
```

This will print in the browser *What is 1 + 2 = 3*

#### *Rules on yallajs `{expression}` :*

>
>* There should not be new line in the expression
>```
>WRONG !!!
><div>What is 1 + 2 = {1 
>                     + 2} </div>
>```
>* It doesn't accept function
> ```
> WRONG !!!
> <div>What is 1 + 2 = {function(){return 1 + 2}()} </div>
> ```
> * It should not contain bracket
> ```
> WRONG !!!
> <div>What is 1 + 2 = { {one : 1 + 2}.one } </div>
> ```


Following expression are valid

> * Ternary operator
> ```
> CORRECT !!
> <div>What is 1 + 2 = { (1 + 1) == 2 ? 'ITS TWO' : 'I DONT KNOW' } </div>
> ```
> * Calling actions method
> ```
> CORRECT !!
> <div>What is 1 + 2 = { actions.getTheResult(1+2) } </div>
> ```
> * Used in component attribute except 'style' attribute
> ```
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
```
<div>Hello {$props.firstName} {$props.lastName}</div>
```
Now if called the component from browser we can pass the properties **separated with colon**.
```
http://localhost:8080/index.html#first-component:firstName=Bruno:lastName=Mars
```
Or if we use them in composite component, we need to use **hyphen-case instead camelCase**.
```
<div>
    <first-component first-name="Bruno" last-name="Mars"></first-component>
</div>
```
Composite Component & Dependency Injection
--------------------
Lets create another component named 'composite-component'

```
.
├── src
|   ├── first-component.html
|   └── composite-component.html
└── index.html
```

Composite components are components formed from other small components. With composite 
components we can make bigger components with more feature in it. To include smaller components in 
composite components, we can use the `<inject>` tag.

The `<inject>` tag basicly is a dependency injection in Yallajs. We can inject a *component or an object*.

### To inject a component in composite component we can use following :
```
<div>
    <inject name="myFirstComponent" value="first-component"></inject>
</div>
```
* **name** : is the variable name, we should use **camelCase** for name attribute.
> When we want to use the component, we need to use hyphen-case instead camelCase. `<my-first-component>`
* **value** : is the javascript file name that we want to inject. If we want to inject an Object we need to add prefix "@" in it `<inject name="actions" value="@actions-object">`

>Inside our composite component we can use firstComponent with *hyphen-case instead camelCase*
```
<div>
    <inject name="myFirstComponent" value="first-component"></inject>
    <my-first-component first-name="Bruno" last-name="Mars"></my-first-component>
</div>
```

#### *Rules on yallajs `inject` tag:*
>
>* Inject tag should have attribute name and value
>```
>WRONG !!!
><inject var="myFirstComponent" value="first-component"></inject>
>```
>* Inject tag name and value cannot contain expression
>```
>WRONG !!!
><inject name="{'myFirstComponent'}" value="first-component"></inject>
><inject name="myFirstComponent" value="{nameOfHtmlFile}"></inject>
>```


### \<inject\> and $inject
#### inject a component
#### inject an object
### Iterate Array
#### foreach
### Component Composition / $children