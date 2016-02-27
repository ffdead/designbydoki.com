(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * ComponentLoader Class
 *
 * Instantiates JavaScript Classes when their name is found in the DOM using attribute data-component=""
 *
 */
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

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
		var components = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
		var context = arguments.length <= 1 || arguments[1] === undefined ? document : arguments[1];

		_classCallCheck(this, ComponentLoader);

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

	_createClass(ComponentLoader, [{
		key: "register",
		value: function register() {
			var _this = this;

			var components = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

			Object.keys(components).forEach(function (componentName) {
				_this.components[componentName] = components[componentName];
			});
		}

		/**
   * Remove component from collection of available components
   * @public
   * @param {String} componentName - Name of the component to remove
   */
	}, {
		key: "unregister",
		value: function unregister(componentName) {
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
	}, {
		key: "subscribe",
		value: function subscribe(topic, callback, context) {

			// Is this a new topic?
			if (!this.topics.hasOwnProperty(topic)) {
				this.topics[topic] = [];
			}

			// Store the subscriber callback
			this.topics[topic].push({ context: context, callback: callback });
		}

		/**
   * Mediator functionality.
   * Removes the stored topic and callback given by the component.
   * @param  {String}   topic    Topic string
   * @param  {Function} callback Callback function that would be triggered.
   * @param  {Function} context  Class instance which owns the callback
   * @return {Boolean}           True on success, False otherwise.
   */
	}, {
		key: "unsubscribe",
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

		/**
   * [publish description]
   * @param  {[type]} topic [description]
   * @return {[type]}       [description]
   */
	}, {
		key: "publish",
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

		/**
   * Scan the DOM, initialize new components and destroy removed components.
   * @public
   * @param {Object} data - Optional data object to pass to the component constructor
   */
	}, {
		key: "scan",
		value: function scan() {
			var _this2 = this;

			var data = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

			var activeComponents = {},
			    elements = this.contextEl.querySelectorAll("[data-component]");

			[].forEach.call(elements, function (el) {
				_this2._scanElement(el, activeComponents, data);
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
	}, {
		key: "_scanElement",
		value: function _scanElement(el, activeComponents, data) {
			var _this3 = this;

			// check of component(s) for this DOM element already have been initialized
			var elementId = el.getAttribute("data-component-id");

			if (!elementId) {
				// give unique id so we can track it on next scan
				elementId = this._generateUUID();
				el.setAttribute('data-component-id', elementId);
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

		/**
   * Call constructor of component and add instance to the collection of initialized components
   * @private
   * @param {String} componentName - Name of the component to initialize. Used to lookup class definition in components collection.
   * @param {String} componentId - Unique component ID (combination of component name and element ID)
   * @param {Element} el - DOM element that is the context of this component
   * @param {Object} data - Optional data object to pass to the component constructor
   */
	}, {
		key: "_initializeComponent",
		value: function _initializeComponent(componentName, componentId, el, data) {
			var component = this.components[componentName];

			if (typeof component !== 'function') throw "ComponentLoader: unknown component '" + componentName + "'";

			var instance = new component(el, data, this);

			this.initializedComponents[componentId] = instance;
			this.numberOfInitializedComponents++;
		}

		/**
   * Call destroy() on a component instance and remove it from the collection of initialized components
   * @private
   * @param {String} componentId - Unique component ID used to find component instance
   */
	}, {
		key: "_destroyComponent",
		value: function _destroyComponent(componentId) {
			var instance = this.initializedComponents[componentId];
			if (instance && typeof instance.destroy === 'function') instance.destroy();

			// safe to delete while object keys while loopinghttp://stackoverflow.com/questions/3463048/is-it-safe-to-delete-an-object-property-while-iterating-over-them
			delete this.initializedComponents[componentId];
			this.numberOfInitializedComponents--;
		}

		/**
   * Destroy inaitialized components that no longer are active
   * @private
   * @param {Object} activeComponents - All componentIds currently found in the DOM
   */
	}, {
		key: "cleanUp_",
		value: function cleanUp_() {
			var _this4 = this;

			var activeComponents = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

			Object.keys(this.initializedComponents).forEach(function (componentId) {
				if (!activeComponents[componentId]) {
					_this4._destroyComponent(componentId);
				}
			});
		}

		/**
   * Generates a rfc4122 version 4 compliant unique ID
   * http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
   * @private
   */
	}, {
		key: "_generateUUID",
		value: function _generateUUID() {
			return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
				var r = Math.random() * 16 | 0,
				    v = c == 'x' ? r : r & 0x3 | 0x8;
				return v.toString(16);
			});
		}
	}]);

	return ComponentLoader;
})();

exports["default"] = ComponentLoader;
module.exports = exports["default"];
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

Object.defineProperty(exports, '__esModule', {
	value: true
});

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

	/**
  * Publish an event for other components
  * @protected
  * @param {String} topic - Event name
  * @param {Object} data - Optional params to pass with the event
  */

	_createClass(Component, [{
		key: 'publish',
		value: function publish() {
			var _mediator;

			(_mediator = this.__mediator).publish.apply(_mediator, arguments);
		}

		/**
   * Subscribe to an event from another component
   * @protected
   * @param {String} topic - Event name
   * @param {Function} callback - Function to bind
   */
	}, {
		key: 'subscribe',
		value: function subscribe(topic, callback) {
			this.__mediator.subscribe(topic, callback, this);
		}

		/**
   * Unsubscribe from an event from another component
   * @protected
   * @param {String} topic - Event name
   * @param {Function} callback - Function to unbind
   */
	}, {
		key: 'unsubscribe',
		value: function unsubscribe(topic, callback) {
			this.__mediator.unsubscribe(topic, callback, this);
		}

		/**
   * Utility method for triggering the ComponentLoader to scan the markup for new components
   * @protected
   * @param {Object} data - Optional data to pass to the constructor of any Component initialized by this scan
   */
	}, {
		key: 'scan',
		value: function scan(data) {
			this.__mediator.scan(data);
		}

		/**
   * Utility method for defering a function call
   * @protected
   * @param {Function} callback - Function to call
   * @param {Number} ms - Optional ms to delay, defaults to 17ms (just over 1 frame at 60fps)
   */
	}, {
		key: 'defer',
		value: function defer(callback) {
			var ms = arguments.length <= 1 || arguments[1] === undefined ? 17 : arguments[1];

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
	}, {
		key: 'destroy',
		value: function destroy() {}
	}]);

	return Component;
})();

exports['default'] = Component;
module.exports = exports['default'];
},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _componentLoaderJs = require('./component-loader.js');

var _componentLoaderJs2 = _interopRequireDefault(_componentLoaderJs);

var _componentJs = require('./component.js');

var _componentJs2 = _interopRequireDefault(_componentJs);

exports.Component = _componentJs2['default'];
exports['default'] = _componentLoaderJs2['default'];
},{"./component-loader.js":1,"./component.js":2}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _componentLoaderJs = require('component-loader-js');

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
}(_componentLoaderJs.Component);

exports.default = Doki;

},{"component-loader-js":3}],6:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _componentLoaderJs = require('component-loader-js');

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

// Scroll speed required to reveal header when scrolling back up
var MIN_SCROLL_SPEED = 400;

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
			// this.subscribe(ACTION_STICKY_NAV_SHOW_BACKGROUND, this.addBackground);
			// this.subscribe(ACTION_STICKY_NAV_HIDE_BACKGROUND, this.removeBackground);
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
			// this.unsubscribe(ACTION_STICKY_NAV_SHOW_BACKGROUND, this.addBackground);
			// this.unsubscribe(ACTION_STICKY_NAV_HIDE_BACKGROUND, this.removeBackground);
		}
	}]);

	return StickyNav;
}(_componentLoaderJs.Component);

