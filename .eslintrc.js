module.exports = {
	extends: [ "leankit", "leankit/es6" ],

	parser: "babel-eslint",

	plugins: [ "babel" ],

	rules: {
		"no-var": 0,
		"vars-on-top": 0,
		"init-declarations": 0,
		"prefer-const": 0,
		"prefer-arrow-callback": 0,
		"global-require": 0,
		"consistent-return": 0,
		"prefer-template": 0,
		"no-magic-numbers": 0,
		"max-lines": 0,
		"max-statements": 0,
		"no-invalid-this": 0,
		"no-mixed-operators": 0,

		// Replace some default rules with ones that work with babel/es6
		"generator-star-spacing": 0,
		"babel/generator-star-spacing": "error",
		"object-curly-spacing": 0,
		"babel/object-curly-spacing": [ "error", "always" ],
		"object-shorthand": 0,
		"babel/object-shorthand": 0, // Disabled for now but we want to bring this back
		"arrow-parens": 0,
		"babel/arrow-parens": [ "error", "as-needed" ],
		"babel/no-await-in-loop": "error" // new rule, doesn't replace any
	}
};
