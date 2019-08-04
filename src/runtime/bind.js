var Const = require("../const");

var SactoryCore = require("./core");
var SactoryObservable = require("./observable");

var Sactory = {};

/**
 * @class
 * @since 0.45.0
 */
function Bind(parent) {
	this.parent = parent;
	this.children = [];
	this.subscriptions = [];
	this.elements = [];
	this.rollbacks = [];
}

/**
 * @since 0.45.0
 */
Bind.prototype.fork = function(){
	var child = new Bind(this);
	this.children.push(child);
	return child;
}

/**
 * @since 0.45.0
 */
Bind.prototype.rollback = function(){
	if(this.subscriptions.length) {
		this.subscriptions.forEach(function(subscription){
			subscription.dispose();
		});
		this.subscriptions = [];
	}
	if(this.elements.length) {
		this.elements.forEach(function(element){
			if(element.__builderInstance && element.dispatchEvent) element.__builder.dispatchEvent("remove");
			if(element.parentNode) element.parentNode.removeChild(element);
		});
		this.elements = [];
	}
	if(this.rollbacks.length) {
		this.rollbacks.forEach(function(fun){
			fun();
		});
		this.rollbacks = [];
	}
	if(this.children.length) {
		this.children.forEach(function(child){
			child.rollback();
		});
		this.children = [];
	}
};

/**
 * @since 0.45.0
 */
Bind.prototype.subscribe = function(subscription){
	this.subscriptions.push(subscription);
};

/**
 * @since 0.45.0
 */
Bind.prototype.appendChild = function(element){
	this.elements.push(element);
};

/**
 * @since 0.64.0
 */
Bind.prototype.addRollback = function(fun){
	this.rollbacks.push(fun);
};

var factory = new Bind(null);

/**
 * @since 0.45.0
 */
Object.defineProperty(Sactory, "bindFactory", {
	get: function(){
		return factory;
	}
});

/**
 * @since 0.48.0
 */
Sactory.createAnchor = function(context){
	var ret = document.createTextNode("");
	/* debug:
	ret = document.createComment("");
	*/
	Object.defineProperty(ret, "nodeType", {
		value: Node.ANCHOR_NODE
	});
	if(context.anchor) context.element.insertBefore(ret, context.anchor);
	else context.element.appendChild(ret);
	if(context.bind) context.bind.appendChild(ret);
	return ret;
};

/**
 * @since 0.11.0
 */
Sactory.bind = function(scope, context, target, fun){
	var currentBind = (context.bind || Sactory.bindFactory).fork();
	var currentAnchor = null;
	var oldValue;
	var subscribe = !context.bind ? function(){} : function(subscriptions) {
		if(context.bind) context.bind.subscribe(subscriptions);
	};
	function record(value) {
		fun.call(scope, Polyfill.assign({}, context, {bind: currentBind, anchor: currentAnchor}), oldValue = value);
	}
	function rollback() {
		currentBind.rollback();
	}
	if(context.element) {
		currentAnchor = Sactory.createAnchor(context);
		/* debug:
		currentAnchor.bind = currentBind;
		currentAnchor.textContent = " bind ";
		*/
	}
	if(target.observe) target = target.observe;
	if(target.forEach) {
		target.forEach(function(ob){
			subscribe(ob.subscribe(function(){
				rollback();
				record();
			}));
		});
		record();
	} else if(SactoryObservable.isObservable(target)) {
		subscribe(target.subscribe(function(value){
			rollback();
			record(value);
		}));
		record(target.value);
	} else {
		throw new Error("Cannot bind to the given value: not an observable or an array of observables.");
	}
};

/**
 * @since 0.102.0
 */
Sactory.bindIfElse = function(scope, context, conditions, ...functions){
	var currentBindDependencies = (context.bind || Sactory.bindFactory).fork();
	var currentBindContent = (context.bind || Sactory.bindFactory).fork();
	var currentAnchor;
	if(context.element) {
		currentAnchor = Sactory.createAnchor(context);
	}
	// filter maybe observables
	conditions.forEach(([, observables, maybe]) => {
		if(maybe) {
			observables.push(...SactoryObservable.filterObservables(maybe));
		}
	});
	var active = 0xFEE1DEAD;
	var results;
	function reload() {
		// reset results
		results = conditions.map(() => null);
		// calculate new results and call body
		for(var i=0; i<results.length; i++) {
			var [getter] = conditions[i];
			if(!getter || (results[i] = !!getter.call(scope))) {
				active = i;
				functions[i].call(scope, Polyfill.assign({}, context, {bind: currentBindContent, anchor: currentAnchor}));
				return;
			}
		}
		// no result found
		active = 0xFEE1DEAD;
	}
	function recalc() {
		currentBindContent.rollback();
		reload();
	}
	conditions.forEach(([getter, observables], i) => {
		if(observables) {
			observables.forEach(dependency => {
				currentBindDependencies.subscribe(dependency.subscribe(function(){
					if(i <= active) {
						// the change may affect what is being displayed
						var result = !!getter.call(scope);
						if(result != results[i]) {
							// the condition has changes, need to recalc
							results[i] = result;
							recalc();
						}
					}
				}));
			});
		}
	});
	reload();
};