module.exports = StickyNav;

},{"../utils/animation-end-event":8,"../utils/scroll-state":10,"component-loader-js":3}],7:[function(require,module,exports){
'use strict';

var _componentLoaderJs = require('component-loader-js');

var _componentLoaderJs2 = _interopRequireDefault(_componentLoaderJs);

var _doki = require('./components/doki');

var _doki2 = _interopRequireDefault(_doki);

var _stickyNav = require('./components/sticky-nav');

var _stickyNav2 = _interopRequireDefault(_stickyNav);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

new _componentLoaderJs2.default({
	Doki: _doki2.default,
	StickyNav: _stickyNav2.default
}).scan(); // import 'babel-polyfill';

},{"./components/doki":5,"./components/sticky-nav":6,"component-loader-js":3}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
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

},{"./debounce":9,"scrollMonitor":4}]},{},[7])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvY29tcG9uZW50LWxvYWRlci1qcy9saWIvY29tcG9uZW50LWxvYWRlci5qcyIsIm5vZGVfbW9kdWxlcy9jb21wb25lbnQtbG9hZGVyLWpzL2xpYi9jb21wb25lbnQuanMiLCJub2RlX21vZHVsZXMvY29tcG9uZW50LWxvYWRlci1qcy9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvc2Nyb2xsTW9uaXRvci9zY3JvbGxNb25pdG9yLmpzIiwidGhlbWUvanMvY29tcG9uZW50cy9kb2tpLmpzIiwidGhlbWUvanMvY29tcG9uZW50cy9zdGlja3ktbmF2LmpzIiwidGhlbWUvanMvbWFpbi5qcyIsInRoZW1lL2pzL3V0aWxzL2FuaW1hdGlvbi1lbmQtZXZlbnQuanMiLCJ0aGVtZS9qcy91dGlscy9kZWJvdW5jZS5qcyIsInRoZW1lL2pzL3V0aWxzL3Njcm9sbC1zdGF0ZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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QXVCYixRQUFLLGtCQUFMLEdBQTBCLEtBQUssY0FBTCxJQUF1QixLQUFLLGNBQUwsQ0F2QnBDOztBQXlCYixRQUFLLFdBQUwsR0FBbUIsR0FBbkIsQ0F6QmE7O0FBMkJiLFFBQUssUUFBTCxDQUFjLGtCQUFkLEVBQWtDLElBQWxDLEVBM0JhOztBQTZCYixRQUFLLFFBQUwsR0FBZ0IsS0FBaEIsQ0E3QmE7Ozs7UUEvSFQ7OztrQkFnS1MsSUFBSSxXQUFKIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogQ29tcG9uZW50TG9hZGVyIENsYXNzXG4gKlxuICogSW5zdGFudGlhdGVzIEphdmFTY3JpcHQgQ2xhc3NlcyB3aGVuIHRoZWlyIG5hbWUgaXMgZm91bmQgaW4gdGhlIERPTSB1c2luZyBhdHRyaWJ1dGUgZGF0YS1jb21wb25lbnQ9XCJcIlxuICpcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuXHR2YWx1ZTogdHJ1ZVxufSk7XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSAoZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSkoKTtcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxudmFyIENvbXBvbmVudExvYWRlciA9IChmdW5jdGlvbiAoKSB7XG5cblx0LyoqXG4gICogQ29uc3RydWN0b3IgZm9yIHRoZSBDb21wb25lbnRMb2FkZXJcbiAgKiBAY2xhc3NcbiAgKiBAcHVibGljXG4gICogQHBhcmFtIHtPYmplY3R9IGNvbXBvbmVudHMgLSBPcHRpb25hbCBjb2xsZWN0aW9uIG9mIGF2YWlsYWJsZSBjb21wb25lbnRzOiB7Y29tcG9uZW50TmFtZTogY2xhc3NEZWZpbml0aW9ufVxuICAqIEBwYXJhbSB7Tm9kZX0gY29udGV4dCAtIE9wdGlvbmFsIERPTSBub2RlIHRvIHNlYXJjaCBmb3IgY29tcG9uZW50cy4gRGVmYXVsdHMgdG8gZG9jdW1lbnQuXG4gICovXG5cblx0ZnVuY3Rpb24gQ29tcG9uZW50TG9hZGVyKCkge1xuXHRcdHZhciBjb21wb25lbnRzID0gYXJndW1lbnRzLmxlbmd0aCA8PSAwIHx8IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8ge30gOiBhcmd1bWVudHNbMF07XG5cdFx0dmFyIGNvbnRleHQgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDEgfHwgYXJndW1lbnRzWzFdID09PSB1bmRlZmluZWQgPyBkb2N1bWVudCA6IGFyZ3VtZW50c1sxXTtcblxuXHRcdF9jbGFzc0NhbGxDaGVjayh0aGlzLCBDb21wb25lbnRMb2FkZXIpO1xuXG5cdFx0dGhpcy5jb250ZXh0RWwgPSBjb250ZXh0O1xuXHRcdHRoaXMuaW5pdGlhbGl6ZWRDb21wb25lbnRzID0ge307XG5cdFx0dGhpcy5udW1iZXJPZkluaXRpYWxpemVkQ29tcG9uZW50cyA9IDA7XG5cdFx0dGhpcy5jb21wb25lbnRzID0ge307XG5cdFx0dGhpcy50b3BpY3MgPSB7fTtcblx0XHR0aGlzLnJlZ2lzdGVyKGNvbXBvbmVudHMpO1xuXHR9XG5cblx0LyoqXG4gICogQWRkIGNvbXBvbmVudChzKSB0byBjb2xsZWN0aW9uIG9mIGF2YWlsYWJsZSBjb21wb25lbnRzXG4gICogQHB1YmxpY1xuICAqIEBwYXJhbSB7T2JqZWN0fSBjb21wb25lbnRzIC0gQ29sbGVjdGlvbiBvZiBjb21wb25lbnRzOiB7Y29tcG9uZW50TmFtZTogY2xhc3NEZWZpbml0aW9ufVxuICAqL1xuXG5cdF9jcmVhdGVDbGFzcyhDb21wb25lbnRMb2FkZXIsIFt7XG5cdFx0a2V5OiBcInJlZ2lzdGVyXCIsXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIHJlZ2lzdGVyKCkge1xuXHRcdFx0dmFyIF90aGlzID0gdGhpcztcblxuXHRcdFx0dmFyIGNvbXBvbmVudHMgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDAgfHwgYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyB7fSA6IGFyZ3VtZW50c1swXTtcblxuXHRcdFx0T2JqZWN0LmtleXMoY29tcG9uZW50cykuZm9yRWFjaChmdW5jdGlvbiAoY29tcG9uZW50TmFtZSkge1xuXHRcdFx0XHRfdGhpcy5jb21wb25lbnRzW2NvbXBvbmVudE5hbWVdID0gY29tcG9uZW50c1tjb21wb25lbnROYW1lXTtcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdC8qKlxuICAgKiBSZW1vdmUgY29tcG9uZW50IGZyb20gY29sbGVjdGlvbiBvZiBhdmFpbGFibGUgY29tcG9uZW50c1xuICAgKiBAcHVibGljXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBjb21wb25lbnROYW1lIC0gTmFtZSBvZiB0aGUgY29tcG9uZW50IHRvIHJlbW92ZVxuICAgKi9cblx0fSwge1xuXHRcdGtleTogXCJ1bnJlZ2lzdGVyXCIsXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIHVucmVnaXN0ZXIoY29tcG9uZW50TmFtZSkge1xuXHRcdFx0ZGVsZXRlIHRoaXMuY29tcG9uZW50c1tjb21wb25lbnROYW1lXTtcblx0XHR9XG5cblx0XHQvKipcbiAgICogTWVkaWF0b3IgZnVuY3Rpb25hbGl0eS5cbiAgICogU3RvcmVzIHRoZSB0b3BpYyBhbmQgY2FsbGJhY2sgZ2l2ZW4gYnkgdGhlIGNvbXBvbmVudC5cbiAgICogZm9yIGZ1cnRoZXIgcmVmZXJlbmNlLlxuICAgKiBAcGFyYW0gIHtTdHJpbmd9IHRvcGljICAgICAgVG9waWMgc3RyaW5nXG4gICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjYWxsYmFjayBDYWxsYmFjayBmdW5jdGlvbiB0aGF0IHdvdWxkIGJlIHRyaWdnZXJlZC5cbiAgICogQHBhcmFtICB7RnVuY3Rpb259IGNvbnRleHQgIENsYXNzIGluc3RhbmNlIHdoaWNoIG93bnMgdGhlIGNhbGxiYWNrXG4gICAqL1xuXHR9LCB7XG5cdFx0a2V5OiBcInN1YnNjcmliZVwiLFxuXHRcdHZhbHVlOiBmdW5jdGlvbiBzdWJzY3JpYmUodG9waWMsIGNhbGxiYWNrLCBjb250ZXh0KSB7XG5cblx0XHRcdC8vIElzIHRoaXMgYSBuZXcgdG9waWM/XG5cdFx0XHRpZiAoIXRoaXMudG9waWNzLmhhc093blByb3BlcnR5KHRvcGljKSkge1xuXHRcdFx0XHR0aGlzLnRvcGljc1t0b3BpY10gPSBbXTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gU3RvcmUgdGhlIHN1YnNjcmliZXIgY2FsbGJhY2tcblx0XHRcdHRoaXMudG9waWNzW3RvcGljXS5wdXNoKHsgY29udGV4dDogY29udGV4dCwgY2FsbGJhY2s6IGNhbGxiYWNrIH0pO1xuXHRcdH1cblxuXHRcdC8qKlxuICAgKiBNZWRpYXRvciBmdW5jdGlvbmFsaXR5LlxuICAgKiBSZW1vdmVzIHRoZSBzdG9yZWQgdG9waWMgYW5kIGNhbGxiYWNrIGdpdmVuIGJ5IHRoZSBjb21wb25lbnQuXG4gICAqIEBwYXJhbSAge1N0cmluZ30gICB0b3BpYyAgICBUb3BpYyBzdHJpbmdcbiAgICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrIENhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgd291bGQgYmUgdHJpZ2dlcmVkLlxuICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY29udGV4dCAgQ2xhc3MgaW5zdGFuY2Ugd2hpY2ggb3ducyB0aGUgY2FsbGJhY2tcbiAgICogQHJldHVybiB7Qm9vbGVhbn0gICAgICAgICAgIFRydWUgb24gc3VjY2VzcywgRmFsc2Ugb3RoZXJ3aXNlLlxuICAgKi9cblx0fSwge1xuXHRcdGtleTogXCJ1bnN1YnNjcmliZVwiLFxuXHRcdHZhbHVlOiBmdW5jdGlvbiB1bnN1YnNjcmliZSh0b3BpYywgY2FsbGJhY2ssIGNvbnRleHQpIHtcblx0XHRcdC8vIERvIHdlIGhhdmUgdGhpcyB0b3BpYz9cblx0XHRcdGlmICghdGhpcy50b3BpY3MuaGFzT3duUHJvcGVydHkodG9waWMpKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gRmluZCBvdXQgd2hlcmUgdGhpcyBpcyBhbmQgcmVtb3ZlIGl0XG5cdFx0XHRmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy50b3BpY3NbdG9waWNdLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRcdGlmICh0aGlzLnRvcGljc1t0b3BpY11baV0uY2FsbGJhY2sgPT09IGNhbGxiYWNrKSB7XG5cdFx0XHRcdFx0aWYgKCFjb250ZXh0IHx8IHRoaXMudG9waWNzW3RvcGljXVtpXS5jb250ZXh0ID09PSBjb250ZXh0KSB7XG5cdFx0XHRcdFx0XHR0aGlzLnRvcGljc1t0b3BpY10uc3BsaWNlKGksIDEpO1xuXHRcdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvKipcbiAgICogW3B1Ymxpc2ggZGVzY3JpcHRpb25dXG4gICAqIEBwYXJhbSAge1t0eXBlXX0gdG9waWMgW2Rlc2NyaXB0aW9uXVxuICAgKiBAcmV0dXJuIHtbdHlwZV19ICAgICAgIFtkZXNjcmlwdGlvbl1cbiAgICovXG5cdH0sIHtcblx0XHRrZXk6IFwicHVibGlzaFwiLFxuXHRcdHZhbHVlOiBmdW5jdGlvbiBwdWJsaXNoKHRvcGljKSB7XG5cdFx0XHQvLyBDaGVjayBpZiB3ZSBoYXZlIHN1YmNyaWJlcnMgdG8gdGhpcyB0b3BpY1xuXHRcdFx0aWYgKCF0aGlzLnRvcGljcy5oYXNPd25Qcm9wZXJ0eSh0b3BpYykpIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBkb24ndCBzbGljZSBvbiBhcmd1bWVudHMgYmVjYXVzZSBpdCBwcmV2ZW50cyBvcHRpbWl6YXRpb25zIGluIEphdmFTY3JpcHQgZW5naW5lcyAoVjggZm9yIGV4YW1wbGUpXG5cdFx0XHQvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9GdW5jdGlvbnMvYXJndW1lbnRzXG5cdFx0XHQvLyBodHRwczovL2dpdGh1Yi5jb20vcGV0a2FhbnRvbm92L2JsdWViaXJkL3dpa2kvT3B0aW1pemF0aW9uLWtpbGxlcnMjMzItbGVha2luZy1hcmd1bWVudHNcblx0XHRcdHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7ICsraSkge1xuXHRcdFx0XHRhcmdzW2ldID0gYXJndW1lbnRzW2kgKyAxXTsgLy8gcmVtb3ZlIGZpcnN0IGFyZ3VtZW50XG5cdFx0XHR9XG5cblx0XHRcdC8vIExvb3AgdGhyb3VnaCB0aGVtIGFuZCBmaXJlIHRoZSBjYWxsYmFja3Ncblx0XHRcdGZvciAodmFyIF9pID0gMCwgbGVuID0gdGhpcy50b3BpY3NbdG9waWNdLmxlbmd0aDsgX2kgPCBsZW47IF9pKyspIHtcblx0XHRcdFx0dmFyIHN1YnNjcmlwdGlvbiA9IHRoaXMudG9waWNzW3RvcGljXVtfaV07XG5cdFx0XHRcdC8vIENhbGwgaXQncyBjYWxsYmFja1xuXHRcdFx0XHRpZiAoc3Vic2NyaXB0aW9uICYmIHN1YnNjcmlwdGlvbi5jYWxsYmFjaykge1xuXHRcdFx0XHRcdHN1YnNjcmlwdGlvbi5jYWxsYmFjay5hcHBseShzdWJzY3JpcHRpb24uY29udGV4dCwgYXJncyk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0LyoqXG4gICAqIFNjYW4gdGhlIERPTSwgaW5pdGlhbGl6ZSBuZXcgY29tcG9uZW50cyBhbmQgZGVzdHJveSByZW1vdmVkIGNvbXBvbmVudHMuXG4gICAqIEBwdWJsaWNcbiAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBPcHRpb25hbCBkYXRhIG9iamVjdCB0byBwYXNzIHRvIHRoZSBjb21wb25lbnQgY29uc3RydWN0b3JcbiAgICovXG5cdH0sIHtcblx0XHRrZXk6IFwic2NhblwiLFxuXHRcdHZhbHVlOiBmdW5jdGlvbiBzY2FuKCkge1xuXHRcdFx0dmFyIF90aGlzMiA9IHRoaXM7XG5cblx0XHRcdHZhciBkYXRhID0gYXJndW1lbnRzLmxlbmd0aCA8PSAwIHx8IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8ge30gOiBhcmd1bWVudHNbMF07XG5cblx0XHRcdHZhciBhY3RpdmVDb21wb25lbnRzID0ge30sXG5cdFx0XHQgICAgZWxlbWVudHMgPSB0aGlzLmNvbnRleHRFbC5xdWVyeVNlbGVjdG9yQWxsKFwiW2RhdGEtY29tcG9uZW50XVwiKTtcblxuXHRcdFx0W10uZm9yRWFjaC5jYWxsKGVsZW1lbnRzLCBmdW5jdGlvbiAoZWwpIHtcblx0XHRcdFx0X3RoaXMyLl9zY2FuRWxlbWVudChlbCwgYWN0aXZlQ29tcG9uZW50cywgZGF0YSk7XG5cdFx0XHR9KTtcblxuXHRcdFx0aWYgKHRoaXMubnVtYmVyT2ZJbml0aWFsaXplZENvbXBvbmVudHMgPiAwKSB0aGlzLmNsZWFuVXBfKGFjdGl2ZUNvbXBvbmVudHMpO1xuXHRcdH1cblxuXHRcdC8qKlxuICAgKiBGaW5kIGFsbCBjb21wb25lbnRzIHJlZ2lzdGVyZWQgb24gYSBzcGVjaWZpYyBET00gZWxlbWVudCBhbmQgaW5pdGlhbGl6ZSB0aGVtIGlmIG5ld1xuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge0VsZW1lbnR9IGVsIC0gRE9NIGVsZW1lbnQgdG8gc2NhbiBmb3IgY29tcG9uZW50c1xuICAgKiBAcGFyYW0ge09iamVjdH0gYWN0aXZlQ29tcG9uZW50cyAtIEFsbCBjb21wb25lbnRJZHMgY3VycmVudGx5IGZvdW5kIGluIHRoZSBET01cbiAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBPcHRpb25hbCBkYXRhIG9iamVjdCB0byBwYXNzIHRvIHRoZSBjb21wb25lbnQgY29uc3RydWN0b3JcbiAgICovXG5cdH0sIHtcblx0XHRrZXk6IFwiX3NjYW5FbGVtZW50XCIsXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIF9zY2FuRWxlbWVudChlbCwgYWN0aXZlQ29tcG9uZW50cywgZGF0YSkge1xuXHRcdFx0dmFyIF90aGlzMyA9IHRoaXM7XG5cblx0XHRcdC8vIGNoZWNrIG9mIGNvbXBvbmVudChzKSBmb3IgdGhpcyBET00gZWxlbWVudCBhbHJlYWR5IGhhdmUgYmVlbiBpbml0aWFsaXplZFxuXHRcdFx0dmFyIGVsZW1lbnRJZCA9IGVsLmdldEF0dHJpYnV0ZShcImRhdGEtY29tcG9uZW50LWlkXCIpO1xuXG5cdFx0XHRpZiAoIWVsZW1lbnRJZCkge1xuXHRcdFx0XHQvLyBnaXZlIHVuaXF1ZSBpZCBzbyB3ZSBjYW4gdHJhY2sgaXQgb24gbmV4dCBzY2FuXG5cdFx0XHRcdGVsZW1lbnRJZCA9IHRoaXMuX2dlbmVyYXRlVVVJRCgpO1xuXHRcdFx0XHRlbC5zZXRBdHRyaWJ1dGUoJ2RhdGEtY29tcG9uZW50LWlkJywgZWxlbWVudElkKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gZmluZCB0aGUgbmFtZSBvZiB0aGUgY29tcG9uZW50IGluc3RhbmNlXG5cdFx0XHR2YXIgY29tcG9uZW50TGlzdCA9IGVsLmdldEF0dHJpYnV0ZShcImRhdGEtY29tcG9uZW50XCIpLm1hdGNoKC9cXFMrL2cpO1xuXHRcdFx0Y29tcG9uZW50TGlzdC5mb3JFYWNoKGZ1bmN0aW9uIChjb21wb25lbnROYW1lKSB7XG5cblx0XHRcdFx0dmFyIGNvbXBvbmVudElkID0gY29tcG9uZW50TmFtZSArIFwiLVwiICsgZWxlbWVudElkO1xuXHRcdFx0XHRhY3RpdmVDb21wb25lbnRzW2NvbXBvbmVudElkXSA9IHRydWU7XG5cblx0XHRcdFx0Ly8gY2hlY2sgaWYgY29tcG9uZW50IG5vdCBpbml0aWFsaXplZCBiZWZvcmVcblx0XHRcdFx0aWYgKCFfdGhpczMuaW5pdGlhbGl6ZWRDb21wb25lbnRzW2NvbXBvbmVudElkXSkge1xuXHRcdFx0XHRcdF90aGlzMy5faW5pdGlhbGl6ZUNvbXBvbmVudChjb21wb25lbnROYW1lLCBjb21wb25lbnRJZCwgZWwsIGRhdGEpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHQvKipcbiAgICogQ2FsbCBjb25zdHJ1Y3RvciBvZiBjb21wb25lbnQgYW5kIGFkZCBpbnN0YW5jZSB0byB0aGUgY29sbGVjdGlvbiBvZiBpbml0aWFsaXplZCBjb21wb25lbnRzXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBjb21wb25lbnROYW1lIC0gTmFtZSBvZiB0aGUgY29tcG9uZW50IHRvIGluaXRpYWxpemUuIFVzZWQgdG8gbG9va3VwIGNsYXNzIGRlZmluaXRpb24gaW4gY29tcG9uZW50cyBjb2xsZWN0aW9uLlxuICAgKiBAcGFyYW0ge1N0cmluZ30gY29tcG9uZW50SWQgLSBVbmlxdWUgY29tcG9uZW50IElEIChjb21iaW5hdGlvbiBvZiBjb21wb25lbnQgbmFtZSBhbmQgZWxlbWVudCBJRClcbiAgICogQHBhcmFtIHtFbGVtZW50fSBlbCAtIERPTSBlbGVtZW50IHRoYXQgaXMgdGhlIGNvbnRleHQgb2YgdGhpcyBjb21wb25lbnRcbiAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBPcHRpb25hbCBkYXRhIG9iamVjdCB0byBwYXNzIHRvIHRoZSBjb21wb25lbnQgY29uc3RydWN0b3JcbiAgICovXG5cdH0sIHtcblx0XHRrZXk6IFwiX2luaXRpYWxpemVDb21wb25lbnRcIixcblx0XHR2YWx1ZTogZnVuY3Rpb24gX2luaXRpYWxpemVDb21wb25lbnQoY29tcG9uZW50TmFtZSwgY29tcG9uZW50SWQsIGVsLCBkYXRhKSB7XG5cdFx0XHR2YXIgY29tcG9uZW50ID0gdGhpcy5jb21wb25lbnRzW2NvbXBvbmVudE5hbWVdO1xuXG5cdFx0XHRpZiAodHlwZW9mIGNvbXBvbmVudCAhPT0gJ2Z1bmN0aW9uJykgdGhyb3cgXCJDb21wb25lbnRMb2FkZXI6IHVua25vd24gY29tcG9uZW50ICdcIiArIGNvbXBvbmVudE5hbWUgKyBcIidcIjtcblxuXHRcdFx0dmFyIGluc3RhbmNlID0gbmV3IGNvbXBvbmVudChlbCwgZGF0YSwgdGhpcyk7XG5cblx0XHRcdHRoaXMuaW5pdGlhbGl6ZWRDb21wb25lbnRzW2NvbXBvbmVudElkXSA9IGluc3RhbmNlO1xuXHRcdFx0dGhpcy5udW1iZXJPZkluaXRpYWxpemVkQ29tcG9uZW50cysrO1xuXHRcdH1cblxuXHRcdC8qKlxuICAgKiBDYWxsIGRlc3Ryb3koKSBvbiBhIGNvbXBvbmVudCBpbnN0YW5jZSBhbmQgcmVtb3ZlIGl0IGZyb20gdGhlIGNvbGxlY3Rpb24gb2YgaW5pdGlhbGl6ZWQgY29tcG9uZW50c1xuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gY29tcG9uZW50SWQgLSBVbmlxdWUgY29tcG9uZW50IElEIHVzZWQgdG8gZmluZCBjb21wb25lbnQgaW5zdGFuY2VcbiAgICovXG5cdH0sIHtcblx0XHRrZXk6IFwiX2Rlc3Ryb3lDb21wb25lbnRcIixcblx0XHR2YWx1ZTogZnVuY3Rpb24gX2Rlc3Ryb3lDb21wb25lbnQoY29tcG9uZW50SWQpIHtcblx0XHRcdHZhciBpbnN0YW5jZSA9IHRoaXMuaW5pdGlhbGl6ZWRDb21wb25lbnRzW2NvbXBvbmVudElkXTtcblx0XHRcdGlmIChpbnN0YW5jZSAmJiB0eXBlb2YgaW5zdGFuY2UuZGVzdHJveSA9PT0gJ2Z1bmN0aW9uJykgaW5zdGFuY2UuZGVzdHJveSgpO1xuXG5cdFx0XHQvLyBzYWZlIHRvIGRlbGV0ZSB3aGlsZSBvYmplY3Qga2V5cyB3aGlsZSBsb29waW5naHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8zNDYzMDQ4L2lzLWl0LXNhZmUtdG8tZGVsZXRlLWFuLW9iamVjdC1wcm9wZXJ0eS13aGlsZS1pdGVyYXRpbmctb3Zlci10aGVtXG5cdFx0XHRkZWxldGUgdGhpcy5pbml0aWFsaXplZENvbXBvbmVudHNbY29tcG9uZW50SWRdO1xuXHRcdFx0dGhpcy5udW1iZXJPZkluaXRpYWxpemVkQ29tcG9uZW50cy0tO1xuXHRcdH1cblxuXHRcdC8qKlxuICAgKiBEZXN0cm95IGluYWl0aWFsaXplZCBjb21wb25lbnRzIHRoYXQgbm8gbG9uZ2VyIGFyZSBhY3RpdmVcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtPYmplY3R9IGFjdGl2ZUNvbXBvbmVudHMgLSBBbGwgY29tcG9uZW50SWRzIGN1cnJlbnRseSBmb3VuZCBpbiB0aGUgRE9NXG4gICAqL1xuXHR9LCB7XG5cdFx0a2V5OiBcImNsZWFuVXBfXCIsXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIGNsZWFuVXBfKCkge1xuXHRcdFx0dmFyIF90aGlzNCA9IHRoaXM7XG5cblx0XHRcdHZhciBhY3RpdmVDb21wb25lbnRzID0gYXJndW1lbnRzLmxlbmd0aCA8PSAwIHx8IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8ge30gOiBhcmd1bWVudHNbMF07XG5cblx0XHRcdE9iamVjdC5rZXlzKHRoaXMuaW5pdGlhbGl6ZWRDb21wb25lbnRzKS5mb3JFYWNoKGZ1bmN0aW9uIChjb21wb25lbnRJZCkge1xuXHRcdFx0XHRpZiAoIWFjdGl2ZUNvbXBvbmVudHNbY29tcG9uZW50SWRdKSB7XG5cdFx0XHRcdFx0X3RoaXM0Ll9kZXN0cm95Q29tcG9uZW50KGNvbXBvbmVudElkKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0LyoqXG4gICAqIEdlbmVyYXRlcyBhIHJmYzQxMjIgdmVyc2lvbiA0IGNvbXBsaWFudCB1bmlxdWUgSURcbiAgICogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xMDUwMzQvY3JlYXRlLWd1aWQtdXVpZC1pbi1qYXZhc2NyaXB0XG4gICAqIEBwcml2YXRlXG4gICAqL1xuXHR9LCB7XG5cdFx0a2V5OiBcIl9nZW5lcmF0ZVVVSURcIixcblx0XHR2YWx1ZTogZnVuY3Rpb24gX2dlbmVyYXRlVVVJRCgpIHtcblx0XHRcdHJldHVybiAneHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uIChjKSB7XG5cdFx0XHRcdHZhciByID0gTWF0aC5yYW5kb20oKSAqIDE2IHwgMCxcblx0XHRcdFx0ICAgIHYgPSBjID09ICd4JyA/IHIgOiByICYgMHgzIHwgMHg4O1xuXHRcdFx0XHRyZXR1cm4gdi50b1N0cmluZygxNik7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH1dKTtcblxuXHRyZXR1cm4gQ29tcG9uZW50TG9hZGVyO1xufSkoKTtcblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBDb21wb25lbnRMb2FkZXI7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbXCJkZWZhdWx0XCJdOyIsIi8qKlxuICogQ29tcG9uZW50IEJhc2UgQ2xhc3NcbiAqIFxuICogU2V0cyBhbGwgYXJndW1lbnRzIHBhc3NlZCBpbiB0byBjb25zdHJ1Y3RvciBmcm9tIENvbXBvbmVudExvYWRlclxuICpcbiAqIEV4cG9zZXMgcHViL3N1YiBtZXRob2RzIGZvciB0cmlnZ2VyaW5nIGV2ZW50cyB0byBvdGhlciBjb21wb25lbnRzXG4gKlxuICovXG4ndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHtcblx0dmFsdWU6IHRydWVcbn0pO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gKGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmICgndmFsdWUnIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KSgpO1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvbicpOyB9IH1cblxudmFyIENvbXBvbmVudCA9IChmdW5jdGlvbiAoKSB7XG5cblx0LyoqXG4gICogQ29uc3RydWN0b3IgZm9yIHRoZSBDb21wb25lbnRcbiAgKlxuICAqIENhbGwgYHN1cGVyKC4uLmFyZ3VtZW50cyk7YCBpbiB0aGUgYmFzZSBjbGFzcyBjb25zdHJ1Y3RvclxuICAqXG4gICogQHB1YmxpY1xuICAqIEBwYXJhbSB7Tm9kZX0gY29udGV4dCAtIERPTSBub2RlIHRoYXQgY29udGFpbnMgdGhlIGNvbXBvbmVudCBtYXJrdXBcbiAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIE9wdGlvbmFsIGRhdGEgb2JqZWN0IGZyb20gQ29tcG9uZW50TG9hZGVyLnNjYW4oKVxuICAqIEBwYXJhbSB7T2JqZWN0fSBtZWRpYXRvciAtIGluc3RhbmNlIG9mIENvbXBvbmVudExvYWRlciBmb3IgcHViL3N1YlxuICAqL1xuXG5cdGZ1bmN0aW9uIENvbXBvbmVudCgpIHtcblx0XHRfY2xhc3NDYWxsQ2hlY2sodGhpcywgQ29tcG9uZW50KTtcblxuXHRcdHRoaXMuZWwgPSBhcmd1bWVudHNbMF07XG5cdFx0aWYgKHR5cGVvZiBqUXVlcnkgIT09ICd1bmRlZmluZWQnKSB0aGlzLiRlbCA9IGpRdWVyeSh0aGlzLmVsKTtcblx0XHR0aGlzLmRhdGEgPSBhcmd1bWVudHNbMV07XG5cdFx0dGhpcy5fX21lZGlhdG9yID0gYXJndW1lbnRzWzJdO1xuXHR9XG5cblx0LyoqXG4gICogUHVibGlzaCBhbiBldmVudCBmb3Igb3RoZXIgY29tcG9uZW50c1xuICAqIEBwcm90ZWN0ZWRcbiAgKiBAcGFyYW0ge1N0cmluZ30gdG9waWMgLSBFdmVudCBuYW1lXG4gICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBPcHRpb25hbCBwYXJhbXMgdG8gcGFzcyB3aXRoIHRoZSBldmVudFxuICAqL1xuXG5cdF9jcmVhdGVDbGFzcyhDb21wb25lbnQsIFt7XG5cdFx0a2V5OiAncHVibGlzaCcsXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIHB1Ymxpc2goKSB7XG5cdFx0XHR2YXIgX21lZGlhdG9yO1xuXG5cdFx0XHQoX21lZGlhdG9yID0gdGhpcy5fX21lZGlhdG9yKS5wdWJsaXNoLmFwcGx5KF9tZWRpYXRvciwgYXJndW1lbnRzKTtcblx0XHR9XG5cblx0XHQvKipcbiAgICogU3Vic2NyaWJlIHRvIGFuIGV2ZW50IGZyb20gYW5vdGhlciBjb21wb25lbnRcbiAgICogQHByb3RlY3RlZFxuICAgKiBAcGFyYW0ge1N0cmluZ30gdG9waWMgLSBFdmVudCBuYW1lXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0gRnVuY3Rpb24gdG8gYmluZFxuICAgKi9cblx0fSwge1xuXHRcdGtleTogJ3N1YnNjcmliZScsXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIHN1YnNjcmliZSh0b3BpYywgY2FsbGJhY2spIHtcblx0XHRcdHRoaXMuX19tZWRpYXRvci5zdWJzY3JpYmUodG9waWMsIGNhbGxiYWNrLCB0aGlzKTtcblx0XHR9XG5cblx0XHQvKipcbiAgICogVW5zdWJzY3JpYmUgZnJvbSBhbiBldmVudCBmcm9tIGFub3RoZXIgY29tcG9uZW50XG4gICAqIEBwcm90ZWN0ZWRcbiAgICogQHBhcmFtIHtTdHJpbmd9IHRvcGljIC0gRXZlbnQgbmFtZVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIEZ1bmN0aW9uIHRvIHVuYmluZFxuICAgKi9cblx0fSwge1xuXHRcdGtleTogJ3Vuc3Vic2NyaWJlJyxcblx0XHR2YWx1ZTogZnVuY3Rpb24gdW5zdWJzY3JpYmUodG9waWMsIGNhbGxiYWNrKSB7XG5cdFx0XHR0aGlzLl9fbWVkaWF0b3IudW5zdWJzY3JpYmUodG9waWMsIGNhbGxiYWNrLCB0aGlzKTtcblx0XHR9XG5cblx0XHQvKipcbiAgICogVXRpbGl0eSBtZXRob2QgZm9yIHRyaWdnZXJpbmcgdGhlIENvbXBvbmVudExvYWRlciB0byBzY2FuIHRoZSBtYXJrdXAgZm9yIG5ldyBjb21wb25lbnRzXG4gICAqIEBwcm90ZWN0ZWRcbiAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBPcHRpb25hbCBkYXRhIHRvIHBhc3MgdG8gdGhlIGNvbnN0cnVjdG9yIG9mIGFueSBDb21wb25lbnQgaW5pdGlhbGl6ZWQgYnkgdGhpcyBzY2FuXG4gICAqL1xuXHR9LCB7XG5cdFx0a2V5OiAnc2NhbicsXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIHNjYW4oZGF0YSkge1xuXHRcdFx0dGhpcy5fX21lZGlhdG9yLnNjYW4oZGF0YSk7XG5cdFx0fVxuXG5cdFx0LyoqXG4gICAqIFV0aWxpdHkgbWV0aG9kIGZvciBkZWZlcmluZyBhIGZ1bmN0aW9uIGNhbGxcbiAgICogQHByb3RlY3RlZFxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIEZ1bmN0aW9uIHRvIGNhbGxcbiAgICogQHBhcmFtIHtOdW1iZXJ9IG1zIC0gT3B0aW9uYWwgbXMgdG8gZGVsYXksIGRlZmF1bHRzIHRvIDE3bXMgKGp1c3Qgb3ZlciAxIGZyYW1lIGF0IDYwZnBzKVxuICAgKi9cblx0fSwge1xuXHRcdGtleTogJ2RlZmVyJyxcblx0XHR2YWx1ZTogZnVuY3Rpb24gZGVmZXIoY2FsbGJhY2spIHtcblx0XHRcdHZhciBtcyA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMSB8fCBhcmd1bWVudHNbMV0gPT09IHVuZGVmaW5lZCA/IDE3IDogYXJndW1lbnRzWzFdO1xuXG5cdFx0XHRzZXRUaW1lb3V0KGNhbGxiYWNrLCBtcyk7XG5cdFx0fVxuXG5cdFx0LyoqXG4gICAqIENhbGxlZCBieSBDb21wb25lbnRMb2FkZXIgd2hlbiBjb21wb25lbnQgaXMgbm8gbG9uZ2VyIGZvdW5kIGluIHRoZSBtYXJrdXBcbiAgICogdXN1YWxseSBoYXBwZW5zIGFzIGEgcmVzdWx0IG9mIHJlcGxhY2luZyB0aGUgbWFya3VwIHVzaW5nIEFKQVhcbiAgICpcdFxuICAgKiBPdmVycmlkZSBpbiBzdWJjbGFzcyBhbmQgbWFrZSBzdXJlIHRvIGNsZWFuIHVwIGV2ZW50IGhhbmRsZXJzIGV0Y1xuICAgKlxuICAgKiBAcHJvdGVjdGVkXG4gICAqL1xuXHR9LCB7XG5cdFx0a2V5OiAnZGVzdHJveScsXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIGRlc3Ryb3koKSB7fVxuXHR9XSk7XG5cblx0cmV0dXJuIENvbXBvbmVudDtcbn0pKCk7XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IENvbXBvbmVudDtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIF9jb21wb25lbnRMb2FkZXJKcyA9IHJlcXVpcmUoJy4vY29tcG9uZW50LWxvYWRlci5qcycpO1xuXG52YXIgX2NvbXBvbmVudExvYWRlckpzMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2NvbXBvbmVudExvYWRlckpzKTtcblxudmFyIF9jb21wb25lbnRKcyA9IHJlcXVpcmUoJy4vY29tcG9uZW50LmpzJyk7XG5cbnZhciBfY29tcG9uZW50SnMyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfY29tcG9uZW50SnMpO1xuXG5leHBvcnRzLkNvbXBvbmVudCA9IF9jb21wb25lbnRKczJbJ2RlZmF1bHQnXTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IF9jb21wb25lbnRMb2FkZXJKczJbJ2RlZmF1bHQnXTsiLCIoZnVuY3Rpb24oIGZhY3RvcnkgKSB7XG5cdGlmICh0eXBlb2YgZGVmaW5lICE9PSAndW5kZWZpbmVkJyAmJiBkZWZpbmUuYW1kKSB7XG5cdFx0ZGVmaW5lKFtdLCBmYWN0b3J5KTtcblx0fSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuXHRcdG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuXHR9IGVsc2Uge1xuXHRcdHdpbmRvdy5zY3JvbGxNb25pdG9yID0gZmFjdG9yeSgpO1xuXHR9XG59KShmdW5jdGlvbigpIHtcblxuXHR2YXIgc2Nyb2xsVG9wID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHdpbmRvdy5wYWdlWU9mZnNldCB8fFxuXHRcdFx0KGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCAmJiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wKSB8fFxuXHRcdFx0ZG9jdW1lbnQuYm9keS5zY3JvbGxUb3A7XG5cdH07XG5cblx0dmFyIGV4cG9ydHMgPSB7fTtcblxuXHR2YXIgd2F0Y2hlcnMgPSBbXTtcblxuXHR2YXIgVklTSUJJTElUWUNIQU5HRSA9ICd2aXNpYmlsaXR5Q2hhbmdlJztcblx0dmFyIEVOVEVSVklFV1BPUlQgPSAnZW50ZXJWaWV3cG9ydCc7XG5cdHZhciBGVUxMWUVOVEVSVklFV1BPUlQgPSAnZnVsbHlFbnRlclZpZXdwb3J0Jztcblx0dmFyIEVYSVRWSUVXUE9SVCA9ICdleGl0Vmlld3BvcnQnO1xuXHR2YXIgUEFSVElBTExZRVhJVFZJRVdQT1JUID0gJ3BhcnRpYWxseUV4aXRWaWV3cG9ydCc7XG5cdHZhciBMT0NBVElPTkNIQU5HRSA9ICdsb2NhdGlvbkNoYW5nZSc7XG5cdHZhciBTVEFURUNIQU5HRSA9ICdzdGF0ZUNoYW5nZSc7XG5cblx0dmFyIGV2ZW50VHlwZXMgPSBbXG5cdFx0VklTSUJJTElUWUNIQU5HRSxcblx0XHRFTlRFUlZJRVdQT1JULFxuXHRcdEZVTExZRU5URVJWSUVXUE9SVCxcblx0XHRFWElUVklFV1BPUlQsXG5cdFx0UEFSVElBTExZRVhJVFZJRVdQT1JULFxuXHRcdExPQ0FUSU9OQ0hBTkdFLFxuXHRcdFNUQVRFQ0hBTkdFXG5cdF07XG5cblx0dmFyIGRlZmF1bHRPZmZzZXRzID0ge3RvcDogMCwgYm90dG9tOiAwfTtcblxuXHR2YXIgZ2V0Vmlld3BvcnRIZWlnaHQgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gd2luZG93LmlubmVySGVpZ2h0IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQ7XG5cdH07XG5cblx0dmFyIGdldERvY3VtZW50SGVpZ2h0ID0gZnVuY3Rpb24oKSB7XG5cdFx0Ly8galF1ZXJ5IGFwcHJvYWNoXG5cdFx0Ly8gd2hpY2hldmVyIGlzIGdyZWF0ZXN0XG5cdFx0cmV0dXJuIE1hdGgubWF4KFxuXHRcdFx0ZG9jdW1lbnQuYm9keS5zY3JvbGxIZWlnaHQsIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxIZWlnaHQsXG5cdFx0XHRkb2N1bWVudC5ib2R5Lm9mZnNldEhlaWdodCwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50Lm9mZnNldEhlaWdodCxcblx0XHRcdGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHRcblx0XHQpO1xuXHR9O1xuXG5cdGV4cG9ydHMudmlld3BvcnRUb3AgPSBudWxsO1xuXHRleHBvcnRzLnZpZXdwb3J0Qm90dG9tID0gbnVsbDtcblx0ZXhwb3J0cy5kb2N1bWVudEhlaWdodCA9IG51bGw7XG5cdGV4cG9ydHMudmlld3BvcnRIZWlnaHQgPSBnZXRWaWV3cG9ydEhlaWdodCgpO1xuXG5cdHZhciBwcmV2aW91c0RvY3VtZW50SGVpZ2h0O1xuXHR2YXIgbGF0ZXN0RXZlbnQ7XG5cblx0dmFyIGNhbGN1bGF0ZVZpZXdwb3J0STtcblx0ZnVuY3Rpb24gY2FsY3VsYXRlVmlld3BvcnQoKSB7XG5cdFx0ZXhwb3J0cy52aWV3cG9ydFRvcCA9IHNjcm9sbFRvcCgpO1xuXHRcdGV4cG9ydHMudmlld3BvcnRCb3R0b20gPSBleHBvcnRzLnZpZXdwb3J0VG9wICsgZXhwb3J0cy52aWV3cG9ydEhlaWdodDtcblx0XHRleHBvcnRzLmRvY3VtZW50SGVpZ2h0ID0gZ2V0RG9jdW1lbnRIZWlnaHQoKTtcblx0XHRpZiAoZXhwb3J0cy5kb2N1bWVudEhlaWdodCAhPT0gcHJldmlvdXNEb2N1bWVudEhlaWdodCkge1xuXHRcdFx0Y2FsY3VsYXRlVmlld3BvcnRJID0gd2F0Y2hlcnMubGVuZ3RoO1xuXHRcdFx0d2hpbGUoIGNhbGN1bGF0ZVZpZXdwb3J0SS0tICkge1xuXHRcdFx0XHR3YXRjaGVyc1tjYWxjdWxhdGVWaWV3cG9ydEldLnJlY2FsY3VsYXRlTG9jYXRpb24oKTtcblx0XHRcdH1cblx0XHRcdHByZXZpb3VzRG9jdW1lbnRIZWlnaHQgPSBleHBvcnRzLmRvY3VtZW50SGVpZ2h0O1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIHJlY2FsY3VsYXRlV2F0Y2hMb2NhdGlvbnNBbmRUcmlnZ2VyKCkge1xuXHRcdGV4cG9ydHMudmlld3BvcnRIZWlnaHQgPSBnZXRWaWV3cG9ydEhlaWdodCgpO1xuXHRcdGNhbGN1bGF0ZVZpZXdwb3J0KCk7XG5cdFx0dXBkYXRlQW5kVHJpZ2dlcldhdGNoZXJzKCk7XG5cdH1cblxuXHR2YXIgcmVjYWxjdWxhdGVBbmRUcmlnZ2VyVGltZXI7XG5cdGZ1bmN0aW9uIGRlYm91bmNlZFJlY2FsY3VhdGVBbmRUcmlnZ2VyKCkge1xuXHRcdGNsZWFyVGltZW91dChyZWNhbGN1bGF0ZUFuZFRyaWdnZXJUaW1lcik7XG5cdFx0cmVjYWxjdWxhdGVBbmRUcmlnZ2VyVGltZXIgPSBzZXRUaW1lb3V0KCByZWNhbGN1bGF0ZVdhdGNoTG9jYXRpb25zQW5kVHJpZ2dlciwgMTAwICk7XG5cdH1cblxuXHR2YXIgdXBkYXRlQW5kVHJpZ2dlcldhdGNoZXJzSTtcblx0ZnVuY3Rpb24gdXBkYXRlQW5kVHJpZ2dlcldhdGNoZXJzKCkge1xuXHRcdC8vIHVwZGF0ZSBhbGwgd2F0Y2hlcnMgdGhlbiB0cmlnZ2VyIHRoZSBldmVudHMgc28gb25lIGNhbiByZWx5IG9uIGFub3RoZXIgYmVpbmcgdXAgdG8gZGF0ZS5cblx0XHR1cGRhdGVBbmRUcmlnZ2VyV2F0Y2hlcnNJID0gd2F0Y2hlcnMubGVuZ3RoO1xuXHRcdHdoaWxlKCB1cGRhdGVBbmRUcmlnZ2VyV2F0Y2hlcnNJLS0gKSB7XG5cdFx0XHR3YXRjaGVyc1t1cGRhdGVBbmRUcmlnZ2VyV2F0Y2hlcnNJXS51cGRhdGUoKTtcblx0XHR9XG5cblx0XHR1cGRhdGVBbmRUcmlnZ2VyV2F0Y2hlcnNJID0gd2F0Y2hlcnMubGVuZ3RoO1xuXHRcdHdoaWxlKCB1cGRhdGVBbmRUcmlnZ2VyV2F0Y2hlcnNJLS0gKSB7XG5cdFx0XHR3YXRjaGVyc1t1cGRhdGVBbmRUcmlnZ2VyV2F0Y2hlcnNJXS50cmlnZ2VyQ2FsbGJhY2tzKCk7XG5cdFx0fVxuXG5cdH1cblxuXHRmdW5jdGlvbiBFbGVtZW50V2F0Y2hlciggd2F0Y2hJdGVtLCBvZmZzZXRzICkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblxuXHRcdHRoaXMud2F0Y2hJdGVtID0gd2F0Y2hJdGVtO1xuXG5cdFx0aWYgKCFvZmZzZXRzKSB7XG5cdFx0XHR0aGlzLm9mZnNldHMgPSBkZWZhdWx0T2Zmc2V0cztcblx0XHR9IGVsc2UgaWYgKG9mZnNldHMgPT09ICtvZmZzZXRzKSB7XG5cdFx0XHR0aGlzLm9mZnNldHMgPSB7dG9wOiBvZmZzZXRzLCBib3R0b206IG9mZnNldHN9O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLm9mZnNldHMgPSB7XG5cdFx0XHRcdHRvcDogb2Zmc2V0cy50b3AgfHwgZGVmYXVsdE9mZnNldHMudG9wLFxuXHRcdFx0XHRib3R0b206IG9mZnNldHMuYm90dG9tIHx8IGRlZmF1bHRPZmZzZXRzLmJvdHRvbVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHR0aGlzLmNhbGxiYWNrcyA9IHt9OyAvLyB7Y2FsbGJhY2s6IGZ1bmN0aW9uLCBpc09uZTogdHJ1ZSB9XG5cblx0XHRmb3IgKHZhciBpID0gMCwgaiA9IGV2ZW50VHlwZXMubGVuZ3RoOyBpIDwgajsgaSsrKSB7XG5cdFx0XHRzZWxmLmNhbGxiYWNrc1tldmVudFR5cGVzW2ldXSA9IFtdO1xuXHRcdH1cblxuXHRcdHRoaXMubG9ja2VkID0gZmFsc2U7XG5cblx0XHR2YXIgd2FzSW5WaWV3cG9ydDtcblx0XHR2YXIgd2FzRnVsbHlJblZpZXdwb3J0O1xuXHRcdHZhciB3YXNBYm92ZVZpZXdwb3J0O1xuXHRcdHZhciB3YXNCZWxvd1ZpZXdwb3J0O1xuXG5cdFx0dmFyIGxpc3RlbmVyVG9UcmlnZ2VyTGlzdEk7XG5cdFx0dmFyIGxpc3RlbmVyO1xuXHRcdGZ1bmN0aW9uIHRyaWdnZXJDYWxsYmFja0FycmF5KCBsaXN0ZW5lcnMgKSB7XG5cdFx0XHRpZiAobGlzdGVuZXJzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHRsaXN0ZW5lclRvVHJpZ2dlckxpc3RJID0gbGlzdGVuZXJzLmxlbmd0aDtcblx0XHRcdHdoaWxlKCBsaXN0ZW5lclRvVHJpZ2dlckxpc3RJLS0gKSB7XG5cdFx0XHRcdGxpc3RlbmVyID0gbGlzdGVuZXJzW2xpc3RlbmVyVG9UcmlnZ2VyTGlzdEldO1xuXHRcdFx0XHRsaXN0ZW5lci5jYWxsYmFjay5jYWxsKCBzZWxmLCBsYXRlc3RFdmVudCApO1xuXHRcdFx0XHRpZiAobGlzdGVuZXIuaXNPbmUpIHtcblx0XHRcdFx0XHRsaXN0ZW5lcnMuc3BsaWNlKGxpc3RlbmVyVG9UcmlnZ2VyTGlzdEksIDEpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHRoaXMudHJpZ2dlckNhbGxiYWNrcyA9IGZ1bmN0aW9uIHRyaWdnZXJDYWxsYmFja3MoKSB7XG5cblx0XHRcdGlmICh0aGlzLmlzSW5WaWV3cG9ydCAmJiAhd2FzSW5WaWV3cG9ydCkge1xuXHRcdFx0XHR0cmlnZ2VyQ2FsbGJhY2tBcnJheSggdGhpcy5jYWxsYmFja3NbRU5URVJWSUVXUE9SVF0gKTtcblx0XHRcdH1cblx0XHRcdGlmICh0aGlzLmlzRnVsbHlJblZpZXdwb3J0ICYmICF3YXNGdWxseUluVmlld3BvcnQpIHtcblx0XHRcdFx0dHJpZ2dlckNhbGxiYWNrQXJyYXkoIHRoaXMuY2FsbGJhY2tzW0ZVTExZRU5URVJWSUVXUE9SVF0gKTtcblx0XHRcdH1cblxuXG5cdFx0XHRpZiAodGhpcy5pc0Fib3ZlVmlld3BvcnQgIT09IHdhc0Fib3ZlVmlld3BvcnQgJiZcblx0XHRcdFx0dGhpcy5pc0JlbG93Vmlld3BvcnQgIT09IHdhc0JlbG93Vmlld3BvcnQpIHtcblxuXHRcdFx0XHR0cmlnZ2VyQ2FsbGJhY2tBcnJheSggdGhpcy5jYWxsYmFja3NbVklTSUJJTElUWUNIQU5HRV0gKTtcblxuXHRcdFx0XHQvLyBpZiB5b3Ugc2tpcCBjb21wbGV0ZWx5IHBhc3QgdGhpcyBlbGVtZW50XG5cdFx0XHRcdGlmICghd2FzRnVsbHlJblZpZXdwb3J0ICYmICF0aGlzLmlzRnVsbHlJblZpZXdwb3J0KSB7XG5cdFx0XHRcdFx0dHJpZ2dlckNhbGxiYWNrQXJyYXkoIHRoaXMuY2FsbGJhY2tzW0ZVTExZRU5URVJWSUVXUE9SVF0gKTtcblx0XHRcdFx0XHR0cmlnZ2VyQ2FsbGJhY2tBcnJheSggdGhpcy5jYWxsYmFja3NbUEFSVElBTExZRVhJVFZJRVdQT1JUXSApO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICghd2FzSW5WaWV3cG9ydCAmJiAhdGhpcy5pc0luVmlld3BvcnQpIHtcblx0XHRcdFx0XHR0cmlnZ2VyQ2FsbGJhY2tBcnJheSggdGhpcy5jYWxsYmFja3NbRU5URVJWSUVXUE9SVF0gKTtcblx0XHRcdFx0XHR0cmlnZ2VyQ2FsbGJhY2tBcnJheSggdGhpcy5jYWxsYmFja3NbRVhJVFZJRVdQT1JUXSApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmICghdGhpcy5pc0Z1bGx5SW5WaWV3cG9ydCAmJiB3YXNGdWxseUluVmlld3BvcnQpIHtcblx0XHRcdFx0dHJpZ2dlckNhbGxiYWNrQXJyYXkoIHRoaXMuY2FsbGJhY2tzW1BBUlRJQUxMWUVYSVRWSUVXUE9SVF0gKTtcblx0XHRcdH1cblx0XHRcdGlmICghdGhpcy5pc0luVmlld3BvcnQgJiYgd2FzSW5WaWV3cG9ydCkge1xuXHRcdFx0XHR0cmlnZ2VyQ2FsbGJhY2tBcnJheSggdGhpcy5jYWxsYmFja3NbRVhJVFZJRVdQT1JUXSApO1xuXHRcdFx0fVxuXHRcdFx0aWYgKHRoaXMuaXNJblZpZXdwb3J0ICE9PSB3YXNJblZpZXdwb3J0KSB7XG5cdFx0XHRcdHRyaWdnZXJDYWxsYmFja0FycmF5KCB0aGlzLmNhbGxiYWNrc1tWSVNJQklMSVRZQ0hBTkdFXSApO1xuXHRcdFx0fVxuXHRcdFx0c3dpdGNoKCB0cnVlICkge1xuXHRcdFx0XHRjYXNlIHdhc0luVmlld3BvcnQgIT09IHRoaXMuaXNJblZpZXdwb3J0OlxuXHRcdFx0XHRjYXNlIHdhc0Z1bGx5SW5WaWV3cG9ydCAhPT0gdGhpcy5pc0Z1bGx5SW5WaWV3cG9ydDpcblx0XHRcdFx0Y2FzZSB3YXNBYm92ZVZpZXdwb3J0ICE9PSB0aGlzLmlzQWJvdmVWaWV3cG9ydDpcblx0XHRcdFx0Y2FzZSB3YXNCZWxvd1ZpZXdwb3J0ICE9PSB0aGlzLmlzQmVsb3dWaWV3cG9ydDpcblx0XHRcdFx0XHR0cmlnZ2VyQ2FsbGJhY2tBcnJheSggdGhpcy5jYWxsYmFja3NbU1RBVEVDSEFOR0VdICk7XG5cdFx0XHR9XG5cblx0XHRcdHdhc0luVmlld3BvcnQgPSB0aGlzLmlzSW5WaWV3cG9ydDtcblx0XHRcdHdhc0Z1bGx5SW5WaWV3cG9ydCA9IHRoaXMuaXNGdWxseUluVmlld3BvcnQ7XG5cdFx0XHR3YXNBYm92ZVZpZXdwb3J0ID0gdGhpcy5pc0Fib3ZlVmlld3BvcnQ7XG5cdFx0XHR3YXNCZWxvd1ZpZXdwb3J0ID0gdGhpcy5pc0JlbG93Vmlld3BvcnQ7XG5cblx0XHR9O1xuXG5cdFx0dGhpcy5yZWNhbGN1bGF0ZUxvY2F0aW9uID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAodGhpcy5sb2NrZWQpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0dmFyIHByZXZpb3VzVG9wID0gdGhpcy50b3A7XG5cdFx0XHR2YXIgcHJldmlvdXNCb3R0b20gPSB0aGlzLmJvdHRvbTtcblx0XHRcdGlmICh0aGlzLndhdGNoSXRlbS5ub2RlTmFtZSkgeyAvLyBhIGRvbSBlbGVtZW50XG5cdFx0XHRcdHZhciBjYWNoZWREaXNwbGF5ID0gdGhpcy53YXRjaEl0ZW0uc3R5bGUuZGlzcGxheTtcblx0XHRcdFx0aWYgKGNhY2hlZERpc3BsYXkgPT09ICdub25lJykge1xuXHRcdFx0XHRcdHRoaXMud2F0Y2hJdGVtLnN0eWxlLmRpc3BsYXkgPSAnJztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHZhciBib3VuZGluZ1JlY3QgPSB0aGlzLndhdGNoSXRlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblx0XHRcdFx0dGhpcy50b3AgPSBib3VuZGluZ1JlY3QudG9wICsgZXhwb3J0cy52aWV3cG9ydFRvcDtcblx0XHRcdFx0dGhpcy5ib3R0b20gPSBib3VuZGluZ1JlY3QuYm90dG9tICsgZXhwb3J0cy52aWV3cG9ydFRvcDtcblxuXHRcdFx0XHRpZiAoY2FjaGVkRGlzcGxheSA9PT0gJ25vbmUnKSB7XG5cdFx0XHRcdFx0dGhpcy53YXRjaEl0ZW0uc3R5bGUuZGlzcGxheSA9IGNhY2hlZERpc3BsYXk7XG5cdFx0XHRcdH1cblxuXHRcdFx0fSBlbHNlIGlmICh0aGlzLndhdGNoSXRlbSA9PT0gK3RoaXMud2F0Y2hJdGVtKSB7IC8vIG51bWJlclxuXHRcdFx0XHRpZiAodGhpcy53YXRjaEl0ZW0gPiAwKSB7XG5cdFx0XHRcdFx0dGhpcy50b3AgPSB0aGlzLmJvdHRvbSA9IHRoaXMud2F0Y2hJdGVtO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRoaXMudG9wID0gdGhpcy5ib3R0b20gPSBleHBvcnRzLmRvY3VtZW50SGVpZ2h0IC0gdGhpcy53YXRjaEl0ZW07XG5cdFx0XHRcdH1cblxuXHRcdFx0fSBlbHNlIHsgLy8gYW4gb2JqZWN0IHdpdGggYSB0b3AgYW5kIGJvdHRvbSBwcm9wZXJ0eVxuXHRcdFx0XHR0aGlzLnRvcCA9IHRoaXMud2F0Y2hJdGVtLnRvcDtcblx0XHRcdFx0dGhpcy5ib3R0b20gPSB0aGlzLndhdGNoSXRlbS5ib3R0b207XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMudG9wIC09IHRoaXMub2Zmc2V0cy50b3A7XG5cdFx0XHR0aGlzLmJvdHRvbSArPSB0aGlzLm9mZnNldHMuYm90dG9tO1xuXHRcdFx0dGhpcy5oZWlnaHQgPSB0aGlzLmJvdHRvbSAtIHRoaXMudG9wO1xuXG5cdFx0XHRpZiAoIChwcmV2aW91c1RvcCAhPT0gdW5kZWZpbmVkIHx8IHByZXZpb3VzQm90dG9tICE9PSB1bmRlZmluZWQpICYmICh0aGlzLnRvcCAhPT0gcHJldmlvdXNUb3AgfHwgdGhpcy5ib3R0b20gIT09IHByZXZpb3VzQm90dG9tKSApIHtcblx0XHRcdFx0dHJpZ2dlckNhbGxiYWNrQXJyYXkoIHRoaXMuY2FsbGJhY2tzW0xPQ0FUSU9OQ0hBTkdFXSApO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHR0aGlzLnJlY2FsY3VsYXRlTG9jYXRpb24oKTtcblx0XHR0aGlzLnVwZGF0ZSgpO1xuXG5cdFx0d2FzSW5WaWV3cG9ydCA9IHRoaXMuaXNJblZpZXdwb3J0O1xuXHRcdHdhc0Z1bGx5SW5WaWV3cG9ydCA9IHRoaXMuaXNGdWxseUluVmlld3BvcnQ7XG5cdFx0d2FzQWJvdmVWaWV3cG9ydCA9IHRoaXMuaXNBYm92ZVZpZXdwb3J0O1xuXHRcdHdhc0JlbG93Vmlld3BvcnQgPSB0aGlzLmlzQmVsb3dWaWV3cG9ydDtcblx0fVxuXG5cdEVsZW1lbnRXYXRjaGVyLnByb3RvdHlwZSA9IHtcblx0XHRvbjogZnVuY3Rpb24oIGV2ZW50LCBjYWxsYmFjaywgaXNPbmUgKSB7XG5cblx0XHRcdC8vIHRyaWdnZXIgdGhlIGV2ZW50IGlmIGl0IGFwcGxpZXMgdG8gdGhlIGVsZW1lbnQgcmlnaHQgbm93LlxuXHRcdFx0c3dpdGNoKCB0cnVlICkge1xuXHRcdFx0XHRjYXNlIGV2ZW50ID09PSBWSVNJQklMSVRZQ0hBTkdFICYmICF0aGlzLmlzSW5WaWV3cG9ydCAmJiB0aGlzLmlzQWJvdmVWaWV3cG9ydDpcblx0XHRcdFx0Y2FzZSBldmVudCA9PT0gRU5URVJWSUVXUE9SVCAmJiB0aGlzLmlzSW5WaWV3cG9ydDpcblx0XHRcdFx0Y2FzZSBldmVudCA9PT0gRlVMTFlFTlRFUlZJRVdQT1JUICYmIHRoaXMuaXNGdWxseUluVmlld3BvcnQ6XG5cdFx0XHRcdGNhc2UgZXZlbnQgPT09IEVYSVRWSUVXUE9SVCAmJiB0aGlzLmlzQWJvdmVWaWV3cG9ydCAmJiAhdGhpcy5pc0luVmlld3BvcnQ6XG5cdFx0XHRcdGNhc2UgZXZlbnQgPT09IFBBUlRJQUxMWUVYSVRWSUVXUE9SVCAmJiB0aGlzLmlzQWJvdmVWaWV3cG9ydDpcblx0XHRcdFx0XHRjYWxsYmFjay5jYWxsKCB0aGlzLCBsYXRlc3RFdmVudCApO1xuXHRcdFx0XHRcdGlmIChpc09uZSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0aWYgKHRoaXMuY2FsbGJhY2tzW2V2ZW50XSkge1xuXHRcdFx0XHR0aGlzLmNhbGxiYWNrc1tldmVudF0ucHVzaCh7Y2FsbGJhY2s6IGNhbGxiYWNrLCBpc09uZTogaXNPbmV8fGZhbHNlfSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ1RyaWVkIHRvIGFkZCBhIHNjcm9sbCBtb25pdG9yIGxpc3RlbmVyIG9mIHR5cGUgJytldmVudCsnLiBZb3VyIG9wdGlvbnMgYXJlOiAnK2V2ZW50VHlwZXMuam9pbignLCAnKSk7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRvZmY6IGZ1bmN0aW9uKCBldmVudCwgY2FsbGJhY2sgKSB7XG5cdFx0XHRpZiAodGhpcy5jYWxsYmFja3NbZXZlbnRdKSB7XG5cdFx0XHRcdGZvciAodmFyIGkgPSAwLCBpdGVtOyBpdGVtID0gdGhpcy5jYWxsYmFja3NbZXZlbnRdW2ldOyBpKyspIHtcblx0XHRcdFx0XHRpZiAoaXRlbS5jYWxsYmFjayA9PT0gY2FsbGJhY2spIHtcblx0XHRcdFx0XHRcdHRoaXMuY2FsbGJhY2tzW2V2ZW50XS5zcGxpY2UoaSwgMSk7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcignVHJpZWQgdG8gcmVtb3ZlIGEgc2Nyb2xsIG1vbml0b3IgbGlzdGVuZXIgb2YgdHlwZSAnK2V2ZW50KycuIFlvdXIgb3B0aW9ucyBhcmU6ICcrZXZlbnRUeXBlcy5qb2luKCcsICcpKTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdG9uZTogZnVuY3Rpb24oIGV2ZW50LCBjYWxsYmFjayApIHtcblx0XHRcdHRoaXMub24oIGV2ZW50LCBjYWxsYmFjaywgdHJ1ZSk7XG5cdFx0fSxcblx0XHRyZWNhbGN1bGF0ZVNpemU6IGZ1bmN0aW9uKCkge1xuXHRcdFx0dGhpcy5oZWlnaHQgPSB0aGlzLndhdGNoSXRlbS5vZmZzZXRIZWlnaHQgKyB0aGlzLm9mZnNldHMudG9wICsgdGhpcy5vZmZzZXRzLmJvdHRvbTtcblx0XHRcdHRoaXMuYm90dG9tID0gdGhpcy50b3AgKyB0aGlzLmhlaWdodDtcblx0XHR9LFxuXHRcdHVwZGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0XHR0aGlzLmlzQWJvdmVWaWV3cG9ydCA9IHRoaXMudG9wIDwgZXhwb3J0cy52aWV3cG9ydFRvcDtcblx0XHRcdHRoaXMuaXNCZWxvd1ZpZXdwb3J0ID0gdGhpcy5ib3R0b20gPiBleHBvcnRzLnZpZXdwb3J0Qm90dG9tO1xuXG5cdFx0XHR0aGlzLmlzSW5WaWV3cG9ydCA9ICh0aGlzLnRvcCA8PSBleHBvcnRzLnZpZXdwb3J0Qm90dG9tICYmIHRoaXMuYm90dG9tID49IGV4cG9ydHMudmlld3BvcnRUb3ApO1xuXHRcdFx0dGhpcy5pc0Z1bGx5SW5WaWV3cG9ydCA9ICh0aGlzLnRvcCA+PSBleHBvcnRzLnZpZXdwb3J0VG9wICYmIHRoaXMuYm90dG9tIDw9IGV4cG9ydHMudmlld3BvcnRCb3R0b20pIHx8XG5cdFx0XHRcdFx0XHRcdFx0ICh0aGlzLmlzQWJvdmVWaWV3cG9ydCAmJiB0aGlzLmlzQmVsb3dWaWV3cG9ydCk7XG5cblx0XHR9LFxuXHRcdGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGluZGV4ID0gd2F0Y2hlcnMuaW5kZXhPZih0aGlzKSxcblx0XHRcdFx0c2VsZiAgPSB0aGlzO1xuXHRcdFx0d2F0Y2hlcnMuc3BsaWNlKGluZGV4LCAxKTtcblx0XHRcdGZvciAodmFyIGkgPSAwLCBqID0gZXZlbnRUeXBlcy5sZW5ndGg7IGkgPCBqOyBpKyspIHtcblx0XHRcdFx0c2VsZi5jYWxsYmFja3NbZXZlbnRUeXBlc1tpXV0ubGVuZ3RoID0gMDtcblx0XHRcdH1cblx0XHR9LFxuXHRcdC8vIHByZXZlbnQgcmVjYWxjdWxhdGluZyB0aGUgZWxlbWVudCBsb2NhdGlvblxuXHRcdGxvY2s6IGZ1bmN0aW9uKCkge1xuXHRcdFx0dGhpcy5sb2NrZWQgPSB0cnVlO1xuXHRcdH0sXG5cdFx0dW5sb2NrOiBmdW5jdGlvbigpIHtcblx0XHRcdHRoaXMubG9ja2VkID0gZmFsc2U7XG5cdFx0fVxuXHR9O1xuXG5cdHZhciBldmVudEhhbmRsZXJGYWN0b3J5ID0gZnVuY3Rpb24gKHR5cGUpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24oIGNhbGxiYWNrLCBpc09uZSApIHtcblx0XHRcdHRoaXMub24uY2FsbCh0aGlzLCB0eXBlLCBjYWxsYmFjaywgaXNPbmUpO1xuXHRcdH07XG5cdH07XG5cblx0Zm9yICh2YXIgaSA9IDAsIGogPSBldmVudFR5cGVzLmxlbmd0aDsgaSA8IGo7IGkrKykge1xuXHRcdHZhciB0eXBlID0gIGV2ZW50VHlwZXNbaV07XG5cdFx0RWxlbWVudFdhdGNoZXIucHJvdG90eXBlW3R5cGVdID0gZXZlbnRIYW5kbGVyRmFjdG9yeSh0eXBlKTtcblx0fVxuXG5cdHRyeSB7XG5cdFx0Y2FsY3VsYXRlVmlld3BvcnQoKTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdHRyeSB7XG5cdFx0XHR3aW5kb3cuJChjYWxjdWxhdGVWaWV3cG9ydCk7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJZiB5b3UgbXVzdCBwdXQgc2Nyb2xsTW9uaXRvciBpbiB0aGUgPGhlYWQ+LCB5b3UgbXVzdCB1c2UgalF1ZXJ5LicpO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIHNjcm9sbE1vbml0b3JMaXN0ZW5lcihldmVudCkge1xuXHRcdGxhdGVzdEV2ZW50ID0gZXZlbnQ7XG5cdFx0Y2FsY3VsYXRlVmlld3BvcnQoKTtcblx0XHR1cGRhdGVBbmRUcmlnZ2VyV2F0Y2hlcnMoKTtcblx0fVxuXG5cdGlmICh3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcikge1xuXHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBzY3JvbGxNb25pdG9yTGlzdGVuZXIpO1xuXHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCBkZWJvdW5jZWRSZWNhbGN1YXRlQW5kVHJpZ2dlcik7XG5cdH0gZWxzZSB7XG5cdFx0Ly8gT2xkIElFIHN1cHBvcnRcblx0XHR3aW5kb3cuYXR0YWNoRXZlbnQoJ29uc2Nyb2xsJywgc2Nyb2xsTW9uaXRvckxpc3RlbmVyKTtcblx0XHR3aW5kb3cuYXR0YWNoRXZlbnQoJ29ucmVzaXplJywgZGVib3VuY2VkUmVjYWxjdWF0ZUFuZFRyaWdnZXIpO1xuXHR9XG5cblx0ZXhwb3J0cy5iZWdldCA9IGV4cG9ydHMuY3JlYXRlID0gZnVuY3Rpb24oIGVsZW1lbnQsIG9mZnNldHMgKSB7XG5cdFx0aWYgKHR5cGVvZiBlbGVtZW50ID09PSAnc3RyaW5nJykge1xuXHRcdFx0ZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZWxlbWVudCk7XG5cdFx0fSBlbHNlIGlmIChlbGVtZW50ICYmIGVsZW1lbnQubGVuZ3RoID4gMCkge1xuXHRcdFx0ZWxlbWVudCA9IGVsZW1lbnRbMF07XG5cdFx0fVxuXG5cdFx0dmFyIHdhdGNoZXIgPSBuZXcgRWxlbWVudFdhdGNoZXIoIGVsZW1lbnQsIG9mZnNldHMgKTtcblx0XHR3YXRjaGVycy5wdXNoKHdhdGNoZXIpO1xuXHRcdHdhdGNoZXIudXBkYXRlKCk7XG5cdFx0cmV0dXJuIHdhdGNoZXI7XG5cdH07XG5cblx0ZXhwb3J0cy51cGRhdGUgPSBmdW5jdGlvbigpIHtcblx0XHRsYXRlc3RFdmVudCA9IG51bGw7XG5cdFx0Y2FsY3VsYXRlVmlld3BvcnQoKTtcblx0XHR1cGRhdGVBbmRUcmlnZ2VyV2F0Y2hlcnMoKTtcblx0fTtcblx0ZXhwb3J0cy5yZWNhbGN1bGF0ZUxvY2F0aW9ucyA9IGZ1bmN0aW9uKCkge1xuXHRcdGV4cG9ydHMuZG9jdW1lbnRIZWlnaHQgPSAwO1xuXHRcdGV4cG9ydHMudXBkYXRlKCk7XG5cdH07XG5cblx0cmV0dXJuIGV4cG9ydHM7XG59KTtcbiIsImltcG9ydCB7Q29tcG9uZW50fSBmcm9tICdjb21wb25lbnQtbG9hZGVyLWpzJztcblxuY2xhc3MgRG9raSBleHRlbmRzIENvbXBvbmVudCB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKC4uLmFyZ3VtZW50cyk7XG5cdFx0Y29uc29sZS5sb2coJ25ldyBET0tJIDQwJyk7XG5cdH1cblxuXHRkZXN0cm95KCkge1xuXHRcdHN1cGVyLmRlc3Ryb3koKTtcblx0XHRjb25zb2xlLmxvZygnZGVzdHJveSBET0tJJyk7XG5cdH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgRG9raTsiLCJpbXBvcnQge0NvbXBvbmVudH0gZnJvbSAnY29tcG9uZW50LWxvYWRlci1qcyc7XG5pbXBvcnQgYW5pbWF0aW9uRW5kRXZlbnQgZnJvbSAnLi4vdXRpbHMvYW5pbWF0aW9uLWVuZC1ldmVudCc7XG5pbXBvcnQgc2Nyb2xsU3RhdGUsIHtFVkVOVF9TQ1JPTExfRlJBTUV9IGZyb20gJy4uL3V0aWxzL3Njcm9sbC1zdGF0ZSc7XG5cbi8qKlxuXHRTdGlja3kgTmF2IGNvbXBvbmVudFxuXG5cdExpc3RlbnMgdG8gc2Nyb2xsIGV2ZW50cyBmcm9tIHV0aWxzLlNjcm9sbFN0YXRlXG5cblx0LSBBZGRzIENMQVNTX0xPQ0tFRCB3aGVuIHBhc3NpbmcgTE9DS19USFJFU0hPTERcblx0LSBBZGRzIENMQVNTX0JBQ0tHUk9VTkQgd2hlbiBwYXNzaW5nIF9nZXRCYWNrZ3JvdW5kVGhyZXNob2xkKClcblx0LSBBZGRzIENMQVNTX0hJRERFTiBpZiB2aXNpYmxlIGFuZCBzY3JvbGxpbmcgZG93biB3aXRoIGVub3VnaCBzcGVlZFxuXHQtIEFkZHMgQ0xBU1NfVklTSUJMRSBpZiBzY3JvbGxpbmcgdXAgYW5kIGhpZGRlblxuKi9cblxuXG5jb25zdCBDTEFTU19ISURERU4gPSAnU3RpY2t5TmF2LS1oaWRkZW4nO1xuY29uc3QgQ0xBU1NfVklTSUJMRSA9ICdTdGlja3lOYXYtLXZpc2libGUnO1xuY29uc3QgQ0xBU1NfTE9DS0VEID0gJ1N0aWNreU5hdi0tbG9ja2VkJztcbmNvbnN0IENMQVNTX0JBQ0tHUk9VTkQgPSAnU3RpY2t5TmF2LS1iYWNrZ3JvdW5kJztcblxuLy8gcHggZnJvbSB0b3Agb2YgZG9jdW1lbnQgd2hlcmUgJ2xvY2tlZCcgY2xhc3MgaXMgYWRkZWQgKGluY2x1c2l2ZSlcbmNvbnN0IExPQ0tfVEhSRVNIT0xEID0gMDtcbmNvbnN0IEJHX1RIUkVTSE9MRCA9IDEwMDtcbmNvbnN0IEhJREVfVEhSRVNIT0xEID0gNTAwO1xuXG4vLyBTY3JvbGwgc3BlZWQgcmVxdWlyZWQgdG8gcmV2ZWFsIGhlYWRlciB3aGVuIHNjcm9sbGluZyBiYWNrIHVwXG5jb25zdCBNSU5fU0NST0xMX1NQRUVEID0gNDAwO1xuXG5cbmNsYXNzIFN0aWNreU5hdiBleHRlbmRzIENvbXBvbmVudCB7XG5cblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoLi4uYXJndW1lbnRzKTtcblx0XHR0aGlzLiRkb2N1bWVudCA9ICQoZG9jdW1lbnQpO1xuXHRcdHRoaXMuaXNIaWRkZW4gPSBmYWxzZTtcblx0XHR0aGlzLmlzTG9ja2VkID0gZmFsc2U7XG5cdFx0dGhpcy5oYXNCYWNrZ3JvdW5kID0gZmFsc2U7XG5cdFx0dGhpcy5pc0J1c3lDaGVja2luZyA9IGZhbHNlO1xuXG5cdFx0dGhpcy5vblN0YXRlQ2hhbmdlZCA9IHRoaXMub25TdGF0ZUNoYW5nZWQuYmluZCh0aGlzKTtcblx0XHR0aGlzLmNoZWNrTG9ja1RocmVhc2hvbGQgPSB0aGlzLmNoZWNrTG9ja1RocmVhc2hvbGQuYmluZCh0aGlzKTtcblx0XHR0aGlzLmNoZWNrQXBwZWFyYW5jZSA9IHRoaXMuY2hlY2tBcHBlYXJhbmNlLmJpbmQodGhpcyk7XG5cblx0XHR0aGlzLmluaXQoKTtcblxuXHRcdHRoaXMuZGVmZXIoKCkgPT4ge1xuXHRcdFx0Ly8gcGF1c2UgYW5kIHdhaXQgZm9yIEhlcm8gY29tcG9uZW50IHRvIGJlIGluaXRpYWxpemVkIGZpcnN0XG5cdFx0XHR0aGlzLiRlbC5jc3MoJ3Zpc2liaWxpdHknLCAndmlzaWJsZScpO1xuXHRcdH0pO1xuXHR9XG5cblxuXHRpbml0KCkge1xuXHRcdHNjcm9sbFN0YXRlLnN1YnNjcmliZShFVkVOVF9TQ1JPTExfRlJBTUUsIHRoaXMub25TdGF0ZUNoYW5nZWQpO1xuXHRcdC8vIHRoaXMuc3Vic2NyaWJlKEFDVElPTl9TVElDS1lfTkFWX1NIT1dfQkFDS0dST1VORCwgdGhpcy5hZGRCYWNrZ3JvdW5kKTtcblx0XHQvLyB0aGlzLnN1YnNjcmliZShBQ1RJT05fU1RJQ0tZX05BVl9ISURFX0JBQ0tHUk9VTkQsIHRoaXMucmVtb3ZlQmFja2dyb3VuZCk7XG5cdH1cblxuXG5cdG9uU3RhdGVDaGFuZ2VkKHN0YXRlKSB7XG5cdFx0aWYgKCF0aGlzLmlzQnVzeUNoZWNraW5nKSB7XG5cdFx0XHR0aGlzLmlzQnVzeUNoZWNraW5nID0gdHJ1ZTtcblx0XHRcdHRoaXMuY2hlY2tMb2NrVGhyZWFzaG9sZChzdGF0ZSk7XG5cdFx0XHR0aGlzLmNoZWNrQmFja2dyb3VuZFRocmVhc2hvbGQoc3RhdGUpO1xuXHRcdFx0dGhpcy5jaGVja0FwcGVhcmFuY2Uoc3RhdGUpO1xuXHRcdFx0dGhpcy5pc0J1c3lDaGVja2luZyA9IGZhbHNlO1xuXHRcdH1cblx0fVxuXG5cblx0X2dldEJhY2tncm91bmRUaHJlc2hvbGQoKSB7XG5cdFx0cmV0dXJuIEJHX1RIUkVTSE9MRCArIDE7IC8vIHdhaXQgdW50aWwgcGFzc2luZyB0aHJlYXNob2xkXG5cdH1cblxuXG5cdHNob3coKSB7XG5cdFx0aWYgKHRoaXMuaXNIaWRkZW4pIHtcblx0XHRcdHRoaXMuJGVsLmFkZENsYXNzKENMQVNTX1ZJU0lCTEUpLnJlbW92ZUNsYXNzKENMQVNTX0hJRERFTik7XG5cdFx0XHR0aGlzLmlzSGlkZGVuID0gZmFsc2U7XG5cdFx0XHR0aGlzLiRlbC5vbmUoYW5pbWF0aW9uRW5kRXZlbnQsICgpID0+IHtcblx0XHRcdFx0dGhpcy4kZWwucmVtb3ZlQ2xhc3MoQ0xBU1NfVklTSUJMRSk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH1cblxuXG5cdGhpZGUoKSB7XG5cdFx0aWYgKCF0aGlzLmlzSGlkZGVuKSB7XG5cdFx0XHRjb25zb2xlLmxvZygnaGlkZSEnKTtcblx0XHRcdHRoaXMuJGVsLmFkZENsYXNzKENMQVNTX0hJRERFTikucmVtb3ZlQ2xhc3MoQ0xBU1NfVklTSUJMRSk7XG5cdFx0XHR0aGlzLmlzSGlkZGVuID0gdHJ1ZTtcblx0XHR9XG5cdH1cblxuXG5cdGxvY2soKSB7XG5cdFx0aWYgKCF0aGlzLmlzTG9ja2VkKSB7XG5cdFx0XHR0aGlzLiRlbC5hZGRDbGFzcyhDTEFTU19MT0NLRUQpXG5cdFx0XHR0aGlzLmlzTG9ja2VkID0gdHJ1ZTtcblx0XHR9XG5cdH1cblxuXG5cdHVubG9jaygpIHtcblx0XHRpZiAodGhpcy5pc0xvY2tlZCkge1xuXHRcdFx0dGhpcy4kZWwucmVtb3ZlQ2xhc3MoQ0xBU1NfTE9DS0VEKVxuXHRcdFx0dGhpcy5pc0xvY2tlZCA9IGZhbHNlO1xuXHRcdH1cblx0fVxuXG5cblx0YWRkQmFja2dyb3VuZCgpIHtcblx0XHRpZiAoIXRoaXMuaGFzQmFja2dyb3VuZCkge1xuXHRcdFx0dGhpcy4kZWwuYWRkQ2xhc3MoQ0xBU1NfQkFDS0dST1VORClcblx0XHRcdHRoaXMuaGFzQmFja2dyb3VuZCA9IHRydWU7XG5cdFx0fVxuXHR9XG5cblxuXHRyZW1vdmVCYWNrZ3JvdW5kKCkge1xuXHRcdGlmICh0aGlzLmhhc0JhY2tncm91bmQpIHtcblx0XHRcdHRoaXMuJGVsLnJlbW92ZUNsYXNzKENMQVNTX0JBQ0tHUk9VTkQpXG5cdFx0XHR0aGlzLmhhc0JhY2tncm91bmQgPSBmYWxzZTtcblx0XHR9XG5cdH1cblxuXG5cdGlzQWJvdmVWaXNpYmxlVGhyZXNob2xkKHN0YXRlKSB7XG5cdFx0cmV0dXJuIHN0YXRlLnZpZXdwb3J0VG9wIDw9IEhJREVfVEhSRVNIT0xEO1xuXHR9XG5cblxuXHRjaGVja0xvY2tUaHJlYXNob2xkKHN0YXRlKSB7XG5cdFx0aWYgKHN0YXRlLnZpZXdwb3J0VG9wID49IExPQ0tfVEhSRVNIT0xEKSB7XG5cdFx0XHR0aGlzLmxvY2soKTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHR0aGlzLnVubG9jaygpO1xuXHRcdH1cblx0fVxuXG5cblx0Y2hlY2tCYWNrZ3JvdW5kVGhyZWFzaG9sZChzdGF0ZSkge1xuXHRcdGlmIChzdGF0ZS52aWV3cG9ydFRvcCA+PSB0aGlzLl9nZXRCYWNrZ3JvdW5kVGhyZXNob2xkKCkpIHtcblx0XHRcdHRoaXMuYWRkQmFja2dyb3VuZCgpO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHRoaXMucmVtb3ZlQmFja2dyb3VuZCgpO1xuXHRcdH1cblx0fVxuXG5cblx0Y2hlY2tBcHBlYXJhbmNlKHN0YXRlKSB7XG5cdFx0Ly8gc2Nyb2xsZWQgdG8gdGhlIHZlcnkgdG9wIG9yIGJvdHRvbTsgZWxlbWVudCBzbGlkZXMgaW5cblx0XHRpZiAodGhpcy5pc0Fib3ZlVmlzaWJsZVRocmVzaG9sZChzdGF0ZSkgfHwgc3RhdGUuaXNTY3JvbGxlZFRvQm90dG9tKSB7XG5cdFx0XHR0aGlzLnNob3coKTtcblx0XHR9XG5cdFx0ZWxzZSBpZiAoc3RhdGUuaXNTY3JvbGxpbmdEb3duKSB7XG5cdFx0XHR0aGlzLmhpZGUoKTtcblx0XHR9XG5cdFx0Ly8gZWxzZSBpZiBzY3JvbGxpbmcgdXAgd2l0aCBlbm91Z2ggc3BlZWRcblx0XHRlbHNlIGlmIChzdGF0ZS5zY3JvbGxTcGVlZCA+IE1JTl9TQ1JPTExfU1BFRUQpIHtcblx0XHRcdHRoaXMuc2hvdygpO1xuXHRcdH1cblx0fVxuXG5cblx0ZGVzdHJveSgpIHtcblx0XHR0aGlzLnNob3coKTtcblx0XHRzY3JvbGxTdGF0ZS51bnN1YnNjcmliZShFVkVOVF9TQ1JPTExfRlJBTUUsIHRoaXMub25TdGF0ZUNoYW5nZWQpO1xuXHRcdC8vIHRoaXMudW5zdWJzY3JpYmUoQUNUSU9OX1NUSUNLWV9OQVZfU0hPV19CQUNLR1JPVU5ELCB0aGlzLmFkZEJhY2tncm91bmQpO1xuXHRcdC8vIHRoaXMudW5zdWJzY3JpYmUoQUNUSU9OX1NUSUNLWV9OQVZfSElERV9CQUNLR1JPVU5ELCB0aGlzLnJlbW92ZUJhY2tncm91bmQpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gU3RpY2t5TmF2O1xuIiwiLy8gaW1wb3J0ICdiYWJlbC1wb2x5ZmlsbCc7XG5cbmltcG9ydCBDb21wb25lbnRMb2FkZXIgZnJvbSAnY29tcG9uZW50LWxvYWRlci1qcyc7XG5cbmltcG9ydCBEb2tpIGZyb20gJy4vY29tcG9uZW50cy9kb2tpJztcbmltcG9ydCBTdGlja3lOYXYgZnJvbSAnLi9jb21wb25lbnRzL3N0aWNreS1uYXYnO1xuXG5cbm5ldyBDb21wb25lbnRMb2FkZXIoe1xuXHREb2tpLFxuXHRTdGlja3lOYXZcbn0pLnNjYW4oKTtcblxuIiwiLypcblx0UmV0dXJucyB0aGUgYnJvd3NlciBwcmVmaXhlZFxuXHRzdHJpbmcgZm9yIHRoZSBhbmltYXRpb24gZW5kIGV2ZW50XG4qL1xuZXhwb3J0IGRlZmF1bHQgKCgpID0+IHtcblx0bGV0IHQgPSB1bmRlZmluZWQ7XG5cdGxldCBldmVudE5hbWU7XG5cdGNvbnN0IGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cdGNvbnN0IGFuaW1hdGlvbk5hbWVzID0ge1xuXHRcdCdXZWJraXRBbmltYXRpb24nOiAnd2Via2l0QW5pbWF0aW9uRW5kJyxcblx0XHQnTW96QW5pbWF0aW9uJzogJ2FuaW1hdGlvbmVuZCcsXG5cdFx0J09BbmltYXRpb24nOiAnb0FuaW1hdGlvbkVuZCBvYW5pbWF0aW9uZW5kJyxcblx0XHQnYW5pbWF0aW9uJzogJ2FuaW1hdGlvbmVuZCdcblx0fTtcblx0T2JqZWN0LmtleXMoYW5pbWF0aW9uTmFtZXMpLmZvckVhY2goICh0KSA9PiB7XG5cdFx0aWYgKGVsLnN0eWxlW3RdICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdGV2ZW50TmFtZSA9IGFuaW1hdGlvbk5hbWVzW3RdO1xuXHRcdH1cblx0fSk7XG5cdHJldHVybiBldmVudE5hbWU7XG59KSgpO1xuIiwiZXhwb3J0IGRlZmF1bHQgKGZ1bmMsIHRocmVzaG9sZCwgZXhlY0FzYXApID0+IHtcblx0bGV0IHRpbWVvdXQ7XG5cblx0cmV0dXJuICgpID0+IHtcblx0XHRsZXQgb2JqID0gdGhpcywgYXJncyA9IGFyZ3VtZW50cztcblxuXHRcdGxldCBkZWxheWVkID0gKCkgPT4ge1xuXHRcdFx0aWYgKCFleGVjQXNhcCkge1xuXHRcdFx0XHRmdW5jLmFwcGx5KG9iaiwgYXJncyk7XG5cdFx0XHR9XG5cdFx0XHR0aW1lb3V0ID0gbnVsbDtcblx0XHR9XG5cblx0XHRpZiAodGltZW91dCkge1xuXHRcdFx0Y2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuXHRcdH0gZWxzZSBpZiAoZXhlY0FzYXApIHtcblx0XHRcdGZ1bmMuYXBwbHkob2JqLCBhcmdzKTtcblx0XHR9XG5cblx0XHR0aW1lb3V0ID0gc2V0VGltZW91dChkZWxheWVkLCB0aHJlc2hvbGQgfHwgMTAwKTtcblx0fVxufSIsImltcG9ydCBkZWJvdW5jZSBmcm9tICcuL2RlYm91bmNlJztcbmltcG9ydCBzY3JvbGxNb25pdG9yIGZyb20gJ3Njcm9sbE1vbml0b3InO1xuXG4vKipcbiAqIFNjcm9sbCBTdGF0ZSBBYnN0cmFjdGlvblxuICpcbiAqIEhvbGRzIGluZm8gYWJvdXQgc2Nyb2xsIHBvc2l0aW9uLCBzcGVlZCwgZGlyZWN0aW9uLCBkb2N1bWVudCAvIHZpZXdwb3J0IHNpemUsIGV0Y1xuICpcbiAqIFRyaWdnZXJzIGV2ZW50cyBmb3JcbiAqICAgLSBTY3JvbGwgU3RhcnRcbiAqICAgLSBTY3JvbGwgU3RvcFxuICogICAtIEVhY2ggc2Nyb2xsIGZyYW1lIHdoaWxlIHNjcm9sbGluZ1xuICovXG5jb25zdCAkZG9jdW1lbnQgPSAkKGRvY3VtZW50KTtcbmNvbnN0ICR3aW5kb3cgPSAkKHdpbmRvdyk7XG5cbmV4cG9ydCBjb25zdCBFVkVOVF9TQ1JPTExfU1RBUlQgPSAnc2Nyb2xsc3RhdGU6c3RhcnQnO1xuZXhwb3J0IGNvbnN0IEVWRU5UX1NDUk9MTF9TVE9QICA9ICdzY3JvbGxzdGF0ZTpzdG9wJztcbmV4cG9ydCBjb25zdCBFVkVOVF9TQ1JPTExfRlJBTUUgPSAnc2Nyb2xsc3RhdGU6ZnJhbWUnO1xuXG5jbGFzcyBTY3JvbGxTdGF0ZSB7XG5cblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0dGhpcy51cGRhdGluZyAgPSBmYWxzZTtcblx0XHR0aGlzLmxhdGVzdEZyYW1lID0gRGF0ZS5ub3coKTtcblxuXHRcdHRoaXMuc2Nyb2xsRGlmZiAgICAgICAgICA9IDA7ICAvLyBkZWx0YSBmcm9tIGxhc3Qgc2Nyb2xsIHBvc2l0aW9uXG5cdFx0dGhpcy5zY3JvbGxEaXN0YW5jZSAgICAgID0gMDsgIC8vIGFic29sdXRlIGRlbHRhXG5cdFx0dGhpcy5zY3JvbGxEaXJlY3Rpb24gICAgID0gMDsgIC8vIC0xLCAwLCBvciAxXG5cdFx0dGhpcy5tc1NpbmNlTGF0ZXN0Q2hhbmdlID0gMDtcblx0XHR0aGlzLnNjcm9sbFNwZWVkICAgICAgICAgPSAwOyAgLy8gcGl4ZWxzIC8gc2Vjb25kIGZvciBsYXRlc3QgZnJhbWVcblx0XHR0aGlzLmRvY3VtZW50SGVpZ2h0ICAgICAgPSB1bmRlZmluZWQ7XG5cdFx0dGhpcy52aWV3cG9ydEhlaWdodCAgICAgID0gdW5kZWZpbmVkO1xuXHRcdHRoaXMudmlld3BvcnRUb3AgICAgICAgICA9IDA7XG5cdFx0dGhpcy52aWV3cG9ydEJvdHRvbSAgICAgID0gdW5kZWZpbmVkO1xuXHRcdHRoaXMuaXNTY3JvbGxpbmdVcCAgICAgICA9IHVuZGVmaW5lZDtcblx0XHR0aGlzLmlzU2Nyb2xsaW5nRG93biAgICAgPSB1bmRlZmluZWQ7XG5cdFx0dGhpcy5pc1Njcm9sbGVkVG9Ub3AgICAgID0gdW5kZWZpbmVkO1xuXHRcdHRoaXMuaXNTY3JvbGxlZFRvQm90dG9tICA9IHVuZGVmaW5lZDtcblxuXHRcdHRoaXMuY2FsbGJhY2tzID0ge307XG5cblx0XHR0aGlzLnVwZGF0ZVN0YXRlKCk7XG5cdFx0dGhpcy5vblNjcm9sbFN0YXJ0RGVib3VuY2VkID0gZGVib3VuY2UodGhpcy5fb25TY3JvbGxTdGFydC5iaW5kKHRoaXMpLCA1MDAsIHRydWUpO1xuXHRcdHRoaXMub25TY3JvbGxTdG9wRGVib3VuY2VkID0gZGVib3VuY2UodGhpcy5fb25TY3JvbGxTdG9wLmJpbmQodGhpcyksIDUwMCk7XG5cblx0XHR0aGlzLl9hZGRFdmVudExpc3RlbmVycygpO1xuXHR9XG5cblx0LyoqXG5cdCAqIE1lZGlhdG9yIGZ1bmN0aW9uYWxpdHkuXG5cdCAqIFN0b3JlcyB0aGUgZXZlbnQgYW5kIGNhbGxiYWNrIGdpdmVuIGJ5IHRoZSBjb21wb25lbnQuXG5cdCAqIGZvciBmdXJ0aGVyIHJlZmVyZW5jZS5cblx0ICogQHBhcmFtICB7U3RyaW5nfSBldmVudCAgICAgIGV2ZW50IHN0cmluZ1xuXHQgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY2FsbGJhY2sgQ2FsbGJhY2sgZnVuY3Rpb24gdGhhdCB3b3VsZCBiZSB0cmlnZ2VyZWQuXG5cdCAqL1xuXHRzdWJzY3JpYmUoZXZlbnQsIGNhbGxiYWNrLCBjb250ZXh0KSB7XG5cblx0XHQvLyBJcyB0aGlzIGEgbmV3IGV2ZW50P1xuXHRcdGlmICggIXRoaXMuY2FsbGJhY2tzLmhhc093blByb3BlcnR5KGV2ZW50KSApIHtcblx0XHRcdHRoaXMuY2FsbGJhY2tzW2V2ZW50XSA9IFtdO1xuXHRcdH1cblxuXHRcdC8vIFN0b3JlIHRoZSBzdWJzY3JpYmVyIGNhbGxiYWNrXG5cdFx0dGhpcy5jYWxsYmFja3NbZXZlbnRdLnB1c2goIHsgY29udGV4dDogY29udGV4dCwgY2FsbGJhY2s6IGNhbGxiYWNrIH0gKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIE1lZGlhdG9yIGZ1bmN0aW9uYWxpdHkuXG5cdCAqIFJlbW92ZXMgdGhlIHN0b3JlZCBldmVudCBhbmQgY2FsbGJhY2sgZ2l2ZW4gYnkgdGhlIGNvbXBvbmVudC5cblx0ICogQHBhcmFtICB7U3RyaW5nfSAgIGV2ZW50ICAgIGV2ZW50IHN0cmluZ1xuXHQgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY2FsbGJhY2sgQ2FsbGJhY2sgZnVuY3Rpb24gdGhhdCB3b3VsZCBiZSB0cmlnZ2VyZWQuXG5cdCAqIEByZXR1cm4ge0Jvb2xlYW59ICAgICAgICAgICAgVHJ1ZSBvbiBzdWNjZXNzLCBGYWxzZSBvdGhlcndpc2UuXG5cdCAqL1xuXHR1bnN1YnNjcmliZShldmVudCwgY2FsbGJhY2spIHtcblx0XHQvLyBEbyB3ZSBoYXZlIHRoaXMgZXZlbnQ/XG5cdFx0aWYgKCF0aGlzLmNhbGxiYWNrcy5oYXNPd25Qcm9wZXJ0eShldmVudCkpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBGaW5kIG91dCB3aGVyZSB0aGlzIGlzIGFuZCByZW1vdmUgaXRcblx0XHRmb3IgKGxldCBpID0gMCwgbGVuID0gdGhpcy5jYWxsYmFja3NbZXZlbnRdLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRpZiAodGhpcy5jYWxsYmFja3NbZXZlbnRdW2ldLmNhbGxiYWNrID09PSBjYWxsYmFjaykge1xuXHRcdFx0XHR0aGlzLmNhbGxiYWNrc1tldmVudF0uc3BsaWNlKGksIDEpO1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHQvKipcblx0ICogW3B1Ymxpc2ggZGVzY3JpcHRpb25dXG5cdCAqIEBwYXJhbSAge1t0eXBlXX0gZXZlbnQgW2Rlc2NyaXB0aW9uXVxuXHQgKiBAcmV0dXJuIHtbdHlwZV19ICAgICAgIFtkZXNjcmlwdGlvbl1cblx0ICovXG5cdF9wdWJsaXNoKGV2ZW50KSB7XG5cdFx0Ly8gQ2hlY2sgaWYgd2UgaGF2ZSBzdWJjcmliZXJzIHRvIHRoaXMgZXZlbnRcblx0XHRpZiAoIXRoaXMuY2FsbGJhY2tzLmhhc093blByb3BlcnR5KGV2ZW50KSkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdC8vIGRvbid0IHNsaWNlIG9uIGFyZ3VtZW50cyBiZWNhdXNlIGl0IHByZXZlbnRzIG9wdGltaXphdGlvbnMgaW4gSmF2YVNjcmlwdCBlbmdpbmVzIChWOCBmb3IgZXhhbXBsZSlcblx0XHQvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9GdW5jdGlvbnMvYXJndW1lbnRzXG5cdFx0Ly8gaHR0cHM6Ly9naXRodWIuY29tL3BldGthYW50b25vdi9ibHVlYmlyZC93aWtpL09wdGltaXphdGlvbi1raWxsZXJzIzMyLWxlYWtpbmctYXJndW1lbnRzXG5cdFx0Y29uc3QgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgKytpKSB7XG5cdFx0XHRcdGFyZ3NbaV0gPSBhcmd1bWVudHNbaSArIDFdOyAvLyByZW1vdmUgZmlyc3QgYXJndW1lbnRcblx0XHR9XG5cblx0XHQvLyBMb29wIHRocm91Z2ggdGhlbSBhbmQgZmlyZSB0aGUgY2FsbGJhY2tzXG5cdFx0Zm9yIChsZXQgaSA9IDAsIGxlbiA9IHRoaXMuY2FsbGJhY2tzW2V2ZW50XS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0bGV0IHN1YnNjcmlwdGlvbiA9IHRoaXMuY2FsbGJhY2tzW2V2ZW50XVtpXTtcblx0XHRcdC8vIENhbGwgaXQncyBjYWxsYmFja1xuXHRcdFx0aWYgKHN1YnNjcmlwdGlvbi5jYWxsYmFjaykge1xuXHRcdFx0XHRzdWJzY3JpcHRpb24uY2FsbGJhY2suYXBwbHkoc3Vic2NyaXB0aW9uLmNvbnRleHQsIGFyZ3MpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cblx0ZGVzdHJveSgpIHtcblx0XHR0aGlzLl9yZW1vdmVFdmVudExpc3RlbmVycygpO1xuXHR9XG5cblx0X2FkZEV2ZW50TGlzdGVuZXJzKCkge1xuXHRcdCR3aW5kb3cub24oJ3Njcm9sbCcsIHRoaXMub25TY3JvbGxTdGFydERlYm91bmNlZCk7XG5cdFx0JHdpbmRvdy5vbignc2Nyb2xsJywgdGhpcy5vblNjcm9sbFN0b3BEZWJvdW5jZWQpO1xuXHRcdCR3aW5kb3cub24oJ3Njcm9sbCcsIHRoaXMudXBkYXRlU3RhdGUuYmluZCh0aGlzKSk7XG5cdH1cblxuXHRfcmVtb3ZlRXZlbnRMaXN0ZW5lcnMoKSB7XG5cdFx0JHdpbmRvdy5vZmYoJ3Njcm9sbCcsIHRoaXMub25TY3JvbGxTdGFydERlYm91bmNlZCk7XG5cdFx0JHdpbmRvdy5vZmYoJ3Njcm9sbCcsIHRoaXMub25TY3JvbGxTdG9wRGVib3VuY2VkKTtcblx0XHQkd2luZG93Lm9mZignc2Nyb2xsJywgdGhpcy51cGRhdGVTdGF0ZS51bmJpbmQodGhpcykpO1xuXHR9XG5cblx0X29uU2Nyb2xsU3RhcnQoKSB7XG5cdFx0dGhpcy5fcHVibGlzaChFVkVOVF9TQ1JPTExfU1RBUlQsIHRoaXMpO1xuXHR9XG5cblx0X29uU2Nyb2xsU3RvcCgpIHtcblx0XHR0aGlzLl9wdWJsaXNoKEVWRU5UX1NDUk9MTF9TVE9QLCB0aGlzKTtcblx0fVxuXG5cdHVwZGF0ZVN0YXRlKCkge1xuXHRcdGlmICh0aGlzLnVwZGF0aW5nKSByZXR1cm47XG5cdFx0dGhpcy51cGRhdGluZyA9IHRydWU7XG5cblx0XHR2YXIgbm93ID0gRGF0ZS5ub3coKTtcblxuXHRcdC8vIGRpc3RhbmNlIGFuZCBzcGVlZCBjYWxjc1xuXHRcdHRoaXMuc2Nyb2xsRGlmZiAgPSB0aGlzLnZpZXdwb3J0VG9wIC0gc2Nyb2xsTW9uaXRvci52aWV3cG9ydFRvcDtcblx0XHR0aGlzLnNjcm9sbERpc3RhbmNlICA9IE1hdGguYWJzKHRoaXMuc2Nyb2xsRGlmZik7XG5cdFx0dGhpcy5zY3JvbGxEaXJlY3Rpb24gPSBNYXRoLm1heCgtMSwgTWF0aC5taW4oMSwgdGhpcy5zY3JvbGxEaWZmKSk7XG5cdFx0dGhpcy5tc1NpbmNlTGF0ZXN0Q2hhbmdlID0gKG5vdyAtIHRoaXMubGF0ZXN0RnJhbWUpO1xuXHRcdHRoaXMuc2Nyb2xsU3BlZWQgPSB0aGlzLnNjcm9sbERpc3RhbmNlIC8gdGhpcy5tc1NpbmNlTGF0ZXN0Q2hhbmdlICogMTAwMDtcblxuXHRcdC8vIHZpZXdwb3J0XG5cdFx0dGhpcy5kb2N1bWVudEhlaWdodCA9IHNjcm9sbE1vbml0b3IuZG9jdW1lbnRIZWlnaHQ7XG5cdFx0dGhpcy52aWV3cG9ydEhlaWdodCA9IHNjcm9sbE1vbml0b3Iudmlld3BvcnRIZWlnaHQ7XG5cdFx0dGhpcy52aWV3cG9ydFRvcCAgICA9IHNjcm9sbE1vbml0b3Iudmlld3BvcnRUb3A7XG5cdFx0dGhpcy52aWV3cG9ydEJvdHRvbSA9IHNjcm9sbE1vbml0b3Iudmlld3BvcnRCb3R0b207XG5cblx0XHQvLyBoZWxwZXJzXG5cdFx0dGhpcy5pc1Njcm9sbGluZ1VwID0gdGhpcy5zY3JvbGxEaXJlY3Rpb24gPiAwO1xuXHRcdHRoaXMuaXNTY3JvbGxpbmdEb3duID0gdGhpcy5zY3JvbGxEaXJlY3Rpb24gPCAwO1xuXHRcdHRoaXMuaXNTY3JvbGxlZFRvVG9wID0gdGhpcy52aWV3cG9ydFRvcCA8PSAwO1xuXHRcdHRoaXMuaXNTY3JvbGxlZFRvQm90dG9tID0gdGhpcy52aWV3cG9ydEJvdHRvbSA+PSB0aGlzLmRvY3VtZW50SGVpZ2h0O1xuXG5cdFx0dGhpcy5sYXRlc3RGcmFtZSA9IG5vdztcblxuXHRcdHRoaXMuX3B1Ymxpc2goRVZFTlRfU0NST0xMX0ZSQU1FLCB0aGlzKTtcblxuXHRcdHRoaXMudXBkYXRpbmcgPSBmYWxzZTtcblx0fVxufVxuXG5leHBvcnQgZGVmYXVsdCBuZXcgU2Nyb2xsU3RhdGUoKVxuIl19
