// import 'babel-polyfill';

import ComponentLoader from 'component-loader-js/dist/es5/component-loader';

import Doki from './components/doki';
import StickyNav from './components/sticky-nav';


new ComponentLoader({
	Doki,
	StickyNav
}).scan();