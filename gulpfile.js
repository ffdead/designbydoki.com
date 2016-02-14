var gulp = require('gulp');
var cors         = require('cors');
var inlinesource = require('gulp-inline-source');
var babelify     = require('babelify');
var browserify   = require('browserify');
var watchify     = require('watchify');
var source       = require('vinyl-source-stream');
var buffer       = require('vinyl-buffer');
var runSequence  = require('run-sequence');
var ghPages      = require('gulp-gh-pages');

// Auto-load gulp-* plugins in package.json
var plugins      = require('gulp-load-plugins')();

// Configuration
var config = {
  debug: false, // use set-debug taget to enable
  jsOutputDir: './build/js/',
  jsMainFilename: 'main.js'
};

///////////////////////////////////////////////////////////////////////////////
// RE-USABLE FUNCTIONS
///////////////////////////////////////////////////////////////////////////////

function handleErrors() {
  var args = Array.prototype.slice.call(arguments);
  plugins.notify.onError({
    title: 'Compile Error',
    message: '<%= error.message %>'
  }).apply(this, args);
  this.emit('end'); // Keep gulp from hanging on this task
}

gulp.task('set-debug', function () {
  config.debug = true;
});

///////////////////////////////////////////////////////////////////////////////
// SERVER TARGET
///////////////////////////////////////////////////////////////////////////////

gulp.task('connect', function() {
  plugins.connect.server({
    root: 'build',
    livereload: false,
    https: true,
    middleware: function() {
      return [cors()];
    }
  });
});

///////////////////////////////////////////////////////////////////////////////
// INDIVIDUAL COMPILE TARGETS
///////////////////////////////////////////////////////////////////////////////

gulp.task('copy:lib', function () {
  return gulp
    .src('./lib/*')
    .pipe(gulp.dest('./build'));
});

gulp.task('deploy:assets', function() {
  return gulp.src('./theme/assets/**/*')
    .pipe(ghPages());
});

gulp.task('build:mustache', function () {
 return gulp.src('./theme/*.mustache')
    .pipe(gulp.dest('./build'));
});

gulp.task('build:sass', function() {
  var params = {
    outputStyle: config.debug ? 'expanded' : 'compressed'
  };
  return gulp.src('./theme/**/*.{scss,sass}')
    .pipe(plugins.sass(params).on('error', plugins.sass.logError))
    .pipe(plugins.autoprefixer({
        browsers: ['last 2 versions'],
        cascade: false
    }))
    .pipe(gulp.dest('./build'))
});

gulp.task('build:js', function() {
  var props = {
    entries: ['./theme/js/' + config.jsMainFilename],
    debug : config.debug,
    transform:  [
      [babelify, {
        presets: ['es2015', 'stage-2']
      }]
    ],
    cache: {},
    packageCache: {},
    fullPaths: false
  };
  return browserify(props)
    .bundle()
    .on('error', handleErrors)
    .pipe(source(config.jsMainFilename))
    .pipe(plugins.if(!config.debug, buffer()))
    .pipe(plugins.if(!config.debug, plugins.uglify({mangle: false}))) // enable compression in production
    .pipe(gulp.dest(config.jsOutputDir))
});

gulp.task('build:inline', ['build:mustache'], function() {
  return gulp.src('./build/*.mustache')
      .pipe(inlinesource({compress: false}))
      .pipe(gulp.dest('./build'))
      .on('end', function(){
        plugins.util.log(plugins.util.colors.yellow('THEME'), plugins.util.colors.bgGreen('UPDATED'));
      });
});

gulp.task('build', ['build:js', 'build:sass'], function () {
  runSequence('build:inline');
});

///////////////////////////////////////////////////////////////////////////////
// WATCH TARGETS
///////////////////////////////////////////////////////////////////////////////

gulp.task('watch:js', function() {
  gulp.watch(['./theme/**/*.js'], function () {
    runSequence('build:js', 'build:inline');
  });
});

gulp.task('watch:sass', function () {
  gulp.watch(['./theme/**/*.{sass, scss}'], function () {
    runSequence('build:sass', 'build:inline');
  });
});

gulp.task('watch:mustache', function () {
  gulp.watch(['./theme/**/*.mustache'], function () {
    runSequence('build:mustache', 'build:inline');
  });
});

gulp.task('watch', ['watch:sass', 'watch:js', 'watch:mustache']);

///////////////////////////////////////////////////////////////////////////////
// SERVE MINIFIED
///////////////////////////////////////////////////////////////////////////////

gulp.task('serve', ['connect', 'copy:lib', 'build', 'watch']);

///////////////////////////////////////////////////////////////////////////////
// SERVE DEBUG
///////////////////////////////////////////////////////////////////////////////

gulp.task('debug', ['set-debug'], function () {
  runSequence('serve');
});

///////////////////////////////////////////////////////////////////////////////
// DEFAULT TARGET
///////////////////////////////////////////////////////////////////////////////

gulp.task('default', ['serve']);
