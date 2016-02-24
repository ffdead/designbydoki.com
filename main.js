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
var LOCK_THRESHOLD = 100;

var BG_THRESHOLD = 500;

// Speed/Distance required to change appearance per scroll frame
var MIN_SCROLL_SPEED = 500;
var MIN_SCROLL_DISTANCE = 20;

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
			return LOCK_THRESHOLD + 1; // wait until passing threashold
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
			return state.viewportTop <= LOCK_THRESHOLD;
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
			// * fast computer -> many events -> short distance between events = better to check speed
			// * slow computer -> few events -> less visible speed = better to check distance
			else if (state.scrollSpeed > MIN_SCROLL_SPEED || state.scrollDistance > MIN_SCROLL_DISTANCE) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvY29tcG9uZW50LWxvYWRlci1qcy9kaXN0L2VzNS9jb21wb25lbnQtbG9hZGVyLmpzIiwibm9kZV9tb2R1bGVzL2NvbXBvbmVudC1sb2FkZXItanMvZGlzdC9lczUvY29tcG9uZW50LmpzIiwibm9kZV9tb2R1bGVzL3Njcm9sbE1vbml0b3Ivc2Nyb2xsTW9uaXRvci5qcyIsInRoZW1lL2pzL2NvbXBvbmVudHMvZG9raS5qcyIsInRoZW1lL2pzL2NvbXBvbmVudHMvc3RpY2t5LW5hdi5qcyIsInRoZW1lL2pzL21haW4uanMiLCJ0aGVtZS9qcy91dGlscy9hbmltYXRpb24tZW5kLWV2ZW50LmpzIiwidGhlbWUvanMvdXRpbHMvZGVib3VuY2UuanMiLCJ0aGVtZS9qcy91dGlscy9zY3JvbGwtc3RhdGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lDclhNOzs7QUFDTCxVQURLLElBQ0wsR0FBYzt3QkFEVCxNQUNTOztxRUFEVCxrQkFFSyxZQURJOztBQUViLFVBQVEsR0FBUixDQUFZLGFBQVosRUFG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c0JiLFFBQUssZUFBTCxHQUF1QixLQUFLLFdBQUwsSUFBb0IsQ0FBcEIsQ0F0QlY7QUF1QmIsUUFBSyxrQkFBTCxHQUEwQixLQUFLLGNBQUwsSUFBdUIsS0FBSyxjQUFMLENBdkJwQzs7QUF5QmIsUUFBSyxXQUFMLEdBQW1CLEdBQW5CLENBekJhOztBQTJCYixRQUFLLFFBQUwsQ0FBYyxLQUFLLGtCQUFMLEVBQXlCLElBQXZDLEVBM0JhOztBQTZCYixRQUFLLFFBQUwsR0FBZ0IsS0FBaEIsQ0E3QmE7Ozs7UUFySVQ7OztBQXNLTixPQUFPLE9BQVAsR0FBaUIsSUFBSSxXQUFKLEVBQWpCIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogQ29tcG9uZW50TG9hZGVyIENsYXNzXG4gKlxuICogSW5zdGFudGlhdGVzIEphdmFTY3JpcHQgQ2xhc3NlcyB3aGVuIHRoZWlyIG5hbWUgaXMgZm91bmQgaW4gdGhlIERPTSB1c2luZyBhdHRyaWJ1dGUgZGF0YS1jb21wb25lbnQ9XCJcIlxuICpcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSAoZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSkoKTtcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxudmFyIENvbXBvbmVudExvYWRlciA9IChmdW5jdGlvbiAoKSB7XG5cblx0LyoqXG4gICogQ29uc3RydWN0b3IgZm9yIHRoZSBDb21wb25lbnRMb2FkZXJcbiAgKiBAY2xhc3NcbiAgKiBAcHVibGljXG4gICogQHBhcmFtIHtPYmplY3R9IGNvbXBvbmVudHMgLSBPcHRpb25hbCBjb2xsZWN0aW9uIG9mIGF2YWlsYWJsZSBjb21wb25lbnRzOiB7Y29tcG9uZW50TmFtZTogY2xhc3NEZWZpbml0aW9ufVxuICAqIEBwYXJhbSB7Tm9kZX0gY29udGV4dCAtIE9wdGlvbmFsIERPTSBub2RlIHRvIHNlYXJjaCBmb3IgY29tcG9uZW50cy4gRGVmYXVsdHMgdG8gZG9jdW1lbnQuXG4gICovXG5cblx0ZnVuY3Rpb24gQ29tcG9uZW50TG9hZGVyKCkge1xuXHRcdHZhciBjb21wb25lbnRzID0gYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyB7fSA6IGFyZ3VtZW50c1swXTtcblx0XHR2YXIgY29udGV4dCA9IGFyZ3VtZW50c1sxXSA9PT0gdW5kZWZpbmVkID8gZG9jdW1lbnQgOiBhcmd1bWVudHNbMV07XG5cblx0XHRfY2xhc3NDYWxsQ2hlY2sodGhpcywgQ29tcG9uZW50TG9hZGVyKTtcblxuXHRcdHRoaXMuY29udGV4dEVsID0gY29udGV4dDtcblx0XHR0aGlzLmluaXRpYWxpemVkQ29tcG9uZW50cyA9IHt9O1xuXHRcdHRoaXMubnVtYmVyT2ZJbml0aWFsaXplZENvbXBvbmVudHMgPSAwO1xuXHRcdHRoaXMuY29tcG9uZW50cyA9IHt9O1xuXHRcdHRoaXMudG9waWNzID0ge307XG5cdFx0dGhpcy5yZWdpc3Rlcihjb21wb25lbnRzKTtcblx0fVxuXG5cdF9jcmVhdGVDbGFzcyhDb21wb25lbnRMb2FkZXIsIFt7XG5cdFx0a2V5OiBcInJlZ2lzdGVyXCIsXG5cblx0XHQvKipcbiAgICogQWRkIGNvbXBvbmVudChzKSB0byBjb2xsZWN0aW9uIG9mIGF2YWlsYWJsZSBjb21wb25lbnRzXG4gICAqIEBwdWJsaWNcbiAgICogQHBhcmFtIHtPYmplY3R9IGNvbXBvbmVudHMgLSBDb2xsZWN0aW9uIG9mIGNvbXBvbmVudHM6IHtjb21wb25lbnROYW1lOiBjbGFzc0RlZmluaXRpb259XG4gICAqL1xuXHRcdHZhbHVlOiBmdW5jdGlvbiByZWdpc3RlcigpIHtcblx0XHRcdHZhciBfdGhpcyA9IHRoaXM7XG5cblx0XHRcdHZhciBjb21wb25lbnRzID0gYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyB7fSA6IGFyZ3VtZW50c1swXTtcblxuXHRcdFx0T2JqZWN0LmtleXMoY29tcG9uZW50cykuZm9yRWFjaChmdW5jdGlvbiAoY29tcG9uZW50TmFtZSkge1xuXHRcdFx0XHRfdGhpcy5jb21wb25lbnRzW2NvbXBvbmVudE5hbWVdID0gY29tcG9uZW50c1tjb21wb25lbnROYW1lXTtcblx0XHRcdH0pO1xuXHRcdH1cblx0fSwge1xuXHRcdGtleTogXCJ1bnJlZ2lzdGVyXCIsXG5cblx0XHQvKipcbiAgICogUmVtb3ZlIGNvbXBvbmVudCBmcm9tIGNvbGxlY3Rpb24gb2YgYXZhaWxhYmxlIGNvbXBvbmVudHNcbiAgICogQHB1YmxpY1xuICAgKiBAcGFyYW0ge1N0cmluZ30gY29tcG9uZW50TmFtZSAtIE5hbWUgb2YgdGhlIGNvbXBvbmVudCB0byByZW1vdmVcbiAgICovXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIHVucmVnaXN0ZXIoY29tcG9uZW50TmFtZSkge1xuXHRcdFx0ZGVsZXRlIHRoaXMuY29tcG9uZW50c1tjb21wb25lbnROYW1lXTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6IFwic3Vic2NyaWJlXCIsXG5cblx0XHQvKipcbiAgICogTWVkaWF0b3IgZnVuY3Rpb25hbGl0eS5cbiAgICogU3RvcmVzIHRoZSB0b3BpYyBhbmQgY2FsbGJhY2sgZ2l2ZW4gYnkgdGhlIGNvbXBvbmVudC5cbiAgICogZm9yIGZ1cnRoZXIgcmVmZXJlbmNlLlxuICAgKiBAcGFyYW0gIHtTdHJpbmd9IHRvcGljICAgICAgVG9waWMgc3RyaW5nXG4gICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjYWxsYmFjayBDYWxsYmFjayBmdW5jdGlvbiB0aGF0IHdvdWxkIGJlIHRyaWdnZXJlZC5cbiAgICogQHBhcmFtICB7RnVuY3Rpb259IGNvbnRleHQgIENsYXNzIGluc3RhbmNlIHdoaWNoIG93bnMgdGhlIGNhbGxiYWNrXG4gICAqL1xuXHRcdHZhbHVlOiBmdW5jdGlvbiBzdWJzY3JpYmUodG9waWMsIGNhbGxiYWNrLCBjb250ZXh0KSB7XG5cblx0XHRcdC8vIElzIHRoaXMgYSBuZXcgdG9waWM/XG5cdFx0XHRpZiAoIXRoaXMudG9waWNzLmhhc093blByb3BlcnR5KHRvcGljKSkge1xuXHRcdFx0XHR0aGlzLnRvcGljc1t0b3BpY10gPSBbXTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gU3RvcmUgdGhlIHN1YnNjcmliZXIgY2FsbGJhY2tcblx0XHRcdHRoaXMudG9waWNzW3RvcGljXS5wdXNoKHsgY29udGV4dDogY29udGV4dCwgY2FsbGJhY2s6IGNhbGxiYWNrIH0pO1xuXHRcdH1cblx0fSwge1xuXHRcdGtleTogXCJ1bnN1YnNjcmliZVwiLFxuXG5cdFx0LyoqXG4gICAqIE1lZGlhdG9yIGZ1bmN0aW9uYWxpdHkuXG4gICAqIFJlbW92ZXMgdGhlIHN0b3JlZCB0b3BpYyBhbmQgY2FsbGJhY2sgZ2l2ZW4gYnkgdGhlIGNvbXBvbmVudC5cbiAgICogQHBhcmFtICB7U3RyaW5nfSAgIHRvcGljICAgIFRvcGljIHN0cmluZ1xuICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY2FsbGJhY2sgQ2FsbGJhY2sgZnVuY3Rpb24gdGhhdCB3b3VsZCBiZSB0cmlnZ2VyZWQuXG4gICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjb250ZXh0ICBDbGFzcyBpbnN0YW5jZSB3aGljaCBvd25zIHRoZSBjYWxsYmFja1xuICAgKiBAcmV0dXJuIHtCb29sZWFufSAgICAgICAgICAgVHJ1ZSBvbiBzdWNjZXNzLCBGYWxzZSBvdGhlcndpc2UuXG4gICAqL1xuXHRcdHZhbHVlOiBmdW5jdGlvbiB1bnN1YnNjcmliZSh0b3BpYywgY2FsbGJhY2ssIGNvbnRleHQpIHtcblx0XHRcdC8vIERvIHdlIGhhdmUgdGhpcyB0b3BpYz9cblx0XHRcdGlmICghdGhpcy50b3BpY3MuaGFzT3duUHJvcGVydHkodG9waWMpKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gRmluZCBvdXQgd2hlcmUgdGhpcyBpcyBhbmQgcmVtb3ZlIGl0XG5cdFx0XHRmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy50b3BpY3NbdG9waWNdLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRcdGlmICh0aGlzLnRvcGljc1t0b3BpY11baV0uY2FsbGJhY2sgPT09IGNhbGxiYWNrKSB7XG5cdFx0XHRcdFx0aWYgKCFjb250ZXh0IHx8IHRoaXMudG9waWNzW3RvcGljXVtpXS5jb250ZXh0ID09PSBjb250ZXh0KSB7XG5cdFx0XHRcdFx0XHR0aGlzLnRvcGljc1t0b3BpY10uc3BsaWNlKGksIDEpO1xuXHRcdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6IFwicHVibGlzaFwiLFxuXG5cdFx0LyoqXG4gICAqIFtwdWJsaXNoIGRlc2NyaXB0aW9uXVxuICAgKiBAcGFyYW0gIHtbdHlwZV19IHRvcGljIFtkZXNjcmlwdGlvbl1cbiAgICogQHJldHVybiB7W3R5cGVdfSAgICAgICBbZGVzY3JpcHRpb25dXG4gICAqL1xuXHRcdHZhbHVlOiBmdW5jdGlvbiBwdWJsaXNoKHRvcGljKSB7XG5cdFx0XHQvLyBDaGVjayBpZiB3ZSBoYXZlIHN1YmNyaWJlcnMgdG8gdGhpcyB0b3BpY1xuXHRcdFx0aWYgKCF0aGlzLnRvcGljcy5oYXNPd25Qcm9wZXJ0eSh0b3BpYykpIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBkb24ndCBzbGljZSBvbiBhcmd1bWVudHMgYmVjYXVzZSBpdCBwcmV2ZW50cyBvcHRpbWl6YXRpb25zIGluIEphdmFTY3JpcHQgZW5naW5lcyAoVjggZm9yIGV4YW1wbGUpXG5cdFx0XHQvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9GdW5jdGlvbnMvYXJndW1lbnRzXG5cdFx0XHQvLyBodHRwczovL2dpdGh1Yi5jb20vcGV0a2FhbnRvbm92L2JsdWViaXJkL3dpa2kvT3B0aW1pemF0aW9uLWtpbGxlcnMjMzItbGVha2luZy1hcmd1bWVudHNcblx0XHRcdHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7ICsraSkge1xuXHRcdFx0XHRhcmdzW2ldID0gYXJndW1lbnRzW2kgKyAxXTsgLy8gcmVtb3ZlIGZpcnN0IGFyZ3VtZW50XG5cdFx0XHR9XG5cblx0XHRcdC8vIExvb3AgdGhyb3VnaCB0aGVtIGFuZCBmaXJlIHRoZSBjYWxsYmFja3Ncblx0XHRcdGZvciAodmFyIF9pID0gMCwgbGVuID0gdGhpcy50b3BpY3NbdG9waWNdLmxlbmd0aDsgX2kgPCBsZW47IF9pKyspIHtcblx0XHRcdFx0dmFyIHN1YnNjcmlwdGlvbiA9IHRoaXMudG9waWNzW3RvcGljXVtfaV07XG5cdFx0XHRcdC8vIENhbGwgaXQncyBjYWxsYmFja1xuXHRcdFx0XHRpZiAoc3Vic2NyaXB0aW9uICYmIHN1YnNjcmlwdGlvbi5jYWxsYmFjaykge1xuXHRcdFx0XHRcdHN1YnNjcmlwdGlvbi5jYWxsYmFjay5hcHBseShzdWJzY3JpcHRpb24uY29udGV4dCwgYXJncyk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiBcInNjYW5cIixcblxuXHRcdC8qKlxuICAgKiBTY2FuIHRoZSBET00sIGluaXRpYWxpemUgbmV3IGNvbXBvbmVudHMgYW5kIGRlc3Ryb3kgcmVtb3ZlZCBjb21wb25lbnRzLlxuICAgKiBAcHVibGljXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gT3B0aW9uYWwgZGF0YSBvYmplY3QgdG8gcGFzcyB0byB0aGUgY29tcG9uZW50IGNvbnN0cnVjdG9yXG4gICAqL1xuXHRcdHZhbHVlOiBmdW5jdGlvbiBzY2FuKCkge1xuXHRcdFx0dmFyIF90aGlzMiA9IHRoaXM7XG5cblx0XHRcdHZhciBkYXRhID0gYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyB7fSA6IGFyZ3VtZW50c1swXTtcblxuXHRcdFx0dmFyIGFjdGl2ZUNvbXBvbmVudHMgPSB7fSxcblx0XHRcdCAgICBlbGVtZW50cyA9IHRoaXMuY29udGV4dEVsLnF1ZXJ5U2VsZWN0b3JBbGwoXCJbZGF0YS1jb21wb25lbnRdXCIpO1xuXG5cdFx0XHRbXS5mb3JFYWNoLmNhbGwoZWxlbWVudHMsIGZ1bmN0aW9uIChlbCkge1xuXHRcdFx0XHRfdGhpczIuX3NjYW5FbGVtZW50KGVsLCBhY3RpdmVDb21wb25lbnRzLCBkYXRhKTtcblx0XHRcdH0pO1xuXG5cdFx0XHRpZiAodGhpcy5udW1iZXJPZkluaXRpYWxpemVkQ29tcG9uZW50cyA+IDApIHRoaXMuY2xlYW5VcF8oYWN0aXZlQ29tcG9uZW50cyk7XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiBcIl9zY2FuRWxlbWVudFwiLFxuXG5cdFx0LyoqXG4gICAqIEZpbmQgYWxsIGNvbXBvbmVudHMgcmVnaXN0ZXJlZCBvbiBhIHNwZWNpZmljIERPTSBlbGVtZW50IGFuZCBpbml0aWFsaXplIHRoZW0gaWYgbmV3XG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7RWxlbWVudH0gZWwgLSBET00gZWxlbWVudCB0byBzY2FuIGZvciBjb21wb25lbnRzXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBhY3RpdmVDb21wb25lbnRzIC0gQWxsIGNvbXBvbmVudElkcyBjdXJyZW50bHkgZm91bmQgaW4gdGhlIERPTVxuICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIE9wdGlvbmFsIGRhdGEgb2JqZWN0IHRvIHBhc3MgdG8gdGhlIGNvbXBvbmVudCBjb25zdHJ1Y3RvclxuICAgKi9cblx0XHR2YWx1ZTogZnVuY3Rpb24gX3NjYW5FbGVtZW50KGVsLCBhY3RpdmVDb21wb25lbnRzLCBkYXRhKSB7XG5cdFx0XHR2YXIgX3RoaXMzID0gdGhpcztcblxuXHRcdFx0Ly8gY2hlY2sgb2YgY29tcG9uZW50KHMpIGZvciB0aGlzIERPTSBlbGVtZW50IGFscmVhZHkgaGF2ZSBiZWVuIGluaXRpYWxpemVkXG5cdFx0XHR2YXIgZWxlbWVudElkID0gZWwuZ2V0QXR0cmlidXRlKFwiZGF0YS1jb21wb25lbnQtaWRcIik7XG5cblx0XHRcdGlmICghZWxlbWVudElkKSB7XG5cdFx0XHRcdC8vIGdpdmUgdW5pcXVlIGlkIHNvIHdlIGNhbiB0cmFjayBpdCBvbiBuZXh0IHNjYW5cblx0XHRcdFx0ZWxlbWVudElkID0gdGhpcy5fZ2VuZXJhdGVVVUlEKCk7XG5cdFx0XHRcdGVsLnNldEF0dHJpYnV0ZShcImRhdGEtY29tcG9uZW50LWlkXCIsIGVsZW1lbnRJZCk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIGZpbmQgdGhlIG5hbWUgb2YgdGhlIGNvbXBvbmVudCBpbnN0YW5jZVxuXHRcdFx0dmFyIGNvbXBvbmVudExpc3QgPSBlbC5nZXRBdHRyaWJ1dGUoXCJkYXRhLWNvbXBvbmVudFwiKS5tYXRjaCgvXFxTKy9nKTtcblx0XHRcdGNvbXBvbmVudExpc3QuZm9yRWFjaChmdW5jdGlvbiAoY29tcG9uZW50TmFtZSkge1xuXG5cdFx0XHRcdHZhciBjb21wb25lbnRJZCA9IGNvbXBvbmVudE5hbWUgKyBcIi1cIiArIGVsZW1lbnRJZDtcblx0XHRcdFx0YWN0aXZlQ29tcG9uZW50c1tjb21wb25lbnRJZF0gPSB0cnVlO1xuXG5cdFx0XHRcdC8vIGNoZWNrIGlmIGNvbXBvbmVudCBub3QgaW5pdGlhbGl6ZWQgYmVmb3JlXG5cdFx0XHRcdGlmICghX3RoaXMzLmluaXRpYWxpemVkQ29tcG9uZW50c1tjb21wb25lbnRJZF0pIHtcblx0XHRcdFx0XHRfdGhpczMuX2luaXRpYWxpemVDb21wb25lbnQoY29tcG9uZW50TmFtZSwgY29tcG9uZW50SWQsIGVsLCBkYXRhKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiBcIl9pbml0aWFsaXplQ29tcG9uZW50XCIsXG5cblx0XHQvKipcbiAgICogQ2FsbCBjb25zdHJ1Y3RvciBvZiBjb21wb25lbnQgYW5kIGFkZCBpbnN0YW5jZSB0byB0aGUgY29sbGVjdGlvbiBvZiBpbml0aWFsaXplZCBjb21wb25lbnRzXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBjb21wb25lbnROYW1lIC0gTmFtZSBvZiB0aGUgY29tcG9uZW50IHRvIGluaXRpYWxpemUuIFVzZWQgdG8gbG9va3VwIGNsYXNzIGRlZmluaXRpb24gaW4gY29tcG9uZW50cyBjb2xsZWN0aW9uLlxuICAgKiBAcGFyYW0ge1N0cmluZ30gY29tcG9uZW50SWQgLSBVbmlxdWUgY29tcG9uZW50IElEIChjb21iaW5hdGlvbiBvZiBjb21wb25lbnQgbmFtZSBhbmQgZWxlbWVudCBJRClcbiAgICogQHBhcmFtIHtFbGVtZW50fSBlbCAtIERPTSBlbGVtZW50IHRoYXQgaXMgdGhlIGNvbnRleHQgb2YgdGhpcyBjb21wb25lbnRcbiAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBPcHRpb25hbCBkYXRhIG9iamVjdCB0byBwYXNzIHRvIHRoZSBjb21wb25lbnQgY29uc3RydWN0b3JcbiAgICovXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIF9pbml0aWFsaXplQ29tcG9uZW50KGNvbXBvbmVudE5hbWUsIGNvbXBvbmVudElkLCBlbCwgZGF0YSkge1xuXHRcdFx0dmFyIGNvbXBvbmVudCA9IHRoaXMuY29tcG9uZW50c1tjb21wb25lbnROYW1lXTtcblxuXHRcdFx0aWYgKHR5cGVvZiBjb21wb25lbnQgIT09IFwiZnVuY3Rpb25cIikgdGhyb3cgXCJDb21wb25lbnRMb2FkZXI6IHVua25vd24gY29tcG9uZW50ICdcIiArIGNvbXBvbmVudE5hbWUgKyBcIidcIjtcblxuXHRcdFx0dmFyIGluc3RhbmNlID0gbmV3IGNvbXBvbmVudChlbCwgZGF0YSwgdGhpcyk7XG5cblx0XHRcdHRoaXMuaW5pdGlhbGl6ZWRDb21wb25lbnRzW2NvbXBvbmVudElkXSA9IGluc3RhbmNlO1xuXHRcdFx0dGhpcy5udW1iZXJPZkluaXRpYWxpemVkQ29tcG9uZW50cysrO1xuXHRcdH1cblx0fSwge1xuXHRcdGtleTogXCJfZGVzdHJveUNvbXBvbmVudFwiLFxuXG5cdFx0LyoqXG4gICAqIENhbGwgZGVzdHJveSgpIG9uIGEgY29tcG9uZW50IGluc3RhbmNlIGFuZCByZW1vdmUgaXQgZnJvbSB0aGUgY29sbGVjdGlvbiBvZiBpbml0aWFsaXplZCBjb21wb25lbnRzXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBjb21wb25lbnRJZCAtIFVuaXF1ZSBjb21wb25lbnQgSUQgdXNlZCB0byBmaW5kIGNvbXBvbmVudCBpbnN0YW5jZVxuICAgKi9cblx0XHR2YWx1ZTogZnVuY3Rpb24gX2Rlc3Ryb3lDb21wb25lbnQoY29tcG9uZW50SWQpIHtcblx0XHRcdHZhciBpbnN0YW5jZSA9IHRoaXMuaW5pdGlhbGl6ZWRDb21wb25lbnRzW2NvbXBvbmVudElkXTtcblx0XHRcdGlmIChpbnN0YW5jZSAmJiB0eXBlb2YgaW5zdGFuY2UuZGVzdHJveSA9PT0gXCJmdW5jdGlvblwiKSBpbnN0YW5jZS5kZXN0cm95KCk7XG5cblx0XHRcdC8vIHNhZmUgdG8gZGVsZXRlIHdoaWxlIG9iamVjdCBrZXlzIHdoaWxlIGxvb3BpbmdodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzM0NjMwNDgvaXMtaXQtc2FmZS10by1kZWxldGUtYW4tb2JqZWN0LXByb3BlcnR5LXdoaWxlLWl0ZXJhdGluZy1vdmVyLXRoZW1cblx0XHRcdGRlbGV0ZSB0aGlzLmluaXRpYWxpemVkQ29tcG9uZW50c1tjb21wb25lbnRJZF07XG5cdFx0XHR0aGlzLm51bWJlck9mSW5pdGlhbGl6ZWRDb21wb25lbnRzLS07XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiBcImNsZWFuVXBfXCIsXG5cblx0XHQvKipcbiAgICogRGVzdHJveSBpbmFpdGlhbGl6ZWQgY29tcG9uZW50cyB0aGF0IG5vIGxvbmdlciBhcmUgYWN0aXZlXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBhY3RpdmVDb21wb25lbnRzIC0gQWxsIGNvbXBvbmVudElkcyBjdXJyZW50bHkgZm91bmQgaW4gdGhlIERPTVxuICAgKi9cblx0XHR2YWx1ZTogZnVuY3Rpb24gY2xlYW5VcF8oKSB7XG5cdFx0XHR2YXIgX3RoaXM0ID0gdGhpcztcblxuXHRcdFx0dmFyIGFjdGl2ZUNvbXBvbmVudHMgPSBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IHt9IDogYXJndW1lbnRzWzBdO1xuXG5cdFx0XHRPYmplY3Qua2V5cyh0aGlzLmluaXRpYWxpemVkQ29tcG9uZW50cykuZm9yRWFjaChmdW5jdGlvbiAoY29tcG9uZW50SWQpIHtcblx0XHRcdFx0aWYgKCFhY3RpdmVDb21wb25lbnRzW2NvbXBvbmVudElkXSkge1xuXHRcdFx0XHRcdF90aGlzNC5fZGVzdHJveUNvbXBvbmVudChjb21wb25lbnRJZCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH1cblx0fSwge1xuXHRcdGtleTogXCJfZ2VuZXJhdGVVVUlEXCIsXG5cblx0XHQvKipcbiAgICogR2VuZXJhdGVzIGEgcmZjNDEyMiB2ZXJzaW9uIDQgY29tcGxpYW50IHVuaXF1ZSBJRFxuICAgKiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEwNTAzNC9jcmVhdGUtZ3VpZC11dWlkLWluLWphdmFzY3JpcHRcbiAgICogQHByaXZhdGVcbiAgICovXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIF9nZW5lcmF0ZVVVSUQoKSB7XG5cdFx0XHRyZXR1cm4gXCJ4eHh4eHh4eC14eHh4LTR4eHgteXh4eC14eHh4eHh4eHh4eHhcIi5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uIChjKSB7XG5cdFx0XHRcdHZhciByID0gTWF0aC5yYW5kb20oKSAqIDE2IHwgMCxcblx0XHRcdFx0ICAgIHYgPSBjID09IFwieFwiID8gciA6IHIgJiAweDMgfCAweDg7XG5cdFx0XHRcdHJldHVybiB2LnRvU3RyaW5nKDE2KTtcblx0XHRcdH0pO1xuXHRcdH1cblx0fV0pO1xuXG5cdHJldHVybiBDb21wb25lbnRMb2FkZXI7XG59KSgpO1xuXG4vLyBFeHBvcnQgQU1ELCBDb21tb25KUy9FUzYgbW9kdWxlIG9yIGFzc3VtZSBnbG9iYWwgbmFtZXNwYWNlXG5pZiAodHlwZW9mIGRlZmluZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBkZWZpbmUuYW1kKSB7XG5cdGRlZmluZShbXSwgQ29tcG9uZW50TG9hZGVyKTtcbn0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBtb2R1bGUuZXhwb3J0cykge1xuXHRtb2R1bGUuZXhwb3J0cyA9IENvbXBvbmVudExvYWRlcjtcbn0gZWxzZSB7XG5cdHdpbmRvdy5Db21wb25lbnRMb2FkZXIgPSBDb21wb25lbnRMb2FkZXI7XG59IiwiLyoqXG4gKiBDb21wb25lbnQgQmFzZSBDbGFzc1xuICogXG4gKiBTZXRzIGFsbCBhcmd1bWVudHMgcGFzc2VkIGluIHRvIGNvbnN0cnVjdG9yIGZyb20gQ29tcG9uZW50TG9hZGVyXG4gKlxuICogRXhwb3NlcyBwdWIvc3ViIG1ldGhvZHMgZm9yIHRyaWdnZXJpbmcgZXZlbnRzIHRvIG90aGVyIGNvbXBvbmVudHNcbiAqXG4gKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIF9jcmVhdGVDbGFzcyA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoJ3ZhbHVlJyBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSkoKTtcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb24nKTsgfSB9XG5cbnZhciBDb21wb25lbnQgPSAoZnVuY3Rpb24gKCkge1xuXG5cdC8qKlxuICAqIENvbnN0cnVjdG9yIGZvciB0aGUgQ29tcG9uZW50XG4gICpcbiAgKiBDYWxsIGBzdXBlciguLi5hcmd1bWVudHMpO2AgaW4gdGhlIGJhc2UgY2xhc3MgY29uc3RydWN0b3JcbiAgKlxuICAqIEBwdWJsaWNcbiAgKiBAcGFyYW0ge05vZGV9IGNvbnRleHQgLSBET00gbm9kZSB0aGF0IGNvbnRhaW5zIHRoZSBjb21wb25lbnQgbWFya3VwXG4gICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBPcHRpb25hbCBkYXRhIG9iamVjdCBmcm9tIENvbXBvbmVudExvYWRlci5zY2FuKClcbiAgKiBAcGFyYW0ge09iamVjdH0gbWVkaWF0b3IgLSBpbnN0YW5jZSBvZiBDb21wb25lbnRMb2FkZXIgZm9yIHB1Yi9zdWJcbiAgKi9cblxuXHRmdW5jdGlvbiBDb21wb25lbnQoKSB7XG5cdFx0X2NsYXNzQ2FsbENoZWNrKHRoaXMsIENvbXBvbmVudCk7XG5cblx0XHR0aGlzLmVsID0gYXJndW1lbnRzWzBdO1xuXHRcdGlmICh0eXBlb2YgalF1ZXJ5ICE9PSAndW5kZWZpbmVkJykgdGhpcy4kZWwgPSBqUXVlcnkodGhpcy5lbCk7XG5cdFx0dGhpcy5kYXRhID0gYXJndW1lbnRzWzFdO1xuXHRcdHRoaXMuX19tZWRpYXRvciA9IGFyZ3VtZW50c1syXTtcblx0fVxuXG5cdF9jcmVhdGVDbGFzcyhDb21wb25lbnQsIFt7XG5cdFx0a2V5OiAncHVibGlzaCcsXG5cblx0XHQvKipcbiAgICogUHVibGlzaCBhbiBldmVudCBmb3Igb3RoZXIgY29tcG9uZW50c1xuICAgKiBAcHJvdGVjdGVkXG4gICAqIEBwYXJhbSB7U3RyaW5nfSB0b3BpYyAtIEV2ZW50IG5hbWVcbiAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBPcHRpb25hbCBwYXJhbXMgdG8gcGFzcyB3aXRoIHRoZSBldmVudFxuICAgKi9cblx0XHR2YWx1ZTogZnVuY3Rpb24gcHVibGlzaCgpIHtcblx0XHRcdHZhciBfbWVkaWF0b3I7XG5cblx0XHRcdChfbWVkaWF0b3IgPSB0aGlzLl9fbWVkaWF0b3IpLnB1Ymxpc2guYXBwbHkoX21lZGlhdG9yLCBhcmd1bWVudHMpO1xuXHRcdH1cblx0fSwge1xuXHRcdGtleTogJ3N1YnNjcmliZScsXG5cblx0XHQvKipcbiAgICogU3Vic2NyaWJlIHRvIGFuIGV2ZW50IGZyb20gYW5vdGhlciBjb21wb25lbnRcbiAgICogQHByb3RlY3RlZFxuICAgKiBAcGFyYW0ge1N0cmluZ30gdG9waWMgLSBFdmVudCBuYW1lXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0gRnVuY3Rpb24gdG8gYmluZFxuICAgKi9cblx0XHR2YWx1ZTogZnVuY3Rpb24gc3Vic2NyaWJlKHRvcGljLCBjYWxsYmFjaykge1xuXHRcdFx0dGhpcy5fX21lZGlhdG9yLnN1YnNjcmliZSh0b3BpYywgY2FsbGJhY2ssIHRoaXMpO1xuXHRcdH1cblx0fSwge1xuXHRcdGtleTogJ3Vuc3Vic2NyaWJlJyxcblxuXHRcdC8qKlxuICAgKiBVbnN1YnNjcmliZSBmcm9tIGFuIGV2ZW50IGZyb20gYW5vdGhlciBjb21wb25lbnRcbiAgICogQHByb3RlY3RlZFxuICAgKiBAcGFyYW0ge1N0cmluZ30gdG9waWMgLSBFdmVudCBuYW1lXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0gRnVuY3Rpb24gdG8gdW5iaW5kXG4gICAqL1xuXHRcdHZhbHVlOiBmdW5jdGlvbiB1bnN1YnNjcmliZSh0b3BpYywgY2FsbGJhY2spIHtcblx0XHRcdHRoaXMuX19tZWRpYXRvci51bnN1YnNjcmliZSh0b3BpYywgY2FsbGJhY2ssIHRoaXMpO1xuXHRcdH1cblx0fSwge1xuXHRcdGtleTogJ3NjYW4nLFxuXG5cdFx0LyoqXG4gICAqIFV0aWxpdHkgbWV0aG9kIGZvciB0cmlnZ2VyaW5nIHRoZSBDb21wb25lbnRMb2FkZXIgdG8gc2NhbiB0aGUgbWFya3VwIGZvciBuZXcgY29tcG9uZW50c1xuICAgKiBAcHJvdGVjdGVkXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gT3B0aW9uYWwgZGF0YSB0byBwYXNzIHRvIHRoZSBjb25zdHJ1Y3RvciBvZiBhbnkgQ29tcG9uZW50IGluaXRpYWxpemVkIGJ5IHRoaXMgc2NhblxuICAgKi9cblx0XHR2YWx1ZTogZnVuY3Rpb24gc2NhbihkYXRhKSB7XG5cdFx0XHR0aGlzLl9fbWVkaWF0b3Iuc2NhbihkYXRhKTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6ICdkZWZlcicsXG5cblx0XHQvKipcbiAgICogVXRpbGl0eSBtZXRob2QgZm9yIGRlZmVyaW5nIGEgZnVuY3Rpb24gY2FsbFxuICAgKiBAcHJvdGVjdGVkXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0gRnVuY3Rpb24gdG8gY2FsbFxuICAgKiBAcGFyYW0ge051bWJlcn0gbXMgLSBPcHRpb25hbCBtcyB0byBkZWxheSwgZGVmYXVsdHMgdG8gMTdtcyAoanVzdCBvdmVyIDEgZnJhbWUgYXQgNjBmcHMpXG4gICAqL1xuXHRcdHZhbHVlOiBmdW5jdGlvbiBkZWZlcihjYWxsYmFjaykge1xuXHRcdFx0dmFyIG1zID0gYXJndW1lbnRzWzFdID09PSB1bmRlZmluZWQgPyAxNyA6IGFyZ3VtZW50c1sxXTtcblxuXHRcdFx0c2V0VGltZW91dChjYWxsYmFjaywgbXMpO1xuXHRcdH1cblx0fSwge1xuXHRcdGtleTogJ2Rlc3Ryb3knLFxuXG5cdFx0LyoqXG4gICAqIENhbGxlZCBieSBDb21wb25lbnRMb2FkZXIgd2hlbiBjb21wb25lbnQgaXMgbm8gbG9uZ2VyIGZvdW5kIGluIHRoZSBtYXJrdXBcbiAgICogdXN1YWxseSBoYXBwZW5zIGFzIGEgcmVzdWx0IG9mIHJlcGxhY2luZyB0aGUgbWFya3VwIHVzaW5nIEFKQVhcbiAgICpcdFxuICAgKiBPdmVycmlkZSBpbiBzdWJjbGFzcyBhbmQgbWFrZSBzdXJlIHRvIGNsZWFuIHVwIGV2ZW50IGhhbmRsZXJzIGV0Y1xuICAgKlxuICAgKiBAcHJvdGVjdGVkXG4gICAqL1xuXHRcdHZhbHVlOiBmdW5jdGlvbiBkZXN0cm95KCkge31cblx0fV0pO1xuXG5cdHJldHVybiBDb21wb25lbnQ7XG59KSgpO1xuXG4vLyBFeHBvcnQgQU1ELCBDb21tb25KUy9FUzYgbW9kdWxlIG9yIGFzc3VtZSBnbG9iYWwgbmFtZXNwYWNlXG5pZiAodHlwZW9mIGRlZmluZSAhPT0gJ3VuZGVmaW5lZCcgJiYgZGVmaW5lLmFtZCkge1xuXHRkZWZpbmUoW10sIENvbXBvbmVudCk7XG59IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG5cdG1vZHVsZS5leHBvcnRzID0gQ29tcG9uZW50O1xufSBlbHNlIHtcblx0d2luZG93LkNvbXBvbmVudCA9IENvbXBvbmVudDtcbn0iLCIoZnVuY3Rpb24oIGZhY3RvcnkgKSB7XG5cdGlmICh0eXBlb2YgZGVmaW5lICE9PSAndW5kZWZpbmVkJyAmJiBkZWZpbmUuYW1kKSB7XG5cdFx0ZGVmaW5lKFtdLCBmYWN0b3J5KTtcblx0fSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuXHRcdG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuXHR9IGVsc2Uge1xuXHRcdHdpbmRvdy5zY3JvbGxNb25pdG9yID0gZmFjdG9yeSgpO1xuXHR9XG59KShmdW5jdGlvbigpIHtcblxuXHR2YXIgc2Nyb2xsVG9wID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHdpbmRvdy5wYWdlWU9mZnNldCB8fFxuXHRcdFx0KGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCAmJiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wKSB8fFxuXHRcdFx0ZG9jdW1lbnQuYm9keS5zY3JvbGxUb3A7XG5cdH07XG5cblx0dmFyIGV4cG9ydHMgPSB7fTtcblxuXHR2YXIgd2F0Y2hlcnMgPSBbXTtcblxuXHR2YXIgVklTSUJJTElUWUNIQU5HRSA9ICd2aXNpYmlsaXR5Q2hhbmdlJztcblx0dmFyIEVOVEVSVklFV1BPUlQgPSAnZW50ZXJWaWV3cG9ydCc7XG5cdHZhciBGVUxMWUVOVEVSVklFV1BPUlQgPSAnZnVsbHlFbnRlclZpZXdwb3J0Jztcblx0dmFyIEVYSVRWSUVXUE9SVCA9ICdleGl0Vmlld3BvcnQnO1xuXHR2YXIgUEFSVElBTExZRVhJVFZJRVdQT1JUID0gJ3BhcnRpYWxseUV4aXRWaWV3cG9ydCc7XG5cdHZhciBMT0NBVElPTkNIQU5HRSA9ICdsb2NhdGlvbkNoYW5nZSc7XG5cdHZhciBTVEFURUNIQU5HRSA9ICdzdGF0ZUNoYW5nZSc7XG5cblx0dmFyIGV2ZW50VHlwZXMgPSBbXG5cdFx0VklTSUJJTElUWUNIQU5HRSxcblx0XHRFTlRFUlZJRVdQT1JULFxuXHRcdEZVTExZRU5URVJWSUVXUE9SVCxcblx0XHRFWElUVklFV1BPUlQsXG5cdFx0UEFSVElBTExZRVhJVFZJRVdQT1JULFxuXHRcdExPQ0FUSU9OQ0hBTkdFLFxuXHRcdFNUQVRFQ0hBTkdFXG5cdF07XG5cblx0dmFyIGRlZmF1bHRPZmZzZXRzID0ge3RvcDogMCwgYm90dG9tOiAwfTtcblxuXHR2YXIgZ2V0Vmlld3BvcnRIZWlnaHQgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gd2luZG93LmlubmVySGVpZ2h0IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQ7XG5cdH07XG5cblx0dmFyIGdldERvY3VtZW50SGVpZ2h0ID0gZnVuY3Rpb24oKSB7XG5cdFx0Ly8galF1ZXJ5IGFwcHJvYWNoXG5cdFx0Ly8gd2hpY2hldmVyIGlzIGdyZWF0ZXN0XG5cdFx0cmV0dXJuIE1hdGgubWF4KFxuXHRcdFx0ZG9jdW1lbnQuYm9keS5zY3JvbGxIZWlnaHQsIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxIZWlnaHQsXG5cdFx0XHRkb2N1bWVudC5ib2R5Lm9mZnNldEhlaWdodCwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50Lm9mZnNldEhlaWdodCxcblx0XHRcdGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHRcblx0XHQpO1xuXHR9O1xuXG5cdGV4cG9ydHMudmlld3BvcnRUb3AgPSBudWxsO1xuXHRleHBvcnRzLnZpZXdwb3J0Qm90dG9tID0gbnVsbDtcblx0ZXhwb3J0cy5kb2N1bWVudEhlaWdodCA9IG51bGw7XG5cdGV4cG9ydHMudmlld3BvcnRIZWlnaHQgPSBnZXRWaWV3cG9ydEhlaWdodCgpO1xuXG5cdHZhciBwcmV2aW91c0RvY3VtZW50SGVpZ2h0O1xuXHR2YXIgbGF0ZXN0RXZlbnQ7XG5cblx0dmFyIGNhbGN1bGF0ZVZpZXdwb3J0STtcblx0ZnVuY3Rpb24gY2FsY3VsYXRlVmlld3BvcnQoKSB7XG5cdFx0ZXhwb3J0cy52aWV3cG9ydFRvcCA9IHNjcm9sbFRvcCgpO1xuXHRcdGV4cG9ydHMudmlld3BvcnRCb3R0b20gPSBleHBvcnRzLnZpZXdwb3J0VG9wICsgZXhwb3J0cy52aWV3cG9ydEhlaWdodDtcblx0XHRleHBvcnRzLmRvY3VtZW50SGVpZ2h0ID0gZ2V0RG9jdW1lbnRIZWlnaHQoKTtcblx0XHRpZiAoZXhwb3J0cy5kb2N1bWVudEhlaWdodCAhPT0gcHJldmlvdXNEb2N1bWVudEhlaWdodCkge1xuXHRcdFx0Y2FsY3VsYXRlVmlld3BvcnRJID0gd2F0Y2hlcnMubGVuZ3RoO1xuXHRcdFx0d2hpbGUoIGNhbGN1bGF0ZVZpZXdwb3J0SS0tICkge1xuXHRcdFx0XHR3YXRjaGVyc1tjYWxjdWxhdGVWaWV3cG9ydEldLnJlY2FsY3VsYXRlTG9jYXRpb24oKTtcblx0XHRcdH1cblx0XHRcdHByZXZpb3VzRG9jdW1lbnRIZWlnaHQgPSBleHBvcnRzLmRvY3VtZW50SGVpZ2h0O1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIHJlY2FsY3VsYXRlV2F0Y2hMb2NhdGlvbnNBbmRUcmlnZ2VyKCkge1xuXHRcdGV4cG9ydHMudmlld3BvcnRIZWlnaHQgPSBnZXRWaWV3cG9ydEhlaWdodCgpO1xuXHRcdGNhbGN1bGF0ZVZpZXdwb3J0KCk7XG5cdFx0dXBkYXRlQW5kVHJpZ2dlcldhdGNoZXJzKCk7XG5cdH1cblxuXHR2YXIgcmVjYWxjdWxhdGVBbmRUcmlnZ2VyVGltZXI7XG5cdGZ1bmN0aW9uIGRlYm91bmNlZFJlY2FsY3VhdGVBbmRUcmlnZ2VyKCkge1xuXHRcdGNsZWFyVGltZW91dChyZWNhbGN1bGF0ZUFuZFRyaWdnZXJUaW1lcik7XG5cdFx0cmVjYWxjdWxhdGVBbmRUcmlnZ2VyVGltZXIgPSBzZXRUaW1lb3V0KCByZWNhbGN1bGF0ZVdhdGNoTG9jYXRpb25zQW5kVHJpZ2dlciwgMTAwICk7XG5cdH1cblxuXHR2YXIgdXBkYXRlQW5kVHJpZ2dlcldhdGNoZXJzSTtcblx0ZnVuY3Rpb24gdXBkYXRlQW5kVHJpZ2dlcldhdGNoZXJzKCkge1xuXHRcdC8vIHVwZGF0ZSBhbGwgd2F0Y2hlcnMgdGhlbiB0cmlnZ2VyIHRoZSBldmVudHMgc28gb25lIGNhbiByZWx5IG9uIGFub3RoZXIgYmVpbmcgdXAgdG8gZGF0ZS5cblx0XHR1cGRhdGVBbmRUcmlnZ2VyV2F0Y2hlcnNJID0gd2F0Y2hlcnMubGVuZ3RoO1xuXHRcdHdoaWxlKCB1cGRhdGVBbmRUcmlnZ2VyV2F0Y2hlcnNJLS0gKSB7XG5cdFx0XHR3YXRjaGVyc1t1cGRhdGVBbmRUcmlnZ2VyV2F0Y2hlcnNJXS51cGRhdGUoKTtcblx0XHR9XG5cblx0XHR1cGRhdGVBbmRUcmlnZ2VyV2F0Y2hlcnNJID0gd2F0Y2hlcnMubGVuZ3RoO1xuXHRcdHdoaWxlKCB1cGRhdGVBbmRUcmlnZ2VyV2F0Y2hlcnNJLS0gKSB7XG5cdFx0XHR3YXRjaGVyc1t1cGRhdGVBbmRUcmlnZ2VyV2F0Y2hlcnNJXS50cmlnZ2VyQ2FsbGJhY2tzKCk7XG5cdFx0fVxuXG5cdH1cblxuXHRmdW5jdGlvbiBFbGVtZW50V2F0Y2hlciggd2F0Y2hJdGVtLCBvZmZzZXRzICkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblxuXHRcdHRoaXMud2F0Y2hJdGVtID0gd2F0Y2hJdGVtO1xuXG5cdFx0aWYgKCFvZmZzZXRzKSB7XG5cdFx0XHR0aGlzLm9mZnNldHMgPSBkZWZhdWx0T2Zmc2V0cztcblx0XHR9IGVsc2UgaWYgKG9mZnNldHMgPT09ICtvZmZzZXRzKSB7XG5cdFx0XHR0aGlzLm9mZnNldHMgPSB7dG9wOiBvZmZzZXRzLCBib3R0b206IG9mZnNldHN9O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLm9mZnNldHMgPSB7XG5cdFx0XHRcdHRvcDogb2Zmc2V0cy50b3AgfHwgZGVmYXVsdE9mZnNldHMudG9wLFxuXHRcdFx0XHRib3R0b206IG9mZnNldHMuYm90dG9tIHx8IGRlZmF1bHRPZmZzZXRzLmJvdHRvbVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHR0aGlzLmNhbGxiYWNrcyA9IHt9OyAvLyB7Y2FsbGJhY2s6IGZ1bmN0aW9uLCBpc09uZTogdHJ1ZSB9XG5cblx0XHRmb3IgKHZhciBpID0gMCwgaiA9IGV2ZW50VHlwZXMubGVuZ3RoOyBpIDwgajsgaSsrKSB7XG5cdFx0XHRzZWxmLmNhbGxiYWNrc1tldmVudFR5cGVzW2ldXSA9IFtdO1xuXHRcdH1cblxuXHRcdHRoaXMubG9ja2VkID0gZmFsc2U7XG5cblx0XHR2YXIgd2FzSW5WaWV3cG9ydDtcblx0XHR2YXIgd2FzRnVsbHlJblZpZXdwb3J0O1xuXHRcdHZhciB3YXNBYm92ZVZpZXdwb3J0O1xuXHRcdHZhciB3YXNCZWxvd1ZpZXdwb3J0O1xuXG5cdFx0dmFyIGxpc3RlbmVyVG9UcmlnZ2VyTGlzdEk7XG5cdFx0dmFyIGxpc3RlbmVyO1xuXHRcdGZ1bmN0aW9uIHRyaWdnZXJDYWxsYmFja0FycmF5KCBsaXN0ZW5lcnMgKSB7XG5cdFx0XHRpZiAobGlzdGVuZXJzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHRsaXN0ZW5lclRvVHJpZ2dlckxpc3RJID0gbGlzdGVuZXJzLmxlbmd0aDtcblx0XHRcdHdoaWxlKCBsaXN0ZW5lclRvVHJpZ2dlckxpc3RJLS0gKSB7XG5cdFx0XHRcdGxpc3RlbmVyID0gbGlzdGVuZXJzW2xpc3RlbmVyVG9UcmlnZ2VyTGlzdEldO1xuXHRcdFx0XHRsaXN0ZW5lci5jYWxsYmFjay5jYWxsKCBzZWxmLCBsYXRlc3RFdmVudCApO1xuXHRcdFx0XHRpZiAobGlzdGVuZXIuaXNPbmUpIHtcblx0XHRcdFx0XHRsaXN0ZW5lcnMuc3BsaWNlKGxpc3RlbmVyVG9UcmlnZ2VyTGlzdEksIDEpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHRoaXMudHJpZ2dlckNhbGxiYWNrcyA9IGZ1bmN0aW9uIHRyaWdnZXJDYWxsYmFja3MoKSB7XG5cblx0XHRcdGlmICh0aGlzLmlzSW5WaWV3cG9ydCAmJiAhd2FzSW5WaWV3cG9ydCkge1xuXHRcdFx0XHR0cmlnZ2VyQ2FsbGJhY2tBcnJheSggdGhpcy5jYWxsYmFja3NbRU5URVJWSUVXUE9SVF0gKTtcblx0XHRcdH1cblx0XHRcdGlmICh0aGlzLmlzRnVsbHlJblZpZXdwb3J0ICYmICF3YXNGdWxseUluVmlld3BvcnQpIHtcblx0XHRcdFx0dHJpZ2dlckNhbGxiYWNrQXJyYXkoIHRoaXMuY2FsbGJhY2tzW0ZVTExZRU5URVJWSUVXUE9SVF0gKTtcblx0XHRcdH1cblxuXG5cdFx0XHRpZiAodGhpcy5pc0Fib3ZlVmlld3BvcnQgIT09IHdhc0Fib3ZlVmlld3BvcnQgJiZcblx0XHRcdFx0dGhpcy5pc0JlbG93Vmlld3BvcnQgIT09IHdhc0JlbG93Vmlld3BvcnQpIHtcblxuXHRcdFx0XHR0cmlnZ2VyQ2FsbGJhY2tBcnJheSggdGhpcy5jYWxsYmFja3NbVklTSUJJTElUWUNIQU5HRV0gKTtcblxuXHRcdFx0XHQvLyBpZiB5b3Ugc2tpcCBjb21wbGV0ZWx5IHBhc3QgdGhpcyBlbGVtZW50XG5cdFx0XHRcdGlmICghd2FzRnVsbHlJblZpZXdwb3J0ICYmICF0aGlzLmlzRnVsbHlJblZpZXdwb3J0KSB7XG5cdFx0XHRcdFx0dHJpZ2dlckNhbGxiYWNrQXJyYXkoIHRoaXMuY2FsbGJhY2tzW0ZVTExZRU5URVJWSUVXUE9SVF0gKTtcblx0XHRcdFx0XHR0cmlnZ2VyQ2FsbGJhY2tBcnJheSggdGhpcy5jYWxsYmFja3NbUEFSVElBTExZRVhJVFZJRVdQT1JUXSApO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICghd2FzSW5WaWV3cG9ydCAmJiAhdGhpcy5pc0luVmlld3BvcnQpIHtcblx0XHRcdFx0XHR0cmlnZ2VyQ2FsbGJhY2tBcnJheSggdGhpcy5jYWxsYmFja3NbRU5URVJWSUVXUE9SVF0gKTtcblx0XHRcdFx0XHR0cmlnZ2VyQ2FsbGJhY2tBcnJheSggdGhpcy5jYWxsYmFja3NbRVhJVFZJRVdQT1JUXSApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmICghdGhpcy5pc0Z1bGx5SW5WaWV3cG9ydCAmJiB3YXNGdWxseUluVmlld3BvcnQpIHtcblx0XHRcdFx0dHJpZ2dlckNhbGxiYWNrQXJyYXkoIHRoaXMuY2FsbGJhY2tzW1BBUlRJQUxMWUVYSVRWSUVXUE9SVF0gKTtcblx0XHRcdH1cblx0XHRcdGlmICghdGhpcy5pc0luVmlld3BvcnQgJiYgd2FzSW5WaWV3cG9ydCkge1xuXHRcdFx0XHR0cmlnZ2VyQ2FsbGJhY2tBcnJheSggdGhpcy5jYWxsYmFja3NbRVhJVFZJRVdQT1JUXSApO1xuXHRcdFx0fVxuXHRcdFx0aWYgKHRoaXMuaXNJblZpZXdwb3J0ICE9PSB3YXNJblZpZXdwb3J0KSB7XG5cdFx0XHRcdHRyaWdnZXJDYWxsYmFja0FycmF5KCB0aGlzLmNhbGxiYWNrc1tWSVNJQklMSVRZQ0hBTkdFXSApO1xuXHRcdFx0fVxuXHRcdFx0c3dpdGNoKCB0cnVlICkge1xuXHRcdFx0XHRjYXNlIHdhc0luVmlld3BvcnQgIT09IHRoaXMuaXNJblZpZXdwb3J0OlxuXHRcdFx0XHRjYXNlIHdhc0Z1bGx5SW5WaWV3cG9ydCAhPT0gdGhpcy5pc0Z1bGx5SW5WaWV3cG9ydDpcblx0XHRcdFx0Y2FzZSB3YXNBYm92ZVZpZXdwb3J0ICE9PSB0aGlzLmlzQWJvdmVWaWV3cG9ydDpcblx0XHRcdFx0Y2FzZSB3YXNCZWxvd1ZpZXdwb3J0ICE9PSB0aGlzLmlzQmVsb3dWaWV3cG9ydDpcblx0XHRcdFx0XHR0cmlnZ2VyQ2FsbGJhY2tBcnJheSggdGhpcy5jYWxsYmFja3NbU1RBVEVDSEFOR0VdICk7XG5cdFx0XHR9XG5cblx0XHRcdHdhc0luVmlld3BvcnQgPSB0aGlzLmlzSW5WaWV3cG9ydDtcblx0XHRcdHdhc0Z1bGx5SW5WaWV3cG9ydCA9IHRoaXMuaXNGdWxseUluVmlld3BvcnQ7XG5cdFx0XHR3YXNBYm92ZVZpZXdwb3J0ID0gdGhpcy5pc0Fib3ZlVmlld3BvcnQ7XG5cdFx0XHR3YXNCZWxvd1ZpZXdwb3J0ID0gdGhpcy5pc0JlbG93Vmlld3BvcnQ7XG5cblx0XHR9O1xuXG5cdFx0dGhpcy5yZWNhbGN1bGF0ZUxvY2F0aW9uID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAodGhpcy5sb2NrZWQpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0dmFyIHByZXZpb3VzVG9wID0gdGhpcy50b3A7XG5cdFx0XHR2YXIgcHJldmlvdXNCb3R0b20gPSB0aGlzLmJvdHRvbTtcblx0XHRcdGlmICh0aGlzLndhdGNoSXRlbS5ub2RlTmFtZSkgeyAvLyBhIGRvbSBlbGVtZW50XG5cdFx0XHRcdHZhciBjYWNoZWREaXNwbGF5ID0gdGhpcy53YXRjaEl0ZW0uc3R5bGUuZGlzcGxheTtcblx0XHRcdFx0aWYgKGNhY2hlZERpc3BsYXkgPT09ICdub25lJykge1xuXHRcdFx0XHRcdHRoaXMud2F0Y2hJdGVtLnN0eWxlLmRpc3BsYXkgPSAnJztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHZhciBib3VuZGluZ1JlY3QgPSB0aGlzLndhdGNoSXRlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblx0XHRcdFx0dGhpcy50b3AgPSBib3VuZGluZ1JlY3QudG9wICsgZXhwb3J0cy52aWV3cG9ydFRvcDtcblx0XHRcdFx0dGhpcy5ib3R0b20gPSBib3VuZGluZ1JlY3QuYm90dG9tICsgZXhwb3J0cy52aWV3cG9ydFRvcDtcblxuXHRcdFx0XHRpZiAoY2FjaGVkRGlzcGxheSA9PT0gJ25vbmUnKSB7XG5cdFx0XHRcdFx0dGhpcy53YXRjaEl0ZW0uc3R5bGUuZGlzcGxheSA9IGNhY2hlZERpc3BsYXk7XG5cdFx0XHRcdH1cblxuXHRcdFx0fSBlbHNlIGlmICh0aGlzLndhdGNoSXRlbSA9PT0gK3RoaXMud2F0Y2hJdGVtKSB7IC8vIG51bWJlclxuXHRcdFx0XHRpZiAodGhpcy53YXRjaEl0ZW0gPiAwKSB7XG5cdFx0XHRcdFx0dGhpcy50b3AgPSB0aGlzLmJvdHRvbSA9IHRoaXMud2F0Y2hJdGVtO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRoaXMudG9wID0gdGhpcy5ib3R0b20gPSBleHBvcnRzLmRvY3VtZW50SGVpZ2h0IC0gdGhpcy53YXRjaEl0ZW07XG5cdFx0XHRcdH1cblxuXHRcdFx0fSBlbHNlIHsgLy8gYW4gb2JqZWN0IHdpdGggYSB0b3AgYW5kIGJvdHRvbSBwcm9wZXJ0eVxuXHRcdFx0XHR0aGlzLnRvcCA9IHRoaXMud2F0Y2hJdGVtLnRvcDtcblx0XHRcdFx0dGhpcy5ib3R0b20gPSB0aGlzLndhdGNoSXRlbS5ib3R0b207XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMudG9wIC09IHRoaXMub2Zmc2V0cy50b3A7XG5cdFx0XHR0aGlzLmJvdHRvbSArPSB0aGlzLm9mZnNldHMuYm90dG9tO1xuXHRcdFx0dGhpcy5oZWlnaHQgPSB0aGlzLmJvdHRvbSAtIHRoaXMudG9wO1xuXG5cdFx0XHRpZiAoIChwcmV2aW91c1RvcCAhPT0gdW5kZWZpbmVkIHx8IHByZXZpb3VzQm90dG9tICE9PSB1bmRlZmluZWQpICYmICh0aGlzLnRvcCAhPT0gcHJldmlvdXNUb3AgfHwgdGhpcy5ib3R0b20gIT09IHByZXZpb3VzQm90dG9tKSApIHtcblx0XHRcdFx0dHJpZ2dlckNhbGxiYWNrQXJyYXkoIHRoaXMuY2FsbGJhY2tzW0xPQ0FUSU9OQ0hBTkdFXSApO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHR0aGlzLnJlY2FsY3VsYXRlTG9jYXRpb24oKTtcblx0XHR0aGlzLnVwZGF0ZSgpO1xuXG5cdFx0d2FzSW5WaWV3cG9ydCA9IHRoaXMuaXNJblZpZXdwb3J0O1xuXHRcdHdhc0Z1bGx5SW5WaWV3cG9ydCA9IHRoaXMuaXNGdWxseUluVmlld3BvcnQ7XG5cdFx0d2FzQWJvdmVWaWV3cG9ydCA9IHRoaXMuaXNBYm92ZVZpZXdwb3J0O1xuXHRcdHdhc0JlbG93Vmlld3BvcnQgPSB0aGlzLmlzQmVsb3dWaWV3cG9ydDtcblx0fVxuXG5cdEVsZW1lbnRXYXRjaGVyLnByb3RvdHlwZSA9IHtcblx0XHRvbjogZnVuY3Rpb24oIGV2ZW50LCBjYWxsYmFjaywgaXNPbmUgKSB7XG5cblx0XHRcdC8vIHRyaWdnZXIgdGhlIGV2ZW50IGlmIGl0IGFwcGxpZXMgdG8gdGhlIGVsZW1lbnQgcmlnaHQgbm93LlxuXHRcdFx0c3dpdGNoKCB0cnVlICkge1xuXHRcdFx0XHRjYXNlIGV2ZW50ID09PSBWSVNJQklMSVRZQ0hBTkdFICYmICF0aGlzLmlzSW5WaWV3cG9ydCAmJiB0aGlzLmlzQWJvdmVWaWV3cG9ydDpcblx0XHRcdFx0Y2FzZSBldmVudCA9PT0gRU5URVJWSUVXUE9SVCAmJiB0aGlzLmlzSW5WaWV3cG9ydDpcblx0XHRcdFx0Y2FzZSBldmVudCA9PT0gRlVMTFlFTlRFUlZJRVdQT1JUICYmIHRoaXMuaXNGdWxseUluVmlld3BvcnQ6XG5cdFx0XHRcdGNhc2UgZXZlbnQgPT09IEVYSVRWSUVXUE9SVCAmJiB0aGlzLmlzQWJvdmVWaWV3cG9ydCAmJiAhdGhpcy5pc0luVmlld3BvcnQ6XG5cdFx0XHRcdGNhc2UgZXZlbnQgPT09IFBBUlRJQUxMWUVYSVRWSUVXUE9SVCAmJiB0aGlzLmlzQWJvdmVWaWV3cG9ydDpcblx0XHRcdFx0XHRjYWxsYmFjay5jYWxsKCB0aGlzLCBsYXRlc3RFdmVudCApO1xuXHRcdFx0XHRcdGlmIChpc09uZSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0aWYgKHRoaXMuY2FsbGJhY2tzW2V2ZW50XSkge1xuXHRcdFx0XHR0aGlzLmNhbGxiYWNrc1tldmVudF0ucHVzaCh7Y2FsbGJhY2s6IGNhbGxiYWNrLCBpc09uZTogaXNPbmV8fGZhbHNlfSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ1RyaWVkIHRvIGFkZCBhIHNjcm9sbCBtb25pdG9yIGxpc3RlbmVyIG9mIHR5cGUgJytldmVudCsnLiBZb3VyIG9wdGlvbnMgYXJlOiAnK2V2ZW50VHlwZXMuam9pbignLCAnKSk7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRvZmY6IGZ1bmN0aW9uKCBldmVudCwgY2FsbGJhY2sgKSB7XG5cdFx0XHRpZiAodGhpcy5jYWxsYmFja3NbZXZlbnRdKSB7XG5cdFx0XHRcdGZvciAodmFyIGkgPSAwLCBpdGVtOyBpdGVtID0gdGhpcy5jYWxsYmFja3NbZXZlbnRdW2ldOyBpKyspIHtcblx0XHRcdFx0XHRpZiAoaXRlbS5jYWxsYmFjayA9PT0gY2FsbGJhY2spIHtcblx0XHRcdFx0XHRcdHRoaXMuY2FsbGJhY2tzW2V2ZW50XS5zcGxpY2UoaSwgMSk7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcignVHJpZWQgdG8gcmVtb3ZlIGEgc2Nyb2xsIG1vbml0b3IgbGlzdGVuZXIgb2YgdHlwZSAnK2V2ZW50KycuIFlvdXIgb3B0aW9ucyBhcmU6ICcrZXZlbnRUeXBlcy5qb2luKCcsICcpKTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdG9uZTogZnVuY3Rpb24oIGV2ZW50LCBjYWxsYmFjayApIHtcblx0XHRcdHRoaXMub24oIGV2ZW50LCBjYWxsYmFjaywgdHJ1ZSk7XG5cdFx0fSxcblx0XHRyZWNhbGN1bGF0ZVNpemU6IGZ1bmN0aW9uKCkge1xuXHRcdFx0dGhpcy5oZWlnaHQgPSB0aGlzLndhdGNoSXRlbS5vZmZzZXRIZWlnaHQgKyB0aGlzLm9mZnNldHMudG9wICsgdGhpcy5vZmZzZXRzLmJvdHRvbTtcblx0XHRcdHRoaXMuYm90dG9tID0gdGhpcy50b3AgKyB0aGlzLmhlaWdodDtcblx0XHR9LFxuXHRcdHVwZGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0XHR0aGlzLmlzQWJvdmVWaWV3cG9ydCA9IHRoaXMudG9wIDwgZXhwb3J0cy52aWV3cG9ydFRvcDtcblx0XHRcdHRoaXMuaXNCZWxvd1ZpZXdwb3J0ID0gdGhpcy5ib3R0b20gPiBleHBvcnRzLnZpZXdwb3J0Qm90dG9tO1xuXG5cdFx0XHR0aGlzLmlzSW5WaWV3cG9ydCA9ICh0aGlzLnRvcCA8PSBleHBvcnRzLnZpZXdwb3J0Qm90dG9tICYmIHRoaXMuYm90dG9tID49IGV4cG9ydHMudmlld3BvcnRUb3ApO1xuXHRcdFx0dGhpcy5pc0Z1bGx5SW5WaWV3cG9ydCA9ICh0aGlzLnRvcCA+PSBleHBvcnRzLnZpZXdwb3J0VG9wICYmIHRoaXMuYm90dG9tIDw9IGV4cG9ydHMudmlld3BvcnRCb3R0b20pIHx8XG5cdFx0XHRcdFx0XHRcdFx0ICh0aGlzLmlzQWJvdmVWaWV3cG9ydCAmJiB0aGlzLmlzQmVsb3dWaWV3cG9ydCk7XG5cblx0XHR9LFxuXHRcdGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGluZGV4ID0gd2F0Y2hlcnMuaW5kZXhPZih0aGlzKSxcblx0XHRcdFx0c2VsZiAgPSB0aGlzO1xuXHRcdFx0d2F0Y2hlcnMuc3BsaWNlKGluZGV4LCAxKTtcblx0XHRcdGZvciAodmFyIGkgPSAwLCBqID0gZXZlbnRUeXBlcy5sZW5ndGg7IGkgPCBqOyBpKyspIHtcblx0XHRcdFx0c2VsZi5jYWxsYmFja3NbZXZlbnRUeXBlc1tpXV0ubGVuZ3RoID0gMDtcblx0XHRcdH1cblx0XHR9LFxuXHRcdC8vIHByZXZlbnQgcmVjYWxjdWxhdGluZyB0aGUgZWxlbWVudCBsb2NhdGlvblxuXHRcdGxvY2s6IGZ1bmN0aW9uKCkge1xuXHRcdFx0dGhpcy5sb2NrZWQgPSB0cnVlO1xuXHRcdH0sXG5cdFx0dW5sb2NrOiBmdW5jdGlvbigpIHtcblx0XHRcdHRoaXMubG9ja2VkID0gZmFsc2U7XG5cdFx0fVxuXHR9O1xuXG5cdHZhciBldmVudEhhbmRsZXJGYWN0b3J5ID0gZnVuY3Rpb24gKHR5cGUpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24oIGNhbGxiYWNrLCBpc09uZSApIHtcblx0XHRcdHRoaXMub24uY2FsbCh0aGlzLCB0eXBlLCBjYWxsYmFjaywgaXNPbmUpO1xuXHRcdH07XG5cdH07XG5cblx0Zm9yICh2YXIgaSA9IDAsIGogPSBldmVudFR5cGVzLmxlbmd0aDsgaSA8IGo7IGkrKykge1xuXHRcdHZhciB0eXBlID0gIGV2ZW50VHlwZXNbaV07XG5cdFx0RWxlbWVudFdhdGNoZXIucHJvdG90eXBlW3R5cGVdID0gZXZlbnRIYW5kbGVyRmFjdG9yeSh0eXBlKTtcblx0fVxuXG5cdHRyeSB7XG5cdFx0Y2FsY3VsYXRlVmlld3BvcnQoKTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdHRyeSB7XG5cdFx0XHR3aW5kb3cuJChjYWxjdWxhdGVWaWV3cG9ydCk7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJZiB5b3UgbXVzdCBwdXQgc2Nyb2xsTW9uaXRvciBpbiB0aGUgPGhlYWQ+LCB5b3UgbXVzdCB1c2UgalF1ZXJ5LicpO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIHNjcm9sbE1vbml0b3JMaXN0ZW5lcihldmVudCkge1xuXHRcdGxhdGVzdEV2ZW50ID0gZXZlbnQ7XG5cdFx0Y2FsY3VsYXRlVmlld3BvcnQoKTtcblx0XHR1cGRhdGVBbmRUcmlnZ2VyV2F0Y2hlcnMoKTtcblx0fVxuXG5cdGlmICh3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcikge1xuXHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBzY3JvbGxNb25pdG9yTGlzdGVuZXIpO1xuXHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCBkZWJvdW5jZWRSZWNhbGN1YXRlQW5kVHJpZ2dlcik7XG5cdH0gZWxzZSB7XG5cdFx0Ly8gT2xkIElFIHN1cHBvcnRcblx0XHR3aW5kb3cuYXR0YWNoRXZlbnQoJ29uc2Nyb2xsJywgc2Nyb2xsTW9uaXRvckxpc3RlbmVyKTtcblx0XHR3aW5kb3cuYXR0YWNoRXZlbnQoJ29ucmVzaXplJywgZGVib3VuY2VkUmVjYWxjdWF0ZUFuZFRyaWdnZXIpO1xuXHR9XG5cblx0ZXhwb3J0cy5iZWdldCA9IGV4cG9ydHMuY3JlYXRlID0gZnVuY3Rpb24oIGVsZW1lbnQsIG9mZnNldHMgKSB7XG5cdFx0aWYgKHR5cGVvZiBlbGVtZW50ID09PSAnc3RyaW5nJykge1xuXHRcdFx0ZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZWxlbWVudCk7XG5cdFx0fSBlbHNlIGlmIChlbGVtZW50ICYmIGVsZW1lbnQubGVuZ3RoID4gMCkge1xuXHRcdFx0ZWxlbWVudCA9IGVsZW1lbnRbMF07XG5cdFx0fVxuXG5cdFx0dmFyIHdhdGNoZXIgPSBuZXcgRWxlbWVudFdhdGNoZXIoIGVsZW1lbnQsIG9mZnNldHMgKTtcblx0XHR3YXRjaGVycy5wdXNoKHdhdGNoZXIpO1xuXHRcdHdhdGNoZXIudXBkYXRlKCk7XG5cdFx0cmV0dXJuIHdhdGNoZXI7XG5cdH07XG5cblx0ZXhwb3J0cy51cGRhdGUgPSBmdW5jdGlvbigpIHtcblx0XHRsYXRlc3RFdmVudCA9IG51bGw7XG5cdFx0Y2FsY3VsYXRlVmlld3BvcnQoKTtcblx0XHR1cGRhdGVBbmRUcmlnZ2VyV2F0Y2hlcnMoKTtcblx0fTtcblx0ZXhwb3J0cy5yZWNhbGN1bGF0ZUxvY2F0aW9ucyA9IGZ1bmN0aW9uKCkge1xuXHRcdGV4cG9ydHMuZG9jdW1lbnRIZWlnaHQgPSAwO1xuXHRcdGV4cG9ydHMudXBkYXRlKCk7XG5cdH07XG5cblx0cmV0dXJuIGV4cG9ydHM7XG59KTtcbiIsImltcG9ydCBDb21wb25lbnQgZnJvbSAnY29tcG9uZW50LWxvYWRlci1qcy9kaXN0L2VzNS9jb21wb25lbnQnO1xuXG5jbGFzcyBEb2tpIGV4dGVuZHMgQ29tcG9uZW50IHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoLi4uYXJndW1lbnRzKTtcblx0XHRjb25zb2xlLmxvZygnbmV3IERPS0kgNDAnKTtcblx0fVxuXG5cdGRlc3Ryb3koKSB7XG5cdFx0c3VwZXIuZGVzdHJveSgpO1xuXHRcdGNvbnNvbGUubG9nKCdkZXN0cm95IERPS0knKTtcblx0fVxufVxuXG5leHBvcnQgZGVmYXVsdCBEb2tpOyIsImltcG9ydCBDb21wb25lbnQgZnJvbSAnY29tcG9uZW50LWxvYWRlci1qcy9kaXN0L2VzNS9jb21wb25lbnQnO1xuaW1wb3J0IGFuaW1hdGlvbkVuZEV2ZW50IGZyb20gJy4uL3V0aWxzL2FuaW1hdGlvbi1lbmQtZXZlbnQnO1xuaW1wb3J0IHNjcm9sbFN0YXRlIGZyb20gJy4uL3V0aWxzL3Njcm9sbC1zdGF0ZSc7XG5cbi8qKlxuXHRTdGlja3kgTmF2IGNvbXBvbmVudFxuXG5cdExpc3RlbnMgdG8gc2Nyb2xsIGV2ZW50cyBmcm9tIHV0aWxzLlNjcm9sbFN0YXRlXG5cblx0LSBBZGRzIENMQVNTX0xPQ0tFRCB3aGVuIHBhc3NpbmcgTE9DS19USFJFU0hPTERcblx0LSBBZGRzIENMQVNTX0JBQ0tHUk9VTkQgd2hlbiBwYXNzaW5nIF9nZXRCYWNrZ3JvdW5kVGhyZXNob2xkKClcblx0LSBBZGRzIENMQVNTX0hJRERFTiBpZiB2aXNpYmxlIGFuZCBzY3JvbGxpbmcgZG93biB3aXRoIGVub3VnaCBzcGVlZFxuXHQtIEFkZHMgQ0xBU1NfVklTSUJMRSBpZiBzY3JvbGxpbmcgdXAgYW5kIGhpZGRlblxuKi9cblxuXG5jb25zdCBDTEFTU19ISURERU4gPSAnU3RpY2t5TmF2LS1oaWRkZW4nO1xuY29uc3QgQ0xBU1NfVklTSUJMRSA9ICdTdGlja3lOYXYtLXZpc2libGUnO1xuY29uc3QgQ0xBU1NfTE9DS0VEID0gJ1N0aWNreU5hdi0tbG9ja2VkJztcbmNvbnN0IENMQVNTX0JBQ0tHUk9VTkQgPSAnU3RpY2t5TmF2LS1iYWNrZ3JvdW5kJztcblxuLy8gcHggZnJvbSB0b3Agb2YgZG9jdW1lbnQgd2hlcmUgJ2xvY2tlZCcgY2xhc3MgaXMgYWRkZWQgKGluY2x1c2l2ZSlcbmNvbnN0IExPQ0tfVEhSRVNIT0xEID0gMTAwO1xuXG5jb25zdCBCR19USFJFU0hPTEQgPSA1MDA7XG5cbi8vIFNwZWVkL0Rpc3RhbmNlIHJlcXVpcmVkIHRvIGNoYW5nZSBhcHBlYXJhbmNlIHBlciBzY3JvbGwgZnJhbWVcbmNvbnN0IE1JTl9TQ1JPTExfU1BFRUQgPSA1MDA7XG5jb25zdCBNSU5fU0NST0xMX0RJU1RBTkNFID0gMjA7XG5cblxuY2xhc3MgU3RpY2t5TmF2IGV4dGVuZHMgQ29tcG9uZW50IHtcblxuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlciguLi5hcmd1bWVudHMpO1xuXHRcdHRoaXMuJGRvY3VtZW50ID0gJChkb2N1bWVudCk7XG5cdFx0dGhpcy5pc0hpZGRlbiA9IGZhbHNlO1xuXHRcdHRoaXMuaXNMb2NrZWQgPSBmYWxzZTtcblx0XHR0aGlzLmhhc0JhY2tncm91bmQgPSBmYWxzZTtcblx0XHR0aGlzLmlzQnVzeUNoZWNraW5nID0gZmFsc2U7XG5cblx0XHR0aGlzLm9uU3RhdGVDaGFuZ2VkID0gdGhpcy5vblN0YXRlQ2hhbmdlZC5iaW5kKHRoaXMpO1xuXHRcdHRoaXMuY2hlY2tMb2NrVGhyZWFzaG9sZCA9IHRoaXMuY2hlY2tMb2NrVGhyZWFzaG9sZC5iaW5kKHRoaXMpO1xuXHRcdHRoaXMuY2hlY2tBcHBlYXJhbmNlID0gdGhpcy5jaGVja0FwcGVhcmFuY2UuYmluZCh0aGlzKTtcblxuXHRcdHRoaXMuaW5pdCgpO1xuXG5cdFx0dGhpcy5kZWZlcigoKSA9PiB7XG5cdFx0XHQvLyBwYXVzZSBhbmQgd2FpdCBmb3IgSGVybyBjb21wb25lbnQgdG8gYmUgaW5pdGlhbGl6ZWQgZmlyc3Rcblx0XHRcdHRoaXMuJGVsLmNzcygndmlzaWJpbGl0eScsICd2aXNpYmxlJyk7XG5cdFx0fSk7XG5cdH1cblxuXG5cdGluaXQoKSB7XG5cdFx0c2Nyb2xsU3RhdGUuc3Vic2NyaWJlKHNjcm9sbFN0YXRlLkVWRU5UX1NDUk9MTF9GUkFNRSwgdGhpcy5vblN0YXRlQ2hhbmdlZCk7XG5cdFx0Ly8gdGhpcy5zdWJzY3JpYmUoRW51bXMuQUNUSU9OX1NUSUNLWV9OQVZfU0hPV19CQUNLR1JPVU5ELCB0aGlzLmFkZEJhY2tncm91bmQpO1xuXHRcdC8vIHRoaXMuc3Vic2NyaWJlKEVudW1zLkFDVElPTl9TVElDS1lfTkFWX0hJREVfQkFDS0dST1VORCwgdGhpcy5yZW1vdmVCYWNrZ3JvdW5kKTtcblx0XHQvLyB0aGlzLm1vYmlsZUJyZWFrcG9pbnQgPSBCcmVha3BvaW50cy5vbih7XG5cdFx0Ly8gXHRuYW1lOiBcIkJSRUFLUE9JTlRfU01BTExcIlxuXHRcdC8vIH0pO1xuXHR9XG5cblxuXHRvblN0YXRlQ2hhbmdlZChzdGF0ZSkge1xuXHRcdGlmICghdGhpcy5pc0J1c3lDaGVja2luZykge1xuXHRcdFx0dGhpcy5pc0J1c3lDaGVja2luZyA9IHRydWU7XG5cdFx0XHR0aGlzLmNoZWNrTG9ja1RocmVhc2hvbGQoc3RhdGUpO1xuXHRcdFx0dGhpcy5jaGVja0JhY2tncm91bmRUaHJlYXNob2xkKHN0YXRlKTtcblx0XHRcdHRoaXMuY2hlY2tBcHBlYXJhbmNlKHN0YXRlKTtcblx0XHRcdHRoaXMuaXNCdXN5Q2hlY2tpbmcgPSBmYWxzZTtcblx0XHR9XG5cdH1cblxuXG5cdF9nZXRCYWNrZ3JvdW5kVGhyZXNob2xkKCkge1xuXHRcdC8vIGlmICh0aGlzLm1vYmlsZUJyZWFrcG9pbnQuaXNNYXRjaGVkKSB7XG5cdFx0Ly8gXHRyZXR1cm4gMTsgLy9zd2l0Y2ggYmcgYXMgc29vbiBhcyB3ZSBzdGFydCBzY3JvbGxpbmcgKHNjcm9sbD0wIG5lZWRzIHRyYW5zcGFyZW5jeSBvbiBtYXApXG5cdFx0Ly8gfVxuXHRcdHJldHVybiBMT0NLX1RIUkVTSE9MRCArIDE7IC8vIHdhaXQgdW50aWwgcGFzc2luZyB0aHJlYXNob2xkXG5cdH1cblxuXG5cdHNob3coKSB7XG5cdFx0aWYgKHRoaXMuaXNIaWRkZW4pIHtcblx0XHRcdGNvbnNvbGUubG9nKCdzaG93IScpO1xuXHRcdFx0dGhpcy4kZWwuYWRkQ2xhc3MoQ0xBU1NfVklTSUJMRSkucmVtb3ZlQ2xhc3MoQ0xBU1NfSElEREVOKTtcblx0XHRcdHRoaXMuaXNIaWRkZW4gPSBmYWxzZTtcblx0XHRcdHRoaXMuJGVsLm9uZShhbmltYXRpb25FbmRFdmVudCwgKCkgPT4ge1xuXHRcdFx0XHR0aGlzLiRlbC5yZW1vdmVDbGFzcyhDTEFTU19WSVNJQkxFKTtcblx0XHRcdH0pO1xuXHRcdH1cblx0fVxuXG5cblx0aGlkZSgpIHtcblx0XHRpZiAoIXRoaXMuaXNIaWRkZW4pIHtcblx0XHRcdGNvbnNvbGUubG9nKCdoaWRlIScpO1xuXHRcdFx0dGhpcy4kZWwuYWRkQ2xhc3MoQ0xBU1NfSElEREVOKS5yZW1vdmVDbGFzcyhDTEFTU19WSVNJQkxFKTtcblx0XHRcdHRoaXMuaXNIaWRkZW4gPSB0cnVlO1xuXHRcdH1cblx0fVxuXG5cblx0bG9jaygpIHtcblx0XHRpZiAoIXRoaXMuaXNMb2NrZWQpIHtcblx0XHRcdHRoaXMuJGVsLmFkZENsYXNzKENMQVNTX0xPQ0tFRClcblx0XHRcdHRoaXMuaXNMb2NrZWQgPSB0cnVlO1xuXHRcdH1cblx0fVxuXG5cblx0dW5sb2NrKCkge1xuXHRcdGlmICh0aGlzLmlzTG9ja2VkKSB7XG5cdFx0XHR0aGlzLiRlbC5yZW1vdmVDbGFzcyhDTEFTU19MT0NLRUQpXG5cdFx0XHR0aGlzLmlzTG9ja2VkID0gZmFsc2U7XG5cdFx0fVxuXHR9XG5cblxuXHRhZGRCYWNrZ3JvdW5kKCkge1xuXHRcdGlmICghdGhpcy5oYXNCYWNrZ3JvdW5kKSB7XG5cdFx0XHR0aGlzLiRlbC5hZGRDbGFzcyhDTEFTU19CQUNLR1JPVU5EKVxuXHRcdFx0dGhpcy5oYXNCYWNrZ3JvdW5kID0gdHJ1ZTtcblx0XHR9XG5cdH1cblxuXG5cdHJlbW92ZUJhY2tncm91bmQoKSB7XG5cdFx0aWYgKHRoaXMuaGFzQmFja2dyb3VuZCkge1xuXHRcdFx0dGhpcy4kZWwucmVtb3ZlQ2xhc3MoQ0xBU1NfQkFDS0dST1VORClcblx0XHRcdHRoaXMuaGFzQmFja2dyb3VuZCA9IGZhbHNlO1xuXHRcdH1cblx0fVxuXG5cblx0aXNBYm92ZVZpc2libGVUaHJlc2hvbGQoc3RhdGUpIHtcblx0XHRyZXR1cm4gc3RhdGUudmlld3BvcnRUb3AgPD0gTE9DS19USFJFU0hPTEQ7XG5cdH1cblxuXG5cdGNoZWNrTG9ja1RocmVhc2hvbGQoc3RhdGUpIHtcblx0XHRpZiAoc3RhdGUudmlld3BvcnRUb3AgPj0gTE9DS19USFJFU0hPTEQpIHtcblx0XHRcdHRoaXMubG9jaygpO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHRoaXMudW5sb2NrKCk7XG5cdFx0fVxuXHR9XG5cblxuXHRjaGVja0JhY2tncm91bmRUaHJlYXNob2xkKHN0YXRlKSB7XG5cdFx0aWYgKHN0YXRlLnZpZXdwb3J0VG9wID49IHRoaXMuX2dldEJhY2tncm91bmRUaHJlc2hvbGQoKSkge1xuXHRcdFx0dGhpcy5hZGRCYWNrZ3JvdW5kKCk7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0dGhpcy5yZW1vdmVCYWNrZ3JvdW5kKCk7XG5cdFx0fVxuXHR9XG5cblxuXHRjaGVja0FwcGVhcmFuY2Uoc3RhdGUpIHtcblx0XHQvLyBzY3JvbGxlZCB0byB0aGUgdmVyeSB0b3Agb3IgYm90dG9tOyBlbGVtZW50IHNsaWRlcyBpblxuXHRcdGlmICh0aGlzLmlzQWJvdmVWaXNpYmxlVGhyZXNob2xkKHN0YXRlKSB8fCBzdGF0ZS5pc1Njcm9sbGVkVG9Cb3R0b20pIHtcblx0XHRcdHRoaXMuc2hvdygpO1xuXHRcdH1cblx0XHRlbHNlIGlmIChzdGF0ZS5pc1Njcm9sbGluZ0Rvd24pIHtcblx0XHRcdHRoaXMuaGlkZSgpO1xuXHRcdH1cblx0XHQvLyBlbHNlIGlmIHNjcm9sbGluZyB1cCB3aXRoIGVub3VnaCBzcGVlZFxuXHRcdC8vICogZmFzdCBjb21wdXRlciAtPiBtYW55IGV2ZW50cyAtPiBzaG9ydCBkaXN0YW5jZSBiZXR3ZWVuIGV2ZW50cyA9IGJldHRlciB0byBjaGVjayBzcGVlZFxuXHRcdC8vICogc2xvdyBjb21wdXRlciAtPiBmZXcgZXZlbnRzIC0+IGxlc3MgdmlzaWJsZSBzcGVlZCA9IGJldHRlciB0byBjaGVjayBkaXN0YW5jZVxuXHRcdGVsc2UgaWYgKHN0YXRlLnNjcm9sbFNwZWVkID4gTUlOX1NDUk9MTF9TUEVFRCB8fCBzdGF0ZS5zY3JvbGxEaXN0YW5jZSA+IE1JTl9TQ1JPTExfRElTVEFOQ0UpIHtcblx0XHRcdHRoaXMuc2hvdygpO1xuXHRcdH1cblx0fVxuXG5cblx0ZGVzdHJveSgpIHtcblx0XHR0aGlzLnNob3coKTtcblx0XHRzY3JvbGxTdGF0ZS51bnN1YnNjcmliZShzY3JvbGxTdGF0ZS5FVkVOVF9TQ1JPTExfRlJBTUUsIHRoaXMub25TdGF0ZUNoYW5nZWQpO1xuXHRcdC8vIHRoaXMudW5zdWJzY3JpYmUoRW51bXMuQUNUSU9OX1NUSUNLWV9OQVZfU0hPV19CQUNLR1JPVU5ELCB0aGlzLmFkZEJhY2tncm91bmQpO1xuXHRcdC8vIHRoaXMudW5zdWJzY3JpYmUoRW51bXMuQUNUSU9OX1NUSUNLWV9OQVZfSElERV9CQUNLR1JPVU5ELCB0aGlzLnJlbW92ZUJhY2tncm91bmQpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gU3RpY2t5TmF2O1xuIiwiLy8gaW1wb3J0ICdiYWJlbC1wb2x5ZmlsbCc7XG5cbmltcG9ydCBDb21wb25lbnRMb2FkZXIgZnJvbSAnY29tcG9uZW50LWxvYWRlci1qcy9kaXN0L2VzNS9jb21wb25lbnQtbG9hZGVyJztcblxuaW1wb3J0IERva2kgZnJvbSAnLi9jb21wb25lbnRzL2Rva2knO1xuaW1wb3J0IFN0aWNreU5hdiBmcm9tICcuL2NvbXBvbmVudHMvc3RpY2t5LW5hdic7XG5cblxubmV3IENvbXBvbmVudExvYWRlcih7XG5cdERva2ksXG5cdFN0aWNreU5hdlxufSkuc2NhbigpOyIsIi8qXG5cdFJldHVybnMgdGhlIGJyb3dzZXIgcHJlZml4ZWRcblx0c3RyaW5nIGZvciB0aGUgYW5pbWF0aW9uIGVuZCBldmVudFxuKi9cbmV4cG9ydCBkZWZhdWx0ICgoKSA9PiB7XG5cdGxldCB0ID0gdW5kZWZpbmVkO1xuXHRsZXQgZXZlbnROYW1lO1xuXHRjb25zdCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHRjb25zdCBhbmltYXRpb25OYW1lcyA9IHtcblx0XHQnV2Via2l0QW5pbWF0aW9uJzogJ3dlYmtpdEFuaW1hdGlvbkVuZCcsXG5cdFx0J01vekFuaW1hdGlvbic6ICdhbmltYXRpb25lbmQnLFxuXHRcdCdPQW5pbWF0aW9uJzogJ29BbmltYXRpb25FbmQgb2FuaW1hdGlvbmVuZCcsXG5cdFx0J2FuaW1hdGlvbic6ICdhbmltYXRpb25lbmQnXG5cdH07XG5cdE9iamVjdC5rZXlzKGFuaW1hdGlvbk5hbWVzKS5mb3JFYWNoKCAodCkgPT4ge1xuXHRcdGlmIChlbC5zdHlsZVt0XSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRldmVudE5hbWUgPSBhbmltYXRpb25OYW1lc1t0XTtcblx0XHR9XG5cdH0pO1xuXHRyZXR1cm4gZXZlbnROYW1lO1xufSkoKTtcbiIsImV4cG9ydCBkZWZhdWx0IChmdW5jLCB0aHJlc2hvbGQsIGV4ZWNBc2FwKSA9PiB7XG5cdGxldCB0aW1lb3V0O1xuXG5cdHJldHVybiAoKSA9PiB7XG5cdFx0bGV0IG9iaiA9IHRoaXMsIGFyZ3MgPSBhcmd1bWVudHM7XG5cblx0XHRsZXQgZGVsYXllZCA9ICgpID0+IHtcblx0XHRcdGlmICghZXhlY0FzYXApIHtcblx0XHRcdFx0ZnVuYy5hcHBseShvYmosIGFyZ3MpO1xuXHRcdFx0fVxuXHRcdFx0dGltZW91dCA9IG51bGw7XG5cdFx0fVxuXG5cdFx0aWYgKHRpbWVvdXQpIHtcblx0XHRcdGNsZWFyVGltZW91dCh0aW1lb3V0KTtcblx0XHR9IGVsc2UgaWYgKGV4ZWNBc2FwKSB7XG5cdFx0XHRmdW5jLmFwcGx5KG9iaiwgYXJncyk7XG5cdFx0fVxuXG5cdFx0dGltZW91dCA9IHNldFRpbWVvdXQoZGVsYXllZCwgdGhyZXNob2xkIHx8IDEwMCk7XG5cdH1cbn0iLCJpbXBvcnQgZGVib3VuY2UgZnJvbSAnLi9kZWJvdW5jZSc7XG5pbXBvcnQgc2Nyb2xsTW9uaXRvciBmcm9tICdzY3JvbGxNb25pdG9yJztcblxuLyoqXG4gKiBTY3JvbGwgU3RhdGUgQWJzdHJhY3Rpb25cbiAqXG4gKiBIb2xkcyBpbmZvIGFib3V0IHNjcm9sbCBwb3NpdGlvbiwgc3BlZWQsIGRpcmVjdGlvbiwgZG9jdW1lbnQgLyB2aWV3cG9ydCBzaXplLCBldGNcbiAqXG4gKiBUcmlnZ2VycyBldmVudHMgZm9yXG4gKiAgIC0gU2Nyb2xsIFN0YXJ0XG4gKiAgIC0gU2Nyb2xsIFN0b3BcbiAqICAgLSBFYWNoIHNjcm9sbCBmcmFtZSB3aGlsZSBzY3JvbGxpbmdcbiAqL1xuY29uc3QgJGRvY3VtZW50ID0gJChkb2N1bWVudCk7XG5jb25zdCAkd2luZG93ID0gJCh3aW5kb3cpO1xuXG5jbGFzcyBTY3JvbGxTdGF0ZSB7XG5cblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0Ly8gQW55IHdheSB0byBleHBvcnQgc3RhdGljIGNsYXNzIGNvbnN0YW50cyB3aXRoIEVTNj8gVGhlc2UgZXZlbnQgbmFtZXMgc2hvdWxkIGJlIHBhY2thZ2VkIHdpdGggdGhlIG1vZHVsZS5cblx0XHR0aGlzLkVWRU5UX1NDUk9MTF9TVEFSVCA9ICdzY3JvbGxzdGF0ZTpzdGFydCc7XG5cdFx0dGhpcy5FVkVOVF9TQ1JPTExfU1RPUCAgPSAnc2Nyb2xsc3RhdGU6c3RvcCc7XG5cdFx0dGhpcy5FVkVOVF9TQ1JPTExfRlJBTUUgPSAnc2Nyb2xsc3RhdGU6ZnJhbWUnO1xuXG5cdFx0dGhpcy51cGRhdGluZyAgPSBmYWxzZTtcblx0XHR0aGlzLmxhdGVzdEZyYW1lID0gRGF0ZS5ub3coKTtcblxuXHRcdHRoaXMuc2Nyb2xsRGlmZiAgICAgICAgICA9IDA7ICAvLyBkZWx0YSBmcm9tIGxhc3Qgc2Nyb2xsIHBvc2l0aW9uXG5cdFx0dGhpcy5zY3JvbGxEaXN0YW5jZSAgICAgID0gMDsgIC8vIGFic29sdXRlIGRlbHRhXG5cdFx0dGhpcy5zY3JvbGxEaXJlY3Rpb24gICAgID0gMDsgIC8vIC0xLCAwLCBvciAxXG5cdFx0dGhpcy5tc1NpbmNlTGF0ZXN0Q2hhbmdlID0gMDtcblx0XHR0aGlzLnNjcm9sbFNwZWVkICAgICAgICAgPSAwOyAgLy8gcGl4ZWxzIC8gc2Vjb25kIGZvciBsYXRlc3QgZnJhbWVcblx0XHR0aGlzLmRvY3VtZW50SGVpZ2h0ICAgICAgPSB1bmRlZmluZWQ7XG5cdFx0dGhpcy52aWV3cG9ydEhlaWdodCAgICAgID0gdW5kZWZpbmVkO1xuXHRcdHRoaXMudmlld3BvcnRUb3AgICAgICAgICA9IDA7XG5cdFx0dGhpcy52aWV3cG9ydEJvdHRvbSAgICAgID0gdW5kZWZpbmVkO1xuXHRcdHRoaXMuaXNTY3JvbGxpbmdVcCAgICAgICA9IHVuZGVmaW5lZDtcblx0XHR0aGlzLmlzU2Nyb2xsaW5nRG93biAgICAgPSB1bmRlZmluZWQ7XG5cdFx0dGhpcy5pc1Njcm9sbGVkVG9Ub3AgICAgID0gdW5kZWZpbmVkO1xuXHRcdHRoaXMuaXNTY3JvbGxlZFRvQm90dG9tICA9IHVuZGVmaW5lZDtcblxuXHRcdHRoaXMuY2FsbGJhY2tzID0ge307XG5cblx0XHR0aGlzLnVwZGF0ZVN0YXRlKCk7XG5cdFx0dGhpcy5vblNjcm9sbFN0YXJ0RGVib3VuY2VkID0gZGVib3VuY2UodGhpcy5fb25TY3JvbGxTdGFydC5iaW5kKHRoaXMpLCA1MDAsIHRydWUpO1xuXHRcdHRoaXMub25TY3JvbGxTdG9wRGVib3VuY2VkID0gZGVib3VuY2UodGhpcy5fb25TY3JvbGxTdG9wLmJpbmQodGhpcyksIDUwMCk7XG5cblx0XHR0aGlzLl9hZGRFdmVudExpc3RlbmVycygpO1xuXG5cdH1cblxuXHQvKipcblx0ICogTWVkaWF0b3IgZnVuY3Rpb25hbGl0eS5cblx0ICogU3RvcmVzIHRoZSBldmVudCBhbmQgY2FsbGJhY2sgZ2l2ZW4gYnkgdGhlIGNvbXBvbmVudC5cblx0ICogZm9yIGZ1cnRoZXIgcmVmZXJlbmNlLlxuXHQgKiBAcGFyYW0gIHtTdHJpbmd9IGV2ZW50ICAgICAgZXZlbnQgc3RyaW5nXG5cdCAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjYWxsYmFjayBDYWxsYmFjayBmdW5jdGlvbiB0aGF0IHdvdWxkIGJlIHRyaWdnZXJlZC5cblx0ICovXG5cdHN1YnNjcmliZShldmVudCwgY2FsbGJhY2ssIGNvbnRleHQpIHtcblxuXHRcdC8vIElzIHRoaXMgYSBuZXcgZXZlbnQ/XG5cdFx0aWYgKCAhdGhpcy5jYWxsYmFja3MuaGFzT3duUHJvcGVydHkoZXZlbnQpICkge1xuXHRcdFx0dGhpcy5jYWxsYmFja3NbZXZlbnRdID0gW107XG5cdFx0fVxuXG5cdFx0Ly8gU3RvcmUgdGhlIHN1YnNjcmliZXIgY2FsbGJhY2tcblx0XHR0aGlzLmNhbGxiYWNrc1tldmVudF0ucHVzaCggeyBjb250ZXh0OiBjb250ZXh0LCBjYWxsYmFjazogY2FsbGJhY2sgfSApO1xuXG5cdH1cblxuXHQvKipcblx0ICogTWVkaWF0b3IgZnVuY3Rpb25hbGl0eS5cblx0ICogUmVtb3ZlcyB0aGUgc3RvcmVkIGV2ZW50IGFuZCBjYWxsYmFjayBnaXZlbiBieSB0aGUgY29tcG9uZW50LlxuXHQgKiBAcGFyYW0gIHtTdHJpbmd9ICAgZXZlbnQgICAgZXZlbnQgc3RyaW5nXG5cdCAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjYWxsYmFjayBDYWxsYmFjayBmdW5jdGlvbiB0aGF0IHdvdWxkIGJlIHRyaWdnZXJlZC5cblx0ICogQHJldHVybiB7Qm9vbGVhbn0gICAgICAgICAgICBUcnVlIG9uIHN1Y2Nlc3MsIEZhbHNlIG90aGVyd2lzZS5cblx0ICovXG5cdHVuc3Vic2NyaWJlKGV2ZW50LCBjYWxsYmFjaykge1xuXHRcdC8vIERvIHdlIGhhdmUgdGhpcyBldmVudD9cblx0XHRpZiAoIXRoaXMuY2FsbGJhY2tzLmhhc093blByb3BlcnR5KGV2ZW50KSkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdC8vIEZpbmQgb3V0IHdoZXJlIHRoaXMgaXMgYW5kIHJlbW92ZSBpdFxuXHRcdGZvciAobGV0IGkgPSAwLCBsZW4gPSB0aGlzLmNhbGxiYWNrc1tldmVudF0ubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdGlmICh0aGlzLmNhbGxiYWNrc1tldmVudF1baV0uY2FsbGJhY2sgPT09IGNhbGxiYWNrKSB7XG5cdFx0XHRcdHRoaXMuY2FsbGJhY2tzW2V2ZW50XS5zcGxpY2UoaSwgMSk7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdC8qKlxuXHQgKiBbcHVibGlzaCBkZXNjcmlwdGlvbl1cblx0ICogQHBhcmFtICB7W3R5cGVdfSBldmVudCBbZGVzY3JpcHRpb25dXG5cdCAqIEByZXR1cm4ge1t0eXBlXX0gICAgICAgW2Rlc2NyaXB0aW9uXVxuXHQgKi9cblx0X3B1Ymxpc2goZXZlbnQpIHtcblx0XHQvLyBDaGVjayBpZiB3ZSBoYXZlIHN1YmNyaWJlcnMgdG8gdGhpcyBldmVudFxuXHRcdGlmICghdGhpcy5jYWxsYmFja3MuaGFzT3duUHJvcGVydHkoZXZlbnQpKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Ly8gZG9uJ3Qgc2xpY2Ugb24gYXJndW1lbnRzIGJlY2F1c2UgaXQgcHJldmVudHMgb3B0aW1pemF0aW9ucyBpbiBKYXZhU2NyaXB0IGVuZ2luZXMgKFY4IGZvciBleGFtcGxlKVxuXHRcdC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0Z1bmN0aW9ucy9hcmd1bWVudHNcblx0XHQvLyBodHRwczovL2dpdGh1Yi5jb20vcGV0a2FhbnRvbm92L2JsdWViaXJkL3dpa2kvT3B0aW1pemF0aW9uLWtpbGxlcnMjMzItbGVha2luZy1hcmd1bWVudHNcblx0XHRjb25zdCBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyArK2kpIHtcblx0XHRcdFx0YXJnc1tpXSA9IGFyZ3VtZW50c1tpICsgMV07IC8vIHJlbW92ZSBmaXJzdCBhcmd1bWVudFxuXHRcdH1cblxuXHRcdC8vIExvb3AgdGhyb3VnaCB0aGVtIGFuZCBmaXJlIHRoZSBjYWxsYmFja3Ncblx0XHRmb3IgKGxldCBpID0gMCwgbGVuID0gdGhpcy5jYWxsYmFja3NbZXZlbnRdLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRsZXQgc3Vic2NyaXB0aW9uID0gdGhpcy5jYWxsYmFja3NbZXZlbnRdW2ldO1xuXHRcdFx0Ly8gQ2FsbCBpdCdzIGNhbGxiYWNrXG5cdFx0XHRpZiAoc3Vic2NyaXB0aW9uLmNhbGxiYWNrKSB7XG5cdFx0XHRcdHN1YnNjcmlwdGlvbi5jYWxsYmFjay5hcHBseShzdWJzY3JpcHRpb24uY29udGV4dCwgYXJncyk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHRkZXN0cm95KCkge1xuXHRcdHRoaXMuX3JlbW92ZUV2ZW50TGlzdGVuZXJzKCk7XG5cdH1cblxuXHRfYWRkRXZlbnRMaXN0ZW5lcnMoKSB7XG5cdFx0JHdpbmRvdy5vbignc2Nyb2xsJywgdGhpcy5vblNjcm9sbFN0YXJ0RGVib3VuY2VkKTtcblx0XHQkd2luZG93Lm9uKCdzY3JvbGwnLCB0aGlzLm9uU2Nyb2xsU3RvcERlYm91bmNlZCk7XG5cdFx0JHdpbmRvdy5vbignc2Nyb2xsJywgdGhpcy51cGRhdGVTdGF0ZS5iaW5kKHRoaXMpKTtcblx0fVxuXG5cdF9yZW1vdmVFdmVudExpc3RlbmVycygpIHtcblx0XHQkd2luZG93Lm9mZignc2Nyb2xsJywgdGhpcy5vblNjcm9sbFN0YXJ0RGVib3VuY2VkKTtcblx0XHQkd2luZG93Lm9mZignc2Nyb2xsJywgdGhpcy5vblNjcm9sbFN0b3BEZWJvdW5jZWQpO1xuXHRcdCR3aW5kb3cub2ZmKCdzY3JvbGwnLCB0aGlzLnVwZGF0ZVN0YXRlLnVuYmluZCh0aGlzKSk7XG5cdH1cblxuXHRfb25TY3JvbGxTdGFydCgpIHtcblx0XHR0aGlzLl9wdWJsaXNoKHRoaXMuRVZFTlRfU0NST0xMX1NUQVJULCB0aGlzKTtcblx0fVxuXG5cdF9vblNjcm9sbFN0b3AoKSB7XG5cdFx0dGhpcy5fcHVibGlzaCh0aGlzLkVWRU5UX1NDUk9MTF9TVE9QLCB0aGlzKTtcblx0fVxuXG5cdHVwZGF0ZVN0YXRlKCkge1xuXHRcdGlmICh0aGlzLnVwZGF0aW5nKSByZXR1cm47XG5cdFx0dGhpcy51cGRhdGluZyA9IHRydWU7XG5cblx0XHR2YXIgbm93ID0gRGF0ZS5ub3coKTtcblxuXHRcdC8vIGRpc3RhbmNlIGFuZCBzcGVlZCBjYWxjc1xuXHRcdHRoaXMuc2Nyb2xsRGlmZiAgPSB0aGlzLnZpZXdwb3J0VG9wIC0gc2Nyb2xsTW9uaXRvci52aWV3cG9ydFRvcDtcblx0XHR0aGlzLnNjcm9sbERpc3RhbmNlICA9IE1hdGguYWJzKHRoaXMuc2Nyb2xsRGlmZik7XG5cdFx0dGhpcy5zY3JvbGxEaXJlY3Rpb24gPSBNYXRoLm1heCgtMSwgTWF0aC5taW4oMSwgdGhpcy5zY3JvbGxEaWZmKSk7XG5cdFx0dGhpcy5tc1NpbmNlTGF0ZXN0Q2hhbmdlID0gKG5vdyAtIHRoaXMubGF0ZXN0RnJhbWUpO1xuXHRcdHRoaXMuc2Nyb2xsU3BlZWQgPSB0aGlzLnNjcm9sbERpc3RhbmNlIC8gdGhpcy5tc1NpbmNlTGF0ZXN0Q2hhbmdlICogMTAwMDtcblxuXHRcdC8vIHZpZXdwb3J0XG5cdFx0dGhpcy5kb2N1bWVudEhlaWdodCA9IHNjcm9sbE1vbml0b3IuZG9jdW1lbnRIZWlnaHQ7XG5cdFx0dGhpcy52aWV3cG9ydEhlaWdodCA9IHNjcm9sbE1vbml0b3Iudmlld3BvcnRIZWlnaHQ7XG5cdFx0dGhpcy52aWV3cG9ydFRvcCAgICA9IHNjcm9sbE1vbml0b3Iudmlld3BvcnRUb3A7XG5cdFx0dGhpcy52aWV3cG9ydEJvdHRvbSA9IHNjcm9sbE1vbml0b3Iudmlld3BvcnRCb3R0b207XG5cblx0XHQvLyBoZWxwZXJzXG5cdFx0dGhpcy5pc1Njcm9sbGluZ1VwID0gdGhpcy5zY3JvbGxEaXJlY3Rpb24gPiAwO1xuXHRcdHRoaXMuaXNTY3JvbGxpbmdEb3duID0gdGhpcy5zY3JvbGxEaXJlY3Rpb24gPCAwO1xuXHRcdHRoaXMuaXNTY3JvbGxlZFRvVG9wID0gdGhpcy52aWV3cG9ydFRvcCA8PSAwO1xuXHRcdHRoaXMuaXNTY3JvbGxlZFRvQm90dG9tID0gdGhpcy52aWV3cG9ydEJvdHRvbSA+PSB0aGlzLmRvY3VtZW50SGVpZ2h0O1xuXG5cdFx0dGhpcy5sYXRlc3RGcmFtZSA9IG5vdztcblxuXHRcdHRoaXMuX3B1Ymxpc2godGhpcy5FVkVOVF9TQ1JPTExfRlJBTUUsIHRoaXMpO1xuXG5cdFx0dGhpcy51cGRhdGluZyA9IGZhbHNlO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gbmV3IFNjcm9sbFN0YXRlXG4iXX0=
