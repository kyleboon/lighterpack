module.exports = {
    extends: 'stylelint-config-standard',
    plugins: ['stylelint-order'],
    overrides: [
        {
            files: ['**/*.vue'],
            customSyntax: 'postcss-html',
        },
        {
            files: ['**/*.scss'],
            customSyntax: 'postcss-scss',
        },
    ],
    rules: {
        'at-rule-no-unknown': [
            true,
            {
                ignoreAtRules: ['function', 'for', 'each', 'include', 'mixin', 'use', 'forward'], // for SASS directives
            },
        ],
        'function-no-unknown': [
            true,
            {
                ignoreFunctions: ['darken', 'lighten', 'saturate', 'desaturate', 'mix', 'fade', 'alpha', 'rgba'],
            },
        ],
        'declaration-property-value-no-unknown': null, // doesn't understand SCSS variables in values
        'nesting-selector-no-missing-scoping-root': null, // doesn't understand SCSS nesting
        'no-descending-specificity': null, // stylistic preference
        'no-empty-source': null, // for vue file support
        'no-invalid-double-slash-comments': null, // valid in SCSS
        'order/properties-alphabetical-order': true, // stylistic preference
        'import-notation': null, // project uses Sass @import, not CSS url() notation
        'selector-class-pattern': null, // project uses lp-prefixed camelCase
        'selector-id-pattern': null, // project uses lp-prefixed camelCase
    },
};