/**
 * @since 0.102.0
 */
Sactory.bindEach = function(scope, context, target, getter, fun){
	if(getter.call(scope).forEach) {
		var currentBind = (context.bind || Sactory.bindFactory).fork();
		var firstAnchor, lastAnchor;
		if(context.element) {
			firstAnchor = Sactory.createAnchor(context);
			lastAnchor = Sactory.createAnchor(context);
			/* debug:
			firstAnchor.textContent = " bind-each:first ";
			lastAnchor.textContent = " bind-each:last ";
			*/
		}
		var binds = [];
		function add(action, bind, anchor, value, index, array) {
			fun.call(scope, Polyfill.assign({}, context, {bind: bind, anchor: anchor}), value, index, array);
			binds[action]({bind, anchor});
		}
		function remove(bind) {
			bind.bind.rollback();
			if(bind.anchor) bind.anchor.parentNode.removeChild(bind.anchor);
		}
		function updateAll() {
			getter.call(scope).forEach(function(value, index, array){
				add("push", currentBind.fork(), context.element ? Sactory.createAnchor({element: context.element, bind: currentBind, anchor: lastAnchor}) : null, value, index, array);
			});
		}
		currentBind.subscribe(target.subscribe(function(array, _, type, data){
			switch(type) {
				case Const.OBSERVABLE_UPDATE_TYPE_ARRAY_PUSH:
					Array.prototype.forEach.call(data, function(value, i){
						add("push", currentBind.fork(), context.element ? Sactory.createAnchor({element: context.element, bind: currentBind, anchor: lastAnchor}) : null, value, array.length - data.length + i, array);
					});
					break;
				case Const.OBSERVABLE_UPDATE_TYPE_ARRAY_POP:
					var popped = binds.pop();
					if(popped) remove(popped);
					break;
				case Const.OBSERVABLE_UPDATE_TYPE_ARRAY_UNSHIFT:
					Array.prototype.forEach.call(data, function(value){
						add("unshift", currentBind.fork(), context.element ? Sactory.createAnchor({element: context.element, bind: currentBind, anchor: firstAnchor.nextSibling}) : null, value, 0, array);
					});
					break;
				case Const.OBSERVABLE_UPDATE_TYPE_ARRAY_SHIFT:
					var shifted = binds.shift();
					if(shifted) remove(shifted);
					break;
				case Const.OBSERVABLE_UPDATE_TYPE_ARRAY_SPLICE:
					// insert new elements then call splice on binds and rollback
					var index = data[0];
					var ptr = binds[index];
					var anchorTo = ptr && ptr.anchor && ptr.anchor.nextSibling;
					var args = [];
					Array.prototype.slice.call(data, 2).forEach(function(value){
						args.push({value});
					});
					Array.prototype.splice.apply(binds, Array.prototype.slice.call(data, 0, 2).concat(args)).forEach(function(removed){
						removed.bind.rollback();
						if(removed.anchor) removed.anchor.parentNode.removeChild(removed.anchor);
					});
					args.forEach(function(info, i){
						info.bind = currentBind.fork();
						info.anchor = anchorTo ? Sactory.createAnchor({element: context.element, bind: currentBind, anchor: anchorTo}) : null;
						fun.call(scope, Polyfill.assign({}, context, {bind: info.bind, anchor: info.anchor}), info.value, i + index, array);
					});
					break;
				default:
					binds.forEach(remove);
					binds = [];
					updateAll();
			}
		}));
		updateAll();
	} else {
		// use normal bind and Sactory.forEach
		Sactory.bind(scope, context, target, context => {
			SactoryCore.forEach(scope, getter.call(scope), (...args) => fun.call(scope, context, ...args));
		});
	}
};

/**
 * @since 0.102.0
 */
Sactory.bindEachMaybe = function(scope, context, target, getter, fun){
	if(SactoryObservable.isObservable(target)) {
		Sactory.bindEach(scope, context, target, getter, fun);
	} else {
		SactoryCore.forEach(scope, getter.call(scope), (...args) => fun.call(scope, context, ...args));
	}
};

/**
 * @since 0.58.0
 */
Sactory.subscribe = function(context, observable, callback, type){
	var subscription = SactoryObservable.observe(observable, callback, type, true);
	if(context.bind) context.bind.subscribe(subscription);
	return subscription;
};

module.exports = Sactory;
