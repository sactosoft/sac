var value = &"b";

<:this>
	<button +click={*value="b"}>reset</button>
	<hr />
	<input value="a" *radio=value /> A
	<input value="b" *radio=value /> B
	<input value="c" *radio=value /> C
	<input value="d" *radio=value /> D
	<hr />
	${*value}
</:this>