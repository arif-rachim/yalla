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
```html
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
```html
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
```html
<div>The third result is {{ points[2] }}</div>
<script>
    var points = [1,15,19,2,40]
</script>
```
This will render : *The third result is 19*

***Same example using ```attribute.bind```***
```html
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

YallaJS component can accept properties from ***browser's address bar***, or from ***parent component***.

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

YallaJS components can be combined with other components (sub-components) to form more complex components or so-called ***composite-component***.

YallaJS ***composite-component*** uses the ```<inject>``` tag to inject *sub-component*.

YallaJS ```<inject>``` tag requires 2 mandatory properties,```from``` and ```name``` . ```from``` property contains the 
path (location) of sub-component. The ```name``` property contains the sub-component tag, to be used in the composite component.

Example :
```html
 .
 +-- index.html
 +-- /src
     +-- name-card.html 
     +-- john-doe.html 
```
Inside ***composite-component*** : name-card.html 

```html
<inject from="/john-doe" name="johndoe">
<div>
    Hello : <johndoe></johndoe>
</div>
```

Inside ***sub-component*** : john-doe.html
```html
<p>My name is John Doe</p>
```

We can call the ***composit-component*** name-card from the browser in the following way

```html
http://localhost:8080/index.html#name-card
```

Browser will render :
```html
<div>
    Hello : <p>My name is John Doe</p>
</div>
```

### Passing properties to sub-component.

YallaJS ***composit-component*** can also assign property value to the sub-components.

Following is an example:
 
 ```html
  .
  +-- index.html
  +-- /src
      +-- name-card.html 
      +-- first-last-name.html 
 ```

Inside ***composite-component*** : name-card.html 

```html
<inject from="/first-last-name" name="firstlast-name">
<div>
    Hello : <firstlast-name firstName="Jane" lastName="Roe"></firstlast-name>
</div>
```

Inside ***sub-component*** : first-last-name.html
```html
<p>My name is {{$firstName}} {{$lastName}}</p>
```

We can call the ***composit-component*** name-card from the browser in the following way

```html
http://localhost:8080/index.html#name-card
```

Browser will render :
```html
<div>
    Hello : <p>My name is Jane Roe</p>
</div>
```

## Content Projection

YallaJS content projection is the mechanism of including the content of sub-component from composite-component by reference.

YallaJS uses ```<slot-view>``` to include the content of sub-component.

The following is an example of using content projection in YallaJS :

```html
 .
 +-- index.html
 +-- /src
     +-- name-card.html 
     +-- john-doe.html 
```
Inside ***composite-component*** : name-card.html 

```html
<inject from="/john-doe" name="johndoe">
<div>
    Hello : 
    <johndoe>
        <div>My name is Jane Roe</div>
    </johndoe>
</div>
```

Inside ***sub-component*** : john-doe.html
```html
<div>
    <p>My name is John Doe</p>
    <slot-view></slot-view>
</div>
```

We can call the ***composit-component*** name-card from the browser in the following way

```html
http://localhost:8080/index.html#name-card
```

Browser will render :
```html
<div>
    Hello :
     <div>
        <p>My name is John Doe</p>
        <div>My name is Jane Roe</div>
    </div>
</div>
```

### Named Content Projection
YallaJS content-projection can be named so that sub-component can place content in desired location.

YallaJS content-projection in ***composite-component*** can be marked by using ```slot.name``` attribute.

YallaJS content-projection in ***sub-component*** can be marked by using ```<slot-view name="slotName">```

Following is an example of *named* ***content-projection*** usage :

```html
 .
 +-- index.html
 +-- /src
     +-- name-card.html 
     +-- john-doe.html 
```
Inside ***composite-component*** : name-card.html 

```html
<inject from="/john-doe" name="johndoe">
<div>
    Hello : 
    <johndoe>
        <div slot.name="title">Jane Roe</div>
        <div slot.name="address">Dubai Marina</div>
    </johndoe>
