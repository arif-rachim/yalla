'use strict';

var startTime;
var lastMeasure;
var startMeasure = function(name) {
    startTime = performance.now();
    lastMeasure = name;
}

var stopMeasure = function() {
    var last = lastMeasure;
    if (lastMeasure) {
        window.setTimeout(function () {
            lastMeasure = null;
            var stop = performance.now();
            var duration = 0;
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

        var adjectives = ["pretty", "large", "big", "small", "tall", "short", "long", "handsome", "plain", "quaint", "clean", "elegant", "easy", "angry", "crazy", "helpful", "mushy", "odd", "unsightly", "adorable", "important", "inexpensive", "cheap", "expensive", "fancy"];
        var colours = ["red", "yellow", "blue", "green", "pink", "brown", "purple", "brown", "white", "black", "orange"];
        var nouns = ["table", "chair", "house", "bbq", "desk", "car", "pony", "cookie", "sandwich", "burger", "pizza", "mouse", "keyboard"];
        var data = [];
        for (var i = 0; i < count; i++)
            data.push({id: this.id++, label: adjectives[_random(adjectives.length)] + " " + colours[_random(colours.length)] + " " + nouns[_random(nouns.length)] });

        return data;
    }
    updateData(mod = 10) {
        for (let i=0;i<this.data.length;i+=10) {
            this.data[i].label += ' !!!';
            // this.data[i] = Object.assign({}, this.data[i], {label: this.data[i].label +' !!!'});
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
            var a = this.data[4];
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
        this.runLots = this.runLots.bind(this);
        this.update = this.update.bind(this);
        this.clear = this.clear.bind(this);
        this.swapRows = this.swapRows.bind(this);
        this.start = 0;
        this.tbody = document.getElementById("tbody");
    }

    printDuration() {
        stopMeasure();
    }
    run() {
        startMeasure("run");
        this.store.clear();
        this.store.run();
        updateDisplay();
        this.unselect();
        stopMeasure();
    }
    add() {
        startMeasure("add");
        this.store.add();
        updateDisplay();
        stopMeasure();
    }
    update() {
        startMeasure("update");
        this.store.update();
        updateDisplay();
        stopMeasure();
    }
    unselect() {
        // if (this.selectedRow !== undefined) {
        //     this.selectedRow.className = "";
        //     this.selectedRow = undefined;
        // }
    }
    select(e) {
        let idx = e.currentTarget.getAttribute('data-id');
        startMeasure("select");
        this.unselect();
        this.store.select(idx);
        // this.selectedRow = this.rows[idx];
        // this.selectedRow.className = "danger";
        stopMeasure();
    }

    delete(e) {
        let idx = e.currentTarget.getAttribute('data-id');
        startMeasure("delete");
        this.store.delete(idx);
        updateDisplay();
        this.unselect();
        stopMeasure();
    }

    runLots() {
        startMeasure("runLots");
        this.store.clear();
        this.data = [];
        this.store.runLots();
        updateDisplay();
        this.unselect();
        stopMeasure();
    }
    clear() {
        startMeasure("clear");
        this.store.clear();
        updateDisplay();
        requestAnimationFrame(() => {
            this.unselect();
            stopMeasure();
        });
    }
    swapRows() {
        startMeasure("swapRows");
        if (this.store.data.length>10) {
            this.store.swapRows();
        }
        updateDisplay();
        stopMeasure();
    }

}
let main = new Main();

let app = () => html`
    <div class="container">
        <div class="jumbotron">
            <div class="row">
                <div class="col-md-6">
                    <h1>YallaJS-"keyed"</h1>
                </div>
                <div class="col-md-6">
                    <div class="row">
                        <div class="col-sm-6 smallpad">
                            <button type='button' class='btn btn-primary btn-block' id="run" onclick="${main.run}">Create 1,000 rows</button>
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
                ${htmlCollection(main.store.data,'id',(data, index) => cache('key').html`<tr>
                        <td class="col-md-1">${data.id}</td>
                        <td class="col-md-4">
                            <a class="lbl" onclick="${main.select}" data-id="${data.id}">${data.label}</a>
                        </td>
                        <td class="col-md-1">
                            <a class="remove" onclick="${main.delete}" data-id="${data.id}">
                                <span class="glyphicon glyphicon-remove remove" aria-hidden="true"></span>
                            </a>
                        </td>
                        <td class="col-md-6"></td>
                    </tr>`)}
            </tbody>
        </table>
        <span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true"></span>
    </div>
`;

function updateDisplay(){
    render(app(),document.getElementsByTagName('body')[0]);
}

updateDisplay();

