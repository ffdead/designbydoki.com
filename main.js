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

		console.log('new DOKI 37');
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

var _doki = require('./components/doki');

var _doki2 = _interopRequireDefault(_doki);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

new componentLoader({
	Doki: _doki2.default
}).scan();

},{"./components/doki":3,"component-loader-js/dist/es5/component-loader":1}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvY29tcG9uZW50LWxvYWRlci1qcy9kaXN0L2VzNS9jb21wb25lbnQtbG9hZGVyLmpzIiwibm9kZV9tb2R1bGVzL2NvbXBvbmVudC1sb2FkZXItanMvZGlzdC9lczUvY29tcG9uZW50LmpzIiwidGhlbWUvanMvY29tcG9uZW50cy9kb2tpLmpzIiwidGhlbWUvanMvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQ3pITTs7O0FBQ0wsVUFESyxJQUNMLEdBQWM7d0JBRFQsTUFDUzs7cUVBRFQsa0JBRUssWUFESTs7QUFFYixVQUFRLEdBQVIsQ0FBWSxhQUFaLEVBRmE7O0VBQWQ7O2NBREs7OzRCQU1LO0FBQ1QsOEJBUEksNENBT0osQ0FEUztBQUVULFdBQVEsR0FBUixDQUFZLGNBQVosRUFGUzs7OztRQU5MOzs7a0JBWVM7Ozs7Ozs7Ozs7Ozs7OztBQ1RmLElBQUksZUFBSixDQUFvQjtBQUNuQixxQkFEbUI7Q0FBcEIsRUFFRyxJQUZIIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogQ29tcG9uZW50TG9hZGVyIENsYXNzXG4gKlxuICogSW5zdGFudGlhdGVzIEphdmFTY3JpcHQgQ2xhc3NlcyB3aGVuIHRoZWlyIG5hbWUgaXMgZm91bmQgaW4gdGhlIERPTSB1c2luZyBhdHRyaWJ1dGUgZGF0YS1jb21wb25lbnQ9XCJcIlxuICpcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSAoZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSkoKTtcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxudmFyIENvbXBvbmVudExvYWRlciA9IChmdW5jdGlvbiAoKSB7XG5cblx0LyoqXG4gICogQ29uc3RydWN0b3IgZm9yIHRoZSBDb21wb25lbnRMb2FkZXJcbiAgKiBAY2xhc3NcbiAgKiBAcHVibGljXG4gICogQHBhcmFtIHtPYmplY3R9IGNvbXBvbmVudHMgLSBPcHRpb25hbCBjb2xsZWN0aW9uIG9mIGF2YWlsYWJsZSBjb21wb25lbnRzOiB7Y29tcG9uZW50TmFtZTogY2xhc3NEZWZpbml0aW9ufVxuICAqIEBwYXJhbSB7Tm9kZX0gY29udGV4dCAtIE9wdGlvbmFsIERPTSBub2RlIHRvIHNlYXJjaCBmb3IgY29tcG9uZW50cy4gRGVmYXVsdHMgdG8gZG9jdW1lbnQuXG4gICovXG5cblx0ZnVuY3Rpb24gQ29tcG9uZW50TG9hZGVyKCkge1xuXHRcdHZhciBjb21wb25lbnRzID0gYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyB7fSA6IGFyZ3VtZW50c1swXTtcblx0XHR2YXIgY29udGV4dCA9IGFyZ3VtZW50c1sxXSA9PT0gdW5kZWZpbmVkID8gZG9jdW1lbnQgOiBhcmd1bWVudHNbMV07XG5cblx0XHRfY2xhc3NDYWxsQ2hlY2sodGhpcywgQ29tcG9uZW50TG9hZGVyKTtcblxuXHRcdHRoaXMuY29udGV4dEVsID0gY29udGV4dDtcblx0XHR0aGlzLmluaXRpYWxpemVkQ29tcG9uZW50cyA9IHt9O1xuXHRcdHRoaXMubnVtYmVyT2ZJbml0aWFsaXplZENvbXBvbmVudHMgPSAwO1xuXHRcdHRoaXMuY29tcG9uZW50cyA9IHt9O1xuXHRcdHRoaXMudG9waWNzID0ge307XG5cdFx0dGhpcy5yZWdpc3Rlcihjb21wb25lbnRzKTtcblx0fVxuXG5cdF9jcmVhdGVDbGFzcyhDb21wb25lbnRMb2FkZXIsIFt7XG5cdFx0a2V5OiBcInJlZ2lzdGVyXCIsXG5cblx0XHQvKipcbiAgICogQWRkIGNvbXBvbmVudChzKSB0byBjb2xsZWN0aW9uIG9mIGF2YWlsYWJsZSBjb21wb25lbnRzXG4gICAqIEBwdWJsaWNcbiAgICogQHBhcmFtIHtPYmplY3R9IGNvbXBvbmVudHMgLSBDb2xsZWN0aW9uIG9mIGNvbXBvbmVudHM6IHtjb21wb25lbnROYW1lOiBjbGFzc0RlZmluaXRpb259XG4gICAqL1xuXHRcdHZhbHVlOiBmdW5jdGlvbiByZWdpc3RlcigpIHtcblx0XHRcdHZhciBfdGhpcyA9IHRoaXM7XG5cblx0XHRcdHZhciBjb21wb25lbnRzID0gYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyB7fSA6IGFyZ3VtZW50c1swXTtcblxuXHRcdFx0T2JqZWN0LmtleXMoY29tcG9uZW50cykuZm9yRWFjaChmdW5jdGlvbiAoY29tcG9uZW50TmFtZSkge1xuXHRcdFx0XHRfdGhpcy5jb21wb25lbnRzW2NvbXBvbmVudE5hbWVdID0gY29tcG9uZW50c1tjb21wb25lbnROYW1lXTtcblx0XHRcdH0pO1xuXHRcdH1cblx0fSwge1xuXHRcdGtleTogXCJ1bnJlZ2lzdGVyXCIsXG5cblx0XHQvKipcbiAgICogUmVtb3ZlIGNvbXBvbmVudCBmcm9tIGNvbGxlY3Rpb24gb2YgYXZhaWxhYmxlIGNvbXBvbmVudHNcbiAgICogQHB1YmxpY1xuICAgKiBAcGFyYW0ge1N0cmluZ30gY29tcG9uZW50TmFtZSAtIE5hbWUgb2YgdGhlIGNvbXBvbmVudCB0byByZW1vdmVcbiAgICovXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIHVucmVnaXN0ZXIoY29tcG9uZW50TmFtZSkge1xuXHRcdFx0ZGVsZXRlIHRoaXMuY29tcG9uZW50c1tjb21wb25lbnROYW1lXTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6IFwic3Vic2NyaWJlXCIsXG5cblx0XHQvKipcbiAgICogTWVkaWF0b3IgZnVuY3Rpb25hbGl0eS5cbiAgICogU3RvcmVzIHRoZSB0b3BpYyBhbmQgY2FsbGJhY2sgZ2l2ZW4gYnkgdGhlIGNvbXBvbmVudC5cbiAgICogZm9yIGZ1cnRoZXIgcmVmZXJlbmNlLlxuICAgKiBAcGFyYW0gIHtTdHJpbmd9IHRvcGljICAgICAgVG9waWMgc3RyaW5nXG4gICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjYWxsYmFjayBDYWxsYmFjayBmdW5jdGlvbiB0aGF0IHdvdWxkIGJlIHRyaWdnZXJlZC5cbiAgICogQHBhcmFtICB7RnVuY3Rpb259IGNvbnRleHQgIENsYXNzIGluc3RhbmNlIHdoaWNoIG93bnMgdGhlIGNhbGxiYWNrXG4gICAqL1xuXHRcdHZhbHVlOiBmdW5jdGlvbiBzdWJzY3JpYmUodG9waWMsIGNhbGxiYWNrLCBjb250ZXh0KSB7XG5cblx0XHRcdC8vIElzIHRoaXMgYSBuZXcgdG9waWM/XG5cdFx0XHRpZiAoIXRoaXMudG9waWNzLmhhc093blByb3BlcnR5KHRvcGljKSkge1xuXHRcdFx0XHR0aGlzLnRvcGljc1t0b3BpY10gPSBbXTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gU3RvcmUgdGhlIHN1YnNjcmliZXIgY2FsbGJhY2tcblx0XHRcdHRoaXMudG9waWNzW3RvcGljXS5wdXNoKHsgY29udGV4dDogY29udGV4dCwgY2FsbGJhY2s6IGNhbGxiYWNrIH0pO1xuXHRcdH1cblx0fSwge1xuXHRcdGtleTogXCJ1bnN1YnNjcmliZVwiLFxuXG5cdFx0LyoqXG4gICAqIE1lZGlhdG9yIGZ1bmN0aW9uYWxpdHkuXG4gICAqIFJlbW92ZXMgdGhlIHN0b3JlZCB0b3BpYyBhbmQgY2FsbGJhY2sgZ2l2ZW4gYnkgdGhlIGNvbXBvbmVudC5cbiAgICogQHBhcmFtICB7U3RyaW5nfSAgIHRvcGljICAgIFRvcGljIHN0cmluZ1xuICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY2FsbGJhY2sgQ2FsbGJhY2sgZnVuY3Rpb24gdGhhdCB3b3VsZCBiZSB0cmlnZ2VyZWQuXG4gICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjb250ZXh0ICBDbGFzcyBpbnN0YW5jZSB3aGljaCBvd25zIHRoZSBjYWxsYmFja1xuICAgKiBAcmV0dXJuIHtCb29sZWFufSAgICAgICAgICAgVHJ1ZSBvbiBzdWNjZXNzLCBGYWxzZSBvdGhlcndpc2UuXG4gICAqL1xuXHRcdHZhbHVlOiBmdW5jdGlvbiB1bnN1YnNjcmliZSh0b3BpYywgY2FsbGJhY2ssIGNvbnRleHQpIHtcblx0XHRcdC8vIERvIHdlIGhhdmUgdGhpcyB0b3BpYz9cblx0XHRcdGlmICghdGhpcy50b3BpY3MuaGFzT3duUHJvcGVydHkodG9waWMpKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gRmluZCBvdXQgd2hlcmUgdGhpcyBpcyBhbmQgcmVtb3ZlIGl0XG5cdFx0XHRmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy50b3BpY3NbdG9waWNdLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRcdGlmICh0aGlzLnRvcGljc1t0b3BpY11baV0uY2FsbGJhY2sgPT09IGNhbGxiYWNrKSB7XG5cdFx0XHRcdFx0aWYgKCFjb250ZXh0IHx8IHRoaXMudG9waWNzW3RvcGljXVtpXS5jb250ZXh0ID09PSBjb250ZXh0KSB7XG5cdFx0XHRcdFx0XHR0aGlzLnRvcGljc1t0b3BpY10uc3BsaWNlKGksIDEpO1xuXHRcdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6IFwicHVibGlzaFwiLFxuXG5cdFx0LyoqXG4gICAqIFtwdWJsaXNoIGRlc2NyaXB0aW9uXVxuICAgKiBAcGFyYW0gIHtbdHlwZV19IHRvcGljIFtkZXNjcmlwdGlvbl1cbiAgICogQHJldHVybiB7W3R5cGVdfSAgICAgICBbZGVzY3JpcHRpb25dXG4gICAqL1xuXHRcdHZhbHVlOiBmdW5jdGlvbiBwdWJsaXNoKHRvcGljKSB7XG5cdFx0XHQvLyBDaGVjayBpZiB3ZSBoYXZlIHN1YmNyaWJlcnMgdG8gdGhpcyB0b3BpY1xuXHRcdFx0aWYgKCF0aGlzLnRvcGljcy5oYXNPd25Qcm9wZXJ0eSh0b3BpYykpIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBkb24ndCBzbGljZSBvbiBhcmd1bWVudHMgYmVjYXVzZSBpdCBwcmV2ZW50cyBvcHRpbWl6YXRpb25zIGluIEphdmFTY3JpcHQgZW5naW5lcyAoVjggZm9yIGV4YW1wbGUpXG5cdFx0XHQvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9GdW5jdGlvbnMvYXJndW1lbnRzXG5cdFx0XHQvLyBodHRwczovL2dpdGh1Yi5jb20vcGV0a2FhbnRvbm92L2JsdWViaXJkL3dpa2kvT3B0aW1pemF0aW9uLWtpbGxlcnMjMzItbGVha2luZy1hcmd1bWVudHNcblx0XHRcdHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7ICsraSkge1xuXHRcdFx0XHRhcmdzW2ldID0gYXJndW1lbnRzW2kgKyAxXTsgLy8gcmVtb3ZlIGZpcnN0IGFyZ3VtZW50XG5cdFx0XHR9XG5cblx0XHRcdC8vIExvb3AgdGhyb3VnaCB0aGVtIGFuZCBmaXJlIHRoZSBjYWxsYmFja3Ncblx0XHRcdGZvciAodmFyIF9pID0gMCwgbGVuID0gdGhpcy50b3BpY3NbdG9waWNdLmxlbmd0aDsgX2kgPCBsZW47IF9pKyspIHtcblx0XHRcdFx0dmFyIHN1YnNjcmlwdGlvbiA9IHRoaXMudG9waWNzW3RvcGljXVtfaV07XG5cdFx0XHRcdC8vIENhbGwgaXQncyBjYWxsYmFja1xuXHRcdFx0XHRpZiAoc3Vic2NyaXB0aW9uICYmIHN1YnNjcmlwdGlvbi5jYWxsYmFjaykge1xuXHRcdFx0XHRcdHN1YnNjcmlwdGlvbi5jYWxsYmFjay5hcHBseShzdWJzY3JpcHRpb24uY29udGV4dCwgYXJncyk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiBcInNjYW5cIixcblxuXHRcdC8qKlxuICAgKiBTY2FuIHRoZSBET00sIGluaXRpYWxpemUgbmV3IGNvbXBvbmVudHMgYW5kIGRlc3Ryb3kgcmVtb3ZlZCBjb21wb25lbnRzLlxuICAgKiBAcHVibGljXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gT3B0aW9uYWwgZGF0YSBvYmplY3QgdG8gcGFzcyB0byB0aGUgY29tcG9uZW50IGNvbnN0cnVjdG9yXG4gICAqL1xuXHRcdHZhbHVlOiBmdW5jdGlvbiBzY2FuKCkge1xuXHRcdFx0dmFyIF90aGlzMiA9IHRoaXM7XG5cblx0XHRcdHZhciBkYXRhID0gYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyB7fSA6IGFyZ3VtZW50c1swXTtcblxuXHRcdFx0dmFyIGFjdGl2ZUNvbXBvbmVudHMgPSB7fSxcblx0XHRcdCAgICBlbGVtZW50cyA9IHRoaXMuY29udGV4dEVsLnF1ZXJ5U2VsZWN0b3JBbGwoXCJbZGF0YS1jb21wb25lbnRdXCIpO1xuXG5cdFx0XHRbXS5mb3JFYWNoLmNhbGwoZWxlbWVudHMsIGZ1bmN0aW9uIChlbCkge1xuXHRcdFx0XHRfdGhpczIuX3NjYW5FbGVtZW50KGVsLCBhY3RpdmVDb21wb25lbnRzLCBkYXRhKTtcblx0XHRcdH0pO1xuXG5cdFx0XHRpZiAodGhpcy5udW1iZXJPZkluaXRpYWxpemVkQ29tcG9uZW50cyA+IDApIHRoaXMuY2xlYW5VcF8oYWN0aXZlQ29tcG9uZW50cyk7XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiBcIl9zY2FuRWxlbWVudFwiLFxuXG5cdFx0LyoqXG4gICAqIEZpbmQgYWxsIGNvbXBvbmVudHMgcmVnaXN0ZXJlZCBvbiBhIHNwZWNpZmljIERPTSBlbGVtZW50IGFuZCBpbml0aWFsaXplIHRoZW0gaWYgbmV3XG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7RWxlbWVudH0gZWwgLSBET00gZWxlbWVudCB0byBzY2FuIGZvciBjb21wb25lbnRzXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBhY3RpdmVDb21wb25lbnRzIC0gQWxsIGNvbXBvbmVudElkcyBjdXJyZW50bHkgZm91bmQgaW4gdGhlIERPTVxuICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIE9wdGlvbmFsIGRhdGEgb2JqZWN0IHRvIHBhc3MgdG8gdGhlIGNvbXBvbmVudCBjb25zdHJ1Y3RvclxuICAgKi9cblx0XHR2YWx1ZTogZnVuY3Rpb24gX3NjYW5FbGVtZW50KGVsLCBhY3RpdmVDb21wb25lbnRzLCBkYXRhKSB7XG5cdFx0XHR2YXIgX3RoaXMzID0gdGhpcztcblxuXHRcdFx0Ly8gY2hlY2sgb2YgY29tcG9uZW50KHMpIGZvciB0aGlzIERPTSBlbGVtZW50IGFscmVhZHkgaGF2ZSBiZWVuIGluaXRpYWxpemVkXG5cdFx0XHR2YXIgZWxlbWVudElkID0gZWwuZ2V0QXR0cmlidXRlKFwiZGF0YS1jb21wb25lbnQtaWRcIik7XG5cblx0XHRcdGlmICghZWxlbWVudElkKSB7XG5cdFx0XHRcdC8vIGdpdmUgdW5pcXVlIGlkIHNvIHdlIGNhbiB0cmFjayBpdCBvbiBuZXh0IHNjYW5cblx0XHRcdFx0ZWxlbWVudElkID0gdGhpcy5fZ2VuZXJhdGVVVUlEKCk7XG5cdFx0XHRcdGVsLnNldEF0dHJpYnV0ZShcImRhdGEtY29tcG9uZW50LWlkXCIsIGVsZW1lbnRJZCk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIGZpbmQgdGhlIG5hbWUgb2YgdGhlIGNvbXBvbmVudCBpbnN0YW5jZVxuXHRcdFx0dmFyIGNvbXBvbmVudExpc3QgPSBlbC5nZXRBdHRyaWJ1dGUoXCJkYXRhLWNvbXBvbmVudFwiKS5tYXRjaCgvXFxTKy9nKTtcblx0XHRcdGNvbXBvbmVudExpc3QuZm9yRWFjaChmdW5jdGlvbiAoY29tcG9uZW50TmFtZSkge1xuXG5cdFx0XHRcdHZhciBjb21wb25lbnRJZCA9IGNvbXBvbmVudE5hbWUgKyBcIi1cIiArIGVsZW1lbnRJZDtcblx0XHRcdFx0YWN0aXZlQ29tcG9uZW50c1tjb21wb25lbnRJZF0gPSB0cnVlO1xuXG5cdFx0XHRcdC8vIGNoZWNrIGlmIGNvbXBvbmVudCBub3QgaW5pdGlhbGl6ZWQgYmVmb3JlXG5cdFx0XHRcdGlmICghX3RoaXMzLmluaXRpYWxpemVkQ29tcG9uZW50c1tjb21wb25lbnRJZF0pIHtcblx0XHRcdFx0XHRfdGhpczMuX2luaXRpYWxpemVDb21wb25lbnQoY29tcG9uZW50TmFtZSwgY29tcG9uZW50SWQsIGVsLCBkYXRhKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiBcIl9pbml0aWFsaXplQ29tcG9uZW50XCIsXG5cblx0XHQvKipcbiAgICogQ2FsbCBjb25zdHJ1Y3RvciBvZiBjb21wb25lbnQgYW5kIGFkZCBpbnN0YW5jZSB0byB0aGUgY29sbGVjdGlvbiBvZiBpbml0aWFsaXplZCBjb21wb25lbnRzXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBjb21wb25lbnROYW1lIC0gTmFtZSBvZiB0aGUgY29tcG9uZW50IHRvIGluaXRpYWxpemUuIFVzZWQgdG8gbG9va3VwIGNsYXNzIGRlZmluaXRpb24gaW4gY29tcG9uZW50cyBjb2xsZWN0aW9uLlxuICAgKiBAcGFyYW0ge1N0cmluZ30gY29tcG9uZW50SWQgLSBVbmlxdWUgY29tcG9uZW50IElEIChjb21iaW5hdGlvbiBvZiBjb21wb25lbnQgbmFtZSBhbmQgZWxlbWVudCBJRClcbiAgICogQHBhcmFtIHtFbGVtZW50fSBlbCAtIERPTSBlbGVtZW50IHRoYXQgaXMgdGhlIGNvbnRleHQgb2YgdGhpcyBjb21wb25lbnRcbiAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBPcHRpb25hbCBkYXRhIG9iamVjdCB0byBwYXNzIHRvIHRoZSBjb21wb25lbnQgY29uc3RydWN0b3JcbiAgICovXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIF9pbml0aWFsaXplQ29tcG9uZW50KGNvbXBvbmVudE5hbWUsIGNvbXBvbmVudElkLCBlbCwgZGF0YSkge1xuXHRcdFx0dmFyIGNvbXBvbmVudCA9IHRoaXMuY29tcG9uZW50c1tjb21wb25lbnROYW1lXTtcblxuXHRcdFx0aWYgKHR5cGVvZiBjb21wb25lbnQgIT09IFwiZnVuY3Rpb25cIikgdGhyb3cgXCJDb21wb25lbnRMb2FkZXI6IHVua25vd24gY29tcG9uZW50ICdcIiArIGNvbXBvbmVudE5hbWUgKyBcIidcIjtcblxuXHRcdFx0dmFyIGluc3RhbmNlID0gbmV3IGNvbXBvbmVudChlbCwgZGF0YSwgdGhpcyk7XG5cblx0XHRcdHRoaXMuaW5pdGlhbGl6ZWRDb21wb25lbnRzW2NvbXBvbmVudElkXSA9IGluc3RhbmNlO1xuXHRcdFx0dGhpcy5udW1iZXJPZkluaXRpYWxpemVkQ29tcG9uZW50cysrO1xuXHRcdH1cblx0fSwge1xuXHRcdGtleTogXCJfZGVzdHJveUNvbXBvbmVudFwiLFxuXG5cdFx0LyoqXG4gICAqIENhbGwgZGVzdHJveSgpIG9uIGEgY29tcG9uZW50IGluc3RhbmNlIGFuZCByZW1vdmUgaXQgZnJvbSB0aGUgY29sbGVjdGlvbiBvZiBpbml0aWFsaXplZCBjb21wb25lbnRzXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBjb21wb25lbnRJZCAtIFVuaXF1ZSBjb21wb25lbnQgSUQgdXNlZCB0byBmaW5kIGNvbXBvbmVudCBpbnN0YW5jZVxuICAgKi9cblx0XHR2YWx1ZTogZnVuY3Rpb24gX2Rlc3Ryb3lDb21wb25lbnQoY29tcG9uZW50SWQpIHtcblx0XHRcdHZhciBpbnN0YW5jZSA9IHRoaXMuaW5pdGlhbGl6ZWRDb21wb25lbnRzW2NvbXBvbmVudElkXTtcblx0XHRcdGlmIChpbnN0YW5jZSAmJiB0eXBlb2YgaW5zdGFuY2UuZGVzdHJveSA9PT0gXCJmdW5jdGlvblwiKSBpbnN0YW5jZS5kZXN0cm95KCk7XG5cblx0XHRcdC8vIHNhZmUgdG8gZGVsZXRlIHdoaWxlIG9iamVjdCBrZXlzIHdoaWxlIGxvb3BpbmdodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzM0NjMwNDgvaXMtaXQtc2FmZS10by1kZWxldGUtYW4tb2JqZWN0LXByb3BlcnR5LXdoaWxlLWl0ZXJhdGluZy1vdmVyLXRoZW1cblx0XHRcdGRlbGV0ZSB0aGlzLmluaXRpYWxpemVkQ29tcG9uZW50c1tjb21wb25lbnRJZF07XG5cdFx0XHR0aGlzLm51bWJlck9mSW5pdGlhbGl6ZWRDb21wb25lbnRzLS07XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiBcImNsZWFuVXBfXCIsXG5cblx0XHQvKipcbiAgICogRGVzdHJveSBpbmFpdGlhbGl6ZWQgY29tcG9uZW50cyB0aGF0IG5vIGxvbmdlciBhcmUgYWN0aXZlXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBhY3RpdmVDb21wb25lbnRzIC0gQWxsIGNvbXBvbmVudElkcyBjdXJyZW50bHkgZm91bmQgaW4gdGhlIERPTVxuICAgKi9cblx0XHR2YWx1ZTogZnVuY3Rpb24gY2xlYW5VcF8oKSB7XG5cdFx0XHR2YXIgX3RoaXM0ID0gdGhpcztcblxuXHRcdFx0dmFyIGFjdGl2ZUNvbXBvbmVudHMgPSBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IHt9IDogYXJndW1lbnRzWzBdO1xuXG5cdFx0XHRPYmplY3Qua2V5cyh0aGlzLmluaXRpYWxpemVkQ29tcG9uZW50cykuZm9yRWFjaChmdW5jdGlvbiAoY29tcG9uZW50SWQpIHtcblx0XHRcdFx0aWYgKCFhY3RpdmVDb21wb25lbnRzW2NvbXBvbmVudElkXSkge1xuXHRcdFx0XHRcdF90aGlzNC5fZGVzdHJveUNvbXBvbmVudChjb21wb25lbnRJZCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH1cblx0fSwge1xuXHRcdGtleTogXCJfZ2VuZXJhdGVVVUlEXCIsXG5cblx0XHQvKipcbiAgICogR2VuZXJhdGVzIGEgcmZjNDEyMiB2ZXJzaW9uIDQgY29tcGxpYW50IHVuaXF1ZSBJRFxuICAgKiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEwNTAzNC9jcmVhdGUtZ3VpZC11dWlkLWluLWphdmFzY3JpcHRcbiAgICogQHByaXZhdGVcbiAgICovXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIF9nZW5lcmF0ZVVVSUQoKSB7XG5cdFx0XHRyZXR1cm4gXCJ4eHh4eHh4eC14eHh4LTR4eHgteXh4eC14eHh4eHh4eHh4eHhcIi5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uIChjKSB7XG5cdFx0XHRcdHZhciByID0gTWF0aC5yYW5kb20oKSAqIDE2IHwgMCxcblx0XHRcdFx0ICAgIHYgPSBjID09IFwieFwiID8gciA6IHIgJiAweDMgfCAweDg7XG5cdFx0XHRcdHJldHVybiB2LnRvU3RyaW5nKDE2KTtcblx0XHRcdH0pO1xuXHRcdH1cblx0fV0pO1xuXG5cdHJldHVybiBDb21wb25lbnRMb2FkZXI7XG59KSgpO1xuXG4vLyBFeHBvcnQgQU1ELCBDb21tb25KUy9FUzYgbW9kdWxlIG9yIGFzc3VtZSBnbG9iYWwgbmFtZXNwYWNlXG5pZiAodHlwZW9mIGRlZmluZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBkZWZpbmUuYW1kKSB7XG5cdGRlZmluZShbXSwgQ29tcG9uZW50TG9hZGVyKTtcbn0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBtb2R1bGUuZXhwb3J0cykge1xuXHRtb2R1bGUuZXhwb3J0cyA9IENvbXBvbmVudExvYWRlcjtcbn0gZWxzZSB7XG5cdHdpbmRvdy5Db21wb25lbnRMb2FkZXIgPSBDb21wb25lbnRMb2FkZXI7XG59IiwiLyoqXG4gKiBDb21wb25lbnQgQmFzZSBDbGFzc1xuICogXG4gKiBTZXRzIGFsbCBhcmd1bWVudHMgcGFzc2VkIGluIHRvIGNvbnN0cnVjdG9yIGZyb20gQ29tcG9uZW50TG9hZGVyXG4gKlxuICogRXhwb3NlcyBwdWIvc3ViIG1ldGhvZHMgZm9yIHRyaWdnZXJpbmcgZXZlbnRzIHRvIG90aGVyIGNvbXBvbmVudHNcbiAqXG4gKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIF9jcmVhdGVDbGFzcyA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoJ3ZhbHVlJyBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSkoKTtcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb24nKTsgfSB9XG5cbnZhciBDb21wb25lbnQgPSAoZnVuY3Rpb24gKCkge1xuXG5cdC8qKlxuICAqIENvbnN0cnVjdG9yIGZvciB0aGUgQ29tcG9uZW50XG4gICpcbiAgKiBDYWxsIGBzdXBlciguLi5hcmd1bWVudHMpO2AgaW4gdGhlIGJhc2UgY2xhc3MgY29uc3RydWN0b3JcbiAgKlxuICAqIEBwdWJsaWNcbiAgKiBAcGFyYW0ge05vZGV9IGNvbnRleHQgLSBET00gbm9kZSB0aGF0IGNvbnRhaW5zIHRoZSBjb21wb25lbnQgbWFya3VwXG4gICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBPcHRpb25hbCBkYXRhIG9iamVjdCBmcm9tIENvbXBvbmVudExvYWRlci5zY2FuKClcbiAgKiBAcGFyYW0ge09iamVjdH0gbWVkaWF0b3IgLSBpbnN0YW5jZSBvZiBDb21wb25lbnRMb2FkZXIgZm9yIHB1Yi9zdWJcbiAgKi9cblxuXHRmdW5jdGlvbiBDb21wb25lbnQoKSB7XG5cdFx0X2NsYXNzQ2FsbENoZWNrKHRoaXMsIENvbXBvbmVudCk7XG5cblx0XHR0aGlzLmVsID0gYXJndW1lbnRzWzBdO1xuXHRcdGlmICh0eXBlb2YgalF1ZXJ5ICE9PSAndW5kZWZpbmVkJykgdGhpcy4kZWwgPSBqUXVlcnkodGhpcy5lbCk7XG5cdFx0dGhpcy5kYXRhID0gYXJndW1lbnRzWzFdO1xuXHRcdHRoaXMuX19tZWRpYXRvciA9IGFyZ3VtZW50c1syXTtcblx0fVxuXG5cdF9jcmVhdGVDbGFzcyhDb21wb25lbnQsIFt7XG5cdFx0a2V5OiAncHVibGlzaCcsXG5cblx0XHQvKipcbiAgICogUHVibGlzaCBhbiBldmVudCBmb3Igb3RoZXIgY29tcG9uZW50c1xuICAgKiBAcHJvdGVjdGVkXG4gICAqIEBwYXJhbSB7U3RyaW5nfSB0b3BpYyAtIEV2ZW50IG5hbWVcbiAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBPcHRpb25hbCBwYXJhbXMgdG8gcGFzcyB3aXRoIHRoZSBldmVudFxuICAgKi9cblx0XHR2YWx1ZTogZnVuY3Rpb24gcHVibGlzaCgpIHtcblx0XHRcdHZhciBfbWVkaWF0b3I7XG5cblx0XHRcdChfbWVkaWF0b3IgPSB0aGlzLl9fbWVkaWF0b3IpLnB1Ymxpc2guYXBwbHkoX21lZGlhdG9yLCBhcmd1bWVudHMpO1xuXHRcdH1cblx0fSwge1xuXHRcdGtleTogJ3N1YnNjcmliZScsXG5cblx0XHQvKipcbiAgICogU3Vic2NyaWJlIHRvIGFuIGV2ZW50IGZyb20gYW5vdGhlciBjb21wb25lbnRcbiAgICogQHByb3RlY3RlZFxuICAgKiBAcGFyYW0ge1N0cmluZ30gdG9waWMgLSBFdmVudCBuYW1lXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0gRnVuY3Rpb24gdG8gYmluZFxuICAgKi9cblx0XHR2YWx1ZTogZnVuY3Rpb24gc3Vic2NyaWJlKHRvcGljLCBjYWxsYmFjaykge1xuXHRcdFx0dGhpcy5fX21lZGlhdG9yLnN1YnNjcmliZSh0b3BpYywgY2FsbGJhY2ssIHRoaXMpO1xuXHRcdH1cblx0fSwge1xuXHRcdGtleTogJ3Vuc3Vic2NyaWJlJyxcblxuXHRcdC8qKlxuICAgKiBVbnN1YnNjcmliZSBmcm9tIGFuIGV2ZW50IGZyb20gYW5vdGhlciBjb21wb25lbnRcbiAgICogQHByb3RlY3RlZFxuICAgKiBAcGFyYW0ge1N0cmluZ30gdG9waWMgLSBFdmVudCBuYW1lXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0gRnVuY3Rpb24gdG8gdW5iaW5kXG4gICAqL1xuXHRcdHZhbHVlOiBmdW5jdGlvbiB1bnN1YnNjcmliZSh0b3BpYywgY2FsbGJhY2spIHtcblx0XHRcdHRoaXMuX19tZWRpYXRvci51bnN1YnNjcmliZSh0b3BpYywgY2FsbGJhY2ssIHRoaXMpO1xuXHRcdH1cblx0fSwge1xuXHRcdGtleTogJ3NjYW4nLFxuXG5cdFx0LyoqXG4gICAqIFV0aWxpdHkgbWV0aG9kIGZvciB0cmlnZ2VyaW5nIHRoZSBDb21wb25lbnRMb2FkZXIgdG8gc2NhbiB0aGUgbWFya3VwIGZvciBuZXcgY29tcG9uZW50c1xuICAgKiBAcHJvdGVjdGVkXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gT3B0aW9uYWwgZGF0YSB0byBwYXNzIHRvIHRoZSBjb25zdHJ1Y3RvciBvZiBhbnkgQ29tcG9uZW50IGluaXRpYWxpemVkIGJ5IHRoaXMgc2NhblxuICAgKi9cblx0XHR2YWx1ZTogZnVuY3Rpb24gc2NhbihkYXRhKSB7XG5cdFx0XHR0aGlzLl9fbWVkaWF0b3Iuc2NhbihkYXRhKTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6ICdkZWZlcicsXG5cblx0XHQvKipcbiAgICogVXRpbGl0eSBtZXRob2QgZm9yIGRlZmVyaW5nIGEgZnVuY3Rpb24gY2FsbFxuICAgKiBAcHJvdGVjdGVkXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0gRnVuY3Rpb24gdG8gY2FsbFxuICAgKiBAcGFyYW0ge051bWJlcn0gbXMgLSBPcHRpb25hbCBtcyB0byBkZWxheSwgZGVmYXVsdHMgdG8gMTdtcyAoanVzdCBvdmVyIDEgZnJhbWUgYXQgNjBmcHMpXG4gICAqL1xuXHRcdHZhbHVlOiBmdW5jdGlvbiBkZWZlcihjYWxsYmFjaykge1xuXHRcdFx0dmFyIG1zID0gYXJndW1lbnRzWzFdID09PSB1bmRlZmluZWQgPyAxNyA6IGFyZ3VtZW50c1sxXTtcblxuXHRcdFx0c2V0VGltZW91dChjYWxsYmFjaywgbXMpO1xuXHRcdH1cblx0fSwge1xuXHRcdGtleTogJ2Rlc3Ryb3knLFxuXG5cdFx0LyoqXG4gICAqIENhbGxlZCBieSBDb21wb25lbnRMb2FkZXIgd2hlbiBjb21wb25lbnQgaXMgbm8gbG9uZ2VyIGZvdW5kIGluIHRoZSBtYXJrdXBcbiAgICogdXN1YWxseSBoYXBwZW5zIGFzIGEgcmVzdWx0IG9mIHJlcGxhY2luZyB0aGUgbWFya3VwIHVzaW5nIEFKQVhcbiAgICpcdFxuICAgKiBPdmVycmlkZSBpbiBzdWJjbGFzcyBhbmQgbWFrZSBzdXJlIHRvIGNsZWFuIHVwIGV2ZW50IGhhbmRsZXJzIGV0Y1xuICAgKlxuICAgKiBAcHJvdGVjdGVkXG4gICAqL1xuXHRcdHZhbHVlOiBmdW5jdGlvbiBkZXN0cm95KCkge31cblx0fV0pO1xuXG5cdHJldHVybiBDb21wb25lbnQ7XG59KSgpO1xuXG4vLyBFeHBvcnQgQU1ELCBDb21tb25KUy9FUzYgbW9kdWxlIG9yIGFzc3VtZSBnbG9iYWwgbmFtZXNwYWNlXG5pZiAodHlwZW9mIGRlZmluZSAhPT0gJ3VuZGVmaW5lZCcgJiYgZGVmaW5lLmFtZCkge1xuXHRkZWZpbmUoW10sIENvbXBvbmVudCk7XG59IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG5cdG1vZHVsZS5leHBvcnRzID0gQ29tcG9uZW50O1xufSBlbHNlIHtcblx0d2luZG93LkNvbXBvbmVudCA9IENvbXBvbmVudDtcbn0iLCJpbXBvcnQgQ29tcG9uZW50IGZyb20gJ2NvbXBvbmVudC1sb2FkZXItanMvZGlzdC9lczUvY29tcG9uZW50JztcblxuY2xhc3MgRG9raSBleHRlbmRzIENvbXBvbmVudCB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKC4uLmFyZ3VtZW50cyk7XG5cdFx0Y29uc29sZS5sb2coJ25ldyBET0tJIDM3Jyk7XG5cdH1cblxuXHRkZXN0cm95KCkge1xuXHRcdHN1cGVyLmRlc3Ryb3koKTtcblx0XHRjb25zb2xlLmxvZygnZGVzdHJveSBET0tJJyk7XG5cdH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgRG9raTsiLCJpbXBvcnQgQ29tcG9uZW50TG9hZGVyIGZyb20gJ2NvbXBvbmVudC1sb2FkZXItanMvZGlzdC9lczUvY29tcG9uZW50LWxvYWRlcic7XG5cbmltcG9ydCBEb2tpIGZyb20gJy4vY29tcG9uZW50cy9kb2tpJztcblxuXG5uZXcgY29tcG9uZW50TG9hZGVyKHtcblx0RG9raVxufSkuc2NhbigpOyJdfQ==
