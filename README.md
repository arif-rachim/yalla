YallaJS
=======
*Zero Boilerplate WebApp*

[![IMAGE ALT TEXT HERE](http://img.youtube.com/vi/NpRFvL6wTfU/0.jpg)](https://www.youtube.com/watch?v=NpRFvL6wTfU)

YallaJS is a Front End framework for building Zero Boilerplate WebApp . 
This means that when you create an application with components in yallajs, 
you will not feel learning new things because you already understand html javascript 
and css.

Let's take a simple case:

You want to create a reusable component named ```name-card```.

You want the ```name-card``` component to have properties such as firstName, lastName, custom event (nameClick) and
a content projection.

This is the pseudo code of your reusable component look like:

```html
<name-card firstName="John" lastName="Doe" onNameClick="doSomething()">
    <img src="...">
</name-card>
```

Following the implementation of above component in different frameworks  :

# 1. Angular

```html
import {Component, View} from "angular2/core";
@Component({
   selector: 'name-card'
})
@View({
  template: `<div>
         <label (click)="handleClick()">
           {{firstName}} {{secondName}}
         </label>  
         <content></content>
      </div>`
})
export class NameCardClass {
    @Input()
    firstName : string;
    @Input()
    lastName : string;
    @Output()
    nameClick : EventEmitter = new EventEmitter();
    handleClick(){
        this.nameClick.emit();
    }
}
```
*23 lines*

# 2. Polymer

```html
<dom-module id="name-card">
  <template>
  <div>
    <label on-click="handleClick">
      {{firstName}} {{secondName}}
    </label>  
    <content></content>
  </div>
  </template>
  <script>
    HTMLImports.whenReady(function () {
      Polymer({
        is: 'name-card',
        handleClick : function(e,detail){
            this.fire('NameClick');
        }
      });
    });
  </script>
</dom-module>
```
*20 lines*

# 3. Vue

```html
Vue.component('name-card', {
  template : '<div>
                  <label v-on:click="handleClick" >
                    {{firstName}} {{secondName}}
                  </label>  
                  <slot></slot>
                </div>',
    method : {
        handleClick:function(){
            this.$emit('nameClick');
        }
    }
})
```
13 lines


# 4. React

```jsx
function NameCard(props) {
    render() {
        return (<div>
             <label onClick={props.onNameClick}>
               {props.firstName} {props.secondName}
             </label>  
             {props.children}
        </div>);
  }
}
```
*10 lines*
This is Stateless functional Component react which has just been released since version 0.14.0


# 5. Yalla

```html
<div>
    <label click.trigger="$onNameClick(event)">
        {{$firstName}} {{$secondName}}
    </label>
    <slot-view></slot-view>
</div>
```
6 lines.

If you look at the comparison of the 5 framework above we can see, yallajs does not have any boilerplate at all.

YallaJS is in the library not in your code.
 
 We strongly encourage you to follow the tutorial on how to create a contact manager application with yallajs to get a clear picture of YallaJS.
 
### Installation And Setup

To install yallajs you can type the following in the command line

```bat
npm install -g yallajs
```

After successful installation, you can call the compiler by typing ```yalla```
From the command line.
 
## YallaJS Expression

YallaJS expressions can be written inside double braces : ```{{expression}}```.

YallaJS expressions can also be written inside  ```attribute.bind="expression"```.

YallaJS will resolve the expression, and return the result exactly where the expression is written.

**YallaJS expresions** are much like **JavaScript expressions**: They can contain literals, operators and variables.
 
 Example :
 
```html
<div>
    <p>My first expression : {{ 5 + 5 }}</p>
</div>
```

This will print : *My first expression : 10* 

### YallaJS Numbers 
YallaJS numbers are like JavaScript numbers
```html
<div>
    <p>Total in dollar : {{ quantity * cost }}</p>
</div>
<script>
    var quantity = 1;
    var cost = 5;
</script>
```

This will print : *Total in dollar : 5*

***Same example using ```attribute.bind```***
```html
<input type="text" value.bind="quantity * cost">
<script>
    var quantity = 1;
    var cost = 5;
</script>    
```
This will render : <input type="text" value="5">

### YallaJS Strings
YallaJS strings are like JavaScript strings :
```
<div> The name is {{ firstName + ' ' + lastName }} </div>
<script>
    var firstName = "John";
    var lastName = "Doe";
</script>
```
This will render : *The name is John Doe*

***Same example using ```attribute.bind```***

```html
<input type="text" value.bind="firstName+' '+lastName">
<script>
    var firstName = "John";
    var lastName = "Doe";
</script>
```
This will render : <input type="text" value="John Doe">

### YallaJS Objects
YallaJS objects are like JavaScript Objects :
```
<div>The name is {{ person.lastName }} </div>
<script>
    var person = {firstName : 'John',lastName : 'Doe'}
</scrip>
```
This will render : *The name is Doe*

***Same example using ```attribute.bind```***

```html
<input type="text" value.bind="person.lastName">
<script>
    var person = {firstName : 'John',lastName : 'Doe'}
</script>
```

This will render
<input type="text" value="Doe">
### YallaJS Arrays
YallaJS arrays are like JavaScript arrays :
```
<div>The third result is {{ points[2] }}</div>
<script>
    var points = [1,15,19,2,40]
</script>
```
This will render : *The third result is 19*

***Same example using ```attribute.bind```***
```
<input type="text" value.bind="points[2]">
<script>
    var points = [1,15,19,2,40]
</script>
```
This will render : <input type="text" value="19">

### YallaJS Expressions vs. JavaScript Expressions
Like JavaScript expressions, YallaJS expressions can contain literals, operators, and variables.

Unlike JavaScript expressions, YallaJS expressions can be written inside HTML.

YallaJS expressions do not support conditionals, loops, and exceptions, while JavaScript expressions do.

## Calling a component from browser's address bar

YallaJS components can be accessed through the browser address bar using ```#```.

YallaJS components that are in the folder can be accessed using dot ```.```

Example :
```html
 .
 +-- index.html
 +-- /src
     +-- name-card.html 
```
To display the name-card in the browser we can call in the following way
```textmate
http://localhost:8080/index.html#name-card
```

Examples : call components that are inside a folder using ```.```

```html
 .
 +-- index.html
 +-- /src
     +-- /comp
        +-- rooster-grid.html
```
To display the rooster-grid in the browser we can call by typing 
```
http://localhost:8080/index.html#comp.rooster-grid
```

```html
 .
 +-- index.html
 +-- /src
     +-- /comp
         +-- /comp-name
             +-- another-comp.html
 
```
To display the rooster-grid in the browser we can call by typing 
```textmate
http://localhost:8080/index.html#comp.comp-name.rooster-grid
```

## Chaining sub-components from the browser's address bar
YallaJS can chain sub-components that are called through the browser's address bar by using a separator ```/```

YallaJS component uses ```<slot-view>``` to display sub-components that are called through the browser address bar.


Example :

src/hello.html :
```html
<div>
    <p>Hello :</p>
    <slot-view></slot-view>
</div>
```

src/john-doe.html :
```html
<p>John Doe</p>
```

*The folder structure is as follows :*
```html
 .
 +-- index.html
 +-- /src
     +-- hello.html
     +-- john-doe.html
 
```

We can chain the ```hello``` component and ```john-doe``` component via the browser address bar in the following way :

```html
http://localhost:8080/index.html#hello/john-doe
```

Then the browser will render as follows :
```html
<div>
    <p>Hello :</p>
    <p>John Doe</p>
</div>
```

### Example if we want to chain components that are in sub-folders


/src/comp/myname-is.html
```html
<p>My Name is : </p>
<slot-view></slot-view>
```

```html
 .
 +-- index.html
 +-- /src
     +-- hello.html
     +-- john-doe.html
     +-- /comp
         +-- myname-is.html
 
```

We can chain the ```hello``` component, the ```comp.myname-is``` component and the ```john-doe``` component in the following way :

```html
http://localhost:8080/index.html#hello/comp.myname-is/john-doe
```
Then the browser will render :
```html
<div>
    <p>Hello :</p>
    <p>My Name is :</p>
    <p>John Doe</p>
</div>
```

## Accessing component properties using prefix $

YallaJS component can accept properties from ***browser's address bar***, or from ***parent komponent***.

YallaJS component uses ```$propsName``` to access the value of the property.

YallaJS uses the ```:``` to separate properties.


Example :
/src/name-card.html
```html
<div>
    My name is : {{ $firstName +' '+ $lastName }}
</div>
```

We can call name-card with firstName and lastName properties in the following way from browser's address bar :

```html
http://localhost:8080/index.html#name-card:firstName=John:lastName=Doe
```

The browser will render the output as follows :
```html
<div>
    My name is : John Doe
</div>
```
## Component Dependency Injection
## Content Projection
## Named Content Projection
## Listening on Component Event
## Publishing Component Event
## Binding attribute with value
## Iterate array with Foreach
## Repaint changes
## Conditional Rendering with if.bind
## Asynchrounous Data Load
