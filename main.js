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
var BG_THRESHOLD = 200;
var HIDE_THRESHOLD = 800;

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
			_scrollState2.default.subscribe(_scrollState2.default.EVENT_SCROLL_FRAME, this.onStateChanged);
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
				console.log('show!');
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
			_scrollState2.default.unsubscribe(_scrollState2.default.EVENT_SCROLL_FRAME, this.onStateChanged);
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

var ScrollState = function () {
	function ScrollState() {
		_classCallCheck(this, ScrollState);

		// Any way to export static class constants with ES6? These event names should be packaged with the module.
		this.EVENT_SCROLL_START = 'scrollstate:start';
		this.EVENT_SCROLL_STOP = 'scrollstate:stop';
		this.EVENT_SCROLL_FRAME = 'scrollstate:frame';

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
			this._publish(this.EVENT_SCROLL_START, this);
		}
	}, {
		key: '_onScrollStop',
		value: function _onScrollStop() {
			this._publish(this.EVENT_SCROLL_STOP, this);
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

			this._publish(this.EVENT_SCROLL_FRAME, this);

			this.updating = false;
		}
	}]);

	return ScrollState;
}();

module.exports = new ScrollState();

},{"./debounce":8,"scrollMonitor":3}]},{},[6])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvY29tcG9uZW50LWxvYWRlci1qcy9kaXN0L2VzNS9jb21wb25lbnQtbG9hZGVyLmpzIiwibm9kZV9tb2R1bGVzL2NvbXBvbmVudC1sb2FkZXItanMvZGlzdC9lczUvY29tcG9uZW50LmpzIiwibm9kZV9tb2R1bGVzL3Njcm9sbE1vbml0b3Ivc2Nyb2xsTW9uaXRvci5qcyIsInRoZW1lL2pzL2NvbXBvbmVudHMvZG9raS5qcyIsInRoZW1lL2pzL2NvbXBvbmVudHMvc3RpY2t5LW5hdi5qcyIsInRoZW1lL2pzL21haW4uanMiLCJ0aGVtZS9qcy91dGlscy9hbmltYXRpb24tZW5kLWV2ZW50LmpzIiwidGhlbWUvanMvdXRpbHMvZGVib3VuY2UuanMiLCJ0aGVtZS9qcy91dGlscy9zY3JvbGwtc3RhdGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lDclhNOzs7QUFDTCxVQURLLElBQ0wsR0FBYzt3QkFEVCxNQUNTOztxRUFEVCxrQkFFSyxZQURJOztBQUViLFVBQVEsR0FBUixDQUFZLGFBQVosRUFGYTs7RUFBZDs7Y0FESzs7NEJBTUs7QUFDVCw4QkFQSSw0Q0FPSixDQURTO0FBRVQsV0FBUSxHQUFSLENBQVksY0FBWixFQUZTOzs7O1FBTkw7OztrQkFZUzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNFZixJQUFNLGVBQWUsbUJBQWY7QUFDTixJQUFNLGdCQUFnQixvQkFBaEI7QUFDTixJQUFNLGVBQWUsbUJBQWY7QUFDTixJQUFNLG1CQUFtQix1QkFBbkI7OztBQUdOLElBQU0saUJBQWlCLENBQWpCO0FBQ04sSUFBTSxlQUFlLEdBQWY7QUFDTixJQUFNLGlCQUFpQixHQUFqQjs7O0FBR04sSUFBTSxtQkFBbUIsR0FBbkI7OztJQUlBOzs7QUFFTCxVQUZLLFNBRUwsR0FBYzt3QkFGVCxXQUVTOztxRUFGVCx1QkFHSyxZQURJOztBQUViLFFBQUssU0FBTCxHQUFpQixFQUFFLFFBQUYsQ0FBakIsQ0FGYTtBQUdiLFFBQUssUUFBTCxHQUFnQixLQUFoQixDQUhhO0FBSWIsUUFBSyxRQUFMLEdBQWdCLEtBQWhCLENBSmE7QUFLYixRQUFLLGFBQUwsR0FBcUIsS0FBckIsQ0FMYTtBQU1iLFFBQUssY0FBTCxHQUFzQixLQUF0QixDQU5hOztBQVFiLFFBQUssY0FBTCxHQUFzQixNQUFLLGNBQUwsQ0FBb0IsSUFBcEIsT0FBdEIsQ0FSYTtBQVNiLFFBQUssbUJBQUwsR0FBMkIsTUFBSyxtQkFBTCxDQUF5QixJQUF6QixPQUEzQixDQVRhO0FBVWIsUUFBSyxlQUFMLEdBQXVCLE1BQUssZUFBTCxDQUFxQixJQUFyQixPQUF2QixDQVZhOztBQVliLFFBQUssSUFBTCxHQVphOztBQWNiLFFBQUssS0FBTCxDQUFXLFlBQU07O0FBRWhCLFNBQUssR0FBTCxDQUFTLEdBQVQsQ0FBYSxZQUFiLEVBQTJCLFNBQTNCLEVBRmdCO0dBQU4sQ0FBWCxDQWRhOztFQUFkOztjQUZLOzt5QkF1QkU7QUFDTix5QkFBWSxTQUFaLENBQXNCLHNCQUFZLGtCQUFaLEVBQWdDLEtBQUssY0FBTCxDQUF0RDs7Ozs7O0FBRE07OztpQ0FVUSxPQUFPO0FBQ3JCLE9BQUksQ0FBQyxLQUFLLGNBQUwsRUFBcUI7QUFDekIsU0FBSyxjQUFMLEdBQXNCLElBQXRCLENBRHlCO0FBRXpCLFNBQUssbUJBQUwsQ0FBeUIsS0FBekIsRUFGeUI7QUFHekIsU0FBSyx5QkFBTCxDQUErQixLQUEvQixFQUh5QjtBQUl6QixTQUFLLGVBQUwsQ0FBcUIsS0FBckIsRUFKeUI7QUFLekIsU0FBSyxjQUFMLEdBQXNCLEtBQXRCLENBTHlCO0lBQTFCOzs7OzRDQVV5Qjs7OztBQUl6QixVQUFPLGVBQWUsQ0FBZjtBQUprQjs7O3lCQVFuQjs7O0FBQ04sT0FBSSxLQUFLLFFBQUwsRUFBZTtBQUNsQixZQUFRLEdBQVIsQ0FBWSxPQUFaLEVBRGtCO0FBRWxCLFNBQUssR0FBTCxDQUFTLFFBQVQsQ0FBa0IsYUFBbEIsRUFBaUMsV0FBakMsQ0FBNkMsWUFBN0MsRUFGa0I7QUFHbEIsU0FBSyxRQUFMLEdBQWdCLEtBQWhCLENBSGtCO0FBSWxCLFNBQUssR0FBTCxDQUFTLEdBQVQsOEJBQWdDLFlBQU07QUFDckMsWUFBSyxHQUFMLENBQVMsV0FBVCxDQUFxQixhQUFyQixFQURxQztLQUFOLENBQWhDLENBSmtCO0lBQW5COzs7O3lCQVdNO0FBQ04sT0FBSSxDQUFDLEtBQUssUUFBTCxFQUFlO0FBQ25CLFlBQVEsR0FBUixDQUFZLE9BQVosRUFEbUI7QUFFbkIsU0FBSyxHQUFMLENBQVMsUUFBVCxDQUFrQixZQUFsQixFQUFnQyxXQUFoQyxDQUE0QyxhQUE1QyxFQUZtQjtBQUduQixTQUFLLFFBQUwsR0FBZ0IsSUFBaEIsQ0FIbUI7SUFBcEI7Ozs7eUJBUU07QUFDTixPQUFJLENBQUMsS0FBSyxRQUFMLEVBQWU7QUFDbkIsU0FBSyxHQUFMLENBQVMsUUFBVCxDQUFrQixZQUFsQixFQURtQjtBQUVuQixTQUFLLFFBQUwsR0FBZ0IsSUFBaEIsQ0FGbUI7SUFBcEI7Ozs7MkJBT1E7QUFDUixPQUFJLEtBQUssUUFBTCxFQUFlO0FBQ2xCLFNBQUssR0FBTCxDQUFTLFdBQVQsQ0FBcUIsWUFBckIsRUFEa0I7QUFFbEIsU0FBSyxRQUFMLEdBQWdCLEtBQWhCLENBRmtCO0lBQW5COzs7O2tDQU9lO0FBQ2YsT0FBSSxDQUFDLEtBQUssYUFBTCxFQUFvQjtBQUN4QixTQUFLLEdBQUwsQ0FBUyxRQUFULENBQWtCLGdCQUFsQixFQUR3QjtBQUV4QixTQUFLLGFBQUwsR0FBcUIsSUFBckIsQ0FGd0I7SUFBekI7Ozs7cUNBT2tCO0FBQ2xCLE9BQUksS0FBSyxhQUFMLEVBQW9CO0FBQ3ZCLFNBQUssR0FBTCxDQUFTLFdBQVQsQ0FBcUIsZ0JBQXJCLEVBRHVCO0FBRXZCLFNBQUssYUFBTCxHQUFxQixLQUFyQixDQUZ1QjtJQUF4Qjs7OzswQ0FPdUIsT0FBTztBQUM5QixVQUFPLE1BQU0sV0FBTixJQUFxQixjQUFyQixDQUR1Qjs7OztzQ0FLWCxPQUFPO0FBQzFCLE9BQUksTUFBTSxXQUFOLElBQXFCLGNBQXJCLEVBQXFDO0FBQ3hDLFNBQUssSUFBTCxHQUR3QztJQUF6QyxNQUdLO0FBQ0osU0FBSyxNQUFMLEdBREk7SUFITDs7Ozs0Q0FTeUIsT0FBTztBQUNoQyxPQUFJLE1BQU0sV0FBTixJQUFxQixLQUFLLHVCQUFMLEVBQXJCLEVBQXFEO0FBQ3hELFNBQUssYUFBTCxHQUR3RDtJQUF6RCxNQUdLO0FBQ0osU0FBSyxnQkFBTCxHQURJO0lBSEw7Ozs7a0NBU2UsT0FBTzs7QUFFdEIsT0FBSSxLQUFLLHVCQUFMLENBQTZCLEtBQTdCLEtBQXVDLE1BQU0sa0JBQU4sRUFBMEI7QUFDcEUsU0FBSyxJQUFMLEdBRG9FO0lBQXJFLE1BR0ssSUFBSSxNQUFNLGVBQU4sRUFBdUI7QUFDL0IsU0FBSyxJQUFMLEdBRCtCOzs7QUFBM0IsUUFJQSxJQUFJLE1BQU0sV0FBTixHQUFvQixnQkFBcEIsRUFBc0M7QUFDOUMsVUFBSyxJQUFMLEdBRDhDO0tBQTFDOzs7OzRCQU1JO0FBQ1QsUUFBSyxJQUFMLEdBRFM7QUFFVCx5QkFBWSxXQUFaLENBQXdCLHNCQUFZLGtCQUFaLEVBQWdDLEtBQUssY0FBTCxDQUF4RDs7O0FBRlM7OztRQWpKTDs7O0FBeUpOLE9BQU8sT0FBUCxHQUFpQixTQUFqQjs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ2hMQSw4QkFBb0I7QUFDbkIscUJBRG1CO0FBRW5CLCtCQUZtQjtDQUFwQixFQUdHLElBSEg7Ozs7Ozs7Ozs7Ozs7a0JDSmUsWUFBTztBQUNyQixLQUFJLElBQUksU0FBSixDQURpQjtBQUVyQixLQUFJLHFCQUFKLENBRnFCO0FBR3JCLEtBQU0sS0FBSyxTQUFTLGFBQVQsQ0FBdUIsS0FBdkIsQ0FBTCxDQUhlO0FBSXJCLEtBQU0saUJBQWlCO0FBQ3RCLHFCQUFtQixvQkFBbkI7QUFDQSxrQkFBZ0IsY0FBaEI7QUFDQSxnQkFBYyw2QkFBZDtBQUNBLGVBQWEsY0FBYjtFQUpLLENBSmU7QUFVckIsUUFBTyxJQUFQLENBQVksY0FBWixFQUE0QixPQUE1QixDQUFxQyxVQUFDLENBQUQsRUFBTztBQUMzQyxNQUFJLEdBQUcsS0FBSCxDQUFTLENBQVQsTUFBZ0IsU0FBaEIsRUFBMkI7QUFDOUIsZUFBWSxlQUFlLENBQWYsQ0FBWixDQUQ4QjtHQUEvQjtFQURvQyxDQUFyQyxDQVZxQjtBQWVyQixRQUFPLFNBQVAsQ0FmcUI7Q0FBTjs7Ozs7Ozs7OztrQkNKRCxVQUFDLElBQUQsRUFBTyxTQUFQLEVBQWtCLFFBQWxCLEVBQStCO0FBQzdDLEtBQUksbUJBQUosQ0FENkM7O0FBRzdDLFFBQU8sWUFBTTtBQUNaLE1BQUksZUFBSjtNQUFnQixpQkFBaEIsQ0FEWTs7QUFHWixNQUFJLFVBQVUsU0FBVixPQUFVLEdBQU07QUFDbkIsT0FBSSxDQUFDLFFBQUQsRUFBVztBQUNkLFNBQUssS0FBTCxDQUFXLEdBQVgsRUFBZ0IsSUFBaEIsRUFEYztJQUFmO0FBR0EsYUFBVSxJQUFWLENBSm1CO0dBQU4sQ0FIRjs7QUFVWixNQUFJLE9BQUosRUFBYTtBQUNaLGdCQUFhLE9BQWIsRUFEWTtHQUFiLE1BRU8sSUFBSSxRQUFKLEVBQWM7QUFDcEIsUUFBSyxLQUFMLENBQVcsR0FBWCxFQUFnQixJQUFoQixFQURvQjtHQUFkOztBQUlQLFlBQVUsV0FBVyxPQUFYLEVBQW9CLGFBQWEsR0FBYixDQUE5QixDQWhCWTtFQUFOLENBSHNDO0NBQS9COzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ2FmLElBQU0sWUFBWSxFQUFFLFFBQUYsQ0FBWjtBQUNOLElBQU0sVUFBVSxFQUFFLE1BQUYsQ0FBVjs7SUFFQTtBQUVMLFVBRkssV0FFTCxHQUFjO3dCQUZULGFBRVM7OztBQUViLE9BQUssa0JBQUwsR0FBMEIsbUJBQTFCLENBRmE7QUFHYixPQUFLLGlCQUFMLEdBQTBCLGtCQUExQixDQUhhO0FBSWIsT0FBSyxrQkFBTCxHQUEwQixtQkFBMUIsQ0FKYTs7QUFNYixPQUFLLFFBQUwsR0FBaUIsS0FBakIsQ0FOYTtBQU9iLE9BQUssV0FBTCxHQUFtQixLQUFLLEdBQUwsRUFBbkIsQ0FQYTs7QUFTYixPQUFLLFVBQUwsR0FBMkIsQ0FBM0I7QUFUYSxNQVViLENBQUssY0FBTCxHQUEyQixDQUEzQjtBQVZhLE1BV2IsQ0FBSyxlQUFMLEdBQTJCLENBQTNCO0FBWGEsTUFZYixDQUFLLG1CQUFMLEdBQTJCLENBQTNCLENBWmE7QUFhYixPQUFLLFdBQUwsR0FBMkIsQ0FBM0I7QUFiYSxNQWNiLENBQUssY0FBTCxHQUEyQixTQUEzQixDQWRhO0FBZWIsT0FBSyxjQUFMLEdBQTJCLFNBQTNCLENBZmE7QUFnQmIsT0FBSyxXQUFMLEdBQTJCLENBQTNCLENBaEJhO0FBaUJiLE9BQUssY0FBTCxHQUEyQixTQUEzQixDQWpCYTtBQWtCYixPQUFLLGFBQUwsR0FBMkIsU0FBM0IsQ0FsQmE7QUFtQmIsT0FBSyxlQUFMLEdBQTJCLFNBQTNCLENBbkJhO0FBb0JiLE9BQUssZUFBTCxHQUEyQixTQUEzQixDQXBCYTtBQXFCYixPQUFLLGtCQUFMLEdBQTJCLFNBQTNCLENBckJhOztBQXVCYixPQUFLLFNBQUwsR0FBaUIsRUFBakIsQ0F2QmE7O0FBeUJiLE9BQUssV0FBTCxHQXpCYTtBQTBCYixPQUFLLHNCQUFMLEdBQThCLHdCQUFTLEtBQUssY0FBTCxDQUFvQixJQUFwQixDQUF5QixJQUF6QixDQUFULEVBQXlDLEdBQXpDLEVBQThDLElBQTlDLENBQTlCLENBMUJhO0FBMkJiLE9BQUsscUJBQUwsR0FBNkIsd0JBQVMsS0FBSyxhQUFMLENBQW1CLElBQW5CLENBQXdCLElBQXhCLENBQVQsRUFBd0MsR0FBeEMsQ0FBN0IsQ0EzQmE7O0FBNkJiLE9BQUssa0JBQUwsR0E3QmE7RUFBZDs7Ozs7Ozs7Ozs7Y0FGSzs7NEJBMENLLE9BQU8sVUFBVSxTQUFTOzs7QUFHbkMsT0FBSyxDQUFDLEtBQUssU0FBTCxDQUFlLGNBQWYsQ0FBOEIsS0FBOUIsQ0FBRCxFQUF3QztBQUM1QyxTQUFLLFNBQUwsQ0FBZSxLQUFmLElBQXdCLEVBQXhCLENBRDRDO0lBQTdDOzs7QUFIbUMsT0FRbkMsQ0FBSyxTQUFMLENBQWUsS0FBZixFQUFzQixJQUF0QixDQUE0QixFQUFFLFNBQVMsT0FBVCxFQUFrQixVQUFVLFFBQVYsRUFBaEQsRUFSbUM7Ozs7Ozs7Ozs7Ozs7OEJBbUJ4QixPQUFPLFVBQVU7O0FBRTVCLE9BQUksQ0FBQyxLQUFLLFNBQUwsQ0FBZSxjQUFmLENBQThCLEtBQTlCLENBQUQsRUFBdUM7QUFDMUMsV0FBTyxLQUFQLENBRDBDO0lBQTNDOzs7QUFGNEIsUUFPdkIsSUFBSSxJQUFJLENBQUosRUFBTyxNQUFNLEtBQUssU0FBTCxDQUFlLEtBQWYsRUFBc0IsTUFBdEIsRUFBOEIsSUFBSSxHQUFKLEVBQVMsR0FBN0QsRUFBa0U7QUFDakUsUUFBSSxLQUFLLFNBQUwsQ0FBZSxLQUFmLEVBQXNCLENBQXRCLEVBQXlCLFFBQXpCLEtBQXNDLFFBQXRDLEVBQWdEO0FBQ25ELFVBQUssU0FBTCxDQUFlLEtBQWYsRUFBc0IsTUFBdEIsQ0FBNkIsQ0FBN0IsRUFBZ0MsQ0FBaEMsRUFEbUQ7QUFFbkQsWUFBTyxJQUFQLENBRm1EO0tBQXBEO0lBREQ7O0FBT0EsVUFBTyxLQUFQLENBZDRCOzs7Ozs7Ozs7OzsyQkFzQnBCLE9BQU87O0FBRWYsT0FBSSxDQUFDLEtBQUssU0FBTCxDQUFlLGNBQWYsQ0FBOEIsS0FBOUIsQ0FBRCxFQUF1QztBQUMxQyxXQUFPLEtBQVAsQ0FEMEM7SUFBM0M7Ozs7O0FBRmUsT0FTVCxPQUFPLElBQUksS0FBSixDQUFVLFVBQVUsTUFBVixHQUFtQixDQUFuQixDQUFqQixDQVRTO0FBVWYsUUFBSyxJQUFJLElBQUksQ0FBSixFQUFPLElBQUksS0FBSyxNQUFMLEVBQWEsRUFBRSxDQUFGLEVBQUs7QUFDcEMsU0FBSyxDQUFMLElBQVUsVUFBVSxJQUFJLENBQUosQ0FBcEI7QUFEb0MsSUFBdEM7OztBQVZlLFFBZVYsSUFBSSxLQUFJLENBQUosRUFBTyxNQUFNLEtBQUssU0FBTCxDQUFlLEtBQWYsRUFBc0IsTUFBdEIsRUFBOEIsS0FBSSxHQUFKLEVBQVMsSUFBN0QsRUFBa0U7QUFDakUsUUFBSSxlQUFlLEtBQUssU0FBTCxDQUFlLEtBQWYsRUFBc0IsRUFBdEIsQ0FBZjs7QUFENkQsUUFHN0QsYUFBYSxRQUFiLEVBQXVCO0FBQzFCLGtCQUFhLFFBQWIsQ0FBc0IsS0FBdEIsQ0FBNEIsYUFBYSxPQUFiLEVBQXNCLElBQWxELEVBRDBCO0tBQTNCO0lBSEQ7O0FBUUEsVUFBTyxJQUFQLENBdkJlOzs7OzRCQTBCTjtBQUNULFFBQUsscUJBQUwsR0FEUzs7Ozt1Q0FJVztBQUNwQixXQUFRLEVBQVIsQ0FBVyxRQUFYLEVBQXFCLEtBQUssc0JBQUwsQ0FBckIsQ0FEb0I7QUFFcEIsV0FBUSxFQUFSLENBQVcsUUFBWCxFQUFxQixLQUFLLHFCQUFMLENBQXJCLENBRm9CO0FBR3BCLFdBQVEsRUFBUixDQUFXLFFBQVgsRUFBcUIsS0FBSyxXQUFMLENBQWlCLElBQWpCLENBQXNCLElBQXRCLENBQXJCLEVBSG9COzs7OzBDQU1HO0FBQ3ZCLFdBQVEsR0FBUixDQUFZLFFBQVosRUFBc0IsS0FBSyxzQkFBTCxDQUF0QixDQUR1QjtBQUV2QixXQUFRLEdBQVIsQ0FBWSxRQUFaLEVBQXNCLEtBQUsscUJBQUwsQ0FBdEIsQ0FGdUI7QUFHdkIsV0FBUSxHQUFSLENBQVksUUFBWixFQUFzQixLQUFLLFdBQUwsQ0FBaUIsTUFBakIsQ0FBd0IsSUFBeEIsQ0FBdEIsRUFIdUI7Ozs7bUNBTVA7QUFDaEIsUUFBSyxRQUFMLENBQWMsS0FBSyxrQkFBTCxFQUF5QixJQUF2QyxFQURnQjs7OztrQ0FJRDtBQUNmLFFBQUssUUFBTCxDQUFjLEtBQUssaUJBQUwsRUFBd0IsSUFBdEMsRUFEZTs7OztnQ0FJRjtBQUNiLE9BQUksS0FBSyxRQUFMLEVBQWUsT0FBbkI7QUFDQSxRQUFLLFFBQUwsR0FBZ0IsSUFBaEIsQ0FGYTs7QUFJYixPQUFJLE1BQU0sS0FBSyxHQUFMLEVBQU47OztBQUpTLE9BT2IsQ0FBSyxVQUFMLEdBQW1CLEtBQUssV0FBTCxHQUFtQix3QkFBYyxXQUFkLENBUHpCO0FBUWIsUUFBSyxjQUFMLEdBQXVCLEtBQUssR0FBTCxDQUFTLEtBQUssVUFBTCxDQUFoQyxDQVJhO0FBU2IsUUFBSyxlQUFMLEdBQXVCLEtBQUssR0FBTCxDQUFTLENBQUMsQ0FBRCxFQUFJLEtBQUssR0FBTCxDQUFTLENBQVQsRUFBWSxLQUFLLFVBQUwsQ0FBekIsQ0FBdkIsQ0FUYTtBQVViLFFBQUssbUJBQUwsR0FBNEIsTUFBTSxLQUFLLFdBQUwsQ0FWckI7QUFXYixRQUFLLFdBQUwsR0FBbUIsS0FBSyxjQUFMLEdBQXNCLEtBQUssbUJBQUwsR0FBMkIsSUFBakQ7OztBQVhOLE9BY2IsQ0FBSyxjQUFMLEdBQXNCLHdCQUFjLGNBQWQsQ0FkVDtBQWViLFFBQUssY0FBTCxHQUFzQix3QkFBYyxjQUFkLENBZlQ7QUFnQmIsUUFBSyxXQUFMLEdBQXNCLHdCQUFjLFdBQWQsQ0FoQlQ7QUFpQmIsUUFBSyxjQUFMLEdBQXNCLHdCQUFjLGNBQWQ7OztBQWpCVCxPQW9CYixDQUFLLGFBQUwsR0FBcUIsS0FBSyxlQUFMLEdBQXVCLENBQXZCLENBcEJSO0FBcUJiLFFBQUssZUFBTCxHQUF1QixLQUFLLGVBQUwsR0FBdUIsQ0FBdkIsQ0FyQlY7QUFzQmIsUUFBSyxlQUFMLEdBQXVCLEtBQUssV0FBTCxJQUFvQixDQUFwQixDQXRCVjtBQXVCYixRQUFLLGtCQUFMLEdBQTBCLEtBQUssY0FBTCxJQUF1QixLQUFLLGNBQUwsQ0F2QnBDOztBQXlCYixRQUFLLFdBQUwsR0FBbUIsR0FBbkIsQ0F6QmE7O0FBMkJiLFFBQUssUUFBTCxDQUFjLEtBQUssa0JBQUwsRUFBeUIsSUFBdkMsRUEzQmE7O0FBNkJiLFFBQUssUUFBTCxHQUFnQixLQUFoQixDQTdCYTs7OztRQXJJVDs7O0FBc0tOLE9BQU8sT0FBUCxHQUFpQixJQUFJLFdBQUosRUFBakIiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBDb21wb25lbnRMb2FkZXIgQ2xhc3NcbiAqXG4gKiBJbnN0YW50aWF0ZXMgSmF2YVNjcmlwdCBDbGFzc2VzIHdoZW4gdGhlaXIgbmFtZSBpcyBmb3VuZCBpbiB0aGUgRE9NIHVzaW5nIGF0dHJpYnV0ZSBkYXRhLWNvbXBvbmVudD1cIlwiXG4gKlxuICovXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIF9jcmVhdGVDbGFzcyA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KSgpO1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG52YXIgQ29tcG9uZW50TG9hZGVyID0gKGZ1bmN0aW9uICgpIHtcblxuXHQvKipcbiAgKiBDb25zdHJ1Y3RvciBmb3IgdGhlIENvbXBvbmVudExvYWRlclxuICAqIEBjbGFzc1xuICAqIEBwdWJsaWNcbiAgKiBAcGFyYW0ge09iamVjdH0gY29tcG9uZW50cyAtIE9wdGlvbmFsIGNvbGxlY3Rpb24gb2YgYXZhaWxhYmxlIGNvbXBvbmVudHM6IHtjb21wb25lbnROYW1lOiBjbGFzc0RlZmluaXRpb259XG4gICogQHBhcmFtIHtOb2RlfSBjb250ZXh0IC0gT3B0aW9uYWwgRE9NIG5vZGUgdG8gc2VhcmNoIGZvciBjb21wb25lbnRzLiBEZWZhdWx0cyB0byBkb2N1bWVudC5cbiAgKi9cblxuXHRmdW5jdGlvbiBDb21wb25lbnRMb2FkZXIoKSB7XG5cdFx0dmFyIGNvbXBvbmVudHMgPSBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IHt9IDogYXJndW1lbnRzWzBdO1xuXHRcdHZhciBjb250ZXh0ID0gYXJndW1lbnRzWzFdID09PSB1bmRlZmluZWQgPyBkb2N1bWVudCA6IGFyZ3VtZW50c1sxXTtcblxuXHRcdF9jbGFzc0NhbGxDaGVjayh0aGlzLCBDb21wb25lbnRMb2FkZXIpO1xuXG5cdFx0dGhpcy5jb250ZXh0RWwgPSBjb250ZXh0O1xuXHRcdHRoaXMuaW5pdGlhbGl6ZWRDb21wb25lbnRzID0ge307XG5cdFx0dGhpcy5udW1iZXJPZkluaXRpYWxpemVkQ29tcG9uZW50cyA9IDA7XG5cdFx0dGhpcy5jb21wb25lbnRzID0ge307XG5cdFx0dGhpcy50b3BpY3MgPSB7fTtcblx0XHR0aGlzLnJlZ2lzdGVyKGNvbXBvbmVudHMpO1xuXHR9XG5cblx0X2NyZWF0ZUNsYXNzKENvbXBvbmVudExvYWRlciwgW3tcblx0XHRrZXk6IFwicmVnaXN0ZXJcIixcblxuXHRcdC8qKlxuICAgKiBBZGQgY29tcG9uZW50KHMpIHRvIGNvbGxlY3Rpb24gb2YgYXZhaWxhYmxlIGNvbXBvbmVudHNcbiAgICogQHB1YmxpY1xuICAgKiBAcGFyYW0ge09iamVjdH0gY29tcG9uZW50cyAtIENvbGxlY3Rpb24gb2YgY29tcG9uZW50czoge2NvbXBvbmVudE5hbWU6IGNsYXNzRGVmaW5pdGlvbn1cbiAgICovXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIHJlZ2lzdGVyKCkge1xuXHRcdFx0dmFyIF90aGlzID0gdGhpcztcblxuXHRcdFx0dmFyIGNvbXBvbmVudHMgPSBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IHt9IDogYXJndW1lbnRzWzBdO1xuXG5cdFx0XHRPYmplY3Qua2V5cyhjb21wb25lbnRzKS5mb3JFYWNoKGZ1bmN0aW9uIChjb21wb25lbnROYW1lKSB7XG5cdFx0XHRcdF90aGlzLmNvbXBvbmVudHNbY29tcG9uZW50TmFtZV0gPSBjb21wb25lbnRzW2NvbXBvbmVudE5hbWVdO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiBcInVucmVnaXN0ZXJcIixcblxuXHRcdC8qKlxuICAgKiBSZW1vdmUgY29tcG9uZW50IGZyb20gY29sbGVjdGlvbiBvZiBhdmFpbGFibGUgY29tcG9uZW50c1xuICAgKiBAcHVibGljXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBjb21wb25lbnROYW1lIC0gTmFtZSBvZiB0aGUgY29tcG9uZW50IHRvIHJlbW92ZVxuICAgKi9cblx0XHR2YWx1ZTogZnVuY3Rpb24gdW5yZWdpc3Rlcihjb21wb25lbnROYW1lKSB7XG5cdFx0XHRkZWxldGUgdGhpcy5jb21wb25lbnRzW2NvbXBvbmVudE5hbWVdO1xuXHRcdH1cblx0fSwge1xuXHRcdGtleTogXCJzdWJzY3JpYmVcIixcblxuXHRcdC8qKlxuICAgKiBNZWRpYXRvciBmdW5jdGlvbmFsaXR5LlxuICAgKiBTdG9yZXMgdGhlIHRvcGljIGFuZCBjYWxsYmFjayBnaXZlbiBieSB0aGUgY29tcG9uZW50LlxuICAgKiBmb3IgZnVydGhlciByZWZlcmVuY2UuXG4gICAqIEBwYXJhbSAge1N0cmluZ30gdG9waWMgICAgICBUb3BpYyBzdHJpbmdcbiAgICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrIENhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgd291bGQgYmUgdHJpZ2dlcmVkLlxuICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY29udGV4dCAgQ2xhc3MgaW5zdGFuY2Ugd2hpY2ggb3ducyB0aGUgY2FsbGJhY2tcbiAgICovXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIHN1YnNjcmliZSh0b3BpYywgY2FsbGJhY2ssIGNvbnRleHQpIHtcblxuXHRcdFx0Ly8gSXMgdGhpcyBhIG5ldyB0b3BpYz9cblx0XHRcdGlmICghdGhpcy50b3BpY3MuaGFzT3duUHJvcGVydHkodG9waWMpKSB7XG5cdFx0XHRcdHRoaXMudG9waWNzW3RvcGljXSA9IFtdO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBTdG9yZSB0aGUgc3Vic2NyaWJlciBjYWxsYmFja1xuXHRcdFx0dGhpcy50b3BpY3NbdG9waWNdLnB1c2goeyBjb250ZXh0OiBjb250ZXh0LCBjYWxsYmFjazogY2FsbGJhY2sgfSk7XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiBcInVuc3Vic2NyaWJlXCIsXG5cblx0XHQvKipcbiAgICogTWVkaWF0b3IgZnVuY3Rpb25hbGl0eS5cbiAgICogUmVtb3ZlcyB0aGUgc3RvcmVkIHRvcGljIGFuZCBjYWxsYmFjayBnaXZlbiBieSB0aGUgY29tcG9uZW50LlxuICAgKiBAcGFyYW0gIHtTdHJpbmd9ICAgdG9waWMgICAgVG9waWMgc3RyaW5nXG4gICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjYWxsYmFjayBDYWxsYmFjayBmdW5jdGlvbiB0aGF0IHdvdWxkIGJlIHRyaWdnZXJlZC5cbiAgICogQHBhcmFtICB7RnVuY3Rpb259IGNvbnRleHQgIENsYXNzIGluc3RhbmNlIHdoaWNoIG93bnMgdGhlIGNhbGxiYWNrXG4gICAqIEByZXR1cm4ge0Jvb2xlYW59ICAgICAgICAgICBUcnVlIG9uIHN1Y2Nlc3MsIEZhbHNlIG90aGVyd2lzZS5cbiAgICovXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIHVuc3Vic2NyaWJlKHRvcGljLCBjYWxsYmFjaywgY29udGV4dCkge1xuXHRcdFx0Ly8gRG8gd2UgaGF2ZSB0aGlzIHRvcGljP1xuXHRcdFx0aWYgKCF0aGlzLnRvcGljcy5oYXNPd25Qcm9wZXJ0eSh0b3BpYykpIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBGaW5kIG91dCB3aGVyZSB0aGlzIGlzIGFuZCByZW1vdmUgaXRcblx0XHRcdGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLnRvcGljc1t0b3BpY10ubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdFx0aWYgKHRoaXMudG9waWNzW3RvcGljXVtpXS5jYWxsYmFjayA9PT0gY2FsbGJhY2spIHtcblx0XHRcdFx0XHRpZiAoIWNvbnRleHQgfHwgdGhpcy50b3BpY3NbdG9waWNdW2ldLmNvbnRleHQgPT09IGNvbnRleHQpIHtcblx0XHRcdFx0XHRcdHRoaXMudG9waWNzW3RvcGljXS5zcGxpY2UoaSwgMSk7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fSwge1xuXHRcdGtleTogXCJwdWJsaXNoXCIsXG5cblx0XHQvKipcbiAgICogW3B1Ymxpc2ggZGVzY3JpcHRpb25dXG4gICAqIEBwYXJhbSAge1t0eXBlXX0gdG9waWMgW2Rlc2NyaXB0aW9uXVxuICAgKiBAcmV0dXJuIHtbdHlwZV19ICAgICAgIFtkZXNjcmlwdGlvbl1cbiAgICovXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIHB1Ymxpc2godG9waWMpIHtcblx0XHRcdC8vIENoZWNrIGlmIHdlIGhhdmUgc3ViY3JpYmVycyB0byB0aGlzIHRvcGljXG5cdFx0XHRpZiAoIXRoaXMudG9waWNzLmhhc093blByb3BlcnR5KHRvcGljKSkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdC8vIGRvbid0IHNsaWNlIG9uIGFyZ3VtZW50cyBiZWNhdXNlIGl0IHByZXZlbnRzIG9wdGltaXphdGlvbnMgaW4gSmF2YVNjcmlwdCBlbmdpbmVzIChWOCBmb3IgZXhhbXBsZSlcblx0XHRcdC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0Z1bmN0aW9ucy9hcmd1bWVudHNcblx0XHRcdC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9wZXRrYWFudG9ub3YvYmx1ZWJpcmQvd2lraS9PcHRpbWl6YXRpb24ta2lsbGVycyMzMi1sZWFraW5nLWFyZ3VtZW50c1xuXHRcdFx0dmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgKytpKSB7XG5cdFx0XHRcdGFyZ3NbaV0gPSBhcmd1bWVudHNbaSArIDFdOyAvLyByZW1vdmUgZmlyc3QgYXJndW1lbnRcblx0XHRcdH1cblxuXHRcdFx0Ly8gTG9vcCB0aHJvdWdoIHRoZW0gYW5kIGZpcmUgdGhlIGNhbGxiYWNrc1xuXHRcdFx0Zm9yICh2YXIgX2kgPSAwLCBsZW4gPSB0aGlzLnRvcGljc1t0b3BpY10ubGVuZ3RoOyBfaSA8IGxlbjsgX2krKykge1xuXHRcdFx0XHR2YXIgc3Vic2NyaXB0aW9uID0gdGhpcy50b3BpY3NbdG9waWNdW19pXTtcblx0XHRcdFx0Ly8gQ2FsbCBpdCdzIGNhbGxiYWNrXG5cdFx0XHRcdGlmIChzdWJzY3JpcHRpb24gJiYgc3Vic2NyaXB0aW9uLmNhbGxiYWNrKSB7XG5cdFx0XHRcdFx0c3Vic2NyaXB0aW9uLmNhbGxiYWNrLmFwcGx5KHN1YnNjcmlwdGlvbi5jb250ZXh0LCBhcmdzKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6IFwic2NhblwiLFxuXG5cdFx0LyoqXG4gICAqIFNjYW4gdGhlIERPTSwgaW5pdGlhbGl6ZSBuZXcgY29tcG9uZW50cyBhbmQgZGVzdHJveSByZW1vdmVkIGNvbXBvbmVudHMuXG4gICAqIEBwdWJsaWNcbiAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBPcHRpb25hbCBkYXRhIG9iamVjdCB0byBwYXNzIHRvIHRoZSBjb21wb25lbnQgY29uc3RydWN0b3JcbiAgICovXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIHNjYW4oKSB7XG5cdFx0XHR2YXIgX3RoaXMyID0gdGhpcztcblxuXHRcdFx0dmFyIGRhdGEgPSBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IHt9IDogYXJndW1lbnRzWzBdO1xuXG5cdFx0XHR2YXIgYWN0aXZlQ29tcG9uZW50cyA9IHt9LFxuXHRcdFx0ICAgIGVsZW1lbnRzID0gdGhpcy5jb250ZXh0RWwucXVlcnlTZWxlY3RvckFsbChcIltkYXRhLWNvbXBvbmVudF1cIik7XG5cblx0XHRcdFtdLmZvckVhY2guY2FsbChlbGVtZW50cywgZnVuY3Rpb24gKGVsKSB7XG5cdFx0XHRcdF90aGlzMi5fc2NhbkVsZW1lbnQoZWwsIGFjdGl2ZUNvbXBvbmVudHMsIGRhdGEpO1xuXHRcdFx0fSk7XG5cblx0XHRcdGlmICh0aGlzLm51bWJlck9mSW5pdGlhbGl6ZWRDb21wb25lbnRzID4gMCkgdGhpcy5jbGVhblVwXyhhY3RpdmVDb21wb25lbnRzKTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6IFwiX3NjYW5FbGVtZW50XCIsXG5cblx0XHQvKipcbiAgICogRmluZCBhbGwgY29tcG9uZW50cyByZWdpc3RlcmVkIG9uIGEgc3BlY2lmaWMgRE9NIGVsZW1lbnQgYW5kIGluaXRpYWxpemUgdGhlbSBpZiBuZXdcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtFbGVtZW50fSBlbCAtIERPTSBlbGVtZW50IHRvIHNjYW4gZm9yIGNvbXBvbmVudHNcbiAgICogQHBhcmFtIHtPYmplY3R9IGFjdGl2ZUNvbXBvbmVudHMgLSBBbGwgY29tcG9uZW50SWRzIGN1cnJlbnRseSBmb3VuZCBpbiB0aGUgRE9NXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gT3B0aW9uYWwgZGF0YSBvYmplY3QgdG8gcGFzcyB0byB0aGUgY29tcG9uZW50IGNvbnN0cnVjdG9yXG4gICAqL1xuXHRcdHZhbHVlOiBmdW5jdGlvbiBfc2NhbkVsZW1lbnQoZWwsIGFjdGl2ZUNvbXBvbmVudHMsIGRhdGEpIHtcblx0XHRcdHZhciBfdGhpczMgPSB0aGlzO1xuXG5cdFx0XHQvLyBjaGVjayBvZiBjb21wb25lbnQocykgZm9yIHRoaXMgRE9NIGVsZW1lbnQgYWxyZWFkeSBoYXZlIGJlZW4gaW5pdGlhbGl6ZWRcblx0XHRcdHZhciBlbGVtZW50SWQgPSBlbC5nZXRBdHRyaWJ1dGUoXCJkYXRhLWNvbXBvbmVudC1pZFwiKTtcblxuXHRcdFx0aWYgKCFlbGVtZW50SWQpIHtcblx0XHRcdFx0Ly8gZ2l2ZSB1bmlxdWUgaWQgc28gd2UgY2FuIHRyYWNrIGl0IG9uIG5leHQgc2NhblxuXHRcdFx0XHRlbGVtZW50SWQgPSB0aGlzLl9nZW5lcmF0ZVVVSUQoKTtcblx0XHRcdFx0ZWwuc2V0QXR0cmlidXRlKFwiZGF0YS1jb21wb25lbnQtaWRcIiwgZWxlbWVudElkKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gZmluZCB0aGUgbmFtZSBvZiB0aGUgY29tcG9uZW50IGluc3RhbmNlXG5cdFx0XHR2YXIgY29tcG9uZW50TGlzdCA9IGVsLmdldEF0dHJpYnV0ZShcImRhdGEtY29tcG9uZW50XCIpLm1hdGNoKC9cXFMrL2cpO1xuXHRcdFx0Y29tcG9uZW50TGlzdC5mb3JFYWNoKGZ1bmN0aW9uIChjb21wb25lbnROYW1lKSB7XG5cblx0XHRcdFx0dmFyIGNvbXBvbmVudElkID0gY29tcG9uZW50TmFtZSArIFwiLVwiICsgZWxlbWVudElkO1xuXHRcdFx0XHRhY3RpdmVDb21wb25lbnRzW2NvbXBvbmVudElkXSA9IHRydWU7XG5cblx0XHRcdFx0Ly8gY2hlY2sgaWYgY29tcG9uZW50IG5vdCBpbml0aWFsaXplZCBiZWZvcmVcblx0XHRcdFx0aWYgKCFfdGhpczMuaW5pdGlhbGl6ZWRDb21wb25lbnRzW2NvbXBvbmVudElkXSkge1xuXHRcdFx0XHRcdF90aGlzMy5faW5pdGlhbGl6ZUNvbXBvbmVudChjb21wb25lbnROYW1lLCBjb21wb25lbnRJZCwgZWwsIGRhdGEpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6IFwiX2luaXRpYWxpemVDb21wb25lbnRcIixcblxuXHRcdC8qKlxuICAgKiBDYWxsIGNvbnN0cnVjdG9yIG9mIGNvbXBvbmVudCBhbmQgYWRkIGluc3RhbmNlIHRvIHRoZSBjb2xsZWN0aW9uIG9mIGluaXRpYWxpemVkIGNvbXBvbmVudHNcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtTdHJpbmd9IGNvbXBvbmVudE5hbWUgLSBOYW1lIG9mIHRoZSBjb21wb25lbnQgdG8gaW5pdGlhbGl6ZS4gVXNlZCB0byBsb29rdXAgY2xhc3MgZGVmaW5pdGlvbiBpbiBjb21wb25lbnRzIGNvbGxlY3Rpb24uXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBjb21wb25lbnRJZCAtIFVuaXF1ZSBjb21wb25lbnQgSUQgKGNvbWJpbmF0aW9uIG9mIGNvbXBvbmVudCBuYW1lIGFuZCBlbGVtZW50IElEKVxuICAgKiBAcGFyYW0ge0VsZW1lbnR9IGVsIC0gRE9NIGVsZW1lbnQgdGhhdCBpcyB0aGUgY29udGV4dCBvZiB0aGlzIGNvbXBvbmVudFxuICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIE9wdGlvbmFsIGRhdGEgb2JqZWN0IHRvIHBhc3MgdG8gdGhlIGNvbXBvbmVudCBjb25zdHJ1Y3RvclxuICAgKi9cblx0XHR2YWx1ZTogZnVuY3Rpb24gX2luaXRpYWxpemVDb21wb25lbnQoY29tcG9uZW50TmFtZSwgY29tcG9uZW50SWQsIGVsLCBkYXRhKSB7XG5cdFx0XHR2YXIgY29tcG9uZW50ID0gdGhpcy5jb21wb25lbnRzW2NvbXBvbmVudE5hbWVdO1xuXG5cdFx0XHRpZiAodHlwZW9mIGNvbXBvbmVudCAhPT0gXCJmdW5jdGlvblwiKSB0aHJvdyBcIkNvbXBvbmVudExvYWRlcjogdW5rbm93biBjb21wb25lbnQgJ1wiICsgY29tcG9uZW50TmFtZSArIFwiJ1wiO1xuXG5cdFx0XHR2YXIgaW5zdGFuY2UgPSBuZXcgY29tcG9uZW50KGVsLCBkYXRhLCB0aGlzKTtcblxuXHRcdFx0dGhpcy5pbml0aWFsaXplZENvbXBvbmVudHNbY29tcG9uZW50SWRdID0gaW5zdGFuY2U7XG5cdFx0XHR0aGlzLm51bWJlck9mSW5pdGlhbGl6ZWRDb21wb25lbnRzKys7XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiBcIl9kZXN0cm95Q29tcG9uZW50XCIsXG5cblx0XHQvKipcbiAgICogQ2FsbCBkZXN0cm95KCkgb24gYSBjb21wb25lbnQgaW5zdGFuY2UgYW5kIHJlbW92ZSBpdCBmcm9tIHRoZSBjb2xsZWN0aW9uIG9mIGluaXRpYWxpemVkIGNvbXBvbmVudHNcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtTdHJpbmd9IGNvbXBvbmVudElkIC0gVW5pcXVlIGNvbXBvbmVudCBJRCB1c2VkIHRvIGZpbmQgY29tcG9uZW50IGluc3RhbmNlXG4gICAqL1xuXHRcdHZhbHVlOiBmdW5jdGlvbiBfZGVzdHJveUNvbXBvbmVudChjb21wb25lbnRJZCkge1xuXHRcdFx0dmFyIGluc3RhbmNlID0gdGhpcy5pbml0aWFsaXplZENvbXBvbmVudHNbY29tcG9uZW50SWRdO1xuXHRcdFx0aWYgKGluc3RhbmNlICYmIHR5cGVvZiBpbnN0YW5jZS5kZXN0cm95ID09PSBcImZ1bmN0aW9uXCIpIGluc3RhbmNlLmRlc3Ryb3koKTtcblxuXHRcdFx0Ly8gc2FmZSB0byBkZWxldGUgd2hpbGUgb2JqZWN0IGtleXMgd2hpbGUgbG9vcGluZ2h0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMzQ2MzA0OC9pcy1pdC1zYWZlLXRvLWRlbGV0ZS1hbi1vYmplY3QtcHJvcGVydHktd2hpbGUtaXRlcmF0aW5nLW92ZXItdGhlbVxuXHRcdFx0ZGVsZXRlIHRoaXMuaW5pdGlhbGl6ZWRDb21wb25lbnRzW2NvbXBvbmVudElkXTtcblx0XHRcdHRoaXMubnVtYmVyT2ZJbml0aWFsaXplZENvbXBvbmVudHMtLTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6IFwiY2xlYW5VcF9cIixcblxuXHRcdC8qKlxuICAgKiBEZXN0cm95IGluYWl0aWFsaXplZCBjb21wb25lbnRzIHRoYXQgbm8gbG9uZ2VyIGFyZSBhY3RpdmVcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtPYmplY3R9IGFjdGl2ZUNvbXBvbmVudHMgLSBBbGwgY29tcG9uZW50SWRzIGN1cnJlbnRseSBmb3VuZCBpbiB0aGUgRE9NXG4gICAqL1xuXHRcdHZhbHVlOiBmdW5jdGlvbiBjbGVhblVwXygpIHtcblx0XHRcdHZhciBfdGhpczQgPSB0aGlzO1xuXG5cdFx0XHR2YXIgYWN0aXZlQ29tcG9uZW50cyA9IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8ge30gOiBhcmd1bWVudHNbMF07XG5cblx0XHRcdE9iamVjdC5rZXlzKHRoaXMuaW5pdGlhbGl6ZWRDb21wb25lbnRzKS5mb3JFYWNoKGZ1bmN0aW9uIChjb21wb25lbnRJZCkge1xuXHRcdFx0XHRpZiAoIWFjdGl2ZUNvbXBvbmVudHNbY29tcG9uZW50SWRdKSB7XG5cdFx0XHRcdFx0X3RoaXM0Ll9kZXN0cm95Q29tcG9uZW50KGNvbXBvbmVudElkKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiBcIl9nZW5lcmF0ZVVVSURcIixcblxuXHRcdC8qKlxuICAgKiBHZW5lcmF0ZXMgYSByZmM0MTIyIHZlcnNpb24gNCBjb21wbGlhbnQgdW5pcXVlIElEXG4gICAqIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTA1MDM0L2NyZWF0ZS1ndWlkLXV1aWQtaW4tamF2YXNjcmlwdFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cblx0XHR2YWx1ZTogZnVuY3Rpb24gX2dlbmVyYXRlVVVJRCgpIHtcblx0XHRcdHJldHVybiBcInh4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eFwiLnJlcGxhY2UoL1t4eV0vZywgZnVuY3Rpb24gKGMpIHtcblx0XHRcdFx0dmFyIHIgPSBNYXRoLnJhbmRvbSgpICogMTYgfCAwLFxuXHRcdFx0XHQgICAgdiA9IGMgPT0gXCJ4XCIgPyByIDogciAmIDB4MyB8IDB4ODtcblx0XHRcdFx0cmV0dXJuIHYudG9TdHJpbmcoMTYpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9XSk7XG5cblx0cmV0dXJuIENvbXBvbmVudExvYWRlcjtcbn0pKCk7XG5cbi8vIEV4cG9ydCBBTUQsIENvbW1vbkpTL0VTNiBtb2R1bGUgb3IgYXNzdW1lIGdsb2JhbCBuYW1lc3BhY2VcbmlmICh0eXBlb2YgZGVmaW5lICE9PSBcInVuZGVmaW5lZFwiICYmIGRlZmluZS5hbWQpIHtcblx0ZGVmaW5lKFtdLCBDb21wb25lbnRMb2FkZXIpO1xufSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSBcInVuZGVmaW5lZFwiICYmIG1vZHVsZS5leHBvcnRzKSB7XG5cdG1vZHVsZS5leHBvcnRzID0gQ29tcG9uZW50TG9hZGVyO1xufSBlbHNlIHtcblx0d2luZG93LkNvbXBvbmVudExvYWRlciA9IENvbXBvbmVudExvYWRlcjtcbn0iLCIvKipcbiAqIENvbXBvbmVudCBCYXNlIENsYXNzXG4gKiBcbiAqIFNldHMgYWxsIGFyZ3VtZW50cyBwYXNzZWQgaW4gdG8gY29uc3RydWN0b3IgZnJvbSBDb21wb25lbnRMb2FkZXJcbiAqXG4gKiBFeHBvc2VzIHB1Yi9zdWIgbWV0aG9kcyBmb3IgdHJpZ2dlcmluZyBldmVudHMgdG8gb3RoZXIgY29tcG9uZW50c1xuICpcbiAqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gKGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmICgndmFsdWUnIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KSgpO1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvbicpOyB9IH1cblxudmFyIENvbXBvbmVudCA9IChmdW5jdGlvbiAoKSB7XG5cblx0LyoqXG4gICogQ29uc3RydWN0b3IgZm9yIHRoZSBDb21wb25lbnRcbiAgKlxuICAqIENhbGwgYHN1cGVyKC4uLmFyZ3VtZW50cyk7YCBpbiB0aGUgYmFzZSBjbGFzcyBjb25zdHJ1Y3RvclxuICAqXG4gICogQHB1YmxpY1xuICAqIEBwYXJhbSB7Tm9kZX0gY29udGV4dCAtIERPTSBub2RlIHRoYXQgY29udGFpbnMgdGhlIGNvbXBvbmVudCBtYXJrdXBcbiAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIE9wdGlvbmFsIGRhdGEgb2JqZWN0IGZyb20gQ29tcG9uZW50TG9hZGVyLnNjYW4oKVxuICAqIEBwYXJhbSB7T2JqZWN0fSBtZWRpYXRvciAtIGluc3RhbmNlIG9mIENvbXBvbmVudExvYWRlciBmb3IgcHViL3N1YlxuICAqL1xuXG5cdGZ1bmN0aW9uIENvbXBvbmVudCgpIHtcblx0XHRfY2xhc3NDYWxsQ2hlY2sodGhpcywgQ29tcG9uZW50KTtcblxuXHRcdHRoaXMuZWwgPSBhcmd1bWVudHNbMF07XG5cdFx0aWYgKHR5cGVvZiBqUXVlcnkgIT09ICd1bmRlZmluZWQnKSB0aGlzLiRlbCA9IGpRdWVyeSh0aGlzLmVsKTtcblx0XHR0aGlzLmRhdGEgPSBhcmd1bWVudHNbMV07XG5cdFx0dGhpcy5fX21lZGlhdG9yID0gYXJndW1lbnRzWzJdO1xuXHR9XG5cblx0X2NyZWF0ZUNsYXNzKENvbXBvbmVudCwgW3tcblx0XHRrZXk6ICdwdWJsaXNoJyxcblxuXHRcdC8qKlxuICAgKiBQdWJsaXNoIGFuIGV2ZW50IGZvciBvdGhlciBjb21wb25lbnRzXG4gICAqIEBwcm90ZWN0ZWRcbiAgICogQHBhcmFtIHtTdHJpbmd9IHRvcGljIC0gRXZlbnQgbmFtZVxuICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIE9wdGlvbmFsIHBhcmFtcyB0byBwYXNzIHdpdGggdGhlIGV2ZW50XG4gICAqL1xuXHRcdHZhbHVlOiBmdW5jdGlvbiBwdWJsaXNoKCkge1xuXHRcdFx0dmFyIF9tZWRpYXRvcjtcblxuXHRcdFx0KF9tZWRpYXRvciA9IHRoaXMuX19tZWRpYXRvcikucHVibGlzaC5hcHBseShfbWVkaWF0b3IsIGFyZ3VtZW50cyk7XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiAnc3Vic2NyaWJlJyxcblxuXHRcdC8qKlxuICAgKiBTdWJzY3JpYmUgdG8gYW4gZXZlbnQgZnJvbSBhbm90aGVyIGNvbXBvbmVudFxuICAgKiBAcHJvdGVjdGVkXG4gICAqIEBwYXJhbSB7U3RyaW5nfSB0b3BpYyAtIEV2ZW50IG5hbWVcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSBGdW5jdGlvbiB0byBiaW5kXG4gICAqL1xuXHRcdHZhbHVlOiBmdW5jdGlvbiBzdWJzY3JpYmUodG9waWMsIGNhbGxiYWNrKSB7XG5cdFx0XHR0aGlzLl9fbWVkaWF0b3Iuc3Vic2NyaWJlKHRvcGljLCBjYWxsYmFjaywgdGhpcyk7XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiAndW5zdWJzY3JpYmUnLFxuXG5cdFx0LyoqXG4gICAqIFVuc3Vic2NyaWJlIGZyb20gYW4gZXZlbnQgZnJvbSBhbm90aGVyIGNvbXBvbmVudFxuICAgKiBAcHJvdGVjdGVkXG4gICAqIEBwYXJhbSB7U3RyaW5nfSB0b3BpYyAtIEV2ZW50IG5hbWVcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSBGdW5jdGlvbiB0byB1bmJpbmRcbiAgICovXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIHVuc3Vic2NyaWJlKHRvcGljLCBjYWxsYmFjaykge1xuXHRcdFx0dGhpcy5fX21lZGlhdG9yLnVuc3Vic2NyaWJlKHRvcGljLCBjYWxsYmFjaywgdGhpcyk7XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiAnc2NhbicsXG5cblx0XHQvKipcbiAgICogVXRpbGl0eSBtZXRob2QgZm9yIHRyaWdnZXJpbmcgdGhlIENvbXBvbmVudExvYWRlciB0byBzY2FuIHRoZSBtYXJrdXAgZm9yIG5ldyBjb21wb25lbnRzXG4gICAqIEBwcm90ZWN0ZWRcbiAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBPcHRpb25hbCBkYXRhIHRvIHBhc3MgdG8gdGhlIGNvbnN0cnVjdG9yIG9mIGFueSBDb21wb25lbnQgaW5pdGlhbGl6ZWQgYnkgdGhpcyBzY2FuXG4gICAqL1xuXHRcdHZhbHVlOiBmdW5jdGlvbiBzY2FuKGRhdGEpIHtcblx0XHRcdHRoaXMuX19tZWRpYXRvci5zY2FuKGRhdGEpO1xuXHRcdH1cblx0fSwge1xuXHRcdGtleTogJ2RlZmVyJyxcblxuXHRcdC8qKlxuICAgKiBVdGlsaXR5IG1ldGhvZCBmb3IgZGVmZXJpbmcgYSBmdW5jdGlvbiBjYWxsXG4gICAqIEBwcm90ZWN0ZWRcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSBGdW5jdGlvbiB0byBjYWxsXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBtcyAtIE9wdGlvbmFsIG1zIHRvIGRlbGF5LCBkZWZhdWx0cyB0byAxN21zIChqdXN0IG92ZXIgMSBmcmFtZSBhdCA2MGZwcylcbiAgICovXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIGRlZmVyKGNhbGxiYWNrKSB7XG5cdFx0XHR2YXIgbXMgPSBhcmd1bWVudHNbMV0gPT09IHVuZGVmaW5lZCA/IDE3IDogYXJndW1lbnRzWzFdO1xuXG5cdFx0XHRzZXRUaW1lb3V0KGNhbGxiYWNrLCBtcyk7XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiAnZGVzdHJveScsXG5cblx0XHQvKipcbiAgICogQ2FsbGVkIGJ5IENvbXBvbmVudExvYWRlciB3aGVuIGNvbXBvbmVudCBpcyBubyBsb25nZXIgZm91bmQgaW4gdGhlIG1hcmt1cFxuICAgKiB1c3VhbGx5IGhhcHBlbnMgYXMgYSByZXN1bHQgb2YgcmVwbGFjaW5nIHRoZSBtYXJrdXAgdXNpbmcgQUpBWFxuICAgKlx0XG4gICAqIE92ZXJyaWRlIGluIHN1YmNsYXNzIGFuZCBtYWtlIHN1cmUgdG8gY2xlYW4gdXAgZXZlbnQgaGFuZGxlcnMgZXRjXG4gICAqXG4gICAqIEBwcm90ZWN0ZWRcbiAgICovXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIGRlc3Ryb3koKSB7fVxuXHR9XSk7XG5cblx0cmV0dXJuIENvbXBvbmVudDtcbn0pKCk7XG5cbi8vIEV4cG9ydCBBTUQsIENvbW1vbkpTL0VTNiBtb2R1bGUgb3IgYXNzdW1lIGdsb2JhbCBuYW1lc3BhY2VcbmlmICh0eXBlb2YgZGVmaW5lICE9PSAndW5kZWZpbmVkJyAmJiBkZWZpbmUuYW1kKSB7XG5cdGRlZmluZShbXSwgQ29tcG9uZW50KTtcbn0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcblx0bW9kdWxlLmV4cG9ydHMgPSBDb21wb25lbnQ7XG59IGVsc2Uge1xuXHR3aW5kb3cuQ29tcG9uZW50ID0gQ29tcG9uZW50O1xufSIsIihmdW5jdGlvbiggZmFjdG9yeSApIHtcblx0aWYgKHR5cGVvZiBkZWZpbmUgIT09ICd1bmRlZmluZWQnICYmIGRlZmluZS5hbWQpIHtcblx0XHRkZWZpbmUoW10sIGZhY3RvcnkpO1xuXHR9IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG5cdH0gZWxzZSB7XG5cdFx0d2luZG93LnNjcm9sbE1vbml0b3IgPSBmYWN0b3J5KCk7XG5cdH1cbn0pKGZ1bmN0aW9uKCkge1xuXG5cdHZhciBzY3JvbGxUb3AgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gd2luZG93LnBhZ2VZT2Zmc2V0IHx8XG5cdFx0XHQoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50ICYmIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3ApIHx8XG5cdFx0XHRkb2N1bWVudC5ib2R5LnNjcm9sbFRvcDtcblx0fTtcblxuXHR2YXIgZXhwb3J0cyA9IHt9O1xuXG5cdHZhciB3YXRjaGVycyA9IFtdO1xuXG5cdHZhciBWSVNJQklMSVRZQ0hBTkdFID0gJ3Zpc2liaWxpdHlDaGFuZ2UnO1xuXHR2YXIgRU5URVJWSUVXUE9SVCA9ICdlbnRlclZpZXdwb3J0Jztcblx0dmFyIEZVTExZRU5URVJWSUVXUE9SVCA9ICdmdWxseUVudGVyVmlld3BvcnQnO1xuXHR2YXIgRVhJVFZJRVdQT1JUID0gJ2V4aXRWaWV3cG9ydCc7XG5cdHZhciBQQVJUSUFMTFlFWElUVklFV1BPUlQgPSAncGFydGlhbGx5RXhpdFZpZXdwb3J0Jztcblx0dmFyIExPQ0FUSU9OQ0hBTkdFID0gJ2xvY2F0aW9uQ2hhbmdlJztcblx0dmFyIFNUQVRFQ0hBTkdFID0gJ3N0YXRlQ2hhbmdlJztcblxuXHR2YXIgZXZlbnRUeXBlcyA9IFtcblx0XHRWSVNJQklMSVRZQ0hBTkdFLFxuXHRcdEVOVEVSVklFV1BPUlQsXG5cdFx0RlVMTFlFTlRFUlZJRVdQT1JULFxuXHRcdEVYSVRWSUVXUE9SVCxcblx0XHRQQVJUSUFMTFlFWElUVklFV1BPUlQsXG5cdFx0TE9DQVRJT05DSEFOR0UsXG5cdFx0U1RBVEVDSEFOR0Vcblx0XTtcblxuXHR2YXIgZGVmYXVsdE9mZnNldHMgPSB7dG9wOiAwLCBib3R0b206IDB9O1xuXG5cdHZhciBnZXRWaWV3cG9ydEhlaWdodCA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB3aW5kb3cuaW5uZXJIZWlnaHQgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodDtcblx0fTtcblxuXHR2YXIgZ2V0RG9jdW1lbnRIZWlnaHQgPSBmdW5jdGlvbigpIHtcblx0XHQvLyBqUXVlcnkgYXBwcm9hY2hcblx0XHQvLyB3aGljaGV2ZXIgaXMgZ3JlYXRlc3Rcblx0XHRyZXR1cm4gTWF0aC5tYXgoXG5cdFx0XHRkb2N1bWVudC5ib2R5LnNjcm9sbEhlaWdodCwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbEhlaWdodCxcblx0XHRcdGRvY3VtZW50LmJvZHkub2Zmc2V0SGVpZ2h0LCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQub2Zmc2V0SGVpZ2h0LFxuXHRcdFx0ZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodFxuXHRcdCk7XG5cdH07XG5cblx0ZXhwb3J0cy52aWV3cG9ydFRvcCA9IG51bGw7XG5cdGV4cG9ydHMudmlld3BvcnRCb3R0b20gPSBudWxsO1xuXHRleHBvcnRzLmRvY3VtZW50SGVpZ2h0ID0gbnVsbDtcblx0ZXhwb3J0cy52aWV3cG9ydEhlaWdodCA9IGdldFZpZXdwb3J0SGVpZ2h0KCk7XG5cblx0dmFyIHByZXZpb3VzRG9jdW1lbnRIZWlnaHQ7XG5cdHZhciBsYXRlc3RFdmVudDtcblxuXHR2YXIgY2FsY3VsYXRlVmlld3BvcnRJO1xuXHRmdW5jdGlvbiBjYWxjdWxhdGVWaWV3cG9ydCgpIHtcblx0XHRleHBvcnRzLnZpZXdwb3J0VG9wID0gc2Nyb2xsVG9wKCk7XG5cdFx0ZXhwb3J0cy52aWV3cG9ydEJvdHRvbSA9IGV4cG9ydHMudmlld3BvcnRUb3AgKyBleHBvcnRzLnZpZXdwb3J0SGVpZ2h0O1xuXHRcdGV4cG9ydHMuZG9jdW1lbnRIZWlnaHQgPSBnZXREb2N1bWVudEhlaWdodCgpO1xuXHRcdGlmIChleHBvcnRzLmRvY3VtZW50SGVpZ2h0ICE9PSBwcmV2aW91c0RvY3VtZW50SGVpZ2h0KSB7XG5cdFx0XHRjYWxjdWxhdGVWaWV3cG9ydEkgPSB3YXRjaGVycy5sZW5ndGg7XG5cdFx0XHR3aGlsZSggY2FsY3VsYXRlVmlld3BvcnRJLS0gKSB7XG5cdFx0XHRcdHdhdGNoZXJzW2NhbGN1bGF0ZVZpZXdwb3J0SV0ucmVjYWxjdWxhdGVMb2NhdGlvbigpO1xuXHRcdFx0fVxuXHRcdFx0cHJldmlvdXNEb2N1bWVudEhlaWdodCA9IGV4cG9ydHMuZG9jdW1lbnRIZWlnaHQ7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gcmVjYWxjdWxhdGVXYXRjaExvY2F0aW9uc0FuZFRyaWdnZXIoKSB7XG5cdFx0ZXhwb3J0cy52aWV3cG9ydEhlaWdodCA9IGdldFZpZXdwb3J0SGVpZ2h0KCk7XG5cdFx0Y2FsY3VsYXRlVmlld3BvcnQoKTtcblx0XHR1cGRhdGVBbmRUcmlnZ2VyV2F0Y2hlcnMoKTtcblx0fVxuXG5cdHZhciByZWNhbGN1bGF0ZUFuZFRyaWdnZXJUaW1lcjtcblx0ZnVuY3Rpb24gZGVib3VuY2VkUmVjYWxjdWF0ZUFuZFRyaWdnZXIoKSB7XG5cdFx0Y2xlYXJUaW1lb3V0KHJlY2FsY3VsYXRlQW5kVHJpZ2dlclRpbWVyKTtcblx0XHRyZWNhbGN1bGF0ZUFuZFRyaWdnZXJUaW1lciA9IHNldFRpbWVvdXQoIHJlY2FsY3VsYXRlV2F0Y2hMb2NhdGlvbnNBbmRUcmlnZ2VyLCAxMDAgKTtcblx0fVxuXG5cdHZhciB1cGRhdGVBbmRUcmlnZ2VyV2F0Y2hlcnNJO1xuXHRmdW5jdGlvbiB1cGRhdGVBbmRUcmlnZ2VyV2F0Y2hlcnMoKSB7XG5cdFx0Ly8gdXBkYXRlIGFsbCB3YXRjaGVycyB0aGVuIHRyaWdnZXIgdGhlIGV2ZW50cyBzbyBvbmUgY2FuIHJlbHkgb24gYW5vdGhlciBiZWluZyB1cCB0byBkYXRlLlxuXHRcdHVwZGF0ZUFuZFRyaWdnZXJXYXRjaGVyc0kgPSB3YXRjaGVycy5sZW5ndGg7XG5cdFx0d2hpbGUoIHVwZGF0ZUFuZFRyaWdnZXJXYXRjaGVyc0ktLSApIHtcblx0XHRcdHdhdGNoZXJzW3VwZGF0ZUFuZFRyaWdnZXJXYXRjaGVyc0ldLnVwZGF0ZSgpO1xuXHRcdH1cblxuXHRcdHVwZGF0ZUFuZFRyaWdnZXJXYXRjaGVyc0kgPSB3YXRjaGVycy5sZW5ndGg7XG5cdFx0d2hpbGUoIHVwZGF0ZUFuZFRyaWdnZXJXYXRjaGVyc0ktLSApIHtcblx0XHRcdHdhdGNoZXJzW3VwZGF0ZUFuZFRyaWdnZXJXYXRjaGVyc0ldLnRyaWdnZXJDYWxsYmFja3MoKTtcblx0XHR9XG5cblx0fVxuXG5cdGZ1bmN0aW9uIEVsZW1lbnRXYXRjaGVyKCB3YXRjaEl0ZW0sIG9mZnNldHMgKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdFx0dGhpcy53YXRjaEl0ZW0gPSB3YXRjaEl0ZW07XG5cblx0XHRpZiAoIW9mZnNldHMpIHtcblx0XHRcdHRoaXMub2Zmc2V0cyA9IGRlZmF1bHRPZmZzZXRzO1xuXHRcdH0gZWxzZSBpZiAob2Zmc2V0cyA9PT0gK29mZnNldHMpIHtcblx0XHRcdHRoaXMub2Zmc2V0cyA9IHt0b3A6IG9mZnNldHMsIGJvdHRvbTogb2Zmc2V0c307XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMub2Zmc2V0cyA9IHtcblx0XHRcdFx0dG9wOiBvZmZzZXRzLnRvcCB8fCBkZWZhdWx0T2Zmc2V0cy50b3AsXG5cdFx0XHRcdGJvdHRvbTogb2Zmc2V0cy5ib3R0b20gfHwgZGVmYXVsdE9mZnNldHMuYm90dG9tXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdHRoaXMuY2FsbGJhY2tzID0ge307IC8vIHtjYWxsYmFjazogZnVuY3Rpb24sIGlzT25lOiB0cnVlIH1cblxuXHRcdGZvciAodmFyIGkgPSAwLCBqID0gZXZlbnRUeXBlcy5sZW5ndGg7IGkgPCBqOyBpKyspIHtcblx0XHRcdHNlbGYuY2FsbGJhY2tzW2V2ZW50VHlwZXNbaV1dID0gW107XG5cdFx0fVxuXG5cdFx0dGhpcy5sb2NrZWQgPSBmYWxzZTtcblxuXHRcdHZhciB3YXNJblZpZXdwb3J0O1xuXHRcdHZhciB3YXNGdWxseUluVmlld3BvcnQ7XG5cdFx0dmFyIHdhc0Fib3ZlVmlld3BvcnQ7XG5cdFx0dmFyIHdhc0JlbG93Vmlld3BvcnQ7XG5cblx0XHR2YXIgbGlzdGVuZXJUb1RyaWdnZXJMaXN0STtcblx0XHR2YXIgbGlzdGVuZXI7XG5cdFx0ZnVuY3Rpb24gdHJpZ2dlckNhbGxiYWNrQXJyYXkoIGxpc3RlbmVycyApIHtcblx0XHRcdGlmIChsaXN0ZW5lcnMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdGxpc3RlbmVyVG9UcmlnZ2VyTGlzdEkgPSBsaXN0ZW5lcnMubGVuZ3RoO1xuXHRcdFx0d2hpbGUoIGxpc3RlbmVyVG9UcmlnZ2VyTGlzdEktLSApIHtcblx0XHRcdFx0bGlzdGVuZXIgPSBsaXN0ZW5lcnNbbGlzdGVuZXJUb1RyaWdnZXJMaXN0SV07XG5cdFx0XHRcdGxpc3RlbmVyLmNhbGxiYWNrLmNhbGwoIHNlbGYsIGxhdGVzdEV2ZW50ICk7XG5cdFx0XHRcdGlmIChsaXN0ZW5lci5pc09uZSkge1xuXHRcdFx0XHRcdGxpc3RlbmVycy5zcGxpY2UobGlzdGVuZXJUb1RyaWdnZXJMaXN0SSwgMSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0dGhpcy50cmlnZ2VyQ2FsbGJhY2tzID0gZnVuY3Rpb24gdHJpZ2dlckNhbGxiYWNrcygpIHtcblxuXHRcdFx0aWYgKHRoaXMuaXNJblZpZXdwb3J0ICYmICF3YXNJblZpZXdwb3J0KSB7XG5cdFx0XHRcdHRyaWdnZXJDYWxsYmFja0FycmF5KCB0aGlzLmNhbGxiYWNrc1tFTlRFUlZJRVdQT1JUXSApO1xuXHRcdFx0fVxuXHRcdFx0aWYgKHRoaXMuaXNGdWxseUluVmlld3BvcnQgJiYgIXdhc0Z1bGx5SW5WaWV3cG9ydCkge1xuXHRcdFx0XHR0cmlnZ2VyQ2FsbGJhY2tBcnJheSggdGhpcy5jYWxsYmFja3NbRlVMTFlFTlRFUlZJRVdQT1JUXSApO1xuXHRcdFx0fVxuXG5cblx0XHRcdGlmICh0aGlzLmlzQWJvdmVWaWV3cG9ydCAhPT0gd2FzQWJvdmVWaWV3cG9ydCAmJlxuXHRcdFx0XHR0aGlzLmlzQmVsb3dWaWV3cG9ydCAhPT0gd2FzQmVsb3dWaWV3cG9ydCkge1xuXG5cdFx0XHRcdHRyaWdnZXJDYWxsYmFja0FycmF5KCB0aGlzLmNhbGxiYWNrc1tWSVNJQklMSVRZQ0hBTkdFXSApO1xuXG5cdFx0XHRcdC8vIGlmIHlvdSBza2lwIGNvbXBsZXRlbHkgcGFzdCB0aGlzIGVsZW1lbnRcblx0XHRcdFx0aWYgKCF3YXNGdWxseUluVmlld3BvcnQgJiYgIXRoaXMuaXNGdWxseUluVmlld3BvcnQpIHtcblx0XHRcdFx0XHR0cmlnZ2VyQ2FsbGJhY2tBcnJheSggdGhpcy5jYWxsYmFja3NbRlVMTFlFTlRFUlZJRVdQT1JUXSApO1xuXHRcdFx0XHRcdHRyaWdnZXJDYWxsYmFja0FycmF5KCB0aGlzLmNhbGxiYWNrc1tQQVJUSUFMTFlFWElUVklFV1BPUlRdICk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKCF3YXNJblZpZXdwb3J0ICYmICF0aGlzLmlzSW5WaWV3cG9ydCkge1xuXHRcdFx0XHRcdHRyaWdnZXJDYWxsYmFja0FycmF5KCB0aGlzLmNhbGxiYWNrc1tFTlRFUlZJRVdQT1JUXSApO1xuXHRcdFx0XHRcdHRyaWdnZXJDYWxsYmFja0FycmF5KCB0aGlzLmNhbGxiYWNrc1tFWElUVklFV1BPUlRdICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0aWYgKCF0aGlzLmlzRnVsbHlJblZpZXdwb3J0ICYmIHdhc0Z1bGx5SW5WaWV3cG9ydCkge1xuXHRcdFx0XHR0cmlnZ2VyQ2FsbGJhY2tBcnJheSggdGhpcy5jYWxsYmFja3NbUEFSVElBTExZRVhJVFZJRVdQT1JUXSApO1xuXHRcdFx0fVxuXHRcdFx0aWYgKCF0aGlzLmlzSW5WaWV3cG9ydCAmJiB3YXNJblZpZXdwb3J0KSB7XG5cdFx0XHRcdHRyaWdnZXJDYWxsYmFja0FycmF5KCB0aGlzLmNhbGxiYWNrc1tFWElUVklFV1BPUlRdICk7XG5cdFx0XHR9XG5cdFx0XHRpZiAodGhpcy5pc0luVmlld3BvcnQgIT09IHdhc0luVmlld3BvcnQpIHtcblx0XHRcdFx0dHJpZ2dlckNhbGxiYWNrQXJyYXkoIHRoaXMuY2FsbGJhY2tzW1ZJU0lCSUxJVFlDSEFOR0VdICk7XG5cdFx0XHR9XG5cdFx0XHRzd2l0Y2goIHRydWUgKSB7XG5cdFx0XHRcdGNhc2Ugd2FzSW5WaWV3cG9ydCAhPT0gdGhpcy5pc0luVmlld3BvcnQ6XG5cdFx0XHRcdGNhc2Ugd2FzRnVsbHlJblZpZXdwb3J0ICE9PSB0aGlzLmlzRnVsbHlJblZpZXdwb3J0OlxuXHRcdFx0XHRjYXNlIHdhc0Fib3ZlVmlld3BvcnQgIT09IHRoaXMuaXNBYm92ZVZpZXdwb3J0OlxuXHRcdFx0XHRjYXNlIHdhc0JlbG93Vmlld3BvcnQgIT09IHRoaXMuaXNCZWxvd1ZpZXdwb3J0OlxuXHRcdFx0XHRcdHRyaWdnZXJDYWxsYmFja0FycmF5KCB0aGlzLmNhbGxiYWNrc1tTVEFURUNIQU5HRV0gKTtcblx0XHRcdH1cblxuXHRcdFx0d2FzSW5WaWV3cG9ydCA9IHRoaXMuaXNJblZpZXdwb3J0O1xuXHRcdFx0d2FzRnVsbHlJblZpZXdwb3J0ID0gdGhpcy5pc0Z1bGx5SW5WaWV3cG9ydDtcblx0XHRcdHdhc0Fib3ZlVmlld3BvcnQgPSB0aGlzLmlzQWJvdmVWaWV3cG9ydDtcblx0XHRcdHdhc0JlbG93Vmlld3BvcnQgPSB0aGlzLmlzQmVsb3dWaWV3cG9ydDtcblxuXHRcdH07XG5cblx0XHR0aGlzLnJlY2FsY3VsYXRlTG9jYXRpb24gPSBmdW5jdGlvbigpIHtcblx0XHRcdGlmICh0aGlzLmxvY2tlZCkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHR2YXIgcHJldmlvdXNUb3AgPSB0aGlzLnRvcDtcblx0XHRcdHZhciBwcmV2aW91c0JvdHRvbSA9IHRoaXMuYm90dG9tO1xuXHRcdFx0aWYgKHRoaXMud2F0Y2hJdGVtLm5vZGVOYW1lKSB7IC8vIGEgZG9tIGVsZW1lbnRcblx0XHRcdFx0dmFyIGNhY2hlZERpc3BsYXkgPSB0aGlzLndhdGNoSXRlbS5zdHlsZS5kaXNwbGF5O1xuXHRcdFx0XHRpZiAoY2FjaGVkRGlzcGxheSA9PT0gJ25vbmUnKSB7XG5cdFx0XHRcdFx0dGhpcy53YXRjaEl0ZW0uc3R5bGUuZGlzcGxheSA9ICcnO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dmFyIGJvdW5kaW5nUmVjdCA9IHRoaXMud2F0Y2hJdGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXHRcdFx0XHR0aGlzLnRvcCA9IGJvdW5kaW5nUmVjdC50b3AgKyBleHBvcnRzLnZpZXdwb3J0VG9wO1xuXHRcdFx0XHR0aGlzLmJvdHRvbSA9IGJvdW5kaW5nUmVjdC5ib3R0b20gKyBleHBvcnRzLnZpZXdwb3J0VG9wO1xuXG5cdFx0XHRcdGlmIChjYWNoZWREaXNwbGF5ID09PSAnbm9uZScpIHtcblx0XHRcdFx0XHR0aGlzLndhdGNoSXRlbS5zdHlsZS5kaXNwbGF5ID0gY2FjaGVkRGlzcGxheTtcblx0XHRcdFx0fVxuXG5cdFx0XHR9IGVsc2UgaWYgKHRoaXMud2F0Y2hJdGVtID09PSArdGhpcy53YXRjaEl0ZW0pIHsgLy8gbnVtYmVyXG5cdFx0XHRcdGlmICh0aGlzLndhdGNoSXRlbSA+IDApIHtcblx0XHRcdFx0XHR0aGlzLnRvcCA9IHRoaXMuYm90dG9tID0gdGhpcy53YXRjaEl0ZW07XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGhpcy50b3AgPSB0aGlzLmJvdHRvbSA9IGV4cG9ydHMuZG9jdW1lbnRIZWlnaHQgLSB0aGlzLndhdGNoSXRlbTtcblx0XHRcdFx0fVxuXG5cdFx0XHR9IGVsc2UgeyAvLyBhbiBvYmplY3Qgd2l0aCBhIHRvcCBhbmQgYm90dG9tIHByb3BlcnR5XG5cdFx0XHRcdHRoaXMudG9wID0gdGhpcy53YXRjaEl0ZW0udG9wO1xuXHRcdFx0XHR0aGlzLmJvdHRvbSA9IHRoaXMud2F0Y2hJdGVtLmJvdHRvbTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy50b3AgLT0gdGhpcy5vZmZzZXRzLnRvcDtcblx0XHRcdHRoaXMuYm90dG9tICs9IHRoaXMub2Zmc2V0cy5ib3R0b207XG5cdFx0XHR0aGlzLmhlaWdodCA9IHRoaXMuYm90dG9tIC0gdGhpcy50b3A7XG5cblx0XHRcdGlmICggKHByZXZpb3VzVG9wICE9PSB1bmRlZmluZWQgfHwgcHJldmlvdXNCb3R0b20gIT09IHVuZGVmaW5lZCkgJiYgKHRoaXMudG9wICE9PSBwcmV2aW91c1RvcCB8fCB0aGlzLmJvdHRvbSAhPT0gcHJldmlvdXNCb3R0b20pICkge1xuXHRcdFx0XHR0cmlnZ2VyQ2FsbGJhY2tBcnJheSggdGhpcy5jYWxsYmFja3NbTE9DQVRJT05DSEFOR0VdICk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHRoaXMucmVjYWxjdWxhdGVMb2NhdGlvbigpO1xuXHRcdHRoaXMudXBkYXRlKCk7XG5cblx0XHR3YXNJblZpZXdwb3J0ID0gdGhpcy5pc0luVmlld3BvcnQ7XG5cdFx0d2FzRnVsbHlJblZpZXdwb3J0ID0gdGhpcy5pc0Z1bGx5SW5WaWV3cG9ydDtcblx0XHR3YXNBYm92ZVZpZXdwb3J0ID0gdGhpcy5pc0Fib3ZlVmlld3BvcnQ7XG5cdFx0d2FzQmVsb3dWaWV3cG9ydCA9IHRoaXMuaXNCZWxvd1ZpZXdwb3J0O1xuXHR9XG5cblx0RWxlbWVudFdhdGNoZXIucHJvdG90eXBlID0ge1xuXHRcdG9uOiBmdW5jdGlvbiggZXZlbnQsIGNhbGxiYWNrLCBpc09uZSApIHtcblxuXHRcdFx0Ly8gdHJpZ2dlciB0aGUgZXZlbnQgaWYgaXQgYXBwbGllcyB0byB0aGUgZWxlbWVudCByaWdodCBub3cuXG5cdFx0XHRzd2l0Y2goIHRydWUgKSB7XG5cdFx0XHRcdGNhc2UgZXZlbnQgPT09IFZJU0lCSUxJVFlDSEFOR0UgJiYgIXRoaXMuaXNJblZpZXdwb3J0ICYmIHRoaXMuaXNBYm92ZVZpZXdwb3J0OlxuXHRcdFx0XHRjYXNlIGV2ZW50ID09PSBFTlRFUlZJRVdQT1JUICYmIHRoaXMuaXNJblZpZXdwb3J0OlxuXHRcdFx0XHRjYXNlIGV2ZW50ID09PSBGVUxMWUVOVEVSVklFV1BPUlQgJiYgdGhpcy5pc0Z1bGx5SW5WaWV3cG9ydDpcblx0XHRcdFx0Y2FzZSBldmVudCA9PT0gRVhJVFZJRVdQT1JUICYmIHRoaXMuaXNBYm92ZVZpZXdwb3J0ICYmICF0aGlzLmlzSW5WaWV3cG9ydDpcblx0XHRcdFx0Y2FzZSBldmVudCA9PT0gUEFSVElBTExZRVhJVFZJRVdQT1JUICYmIHRoaXMuaXNBYm92ZVZpZXdwb3J0OlxuXHRcdFx0XHRcdGNhbGxiYWNrLmNhbGwoIHRoaXMsIGxhdGVzdEV2ZW50ICk7XG5cdFx0XHRcdFx0aWYgKGlzT25lKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAodGhpcy5jYWxsYmFja3NbZXZlbnRdKSB7XG5cdFx0XHRcdHRoaXMuY2FsbGJhY2tzW2V2ZW50XS5wdXNoKHtjYWxsYmFjazogY2FsbGJhY2ssIGlzT25lOiBpc09uZXx8ZmFsc2V9KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcignVHJpZWQgdG8gYWRkIGEgc2Nyb2xsIG1vbml0b3IgbGlzdGVuZXIgb2YgdHlwZSAnK2V2ZW50KycuIFlvdXIgb3B0aW9ucyBhcmU6ICcrZXZlbnRUeXBlcy5qb2luKCcsICcpKTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdG9mZjogZnVuY3Rpb24oIGV2ZW50LCBjYWxsYmFjayApIHtcblx0XHRcdGlmICh0aGlzLmNhbGxiYWNrc1tldmVudF0pIHtcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDAsIGl0ZW07IGl0ZW0gPSB0aGlzLmNhbGxiYWNrc1tldmVudF1baV07IGkrKykge1xuXHRcdFx0XHRcdGlmIChpdGVtLmNhbGxiYWNrID09PSBjYWxsYmFjaykge1xuXHRcdFx0XHRcdFx0dGhpcy5jYWxsYmFja3NbZXZlbnRdLnNwbGljZShpLCAxKTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdUcmllZCB0byByZW1vdmUgYSBzY3JvbGwgbW9uaXRvciBsaXN0ZW5lciBvZiB0eXBlICcrZXZlbnQrJy4gWW91ciBvcHRpb25zIGFyZTogJytldmVudFR5cGVzLmpvaW4oJywgJykpO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0b25lOiBmdW5jdGlvbiggZXZlbnQsIGNhbGxiYWNrICkge1xuXHRcdFx0dGhpcy5vbiggZXZlbnQsIGNhbGxiYWNrLCB0cnVlKTtcblx0XHR9LFxuXHRcdHJlY2FsY3VsYXRlU2l6ZTogZnVuY3Rpb24oKSB7XG5cdFx0XHR0aGlzLmhlaWdodCA9IHRoaXMud2F0Y2hJdGVtLm9mZnNldEhlaWdodCArIHRoaXMub2Zmc2V0cy50b3AgKyB0aGlzLm9mZnNldHMuYm90dG9tO1xuXHRcdFx0dGhpcy5ib3R0b20gPSB0aGlzLnRvcCArIHRoaXMuaGVpZ2h0O1xuXHRcdH0sXG5cdFx0dXBkYXRlOiBmdW5jdGlvbigpIHtcblx0XHRcdHRoaXMuaXNBYm92ZVZpZXdwb3J0ID0gdGhpcy50b3AgPCBleHBvcnRzLnZpZXdwb3J0VG9wO1xuXHRcdFx0dGhpcy5pc0JlbG93Vmlld3BvcnQgPSB0aGlzLmJvdHRvbSA+IGV4cG9ydHMudmlld3BvcnRCb3R0b207XG5cblx0XHRcdHRoaXMuaXNJblZpZXdwb3J0ID0gKHRoaXMudG9wIDw9IGV4cG9ydHMudmlld3BvcnRCb3R0b20gJiYgdGhpcy5ib3R0b20gPj0gZXhwb3J0cy52aWV3cG9ydFRvcCk7XG5cdFx0XHR0aGlzLmlzRnVsbHlJblZpZXdwb3J0ID0gKHRoaXMudG9wID49IGV4cG9ydHMudmlld3BvcnRUb3AgJiYgdGhpcy5ib3R0b20gPD0gZXhwb3J0cy52aWV3cG9ydEJvdHRvbSkgfHxcblx0XHRcdFx0XHRcdFx0XHQgKHRoaXMuaXNBYm92ZVZpZXdwb3J0ICYmIHRoaXMuaXNCZWxvd1ZpZXdwb3J0KTtcblxuXHRcdH0sXG5cdFx0ZGVzdHJveTogZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgaW5kZXggPSB3YXRjaGVycy5pbmRleE9mKHRoaXMpLFxuXHRcdFx0XHRzZWxmICA9IHRoaXM7XG5cdFx0XHR3YXRjaGVycy5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0Zm9yICh2YXIgaSA9IDAsIGogPSBldmVudFR5cGVzLmxlbmd0aDsgaSA8IGo7IGkrKykge1xuXHRcdFx0XHRzZWxmLmNhbGxiYWNrc1tldmVudFR5cGVzW2ldXS5sZW5ndGggPSAwO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0Ly8gcHJldmVudCByZWNhbGN1bGF0aW5nIHRoZSBlbGVtZW50IGxvY2F0aW9uXG5cdFx0bG9jazogZnVuY3Rpb24oKSB7XG5cdFx0XHR0aGlzLmxvY2tlZCA9IHRydWU7XG5cdFx0fSxcblx0XHR1bmxvY2s6IGZ1bmN0aW9uKCkge1xuXHRcdFx0dGhpcy5sb2NrZWQgPSBmYWxzZTtcblx0XHR9XG5cdH07XG5cblx0dmFyIGV2ZW50SGFuZGxlckZhY3RvcnkgPSBmdW5jdGlvbiAodHlwZSkge1xuXHRcdHJldHVybiBmdW5jdGlvbiggY2FsbGJhY2ssIGlzT25lICkge1xuXHRcdFx0dGhpcy5vbi5jYWxsKHRoaXMsIHR5cGUsIGNhbGxiYWNrLCBpc09uZSk7XG5cdFx0fTtcblx0fTtcblxuXHRmb3IgKHZhciBpID0gMCwgaiA9IGV2ZW50VHlwZXMubGVuZ3RoOyBpIDwgajsgaSsrKSB7XG5cdFx0dmFyIHR5cGUgPSAgZXZlbnRUeXBlc1tpXTtcblx0XHRFbGVtZW50V2F0Y2hlci5wcm90b3R5cGVbdHlwZV0gPSBldmVudEhhbmRsZXJGYWN0b3J5KHR5cGUpO1xuXHR9XG5cblx0dHJ5IHtcblx0XHRjYWxjdWxhdGVWaWV3cG9ydCgpO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0dHJ5IHtcblx0XHRcdHdpbmRvdy4kKGNhbGN1bGF0ZVZpZXdwb3J0KTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0lmIHlvdSBtdXN0IHB1dCBzY3JvbGxNb25pdG9yIGluIHRoZSA8aGVhZD4sIHlvdSBtdXN0IHVzZSBqUXVlcnkuJyk7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gc2Nyb2xsTW9uaXRvckxpc3RlbmVyKGV2ZW50KSB7XG5cdFx0bGF0ZXN0RXZlbnQgPSBldmVudDtcblx0XHRjYWxjdWxhdGVWaWV3cG9ydCgpO1xuXHRcdHVwZGF0ZUFuZFRyaWdnZXJXYXRjaGVycygpO1xuXHR9XG5cblx0aWYgKHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKSB7XG5cdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIHNjcm9sbE1vbml0b3JMaXN0ZW5lcik7XG5cdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIGRlYm91bmNlZFJlY2FsY3VhdGVBbmRUcmlnZ2VyKTtcblx0fSBlbHNlIHtcblx0XHQvLyBPbGQgSUUgc3VwcG9ydFxuXHRcdHdpbmRvdy5hdHRhY2hFdmVudCgnb25zY3JvbGwnLCBzY3JvbGxNb25pdG9yTGlzdGVuZXIpO1xuXHRcdHdpbmRvdy5hdHRhY2hFdmVudCgnb25yZXNpemUnLCBkZWJvdW5jZWRSZWNhbGN1YXRlQW5kVHJpZ2dlcik7XG5cdH1cblxuXHRleHBvcnRzLmJlZ2V0ID0gZXhwb3J0cy5jcmVhdGUgPSBmdW5jdGlvbiggZWxlbWVudCwgb2Zmc2V0cyApIHtcblx0XHRpZiAodHlwZW9mIGVsZW1lbnQgPT09ICdzdHJpbmcnKSB7XG5cdFx0XHRlbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihlbGVtZW50KTtcblx0XHR9IGVsc2UgaWYgKGVsZW1lbnQgJiYgZWxlbWVudC5sZW5ndGggPiAwKSB7XG5cdFx0XHRlbGVtZW50ID0gZWxlbWVudFswXTtcblx0XHR9XG5cblx0XHR2YXIgd2F0Y2hlciA9IG5ldyBFbGVtZW50V2F0Y2hlciggZWxlbWVudCwgb2Zmc2V0cyApO1xuXHRcdHdhdGNoZXJzLnB1c2god2F0Y2hlcik7XG5cdFx0d2F0Y2hlci51cGRhdGUoKTtcblx0XHRyZXR1cm4gd2F0Y2hlcjtcblx0fTtcblxuXHRleHBvcnRzLnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdGxhdGVzdEV2ZW50ID0gbnVsbDtcblx0XHRjYWxjdWxhdGVWaWV3cG9ydCgpO1xuXHRcdHVwZGF0ZUFuZFRyaWdnZXJXYXRjaGVycygpO1xuXHR9O1xuXHRleHBvcnRzLnJlY2FsY3VsYXRlTG9jYXRpb25zID0gZnVuY3Rpb24oKSB7XG5cdFx0ZXhwb3J0cy5kb2N1bWVudEhlaWdodCA9IDA7XG5cdFx0ZXhwb3J0cy51cGRhdGUoKTtcblx0fTtcblxuXHRyZXR1cm4gZXhwb3J0cztcbn0pO1xuIiwiaW1wb3J0IENvbXBvbmVudCBmcm9tICdjb21wb25lbnQtbG9hZGVyLWpzL2Rpc3QvZXM1L2NvbXBvbmVudCc7XG5cbmNsYXNzIERva2kgZXh0ZW5kcyBDb21wb25lbnQge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlciguLi5hcmd1bWVudHMpO1xuXHRcdGNvbnNvbGUubG9nKCduZXcgRE9LSSA0MCcpO1xuXHR9XG5cblx0ZGVzdHJveSgpIHtcblx0XHRzdXBlci5kZXN0cm95KCk7XG5cdFx0Y29uc29sZS5sb2coJ2Rlc3Ryb3kgRE9LSScpO1xuXHR9XG59XG5cbmV4cG9ydCBkZWZhdWx0IERva2k7IiwiaW1wb3J0IENvbXBvbmVudCBmcm9tICdjb21wb25lbnQtbG9hZGVyLWpzL2Rpc3QvZXM1L2NvbXBvbmVudCc7XG5pbXBvcnQgYW5pbWF0aW9uRW5kRXZlbnQgZnJvbSAnLi4vdXRpbHMvYW5pbWF0aW9uLWVuZC1ldmVudCc7XG5pbXBvcnQgc2Nyb2xsU3RhdGUgZnJvbSAnLi4vdXRpbHMvc2Nyb2xsLXN0YXRlJztcblxuLyoqXG5cdFN0aWNreSBOYXYgY29tcG9uZW50XG5cblx0TGlzdGVucyB0byBzY3JvbGwgZXZlbnRzIGZyb20gdXRpbHMuU2Nyb2xsU3RhdGVcblxuXHQtIEFkZHMgQ0xBU1NfTE9DS0VEIHdoZW4gcGFzc2luZyBMT0NLX1RIUkVTSE9MRFxuXHQtIEFkZHMgQ0xBU1NfQkFDS0dST1VORCB3aGVuIHBhc3NpbmcgX2dldEJhY2tncm91bmRUaHJlc2hvbGQoKVxuXHQtIEFkZHMgQ0xBU1NfSElEREVOIGlmIHZpc2libGUgYW5kIHNjcm9sbGluZyBkb3duIHdpdGggZW5vdWdoIHNwZWVkXG5cdC0gQWRkcyBDTEFTU19WSVNJQkxFIGlmIHNjcm9sbGluZyB1cCBhbmQgaGlkZGVuXG4qL1xuXG5cbmNvbnN0IENMQVNTX0hJRERFTiA9ICdTdGlja3lOYXYtLWhpZGRlbic7XG5jb25zdCBDTEFTU19WSVNJQkxFID0gJ1N0aWNreU5hdi0tdmlzaWJsZSc7XG5jb25zdCBDTEFTU19MT0NLRUQgPSAnU3RpY2t5TmF2LS1sb2NrZWQnO1xuY29uc3QgQ0xBU1NfQkFDS0dST1VORCA9ICdTdGlja3lOYXYtLWJhY2tncm91bmQnO1xuXG4vLyBweCBmcm9tIHRvcCBvZiBkb2N1bWVudCB3aGVyZSAnbG9ja2VkJyBjbGFzcyBpcyBhZGRlZCAoaW5jbHVzaXZlKVxuY29uc3QgTE9DS19USFJFU0hPTEQgPSAwO1xuY29uc3QgQkdfVEhSRVNIT0xEID0gMjAwO1xuY29uc3QgSElERV9USFJFU0hPTEQgPSA4MDA7XG5cbi8vIFNwZWVkL0Rpc3RhbmNlIHJlcXVpcmVkIHRvIGNoYW5nZSBhcHBlYXJhbmNlIHBlciBzY3JvbGwgZnJhbWVcbmNvbnN0IE1JTl9TQ1JPTExfU1BFRUQgPSA1MDA7XG4vLyBjb25zdCBNSU5fU0NST0xMX0RJU1RBTkNFID0gMjA7XG5cblxuY2xhc3MgU3RpY2t5TmF2IGV4dGVuZHMgQ29tcG9uZW50IHtcblxuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlciguLi5hcmd1bWVudHMpO1xuXHRcdHRoaXMuJGRvY3VtZW50ID0gJChkb2N1bWVudCk7XG5cdFx0dGhpcy5pc0hpZGRlbiA9IGZhbHNlO1xuXHRcdHRoaXMuaXNMb2NrZWQgPSBmYWxzZTtcblx0XHR0aGlzLmhhc0JhY2tncm91bmQgPSBmYWxzZTtcblx0XHR0aGlzLmlzQnVzeUNoZWNraW5nID0gZmFsc2U7XG5cblx0XHR0aGlzLm9uU3RhdGVDaGFuZ2VkID0gdGhpcy5vblN0YXRlQ2hhbmdlZC5iaW5kKHRoaXMpO1xuXHRcdHRoaXMuY2hlY2tMb2NrVGhyZWFzaG9sZCA9IHRoaXMuY2hlY2tMb2NrVGhyZWFzaG9sZC5iaW5kKHRoaXMpO1xuXHRcdHRoaXMuY2hlY2tBcHBlYXJhbmNlID0gdGhpcy5jaGVja0FwcGVhcmFuY2UuYmluZCh0aGlzKTtcblxuXHRcdHRoaXMuaW5pdCgpO1xuXG5cdFx0dGhpcy5kZWZlcigoKSA9PiB7XG5cdFx0XHQvLyBwYXVzZSBhbmQgd2FpdCBmb3IgSGVybyBjb21wb25lbnQgdG8gYmUgaW5pdGlhbGl6ZWQgZmlyc3Rcblx0XHRcdHRoaXMuJGVsLmNzcygndmlzaWJpbGl0eScsICd2aXNpYmxlJyk7XG5cdFx0fSk7XG5cdH1cblxuXG5cdGluaXQoKSB7XG5cdFx0c2Nyb2xsU3RhdGUuc3Vic2NyaWJlKHNjcm9sbFN0YXRlLkVWRU5UX1NDUk9MTF9GUkFNRSwgdGhpcy5vblN0YXRlQ2hhbmdlZCk7XG5cdFx0Ly8gdGhpcy5zdWJzY3JpYmUoRW51bXMuQUNUSU9OX1NUSUNLWV9OQVZfU0hPV19CQUNLR1JPVU5ELCB0aGlzLmFkZEJhY2tncm91bmQpO1xuXHRcdC8vIHRoaXMuc3Vic2NyaWJlKEVudW1zLkFDVElPTl9TVElDS1lfTkFWX0hJREVfQkFDS0dST1VORCwgdGhpcy5yZW1vdmVCYWNrZ3JvdW5kKTtcblx0XHQvLyB0aGlzLm1vYmlsZUJyZWFrcG9pbnQgPSBCcmVha3BvaW50cy5vbih7XG5cdFx0Ly8gXHRuYW1lOiBcIkJSRUFLUE9JTlRfU01BTExcIlxuXHRcdC8vIH0pO1xuXHR9XG5cblxuXHRvblN0YXRlQ2hhbmdlZChzdGF0ZSkge1xuXHRcdGlmICghdGhpcy5pc0J1c3lDaGVja2luZykge1xuXHRcdFx0dGhpcy5pc0J1c3lDaGVja2luZyA9IHRydWU7XG5cdFx0XHR0aGlzLmNoZWNrTG9ja1RocmVhc2hvbGQoc3RhdGUpO1xuXHRcdFx0dGhpcy5jaGVja0JhY2tncm91bmRUaHJlYXNob2xkKHN0YXRlKTtcblx0XHRcdHRoaXMuY2hlY2tBcHBlYXJhbmNlKHN0YXRlKTtcblx0XHRcdHRoaXMuaXNCdXN5Q2hlY2tpbmcgPSBmYWxzZTtcblx0XHR9XG5cdH1cblxuXG5cdF9nZXRCYWNrZ3JvdW5kVGhyZXNob2xkKCkge1xuXHRcdC8vIGlmICh0aGlzLm1vYmlsZUJyZWFrcG9pbnQuaXNNYXRjaGVkKSB7XG5cdFx0Ly8gXHRyZXR1cm4gMTsgLy9zd2l0Y2ggYmcgYXMgc29vbiBhcyB3ZSBzdGFydCBzY3JvbGxpbmcgKHNjcm9sbD0wIG5lZWRzIHRyYW5zcGFyZW5jeSBvbiBtYXApXG5cdFx0Ly8gfVxuXHRcdHJldHVybiBCR19USFJFU0hPTEQgKyAxOyAvLyB3YWl0IHVudGlsIHBhc3NpbmcgdGhyZWFzaG9sZFxuXHR9XG5cblxuXHRzaG93KCkge1xuXHRcdGlmICh0aGlzLmlzSGlkZGVuKSB7XG5cdFx0XHRjb25zb2xlLmxvZygnc2hvdyEnKTtcblx0XHRcdHRoaXMuJGVsLmFkZENsYXNzKENMQVNTX1ZJU0lCTEUpLnJlbW92ZUNsYXNzKENMQVNTX0hJRERFTik7XG5cdFx0XHR0aGlzLmlzSGlkZGVuID0gZmFsc2U7XG5cdFx0XHR0aGlzLiRlbC5vbmUoYW5pbWF0aW9uRW5kRXZlbnQsICgpID0+IHtcblx0XHRcdFx0dGhpcy4kZWwucmVtb3ZlQ2xhc3MoQ0xBU1NfVklTSUJMRSk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH1cblxuXG5cdGhpZGUoKSB7XG5cdFx0aWYgKCF0aGlzLmlzSGlkZGVuKSB7XG5cdFx0XHRjb25zb2xlLmxvZygnaGlkZSEnKTtcblx0XHRcdHRoaXMuJGVsLmFkZENsYXNzKENMQVNTX0hJRERFTikucmVtb3ZlQ2xhc3MoQ0xBU1NfVklTSUJMRSk7XG5cdFx0XHR0aGlzLmlzSGlkZGVuID0gdHJ1ZTtcblx0XHR9XG5cdH1cblxuXG5cdGxvY2soKSB7XG5cdFx0aWYgKCF0aGlzLmlzTG9ja2VkKSB7XG5cdFx0XHR0aGlzLiRlbC5hZGRDbGFzcyhDTEFTU19MT0NLRUQpXG5cdFx0XHR0aGlzLmlzTG9ja2VkID0gdHJ1ZTtcblx0XHR9XG5cdH1cblxuXG5cdHVubG9jaygpIHtcblx0XHRpZiAodGhpcy5pc0xvY2tlZCkge1xuXHRcdFx0dGhpcy4kZWwucmVtb3ZlQ2xhc3MoQ0xBU1NfTE9DS0VEKVxuXHRcdFx0dGhpcy5pc0xvY2tlZCA9IGZhbHNlO1xuXHRcdH1cblx0fVxuXG5cblx0YWRkQmFja2dyb3VuZCgpIHtcblx0XHRpZiAoIXRoaXMuaGFzQmFja2dyb3VuZCkge1xuXHRcdFx0dGhpcy4kZWwuYWRkQ2xhc3MoQ0xBU1NfQkFDS0dST1VORClcblx0XHRcdHRoaXMuaGFzQmFja2dyb3VuZCA9IHRydWU7XG5cdFx0fVxuXHR9XG5cblxuXHRyZW1vdmVCYWNrZ3JvdW5kKCkge1xuXHRcdGlmICh0aGlzLmhhc0JhY2tncm91bmQpIHtcblx0XHRcdHRoaXMuJGVsLnJlbW92ZUNsYXNzKENMQVNTX0JBQ0tHUk9VTkQpXG5cdFx0XHR0aGlzLmhhc0JhY2tncm91bmQgPSBmYWxzZTtcblx0XHR9XG5cdH1cblxuXG5cdGlzQWJvdmVWaXNpYmxlVGhyZXNob2xkKHN0YXRlKSB7XG5cdFx0cmV0dXJuIHN0YXRlLnZpZXdwb3J0VG9wIDw9IEhJREVfVEhSRVNIT0xEO1xuXHR9XG5cblxuXHRjaGVja0xvY2tUaHJlYXNob2xkKHN0YXRlKSB7XG5cdFx0aWYgKHN0YXRlLnZpZXdwb3J0VG9wID49IExPQ0tfVEhSRVNIT0xEKSB7XG5cdFx0XHR0aGlzLmxvY2soKTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHR0aGlzLnVubG9jaygpO1xuXHRcdH1cblx0fVxuXG5cblx0Y2hlY2tCYWNrZ3JvdW5kVGhyZWFzaG9sZChzdGF0ZSkge1xuXHRcdGlmIChzdGF0ZS52aWV3cG9ydFRvcCA+PSB0aGlzLl9nZXRCYWNrZ3JvdW5kVGhyZXNob2xkKCkpIHtcblx0XHRcdHRoaXMuYWRkQmFja2dyb3VuZCgpO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHRoaXMucmVtb3ZlQmFja2dyb3VuZCgpO1xuXHRcdH1cblx0fVxuXG5cblx0Y2hlY2tBcHBlYXJhbmNlKHN0YXRlKSB7XG5cdFx0Ly8gc2Nyb2xsZWQgdG8gdGhlIHZlcnkgdG9wIG9yIGJvdHRvbTsgZWxlbWVudCBzbGlkZXMgaW5cblx0XHRpZiAodGhpcy5pc0Fib3ZlVmlzaWJsZVRocmVzaG9sZChzdGF0ZSkgfHwgc3RhdGUuaXNTY3JvbGxlZFRvQm90dG9tKSB7XG5cdFx0XHR0aGlzLnNob3coKTtcblx0XHR9XG5cdFx0ZWxzZSBpZiAoc3RhdGUuaXNTY3JvbGxpbmdEb3duKSB7XG5cdFx0XHR0aGlzLmhpZGUoKTtcblx0XHR9XG5cdFx0Ly8gZWxzZSBpZiBzY3JvbGxpbmcgdXAgd2l0aCBlbm91Z2ggc3BlZWRcblx0XHRlbHNlIGlmIChzdGF0ZS5zY3JvbGxTcGVlZCA+IE1JTl9TQ1JPTExfU1BFRUQpIHtcblx0XHRcdHRoaXMuc2hvdygpO1xuXHRcdH1cblx0fVxuXG5cblx0ZGVzdHJveSgpIHtcblx0XHR0aGlzLnNob3coKTtcblx0XHRzY3JvbGxTdGF0ZS51bnN1YnNjcmliZShzY3JvbGxTdGF0ZS5FVkVOVF9TQ1JPTExfRlJBTUUsIHRoaXMub25TdGF0ZUNoYW5nZWQpO1xuXHRcdC8vIHRoaXMudW5zdWJzY3JpYmUoRW51bXMuQUNUSU9OX1NUSUNLWV9OQVZfU0hPV19CQUNLR1JPVU5ELCB0aGlzLmFkZEJhY2tncm91bmQpO1xuXHRcdC8vIHRoaXMudW5zdWJzY3JpYmUoRW51bXMuQUNUSU9OX1NUSUNLWV9OQVZfSElERV9CQUNLR1JPVU5ELCB0aGlzLnJlbW92ZUJhY2tncm91bmQpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gU3RpY2t5TmF2O1xuIiwiLy8gaW1wb3J0ICdiYWJlbC1wb2x5ZmlsbCc7XG5cbmltcG9ydCBDb21wb25lbnRMb2FkZXIgZnJvbSAnY29tcG9uZW50LWxvYWRlci1qcy9kaXN0L2VzNS9jb21wb25lbnQtbG9hZGVyJztcblxuaW1wb3J0IERva2kgZnJvbSAnLi9jb21wb25lbnRzL2Rva2knO1xuaW1wb3J0IFN0aWNreU5hdiBmcm9tICcuL2NvbXBvbmVudHMvc3RpY2t5LW5hdic7XG5cblxubmV3IENvbXBvbmVudExvYWRlcih7XG5cdERva2ksXG5cdFN0aWNreU5hdlxufSkuc2NhbigpO1xuXG4iLCIvKlxuXHRSZXR1cm5zIHRoZSBicm93c2VyIHByZWZpeGVkXG5cdHN0cmluZyBmb3IgdGhlIGFuaW1hdGlvbiBlbmQgZXZlbnRcbiovXG5leHBvcnQgZGVmYXVsdCAoKCkgPT4ge1xuXHRsZXQgdCA9IHVuZGVmaW5lZDtcblx0bGV0IGV2ZW50TmFtZTtcblx0Y29uc3QgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblx0Y29uc3QgYW5pbWF0aW9uTmFtZXMgPSB7XG5cdFx0J1dlYmtpdEFuaW1hdGlvbic6ICd3ZWJraXRBbmltYXRpb25FbmQnLFxuXHRcdCdNb3pBbmltYXRpb24nOiAnYW5pbWF0aW9uZW5kJyxcblx0XHQnT0FuaW1hdGlvbic6ICdvQW5pbWF0aW9uRW5kIG9hbmltYXRpb25lbmQnLFxuXHRcdCdhbmltYXRpb24nOiAnYW5pbWF0aW9uZW5kJ1xuXHR9O1xuXHRPYmplY3Qua2V5cyhhbmltYXRpb25OYW1lcykuZm9yRWFjaCggKHQpID0+IHtcblx0XHRpZiAoZWwuc3R5bGVbdF0gIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0ZXZlbnROYW1lID0gYW5pbWF0aW9uTmFtZXNbdF07XG5cdFx0fVxuXHR9KTtcblx0cmV0dXJuIGV2ZW50TmFtZTtcbn0pKCk7XG4iLCJleHBvcnQgZGVmYXVsdCAoZnVuYywgdGhyZXNob2xkLCBleGVjQXNhcCkgPT4ge1xuXHRsZXQgdGltZW91dDtcblxuXHRyZXR1cm4gKCkgPT4ge1xuXHRcdGxldCBvYmogPSB0aGlzLCBhcmdzID0gYXJndW1lbnRzO1xuXG5cdFx0bGV0IGRlbGF5ZWQgPSAoKSA9PiB7XG5cdFx0XHRpZiAoIWV4ZWNBc2FwKSB7XG5cdFx0XHRcdGZ1bmMuYXBwbHkob2JqLCBhcmdzKTtcblx0XHRcdH1cblx0XHRcdHRpbWVvdXQgPSBudWxsO1xuXHRcdH1cblxuXHRcdGlmICh0aW1lb3V0KSB7XG5cdFx0XHRjbGVhclRpbWVvdXQodGltZW91dCk7XG5cdFx0fSBlbHNlIGlmIChleGVjQXNhcCkge1xuXHRcdFx0ZnVuYy5hcHBseShvYmosIGFyZ3MpO1xuXHRcdH1cblxuXHRcdHRpbWVvdXQgPSBzZXRUaW1lb3V0KGRlbGF5ZWQsIHRocmVzaG9sZCB8fCAxMDApO1xuXHR9XG59IiwiaW1wb3J0IGRlYm91bmNlIGZyb20gJy4vZGVib3VuY2UnO1xuaW1wb3J0IHNjcm9sbE1vbml0b3IgZnJvbSAnc2Nyb2xsTW9uaXRvcic7XG5cbi8qKlxuICogU2Nyb2xsIFN0YXRlIEFic3RyYWN0aW9uXG4gKlxuICogSG9sZHMgaW5mbyBhYm91dCBzY3JvbGwgcG9zaXRpb24sIHNwZWVkLCBkaXJlY3Rpb24sIGRvY3VtZW50IC8gdmlld3BvcnQgc2l6ZSwgZXRjXG4gKlxuICogVHJpZ2dlcnMgZXZlbnRzIGZvclxuICogICAtIFNjcm9sbCBTdGFydFxuICogICAtIFNjcm9sbCBTdG9wXG4gKiAgIC0gRWFjaCBzY3JvbGwgZnJhbWUgd2hpbGUgc2Nyb2xsaW5nXG4gKi9cbmNvbnN0ICRkb2N1bWVudCA9ICQoZG9jdW1lbnQpO1xuY29uc3QgJHdpbmRvdyA9ICQod2luZG93KTtcblxuY2xhc3MgU2Nyb2xsU3RhdGUge1xuXG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdC8vIEFueSB3YXkgdG8gZXhwb3J0IHN0YXRpYyBjbGFzcyBjb25zdGFudHMgd2l0aCBFUzY/IFRoZXNlIGV2ZW50IG5hbWVzIHNob3VsZCBiZSBwYWNrYWdlZCB3aXRoIHRoZSBtb2R1bGUuXG5cdFx0dGhpcy5FVkVOVF9TQ1JPTExfU1RBUlQgPSAnc2Nyb2xsc3RhdGU6c3RhcnQnO1xuXHRcdHRoaXMuRVZFTlRfU0NST0xMX1NUT1AgID0gJ3Njcm9sbHN0YXRlOnN0b3AnO1xuXHRcdHRoaXMuRVZFTlRfU0NST0xMX0ZSQU1FID0gJ3Njcm9sbHN0YXRlOmZyYW1lJztcblxuXHRcdHRoaXMudXBkYXRpbmcgID0gZmFsc2U7XG5cdFx0dGhpcy5sYXRlc3RGcmFtZSA9IERhdGUubm93KCk7XG5cblx0XHR0aGlzLnNjcm9sbERpZmYgICAgICAgICAgPSAwOyAgLy8gZGVsdGEgZnJvbSBsYXN0IHNjcm9sbCBwb3NpdGlvblxuXHRcdHRoaXMuc2Nyb2xsRGlzdGFuY2UgICAgICA9IDA7ICAvLyBhYnNvbHV0ZSBkZWx0YVxuXHRcdHRoaXMuc2Nyb2xsRGlyZWN0aW9uICAgICA9IDA7ICAvLyAtMSwgMCwgb3IgMVxuXHRcdHRoaXMubXNTaW5jZUxhdGVzdENoYW5nZSA9IDA7XG5cdFx0dGhpcy5zY3JvbGxTcGVlZCAgICAgICAgID0gMDsgIC8vIHBpeGVscyAvIHNlY29uZCBmb3IgbGF0ZXN0IGZyYW1lXG5cdFx0dGhpcy5kb2N1bWVudEhlaWdodCAgICAgID0gdW5kZWZpbmVkO1xuXHRcdHRoaXMudmlld3BvcnRIZWlnaHQgICAgICA9IHVuZGVmaW5lZDtcblx0XHR0aGlzLnZpZXdwb3J0VG9wICAgICAgICAgPSAwO1xuXHRcdHRoaXMudmlld3BvcnRCb3R0b20gICAgICA9IHVuZGVmaW5lZDtcblx0XHR0aGlzLmlzU2Nyb2xsaW5nVXAgICAgICAgPSB1bmRlZmluZWQ7XG5cdFx0dGhpcy5pc1Njcm9sbGluZ0Rvd24gICAgID0gdW5kZWZpbmVkO1xuXHRcdHRoaXMuaXNTY3JvbGxlZFRvVG9wICAgICA9IHVuZGVmaW5lZDtcblx0XHR0aGlzLmlzU2Nyb2xsZWRUb0JvdHRvbSAgPSB1bmRlZmluZWQ7XG5cblx0XHR0aGlzLmNhbGxiYWNrcyA9IHt9O1xuXG5cdFx0dGhpcy51cGRhdGVTdGF0ZSgpO1xuXHRcdHRoaXMub25TY3JvbGxTdGFydERlYm91bmNlZCA9IGRlYm91bmNlKHRoaXMuX29uU2Nyb2xsU3RhcnQuYmluZCh0aGlzKSwgNTAwLCB0cnVlKTtcblx0XHR0aGlzLm9uU2Nyb2xsU3RvcERlYm91bmNlZCA9IGRlYm91bmNlKHRoaXMuX29uU2Nyb2xsU3RvcC5iaW5kKHRoaXMpLCA1MDApO1xuXG5cdFx0dGhpcy5fYWRkRXZlbnRMaXN0ZW5lcnMoKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIE1lZGlhdG9yIGZ1bmN0aW9uYWxpdHkuXG5cdCAqIFN0b3JlcyB0aGUgZXZlbnQgYW5kIGNhbGxiYWNrIGdpdmVuIGJ5IHRoZSBjb21wb25lbnQuXG5cdCAqIGZvciBmdXJ0aGVyIHJlZmVyZW5jZS5cblx0ICogQHBhcmFtICB7U3RyaW5nfSBldmVudCAgICAgIGV2ZW50IHN0cmluZ1xuXHQgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY2FsbGJhY2sgQ2FsbGJhY2sgZnVuY3Rpb24gdGhhdCB3b3VsZCBiZSB0cmlnZ2VyZWQuXG5cdCAqL1xuXHRzdWJzY3JpYmUoZXZlbnQsIGNhbGxiYWNrLCBjb250ZXh0KSB7XG5cblx0XHQvLyBJcyB0aGlzIGEgbmV3IGV2ZW50P1xuXHRcdGlmICggIXRoaXMuY2FsbGJhY2tzLmhhc093blByb3BlcnR5KGV2ZW50KSApIHtcblx0XHRcdHRoaXMuY2FsbGJhY2tzW2V2ZW50XSA9IFtdO1xuXHRcdH1cblxuXHRcdC8vIFN0b3JlIHRoZSBzdWJzY3JpYmVyIGNhbGxiYWNrXG5cdFx0dGhpcy5jYWxsYmFja3NbZXZlbnRdLnB1c2goIHsgY29udGV4dDogY29udGV4dCwgY2FsbGJhY2s6IGNhbGxiYWNrIH0gKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIE1lZGlhdG9yIGZ1bmN0aW9uYWxpdHkuXG5cdCAqIFJlbW92ZXMgdGhlIHN0b3JlZCBldmVudCBhbmQgY2FsbGJhY2sgZ2l2ZW4gYnkgdGhlIGNvbXBvbmVudC5cblx0ICogQHBhcmFtICB7U3RyaW5nfSAgIGV2ZW50ICAgIGV2ZW50IHN0cmluZ1xuXHQgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY2FsbGJhY2sgQ2FsbGJhY2sgZnVuY3Rpb24gdGhhdCB3b3VsZCBiZSB0cmlnZ2VyZWQuXG5cdCAqIEByZXR1cm4ge0Jvb2xlYW59ICAgICAgICAgICAgVHJ1ZSBvbiBzdWNjZXNzLCBGYWxzZSBvdGhlcndpc2UuXG5cdCAqL1xuXHR1bnN1YnNjcmliZShldmVudCwgY2FsbGJhY2spIHtcblx0XHQvLyBEbyB3ZSBoYXZlIHRoaXMgZXZlbnQ/XG5cdFx0aWYgKCF0aGlzLmNhbGxiYWNrcy5oYXNPd25Qcm9wZXJ0eShldmVudCkpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBGaW5kIG91dCB3aGVyZSB0aGlzIGlzIGFuZCByZW1vdmUgaXRcblx0XHRmb3IgKGxldCBpID0gMCwgbGVuID0gdGhpcy5jYWxsYmFja3NbZXZlbnRdLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRpZiAodGhpcy5jYWxsYmFja3NbZXZlbnRdW2ldLmNhbGxiYWNrID09PSBjYWxsYmFjaykge1xuXHRcdFx0XHR0aGlzLmNhbGxiYWNrc1tldmVudF0uc3BsaWNlKGksIDEpO1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHQvKipcblx0ICogW3B1Ymxpc2ggZGVzY3JpcHRpb25dXG5cdCAqIEBwYXJhbSAge1t0eXBlXX0gZXZlbnQgW2Rlc2NyaXB0aW9uXVxuXHQgKiBAcmV0dXJuIHtbdHlwZV19ICAgICAgIFtkZXNjcmlwdGlvbl1cblx0ICovXG5cdF9wdWJsaXNoKGV2ZW50KSB7XG5cdFx0Ly8gQ2hlY2sgaWYgd2UgaGF2ZSBzdWJjcmliZXJzIHRvIHRoaXMgZXZlbnRcblx0XHRpZiAoIXRoaXMuY2FsbGJhY2tzLmhhc093blByb3BlcnR5KGV2ZW50KSkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdC8vIGRvbid0IHNsaWNlIG9uIGFyZ3VtZW50cyBiZWNhdXNlIGl0IHByZXZlbnRzIG9wdGltaXphdGlvbnMgaW4gSmF2YVNjcmlwdCBlbmdpbmVzIChWOCBmb3IgZXhhbXBsZSlcblx0XHQvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9GdW5jdGlvbnMvYXJndW1lbnRzXG5cdFx0Ly8gaHR0cHM6Ly9naXRodWIuY29tL3BldGthYW50b25vdi9ibHVlYmlyZC93aWtpL09wdGltaXphdGlvbi1raWxsZXJzIzMyLWxlYWtpbmctYXJndW1lbnRzXG5cdFx0Y29uc3QgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgKytpKSB7XG5cdFx0XHRcdGFyZ3NbaV0gPSBhcmd1bWVudHNbaSArIDFdOyAvLyByZW1vdmUgZmlyc3QgYXJndW1lbnRcblx0XHR9XG5cblx0XHQvLyBMb29wIHRocm91Z2ggdGhlbSBhbmQgZmlyZSB0aGUgY2FsbGJhY2tzXG5cdFx0Zm9yIChsZXQgaSA9IDAsIGxlbiA9IHRoaXMuY2FsbGJhY2tzW2V2ZW50XS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0bGV0IHN1YnNjcmlwdGlvbiA9IHRoaXMuY2FsbGJhY2tzW2V2ZW50XVtpXTtcblx0XHRcdC8vIENhbGwgaXQncyBjYWxsYmFja1xuXHRcdFx0aWYgKHN1YnNjcmlwdGlvbi5jYWxsYmFjaykge1xuXHRcdFx0XHRzdWJzY3JpcHRpb24uY2FsbGJhY2suYXBwbHkoc3Vic2NyaXB0aW9uLmNvbnRleHQsIGFyZ3MpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cblx0ZGVzdHJveSgpIHtcblx0XHR0aGlzLl9yZW1vdmVFdmVudExpc3RlbmVycygpO1xuXHR9XG5cblx0X2FkZEV2ZW50TGlzdGVuZXJzKCkge1xuXHRcdCR3aW5kb3cub24oJ3Njcm9sbCcsIHRoaXMub25TY3JvbGxTdGFydERlYm91bmNlZCk7XG5cdFx0JHdpbmRvdy5vbignc2Nyb2xsJywgdGhpcy5vblNjcm9sbFN0b3BEZWJvdW5jZWQpO1xuXHRcdCR3aW5kb3cub24oJ3Njcm9sbCcsIHRoaXMudXBkYXRlU3RhdGUuYmluZCh0aGlzKSk7XG5cdH1cblxuXHRfcmVtb3ZlRXZlbnRMaXN0ZW5lcnMoKSB7XG5cdFx0JHdpbmRvdy5vZmYoJ3Njcm9sbCcsIHRoaXMub25TY3JvbGxTdGFydERlYm91bmNlZCk7XG5cdFx0JHdpbmRvdy5vZmYoJ3Njcm9sbCcsIHRoaXMub25TY3JvbGxTdG9wRGVib3VuY2VkKTtcblx0XHQkd2luZG93Lm9mZignc2Nyb2xsJywgdGhpcy51cGRhdGVTdGF0ZS51bmJpbmQodGhpcykpO1xuXHR9XG5cblx0X29uU2Nyb2xsU3RhcnQoKSB7XG5cdFx0dGhpcy5fcHVibGlzaCh0aGlzLkVWRU5UX1NDUk9MTF9TVEFSVCwgdGhpcyk7XG5cdH1cblxuXHRfb25TY3JvbGxTdG9wKCkge1xuXHRcdHRoaXMuX3B1Ymxpc2godGhpcy5FVkVOVF9TQ1JPTExfU1RPUCwgdGhpcyk7XG5cdH1cblxuXHR1cGRhdGVTdGF0ZSgpIHtcblx0XHRpZiAodGhpcy51cGRhdGluZykgcmV0dXJuO1xuXHRcdHRoaXMudXBkYXRpbmcgPSB0cnVlO1xuXG5cdFx0dmFyIG5vdyA9IERhdGUubm93KCk7XG5cblx0XHQvLyBkaXN0YW5jZSBhbmQgc3BlZWQgY2FsY3Ncblx0XHR0aGlzLnNjcm9sbERpZmYgID0gdGhpcy52aWV3cG9ydFRvcCAtIHNjcm9sbE1vbml0b3Iudmlld3BvcnRUb3A7XG5cdFx0dGhpcy5zY3JvbGxEaXN0YW5jZSAgPSBNYXRoLmFicyh0aGlzLnNjcm9sbERpZmYpO1xuXHRcdHRoaXMuc2Nyb2xsRGlyZWN0aW9uID0gTWF0aC5tYXgoLTEsIE1hdGgubWluKDEsIHRoaXMuc2Nyb2xsRGlmZikpO1xuXHRcdHRoaXMubXNTaW5jZUxhdGVzdENoYW5nZSA9IChub3cgLSB0aGlzLmxhdGVzdEZyYW1lKTtcblx0XHR0aGlzLnNjcm9sbFNwZWVkID0gdGhpcy5zY3JvbGxEaXN0YW5jZSAvIHRoaXMubXNTaW5jZUxhdGVzdENoYW5nZSAqIDEwMDA7XG5cblx0XHQvLyB2aWV3cG9ydFxuXHRcdHRoaXMuZG9jdW1lbnRIZWlnaHQgPSBzY3JvbGxNb25pdG9yLmRvY3VtZW50SGVpZ2h0O1xuXHRcdHRoaXMudmlld3BvcnRIZWlnaHQgPSBzY3JvbGxNb25pdG9yLnZpZXdwb3J0SGVpZ2h0O1xuXHRcdHRoaXMudmlld3BvcnRUb3AgICAgPSBzY3JvbGxNb25pdG9yLnZpZXdwb3J0VG9wO1xuXHRcdHRoaXMudmlld3BvcnRCb3R0b20gPSBzY3JvbGxNb25pdG9yLnZpZXdwb3J0Qm90dG9tO1xuXG5cdFx0Ly8gaGVscGVyc1xuXHRcdHRoaXMuaXNTY3JvbGxpbmdVcCA9IHRoaXMuc2Nyb2xsRGlyZWN0aW9uID4gMDtcblx0XHR0aGlzLmlzU2Nyb2xsaW5nRG93biA9IHRoaXMuc2Nyb2xsRGlyZWN0aW9uIDwgMDtcblx0XHR0aGlzLmlzU2Nyb2xsZWRUb1RvcCA9IHRoaXMudmlld3BvcnRUb3AgPD0gMDtcblx0XHR0aGlzLmlzU2Nyb2xsZWRUb0JvdHRvbSA9IHRoaXMudmlld3BvcnRCb3R0b20gPj0gdGhpcy5kb2N1bWVudEhlaWdodDtcblxuXHRcdHRoaXMubGF0ZXN0RnJhbWUgPSBub3c7XG5cblx0XHR0aGlzLl9wdWJsaXNoKHRoaXMuRVZFTlRfU0NST0xMX0ZSQU1FLCB0aGlzKTtcblxuXHRcdHRoaXMudXBkYXRpbmcgPSBmYWxzZTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBTY3JvbGxTdGF0ZVxuIl19
