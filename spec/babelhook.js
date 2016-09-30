// This file exists so that we can specify the "ignore" option for babel. We would
// prefer to specify it in the .babelrc file, but there is currently a bug preventing
// it from working: https://phabricator.babeljs.io/T6726
// This file should go away at some point and we should do this require from the index.
require( "babel-register" )( {
	ignore: [
		/node_modules(?!\/@lk)/ // node_modules, except those in the @lk namespace
	]
} );
