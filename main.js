(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Component Base Class
 * 
 * Sets all arguments passed in to constructor from ComponentLoader
 *
 * Exposes pub/sub methods for triggering events to other components
 *
 */
class Component {

	/**
	 * Constructor for the Component
	 *
	 * Call `super(...arguments);` in the base class constructor
	 *
	 * @public
	 * @param {Node} context - DOM node that contains the component markup
	 * @param {Object} data - Optional data object from ComponentLoader.scan()
	 * @param {Object} mediator - instance of ComponentLoader for pub/sub
	 */
	constructor() {
		this.el = arguments[0]
		if (typeof jQuery !== 'undefined') this.$el = jQuery(this.el);
		this.data = arguments[1];
		this.__mediator = arguments[2];
	}


	/**
	 * Publish an event for other components
	 * @protected
	 * @param {String} topic - Event name
	 * @param {Object} data - Optional params to pass with the event
	 */
	publish() {
		this.__mediator.publish(...arguments);
	}


	/**
	 * Subscribe to an event from another component
	 * @protected
	 * @param {String} topic - Event name
	 * @param {Function} callback - Function to bind
	 */
	subscribe(topic, callback) {
		this.__mediator.subscribe(topic, callback, this);
	}


	/**
	 * Unsubscribe from an event from another component
	 * @protected
	 * @param {String} topic - Event name
	 * @param {Function} callback - Function to unbind
	 */
	unsubscribe(topic, callback) {
		this.__mediator.unsubscribe(topic, callback, this);
	}


	/**
	 * Utility method for triggering the ComponentLoader to scan the markup for new components
	 * @protected
	 * @param {Object} data - Optional data to pass to the constructor of any Component initialized by this scan
	 */
	scan(data) {
		this.__mediator.scan(data);
	}


	/**
	 * Utility method for defering a function call
	 * @protected
	 * @param {Function} callback - Function to call
	 * @param {Number} ms - Optional ms to delay, defaults to 17ms (just over 1 frame at 60fps)
	 */
	defer(callback, ms = 17) {
		setTimeout(callback, ms);
	}


	/**
	 * Called by ComponentLoader when component is no longer found in the markup
	 * usually happens as a result of replacing the markup using AJAX
	 *	
	 * Override in subclass and make sure to clean up event handlers etc
	 *
	 * @protected
	 */
	destroy() {

	}
}


// Export AMD, CommonJS/ES6 module or assume global namespace
if (typeof define !== 'undefined' && define.amd) {
	define([], Component);
}
else if (typeof module !== 'undefined' && module.exports) {
	module.exports = Component;
}
else {
	window.Component = Component;
}
},{}],2:[function(require,module,exports){
/**
 * ComponentLoader Class
 *
 * Instantiates JavaScript Classes when their name is found in the DOM using attribute data-component=""
 *
 */
class ComponentLoader {

	/**
	 * Constructor for the ComponentLoader
	 * @class
	 * @public
	 * @param {Object} components - Optional collection of available components: {componentName: classDefinition}
	 * @param {Node} context - Optional DOM node to search for components. Defaults to document.
	 */
	constructor(components = {}, context = document) {
		this.contextEl = context;
		this.initializedComponents = {};
		this.numberOfInitializedComponents = 0;
		this.components = {};
		this.topics = {};
		this.register(components);
	}


	/**
	 * Add component(s) to collection of available components
	 * @public
	 * @param {Object} components - Collection of components: {componentName: classDefinition}
	 */
	register(components = {}) {
		Object.keys(components).forEach( (componentName) => {
			this.components[componentName] = components[componentName];
		});
	}

	/**
	 * Remove component from collection of available components
	 * @public
	 * @param {String} componentName - Name of the component to remove
	 */
	unregister(componentName) {
		delete this.components[componentName];
	}

	/**
	 * Mediator functionality.
	 * Stores the topic and callback given by the component.
	 * for further reference.
	 * @param  {String} topic      Topic string
	 * @param  {Function} callback Callback function that would be triggered.
	 * @param  {Function} context  Class instance which owns the callback
	 */
	subscribe(topic, callback, context) {

		// Is this a new topic?
		if ( !this.topics.hasOwnProperty(topic) ) {
			this.topics[topic] = [];
		}

		// Store the subscriber callback
		this.topics[topic].push( { context: context, callback: callback } );

	}

	/**
	 * Mediator functionality.
	 * Removes the stored topic and callback given by the component.
	 * @param  {String}   topic    Topic string
	 * @param  {Function} callback Callback function that would be triggered.
	 * @param  {Function} context  Class instance which owns the callback
	 * @return {Boolean}           True on success, False otherwise.
	 */
	unsubscribe(topic, callback, context) {
		// Do we have this topic?
		if (!this.topics.hasOwnProperty(topic)) {
			return false;
		}

		// Find out where this is and remove it
		for (let i = 0, len = this.topics[topic].length; i < len; i++) {
			if (this.topics[topic][i].callback === callback) {
				if (!context || this.topics[topic][i].context === context) {
					this.topics[topic].splice(i, 1);
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * [publish description]
	 * @param  {[type]} topic [description]
	 * @return {[type]}       [description]
	 */
	publish(topic) {
		// Check if we have subcribers to this topic
		if (!this.topics.hasOwnProperty(topic)) {
			return false;
		}

		// don't slice on arguments because it prevents optimizations in JavaScript engines (V8 for example)
		// https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Functions/arguments
		// https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#32-leaking-arguments
		const args = new Array(arguments.length - 1);
		for (var i = 0; i < args.length; ++i) {
				args[i] = arguments[i + 1]; // remove first argument
		}

		// Loop through them and fire the callbacks
		for (let i = 0, len = this.topics[topic].length; i < len; i++) {
			let subscription = this.topics[topic][i];
			// Call it's callback
			if (subscription && subscription.callback) {
				subscription.callback.apply(subscription.context, args);
			}
		}

		return true;
	}

	/**
	 * Scan the DOM, initialize new components and destroy removed components.
	 * @public
	 * @param {Object} data - Optional data object to pass to the component constructor
	 */
	scan(data = {}) {
		const activeComponents = {},
		      elements = this.contextEl.querySelectorAll("[data-component]");

		([]).forEach.call(elements, (el) => {
			this._scanElement(el, activeComponents, data);
		});

		if (this.numberOfInitializedComponents > 0) this.cleanUp_(activeComponents);
	}


	/**
	 * Find all components registered on a specific DOM element and initialize them if new
	 * @private
	 * @param {Element} el - DOM element to scan for components
	 * @param {Object} activeComponents - All componentIds currently found in the DOM
	 * @param {Object} data - Optional data object to pass to the component constructor
	 */
	_scanElement(el, activeComponents, data) {
		// check of component(s) for this DOM element already have been initialized
		let elementId = el.getAttribute("data-component-id");

		if (!elementId) {
			// give unique id so we can track it on next scan
			elementId = this._generateUUID();
			el.setAttribute('data-component-id', elementId);
		}

		// find the name of the component instance
		const componentList = el.getAttribute("data-component").match(/\S+/g);
		componentList.forEach( (componentName) => {

			const componentId = `${componentName}-${elementId}`;
			activeComponents[componentId] = true;

			// check if component not initialized before
			if (!this.initializedComponents[componentId]) {
				this._initializeComponent(componentName, componentId, el, data)
			}

		});
	}


	/**
	 * Call constructor of component and add instance to the collection of initialized components
	 * @private
	 * @param {String} componentName - Name of the component to initialize. Used to lookup class definition in components collection.
	 * @param {String} componentId - Unique component ID (combination of component name and element ID)
	 * @param {Element} el - DOM element that is the context of this component
	 * @param {Object} data - Optional data object to pass to the component constructor
	 */
	_initializeComponent(componentName, componentId, el, data) {
		const component = this.components[componentName];

		if (typeof component !== 'function')
			throw `ComponentLoader: unknown component '${componentName}'`;

		let instance = new component(el, data, this);

		this.initializedComponents[componentId] = instance;
		this.numberOfInitializedComponents++;
	}


	/**
	 * Call destroy() on a component instance and remove it from the collection of initialized components
	 * @private
	 * @param {String} componentId - Unique component ID used to find component instance
	 */
	_destroyComponent(componentId) {
		const instance = this.initializedComponents[componentId];
		if (instance && typeof instance.destroy === 'function')
			instance.destroy();

		// safe to delete while object keys while loopinghttp://stackoverflow.com/questions/3463048/is-it-safe-to-delete-an-object-property-while-iterating-over-them
		delete this.initializedComponents[componentId];
		this.numberOfInitializedComponents--;
	}


	/**
	 * Destroy inaitialized components that no longer are active
	 * @private
	 * @param {Object} activeComponents - All componentIds currently found in the DOM
	 */
	cleanUp_(activeComponents = {}) {
		Object.keys(this.initializedComponents).forEach( (componentId) => {
			if (!activeComponents[componentId]) {
				this._destroyComponent(componentId);
			}
		});
	}


	/**
	 * Generates a rfc4122 version 4 compliant unique ID
	 * http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
	 * @private
	 */
	_generateUUID() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			const r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
			return v.toString(16);
		});
	}
}

// Export AMD, CommonJS/ES6 module or assume global namespace
if (typeof define !== 'undefined' && define.amd) {
	define([], ComponentLoader);
}
else if (typeof module !== 'undefined' && module.exports) {
	module.exports = ComponentLoader;
}
else {
	window.ComponentLoader = ComponentLoader;
}
},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _component = require('component-loader-js/dist/es6/component');

var _component2 = _interopRequireDefault(_component);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Doki = function (_Component) {
	_inherits(Doki, _Component);

	function Doki() {
		_classCallCheck(this, Doki);

		var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Doki).apply(this, arguments));

		console.log('new DOKI 36');
		return _this;
	}

	_createClass(Doki, [{
		key: 'destroy',
		value: function destroy() {
			_get(Object.getPrototypeOf(Doki.prototype), 'destroy', this).call(this);
			console.log('destroy DOKI');
		}
	}]);

	return Doki;
}(_component2.default);

