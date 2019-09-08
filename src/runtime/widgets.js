var SactoryObservable = require("./observable");
var SactoryWidget = require("./widget");
var counter = require("./counter");

var Sactory = {};

/**
 * @since 0.135.0
 */
Sactory.classes = function(){
	var classes = Array.prototype.slice.call(arguments, 0);
	return function(arg0, arg1, {element, bind}){
		var builder = element["~builder"];
		classes.forEach(className => builder.className(className, bind));
		return element;
	};
};

Sactory.widgets = {};

function add(name, value, register) {
	Object.defineProperty(Sactory.widgets, name, {value});
	if(register) {
		SactoryWidget.addWidget(name, value, false);
	}
}

/**
 * @since 0.134.0
 */
function documentFragment(arg0, arg1, context) {
	return (context.document || document).createDocumentFragment();
}

/**
 * @since 0.134.0
 */
function shadowRoot({mode = "open"}, arg1, context) {
	var element = context.element || (context.document || document).createElement("div");
	context.registry.add(null, "", element.attachShadow({mode}));
	return element;
}

/**
 * @since 0.134.0
 */
function xml({namespace, root, name}, arg1, {registry}) {
	var root = xmlImpl(namespace, root || name || "xml");
	registry.add(null, "", root.firstElementChild);
	return root;
}

var xmlImpl = typeof document != "undefined" && document.implementation ?
	(namespace, root) => document.implementation.createDocument(namespace, root) :
	(namespace, root) => new XMLDocument(namespace, root);

/**
 * @since 0.134.0
 */
function text(value, arg1, {element, bind, anchor}) {
	element["~builder"].text(value, bind, anchor);
	return element;
}

/**
 * @since 0.134.0
 */
function html(value, arg1, {element, bind, anchor}) {
	element["~builder"].html(value, bind, anchor);
	return element;
}

/**
 * @since 0.134.0
 */
function className(value, arg1, {element, bind}) {
	if(typeof value == "object" && !SactoryObservable.isObservable(value)) {
		for(var className in value) {
			element["~builder"].classNameIf(className, value[className], bind);
		}
	} else {
		element["~builder"].className(value, bind);
	}
}

var current;

/**
 * @since 0.70.0
 */
function next(attrs, arg1, context) {
	current = counter.nextPrefix();
	prev(attrs, arg1, context);
}

/**
 * @since 0.70.0
 */
function prev(attrs, arg1, {element}) {
	for(var name in attrs) {
		var value = attrs[name];
		element.setAttribute(name, value === true ? current : value + current);
	}
}

/**
 * @since 0.122.0
 */
function visibility(element, value, visible, bind) {
	var builder = element["~builder"];
	var document = element.ownerDocument;
	var hidden = document["~hidden"];
	if(!hidden) {
		hidden = document["~hidden"] = counter.nextPrefix();
		var style = document.createElement("style");
		style.textContent = `.${hidden}{display:none!important;}`;
		document.head.appendChild(style);
	}
	var update = value => {
		if(!!value ^ visible) {
			builder.addClass(hidden);
		} else {
			builder.removeClass(hidden);
		}
	};
	if(SactoryObservable.isObservable(value)) {
		builder.observeImpl(bind, value, update);
	} else {
		update(value);
	}
}

/**
 * @since 0.134.0
 */
function hide(value, arg1, {element, bind}) {
	visibility(element, value, 0, bind);
}

/**
 * @since 0.134.0
 */
function show(value, arg1, {element, bind}) {
	visibility(element, value, 1, bind);
}

add("document-fragment", documentFragment, false);
add("shadow-root", shadowRoot, true);
add("xml", xml, false);
add("text", text, true);
add("html", html, true);
add("class", className, true);
add("next", next, true);
add("prev", prev, true);
add("hide", hide, true);
add("show", show, true);

module.exports = Sactory;
