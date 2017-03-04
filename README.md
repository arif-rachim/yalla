# yalla
Yalla js is a framework for building web applications that prioritize unidirectional data flow by using the concept of 
"stateless components" with "state container".

# 5 reasons why using yallajs
## 1. Homeground for stateless component


When you build stateless components, you just build a function that returns the UI template. So much simple you 
can easily understand because its just a function. There is no oneway binding or no two-way-binding. 
Its just a pure function that returns a UI template.

This is how we create a simple hello world component in yallajs

1. Create a js file name hello-world.js.
2. Spill out the jsonml code
```
function $render(){
    return ['div','hello world'];
}
```

Above function is returning jsonml template and produce hello world string in a div. 
On contrary above function is equal as following in React
```
import React from 'react';
class HelloWorld extends React.Component{
       
    render(){
        return <div>hello world</div>
    }
}
```
## 2. Framework with unidirectional the data flow
When you create components without the state, yallajs gives you the framework to manage your application state. 
Yallajs have its own micro redux version, which is enough to be used for building a solid application.

consider this to create your own store in yallajs
1. Create a js name my-store.js
2. Spill out the logic in the reducer


First we create a reducer function which set the new label when it received action.type 'changeLabel'.
```
function reducer(state,action){
 var newState = yalla.clone(state);
 if(action.type === 'changeLabel'){
    newState.label = action.label;
 }
 return newState; 
}
```
Second we create the store by passing the reducer and its initial state
```
var store = yalla.createStore(reducer,{label : 'hello world'});
```
Then we export the store by set it to $export variable
```
$export = store;
```

Yallajs microredux also support ```yalla.combineReducers``` and ```yalla.applyMiddleware```.

## 3. Routing, is just so simple
In yallajs your component can be directly routed.
## 4. Its fast without abusing memory

## 5. JSONML is lightweight and it feels so natural


In other words, with yallajs you build stateless functional components, with state container also known as store 
and routing management which based on package management,and templating using jsonml.
