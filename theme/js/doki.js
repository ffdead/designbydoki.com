import Component from 'component-loader-js/dist/es5/component'

class Doki extends Component {
	constructor() {
		super(...arguments);
		console.log('new DOKI 36');
	}

	destroy() {
		super.destroy();
		console.log('destroy DOKI');
	}
}

export default Doki;