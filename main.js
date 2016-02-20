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

		var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Doki).call(this));

		console.log('DOKI 36', jQuery);
		return _this;
	}

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

new _doki2.default();

new _componentLoaderJs2.default();

},{"./doki":3,"component-loader-js":2}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvY29tcG9uZW50LWxvYWRlci1qcy9kaXN0L2VzNi9jb21wb25lbnQuanMiLCJub2RlX21vZHVsZXMvY29tcG9uZW50LWxvYWRlci1qcy9zcmMvY29tcG9uZW50LWxvYWRlci5qcyIsInRoZW1lL2pzL2Rva2kuanMiLCJ0aGVtZS9qcy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQ3BQTTs7O0FBQ0wsVUFESyxJQUNMLEdBQWM7d0JBRFQsTUFDUzs7cUVBRFQsa0JBQ1M7O0FBRWIsVUFBUSxHQUFSLENBQVksU0FBWixFQUF1QixNQUF2QixFQUZhOztFQUFkOztRQURLOzs7a0JBT1M7Ozs7Ozs7Ozs7Ozs7OztBQ0xmOztBQUVBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogQ29tcG9uZW50IEJhc2UgQ2xhc3NcbiAqIFxuICogU2V0cyBhbGwgYXJndW1lbnRzIHBhc3NlZCBpbiB0byBjb25zdHJ1Y3RvciBmcm9tIENvbXBvbmVudExvYWRlclxuICpcbiAqIEV4cG9zZXMgcHViL3N1YiBtZXRob2RzIGZvciB0cmlnZ2VyaW5nIGV2ZW50cyB0byBvdGhlciBjb21wb25lbnRzXG4gKlxuICovXG5jbGFzcyBDb21wb25lbnQge1xuXG5cdC8qKlxuXHQgKiBDb25zdHJ1Y3RvciBmb3IgdGhlIENvbXBvbmVudFxuXHQgKlxuXHQgKiBDYWxsIGBzdXBlciguLi5hcmd1bWVudHMpO2AgaW4gdGhlIGJhc2UgY2xhc3MgY29uc3RydWN0b3Jcblx0ICpcblx0ICogQHB1YmxpY1xuXHQgKiBAcGFyYW0ge05vZGV9IGNvbnRleHQgLSBET00gbm9kZSB0aGF0IGNvbnRhaW5zIHRoZSBjb21wb25lbnQgbWFya3VwXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gT3B0aW9uYWwgZGF0YSBvYmplY3QgZnJvbSBDb21wb25lbnRMb2FkZXIuc2NhbigpXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBtZWRpYXRvciAtIGluc3RhbmNlIG9mIENvbXBvbmVudExvYWRlciBmb3IgcHViL3N1YlxuXHQgKi9cblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0dGhpcy5lbCA9IGFyZ3VtZW50c1swXVxuXHRcdGlmICh0eXBlb2YgalF1ZXJ5ICE9PSAndW5kZWZpbmVkJykgdGhpcy4kZWwgPSBqUXVlcnkodGhpcy5lbCk7XG5cdFx0dGhpcy5kYXRhID0gYXJndW1lbnRzWzFdO1xuXHRcdHRoaXMuX19tZWRpYXRvciA9IGFyZ3VtZW50c1syXTtcblx0fVxuXG5cblx0LyoqXG5cdCAqIFB1Ymxpc2ggYW4gZXZlbnQgZm9yIG90aGVyIGNvbXBvbmVudHNcblx0ICogQHByb3RlY3RlZFxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdG9waWMgLSBFdmVudCBuYW1lXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gT3B0aW9uYWwgcGFyYW1zIHRvIHBhc3Mgd2l0aCB0aGUgZXZlbnRcblx0ICovXG5cdHB1Ymxpc2goKSB7XG5cdFx0dGhpcy5fX21lZGlhdG9yLnB1Ymxpc2goLi4uYXJndW1lbnRzKTtcblx0fVxuXG5cblx0LyoqXG5cdCAqIFN1YnNjcmliZSB0byBhbiBldmVudCBmcm9tIGFub3RoZXIgY29tcG9uZW50XG5cdCAqIEBwcm90ZWN0ZWRcblx0ICogQHBhcmFtIHtTdHJpbmd9IHRvcGljIC0gRXZlbnQgbmFtZVxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIEZ1bmN0aW9uIHRvIGJpbmRcblx0ICovXG5cdHN1YnNjcmliZSh0b3BpYywgY2FsbGJhY2spIHtcblx0XHR0aGlzLl9fbWVkaWF0b3Iuc3Vic2NyaWJlKHRvcGljLCBjYWxsYmFjaywgdGhpcyk7XG5cdH1cblxuXG5cdC8qKlxuXHQgKiBVbnN1YnNjcmliZSBmcm9tIGFuIGV2ZW50IGZyb20gYW5vdGhlciBjb21wb25lbnRcblx0ICogQHByb3RlY3RlZFxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdG9waWMgLSBFdmVudCBuYW1lXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0gRnVuY3Rpb24gdG8gdW5iaW5kXG5cdCAqL1xuXHR1bnN1YnNjcmliZSh0b3BpYywgY2FsbGJhY2spIHtcblx0XHR0aGlzLl9fbWVkaWF0b3IudW5zdWJzY3JpYmUodG9waWMsIGNhbGxiYWNrLCB0aGlzKTtcblx0fVxuXG5cblx0LyoqXG5cdCAqIFV0aWxpdHkgbWV0aG9kIGZvciB0cmlnZ2VyaW5nIHRoZSBDb21wb25lbnRMb2FkZXIgdG8gc2NhbiB0aGUgbWFya3VwIGZvciBuZXcgY29tcG9uZW50c1xuXHQgKiBAcHJvdGVjdGVkXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gT3B0aW9uYWwgZGF0YSB0byBwYXNzIHRvIHRoZSBjb25zdHJ1Y3RvciBvZiBhbnkgQ29tcG9uZW50IGluaXRpYWxpemVkIGJ5IHRoaXMgc2NhblxuXHQgKi9cblx0c2NhbihkYXRhKSB7XG5cdFx0dGhpcy5fX21lZGlhdG9yLnNjYW4oZGF0YSk7XG5cdH1cblxuXG5cdC8qKlxuXHQgKiBVdGlsaXR5IG1ldGhvZCBmb3IgZGVmZXJpbmcgYSBmdW5jdGlvbiBjYWxsXG5cdCAqIEBwcm90ZWN0ZWRcblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSBGdW5jdGlvbiB0byBjYWxsXG5cdCAqIEBwYXJhbSB7TnVtYmVyfSBtcyAtIE9wdGlvbmFsIG1zIHRvIGRlbGF5LCBkZWZhdWx0cyB0byAxN21zIChqdXN0IG92ZXIgMSBmcmFtZSBhdCA2MGZwcylcblx0ICovXG5cdGRlZmVyKGNhbGxiYWNrLCBtcyA9IDE3KSB7XG5cdFx0c2V0VGltZW91dChjYWxsYmFjaywgbXMpO1xuXHR9XG5cblxuXHQvKipcblx0ICogQ2FsbGVkIGJ5IENvbXBvbmVudExvYWRlciB3aGVuIGNvbXBvbmVudCBpcyBubyBsb25nZXIgZm91bmQgaW4gdGhlIG1hcmt1cFxuXHQgKiB1c3VhbGx5IGhhcHBlbnMgYXMgYSByZXN1bHQgb2YgcmVwbGFjaW5nIHRoZSBtYXJrdXAgdXNpbmcgQUpBWFxuXHQgKlx0XG5cdCAqIE92ZXJyaWRlIGluIHN1YmNsYXNzIGFuZCBtYWtlIHN1cmUgdG8gY2xlYW4gdXAgZXZlbnQgaGFuZGxlcnMgZXRjXG5cdCAqXG5cdCAqIEBwcm90ZWN0ZWRcblx0ICovXG5cdGRlc3Ryb3koKSB7XG5cblx0fVxufVxuXG5cbi8vIEV4cG9ydCBBTUQsIENvbW1vbkpTL0VTNiBtb2R1bGUgb3IgYXNzdW1lIGdsb2JhbCBuYW1lc3BhY2VcbmlmICh0eXBlb2YgZGVmaW5lICE9PSAndW5kZWZpbmVkJyAmJiBkZWZpbmUuYW1kKSB7XG5cdGRlZmluZShbXSwgQ29tcG9uZW50KTtcbn1cbmVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG5cdG1vZHVsZS5leHBvcnRzID0gQ29tcG9uZW50O1xufVxuZWxzZSB7XG5cdHdpbmRvdy5Db21wb25lbnQgPSBDb21wb25lbnQ7XG59IiwiLyoqXG4gKiBDb21wb25lbnRMb2FkZXIgQ2xhc3NcbiAqXG4gKiBJbnN0YW50aWF0ZXMgSmF2YVNjcmlwdCBDbGFzc2VzIHdoZW4gdGhlaXIgbmFtZSBpcyBmb3VuZCBpbiB0aGUgRE9NIHVzaW5nIGF0dHJpYnV0ZSBkYXRhLWNvbXBvbmVudD1cIlwiXG4gKlxuICovXG5jbGFzcyBDb21wb25lbnRMb2FkZXIge1xuXG5cdC8qKlxuXHQgKiBDb25zdHJ1Y3RvciBmb3IgdGhlIENvbXBvbmVudExvYWRlclxuXHQgKiBAY2xhc3Ncblx0ICogQHB1YmxpY1xuXHQgKiBAcGFyYW0ge09iamVjdH0gY29tcG9uZW50cyAtIE9wdGlvbmFsIGNvbGxlY3Rpb24gb2YgYXZhaWxhYmxlIGNvbXBvbmVudHM6IHtjb21wb25lbnROYW1lOiBjbGFzc0RlZmluaXRpb259XG5cdCAqIEBwYXJhbSB7Tm9kZX0gY29udGV4dCAtIE9wdGlvbmFsIERPTSBub2RlIHRvIHNlYXJjaCBmb3IgY29tcG9uZW50cy4gRGVmYXVsdHMgdG8gZG9jdW1lbnQuXG5cdCAqL1xuXHRjb25zdHJ1Y3Rvcihjb21wb25lbnRzID0ge30sIGNvbnRleHQgPSBkb2N1bWVudCkge1xuXHRcdHRoaXMuY29udGV4dEVsID0gY29udGV4dDtcblx0XHR0aGlzLmluaXRpYWxpemVkQ29tcG9uZW50cyA9IHt9O1xuXHRcdHRoaXMubnVtYmVyT2ZJbml0aWFsaXplZENvbXBvbmVudHMgPSAwO1xuXHRcdHRoaXMuY29tcG9uZW50cyA9IHt9O1xuXHRcdHRoaXMudG9waWNzID0ge307XG5cdFx0dGhpcy5yZWdpc3Rlcihjb21wb25lbnRzKTtcblx0fVxuXG5cblx0LyoqXG5cdCAqIEFkZCBjb21wb25lbnQocykgdG8gY29sbGVjdGlvbiBvZiBhdmFpbGFibGUgY29tcG9uZW50c1xuXHQgKiBAcHVibGljXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBjb21wb25lbnRzIC0gQ29sbGVjdGlvbiBvZiBjb21wb25lbnRzOiB7Y29tcG9uZW50TmFtZTogY2xhc3NEZWZpbml0aW9ufVxuXHQgKi9cblx0cmVnaXN0ZXIoY29tcG9uZW50cyA9IHt9KSB7XG5cdFx0T2JqZWN0LmtleXMoY29tcG9uZW50cykuZm9yRWFjaCggKGNvbXBvbmVudE5hbWUpID0+IHtcblx0XHRcdHRoaXMuY29tcG9uZW50c1tjb21wb25lbnROYW1lXSA9IGNvbXBvbmVudHNbY29tcG9uZW50TmFtZV07XG5cdFx0fSk7XG5cdH1cblxuXHQvKipcblx0ICogUmVtb3ZlIGNvbXBvbmVudCBmcm9tIGNvbGxlY3Rpb24gb2YgYXZhaWxhYmxlIGNvbXBvbmVudHNcblx0ICogQHB1YmxpY1xuXHQgKiBAcGFyYW0ge1N0cmluZ30gY29tcG9uZW50TmFtZSAtIE5hbWUgb2YgdGhlIGNvbXBvbmVudCB0byByZW1vdmVcblx0ICovXG5cdHVucmVnaXN0ZXIoY29tcG9uZW50TmFtZSkge1xuXHRcdGRlbGV0ZSB0aGlzLmNvbXBvbmVudHNbY29tcG9uZW50TmFtZV07XG5cdH1cblxuXHQvKipcblx0ICogTWVkaWF0b3IgZnVuY3Rpb25hbGl0eS5cblx0ICogU3RvcmVzIHRoZSB0b3BpYyBhbmQgY2FsbGJhY2sgZ2l2ZW4gYnkgdGhlIGNvbXBvbmVudC5cblx0ICogZm9yIGZ1cnRoZXIgcmVmZXJlbmNlLlxuXHQgKiBAcGFyYW0gIHtTdHJpbmd9IHRvcGljICAgICAgVG9waWMgc3RyaW5nXG5cdCAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjYWxsYmFjayBDYWxsYmFjayBmdW5jdGlvbiB0aGF0IHdvdWxkIGJlIHRyaWdnZXJlZC5cblx0ICogQHBhcmFtICB7RnVuY3Rpb259IGNvbnRleHQgIENsYXNzIGluc3RhbmNlIHdoaWNoIG93bnMgdGhlIGNhbGxiYWNrXG5cdCAqL1xuXHRzdWJzY3JpYmUodG9waWMsIGNhbGxiYWNrLCBjb250ZXh0KSB7XG5cblx0XHQvLyBJcyB0aGlzIGEgbmV3IHRvcGljP1xuXHRcdGlmICggIXRoaXMudG9waWNzLmhhc093blByb3BlcnR5KHRvcGljKSApIHtcblx0XHRcdHRoaXMudG9waWNzW3RvcGljXSA9IFtdO1xuXHRcdH1cblxuXHRcdC8vIFN0b3JlIHRoZSBzdWJzY3JpYmVyIGNhbGxiYWNrXG5cdFx0dGhpcy50b3BpY3NbdG9waWNdLnB1c2goIHsgY29udGV4dDogY29udGV4dCwgY2FsbGJhY2s6IGNhbGxiYWNrIH0gKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIE1lZGlhdG9yIGZ1bmN0aW9uYWxpdHkuXG5cdCAqIFJlbW92ZXMgdGhlIHN0b3JlZCB0b3BpYyBhbmQgY2FsbGJhY2sgZ2l2ZW4gYnkgdGhlIGNvbXBvbmVudC5cblx0ICogQHBhcmFtICB7U3RyaW5nfSAgIHRvcGljICAgIFRvcGljIHN0cmluZ1xuXHQgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY2FsbGJhY2sgQ2FsbGJhY2sgZnVuY3Rpb24gdGhhdCB3b3VsZCBiZSB0cmlnZ2VyZWQuXG5cdCAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjb250ZXh0ICBDbGFzcyBpbnN0YW5jZSB3aGljaCBvd25zIHRoZSBjYWxsYmFja1xuXHQgKiBAcmV0dXJuIHtCb29sZWFufSAgICAgICAgICAgVHJ1ZSBvbiBzdWNjZXNzLCBGYWxzZSBvdGhlcndpc2UuXG5cdCAqL1xuXHR1bnN1YnNjcmliZSh0b3BpYywgY2FsbGJhY2ssIGNvbnRleHQpIHtcblx0XHQvLyBEbyB3ZSBoYXZlIHRoaXMgdG9waWM/XG5cdFx0aWYgKCF0aGlzLnRvcGljcy5oYXNPd25Qcm9wZXJ0eSh0b3BpYykpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBGaW5kIG91dCB3aGVyZSB0aGlzIGlzIGFuZCByZW1vdmUgaXRcblx0XHRmb3IgKGxldCBpID0gMCwgbGVuID0gdGhpcy50b3BpY3NbdG9waWNdLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRpZiAodGhpcy50b3BpY3NbdG9waWNdW2ldLmNhbGxiYWNrID09PSBjYWxsYmFjaykge1xuXHRcdFx0XHRpZiAoIWNvbnRleHQgfHwgdGhpcy50b3BpY3NbdG9waWNdW2ldLmNvbnRleHQgPT09IGNvbnRleHQpIHtcblx0XHRcdFx0XHR0aGlzLnRvcGljc1t0b3BpY10uc3BsaWNlKGksIDEpO1xuXHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0LyoqXG5cdCAqIFtwdWJsaXNoIGRlc2NyaXB0aW9uXVxuXHQgKiBAcGFyYW0gIHtbdHlwZV19IHRvcGljIFtkZXNjcmlwdGlvbl1cblx0ICogQHJldHVybiB7W3R5cGVdfSAgICAgICBbZGVzY3JpcHRpb25dXG5cdCAqL1xuXHRwdWJsaXNoKHRvcGljKSB7XG5cdFx0Ly8gQ2hlY2sgaWYgd2UgaGF2ZSBzdWJjcmliZXJzIHRvIHRoaXMgdG9waWNcblx0XHRpZiAoIXRoaXMudG9waWNzLmhhc093blByb3BlcnR5KHRvcGljKSkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdC8vIGRvbid0IHNsaWNlIG9uIGFyZ3VtZW50cyBiZWNhdXNlIGl0IHByZXZlbnRzIG9wdGltaXphdGlvbnMgaW4gSmF2YVNjcmlwdCBlbmdpbmVzIChWOCBmb3IgZXhhbXBsZSlcblx0XHQvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9GdW5jdGlvbnMvYXJndW1lbnRzXG5cdFx0Ly8gaHR0cHM6Ly9naXRodWIuY29tL3BldGthYW50b25vdi9ibHVlYmlyZC93aWtpL09wdGltaXphdGlvbi1raWxsZXJzIzMyLWxlYWtpbmctYXJndW1lbnRzXG5cdFx0Y29uc3QgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgKytpKSB7XG5cdFx0XHRcdGFyZ3NbaV0gPSBhcmd1bWVudHNbaSArIDFdOyAvLyByZW1vdmUgZmlyc3QgYXJndW1lbnRcblx0XHR9XG5cblx0XHQvLyBMb29wIHRocm91Z2ggdGhlbSBhbmQgZmlyZSB0aGUgY2FsbGJhY2tzXG5cdFx0Zm9yIChsZXQgaSA9IDAsIGxlbiA9IHRoaXMudG9waWNzW3RvcGljXS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0bGV0IHN1YnNjcmlwdGlvbiA9IHRoaXMudG9waWNzW3RvcGljXVtpXTtcblx0XHRcdC8vIENhbGwgaXQncyBjYWxsYmFja1xuXHRcdFx0aWYgKHN1YnNjcmlwdGlvbiAmJiBzdWJzY3JpcHRpb24uY2FsbGJhY2spIHtcblx0XHRcdFx0c3Vic2NyaXB0aW9uLmNhbGxiYWNrLmFwcGx5KHN1YnNjcmlwdGlvbi5jb250ZXh0LCBhcmdzKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxuXG5cdC8qKlxuXHQgKiBTY2FuIHRoZSBET00sIGluaXRpYWxpemUgbmV3IGNvbXBvbmVudHMgYW5kIGRlc3Ryb3kgcmVtb3ZlZCBjb21wb25lbnRzLlxuXHQgKiBAcHVibGljXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gT3B0aW9uYWwgZGF0YSBvYmplY3QgdG8gcGFzcyB0byB0aGUgY29tcG9uZW50IGNvbnN0cnVjdG9yXG5cdCAqL1xuXHRzY2FuKGRhdGEgPSB7fSkge1xuXHRcdGNvbnN0IGFjdGl2ZUNvbXBvbmVudHMgPSB7fSxcblx0XHQgICAgICBlbGVtZW50cyA9IHRoaXMuY29udGV4dEVsLnF1ZXJ5U2VsZWN0b3JBbGwoXCJbZGF0YS1jb21wb25lbnRdXCIpO1xuXG5cdFx0KFtdKS5mb3JFYWNoLmNhbGwoZWxlbWVudHMsIChlbCkgPT4ge1xuXHRcdFx0dGhpcy5fc2NhbkVsZW1lbnQoZWwsIGFjdGl2ZUNvbXBvbmVudHMsIGRhdGEpO1xuXHRcdH0pO1xuXG5cdFx0aWYgKHRoaXMubnVtYmVyT2ZJbml0aWFsaXplZENvbXBvbmVudHMgPiAwKSB0aGlzLmNsZWFuVXBfKGFjdGl2ZUNvbXBvbmVudHMpO1xuXHR9XG5cblxuXHQvKipcblx0ICogRmluZCBhbGwgY29tcG9uZW50cyByZWdpc3RlcmVkIG9uIGEgc3BlY2lmaWMgRE9NIGVsZW1lbnQgYW5kIGluaXRpYWxpemUgdGhlbSBpZiBuZXdcblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtFbGVtZW50fSBlbCAtIERPTSBlbGVtZW50IHRvIHNjYW4gZm9yIGNvbXBvbmVudHNcblx0ICogQHBhcmFtIHtPYmplY3R9IGFjdGl2ZUNvbXBvbmVudHMgLSBBbGwgY29tcG9uZW50SWRzIGN1cnJlbnRseSBmb3VuZCBpbiB0aGUgRE9NXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gT3B0aW9uYWwgZGF0YSBvYmplY3QgdG8gcGFzcyB0byB0aGUgY29tcG9uZW50IGNvbnN0cnVjdG9yXG5cdCAqL1xuXHRfc2NhbkVsZW1lbnQoZWwsIGFjdGl2ZUNvbXBvbmVudHMsIGRhdGEpIHtcblx0XHQvLyBjaGVjayBvZiBjb21wb25lbnQocykgZm9yIHRoaXMgRE9NIGVsZW1lbnQgYWxyZWFkeSBoYXZlIGJlZW4gaW5pdGlhbGl6ZWRcblx0XHRsZXQgZWxlbWVudElkID0gZWwuZ2V0QXR0cmlidXRlKFwiZGF0YS1jb21wb25lbnQtaWRcIik7XG5cblx0XHRpZiAoIWVsZW1lbnRJZCkge1xuXHRcdFx0Ly8gZ2l2ZSB1bmlxdWUgaWQgc28gd2UgY2FuIHRyYWNrIGl0IG9uIG5leHQgc2NhblxuXHRcdFx0ZWxlbWVudElkID0gdGhpcy5fZ2VuZXJhdGVVVUlEKCk7XG5cdFx0XHRlbC5zZXRBdHRyaWJ1dGUoJ2RhdGEtY29tcG9uZW50LWlkJywgZWxlbWVudElkKTtcblx0XHR9XG5cblx0XHQvLyBmaW5kIHRoZSBuYW1lIG9mIHRoZSBjb21wb25lbnQgaW5zdGFuY2Vcblx0XHRjb25zdCBjb21wb25lbnRMaXN0ID0gZWwuZ2V0QXR0cmlidXRlKFwiZGF0YS1jb21wb25lbnRcIikubWF0Y2goL1xcUysvZyk7XG5cdFx0Y29tcG9uZW50TGlzdC5mb3JFYWNoKCAoY29tcG9uZW50TmFtZSkgPT4ge1xuXG5cdFx0XHRjb25zdCBjb21wb25lbnRJZCA9IGAke2NvbXBvbmVudE5hbWV9LSR7ZWxlbWVudElkfWA7XG5cdFx0XHRhY3RpdmVDb21wb25lbnRzW2NvbXBvbmVudElkXSA9IHRydWU7XG5cblx0XHRcdC8vIGNoZWNrIGlmIGNvbXBvbmVudCBub3QgaW5pdGlhbGl6ZWQgYmVmb3JlXG5cdFx0XHRpZiAoIXRoaXMuaW5pdGlhbGl6ZWRDb21wb25lbnRzW2NvbXBvbmVudElkXSkge1xuXHRcdFx0XHR0aGlzLl9pbml0aWFsaXplQ29tcG9uZW50KGNvbXBvbmVudE5hbWUsIGNvbXBvbmVudElkLCBlbCwgZGF0YSlcblx0XHRcdH1cblxuXHRcdH0pO1xuXHR9XG5cblxuXHQvKipcblx0ICogQ2FsbCBjb25zdHJ1Y3RvciBvZiBjb21wb25lbnQgYW5kIGFkZCBpbnN0YW5jZSB0byB0aGUgY29sbGVjdGlvbiBvZiBpbml0aWFsaXplZCBjb21wb25lbnRzXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBjb21wb25lbnROYW1lIC0gTmFtZSBvZiB0aGUgY29tcG9uZW50IHRvIGluaXRpYWxpemUuIFVzZWQgdG8gbG9va3VwIGNsYXNzIGRlZmluaXRpb24gaW4gY29tcG9uZW50cyBjb2xsZWN0aW9uLlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gY29tcG9uZW50SWQgLSBVbmlxdWUgY29tcG9uZW50IElEIChjb21iaW5hdGlvbiBvZiBjb21wb25lbnQgbmFtZSBhbmQgZWxlbWVudCBJRClcblx0ICogQHBhcmFtIHtFbGVtZW50fSBlbCAtIERPTSBlbGVtZW50IHRoYXQgaXMgdGhlIGNvbnRleHQgb2YgdGhpcyBjb21wb25lbnRcblx0ICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBPcHRpb25hbCBkYXRhIG9iamVjdCB0byBwYXNzIHRvIHRoZSBjb21wb25lbnQgY29uc3RydWN0b3Jcblx0ICovXG5cdF9pbml0aWFsaXplQ29tcG9uZW50KGNvbXBvbmVudE5hbWUsIGNvbXBvbmVudElkLCBlbCwgZGF0YSkge1xuXHRcdGNvbnN0IGNvbXBvbmVudCA9IHRoaXMuY29tcG9uZW50c1tjb21wb25lbnROYW1lXTtcblxuXHRcdGlmICh0eXBlb2YgY29tcG9uZW50ICE9PSAnZnVuY3Rpb24nKVxuXHRcdFx0dGhyb3cgYENvbXBvbmVudExvYWRlcjogdW5rbm93biBjb21wb25lbnQgJyR7Y29tcG9uZW50TmFtZX0nYDtcblxuXHRcdGxldCBpbnN0YW5jZSA9IG5ldyBjb21wb25lbnQoZWwsIGRhdGEsIHRoaXMpO1xuXG5cdFx0dGhpcy5pbml0aWFsaXplZENvbXBvbmVudHNbY29tcG9uZW50SWRdID0gaW5zdGFuY2U7XG5cdFx0dGhpcy5udW1iZXJPZkluaXRpYWxpemVkQ29tcG9uZW50cysrO1xuXHR9XG5cblxuXHQvKipcblx0ICogQ2FsbCBkZXN0cm95KCkgb24gYSBjb21wb25lbnQgaW5zdGFuY2UgYW5kIHJlbW92ZSBpdCBmcm9tIHRoZSBjb2xsZWN0aW9uIG9mIGluaXRpYWxpemVkIGNvbXBvbmVudHNcblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IGNvbXBvbmVudElkIC0gVW5pcXVlIGNvbXBvbmVudCBJRCB1c2VkIHRvIGZpbmQgY29tcG9uZW50IGluc3RhbmNlXG5cdCAqL1xuXHRfZGVzdHJveUNvbXBvbmVudChjb21wb25lbnRJZCkge1xuXHRcdGNvbnN0IGluc3RhbmNlID0gdGhpcy5pbml0aWFsaXplZENvbXBvbmVudHNbY29tcG9uZW50SWRdO1xuXHRcdGlmIChpbnN0YW5jZSAmJiB0eXBlb2YgaW5zdGFuY2UuZGVzdHJveSA9PT0gJ2Z1bmN0aW9uJylcblx0XHRcdGluc3RhbmNlLmRlc3Ryb3koKTtcblxuXHRcdC8vIHNhZmUgdG8gZGVsZXRlIHdoaWxlIG9iamVjdCBrZXlzIHdoaWxlIGxvb3BpbmdodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzM0NjMwNDgvaXMtaXQtc2FmZS10by1kZWxldGUtYW4tb2JqZWN0LXByb3BlcnR5LXdoaWxlLWl0ZXJhdGluZy1vdmVyLXRoZW1cblx0XHRkZWxldGUgdGhpcy5pbml0aWFsaXplZENvbXBvbmVudHNbY29tcG9uZW50SWRdO1xuXHRcdHRoaXMubnVtYmVyT2ZJbml0aWFsaXplZENvbXBvbmVudHMtLTtcblx0fVxuXG5cblx0LyoqXG5cdCAqIERlc3Ryb3kgaW5haXRpYWxpemVkIGNvbXBvbmVudHMgdGhhdCBubyBsb25nZXIgYXJlIGFjdGl2ZVxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge09iamVjdH0gYWN0aXZlQ29tcG9uZW50cyAtIEFsbCBjb21wb25lbnRJZHMgY3VycmVudGx5IGZvdW5kIGluIHRoZSBET01cblx0ICovXG5cdGNsZWFuVXBfKGFjdGl2ZUNvbXBvbmVudHMgPSB7fSkge1xuXHRcdE9iamVjdC5rZXlzKHRoaXMuaW5pdGlhbGl6ZWRDb21wb25lbnRzKS5mb3JFYWNoKCAoY29tcG9uZW50SWQpID0+IHtcblx0XHRcdGlmICghYWN0aXZlQ29tcG9uZW50c1tjb21wb25lbnRJZF0pIHtcblx0XHRcdFx0dGhpcy5fZGVzdHJveUNvbXBvbmVudChjb21wb25lbnRJZCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXG5cdC8qKlxuXHQgKiBHZW5lcmF0ZXMgYSByZmM0MTIyIHZlcnNpb24gNCBjb21wbGlhbnQgdW5pcXVlIElEXG5cdCAqIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTA1MDM0L2NyZWF0ZS1ndWlkLXV1aWQtaW4tamF2YXNjcmlwdFxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0X2dlbmVyYXRlVVVJRCgpIHtcblx0XHRyZXR1cm4gJ3h4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eCcucmVwbGFjZSgvW3h5XS9nLCBmdW5jdGlvbihjKSB7XG5cdFx0XHRjb25zdCByID0gTWF0aC5yYW5kb20oKSoxNnwwLCB2ID0gYyA9PSAneCcgPyByIDogKHImMHgzfDB4OCk7XG5cdFx0XHRyZXR1cm4gdi50b1N0cmluZygxNik7XG5cdFx0fSk7XG5cdH1cbn1cblxuLy8gRXhwb3J0IEFNRCwgQ29tbW9uSlMvRVM2IG1vZHVsZSBvciBhc3N1bWUgZ2xvYmFsIG5hbWVzcGFjZVxuaWYgKHR5cGVvZiBkZWZpbmUgIT09ICd1bmRlZmluZWQnICYmIGRlZmluZS5hbWQpIHtcblx0ZGVmaW5lKFtdLCBDb21wb25lbnRMb2FkZXIpO1xufVxuZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcblx0bW9kdWxlLmV4cG9ydHMgPSBDb21wb25lbnRMb2FkZXI7XG59XG5lbHNlIHtcblx0d2luZG93LkNvbXBvbmVudExvYWRlciA9IENvbXBvbmVudExvYWRlcjtcbn0iLCJpbXBvcnQgQ29tcG9uZW50IGZyb20gJ2NvbXBvbmVudC1sb2FkZXItanMvZGlzdC9lczYvY29tcG9uZW50J1xuXG5jbGFzcyBEb2tpIGV4dGVuZHMgQ29tcG9uZW50IHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoKVxuXHRcdGNvbnNvbGUubG9nKCdET0tJIDM2JywgalF1ZXJ5KVxuXHR9XG59XG5cbmV4cG9ydCBkZWZhdWx0IERva2k7IiwiaW1wb3J0IENvbXBvbmVudExvYWRlciBmcm9tICdjb21wb25lbnQtbG9hZGVyLWpzJztcblxuaW1wb3J0IERva2kgZnJvbSAnLi9kb2tpJztcblxubmV3IERva2koKTtcblxubmV3IENvbXBvbmVudExvYWRlcigpOyJdfQ==
