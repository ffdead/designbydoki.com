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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvY29tcG9uZW50LWxvYWRlci1qcy9kaXN0L2VzNi9jb21wb25lbnQuanMiLCJub2RlX21vZHVsZXMvY29tcG9uZW50LWxvYWRlci1qcy9zcmMvY29tcG9uZW50LWxvYWRlci5qcyIsInRoZW1lL2pzL2Rva2kuanMiLCJ0aGVtZS9qcy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUNwUE07OztBQUNMLFVBREssSUFDTCxHQUFjO3dCQURULE1BQ1M7O3FFQURULGtCQUVLLFlBREk7O0FBRWIsVUFBUSxHQUFSLENBQVksYUFBWixFQUZhOztFQUFkOztjQURLOzs0QkFNSztBQUNULDhCQVBJLDRDQU9KLENBRFM7QUFFVCxXQUFRLEdBQVIsQ0FBWSxjQUFaLEVBRlM7Ozs7UUFOTDs7O2tCQVlTOzs7Ozs7Ozs7Ozs7Ozs7QUNUZiwrQkFBQyxDQUFvQixFQUFDLG9CQUFELEVBQXBCLENBQUQsQ0FBOEIsSUFBOUIiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBDb21wb25lbnQgQmFzZSBDbGFzc1xuICogXG4gKiBTZXRzIGFsbCBhcmd1bWVudHMgcGFzc2VkIGluIHRvIGNvbnN0cnVjdG9yIGZyb20gQ29tcG9uZW50TG9hZGVyXG4gKlxuICogRXhwb3NlcyBwdWIvc3ViIG1ldGhvZHMgZm9yIHRyaWdnZXJpbmcgZXZlbnRzIHRvIG90aGVyIGNvbXBvbmVudHNcbiAqXG4gKi9cbmNsYXNzIENvbXBvbmVudCB7XG5cblx0LyoqXG5cdCAqIENvbnN0cnVjdG9yIGZvciB0aGUgQ29tcG9uZW50XG5cdCAqXG5cdCAqIENhbGwgYHN1cGVyKC4uLmFyZ3VtZW50cyk7YCBpbiB0aGUgYmFzZSBjbGFzcyBjb25zdHJ1Y3RvclxuXHQgKlxuXHQgKiBAcHVibGljXG5cdCAqIEBwYXJhbSB7Tm9kZX0gY29udGV4dCAtIERPTSBub2RlIHRoYXQgY29udGFpbnMgdGhlIGNvbXBvbmVudCBtYXJrdXBcblx0ICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBPcHRpb25hbCBkYXRhIG9iamVjdCBmcm9tIENvbXBvbmVudExvYWRlci5zY2FuKClcblx0ICogQHBhcmFtIHtPYmplY3R9IG1lZGlhdG9yIC0gaW5zdGFuY2Ugb2YgQ29tcG9uZW50TG9hZGVyIGZvciBwdWIvc3ViXG5cdCAqL1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHR0aGlzLmVsID0gYXJndW1lbnRzWzBdXG5cdFx0aWYgKHR5cGVvZiBqUXVlcnkgIT09ICd1bmRlZmluZWQnKSB0aGlzLiRlbCA9IGpRdWVyeSh0aGlzLmVsKTtcblx0XHR0aGlzLmRhdGEgPSBhcmd1bWVudHNbMV07XG5cdFx0dGhpcy5fX21lZGlhdG9yID0gYXJndW1lbnRzWzJdO1xuXHR9XG5cblxuXHQvKipcblx0ICogUHVibGlzaCBhbiBldmVudCBmb3Igb3RoZXIgY29tcG9uZW50c1xuXHQgKiBAcHJvdGVjdGVkXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB0b3BpYyAtIEV2ZW50IG5hbWVcblx0ICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBPcHRpb25hbCBwYXJhbXMgdG8gcGFzcyB3aXRoIHRoZSBldmVudFxuXHQgKi9cblx0cHVibGlzaCgpIHtcblx0XHR0aGlzLl9fbWVkaWF0b3IucHVibGlzaCguLi5hcmd1bWVudHMpO1xuXHR9XG5cblxuXHQvKipcblx0ICogU3Vic2NyaWJlIHRvIGFuIGV2ZW50IGZyb20gYW5vdGhlciBjb21wb25lbnRcblx0ICogQHByb3RlY3RlZFxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdG9waWMgLSBFdmVudCBuYW1lXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0gRnVuY3Rpb24gdG8gYmluZFxuXHQgKi9cblx0c3Vic2NyaWJlKHRvcGljLCBjYWxsYmFjaykge1xuXHRcdHRoaXMuX19tZWRpYXRvci5zdWJzY3JpYmUodG9waWMsIGNhbGxiYWNrLCB0aGlzKTtcblx0fVxuXG5cblx0LyoqXG5cdCAqIFVuc3Vic2NyaWJlIGZyb20gYW4gZXZlbnQgZnJvbSBhbm90aGVyIGNvbXBvbmVudFxuXHQgKiBAcHJvdGVjdGVkXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB0b3BpYyAtIEV2ZW50IG5hbWVcblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSBGdW5jdGlvbiB0byB1bmJpbmRcblx0ICovXG5cdHVuc3Vic2NyaWJlKHRvcGljLCBjYWxsYmFjaykge1xuXHRcdHRoaXMuX19tZWRpYXRvci51bnN1YnNjcmliZSh0b3BpYywgY2FsbGJhY2ssIHRoaXMpO1xuXHR9XG5cblxuXHQvKipcblx0ICogVXRpbGl0eSBtZXRob2QgZm9yIHRyaWdnZXJpbmcgdGhlIENvbXBvbmVudExvYWRlciB0byBzY2FuIHRoZSBtYXJrdXAgZm9yIG5ldyBjb21wb25lbnRzXG5cdCAqIEBwcm90ZWN0ZWRcblx0ICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBPcHRpb25hbCBkYXRhIHRvIHBhc3MgdG8gdGhlIGNvbnN0cnVjdG9yIG9mIGFueSBDb21wb25lbnQgaW5pdGlhbGl6ZWQgYnkgdGhpcyBzY2FuXG5cdCAqL1xuXHRzY2FuKGRhdGEpIHtcblx0XHR0aGlzLl9fbWVkaWF0b3Iuc2NhbihkYXRhKTtcblx0fVxuXG5cblx0LyoqXG5cdCAqIFV0aWxpdHkgbWV0aG9kIGZvciBkZWZlcmluZyBhIGZ1bmN0aW9uIGNhbGxcblx0ICogQHByb3RlY3RlZFxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIEZ1bmN0aW9uIHRvIGNhbGxcblx0ICogQHBhcmFtIHtOdW1iZXJ9IG1zIC0gT3B0aW9uYWwgbXMgdG8gZGVsYXksIGRlZmF1bHRzIHRvIDE3bXMgKGp1c3Qgb3ZlciAxIGZyYW1lIGF0IDYwZnBzKVxuXHQgKi9cblx0ZGVmZXIoY2FsbGJhY2ssIG1zID0gMTcpIHtcblx0XHRzZXRUaW1lb3V0KGNhbGxiYWNrLCBtcyk7XG5cdH1cblxuXG5cdC8qKlxuXHQgKiBDYWxsZWQgYnkgQ29tcG9uZW50TG9hZGVyIHdoZW4gY29tcG9uZW50IGlzIG5vIGxvbmdlciBmb3VuZCBpbiB0aGUgbWFya3VwXG5cdCAqIHVzdWFsbHkgaGFwcGVucyBhcyBhIHJlc3VsdCBvZiByZXBsYWNpbmcgdGhlIG1hcmt1cCB1c2luZyBBSkFYXG5cdCAqXHRcblx0ICogT3ZlcnJpZGUgaW4gc3ViY2xhc3MgYW5kIG1ha2Ugc3VyZSB0byBjbGVhbiB1cCBldmVudCBoYW5kbGVycyBldGNcblx0ICpcblx0ICogQHByb3RlY3RlZFxuXHQgKi9cblx0ZGVzdHJveSgpIHtcblxuXHR9XG59XG5cblxuLy8gRXhwb3J0IEFNRCwgQ29tbW9uSlMvRVM2IG1vZHVsZSBvciBhc3N1bWUgZ2xvYmFsIG5hbWVzcGFjZVxuaWYgKHR5cGVvZiBkZWZpbmUgIT09ICd1bmRlZmluZWQnICYmIGRlZmluZS5hbWQpIHtcblx0ZGVmaW5lKFtdLCBDb21wb25lbnQpO1xufVxuZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcblx0bW9kdWxlLmV4cG9ydHMgPSBDb21wb25lbnQ7XG59XG5lbHNlIHtcblx0d2luZG93LkNvbXBvbmVudCA9IENvbXBvbmVudDtcbn0iLCIvKipcbiAqIENvbXBvbmVudExvYWRlciBDbGFzc1xuICpcbiAqIEluc3RhbnRpYXRlcyBKYXZhU2NyaXB0IENsYXNzZXMgd2hlbiB0aGVpciBuYW1lIGlzIGZvdW5kIGluIHRoZSBET00gdXNpbmcgYXR0cmlidXRlIGRhdGEtY29tcG9uZW50PVwiXCJcbiAqXG4gKi9cbmNsYXNzIENvbXBvbmVudExvYWRlciB7XG5cblx0LyoqXG5cdCAqIENvbnN0cnVjdG9yIGZvciB0aGUgQ29tcG9uZW50TG9hZGVyXG5cdCAqIEBjbGFzc1xuXHQgKiBAcHVibGljXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBjb21wb25lbnRzIC0gT3B0aW9uYWwgY29sbGVjdGlvbiBvZiBhdmFpbGFibGUgY29tcG9uZW50czoge2NvbXBvbmVudE5hbWU6IGNsYXNzRGVmaW5pdGlvbn1cblx0ICogQHBhcmFtIHtOb2RlfSBjb250ZXh0IC0gT3B0aW9uYWwgRE9NIG5vZGUgdG8gc2VhcmNoIGZvciBjb21wb25lbnRzLiBEZWZhdWx0cyB0byBkb2N1bWVudC5cblx0ICovXG5cdGNvbnN0cnVjdG9yKGNvbXBvbmVudHMgPSB7fSwgY29udGV4dCA9IGRvY3VtZW50KSB7XG5cdFx0dGhpcy5jb250ZXh0RWwgPSBjb250ZXh0O1xuXHRcdHRoaXMuaW5pdGlhbGl6ZWRDb21wb25lbnRzID0ge307XG5cdFx0dGhpcy5udW1iZXJPZkluaXRpYWxpemVkQ29tcG9uZW50cyA9IDA7XG5cdFx0dGhpcy5jb21wb25lbnRzID0ge307XG5cdFx0dGhpcy50b3BpY3MgPSB7fTtcblx0XHR0aGlzLnJlZ2lzdGVyKGNvbXBvbmVudHMpO1xuXHR9XG5cblxuXHQvKipcblx0ICogQWRkIGNvbXBvbmVudChzKSB0byBjb2xsZWN0aW9uIG9mIGF2YWlsYWJsZSBjb21wb25lbnRzXG5cdCAqIEBwdWJsaWNcblx0ICogQHBhcmFtIHtPYmplY3R9IGNvbXBvbmVudHMgLSBDb2xsZWN0aW9uIG9mIGNvbXBvbmVudHM6IHtjb21wb25lbnROYW1lOiBjbGFzc0RlZmluaXRpb259XG5cdCAqL1xuXHRyZWdpc3Rlcihjb21wb25lbnRzID0ge30pIHtcblx0XHRPYmplY3Qua2V5cyhjb21wb25lbnRzKS5mb3JFYWNoKCAoY29tcG9uZW50TmFtZSkgPT4ge1xuXHRcdFx0dGhpcy5jb21wb25lbnRzW2NvbXBvbmVudE5hbWVdID0gY29tcG9uZW50c1tjb21wb25lbnROYW1lXTtcblx0XHR9KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBSZW1vdmUgY29tcG9uZW50IGZyb20gY29sbGVjdGlvbiBvZiBhdmFpbGFibGUgY29tcG9uZW50c1xuXHQgKiBAcHVibGljXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBjb21wb25lbnROYW1lIC0gTmFtZSBvZiB0aGUgY29tcG9uZW50IHRvIHJlbW92ZVxuXHQgKi9cblx0dW5yZWdpc3Rlcihjb21wb25lbnROYW1lKSB7XG5cdFx0ZGVsZXRlIHRoaXMuY29tcG9uZW50c1tjb21wb25lbnROYW1lXTtcblx0fVxuXG5cdC8qKlxuXHQgKiBNZWRpYXRvciBmdW5jdGlvbmFsaXR5LlxuXHQgKiBTdG9yZXMgdGhlIHRvcGljIGFuZCBjYWxsYmFjayBnaXZlbiBieSB0aGUgY29tcG9uZW50LlxuXHQgKiBmb3IgZnVydGhlciByZWZlcmVuY2UuXG5cdCAqIEBwYXJhbSAge1N0cmluZ30gdG9waWMgICAgICBUb3BpYyBzdHJpbmdcblx0ICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrIENhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgd291bGQgYmUgdHJpZ2dlcmVkLlxuXHQgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY29udGV4dCAgQ2xhc3MgaW5zdGFuY2Ugd2hpY2ggb3ducyB0aGUgY2FsbGJhY2tcblx0ICovXG5cdHN1YnNjcmliZSh0b3BpYywgY2FsbGJhY2ssIGNvbnRleHQpIHtcblxuXHRcdC8vIElzIHRoaXMgYSBuZXcgdG9waWM/XG5cdFx0aWYgKCAhdGhpcy50b3BpY3MuaGFzT3duUHJvcGVydHkodG9waWMpICkge1xuXHRcdFx0dGhpcy50b3BpY3NbdG9waWNdID0gW107XG5cdFx0fVxuXG5cdFx0Ly8gU3RvcmUgdGhlIHN1YnNjcmliZXIgY2FsbGJhY2tcblx0XHR0aGlzLnRvcGljc1t0b3BpY10ucHVzaCggeyBjb250ZXh0OiBjb250ZXh0LCBjYWxsYmFjazogY2FsbGJhY2sgfSApO1xuXG5cdH1cblxuXHQvKipcblx0ICogTWVkaWF0b3IgZnVuY3Rpb25hbGl0eS5cblx0ICogUmVtb3ZlcyB0aGUgc3RvcmVkIHRvcGljIGFuZCBjYWxsYmFjayBnaXZlbiBieSB0aGUgY29tcG9uZW50LlxuXHQgKiBAcGFyYW0gIHtTdHJpbmd9ICAgdG9waWMgICAgVG9waWMgc3RyaW5nXG5cdCAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjYWxsYmFjayBDYWxsYmFjayBmdW5jdGlvbiB0aGF0IHdvdWxkIGJlIHRyaWdnZXJlZC5cblx0ICogQHBhcmFtICB7RnVuY3Rpb259IGNvbnRleHQgIENsYXNzIGluc3RhbmNlIHdoaWNoIG93bnMgdGhlIGNhbGxiYWNrXG5cdCAqIEByZXR1cm4ge0Jvb2xlYW59ICAgICAgICAgICBUcnVlIG9uIHN1Y2Nlc3MsIEZhbHNlIG90aGVyd2lzZS5cblx0ICovXG5cdHVuc3Vic2NyaWJlKHRvcGljLCBjYWxsYmFjaywgY29udGV4dCkge1xuXHRcdC8vIERvIHdlIGhhdmUgdGhpcyB0b3BpYz9cblx0XHRpZiAoIXRoaXMudG9waWNzLmhhc093blByb3BlcnR5KHRvcGljKSkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdC8vIEZpbmQgb3V0IHdoZXJlIHRoaXMgaXMgYW5kIHJlbW92ZSBpdFxuXHRcdGZvciAobGV0IGkgPSAwLCBsZW4gPSB0aGlzLnRvcGljc1t0b3BpY10ubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdGlmICh0aGlzLnRvcGljc1t0b3BpY11baV0uY2FsbGJhY2sgPT09IGNhbGxiYWNrKSB7XG5cdFx0XHRcdGlmICghY29udGV4dCB8fCB0aGlzLnRvcGljc1t0b3BpY11baV0uY29udGV4dCA9PT0gY29udGV4dCkge1xuXHRcdFx0XHRcdHRoaXMudG9waWNzW3RvcGljXS5zcGxpY2UoaSwgMSk7XG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHQvKipcblx0ICogW3B1Ymxpc2ggZGVzY3JpcHRpb25dXG5cdCAqIEBwYXJhbSAge1t0eXBlXX0gdG9waWMgW2Rlc2NyaXB0aW9uXVxuXHQgKiBAcmV0dXJuIHtbdHlwZV19ICAgICAgIFtkZXNjcmlwdGlvbl1cblx0ICovXG5cdHB1Ymxpc2godG9waWMpIHtcblx0XHQvLyBDaGVjayBpZiB3ZSBoYXZlIHN1YmNyaWJlcnMgdG8gdGhpcyB0b3BpY1xuXHRcdGlmICghdGhpcy50b3BpY3MuaGFzT3duUHJvcGVydHkodG9waWMpKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Ly8gZG9uJ3Qgc2xpY2Ugb24gYXJndW1lbnRzIGJlY2F1c2UgaXQgcHJldmVudHMgb3B0aW1pemF0aW9ucyBpbiBKYXZhU2NyaXB0IGVuZ2luZXMgKFY4IGZvciBleGFtcGxlKVxuXHRcdC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0Z1bmN0aW9ucy9hcmd1bWVudHNcblx0XHQvLyBodHRwczovL2dpdGh1Yi5jb20vcGV0a2FhbnRvbm92L2JsdWViaXJkL3dpa2kvT3B0aW1pemF0aW9uLWtpbGxlcnMjMzItbGVha2luZy1hcmd1bWVudHNcblx0XHRjb25zdCBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyArK2kpIHtcblx0XHRcdFx0YXJnc1tpXSA9IGFyZ3VtZW50c1tpICsgMV07IC8vIHJlbW92ZSBmaXJzdCBhcmd1bWVudFxuXHRcdH1cblxuXHRcdC8vIExvb3AgdGhyb3VnaCB0aGVtIGFuZCBmaXJlIHRoZSBjYWxsYmFja3Ncblx0XHRmb3IgKGxldCBpID0gMCwgbGVuID0gdGhpcy50b3BpY3NbdG9waWNdLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRsZXQgc3Vic2NyaXB0aW9uID0gdGhpcy50b3BpY3NbdG9waWNdW2ldO1xuXHRcdFx0Ly8gQ2FsbCBpdCdzIGNhbGxiYWNrXG5cdFx0XHRpZiAoc3Vic2NyaXB0aW9uICYmIHN1YnNjcmlwdGlvbi5jYWxsYmFjaykge1xuXHRcdFx0XHRzdWJzY3JpcHRpb24uY2FsbGJhY2suYXBwbHkoc3Vic2NyaXB0aW9uLmNvbnRleHQsIGFyZ3MpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cblx0LyoqXG5cdCAqIFNjYW4gdGhlIERPTSwgaW5pdGlhbGl6ZSBuZXcgY29tcG9uZW50cyBhbmQgZGVzdHJveSByZW1vdmVkIGNvbXBvbmVudHMuXG5cdCAqIEBwdWJsaWNcblx0ICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBPcHRpb25hbCBkYXRhIG9iamVjdCB0byBwYXNzIHRvIHRoZSBjb21wb25lbnQgY29uc3RydWN0b3Jcblx0ICovXG5cdHNjYW4oZGF0YSA9IHt9KSB7XG5cdFx0Y29uc3QgYWN0aXZlQ29tcG9uZW50cyA9IHt9LFxuXHRcdCAgICAgIGVsZW1lbnRzID0gdGhpcy5jb250ZXh0RWwucXVlcnlTZWxlY3RvckFsbChcIltkYXRhLWNvbXBvbmVudF1cIik7XG5cblx0XHQoW10pLmZvckVhY2guY2FsbChlbGVtZW50cywgKGVsKSA9PiB7XG5cdFx0XHR0aGlzLl9zY2FuRWxlbWVudChlbCwgYWN0aXZlQ29tcG9uZW50cywgZGF0YSk7XG5cdFx0fSk7XG5cblx0XHRpZiAodGhpcy5udW1iZXJPZkluaXRpYWxpemVkQ29tcG9uZW50cyA+IDApIHRoaXMuY2xlYW5VcF8oYWN0aXZlQ29tcG9uZW50cyk7XG5cdH1cblxuXG5cdC8qKlxuXHQgKiBGaW5kIGFsbCBjb21wb25lbnRzIHJlZ2lzdGVyZWQgb24gYSBzcGVjaWZpYyBET00gZWxlbWVudCBhbmQgaW5pdGlhbGl6ZSB0aGVtIGlmIG5ld1xuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge0VsZW1lbnR9IGVsIC0gRE9NIGVsZW1lbnQgdG8gc2NhbiBmb3IgY29tcG9uZW50c1xuXHQgKiBAcGFyYW0ge09iamVjdH0gYWN0aXZlQ29tcG9uZW50cyAtIEFsbCBjb21wb25lbnRJZHMgY3VycmVudGx5IGZvdW5kIGluIHRoZSBET01cblx0ICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBPcHRpb25hbCBkYXRhIG9iamVjdCB0byBwYXNzIHRvIHRoZSBjb21wb25lbnQgY29uc3RydWN0b3Jcblx0ICovXG5cdF9zY2FuRWxlbWVudChlbCwgYWN0aXZlQ29tcG9uZW50cywgZGF0YSkge1xuXHRcdC8vIGNoZWNrIG9mIGNvbXBvbmVudChzKSBmb3IgdGhpcyBET00gZWxlbWVudCBhbHJlYWR5IGhhdmUgYmVlbiBpbml0aWFsaXplZFxuXHRcdGxldCBlbGVtZW50SWQgPSBlbC5nZXRBdHRyaWJ1dGUoXCJkYXRhLWNvbXBvbmVudC1pZFwiKTtcblxuXHRcdGlmICghZWxlbWVudElkKSB7XG5cdFx0XHQvLyBnaXZlIHVuaXF1ZSBpZCBzbyB3ZSBjYW4gdHJhY2sgaXQgb24gbmV4dCBzY2FuXG5cdFx0XHRlbGVtZW50SWQgPSB0aGlzLl9nZW5lcmF0ZVVVSUQoKTtcblx0XHRcdGVsLnNldEF0dHJpYnV0ZSgnZGF0YS1jb21wb25lbnQtaWQnLCBlbGVtZW50SWQpO1xuXHRcdH1cblxuXHRcdC8vIGZpbmQgdGhlIG5hbWUgb2YgdGhlIGNvbXBvbmVudCBpbnN0YW5jZVxuXHRcdGNvbnN0IGNvbXBvbmVudExpc3QgPSBlbC5nZXRBdHRyaWJ1dGUoXCJkYXRhLWNvbXBvbmVudFwiKS5tYXRjaCgvXFxTKy9nKTtcblx0XHRjb21wb25lbnRMaXN0LmZvckVhY2goIChjb21wb25lbnROYW1lKSA9PiB7XG5cblx0XHRcdGNvbnN0IGNvbXBvbmVudElkID0gYCR7Y29tcG9uZW50TmFtZX0tJHtlbGVtZW50SWR9YDtcblx0XHRcdGFjdGl2ZUNvbXBvbmVudHNbY29tcG9uZW50SWRdID0gdHJ1ZTtcblxuXHRcdFx0Ly8gY2hlY2sgaWYgY29tcG9uZW50IG5vdCBpbml0aWFsaXplZCBiZWZvcmVcblx0XHRcdGlmICghdGhpcy5pbml0aWFsaXplZENvbXBvbmVudHNbY29tcG9uZW50SWRdKSB7XG5cdFx0XHRcdHRoaXMuX2luaXRpYWxpemVDb21wb25lbnQoY29tcG9uZW50TmFtZSwgY29tcG9uZW50SWQsIGVsLCBkYXRhKVxuXHRcdFx0fVxuXG5cdFx0fSk7XG5cdH1cblxuXG5cdC8qKlxuXHQgKiBDYWxsIGNvbnN0cnVjdG9yIG9mIGNvbXBvbmVudCBhbmQgYWRkIGluc3RhbmNlIHRvIHRoZSBjb2xsZWN0aW9uIG9mIGluaXRpYWxpemVkIGNvbXBvbmVudHNcblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IGNvbXBvbmVudE5hbWUgLSBOYW1lIG9mIHRoZSBjb21wb25lbnQgdG8gaW5pdGlhbGl6ZS4gVXNlZCB0byBsb29rdXAgY2xhc3MgZGVmaW5pdGlvbiBpbiBjb21wb25lbnRzIGNvbGxlY3Rpb24uXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBjb21wb25lbnRJZCAtIFVuaXF1ZSBjb21wb25lbnQgSUQgKGNvbWJpbmF0aW9uIG9mIGNvbXBvbmVudCBuYW1lIGFuZCBlbGVtZW50IElEKVxuXHQgKiBAcGFyYW0ge0VsZW1lbnR9IGVsIC0gRE9NIGVsZW1lbnQgdGhhdCBpcyB0aGUgY29udGV4dCBvZiB0aGlzIGNvbXBvbmVudFxuXHQgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIE9wdGlvbmFsIGRhdGEgb2JqZWN0IHRvIHBhc3MgdG8gdGhlIGNvbXBvbmVudCBjb25zdHJ1Y3RvclxuXHQgKi9cblx0X2luaXRpYWxpemVDb21wb25lbnQoY29tcG9uZW50TmFtZSwgY29tcG9uZW50SWQsIGVsLCBkYXRhKSB7XG5cdFx0Y29uc3QgY29tcG9uZW50ID0gdGhpcy5jb21wb25lbnRzW2NvbXBvbmVudE5hbWVdO1xuXG5cdFx0aWYgKHR5cGVvZiBjb21wb25lbnQgIT09ICdmdW5jdGlvbicpXG5cdFx0XHR0aHJvdyBgQ29tcG9uZW50TG9hZGVyOiB1bmtub3duIGNvbXBvbmVudCAnJHtjb21wb25lbnROYW1lfSdgO1xuXG5cdFx0bGV0IGluc3RhbmNlID0gbmV3IGNvbXBvbmVudChlbCwgZGF0YSwgdGhpcyk7XG5cblx0XHR0aGlzLmluaXRpYWxpemVkQ29tcG9uZW50c1tjb21wb25lbnRJZF0gPSBpbnN0YW5jZTtcblx0XHR0aGlzLm51bWJlck9mSW5pdGlhbGl6ZWRDb21wb25lbnRzKys7XG5cdH1cblxuXG5cdC8qKlxuXHQgKiBDYWxsIGRlc3Ryb3koKSBvbiBhIGNvbXBvbmVudCBpbnN0YW5jZSBhbmQgcmVtb3ZlIGl0IGZyb20gdGhlIGNvbGxlY3Rpb24gb2YgaW5pdGlhbGl6ZWQgY29tcG9uZW50c1xuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gY29tcG9uZW50SWQgLSBVbmlxdWUgY29tcG9uZW50IElEIHVzZWQgdG8gZmluZCBjb21wb25lbnQgaW5zdGFuY2Vcblx0ICovXG5cdF9kZXN0cm95Q29tcG9uZW50KGNvbXBvbmVudElkKSB7XG5cdFx0Y29uc3QgaW5zdGFuY2UgPSB0aGlzLmluaXRpYWxpemVkQ29tcG9uZW50c1tjb21wb25lbnRJZF07XG5cdFx0aWYgKGluc3RhbmNlICYmIHR5cGVvZiBpbnN0YW5jZS5kZXN0cm95ID09PSAnZnVuY3Rpb24nKVxuXHRcdFx0aW5zdGFuY2UuZGVzdHJveSgpO1xuXG5cdFx0Ly8gc2FmZSB0byBkZWxldGUgd2hpbGUgb2JqZWN0IGtleXMgd2hpbGUgbG9vcGluZ2h0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMzQ2MzA0OC9pcy1pdC1zYWZlLXRvLWRlbGV0ZS1hbi1vYmplY3QtcHJvcGVydHktd2hpbGUtaXRlcmF0aW5nLW92ZXItdGhlbVxuXHRcdGRlbGV0ZSB0aGlzLmluaXRpYWxpemVkQ29tcG9uZW50c1tjb21wb25lbnRJZF07XG5cdFx0dGhpcy5udW1iZXJPZkluaXRpYWxpemVkQ29tcG9uZW50cy0tO1xuXHR9XG5cblxuXHQvKipcblx0ICogRGVzdHJveSBpbmFpdGlhbGl6ZWQgY29tcG9uZW50cyB0aGF0IG5vIGxvbmdlciBhcmUgYWN0aXZlXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBhY3RpdmVDb21wb25lbnRzIC0gQWxsIGNvbXBvbmVudElkcyBjdXJyZW50bHkgZm91bmQgaW4gdGhlIERPTVxuXHQgKi9cblx0Y2xlYW5VcF8oYWN0aXZlQ29tcG9uZW50cyA9IHt9KSB7XG5cdFx0T2JqZWN0LmtleXModGhpcy5pbml0aWFsaXplZENvbXBvbmVudHMpLmZvckVhY2goIChjb21wb25lbnRJZCkgPT4ge1xuXHRcdFx0aWYgKCFhY3RpdmVDb21wb25lbnRzW2NvbXBvbmVudElkXSkge1xuXHRcdFx0XHR0aGlzLl9kZXN0cm95Q29tcG9uZW50KGNvbXBvbmVudElkKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXG5cblx0LyoqXG5cdCAqIEdlbmVyYXRlcyBhIHJmYzQxMjIgdmVyc2lvbiA0IGNvbXBsaWFudCB1bmlxdWUgSURcblx0ICogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xMDUwMzQvY3JlYXRlLWd1aWQtdXVpZC1pbi1qYXZhc2NyaXB0XG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRfZ2VuZXJhdGVVVUlEKCkge1xuXHRcdHJldHVybiAneHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uKGMpIHtcblx0XHRcdGNvbnN0IHIgPSBNYXRoLnJhbmRvbSgpKjE2fDAsIHYgPSBjID09ICd4JyA/IHIgOiAociYweDN8MHg4KTtcblx0XHRcdHJldHVybiB2LnRvU3RyaW5nKDE2KTtcblx0XHR9KTtcblx0fVxufVxuXG4vLyBFeHBvcnQgQU1ELCBDb21tb25KUy9FUzYgbW9kdWxlIG9yIGFzc3VtZSBnbG9iYWwgbmFtZXNwYWNlXG5pZiAodHlwZW9mIGRlZmluZSAhPT0gJ3VuZGVmaW5lZCcgJiYgZGVmaW5lLmFtZCkge1xuXHRkZWZpbmUoW10sIENvbXBvbmVudExvYWRlcik7XG59XG5lbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuXHRtb2R1bGUuZXhwb3J0cyA9IENvbXBvbmVudExvYWRlcjtcbn1cbmVsc2Uge1xuXHR3aW5kb3cuQ29tcG9uZW50TG9hZGVyID0gQ29tcG9uZW50TG9hZGVyO1xufSIsImltcG9ydCBDb21wb25lbnQgZnJvbSAnY29tcG9uZW50LWxvYWRlci1qcy9kaXN0L2VzNi9jb21wb25lbnQnXG5cbmNsYXNzIERva2kgZXh0ZW5kcyBDb21wb25lbnQge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlciguLi5hcmd1bWVudHMpO1xuXHRcdGNvbnNvbGUubG9nKCduZXcgRE9LSSAzNicpO1xuXHR9XG5cblx0ZGVzdHJveSgpIHtcblx0XHRzdXBlci5kZXN0cm95KCk7XG5cdFx0Y29uc29sZS5sb2coJ2Rlc3Ryb3kgRE9LSScpO1xuXHR9XG59XG5cbmV4cG9ydCBkZWZhdWx0IERva2k7IiwiaW1wb3J0IENvbXBvbmVudExvYWRlciBmcm9tICdjb21wb25lbnQtbG9hZGVyLWpzJztcblxuaW1wb3J0IERva2kgZnJvbSAnLi9kb2tpJztcblxuXG4obmV3IENvbXBvbmVudExvYWRlcih7RG9raX0pKS5zY2FuKCk7Il19
