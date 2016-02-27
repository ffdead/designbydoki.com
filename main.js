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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvY29tcG9uZW50LWxvYWRlci1qcy9kaXN0L2VzNS9jb21wb25lbnQtbG9hZGVyLmpzIiwibm9kZV9tb2R1bGVzL2NvbXBvbmVudC1sb2FkZXItanMvZGlzdC9lczUvY29tcG9uZW50LmpzIiwibm9kZV9tb2R1bGVzL3Njcm9sbE1vbml0b3Ivc2Nyb2xsTW9uaXRvci5qcyIsInRoZW1lL2pzL2NvbXBvbmVudHMvZG9raS5qcyIsInRoZW1lL2pzL2NvbXBvbmVudHMvc3RpY2t5LW5hdi5qcyIsInRoZW1lL2pzL21haW4uanMiLCJ0aGVtZS9qcy91dGlscy9hbmltYXRpb24tZW5kLWV2ZW50LmpzIiwidGhlbWUvanMvdXRpbHMvZGVib3VuY2UuanMiLCJ0aGVtZS9qcy91dGlscy9zY3JvbGwtc3RhdGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lDclhNOzs7QUFDTCxVQURLLElBQ0wsR0FBYzt3QkFEVCxNQUNTOztxRUFEVCxrQkFFSyxZQURJOztBQUViLFVBQVEsR0FBUixDQUFZLGFBQVosRUFG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O0FBeUJiLFFBQUssV0FBTCxHQUFtQixHQUFuQixDQXpCYTs7QUEyQmIsUUFBSyxRQUFMLENBQWMsS0FBSyxrQkFBTCxFQUF5QixJQUF2QyxFQTNCYTs7QUE2QmIsUUFBSyxRQUFMLEdBQWdCLEtBQWhCLENBN0JhOzs7O1FBaElUOzs7QUFpS04sT0FBTyxPQUFQLEdBQWlCLElBQUksV0FBSixFQUFqQiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIENvbXBvbmVudExvYWRlciBDbGFzc1xuICpcbiAqIEluc3RhbnRpYXRlcyBKYXZhU2NyaXB0IENsYXNzZXMgd2hlbiB0aGVpciBuYW1lIGlzIGZvdW5kIGluIHRoZSBET00gdXNpbmcgYXR0cmlidXRlIGRhdGEtY29tcG9uZW50PVwiXCJcbiAqXG4gKi9cblwidXNlIHN0cmljdFwiO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gKGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0pKCk7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbnZhciBDb21wb25lbnRMb2FkZXIgPSAoZnVuY3Rpb24gKCkge1xuXG5cdC8qKlxuICAqIENvbnN0cnVjdG9yIGZvciB0aGUgQ29tcG9uZW50TG9hZGVyXG4gICogQGNsYXNzXG4gICogQHB1YmxpY1xuICAqIEBwYXJhbSB7T2JqZWN0fSBjb21wb25lbnRzIC0gT3B0aW9uYWwgY29sbGVjdGlvbiBvZiBhdmFpbGFibGUgY29tcG9uZW50czoge2NvbXBvbmVudE5hbWU6IGNsYXNzRGVmaW5pdGlvbn1cbiAgKiBAcGFyYW0ge05vZGV9IGNvbnRleHQgLSBPcHRpb25hbCBET00gbm9kZSB0byBzZWFyY2ggZm9yIGNvbXBvbmVudHMuIERlZmF1bHRzIHRvIGRvY3VtZW50LlxuICAqL1xuXG5cdGZ1bmN0aW9uIENvbXBvbmVudExvYWRlcigpIHtcblx0XHR2YXIgY29tcG9uZW50cyA9IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8ge30gOiBhcmd1bWVudHNbMF07XG5cdFx0dmFyIGNvbnRleHQgPSBhcmd1bWVudHNbMV0gPT09IHVuZGVmaW5lZCA/IGRvY3VtZW50IDogYXJndW1lbnRzWzFdO1xuXG5cdFx0X2NsYXNzQ2FsbENoZWNrKHRoaXMsIENvbXBvbmVudExvYWRlcik7XG5cblx0XHR0aGlzLmNvbnRleHRFbCA9IGNvbnRleHQ7XG5cdFx0dGhpcy5pbml0aWFsaXplZENvbXBvbmVudHMgPSB7fTtcblx0XHR0aGlzLm51bWJlck9mSW5pdGlhbGl6ZWRDb21wb25lbnRzID0gMDtcblx0XHR0aGlzLmNvbXBvbmVudHMgPSB7fTtcblx0XHR0aGlzLnRvcGljcyA9IHt9O1xuXHRcdHRoaXMucmVnaXN0ZXIoY29tcG9uZW50cyk7XG5cdH1cblxuXHRfY3JlYXRlQ2xhc3MoQ29tcG9uZW50TG9hZGVyLCBbe1xuXHRcdGtleTogXCJyZWdpc3RlclwiLFxuXG5cdFx0LyoqXG4gICAqIEFkZCBjb21wb25lbnQocykgdG8gY29sbGVjdGlvbiBvZiBhdmFpbGFibGUgY29tcG9uZW50c1xuICAgKiBAcHVibGljXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBjb21wb25lbnRzIC0gQ29sbGVjdGlvbiBvZiBjb21wb25lbnRzOiB7Y29tcG9uZW50TmFtZTogY2xhc3NEZWZpbml0aW9ufVxuICAgKi9cblx0XHR2YWx1ZTogZnVuY3Rpb24gcmVnaXN0ZXIoKSB7XG5cdFx0XHR2YXIgX3RoaXMgPSB0aGlzO1xuXG5cdFx0XHR2YXIgY29tcG9uZW50cyA9IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8ge30gOiBhcmd1bWVudHNbMF07XG5cblx0XHRcdE9iamVjdC5rZXlzKGNvbXBvbmVudHMpLmZvckVhY2goZnVuY3Rpb24gKGNvbXBvbmVudE5hbWUpIHtcblx0XHRcdFx0X3RoaXMuY29tcG9uZW50c1tjb21wb25lbnROYW1lXSA9IGNvbXBvbmVudHNbY29tcG9uZW50TmFtZV07XG5cdFx0XHR9KTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6IFwidW5yZWdpc3RlclwiLFxuXG5cdFx0LyoqXG4gICAqIFJlbW92ZSBjb21wb25lbnQgZnJvbSBjb2xsZWN0aW9uIG9mIGF2YWlsYWJsZSBjb21wb25lbnRzXG4gICAqIEBwdWJsaWNcbiAgICogQHBhcmFtIHtTdHJpbmd9IGNvbXBvbmVudE5hbWUgLSBOYW1lIG9mIHRoZSBjb21wb25lbnQgdG8gcmVtb3ZlXG4gICAqL1xuXHRcdHZhbHVlOiBmdW5jdGlvbiB1bnJlZ2lzdGVyKGNvbXBvbmVudE5hbWUpIHtcblx0XHRcdGRlbGV0ZSB0aGlzLmNvbXBvbmVudHNbY29tcG9uZW50TmFtZV07XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiBcInN1YnNjcmliZVwiLFxuXG5cdFx0LyoqXG4gICAqIE1lZGlhdG9yIGZ1bmN0aW9uYWxpdHkuXG4gICAqIFN0b3JlcyB0aGUgdG9waWMgYW5kIGNhbGxiYWNrIGdpdmVuIGJ5IHRoZSBjb21wb25lbnQuXG4gICAqIGZvciBmdXJ0aGVyIHJlZmVyZW5jZS5cbiAgICogQHBhcmFtICB7U3RyaW5nfSB0b3BpYyAgICAgIFRvcGljIHN0cmluZ1xuICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY2FsbGJhY2sgQ2FsbGJhY2sgZnVuY3Rpb24gdGhhdCB3b3VsZCBiZSB0cmlnZ2VyZWQuXG4gICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjb250ZXh0ICBDbGFzcyBpbnN0YW5jZSB3aGljaCBvd25zIHRoZSBjYWxsYmFja1xuICAgKi9cblx0XHR2YWx1ZTogZnVuY3Rpb24gc3Vic2NyaWJlKHRvcGljLCBjYWxsYmFjaywgY29udGV4dCkge1xuXG5cdFx0XHQvLyBJcyB0aGlzIGEgbmV3IHRvcGljP1xuXHRcdFx0aWYgKCF0aGlzLnRvcGljcy5oYXNPd25Qcm9wZXJ0eSh0b3BpYykpIHtcblx0XHRcdFx0dGhpcy50b3BpY3NbdG9waWNdID0gW107XG5cdFx0XHR9XG5cblx0XHRcdC8vIFN0b3JlIHRoZSBzdWJzY3JpYmVyIGNhbGxiYWNrXG5cdFx0XHR0aGlzLnRvcGljc1t0b3BpY10ucHVzaCh7IGNvbnRleHQ6IGNvbnRleHQsIGNhbGxiYWNrOiBjYWxsYmFjayB9KTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6IFwidW5zdWJzY3JpYmVcIixcblxuXHRcdC8qKlxuICAgKiBNZWRpYXRvciBmdW5jdGlvbmFsaXR5LlxuICAgKiBSZW1vdmVzIHRoZSBzdG9yZWQgdG9waWMgYW5kIGNhbGxiYWNrIGdpdmVuIGJ5IHRoZSBjb21wb25lbnQuXG4gICAqIEBwYXJhbSAge1N0cmluZ30gICB0b3BpYyAgICBUb3BpYyBzdHJpbmdcbiAgICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrIENhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgd291bGQgYmUgdHJpZ2dlcmVkLlxuICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY29udGV4dCAgQ2xhc3MgaW5zdGFuY2Ugd2hpY2ggb3ducyB0aGUgY2FsbGJhY2tcbiAgICogQHJldHVybiB7Qm9vbGVhbn0gICAgICAgICAgIFRydWUgb24gc3VjY2VzcywgRmFsc2Ugb3RoZXJ3aXNlLlxuICAgKi9cblx0XHR2YWx1ZTogZnVuY3Rpb24gdW5zdWJzY3JpYmUodG9waWMsIGNhbGxiYWNrLCBjb250ZXh0KSB7XG5cdFx0XHQvLyBEbyB3ZSBoYXZlIHRoaXMgdG9waWM/XG5cdFx0XHRpZiAoIXRoaXMudG9waWNzLmhhc093blByb3BlcnR5KHRvcGljKSkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdC8vIEZpbmQgb3V0IHdoZXJlIHRoaXMgaXMgYW5kIHJlbW92ZSBpdFxuXHRcdFx0Zm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMudG9waWNzW3RvcGljXS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0XHRpZiAodGhpcy50b3BpY3NbdG9waWNdW2ldLmNhbGxiYWNrID09PSBjYWxsYmFjaykge1xuXHRcdFx0XHRcdGlmICghY29udGV4dCB8fCB0aGlzLnRvcGljc1t0b3BpY11baV0uY29udGV4dCA9PT0gY29udGV4dCkge1xuXHRcdFx0XHRcdFx0dGhpcy50b3BpY3NbdG9waWNdLnNwbGljZShpLCAxKTtcblx0XHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiBcInB1Ymxpc2hcIixcblxuXHRcdC8qKlxuICAgKiBbcHVibGlzaCBkZXNjcmlwdGlvbl1cbiAgICogQHBhcmFtICB7W3R5cGVdfSB0b3BpYyBbZGVzY3JpcHRpb25dXG4gICAqIEByZXR1cm4ge1t0eXBlXX0gICAgICAgW2Rlc2NyaXB0aW9uXVxuICAgKi9cblx0XHR2YWx1ZTogZnVuY3Rpb24gcHVibGlzaCh0b3BpYykge1xuXHRcdFx0Ly8gQ2hlY2sgaWYgd2UgaGF2ZSBzdWJjcmliZXJzIHRvIHRoaXMgdG9waWNcblx0XHRcdGlmICghdGhpcy50b3BpY3MuaGFzT3duUHJvcGVydHkodG9waWMpKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gZG9uJ3Qgc2xpY2Ugb24gYXJndW1lbnRzIGJlY2F1c2UgaXQgcHJldmVudHMgb3B0aW1pemF0aW9ucyBpbiBKYXZhU2NyaXB0IGVuZ2luZXMgKFY4IGZvciBleGFtcGxlKVxuXHRcdFx0Ly8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4vZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvRnVuY3Rpb25zL2FyZ3VtZW50c1xuXHRcdFx0Ly8gaHR0cHM6Ly9naXRodWIuY29tL3BldGthYW50b25vdi9ibHVlYmlyZC93aWtpL09wdGltaXphdGlvbi1raWxsZXJzIzMyLWxlYWtpbmctYXJndW1lbnRzXG5cdFx0XHR2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyArK2kpIHtcblx0XHRcdFx0YXJnc1tpXSA9IGFyZ3VtZW50c1tpICsgMV07IC8vIHJlbW92ZSBmaXJzdCBhcmd1bWVudFxuXHRcdFx0fVxuXG5cdFx0XHQvLyBMb29wIHRocm91Z2ggdGhlbSBhbmQgZmlyZSB0aGUgY2FsbGJhY2tzXG5cdFx0XHRmb3IgKHZhciBfaSA9IDAsIGxlbiA9IHRoaXMudG9waWNzW3RvcGljXS5sZW5ndGg7IF9pIDwgbGVuOyBfaSsrKSB7XG5cdFx0XHRcdHZhciBzdWJzY3JpcHRpb24gPSB0aGlzLnRvcGljc1t0b3BpY11bX2ldO1xuXHRcdFx0XHQvLyBDYWxsIGl0J3MgY2FsbGJhY2tcblx0XHRcdFx0aWYgKHN1YnNjcmlwdGlvbiAmJiBzdWJzY3JpcHRpb24uY2FsbGJhY2spIHtcblx0XHRcdFx0XHRzdWJzY3JpcHRpb24uY2FsbGJhY2suYXBwbHkoc3Vic2NyaXB0aW9uLmNvbnRleHQsIGFyZ3MpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblx0fSwge1xuXHRcdGtleTogXCJzY2FuXCIsXG5cblx0XHQvKipcbiAgICogU2NhbiB0aGUgRE9NLCBpbml0aWFsaXplIG5ldyBjb21wb25lbnRzIGFuZCBkZXN0cm95IHJlbW92ZWQgY29tcG9uZW50cy5cbiAgICogQHB1YmxpY1xuICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIE9wdGlvbmFsIGRhdGEgb2JqZWN0IHRvIHBhc3MgdG8gdGhlIGNvbXBvbmVudCBjb25zdHJ1Y3RvclxuICAgKi9cblx0XHR2YWx1ZTogZnVuY3Rpb24gc2NhbigpIHtcblx0XHRcdHZhciBfdGhpczIgPSB0aGlzO1xuXG5cdFx0XHR2YXIgZGF0YSA9IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8ge30gOiBhcmd1bWVudHNbMF07XG5cblx0XHRcdHZhciBhY3RpdmVDb21wb25lbnRzID0ge30sXG5cdFx0XHQgICAgZWxlbWVudHMgPSB0aGlzLmNvbnRleHRFbC5xdWVyeVNlbGVjdG9yQWxsKFwiW2RhdGEtY29tcG9uZW50XVwiKTtcblxuXHRcdFx0W10uZm9yRWFjaC5jYWxsKGVsZW1lbnRzLCBmdW5jdGlvbiAoZWwpIHtcblx0XHRcdFx0X3RoaXMyLl9zY2FuRWxlbWVudChlbCwgYWN0aXZlQ29tcG9uZW50cywgZGF0YSk7XG5cdFx0XHR9KTtcblxuXHRcdFx0aWYgKHRoaXMubnVtYmVyT2ZJbml0aWFsaXplZENvbXBvbmVudHMgPiAwKSB0aGlzLmNsZWFuVXBfKGFjdGl2ZUNvbXBvbmVudHMpO1xuXHRcdH1cblx0fSwge1xuXHRcdGtleTogXCJfc2NhbkVsZW1lbnRcIixcblxuXHRcdC8qKlxuICAgKiBGaW5kIGFsbCBjb21wb25lbnRzIHJlZ2lzdGVyZWQgb24gYSBzcGVjaWZpYyBET00gZWxlbWVudCBhbmQgaW5pdGlhbGl6ZSB0aGVtIGlmIG5ld1xuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge0VsZW1lbnR9IGVsIC0gRE9NIGVsZW1lbnQgdG8gc2NhbiBmb3IgY29tcG9uZW50c1xuICAgKiBAcGFyYW0ge09iamVjdH0gYWN0aXZlQ29tcG9uZW50cyAtIEFsbCBjb21wb25lbnRJZHMgY3VycmVudGx5IGZvdW5kIGluIHRoZSBET01cbiAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBPcHRpb25hbCBkYXRhIG9iamVjdCB0byBwYXNzIHRvIHRoZSBjb21wb25lbnQgY29uc3RydWN0b3JcbiAgICovXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIF9zY2FuRWxlbWVudChlbCwgYWN0aXZlQ29tcG9uZW50cywgZGF0YSkge1xuXHRcdFx0dmFyIF90aGlzMyA9IHRoaXM7XG5cblx0XHRcdC8vIGNoZWNrIG9mIGNvbXBvbmVudChzKSBmb3IgdGhpcyBET00gZWxlbWVudCBhbHJlYWR5IGhhdmUgYmVlbiBpbml0aWFsaXplZFxuXHRcdFx0dmFyIGVsZW1lbnRJZCA9IGVsLmdldEF0dHJpYnV0ZShcImRhdGEtY29tcG9uZW50LWlkXCIpO1xuXG5cdFx0XHRpZiAoIWVsZW1lbnRJZCkge1xuXHRcdFx0XHQvLyBnaXZlIHVuaXF1ZSBpZCBzbyB3ZSBjYW4gdHJhY2sgaXQgb24gbmV4dCBzY2FuXG5cdFx0XHRcdGVsZW1lbnRJZCA9IHRoaXMuX2dlbmVyYXRlVVVJRCgpO1xuXHRcdFx0XHRlbC5zZXRBdHRyaWJ1dGUoXCJkYXRhLWNvbXBvbmVudC1pZFwiLCBlbGVtZW50SWQpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBmaW5kIHRoZSBuYW1lIG9mIHRoZSBjb21wb25lbnQgaW5zdGFuY2Vcblx0XHRcdHZhciBjb21wb25lbnRMaXN0ID0gZWwuZ2V0QXR0cmlidXRlKFwiZGF0YS1jb21wb25lbnRcIikubWF0Y2goL1xcUysvZyk7XG5cdFx0XHRjb21wb25lbnRMaXN0LmZvckVhY2goZnVuY3Rpb24gKGNvbXBvbmVudE5hbWUpIHtcblxuXHRcdFx0XHR2YXIgY29tcG9uZW50SWQgPSBjb21wb25lbnROYW1lICsgXCItXCIgKyBlbGVtZW50SWQ7XG5cdFx0XHRcdGFjdGl2ZUNvbXBvbmVudHNbY29tcG9uZW50SWRdID0gdHJ1ZTtcblxuXHRcdFx0XHQvLyBjaGVjayBpZiBjb21wb25lbnQgbm90IGluaXRpYWxpemVkIGJlZm9yZVxuXHRcdFx0XHRpZiAoIV90aGlzMy5pbml0aWFsaXplZENvbXBvbmVudHNbY29tcG9uZW50SWRdKSB7XG5cdFx0XHRcdFx0X3RoaXMzLl9pbml0aWFsaXplQ29tcG9uZW50KGNvbXBvbmVudE5hbWUsIGNvbXBvbmVudElkLCBlbCwgZGF0YSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH1cblx0fSwge1xuXHRcdGtleTogXCJfaW5pdGlhbGl6ZUNvbXBvbmVudFwiLFxuXG5cdFx0LyoqXG4gICAqIENhbGwgY29uc3RydWN0b3Igb2YgY29tcG9uZW50IGFuZCBhZGQgaW5zdGFuY2UgdG8gdGhlIGNvbGxlY3Rpb24gb2YgaW5pdGlhbGl6ZWQgY29tcG9uZW50c1xuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gY29tcG9uZW50TmFtZSAtIE5hbWUgb2YgdGhlIGNvbXBvbmVudCB0byBpbml0aWFsaXplLiBVc2VkIHRvIGxvb2t1cCBjbGFzcyBkZWZpbml0aW9uIGluIGNvbXBvbmVudHMgY29sbGVjdGlvbi5cbiAgICogQHBhcmFtIHtTdHJpbmd9IGNvbXBvbmVudElkIC0gVW5pcXVlIGNvbXBvbmVudCBJRCAoY29tYmluYXRpb24gb2YgY29tcG9uZW50IG5hbWUgYW5kIGVsZW1lbnQgSUQpXG4gICAqIEBwYXJhbSB7RWxlbWVudH0gZWwgLSBET00gZWxlbWVudCB0aGF0IGlzIHRoZSBjb250ZXh0IG9mIHRoaXMgY29tcG9uZW50XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gT3B0aW9uYWwgZGF0YSBvYmplY3QgdG8gcGFzcyB0byB0aGUgY29tcG9uZW50IGNvbnN0cnVjdG9yXG4gICAqL1xuXHRcdHZhbHVlOiBmdW5jdGlvbiBfaW5pdGlhbGl6ZUNvbXBvbmVudChjb21wb25lbnROYW1lLCBjb21wb25lbnRJZCwgZWwsIGRhdGEpIHtcblx0XHRcdHZhciBjb21wb25lbnQgPSB0aGlzLmNvbXBvbmVudHNbY29tcG9uZW50TmFtZV07XG5cblx0XHRcdGlmICh0eXBlb2YgY29tcG9uZW50ICE9PSBcImZ1bmN0aW9uXCIpIHRocm93IFwiQ29tcG9uZW50TG9hZGVyOiB1bmtub3duIGNvbXBvbmVudCAnXCIgKyBjb21wb25lbnROYW1lICsgXCInXCI7XG5cblx0XHRcdHZhciBpbnN0YW5jZSA9IG5ldyBjb21wb25lbnQoZWwsIGRhdGEsIHRoaXMpO1xuXG5cdFx0XHR0aGlzLmluaXRpYWxpemVkQ29tcG9uZW50c1tjb21wb25lbnRJZF0gPSBpbnN0YW5jZTtcblx0XHRcdHRoaXMubnVtYmVyT2ZJbml0aWFsaXplZENvbXBvbmVudHMrKztcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6IFwiX2Rlc3Ryb3lDb21wb25lbnRcIixcblxuXHRcdC8qKlxuICAgKiBDYWxsIGRlc3Ryb3koKSBvbiBhIGNvbXBvbmVudCBpbnN0YW5jZSBhbmQgcmVtb3ZlIGl0IGZyb20gdGhlIGNvbGxlY3Rpb24gb2YgaW5pdGlhbGl6ZWQgY29tcG9uZW50c1xuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gY29tcG9uZW50SWQgLSBVbmlxdWUgY29tcG9uZW50IElEIHVzZWQgdG8gZmluZCBjb21wb25lbnQgaW5zdGFuY2VcbiAgICovXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIF9kZXN0cm95Q29tcG9uZW50KGNvbXBvbmVudElkKSB7XG5cdFx0XHR2YXIgaW5zdGFuY2UgPSB0aGlzLmluaXRpYWxpemVkQ29tcG9uZW50c1tjb21wb25lbnRJZF07XG5cdFx0XHRpZiAoaW5zdGFuY2UgJiYgdHlwZW9mIGluc3RhbmNlLmRlc3Ryb3kgPT09IFwiZnVuY3Rpb25cIikgaW5zdGFuY2UuZGVzdHJveSgpO1xuXG5cdFx0XHQvLyBzYWZlIHRvIGRlbGV0ZSB3aGlsZSBvYmplY3Qga2V5cyB3aGlsZSBsb29waW5naHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8zNDYzMDQ4L2lzLWl0LXNhZmUtdG8tZGVsZXRlLWFuLW9iamVjdC1wcm9wZXJ0eS13aGlsZS1pdGVyYXRpbmctb3Zlci10aGVtXG5cdFx0XHRkZWxldGUgdGhpcy5pbml0aWFsaXplZENvbXBvbmVudHNbY29tcG9uZW50SWRdO1xuXHRcdFx0dGhpcy5udW1iZXJPZkluaXRpYWxpemVkQ29tcG9uZW50cy0tO1xuXHRcdH1cblx0fSwge1xuXHRcdGtleTogXCJjbGVhblVwX1wiLFxuXG5cdFx0LyoqXG4gICAqIERlc3Ryb3kgaW5haXRpYWxpemVkIGNvbXBvbmVudHMgdGhhdCBubyBsb25nZXIgYXJlIGFjdGl2ZVxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge09iamVjdH0gYWN0aXZlQ29tcG9uZW50cyAtIEFsbCBjb21wb25lbnRJZHMgY3VycmVudGx5IGZvdW5kIGluIHRoZSBET01cbiAgICovXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIGNsZWFuVXBfKCkge1xuXHRcdFx0dmFyIF90aGlzNCA9IHRoaXM7XG5cblx0XHRcdHZhciBhY3RpdmVDb21wb25lbnRzID0gYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyB7fSA6IGFyZ3VtZW50c1swXTtcblxuXHRcdFx0T2JqZWN0LmtleXModGhpcy5pbml0aWFsaXplZENvbXBvbmVudHMpLmZvckVhY2goZnVuY3Rpb24gKGNvbXBvbmVudElkKSB7XG5cdFx0XHRcdGlmICghYWN0aXZlQ29tcG9uZW50c1tjb21wb25lbnRJZF0pIHtcblx0XHRcdFx0XHRfdGhpczQuX2Rlc3Ryb3lDb21wb25lbnQoY29tcG9uZW50SWQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6IFwiX2dlbmVyYXRlVVVJRFwiLFxuXG5cdFx0LyoqXG4gICAqIEdlbmVyYXRlcyBhIHJmYzQxMjIgdmVyc2lvbiA0IGNvbXBsaWFudCB1bmlxdWUgSURcbiAgICogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xMDUwMzQvY3JlYXRlLWd1aWQtdXVpZC1pbi1qYXZhc2NyaXB0XG4gICAqIEBwcml2YXRlXG4gICAqL1xuXHRcdHZhbHVlOiBmdW5jdGlvbiBfZ2VuZXJhdGVVVUlEKCkge1xuXHRcdFx0cmV0dXJuIFwieHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4XCIucmVwbGFjZSgvW3h5XS9nLCBmdW5jdGlvbiAoYykge1xuXHRcdFx0XHR2YXIgciA9IE1hdGgucmFuZG9tKCkgKiAxNiB8IDAsXG5cdFx0XHRcdCAgICB2ID0gYyA9PSBcInhcIiA/IHIgOiByICYgMHgzIHwgMHg4O1xuXHRcdFx0XHRyZXR1cm4gdi50b1N0cmluZygxNik7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH1dKTtcblxuXHRyZXR1cm4gQ29tcG9uZW50TG9hZGVyO1xufSkoKTtcblxuLy8gRXhwb3J0IEFNRCwgQ29tbW9uSlMvRVM2IG1vZHVsZSBvciBhc3N1bWUgZ2xvYmFsIG5hbWVzcGFjZVxuaWYgKHR5cGVvZiBkZWZpbmUgIT09IFwidW5kZWZpbmVkXCIgJiYgZGVmaW5lLmFtZCkge1xuXHRkZWZpbmUoW10sIENvbXBvbmVudExvYWRlcik7XG59IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT09IFwidW5kZWZpbmVkXCIgJiYgbW9kdWxlLmV4cG9ydHMpIHtcblx0bW9kdWxlLmV4cG9ydHMgPSBDb21wb25lbnRMb2FkZXI7XG59IGVsc2Uge1xuXHR3aW5kb3cuQ29tcG9uZW50TG9hZGVyID0gQ29tcG9uZW50TG9hZGVyO1xufSIsIi8qKlxuICogQ29tcG9uZW50IEJhc2UgQ2xhc3NcbiAqIFxuICogU2V0cyBhbGwgYXJndW1lbnRzIHBhc3NlZCBpbiB0byBjb25zdHJ1Y3RvciBmcm9tIENvbXBvbmVudExvYWRlclxuICpcbiAqIEV4cG9zZXMgcHViL3N1YiBtZXRob2RzIGZvciB0cmlnZ2VyaW5nIGV2ZW50cyB0byBvdGhlciBjb21wb25lbnRzXG4gKlxuICovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSAoZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKCd2YWx1ZScgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0pKCk7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uJyk7IH0gfVxuXG52YXIgQ29tcG9uZW50ID0gKGZ1bmN0aW9uICgpIHtcblxuXHQvKipcbiAgKiBDb25zdHJ1Y3RvciBmb3IgdGhlIENvbXBvbmVudFxuICAqXG4gICogQ2FsbCBgc3VwZXIoLi4uYXJndW1lbnRzKTtgIGluIHRoZSBiYXNlIGNsYXNzIGNvbnN0cnVjdG9yXG4gICpcbiAgKiBAcHVibGljXG4gICogQHBhcmFtIHtOb2RlfSBjb250ZXh0IC0gRE9NIG5vZGUgdGhhdCBjb250YWlucyB0aGUgY29tcG9uZW50IG1hcmt1cFxuICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gT3B0aW9uYWwgZGF0YSBvYmplY3QgZnJvbSBDb21wb25lbnRMb2FkZXIuc2NhbigpXG4gICogQHBhcmFtIHtPYmplY3R9IG1lZGlhdG9yIC0gaW5zdGFuY2Ugb2YgQ29tcG9uZW50TG9hZGVyIGZvciBwdWIvc3ViXG4gICovXG5cblx0ZnVuY3Rpb24gQ29tcG9uZW50KCkge1xuXHRcdF9jbGFzc0NhbGxDaGVjayh0aGlzLCBDb21wb25lbnQpO1xuXG5cdFx0dGhpcy5lbCA9IGFyZ3VtZW50c1swXTtcblx0XHRpZiAodHlwZW9mIGpRdWVyeSAhPT0gJ3VuZGVmaW5lZCcpIHRoaXMuJGVsID0galF1ZXJ5KHRoaXMuZWwpO1xuXHRcdHRoaXMuZGF0YSA9IGFyZ3VtZW50c1sxXTtcblx0XHR0aGlzLl9fbWVkaWF0b3IgPSBhcmd1bWVudHNbMl07XG5cdH1cblxuXHRfY3JlYXRlQ2xhc3MoQ29tcG9uZW50LCBbe1xuXHRcdGtleTogJ3B1Ymxpc2gnLFxuXG5cdFx0LyoqXG4gICAqIFB1Ymxpc2ggYW4gZXZlbnQgZm9yIG90aGVyIGNvbXBvbmVudHNcbiAgICogQHByb3RlY3RlZFxuICAgKiBAcGFyYW0ge1N0cmluZ30gdG9waWMgLSBFdmVudCBuYW1lXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gT3B0aW9uYWwgcGFyYW1zIHRvIHBhc3Mgd2l0aCB0aGUgZXZlbnRcbiAgICovXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIHB1Ymxpc2goKSB7XG5cdFx0XHR2YXIgX21lZGlhdG9yO1xuXG5cdFx0XHQoX21lZGlhdG9yID0gdGhpcy5fX21lZGlhdG9yKS5wdWJsaXNoLmFwcGx5KF9tZWRpYXRvciwgYXJndW1lbnRzKTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6ICdzdWJzY3JpYmUnLFxuXG5cdFx0LyoqXG4gICAqIFN1YnNjcmliZSB0byBhbiBldmVudCBmcm9tIGFub3RoZXIgY29tcG9uZW50XG4gICAqIEBwcm90ZWN0ZWRcbiAgICogQHBhcmFtIHtTdHJpbmd9IHRvcGljIC0gRXZlbnQgbmFtZVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIEZ1bmN0aW9uIHRvIGJpbmRcbiAgICovXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIHN1YnNjcmliZSh0b3BpYywgY2FsbGJhY2spIHtcblx0XHRcdHRoaXMuX19tZWRpYXRvci5zdWJzY3JpYmUodG9waWMsIGNhbGxiYWNrLCB0aGlzKTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6ICd1bnN1YnNjcmliZScsXG5cblx0XHQvKipcbiAgICogVW5zdWJzY3JpYmUgZnJvbSBhbiBldmVudCBmcm9tIGFub3RoZXIgY29tcG9uZW50XG4gICAqIEBwcm90ZWN0ZWRcbiAgICogQHBhcmFtIHtTdHJpbmd9IHRvcGljIC0gRXZlbnQgbmFtZVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIEZ1bmN0aW9uIHRvIHVuYmluZFxuICAgKi9cblx0XHR2YWx1ZTogZnVuY3Rpb24gdW5zdWJzY3JpYmUodG9waWMsIGNhbGxiYWNrKSB7XG5cdFx0XHR0aGlzLl9fbWVkaWF0b3IudW5zdWJzY3JpYmUodG9waWMsIGNhbGxiYWNrLCB0aGlzKTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6ICdzY2FuJyxcblxuXHRcdC8qKlxuICAgKiBVdGlsaXR5IG1ldGhvZCBmb3IgdHJpZ2dlcmluZyB0aGUgQ29tcG9uZW50TG9hZGVyIHRvIHNjYW4gdGhlIG1hcmt1cCBmb3IgbmV3IGNvbXBvbmVudHNcbiAgICogQHByb3RlY3RlZFxuICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIE9wdGlvbmFsIGRhdGEgdG8gcGFzcyB0byB0aGUgY29uc3RydWN0b3Igb2YgYW55IENvbXBvbmVudCBpbml0aWFsaXplZCBieSB0aGlzIHNjYW5cbiAgICovXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIHNjYW4oZGF0YSkge1xuXHRcdFx0dGhpcy5fX21lZGlhdG9yLnNjYW4oZGF0YSk7XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiAnZGVmZXInLFxuXG5cdFx0LyoqXG4gICAqIFV0aWxpdHkgbWV0aG9kIGZvciBkZWZlcmluZyBhIGZ1bmN0aW9uIGNhbGxcbiAgICogQHByb3RlY3RlZFxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIEZ1bmN0aW9uIHRvIGNhbGxcbiAgICogQHBhcmFtIHtOdW1iZXJ9IG1zIC0gT3B0aW9uYWwgbXMgdG8gZGVsYXksIGRlZmF1bHRzIHRvIDE3bXMgKGp1c3Qgb3ZlciAxIGZyYW1lIGF0IDYwZnBzKVxuICAgKi9cblx0XHR2YWx1ZTogZnVuY3Rpb24gZGVmZXIoY2FsbGJhY2spIHtcblx0XHRcdHZhciBtcyA9IGFyZ3VtZW50c1sxXSA9PT0gdW5kZWZpbmVkID8gMTcgOiBhcmd1bWVudHNbMV07XG5cblx0XHRcdHNldFRpbWVvdXQoY2FsbGJhY2ssIG1zKTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6ICdkZXN0cm95JyxcblxuXHRcdC8qKlxuICAgKiBDYWxsZWQgYnkgQ29tcG9uZW50TG9hZGVyIHdoZW4gY29tcG9uZW50IGlzIG5vIGxvbmdlciBmb3VuZCBpbiB0aGUgbWFya3VwXG4gICAqIHVzdWFsbHkgaGFwcGVucyBhcyBhIHJlc3VsdCBvZiByZXBsYWNpbmcgdGhlIG1hcmt1cCB1c2luZyBBSkFYXG4gICAqXHRcbiAgICogT3ZlcnJpZGUgaW4gc3ViY2xhc3MgYW5kIG1ha2Ugc3VyZSB0byBjbGVhbiB1cCBldmVudCBoYW5kbGVycyBldGNcbiAgICpcbiAgICogQHByb3RlY3RlZFxuICAgKi9cblx0XHR2YWx1ZTogZnVuY3Rpb24gZGVzdHJveSgpIHt9XG5cdH1dKTtcblxuXHRyZXR1cm4gQ29tcG9uZW50O1xufSkoKTtcblxuLy8gRXhwb3J0IEFNRCwgQ29tbW9uSlMvRVM2IG1vZHVsZSBvciBhc3N1bWUgZ2xvYmFsIG5hbWVzcGFjZVxuaWYgKHR5cGVvZiBkZWZpbmUgIT09ICd1bmRlZmluZWQnICYmIGRlZmluZS5hbWQpIHtcblx0ZGVmaW5lKFtdLCBDb21wb25lbnQpO1xufSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuXHRtb2R1bGUuZXhwb3J0cyA9IENvbXBvbmVudDtcbn0gZWxzZSB7XG5cdHdpbmRvdy5Db21wb25lbnQgPSBDb21wb25lbnQ7XG59IiwiKGZ1bmN0aW9uKCBmYWN0b3J5ICkge1xuXHRpZiAodHlwZW9mIGRlZmluZSAhPT0gJ3VuZGVmaW5lZCcgJiYgZGVmaW5lLmFtZCkge1xuXHRcdGRlZmluZShbXSwgZmFjdG9yeSk7XG5cdH0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcblx0fSBlbHNlIHtcblx0XHR3aW5kb3cuc2Nyb2xsTW9uaXRvciA9IGZhY3RvcnkoKTtcblx0fVxufSkoZnVuY3Rpb24oKSB7XG5cblx0dmFyIHNjcm9sbFRvcCA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB3aW5kb3cucGFnZVlPZmZzZXQgfHxcblx0XHRcdChkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgJiYgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcCkgfHxcblx0XHRcdGRvY3VtZW50LmJvZHkuc2Nyb2xsVG9wO1xuXHR9O1xuXG5cdHZhciBleHBvcnRzID0ge307XG5cblx0dmFyIHdhdGNoZXJzID0gW107XG5cblx0dmFyIFZJU0lCSUxJVFlDSEFOR0UgPSAndmlzaWJpbGl0eUNoYW5nZSc7XG5cdHZhciBFTlRFUlZJRVdQT1JUID0gJ2VudGVyVmlld3BvcnQnO1xuXHR2YXIgRlVMTFlFTlRFUlZJRVdQT1JUID0gJ2Z1bGx5RW50ZXJWaWV3cG9ydCc7XG5cdHZhciBFWElUVklFV1BPUlQgPSAnZXhpdFZpZXdwb3J0Jztcblx0dmFyIFBBUlRJQUxMWUVYSVRWSUVXUE9SVCA9ICdwYXJ0aWFsbHlFeGl0Vmlld3BvcnQnO1xuXHR2YXIgTE9DQVRJT05DSEFOR0UgPSAnbG9jYXRpb25DaGFuZ2UnO1xuXHR2YXIgU1RBVEVDSEFOR0UgPSAnc3RhdGVDaGFuZ2UnO1xuXG5cdHZhciBldmVudFR5cGVzID0gW1xuXHRcdFZJU0lCSUxJVFlDSEFOR0UsXG5cdFx0RU5URVJWSUVXUE9SVCxcblx0XHRGVUxMWUVOVEVSVklFV1BPUlQsXG5cdFx0RVhJVFZJRVdQT1JULFxuXHRcdFBBUlRJQUxMWUVYSVRWSUVXUE9SVCxcblx0XHRMT0NBVElPTkNIQU5HRSxcblx0XHRTVEFURUNIQU5HRVxuXHRdO1xuXG5cdHZhciBkZWZhdWx0T2Zmc2V0cyA9IHt0b3A6IDAsIGJvdHRvbTogMH07XG5cblx0dmFyIGdldFZpZXdwb3J0SGVpZ2h0ID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHdpbmRvdy5pbm5lckhlaWdodCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0O1xuXHR9O1xuXG5cdHZhciBnZXREb2N1bWVudEhlaWdodCA9IGZ1bmN0aW9uKCkge1xuXHRcdC8vIGpRdWVyeSBhcHByb2FjaFxuXHRcdC8vIHdoaWNoZXZlciBpcyBncmVhdGVzdFxuXHRcdHJldHVybiBNYXRoLm1heChcblx0XHRcdGRvY3VtZW50LmJvZHkuc2Nyb2xsSGVpZ2h0LCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsSGVpZ2h0LFxuXHRcdFx0ZG9jdW1lbnQuYm9keS5vZmZzZXRIZWlnaHQsIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5vZmZzZXRIZWlnaHQsXG5cdFx0XHRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0XG5cdFx0KTtcblx0fTtcblxuXHRleHBvcnRzLnZpZXdwb3J0VG9wID0gbnVsbDtcblx0ZXhwb3J0cy52aWV3cG9ydEJvdHRvbSA9IG51bGw7XG5cdGV4cG9ydHMuZG9jdW1lbnRIZWlnaHQgPSBudWxsO1xuXHRleHBvcnRzLnZpZXdwb3J0SGVpZ2h0ID0gZ2V0Vmlld3BvcnRIZWlnaHQoKTtcblxuXHR2YXIgcHJldmlvdXNEb2N1bWVudEhlaWdodDtcblx0dmFyIGxhdGVzdEV2ZW50O1xuXG5cdHZhciBjYWxjdWxhdGVWaWV3cG9ydEk7XG5cdGZ1bmN0aW9uIGNhbGN1bGF0ZVZpZXdwb3J0KCkge1xuXHRcdGV4cG9ydHMudmlld3BvcnRUb3AgPSBzY3JvbGxUb3AoKTtcblx0XHRleHBvcnRzLnZpZXdwb3J0Qm90dG9tID0gZXhwb3J0cy52aWV3cG9ydFRvcCArIGV4cG9ydHMudmlld3BvcnRIZWlnaHQ7XG5cdFx0ZXhwb3J0cy5kb2N1bWVudEhlaWdodCA9IGdldERvY3VtZW50SGVpZ2h0KCk7XG5cdFx0aWYgKGV4cG9ydHMuZG9jdW1lbnRIZWlnaHQgIT09IHByZXZpb3VzRG9jdW1lbnRIZWlnaHQpIHtcblx0XHRcdGNhbGN1bGF0ZVZpZXdwb3J0SSA9IHdhdGNoZXJzLmxlbmd0aDtcblx0XHRcdHdoaWxlKCBjYWxjdWxhdGVWaWV3cG9ydEktLSApIHtcblx0XHRcdFx0d2F0Y2hlcnNbY2FsY3VsYXRlVmlld3BvcnRJXS5yZWNhbGN1bGF0ZUxvY2F0aW9uKCk7XG5cdFx0XHR9XG5cdFx0XHRwcmV2aW91c0RvY3VtZW50SGVpZ2h0ID0gZXhwb3J0cy5kb2N1bWVudEhlaWdodDtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiByZWNhbGN1bGF0ZVdhdGNoTG9jYXRpb25zQW5kVHJpZ2dlcigpIHtcblx0XHRleHBvcnRzLnZpZXdwb3J0SGVpZ2h0ID0gZ2V0Vmlld3BvcnRIZWlnaHQoKTtcblx0XHRjYWxjdWxhdGVWaWV3cG9ydCgpO1xuXHRcdHVwZGF0ZUFuZFRyaWdnZXJXYXRjaGVycygpO1xuXHR9XG5cblx0dmFyIHJlY2FsY3VsYXRlQW5kVHJpZ2dlclRpbWVyO1xuXHRmdW5jdGlvbiBkZWJvdW5jZWRSZWNhbGN1YXRlQW5kVHJpZ2dlcigpIHtcblx0XHRjbGVhclRpbWVvdXQocmVjYWxjdWxhdGVBbmRUcmlnZ2VyVGltZXIpO1xuXHRcdHJlY2FsY3VsYXRlQW5kVHJpZ2dlclRpbWVyID0gc2V0VGltZW91dCggcmVjYWxjdWxhdGVXYXRjaExvY2F0aW9uc0FuZFRyaWdnZXIsIDEwMCApO1xuXHR9XG5cblx0dmFyIHVwZGF0ZUFuZFRyaWdnZXJXYXRjaGVyc0k7XG5cdGZ1bmN0aW9uIHVwZGF0ZUFuZFRyaWdnZXJXYXRjaGVycygpIHtcblx0XHQvLyB1cGRhdGUgYWxsIHdhdGNoZXJzIHRoZW4gdHJpZ2dlciB0aGUgZXZlbnRzIHNvIG9uZSBjYW4gcmVseSBvbiBhbm90aGVyIGJlaW5nIHVwIHRvIGRhdGUuXG5cdFx0dXBkYXRlQW5kVHJpZ2dlcldhdGNoZXJzSSA9IHdhdGNoZXJzLmxlbmd0aDtcblx0XHR3aGlsZSggdXBkYXRlQW5kVHJpZ2dlcldhdGNoZXJzSS0tICkge1xuXHRcdFx0d2F0Y2hlcnNbdXBkYXRlQW5kVHJpZ2dlcldhdGNoZXJzSV0udXBkYXRlKCk7XG5cdFx0fVxuXG5cdFx0dXBkYXRlQW5kVHJpZ2dlcldhdGNoZXJzSSA9IHdhdGNoZXJzLmxlbmd0aDtcblx0XHR3aGlsZSggdXBkYXRlQW5kVHJpZ2dlcldhdGNoZXJzSS0tICkge1xuXHRcdFx0d2F0Y2hlcnNbdXBkYXRlQW5kVHJpZ2dlcldhdGNoZXJzSV0udHJpZ2dlckNhbGxiYWNrcygpO1xuXHRcdH1cblxuXHR9XG5cblx0ZnVuY3Rpb24gRWxlbWVudFdhdGNoZXIoIHdhdGNoSXRlbSwgb2Zmc2V0cyApIHtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0XHR0aGlzLndhdGNoSXRlbSA9IHdhdGNoSXRlbTtcblxuXHRcdGlmICghb2Zmc2V0cykge1xuXHRcdFx0dGhpcy5vZmZzZXRzID0gZGVmYXVsdE9mZnNldHM7XG5cdFx0fSBlbHNlIGlmIChvZmZzZXRzID09PSArb2Zmc2V0cykge1xuXHRcdFx0dGhpcy5vZmZzZXRzID0ge3RvcDogb2Zmc2V0cywgYm90dG9tOiBvZmZzZXRzfTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5vZmZzZXRzID0ge1xuXHRcdFx0XHR0b3A6IG9mZnNldHMudG9wIHx8IGRlZmF1bHRPZmZzZXRzLnRvcCxcblx0XHRcdFx0Ym90dG9tOiBvZmZzZXRzLmJvdHRvbSB8fCBkZWZhdWx0T2Zmc2V0cy5ib3R0b21cblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0dGhpcy5jYWxsYmFja3MgPSB7fTsgLy8ge2NhbGxiYWNrOiBmdW5jdGlvbiwgaXNPbmU6IHRydWUgfVxuXG5cdFx0Zm9yICh2YXIgaSA9IDAsIGogPSBldmVudFR5cGVzLmxlbmd0aDsgaSA8IGo7IGkrKykge1xuXHRcdFx0c2VsZi5jYWxsYmFja3NbZXZlbnRUeXBlc1tpXV0gPSBbXTtcblx0XHR9XG5cblx0XHR0aGlzLmxvY2tlZCA9IGZhbHNlO1xuXG5cdFx0dmFyIHdhc0luVmlld3BvcnQ7XG5cdFx0dmFyIHdhc0Z1bGx5SW5WaWV3cG9ydDtcblx0XHR2YXIgd2FzQWJvdmVWaWV3cG9ydDtcblx0XHR2YXIgd2FzQmVsb3dWaWV3cG9ydDtcblxuXHRcdHZhciBsaXN0ZW5lclRvVHJpZ2dlckxpc3RJO1xuXHRcdHZhciBsaXN0ZW5lcjtcblx0XHRmdW5jdGlvbiB0cmlnZ2VyQ2FsbGJhY2tBcnJheSggbGlzdGVuZXJzICkge1xuXHRcdFx0aWYgKGxpc3RlbmVycy5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0bGlzdGVuZXJUb1RyaWdnZXJMaXN0SSA9IGxpc3RlbmVycy5sZW5ndGg7XG5cdFx0XHR3aGlsZSggbGlzdGVuZXJUb1RyaWdnZXJMaXN0SS0tICkge1xuXHRcdFx0XHRsaXN0ZW5lciA9IGxpc3RlbmVyc1tsaXN0ZW5lclRvVHJpZ2dlckxpc3RJXTtcblx0XHRcdFx0bGlzdGVuZXIuY2FsbGJhY2suY2FsbCggc2VsZiwgbGF0ZXN0RXZlbnQgKTtcblx0XHRcdFx0aWYgKGxpc3RlbmVyLmlzT25lKSB7XG5cdFx0XHRcdFx0bGlzdGVuZXJzLnNwbGljZShsaXN0ZW5lclRvVHJpZ2dlckxpc3RJLCAxKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHR0aGlzLnRyaWdnZXJDYWxsYmFja3MgPSBmdW5jdGlvbiB0cmlnZ2VyQ2FsbGJhY2tzKCkge1xuXG5cdFx0XHRpZiAodGhpcy5pc0luVmlld3BvcnQgJiYgIXdhc0luVmlld3BvcnQpIHtcblx0XHRcdFx0dHJpZ2dlckNhbGxiYWNrQXJyYXkoIHRoaXMuY2FsbGJhY2tzW0VOVEVSVklFV1BPUlRdICk7XG5cdFx0XHR9XG5cdFx0XHRpZiAodGhpcy5pc0Z1bGx5SW5WaWV3cG9ydCAmJiAhd2FzRnVsbHlJblZpZXdwb3J0KSB7XG5cdFx0XHRcdHRyaWdnZXJDYWxsYmFja0FycmF5KCB0aGlzLmNhbGxiYWNrc1tGVUxMWUVOVEVSVklFV1BPUlRdICk7XG5cdFx0XHR9XG5cblxuXHRcdFx0aWYgKHRoaXMuaXNBYm92ZVZpZXdwb3J0ICE9PSB3YXNBYm92ZVZpZXdwb3J0ICYmXG5cdFx0XHRcdHRoaXMuaXNCZWxvd1ZpZXdwb3J0ICE9PSB3YXNCZWxvd1ZpZXdwb3J0KSB7XG5cblx0XHRcdFx0dHJpZ2dlckNhbGxiYWNrQXJyYXkoIHRoaXMuY2FsbGJhY2tzW1ZJU0lCSUxJVFlDSEFOR0VdICk7XG5cblx0XHRcdFx0Ly8gaWYgeW91IHNraXAgY29tcGxldGVseSBwYXN0IHRoaXMgZWxlbWVudFxuXHRcdFx0XHRpZiAoIXdhc0Z1bGx5SW5WaWV3cG9ydCAmJiAhdGhpcy5pc0Z1bGx5SW5WaWV3cG9ydCkge1xuXHRcdFx0XHRcdHRyaWdnZXJDYWxsYmFja0FycmF5KCB0aGlzLmNhbGxiYWNrc1tGVUxMWUVOVEVSVklFV1BPUlRdICk7XG5cdFx0XHRcdFx0dHJpZ2dlckNhbGxiYWNrQXJyYXkoIHRoaXMuY2FsbGJhY2tzW1BBUlRJQUxMWUVYSVRWSUVXUE9SVF0gKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoIXdhc0luVmlld3BvcnQgJiYgIXRoaXMuaXNJblZpZXdwb3J0KSB7XG5cdFx0XHRcdFx0dHJpZ2dlckNhbGxiYWNrQXJyYXkoIHRoaXMuY2FsbGJhY2tzW0VOVEVSVklFV1BPUlRdICk7XG5cdFx0XHRcdFx0dHJpZ2dlckNhbGxiYWNrQXJyYXkoIHRoaXMuY2FsbGJhY2tzW0VYSVRWSUVXUE9SVF0gKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIXRoaXMuaXNGdWxseUluVmlld3BvcnQgJiYgd2FzRnVsbHlJblZpZXdwb3J0KSB7XG5cdFx0XHRcdHRyaWdnZXJDYWxsYmFja0FycmF5KCB0aGlzLmNhbGxiYWNrc1tQQVJUSUFMTFlFWElUVklFV1BPUlRdICk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoIXRoaXMuaXNJblZpZXdwb3J0ICYmIHdhc0luVmlld3BvcnQpIHtcblx0XHRcdFx0dHJpZ2dlckNhbGxiYWNrQXJyYXkoIHRoaXMuY2FsbGJhY2tzW0VYSVRWSUVXUE9SVF0gKTtcblx0XHRcdH1cblx0XHRcdGlmICh0aGlzLmlzSW5WaWV3cG9ydCAhPT0gd2FzSW5WaWV3cG9ydCkge1xuXHRcdFx0XHR0cmlnZ2VyQ2FsbGJhY2tBcnJheSggdGhpcy5jYWxsYmFja3NbVklTSUJJTElUWUNIQU5HRV0gKTtcblx0XHRcdH1cblx0XHRcdHN3aXRjaCggdHJ1ZSApIHtcblx0XHRcdFx0Y2FzZSB3YXNJblZpZXdwb3J0ICE9PSB0aGlzLmlzSW5WaWV3cG9ydDpcblx0XHRcdFx0Y2FzZSB3YXNGdWxseUluVmlld3BvcnQgIT09IHRoaXMuaXNGdWxseUluVmlld3BvcnQ6XG5cdFx0XHRcdGNhc2Ugd2FzQWJvdmVWaWV3cG9ydCAhPT0gdGhpcy5pc0Fib3ZlVmlld3BvcnQ6XG5cdFx0XHRcdGNhc2Ugd2FzQmVsb3dWaWV3cG9ydCAhPT0gdGhpcy5pc0JlbG93Vmlld3BvcnQ6XG5cdFx0XHRcdFx0dHJpZ2dlckNhbGxiYWNrQXJyYXkoIHRoaXMuY2FsbGJhY2tzW1NUQVRFQ0hBTkdFXSApO1xuXHRcdFx0fVxuXG5cdFx0XHR3YXNJblZpZXdwb3J0ID0gdGhpcy5pc0luVmlld3BvcnQ7XG5cdFx0XHR3YXNGdWxseUluVmlld3BvcnQgPSB0aGlzLmlzRnVsbHlJblZpZXdwb3J0O1xuXHRcdFx0d2FzQWJvdmVWaWV3cG9ydCA9IHRoaXMuaXNBYm92ZVZpZXdwb3J0O1xuXHRcdFx0d2FzQmVsb3dWaWV3cG9ydCA9IHRoaXMuaXNCZWxvd1ZpZXdwb3J0O1xuXG5cdFx0fTtcblxuXHRcdHRoaXMucmVjYWxjdWxhdGVMb2NhdGlvbiA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKHRoaXMubG9ja2VkKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdHZhciBwcmV2aW91c1RvcCA9IHRoaXMudG9wO1xuXHRcdFx0dmFyIHByZXZpb3VzQm90dG9tID0gdGhpcy5ib3R0b207XG5cdFx0XHRpZiAodGhpcy53YXRjaEl0ZW0ubm9kZU5hbWUpIHsgLy8gYSBkb20gZWxlbWVudFxuXHRcdFx0XHR2YXIgY2FjaGVkRGlzcGxheSA9IHRoaXMud2F0Y2hJdGVtLnN0eWxlLmRpc3BsYXk7XG5cdFx0XHRcdGlmIChjYWNoZWREaXNwbGF5ID09PSAnbm9uZScpIHtcblx0XHRcdFx0XHR0aGlzLndhdGNoSXRlbS5zdHlsZS5kaXNwbGF5ID0gJyc7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR2YXIgYm91bmRpbmdSZWN0ID0gdGhpcy53YXRjaEl0ZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cdFx0XHRcdHRoaXMudG9wID0gYm91bmRpbmdSZWN0LnRvcCArIGV4cG9ydHMudmlld3BvcnRUb3A7XG5cdFx0XHRcdHRoaXMuYm90dG9tID0gYm91bmRpbmdSZWN0LmJvdHRvbSArIGV4cG9ydHMudmlld3BvcnRUb3A7XG5cblx0XHRcdFx0aWYgKGNhY2hlZERpc3BsYXkgPT09ICdub25lJykge1xuXHRcdFx0XHRcdHRoaXMud2F0Y2hJdGVtLnN0eWxlLmRpc3BsYXkgPSBjYWNoZWREaXNwbGF5O1xuXHRcdFx0XHR9XG5cblx0XHRcdH0gZWxzZSBpZiAodGhpcy53YXRjaEl0ZW0gPT09ICt0aGlzLndhdGNoSXRlbSkgeyAvLyBudW1iZXJcblx0XHRcdFx0aWYgKHRoaXMud2F0Y2hJdGVtID4gMCkge1xuXHRcdFx0XHRcdHRoaXMudG9wID0gdGhpcy5ib3R0b20gPSB0aGlzLndhdGNoSXRlbTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aGlzLnRvcCA9IHRoaXMuYm90dG9tID0gZXhwb3J0cy5kb2N1bWVudEhlaWdodCAtIHRoaXMud2F0Y2hJdGVtO1xuXHRcdFx0XHR9XG5cblx0XHRcdH0gZWxzZSB7IC8vIGFuIG9iamVjdCB3aXRoIGEgdG9wIGFuZCBib3R0b20gcHJvcGVydHlcblx0XHRcdFx0dGhpcy50b3AgPSB0aGlzLndhdGNoSXRlbS50b3A7XG5cdFx0XHRcdHRoaXMuYm90dG9tID0gdGhpcy53YXRjaEl0ZW0uYm90dG9tO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLnRvcCAtPSB0aGlzLm9mZnNldHMudG9wO1xuXHRcdFx0dGhpcy5ib3R0b20gKz0gdGhpcy5vZmZzZXRzLmJvdHRvbTtcblx0XHRcdHRoaXMuaGVpZ2h0ID0gdGhpcy5ib3R0b20gLSB0aGlzLnRvcDtcblxuXHRcdFx0aWYgKCAocHJldmlvdXNUb3AgIT09IHVuZGVmaW5lZCB8fCBwcmV2aW91c0JvdHRvbSAhPT0gdW5kZWZpbmVkKSAmJiAodGhpcy50b3AgIT09IHByZXZpb3VzVG9wIHx8IHRoaXMuYm90dG9tICE9PSBwcmV2aW91c0JvdHRvbSkgKSB7XG5cdFx0XHRcdHRyaWdnZXJDYWxsYmFja0FycmF5KCB0aGlzLmNhbGxiYWNrc1tMT0NBVElPTkNIQU5HRV0gKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0dGhpcy5yZWNhbGN1bGF0ZUxvY2F0aW9uKCk7XG5cdFx0dGhpcy51cGRhdGUoKTtcblxuXHRcdHdhc0luVmlld3BvcnQgPSB0aGlzLmlzSW5WaWV3cG9ydDtcblx0XHR3YXNGdWxseUluVmlld3BvcnQgPSB0aGlzLmlzRnVsbHlJblZpZXdwb3J0O1xuXHRcdHdhc0Fib3ZlVmlld3BvcnQgPSB0aGlzLmlzQWJvdmVWaWV3cG9ydDtcblx0XHR3YXNCZWxvd1ZpZXdwb3J0ID0gdGhpcy5pc0JlbG93Vmlld3BvcnQ7XG5cdH1cblxuXHRFbGVtZW50V2F0Y2hlci5wcm90b3R5cGUgPSB7XG5cdFx0b246IGZ1bmN0aW9uKCBldmVudCwgY2FsbGJhY2ssIGlzT25lICkge1xuXG5cdFx0XHQvLyB0cmlnZ2VyIHRoZSBldmVudCBpZiBpdCBhcHBsaWVzIHRvIHRoZSBlbGVtZW50IHJpZ2h0IG5vdy5cblx0XHRcdHN3aXRjaCggdHJ1ZSApIHtcblx0XHRcdFx0Y2FzZSBldmVudCA9PT0gVklTSUJJTElUWUNIQU5HRSAmJiAhdGhpcy5pc0luVmlld3BvcnQgJiYgdGhpcy5pc0Fib3ZlVmlld3BvcnQ6XG5cdFx0XHRcdGNhc2UgZXZlbnQgPT09IEVOVEVSVklFV1BPUlQgJiYgdGhpcy5pc0luVmlld3BvcnQ6XG5cdFx0XHRcdGNhc2UgZXZlbnQgPT09IEZVTExZRU5URVJWSUVXUE9SVCAmJiB0aGlzLmlzRnVsbHlJblZpZXdwb3J0OlxuXHRcdFx0XHRjYXNlIGV2ZW50ID09PSBFWElUVklFV1BPUlQgJiYgdGhpcy5pc0Fib3ZlVmlld3BvcnQgJiYgIXRoaXMuaXNJblZpZXdwb3J0OlxuXHRcdFx0XHRjYXNlIGV2ZW50ID09PSBQQVJUSUFMTFlFWElUVklFV1BPUlQgJiYgdGhpcy5pc0Fib3ZlVmlld3BvcnQ6XG5cdFx0XHRcdFx0Y2FsbGJhY2suY2FsbCggdGhpcywgbGF0ZXN0RXZlbnQgKTtcblx0XHRcdFx0XHRpZiAoaXNPbmUpIHtcblx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmICh0aGlzLmNhbGxiYWNrc1tldmVudF0pIHtcblx0XHRcdFx0dGhpcy5jYWxsYmFja3NbZXZlbnRdLnB1c2goe2NhbGxiYWNrOiBjYWxsYmFjaywgaXNPbmU6IGlzT25lfHxmYWxzZX0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdUcmllZCB0byBhZGQgYSBzY3JvbGwgbW9uaXRvciBsaXN0ZW5lciBvZiB0eXBlICcrZXZlbnQrJy4gWW91ciBvcHRpb25zIGFyZTogJytldmVudFR5cGVzLmpvaW4oJywgJykpO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0b2ZmOiBmdW5jdGlvbiggZXZlbnQsIGNhbGxiYWNrICkge1xuXHRcdFx0aWYgKHRoaXMuY2FsbGJhY2tzW2V2ZW50XSkge1xuXHRcdFx0XHRmb3IgKHZhciBpID0gMCwgaXRlbTsgaXRlbSA9IHRoaXMuY2FsbGJhY2tzW2V2ZW50XVtpXTsgaSsrKSB7XG5cdFx0XHRcdFx0aWYgKGl0ZW0uY2FsbGJhY2sgPT09IGNhbGxiYWNrKSB7XG5cdFx0XHRcdFx0XHR0aGlzLmNhbGxiYWNrc1tldmVudF0uc3BsaWNlKGksIDEpO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ1RyaWVkIHRvIHJlbW92ZSBhIHNjcm9sbCBtb25pdG9yIGxpc3RlbmVyIG9mIHR5cGUgJytldmVudCsnLiBZb3VyIG9wdGlvbnMgYXJlOiAnK2V2ZW50VHlwZXMuam9pbignLCAnKSk7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRvbmU6IGZ1bmN0aW9uKCBldmVudCwgY2FsbGJhY2sgKSB7XG5cdFx0XHR0aGlzLm9uKCBldmVudCwgY2FsbGJhY2ssIHRydWUpO1xuXHRcdH0sXG5cdFx0cmVjYWxjdWxhdGVTaXplOiBmdW5jdGlvbigpIHtcblx0XHRcdHRoaXMuaGVpZ2h0ID0gdGhpcy53YXRjaEl0ZW0ub2Zmc2V0SGVpZ2h0ICsgdGhpcy5vZmZzZXRzLnRvcCArIHRoaXMub2Zmc2V0cy5ib3R0b207XG5cdFx0XHR0aGlzLmJvdHRvbSA9IHRoaXMudG9wICsgdGhpcy5oZWlnaHQ7XG5cdFx0fSxcblx0XHR1cGRhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdFx0dGhpcy5pc0Fib3ZlVmlld3BvcnQgPSB0aGlzLnRvcCA8IGV4cG9ydHMudmlld3BvcnRUb3A7XG5cdFx0XHR0aGlzLmlzQmVsb3dWaWV3cG9ydCA9IHRoaXMuYm90dG9tID4gZXhwb3J0cy52aWV3cG9ydEJvdHRvbTtcblxuXHRcdFx0dGhpcy5pc0luVmlld3BvcnQgPSAodGhpcy50b3AgPD0gZXhwb3J0cy52aWV3cG9ydEJvdHRvbSAmJiB0aGlzLmJvdHRvbSA+PSBleHBvcnRzLnZpZXdwb3J0VG9wKTtcblx0XHRcdHRoaXMuaXNGdWxseUluVmlld3BvcnQgPSAodGhpcy50b3AgPj0gZXhwb3J0cy52aWV3cG9ydFRvcCAmJiB0aGlzLmJvdHRvbSA8PSBleHBvcnRzLnZpZXdwb3J0Qm90dG9tKSB8fFxuXHRcdFx0XHRcdFx0XHRcdCAodGhpcy5pc0Fib3ZlVmlld3BvcnQgJiYgdGhpcy5pc0JlbG93Vmlld3BvcnQpO1xuXG5cdFx0fSxcblx0XHRkZXN0cm95OiBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBpbmRleCA9IHdhdGNoZXJzLmluZGV4T2YodGhpcyksXG5cdFx0XHRcdHNlbGYgID0gdGhpcztcblx0XHRcdHdhdGNoZXJzLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHRmb3IgKHZhciBpID0gMCwgaiA9IGV2ZW50VHlwZXMubGVuZ3RoOyBpIDwgajsgaSsrKSB7XG5cdFx0XHRcdHNlbGYuY2FsbGJhY2tzW2V2ZW50VHlwZXNbaV1dLmxlbmd0aCA9IDA7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHQvLyBwcmV2ZW50IHJlY2FsY3VsYXRpbmcgdGhlIGVsZW1lbnQgbG9jYXRpb25cblx0XHRsb2NrOiBmdW5jdGlvbigpIHtcblx0XHRcdHRoaXMubG9ja2VkID0gdHJ1ZTtcblx0XHR9LFxuXHRcdHVubG9jazogZnVuY3Rpb24oKSB7XG5cdFx0XHR0aGlzLmxvY2tlZCA9IGZhbHNlO1xuXHRcdH1cblx0fTtcblxuXHR2YXIgZXZlbnRIYW5kbGVyRmFjdG9yeSA9IGZ1bmN0aW9uICh0eXBlKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uKCBjYWxsYmFjaywgaXNPbmUgKSB7XG5cdFx0XHR0aGlzLm9uLmNhbGwodGhpcywgdHlwZSwgY2FsbGJhY2ssIGlzT25lKTtcblx0XHR9O1xuXHR9O1xuXG5cdGZvciAodmFyIGkgPSAwLCBqID0gZXZlbnRUeXBlcy5sZW5ndGg7IGkgPCBqOyBpKyspIHtcblx0XHR2YXIgdHlwZSA9ICBldmVudFR5cGVzW2ldO1xuXHRcdEVsZW1lbnRXYXRjaGVyLnByb3RvdHlwZVt0eXBlXSA9IGV2ZW50SGFuZGxlckZhY3RvcnkodHlwZSk7XG5cdH1cblxuXHR0cnkge1xuXHRcdGNhbGN1bGF0ZVZpZXdwb3J0KCk7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHR0cnkge1xuXHRcdFx0d2luZG93LiQoY2FsY3VsYXRlVmlld3BvcnQpO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignSWYgeW91IG11c3QgcHV0IHNjcm9sbE1vbml0b3IgaW4gdGhlIDxoZWFkPiwgeW91IG11c3QgdXNlIGpRdWVyeS4nKTtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBzY3JvbGxNb25pdG9yTGlzdGVuZXIoZXZlbnQpIHtcblx0XHRsYXRlc3RFdmVudCA9IGV2ZW50O1xuXHRcdGNhbGN1bGF0ZVZpZXdwb3J0KCk7XG5cdFx0dXBkYXRlQW5kVHJpZ2dlcldhdGNoZXJzKCk7XG5cdH1cblxuXHRpZiAod2luZG93LmFkZEV2ZW50TGlzdGVuZXIpIHtcblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgc2Nyb2xsTW9uaXRvckxpc3RlbmVyKTtcblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgZGVib3VuY2VkUmVjYWxjdWF0ZUFuZFRyaWdnZXIpO1xuXHR9IGVsc2Uge1xuXHRcdC8vIE9sZCBJRSBzdXBwb3J0XG5cdFx0d2luZG93LmF0dGFjaEV2ZW50KCdvbnNjcm9sbCcsIHNjcm9sbE1vbml0b3JMaXN0ZW5lcik7XG5cdFx0d2luZG93LmF0dGFjaEV2ZW50KCdvbnJlc2l6ZScsIGRlYm91bmNlZFJlY2FsY3VhdGVBbmRUcmlnZ2VyKTtcblx0fVxuXG5cdGV4cG9ydHMuYmVnZXQgPSBleHBvcnRzLmNyZWF0ZSA9IGZ1bmN0aW9uKCBlbGVtZW50LCBvZmZzZXRzICkge1xuXHRcdGlmICh0eXBlb2YgZWxlbWVudCA9PT0gJ3N0cmluZycpIHtcblx0XHRcdGVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGVsZW1lbnQpO1xuXHRcdH0gZWxzZSBpZiAoZWxlbWVudCAmJiBlbGVtZW50Lmxlbmd0aCA+IDApIHtcblx0XHRcdGVsZW1lbnQgPSBlbGVtZW50WzBdO1xuXHRcdH1cblxuXHRcdHZhciB3YXRjaGVyID0gbmV3IEVsZW1lbnRXYXRjaGVyKCBlbGVtZW50LCBvZmZzZXRzICk7XG5cdFx0d2F0Y2hlcnMucHVzaCh3YXRjaGVyKTtcblx0XHR3YXRjaGVyLnVwZGF0ZSgpO1xuXHRcdHJldHVybiB3YXRjaGVyO1xuXHR9O1xuXG5cdGV4cG9ydHMudXBkYXRlID0gZnVuY3Rpb24oKSB7XG5cdFx0bGF0ZXN0RXZlbnQgPSBudWxsO1xuXHRcdGNhbGN1bGF0ZVZpZXdwb3J0KCk7XG5cdFx0dXBkYXRlQW5kVHJpZ2dlcldhdGNoZXJzKCk7XG5cdH07XG5cdGV4cG9ydHMucmVjYWxjdWxhdGVMb2NhdGlvbnMgPSBmdW5jdGlvbigpIHtcblx0XHRleHBvcnRzLmRvY3VtZW50SGVpZ2h0ID0gMDtcblx0XHRleHBvcnRzLnVwZGF0ZSgpO1xuXHR9O1xuXG5cdHJldHVybiBleHBvcnRzO1xufSk7XG4iLCJpbXBvcnQgQ29tcG9uZW50IGZyb20gJ2NvbXBvbmVudC1sb2FkZXItanMvZGlzdC9lczUvY29tcG9uZW50JztcblxuY2xhc3MgRG9raSBleHRlbmRzIENvbXBvbmVudCB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKC4uLmFyZ3VtZW50cyk7XG5cdFx0Y29uc29sZS5sb2coJ25ldyBET0tJIDQwJyk7XG5cdH1cblxuXHRkZXN0cm95KCkge1xuXHRcdHN1cGVyLmRlc3Ryb3koKTtcblx0XHRjb25zb2xlLmxvZygnZGVzdHJveSBET0tJJyk7XG5cdH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgRG9raTsiLCJpbXBvcnQgQ29tcG9uZW50IGZyb20gJ2NvbXBvbmVudC1sb2FkZXItanMvZGlzdC9lczUvY29tcG9uZW50JztcbmltcG9ydCBhbmltYXRpb25FbmRFdmVudCBmcm9tICcuLi91dGlscy9hbmltYXRpb24tZW5kLWV2ZW50JztcbmltcG9ydCBzY3JvbGxTdGF0ZSwge0VWRU5UX1NDUk9MTF9GUkFNRX0gZnJvbSAnLi4vdXRpbHMvc2Nyb2xsLXN0YXRlJztcblxuLyoqXG5cdFN0aWNreSBOYXYgY29tcG9uZW50XG5cblx0TGlzdGVucyB0byBzY3JvbGwgZXZlbnRzIGZyb20gdXRpbHMuU2Nyb2xsU3RhdGVcblxuXHQtIEFkZHMgQ0xBU1NfTE9DS0VEIHdoZW4gcGFzc2luZyBMT0NLX1RIUkVTSE9MRFxuXHQtIEFkZHMgQ0xBU1NfQkFDS0dST1VORCB3aGVuIHBhc3NpbmcgX2dldEJhY2tncm91bmRUaHJlc2hvbGQoKVxuXHQtIEFkZHMgQ0xBU1NfSElEREVOIGlmIHZpc2libGUgYW5kIHNjcm9sbGluZyBkb3duIHdpdGggZW5vdWdoIHNwZWVkXG5cdC0gQWRkcyBDTEFTU19WSVNJQkxFIGlmIHNjcm9sbGluZyB1cCBhbmQgaGlkZGVuXG4qL1xuXG5cbmNvbnN0IENMQVNTX0hJRERFTiA9ICdTdGlja3lOYXYtLWhpZGRlbic7XG5jb25zdCBDTEFTU19WSVNJQkxFID0gJ1N0aWNreU5hdi0tdmlzaWJsZSc7XG5jb25zdCBDTEFTU19MT0NLRUQgPSAnU3RpY2t5TmF2LS1sb2NrZWQnO1xuY29uc3QgQ0xBU1NfQkFDS0dST1VORCA9ICdTdGlja3lOYXYtLWJhY2tncm91bmQnO1xuXG4vLyBweCBmcm9tIHRvcCBvZiBkb2N1bWVudCB3aGVyZSAnbG9ja2VkJyBjbGFzcyBpcyBhZGRlZCAoaW5jbHVzaXZlKVxuY29uc3QgTE9DS19USFJFU0hPTEQgPSAwO1xuY29uc3QgQkdfVEhSRVNIT0xEID0gMjAwO1xuY29uc3QgSElERV9USFJFU0hPTEQgPSA4MDA7XG5cbi8vIFNwZWVkL0Rpc3RhbmNlIHJlcXVpcmVkIHRvIGNoYW5nZSBhcHBlYXJhbmNlIHBlciBzY3JvbGwgZnJhbWVcbmNvbnN0IE1JTl9TQ1JPTExfU1BFRUQgPSA1MDA7XG4vLyBjb25zdCBNSU5fU0NST0xMX0RJU1RBTkNFID0gMjA7XG5cblxuY2xhc3MgU3RpY2t5TmF2IGV4dGVuZHMgQ29tcG9uZW50IHtcblxuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlciguLi5hcmd1bWVudHMpO1xuXHRcdHRoaXMuJGRvY3VtZW50ID0gJChkb2N1bWVudCk7XG5cdFx0dGhpcy5pc0hpZGRlbiA9IGZhbHNlO1xuXHRcdHRoaXMuaXNMb2NrZWQgPSBmYWxzZTtcblx0XHR0aGlzLmhhc0JhY2tncm91bmQgPSBmYWxzZTtcblx0XHR0aGlzLmlzQnVzeUNoZWNraW5nID0gZmFsc2U7XG5cblx0XHR0aGlzLm9uU3RhdGVDaGFuZ2VkID0gdGhpcy5vblN0YXRlQ2hhbmdlZC5iaW5kKHRoaXMpO1xuXHRcdHRoaXMuY2hlY2tMb2NrVGhyZWFzaG9sZCA9IHRoaXMuY2hlY2tMb2NrVGhyZWFzaG9sZC5iaW5kKHRoaXMpO1xuXHRcdHRoaXMuY2hlY2tBcHBlYXJhbmNlID0gdGhpcy5jaGVja0FwcGVhcmFuY2UuYmluZCh0aGlzKTtcblxuXHRcdHRoaXMuaW5pdCgpO1xuXG5cdFx0dGhpcy5kZWZlcigoKSA9PiB7XG5cdFx0XHQvLyBwYXVzZSBhbmQgd2FpdCBmb3IgSGVybyBjb21wb25lbnQgdG8gYmUgaW5pdGlhbGl6ZWQgZmlyc3Rcblx0XHRcdHRoaXMuJGVsLmNzcygndmlzaWJpbGl0eScsICd2aXNpYmxlJyk7XG5cdFx0fSk7XG5cdH1cblxuXG5cdGluaXQoKSB7XG5cdFx0c2Nyb2xsU3RhdGUuc3Vic2NyaWJlKEVWRU5UX1NDUk9MTF9GUkFNRSwgdGhpcy5vblN0YXRlQ2hhbmdlZCk7XG5cdFx0Ly8gdGhpcy5zdWJzY3JpYmUoRW51bXMuQUNUSU9OX1NUSUNLWV9OQVZfU0hPV19CQUNLR1JPVU5ELCB0aGlzLmFkZEJhY2tncm91bmQpO1xuXHRcdC8vIHRoaXMuc3Vic2NyaWJlKEVudW1zLkFDVElPTl9TVElDS1lfTkFWX0hJREVfQkFDS0dST1VORCwgdGhpcy5yZW1vdmVCYWNrZ3JvdW5kKTtcblx0XHQvLyB0aGlzLm1vYmlsZUJyZWFrcG9pbnQgPSBCcmVha3BvaW50cy5vbih7XG5cdFx0Ly8gXHRuYW1lOiBcIkJSRUFLUE9JTlRfU01BTExcIlxuXHRcdC8vIH0pO1xuXHR9XG5cblxuXHRvblN0YXRlQ2hhbmdlZChzdGF0ZSkge1xuXHRcdGlmICghdGhpcy5pc0J1c3lDaGVja2luZykge1xuXHRcdFx0dGhpcy5pc0J1c3lDaGVja2luZyA9IHRydWU7XG5cdFx0XHR0aGlzLmNoZWNrTG9ja1RocmVhc2hvbGQoc3RhdGUpO1xuXHRcdFx0dGhpcy5jaGVja0JhY2tncm91bmRUaHJlYXNob2xkKHN0YXRlKTtcblx0XHRcdHRoaXMuY2hlY2tBcHBlYXJhbmNlKHN0YXRlKTtcblx0XHRcdHRoaXMuaXNCdXN5Q2hlY2tpbmcgPSBmYWxzZTtcblx0XHR9XG5cdH1cblxuXG5cdF9nZXRCYWNrZ3JvdW5kVGhyZXNob2xkKCkge1xuXHRcdC8vIGlmICh0aGlzLm1vYmlsZUJyZWFrcG9pbnQuaXNNYXRjaGVkKSB7XG5cdFx0Ly8gXHRyZXR1cm4gMTsgLy9zd2l0Y2ggYmcgYXMgc29vbiBhcyB3ZSBzdGFydCBzY3JvbGxpbmcgKHNjcm9sbD0wIG5lZWRzIHRyYW5zcGFyZW5jeSBvbiBtYXApXG5cdFx0Ly8gfVxuXHRcdHJldHVybiBCR19USFJFU0hPTEQgKyAxOyAvLyB3YWl0IHVudGlsIHBhc3NpbmcgdGhyZWFzaG9sZFxuXHR9XG5cblxuXHRzaG93KCkge1xuXHRcdGlmICh0aGlzLmlzSGlkZGVuKSB7XG5cdFx0XHRjb25zb2xlLmxvZygnc2hvdyEnKTtcblx0XHRcdHRoaXMuJGVsLmFkZENsYXNzKENMQVNTX1ZJU0lCTEUpLnJlbW92ZUNsYXNzKENMQVNTX0hJRERFTik7XG5cdFx0XHR0aGlzLmlzSGlkZGVuID0gZmFsc2U7XG5cdFx0XHR0aGlzLiRlbC5vbmUoYW5pbWF0aW9uRW5kRXZlbnQsICgpID0+IHtcblx0XHRcdFx0dGhpcy4kZWwucmVtb3ZlQ2xhc3MoQ0xBU1NfVklTSUJMRSk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH1cblxuXG5cdGhpZGUoKSB7XG5cdFx0aWYgKCF0aGlzLmlzSGlkZGVuKSB7XG5cdFx0XHRjb25zb2xlLmxvZygnaGlkZSEnKTtcblx0XHRcdHRoaXMuJGVsLmFkZENsYXNzKENMQVNTX0hJRERFTikucmVtb3ZlQ2xhc3MoQ0xBU1NfVklTSUJMRSk7XG5cdFx0XHR0aGlzLmlzSGlkZGVuID0gdHJ1ZTtcblx0XHR9XG5cdH1cblxuXG5cdGxvY2soKSB7XG5cdFx0aWYgKCF0aGlzLmlzTG9ja2VkKSB7XG5cdFx0XHR0aGlzLiRlbC5hZGRDbGFzcyhDTEFTU19MT0NLRUQpXG5cdFx0XHR0aGlzLmlzTG9ja2VkID0gdHJ1ZTtcblx0XHR9XG5cdH1cblxuXG5cdHVubG9jaygpIHtcblx0XHRpZiAodGhpcy5pc0xvY2tlZCkge1xuXHRcdFx0dGhpcy4kZWwucmVtb3ZlQ2xhc3MoQ0xBU1NfTE9DS0VEKVxuXHRcdFx0dGhpcy5pc0xvY2tlZCA9IGZhbHNlO1xuXHRcdH1cblx0fVxuXG5cblx0YWRkQmFja2dyb3VuZCgpIHtcblx0XHRpZiAoIXRoaXMuaGFzQmFja2dyb3VuZCkge1xuXHRcdFx0dGhpcy4kZWwuYWRkQ2xhc3MoQ0xBU1NfQkFDS0dST1VORClcblx0XHRcdHRoaXMuaGFzQmFja2dyb3VuZCA9IHRydWU7XG5cdFx0fVxuXHR9XG5cblxuXHRyZW1vdmVCYWNrZ3JvdW5kKCkge1xuXHRcdGlmICh0aGlzLmhhc0JhY2tncm91bmQpIHtcblx0XHRcdHRoaXMuJGVsLnJlbW92ZUNsYXNzKENMQVNTX0JBQ0tHUk9VTkQpXG5cdFx0XHR0aGlzLmhhc0JhY2tncm91bmQgPSBmYWxzZTtcblx0XHR9XG5cdH1cblxuXG5cdGlzQWJvdmVWaXNpYmxlVGhyZXNob2xkKHN0YXRlKSB7XG5cdFx0cmV0dXJuIHN0YXRlLnZpZXdwb3J0VG9wIDw9IEhJREVfVEhSRVNIT0xEO1xuXHR9XG5cblxuXHRjaGVja0xvY2tUaHJlYXNob2xkKHN0YXRlKSB7XG5cdFx0aWYgKHN0YXRlLnZpZXdwb3J0VG9wID49IExPQ0tfVEhSRVNIT0xEKSB7XG5cdFx0XHR0aGlzLmxvY2soKTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHR0aGlzLnVubG9jaygpO1xuXHRcdH1cblx0fVxuXG5cblx0Y2hlY2tCYWNrZ3JvdW5kVGhyZWFzaG9sZChzdGF0ZSkge1xuXHRcdGlmIChzdGF0ZS52aWV3cG9ydFRvcCA+PSB0aGlzLl9nZXRCYWNrZ3JvdW5kVGhyZXNob2xkKCkpIHtcblx0XHRcdHRoaXMuYWRkQmFja2dyb3VuZCgpO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHRoaXMucmVtb3ZlQmFja2dyb3VuZCgpO1xuXHRcdH1cblx0fVxuXG5cblx0Y2hlY2tBcHBlYXJhbmNlKHN0YXRlKSB7XG5cdFx0Ly8gc2Nyb2xsZWQgdG8gdGhlIHZlcnkgdG9wIG9yIGJvdHRvbTsgZWxlbWVudCBzbGlkZXMgaW5cblx0XHRpZiAodGhpcy5pc0Fib3ZlVmlzaWJsZVRocmVzaG9sZChzdGF0ZSkgfHwgc3RhdGUuaXNTY3JvbGxlZFRvQm90dG9tKSB7XG5cdFx0XHR0aGlzLnNob3coKTtcblx0XHR9XG5cdFx0ZWxzZSBpZiAoc3RhdGUuaXNTY3JvbGxpbmdEb3duKSB7XG5cdFx0XHR0aGlzLmhpZGUoKTtcblx0XHR9XG5cdFx0Ly8gZWxzZSBpZiBzY3JvbGxpbmcgdXAgd2l0aCBlbm91Z2ggc3BlZWRcblx0XHRlbHNlIGlmIChzdGF0ZS5zY3JvbGxTcGVlZCA+IE1JTl9TQ1JPTExfU1BFRUQpIHtcblx0XHRcdHRoaXMuc2hvdygpO1xuXHRcdH1cblx0fVxuXG5cblx0ZGVzdHJveSgpIHtcblx0XHR0aGlzLnNob3coKTtcblx0XHRzY3JvbGxTdGF0ZS51bnN1YnNjcmliZShFVkVOVF9TQ1JPTExfRlJBTUUsIHRoaXMub25TdGF0ZUNoYW5nZWQpO1xuXHRcdC8vIHRoaXMudW5zdWJzY3JpYmUoRW51bXMuQUNUSU9OX1NUSUNLWV9OQVZfU0hPV19CQUNLR1JPVU5ELCB0aGlzLmFkZEJhY2tncm91bmQpO1xuXHRcdC8vIHRoaXMudW5zdWJzY3JpYmUoRW51bXMuQUNUSU9OX1NUSUNLWV9OQVZfSElERV9CQUNLR1JPVU5ELCB0aGlzLnJlbW92ZUJhY2tncm91bmQpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gU3RpY2t5TmF2O1xuIiwiLy8gaW1wb3J0ICdiYWJlbC1wb2x5ZmlsbCc7XG5cbmltcG9ydCBDb21wb25lbnRMb2FkZXIgZnJvbSAnY29tcG9uZW50LWxvYWRlci1qcy9kaXN0L2VzNS9jb21wb25lbnQtbG9hZGVyJztcblxuaW1wb3J0IERva2kgZnJvbSAnLi9jb21wb25lbnRzL2Rva2knO1xuaW1wb3J0IFN0aWNreU5hdiBmcm9tICcuL2NvbXBvbmVudHMvc3RpY2t5LW5hdic7XG5cblxubmV3IENvbXBvbmVudExvYWRlcih7XG5cdERva2ksXG5cdFN0aWNreU5hdlxufSkuc2NhbigpO1xuXG4iLCIvKlxuXHRSZXR1cm5zIHRoZSBicm93c2VyIHByZWZpeGVkXG5cdHN0cmluZyBmb3IgdGhlIGFuaW1hdGlvbiBlbmQgZXZlbnRcbiovXG5leHBvcnQgZGVmYXVsdCAoKCkgPT4ge1xuXHRsZXQgdCA9IHVuZGVmaW5lZDtcblx0bGV0IGV2ZW50TmFtZTtcblx0Y29uc3QgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblx0Y29uc3QgYW5pbWF0aW9uTmFtZXMgPSB7XG5cdFx0J1dlYmtpdEFuaW1hdGlvbic6ICd3ZWJraXRBbmltYXRpb25FbmQnLFxuXHRcdCdNb3pBbmltYXRpb24nOiAnYW5pbWF0aW9uZW5kJyxcblx0XHQnT0FuaW1hdGlvbic6ICdvQW5pbWF0aW9uRW5kIG9hbmltYXRpb25lbmQnLFxuXHRcdCdhbmltYXRpb24nOiAnYW5pbWF0aW9uZW5kJ1xuXHR9O1xuXHRPYmplY3Qua2V5cyhhbmltYXRpb25OYW1lcykuZm9yRWFjaCggKHQpID0+IHtcblx0XHRpZiAoZWwuc3R5bGVbdF0gIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0ZXZlbnROYW1lID0gYW5pbWF0aW9uTmFtZXNbdF07XG5cdFx0fVxuXHR9KTtcblx0cmV0dXJuIGV2ZW50TmFtZTtcbn0pKCk7XG4iLCJleHBvcnQgZGVmYXVsdCAoZnVuYywgdGhyZXNob2xkLCBleGVjQXNhcCkgPT4ge1xuXHRsZXQgdGltZW91dDtcblxuXHRyZXR1cm4gKCkgPT4ge1xuXHRcdGxldCBvYmogPSB0aGlzLCBhcmdzID0gYXJndW1lbnRzO1xuXG5cdFx0bGV0IGRlbGF5ZWQgPSAoKSA9PiB7XG5cdFx0XHRpZiAoIWV4ZWNBc2FwKSB7XG5cdFx0XHRcdGZ1bmMuYXBwbHkob2JqLCBhcmdzKTtcblx0XHRcdH1cblx0XHRcdHRpbWVvdXQgPSBudWxsO1xuXHRcdH1cblxuXHRcdGlmICh0aW1lb3V0KSB7XG5cdFx0XHRjbGVhclRpbWVvdXQodGltZW91dCk7XG5cdFx0fSBlbHNlIGlmIChleGVjQXNhcCkge1xuXHRcdFx0ZnVuYy5hcHBseShvYmosIGFyZ3MpO1xuXHRcdH1cblxuXHRcdHRpbWVvdXQgPSBzZXRUaW1lb3V0KGRlbGF5ZWQsIHRocmVzaG9sZCB8fCAxMDApO1xuXHR9XG59IiwiaW1wb3J0IGRlYm91bmNlIGZyb20gJy4vZGVib3VuY2UnO1xuaW1wb3J0IHNjcm9sbE1vbml0b3IgZnJvbSAnc2Nyb2xsTW9uaXRvcic7XG5cbi8qKlxuICogU2Nyb2xsIFN0YXRlIEFic3RyYWN0aW9uXG4gKlxuICogSG9sZHMgaW5mbyBhYm91dCBzY3JvbGwgcG9zaXRpb24sIHNwZWVkLCBkaXJlY3Rpb24sIGRvY3VtZW50IC8gdmlld3BvcnQgc2l6ZSwgZXRjXG4gKlxuICogVHJpZ2dlcnMgZXZlbnRzIGZvclxuICogICAtIFNjcm9sbCBTdGFydFxuICogICAtIFNjcm9sbCBTdG9wXG4gKiAgIC0gRWFjaCBzY3JvbGwgZnJhbWUgd2hpbGUgc2Nyb2xsaW5nXG4gKi9cbmNvbnN0ICRkb2N1bWVudCA9ICQoZG9jdW1lbnQpO1xuY29uc3QgJHdpbmRvdyA9ICQod2luZG93KTtcblxuZXhwb3J0IGNvbnN0IEVWRU5UX1NDUk9MTF9TVEFSVCA9ICdzY3JvbGxzdGF0ZTpzdGFydCc7XG5leHBvcnQgY29uc3QgRVZFTlRfU0NST0xMX1NUT1AgID0gJ3Njcm9sbHN0YXRlOnN0b3AnO1xuZXhwb3J0IGNvbnN0IEVWRU5UX1NDUk9MTF9GUkFNRSA9ICdzY3JvbGxzdGF0ZTpmcmFtZSc7XG5cbmNsYXNzIFNjcm9sbFN0YXRlIHtcblxuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHR0aGlzLnVwZGF0aW5nICA9IGZhbHNlO1xuXHRcdHRoaXMubGF0ZXN0RnJhbWUgPSBEYXRlLm5vdygpO1xuXG5cdFx0dGhpcy5zY3JvbGxEaWZmICAgICAgICAgID0gMDsgIC8vIGRlbHRhIGZyb20gbGFzdCBzY3JvbGwgcG9zaXRpb25cblx0XHR0aGlzLnNjcm9sbERpc3RhbmNlICAgICAgPSAwOyAgLy8gYWJzb2x1dGUgZGVsdGFcblx0XHR0aGlzLnNjcm9sbERpcmVjdGlvbiAgICAgPSAwOyAgLy8gLTEsIDAsIG9yIDFcblx0XHR0aGlzLm1zU2luY2VMYXRlc3RDaGFuZ2UgPSAwO1xuXHRcdHRoaXMuc2Nyb2xsU3BlZWQgICAgICAgICA9IDA7ICAvLyBwaXhlbHMgLyBzZWNvbmQgZm9yIGxhdGVzdCBmcmFtZVxuXHRcdHRoaXMuZG9jdW1lbnRIZWlnaHQgICAgICA9IHVuZGVmaW5lZDtcblx0XHR0aGlzLnZpZXdwb3J0SGVpZ2h0ICAgICAgPSB1bmRlZmluZWQ7XG5cdFx0dGhpcy52aWV3cG9ydFRvcCAgICAgICAgID0gMDtcblx0XHR0aGlzLnZpZXdwb3J0Qm90dG9tICAgICAgPSB1bmRlZmluZWQ7XG5cdFx0dGhpcy5pc1Njcm9sbGluZ1VwICAgICAgID0gdW5kZWZpbmVkO1xuXHRcdHRoaXMuaXNTY3JvbGxpbmdEb3duICAgICA9IHVuZGVmaW5lZDtcblx0XHR0aGlzLmlzU2Nyb2xsZWRUb1RvcCAgICAgPSB1bmRlZmluZWQ7XG5cdFx0dGhpcy5pc1Njcm9sbGVkVG9Cb3R0b20gID0gdW5kZWZpbmVkO1xuXG5cdFx0dGhpcy5jYWxsYmFja3MgPSB7fTtcblxuXHRcdHRoaXMudXBkYXRlU3RhdGUoKTtcblx0XHR0aGlzLm9uU2Nyb2xsU3RhcnREZWJvdW5jZWQgPSBkZWJvdW5jZSh0aGlzLl9vblNjcm9sbFN0YXJ0LmJpbmQodGhpcyksIDUwMCwgdHJ1ZSk7XG5cdFx0dGhpcy5vblNjcm9sbFN0b3BEZWJvdW5jZWQgPSBkZWJvdW5jZSh0aGlzLl9vblNjcm9sbFN0b3AuYmluZCh0aGlzKSwgNTAwKTtcblxuXHRcdHRoaXMuX2FkZEV2ZW50TGlzdGVuZXJzKCk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBNZWRpYXRvciBmdW5jdGlvbmFsaXR5LlxuXHQgKiBTdG9yZXMgdGhlIGV2ZW50IGFuZCBjYWxsYmFjayBnaXZlbiBieSB0aGUgY29tcG9uZW50LlxuXHQgKiBmb3IgZnVydGhlciByZWZlcmVuY2UuXG5cdCAqIEBwYXJhbSAge1N0cmluZ30gZXZlbnQgICAgICBldmVudCBzdHJpbmdcblx0ICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrIENhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgd291bGQgYmUgdHJpZ2dlcmVkLlxuXHQgKi9cblx0c3Vic2NyaWJlKGV2ZW50LCBjYWxsYmFjaywgY29udGV4dCkge1xuXG5cdFx0Ly8gSXMgdGhpcyBhIG5ldyBldmVudD9cblx0XHRpZiAoICF0aGlzLmNhbGxiYWNrcy5oYXNPd25Qcm9wZXJ0eShldmVudCkgKSB7XG5cdFx0XHR0aGlzLmNhbGxiYWNrc1tldmVudF0gPSBbXTtcblx0XHR9XG5cblx0XHQvLyBTdG9yZSB0aGUgc3Vic2NyaWJlciBjYWxsYmFja1xuXHRcdHRoaXMuY2FsbGJhY2tzW2V2ZW50XS5wdXNoKCB7IGNvbnRleHQ6IGNvbnRleHQsIGNhbGxiYWNrOiBjYWxsYmFjayB9ICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBNZWRpYXRvciBmdW5jdGlvbmFsaXR5LlxuXHQgKiBSZW1vdmVzIHRoZSBzdG9yZWQgZXZlbnQgYW5kIGNhbGxiYWNrIGdpdmVuIGJ5IHRoZSBjb21wb25lbnQuXG5cdCAqIEBwYXJhbSAge1N0cmluZ30gICBldmVudCAgICBldmVudCBzdHJpbmdcblx0ICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrIENhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgd291bGQgYmUgdHJpZ2dlcmVkLlxuXHQgKiBAcmV0dXJuIHtCb29sZWFufSAgICAgICAgICAgIFRydWUgb24gc3VjY2VzcywgRmFsc2Ugb3RoZXJ3aXNlLlxuXHQgKi9cblx0dW5zdWJzY3JpYmUoZXZlbnQsIGNhbGxiYWNrKSB7XG5cdFx0Ly8gRG8gd2UgaGF2ZSB0aGlzIGV2ZW50P1xuXHRcdGlmICghdGhpcy5jYWxsYmFja3MuaGFzT3duUHJvcGVydHkoZXZlbnQpKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Ly8gRmluZCBvdXQgd2hlcmUgdGhpcyBpcyBhbmQgcmVtb3ZlIGl0XG5cdFx0Zm9yIChsZXQgaSA9IDAsIGxlbiA9IHRoaXMuY2FsbGJhY2tzW2V2ZW50XS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0aWYgKHRoaXMuY2FsbGJhY2tzW2V2ZW50XVtpXS5jYWxsYmFjayA9PT0gY2FsbGJhY2spIHtcblx0XHRcdFx0dGhpcy5jYWxsYmFja3NbZXZlbnRdLnNwbGljZShpLCAxKTtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0LyoqXG5cdCAqIFtwdWJsaXNoIGRlc2NyaXB0aW9uXVxuXHQgKiBAcGFyYW0gIHtbdHlwZV19IGV2ZW50IFtkZXNjcmlwdGlvbl1cblx0ICogQHJldHVybiB7W3R5cGVdfSAgICAgICBbZGVzY3JpcHRpb25dXG5cdCAqL1xuXHRfcHVibGlzaChldmVudCkge1xuXHRcdC8vIENoZWNrIGlmIHdlIGhhdmUgc3ViY3JpYmVycyB0byB0aGlzIGV2ZW50XG5cdFx0aWYgKCF0aGlzLmNhbGxiYWNrcy5oYXNPd25Qcm9wZXJ0eShldmVudCkpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBkb24ndCBzbGljZSBvbiBhcmd1bWVudHMgYmVjYXVzZSBpdCBwcmV2ZW50cyBvcHRpbWl6YXRpb25zIGluIEphdmFTY3JpcHQgZW5naW5lcyAoVjggZm9yIGV4YW1wbGUpXG5cdFx0Ly8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4vZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvRnVuY3Rpb25zL2FyZ3VtZW50c1xuXHRcdC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9wZXRrYWFudG9ub3YvYmx1ZWJpcmQvd2lraS9PcHRpbWl6YXRpb24ta2lsbGVycyMzMi1sZWFraW5nLWFyZ3VtZW50c1xuXHRcdGNvbnN0IGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7ICsraSkge1xuXHRcdFx0XHRhcmdzW2ldID0gYXJndW1lbnRzW2kgKyAxXTsgLy8gcmVtb3ZlIGZpcnN0IGFyZ3VtZW50XG5cdFx0fVxuXG5cdFx0Ly8gTG9vcCB0aHJvdWdoIHRoZW0gYW5kIGZpcmUgdGhlIGNhbGxiYWNrc1xuXHRcdGZvciAobGV0IGkgPSAwLCBsZW4gPSB0aGlzLmNhbGxiYWNrc1tldmVudF0ubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdGxldCBzdWJzY3JpcHRpb24gPSB0aGlzLmNhbGxiYWNrc1tldmVudF1baV07XG5cdFx0XHQvLyBDYWxsIGl0J3MgY2FsbGJhY2tcblx0XHRcdGlmIChzdWJzY3JpcHRpb24uY2FsbGJhY2spIHtcblx0XHRcdFx0c3Vic2NyaXB0aW9uLmNhbGxiYWNrLmFwcGx5KHN1YnNjcmlwdGlvbi5jb250ZXh0LCBhcmdzKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxuXG5cdGRlc3Ryb3koKSB7XG5cdFx0dGhpcy5fcmVtb3ZlRXZlbnRMaXN0ZW5lcnMoKTtcblx0fVxuXG5cdF9hZGRFdmVudExpc3RlbmVycygpIHtcblx0XHQkd2luZG93Lm9uKCdzY3JvbGwnLCB0aGlzLm9uU2Nyb2xsU3RhcnREZWJvdW5jZWQpO1xuXHRcdCR3aW5kb3cub24oJ3Njcm9sbCcsIHRoaXMub25TY3JvbGxTdG9wRGVib3VuY2VkKTtcblx0XHQkd2luZG93Lm9uKCdzY3JvbGwnLCB0aGlzLnVwZGF0ZVN0YXRlLmJpbmQodGhpcykpO1xuXHR9XG5cblx0X3JlbW92ZUV2ZW50TGlzdGVuZXJzKCkge1xuXHRcdCR3aW5kb3cub2ZmKCdzY3JvbGwnLCB0aGlzLm9uU2Nyb2xsU3RhcnREZWJvdW5jZWQpO1xuXHRcdCR3aW5kb3cub2ZmKCdzY3JvbGwnLCB0aGlzLm9uU2Nyb2xsU3RvcERlYm91bmNlZCk7XG5cdFx0JHdpbmRvdy5vZmYoJ3Njcm9sbCcsIHRoaXMudXBkYXRlU3RhdGUudW5iaW5kKHRoaXMpKTtcblx0fVxuXG5cdF9vblNjcm9sbFN0YXJ0KCkge1xuXHRcdHRoaXMuX3B1Ymxpc2godGhpcy5FVkVOVF9TQ1JPTExfU1RBUlQsIHRoaXMpO1xuXHR9XG5cblx0X29uU2Nyb2xsU3RvcCgpIHtcblx0XHR0aGlzLl9wdWJsaXNoKHRoaXMuRVZFTlRfU0NST0xMX1NUT1AsIHRoaXMpO1xuXHR9XG5cblx0dXBkYXRlU3RhdGUoKSB7XG5cdFx0aWYgKHRoaXMudXBkYXRpbmcpIHJldHVybjtcblx0XHR0aGlzLnVwZGF0aW5nID0gdHJ1ZTtcblxuXHRcdHZhciBub3cgPSBEYXRlLm5vdygpO1xuXG5cdFx0Ly8gZGlzdGFuY2UgYW5kIHNwZWVkIGNhbGNzXG5cdFx0dGhpcy5zY3JvbGxEaWZmICA9IHRoaXMudmlld3BvcnRUb3AgLSBzY3JvbGxNb25pdG9yLnZpZXdwb3J0VG9wO1xuXHRcdHRoaXMuc2Nyb2xsRGlzdGFuY2UgID0gTWF0aC5hYnModGhpcy5zY3JvbGxEaWZmKTtcblx0XHR0aGlzLnNjcm9sbERpcmVjdGlvbiA9IE1hdGgubWF4KC0xLCBNYXRoLm1pbigxLCB0aGlzLnNjcm9sbERpZmYpKTtcblx0XHR0aGlzLm1zU2luY2VMYXRlc3RDaGFuZ2UgPSAobm93IC0gdGhpcy5sYXRlc3RGcmFtZSk7XG5cdFx0dGhpcy5zY3JvbGxTcGVlZCA9IHRoaXMuc2Nyb2xsRGlzdGFuY2UgLyB0aGlzLm1zU2luY2VMYXRlc3RDaGFuZ2UgKiAxMDAwO1xuXG5cdFx0Ly8gdmlld3BvcnRcblx0XHR0aGlzLmRvY3VtZW50SGVpZ2h0ID0gc2Nyb2xsTW9uaXRvci5kb2N1bWVudEhlaWdodDtcblx0XHR0aGlzLnZpZXdwb3J0SGVpZ2h0ID0gc2Nyb2xsTW9uaXRvci52aWV3cG9ydEhlaWdodDtcblx0XHR0aGlzLnZpZXdwb3J0VG9wICAgID0gc2Nyb2xsTW9uaXRvci52aWV3cG9ydFRvcDtcblx0XHR0aGlzLnZpZXdwb3J0Qm90dG9tID0gc2Nyb2xsTW9uaXRvci52aWV3cG9ydEJvdHRvbTtcblxuXHRcdC8vIGhlbHBlcnNcblx0XHR0aGlzLmlzU2Nyb2xsaW5nVXAgPSB0aGlzLnNjcm9sbERpcmVjdGlvbiA+IDA7XG5cdFx0dGhpcy5pc1Njcm9sbGluZ0Rvd24gPSB0aGlzLnNjcm9sbERpcmVjdGlvbiA8IDA7XG5cdFx0dGhpcy5pc1Njcm9sbGVkVG9Ub3AgPSB0aGlzLnZpZXdwb3J0VG9wIDw9IDA7XG5cdFx0dGhpcy5pc1Njcm9sbGVkVG9Cb3R0b20gPSB0aGlzLnZpZXdwb3J0Qm90dG9tID49IHRoaXMuZG9jdW1lbnRIZWlnaHQ7XG5cblx0XHR0aGlzLmxhdGVzdEZyYW1lID0gbm93O1xuXG5cdFx0dGhpcy5fcHVibGlzaCh0aGlzLkVWRU5UX1NDUk9MTF9GUkFNRSwgdGhpcyk7XG5cblx0XHR0aGlzLnVwZGF0aW5nID0gZmFsc2U7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgU2Nyb2xsU3RhdGVcbiJdfQ==
