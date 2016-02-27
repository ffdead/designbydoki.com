import debounce from './debounce';
import scrollMonitor from 'scrollMonitor';

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
const $document = $(document);
const $window = $(window);

export const EVENT_SCROLL_START = 'scrollstate:start';
export const EVENT_SCROLL_STOP  = 'scrollstate:stop';
export const EVENT_SCROLL_FRAME = 'scrollstate:frame';

class ScrollState {

	constructor() {
		this.updating  = false;
		this.latestFrame = Date.now();

		this.scrollDiff          = 0;  // delta from last scroll position
		this.scrollDistance      = 0;  // absolute delta
		this.scrollDirection     = 0;  // -1, 0, or 1
		this.msSinceLatestChange = 0;
		this.scrollSpeed         = 0;  // pixels / second for latest frame
		this.documentHeight      = undefined;
		this.viewportHeight      = undefined;
		this.viewportTop         = 0;
		this.viewportBottom      = undefined;
		this.isScrollingUp       = undefined;
		this.isScrollingDown     = undefined;
		this.isScrolledToTop     = undefined;
		this.isScrolledToBottom  = undefined;

		this.callbacks = {};

		this.updateState();
		this.onScrollStartDebounced = debounce(this._onScrollStart.bind(this), 500, true);
		this.onScrollStopDebounced = debounce(this._onScrollStop.bind(this), 500);

		this._addEventListeners();
	}

	/**
	 * Mediator functionality.
	 * Stores the event and callback given by the component.
	 * for further reference.
	 * @param  {String} event      event string
	 * @param  {Function} callback Callback function that would be triggered.
	 */
	subscribe(event, callback, context) {

		// Is this a new event?
		if ( !this.callbacks.hasOwnProperty(event) ) {
			this.callbacks[event] = [];
		}

		// Store the subscriber callback
		this.callbacks[event].push( { context: context, callback: callback } );

	}

	/**
	 * Mediator functionality.
	 * Removes the stored event and callback given by the component.
	 * @param  {String}   event    event string
	 * @param  {Function} callback Callback function that would be triggered.
	 * @return {Boolean}            True on success, False otherwise.
	 */
	unsubscribe(event, callback) {
		// Do we have this event?
		if (!this.callbacks.hasOwnProperty(event)) {
			return false;
		}

		// Find out where this is and remove it
		for (let i = 0, len = this.callbacks[event].length; i < len; i++) {
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
	_publish(event) {
		// Check if we have subcribers to this event
		if (!this.callbacks.hasOwnProperty(event)) {
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
		for (let i = 0, len = this.callbacks[event].length; i < len; i++) {
			let subscription = this.callbacks[event][i];
			// Call it's callback
			if (subscription.callback) {
				subscription.callback.apply(subscription.context, args);
			}
		}

		return true;
	}

	destroy() {
		this._removeEventListeners();
	}

	_addEventListeners() {
		$window.on('scroll', this.onScrollStartDebounced);
		$window.on('scroll', this.onScrollStopDebounced);
		$window.on('scroll', this.updateState.bind(this));
	}

	_removeEventListeners() {
		$window.off('scroll', this.onScrollStartDebounced);
		$window.off('scroll', this.onScrollStopDebounced);
		$window.off('scroll', this.updateState.unbind(this));
	}

	_onScrollStart() {
		this._publish(EVENT_SCROLL_START, this);
	}

	_onScrollStop() {
		this._publish(EVENT_SCROLL_STOP, this);
	}

	updateState() {
		if (this.updating) return;
		this.updating = true;

		var now = Date.now();

		// distance and speed calcs
		this.scrollDiff  = this.viewportTop - scrollMonitor.viewportTop;
		this.scrollDistance  = Math.abs(this.scrollDiff);
		this.scrollDirection = Math.max(-1, Math.min(1, this.scrollDiff));
		this.msSinceLatestChange = (now - this.latestFrame);
		this.scrollSpeed = this.scrollDistance / this.msSinceLatestChange * 1000;

		// viewport
		this.documentHeight = scrollMonitor.documentHeight;
		this.viewportHeight = scrollMonitor.viewportHeight;
		this.viewportTop    = scrollMonitor.viewportTop;
		this.viewportBottom = scrollMonitor.viewportBottom;

		// helpers
		this.isScrollingUp = this.scrollDirection > 0;
		this.isScrollingDown = this.scrollDirection < 0;
		this.isScrolledToTop = this.viewportTop <= 0;
		this.isScrolledToBottom = this.viewportBottom >= this.documentHeight;

		this.latestFrame = now;

		this._publish(EVENT_SCROLL_FRAME, this);

		this.updating = false;
	}
}

export default new ScrollState()
