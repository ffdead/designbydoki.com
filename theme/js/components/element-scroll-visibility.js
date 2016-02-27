/***
	ElementScrollVisibility component.

	This component will watch it's state within the viewport
	and react with the following classes:

	- is-partially-visible
	- is-fully-visible
	- has-exited
	- animate
	- has-animated

	Example usage:

	<div class="js-component-scroll-monitor" data-offset="500"></div>

	@author 14islands

***/

import {Component} from 'component-loader-js';
import scrollMonitor from 'scrollMonitor';

import whichAnimationEvent from '../utils/which-animation-event';

const CSS_PARTIALLY_VISIBLE_CLASS = 'is-partially-visible';
const CSS_FULLY_VISIBLE_CLASS = 'is-fully-visible';
const CSS_ANIMATE_CLASS = 'animate';
const CSS_ANIMATED_CLASS = 'has-animated';
const CSS_EXIT_CLASS = 'has-exited';
const DATA_OFFSET = 'offset';
const DATA_REPEAT = 'scroll-repeat';
const DATA_FORCE_LOOP = 'force-loop';
const DATA_DISABLE_ON_TOUCH = 'disable-on-touch';

class ElementScrollVisibility extends Component {

	constructor() {
		super(...arguments);

		this.context = this.$el.get(0);
		this.repeat = this.$el.data(DATA_REPEAT || 0) ;
		this.forceLoop = this.$el.data(DATA_FORCE_LOOP || 0);

		this.disableOnTouch = this.$el.data(DATA_DISABLE_ON_TOUCH || false);  
		this.disable = this.disableOnTouch && Modernizr.touch;

		if (!this.disable) {
			this.init();
		}
	}

	init() {
		this.isInViewport = false;
		this.isFullyInViewport = false;

		this.animationEndEvent = whichAnimationEvent();

		if (this.repeat) {
			this.repeat = JSON.parse(this.repeat);
		}
			
		if (this.forceLoop) {
			this.forceLoop = JSON.parse(this.forceLoop);
		}
			
		this._addEventListeners();
	}

	destroy() {
		super.destroy();
		if (!this.disable) {
			this._removeEventListeners();
		}
	}

	// @protected
	_addEventListeners() {
		const offset = this.$el.data('offset') || -100;
		if (scrollMonitor) {
			this.watcher = scrollMonitor.create(this.$el, offset);
			this.watcher.enterViewport(this._onEnterViewport.bind(this));
			this.watcher.fullyEnterViewport(this._onFullyEnterViewport.bind(this)); 
			this.watcher.exitViewport(this._onExitViewport.bind(this))
			this.watcher.recalculateLocation()
		} 	
	}

	// @protected
	_removeEventListeners() {
		if (this.watcher) {
			this.watcher.destroy();
			this.watcher = null;
		}	
	}

	reset_() {
		this.$el.removeClass(CSS_PARTIALLY_VISIBLE_CLASS)
		this.$el.removeClass(CSS_FULLY_VISIBLE_CLASS) 
		this._onAnimationReset()
		this.hasExited = false
		this.hasPartiallyPlayed = false
		this.hasFullyPlayed = false
	}
		
	// @protected
	_onAnimationReset() {
		this.$el.removeClass(CSS_ANIMATE_CLASS) 
		this.$el.removeClass(CSS_ANIMATED_CLASS) 
	}

	// @protected
	_onAnimationPlay() {
		this.$el.addClass(CSS_ANIMATE_CLASS) 
		if (this.animationEndEvent) {
			this.$el.one(this.animationEndEvent, this._onAnimationEnd.bind(this))
		}
	}	

	// @protected
	_onAnimationEnd() {
		this.$el.addClass(CSS_ANIMATED_CLASS); 

		// force Javascript animations to loop by resetting and replaying
		if (this.forceLoop) {
			if (this.isInViewport) {
				// only replay if still in viewport
				setTimeout(this._resetAndPlayAnimation.bind(this), 500);
			}	
			else {
				this._onAnimationReset()
			}
				
		}	
	}

	// @protected
	_resetAndPlayAnimation() {
		this._onAnimationReset()
		setTimeout(this._onAnimationPlay.bind(this), 500);
	}

	// @protected
	_onEnterViewport() {
		this.isInViewport = true;

		if (this.hasPartiallyPlayed) {
			return;
		}
		
		this.hasPartiallyPlayed = true
		this.$el.removeClass(CSS_EXIT_CLASS);
		this.$el.addClass(CSS_PARTIALLY_VISIBLE_CLASS); 
	}

	// @protected
	_onFullyEnterViewport() {
		this.isFullyInViewport = true
		
		if (this.hasFullyPlayed) {
			return;
		}
		 
		this.hasFullyPlayed = true
		this.$el.addClass(CSS_FULLY_VISIBLE_CLASS); 
		this._onAnimationPlay()
	}

	// @protected
	_onExitViewport () {
		this.isInViewport = false;
		this.isFullyInViewport = false;
		
		if (this.hasExited) {
			return;
		}
		 
		this.hasExited = true
		if (this.animationEndEvent) {
			this.$el.off(this.animationEndEvent, this._onAnimationEnd.bind(this))  
		}

		this.$el.addClass(CSS_EXIT_CLASS); 
		
		if (this.repeat) {
			this.reset_()
		} else if (this.hasPartiallyPlayed && this.hasFullyPlayed) {
			this._removeEventListeners();
		}
	} 
}

module.exports = ElementScrollVisibility