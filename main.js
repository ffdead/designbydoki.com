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

},{"component-loader-js/dist/es6/component":2}],4:[function(require,module,exports){
'use strict';

var _componentLoader = require('component-loader-js/dist/es5/component-loader.js');

var _componentLoader2 = _interopRequireDefault(_componentLoader);

var _doki = require('./doki');

var _doki2 = _interopRequireDefault(_doki);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

new _componentLoader2.default({ Doki: _doki2.default }).scan();

},{"./doki":3,"component-loader-js/dist/es5/component-loader.js":1}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvY29tcG9uZW50LWxvYWRlci1qcy9kaXN0L2VzNS9jb21wb25lbnQtbG9hZGVyLmpzIiwibm9kZV9tb2R1bGVzL2NvbXBvbmVudC1sb2FkZXItanMvZGlzdC9lczYvY29tcG9uZW50LmpzIiwidGhlbWUvanMvZG9raS5qcyIsInRoZW1lL2pzL21haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUN2R007OztBQUNMLFVBREssSUFDTCxHQUFjO3dCQURULE1BQ1M7O3FFQURULGtCQUVLLFlBREk7O0FBRWIsVUFBUSxHQUFSLENBQVksYUFBWixFQUZhOztFQUFkOztjQURLOzs0QkFNSztBQUNULDhCQVBJLDRDQU9KLENBRFM7QUFFVCxXQUFRLEdBQVIsQ0FBWSxjQUFaLEVBRlM7Ozs7UUFOTDs7O2tCQVlTOzs7Ozs7Ozs7Ozs7Ozs7QUNUZiw2QkFBQyxDQUFvQixFQUFDLG9CQUFELEVBQXBCLENBQUQsQ0FBOEIsSUFBOUIiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBDb21wb25lbnRMb2FkZXIgQ2xhc3NcbiAqXG4gKiBJbnN0YW50aWF0ZXMgSmF2YVNjcmlwdCBDbGFzc2VzIHdoZW4gdGhlaXIgbmFtZSBpcyBmb3VuZCBpbiB0aGUgRE9NIHVzaW5nIGF0dHJpYnV0ZSBkYXRhLWNvbXBvbmVudD1cIlwiXG4gKlxuICovXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIF9jcmVhdGVDbGFzcyA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KSgpO1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG52YXIgQ29tcG9uZW50TG9hZGVyID0gKGZ1bmN0aW9uICgpIHtcblxuXHQvKipcbiAgKiBDb25zdHJ1Y3RvciBmb3IgdGhlIENvbXBvbmVudExvYWRlclxuICAqIEBjbGFzc1xuICAqIEBwdWJsaWNcbiAgKiBAcGFyYW0ge09iamVjdH0gY29tcG9uZW50cyAtIE9wdGlvbmFsIGNvbGxlY3Rpb24gb2YgYXZhaWxhYmxlIGNvbXBvbmVudHM6IHtjb21wb25lbnROYW1lOiBjbGFzc0RlZmluaXRpb259XG4gICogQHBhcmFtIHtOb2RlfSBjb250ZXh0IC0gT3B0aW9uYWwgRE9NIG5vZGUgdG8gc2VhcmNoIGZvciBjb21wb25lbnRzLiBEZWZhdWx0cyB0byBkb2N1bWVudC5cbiAgKi9cblxuXHRmdW5jdGlvbiBDb21wb25lbnRMb2FkZXIoKSB7XG5cdFx0dmFyIGNvbXBvbmVudHMgPSBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IHt9IDogYXJndW1lbnRzWzBdO1xuXHRcdHZhciBjb250ZXh0ID0gYXJndW1lbnRzWzFdID09PSB1bmRlZmluZWQgPyBkb2N1bWVudCA6IGFyZ3VtZW50c1sxXTtcblxuXHRcdF9jbGFzc0NhbGxDaGVjayh0aGlzLCBDb21wb25lbnRMb2FkZXIpO1xuXG5cdFx0dGhpcy5jb250ZXh0RWwgPSBjb250ZXh0O1xuXHRcdHRoaXMuaW5pdGlhbGl6ZWRDb21wb25lbnRzID0ge307XG5cdFx0dGhpcy5udW1iZXJPZkluaXRpYWxpemVkQ29tcG9uZW50cyA9IDA7XG5cdFx0dGhpcy5jb21wb25lbnRzID0ge307XG5cdFx0dGhpcy50b3BpY3MgPSB7fTtcblx0XHR0aGlzLnJlZ2lzdGVyKGNvbXBvbmVudHMpO1xuXHR9XG5cblx0X2NyZWF0ZUNsYXNzKENvbXBvbmVudExvYWRlciwgW3tcblx0XHRrZXk6IFwicmVnaXN0ZXJcIixcblxuXHRcdC8qKlxuICAgKiBBZGQgY29tcG9uZW50KHMpIHRvIGNvbGxlY3Rpb24gb2YgYXZhaWxhYmxlIGNvbXBvbmVudHNcbiAgICogQHB1YmxpY1xuICAgKiBAcGFyYW0ge09iamVjdH0gY29tcG9uZW50cyAtIENvbGxlY3Rpb24gb2YgY29tcG9uZW50czoge2NvbXBvbmVudE5hbWU6IGNsYXNzRGVmaW5pdGlvbn1cbiAgICovXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIHJlZ2lzdGVyKCkge1xuXHRcdFx0dmFyIF90aGlzID0gdGhpcztcblxuXHRcdFx0dmFyIGNvbXBvbmVudHMgPSBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IHt9IDogYXJndW1lbnRzWzBdO1xuXG5cdFx0XHRPYmplY3Qua2V5cyhjb21wb25lbnRzKS5mb3JFYWNoKGZ1bmN0aW9uIChjb21wb25lbnROYW1lKSB7XG5cdFx0XHRcdF90aGlzLmNvbXBvbmVudHNbY29tcG9uZW50TmFtZV0gPSBjb21wb25lbnRzW2NvbXBvbmVudE5hbWVdO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiBcInVucmVnaXN0ZXJcIixcblxuXHRcdC8qKlxuICAgKiBSZW1vdmUgY29tcG9uZW50IGZyb20gY29sbGVjdGlvbiBvZiBhdmFpbGFibGUgY29tcG9uZW50c1xuICAgKiBAcHVibGljXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBjb21wb25lbnROYW1lIC0gTmFtZSBvZiB0aGUgY29tcG9uZW50IHRvIHJlbW92ZVxuICAgKi9cblx0XHR2YWx1ZTogZnVuY3Rpb24gdW5yZWdpc3Rlcihjb21wb25lbnROYW1lKSB7XG5cdFx0XHRkZWxldGUgdGhpcy5jb21wb25lbnRzW2NvbXBvbmVudE5hbWVdO1xuXHRcdH1cblx0fSwge1xuXHRcdGtleTogXCJzdWJzY3JpYmVcIixcblxuXHRcdC8qKlxuICAgKiBNZWRpYXRvciBmdW5jdGlvbmFsaXR5LlxuICAgKiBTdG9yZXMgdGhlIHRvcGljIGFuZCBjYWxsYmFjayBnaXZlbiBieSB0aGUgY29tcG9uZW50LlxuICAgKiBmb3IgZnVydGhlciByZWZlcmVuY2UuXG4gICAqIEBwYXJhbSAge1N0cmluZ30gdG9waWMgICAgICBUb3BpYyBzdHJpbmdcbiAgICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrIENhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgd291bGQgYmUgdHJpZ2dlcmVkLlxuICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY29udGV4dCAgQ2xhc3MgaW5zdGFuY2Ugd2hpY2ggb3ducyB0aGUgY2FsbGJhY2tcbiAgICovXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIHN1YnNjcmliZSh0b3BpYywgY2FsbGJhY2ssIGNvbnRleHQpIHtcblxuXHRcdFx0Ly8gSXMgdGhpcyBhIG5ldyB0b3BpYz9cblx0XHRcdGlmICghdGhpcy50b3BpY3MuaGFzT3duUHJvcGVydHkodG9waWMpKSB7XG5cdFx0XHRcdHRoaXMudG9waWNzW3RvcGljXSA9IFtdO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBTdG9yZSB0aGUgc3Vic2NyaWJlciBjYWxsYmFja1xuXHRcdFx0dGhpcy50b3BpY3NbdG9waWNdLnB1c2goeyBjb250ZXh0OiBjb250ZXh0LCBjYWxsYmFjazogY2FsbGJhY2sgfSk7XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiBcInVuc3Vic2NyaWJlXCIsXG5cblx0XHQvKipcbiAgICogTWVkaWF0b3IgZnVuY3Rpb25hbGl0eS5cbiAgICogUmVtb3ZlcyB0aGUgc3RvcmVkIHRvcGljIGFuZCBjYWxsYmFjayBnaXZlbiBieSB0aGUgY29tcG9uZW50LlxuICAgKiBAcGFyYW0gIHtTdHJpbmd9ICAgdG9waWMgICAgVG9waWMgc3RyaW5nXG4gICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjYWxsYmFjayBDYWxsYmFjayBmdW5jdGlvbiB0aGF0IHdvdWxkIGJlIHRyaWdnZXJlZC5cbiAgICogQHBhcmFtICB7RnVuY3Rpb259IGNvbnRleHQgIENsYXNzIGluc3RhbmNlIHdoaWNoIG93bnMgdGhlIGNhbGxiYWNrXG4gICAqIEByZXR1cm4ge0Jvb2xlYW59ICAgICAgICAgICBUcnVlIG9uIHN1Y2Nlc3MsIEZhbHNlIG90aGVyd2lzZS5cbiAgICovXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIHVuc3Vic2NyaWJlKHRvcGljLCBjYWxsYmFjaywgY29udGV4dCkge1xuXHRcdFx0Ly8gRG8gd2UgaGF2ZSB0aGlzIHRvcGljP1xuXHRcdFx0aWYgKCF0aGlzLnRvcGljcy5oYXNPd25Qcm9wZXJ0eSh0b3BpYykpIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBGaW5kIG91dCB3aGVyZSB0aGlzIGlzIGFuZCByZW1vdmUgaXRcblx0XHRcdGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLnRvcGljc1t0b3BpY10ubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdFx0aWYgKHRoaXMudG9waWNzW3RvcGljXVtpXS5jYWxsYmFjayA9PT0gY2FsbGJhY2spIHtcblx0XHRcdFx0XHRpZiAoIWNvbnRleHQgfHwgdGhpcy50b3BpY3NbdG9waWNdW2ldLmNvbnRleHQgPT09IGNvbnRleHQpIHtcblx0XHRcdFx0XHRcdHRoaXMudG9waWNzW3RvcGljXS5zcGxpY2UoaSwgMSk7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fSwge1xuXHRcdGtleTogXCJwdWJsaXNoXCIsXG5cblx0XHQvKipcbiAgICogW3B1Ymxpc2ggZGVzY3JpcHRpb25dXG4gICAqIEBwYXJhbSAge1t0eXBlXX0gdG9waWMgW2Rlc2NyaXB0aW9uXVxuICAgKiBAcmV0dXJuIHtbdHlwZV19ICAgICAgIFtkZXNjcmlwdGlvbl1cbiAgICovXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIHB1Ymxpc2godG9waWMpIHtcblx0XHRcdC8vIENoZWNrIGlmIHdlIGhhdmUgc3ViY3JpYmVycyB0byB0aGlzIHRvcGljXG5cdFx0XHRpZiAoIXRoaXMudG9waWNzLmhhc093blByb3BlcnR5KHRvcGljKSkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdC8vIGRvbid0IHNsaWNlIG9uIGFyZ3VtZW50cyBiZWNhdXNlIGl0IHByZXZlbnRzIG9wdGltaXphdGlvbnMgaW4gSmF2YVNjcmlwdCBlbmdpbmVzIChWOCBmb3IgZXhhbXBsZSlcblx0XHRcdC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0Z1bmN0aW9ucy9hcmd1bWVudHNcblx0XHRcdC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9wZXRrYWFudG9ub3YvYmx1ZWJpcmQvd2lraS9PcHRpbWl6YXRpb24ta2lsbGVycyMzMi1sZWFraW5nLWFyZ3VtZW50c1xuXHRcdFx0dmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgKytpKSB7XG5cdFx0XHRcdGFyZ3NbaV0gPSBhcmd1bWVudHNbaSArIDFdOyAvLyByZW1vdmUgZmlyc3QgYXJndW1lbnRcblx0XHRcdH1cblxuXHRcdFx0Ly8gTG9vcCB0aHJvdWdoIHRoZW0gYW5kIGZpcmUgdGhlIGNhbGxiYWNrc1xuXHRcdFx0Zm9yICh2YXIgX2kgPSAwLCBsZW4gPSB0aGlzLnRvcGljc1t0b3BpY10ubGVuZ3RoOyBfaSA8IGxlbjsgX2krKykge1xuXHRcdFx0XHR2YXIgc3Vic2NyaXB0aW9uID0gdGhpcy50b3BpY3NbdG9waWNdW19pXTtcblx0XHRcdFx0Ly8gQ2FsbCBpdCdzIGNhbGxiYWNrXG5cdFx0XHRcdGlmIChzdWJzY3JpcHRpb24gJiYgc3Vic2NyaXB0aW9uLmNhbGxiYWNrKSB7XG5cdFx0XHRcdFx0c3Vic2NyaXB0aW9uLmNhbGxiYWNrLmFwcGx5KHN1YnNjcmlwdGlvbi5jb250ZXh0LCBhcmdzKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6IFwic2NhblwiLFxuXG5cdFx0LyoqXG4gICAqIFNjYW4gdGhlIERPTSwgaW5pdGlhbGl6ZSBuZXcgY29tcG9uZW50cyBhbmQgZGVzdHJveSByZW1vdmVkIGNvbXBvbmVudHMuXG4gICAqIEBwdWJsaWNcbiAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBPcHRpb25hbCBkYXRhIG9iamVjdCB0byBwYXNzIHRvIHRoZSBjb21wb25lbnQgY29uc3RydWN0b3JcbiAgICovXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIHNjYW4oKSB7XG5cdFx0XHR2YXIgX3RoaXMyID0gdGhpcztcblxuXHRcdFx0dmFyIGRhdGEgPSBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IHt9IDogYXJndW1lbnRzWzBdO1xuXG5cdFx0XHR2YXIgYWN0aXZlQ29tcG9uZW50cyA9IHt9LFxuXHRcdFx0ICAgIGVsZW1lbnRzID0gdGhpcy5jb250ZXh0RWwucXVlcnlTZWxlY3RvckFsbChcIltkYXRhLWNvbXBvbmVudF1cIik7XG5cblx0XHRcdFtdLmZvckVhY2guY2FsbChlbGVtZW50cywgZnVuY3Rpb24gKGVsKSB7XG5cdFx0XHRcdF90aGlzMi5fc2NhbkVsZW1lbnQoZWwsIGFjdGl2ZUNvbXBvbmVudHMsIGRhdGEpO1xuXHRcdFx0fSk7XG5cblx0XHRcdGlmICh0aGlzLm51bWJlck9mSW5pdGlhbGl6ZWRDb21wb25lbnRzID4gMCkgdGhpcy5jbGVhblVwXyhhY3RpdmVDb21wb25lbnRzKTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6IFwiX3NjYW5FbGVtZW50XCIsXG5cblx0XHQvKipcbiAgICogRmluZCBhbGwgY29tcG9uZW50cyByZWdpc3RlcmVkIG9uIGEgc3BlY2lmaWMgRE9NIGVsZW1lbnQgYW5kIGluaXRpYWxpemUgdGhlbSBpZiBuZXdcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtFbGVtZW50fSBlbCAtIERPTSBlbGVtZW50IHRvIHNjYW4gZm9yIGNvbXBvbmVudHNcbiAgICogQHBhcmFtIHtPYmplY3R9IGFjdGl2ZUNvbXBvbmVudHMgLSBBbGwgY29tcG9uZW50SWRzIGN1cnJlbnRseSBmb3VuZCBpbiB0aGUgRE9NXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gT3B0aW9uYWwgZGF0YSBvYmplY3QgdG8gcGFzcyB0byB0aGUgY29tcG9uZW50IGNvbnN0cnVjdG9yXG4gICAqL1xuXHRcdHZhbHVlOiBmdW5jdGlvbiBfc2NhbkVsZW1lbnQoZWwsIGFjdGl2ZUNvbXBvbmVudHMsIGRhdGEpIHtcblx0XHRcdHZhciBfdGhpczMgPSB0aGlzO1xuXG5cdFx0XHQvLyBjaGVjayBvZiBjb21wb25lbnQocykgZm9yIHRoaXMgRE9NIGVsZW1lbnQgYWxyZWFkeSBoYXZlIGJlZW4gaW5pdGlhbGl6ZWRcblx0XHRcdHZhciBlbGVtZW50SWQgPSBlbC5nZXRBdHRyaWJ1dGUoXCJkYXRhLWNvbXBvbmVudC1pZFwiKTtcblxuXHRcdFx0aWYgKCFlbGVtZW50SWQpIHtcblx0XHRcdFx0Ly8gZ2l2ZSB1bmlxdWUgaWQgc28gd2UgY2FuIHRyYWNrIGl0IG9uIG5leHQgc2NhblxuXHRcdFx0XHRlbGVtZW50SWQgPSB0aGlzLl9nZW5lcmF0ZVVVSUQoKTtcblx0XHRcdFx0ZWwuc2V0QXR0cmlidXRlKFwiZGF0YS1jb21wb25lbnQtaWRcIiwgZWxlbWVudElkKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gZmluZCB0aGUgbmFtZSBvZiB0aGUgY29tcG9uZW50IGluc3RhbmNlXG5cdFx0XHR2YXIgY29tcG9uZW50TGlzdCA9IGVsLmdldEF0dHJpYnV0ZShcImRhdGEtY29tcG9uZW50XCIpLm1hdGNoKC9cXFMrL2cpO1xuXHRcdFx0Y29tcG9uZW50TGlzdC5mb3JFYWNoKGZ1bmN0aW9uIChjb21wb25lbnROYW1lKSB7XG5cblx0XHRcdFx0dmFyIGNvbXBvbmVudElkID0gY29tcG9uZW50TmFtZSArIFwiLVwiICsgZWxlbWVudElkO1xuXHRcdFx0XHRhY3RpdmVDb21wb25lbnRzW2NvbXBvbmVudElkXSA9IHRydWU7XG5cblx0XHRcdFx0Ly8gY2hlY2sgaWYgY29tcG9uZW50IG5vdCBpbml0aWFsaXplZCBiZWZvcmVcblx0XHRcdFx0aWYgKCFfdGhpczMuaW5pdGlhbGl6ZWRDb21wb25lbnRzW2NvbXBvbmVudElkXSkge1xuXHRcdFx0XHRcdF90aGlzMy5faW5pdGlhbGl6ZUNvbXBvbmVudChjb21wb25lbnROYW1lLCBjb21wb25lbnRJZCwgZWwsIGRhdGEpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6IFwiX2luaXRpYWxpemVDb21wb25lbnRcIixcblxuXHRcdC8qKlxuICAgKiBDYWxsIGNvbnN0cnVjdG9yIG9mIGNvbXBvbmVudCBhbmQgYWRkIGluc3RhbmNlIHRvIHRoZSBjb2xsZWN0aW9uIG9mIGluaXRpYWxpemVkIGNvbXBvbmVudHNcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtTdHJpbmd9IGNvbXBvbmVudE5hbWUgLSBOYW1lIG9mIHRoZSBjb21wb25lbnQgdG8gaW5pdGlhbGl6ZS4gVXNlZCB0byBsb29rdXAgY2xhc3MgZGVmaW5pdGlvbiBpbiBjb21wb25lbnRzIGNvbGxlY3Rpb24uXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBjb21wb25lbnRJZCAtIFVuaXF1ZSBjb21wb25lbnQgSUQgKGNvbWJpbmF0aW9uIG9mIGNvbXBvbmVudCBuYW1lIGFuZCBlbGVtZW50IElEKVxuICAgKiBAcGFyYW0ge0VsZW1lbnR9IGVsIC0gRE9NIGVsZW1lbnQgdGhhdCBpcyB0aGUgY29udGV4dCBvZiB0aGlzIGNvbXBvbmVudFxuICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIE9wdGlvbmFsIGRhdGEgb2JqZWN0IHRvIHBhc3MgdG8gdGhlIGNvbXBvbmVudCBjb25zdHJ1Y3RvclxuICAgKi9cblx0XHR2YWx1ZTogZnVuY3Rpb24gX2luaXRpYWxpemVDb21wb25lbnQoY29tcG9uZW50TmFtZSwgY29tcG9uZW50SWQsIGVsLCBkYXRhKSB7XG5cdFx0XHR2YXIgY29tcG9uZW50ID0gdGhpcy5jb21wb25lbnRzW2NvbXBvbmVudE5hbWVdO1xuXG5cdFx0XHRpZiAodHlwZW9mIGNvbXBvbmVudCAhPT0gXCJmdW5jdGlvblwiKSB0aHJvdyBcIkNvbXBvbmVudExvYWRlcjogdW5rbm93biBjb21wb25lbnQgJ1wiICsgY29tcG9uZW50TmFtZSArIFwiJ1wiO1xuXG5cdFx0XHR2YXIgaW5zdGFuY2UgPSBuZXcgY29tcG9uZW50KGVsLCBkYXRhLCB0aGlzKTtcblxuXHRcdFx0dGhpcy5pbml0aWFsaXplZENvbXBvbmVudHNbY29tcG9uZW50SWRdID0gaW5zdGFuY2U7XG5cdFx0XHR0aGlzLm51bWJlck9mSW5pdGlhbGl6ZWRDb21wb25lbnRzKys7XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiBcIl9kZXN0cm95Q29tcG9uZW50XCIsXG5cblx0XHQvKipcbiAgICogQ2FsbCBkZXN0cm95KCkgb24gYSBjb21wb25lbnQgaW5zdGFuY2UgYW5kIHJlbW92ZSBpdCBmcm9tIHRoZSBjb2xsZWN0aW9uIG9mIGluaXRpYWxpemVkIGNvbXBvbmVudHNcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtTdHJpbmd9IGNvbXBvbmVudElkIC0gVW5pcXVlIGNvbXBvbmVudCBJRCB1c2VkIHRvIGZpbmQgY29tcG9uZW50IGluc3RhbmNlXG4gICAqL1xuXHRcdHZhbHVlOiBmdW5jdGlvbiBfZGVzdHJveUNvbXBvbmVudChjb21wb25lbnRJZCkge1xuXHRcdFx0dmFyIGluc3RhbmNlID0gdGhpcy5pbml0aWFsaXplZENvbXBvbmVudHNbY29tcG9uZW50SWRdO1xuXHRcdFx0aWYgKGluc3RhbmNlICYmIHR5cGVvZiBpbnN0YW5jZS5kZXN0cm95ID09PSBcImZ1bmN0aW9uXCIpIGluc3RhbmNlLmRlc3Ryb3koKTtcblxuXHRcdFx0Ly8gc2FmZSB0byBkZWxldGUgd2hpbGUgb2JqZWN0IGtleXMgd2hpbGUgbG9vcGluZ2h0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMzQ2MzA0OC9pcy1pdC1zYWZlLXRvLWRlbGV0ZS1hbi1vYmplY3QtcHJvcGVydHktd2hpbGUtaXRlcmF0aW5nLW92ZXItdGhlbVxuXHRcdFx0ZGVsZXRlIHRoaXMuaW5pdGlhbGl6ZWRDb21wb25lbnRzW2NvbXBvbmVudElkXTtcblx0XHRcdHRoaXMubnVtYmVyT2ZJbml0aWFsaXplZENvbXBvbmVudHMtLTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6IFwiY2xlYW5VcF9cIixcblxuXHRcdC8qKlxuICAgKiBEZXN0cm95IGluYWl0aWFsaXplZCBjb21wb25lbnRzIHRoYXQgbm8gbG9uZ2VyIGFyZSBhY3RpdmVcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtPYmplY3R9IGFjdGl2ZUNvbXBvbmVudHMgLSBBbGwgY29tcG9uZW50SWRzIGN1cnJlbnRseSBmb3VuZCBpbiB0aGUgRE9NXG4gICAqL1xuXHRcdHZhbHVlOiBmdW5jdGlvbiBjbGVhblVwXygpIHtcblx0XHRcdHZhciBfdGhpczQgPSB0aGlzO1xuXG5cdFx0XHR2YXIgYWN0aXZlQ29tcG9uZW50cyA9IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8ge30gOiBhcmd1bWVudHNbMF07XG5cblx0XHRcdE9iamVjdC5rZXlzKHRoaXMuaW5pdGlhbGl6ZWRDb21wb25lbnRzKS5mb3JFYWNoKGZ1bmN0aW9uIChjb21wb25lbnRJZCkge1xuXHRcdFx0XHRpZiAoIWFjdGl2ZUNvbXBvbmVudHNbY29tcG9uZW50SWRdKSB7XG5cdFx0XHRcdFx0X3RoaXM0Ll9kZXN0cm95Q29tcG9uZW50KGNvbXBvbmVudElkKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiBcIl9nZW5lcmF0ZVVVSURcIixcblxuXHRcdC8qKlxuICAgKiBHZW5lcmF0ZXMgYSByZmM0MTIyIHZlcnNpb24gNCBjb21wbGlhbnQgdW5pcXVlIElEXG4gICAqIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTA1MDM0L2NyZWF0ZS1ndWlkLXV1aWQtaW4tamF2YXNjcmlwdFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cblx0XHR2YWx1ZTogZnVuY3Rpb24gX2dlbmVyYXRlVVVJRCgpIHtcblx0XHRcdHJldHVybiBcInh4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eFwiLnJlcGxhY2UoL1t4eV0vZywgZnVuY3Rpb24gKGMpIHtcblx0XHRcdFx0dmFyIHIgPSBNYXRoLnJhbmRvbSgpICogMTYgfCAwLFxuXHRcdFx0XHQgICAgdiA9IGMgPT0gXCJ4XCIgPyByIDogciAmIDB4MyB8IDB4ODtcblx0XHRcdFx0cmV0dXJuIHYudG9TdHJpbmcoMTYpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9XSk7XG5cblx0cmV0dXJuIENvbXBvbmVudExvYWRlcjtcbn0pKCk7XG5cbi8vIEV4cG9ydCBBTUQsIENvbW1vbkpTL0VTNiBtb2R1bGUgb3IgYXNzdW1lIGdsb2JhbCBuYW1lc3BhY2VcbmlmICh0eXBlb2YgZGVmaW5lICE9PSBcInVuZGVmaW5lZFwiICYmIGRlZmluZS5hbWQpIHtcblx0ZGVmaW5lKFtdLCBDb21wb25lbnRMb2FkZXIpO1xufSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSBcInVuZGVmaW5lZFwiICYmIG1vZHVsZS5leHBvcnRzKSB7XG5cdG1vZHVsZS5leHBvcnRzID0gQ29tcG9uZW50TG9hZGVyO1xufSBlbHNlIHtcblx0d2luZG93LkNvbXBvbmVudExvYWRlciA9IENvbXBvbmVudExvYWRlcjtcbn0iLCIvKipcbiAqIENvbXBvbmVudCBCYXNlIENsYXNzXG4gKiBcbiAqIFNldHMgYWxsIGFyZ3VtZW50cyBwYXNzZWQgaW4gdG8gY29uc3RydWN0b3IgZnJvbSBDb21wb25lbnRMb2FkZXJcbiAqXG4gKiBFeHBvc2VzIHB1Yi9zdWIgbWV0aG9kcyBmb3IgdHJpZ2dlcmluZyBldmVudHMgdG8gb3RoZXIgY29tcG9uZW50c1xuICpcbiAqL1xuY2xhc3MgQ29tcG9uZW50IHtcblxuXHQvKipcblx0ICogQ29uc3RydWN0b3IgZm9yIHRoZSBDb21wb25lbnRcblx0ICpcblx0ICogQ2FsbCBgc3VwZXIoLi4uYXJndW1lbnRzKTtgIGluIHRoZSBiYXNlIGNsYXNzIGNvbnN0cnVjdG9yXG5cdCAqXG5cdCAqIEBwdWJsaWNcblx0ICogQHBhcmFtIHtOb2RlfSBjb250ZXh0IC0gRE9NIG5vZGUgdGhhdCBjb250YWlucyB0aGUgY29tcG9uZW50IG1hcmt1cFxuXHQgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIE9wdGlvbmFsIGRhdGEgb2JqZWN0IGZyb20gQ29tcG9uZW50TG9hZGVyLnNjYW4oKVxuXHQgKiBAcGFyYW0ge09iamVjdH0gbWVkaWF0b3IgLSBpbnN0YW5jZSBvZiBDb21wb25lbnRMb2FkZXIgZm9yIHB1Yi9zdWJcblx0ICovXG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHRoaXMuZWwgPSBhcmd1bWVudHNbMF1cblx0XHRpZiAodHlwZW9mIGpRdWVyeSAhPT0gJ3VuZGVmaW5lZCcpIHRoaXMuJGVsID0galF1ZXJ5KHRoaXMuZWwpO1xuXHRcdHRoaXMuZGF0YSA9IGFyZ3VtZW50c1sxXTtcblx0XHR0aGlzLl9fbWVkaWF0b3IgPSBhcmd1bWVudHNbMl07XG5cdH1cblxuXG5cdC8qKlxuXHQgKiBQdWJsaXNoIGFuIGV2ZW50IGZvciBvdGhlciBjb21wb25lbnRzXG5cdCAqIEBwcm90ZWN0ZWRcblx0ICogQHBhcmFtIHtTdHJpbmd9IHRvcGljIC0gRXZlbnQgbmFtZVxuXHQgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIE9wdGlvbmFsIHBhcmFtcyB0byBwYXNzIHdpdGggdGhlIGV2ZW50XG5cdCAqL1xuXHRwdWJsaXNoKCkge1xuXHRcdHRoaXMuX19tZWRpYXRvci5wdWJsaXNoKC4uLmFyZ3VtZW50cyk7XG5cdH1cblxuXG5cdC8qKlxuXHQgKiBTdWJzY3JpYmUgdG8gYW4gZXZlbnQgZnJvbSBhbm90aGVyIGNvbXBvbmVudFxuXHQgKiBAcHJvdGVjdGVkXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB0b3BpYyAtIEV2ZW50IG5hbWVcblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSBGdW5jdGlvbiB0byBiaW5kXG5cdCAqL1xuXHRzdWJzY3JpYmUodG9waWMsIGNhbGxiYWNrKSB7XG5cdFx0dGhpcy5fX21lZGlhdG9yLnN1YnNjcmliZSh0b3BpYywgY2FsbGJhY2ssIHRoaXMpO1xuXHR9XG5cblxuXHQvKipcblx0ICogVW5zdWJzY3JpYmUgZnJvbSBhbiBldmVudCBmcm9tIGFub3RoZXIgY29tcG9uZW50XG5cdCAqIEBwcm90ZWN0ZWRcblx0ICogQHBhcmFtIHtTdHJpbmd9IHRvcGljIC0gRXZlbnQgbmFtZVxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIEZ1bmN0aW9uIHRvIHVuYmluZFxuXHQgKi9cblx0dW5zdWJzY3JpYmUodG9waWMsIGNhbGxiYWNrKSB7XG5cdFx0dGhpcy5fX21lZGlhdG9yLnVuc3Vic2NyaWJlKHRvcGljLCBjYWxsYmFjaywgdGhpcyk7XG5cdH1cblxuXG5cdC8qKlxuXHQgKiBVdGlsaXR5IG1ldGhvZCBmb3IgdHJpZ2dlcmluZyB0aGUgQ29tcG9uZW50TG9hZGVyIHRvIHNjYW4gdGhlIG1hcmt1cCBmb3IgbmV3IGNvbXBvbmVudHNcblx0ICogQHByb3RlY3RlZFxuXHQgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIE9wdGlvbmFsIGRhdGEgdG8gcGFzcyB0byB0aGUgY29uc3RydWN0b3Igb2YgYW55IENvbXBvbmVudCBpbml0aWFsaXplZCBieSB0aGlzIHNjYW5cblx0ICovXG5cdHNjYW4oZGF0YSkge1xuXHRcdHRoaXMuX19tZWRpYXRvci5zY2FuKGRhdGEpO1xuXHR9XG5cblxuXHQvKipcblx0ICogVXRpbGl0eSBtZXRob2QgZm9yIGRlZmVyaW5nIGEgZnVuY3Rpb24gY2FsbFxuXHQgKiBAcHJvdGVjdGVkXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0gRnVuY3Rpb24gdG8gY2FsbFxuXHQgKiBAcGFyYW0ge051bWJlcn0gbXMgLSBPcHRpb25hbCBtcyB0byBkZWxheSwgZGVmYXVsdHMgdG8gMTdtcyAoanVzdCBvdmVyIDEgZnJhbWUgYXQgNjBmcHMpXG5cdCAqL1xuXHRkZWZlcihjYWxsYmFjaywgbXMgPSAxNykge1xuXHRcdHNldFRpbWVvdXQoY2FsbGJhY2ssIG1zKTtcblx0fVxuXG5cblx0LyoqXG5cdCAqIENhbGxlZCBieSBDb21wb25lbnRMb2FkZXIgd2hlbiBjb21wb25lbnQgaXMgbm8gbG9uZ2VyIGZvdW5kIGluIHRoZSBtYXJrdXBcblx0ICogdXN1YWxseSBoYXBwZW5zIGFzIGEgcmVzdWx0IG9mIHJlcGxhY2luZyB0aGUgbWFya3VwIHVzaW5nIEFKQVhcblx0ICpcdFxuXHQgKiBPdmVycmlkZSBpbiBzdWJjbGFzcyBhbmQgbWFrZSBzdXJlIHRvIGNsZWFuIHVwIGV2ZW50IGhhbmRsZXJzIGV0Y1xuXHQgKlxuXHQgKiBAcHJvdGVjdGVkXG5cdCAqL1xuXHRkZXN0cm95KCkge1xuXG5cdH1cbn1cblxuXG4vLyBFeHBvcnQgQU1ELCBDb21tb25KUy9FUzYgbW9kdWxlIG9yIGFzc3VtZSBnbG9iYWwgbmFtZXNwYWNlXG5pZiAodHlwZW9mIGRlZmluZSAhPT0gJ3VuZGVmaW5lZCcgJiYgZGVmaW5lLmFtZCkge1xuXHRkZWZpbmUoW10sIENvbXBvbmVudCk7XG59XG5lbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuXHRtb2R1bGUuZXhwb3J0cyA9IENvbXBvbmVudDtcbn1cbmVsc2Uge1xuXHR3aW5kb3cuQ29tcG9uZW50ID0gQ29tcG9uZW50O1xufSIsImltcG9ydCBDb21wb25lbnQgZnJvbSAnY29tcG9uZW50LWxvYWRlci1qcy9kaXN0L2VzNi9jb21wb25lbnQnXG5cbmNsYXNzIERva2kgZXh0ZW5kcyBDb21wb25lbnQge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlciguLi5hcmd1bWVudHMpO1xuXHRcdGNvbnNvbGUubG9nKCduZXcgRE9LSSAzNicpO1xuXHR9XG5cblx0ZGVzdHJveSgpIHtcblx0XHRzdXBlci5kZXN0cm95KCk7XG5cdFx0Y29uc29sZS5sb2coJ2Rlc3Ryb3kgRE9LSScpO1xuXHR9XG59XG5cbmV4cG9ydCBkZWZhdWx0IERva2k7IiwiaW1wb3J0IENvbXBvbmVudExvYWRlciBmcm9tICdjb21wb25lbnQtbG9hZGVyLWpzL2Rpc3QvZXM1L2NvbXBvbmVudC1sb2FkZXIuanMnO1xuXG5pbXBvcnQgRG9raSBmcm9tICcuL2Rva2knO1xuXG5cbihuZXcgQ29tcG9uZW50TG9hZGVyKHtEb2tpfSkpLnNjYW4oKTsiXX0=
