
function getItemFromStorage(key,defaultVal){
    let item = localStorage.getItem(key);
    if(item){
        item = JSON.parse(item);
    }
    return item || defaultVal;
}

function saveItemToStorage(key,item){
    "use strict";
    localStorage.setItem(key,JSON.stringify(item));
}

let todos = getItemFromStorage('todos',[]);
let state = getItemFromStorage('state',{
    showTodoMvc : false,
    toggle : 'all'
});

function patchUpdate(){
    saveItemToStorage('todos',todos);
    saveItemToStorage('state',state);
    render(app(),document.getElementById('root'));
}

function openTodoMvc(){
    state.showTodoMvc = true;
    patchUpdate();
}

function backToHome(){
    state.showTodoMvc = false;
    patchUpdate();
}
function onkeyup(e){

    if(e.key == 'Enter'){
        let todo = e.target.value;
        let alreadyExist = false;
        todos.forEach(t =>{
            if(t.todo == todo){
                alreadyExist = true;
            }
        });
        if(alreadyExist){
            alert(`"${todo}" already exist`);
            return;
        }
        todos.push({todo:todo,completed:false,editing:false});
        e.target.value = '';
        patchUpdate();
    }
    return false;
}
function deleteThis(e){
    let key = e.target.getAttribute('data-key');
    todos.forEach((t,index) => {
        if(t.todo == key){
            todos.splice(index,1);
        }
    });
    patchUpdate();
}

function checkboxChange(e){
    let index = parseInt(e.target.getAttribute('data-index'));
    todos[index].completed = e.target.checked;
    patchUpdate();
}
function selectionChange(e){
    state.toggle = e.target.getAttribute('data-type');
    patchUpdate();

}
function clearCompleted(e){
    todos.forEach(t => t.completed = false);
    patchUpdate();
}

function toggleCompletion(e){
    todos.forEach(t => t.completed = e.target.checked);
    patchUpdate();
}
function editTodo(e){
    let index = parseInt(e.target.getAttribute('data-index'));
    todos[index].editing = true;
    patchUpdate();
}

function updateTodo(e) {
    if(e.key == 'Enter'){
        let index = parseInt(e.target.getAttribute('data-index'));
        todos[index].todo = e.target.value;
        todos[index].editing = false;
        patchUpdate();
    }
}

var app = () => html`
    <div style="display:${state.showTodoMvc ? 'none' : 'block' }">
        <section class="home">
            <h1>Hello World !</h1>
            <h2>We have been busy with Yallajs 2.0 codename <span class="bellona">Bellona</span></h2>
            <p>We've managed to find the newest way of <span style="color: mediumvioletred;font-style: italic;font-weight: bold">breaking all the records we've created</span>. YallaJS 2.0 is lighter, easier to learn, and much faster.</p>
            <p>YallaJS 2.0 will be released shortly and we are very proud of the progress we have done.</p>
            <p>This website is built with yallajs 2.0, while we work to improve this framework, enjoy the <a href="#" onclick="${openTodoMvc}">Todomvc App</a> created using <span class="bellona">Bellona</span>.</p>
        </section>
    </div>
    <div style="display:${state.showTodoMvc ? 'block' : 'none'}">
        <section class="todoapp">
			<header class="header">
				<h1 onclick="${backToHome}">Yalla !</h1>
				<input class="new-todo" placeholder="What needs to be done?" autofocus onkeyup="${onkeyup}">
			</header>
			<section class="main">
				<input class="toggle-all" type="checkbox" onclick="${toggleCompletion}">
				<label for="toggle-all">Mark all as complete</label>
				<ul class="todo-list">
				    ${htmlMap(todos.filter(t => state.toggle == 'active' ? !t.completed : state.toggle == 'completed' ? t.completed : true),'todo',(todo,index) => {
                        return html`
                        <li class="${todo.editing ? 'editing' : todo.completed ? 'completed' : ''}">
                            <div class="view">
                                <input class="toggle" type="checkbox" checked="${todo.completed}" onchange="${checkboxChange}" data-index="${index}">
                                <label ondblclick="${editTodo}" data-index="${index}">${todo.todo}</label>
                                <button class="destroy" onclick="${deleteThis}" data-key="${todo.todo}"></button>
                            </div>
                            ${todo.editing ? html`<input class="edit" value="${todo.todo}" onkeyup="${updateTodo}" data-index="${index}">` : html``}
                        </li>
                        `
                    })}
                </ul>
			</section>
			<footer class="footer" style="display: block">
				<span class="todo-count">
				    <strong>${todos.filter(i => !i.completed).length > 0 ? todos.filter(i => !i.completed).length : 'No'}</strong>
				    item${todos.filter(i => !i.completed).length > 1 ? 's' : ''} left
                </span>
				<ul class="filters">
					<li>
						<a href="#/" onclick="${selectionChange}" data-type="all" class="${state.toggle == 'all' ? 'selected' : ''}">All</a>
					</li>
					<li>
						<a href="#/" onclick="${selectionChange}" data-type="active" class="${state.toggle == 'active' ? 'selected' : ''}">Active</a>
					</li>
					<li>
						<a href="#/" onclick="${selectionChange}" data-type="completed" class="${state.toggle == 'completed' ? 'selected' : ''}">Completed</a>
					</li>
				</ul>
				<button class="clear-completed" onclick="${clearCompleted}">Clear completed</button>
			</footer>
		</section>
		<footer class="info">
			<p>Double-click to edit a todo</p>
			<p>Created by <a href="https://github.com/yallajs">Arif Rachim YallaJS</a></p>
		</footer>
        
    </div>
`;

patchUpdate();