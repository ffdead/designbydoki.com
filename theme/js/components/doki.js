import {Component} from 'component-loader-js';

class Doki extends Component {
	constructor() {
		super(...arguments);
		console.log('new DOKI 40');
	}

	destroy() {
		super.destroy();
		console.log('destroy DOKI');
	}
}

export default Doki;