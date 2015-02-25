module.exports = function (grunt) {

    // *************************************************************************
    // REQUIRE PATHS
    // Add any paths here you want shortened. Relative to the 'js' dir.
    // *************************************************************************

    var amdModulePaths = {
        'pubsub': './lib/vendors/jquery/pubsub',
        'data/slides': 'empty:'
    };

    // *************************************************************************
    // GRUNT CONFIG
    // You shouldn't need to edit anything below here
    // *************************************************************************

    var _ = require('lodash-node'),
        requirePathsForJquery1build = _.merge({'jquery': './lib/vendors/jquery/jquery-1.11.2'}, amdModulePaths);
        requirePathsForJquery2build = _.merge({'jquery': './lib/vendors/jquery/jquery-2.1.3'}, amdModulePaths);

    grunt.config(['amdModulePaths'], amdModulePaths);
    grunt.config(['requirejs', 'jquery1'], {
        options: {
            baseUrl: './source/js',
            paths: requirePathsForJquery1build,
            optimize: 'uglify2',
            generateSourceMaps: false,
            preserveLicenseComments: false,
            name: './app',
            out: './content/<%= config.services.default %>/js/all-legacyie.js'
        }
    });
    grunt.config(['requirejs', 'jquery2'], {
        options: {
            baseUrl: './source/js',
            paths: requirePathsForJquery2build,
            optimize: 'uglify2',
            generateSourceMaps: true,
            preserveLicenseComments: false,
            name: './app',
            out: './content/<%= config.services.default %>/js/all-html5.js'
        }
    });
    grunt.config(['requirejs', 'lite'], {
        options: {
            baseUrl: './source/js',
            paths: requirePathsForJquery2build,
            optimize: 'uglify2',
            generateSourceMaps: false,
            preserveLicenseComments: false,
            name: './lib/vendors/almond/almond',
            out: './content/<%= config.services.default %>/js/lite.js',
            include: ['app--lite'],
            insertRequire: ['app--lite'],
            wrap: true
        }
    });
};
