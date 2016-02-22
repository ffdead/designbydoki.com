import 'jquery-smoothState';
import Component from 'component-loader-js/dist/es5/component';

// Public Events
export const ACTION_SMOOTHSTATE_LOAD_PAGE     = 'smoothstate-action-load-page';
export const ACTION_SMOOTHSTATE_PREFETCH_PAGE = 'smoothstate-action-prefetch-page';
export const EVENT_SMOOTHSTATE_PAGE_START = 'smoothstate-event-page-loading';
export const EVENT_SMOOTHSTATE_PAGE_READY = 'smoothstate-event-page-ready';
export const EVENT_SMOOTHSTATE_PAGE_AFTER = 'smoothstate-event-page-loaded';


const SELECTOR_SMOOTHSTATE_CONTAINER = '#js-smoothstate-container';
const SELECTOR_NAVIGATION_LINKS = '.js-smoothstate-link[target!=_blank]';
const SELECTOR_PREFETCH_LINKS = '.js-smoothstate-prefetch[target!=_blank]';
const SELECTOR_NOCACHE_LINKS = '.js-smoothstate-nocache';

const CLASS_ENTERING = 'SmoothState--is-entering';
const CLASS_EXITING = 'SmoothState--is-exiting';

const DURATION_ENTERING = 600 + 250; // 250ms is to offset color transition
const DURATION_EXITING = 300;


class SmoothState extends Component {

	constructor() {
		super(...arguments);

		this.$window = $(window);
		this.$navigationLinks = this.$el.find(SELECTOR_NAVIGATION_LINKS);
		this.$prefetchLinks = this.$el.find(SELECTOR_PREFETCH_LINKS);
		this.$nocacheLinks = this.$el.find(SELECTOR_NOCACHE_LINKS);

		this._instance = null;
		this._onNavigationLinkClick = this._onNavigationLinkClick.bind(this);
		this._onNavigationLinkHover = this._onNavigationLinkHover.bind(this);
		this._onNoCacheLinkClick = this._onNoCacheLinkClick.bind(this);

		this._initSmoothState();
		this._addEventListeners();
	}


	_loadPage(href) {
		if (this._instance.href === href) {
			return;
		}
		this._instance.load(href);
	}


	_addEventListeners() {
		this.subscribe(ACTION_SMOOTHSTATE_LOAD_PAGE, this._loadPage);
		this.subscribe(ACTION_SMOOTHSTATE_PREFETCH_PAGE, this._prefetchPage);
		this.$navigationLinks.on('click', this._onNavigationLinkClick);
		this.$prefetchLinks.on('mouseover', this._onNavigationLinkHover);
		this.$nocacheLinks.on('click', this._onNoCacheLinkClick);
	}


	_removeEventListeners() {
		this.unsubscribe(ACTION_SMOOTHSTATE_LOAD_PAGE, this._loadPage)
		this.unsubscribe(ACTION_SMOOTHSTATE_PREFETCH_PAGE, this._prefetchPage);
		this.$navigationLinks.off('click', this._onNavigationLinkClick);
		this.$nocacheLinks.on('click', this._onNoCacheLinkClick);
	}


	_onNavigationLinkClick(e) {
		e.preventDefault();
		const $el = $(e.currentTarget);
		this._loadPage($el.attr('href'));
	}

	_onNoCacheLinkClick(e) {
		e.preventDefault();
		const $el = $(e.currentTarget);
		const href = $el.attr('href');
		this._instance.clear(href)
		this._loadPage(href);
	}


	_onNavigationLinkHover(e) {
		const $el = $(e.currentTarget);
		this._prefetchPage($el.attr('href'));
	}


	_prefetchPage(href) {
		// only prefetch if not already in cache and not external link
		if (!this._instance.cache[href] && href.indexOf('http') !== 0) {
			this._instance.fetch(href);
		}
	}


	_onBefore($currentTarget, $container) {

	}


	_onStartRender($container) {
		this.publish(EVENT_SMOOTHSTATE_PAGE_START, {'href' : this._instance.href});
		this.$el.addClass(CLASS_EXITING);
	}


	_onProgressRender($container) {
		// @TODO loadingIndicator here!
	}


	/**
	 * Called when Smoothstate has loaded new page and is ready to insert it into the DOM
	 * Updates body class and id from data attributes on fragment
	 */
	_onReadyRender($container, $newContent) {
		// update body class and id
		this.$el.attr('class', $newContent.data('smoothstate-fragment-class'));
		this.$el.attr('id', $newContent.data('smoothstate-fragment-id'));

		// update markup
		$container.html($newContent);

		// notify existing components that page finished loading
		this.publish(EVENT_SMOOTHSTATE_PAGE_READY, {'href' : this._instance.href});

		// Animate after content has been switched out to avoid glitch with old content.
		this.$el.addClass(CLASS_ENTERING).removeClass(CLASS_EXITING);

		// scan for new components
		this.scan({pjax: true});
	}


	_onAfter($container, $newContent) {
		this.$el.removeClass(CLASS_ENTERING);
		this.publish(EVENT_SMOOTHSTATE_PAGE_LOADED, {'href' : this._instance.href});
	}


	_initSmoothState() {
		const options = {
			debug: false,
			prefetch: true, // prefetch links inside fragment when hovering
			cacheLength: 5,
			forms: 'form.use-smoothstate', // disable on forms unless this class is present (not used)
			allowFormCaching: false,
			blacklist: '.no-smoothState',
			loadingClass: 'smoothstate-is-loading',
			onBefore: this._onBefore.bind(this),
			onStart: {
				duration: DURATION_EXITING, // Duration of current page animation out
				render: this._onStartRender.bind(this)
			},
			onProgress: {
				duration: 0, // Duration of loading animation - delay before onReady is called
				render: this._onProgressRender.bind(this)
			},
			onReady: {
				duration: DURATION_ENTERING, // Duration of our new page animating in - delay before onAfter is called
				render: this._onReadyRender.bind(this)
			},
			onAfter: this._onAfter.bind(this)
		};

		this._instance = this.$el.find(SELECTOR_SMOOTHSTATE_CONTAINER).smoothState(options).data('smoothState');
	}


	destroy() {
		this._removeEventListeners();
		super.destroy();
	}

}

module.exports = SmoothState;
