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
(function( factory ) {
	if (typeof define !== 'undefined' && define.amd) {
		define([], factory);
	} else if (typeof module !== 'undefined' && module.exports) {
		module.exports = factory();
	} else {
		window.scrollMonitor = factory();
	}
})(function() {

	var scrollTop = function() {
		return window.pageYOffset ||
			(document.documentElement && document.documentElement.scrollTop) ||
			document.body.scrollTop;
	};

	var exports = {};

	var watchers = [];

	var VISIBILITYCHANGE = 'visibilityChange';
	var ENTERVIEWPORT = 'enterViewport';
	var FULLYENTERVIEWPORT = 'fullyEnterViewport';
	var EXITVIEWPORT = 'exitViewport';
	var PARTIALLYEXITVIEWPORT = 'partiallyExitViewport';
	var LOCATIONCHANGE = 'locationChange';
	var STATECHANGE = 'stateChange';

	var eventTypes = [
		VISIBILITYCHANGE,
		ENTERVIEWPORT,
		FULLYENTERVIEWPORT,
		EXITVIEWPORT,
		PARTIALLYEXITVIEWPORT,
		LOCATIONCHANGE,
		STATECHANGE
	];

	var defaultOffsets = {top: 0, bottom: 0};

	var getViewportHeight = function() {
		return window.innerHeight || document.documentElement.clientHeight;
	};

	var getDocumentHeight = function() {
		// jQuery approach
		// whichever is greatest
		return Math.max(
			document.body.scrollHeight, document.documentElement.scrollHeight,
			document.body.offsetHeight, document.documentElement.offsetHeight,
			document.documentElement.clientHeight
		);
	};

	exports.viewportTop = null;
	exports.viewportBottom = null;
	exports.documentHeight = null;
	exports.viewportHeight = getViewportHeight();

	var previousDocumentHeight;
	var latestEvent;

	var calculateViewportI;
	function calculateViewport() {
		exports.viewportTop = scrollTop();
		exports.viewportBottom = exports.viewportTop + exports.viewportHeight;
		exports.documentHeight = getDocumentHeight();
		if (exports.documentHeight !== previousDocumentHeight) {
			calculateViewportI = watchers.length;
			while( calculateViewportI-- ) {
				watchers[calculateViewportI].recalculateLocation();
			}
			previousDocumentHeight = exports.documentHeight;
		}
	}

	function recalculateWatchLocationsAndTrigger() {
		exports.viewportHeight = getViewportHeight();
		calculateViewport();
		updateAndTriggerWatchers();
	}

	var recalculateAndTriggerTimer;
	function debouncedRecalcuateAndTrigger() {
		clearTimeout(recalculateAndTriggerTimer);
		recalculateAndTriggerTimer = setTimeout( recalculateWatchLocationsAndTrigger, 100 );
	}

	var updateAndTriggerWatchersI;
	function updateAndTriggerWatchers() {
		// update all watchers then trigger the events so one can rely on another being up to date.
		updateAndTriggerWatchersI = watchers.length;
		while( updateAndTriggerWatchersI-- ) {
			watchers[updateAndTriggerWatchersI].update();
		}

		updateAndTriggerWatchersI = watchers.length;
		while( updateAndTriggerWatchersI-- ) {
			watchers[updateAndTriggerWatchersI].triggerCallbacks();
		}

	}

	function ElementWatcher( watchItem, offsets ) {
		var self = this;

		this.watchItem = watchItem;

		if (!offsets) {
			this.offsets = defaultOffsets;
		} else if (offsets === +offsets) {
			this.offsets = {top: offsets, bottom: offsets};
		} else {
			this.offsets = {
				top: offsets.top || defaultOffsets.top,
				bottom: offsets.bottom || defaultOffsets.bottom
			};
		}

		this.callbacks = {}; // {callback: function, isOne: true }

		for (var i = 0, j = eventTypes.length; i < j; i++) {
			self.callbacks[eventTypes[i]] = [];
		}

		this.locked = false;

		var wasInViewport;
		var wasFullyInViewport;
		var wasAboveViewport;
		var wasBelowViewport;

		var listenerToTriggerListI;
		var listener;
		function triggerCallbackArray( listeners ) {
			if (listeners.length === 0) {
				return;
			}
			listenerToTriggerListI = listeners.length;
			while( listenerToTriggerListI-- ) {
				listener = listeners[listenerToTriggerListI];
				listener.callback.call( self, latestEvent );
				if (listener.isOne) {
					listeners.splice(listenerToTriggerListI, 1);
				}
			}
		}
		this.triggerCallbacks = function triggerCallbacks() {

			if (this.isInViewport && !wasInViewport) {
				triggerCallbackArray( this.callbacks[ENTERVIEWPORT] );
			}
			if (this.isFullyInViewport && !wasFullyInViewport) {
				triggerCallbackArray( this.callbacks[FULLYENTERVIEWPORT] );
			}


			if (this.isAboveViewport !== wasAboveViewport &&
				this.isBelowViewport !== wasBelowViewport) {

				triggerCallbackArray( this.callbacks[VISIBILITYCHANGE] );

				// if you skip completely past this element
				if (!wasFullyInViewport && !this.isFullyInViewport) {
					triggerCallbackArray( this.callbacks[FULLYENTERVIEWPORT] );
					triggerCallbackArray( this.callbacks[PARTIALLYEXITVIEWPORT] );
				}
				if (!wasInViewport && !this.isInViewport) {
					triggerCallbackArray( this.callbacks[ENTERVIEWPORT] );
					triggerCallbackArray( this.callbacks[EXITVIEWPORT] );
				}
			}

			if (!this.isFullyInViewport && wasFullyInViewport) {
				triggerCallbackArray( this.callbacks[PARTIALLYEXITVIEWPORT] );
			}
			if (!this.isInViewport && wasInViewport) {
				triggerCallbackArray( this.callbacks[EXITVIEWPORT] );
			}
			if (this.isInViewport !== wasInViewport) {
				triggerCallbackArray( this.callbacks[VISIBILITYCHANGE] );
			}
			switch( true ) {
				case wasInViewport !== this.isInViewport:
				case wasFullyInViewport !== this.isFullyInViewport:
				case wasAboveViewport !== this.isAboveViewport:
				case wasBelowViewport !== this.isBelowViewport:
					triggerCallbackArray( this.callbacks[STATECHANGE] );
			}

			wasInViewport = this.isInViewport;
			wasFullyInViewport = this.isFullyInViewport;
			wasAboveViewport = this.isAboveViewport;
			wasBelowViewport = this.isBelowViewport;

		};

		this.recalculateLocation = function() {
			if (this.locked) {
				return;
			}
			var previousTop = this.top;
			var previousBottom = this.bottom;
			if (this.watchItem.nodeName) { // a dom element
				var cachedDisplay = this.watchItem.style.display;
				if (cachedDisplay === 'none') {
					this.watchItem.style.display = '';
				}

				var boundingRect = this.watchItem.getBoundingClientRect();
				this.top = boundingRect.top + exports.viewportTop;
				this.bottom = boundingRect.bottom + exports.viewportTop;

				if (cachedDisplay === 'none') {
					this.watchItem.style.display = cachedDisplay;
				}

			} else if (this.watchItem === +this.watchItem) { // number
				if (this.watchItem > 0) {
					this.top = this.bottom = this.watchItem;
				} else {
					this.top = this.bottom = exports.documentHeight - this.watchItem;
				}

			} else { // an object with a top and bottom property
				this.top = this.watchItem.top;
				this.bottom = this.watchItem.bottom;
			}

			this.top -= this.offsets.top;
			this.bottom += this.offsets.bottom;
			this.height = this.bottom - this.top;

			if ( (previousTop !== undefined || previousBottom !== undefined) && (this.top !== previousTop || this.bottom !== previousBottom) ) {
				triggerCallbackArray( this.callbacks[LOCATIONCHANGE] );
			}
		};

		this.recalculateLocation();
		this.update();

		wasInViewport = this.isInViewport;
		wasFullyInViewport = this.isFullyInViewport;
		wasAboveViewport = this.isAboveViewport;
		wasBelowViewport = this.isBelowViewport;
	}

	ElementWatcher.prototype = {
		on: function( event, callback, isOne ) {

			// trigger the event if it applies to the element right now.
			switch( true ) {
				case event === VISIBILITYCHANGE && !this.isInViewport && this.isAboveViewport:
				case event === ENTERVIEWPORT && this.isInViewport:
				case event === FULLYENTERVIEWPORT && this.isFullyInViewport:
				case event === EXITVIEWPORT && this.isAboveViewport && !this.isInViewport:
				case event === PARTIALLYEXITVIEWPORT && this.isAboveViewport:
					callback.call( this, latestEvent );
					if (isOne) {
						return;
					}
			}

			if (this.callbacks[event]) {
				this.callbacks[event].push({callback: callback, isOne: isOne||false});
			} else {
				throw new Error('Tried to add a scroll monitor listener of type '+event+'. Your options are: '+eventTypes.join(', '));
			}
		},
		off: function( event, callback ) {
			if (this.callbacks[event]) {
				for (var i = 0, item; item = this.callbacks[event][i]; i++) {
					if (item.callback === callback) {
						this.callbacks[event].splice(i, 1);
						break;
					}
				}
			} else {
				throw new Error('Tried to remove a scroll monitor listener of type '+event+'. Your options are: '+eventTypes.join(', '));
			}
		},
		one: function( event, callback ) {
			this.on( event, callback, true);
		},
		recalculateSize: function() {
			this.height = this.watchItem.offsetHeight + this.offsets.top + this.offsets.bottom;
			this.bottom = this.top + this.height;
		},
		update: function() {
			this.isAboveViewport = this.top < exports.viewportTop;
			this.isBelowViewport = this.bottom > exports.viewportBottom;

			this.isInViewport = (this.top <= exports.viewportBottom && this.bottom >= exports.viewportTop);
			this.isFullyInViewport = (this.top >= exports.viewportTop && this.bottom <= exports.viewportBottom) ||
								 (this.isAboveViewport && this.isBelowViewport);

		},
		destroy: function() {
			var index = watchers.indexOf(this),
				self  = this;
			watchers.splice(index, 1);
			for (var i = 0, j = eventTypes.length; i < j; i++) {
				self.callbacks[eventTypes[i]].length = 0;
			}
		},
		// prevent recalculating the element location
		lock: function() {
			this.locked = true;
		},
		unlock: function() {
			this.locked = false;
		}
	};

	var eventHandlerFactory = function (type) {
		return function( callback, isOne ) {
			this.on.call(this, type, callback, isOne);
		};
	};

	for (var i = 0, j = eventTypes.length; i < j; i++) {
		var type =  eventTypes[i];
		ElementWatcher.prototype[type] = eventHandlerFactory(type);
	}

	try {
		calculateViewport();
	} catch (e) {
		try {
			window.$(calculateViewport);
		} catch (e) {
			throw new Error('If you must put scrollMonitor in the <head>, you must use jQuery.');
		}
	}

	function scrollMonitorListener(event) {
		latestEvent = event;
		calculateViewport();
		updateAndTriggerWatchers();
	}

	if (window.addEventListener) {
		window.addEventListener('scroll', scrollMonitorListener);
		window.addEventListener('resize', debouncedRecalcuateAndTrigger);
	} else {
		// Old IE support
		window.attachEvent('onscroll', scrollMonitorListener);
		window.attachEvent('onresize', debouncedRecalcuateAndTrigger);
	}

	exports.beget = exports.create = function( element, offsets ) {
		if (typeof element === 'string') {
			element = document.querySelector(element);
		} else if (element && element.length > 0) {
			element = element[0];
		}

		var watcher = new ElementWatcher( element, offsets );
		watchers.push(watcher);
		watcher.update();
		return watcher;
	};

	exports.update = function() {
		latestEvent = null;
		calculateViewport();
		updateAndTriggerWatchers();
	};
	exports.recalculateLocations = function() {
		exports.documentHeight = 0;
		exports.update();
	};

	return exports;
});

},{}],4:[function(require,module,exports){
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

		console.log('new DOKI 40');
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

},{"component-loader-js/dist/es5/component":2}],5:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _component = require('component-loader-js/dist/es5/component');

var _component2 = _interopRequireDefault(_component);

var _animationEndEvent = require('../utils/animation-end-event');

var _animationEndEvent2 = _interopRequireDefault(_animationEndEvent);

var _scrollState = require('../utils/scroll-state');

var _scrollState2 = _interopRequireDefault(_scrollState);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
	Sticky Nav component

	Listens to scroll events from utils.ScrollState

	- Adds CLASS_LOCKED when passing LOCK_THRESHOLD
	- Adds CLASS_BACKGROUND when passing _getBackgroundThreshold()
	- Adds CLASS_HIDDEN if visible and scrolling down with enough speed
	- Adds CLASS_VISIBLE if scrolling up and hidden
*/

var CLASS_HIDDEN = 'StickyNav--hidden';
var CLASS_VISIBLE = 'StickyNav--visible';
var CLASS_LOCKED = 'StickyNav--locked';
var CLASS_BACKGROUND = 'StickyNav--background';

// px from top of document where 'locked' class is added (inclusive)
var LOCK_THRESHOLD = 0;
var BG_THRESHOLD = 100;
var HIDE_THRESHOLD = 500;

// Speed/Distance required to change appearance per scroll frame
var MIN_SCROLL_SPEED = 500;
// const MIN_SCROLL_DISTANCE = 20;

var StickyNav = function (_Component) {
	_inherits(StickyNav, _Component);

	function StickyNav() {
		_classCallCheck(this, StickyNav);

		var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(StickyNav).apply(this, arguments));

		_this.$document = $(document);
		_this.isHidden = false;
		_this.isLocked = false;
		_this.hasBackground = false;
		_this.isBusyChecking = false;

		_this.onStateChanged = _this.onStateChanged.bind(_this);
		_this.checkLockThreashold = _this.checkLockThreashold.bind(_this);
		_this.checkAppearance = _this.checkAppearance.bind(_this);

		_this.init();

		_this.defer(function () {
			// pause and wait for Hero component to be initialized first
			_this.$el.css('visibility', 'visible');
		});
		return _this;
	}

	_createClass(StickyNav, [{
		key: 'init',
		value: function init() {
			_scrollState2.default.subscribe(_scrollState.EVENT_SCROLL_FRAME, this.onStateChanged);
			// this.subscribe(Enums.ACTION_STICKY_NAV_SHOW_BACKGROUND, this.addBackground);
			// this.subscribe(Enums.ACTION_STICKY_NAV_HIDE_BACKGROUND, this.removeBackground);
			// this.mobileBreakpoint = Breakpoints.on({
			// 	name: "BREAKPOINT_SMALL"
			// });
		}
	}, {
		key: 'onStateChanged',
		value: function onStateChanged(state) {
			if (!this.isBusyChecking) {
				this.isBusyChecking = true;
				this.checkLockThreashold(state);
				this.checkBackgroundThreashold(state);
				this.checkAppearance(state);
				this.isBusyChecking = false;
			}
		}
	}, {
		key: '_getBackgroundThreshold',
		value: function _getBackgroundThreshold() {
			// if (this.mobileBreakpoint.isMatched) {
			// 	return 1; //switch bg as soon as we start scrolling (scroll=0 needs transparency on map)
			// }
			return BG_THRESHOLD + 1; // wait until passing threashold
		}
	}, {
		key: 'show',
		value: function show() {
			var _this2 = this;

			if (this.isHidden) {
				this.$el.addClass(CLASS_VISIBLE).removeClass(CLASS_HIDDEN);
				this.isHidden = false;
				this.$el.one(_animationEndEvent2.default, function () {
					_this2.$el.removeClass(CLASS_VISIBLE);
				});
			}
		}
	}, {
		key: 'hide',
		value: function hide() {
			if (!this.isHidden) {
				console.log('hide!');
				this.$el.addClass(CLASS_HIDDEN).removeClass(CLASS_VISIBLE);
				this.isHidden = true;
			}
		}
	}, {
		key: 'lock',
		value: function lock() {
			if (!this.isLocked) {
				this.$el.addClass(CLASS_LOCKED);
				this.isLocked = true;
			}
		}
	}, {
		key: 'unlock',
		value: function unlock() {
			if (this.isLocked) {
				this.$el.removeClass(CLASS_LOCKED);
				this.isLocked = false;
			}
		}
	}, {
		key: 'addBackground',
		value: function addBackground() {
			if (!this.hasBackground) {
				this.$el.addClass(CLASS_BACKGROUND);
				this.hasBackground = true;
			}
		}
	}, {
		key: 'removeBackground',
		value: function removeBackground() {
			if (this.hasBackground) {
				this.$el.removeClass(CLASS_BACKGROUND);
				this.hasBackground = false;
			}
		}
	}, {
		key: 'isAboveVisibleThreshold',
		value: function isAboveVisibleThreshold(state) {
			return state.viewportTop <= HIDE_THRESHOLD;
		}
	}, {
		key: 'checkLockThreashold',
		value: function checkLockThreashold(state) {
			if (state.viewportTop >= LOCK_THRESHOLD) {
				this.lock();
			} else {
				this.unlock();
			}
		}
	}, {
		key: 'checkBackgroundThreashold',
		value: function checkBackgroundThreashold(state) {
			if (state.viewportTop >= this._getBackgroundThreshold()) {
				this.addBackground();
			} else {
				this.removeBackground();
			}
		}
	}, {
		key: 'checkAppearance',
		value: function checkAppearance(state) {
			// scrolled to the very top or bottom; element slides in
			if (this.isAboveVisibleThreshold(state) || state.isScrolledToBottom) {
				this.show();
			} else if (state.isScrollingDown) {
				this.hide();
			}
			// else if scrolling up with enough speed
			else if (state.scrollSpeed > MIN_SCROLL_SPEED) {
					this.show();
				}
		}
	}, {
		key: 'destroy',
		value: function destroy() {
			this.show();
			_scrollState2.default.unsubscribe(_scrollState.EVENT_SCROLL_FRAME, this.onStateChanged);
			// this.unsubscribe(Enums.ACTION_STICKY_NAV_SHOW_BACKGROUND, this.addBackground);
			// this.unsubscribe(Enums.ACTION_STICKY_NAV_HIDE_BACKGROUND, this.removeBackground);
		}
	}]);

	return StickyNav;
}(_component2.default);

module.exports = StickyNav;

},{"../utils/animation-end-event":7,"../utils/scroll-state":9,"component-loader-js/dist/es5/component":2}],6:[function(require,module,exports){
'use strict';

var _componentLoader = require('component-loader-js/dist/es5/component-loader');

var _componentLoader2 = _interopRequireDefault(_componentLoader);

var _doki = require('./components/doki');

var _doki2 = _interopRequireDefault(_doki);

var _stickyNav = require('./components/sticky-nav');

var _stickyNav2 = _interopRequireDefault(_stickyNav);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

new _componentLoader2.default({
	Doki: _doki2.default,
	StickyNav: _stickyNav2.default
}).scan(); // import 'babel-polyfill';

},{"./components/doki":4,"./components/sticky-nav":5,"component-loader-js/dist/es5/component-loader":1}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
/*
	Returns the browser prefixed
	string for the animation end event
*/

exports.default = function () {
	var t = undefined;
	var eventName = undefined;
	var el = document.createElement('div');
	var animationNames = {
		'WebkitAnimation': 'webkitAnimationEnd',
		'MozAnimation': 'animationend',
		'OAnimation': 'oAnimationEnd oanimationend',
		'animation': 'animationend'
	};
	Object.keys(animationNames).forEach(function (t) {
		if (el.style[t] !== undefined) {
			eventName = animationNames[t];
		}
	});
	return eventName;
}();

},{}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
var _arguments = arguments;

