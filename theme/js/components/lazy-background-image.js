import {Component} from 'component-loader-js';


const CLASS_LOADING = 'is-loading';
const CLASS_LOADED = 'is-loaded';
const CLASS_ERROR = 'has-load-error';

const DATA_BG_SRC = 'bg-src';
const DATA_LAZY_ORDER = 'lazy-order';
const DATA_LAZY_FIRST_INDEX = 'lazy-first-index';


/**
 * Sets data src attribute as CSS background image. Adds loaded class when loaded.
 */
class LazyBackgroundImage extends Component {

	constructor() {
		super(...arguments);

		this.img = null;
		this.src = this.$el.data(DATA_BG_SRC);
		this.order = this.$el.data(DATA_LAZY_ORDER);
		this.firstIndex = this.$el.data(DATA_LAZY_FIRST_INDEX) || 0;

		this._onImageLoaded = this._onImageLoaded.bind(this);
		this._onImageError = this._onImageError.bind(this);

		this._init();
	}


	// Either load image directly (if first image or no lazy-order specifiec)
	// OR subscribe to load event to check when it's our turn
	_init() {
		if (!this.order || this.order === this.firstIndex) {
			this._loadImage();
		}
		else {
			this.subscribe(LazyBackgroundImage.EVENT_ONLOAD, this._onOtherComponentLoad);
		}
	}


	_loadImage() {
		if (this.src) {
			this.$el.addClass(CLASS_LOADING);
			this.img = new Image();
			this.img.onload = this._onImageLoaded;
			this.img.onerror = this._onImageError;
			this.img.src = this.src;
			this.$el.css('background-image', `url('${this.src}')`);
		}
	}


	// Check if it's our turn to load
	_onOtherComponentLoad(loadedOrder) {
		if (loadedOrder + 1 === this.order) {
			this._loadImage();
			this._removeEventListener();
		}
	}


	_onImageLoaded() {
		this.$el.removeClass(CLASS_LOADING);
		this.$el.addClass(CLASS_LOADED);
		this.img = null;

		if ($.isNumeric(this.order)) {
			this.publish(LazyBackgroundImage.EVENT_ONLOAD, this.order);
		}
	}


	_onImageError() {
		this.$el.removeClass(CLASS_LOADING);
		this.$el.addClass(CLASS_ERROR);
		this.img = null;

		// still trigger load event so other images in queue continue to load
		if ($.isNumeric(this.order)) {
			this.publish(LazyBackgroundImage.EVENT_ONLOAD, this.order);
		}
	}


	_removeEventListener() {
		this.unsubscribe(LazyBackgroundImage.EVENT_ONLOAD, this._onOtherComponentLoad);
	}


	destroy() {
		this._removeEventListener();
		super.destroy();
	}
}

LazyBackgroundImage.EVENT_ONLOAD = 'event-lazy-background-image-loaded';

module.exports = LazyBackgroundImage