</div>
```

Inside ***sub-component*** : john-doe.html
```html
<div>
    <p>My name is John Doe</p>
    <div class="title-css">
        <slot-view name="title"></slot-view>
    </div>
    <div class="address-css">
        <slot-view name="address"></slot-view>
    </div>
</div>
```

We can call the ***composit-component*** name-card from the browser in the following way

```html
http://localhost:8080/index.html#name-card
```

Browser will render :
```html
<div>
    Hello :
     <div>
        <p>My name is John Doe</p>
        <div class="title-css">
            <div>Jane Roe</div>
        </div>
        <div class="address-css">
            <div>Dubai Marina</div>
        </div>
    </div>
</div>
```


## Listening on Component Event

YallaJS component can listen to event from dom by using ```eventname.trigger```.

YallaJS ```eventname.trigger``` is basically a wrapper against dom event listener ```oneventname```

Following is an example of usage ```eventname.trigger``` :

```html
 .
 +-- index.html
 +-- /src
     +-- name-card.html 
```
Inside name-card.html 

```html
<div>
    <input type="text" change.trigger="textChange(this)">
    <button click.trigger="helloWorld(event)">Hello World</button>
</div>
<script>
    function helloWorld(event){
        alert('Hello World');
    }
    
    function textChange(textInput){
        alert(textInput.value);
    }
</script>
```

## Publishing Component Event

YallaJS ***sub-component*** can publish events using ```$oneventname``` property. 

YallaJS ***composite-component*** can listen to an event using ```eventname.trigger```

Following is an example of publishing event :

```html
 .
 +-- index.html
 +-- /src
     +-- name-card.html 
     +-- john-doe.html 
```


Inside ***sub-component*** : john-doe.html
```html
<div>
    <p>My name is John Doe</p>
    <button click.trigger="jonDoeClicked($onMyEvent)">JOHN DOE CLICKED</button>
</div>
<script>
    function jonDoeClicked(onMyEvent){
        onMyEvent('John Doe Clicked');
    }
</script>
```

Inside ***composite-component*** : name-card.html 

```html
<inject from="/john-doe" name="johndoe">
<div>
    Hello : 
    <johndoe MyEvent.trigger="onCustomEventListener(event)"> </johndoe>
</div>
<script>
    function onCustomEventListener(event){
        alert(event);
    }
</script>
```

## Iterate array with Foreach

YallaJS component can render the array by using ```for.each``` attribute.

Following is an example of ```for.each``` usage :


```html
 .
 +-- index.html
 +-- /src
     +-- name-card.html 
```
Inside name-card.html 

```html
<div>
    <ul>
        <li for.each="person in people">
            {{ person.name }}
        </li>
    </ul>
</div>
<script>
    var people = [{name:'John Doe'},
                  {name:'Jane Doe'},
                  {name:'John Roe'},
                  {name:'Jane Roe'}]
</script>
```


## Conditional Rendering with if.bind

YallaJS component can use the ```if.bind``` attribute to determine whether the dom will be rendered or not.

YallaJS ```if.bind``` accept a boolean value

Following is an example of ```if.bind``` usage :


```html
 .
 +-- index.html
 +-- /src
     +-- name-card.html 
```
Inside name-card.html 

```html
<div>
    <button click.trigger="toggleShow()">Toggle</button>
    <div if.bind="showDom">Show if showDom == true</div>
</div>
<script>
    var showDom = false;
    
    function toggleShow() {
        showDom = !showDom;
        $patchChanges();
    }
</script>
```

## Repaint changes

YallaJS uses google incremental dom as library to create dom tree and update it.

YallaJS use commands ```$patchChanges``` to update the dom tree by incremental dom.

Following is an example of ```$patchChanges``` usage:


```html
 .
 +-- index.html
 +-- /src
     +-- name-card.html 
```
Inside name-card.html 

```html
<div>
    {{ currentTime }}
    <button click.trigger="startTimer()">Start</button>
</div>
<script>
    var currentTime = new Date();
    
    function startTimer(){
        setInterval(function(){
            currentTime = new Date();
            $patchChanges();
        },1000);
    }
</script>
```

## Asynchrounous Data Load