exports.default = function (func, threshold, execAsap) {
	var timeout = undefined;

	return function () {
		var obj = undefined,
		    args = _arguments;

		var delayed = function delayed() {
			if (!execAsap) {
				func.apply(obj, args);
			}
			timeout = null;
		};

		if (timeout) {
			clearTimeout(timeout);
		} else if (execAsap) {
			func.apply(obj, args);
		}

		timeout = setTimeout(delayed, threshold || 100);
	};
};

},{}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.EVENT_SCROLL_FRAME = exports.EVENT_SCROLL_STOP = exports.EVENT_SCROLL_START = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _debounce = require('./debounce');

var _debounce2 = _interopRequireDefault(_debounce);

var _scrollMonitor = require('scrollMonitor');

var _scrollMonitor2 = _interopRequireDefault(_scrollMonitor);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Scroll State Abstraction
 *
 * Holds info about scroll position, speed, direction, document / viewport size, etc
 *
 * Triggers events for
 *   - Scroll Start
 *   - Scroll Stop
 *   - Each scroll frame while scrolling
 */
var $document = $(document);
var $window = $(window);

var EVENT_SCROLL_START = exports.EVENT_SCROLL_START = 'scrollstate:start';
var EVENT_SCROLL_STOP = exports.EVENT_SCROLL_STOP = 'scrollstate:stop';
var EVENT_SCROLL_FRAME = exports.EVENT_SCROLL_FRAME = 'scrollstate:frame';

