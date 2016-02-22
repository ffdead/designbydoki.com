var gulp         = require('gulp');
var cors         = require('cors');
var babelify     = require('babelify');
var browserify   = require('browserify');
var source       = require('vinyl-source-stream');
var buffer       = require('vinyl-buffer');
var runSequence  = require('run-sequence');
var ghPages      = require('gulp-gh-pages');
var rev          = require('gulp-rev-append');

// Auto-load gulp-* plugins in package.json
var plugins      = require('gulp-load-plugins')();

// Configuration
var config = {
  port: 8080,
  inline: false, // inline CSS & JS instead of linking to external assets
  debug: false, // use set-debug taget to enable
  jsMainFilename: 'main.js',
  assetPath: 'https://ffdead.github.io/designbydoki.com/'
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
  config.assetPath = 'https://localhost:' + config.port + '/assets/'
});


///////////////////////////////////////////////////////////////////////////////
// SERVER TARGET
///////////////////////////////////////////////////////////////////////////////

gulp.task('connect', function() {
  plugins.connect.server({
    root: 'build',
    port: config.port,
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

gulp.task('wait', function () {
  return gulp
    .src('.')
    .pipe(plugins.wait(10000));
});

gulp.task('copy:lib', function () {
  return gulp
    .src('./lib/*')
    .pipe(gulp.dest('./build'));
});

gulp.task('build:rev', function() {
  gulp.src('./build/*.mustache')
    .pipe(rev())
    .pipe(gulp.dest('./build/'));
});

gulp.task('build:assets', function () {
 return gulp.src('./theme/assets/**/*')
    .pipe(gulp.dest('./build/assets'));
});

gulp.task('deploy:assets', ['build:assets'], function(cb) {
  return gulp.src('./build/assets/**/*')
    .pipe(ghPages())
    .on('end', function(){
      plugins.util.log(plugins.util.colors.yellow('ASSETS'), plugins.util.colors.bgGreen('DEPLOYED'));
    });
});

gulp.task('build:mustache', function () {
 return gulp.src('./theme/*.mustache')
    .pipe(gulp.dest('./build'));
});

gulp.task('build:sass', function() {
  var params = {
    outputStyle: config.debug ? 'expanded' : 'compressed'
  };
  return gulp.src('./theme/css/**/*.{scss,sass}')
    .pipe(plugins.sass(params).on('error', plugins.sass.logError))
    .pipe(plugins.autoprefixer({
        browsers: ['last 2 versions'],
        cascade: false
    }))
    .pipe(gulp.dest('./build/assets'))
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
    .pipe(gulp.dest('./build/assets'))
});

gulp.task('build', ['build:js', 'build:sass', 'build:assets']);


gulp.task('compile:template', ['build:mustache'], function() {
  return gulp.src('./build/*.mustache')
      .pipe(rev())
      .pipe(plugins.replace(/((href=|src=)[\'\"]*).*assets\//g, '$1' + config.assetPath))
      .pipe(plugins.replace(/(url\([\'\"]*)/g, '$1' + config.assetPath))
      .pipe(gulp.dest('./build'))
      .on('end', function(){
        plugins.util.log(plugins.util.colors.yellow('THEME'), plugins.util.colors.bgGreen('UPDATED'));
      });
});


gulp.task('deploy', function () {
  if (config.debug) {
    runSequence('compile:template');
  }
  else {
     runSequence('deploy:assets', 'wait', 'compile:template');
  }
});


///////////////////////////////////////////////////////////////////////////////
// WATCH TARGETS
///////////////////////////////////////////////////////////////////////////////

gulp.task('watch:js', function() {
  gulp.watch(['theme/**/*.js'], function () {
    runSequence('build:js', 'deploy');
  });
});

gulp.task('watch:sass', function () {
  gulp.watch(['theme/**/*.{sass, scss}'], function () {
    runSequence('build:sass', 'deploy');
  });
});

gulp.task('watch:mustache', function () {
  gulp.watch(['./theme/**/*.mustache'], function () {
    runSequence('build:mustache', 'deploy');
  });
});

gulp.task('watch:assets', function () {
  gulp.watch(['build/assets/**/*'], function () {
    runSequence('deploy:assets');
  });
}); 

gulp.task('watch', ['watch:sass', 'watch:js', 'watch:mustache', 'watch:assets']);


///////////////////////////////////////////////////////////////////////////////
// BUILD AND SERVE TEMPLATE 
///////////////////////////////////////////////////////////////////////////////

gulp.task('serve', ['connect', 'copy:lib', 'build'], function () {
  runSequence('watch', 'deploy');
});


///////////////////////////////////////////////////////////////////////////////
// SERVE DEBUG WITH WATCH
///////////////////////////////////////////////////////////////////////////////

gulp.task('preview', ['set-debug'], function () {
  runSequence('serve');
});


///////////////////////////////////////////////////////////////////////////////
// SERVE DIST WITH EXTERNAL ASSETS
///////////////////////////////////////////////////////////////////////////////

gulp.task('dist', ['serve']);


///////////////////////////////////////////////////////////////////////////////
// DEFAULT TARGET
///////////////////////////////////////////////////////////////////////////////

gulp.task('default', ['preview']);

