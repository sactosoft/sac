var rowId = 1;
var selected = **;
var data = **[];

/*var benchmark = (fun, ...args) => {
	var start = performance.now();
	fun.apply(null, args);
	console.log(`${fun.name}: ${performance.now() - start}ms`);
};*/

var benchmark = (fun, args) => {
	var start = performance.now();
	fun.apply(null, [args]);
	console.log(`${fun.name}: ${performance.now() - start}ms`);
};

var run = () => *data = buildData(1000);

var runLots = () => *data = buildData(10000);

var add = () => *data.concat(buildData(1000));

var clear = () => *data = [];

var swapRows = () => {
	var swapped = *data.splice(1, 1, *data[998]);
	*data.splice(998, 1, ...swapped);
};

var select = id => *selected = id;

var remove = id => *data.splice(*data.findIndex(a => a.id == id), 1);

var _random = max => Math.round(Math.random() * 1000) % max;

var buildData = count => {
	var adjectives = ["pretty", "large", "big", "small", "tall", "short", "long", "handsome", "plain", "quaint", "clean", "elegant", "easy", "angry", "crazy", "helpful", "mushy", "odd", "unsightly", "adorable", "important", "inexpensive", "cheap", "expensive", "fancy"];
	var colors = ["red", "yellow", "blue", "green", "pink", "brown", "purple", "brown", "white", "black", "orange"];
	var nouns = ["table", "chair", "house", "bbq", "desk", "car", "pony", "cookie", "sandwich", "burger", "pizza", "mouse", "keyboard"];
	var data = [];
    for(var i = 0; i<count; i++) {
		data.push({id: rowId++, label: adjectives[_random(adjectives.length)] + " " + colors[_random(colors.length)] + " " + nouns[_random(nouns.length)]});
	}
	return data;
};

<:this>
	<div class="jumbotron">
		<div class="row">
			<div class="col-md-6">
				<h1>Sactory (keyed)</h1>
			</div>
			<div class="col-md-6">
				<div class="row">
					<div class="col-sm-6 smallpad">
						<button type="button" class="btn btn-primary btn-block" id="run" on:click={benchmark(run)}>Create 1,000 rows</button>
					</div>
					<div class="col-sm-6 smallpad">
						<button type="button" class="btn btn-primary btn-block" id="runlots" on:click={benchmark(runLots)}>Create 10,000 rows</button>
					</div>
					<div class="col-sm-6 smallpad">
						<button type="button" class="btn btn-primary btn-block" id="add" on:click={benchmark(add)}>Append 1,000 rows</button>
					</div>
					<div class="col-sm-6 smallpad">
						<button type="button" class="btn btn-primary btn-block" id="update" on:click={partialUpdate}>Update every 10th row</button>
					</div>
					<div class="col-sm-6 smallpad">
						<button type="button" class="btn btn-primary btn-block" id="clear" on:click={benchmark(clear)}>Clear</button>
					</div>
					<div class="col-sm-6 smallpad">
						<button type="button" class="btn btn-primary btn-block" id="swaprows" on:click={benchmark(swapRows)}>Swap Rows</button>
					</div>
				</div>
			</div>
		</div>
	</div>
	<table class="table table-hover table-striped test-data">
		<tbody>
			foreach(*data as row, num) {
				<tr class:danger=(*selected === row.id)>
 					<td class="col-md-1">${row.id}</td>
					<td class="col-md-4"><a on:click={benchmark(select,row.id)} ~text=row.label /></td>
					<td class="col-md-1"><a on:click={benchmark(remove,row.id)}><span class="glyphicon glyphicon-remove" aria-hidden="true"></span>&times;</a></td>
					<td class="col-md-6"></td>
				</tr>
			}
		</tbody>
	</table>
	<span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true"></span>
</:this>