var ScrollState = function () {
	function ScrollState() {
		_classCallCheck(this, ScrollState);

		this.updating = false;
		this.latestFrame = Date.now();

		this.scrollDiff = 0; // delta from last scroll position
		this.scrollDistance = 0; // absolute delta
		this.scrollDirection = 0; // -1, 0, or 1
		this.msSinceLatestChange = 0;
		this.scrollSpeed = 0; // pixels / second for latest frame
		this.documentHeight = undefined;
		this.viewportHeight = undefined;
		this.viewportTop = 0;
		this.viewportBottom = undefined;
		this.isScrollingUp = undefined;
		this.isScrollingDown = undefined;
		this.isScrolledToTop = undefined;
		this.isScrolledToBottom = undefined;

		this.callbacks = {};

		this.updateState();
		this.onScrollStartDebounced = (0, _debounce2.default)(this._onScrollStart.bind(this), 500, true);
		this.onScrollStopDebounced = (0, _debounce2.default)(this._onScrollStop.bind(this), 500);

		this._addEventListeners();
	}

	/**
  * Mediator functionality.
  * Stores the event and callback given by the component.
  * for further reference.
  * @param  {String} event      event string
  * @param  {Function} callback Callback function that would be triggered.
  */


	_createClass(ScrollState, [{
		key: 'subscribe',
		value: function subscribe(event, callback, context) {

			// Is this a new event?
			if (!this.callbacks.hasOwnProperty(event)) {
				this.callbacks[event] = [];
			}

			// Store the subscriber callback
			this.callbacks[event].push({ context: context, callback: callback });
		}

		/**
   * Mediator functionality.
   * Removes the stored event and callback given by the component.
   * @param  {String}   event    event string
   * @param  {Function} callback Callback function that would be triggered.
   * @return {Boolean}            True on success, False otherwise.
   */

	}, {
		key: 'unsubscribe',
		value: function unsubscribe(event, callback) {
			// Do we have this event?
			if (!this.callbacks.hasOwnProperty(event)) {
				return false;
			}

			// Find out where this is and remove it
			for (var i = 0, len = this.callbacks[event].length; i < len; i++) {
				if (this.callbacks[event][i].callback === callback) {
					this.callbacks[event].splice(i, 1);
					return true;
				}
			}

			return false;
		}

		/**
   * [publish description]
   * @param  {[type]} event [description]
   * @return {[type]}       [description]
   */

	}, {
		key: '_publish',
		value: function _publish(event) {
			// Check if we have subcribers to this event
			if (!this.callbacks.hasOwnProperty(event)) {
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
			for (var _i = 0, len = this.callbacks[event].length; _i < len; _i++) {
				var subscription = this.callbacks[event][_i];
				// Call it's callback
				if (subscription.callback) {
					subscription.callback.apply(subscription.context, args);
				}
			}

			return true;
		}
	}, {
		key: 'destroy',
		value: function destroy() {
			this._removeEventListeners();
		}
	}, {
		key: '_addEventListeners',
		value: function _addEventListeners() {
			$window.on('scroll', this.onScrollStartDebounced);
			$window.on('scroll', this.onScrollStopDebounced);
			$window.on('scroll', this.updateState.bind(this));
		}
	}, {
		key: '_removeEventListeners',
		value: function _removeEventListeners() {
			$window.off('scroll', this.onScrollStartDebounced);
			$window.off('scroll', this.onScrollStopDebounced);
			$window.off('scroll', this.updateState.unbind(this));
		}
	}, {
		key: '_onScrollStart',
		value: function _onScrollStart() {
			this._publish(EVENT_SCROLL_START, this);
		}
	}, {
		key: '_onScrollStop',
		value: function _onScrollStop() {
			this._publish(EVENT_SCROLL_STOP, this);
		}
	}, {
		key: 'updateState',
		value: function updateState() {
			if (this.updating) return;
			this.updating = true;

			var now = Date.now();

			// distance and speed calcs
			this.scrollDiff = this.viewportTop - _scrollMonitor2.default.viewportTop;
			this.scrollDistance = Math.abs(this.scrollDiff);
			this.scrollDirection = Math.max(-1, Math.min(1, this.scrollDiff));
			this.msSinceLatestChange = now - this.latestFrame;
			this.scrollSpeed = this.scrollDistance / this.msSinceLatestChange * 1000;

			// viewport
			this.documentHeight = _scrollMonitor2.default.documentHeight;
			this.viewportHeight = _scrollMonitor2.default.viewportHeight;
			this.viewportTop = _scrollMonitor2.default.viewportTop;
			this.viewportBottom = _scrollMonitor2.default.viewportBottom;

			// helpers
			this.isScrollingUp = this.scrollDirection > 0;
			this.isScrollingDown = this.scrollDirection < 0;
			this.isScrolledToTop = this.viewportTop <= 0;
			this.isScrolledToBottom = this.viewportBottom >= this.documentHeight;

			this.latestFrame = now;

			this._publish(EVENT_SCROLL_FRAME, this);

			this.updating = false;
		}
	}]);

	return ScrollState;
}();

exports.default = new ScrollState();

},{"./debounce":8,"scrollMonitor":3}]},{},[6])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvY29tcG9uZW50LWxvYWRlci1qcy9kaXN0L2VzNS9jb21wb25lbnQtbG9hZGVyLmpzIiwibm9kZV9tb2R1bGVzL2NvbXBvbmVudC1sb2FkZXItanMvZGlzdC9lczUvY29tcG9uZW50LmpzIiwibm9kZV9tb2R1bGVzL3Njcm9sbE1vbml0b3Ivc2Nyb2xsTW9uaXRvci5qcyIsInRoZW1lL2pzL2NvbXBvbmVudHMvZG9raS5qcyIsInRoZW1lL2pzL2NvbXBvbmVudHMvc3RpY2t5LW5hdi5qcyIsInRoZW1lL2pzL21haW4uanMiLCJ0aGVtZS9qcy91dGlscy9hbmltYXRpb24tZW5kLWV2ZW50LmpzIiwidGhlbWUvanMvdXRpbHMvZGVib3VuY2UuanMiLCJ0aGVtZS9qcy91dGlscy9zY3JvbGwtc3RhdGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lDclhNOzs7QUFDTCxVQURLLElBQ0wsR0FBYzt3QkFEVCxNQUNTOztxRUFEVCxrQkFFSyxZQURJOztBQUViLFVBQVEsR0FBUixDQUFZLGFBQVosRUFGYTs7RUFBZDs7Y0FESzs7NEJBTUs7QUFDVCw4QkFQSSw0Q0FPSixDQURTO0FBRVQsV0FBUSxHQUFSLENBQVksY0FBWixFQUZTOzs7O1FBTkw7OztrQkFZUzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNFZixJQUFNLGVBQWUsbUJBQWY7QUFDTixJQUFNLGdCQUFnQixvQkFBaEI7QUFDTixJQUFNLGVBQWUsbUJBQWY7QUFDTixJQUFNLG1CQUFtQix1QkFBbkI7OztBQUdOLElBQU0saUJBQWlCLENBQWpCO0FBQ04sSUFBTSxlQUFlLEdBQWY7QUFDTixJQUFNLGlCQUFpQixHQUFqQjs7O0FBR04sSUFBTSxtQkFBbUIsR0FBbkI7OztJQUlBOzs7QUFFTCxVQUZLLFNBRUwsR0FBYzt3QkFGVCxXQUVTOztxRUFGVCx1QkFHSyxZQURJOztBQUViLFFBQUssU0FBTCxHQUFpQixFQUFFLFFBQUYsQ0FBakIsQ0FGYTtBQUdiLFFBQUssUUFBTCxHQUFnQixLQUFoQixDQUhhO0FBSWIsUUFBSyxRQUFMLEdBQWdCLEtBQWhCLENBSmE7QUFLYixRQUFLLGFBQUwsR0FBcUIsS0FBckIsQ0FMYTtBQU1iLFFBQUssY0FBTCxHQUFzQixLQUF0QixDQU5hOztBQVFiLFFBQUssY0FBTCxHQUFzQixNQUFLLGNBQUwsQ0FBb0IsSUFBcEIsT0FBdEIsQ0FSYTtBQVNiLFFBQUssbUJBQUwsR0FBMkIsTUFBSyxtQkFBTCxDQUF5QixJQUF6QixPQUEzQixDQVRhO0FBVWIsUUFBSyxlQUFMLEdBQXVCLE1BQUssZUFBTCxDQUFxQixJQUFyQixPQUF2QixDQVZhOztBQVliLFFBQUssSUFBTCxHQVphOztBQWNiLFFBQUssS0FBTCxDQUFXLFlBQU07O0FBRWhCLFNBQUssR0FBTCxDQUFTLEdBQVQsQ0FBYSxZQUFiLEVBQTJCLFNBQTNCLEVBRmdCO0dBQU4sQ0FBWCxDQWRhOztFQUFkOztjQUZLOzt5QkF1QkU7QUFDTix5QkFBWSxTQUFaLGtDQUEwQyxLQUFLLGNBQUwsQ0FBMUM7Ozs7OztBQURNOzs7aUNBVVEsT0FBTztBQUNyQixPQUFJLENBQUMsS0FBSyxjQUFMLEVBQXFCO0FBQ3pCLFNBQUssY0FBTCxHQUFzQixJQUF0QixDQUR5QjtBQUV6QixTQUFLLG1CQUFMLENBQXlCLEtBQXpCLEVBRnlCO0FBR3pCLFNBQUsseUJBQUwsQ0FBK0IsS0FBL0IsRUFIeUI7QUFJekIsU0FBSyxlQUFMLENBQXFCLEtBQXJCLEVBSnlCO0FBS3pCLFNBQUssY0FBTCxHQUFzQixLQUF0QixDQUx5QjtJQUExQjs7Ozs0Q0FVeUI7Ozs7QUFJekIsVUFBTyxlQUFlLENBQWY7QUFKa0I7Ozt5QkFRbkI7OztBQUNOLE9BQUksS0FBSyxRQUFMLEVBQWU7QUFDbEIsU0FBSyxHQUFMLENBQVMsUUFBVCxDQUFrQixhQUFsQixFQUFpQyxXQUFqQyxDQUE2QyxZQUE3QyxFQURrQjtBQUVsQixTQUFLLFFBQUwsR0FBZ0IsS0FBaEIsQ0FGa0I7QUFHbEIsU0FBSyxHQUFMLENBQVMsR0FBVCw4QkFBZ0MsWUFBTTtBQUNyQyxZQUFLLEdBQUwsQ0FBUyxXQUFULENBQXFCLGFBQXJCLEVBRHFDO0tBQU4sQ0FBaEMsQ0FIa0I7SUFBbkI7Ozs7eUJBVU07QUFDTixPQUFJLENBQUMsS0FBSyxRQUFMLEVBQWU7QUFDbkIsWUFBUSxHQUFSLENBQVksT0FBWixFQURtQjtBQUVuQixTQUFLLEdBQUwsQ0FBUyxRQUFULENBQWtCLFlBQWxCLEVBQWdDLFdBQWhDLENBQTRDLGFBQTVDLEVBRm1CO0FBR25CLFNBQUssUUFBTCxHQUFnQixJQUFoQixDQUhtQjtJQUFwQjs7Ozt5QkFRTTtBQUNOLE9BQUksQ0FBQyxLQUFLLFFBQUwsRUFBZTtBQUNuQixTQUFLLEdBQUwsQ0FBUyxRQUFULENBQWtCLFlBQWxCLEVBRG1CO0FBRW5CLFNBQUssUUFBTCxHQUFnQixJQUFoQixDQUZtQjtJQUFwQjs7OzsyQkFPUTtBQUNSLE9BQUksS0FBSyxRQUFMLEVBQWU7QUFDbEIsU0FBSyxHQUFMLENBQVMsV0FBVCxDQUFxQixZQUFyQixFQURrQjtBQUVsQixTQUFLLFFBQUwsR0FBZ0IsS0FBaEIsQ0FGa0I7SUFBbkI7Ozs7a0NBT2U7QUFDZixPQUFJLENBQUMsS0FBSyxhQUFMLEVBQW9CO0FBQ3hCLFNBQUssR0FBTCxDQUFTLFFBQVQsQ0FBa0IsZ0JBQWxCLEVBRHdCO0FBRXhCLFNBQUssYUFBTCxHQUFxQixJQUFyQixDQUZ3QjtJQUF6Qjs7OztxQ0FPa0I7QUFDbEIsT0FBSSxLQUFLLGFBQUwsRUFBb0I7QUFDdkIsU0FBSyxHQUFMLENBQVMsV0FBVCxDQUFxQixnQkFBckIsRUFEdUI7QUFFdkIsU0FBSyxhQUFMLEdBQXFCLEtBQXJCLENBRnVCO0lBQXhCOzs7OzBDQU91QixPQUFPO0FBQzlCLFVBQU8sTUFBTSxXQUFOLElBQXFCLGNBQXJCLENBRHVCOzs7O3NDQUtYLE9BQU87QUFDMUIsT0FBSSxNQUFNLFdBQU4sSUFBcUIsY0FBckIsRUFBcUM7QUFDeEMsU0FBSyxJQUFMLEdBRHdDO0lBQXpDLE1BR0s7QUFDSixTQUFLLE1BQUwsR0FESTtJQUhMOzs7OzRDQVN5QixPQUFPO0FBQ2hDLE9BQUksTUFBTSxXQUFOLElBQXFCLEtBQUssdUJBQUwsRUFBckIsRUFBcUQ7QUFDeEQsU0FBSyxhQUFMLEdBRHdEO0lBQXpELE1BR0s7QUFDSixTQUFLLGdCQUFMLEdBREk7SUFITDs7OztrQ0FTZSxPQUFPOztBQUV0QixPQUFJLEtBQUssdUJBQUwsQ0FBNkIsS0FBN0IsS0FBdUMsTUFBTSxrQkFBTixFQUEwQjtBQUNwRSxTQUFLLElBQUwsR0FEb0U7SUFBckUsTUFHSyxJQUFJLE1BQU0sZUFBTixFQUF1QjtBQUMvQixTQUFLLElBQUwsR0FEK0I7OztBQUEzQixRQUlBLElBQUksTUFBTSxXQUFOLEdBQW9CLGdCQUFwQixFQUFzQztBQUM5QyxVQUFLLElBQUwsR0FEOEM7S0FBMUM7Ozs7NEJBTUk7QUFDVCxRQUFLLElBQUwsR0FEUztBQUVULHlCQUFZLFdBQVosa0NBQTRDLEtBQUssY0FBTCxDQUE1Qzs7O0FBRlM7OztRQWhKTDs7O0FBd0pOLE9BQU8sT0FBUCxHQUFpQixTQUFqQjs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQy9LQSw4QkFBb0I7QUFDbkIscUJBRG1CO0FBRW5CLCtCQUZtQjtDQUFwQixFQUdHLElBSEg7Ozs7Ozs7Ozs7Ozs7a0JDSmUsWUFBTztBQUNyQixLQUFJLElBQUksU0FBSixDQURpQjtBQUVyQixLQUFJLHFCQUFKLENBRnFCO0FBR3JCLEtBQU0sS0FBSyxTQUFTLGFBQVQsQ0FBdUIsS0FBdkIsQ0FBTCxDQUhlO0FBSXJCLEtBQU0saUJBQWlCO0FBQ3RCLHFCQUFtQixvQkFBbkI7QUFDQSxrQkFBZ0IsY0FBaEI7QUFDQSxnQkFBYyw2QkFBZDtBQUNBLGVBQWEsY0FBYjtFQUpLLENBSmU7QUFVckIsUUFBTyxJQUFQLENBQVksY0FBWixFQUE0QixPQUE1QixDQUFxQyxVQUFDLENBQUQsRUFBTztBQUMzQyxNQUFJLEdBQUcsS0FBSCxDQUFTLENBQVQsTUFBZ0IsU0FBaEIsRUFBMkI7QUFDOUIsZUFBWSxlQUFlLENBQWYsQ0FBWixDQUQ4QjtHQUEvQjtFQURvQyxDQUFyQyxDQVZxQjtBQWVyQixRQUFPLFNBQVAsQ0FmcUI7Q0FBTjs7Ozs7Ozs7OztrQkNKRCxVQUFDLElBQUQsRUFBTyxTQUFQLEVBQWtCLFFBQWxCLEVBQStCO0FBQzdDLEtBQUksbUJBQUosQ0FENkM7O0FBRzdDLFFBQU8sWUFBTTtBQUNaLE1BQUksZUFBSjtNQUFnQixpQkFBaEIsQ0FEWTs7QUFHWixNQUFJLFVBQVUsU0FBVixPQUFVLEdBQU07QUFDbkIsT0FBSSxDQUFDLFFBQUQsRUFBVztBQUNkLFNBQUssS0FBTCxDQUFXLEdBQVgsRUFBZ0IsSUFBaEIsRUFEYztJQUFmO0FBR0EsYUFBVSxJQUFWLENBSm1CO0dBQU4sQ0FIRjs7QUFVWixNQUFJLE9BQUosRUFBYTtBQUNaLGdCQUFhLE9BQWIsRUFEWTtHQUFiLE1BRU8sSUFBSSxRQUFKLEVBQWM7QUFDcEIsUUFBSyxLQUFMLENBQVcsR0FBWCxFQUFnQixJQUFoQixFQURvQjtHQUFkOztBQUlQLFlBQVUsV0FBVyxPQUFYLEVBQW9CLGFBQWEsR0FBYixDQUE5QixDQWhCWTtFQUFOLENBSHNDO0NBQS9COzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDYWYsSUFBTSxZQUFZLEVBQUUsUUFBRixDQUFaO0FBQ04sSUFBTSxVQUFVLEVBQUUsTUFBRixDQUFWOztBQUVDLElBQU0sa0RBQXFCLG1CQUFyQjtBQUNOLElBQU0sZ0RBQXFCLGtCQUFyQjtBQUNOLElBQU0sa0RBQXFCLG1CQUFyQjs7SUFFUDtBQUVMLFVBRkssV0FFTCxHQUFjO3dCQUZULGFBRVM7O0FBQ2IsT0FBSyxRQUFMLEdBQWlCLEtBQWpCLENBRGE7QUFFYixPQUFLLFdBQUwsR0FBbUIsS0FBSyxHQUFMLEVBQW5CLENBRmE7O0FBSWIsT0FBSyxVQUFMLEdBQTJCLENBQTNCO0FBSmEsTUFLYixDQUFLLGNBQUwsR0FBMkIsQ0FBM0I7QUFMYSxNQU1iLENBQUssZUFBTCxHQUEyQixDQUEzQjtBQU5hLE1BT2IsQ0FBSyxtQkFBTCxHQUEyQixDQUEzQixDQVBhO0FBUWIsT0FBSyxXQUFMLEdBQTJCLENBQTNCO0FBUmEsTUFTYixDQUFLLGNBQUwsR0FBMkIsU0FBM0IsQ0FUYTtBQVViLE9BQUssY0FBTCxHQUEyQixTQUEzQixDQVZhO0FBV2IsT0FBSyxXQUFMLEdBQTJCLENBQTNCLENBWGE7QUFZYixPQUFLLGNBQUwsR0FBMkIsU0FBM0IsQ0FaYTtBQWFiLE9BQUssYUFBTCxHQUEyQixTQUEzQixDQWJhO0FBY2IsT0FBSyxlQUFMLEdBQTJCLFNBQTNCLENBZGE7QUFlYixPQUFLLGVBQUwsR0FBMkIsU0FBM0IsQ0FmYTtBQWdCYixPQUFLLGtCQUFMLEdBQTJCLFNBQTNCLENBaEJhOztBQWtCYixPQUFLLFNBQUwsR0FBaUIsRUFBakIsQ0FsQmE7O0FBb0JiLE9BQUssV0FBTCxHQXBCYTtBQXFCYixPQUFLLHNCQUFMLEdBQThCLHdCQUFTLEtBQUssY0FBTCxDQUFvQixJQUFwQixDQUF5QixJQUF6QixDQUFULEVBQXlDLEdBQXpDLEVBQThDLElBQTlDLENBQTlCLENBckJhO0FBc0JiLE9BQUsscUJBQUwsR0FBNkIsd0JBQVMsS0FBSyxhQUFMLENBQW1CLElBQW5CLENBQXdCLElBQXhCLENBQVQsRUFBd0MsR0FBeEMsQ0FBN0IsQ0F0QmE7O0FBd0JiLE9BQUssa0JBQUwsR0F4QmE7RUFBZDs7Ozs7Ozs7Ozs7Y0FGSzs7NEJBb0NLLE9BQU8sVUFBVSxTQUFTOzs7QUFHbkMsT0FBSyxDQUFDLEtBQUssU0FBTCxDQUFlLGNBQWYsQ0FBOEIsS0FBOUIsQ0FBRCxFQUF3QztBQUM1QyxTQUFLLFNBQUwsQ0FBZSxLQUFmLElBQXdCLEVBQXhCLENBRDRDO0lBQTdDOzs7QUFIbUMsT0FRbkMsQ0FBSyxTQUFMLENBQWUsS0FBZixFQUFzQixJQUF0QixDQUE0QixFQUFFLFNBQVMsT0FBVCxFQUFrQixVQUFVLFFBQVYsRUFBaEQsRUFSbUM7Ozs7Ozs7Ozs7Ozs7OEJBbUJ4QixPQUFPLFVBQVU7O0FBRTVCLE9BQUksQ0FBQyxLQUFLLFNBQUwsQ0FBZSxjQUFmLENBQThCLEtBQTlCLENBQUQsRUFBdUM7QUFDMUMsV0FBTyxLQUFQLENBRDBDO0lBQTNDOzs7QUFGNEIsUUFPdkIsSUFBSSxJQUFJLENBQUosRUFBTyxNQUFNLEtBQUssU0FBTCxDQUFlLEtBQWYsRUFBc0IsTUFBdEIsRUFBOEIsSUFBSSxHQUFKLEVBQVMsR0FBN0QsRUFBa0U7QUFDakUsUUFBSSxLQUFLLFNBQUwsQ0FBZSxLQUFmLEVBQXNCLENBQXRCLEVBQXlCLFFBQXpCLEtBQXNDLFFBQXRDLEVBQWdEO0FBQ25ELFVBQUssU0FBTCxDQUFlLEtBQWYsRUFBc0IsTUFBdEIsQ0FBNkIsQ0FBN0IsRUFBZ0MsQ0FBaEMsRUFEbUQ7QUFFbkQsWUFBTyxJQUFQLENBRm1EO0tBQXBEO0lBREQ7O0FBT0EsVUFBTyxLQUFQLENBZDRCOzs7Ozs7Ozs7OzsyQkFzQnBCLE9BQU87O0FBRWYsT0FBSSxDQUFDLEtBQUssU0FBTCxDQUFlLGNBQWYsQ0FBOEIsS0FBOUIsQ0FBRCxFQUF1QztBQUMxQyxXQUFPLEtBQVAsQ0FEMEM7SUFBM0M7Ozs7O0FBRmUsT0FTVCxPQUFPLElBQUksS0FBSixDQUFVLFVBQVUsTUFBVixHQUFtQixDQUFuQixDQUFqQixDQVRTO0FBVWYsUUFBSyxJQUFJLElBQUksQ0FBSixFQUFPLElBQUksS0FBSyxNQUFMLEVBQWEsRUFBRSxDQUFGLEVBQUs7QUFDcEMsU0FBSyxDQUFMLElBQVUsVUFBVSxJQUFJLENBQUosQ0FBcEI7QUFEb0MsSUFBdEM7OztBQVZlLFFBZVYsSUFBSSxLQUFJLENBQUosRUFBTyxNQUFNLEtBQUssU0FBTCxDQUFlLEtBQWYsRUFBc0IsTUFBdEIsRUFBOEIsS0FBSSxHQUFKLEVBQVMsSUFBN0QsRUFBa0U7QUFDakUsUUFBSSxlQUFlLEtBQUssU0FBTCxDQUFlLEtBQWYsRUFBc0IsRUFBdEIsQ0FBZjs7QUFENkQsUUFHN0QsYUFBYSxRQUFiLEVBQXVCO0FBQzFCLGtCQUFhLFFBQWIsQ0FBc0IsS0FBdEIsQ0FBNEIsYUFBYSxPQUFiLEVBQXNCLElBQWxELEVBRDBCO0tBQTNCO0lBSEQ7O0FBUUEsVUFBTyxJQUFQLENBdkJlOzs7OzRCQTBCTjtBQUNULFFBQUsscUJBQUwsR0FEUzs7Ozt1Q0FJVztBQUNwQixXQUFRLEVBQVIsQ0FBVyxRQUFYLEVBQXFCLEtBQUssc0JBQUwsQ0FBckIsQ0FEb0I7QUFFcEIsV0FBUSxFQUFSLENBQVcsUUFBWCxFQUFxQixLQUFLLHFCQUFMLENBQXJCLENBRm9CO0FBR3BCLFdBQVEsRUFBUixDQUFXLFFBQVgsRUFBcUIsS0FBSyxXQUFMLENBQWlCLElBQWpCLENBQXNCLElBQXRCLENBQXJCLEVBSG9COzs7OzBDQU1HO0FBQ3ZCLFdBQVEsR0FBUixDQUFZLFFBQVosRUFBc0IsS0FBSyxzQkFBTCxDQUF0QixDQUR1QjtBQUV2QixXQUFRLEdBQVIsQ0FBWSxRQUFaLEVBQXNCLEtBQUsscUJBQUwsQ0FBdEIsQ0FGdUI7QUFHdkIsV0FBUSxHQUFSLENBQVksUUFBWixFQUFzQixLQUFLLFdBQUwsQ0FBaUIsTUFBakIsQ0FBd0IsSUFBeEIsQ0FBdEIsRUFIdUI7Ozs7bUNBTVA7QUFDaEIsUUFBSyxRQUFMLENBQWMsa0JBQWQsRUFBa0MsSUFBbEMsRUFEZ0I7Ozs7a0NBSUQ7QUFDZixRQUFLLFFBQUwsQ0FBYyxpQkFBZCxFQUFpQyxJQUFqQyxFQURlOzs7O2dDQUlGO0FBQ2IsT0FBSSxLQUFLLFFBQUwsRUFBZSxPQUFuQjtBQUNBLFFBQUssUUFBTCxHQUFnQixJQUFoQixDQUZhOztBQUliLE9BQUksTUFBTSxLQUFLLEdBQUwsRUFBTjs7O0FBSlMsT0FPYixDQUFLLFVBQUwsR0FBbUIsS0FBSyxXQUFMLEdBQW1CLHdCQUFjLFdBQWQsQ0FQekI7QUFRYixRQUFLLGNBQUwsR0FBdUIsS0FBSyxHQUFMLENBQVMsS0FBSyxVQUFMLENBQWhDLENBUmE7QUFTYixRQUFLLGVBQUwsR0FBdUIsS0FBSyxHQUFMLENBQVMsQ0FBQyxDQUFELEVBQUksS0FBSyxHQUFMLENBQVMsQ0FBVCxFQUFZLEtBQUssVUFBTCxDQUF6QixDQUF2QixDQVRhO0FBVWIsUUFBSyxtQkFBTCxHQUE0QixNQUFNLEtBQUssV0FBTCxDQVZyQjtBQVdiLFFBQUssV0FBTCxHQUFtQixLQUFLLGNBQUwsR0FBc0IsS0FBSyxtQkFBTCxHQUEyQixJQUFqRDs7O0FBWE4sT0FjYixDQUFLLGNBQUwsR0FBc0Isd0JBQWMsY0FBZCxDQWRUO0FBZWIsUUFBSyxjQUFMLEdBQXNCLHdCQUFjLGNBQWQsQ0FmVDtBQWdCYixRQUFLLFdBQUwsR0FBc0Isd0JBQWMsV0FBZCxDQWhCVDtBQWlCYixRQUFLLGNBQUwsR0FBc0Isd0JBQWMsY0FBZDs7O0FBakJULE9Bb0JiLENBQUssYUFBTCxHQUFxQixLQUFLLGVBQUwsR0FBdUIsQ0FBdkIsQ0FwQlI7QUFxQmIsUUFBSyxlQUFMLEdBQXVCLEtBQUssZUFBTCxHQUF1QixDQUF2QixDQXJCVjtBQXNCYixRQUFLLGVBQUwsR0FBdUIsS0FBSyxXQUFMLElBQW9CLENBQXBCLENBdEJWO0FBdUJiLFFBQUssa0JBQUwsR0FBMEIsS0FBSyxjQUFMLElBQXVCLEtBQUssY0FBTCxDQXZCcEM7O0FBeUJiLFFBQUssV0FBTCxHQUFtQixHQUFuQixDQXpCYTs7QUEyQmIsUUFBSyxRQUFMLENBQWMsa0JBQWQsRUFBa0MsSUFBbEMsRUEzQmE7O0FBNkJiLFFBQUssUUFBTCxHQUFnQixLQUFoQixDQTdCYTs7OztRQS9IVDs7O2tCQWdLUyxJQUFJLFdBQUoiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBDb21wb25lbnRMb2FkZXIgQ2xhc3NcbiAqXG4gKiBJbnN0YW50aWF0ZXMgSmF2YVNjcmlwdCBDbGFzc2VzIHdoZW4gdGhlaXIgbmFtZSBpcyBmb3VuZCBpbiB0aGUgRE9NIHVzaW5nIGF0dHJpYnV0ZSBkYXRhLWNvbXBvbmVudD1cIlwiXG4gKlxuICovXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIF9jcmVhdGVDbGFzcyA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KSgpO1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG52YXIgQ29tcG9uZW50TG9hZGVyID0gKGZ1bmN0aW9uICgpIHtcblxuXHQvKipcbiAgKiBDb25zdHJ1Y3RvciBmb3IgdGhlIENvbXBvbmVudExvYWRlclxuICAqIEBjbGFzc1xuICAqIEBwdWJsaWNcbiAgKiBAcGFyYW0ge09iamVjdH0gY29tcG9uZW50cyAtIE9wdGlvbmFsIGNvbGxlY3Rpb24gb2YgYXZhaWxhYmxlIGNvbXBvbmVudHM6IHtjb21wb25lbnROYW1lOiBjbGFzc0RlZmluaXRpb259XG4gICogQHBhcmFtIHtOb2RlfSBjb250ZXh0IC0gT3B0aW9uYWwgRE9NIG5vZGUgdG8gc2VhcmNoIGZvciBjb21wb25lbnRzLiBEZWZhdWx0cyB0byBkb2N1bWVudC5cbiAgKi9cblxuXHRmdW5jdGlvbiBDb21wb25lbnRMb2FkZXIoKSB7XG5cdFx0dmFyIGNvbXBvbmVudHMgPSBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IHt9IDogYXJndW1lbnRzWzBdO1xuXHRcdHZhciBjb250ZXh0ID0gYXJndW1lbnRzWzFdID09PSB1bmRlZmluZWQgPyBkb2N1bWVudCA6IGFyZ3VtZW50c1sxXTtcblxuXHRcdF9jbGFzc0NhbGxDaGVjayh0aGlzLCBDb21wb25lbnRMb2FkZXIpO1xuXG5cdFx0dGhpcy5jb250ZXh0RWwgPSBjb250ZXh0O1xuXHRcdHRoaXMuaW5pdGlhbGl6ZWRDb21wb25lbnRzID0ge307XG5cdFx0dGhpcy5udW1iZXJPZkluaXRpYWxpemVkQ29tcG9uZW50cyA9IDA7XG5cdFx0dGhpcy5jb21wb25lbnRzID0ge307XG5cdFx0dGhpcy50b3BpY3MgPSB7fTtcblx0XHR0aGlzLnJlZ2lzdGVyKGNvbXBvbmVudHMpO1xuXHR9XG5cblx0X2NyZWF0ZUNsYXNzKENvbXBvbmVudExvYWRlciwgW3tcblx0XHRrZXk6IFwicmVnaXN0ZXJcIixcblxuXHRcdC8qKlxuICAgKiBBZGQgY29tcG9uZW50KHMpIHRvIGNvbGxlY3Rpb24gb2YgYXZhaWxhYmxlIGNvbXBvbmVudHNcbiAgICogQHB1YmxpY1xuICAgKiBAcGFyYW0ge09iamVjdH0gY29tcG9uZW50cyAtIENvbGxlY3Rpb24gb2YgY29tcG9uZW50czoge2NvbXBvbmVudE5hbWU6IGNsYXNzRGVmaW5pdGlvbn1cbiAgICovXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIHJlZ2lzdGVyKCkge1xuXHRcdFx0dmFyIF90aGlzID0gdGhpcztcblxuXHRcdFx0dmFyIGNvbXBvbmVudHMgPSBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IHt9IDogYXJndW1lbnRzWzBdO1xuXG5cdFx0XHRPYmplY3Qua2V5cyhjb21wb25lbnRzKS5mb3JFYWNoKGZ1bmN0aW9uIChjb21wb25lbnROYW1lKSB7XG5cdFx0XHRcdF90aGlzLmNvbXBvbmVudHNbY29tcG9uZW50TmFtZV0gPSBjb21wb25lbnRzW2NvbXBvbmVudE5hbWVdO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiBcInVucmVnaXN0ZXJcIixcblxuXHRcdC8qKlxuICAgKiBSZW1vdmUgY29tcG9uZW50IGZyb20gY29sbGVjdGlvbiBvZiBhdmFpbGFibGUgY29tcG9uZW50c1xuICAgKiBAcHVibGljXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBjb21wb25lbnROYW1lIC0gTmFtZSBvZiB0aGUgY29tcG9uZW50IHRvIHJlbW92ZVxuICAgKi9cblx0XHR2YWx1ZTogZnVuY3Rpb24gdW5yZWdpc3Rlcihjb21wb25lbnROYW1lKSB7XG5cdFx0XHRkZWxldGUgdGhpcy5jb21wb25lbnRzW2NvbXBvbmVudE5hbWVdO1xuXHRcdH1cblx0fSwge1xuXHRcdGtleTogXCJzdWJzY3JpYmVcIixcblxuXHRcdC8qKlxuICAgKiBNZWRpYXRvciBmdW5jdGlvbmFsaXR5LlxuICAgKiBTdG9yZXMgdGhlIHRvcGljIGFuZCBjYWxsYmFjayBnaXZlbiBieSB0aGUgY29tcG9uZW50LlxuICAgKiBmb3IgZnVydGhlciByZWZlcmVuY2UuXG4gICAqIEBwYXJhbSAge1N0cmluZ30gdG9waWMgICAgICBUb3BpYyBzdHJpbmdcbiAgICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrIENhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgd291bGQgYmUgdHJpZ2dlcmVkLlxuICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY29udGV4dCAgQ2xhc3MgaW5zdGFuY2Ugd2hpY2ggb3ducyB0aGUgY2FsbGJhY2tcbiAgICovXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIHN1YnNjcmliZSh0b3BpYywgY2FsbGJhY2ssIGNvbnRleHQpIHtcblxuXHRcdFx0Ly8gSXMgdGhpcyBhIG5ldyB0b3BpYz9cblx0XHRcdGlmICghdGhpcy50b3BpY3MuaGFzT3duUHJvcGVydHkodG9waWMpKSB7XG5cdFx0XHRcdHRoaXMudG9waWNzW3RvcGljXSA9IFtdO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBTdG9yZSB0aGUgc3Vic2NyaWJlciBjYWxsYmFja1xuXHRcdFx0dGhpcy50b3BpY3NbdG9waWNdLnB1c2goeyBjb250ZXh0OiBjb250ZXh0LCBjYWxsYmFjazogY2FsbGJhY2sgfSk7XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiBcInVuc3Vic2NyaWJlXCIsXG5cblx0XHQvKipcbiAgICogTWVkaWF0b3IgZnVuY3Rpb25hbGl0eS5cbiAgICogUmVtb3ZlcyB0aGUgc3RvcmVkIHRvcGljIGFuZCBjYWxsYmFjayBnaXZlbiBieSB0aGUgY29tcG9uZW50LlxuICAgKiBAcGFyYW0gIHtTdHJpbmd9ICAgdG9waWMgICAgVG9waWMgc3RyaW5nXG4gICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjYWxsYmFjayBDYWxsYmFjayBmdW5jdGlvbiB0aGF0IHdvdWxkIGJlIHRyaWdnZXJlZC5cbiAgICogQHBhcmFtICB7RnVuY3Rpb259IGNvbnRleHQgIENsYXNzIGluc3RhbmNlIHdoaWNoIG93bnMgdGhlIGNhbGxiYWNrXG4gICAqIEByZXR1cm4ge0Jvb2xlYW59ICAgICAgICAgICBUcnVlIG9uIHN1Y2Nlc3MsIEZhbHNlIG90aGVyd2lzZS5cbiAgICovXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIHVuc3Vic2NyaWJlKHRvcGljLCBjYWxsYmFjaywgY29udGV4dCkge1xuXHRcdFx0Ly8gRG8gd2UgaGF2ZSB0aGlzIHRvcGljP1xuXHRcdFx0aWYgKCF0aGlzLnRvcGljcy5oYXNPd25Qcm9wZXJ0eSh0b3BpYykpIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBGaW5kIG91dCB3aGVyZSB0aGlzIGlzIGFuZCByZW1vdmUgaXRcblx0XHRcdGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLnRvcGljc1t0b3BpY10ubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdFx0aWYgKHRoaXMudG9waWNzW3RvcGljXVtpXS5jYWxsYmFjayA9PT0gY2FsbGJhY2spIHtcblx0XHRcdFx0XHRpZiAoIWNvbnRleHQgfHwgdGhpcy50b3BpY3NbdG9waWNdW2ldLmNvbnRleHQgPT09IGNvbnRleHQpIHtcblx0XHRcdFx0XHRcdHRoaXMudG9waWNzW3RvcGljXS5zcGxpY2UoaSwgMSk7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fSwge1xuXHRcdGtleTogXCJwdWJsaXNoXCIsXG5cblx0XHQvKipcbiAgICogW3B1Ymxpc2ggZGVzY3JpcHRpb25dXG4gICAqIEBwYXJhbSAge1t0eXBlXX0gdG9waWMgW2Rlc2NyaXB0aW9uXVxuICAgKiBAcmV0dXJuIHtbdHlwZV19ICAgICAgIFtkZXNjcmlwdGlvbl1cbiAgICovXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIHB1Ymxpc2godG9waWMpIHtcblx0XHRcdC8vIENoZWNrIGlmIHdlIGhhdmUgc3ViY3JpYmVycyB0byB0aGlzIHRvcGljXG5cdFx0XHRpZiAoIXRoaXMudG9waWNzLmhhc093blByb3BlcnR5KHRvcGljKSkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdC8vIGRvbid0IHNsaWNlIG9uIGFyZ3VtZW50cyBiZWNhdXNlIGl0IHByZXZlbnRzIG9wdGltaXphdGlvbnMgaW4gSmF2YVNjcmlwdCBlbmdpbmVzIChWOCBmb3IgZXhhbXBsZSlcblx0XHRcdC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0Z1bmN0aW9ucy9hcmd1bWVudHNcblx0XHRcdC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9wZXRrYWFudG9ub3YvYmx1ZWJpcmQvd2lraS9PcHRpbWl6YXRpb24ta2lsbGVycyMzMi1sZWFraW5nLWFyZ3VtZW50c1xuXHRcdFx0dmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgKytpKSB7XG5cdFx0XHRcdGFyZ3NbaV0gPSBhcmd1bWVudHNbaSArIDFdOyAvLyByZW1vdmUgZmlyc3QgYXJndW1lbnRcblx0XHRcdH1cblxuXHRcdFx0Ly8gTG9vcCB0aHJvdWdoIHRoZW0gYW5kIGZpcmUgdGhlIGNhbGxiYWNrc1xuXHRcdFx0Zm9yICh2YXIgX2kgPSAwLCBsZW4gPSB0aGlzLnRvcGljc1t0b3BpY10ubGVuZ3RoOyBfaSA8IGxlbjsgX2krKykge1xuXHRcdFx0XHR2YXIgc3Vic2NyaXB0aW9uID0gdGhpcy50b3BpY3NbdG9waWNdW19pXTtcblx0XHRcdFx0Ly8gQ2FsbCBpdCdzIGNhbGxiYWNrXG5cdFx0XHRcdGlmIChzdWJzY3JpcHRpb24gJiYgc3Vic2NyaXB0aW9uLmNhbGxiYWNrKSB7XG5cdFx0XHRcdFx0c3Vic2NyaXB0aW9uLmNhbGxiYWNrLmFwcGx5KHN1YnNjcmlwdGlvbi5jb250ZXh0LCBhcmdzKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6IFwic2NhblwiLFxuXG5cdFx0LyoqXG4gICAqIFNjYW4gdGhlIERPTSwgaW5pdGlhbGl6ZSBuZXcgY29tcG9uZW50cyBhbmQgZGVzdHJveSByZW1vdmVkIGNvbXBvbmVudHMuXG4gICAqIEBwdWJsaWNcbiAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBPcHRpb25hbCBkYXRhIG9iamVjdCB0byBwYXNzIHRvIHRoZSBjb21wb25lbnQgY29uc3RydWN0b3JcbiAgICovXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIHNjYW4oKSB7XG5cdFx0XHR2YXIgX3RoaXMyID0gdGhpcztcblxuXHRcdFx0dmFyIGRhdGEgPSBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IHt9IDogYXJndW1lbnRzWzBdO1xuXG5cdFx0XHR2YXIgYWN0aXZlQ29tcG9uZW50cyA9IHt9LFxuXHRcdFx0ICAgIGVsZW1lbnRzID0gdGhpcy5jb250ZXh0RWwucXVlcnlTZWxlY3RvckFsbChcIltkYXRhLWNvbXBvbmVudF1cIik7XG5cblx0XHRcdFtdLmZvckVhY2guY2FsbChlbGVtZW50cywgZnVuY3Rpb24gKGVsKSB7XG5cdFx0XHRcdF90aGlzMi5fc2NhbkVsZW1lbnQoZWwsIGFjdGl2ZUNvbXBvbmVudHMsIGRhdGEpO1xuXHRcdFx0fSk7XG5cblx0XHRcdGlmICh0aGlzLm51bWJlck9mSW5pdGlhbGl6ZWRDb21wb25lbnRzID4gMCkgdGhpcy5jbGVhblVwXyhhY3RpdmVDb21wb25lbnRzKTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6IFwiX3NjYW5FbGVtZW50XCIsXG5cblx0XHQvKipcbiAgICogRmluZCBhbGwgY29tcG9uZW50cyByZWdpc3RlcmVkIG9uIGEgc3BlY2lmaWMgRE9NIGVsZW1lbnQgYW5kIGluaXRpYWxpemUgdGhlbSBpZiBuZXdcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtFbGVtZW50fSBlbCAtIERPTSBlbGVtZW50IHRvIHNjYW4gZm9yIGNvbXBvbmVudHNcbiAgICogQHBhcmFtIHtPYmplY3R9IGFjdGl2ZUNvbXBvbmVudHMgLSBBbGwgY29tcG9uZW50SWRzIGN1cnJlbnRseSBmb3VuZCBpbiB0aGUgRE9NXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gT3B0aW9uYWwgZGF0YSBvYmplY3QgdG8gcGFzcyB0byB0aGUgY29tcG9uZW50IGNvbnN0cnVjdG9yXG4gICAqL1xuXHRcdHZhbHVlOiBmdW5jdGlvbiBfc2NhbkVsZW1lbnQoZWwsIGFjdGl2ZUNvbXBvbmVudHMsIGRhdGEpIHtcblx0XHRcdHZhciBfdGhpczMgPSB0aGlzO1xuXG5cdFx0XHQvLyBjaGVjayBvZiBjb21wb25lbnQocykgZm9yIHRoaXMgRE9NIGVsZW1lbnQgYWxyZWFkeSBoYXZlIGJlZW4gaW5pdGlhbGl6ZWRcblx0XHRcdHZhciBlbGVtZW50SWQgPSBlbC5nZXRBdHRyaWJ1dGUoXCJkYXRhLWNvbXBvbmVudC1pZFwiKTtcblxuXHRcdFx0aWYgKCFlbGVtZW50SWQpIHtcblx0XHRcdFx0Ly8gZ2l2ZSB1bmlxdWUgaWQgc28gd2UgY2FuIHRyYWNrIGl0IG9uIG5leHQgc2NhblxuXHRcdFx0XHRlbGVtZW50SWQgPSB0aGlzLl9nZW5lcmF0ZVVVSUQoKTtcblx0XHRcdFx0ZWwuc2V0QXR0cmlidXRlKFwiZGF0YS1jb21wb25lbnQtaWRcIiwgZWxlbWVudElkKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gZmluZCB0aGUgbmFtZSBvZiB0aGUgY29tcG9uZW50IGluc3RhbmNlXG5cdFx0XHR2YXIgY29tcG9uZW50TGlzdCA9IGVsLmdldEF0dHJpYnV0ZShcImRhdGEtY29tcG9uZW50XCIpLm1hdGNoKC9cXFMrL2cpO1xuXHRcdFx0Y29tcG9uZW50TGlzdC5mb3JFYWNoKGZ1bmN0aW9uIChjb21wb25lbnROYW1lKSB7XG5cblx0XHRcdFx0dmFyIGNvbXBvbmVudElkID0gY29tcG9uZW50TmFtZSArIFwiLVwiICsgZWxlbWVudElkO1xuXHRcdFx0XHRhY3RpdmVDb21wb25lbnRzW2NvbXBvbmVudElkXSA9IHRydWU7XG5cblx0XHRcdFx0Ly8gY2hlY2sgaWYgY29tcG9uZW50IG5vdCBpbml0aWFsaXplZCBiZWZvcmVcblx0XHRcdFx0aWYgKCFfdGhpczMuaW5pdGlhbGl6ZWRDb21wb25lbnRzW2NvbXBvbmVudElkXSkge1xuXHRcdFx0XHRcdF90aGlzMy5faW5pdGlhbGl6ZUNvbXBvbmVudChjb21wb25lbnROYW1lLCBjb21wb25lbnRJZCwgZWwsIGRhdGEpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6IFwiX2luaXRpYWxpemVDb21wb25lbnRcIixcblxuXHRcdC8qKlxuICAgKiBDYWxsIGNvbnN0cnVjdG9yIG9mIGNvbXBvbmVudCBhbmQgYWRkIGluc3RhbmNlIHRvIHRoZSBjb2xsZWN0aW9uIG9mIGluaXRpYWxpemVkIGNvbXBvbmVudHNcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtTdHJpbmd9IGNvbXBvbmVudE5hbWUgLSBOYW1lIG9mIHRoZSBjb21wb25lbnQgdG8gaW5pdGlhbGl6ZS4gVXNlZCB0byBsb29rdXAgY2xhc3MgZGVmaW5pdGlvbiBpbiBjb21wb25lbnRzIGNvbGxlY3Rpb24uXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBjb21wb25lbnRJZCAtIFVuaXF1ZSBjb21wb25lbnQgSUQgKGNvbWJpbmF0aW9uIG9mIGNvbXBvbmVudCBuYW1lIGFuZCBlbGVtZW50IElEKVxuICAgKiBAcGFyYW0ge0VsZW1lbnR9IGVsIC0gRE9NIGVsZW1lbnQgdGhhdCBpcyB0aGUgY29udGV4dCBvZiB0aGlzIGNvbXBvbmVudFxuICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIE9wdGlvbmFsIGRhdGEgb2JqZWN0IHRvIHBhc3MgdG8gdGhlIGNvbXBvbmVudCBjb25zdHJ1Y3RvclxuICAgKi9cblx0XHR2YWx1ZTogZnVuY3Rpb24gX2luaXRpYWxpemVDb21wb25lbnQoY29tcG9uZW50TmFtZSwgY29tcG9uZW50SWQsIGVsLCBkYXRhKSB7XG5cdFx0XHR2YXIgY29tcG9uZW50ID0gdGhpcy5jb21wb25lbnRzW2NvbXBvbmVudE5hbWVdO1xuXG5cdFx0XHRpZiAodHlwZW9mIGNvbXBvbmVudCAhPT0gXCJmdW5jdGlvblwiKSB0aHJvdyBcIkNvbXBvbmVudExvYWRlcjogdW5rbm93biBjb21wb25lbnQgJ1wiICsgY29tcG9uZW50TmFtZSArIFwiJ1wiO1xuXG5cdFx0XHR2YXIgaW5zdGFuY2UgPSBuZXcgY29tcG9uZW50KGVsLCBkYXRhLCB0aGlzKTtcblxuXHRcdFx0dGhpcy5pbml0aWFsaXplZENvbXBvbmVudHNbY29tcG9uZW50SWRdID0gaW5zdGFuY2U7XG5cdFx0XHR0aGlzLm51bWJlck9mSW5pdGlhbGl6ZWRDb21wb25lbnRzKys7XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiBcIl9kZXN0cm95Q29tcG9uZW50XCIsXG5cblx0XHQvKipcbiAgICogQ2FsbCBkZXN0cm95KCkgb24gYSBjb21wb25lbnQgaW5zdGFuY2UgYW5kIHJlbW92ZSBpdCBmcm9tIHRoZSBjb2xsZWN0aW9uIG9mIGluaXRpYWxpemVkIGNvbXBvbmVudHNcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtTdHJpbmd9IGNvbXBvbmVudElkIC0gVW5pcXVlIGNvbXBvbmVudCBJRCB1c2VkIHRvIGZpbmQgY29tcG9uZW50IGluc3RhbmNlXG4gICAqL1xuXHRcdHZhbHVlOiBmdW5jdGlvbiBfZGVzdHJveUNvbXBvbmVudChjb21wb25lbnRJZCkge1xuXHRcdFx0dmFyIGluc3RhbmNlID0gdGhpcy5pbml0aWFsaXplZENvbXBvbmVudHNbY29tcG9uZW50SWRdO1xuXHRcdFx0aWYgKGluc3RhbmNlICYmIHR5cGVvZiBpbnN0YW5jZS5kZXN0cm95ID09PSBcImZ1bmN0aW9uXCIpIGluc3RhbmNlLmRlc3Ryb3koKTtcblxuXHRcdFx0Ly8gc2FmZSB0byBkZWxldGUgd2hpbGUgb2JqZWN0IGtleXMgd2hpbGUgbG9vcGluZ2h0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMzQ2MzA0OC9pcy1pdC1zYWZlLXRvLWRlbGV0ZS1hbi1vYmplY3QtcHJvcGVydHktd2hpbGUtaXRlcmF0aW5nLW92ZXItdGhlbVxuXHRcdFx0ZGVsZXRlIHRoaXMuaW5pdGlhbGl6ZWRDb21wb25lbnRzW2NvbXBvbmVudElkXTtcblx0XHRcdHRoaXMubnVtYmVyT2ZJbml0aWFsaXplZENvbXBvbmVudHMtLTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6IFwiY2xlYW5VcF9cIixcblxuXHRcdC8qKlxuICAgKiBEZXN0cm95IGluYWl0aWFsaXplZCBjb21wb25lbnRzIHRoYXQgbm8gbG9uZ2VyIGFyZSBhY3RpdmVcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtPYmplY3R9IGFjdGl2ZUNvbXBvbmVudHMgLSBBbGwgY29tcG9uZW50SWRzIGN1cnJlbnRseSBmb3VuZCBpbiB0aGUgRE9NXG4gICAqL1xuXHRcdHZhbHVlOiBmdW5jdGlvbiBjbGVhblVwXygpIHtcblx0XHRcdHZhciBfdGhpczQgPSB0aGlzO1xuXG5cdFx0XHR2YXIgYWN0aXZlQ29tcG9uZW50cyA9IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8ge30gOiBhcmd1bWVudHNbMF07XG5cblx0XHRcdE9iamVjdC5rZXlzKHRoaXMuaW5pdGlhbGl6ZWRDb21wb25lbnRzKS5mb3JFYWNoKGZ1bmN0aW9uIChjb21wb25lbnRJZCkge1xuXHRcdFx0XHRpZiAoIWFjdGl2ZUNvbXBvbmVudHNbY29tcG9uZW50SWRdKSB7XG5cdFx0XHRcdFx0X3RoaXM0Ll9kZXN0cm95Q29tcG9uZW50KGNvbXBvbmVudElkKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiBcIl9nZW5lcmF0ZVVVSURcIixcblxuXHRcdC8qKlxuICAgKiBHZW5lcmF0ZXMgYSByZmM0MTIyIHZlcnNpb24gNCBjb21wbGlhbnQgdW5pcXVlIElEXG4gICAqIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTA1MDM0L2NyZWF0ZS1ndWlkLXV1aWQtaW4tamF2YXNjcmlwdFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cblx0XHR2YWx1ZTogZnVuY3Rpb24gX2dlbmVyYXRlVVVJRCgpIHtcblx0XHRcdHJldHVybiBcInh4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eFwiLnJlcGxhY2UoL1t4eV0vZywgZnVuY3Rpb24gKGMpIHtcblx0XHRcdFx0dmFyIHIgPSBNYXRoLnJhbmRvbSgpICogMTYgfCAwLFxuXHRcdFx0XHQgICAgdiA9IGMgPT0gXCJ4XCIgPyByIDogciAmIDB4MyB8IDB4ODtcblx0XHRcdFx0cmV0dXJuIHYudG9TdHJpbmcoMTYpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9XSk7XG5cblx0cmV0dXJuIENvbXBvbmVudExvYWRlcjtcbn0pKCk7XG5cbi8vIEV4cG9ydCBBTUQsIENvbW1vbkpTL0VTNiBtb2R1bGUgb3IgYXNzdW1lIGdsb2JhbCBuYW1lc3BhY2VcbmlmICh0eXBlb2YgZGVmaW5lICE9PSBcInVuZGVmaW5lZFwiICYmIGRlZmluZS5hbWQpIHtcblx0ZGVmaW5lKFtdLCBDb21wb25lbnRMb2FkZXIpO1xufSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSBcInVuZGVmaW5lZFwiICYmIG1vZHVsZS5leHBvcnRzKSB7XG5cdG1vZHVsZS5leHBvcnRzID0gQ29tcG9uZW50TG9hZGVyO1xufSBlbHNlIHtcblx0d2luZG93LkNvbXBvbmVudExvYWRlciA9IENvbXBvbmVudExvYWRlcjtcbn0iLCIvKipcbiAqIENvbXBvbmVudCBCYXNlIENsYXNzXG4gKiBcbiAqIFNldHMgYWxsIGFyZ3VtZW50cyBwYXNzZWQgaW4gdG8gY29uc3RydWN0b3IgZnJvbSBDb21wb25lbnRMb2FkZXJcbiAqXG4gKiBFeHBvc2VzIHB1Yi9zdWIgbWV0aG9kcyBmb3IgdHJpZ2dlcmluZyBldmVudHMgdG8gb3RoZXIgY29tcG9uZW50c1xuICpcbiAqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gKGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmICgndmFsdWUnIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KSgpO1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvbicpOyB9IH1cblxudmFyIENvbXBvbmVudCA9IChmdW5jdGlvbiAoKSB7XG5cblx0LyoqXG4gICogQ29uc3RydWN0b3IgZm9yIHRoZSBDb21wb25lbnRcbiAgKlxuICAqIENhbGwgYHN1cGVyKC4uLmFyZ3VtZW50cyk7YCBpbiB0aGUgYmFzZSBjbGFzcyBjb25zdHJ1Y3RvclxuICAqXG4gICogQHB1YmxpY1xuICAqIEBwYXJhbSB7Tm9kZX0gY29udGV4dCAtIERPTSBub2RlIHRoYXQgY29udGFpbnMgdGhlIGNvbXBvbmVudCBtYXJrdXBcbiAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIE9wdGlvbmFsIGRhdGEgb2JqZWN0IGZyb20gQ29tcG9uZW50TG9hZGVyLnNjYW4oKVxuICAqIEBwYXJhbSB7T2JqZWN0fSBtZWRpYXRvciAtIGluc3RhbmNlIG9mIENvbXBvbmVudExvYWRlciBmb3IgcHViL3N1YlxuICAqL1xuXG5cdGZ1bmN0aW9uIENvbXBvbmVudCgpIHtcblx0XHRfY2xhc3NDYWxsQ2hlY2sodGhpcywgQ29tcG9uZW50KTtcblxuXHRcdHRoaXMuZWwgPSBhcmd1bWVudHNbMF07XG5cdFx0aWYgKHR5cGVvZiBqUXVlcnkgIT09ICd1bmRlZmluZWQnKSB0aGlzLiRlbCA9IGpRdWVyeSh0aGlzLmVsKTtcblx0XHR0aGlzLmRhdGEgPSBhcmd1bWVudHNbMV07XG5cdFx0dGhpcy5fX21lZGlhdG9yID0gYXJndW1lbnRzWzJdO1xuXHR9XG5cblx0X2NyZWF0ZUNsYXNzKENvbXBvbmVudCwgW3tcblx0XHRrZXk6ICdwdWJsaXNoJyxcblxuXHRcdC8qKlxuICAgKiBQdWJsaXNoIGFuIGV2ZW50IGZvciBvdGhlciBjb21wb25lbnRzXG4gICAqIEBwcm90ZWN0ZWRcbiAgICogQHBhcmFtIHtTdHJpbmd9IHRvcGljIC0gRXZlbnQgbmFtZVxuICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIE9wdGlvbmFsIHBhcmFtcyB0byBwYXNzIHdpdGggdGhlIGV2ZW50XG4gICAqL1xuXHRcdHZhbHVlOiBmdW5jdGlvbiBwdWJsaXNoKCkge1xuXHRcdFx0dmFyIF9tZWRpYXRvcjtcblxuXHRcdFx0KF9tZWRpYXRvciA9IHRoaXMuX19tZWRpYXRvcikucHVibGlzaC5hcHBseShfbWVkaWF0b3IsIGFyZ3VtZW50cyk7XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiAnc3Vic2NyaWJlJyxcblxuXHRcdC8qKlxuICAgKiBTdWJzY3JpYmUgdG8gYW4gZXZlbnQgZnJvbSBhbm90aGVyIGNvbXBvbmVudFxuICAgKiBAcHJvdGVjdGVkXG4gICAqIEBwYXJhbSB7U3RyaW5nfSB0b3BpYyAtIEV2ZW50IG5hbWVcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSBGdW5jdGlvbiB0byBiaW5kXG4gICAqL1xuXHRcdHZhbHVlOiBmdW5jdGlvbiBzdWJzY3JpYmUodG9waWMsIGNhbGxiYWNrKSB7XG5cdFx0XHR0aGlzLl9fbWVkaWF0b3Iuc3Vic2NyaWJlKHRvcGljLCBjYWxsYmFjaywgdGhpcyk7XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiAndW5zdWJzY3JpYmUnLFxuXG5cdFx0LyoqXG4gICAqIFVuc3Vic2NyaWJlIGZyb20gYW4gZXZlbnQgZnJvbSBhbm90aGVyIGNvbXBvbmVudFxuICAgKiBAcHJvdGVjdGVkXG4gICAqIEBwYXJhbSB7U3RyaW5nfSB0b3BpYyAtIEV2ZW50IG5hbWVcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSBGdW5jdGlvbiB0byB1bmJpbmRcbiAgICovXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIHVuc3Vic2NyaWJlKHRvcGljLCBjYWxsYmFjaykge1xuXHRcdFx0dGhpcy5fX21lZGlhdG9yLnVuc3Vic2NyaWJlKHRvcGljLCBjYWxsYmFjaywgdGhpcyk7XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiAnc2NhbicsXG5cblx0XHQvKipcbiAgICogVXRpbGl0eSBtZXRob2QgZm9yIHRyaWdnZXJpbmcgdGhlIENvbXBvbmVudExvYWRlciB0byBzY2FuIHRoZSBtYXJrdXAgZm9yIG5ldyBjb21wb25lbnRzXG4gICAqIEBwcm90ZWN0ZWRcbiAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBPcHRpb25hbCBkYXRhIHRvIHBhc3MgdG8gdGhlIGNvbnN0cnVjdG9yIG9mIGFueSBDb21wb25lbnQgaW5pdGlhbGl6ZWQgYnkgdGhpcyBzY2FuXG4gICAqL1xuXHRcdHZhbHVlOiBmdW5jdGlvbiBzY2FuKGRhdGEpIHtcblx0XHRcdHRoaXMuX19tZWRpYXRvci5zY2FuKGRhdGEpO1xuXHRcdH1cblx0fSwge1xuXHRcdGtleTogJ2RlZmVyJyxcblxuXHRcdC8qKlxuICAgKiBVdGlsaXR5IG1ldGhvZCBmb3IgZGVmZXJpbmcgYSBmdW5jdGlvbiBjYWxsXG4gICAqIEBwcm90ZWN0ZWRcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSBGdW5jdGlvbiB0byBjYWxsXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBtcyAtIE9wdGlvbmFsIG1zIHRvIGRlbGF5LCBkZWZhdWx0cyB0byAxN21zIChqdXN0IG92ZXIgMSBmcmFtZSBhdCA2MGZwcylcbiAgICovXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIGRlZmVyKGNhbGxiYWNrKSB7XG5cdFx0XHR2YXIgbXMgPSBhcmd1bWVudHNbMV0gPT09IHVuZGVmaW5lZCA/IDE3IDogYXJndW1lbnRzWzFdO1xuXG5cdFx0XHRzZXRUaW1lb3V0KGNhbGxiYWNrLCBtcyk7XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiAnZGVzdHJveScsXG5cblx0XHQvKipcbiAgICogQ2FsbGVkIGJ5IENvbXBvbmVudExvYWRlciB3aGVuIGNvbXBvbmVudCBpcyBubyBsb25nZXIgZm91bmQgaW4gdGhlIG1hcmt1cFxuICAgKiB1c3VhbGx5IGhhcHBlbnMgYXMgYSByZXN1bHQgb2YgcmVwbGFjaW5nIHRoZSBtYXJrdXAgdXNpbmcgQUpBWFxuICAgKlx0XG4gICAqIE92ZXJyaWRlIGluIHN1YmNsYXNzIGFuZCBtYWtlIHN1cmUgdG8gY2xlYW4gdXAgZXZlbnQgaGFuZGxlcnMgZXRjXG4gICAqXG4gICAqIEBwcm90ZWN0ZWRcbiAgICovXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIGRlc3Ryb3koKSB7fVxuXHR9XSk7XG5cblx0cmV0dXJuIENvbXBvbmVudDtcbn0pKCk7XG5cbi8vIEV4cG9ydCBBTUQsIENvbW1vbkpTL0VTNiBtb2R1bGUgb3IgYXNzdW1lIGdsb2JhbCBuYW1lc3BhY2VcbmlmICh0eXBlb2YgZGVmaW5lICE9PSAndW5kZWZpbmVkJyAmJiBkZWZpbmUuYW1kKSB7XG5cdGRlZmluZShbXSwgQ29tcG9uZW50KTtcbn0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcblx0bW9kdWxlLmV4cG9ydHMgPSBDb21wb25lbnQ7XG59IGVsc2Uge1xuXHR3aW5kb3cuQ29tcG9uZW50ID0gQ29tcG9uZW50O1xufSIsIihmdW5jdGlvbiggZmFjdG9yeSApIHtcblx0aWYgKHR5cGVvZiBkZWZpbmUgIT09ICd1bmRlZmluZWQnICYmIGRlZmluZS5hbWQpIHtcblx0XHRkZWZpbmUoW10sIGZhY3RvcnkpO1xuXHR9IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG5cdH0gZWxzZSB7XG5cdFx0d2luZG93LnNjcm9sbE1vbml0b3IgPSBmYWN0b3J5KCk7XG5cdH1cbn0pKGZ1bmN0aW9uKCkge1xuXG5cdHZhciBzY3JvbGxUb3AgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gd2luZG93LnBhZ2VZT2Zmc2V0IHx8XG5cdFx0XHQoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50ICYmIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3ApIHx8XG5cdFx0XHRkb2N1bWVudC5ib2R5LnNjcm9sbFRvcDtcblx0fTtcblxuXHR2YXIgZXhwb3J0cyA9IHt9O1xuXG5cdHZhciB3YXRjaGVycyA9IFtdO1xuXG5cdHZhciBWSVNJQklMSVRZQ0hBTkdFID0gJ3Zpc2liaWxpdHlDaGFuZ2UnO1xuXHR2YXIgRU5URVJWSUVXUE9SVCA9ICdlbnRlclZpZXdwb3J0Jztcblx0dmFyIEZVTExZRU5URVJWSUVXUE9SVCA9ICdmdWxseUVudGVyVmlld3BvcnQnO1xuXHR2YXIgRVhJVFZJRVdQT1JUID0gJ2V4aXRWaWV3cG9ydCc7XG5cdHZhciBQQVJUSUFMTFlFWElUVklFV1BPUlQgPSAncGFydGlhbGx5RXhpdFZpZXdwb3J0Jztcblx0dmFyIExPQ0FUSU9OQ0hBTkdFID0gJ2xvY2F0aW9uQ2hhbmdlJztcblx0dmFyIFNUQVRFQ0hBTkdFID0gJ3N0YXRlQ2hhbmdlJztcblxuXHR2YXIgZXZlbnRUeXBlcyA9IFtcblx0XHRWSVNJQklMSVRZQ0hBTkdFLFxuXHRcdEVOVEVSVklFV1BPUlQsXG5cdFx0RlVMTFlFTlRFUlZJRVdQT1JULFxuXHRcdEVYSVRWSUVXUE9SVCxcblx0XHRQQVJUSUFMTFlFWElUVklFV1BPUlQsXG5cdFx0TE9DQVRJT05DSEFOR0UsXG5cdFx0U1RBVEVDSEFOR0Vcblx0XTtcblxuXHR2YXIgZGVmYXVsdE9mZnNldHMgPSB7dG9wOiAwLCBib3R0b206IDB9O1xuXG5cdHZhciBnZXRWaWV3cG9ydEhlaWdodCA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB3aW5kb3cuaW5uZXJIZWlnaHQgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodDtcblx0fTtcblxuXHR2YXIgZ2V0RG9jdW1lbnRIZWlnaHQgPSBmdW5jdGlvbigpIHtcblx0XHQvLyBqUXVlcnkgYXBwcm9hY2hcblx0XHQvLyB3aGljaGV2ZXIgaXMgZ3JlYXRlc3Rcblx0XHRyZXR1cm4gTWF0aC5tYXgoXG5cdFx0XHRkb2N1bWVudC5ib2R5LnNjcm9sbEhlaWdodCwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbEhlaWdodCxcblx0XHRcdGRvY3VtZW50LmJvZHkub2Zmc2V0SGVpZ2h0LCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQub2Zmc2V0SGVpZ2h0LFxuXHRcdFx0ZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodFxuXHRcdCk7XG5cdH07XG5cblx0ZXhwb3J0cy52aWV3cG9ydFRvcCA9IG51bGw7XG5cdGV4cG9ydHMudmlld3BvcnRCb3R0b20gPSBudWxsO1xuXHRleHBvcnRzLmRvY3VtZW50SGVpZ2h0ID0gbnVsbDtcblx0ZXhwb3J0cy52aWV3cG9ydEhlaWdodCA9IGdldFZpZXdwb3J0SGVpZ2h0KCk7XG5cblx0dmFyIHByZXZpb3VzRG9jdW1lbnRIZWlnaHQ7XG5cdHZhciBsYXRlc3RFdmVudDtcblxuXHR2YXIgY2FsY3VsYXRlVmlld3BvcnRJO1xuXHRmdW5jdGlvbiBjYWxjdWxhdGVWaWV3cG9ydCgpIHtcblx0XHRleHBvcnRzLnZpZXdwb3J0VG9wID0gc2Nyb2xsVG9wKCk7XG5cdFx0ZXhwb3J0cy52aWV3cG9ydEJvdHRvbSA9IGV4cG9ydHMudmlld3BvcnRUb3AgKyBleHBvcnRzLnZpZXdwb3J0SGVpZ2h0O1xuXHRcdGV4cG9ydHMuZG9jdW1lbnRIZWlnaHQgPSBnZXREb2N1bWVudEhlaWdodCgpO1xuXHRcdGlmIChleHBvcnRzLmRvY3VtZW50SGVpZ2h0ICE9PSBwcmV2aW91c0RvY3VtZW50SGVpZ2h0KSB7XG5cdFx0XHRjYWxjdWxhdGVWaWV3cG9ydEkgPSB3YXRjaGVycy5sZW5ndGg7XG5cdFx0XHR3aGlsZSggY2FsY3VsYXRlVmlld3BvcnRJLS0gKSB7XG5cdFx0XHRcdHdhdGNoZXJzW2NhbGN1bGF0ZVZpZXdwb3J0SV0ucmVjYWxjdWxhdGVMb2NhdGlvbigpO1xuXHRcdFx0fVxuXHRcdFx0cHJldmlvdXNEb2N1bWVudEhlaWdodCA9IGV4cG9ydHMuZG9jdW1lbnRIZWlnaHQ7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gcmVjYWxjdWxhdGVXYXRjaExvY2F0aW9uc0FuZFRyaWdnZXIoKSB7XG5cdFx0ZXhwb3J0cy52aWV3cG9ydEhlaWdodCA9IGdldFZpZXdwb3J0SGVpZ2h0KCk7XG5cdFx0Y2FsY3VsYXRlVmlld3BvcnQoKTtcblx0XHR1cGRhdGVBbmRUcmlnZ2VyV2F0Y2hlcnMoKTtcblx0fVxuXG5cdHZhciByZWNhbGN1bGF0ZUFuZFRyaWdnZXJUaW1lcjtcblx0ZnVuY3Rpb24gZGVib3VuY2VkUmVjYWxjdWF0ZUFuZFRyaWdnZXIoKSB7XG5cdFx0Y2xlYXJUaW1lb3V0KHJlY2FsY3VsYXRlQW5kVHJpZ2dlclRpbWVyKTtcblx0XHRyZWNhbGN1bGF0ZUFuZFRyaWdnZXJUaW1lciA9IHNldFRpbWVvdXQoIHJlY2FsY3VsYXRlV2F0Y2hMb2NhdGlvbnNBbmRUcmlnZ2VyLCAxMDAgKTtcblx0fVxuXG5cdHZhciB1cGRhdGVBbmRUcmlnZ2VyV2F0Y2hlcnNJO1xuXHRmdW5jdGlvbiB1cGRhdGVBbmRUcmlnZ2VyV2F0Y2hlcnMoKSB7XG5cdFx0Ly8gdXBkYXRlIGFsbCB3YXRjaGVycyB0aGVuIHRyaWdnZXIgdGhlIGV2ZW50cyBzbyBvbmUgY2FuIHJlbHkgb24gYW5vdGhlciBiZWluZyB1cCB0byBkYXRlLlxuXHRcdHVwZGF0ZUFuZFRyaWdnZXJXYXRjaGVyc0kgPSB3YXRjaGVycy5sZW5ndGg7XG5cdFx0d2hpbGUoIHVwZGF0ZUFuZFRyaWdnZXJXYXRjaGVyc0ktLSApIHtcblx0XHRcdHdhdGNoZXJzW3VwZGF0ZUFuZFRyaWdnZXJXYXRjaGVyc0ldLnVwZGF0ZSgpO1xuXHRcdH1cblxuXHRcdHVwZGF0ZUFuZFRyaWdnZXJXYXRjaGVyc0kgPSB3YXRjaGVycy5sZW5ndGg7XG5cdFx0d2hpbGUoIHVwZGF0ZUFuZFRyaWdnZXJXYXRjaGVyc0ktLSApIHtcblx0XHRcdHdhdGNoZXJzW3VwZGF0ZUFuZFRyaWdnZXJXYXRjaGVyc0ldLnRyaWdnZXJDYWxsYmFja3MoKTtcblx0XHR9XG5cblx0fVxuXG5cdGZ1bmN0aW9uIEVsZW1lbnRXYXRjaGVyKCB3YXRjaEl0ZW0sIG9mZnNldHMgKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdFx0dGhpcy53YXRjaEl0ZW0gPSB3YXRjaEl0ZW07XG5cblx0XHRpZiAoIW9mZnNldHMpIHtcblx0XHRcdHRoaXMub2Zmc2V0cyA9IGRlZmF1bHRPZmZzZXRzO1xuXHRcdH0gZWxzZSBpZiAob2Zmc2V0cyA9PT0gK29mZnNldHMpIHtcblx0XHRcdHRoaXMub2Zmc2V0cyA9IHt0b3A6IG9mZnNldHMsIGJvdHRvbTogb2Zmc2V0c307XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMub2Zmc2V0cyA9IHtcblx0XHRcdFx0dG9wOiBvZmZzZXRzLnRvcCB8fCBkZWZhdWx0T2Zmc2V0cy50b3AsXG5cdFx0XHRcdGJvdHRvbTogb2Zmc2V0cy5ib3R0b20gfHwgZGVmYXVsdE9mZnNldHMuYm90dG9tXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdHRoaXMuY2FsbGJhY2tzID0ge307IC8vIHtjYWxsYmFjazogZnVuY3Rpb24sIGlzT25lOiB0cnVlIH1cblxuXHRcdGZvciAodmFyIGkgPSAwLCBqID0gZXZlbnRUeXBlcy5sZW5ndGg7IGkgPCBqOyBpKyspIHtcblx0XHRcdHNlbGYuY2FsbGJhY2tzW2V2ZW50VHlwZXNbaV1dID0gW107XG5cdFx0fVxuXG5cdFx0dGhpcy5sb2NrZWQgPSBmYWxzZTtcblxuXHRcdHZhciB3YXNJblZpZXdwb3J0O1xuXHRcdHZhciB3YXNGdWxseUluVmlld3BvcnQ7XG5cdFx0dmFyIHdhc0Fib3ZlVmlld3BvcnQ7XG5cdFx0dmFyIHdhc0JlbG93Vmlld3BvcnQ7XG5cblx0XHR2YXIgbGlzdGVuZXJUb1RyaWdnZXJMaXN0STtcblx0XHR2YXIgbGlzdGVuZXI7XG5cdFx0ZnVuY3Rpb24gdHJpZ2dlckNhbGxiYWNrQXJyYXkoIGxpc3RlbmVycyApIHtcblx0XHRcdGlmIChsaXN0ZW5lcnMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdGxpc3RlbmVyVG9UcmlnZ2VyTGlzdEkgPSBsaXN0ZW5lcnMubGVuZ3RoO1xuXHRcdFx0d2hpbGUoIGxpc3RlbmVyVG9UcmlnZ2VyTGlzdEktLSApIHtcblx0XHRcdFx0bGlzdGVuZXIgPSBsaXN0ZW5lcnNbbGlzdGVuZXJUb1RyaWdnZXJMaXN0SV07XG5cdFx0XHRcdGxpc3RlbmVyLmNhbGxiYWNrLmNhbGwoIHNlbGYsIGxhdGVzdEV2ZW50ICk7XG5cdFx0XHRcdGlmIChsaXN0ZW5lci5pc09uZSkge1xuXHRcdFx0XHRcdGxpc3RlbmVycy5zcGxpY2UobGlzdGVuZXJUb1RyaWdnZXJMaXN0SSwgMSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0dGhpcy50cmlnZ2VyQ2FsbGJhY2tzID0gZnVuY3Rpb24gdHJpZ2dlckNhbGxiYWNrcygpIHtcblxuXHRcdFx0aWYgKHRoaXMuaXNJblZpZXdwb3J0ICYmICF3YXNJblZpZXdwb3J0KSB7XG5cdFx0XHRcdHRyaWdnZXJDYWxsYmFja0FycmF5KCB0aGlzLmNhbGxiYWNrc1tFTlRFUlZJRVdQT1JUXSApO1xuXHRcdFx0fVxuXHRcdFx0aWYgKHRoaXMuaXNGdWxseUluVmlld3BvcnQgJiYgIXdhc0Z1bGx5SW5WaWV3cG9ydCkge1xuXHRcdFx0XHR0cmlnZ2VyQ2FsbGJhY2tBcnJheSggdGhpcy5jYWxsYmFja3NbRlVMTFlFTlRFUlZJRVdQT1JUXSApO1xuXHRcdFx0fVxuXG5cblx0XHRcdGlmICh0aGlzLmlzQWJvdmVWaWV3cG9ydCAhPT0gd2FzQWJvdmVWaWV3cG9ydCAmJlxuXHRcdFx0XHR0aGlzLmlzQmVsb3dWaWV3cG9ydCAhPT0gd2FzQmVsb3dWaWV3cG9ydCkge1xuXG5cdFx0XHRcdHRyaWdnZXJDYWxsYmFja0FycmF5KCB0aGlzLmNhbGxiYWNrc1tWSVNJQklMSVRZQ0hBTkdFXSApO1xuXG5cdFx0XHRcdC8vIGlmIHlvdSBza2lwIGNvbXBsZXRlbHkgcGFzdCB0aGlzIGVsZW1lbnRcblx0XHRcdFx0aWYgKCF3YXNGdWxseUluVmlld3BvcnQgJiYgIXRoaXMuaXNGdWxseUluVmlld3BvcnQpIHtcblx0XHRcdFx0XHR0cmlnZ2VyQ2FsbGJhY2tBcnJheSggdGhpcy5jYWxsYmFja3NbRlVMTFlFTlRFUlZJRVdQT1JUXSApO1xuXHRcdFx0XHRcdHRyaWdnZXJDYWxsYmFja0FycmF5KCB0aGlzLmNhbGxiYWNrc1tQQVJUSUFMTFlFWElUVklFV1BPUlRdICk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKCF3YXNJblZpZXdwb3J0ICYmICF0aGlzLmlzSW5WaWV3cG9ydCkge1xuXHRcdFx0XHRcdHRyaWdnZXJDYWxsYmFja0FycmF5KCB0aGlzLmNhbGxiYWNrc1tFTlRFUlZJRVdQT1JUXSApO1xuXHRcdFx0XHRcdHRyaWdnZXJDYWxsYmFja0FycmF5KCB0aGlzLmNhbGxiYWNrc1tFWElUVklFV1BPUlRdICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0aWYgKCF0aGlzLmlzRnVsbHlJblZpZXdwb3J0ICYmIHdhc0Z1bGx5SW5WaWV3cG9ydCkge1xuXHRcdFx0XHR0cmlnZ2VyQ2FsbGJhY2tBcnJheSggdGhpcy5jYWxsYmFja3NbUEFSVElBTExZRVhJVFZJRVdQT1JUXSApO1xuXHRcdFx0fVxuXHRcdFx0aWYgKCF0aGlzLmlzSW5WaWV3cG9ydCAmJiB3YXNJblZpZXdwb3J0KSB7XG5cdFx0XHRcdHRyaWdnZXJDYWxsYmFja0FycmF5KCB0aGlzLmNhbGxiYWNrc1tFWElUVklFV1BPUlRdICk7XG5cdFx0XHR9XG5cdFx0XHRpZiAodGhpcy5pc0luVmlld3BvcnQgIT09IHdhc0luVmlld3BvcnQpIHtcblx0XHRcdFx0dHJpZ2dlckNhbGxiYWNrQXJyYXkoIHRoaXMuY2FsbGJhY2tzW1ZJU0lCSUxJVFlDSEFOR0VdICk7XG5cdFx0XHR9XG5cdFx0XHRzd2l0Y2goIHRydWUgKSB7XG5cdFx0XHRcdGNhc2Ugd2FzSW5WaWV3cG9ydCAhPT0gdGhpcy5pc0luVmlld3BvcnQ6XG5cdFx0XHRcdGNhc2Ugd2FzRnVsbHlJblZpZXdwb3J0ICE9PSB0aGlzLmlzRnVsbHlJblZpZXdwb3J0OlxuXHRcdFx0XHRjYXNlIHdhc0Fib3ZlVmlld3BvcnQgIT09IHRoaXMuaXNBYm92ZVZpZXdwb3J0OlxuXHRcdFx0XHRjYXNlIHdhc0JlbG93Vmlld3BvcnQgIT09IHRoaXMuaXNCZWxvd1ZpZXdwb3J0OlxuXHRcdFx0XHRcdHRyaWdnZXJDYWxsYmFja0FycmF5KCB0aGlzLmNhbGxiYWNrc1tTVEFURUNIQU5HRV0gKTtcblx0XHRcdH1cblxuXHRcdFx0d2FzSW5WaWV3cG9ydCA9IHRoaXMuaXNJblZpZXdwb3J0O1xuXHRcdFx0d2FzRnVsbHlJblZpZXdwb3J0ID0gdGhpcy5pc0Z1bGx5SW5WaWV3cG9ydDtcblx0XHRcdHdhc0Fib3ZlVmlld3BvcnQgPSB0aGlzLmlzQWJvdmVWaWV3cG9ydDtcblx0XHRcdHdhc0JlbG93Vmlld3BvcnQgPSB0aGlzLmlzQmVsb3dWaWV3cG9ydDtcblxuXHRcdH07XG5cblx0XHR0aGlzLnJlY2FsY3VsYXRlTG9jYXRpb24gPSBmdW5jdGlvbigpIHtcblx0XHRcdGlmICh0aGlzLmxvY2tlZCkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHR2YXIgcHJldmlvdXNUb3AgPSB0aGlzLnRvcDtcblx0XHRcdHZhciBwcmV2aW91c0JvdHRvbSA9IHRoaXMuYm90dG9tO1xuXHRcdFx0aWYgKHRoaXMud2F0Y2hJdGVtLm5vZGVOYW1lKSB7IC8vIGEgZG9tIGVsZW1lbnRcblx0XHRcdFx0dmFyIGNhY2hlZERpc3BsYXkgPSB0aGlzLndhdGNoSXRlbS5zdHlsZS5kaXNwbGF5O1xuXHRcdFx0XHRpZiAoY2FjaGVkRGlzcGxheSA9PT0gJ25vbmUnKSB7XG5cdFx0XHRcdFx0dGhpcy53YXRjaEl0ZW0uc3R5bGUuZGlzcGxheSA9ICcnO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dmFyIGJvdW5kaW5nUmVjdCA9IHRoaXMud2F0Y2hJdGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXHRcdFx0XHR0aGlzLnRvcCA9IGJvdW5kaW5nUmVjdC50b3AgKyBleHBvcnRzLnZpZXdwb3J0VG9wO1xuXHRcdFx0XHR0aGlzLmJvdHRvbSA9IGJvdW5kaW5nUmVjdC5ib3R0b20gKyBleHBvcnRzLnZpZXdwb3J0VG9wO1xuXG5cdFx0XHRcdGlmIChjYWNoZWREaXNwbGF5ID09PSAnbm9uZScpIHtcblx0XHRcdFx0XHR0aGlzLndhdGNoSXRlbS5zdHlsZS5kaXNwbGF5ID0gY2FjaGVkRGlzcGxheTtcblx0XHRcdFx0fVxuXG5cdFx0XHR9IGVsc2UgaWYgKHRoaXMud2F0Y2hJdGVtID09PSArdGhpcy53YXRjaEl0ZW0pIHsgLy8gbnVtYmVyXG5cdFx0XHRcdGlmICh0aGlzLndhdGNoSXRlbSA+IDApIHtcblx0XHRcdFx0XHR0aGlzLnRvcCA9IHRoaXMuYm90dG9tID0gdGhpcy53YXRjaEl0ZW07XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGhpcy50b3AgPSB0aGlzLmJvdHRvbSA9IGV4cG9ydHMuZG9jdW1lbnRIZWlnaHQgLSB0aGlzLndhdGNoSXRlbTtcblx0XHRcdFx0fVxuXG5cdFx0XHR9IGVsc2UgeyAvLyBhbiBvYmplY3Qgd2l0aCBhIHRvcCBhbmQgYm90dG9tIHByb3BlcnR5XG5cdFx0XHRcdHRoaXMudG9wID0gdGhpcy53YXRjaEl0ZW0udG9wO1xuXHRcdFx0XHR0aGlzLmJvdHRvbSA9IHRoaXMud2F0Y2hJdGVtLmJvdHRvbTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy50b3AgLT0gdGhpcy5vZmZzZXRzLnRvcDtcblx0XHRcdHRoaXMuYm90dG9tICs9IHRoaXMub2Zmc2V0cy5ib3R0b207XG5cdFx0XHR0aGlzLmhlaWdodCA9IHRoaXMuYm90dG9tIC0gdGhpcy50b3A7XG5cblx0XHRcdGlmICggKHByZXZpb3VzVG9wICE9PSB1bmRlZmluZWQgfHwgcHJldmlvdXNCb3R0b20gIT09IHVuZGVmaW5lZCkgJiYgKHRoaXMudG9wICE9PSBwcmV2aW91c1RvcCB8fCB0aGlzLmJvdHRvbSAhPT0gcHJldmlvdXNCb3R0b20pICkge1xuXHRcdFx0XHR0cmlnZ2VyQ2FsbGJhY2tBcnJheSggdGhpcy5jYWxsYmFja3NbTE9DQVRJT05DSEFOR0VdICk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHRoaXMucmVjYWxjdWxhdGVMb2NhdGlvbigpO1xuXHRcdHRoaXMudXBkYXRlKCk7XG5cblx0XHR3YXNJblZpZXdwb3J0ID0gdGhpcy5pc0luVmlld3BvcnQ7XG5cdFx0d2FzRnVsbHlJblZpZXdwb3J0ID0gdGhpcy5pc0Z1bGx5SW5WaWV3cG9ydDtcblx0XHR3YXNBYm92ZVZpZXdwb3J0ID0gdGhpcy5pc0Fib3ZlVmlld3BvcnQ7XG5cdFx0d2FzQmVsb3dWaWV3cG9ydCA9IHRoaXMuaXNCZWxvd1ZpZXdwb3J0O1xuXHR9XG5cblx0RWxlbWVudFdhdGNoZXIucHJvdG90eXBlID0ge1xuXHRcdG9uOiBmdW5jdGlvbiggZXZlbnQsIGNhbGxiYWNrLCBpc09uZSApIHtcblxuXHRcdFx0Ly8gdHJpZ2dlciB0aGUgZXZlbnQgaWYgaXQgYXBwbGllcyB0byB0aGUgZWxlbWVudCByaWdodCBub3cuXG5cdFx0XHRzd2l0Y2goIHRydWUgKSB7XG5cdFx0XHRcdGNhc2UgZXZlbnQgPT09IFZJU0lCSUxJVFlDSEFOR0UgJiYgIXRoaXMuaXNJblZpZXdwb3J0ICYmIHRoaXMuaXNBYm92ZVZpZXdwb3J0OlxuXHRcdFx0XHRjYXNlIGV2ZW50ID09PSBFTlRFUlZJRVdQT1JUICYmIHRoaXMuaXNJblZpZXdwb3J0OlxuXHRcdFx0XHRjYXNlIGV2ZW50ID09PSBGVUxMWUVOVEVSVklFV1BPUlQgJiYgdGhpcy5pc0Z1bGx5SW5WaWV3cG9ydDpcblx0XHRcdFx0Y2FzZSBldmVudCA9PT0gRVhJVFZJRVdQT1JUICYmIHRoaXMuaXNBYm92ZVZpZXdwb3J0ICYmICF0aGlzLmlzSW5WaWV3cG9ydDpcblx0XHRcdFx0Y2FzZSBldmVudCA9PT0gUEFSVElBTExZRVhJVFZJRVdQT1JUICYmIHRoaXMuaXNBYm92ZVZpZXdwb3J0OlxuXHRcdFx0XHRcdGNhbGxiYWNrLmNhbGwoIHRoaXMsIGxhdGVzdEV2ZW50ICk7XG5cdFx0XHRcdFx0aWYgKGlzT25lKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAodGhpcy5jYWxsYmFja3NbZXZlbnRdKSB7XG5cdFx0XHRcdHRoaXMuY2FsbGJhY2tzW2V2ZW50XS5wdXNoKHtjYWxsYmFjazogY2FsbGJhY2ssIGlzT25lOiBpc09uZXx8ZmFsc2V9KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcignVHJpZWQgdG8gYWRkIGEgc2Nyb2xsIG1vbml0b3IgbGlzdGVuZXIgb2YgdHlwZSAnK2V2ZW50KycuIFlvdXIgb3B0aW9ucyBhcmU6ICcrZXZlbnRUeXBlcy5qb2luKCcsICcpKTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdG9mZjogZnVuY3Rpb24oIGV2ZW50LCBjYWxsYmFjayApIHtcblx0XHRcdGlmICh0aGlzLmNhbGxiYWNrc1tldmVudF0pIHtcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDAsIGl0ZW07IGl0ZW0gPSB0aGlzLmNhbGxiYWNrc1tldmVudF1baV07IGkrKykge1xuXHRcdFx0XHRcdGlmIChpdGVtLmNhbGxiYWNrID09PSBjYWxsYmFjaykge1xuXHRcdFx0XHRcdFx0dGhpcy5jYWxsYmFja3NbZXZlbnRdLnNwbGljZShpLCAxKTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdUcmllZCB0byByZW1vdmUgYSBzY3JvbGwgbW9uaXRvciBsaXN0ZW5lciBvZiB0eXBlICcrZXZlbnQrJy4gWW91ciBvcHRpb25zIGFyZTogJytldmVudFR5cGVzLmpvaW4oJywgJykpO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0b25lOiBmdW5jdGlvbiggZXZlbnQsIGNhbGxiYWNrICkge1xuXHRcdFx0dGhpcy5vbiggZXZlbnQsIGNhbGxiYWNrLCB0cnVlKTtcblx0XHR9LFxuXHRcdHJlY2FsY3VsYXRlU2l6ZTogZnVuY3Rpb24oKSB7XG5cdFx0XHR0aGlzLmhlaWdodCA9IHRoaXMud2F0Y2hJdGVtLm9mZnNldEhlaWdodCArIHRoaXMub2Zmc2V0cy50b3AgKyB0aGlzLm9mZnNldHMuYm90dG9tO1xuXHRcdFx0dGhpcy5ib3R0b20gPSB0aGlzLnRvcCArIHRoaXMuaGVpZ2h0O1xuXHRcdH0sXG5cdFx0dXBkYXRlOiBmdW5jdGlvbigpIHtcblx0XHRcdHRoaXMuaXNBYm92ZVZpZXdwb3J0ID0gdGhpcy50b3AgPCBleHBvcnRzLnZpZXdwb3J0VG9wO1xuXHRcdFx0dGhpcy5pc0JlbG93Vmlld3BvcnQgPSB0aGlzLmJvdHRvbSA+IGV4cG9ydHMudmlld3BvcnRCb3R0b207XG5cblx0XHRcdHRoaXMuaXNJblZpZXdwb3J0ID0gKHRoaXMudG9wIDw9IGV4cG9ydHMudmlld3BvcnRCb3R0b20gJiYgdGhpcy5ib3R0b20gPj0gZXhwb3J0cy52aWV3cG9ydFRvcCk7XG5cdFx0XHR0aGlzLmlzRnVsbHlJblZpZXdwb3J0ID0gKHRoaXMudG9wID49IGV4cG9ydHMudmlld3BvcnRUb3AgJiYgdGhpcy5ib3R0b20gPD0gZXhwb3J0cy52aWV3cG9ydEJvdHRvbSkgfHxcblx0XHRcdFx0XHRcdFx0XHQgKHRoaXMuaXNBYm92ZVZpZXdwb3J0ICYmIHRoaXMuaXNCZWxvd1ZpZXdwb3J0KTtcblxuXHRcdH0sXG5cdFx0ZGVzdHJveTogZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgaW5kZXggPSB3YXRjaGVycy5pbmRleE9mKHRoaXMpLFxuXHRcdFx0XHRzZWxmICA9IHRoaXM7XG5cdFx0XHR3YXRjaGVycy5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0Zm9yICh2YXIgaSA9IDAsIGogPSBldmVudFR5cGVzLmxlbmd0aDsgaSA8IGo7IGkrKykge1xuXHRcdFx0XHRzZWxmLmNhbGxiYWNrc1tldmVudFR5cGVzW2ldXS5sZW5ndGggPSAwO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0Ly8gcHJldmVudCByZWNhbGN1bGF0aW5nIHRoZSBlbGVtZW50IGxvY2F0aW9uXG5cdFx0bG9jazogZnVuY3Rpb24oKSB7XG5cdFx0XHR0aGlzLmxvY2tlZCA9IHRydWU7XG5cdFx0fSxcblx0XHR1bmxvY2s6IGZ1bmN0aW9uKCkge1xuXHRcdFx0dGhpcy5sb2NrZWQgPSBmYWxzZTtcblx0XHR9XG5cdH07XG5cblx0dmFyIGV2ZW50SGFuZGxlckZhY3RvcnkgPSBmdW5jdGlvbiAodHlwZSkge1xuXHRcdHJldHVybiBmdW5jdGlvbiggY2FsbGJhY2ssIGlzT25lICkge1xuXHRcdFx0dGhpcy5vbi5jYWxsKHRoaXMsIHR5cGUsIGNhbGxiYWNrLCBpc09uZSk7XG5cdFx0fTtcblx0fTtcblxuXHRmb3IgKHZhciBpID0gMCwgaiA9IGV2ZW50VHlwZXMubGVuZ3RoOyBpIDwgajsgaSsrKSB7XG5cdFx0dmFyIHR5cGUgPSAgZXZlbnRUeXBlc1tpXTtcblx0XHRFbGVtZW50V2F0Y2hlci5wcm90b3R5cGVbdHlwZV0gPSBldmVudEhhbmRsZXJGYWN0b3J5KHR5cGUpO1xuXHR9XG5cblx0dHJ5IHtcblx0XHRjYWxjdWxhdGVWaWV3cG9ydCgpO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0dHJ5IHtcblx0XHRcdHdpbmRvdy4kKGNhbGN1bGF0ZVZpZXdwb3J0KTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0lmIHlvdSBtdXN0IHB1dCBzY3JvbGxNb25pdG9yIGluIHRoZSA8aGVhZD4sIHlvdSBtdXN0IHVzZSBqUXVlcnkuJyk7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gc2Nyb2xsTW9uaXRvckxpc3RlbmVyKGV2ZW50KSB7XG5cdFx0bGF0ZXN0RXZlbnQgPSBldmVudDtcblx0XHRjYWxjdWxhdGVWaWV3cG9ydCgpO1xuXHRcdHVwZGF0ZUFuZFRyaWdnZXJXYXRjaGVycygpO1xuXHR9XG5cblx0aWYgKHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKSB7XG5cdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIHNjcm9sbE1vbml0b3JMaXN0ZW5lcik7XG5cdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIGRlYm91bmNlZFJlY2FsY3VhdGVBbmRUcmlnZ2VyKTtcblx0fSBlbHNlIHtcblx0XHQvLyBPbGQgSUUgc3VwcG9ydFxuXHRcdHdpbmRvdy5hdHRhY2hFdmVudCgnb25zY3JvbGwnLCBzY3JvbGxNb25pdG9yTGlzdGVuZXIpO1xuXHRcdHdpbmRvdy5hdHRhY2hFdmVudCgnb25yZXNpemUnLCBkZWJvdW5jZWRSZWNhbGN1YXRlQW5kVHJpZ2dlcik7XG5cdH1cblxuXHRleHBvcnRzLmJlZ2V0ID0gZXhwb3J0cy5jcmVhdGUgPSBmdW5jdGlvbiggZWxlbWVudCwgb2Zmc2V0cyApIHtcblx0XHRpZiAodHlwZW9mIGVsZW1lbnQgPT09ICdzdHJpbmcnKSB7XG5cdFx0XHRlbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihlbGVtZW50KTtcblx0XHR9IGVsc2UgaWYgKGVsZW1lbnQgJiYgZWxlbWVudC5sZW5ndGggPiAwKSB7XG5cdFx0XHRlbGVtZW50ID0gZWxlbWVudFswXTtcblx0XHR9XG5cblx0XHR2YXIgd2F0Y2hlciA9IG5ldyBFbGVtZW50V2F0Y2hlciggZWxlbWVudCwgb2Zmc2V0cyApO1xuXHRcdHdhdGNoZXJzLnB1c2god2F0Y2hlcik7XG5cdFx0d2F0Y2hlci51cGRhdGUoKTtcblx0XHRyZXR1cm4gd2F0Y2hlcjtcblx0fTtcblxuXHRleHBvcnRzLnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdGxhdGVzdEV2ZW50ID0gbnVsbDtcblx0XHRjYWxjdWxhdGVWaWV3cG9ydCgpO1xuXHRcdHVwZGF0ZUFuZFRyaWdnZXJXYXRjaGVycygpO1xuXHR9O1xuXHRleHBvcnRzLnJlY2FsY3VsYXRlTG9jYXRpb25zID0gZnVuY3Rpb24oKSB7XG5cdFx0ZXhwb3J0cy5kb2N1bWVudEhlaWdodCA9IDA7XG5cdFx0ZXhwb3J0cy51cGRhdGUoKTtcblx0fTtcblxuXHRyZXR1cm4gZXhwb3J0cztcbn0pO1xuIiwiaW1wb3J0IENvbXBvbmVudCBmcm9tICdjb21wb25lbnQtbG9hZGVyLWpzL2Rpc3QvZXM1L2NvbXBvbmVudCc7XG5cbmNsYXNzIERva2kgZXh0ZW5kcyBDb21wb25lbnQge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlciguLi5hcmd1bWVudHMpO1xuXHRcdGNvbnNvbGUubG9nKCduZXcgRE9LSSA0MCcpO1xuXHR9XG5cblx0ZGVzdHJveSgpIHtcblx0XHRzdXBlci5kZXN0cm95KCk7XG5cdFx0Y29uc29sZS5sb2coJ2Rlc3Ryb3kgRE9LSScpO1xuXHR9XG59XG5cbmV4cG9ydCBkZWZhdWx0IERva2k7IiwiaW1wb3J0IENvbXBvbmVudCBmcm9tICdjb21wb25lbnQtbG9hZGVyLWpzL2Rpc3QvZXM1L2NvbXBvbmVudCc7XG5pbXBvcnQgYW5pbWF0aW9uRW5kRXZlbnQgZnJvbSAnLi4vdXRpbHMvYW5pbWF0aW9uLWVuZC1ldmVudCc7XG5pbXBvcnQgc2Nyb2xsU3RhdGUsIHtFVkVOVF9TQ1JPTExfRlJBTUV9IGZyb20gJy4uL3V0aWxzL3Njcm9sbC1zdGF0ZSc7XG5cbi8qKlxuXHRTdGlja3kgTmF2IGNvbXBvbmVudFxuXG5cdExpc3RlbnMgdG8gc2Nyb2xsIGV2ZW50cyBmcm9tIHV0aWxzLlNjcm9sbFN0YXRlXG5cblx0LSBBZGRzIENMQVNTX0xPQ0tFRCB3aGVuIHBhc3NpbmcgTE9DS19USFJFU0hPTERcblx0LSBBZGRzIENMQVNTX0JBQ0tHUk9VTkQgd2hlbiBwYXNzaW5nIF9nZXRCYWNrZ3JvdW5kVGhyZXNob2xkKClcblx0LSBBZGRzIENMQVNTX0hJRERFTiBpZiB2aXNpYmxlIGFuZCBzY3JvbGxpbmcgZG93biB3aXRoIGVub3VnaCBzcGVlZFxuXHQtIEFkZHMgQ0xBU1NfVklTSUJMRSBpZiBzY3JvbGxpbmcgdXAgYW5kIGhpZGRlblxuKi9cblxuXG5jb25zdCBDTEFTU19ISURERU4gPSAnU3RpY2t5TmF2LS1oaWRkZW4nO1xuY29uc3QgQ0xBU1NfVklTSUJMRSA9ICdTdGlja3lOYXYtLXZpc2libGUnO1xuY29uc3QgQ0xBU1NfTE9DS0VEID0gJ1N0aWNreU5hdi0tbG9ja2VkJztcbmNvbnN0IENMQVNTX0JBQ0tHUk9VTkQgPSAnU3RpY2t5TmF2LS1iYWNrZ3JvdW5kJztcblxuLy8gcHggZnJvbSB0b3Agb2YgZG9jdW1lbnQgd2hlcmUgJ2xvY2tlZCcgY2xhc3MgaXMgYWRkZWQgKGluY2x1c2l2ZSlcbmNvbnN0IExPQ0tfVEhSRVNIT0xEID0gMDtcbmNvbnN0IEJHX1RIUkVTSE9MRCA9IDEwMDtcbmNvbnN0IEhJREVfVEhSRVNIT0xEID0gNTAwO1xuXG4vLyBTcGVlZC9EaXN0YW5jZSByZXF1aXJlZCB0byBjaGFuZ2UgYXBwZWFyYW5jZSBwZXIgc2Nyb2xsIGZyYW1lXG5jb25zdCBNSU5fU0NST0xMX1NQRUVEID0gNTAwO1xuLy8gY29uc3QgTUlOX1NDUk9MTF9ESVNUQU5DRSA9IDIwO1xuXG5cbmNsYXNzIFN0aWNreU5hdiBleHRlbmRzIENvbXBvbmVudCB7XG5cblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoLi4uYXJndW1lbnRzKTtcblx0XHR0aGlzLiRkb2N1bWVudCA9ICQoZG9jdW1lbnQpO1xuXHRcdHRoaXMuaXNIaWRkZW4gPSBmYWxzZTtcblx0XHR0aGlzLmlzTG9ja2VkID0gZmFsc2U7XG5cdFx0dGhpcy5oYXNCYWNrZ3JvdW5kID0gZmFsc2U7XG5cdFx0dGhpcy5pc0J1c3lDaGVja2luZyA9IGZhbHNlO1xuXG5cdFx0dGhpcy5vblN0YXRlQ2hhbmdlZCA9IHRoaXMub25TdGF0ZUNoYW5nZWQuYmluZCh0aGlzKTtcblx0XHR0aGlzLmNoZWNrTG9ja1RocmVhc2hvbGQgPSB0aGlzLmNoZWNrTG9ja1RocmVhc2hvbGQuYmluZCh0aGlzKTtcblx0XHR0aGlzLmNoZWNrQXBwZWFyYW5jZSA9IHRoaXMuY2hlY2tBcHBlYXJhbmNlLmJpbmQodGhpcyk7XG5cblx0XHR0aGlzLmluaXQoKTtcblxuXHRcdHRoaXMuZGVmZXIoKCkgPT4ge1xuXHRcdFx0Ly8gcGF1c2UgYW5kIHdhaXQgZm9yIEhlcm8gY29tcG9uZW50IHRvIGJlIGluaXRpYWxpemVkIGZpcnN0XG5cdFx0XHR0aGlzLiRlbC5jc3MoJ3Zpc2liaWxpdHknLCAndmlzaWJsZScpO1xuXHRcdH0pO1xuXHR9XG5cblxuXHRpbml0KCkge1xuXHRcdHNjcm9sbFN0YXRlLnN1YnNjcmliZShFVkVOVF9TQ1JPTExfRlJBTUUsIHRoaXMub25TdGF0ZUNoYW5nZWQpO1xuXHRcdC8vIHRoaXMuc3Vic2NyaWJlKEVudW1zLkFDVElPTl9TVElDS1lfTkFWX1NIT1dfQkFDS0dST1VORCwgdGhpcy5hZGRCYWNrZ3JvdW5kKTtcblx0XHQvLyB0aGlzLnN1YnNjcmliZShFbnVtcy5BQ1RJT05fU1RJQ0tZX05BVl9ISURFX0JBQ0tHUk9VTkQsIHRoaXMucmVtb3ZlQmFja2dyb3VuZCk7XG5cdFx0Ly8gdGhpcy5tb2JpbGVCcmVha3BvaW50ID0gQnJlYWtwb2ludHMub24oe1xuXHRcdC8vIFx0bmFtZTogXCJCUkVBS1BPSU5UX1NNQUxMXCJcblx0XHQvLyB9KTtcblx0fVxuXG5cblx0b25TdGF0ZUNoYW5nZWQoc3RhdGUpIHtcblx0XHRpZiAoIXRoaXMuaXNCdXN5Q2hlY2tpbmcpIHtcblx0XHRcdHRoaXMuaXNCdXN5Q2hlY2tpbmcgPSB0cnVlO1xuXHRcdFx0dGhpcy5jaGVja0xvY2tUaHJlYXNob2xkKHN0YXRlKTtcblx0XHRcdHRoaXMuY2hlY2tCYWNrZ3JvdW5kVGhyZWFzaG9sZChzdGF0ZSk7XG5cdFx0XHR0aGlzLmNoZWNrQXBwZWFyYW5jZShzdGF0ZSk7XG5cdFx0XHR0aGlzLmlzQnVzeUNoZWNraW5nID0gZmFsc2U7XG5cdFx0fVxuXHR9XG5cblxuXHRfZ2V0QmFja2dyb3VuZFRocmVzaG9sZCgpIHtcblx0XHQvLyBpZiAodGhpcy5tb2JpbGVCcmVha3BvaW50LmlzTWF0Y2hlZCkge1xuXHRcdC8vIFx0cmV0dXJuIDE7IC8vc3dpdGNoIGJnIGFzIHNvb24gYXMgd2Ugc3RhcnQgc2Nyb2xsaW5nIChzY3JvbGw9MCBuZWVkcyB0cmFuc3BhcmVuY3kgb24gbWFwKVxuXHRcdC8vIH1cblx0XHRyZXR1cm4gQkdfVEhSRVNIT0xEICsgMTsgLy8gd2FpdCB1bnRpbCBwYXNzaW5nIHRocmVhc2hvbGRcblx0fVxuXG5cblx0c2hvdygpIHtcblx0XHRpZiAodGhpcy5pc0hpZGRlbikge1xuXHRcdFx0dGhpcy4kZWwuYWRkQ2xhc3MoQ0xBU1NfVklTSUJMRSkucmVtb3ZlQ2xhc3MoQ0xBU1NfSElEREVOKTtcblx0XHRcdHRoaXMuaXNIaWRkZW4gPSBmYWxzZTtcblx0XHRcdHRoaXMuJGVsLm9uZShhbmltYXRpb25FbmRFdmVudCwgKCkgPT4ge1xuXHRcdFx0XHR0aGlzLiRlbC5yZW1vdmVDbGFzcyhDTEFTU19WSVNJQkxFKTtcblx0XHRcdH0pO1xuXHRcdH1cblx0fVxuXG5cblx0aGlkZSgpIHtcblx0XHRpZiAoIXRoaXMuaXNIaWRkZW4pIHtcblx0XHRcdGNvbnNvbGUubG9nKCdoaWRlIScpO1xuXHRcdFx0dGhpcy4kZWwuYWRkQ2xhc3MoQ0xBU1NfSElEREVOKS5yZW1vdmVDbGFzcyhDTEFTU19WSVNJQkxFKTtcblx0XHRcdHRoaXMuaXNIaWRkZW4gPSB0cnVlO1xuXHRcdH1cblx0fVxuXG5cblx0bG9jaygpIHtcblx0XHRpZiAoIXRoaXMuaXNMb2NrZWQpIHtcblx0XHRcdHRoaXMuJGVsLmFkZENsYXNzKENMQVNTX0xPQ0tFRClcblx0XHRcdHRoaXMuaXNMb2NrZWQgPSB0cnVlO1xuXHRcdH1cblx0fVxuXG5cblx0dW5sb2NrKCkge1xuXHRcdGlmICh0aGlzLmlzTG9ja2VkKSB7XG5cdFx0XHR0aGlzLiRlbC5yZW1vdmVDbGFzcyhDTEFTU19MT0NLRUQpXG5cdFx0XHR0aGlzLmlzTG9ja2VkID0gZmFsc2U7XG5cdFx0fVxuXHR9XG5cblxuXHRhZGRCYWNrZ3JvdW5kKCkge1xuXHRcdGlmICghdGhpcy5oYXNCYWNrZ3JvdW5kKSB7XG5cdFx0XHR0aGlzLiRlbC5hZGRDbGFzcyhDTEFTU19CQUNLR1JPVU5EKVxuXHRcdFx0dGhpcy5oYXNCYWNrZ3JvdW5kID0gdHJ1ZTtcblx0XHR9XG5cdH1cblxuXG5cdHJlbW92ZUJhY2tncm91bmQoKSB7XG5cdFx0aWYgKHRoaXMuaGFzQmFja2dyb3VuZCkge1xuXHRcdFx0dGhpcy4kZWwucmVtb3ZlQ2xhc3MoQ0xBU1NfQkFDS0dST1VORClcblx0XHRcdHRoaXMuaGFzQmFja2dyb3VuZCA9IGZhbHNlO1xuXHRcdH1cblx0fVxuXG5cblx0aXNBYm92ZVZpc2libGVUaHJlc2hvbGQoc3RhdGUpIHtcblx0XHRyZXR1cm4gc3RhdGUudmlld3BvcnRUb3AgPD0gSElERV9USFJFU0hPTEQ7XG5cdH1cblxuXG5cdGNoZWNrTG9ja1RocmVhc2hvbGQoc3RhdGUpIHtcblx0XHRpZiAoc3RhdGUudmlld3BvcnRUb3AgPj0gTE9DS19USFJFU0hPTEQpIHtcblx0XHRcdHRoaXMubG9jaygpO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHRoaXMudW5sb2NrKCk7XG5cdFx0fVxuXHR9XG5cblxuXHRjaGVja0JhY2tncm91bmRUaHJlYXNob2xkKHN0YXRlKSB7XG5cdFx0aWYgKHN0YXRlLnZpZXdwb3J0VG9wID49IHRoaXMuX2dldEJhY2tncm91bmRUaHJlc2hvbGQoKSkge1xuXHRcdFx0dGhpcy5hZGRCYWNrZ3JvdW5kKCk7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0dGhpcy5yZW1vdmVCYWNrZ3JvdW5kKCk7XG5cdFx0fVxuXHR9XG5cblxuXHRjaGVja0FwcGVhcmFuY2Uoc3RhdGUpIHtcblx0XHQvLyBzY3JvbGxlZCB0byB0aGUgdmVyeSB0b3Agb3IgYm90dG9tOyBlbGVtZW50IHNsaWRlcyBpblxuXHRcdGlmICh0aGlzLmlzQWJvdmVWaXNpYmxlVGhyZXNob2xkKHN0YXRlKSB8fCBzdGF0ZS5pc1Njcm9sbGVkVG9Cb3R0b20pIHtcblx0XHRcdHRoaXMuc2hvdygpO1xuXHRcdH1cblx0XHRlbHNlIGlmIChzdGF0ZS5pc1Njcm9sbGluZ0Rvd24pIHtcblx0XHRcdHRoaXMuaGlkZSgpO1xuXHRcdH1cblx0XHQvLyBlbHNlIGlmIHNjcm9sbGluZyB1cCB3aXRoIGVub3VnaCBzcGVlZFxuXHRcdGVsc2UgaWYgKHN0YXRlLnNjcm9sbFNwZWVkID4gTUlOX1NDUk9MTF9TUEVFRCkge1xuXHRcdFx0dGhpcy5zaG93KCk7XG5cdFx0fVxuXHR9XG5cblxuXHRkZXN0cm95KCkge1xuXHRcdHRoaXMuc2hvdygpO1xuXHRcdHNjcm9sbFN0YXRlLnVuc3Vic2NyaWJlKEVWRU5UX1NDUk9MTF9GUkFNRSwgdGhpcy5vblN0YXRlQ2hhbmdlZCk7XG5cdFx0Ly8gdGhpcy51bnN1YnNjcmliZShFbnVtcy5BQ1RJT05fU1RJQ0tZX05BVl9TSE9XX0JBQ0tHUk9VTkQsIHRoaXMuYWRkQmFja2dyb3VuZCk7XG5cdFx0Ly8gdGhpcy51bnN1YnNjcmliZShFbnVtcy5BQ1RJT05fU1RJQ0tZX05BVl9ISURFX0JBQ0tHUk9VTkQsIHRoaXMucmVtb3ZlQmFja2dyb3VuZCk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTdGlja3lOYXY7XG4iLCIvLyBpbXBvcnQgJ2JhYmVsLXBvbHlmaWxsJztcblxuaW1wb3J0IENvbXBvbmVudExvYWRlciBmcm9tICdjb21wb25lbnQtbG9hZGVyLWpzL2Rpc3QvZXM1L2NvbXBvbmVudC1sb2FkZXInO1xuXG5pbXBvcnQgRG9raSBmcm9tICcuL2NvbXBvbmVudHMvZG9raSc7XG5pbXBvcnQgU3RpY2t5TmF2IGZyb20gJy4vY29tcG9uZW50cy9zdGlja3ktbmF2JztcblxuXG5uZXcgQ29tcG9uZW50TG9hZGVyKHtcblx0RG9raSxcblx0U3RpY2t5TmF2XG59KS5zY2FuKCk7XG5cbiIsIi8qXG5cdFJldHVybnMgdGhlIGJyb3dzZXIgcHJlZml4ZWRcblx0c3RyaW5nIGZvciB0aGUgYW5pbWF0aW9uIGVuZCBldmVudFxuKi9cbmV4cG9ydCBkZWZhdWx0ICgoKSA9PiB7XG5cdGxldCB0ID0gdW5kZWZpbmVkO1xuXHRsZXQgZXZlbnROYW1lO1xuXHRjb25zdCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHRjb25zdCBhbmltYXRpb25OYW1lcyA9IHtcblx0XHQnV2Via2l0QW5pbWF0aW9uJzogJ3dlYmtpdEFuaW1hdGlvbkVuZCcsXG5cdFx0J01vekFuaW1hdGlvbic6ICdhbmltYXRpb25lbmQnLFxuXHRcdCdPQW5pbWF0aW9uJzogJ29BbmltYXRpb25FbmQgb2FuaW1hdGlvbmVuZCcsXG5cdFx0J2FuaW1hdGlvbic6ICdhbmltYXRpb25lbmQnXG5cdH07XG5cdE9iamVjdC5rZXlzKGFuaW1hdGlvbk5hbWVzKS5mb3JFYWNoKCAodCkgPT4ge1xuXHRcdGlmIChlbC5zdHlsZVt0XSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRldmVudE5hbWUgPSBhbmltYXRpb25OYW1lc1t0XTtcblx0XHR9XG5cdH0pO1xuXHRyZXR1cm4gZXZlbnROYW1lO1xufSkoKTtcbiIsImV4cG9ydCBkZWZhdWx0IChmdW5jLCB0aHJlc2hvbGQsIGV4ZWNBc2FwKSA9PiB7XG5cdGxldCB0aW1lb3V0O1xuXG5cdHJldHVybiAoKSA9PiB7XG5cdFx0bGV0IG9iaiA9IHRoaXMsIGFyZ3MgPSBhcmd1bWVudHM7XG5cblx0XHRsZXQgZGVsYXllZCA9ICgpID0+IHtcblx0XHRcdGlmICghZXhlY0FzYXApIHtcblx0XHRcdFx0ZnVuYy5hcHBseShvYmosIGFyZ3MpO1xuXHRcdFx0fVxuXHRcdFx0dGltZW91dCA9IG51bGw7XG5cdFx0fVxuXG5cdFx0aWYgKHRpbWVvdXQpIHtcblx0XHRcdGNsZWFyVGltZW91dCh0aW1lb3V0KTtcblx0XHR9IGVsc2UgaWYgKGV4ZWNBc2FwKSB7XG5cdFx0XHRmdW5jLmFwcGx5KG9iaiwgYXJncyk7XG5cdFx0fVxuXG5cdFx0dGltZW91dCA9IHNldFRpbWVvdXQoZGVsYXllZCwgdGhyZXNob2xkIHx8IDEwMCk7XG5cdH1cbn0iLCJpbXBvcnQgZGVib3VuY2UgZnJvbSAnLi9kZWJvdW5jZSc7XG5pbXBvcnQgc2Nyb2xsTW9uaXRvciBmcm9tICdzY3JvbGxNb25pdG9yJztcblxuLyoqXG4gKiBTY3JvbGwgU3RhdGUgQWJzdHJhY3Rpb25cbiAqXG4gKiBIb2xkcyBpbmZvIGFib3V0IHNjcm9sbCBwb3NpdGlvbiwgc3BlZWQsIGRpcmVjdGlvbiwgZG9jdW1lbnQgLyB2aWV3cG9ydCBzaXplLCBldGNcbiAqXG4gKiBUcmlnZ2VycyBldmVudHMgZm9yXG4gKiAgIC0gU2Nyb2xsIFN0YXJ0XG4gKiAgIC0gU2Nyb2xsIFN0b3BcbiAqICAgLSBFYWNoIHNjcm9sbCBmcmFtZSB3aGlsZSBzY3JvbGxpbmdcbiAqL1xuY29uc3QgJGRvY3VtZW50ID0gJChkb2N1bWVudCk7XG5jb25zdCAkd2luZG93ID0gJCh3aW5kb3cpO1xuXG5leHBvcnQgY29uc3QgRVZFTlRfU0NST0xMX1NUQVJUID0gJ3Njcm9sbHN0YXRlOnN0YXJ0JztcbmV4cG9ydCBjb25zdCBFVkVOVF9TQ1JPTExfU1RPUCAgPSAnc2Nyb2xsc3RhdGU6c3RvcCc7XG5leHBvcnQgY29uc3QgRVZFTlRfU0NST0xMX0ZSQU1FID0gJ3Njcm9sbHN0YXRlOmZyYW1lJztcblxuY2xhc3MgU2Nyb2xsU3RhdGUge1xuXG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHRoaXMudXBkYXRpbmcgID0gZmFsc2U7XG5cdFx0dGhpcy5sYXRlc3RGcmFtZSA9IERhdGUubm93KCk7XG5cblx0XHR0aGlzLnNjcm9sbERpZmYgICAgICAgICAgPSAwOyAgLy8gZGVsdGEgZnJvbSBsYXN0IHNjcm9sbCBwb3NpdGlvblxuXHRcdHRoaXMuc2Nyb2xsRGlzdGFuY2UgICAgICA9IDA7ICAvLyBhYnNvbHV0ZSBkZWx0YVxuXHRcdHRoaXMuc2Nyb2xsRGlyZWN0aW9uICAgICA9IDA7ICAvLyAtMSwgMCwgb3IgMVxuXHRcdHRoaXMubXNTaW5jZUxhdGVzdENoYW5nZSA9IDA7XG5cdFx0dGhpcy5zY3JvbGxTcGVlZCAgICAgICAgID0gMDsgIC8vIHBpeGVscyAvIHNlY29uZCBmb3IgbGF0ZXN0IGZyYW1lXG5cdFx0dGhpcy5kb2N1bWVudEhlaWdodCAgICAgID0gdW5kZWZpbmVkO1xuXHRcdHRoaXMudmlld3BvcnRIZWlnaHQgICAgICA9IHVuZGVmaW5lZDtcblx0XHR0aGlzLnZpZXdwb3J0VG9wICAgICAgICAgPSAwO1xuXHRcdHRoaXMudmlld3BvcnRCb3R0b20gICAgICA9IHVuZGVmaW5lZDtcblx0XHR0aGlzLmlzU2Nyb2xsaW5nVXAgICAgICAgPSB1bmRlZmluZWQ7XG5cdFx0dGhpcy5pc1Njcm9sbGluZ0Rvd24gICAgID0gdW5kZWZpbmVkO1xuXHRcdHRoaXMuaXNTY3JvbGxlZFRvVG9wICAgICA9IHVuZGVmaW5lZDtcblx0XHR0aGlzLmlzU2Nyb2xsZWRUb0JvdHRvbSAgPSB1bmRlZmluZWQ7XG5cblx0XHR0aGlzLmNhbGxiYWNrcyA9IHt9O1xuXG5cdFx0dGhpcy51cGRhdGVTdGF0ZSgpO1xuXHRcdHRoaXMub25TY3JvbGxTdGFydERlYm91bmNlZCA9IGRlYm91bmNlKHRoaXMuX29uU2Nyb2xsU3RhcnQuYmluZCh0aGlzKSwgNTAwLCB0cnVlKTtcblx0XHR0aGlzLm9uU2Nyb2xsU3RvcERlYm91bmNlZCA9IGRlYm91bmNlKHRoaXMuX29uU2Nyb2xsU3RvcC5iaW5kKHRoaXMpLCA1MDApO1xuXG5cdFx0dGhpcy5fYWRkRXZlbnRMaXN0ZW5lcnMoKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBNZWRpYXRvciBmdW5jdGlvbmFsaXR5LlxuXHQgKiBTdG9yZXMgdGhlIGV2ZW50IGFuZCBjYWxsYmFjayBnaXZlbiBieSB0aGUgY29tcG9uZW50LlxuXHQgKiBmb3IgZnVydGhlciByZWZlcmVuY2UuXG5cdCAqIEBwYXJhbSAge1N0cmluZ30gZXZlbnQgICAgICBldmVudCBzdHJpbmdcblx0ICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrIENhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgd291bGQgYmUgdHJpZ2dlcmVkLlxuXHQgKi9cblx0c3Vic2NyaWJlKGV2ZW50LCBjYWxsYmFjaywgY29udGV4dCkge1xuXG5cdFx0Ly8gSXMgdGhpcyBhIG5ldyBldmVudD9cblx0XHRpZiAoICF0aGlzLmNhbGxiYWNrcy5oYXNPd25Qcm9wZXJ0eShldmVudCkgKSB7XG5cdFx0XHR0aGlzLmNhbGxiYWNrc1tldmVudF0gPSBbXTtcblx0XHR9XG5cblx0XHQvLyBTdG9yZSB0aGUgc3Vic2NyaWJlciBjYWxsYmFja1xuXHRcdHRoaXMuY2FsbGJhY2tzW2V2ZW50XS5wdXNoKCB7IGNvbnRleHQ6IGNvbnRleHQsIGNhbGxiYWNrOiBjYWxsYmFjayB9ICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBNZWRpYXRvciBmdW5jdGlvbmFsaXR5LlxuXHQgKiBSZW1vdmVzIHRoZSBzdG9yZWQgZXZlbnQgYW5kIGNhbGxiYWNrIGdpdmVuIGJ5IHRoZSBjb21wb25lbnQuXG5cdCAqIEBwYXJhbSAge1N0cmluZ30gICBldmVudCAgICBldmVudCBzdHJpbmdcblx0ICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrIENhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgd291bGQgYmUgdHJpZ2dlcmVkLlxuXHQgKiBAcmV0dXJuIHtCb29sZWFufSAgICAgICAgICAgIFRydWUgb24gc3VjY2VzcywgRmFsc2Ugb3RoZXJ3aXNlLlxuXHQgKi9cblx0dW5zdWJzY3JpYmUoZXZlbnQsIGNhbGxiYWNrKSB7XG5cdFx0Ly8gRG8gd2UgaGF2ZSB0aGlzIGV2ZW50P1xuXHRcdGlmICghdGhpcy5jYWxsYmFja3MuaGFzT3duUHJvcGVydHkoZXZlbnQpKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Ly8gRmluZCBvdXQgd2hlcmUgdGhpcyBpcyBhbmQgcmVtb3ZlIGl0XG5cdFx0Zm9yIChsZXQgaSA9IDAsIGxlbiA9IHRoaXMuY2FsbGJhY2tzW2V2ZW50XS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0aWYgKHRoaXMuY2FsbGJhY2tzW2V2ZW50XVtpXS5jYWxsYmFjayA9PT0gY2FsbGJhY2spIHtcblx0XHRcdFx0dGhpcy5jYWxsYmFja3NbZXZlbnRdLnNwbGljZShpLCAxKTtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0LyoqXG5cdCAqIFtwdWJsaXNoIGRlc2NyaXB0aW9uXVxuXHQgKiBAcGFyYW0gIHtbdHlwZV19IGV2ZW50IFtkZXNjcmlwdGlvbl1cblx0ICogQHJldHVybiB7W3R5cGVdfSAgICAgICBbZGVzY3JpcHRpb25dXG5cdCAqL1xuXHRfcHVibGlzaChldmVudCkge1xuXHRcdC8vIENoZWNrIGlmIHdlIGhhdmUgc3ViY3JpYmVycyB0byB0aGlzIGV2ZW50XG5cdFx0aWYgKCF0aGlzLmNhbGxiYWNrcy5oYXNPd25Qcm9wZXJ0eShldmVudCkpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBkb24ndCBzbGljZSBvbiBhcmd1bWVudHMgYmVjYXVzZSBpdCBwcmV2ZW50cyBvcHRpbWl6YXRpb25zIGluIEphdmFTY3JpcHQgZW5naW5lcyAoVjggZm9yIGV4YW1wbGUpXG5cdFx0Ly8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4vZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvRnVuY3Rpb25zL2FyZ3VtZW50c1xuXHRcdC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9wZXRrYWFudG9ub3YvYmx1ZWJpcmQvd2lraS9PcHRpbWl6YXRpb24ta2lsbGVycyMzMi1sZWFraW5nLWFyZ3VtZW50c1xuXHRcdGNvbnN0IGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7ICsraSkge1xuXHRcdFx0XHRhcmdzW2ldID0gYXJndW1lbnRzW2kgKyAxXTsgLy8gcmVtb3ZlIGZpcnN0IGFyZ3VtZW50XG5cdFx0fVxuXG5cdFx0Ly8gTG9vcCB0aHJvdWdoIHRoZW0gYW5kIGZpcmUgdGhlIGNhbGxiYWNrc1xuXHRcdGZvciAobGV0IGkgPSAwLCBsZW4gPSB0aGlzLmNhbGxiYWNrc1tldmVudF0ubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdGxldCBzdWJzY3JpcHRpb24gPSB0aGlzLmNhbGxiYWNrc1tldmVudF1baV07XG5cdFx0XHQvLyBDYWxsIGl0J3MgY2FsbGJhY2tcblx0XHRcdGlmIChzdWJzY3JpcHRpb24uY2FsbGJhY2spIHtcblx0XHRcdFx0c3Vic2NyaXB0aW9uLmNhbGxiYWNrLmFwcGx5KHN1YnNjcmlwdGlvbi5jb250ZXh0LCBhcmdzKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxuXG5cdGRlc3Ryb3koKSB7XG5cdFx0dGhpcy5fcmVtb3ZlRXZlbnRMaXN0ZW5lcnMoKTtcblx0fVxuXG5cdF9hZGRFdmVudExpc3RlbmVycygpIHtcblx0XHQkd2luZG93Lm9uKCdzY3JvbGwnLCB0aGlzLm9uU2Nyb2xsU3RhcnREZWJvdW5jZWQpO1xuXHRcdCR3aW5kb3cub24oJ3Njcm9sbCcsIHRoaXMub25TY3JvbGxTdG9wRGVib3VuY2VkKTtcblx0XHQkd2luZG93Lm9uKCdzY3JvbGwnLCB0aGlzLnVwZGF0ZVN0YXRlLmJpbmQodGhpcykpO1xuXHR9XG5cblx0X3JlbW92ZUV2ZW50TGlzdGVuZXJzKCkge1xuXHRcdCR3aW5kb3cub2ZmKCdzY3JvbGwnLCB0aGlzLm9uU2Nyb2xsU3RhcnREZWJvdW5jZWQpO1xuXHRcdCR3aW5kb3cub2ZmKCdzY3JvbGwnLCB0aGlzLm9uU2Nyb2xsU3RvcERlYm91bmNlZCk7XG5cdFx0JHdpbmRvdy5vZmYoJ3Njcm9sbCcsIHRoaXMudXBkYXRlU3RhdGUudW5iaW5kKHRoaXMpKTtcblx0fVxuXG5cdF9vblNjcm9sbFN0YXJ0KCkge1xuXHRcdHRoaXMuX3B1Ymxpc2goRVZFTlRfU0NST0xMX1NUQVJULCB0aGlzKTtcblx0fVxuXG5cdF9vblNjcm9sbFN0b3AoKSB7XG5cdFx0dGhpcy5fcHVibGlzaChFVkVOVF9TQ1JPTExfU1RPUCwgdGhpcyk7XG5cdH1cblxuXHR1cGRhdGVTdGF0ZSgpIHtcblx0XHRpZiAodGhpcy51cGRhdGluZykgcmV0dXJuO1xuXHRcdHRoaXMudXBkYXRpbmcgPSB0cnVlO1xuXG5cdFx0dmFyIG5vdyA9IERhdGUubm93KCk7XG5cblx0XHQvLyBkaXN0YW5jZSBhbmQgc3BlZWQgY2FsY3Ncblx0XHR0aGlzLnNjcm9sbERpZmYgID0gdGhpcy52aWV3cG9ydFRvcCAtIHNjcm9sbE1vbml0b3Iudmlld3BvcnRUb3A7XG5cdFx0dGhpcy5zY3JvbGxEaXN0YW5jZSAgPSBNYXRoLmFicyh0aGlzLnNjcm9sbERpZmYpO1xuXHRcdHRoaXMuc2Nyb2xsRGlyZWN0aW9uID0gTWF0aC5tYXgoLTEsIE1hdGgubWluKDEsIHRoaXMuc2Nyb2xsRGlmZikpO1xuXHRcdHRoaXMubXNTaW5jZUxhdGVzdENoYW5nZSA9IChub3cgLSB0aGlzLmxhdGVzdEZyYW1lKTtcblx0XHR0aGlzLnNjcm9sbFNwZWVkID0gdGhpcy5zY3JvbGxEaXN0YW5jZSAvIHRoaXMubXNTaW5jZUxhdGVzdENoYW5nZSAqIDEwMDA7XG5cblx0XHQvLyB2aWV3cG9ydFxuXHRcdHRoaXMuZG9jdW1lbnRIZWlnaHQgPSBzY3JvbGxNb25pdG9yLmRvY3VtZW50SGVpZ2h0O1xuXHRcdHRoaXMudmlld3BvcnRIZWlnaHQgPSBzY3JvbGxNb25pdG9yLnZpZXdwb3J0SGVpZ2h0O1xuXHRcdHRoaXMudmlld3BvcnRUb3AgICAgPSBzY3JvbGxNb25pdG9yLnZpZXdwb3J0VG9wO1xuXHRcdHRoaXMudmlld3BvcnRCb3R0b20gPSBzY3JvbGxNb25pdG9yLnZpZXdwb3J0Qm90dG9tO1xuXG5cdFx0Ly8gaGVscGVyc1xuXHRcdHRoaXMuaXNTY3JvbGxpbmdVcCA9IHRoaXMuc2Nyb2xsRGlyZWN0aW9uID4gMDtcblx0XHR0aGlzLmlzU2Nyb2xsaW5nRG93biA9IHRoaXMuc2Nyb2xsRGlyZWN0aW9uIDwgMDtcblx0XHR0aGlzLmlzU2Nyb2xsZWRUb1RvcCA9IHRoaXMudmlld3BvcnRUb3AgPD0gMDtcblx0XHR0aGlzLmlzU2Nyb2xsZWRUb0JvdHRvbSA9IHRoaXMudmlld3BvcnRCb3R0b20gPj0gdGhpcy5kb2N1bWVudEhlaWdodDtcblxuXHRcdHRoaXMubGF0ZXN0RnJhbWUgPSBub3c7XG5cblx0XHR0aGlzLl9wdWJsaXNoKEVWRU5UX1NDUk9MTF9GUkFNRSwgdGhpcyk7XG5cblx0XHR0aGlzLnVwZGF0aW5nID0gZmFsc2U7XG5cdH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgbmV3IFNjcm9sbFN0YXRlKClcbiJdfQ==