exports.default = Doki;

},{"component-loader-js/dist/es6/component":1}],4:[function(require,module,exports){
'use strict';

var _componentLoaderJs = require('component-loader-js');

var _componentLoaderJs2 = _interopRequireDefault(_componentLoaderJs);

var _doki = require('./doki');

var _doki2 = _interopRequireDefault(_doki);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

new _componentLoaderJs2.default({ Doki: _doki2.default }).scan();

},{"./doki":3,"component-loader-js":2}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvY29tcG9uZW50LWxvYWRlci1qcy9kaXN0L2VzNi9jb21wb25lbnQuanMiLCJub2RlX21vZHVsZXMvY29tcG9uZW50LWxvYWRlci1qcy9zcmMvY29tcG9uZW50LWxvYWRlci5qcyIsInRoZW1lL2pzL2Rva2kuanMiLCJ0aGVtZS9qcy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUNwUE07OztBQUNMLFVBREssSUFDTCxHQUFjO3dCQURULE1BQ1M7O3FFQURULGtCQUVLLFlBREk7O0FBRWIsVUFBUSxHQUFSLENBQVksYUFBWixFQUZhOztFQUFkOztjQURLOzs0QkFNSztBQUNULDhCQVBJLDRDQU9KLENBRFM7QUFFVCxXQUFRLEdBQVIsQ0FBWSxjQUFaLEVBRlM7Ozs7UUFOTDs7O2tCQVlTOzs7Ozs7Ozs7Ozs7Ozs7QUNUZixnQ0FBb0IsRUFBQyxvQkFBRCxFQUFwQixFQUE0QixJQUE1QiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIENvbXBvbmVudCBCYXNlIENsYXNzXG4gKiBcbiAqIFNldHMgYWxsIGFyZ3VtZW50cyBwYXNzZWQgaW4gdG8gY29uc3RydWN0b3IgZnJvbSBDb21wb25lbnRMb2FkZXJcbiAqXG4gKiBFeHBvc2VzIHB1Yi9zdWIgbWV0aG9kcyBmb3IgdHJpZ2dlcmluZyBldmVudHMgdG8gb3RoZXIgY29tcG9uZW50c1xuICpcbiAqL1xuY2xhc3MgQ29tcG9uZW50IHtcblxuXHQvKipcblx0ICogQ29uc3RydWN0b3IgZm9yIHRoZSBDb21wb25lbnRcblx0ICpcblx0ICogQ2FsbCBgc3VwZXIoLi4uYXJndW1lbnRzKTtgIGluIHRoZSBiYXNlIGNsYXNzIGNvbnN0cnVjdG9yXG5cdCAqXG5cdCAqIEBwdWJsaWNcblx0ICogQHBhcmFtIHtOb2RlfSBjb250ZXh0IC0gRE9NIG5vZGUgdGhhdCBjb250YWlucyB0aGUgY29tcG9uZW50IG1hcmt1cFxuXHQgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIE9wdGlvbmFsIGRhdGEgb2JqZWN0IGZyb20gQ29tcG9uZW50TG9hZGVyLnNjYW4oKVxuXHQgKiBAcGFyYW0ge09iamVjdH0gbWVkaWF0b3IgLSBpbnN0YW5jZSBvZiBDb21wb25lbnRMb2FkZXIgZm9yIHB1Yi9zdWJcblx0ICovXG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHRoaXMuZWwgPSBhcmd1bWVudHNbMF1cblx0XHRpZiAodHlwZW9mIGpRdWVyeSAhPT0gJ3VuZGVmaW5lZCcpIHRoaXMuJGVsID0galF1ZXJ5KHRoaXMuZWwpO1xuXHRcdHRoaXMuZGF0YSA9IGFyZ3VtZW50c1sxXTtcblx0XHR0aGlzLl9fbWVkaWF0b3IgPSBhcmd1bWVudHNbMl07XG5cdH1cblxuXG5cdC8qKlxuXHQgKiBQdWJsaXNoIGFuIGV2ZW50IGZvciBvdGhlciBjb21wb25lbnRzXG5cdCAqIEBwcm90ZWN0ZWRcblx0ICogQHBhcmFtIHtTdHJpbmd9IHRvcGljIC0gRXZlbnQgbmFtZVxuXHQgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIE9wdGlvbmFsIHBhcmFtcyB0byBwYXNzIHdpdGggdGhlIGV2ZW50XG5cdCAqL1xuXHRwdWJsaXNoKCkge1xuXHRcdHRoaXMuX19tZWRpYXRvci5wdWJsaXNoKC4uLmFyZ3VtZW50cyk7XG5cdH1cblxuXG5cdC8qKlxuXHQgKiBTdWJzY3JpYmUgdG8gYW4gZXZlbnQgZnJvbSBhbm90aGVyIGNvbXBvbmVudFxuXHQgKiBAcHJvdGVjdGVkXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB0b3BpYyAtIEV2ZW50IG5hbWVcblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSBGdW5jdGlvbiB0byBiaW5kXG5cdCAqL1xuXHRzdWJzY3JpYmUodG9waWMsIGNhbGxiYWNrKSB7XG5cdFx0dGhpcy5fX21lZGlhdG9yLnN1YnNjcmliZSh0b3BpYywgY2FsbGJhY2ssIHRoaXMpO1xuXHR9XG5cblxuXHQvKipcblx0ICogVW5zdWJzY3JpYmUgZnJvbSBhbiBldmVudCBmcm9tIGFub3RoZXIgY29tcG9uZW50XG5cdCAqIEBwcm90ZWN0ZWRcblx0ICogQHBhcmFtIHtTdHJpbmd9IHRvcGljIC0gRXZlbnQgbmFtZVxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIEZ1bmN0aW9uIHRvIHVuYmluZFxuXHQgKi9cblx0dW5zdWJzY3JpYmUodG9waWMsIGNhbGxiYWNrKSB7XG5cdFx0dGhpcy5fX21lZGlhdG9yLnVuc3Vic2NyaWJlKHRvcGljLCBjYWxsYmFjaywgdGhpcyk7XG5cdH1cblxuXG5cdC8qKlxuXHQgKiBVdGlsaXR5IG1ldGhvZCBmb3IgdHJpZ2dlcmluZyB0aGUgQ29tcG9uZW50TG9hZGVyIHRvIHNjYW4gdGhlIG1hcmt1cCBmb3IgbmV3IGNvbXBvbmVudHNcblx0ICogQHByb3RlY3RlZFxuXHQgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIE9wdGlvbmFsIGRhdGEgdG8gcGFzcyB0byB0aGUgY29uc3RydWN0b3Igb2YgYW55IENvbXBvbmVudCBpbml0aWFsaXplZCBieSB0aGlzIHNjYW5cblx0ICovXG5cdHNjYW4oZGF0YSkge1xuXHRcdHRoaXMuX19tZWRpYXRvci5zY2FuKGRhdGEpO1xuXHR9XG5cblxuXHQvKipcblx0ICogVXRpbGl0eSBtZXRob2QgZm9yIGRlZmVyaW5nIGEgZnVuY3Rpb24gY2FsbFxuXHQgKiBAcHJvdGVjdGVkXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0gRnVuY3Rpb24gdG8gY2FsbFxuXHQgKiBAcGFyYW0ge051bWJlcn0gbXMgLSBPcHRpb25hbCBtcyB0byBkZWxheSwgZGVmYXVsdHMgdG8gMTdtcyAoanVzdCBvdmVyIDEgZnJhbWUgYXQgNjBmcHMpXG5cdCAqL1xuXHRkZWZlcihjYWxsYmFjaywgbXMgPSAxNykge1xuXHRcdHNldFRpbWVvdXQoY2FsbGJhY2ssIG1zKTtcblx0fVxuXG5cblx0LyoqXG5cdCAqIENhbGxlZCBieSBDb21wb25lbnRMb2FkZXIgd2hlbiBjb21wb25lbnQgaXMgbm8gbG9uZ2VyIGZvdW5kIGluIHRoZSBtYXJrdXBcblx0ICogdXN1YWxseSBoYXBwZW5zIGFzIGEgcmVzdWx0IG9mIHJlcGxhY2luZyB0aGUgbWFya3VwIHVzaW5nIEFKQVhcblx0ICpcdFxuXHQgKiBPdmVycmlkZSBpbiBzdWJjbGFzcyBhbmQgbWFrZSBzdXJlIHRvIGNsZWFuIHVwIGV2ZW50IGhhbmRsZXJzIGV0Y1xuXHQgKlxuXHQgKiBAcHJvdGVjdGVkXG5cdCAqL1xuXHRkZXN0cm95KCkge1xuXG5cdH1cbn1cblxuXG4vLyBFeHBvcnQgQU1ELCBDb21tb25KUy9FUzYgbW9kdWxlIG9yIGFzc3VtZSBnbG9iYWwgbmFtZXNwYWNlXG5pZiAodHlwZW9mIGRlZmluZSAhPT0gJ3VuZGVmaW5lZCcgJiYgZGVmaW5lLmFtZCkge1xuXHRkZWZpbmUoW10sIENvbXBvbmVudCk7XG59XG5lbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuXHRtb2R1bGUuZXhwb3J0cyA9IENvbXBvbmVudDtcbn1cbmVsc2Uge1xuXHR3aW5kb3cuQ29tcG9uZW50ID0gQ29tcG9uZW50O1xufSIsIi8qKlxuICogQ29tcG9uZW50TG9hZGVyIENsYXNzXG4gKlxuICogSW5zdGFudGlhdGVzIEphdmFTY3JpcHQgQ2xhc3NlcyB3aGVuIHRoZWlyIG5hbWUgaXMgZm91bmQgaW4gdGhlIERPTSB1c2luZyBhdHRyaWJ1dGUgZGF0YS1jb21wb25lbnQ9XCJcIlxuICpcbiAqL1xuY2xhc3MgQ29tcG9uZW50TG9hZGVyIHtcblxuXHQvKipcblx0ICogQ29uc3RydWN0b3IgZm9yIHRoZSBDb21wb25lbnRMb2FkZXJcblx0ICogQGNsYXNzXG5cdCAqIEBwdWJsaWNcblx0ICogQHBhcmFtIHtPYmplY3R9IGNvbXBvbmVudHMgLSBPcHRpb25hbCBjb2xsZWN0aW9uIG9mIGF2YWlsYWJsZSBjb21wb25lbnRzOiB7Y29tcG9uZW50TmFtZTogY2xhc3NEZWZpbml0aW9ufVxuXHQgKiBAcGFyYW0ge05vZGV9IGNvbnRleHQgLSBPcHRpb25hbCBET00gbm9kZSB0byBzZWFyY2ggZm9yIGNvbXBvbmVudHMuIERlZmF1bHRzIHRvIGRvY3VtZW50LlxuXHQgKi9cblx0Y29uc3RydWN0b3IoY29tcG9uZW50cyA9IHt9LCBjb250ZXh0ID0gZG9jdW1lbnQpIHtcblx0XHR0aGlzLmNvbnRleHRFbCA9IGNvbnRleHQ7XG5cdFx0dGhpcy5pbml0aWFsaXplZENvbXBvbmVudHMgPSB7fTtcblx0XHR0aGlzLm51bWJlck9mSW5pdGlhbGl6ZWRDb21wb25lbnRzID0gMDtcblx0XHR0aGlzLmNvbXBvbmVudHMgPSB7fTtcblx0XHR0aGlzLnRvcGljcyA9IHt9O1xuXHRcdHRoaXMucmVnaXN0ZXIoY29tcG9uZW50cyk7XG5cdH1cblxuXG5cdC8qKlxuXHQgKiBBZGQgY29tcG9uZW50KHMpIHRvIGNvbGxlY3Rpb24gb2YgYXZhaWxhYmxlIGNvbXBvbmVudHNcblx0ICogQHB1YmxpY1xuXHQgKiBAcGFyYW0ge09iamVjdH0gY29tcG9uZW50cyAtIENvbGxlY3Rpb24gb2YgY29tcG9uZW50czoge2NvbXBvbmVudE5hbWU6IGNsYXNzRGVmaW5pdGlvbn1cblx0ICovXG5cdHJlZ2lzdGVyKGNvbXBvbmVudHMgPSB7fSkge1xuXHRcdE9iamVjdC5rZXlzKGNvbXBvbmVudHMpLmZvckVhY2goIChjb21wb25lbnROYW1lKSA9PiB7XG5cdFx0XHR0aGlzLmNvbXBvbmVudHNbY29tcG9uZW50TmFtZV0gPSBjb21wb25lbnRzW2NvbXBvbmVudE5hbWVdO1xuXHRcdH0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIFJlbW92ZSBjb21wb25lbnQgZnJvbSBjb2xsZWN0aW9uIG9mIGF2YWlsYWJsZSBjb21wb25lbnRzXG5cdCAqIEBwdWJsaWNcblx0ICogQHBhcmFtIHtTdHJpbmd9IGNvbXBvbmVudE5hbWUgLSBOYW1lIG9mIHRoZSBjb21wb25lbnQgdG8gcmVtb3ZlXG5cdCAqL1xuXHR1bnJlZ2lzdGVyKGNvbXBvbmVudE5hbWUpIHtcblx0XHRkZWxldGUgdGhpcy5jb21wb25lbnRzW2NvbXBvbmVudE5hbWVdO1xuXHR9XG5cblx0LyoqXG5cdCAqIE1lZGlhdG9yIGZ1bmN0aW9uYWxpdHkuXG5cdCAqIFN0b3JlcyB0aGUgdG9waWMgYW5kIGNhbGxiYWNrIGdpdmVuIGJ5IHRoZSBjb21wb25lbnQuXG5cdCAqIGZvciBmdXJ0aGVyIHJlZmVyZW5jZS5cblx0ICogQHBhcmFtICB7U3RyaW5nfSB0b3BpYyAgICAgIFRvcGljIHN0cmluZ1xuXHQgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY2FsbGJhY2sgQ2FsbGJhY2sgZnVuY3Rpb24gdGhhdCB3b3VsZCBiZSB0cmlnZ2VyZWQuXG5cdCAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjb250ZXh0ICBDbGFzcyBpbnN0YW5jZSB3aGljaCBvd25zIHRoZSBjYWxsYmFja1xuXHQgKi9cblx0c3Vic2NyaWJlKHRvcGljLCBjYWxsYmFjaywgY29udGV4dCkge1xuXG5cdFx0Ly8gSXMgdGhpcyBhIG5ldyB0b3BpYz9cblx0XHRpZiAoICF0aGlzLnRvcGljcy5oYXNPd25Qcm9wZXJ0eSh0b3BpYykgKSB7XG5cdFx0XHR0aGlzLnRvcGljc1t0b3BpY10gPSBbXTtcblx0XHR9XG5cblx0XHQvLyBTdG9yZSB0aGUgc3Vic2NyaWJlciBjYWxsYmFja1xuXHRcdHRoaXMudG9waWNzW3RvcGljXS5wdXNoKCB7IGNvbnRleHQ6IGNvbnRleHQsIGNhbGxiYWNrOiBjYWxsYmFjayB9ICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBNZWRpYXRvciBmdW5jdGlvbmFsaXR5LlxuXHQgKiBSZW1vdmVzIHRoZSBzdG9yZWQgdG9waWMgYW5kIGNhbGxiYWNrIGdpdmVuIGJ5IHRoZSBjb21wb25lbnQuXG5cdCAqIEBwYXJhbSAge1N0cmluZ30gICB0b3BpYyAgICBUb3BpYyBzdHJpbmdcblx0ICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrIENhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgd291bGQgYmUgdHJpZ2dlcmVkLlxuXHQgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY29udGV4dCAgQ2xhc3MgaW5zdGFuY2Ugd2hpY2ggb3ducyB0aGUgY2FsbGJhY2tcblx0ICogQHJldHVybiB7Qm9vbGVhbn0gICAgICAgICAgIFRydWUgb24gc3VjY2VzcywgRmFsc2Ugb3RoZXJ3aXNlLlxuXHQgKi9cblx0dW5zdWJzY3JpYmUodG9waWMsIGNhbGxiYWNrLCBjb250ZXh0KSB7XG5cdFx0Ly8gRG8gd2UgaGF2ZSB0aGlzIHRvcGljP1xuXHRcdGlmICghdGhpcy50b3BpY3MuaGFzT3duUHJvcGVydHkodG9waWMpKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Ly8gRmluZCBvdXQgd2hlcmUgdGhpcyBpcyBhbmQgcmVtb3ZlIGl0XG5cdFx0Zm9yIChsZXQgaSA9IDAsIGxlbiA9IHRoaXMudG9waWNzW3RvcGljXS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0aWYgKHRoaXMudG9waWNzW3RvcGljXVtpXS5jYWxsYmFjayA9PT0gY2FsbGJhY2spIHtcblx0XHRcdFx0aWYgKCFjb250ZXh0IHx8IHRoaXMudG9waWNzW3RvcGljXVtpXS5jb250ZXh0ID09PSBjb250ZXh0KSB7XG5cdFx0XHRcdFx0dGhpcy50b3BpY3NbdG9waWNdLnNwbGljZShpLCAxKTtcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdC8qKlxuXHQgKiBbcHVibGlzaCBkZXNjcmlwdGlvbl1cblx0ICogQHBhcmFtICB7W3R5cGVdfSB0b3BpYyBbZGVzY3JpcHRpb25dXG5cdCAqIEByZXR1cm4ge1t0eXBlXX0gICAgICAgW2Rlc2NyaXB0aW9uXVxuXHQgKi9cblx0cHVibGlzaCh0b3BpYykge1xuXHRcdC8vIENoZWNrIGlmIHdlIGhhdmUgc3ViY3JpYmVycyB0byB0aGlzIHRvcGljXG5cdFx0aWYgKCF0aGlzLnRvcGljcy5oYXNPd25Qcm9wZXJ0eSh0b3BpYykpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBkb24ndCBzbGljZSBvbiBhcmd1bWVudHMgYmVjYXVzZSBpdCBwcmV2ZW50cyBvcHRpbWl6YXRpb25zIGluIEphdmFTY3JpcHQgZW5naW5lcyAoVjggZm9yIGV4YW1wbGUpXG5cdFx0Ly8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4vZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvRnVuY3Rpb25zL2FyZ3VtZW50c1xuXHRcdC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9wZXRrYWFudG9ub3YvYmx1ZWJpcmQvd2lraS9PcHRpbWl6YXRpb24ta2lsbGVycyMzMi1sZWFraW5nLWFyZ3VtZW50c1xuXHRcdGNvbnN0IGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7ICsraSkge1xuXHRcdFx0XHRhcmdzW2ldID0gYXJndW1lbnRzW2kgKyAxXTsgLy8gcmVtb3ZlIGZpcnN0IGFyZ3VtZW50XG5cdFx0fVxuXG5cdFx0Ly8gTG9vcCB0aHJvdWdoIHRoZW0gYW5kIGZpcmUgdGhlIGNhbGxiYWNrc1xuXHRcdGZvciAobGV0IGkgPSAwLCBsZW4gPSB0aGlzLnRvcGljc1t0b3BpY10ubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdGxldCBzdWJzY3JpcHRpb24gPSB0aGlzLnRvcGljc1t0b3BpY11baV07XG5cdFx0XHQvLyBDYWxsIGl0J3MgY2FsbGJhY2tcblx0XHRcdGlmIChzdWJzY3JpcHRpb24gJiYgc3Vic2NyaXB0aW9uLmNhbGxiYWNrKSB7XG5cdFx0XHRcdHN1YnNjcmlwdGlvbi5jYWxsYmFjay5hcHBseShzdWJzY3JpcHRpb24uY29udGV4dCwgYXJncyk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHQvKipcblx0ICogU2NhbiB0aGUgRE9NLCBpbml0aWFsaXplIG5ldyBjb21wb25lbnRzIGFuZCBkZXN0cm95IHJlbW92ZWQgY29tcG9uZW50cy5cblx0ICogQHB1YmxpY1xuXHQgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIE9wdGlvbmFsIGRhdGEgb2JqZWN0IHRvIHBhc3MgdG8gdGhlIGNvbXBvbmVudCBjb25zdHJ1Y3RvclxuXHQgKi9cblx0c2NhbihkYXRhID0ge30pIHtcblx0XHRjb25zdCBhY3RpdmVDb21wb25lbnRzID0ge30sXG5cdFx0ICAgICAgZWxlbWVudHMgPSB0aGlzLmNvbnRleHRFbC5xdWVyeVNlbGVjdG9yQWxsKFwiW2RhdGEtY29tcG9uZW50XVwiKTtcblxuXHRcdChbXSkuZm9yRWFjaC5jYWxsKGVsZW1lbnRzLCAoZWwpID0+IHtcblx0XHRcdHRoaXMuX3NjYW5FbGVtZW50KGVsLCBhY3RpdmVDb21wb25lbnRzLCBkYXRhKTtcblx0XHR9KTtcblxuXHRcdGlmICh0aGlzLm51bWJlck9mSW5pdGlhbGl6ZWRDb21wb25lbnRzID4gMCkgdGhpcy5jbGVhblVwXyhhY3RpdmVDb21wb25lbnRzKTtcblx0fVxuXG5cblx0LyoqXG5cdCAqIEZpbmQgYWxsIGNvbXBvbmVudHMgcmVnaXN0ZXJlZCBvbiBhIHNwZWNpZmljIERPTSBlbGVtZW50IGFuZCBpbml0aWFsaXplIHRoZW0gaWYgbmV3XG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7RWxlbWVudH0gZWwgLSBET00gZWxlbWVudCB0byBzY2FuIGZvciBjb21wb25lbnRzXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBhY3RpdmVDb21wb25lbnRzIC0gQWxsIGNvbXBvbmVudElkcyBjdXJyZW50bHkgZm91bmQgaW4gdGhlIERPTVxuXHQgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIE9wdGlvbmFsIGRhdGEgb2JqZWN0IHRvIHBhc3MgdG8gdGhlIGNvbXBvbmVudCBjb25zdHJ1Y3RvclxuXHQgKi9cblx0X3NjYW5FbGVtZW50KGVsLCBhY3RpdmVDb21wb25lbnRzLCBkYXRhKSB7XG5cdFx0Ly8gY2hlY2sgb2YgY29tcG9uZW50KHMpIGZvciB0aGlzIERPTSBlbGVtZW50IGFscmVhZHkgaGF2ZSBiZWVuIGluaXRpYWxpemVkXG5cdFx0bGV0IGVsZW1lbnRJZCA9IGVsLmdldEF0dHJpYnV0ZShcImRhdGEtY29tcG9uZW50LWlkXCIpO1xuXG5cdFx0aWYgKCFlbGVtZW50SWQpIHtcblx0XHRcdC8vIGdpdmUgdW5pcXVlIGlkIHNvIHdlIGNhbiB0cmFjayBpdCBvbiBuZXh0IHNjYW5cblx0XHRcdGVsZW1lbnRJZCA9IHRoaXMuX2dlbmVyYXRlVVVJRCgpO1xuXHRcdFx0ZWwuc2V0QXR0cmlidXRlKCdkYXRhLWNvbXBvbmVudC1pZCcsIGVsZW1lbnRJZCk7XG5cdFx0fVxuXG5cdFx0Ly8gZmluZCB0aGUgbmFtZSBvZiB0aGUgY29tcG9uZW50IGluc3RhbmNlXG5cdFx0Y29uc3QgY29tcG9uZW50TGlzdCA9IGVsLmdldEF0dHJpYnV0ZShcImRhdGEtY29tcG9uZW50XCIpLm1hdGNoKC9cXFMrL2cpO1xuXHRcdGNvbXBvbmVudExpc3QuZm9yRWFjaCggKGNvbXBvbmVudE5hbWUpID0+IHtcblxuXHRcdFx0Y29uc3QgY29tcG9uZW50SWQgPSBgJHtjb21wb25lbnROYW1lfS0ke2VsZW1lbnRJZH1gO1xuXHRcdFx0YWN0aXZlQ29tcG9uZW50c1tjb21wb25lbnRJZF0gPSB0cnVlO1xuXG5cdFx0XHQvLyBjaGVjayBpZiBjb21wb25lbnQgbm90IGluaXRpYWxpemVkIGJlZm9yZVxuXHRcdFx0aWYgKCF0aGlzLmluaXRpYWxpemVkQ29tcG9uZW50c1tjb21wb25lbnRJZF0pIHtcblx0XHRcdFx0dGhpcy5faW5pdGlhbGl6ZUNvbXBvbmVudChjb21wb25lbnROYW1lLCBjb21wb25lbnRJZCwgZWwsIGRhdGEpXG5cdFx0XHR9XG5cblx0XHR9KTtcblx0fVxuXG5cblx0LyoqXG5cdCAqIENhbGwgY29uc3RydWN0b3Igb2YgY29tcG9uZW50IGFuZCBhZGQgaW5zdGFuY2UgdG8gdGhlIGNvbGxlY3Rpb24gb2YgaW5pdGlhbGl6ZWQgY29tcG9uZW50c1xuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gY29tcG9uZW50TmFtZSAtIE5hbWUgb2YgdGhlIGNvbXBvbmVudCB0byBpbml0aWFsaXplLiBVc2VkIHRvIGxvb2t1cCBjbGFzcyBkZWZpbml0aW9uIGluIGNvbXBvbmVudHMgY29sbGVjdGlvbi5cblx0ICogQHBhcmFtIHtTdHJpbmd9IGNvbXBvbmVudElkIC0gVW5pcXVlIGNvbXBvbmVudCBJRCAoY29tYmluYXRpb24gb2YgY29tcG9uZW50IG5hbWUgYW5kIGVsZW1lbnQgSUQpXG5cdCAqIEBwYXJhbSB7RWxlbWVudH0gZWwgLSBET00gZWxlbWVudCB0aGF0IGlzIHRoZSBjb250ZXh0IG9mIHRoaXMgY29tcG9uZW50XG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gT3B0aW9uYWwgZGF0YSBvYmplY3QgdG8gcGFzcyB0byB0aGUgY29tcG9uZW50IGNvbnN0cnVjdG9yXG5cdCAqL1xuXHRfaW5pdGlhbGl6ZUNvbXBvbmVudChjb21wb25lbnROYW1lLCBjb21wb25lbnRJZCwgZWwsIGRhdGEpIHtcblx0XHRjb25zdCBjb21wb25lbnQgPSB0aGlzLmNvbXBvbmVudHNbY29tcG9uZW50TmFtZV07XG5cblx0XHRpZiAodHlwZW9mIGNvbXBvbmVudCAhPT0gJ2Z1bmN0aW9uJylcblx0XHRcdHRocm93IGBDb21wb25lbnRMb2FkZXI6IHVua25vd24gY29tcG9uZW50ICcke2NvbXBvbmVudE5hbWV9J2A7XG5cblx0XHRsZXQgaW5zdGFuY2UgPSBuZXcgY29tcG9uZW50KGVsLCBkYXRhLCB0aGlzKTtcblxuXHRcdHRoaXMuaW5pdGlhbGl6ZWRDb21wb25lbnRzW2NvbXBvbmVudElkXSA9IGluc3RhbmNlO1xuXHRcdHRoaXMubnVtYmVyT2ZJbml0aWFsaXplZENvbXBvbmVudHMrKztcblx0fVxuXG5cblx0LyoqXG5cdCAqIENhbGwgZGVzdHJveSgpIG9uIGEgY29tcG9uZW50IGluc3RhbmNlIGFuZCByZW1vdmUgaXQgZnJvbSB0aGUgY29sbGVjdGlvbiBvZiBpbml0aWFsaXplZCBjb21wb25lbnRzXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBjb21wb25lbnRJZCAtIFVuaXF1ZSBjb21wb25lbnQgSUQgdXNlZCB0byBmaW5kIGNvbXBvbmVudCBpbnN0YW5jZVxuXHQgKi9cblx0X2Rlc3Ryb3lDb21wb25lbnQoY29tcG9uZW50SWQpIHtcblx0XHRjb25zdCBpbnN0YW5jZSA9IHRoaXMuaW5pdGlhbGl6ZWRDb21wb25lbnRzW2NvbXBvbmVudElkXTtcblx0XHRpZiAoaW5zdGFuY2UgJiYgdHlwZW9mIGluc3RhbmNlLmRlc3Ryb3kgPT09ICdmdW5jdGlvbicpXG5cdFx0XHRpbnN0YW5jZS5kZXN0cm95KCk7XG5cblx0XHQvLyBzYWZlIHRvIGRlbGV0ZSB3aGlsZSBvYmplY3Qga2V5cyB3aGlsZSBsb29waW5naHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8zNDYzMDQ4L2lzLWl0LXNhZmUtdG8tZGVsZXRlLWFuLW9iamVjdC1wcm9wZXJ0eS13aGlsZS1pdGVyYXRpbmctb3Zlci10aGVtXG5cdFx0ZGVsZXRlIHRoaXMuaW5pdGlhbGl6ZWRDb21wb25lbnRzW2NvbXBvbmVudElkXTtcblx0XHR0aGlzLm51bWJlck9mSW5pdGlhbGl6ZWRDb21wb25lbnRzLS07XG5cdH1cblxuXG5cdC8qKlxuXHQgKiBEZXN0cm95IGluYWl0aWFsaXplZCBjb21wb25lbnRzIHRoYXQgbm8gbG9uZ2VyIGFyZSBhY3RpdmVcblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtPYmplY3R9IGFjdGl2ZUNvbXBvbmVudHMgLSBBbGwgY29tcG9uZW50SWRzIGN1cnJlbnRseSBmb3VuZCBpbiB0aGUgRE9NXG5cdCAqL1xuXHRjbGVhblVwXyhhY3RpdmVDb21wb25lbnRzID0ge30pIHtcblx0XHRPYmplY3Qua2V5cyh0aGlzLmluaXRpYWxpemVkQ29tcG9uZW50cykuZm9yRWFjaCggKGNvbXBvbmVudElkKSA9PiB7XG5cdFx0XHRpZiAoIWFjdGl2ZUNvbXBvbmVudHNbY29tcG9uZW50SWRdKSB7XG5cdFx0XHRcdHRoaXMuX2Rlc3Ryb3lDb21wb25lbnQoY29tcG9uZW50SWQpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cblxuXHQvKipcblx0ICogR2VuZXJhdGVzIGEgcmZjNDEyMiB2ZXJzaW9uIDQgY29tcGxpYW50IHVuaXF1ZSBJRFxuXHQgKiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEwNTAzNC9jcmVhdGUtZ3VpZC11dWlkLWluLWphdmFzY3JpcHRcblx0ICogQHByaXZhdGVcblx0ICovXG5cdF9nZW5lcmF0ZVVVSUQoKSB7XG5cdFx0cmV0dXJuICd4eHh4eHh4eC14eHh4LTR4eHgteXh4eC14eHh4eHh4eHh4eHgnLnJlcGxhY2UoL1t4eV0vZywgZnVuY3Rpb24oYykge1xuXHRcdFx0Y29uc3QgciA9IE1hdGgucmFuZG9tKCkqMTZ8MCwgdiA9IGMgPT0gJ3gnID8gciA6IChyJjB4M3wweDgpO1xuXHRcdFx0cmV0dXJuIHYudG9TdHJpbmcoMTYpO1xuXHRcdH0pO1xuXHR9XG59XG5cbi8vIEV4cG9ydCBBTUQsIENvbW1vbkpTL0VTNiBtb2R1bGUgb3IgYXNzdW1lIGdsb2JhbCBuYW1lc3BhY2VcbmlmICh0eXBlb2YgZGVmaW5lICE9PSAndW5kZWZpbmVkJyAmJiBkZWZpbmUuYW1kKSB7XG5cdGRlZmluZShbXSwgQ29tcG9uZW50TG9hZGVyKTtcbn1cbmVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG5cdG1vZHVsZS5leHBvcnRzID0gQ29tcG9uZW50TG9hZGVyO1xufVxuZWxzZSB7XG5cdHdpbmRvdy5Db21wb25lbnRMb2FkZXIgPSBDb21wb25lbnRMb2FkZXI7XG59IiwiaW1wb3J0IENvbXBvbmVudCBmcm9tICdjb21wb25lbnQtbG9hZGVyLWpzL2Rpc3QvZXM2L2NvbXBvbmVudCdcblxuY2xhc3MgRG9raSBleHRlbmRzIENvbXBvbmVudCB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKC4uLmFyZ3VtZW50cyk7XG5cdFx0Y29uc29sZS5sb2coJ25ldyBET0tJIDM2Jyk7XG5cdH1cblxuXHRkZXN0cm95KCkge1xuXHRcdHN1cGVyLmRlc3Ryb3koKTtcblx0XHRjb25zb2xlLmxvZygnZGVzdHJveSBET0tJJyk7XG5cdH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgRG9raTsiLCJpbXBvcnQgQ29tcG9uZW50TG9hZGVyIGZyb20gJ2NvbXBvbmVudC1sb2FkZXItanMnO1xuXG5pbXBvcnQgRG9raSBmcm9tICcuL2Rva2knO1xuXG5cbm5ldyBDb21wb25lbnRMb2FkZXIoe0Rva2l9KS5zY2FuKCk7Il19
