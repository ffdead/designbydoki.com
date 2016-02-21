(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * ComponentLoader Class
 *
 * Instantiates JavaScript Classes when their name is found in the DOM using attribute data-component=""
 *
 */
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ComponentLoader = (function () {

	/**
  * Constructor for the ComponentLoader
  * @class
  * @public
  * @param {Object} components - Optional collection of available components: {componentName: classDefinition}
  * @param {Node} context - Optional DOM node to search for components. Defaults to document.
  */

	function ComponentLoader() {
		var components = arguments[0] === undefined ? {} : arguments[0];
		var context = arguments[1] === undefined ? document : arguments[1];

		_classCallCheck(this, ComponentLoader);

		this.contextEl = context;
		this.initializedComponents = {};
		this.numberOfInitializedComponents = 0;
		this.components = {};
		this.topics = {};
		this.register(components);
	}

	_createClass(ComponentLoader, [{
		key: "register",

		/**
   * Add component(s) to collection of available components
   * @public
   * @param {Object} components - Collection of components: {componentName: classDefinition}
   */
		value: function register() {
			var _this = this;

			var components = arguments[0] === undefined ? {} : arguments[0];

			Object.keys(components).forEach(function (componentName) {
				_this.components[componentName] = components[componentName];
			});
		}
	}, {
		key: "unregister",

		/**
   * Remove component from collection of available components
   * @public
   * @param {String} componentName - Name of the component to remove
   */
		value: function unregister(componentName) {
			delete this.components[componentName];
		}
	}, {
		key: "subscribe",

		/**
   * Mediator functionality.
   * Stores the topic and callback given by the component.
   * for further reference.
   * @param  {String} topic      Topic string
   * @param  {Function} callback Callback function that would be triggered.
   * @param  {Function} context  Class instance which owns the callback
   */
		value: function subscribe(topic, callback, context) {

			// Is this a new topic?
			if (!this.topics.hasOwnProperty(topic)) {
				this.topics[topic] = [];
			}

			// Store the subscriber callback
			this.topics[topic].push({ context: context, callback: callback });
		}
	}, {
		key: "unsubscribe",

		/**
   * Mediator functionality.
   * Removes the stored topic and callback given by the component.
   * @param  {String}   topic    Topic string
   * @param  {Function} callback Callback function that would be triggered.
   * @param  {Function} context  Class instance which owns the callback
   * @return {Boolean}           True on success, False otherwise.
   */
		value: function unsubscribe(topic, callback, context) {
			// Do we have this topic?
			if (!this.topics.hasOwnProperty(topic)) {
				return false;
			}

			// Find out where this is and remove it
			for (var i = 0, len = this.topics[topic].length; i < len; i++) {
				if (this.topics[topic][i].callback === callback) {
					if (!context || this.topics[topic][i].context === context) {
						this.topics[topic].splice(i, 1);
						return true;
					}
				}
			}

			return false;
		}
	}, {
		key: "publish",

		/**
   * [publish description]
   * @param  {[type]} topic [description]
   * @return {[type]}       [description]
   */
		value: function publish(topic) {
			// Check if we have subcribers to this topic
			if (!this.topics.hasOwnProperty(topic)) {
				return false;
			}

			// don't slice on arguments because it prevents optimizations in JavaScript engines (V8 for example)
			// https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Functions/arguments
			// https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#32-leaking-arguments
			var args = new Array(arguments.length - 1);
			for (var i = 0; i < args.length; ++i) {
				args[i] = arguments[i + 1]; // remove first argument
			}

			// Loop through them and fire the callbacks
			for (var _i = 0, len = this.topics[topic].length; _i < len; _i++) {
				var subscription = this.topics[topic][_i];
				// Call it's callback
				if (subscription && subscription.callback) {
					subscription.callback.apply(subscription.context, args);
				}
			}

			return true;
		}
	}, {
		key: "scan",

		/**
   * Scan the DOM, initialize new components and destroy removed components.
   * @public
   * @param {Object} data - Optional data object to pass to the component constructor
   */
		value: function scan() {
			var _this2 = this;

			var data = arguments[0] === undefined ? {} : arguments[0];

			var activeComponents = {},
			    elements = this.contextEl.querySelectorAll("[data-component]");

			[].forEach.call(elements, function (el) {
				_this2._scanElement(el, activeComponents, data);
			});

			if (this.numberOfInitializedComponents > 0) this.cleanUp_(activeComponents);
		}
	}, {
		key: "_scanElement",

		/**
   * Find all components registered on a specific DOM element and initialize them if new
   * @private
   * @param {Element} el - DOM element to scan for components
   * @param {Object} activeComponents - All componentIds currently found in the DOM
   * @param {Object} data - Optional data object to pass to the component constructor
   */
		value: function _scanElement(el, activeComponents, data) {
			var _this3 = this;

			// check of component(s) for this DOM element already have been initialized
			var elementId = el.getAttribute("data-component-id");

			if (!elementId) {
				// give unique id so we can track it on next scan
				elementId = this._generateUUID();
				el.setAttribute("data-component-id", elementId);
			}

			// find the name of the component instance
			var componentList = el.getAttribute("data-component").match(/\S+/g);
			componentList.forEach(function (componentName) {

				var componentId = componentName + "-" + elementId;
				activeComponents[componentId] = true;

				// check if component not initialized before
				if (!_this3.initializedComponents[componentId]) {
					_this3._initializeComponent(componentName, componentId, el, data);
				}
			});
		}
	}, {
		key: "_initializeComponent",

		/**
   * Call constructor of component and add instance to the collection of initialized components
   * @private
   * @param {String} componentName - Name of the component to initialize. Used to lookup class definition in components collection.
   * @param {String} componentId - Unique component ID (combination of component name and element ID)
   * @param {Element} el - DOM element that is the context of this component
   * @param {Object} data - Optional data object to pass to the component constructor
   */
		value: function _initializeComponent(componentName, componentId, el, data) {
			var component = this.components[componentName];

			if (typeof component !== "function") throw "ComponentLoader: unknown component '" + componentName + "'";

			var instance = new component(el, data, this);

			this.initializedComponents[componentId] = instance;
			this.numberOfInitializedComponents++;
		}
	}, {
		key: "_destroyComponent",

		/**
   * Call destroy() on a component instance and remove it from the collection of initialized components
   * @private
   * @param {String} componentId - Unique component ID used to find component instance
   */
		value: function _destroyComponent(componentId) {
			var instance = this.initializedComponents[componentId];
			if (instance && typeof instance.destroy === "function") instance.destroy();

			// safe to delete while object keys while loopinghttp://stackoverflow.com/questions/3463048/is-it-safe-to-delete-an-object-property-while-iterating-over-them
			delete this.initializedComponents[componentId];
			this.numberOfInitializedComponents--;
		}
	}, {
		key: "cleanUp_",

		/**
   * Destroy inaitialized components that no longer are active
   * @private
   * @param {Object} activeComponents - All componentIds currently found in the DOM
   */
		value: function cleanUp_() {
			var _this4 = this;

			var activeComponents = arguments[0] === undefined ? {} : arguments[0];

			Object.keys(this.initializedComponents).forEach(function (componentId) {
				if (!activeComponents[componentId]) {
					_this4._destroyComponent(componentId);
				}
			});
		}
	}, {
		key: "_generateUUID",

		/**
   * Generates a rfc4122 version 4 compliant unique ID
   * http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
   * @private
   */
		value: function _generateUUID() {
			return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
				var r = Math.random() * 16 | 0,
				    v = c == "x" ? r : r & 0x3 | 0x8;
				return v.toString(16);
			});
		}
	}]);

	return ComponentLoader;
})();

