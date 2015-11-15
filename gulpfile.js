'use strict';

var path = require('path');
var gulp = require('gulp');
var gutil = require('gulp-util');
var webpack = require('webpack');
var webpackConfig = require('./webpack.config');
var eslint = require('gulp-eslint');
var excludeGitignore = require('gulp-exclude-gitignore');
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');
var plumber = require('gulp-plumber');
var coveralls = require('gulp-coveralls');
var del = require('del');
var isparta = require('isparta');
var bump = require('gulp-bump');

// Initialize the babel transpiler so ES2015 files gets compiled
// when they're loaded
require('babel-core/register');

var paths = {
  srcDir: 'src',
  srcSrc: 'src/**/*.js',
  test: 'test',
  testSrc: 'test/**/*.js',
};

gulp.task('default', ['build']);

gulp.task('lint', function() {
  return gulp.src(paths.srcSrc)
    .pipe(excludeGitignore())
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('pre-test', function() {
  return gulp.src(paths.testSrc)
  .pipe(istanbul({
    includeUntested: true,
    instrumenter: isparta.Instrumenter,
  }))
  .pipe(istanbul.hookRequire());
});

gulp.task('test', ['pre-test'], function(cb) {
  var mochaErr;

  gulp.src(paths.testSrc)
  .pipe(mocha())
  .once('error', function(err) {
    mochaErr = err;
  })
  .pipe(istanbul.writeReports())
  .once('end', function() {
    cb(mochaErr);
  });
});

gulp.task('coveralls', ['test'], function() {
  if (process.env.CI) {
    return gulp
      .src(path.join(__dirname, 'coverage/lcov.info'))
      .pipe(coveralls());
  }
});

gulp.task('clean', function() {
  return del('lib');
});

gulp.task('build', ['webpack:build']);

gulp.task('build-dev', ['webpack:build-dev'], function() {
  gulp.watch([
    paths.srcSrc,
  ], [
    'webpack:build-dev',
  ]);
});

gulp.task('webpack:build', function(callback) {
  // modify some webpack config options
  var prodConfig = Object.create(webpackConfig);

  prodConfig.plugins = prodConfig.plugins.concat(
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production'),
      },
    }),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin()
  );

  // run webpack
  webpack(prodConfig, function(err, stats) {
    if (err) throw new gutil.PluginError('webpack:build', err);
    gutil.log('[webpack:build]', stats.toString({
      colors: true,
    }));
    callback();
  });
});

function updateDevConfig(devConfig) {
  devConfig.debug = true;
  return devConfig;
}

var devConfig = Object.create(webpackConfig);
devConfig.devtool = 'sourcemap';
devConfig = updateDevConfig(devConfig);

var devCompiler = webpack(devConfig);

gulp.task('webpack:build-dev', function(callback) {
  // run webpack
  devCompiler.run(function(err, stats) {
    if (err) throw new gutil.PluginError('webpack', err);
    gutil.log('[webpack:build-dev]', stats.toString({
      colors: true,
    }));
    callback();
  });
});

gulp.task('bump', ['build'], function () {
  return gulp.src(['./package.json', './bower.json'])
    .pipe(bump())
    .pipe(gulp.dest('./'));
});

gulp.task('tag', ['bump'], function () {
  var pkg = require('./package.json');
  var v = 'v' + pkg.version;
  var message = 'Release ' + v;

  return gulp.src('./')
    .pipe(git.commit(message))
    .pipe(git.tag(v, message))
    .pipe(git.push('origin', 'master', '--tags'))
    .pipe(gulp.dest('./'));
});

gulp.task('npm', ['tag'], function (done) {
  require('child_process').spawn('npm', ['publish'], { stdio: 'inherit' })
    .on('close', done);
});


gulp.task('ci', ['build']);
gulp.task('release', ['npm']);
