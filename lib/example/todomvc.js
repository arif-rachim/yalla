'use strict';

var _templateObject = _taggedTemplateLiteral(['\n    <div style="display:', '">\n        <section class="home">\n            <h1>Hello World !</h1>\n            <h2>We have been busy with Yallajs 2.0 codename <span class="bellona">Bellona</span></h2>\n            <p>We\'ve managed to find the newest way of <span style="color: mediumvioletred;font-style: italic;font-weight: bold">breaking all the records we\'ve created</span>. YallaJS 2.0 is lighter, easier to learn, and much faster.</p>\n            <p>YallaJS 2.0 will be released shortly and we are very proud of the progress we have done.</p>\n            <p>This website is built with yallajs 2.0, while we work to improve this framework, enjoy the <a href="#" onclick="', '">Todomvc App</a> created using <span class="bellona">Bellona</span>.</p>\n        </section>\n    </div>\n    <div style="display:', '">\n        <section class="todoapp">\n\t\t\t<header class="header">\n\t\t\t\t<h1 onclick="', '">Yalla !</h1>\n\t\t\t\t<input class="new-todo" placeholder="What needs to be done?" autofocus onkeyup="', '">\n\t\t\t</header>\n\t\t\t<section class="main">\n\t\t\t\t<input class="toggle-all" type="checkbox" onclick="', '">\n\t\t\t\t<label for="toggle-all">Mark all as complete</label>\n\t\t\t\t<ul class="todo-list">\n\t\t\t\t    ', '\n                </ul>\n\t\t\t</section>\n\t\t\t<footer class="footer" style="display: block">\n\t\t\t\t<span class="todo-count">\n\t\t\t\t    <strong>', '</strong>\n\t\t\t\t    item', ' left\n                </span>\n\t\t\t\t<ul class="filters">\n\t\t\t\t\t<li>\n\t\t\t\t\t\t<a href="#/" onclick="', '" data-type="all" class="', '">All</a>\n\t\t\t\t\t</li>\n\t\t\t\t\t<li>\n\t\t\t\t\t\t<a href="#/" onclick="', '" data-type="active" class="', '">Active</a>\n\t\t\t\t\t</li>\n\t\t\t\t\t<li>\n\t\t\t\t\t\t<a href="#/" onclick="', '" data-type="completed" class="', '">Completed</a>\n\t\t\t\t\t</li>\n\t\t\t\t</ul>\n\t\t\t\t<button class="clear-completed" onclick="', '">Clear completed</button>\n\t\t\t</footer>\n\t\t</section>\n\t\t<footer class="info">\n\t\t\t<p>Double-click to edit a todo</p>\n\t\t\t<p>Created by <a href="https://github.com/yallajs">Arif Rachim YallaJS</a></p>\n\t\t</footer>\n        \n    </div>\n'], ['\n    <div style="display:', '">\n        <section class="home">\n            <h1>Hello World !</h1>\n            <h2>We have been busy with Yallajs 2.0 codename <span class="bellona">Bellona</span></h2>\n            <p>We\'ve managed to find the newest way of <span style="color: mediumvioletred;font-style: italic;font-weight: bold">breaking all the records we\'ve created</span>. YallaJS 2.0 is lighter, easier to learn, and much faster.</p>\n            <p>YallaJS 2.0 will be released shortly and we are very proud of the progress we have done.</p>\n            <p>This website is built with yallajs 2.0, while we work to improve this framework, enjoy the <a href="#" onclick="', '">Todomvc App</a> created using <span class="bellona">Bellona</span>.</p>\n        </section>\n    </div>\n    <div style="display:', '">\n        <section class="todoapp">\n\t\t\t<header class="header">\n\t\t\t\t<h1 onclick="', '">Yalla !</h1>\n\t\t\t\t<input class="new-todo" placeholder="What needs to be done?" autofocus onkeyup="', '">\n\t\t\t</header>\n\t\t\t<section class="main">\n\t\t\t\t<input class="toggle-all" type="checkbox" onclick="', '">\n\t\t\t\t<label for="toggle-all">Mark all as complete</label>\n\t\t\t\t<ul class="todo-list">\n\t\t\t\t    ', '\n                </ul>\n\t\t\t</section>\n\t\t\t<footer class="footer" style="display: block">\n\t\t\t\t<span class="todo-count">\n\t\t\t\t    <strong>', '</strong>\n\t\t\t\t    item', ' left\n                </span>\n\t\t\t\t<ul class="filters">\n\t\t\t\t\t<li>\n\t\t\t\t\t\t<a href="#/" onclick="', '" data-type="all" class="', '">All</a>\n\t\t\t\t\t</li>\n\t\t\t\t\t<li>\n\t\t\t\t\t\t<a href="#/" onclick="', '" data-type="active" class="', '">Active</a>\n\t\t\t\t\t</li>\n\t\t\t\t\t<li>\n\t\t\t\t\t\t<a href="#/" onclick="', '" data-type="completed" class="', '">Completed</a>\n\t\t\t\t\t</li>\n\t\t\t\t</ul>\n\t\t\t\t<button class="clear-completed" onclick="', '">Clear completed</button>\n\t\t\t</footer>\n\t\t</section>\n\t\t<footer class="info">\n\t\t\t<p>Double-click to edit a todo</p>\n\t\t\t<p>Created by <a href="https://github.com/yallajs">Arif Rachim YallaJS</a></p>\n\t\t</footer>\n        \n    </div>\n']),
    _templateObject2 = _taggedTemplateLiteral(['\n                        <li class="', '">\n                            <div class="view">\n                                <input class="toggle" type="checkbox" checked="', '" onchange="', '" data-index="', '">\n                                <label ondblclick="', '" data-index="', '">', '</label>\n                                <button class="destroy" onclick="', '" data-key="', '"></button>\n                            </div>\n                            ', '\n                        </li>\n                        '], ['\n                        <li class="', '">\n                            <div class="view">\n                                <input class="toggle" type="checkbox" checked="', '" onchange="', '" data-index="', '">\n                                <label ondblclick="', '" data-index="', '">', '</label>\n                                <button class="destroy" onclick="', '" data-key="', '"></button>\n                            </div>\n                            ', '\n                        </li>\n                        ']),
    _templateObject3 = _taggedTemplateLiteral(['<input class="edit" value="', '" onkeyup="', '" data-index="', '">'], ['<input class="edit" value="', '" onkeyup="', '" data-index="', '">']),
    _templateObject4 = _taggedTemplateLiteral([''], ['']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

function getItemFromStorage(key, defaultVal) {
    var item = localStorage.getItem(key);
    if (item) {
        item = JSON.parse(item);
    }
    return item || defaultVal;
}

function saveItemToStorage(key, item) {
    "use strict";

    localStorage.setItem(key, JSON.stringify(item));
}

var todos = getItemFromStorage('todos', []);
var state = getItemFromStorage('state', {
    showTodoMvc: false,
    toggle: 'all'
});

function patchUpdate() {
    saveItemToStorage('todos', todos);
    saveItemToStorage('state', state);
    render(app(), document.getElementById('root'));
}

function openTodoMvc() {
    state.showTodoMvc = true;
    patchUpdate();
}

function backToHome() {
    state.showTodoMvc = false;
    patchUpdate();
}
function onkeyup(e) {

    if (e.key == 'Enter') {
        var todo = e.target.value;
        var alreadyExist = false;
        todos.forEach(function (t) {
            if (t.todo == todo) {
                alreadyExist = true;
            }
        });
        if (alreadyExist) {
            alert('"' + todo + '" already exist');
            return;
        }
        todos.push({ todo: todo, completed: false, editing: false });
        e.target.value = '';
        patchUpdate();
    }
    return false;
}
function deleteThis(e) {
    var key = e.target.getAttribute('data-key');
    todos.forEach(function (t, index) {
        if (t.todo == key) {
            todos.splice(index, 1);
        }
    });
    patchUpdate();
}

function checkboxChange(e) {
    var index = parseInt(e.target.getAttribute('data-index'));
    todos[index].completed = e.target.checked;
    patchUpdate();
}
function selectionChange(e) {
    state.toggle = e.target.getAttribute('data-type');
    patchUpdate();
}
function clearCompleted(e) {
    todos.forEach(function (t) {
        return t.completed = false;
    });
    patchUpdate();
}

function toggleCompletion(e) {
    todos.forEach(function (t) {
        return t.completed = e.target.checked;
    });
    patchUpdate();
}
function editTodo(e) {
    var index = parseInt(e.target.getAttribute('data-index'));
    todos[index].editing = true;
    patchUpdate();
}

function updateTodo(e) {
    if (e.key == 'Enter') {
        var index = parseInt(e.target.getAttribute('data-index'));
        todos[index].todo = e.target.value;
        todos[index].editing = false;
        patchUpdate();
    }
}

var app = function app() {
    return html(_templateObject, state.showTodoMvc ? 'none' : 'block', openTodoMvc, state.showTodoMvc ? 'block' : 'none', backToHome, onkeyup, toggleCompletion, htmlMap(todos.filter(function (t) {
        return state.toggle == 'active' ? !t.completed : state.toggle == 'completed' ? t.completed : true;
    }), 'todo', function (todo, index) {
        return html(_templateObject2, todo.editing ? 'editing' : todo.completed ? 'completed' : '', todo.completed, checkboxChange, index, editTodo, index, todo.todo, deleteThis, todo.todo, todo.editing ? html(_templateObject3, todo.todo, updateTodo, index) : html(_templateObject4));
    }), todos.filter(function (i) {
        return !i.completed;
    }).length > 0 ? todos.filter(function (i) {
        return !i.completed;
    }).length : 'No', todos.filter(function (i) {
        return !i.completed;
    }).length > 1 ? 's' : '', selectionChange, state.toggle == 'all' ? 'selected' : '', selectionChange, state.toggle == 'active' ? 'selected' : '', selectionChange, state.toggle == 'completed' ? 'selected' : '', clearCompleted);
};

patchUpdate();