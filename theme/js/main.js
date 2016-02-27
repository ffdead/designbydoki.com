// import 'babel-polyfill';

import ComponentLoader from 'component-loader-js';

import Doki from './components/doki';
import StickyNav from './components/sticky-nav';


new ComponentLoader({
	Doki,
	StickyNav
}).scan();

