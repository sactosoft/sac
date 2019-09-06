var pressed = &false;

document.$$on("mousedown", () => *pressed = true);
document.$$on("mouseup", () => *pressed = false);

var id, timeout = &33;
var rows = [];

// init cell states to `false`
for(var i=0; i<128; i++) {
	var row = [];
	for(var j=0; j<128; j++) {
		row.push(&false);
	}
	rows.push(row);
}

// fill cells randomly
function fill() {
	rows.forEach(row => row.forEach(cell => *cell = Math.random() > .5));
}

function start() {
	var newRows = [];
	rows.forEach((row, i) => {
		var newRow = [];
		row.forEach((cell, j) => {
			var value = *cell;
			var count = 0;
			var get = row => {
				if(j > 0 && *(row[j - 1])) count++;
				if(*(row[j])) count++;
				if(j < row.length - 1 && *(row[j + 1])) count++;
			};
			// count neighbours
			if(i > 0) get(rows[i - 1]);
			get(row);
			if(i < rows.length - 1) get(rows[i + 1]);
			// check new status
			if(value) {
				count--; // active cell should not be counted as neighbour
				value = count == 2 || count == 3; // underpopulation / overpopulation
			} else {
				// reproduction
				value = count == 3;
			}
			newRow.push(value);
		});
		newRows.push(newRow);
	});
	// update state of cells with new values
	newRows.forEach((newRow, i) => {
		newRow.forEach((value, j) => {
			*(rows[i][j]) = value;
		});
	});
	id = setTimeout(start, *timeout);
}

function stop() {
	clearInterval(id);
}

// render
<:this>
	<style :scoped>
		table {
			border-collapse: collapse;
			td {
				width: 4px;
				height: 4px;
				padding: 0;
				&.alive {
					background: black;
				}
			}
		}
	</style>
	<button +click=fill>fill</button>
	<button +click=start>start</button>
	<button +click=stop>stop</button>
	<input *number=timeout />
	<hr />
	<table>
		foreach(rows as row) {
			<tr>
				foreach(row as cell) {
					<td ~class:alive=*cell +click={*cell=true} +mouseenter={if(*pressed)*cell=true} />
				}
			</tr>
		}
	</table>
</:this>
