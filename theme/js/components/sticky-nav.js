import Component from 'component-loader-js/dist/es5/component';
import animationEndEvent from '../utils/animation-end-event';
import scrollState from '../utils/scroll-state';

/**
	Sticky Nav component

	Listens to scroll events from utils.ScrollState

	- Adds CLASS_LOCKED when passing LOCK_THRESHOLD
	- Adds CLASS_BACKGROUND when passing _getBackgroundThreshold()
	- Adds CLASS_HIDDEN if visible and scrolling down with enough speed
	- Adds CLASS_VISIBLE if scrolling up and hidden
*/


const CLASS_HIDDEN = 'StickyNav--hidden';
const CLASS_VISIBLE = 'StickyNav--visible';
const CLASS_LOCKED = 'StickyNav--locked';
const CLASS_BACKGROUND = 'StickyNav--background';

// px from top of document where 'locked' class is added (inclusive)
const LOCK_THRESHOLD = 100;

// Speed/Distance required to change appearance per scroll frame
const MIN_SCROLL_SPEED = 500;
const MIN_SCROLL_DISTANCE = 20;


class StickyNav extends Component {

	constructor() {
		super(...arguments);
		console.log('STICKY');
		this.$document = $(document);
		this.isHidden = false;
		this.isLocked = false;
		this.hasBackground = false;
		this.isBusyChecking = false;

		this.onStateChanged = this.onStateChanged.bind(this);
		this.checkLockThreashold = this.checkLockThreashold.bind(this);
		this.checkAppearance = this.checkAppearance.bind(this);

		this.init();

		this.defer(() => {
			// pause and wait for Hero component to be initialized first
			this.$el.css('visibility', 'visible');
		});
	}


	init() {
		scrollState.subscribe(scrollState.EVENT_SCROLL_FRAME, this.onStateChanged);
		// this.subscribe(Enums.ACTION_STICKY_NAV_SHOW_BACKGROUND, this.addBackground);
		// this.subscribe(Enums.ACTION_STICKY_NAV_HIDE_BACKGROUND, this.removeBackground);
		// this.mobileBreakpoint = Breakpoints.on({
		// 	name: "BREAKPOINT_SMALL"
		// });
	}


	onStateChanged(state) {
		if (!this.isBusyChecking) {
			this.isBusyChecking = true;
			this.checkLockThreashold(state);
			this.checkBackgroundThreashold(state);
			this.checkAppearance(state);
			this.isBusyChecking = false;
		}
	}


	_getBackgroundThreshold() {
		// if (this.mobileBreakpoint.isMatched) {
		// 	return 1; //switch bg as soon as we start scrolling (scroll=0 needs transparency on map)
		// }
		return LOCK_THRESHOLD + 1; // wait until passing threashold
	}


	show() {
		if (this.isHidden) {
			this.$el.addClass(CLASS_VISIBLE).removeClass(CLASS_HIDDEN);
			this.isHidden = false;
			this.$el.one(animationEndEvent, () => {
				this.$el.removeClass(CLASS_VISIBLE);
			});
		}
	}


	hide() {
		if (!this.isHidden) {
			this.$el.addClass(CLASS_HIDDEN).removeClass(CLASS_VISIBLE);
			this.isHidden = true;
		}
	}


	lock() {
		if (!this.isLocked) {
			this.$el.addClass(CLASS_LOCKED)
			this.isLocked = true;
		}
	}


	unlock() {
		if (this.isLocked) {
			this.$el.removeClass(CLASS_LOCKED)
			this.isLocked = false;
		}
	}


	addBackground() {
		if (!this.hasBackground) {
			this.$el.addClass(CLASS_BACKGROUND)
			this.hasBackground = true;
		}
	}


	removeBackground() {
		if (this.hasBackground) {
			this.$el.removeClass(CLASS_BACKGROUND)
			this.hasBackground = false;
		}
	}


	isAboveVisibleThreshold(state) {
		return state.viewportTop <= LOCK_THRESHOLD;
	}


	checkLockThreashold(state) {
		if (state.viewportTop >= LOCK_THRESHOLD) {
			this.lock();
		}
		else {
			this.unlock();
		}
	}


	checkBackgroundThreashold(state) {
		if (state.viewportTop >= this._getBackgroundThreshold()) {
			this.addBackground();
		}
		else {
			this.removeBackground();
		}
	}


	checkAppearance(state) {
		// scrolled to the very top or bottom; element slides in
		if (this.isAboveVisibleThreshold(state) || state.isScrolledToBottom) {
			this.show();
		}
		else if (state.isScrollingDown) {
			this.hide();
		}
		// else if scrolling up with enough speed
		// * fast computer -> many events -> short distance between events = better to check speed
		// * slow computer -> few events -> less visible speed = better to check distance
		else if (state.scrollSpeed > MIN_SCROLL_SPEED || state.scrollDistance > MIN_SCROLL_DISTANCE) {
			this.show();
		}
	}


	destroy() {
		this.show();
		scrollState.unsubscribe(scrollState.EVENT_SCROLL_FRAME, this.onStateChanged);
		// this.unsubscribe(Enums.ACTION_STICKY_NAV_SHOW_BACKGROUND, this.addBackground);
		// this.unsubscribe(Enums.ACTION_STICKY_NAV_HIDE_BACKGROUND, this.removeBackground);
	}
}

module.exports = StickyNav;
