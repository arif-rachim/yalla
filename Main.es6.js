'use strict';

let startTime;
let lastMeasure;
let startMeasure = function(name) {
    startTime = performance.now();
    lastMeasure = name;
}
let stopMeasure = function() {
    paint();
    let last = lastMeasure;
    if (lastMeasure) {
        window.setTimeout(function () {
            lastMeasure = null;
            let stop = performance.now();
            let duration = 0;
            console.log(last+" took "+(stop-startTime));
        }, 0);
    }
}

function _random(max) {
    return Math.round(Math.random()*1000)%max;
}

class Store {
    constructor() {
        this.data = [];
        this.backup = null;
        this.selected = null;
        this.id = 1;
    }
    buildData(count = 1000) {
        let adjectives = ["pretty", "large", "big", "small", "tall", "short", "long", "handsome", "plain", "quaint", "clean", "elegant", "easy", "angry", "crazy", "helpful", "mushy", "odd", "unsightly", "adorable", "important", "inexpensive", "cheap", "expensive", "fancy"];
        let colours = ["red", "yellow", "blue", "green", "pink", "brown", "purple", "brown", "white", "black", "orange"];
        let nouns = ["table", "chair", "house", "bbq", "desk", "car", "pony", "cookie", "sandwich", "burger", "pizza", "mouse", "keyboard"];
        let data = [];
        for (let i = 0; i < count; i++)
            data.push({id: this.id++, label: adjectives[_random(adjectives.length)] + " " + colours[_random(colours.length)] + " " + nouns[_random(nouns.length)] });
        return data;
    }
    updateData(mod = 10) {
        for (let i=0;i<this.data.length;i+=10) {
            this.data[i].label += ' !!!';
        }
    }
    delete(id) {
        const idx = this.data.findIndex(d => d.id==id);
        this.data = this.data.filter((e,i) => i!=idx);
        return this;
    }
    run() {
        this.data = this.buildData();
        this.selected = null;
    }
    add() {
        this.data = this.data.concat(this.buildData(1000));
        this.selected = null;
    }
    update() {
        this.updateData();
        this.selected = null;
    }
    select(id) {
        this.selected = id;
    }
    hideAll() {
        this.backup = this.data;
        this.data = [];
        this.selected = null;
    }
    showAll() {
        this.data = this.backup;
        this.backup = null;
        this.selected = null;
    }
    runLots() {
        this.data = this.buildData(10000);
        this.selected = null;
    }
    clear() {
        this.data = [];
        this.selected = null;
    }
    swapRows() {
        if(this.data.length > 10) {
            let a = this.data[4];
            this.data[4] = this.data[9];
            this.data[9] = a;
        }
    }
}

class Main {
    constructor(props) {
        this.store = new Store();
        this.select = this.select.bind(this);
        this.delete = this.delete.bind(this);
        this.add = this.add.bind(this);
        this.run = this.run.bind(this);
        this.update = this.update.bind(this);
        this.swapRows = this.swapRows.bind(this);
        this.clear = this.clear.bind(this);
        this.start = 0;
    }

    printDuration() {
        stopMeasure();
    }
    run() {
        startMeasure("run");
        this.store.clear();
        this.store.run();
        stopMeasure();
    }
    add() {
        startMeasure("add");
        this.store.add();
        stopMeasure();
    }
    update() {
        startMeasure("update");
        this.store.update();
        stopMeasure();
    }

    select(e) {
        let idx = e.target.getAttribute('data-id');
        startMeasure("select");
        this.store.select(idx);
        stopMeasure();
    }

    delete(e) {
        let idx = e.target.getAttribute('data-id');
        startMeasure("delete");
        this.store.delete(idx);
        stopMeasure();
    }

    runLots() {
        startMeasure("runLots");
        this.store.clear();
        this.store.runLots();
        stopMeasure();
    }
    clear() {
        startMeasure("clear");
        this.store.clear();
        requestAnimationFrame(() => {
            stopMeasure();
        });
    }
    swapRows() {
        startMeasure("swapRows");
        this.store.swapRows();
        stopMeasure();
    }
}

let main = new Main();
let {html,htmlCollection} = new Context();

let paint = () => {
    render(html`<div id='main'>
        <div class="container">
            <div class="jumbotron">
                <div class="row">
                    <div class="col-md-6">
                        <h1>YallaJS-"keyed"</h1>
                    </div>
                    <div class="col-md-6">
                        <div class="row">
                            <div class="col-sm-6 smallpad">
                                <button type='button' class='btn btn-primary btn-block' id='run' onclick="${main.run}">Create 1,000 rows</button>
                            </div>
                            <div class="col-sm-6 smallpad">
                                <button type='button' class='btn btn-primary btn-block' id='runlots' onclick="${main.runLots}">Create 10,000 rows</button>
                            </div>
                            <div class="col-sm-6 smallpad">
                                <button type='button' class='btn btn-primary btn-block' id='add' onclick="${main.add}">Append 1,000 rows</button>
                            </div>
                            <div class="col-sm-6 smallpad">
                                <button type='button' class='btn btn-primary btn-block' id='update' onclick="${main.update}">Update every 10th row</button>
                            </div>
                            <div class="col-sm-6 smallpad">
                                <button type='button' class='btn btn-primary btn-block' id='clear' onclick="${main.clear}">Clear</button>
                            </div>
                            <div class="col-sm-6 smallpad">
                                <button type='button' class='btn btn-primary btn-block' id='swaprows' onclick="${main.swapRows}">Swap Rows</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <table class="table table-hover table-striped test-data">
                <tbody id="tbody">
                    ${htmlCollection(main.store.data, 'id', data => {
        return html`<tr class="${main.store.selected == data.id ? 'danger' : '' }">
                            <td class="col-md-1">${data.id}</td>
                            <td class="col-md-4">
                                <a class="lbl" onclick="${main.select}" data-id="${data.id}">${data.label}</a>
                            </td>
                            <td class="col-md-1">
                                <a class="remove"><span class="glyphicon glyphicon-remove remove" aria-hidden="true" onclick="${main.delete}" data-id="${data.id}"></span></a>
                            </td>
                            <td class="col-md-6"></td>
                        </tr>`
    })}
                </tbody>
            </table>
            <span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true"></span>
        </div>
    </div>`, document.body);
};

paint();