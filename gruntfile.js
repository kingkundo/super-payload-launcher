module.exports = function (grunt) {
    grunt.initConfig({

        // define source files and their destinations
        uglify: {
            options: {
                preserveComments: /^#/
              },
            files: {
                src: 'src/*.js',  // source files mask
                dest: 'dist/',    // destination folder
                expand: true,    // allow dynamic building
                flatten: true,   // remove all unnecessary nesting
                ext: '.js',   // replace .js to .min.js
            },
        }
    });

    // load plugins
    grunt.loadNpmTasks('grunt-contrib-uglify');

    // register at least this one task
    grunt.registerTask('default', ['uglify']);
};