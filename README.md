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
Note : ini adalah Stateless functional Component react yg baru saja dirilis sejak versi 0.14.0


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
 
### Expression with Double Curly Braces
### Routing component in Address Bar
### SubRouting component in Address Bar
### Accessing Parameter with $
### Component Dependency Injection
### Content Projection
### Named Content Projection
### Listening on Component Event
### Publishing Component Event
### Binding attribute with value
### Iterate array with Foreach
### Repaint changes
### Conditional Rendering with if.bind
### Asynchrounous Data Load
