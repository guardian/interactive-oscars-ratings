'use strict';
var pkg = require('./package.json');
var currentTime = +new Date();
var assetPath = 'build/assets-' + currentTime;

module.exports = function(grunt) {
  var isDev = !(grunt.cli.tasks && grunt.cli.tasks[0] === 'deploy');
  grunt.initConfig({
    connect: {
      server: {
        options: {
          port: pkg.config.port,
          hostname: '*',
          base: './',
          open: 'http://localhost:' + pkg.config.port + '/build/',
          middleware: function (connect, options, middlewares) {
            // inject a custom middleware http://stackoverflow.com/a/24508523 
            middlewares.unshift(function (req, res, next) {
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Access-Control-Allow-Methods', '*');
                return next();
            });
            return middlewares;
          }
        }
      }
    },

    bowerRequirejs: {
        all: {
            rjsConfig: './src/js/app/require.js',
            options: {
                baseUrl: './src/js/app/'
            }
        }
    },

    sass: {
      options: {
            //includePaths: ['bower_components/'],
            style: (isDev) ? 'expanded' : 'compressed',
            sourcemap: (isDev) ? '' : 'none'
       },
        build: {
            files: { 'build/assets/css/main.css': 'src/css/main.scss' }
        }
    },

    autoprefixer: {
        options: { map: true },
        css: { src: 'build/assets/css/*.css' }
    },

    clean: ['build/'],

    jshint: {
      options: {
          jshintrc: true,
          force: true 
      },
      files: ['Gruntfile.js', 'src/*.js', 'src/js/*.js', 'src/js/app/**/*.js']
    },

    requirejs: {
      compile: {
        options: {
          baseUrl: './src/js/app/',
          mainConfigFile: './src/js/app/require.js',
          optimize: (isDev) ? 'none' : 'uglify2',
          inlineText: true,
          name: 'almond',
          out: 'build/assets/js/main.js',
          generateSourceMaps: true, 
          preserveLicenseComments: false,
          include: ['main'],
          wrap: {
            start: 'define(["require"],function(require){var req=(function(){',
            end: 'return require; }()); return req; });'
          }

        }
      }
    },

    watch: {
      scripts: {
        files: [
          'src/**/*.js',
          'src/boot.js',
          'src/**/*.json',
          'src/js/app/templates/*.html'
        ],
        tasks: ['jshint', 'requirejs'],
        options: {
          spawn: false,
          livereload: true
        },
      },
      html: {
        files: ['src/*.html', 'src/**/*.html'],
        tasks: ['copy', 'replace:local'],
        options: {
          spawn: false,
          livereload: true
        },
      },
      css: {
        files: ['src/css/**/*.*'],
        tasks: ['sass', 'autoprefixer', 'replace:local'],
        options: {
          spawn: false,
          livereload: true
        },
      }
    },

    copy: {
      build: {
        files: [
          { src: 'src/index.html', dest: 'build/index.html' },
          { src: 'bower_components/curl/dist/curl/curl.js', dest: 'build/assets/js/curl.js' },
          { src: 'src/boot.js', dest: 'build/boot.js' },
          { cwd: 'src/', src: 'imgs/**', dest: 'build/assets/', expand: true}
        ]
      }
    },

    replace: {
        prod: {
            options: {
                patterns: [{
                  match: /\/assets/g,
                  replacement: pkg.config.cdn_url + 'assets-'+currentTime
                }]
            },
            files: [{
                src: ['build/*.html', 'build/**/*.js', 'build/**/*.css'],
                dest: './'
            }]
        },
        local: {
            options: {
                patterns: [{
                  match: /\/\/pasteup\.guim\.co\.uk\/fonts\/0\.1\.0/g,
                  replacement: '/bower_components/guss-webfonts/webfonts'
                }]
            },
            files: [{
                src: ['build/*.html', 'build/**/*.js', 'build/**/*.css'],
                dest: './'
            }]
        }

    },

    s3: {
        options: {
            access: 'public-read',
            bucket: 'gdn-cdn',
            maxOperations: 20,
            dryRun: (grunt.option('test')) ? true : false,
            headers: {
                CacheControl: 180,
            },
            gzip: true,
            gzipExclude: ['.jpg', '.gif', '.jpeg', '.png']
        },
        base: {
            files: [{
                cwd: 'build',
                src: '*.*',
                dest: pkg.config.s3_folder
            }]
        },
        assets: {
            options: {
                headers: {
                    CacheControl: 3600,
                }
            },
            files: [{
                cwd: 'build',
                src: 'assets-' + currentTime + '/**/*.*',
                dest: pkg.config.s3_folder
            }]
        }
    },

    rename: {
        main: {
            files: [
                { src: 'build/assets', dest: assetPath }
            ]
        }
    },
    
    // Download files locally 
    curl: {
      'src/js/app/data/sampleData.json': pkg.config.data_url
    }
  });

  // Task pluginsk
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-aws');
  grunt.loadNpmTasks('grunt-autoprefixer');
  grunt.loadNpmTasks('grunt-replace');
  grunt.loadNpmTasks('grunt-contrib-rename');
  grunt.loadNpmTasks('grunt-curl');
  grunt.loadNpmTasks('grunt-bower-requirejs');

  // Tasks
  grunt.registerTask('fetch', ['curl']);
  
  grunt.registerTask('build', [
    'jshint',
    'clean',
    'sass',
    'autoprefixer',
    'bowerRequirejs',
    'requirejs',
    'copy'
  ]);
  
  grunt.registerTask('default', ['build', 'replace:local', 'connect',  'watch']);
  
  grunt.registerTask('deploy', [
      'build',
      'rename',
      'replace:prod',
      's3'
  ]);
};