// Export AMD, CommonJS/ES6 module or assume global namespace
if (typeof define !== "undefined" && define.amd) {
	define([], ComponentLoader);
} else if (typeof module !== "undefined" && module.exports) {
	module.exports = ComponentLoader;
} else {
	window.ComponentLoader = ComponentLoader;
}
},{}],2:[function(require,module,exports){
/**
 * Component Base Class
 * 
 * Sets all arguments passed in to constructor from ComponentLoader
 *
 * Exposes pub/sub methods for triggering events to other components
 *
 */
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Component = (function () {

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

	function Component() {
		_classCallCheck(this, Component);

		this.el = arguments[0];
		if (typeof jQuery !== 'undefined') this.$el = jQuery(this.el);
		this.data = arguments[1];
		this.__mediator = arguments[2];
	}

	_createClass(Component, [{
		key: 'publish',

		/**
   * Publish an event for other components
   * @protected
   * @param {String} topic - Event name
   * @param {Object} data - Optional params to pass with the event
   */
		value: function publish() {
			var _mediator;

			(_mediator = this.__mediator).publish.apply(_mediator, arguments);
		}
	}, {
		key: 'subscribe',

		/**
   * Subscribe to an event from another component
   * @protected
   * @param {String} topic - Event name
   * @param {Function} callback - Function to bind
   */
		value: function subscribe(topic, callback) {
			this.__mediator.subscribe(topic, callback, this);
		}
	}, {
		key: 'unsubscribe',

		/**
   * Unsubscribe from an event from another component
   * @protected
   * @param {String} topic - Event name
   * @param {Function} callback - Function to unbind
   */
		value: function unsubscribe(topic, callback) {
			this.__mediator.unsubscribe(topic, callback, this);
		}
	}, {
		key: 'scan',

		/**
   * Utility method for triggering the ComponentLoader to scan the markup for new components
   * @protected
   * @param {Object} data - Optional data to pass to the constructor of any Component initialized by this scan
   */
		value: function scan(data) {
			this.__mediator.scan(data);
		}
	}, {
		key: 'defer',

		/**
   * Utility method for defering a function call
   * @protected
   * @param {Function} callback - Function to call
   * @param {Number} ms - Optional ms to delay, defaults to 17ms (just over 1 frame at 60fps)
   */
		value: function defer(callback) {
			var ms = arguments[1] === undefined ? 17 : arguments[1];

			setTimeout(callback, ms);
		}
	}, {
		key: 'destroy',

		/**
   * Called by ComponentLoader when component is no longer found in the markup
   * usually happens as a result of replacing the markup using AJAX
   *	
   * Override in subclass and make sure to clean up event handlers etc
   *
   * @protected
   */
		value: function destroy() {}
	}]);

	return Component;
})();

// Export AMD, CommonJS/ES6 module or assume global namespace
if (typeof define !== 'undefined' && define.amd) {
	define([], Component);
} else if (typeof module !== 'undefined' && module.exports) {
	module.exports = Component;
} else {
	window.Component = Component;
}
},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _component = require('component-loader-js/dist/es5/component');

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

},{"component-loader-js/dist/es5/component":2}],4:[function(require,module,exports){
'use strict';

var _componentLoader = require('component-loader-js/dist/es5/component-loader');

var _componentLoader2 = _interopRequireDefault(_componentLoader);

var _doki = require('./doki');

var _doki2 = _interopRequireDefault(_doki);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

new _componentLoader2.default({
	Doki: _doki2.default
}).scan();

},{"./doki":3,"component-loader-js/dist/es5/component-loader":1}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvY29tcG9uZW50LWxvYWRlci1qcy9kaXN0L2VzNS9jb21wb25lbnQtbG9hZGVyLmpzIiwibm9kZV9tb2R1bGVzL2NvbXBvbmVudC1sb2FkZXItanMvZGlzdC9lczUvY29tcG9uZW50LmpzIiwidGhlbWUvanMvZG9raS5qcyIsInRoZW1lL2pzL21haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUN6SE07OztBQUNMLFVBREssSUFDTCxHQUFjO3dCQURULE1BQ1M7O3FFQURULGtCQUVLLFlBREk7O0FBRWIsVUFBUSxHQUFSLENBQVksYUFBWixFQUZhOztFQUFkOztjQURLOzs0QkFNSztBQUNULDhCQVBJLDRDQU9KLENBRFM7QUFFVCxXQUFRLEdBQVIsQ0FBWSxjQUFaLEVBRlM7Ozs7UUFOTDs7O2tCQVlTOzs7Ozs7Ozs7Ozs7Ozs7QUNUZiw4QkFBb0I7QUFDbkIscUJBRG1CO0NBQXBCLEVBRUcsSUFGSCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIENvbXBvbmVudExvYWRlciBDbGFzc1xuICpcbiAqIEluc3RhbnRpYXRlcyBKYXZhU2NyaXB0IENsYXNzZXMgd2hlbiB0aGVpciBuYW1lIGlzIGZvdW5kIGluIHRoZSBET00gdXNpbmcgYXR0cmlidXRlIGRhdGEtY29tcG9uZW50PVwiXCJcbiAqXG4gKi9cblwidXNlIHN0cmljdFwiO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gKGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0pKCk7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbnZhciBDb21wb25lbnRMb2FkZXIgPSAoZnVuY3Rpb24gKCkge1xuXG5cdC8qKlxuICAqIENvbnN0cnVjdG9yIGZvciB0aGUgQ29tcG9uZW50TG9hZGVyXG4gICogQGNsYXNzXG4gICogQHB1YmxpY1xuICAqIEBwYXJhbSB7T2JqZWN0fSBjb21wb25lbnRzIC0gT3B0aW9uYWwgY29sbGVjdGlvbiBvZiBhdmFpbGFibGUgY29tcG9uZW50czoge2NvbXBvbmVudE5hbWU6IGNsYXNzRGVmaW5pdGlvbn1cbiAgKiBAcGFyYW0ge05vZGV9IGNvbnRleHQgLSBPcHRpb25hbCBET00gbm9kZSB0byBzZWFyY2ggZm9yIGNvbXBvbmVudHMuIERlZmF1bHRzIHRvIGRvY3VtZW50LlxuICAqL1xuXG5cdGZ1bmN0aW9uIENvbXBvbmVudExvYWRlcigpIHtcblx0XHR2YXIgY29tcG9uZW50cyA9IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8ge30gOiBhcmd1bWVudHNbMF07XG5cdFx0dmFyIGNvbnRleHQgPSBhcmd1bWVudHNbMV0gPT09IHVuZGVmaW5lZCA/IGRvY3VtZW50IDogYXJndW1lbnRzWzFdO1xuXG5cdFx0X2NsYXNzQ2FsbENoZWNrKHRoaXMsIENvbXBvbmVudExvYWRlcik7XG5cblx0XHR0aGlzLmNvbnRleHRFbCA9IGNvbnRleHQ7XG5cdFx0dGhpcy5pbml0aWFsaXplZENvbXBvbmVudHMgPSB7fTtcblx0XHR0aGlzLm51bWJlck9mSW5pdGlhbGl6ZWRDb21wb25lbnRzID0gMDtcblx0XHR0aGlzLmNvbXBvbmVudHMgPSB7fTtcblx0XHR0aGlzLnRvcGljcyA9IHt9O1xuXHRcdHRoaXMucmVnaXN0ZXIoY29tcG9uZW50cyk7XG5cdH1cblxuXHRfY3JlYXRlQ2xhc3MoQ29tcG9uZW50TG9hZGVyLCBbe1xuXHRcdGtleTogXCJyZWdpc3RlclwiLFxuXG5cdFx0LyoqXG4gICAqIEFkZCBjb21wb25lbnQocykgdG8gY29sbGVjdGlvbiBvZiBhdmFpbGFibGUgY29tcG9uZW50c1xuICAgKiBAcHVibGljXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBjb21wb25lbnRzIC0gQ29sbGVjdGlvbiBvZiBjb21wb25lbnRzOiB7Y29tcG9uZW50TmFtZTogY2xhc3NEZWZpbml0aW9ufVxuICAgKi9cblx0XHR2YWx1ZTogZnVuY3Rpb24gcmVnaXN0ZXIoKSB7XG5cdFx0XHR2YXIgX3RoaXMgPSB0aGlzO1xuXG5cdFx0XHR2YXIgY29tcG9uZW50cyA9IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8ge30gOiBhcmd1bWVudHNbMF07XG5cblx0XHRcdE9iamVjdC5rZXlzKGNvbXBvbmVudHMpLmZvckVhY2goZnVuY3Rpb24gKGNvbXBvbmVudE5hbWUpIHtcblx0XHRcdFx0X3RoaXMuY29tcG9uZW50c1tjb21wb25lbnROYW1lXSA9IGNvbXBvbmVudHNbY29tcG9uZW50TmFtZV07XG5cdFx0XHR9KTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6IFwidW5yZWdpc3RlclwiLFxuXG5cdFx0LyoqXG4gICAqIFJlbW92ZSBjb21wb25lbnQgZnJvbSBjb2xsZWN0aW9uIG9mIGF2YWlsYWJsZSBjb21wb25lbnRzXG4gICAqIEBwdWJsaWNcbiAgICogQHBhcmFtIHtTdHJpbmd9IGNvbXBvbmVudE5hbWUgLSBOYW1lIG9mIHRoZSBjb21wb25lbnQgdG8gcmVtb3ZlXG4gICAqL1xuXHRcdHZhbHVlOiBmdW5jdGlvbiB1bnJlZ2lzdGVyKGNvbXBvbmVudE5hbWUpIHtcblx0XHRcdGRlbGV0ZSB0aGlzLmNvbXBvbmVudHNbY29tcG9uZW50TmFtZV07XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiBcInN1YnNjcmliZVwiLFxuXG5cdFx0LyoqXG4gICAqIE1lZGlhdG9yIGZ1bmN0aW9uYWxpdHkuXG4gICAqIFN0b3JlcyB0aGUgdG9waWMgYW5kIGNhbGxiYWNrIGdpdmVuIGJ5IHRoZSBjb21wb25lbnQuXG4gICAqIGZvciBmdXJ0aGVyIHJlZmVyZW5jZS5cbiAgICogQHBhcmFtICB7U3RyaW5nfSB0b3BpYyAgICAgIFRvcGljIHN0cmluZ1xuICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY2FsbGJhY2sgQ2FsbGJhY2sgZnVuY3Rpb24gdGhhdCB3b3VsZCBiZSB0cmlnZ2VyZWQuXG4gICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjb250ZXh0ICBDbGFzcyBpbnN0YW5jZSB3aGljaCBvd25zIHRoZSBjYWxsYmFja1xuICAgKi9cblx0XHR2YWx1ZTogZnVuY3Rpb24gc3Vic2NyaWJlKHRvcGljLCBjYWxsYmFjaywgY29udGV4dCkge1xuXG5cdFx0XHQvLyBJcyB0aGlzIGEgbmV3IHRvcGljP1xuXHRcdFx0aWYgKCF0aGlzLnRvcGljcy5oYXNPd25Qcm9wZXJ0eSh0b3BpYykpIHtcblx0XHRcdFx0dGhpcy50b3BpY3NbdG9waWNdID0gW107XG5cdFx0XHR9XG5cblx0XHRcdC8vIFN0b3JlIHRoZSBzdWJzY3JpYmVyIGNhbGxiYWNrXG5cdFx0XHR0aGlzLnRvcGljc1t0b3BpY10ucHVzaCh7IGNvbnRleHQ6IGNvbnRleHQsIGNhbGxiYWNrOiBjYWxsYmFjayB9KTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6IFwidW5zdWJzY3JpYmVcIixcblxuXHRcdC8qKlxuICAgKiBNZWRpYXRvciBmdW5jdGlvbmFsaXR5LlxuICAgKiBSZW1vdmVzIHRoZSBzdG9yZWQgdG9waWMgYW5kIGNhbGxiYWNrIGdpdmVuIGJ5IHRoZSBjb21wb25lbnQuXG4gICAqIEBwYXJhbSAge1N0cmluZ30gICB0b3BpYyAgICBUb3BpYyBzdHJpbmdcbiAgICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrIENhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgd291bGQgYmUgdHJpZ2dlcmVkLlxuICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY29udGV4dCAgQ2xhc3MgaW5zdGFuY2Ugd2hpY2ggb3ducyB0aGUgY2FsbGJhY2tcbiAgICogQHJldHVybiB7Qm9vbGVhbn0gICAgICAgICAgIFRydWUgb24gc3VjY2VzcywgRmFsc2Ugb3RoZXJ3aXNlLlxuICAgKi9cblx0XHR2YWx1ZTogZnVuY3Rpb24gdW5zdWJzY3JpYmUodG9waWMsIGNhbGxiYWNrLCBjb250ZXh0KSB7XG5cdFx0XHQvLyBEbyB3ZSBoYXZlIHRoaXMgdG9waWM/XG5cdFx0XHRpZiAoIXRoaXMudG9waWNzLmhhc093blByb3BlcnR5KHRvcGljKSkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdC8vIEZpbmQgb3V0IHdoZXJlIHRoaXMgaXMgYW5kIHJlbW92ZSBpdFxuXHRcdFx0Zm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMudG9waWNzW3RvcGljXS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0XHRpZiAodGhpcy50b3BpY3NbdG9waWNdW2ldLmNhbGxiYWNrID09PSBjYWxsYmFjaykge1xuXHRcdFx0XHRcdGlmICghY29udGV4dCB8fCB0aGlzLnRvcGljc1t0b3BpY11baV0uY29udGV4dCA9PT0gY29udGV4dCkge1xuXHRcdFx0XHRcdFx0dGhpcy50b3BpY3NbdG9waWNdLnNwbGljZShpLCAxKTtcblx0XHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiBcInB1Ymxpc2hcIixcblxuXHRcdC8qKlxuICAgKiBbcHVibGlzaCBkZXNjcmlwdGlvbl1cbiAgICogQHBhcmFtICB7W3R5cGVdfSB0b3BpYyBbZGVzY3JpcHRpb25dXG4gICAqIEByZXR1cm4ge1t0eXBlXX0gICAgICAgW2Rlc2NyaXB0aW9uXVxuICAgKi9cblx0XHR2YWx1ZTogZnVuY3Rpb24gcHVibGlzaCh0b3BpYykge1xuXHRcdFx0Ly8gQ2hlY2sgaWYgd2UgaGF2ZSBzdWJjcmliZXJzIHRvIHRoaXMgdG9waWNcblx0XHRcdGlmICghdGhpcy50b3BpY3MuaGFzT3duUHJvcGVydHkodG9waWMpKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gZG9uJ3Qgc2xpY2Ugb24gYXJndW1lbnRzIGJlY2F1c2UgaXQgcHJldmVudHMgb3B0aW1pemF0aW9ucyBpbiBKYXZhU2NyaXB0IGVuZ2luZXMgKFY4IGZvciBleGFtcGxlKVxuXHRcdFx0Ly8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4vZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvRnVuY3Rpb25zL2FyZ3VtZW50c1xuXHRcdFx0Ly8gaHR0cHM6Ly9naXRodWIuY29tL3BldGthYW50b25vdi9ibHVlYmlyZC93aWtpL09wdGltaXphdGlvbi1raWxsZXJzIzMyLWxlYWtpbmctYXJndW1lbnRzXG5cdFx0XHR2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyArK2kpIHtcblx0XHRcdFx0YXJnc1tpXSA9IGFyZ3VtZW50c1tpICsgMV07IC8vIHJlbW92ZSBmaXJzdCBhcmd1bWVudFxuXHRcdFx0fVxuXG5cdFx0XHQvLyBMb29wIHRocm91Z2ggdGhlbSBhbmQgZmlyZSB0aGUgY2FsbGJhY2tzXG5cdFx0XHRmb3IgKHZhciBfaSA9IDAsIGxlbiA9IHRoaXMudG9waWNzW3RvcGljXS5sZW5ndGg7IF9pIDwgbGVuOyBfaSsrKSB7XG5cdFx0XHRcdHZhciBzdWJzY3JpcHRpb24gPSB0aGlzLnRvcGljc1t0b3BpY11bX2ldO1xuXHRcdFx0XHQvLyBDYWxsIGl0J3MgY2FsbGJhY2tcblx0XHRcdFx0aWYgKHN1YnNjcmlwdGlvbiAmJiBzdWJzY3JpcHRpb24uY2FsbGJhY2spIHtcblx0XHRcdFx0XHRzdWJzY3JpcHRpb24uY2FsbGJhY2suYXBwbHkoc3Vic2NyaXB0aW9uLmNvbnRleHQsIGFyZ3MpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblx0fSwge1xuXHRcdGtleTogXCJzY2FuXCIsXG5cblx0XHQvKipcbiAgICogU2NhbiB0aGUgRE9NLCBpbml0aWFsaXplIG5ldyBjb21wb25lbnRzIGFuZCBkZXN0cm95IHJlbW92ZWQgY29tcG9uZW50cy5cbiAgICogQHB1YmxpY1xuICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIE9wdGlvbmFsIGRhdGEgb2JqZWN0IHRvIHBhc3MgdG8gdGhlIGNvbXBvbmVudCBjb25zdHJ1Y3RvclxuICAgKi9cblx0XHR2YWx1ZTogZnVuY3Rpb24gc2NhbigpIHtcblx0XHRcdHZhciBfdGhpczIgPSB0aGlzO1xuXG5cdFx0XHR2YXIgZGF0YSA9IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8ge30gOiBhcmd1bWVudHNbMF07XG5cblx0XHRcdHZhciBhY3RpdmVDb21wb25lbnRzID0ge30sXG5cdFx0XHQgICAgZWxlbWVudHMgPSB0aGlzLmNvbnRleHRFbC5xdWVyeVNlbGVjdG9yQWxsKFwiW2RhdGEtY29tcG9uZW50XVwiKTtcblxuXHRcdFx0W10uZm9yRWFjaC5jYWxsKGVsZW1lbnRzLCBmdW5jdGlvbiAoZWwpIHtcblx0XHRcdFx0X3RoaXMyLl9zY2FuRWxlbWVudChlbCwgYWN0aXZlQ29tcG9uZW50cywgZGF0YSk7XG5cdFx0XHR9KTtcblxuXHRcdFx0aWYgKHRoaXMubnVtYmVyT2ZJbml0aWFsaXplZENvbXBvbmVudHMgPiAwKSB0aGlzLmNsZWFuVXBfKGFjdGl2ZUNvbXBvbmVudHMpO1xuXHRcdH1cblx0fSwge1xuXHRcdGtleTogXCJfc2NhbkVsZW1lbnRcIixcblxuXHRcdC8qKlxuICAgKiBGaW5kIGFsbCBjb21wb25lbnRzIHJlZ2lzdGVyZWQgb24gYSBzcGVjaWZpYyBET00gZWxlbWVudCBhbmQgaW5pdGlhbGl6ZSB0aGVtIGlmIG5ld1xuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge0VsZW1lbnR9IGVsIC0gRE9NIGVsZW1lbnQgdG8gc2NhbiBmb3IgY29tcG9uZW50c1xuICAgKiBAcGFyYW0ge09iamVjdH0gYWN0aXZlQ29tcG9uZW50cyAtIEFsbCBjb21wb25lbnRJZHMgY3VycmVudGx5IGZvdW5kIGluIHRoZSBET01cbiAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBPcHRpb25hbCBkYXRhIG9iamVjdCB0byBwYXNzIHRvIHRoZSBjb21wb25lbnQgY29uc3RydWN0b3JcbiAgICovXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIF9zY2FuRWxlbWVudChlbCwgYWN0aXZlQ29tcG9uZW50cywgZGF0YSkge1xuXHRcdFx0dmFyIF90aGlzMyA9IHRoaXM7XG5cblx0XHRcdC8vIGNoZWNrIG9mIGNvbXBvbmVudChzKSBmb3IgdGhpcyBET00gZWxlbWVudCBhbHJlYWR5IGhhdmUgYmVlbiBpbml0aWFsaXplZFxuXHRcdFx0dmFyIGVsZW1lbnRJZCA9IGVsLmdldEF0dHJpYnV0ZShcImRhdGEtY29tcG9uZW50LWlkXCIpO1xuXG5cdFx0XHRpZiAoIWVsZW1lbnRJZCkge1xuXHRcdFx0XHQvLyBnaXZlIHVuaXF1ZSBpZCBzbyB3ZSBjYW4gdHJhY2sgaXQgb24gbmV4dCBzY2FuXG5cdFx0XHRcdGVsZW1lbnRJZCA9IHRoaXMuX2dlbmVyYXRlVVVJRCgpO1xuXHRcdFx0XHRlbC5zZXRBdHRyaWJ1dGUoXCJkYXRhLWNvbXBvbmVudC1pZFwiLCBlbGVtZW50SWQpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBmaW5kIHRoZSBuYW1lIG9mIHRoZSBjb21wb25lbnQgaW5zdGFuY2Vcblx0XHRcdHZhciBjb21wb25lbnRMaXN0ID0gZWwuZ2V0QXR0cmlidXRlKFwiZGF0YS1jb21wb25lbnRcIikubWF0Y2goL1xcUysvZyk7XG5cdFx0XHRjb21wb25lbnRMaXN0LmZvckVhY2goZnVuY3Rpb24gKGNvbXBvbmVudE5hbWUpIHtcblxuXHRcdFx0XHR2YXIgY29tcG9uZW50SWQgPSBjb21wb25lbnROYW1lICsgXCItXCIgKyBlbGVtZW50SWQ7XG5cdFx0XHRcdGFjdGl2ZUNvbXBvbmVudHNbY29tcG9uZW50SWRdID0gdHJ1ZTtcblxuXHRcdFx0XHQvLyBjaGVjayBpZiBjb21wb25lbnQgbm90IGluaXRpYWxpemVkIGJlZm9yZVxuXHRcdFx0XHRpZiAoIV90aGlzMy5pbml0aWFsaXplZENvbXBvbmVudHNbY29tcG9uZW50SWRdKSB7XG5cdFx0XHRcdFx0X3RoaXMzLl9pbml0aWFsaXplQ29tcG9uZW50KGNvbXBvbmVudE5hbWUsIGNvbXBvbmVudElkLCBlbCwgZGF0YSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH1cblx0fSwge1xuXHRcdGtleTogXCJfaW5pdGlhbGl6ZUNvbXBvbmVudFwiLFxuXG5cdFx0LyoqXG4gICAqIENhbGwgY29uc3RydWN0b3Igb2YgY29tcG9uZW50IGFuZCBhZGQgaW5zdGFuY2UgdG8gdGhlIGNvbGxlY3Rpb24gb2YgaW5pdGlhbGl6ZWQgY29tcG9uZW50c1xuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gY29tcG9uZW50TmFtZSAtIE5hbWUgb2YgdGhlIGNvbXBvbmVudCB0byBpbml0aWFsaXplLiBVc2VkIHRvIGxvb2t1cCBjbGFzcyBkZWZpbml0aW9uIGluIGNvbXBvbmVudHMgY29sbGVjdGlvbi5cbiAgICogQHBhcmFtIHtTdHJpbmd9IGNvbXBvbmVudElkIC0gVW5pcXVlIGNvbXBvbmVudCBJRCAoY29tYmluYXRpb24gb2YgY29tcG9uZW50IG5hbWUgYW5kIGVsZW1lbnQgSUQpXG4gICAqIEBwYXJhbSB7RWxlbWVudH0gZWwgLSBET00gZWxlbWVudCB0aGF0IGlzIHRoZSBjb250ZXh0IG9mIHRoaXMgY29tcG9uZW50XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gT3B0aW9uYWwgZGF0YSBvYmplY3QgdG8gcGFzcyB0byB0aGUgY29tcG9uZW50IGNvbnN0cnVjdG9yXG4gICAqL1xuXHRcdHZhbHVlOiBmdW5jdGlvbiBfaW5pdGlhbGl6ZUNvbXBvbmVudChjb21wb25lbnROYW1lLCBjb21wb25lbnRJZCwgZWwsIGRhdGEpIHtcblx0XHRcdHZhciBjb21wb25lbnQgPSB0aGlzLmNvbXBvbmVudHNbY29tcG9uZW50TmFtZV07XG5cblx0XHRcdGlmICh0eXBlb2YgY29tcG9uZW50ICE9PSBcImZ1bmN0aW9uXCIpIHRocm93IFwiQ29tcG9uZW50TG9hZGVyOiB1bmtub3duIGNvbXBvbmVudCAnXCIgKyBjb21wb25lbnROYW1lICsgXCInXCI7XG5cblx0XHRcdHZhciBpbnN0YW5jZSA9IG5ldyBjb21wb25lbnQoZWwsIGRhdGEsIHRoaXMpO1xuXG5cdFx0XHR0aGlzLmluaXRpYWxpemVkQ29tcG9uZW50c1tjb21wb25lbnRJZF0gPSBpbnN0YW5jZTtcblx0XHRcdHRoaXMubnVtYmVyT2ZJbml0aWFsaXplZENvbXBvbmVudHMrKztcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6IFwiX2Rlc3Ryb3lDb21wb25lbnRcIixcblxuXHRcdC8qKlxuICAgKiBDYWxsIGRlc3Ryb3koKSBvbiBhIGNvbXBvbmVudCBpbnN0YW5jZSBhbmQgcmVtb3ZlIGl0IGZyb20gdGhlIGNvbGxlY3Rpb24gb2YgaW5pdGlhbGl6ZWQgY29tcG9uZW50c1xuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gY29tcG9uZW50SWQgLSBVbmlxdWUgY29tcG9uZW50IElEIHVzZWQgdG8gZmluZCBjb21wb25lbnQgaW5zdGFuY2VcbiAgICovXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIF9kZXN0cm95Q29tcG9uZW50KGNvbXBvbmVudElkKSB7XG5cdFx0XHR2YXIgaW5zdGFuY2UgPSB0aGlzLmluaXRpYWxpemVkQ29tcG9uZW50c1tjb21wb25lbnRJZF07XG5cdFx0XHRpZiAoaW5zdGFuY2UgJiYgdHlwZW9mIGluc3RhbmNlLmRlc3Ryb3kgPT09IFwiZnVuY3Rpb25cIikgaW5zdGFuY2UuZGVzdHJveSgpO1xuXG5cdFx0XHQvLyBzYWZlIHRvIGRlbGV0ZSB3aGlsZSBvYmplY3Qga2V5cyB3aGlsZSBsb29waW5naHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8zNDYzMDQ4L2lzLWl0LXNhZmUtdG8tZGVsZXRlLWFuLW9iamVjdC1wcm9wZXJ0eS13aGlsZS1pdGVyYXRpbmctb3Zlci10aGVtXG5cdFx0XHRkZWxldGUgdGhpcy5pbml0aWFsaXplZENvbXBvbmVudHNbY29tcG9uZW50SWRdO1xuXHRcdFx0dGhpcy5udW1iZXJPZkluaXRpYWxpemVkQ29tcG9uZW50cy0tO1xuXHRcdH1cblx0fSwge1xuXHRcdGtleTogXCJjbGVhblVwX1wiLFxuXG5cdFx0LyoqXG4gICAqIERlc3Ryb3kgaW5haXRpYWxpemVkIGNvbXBvbmVudHMgdGhhdCBubyBsb25nZXIgYXJlIGFjdGl2ZVxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge09iamVjdH0gYWN0aXZlQ29tcG9uZW50cyAtIEFsbCBjb21wb25lbnRJZHMgY3VycmVudGx5IGZvdW5kIGluIHRoZSBET01cbiAgICovXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIGNsZWFuVXBfKCkge1xuXHRcdFx0dmFyIF90aGlzNCA9IHRoaXM7XG5cblx0XHRcdHZhciBhY3RpdmVDb21wb25lbnRzID0gYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyB7fSA6IGFyZ3VtZW50c1swXTtcblxuXHRcdFx0T2JqZWN0LmtleXModGhpcy5pbml0aWFsaXplZENvbXBvbmVudHMpLmZvckVhY2goZnVuY3Rpb24gKGNvbXBvbmVudElkKSB7XG5cdFx0XHRcdGlmICghYWN0aXZlQ29tcG9uZW50c1tjb21wb25lbnRJZF0pIHtcblx0XHRcdFx0XHRfdGhpczQuX2Rlc3Ryb3lDb21wb25lbnQoY29tcG9uZW50SWQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6IFwiX2dlbmVyYXRlVVVJRFwiLFxuXG5cdFx0LyoqXG4gICAqIEdlbmVyYXRlcyBhIHJmYzQxMjIgdmVyc2lvbiA0IGNvbXBsaWFudCB1bmlxdWUgSURcbiAgICogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xMDUwMzQvY3JlYXRlLWd1aWQtdXVpZC1pbi1qYXZhc2NyaXB0XG4gICAqIEBwcml2YXRlXG4gICAqL1xuXHRcdHZhbHVlOiBmdW5jdGlvbiBfZ2VuZXJhdGVVVUlEKCkge1xuXHRcdFx0cmV0dXJuIFwieHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4XCIucmVwbGFjZSgvW3h5XS9nLCBmdW5jdGlvbiAoYykge1xuXHRcdFx0XHR2YXIgciA9IE1hdGgucmFuZG9tKCkgKiAxNiB8IDAsXG5cdFx0XHRcdCAgICB2ID0gYyA9PSBcInhcIiA/IHIgOiByICYgMHgzIHwgMHg4O1xuXHRcdFx0XHRyZXR1cm4gdi50b1N0cmluZygxNik7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH1dKTtcblxuXHRyZXR1cm4gQ29tcG9uZW50TG9hZGVyO1xufSkoKTtcblxuLy8gRXhwb3J0IEFNRCwgQ29tbW9uSlMvRVM2IG1vZHVsZSBvciBhc3N1bWUgZ2xvYmFsIG5hbWVzcGFjZVxuaWYgKHR5cGVvZiBkZWZpbmUgIT09IFwidW5kZWZpbmVkXCIgJiYgZGVmaW5lLmFtZCkge1xuXHRkZWZpbmUoW10sIENvbXBvbmVudExvYWRlcik7XG59IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT09IFwidW5kZWZpbmVkXCIgJiYgbW9kdWxlLmV4cG9ydHMpIHtcblx0bW9kdWxlLmV4cG9ydHMgPSBDb21wb25lbnRMb2FkZXI7XG59IGVsc2Uge1xuXHR3aW5kb3cuQ29tcG9uZW50TG9hZGVyID0gQ29tcG9uZW50TG9hZGVyO1xufSIsIi8qKlxuICogQ29tcG9uZW50IEJhc2UgQ2xhc3NcbiAqIFxuICogU2V0cyBhbGwgYXJndW1lbnRzIHBhc3NlZCBpbiB0byBjb25zdHJ1Y3RvciBmcm9tIENvbXBvbmVudExvYWRlclxuICpcbiAqIEV4cG9zZXMgcHViL3N1YiBtZXRob2RzIGZvciB0cmlnZ2VyaW5nIGV2ZW50cyB0byBvdGhlciBjb21wb25lbnRzXG4gKlxuICovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSAoZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKCd2YWx1ZScgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0pKCk7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uJyk7IH0gfVxuXG52YXIgQ29tcG9uZW50ID0gKGZ1bmN0aW9uICgpIHtcblxuXHQvKipcbiAgKiBDb25zdHJ1Y3RvciBmb3IgdGhlIENvbXBvbmVudFxuICAqXG4gICogQ2FsbCBgc3VwZXIoLi4uYXJndW1lbnRzKTtgIGluIHRoZSBiYXNlIGNsYXNzIGNvbnN0cnVjdG9yXG4gICpcbiAgKiBAcHVibGljXG4gICogQHBhcmFtIHtOb2RlfSBjb250ZXh0IC0gRE9NIG5vZGUgdGhhdCBjb250YWlucyB0aGUgY29tcG9uZW50IG1hcmt1cFxuICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gT3B0aW9uYWwgZGF0YSBvYmplY3QgZnJvbSBDb21wb25lbnRMb2FkZXIuc2NhbigpXG4gICogQHBhcmFtIHtPYmplY3R9IG1lZGlhdG9yIC0gaW5zdGFuY2Ugb2YgQ29tcG9uZW50TG9hZGVyIGZvciBwdWIvc3ViXG4gICovXG5cblx0ZnVuY3Rpb24gQ29tcG9uZW50KCkge1xuXHRcdF9jbGFzc0NhbGxDaGVjayh0aGlzLCBDb21wb25lbnQpO1xuXG5cdFx0dGhpcy5lbCA9IGFyZ3VtZW50c1swXTtcblx0XHRpZiAodHlwZW9mIGpRdWVyeSAhPT0gJ3VuZGVmaW5lZCcpIHRoaXMuJGVsID0galF1ZXJ5KHRoaXMuZWwpO1xuXHRcdHRoaXMuZGF0YSA9IGFyZ3VtZW50c1sxXTtcblx0XHR0aGlzLl9fbWVkaWF0b3IgPSBhcmd1bWVudHNbMl07XG5cdH1cblxuXHRfY3JlYXRlQ2xhc3MoQ29tcG9uZW50LCBbe1xuXHRcdGtleTogJ3B1Ymxpc2gnLFxuXG5cdFx0LyoqXG4gICAqIFB1Ymxpc2ggYW4gZXZlbnQgZm9yIG90aGVyIGNvbXBvbmVudHNcbiAgICogQHByb3RlY3RlZFxuICAgKiBAcGFyYW0ge1N0cmluZ30gdG9waWMgLSBFdmVudCBuYW1lXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gT3B0aW9uYWwgcGFyYW1zIHRvIHBhc3Mgd2l0aCB0aGUgZXZlbnRcbiAgICovXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIHB1Ymxpc2goKSB7XG5cdFx0XHR2YXIgX21lZGlhdG9yO1xuXG5cdFx0XHQoX21lZGlhdG9yID0gdGhpcy5fX21lZGlhdG9yKS5wdWJsaXNoLmFwcGx5KF9tZWRpYXRvciwgYXJndW1lbnRzKTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6ICdzdWJzY3JpYmUnLFxuXG5cdFx0LyoqXG4gICAqIFN1YnNjcmliZSB0byBhbiBldmVudCBmcm9tIGFub3RoZXIgY29tcG9uZW50XG4gICAqIEBwcm90ZWN0ZWRcbiAgICogQHBhcmFtIHtTdHJpbmd9IHRvcGljIC0gRXZlbnQgbmFtZVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIEZ1bmN0aW9uIHRvIGJpbmRcbiAgICovXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIHN1YnNjcmliZSh0b3BpYywgY2FsbGJhY2spIHtcblx0XHRcdHRoaXMuX19tZWRpYXRvci5zdWJzY3JpYmUodG9waWMsIGNhbGxiYWNrLCB0aGlzKTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6ICd1bnN1YnNjcmliZScsXG5cblx0XHQvKipcbiAgICogVW5zdWJzY3JpYmUgZnJvbSBhbiBldmVudCBmcm9tIGFub3RoZXIgY29tcG9uZW50XG4gICAqIEBwcm90ZWN0ZWRcbiAgICogQHBhcmFtIHtTdHJpbmd9IHRvcGljIC0gRXZlbnQgbmFtZVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIEZ1bmN0aW9uIHRvIHVuYmluZFxuICAgKi9cblx0XHR2YWx1ZTogZnVuY3Rpb24gdW5zdWJzY3JpYmUodG9waWMsIGNhbGxiYWNrKSB7XG5cdFx0XHR0aGlzLl9fbWVkaWF0b3IudW5zdWJzY3JpYmUodG9waWMsIGNhbGxiYWNrLCB0aGlzKTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6ICdzY2FuJyxcblxuXHRcdC8qKlxuICAgKiBVdGlsaXR5IG1ldGhvZCBmb3IgdHJpZ2dlcmluZyB0aGUgQ29tcG9uZW50TG9hZGVyIHRvIHNjYW4gdGhlIG1hcmt1cCBmb3IgbmV3IGNvbXBvbmVudHNcbiAgICogQHByb3RlY3RlZFxuICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIE9wdGlvbmFsIGRhdGEgdG8gcGFzcyB0byB0aGUgY29uc3RydWN0b3Igb2YgYW55IENvbXBvbmVudCBpbml0aWFsaXplZCBieSB0aGlzIHNjYW5cbiAgICovXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIHNjYW4oZGF0YSkge1xuXHRcdFx0dGhpcy5fX21lZGlhdG9yLnNjYW4oZGF0YSk7XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiAnZGVmZXInLFxuXG5cdFx0LyoqXG4gICAqIFV0aWxpdHkgbWV0aG9kIGZvciBkZWZlcmluZyBhIGZ1bmN0aW9uIGNhbGxcbiAgICogQHByb3RlY3RlZFxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIEZ1bmN0aW9uIHRvIGNhbGxcbiAgICogQHBhcmFtIHtOdW1iZXJ9IG1zIC0gT3B0aW9uYWwgbXMgdG8gZGVsYXksIGRlZmF1bHRzIHRvIDE3bXMgKGp1c3Qgb3ZlciAxIGZyYW1lIGF0IDYwZnBzKVxuICAgKi9cblx0XHR2YWx1ZTogZnVuY3Rpb24gZGVmZXIoY2FsbGJhY2spIHtcblx0XHRcdHZhciBtcyA9IGFyZ3VtZW50c1sxXSA9PT0gdW5kZWZpbmVkID8gMTcgOiBhcmd1bWVudHNbMV07XG5cblx0XHRcdHNldFRpbWVvdXQoY2FsbGJhY2ssIG1zKTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6ICdkZXN0cm95JyxcblxuXHRcdC8qKlxuICAgKiBDYWxsZWQgYnkgQ29tcG9uZW50TG9hZGVyIHdoZW4gY29tcG9uZW50IGlzIG5vIGxvbmdlciBmb3VuZCBpbiB0aGUgbWFya3VwXG4gICAqIHVzdWFsbHkgaGFwcGVucyBhcyBhIHJlc3VsdCBvZiByZXBsYWNpbmcgdGhlIG1hcmt1cCB1c2luZyBBSkFYXG4gICAqXHRcbiAgICogT3ZlcnJpZGUgaW4gc3ViY2xhc3MgYW5kIG1ha2Ugc3VyZSB0byBjbGVhbiB1cCBldmVudCBoYW5kbGVycyBldGNcbiAgICpcbiAgICogQHByb3RlY3RlZFxuICAgKi9cblx0XHR2YWx1ZTogZnVuY3Rpb24gZGVzdHJveSgpIHt9XG5cdH1dKTtcblxuXHRyZXR1cm4gQ29tcG9uZW50O1xufSkoKTtcblxuLy8gRXhwb3J0IEFNRCwgQ29tbW9uSlMvRVM2IG1vZHVsZSBvciBhc3N1bWUgZ2xvYmFsIG5hbWVzcGFjZVxuaWYgKHR5cGVvZiBkZWZpbmUgIT09ICd1bmRlZmluZWQnICYmIGRlZmluZS5hbWQpIHtcblx0ZGVmaW5lKFtdLCBDb21wb25lbnQpO1xufSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuXHRtb2R1bGUuZXhwb3J0cyA9IENvbXBvbmVudDtcbn0gZWxzZSB7XG5cdHdpbmRvdy5Db21wb25lbnQgPSBDb21wb25lbnQ7XG59IiwiaW1wb3J0IENvbXBvbmVudCBmcm9tICdjb21wb25lbnQtbG9hZGVyLWpzL2Rpc3QvZXM1L2NvbXBvbmVudCdcblxuY2xhc3MgRG9raSBleHRlbmRzIENvbXBvbmVudCB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKC4uLmFyZ3VtZW50cyk7XG5cdFx0Y29uc29sZS5sb2coJ25ldyBET0tJIDM2Jyk7XG5cdH1cblxuXHRkZXN0cm95KCkge1xuXHRcdHN1cGVyLmRlc3Ryb3koKTtcblx0XHRjb25zb2xlLmxvZygnZGVzdHJveSBET0tJJyk7XG5cdH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgRG9raTsiLCJpbXBvcnQgQ29tcG9uZW50TG9hZGVyIGZyb20gJ2NvbXBvbmVudC1sb2FkZXItanMvZGlzdC9lczUvY29tcG9uZW50LWxvYWRlcic7XG5cbmltcG9ydCBEb2tpIGZyb20gJy4vZG9raSc7XG5cblxubmV3IENvbXBvbmVudExvYWRlcih7XG5cdERva2lcbn0pLnNjYW4oKTsiXX0=
