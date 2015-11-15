const path = require('path');
const gulp = require('gulp');
const gutil = require('gulp-util');
const webpack = require('webpack');
const webpackConfig = require('./webpack.config');
const eslint = require('gulp-eslint');
const excludeGitignore = require('gulp-exclude-gitignore');
const mocha = require('gulp-mocha');
const istanbul = require('gulp-istanbul');
const plumber = require('gulp-plumber');
const coveralls = require('gulp-coveralls');
const del = require('del');
const isparta = require('isparta');

// Initialize the babel transpiler so ES2015 files gets compiled
// when they're loaded
require('babel-core/register');

const paths = {
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
  let mochaErr;

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
  const prodConfig = Object.create(webpackConfig);

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

let devConfig = Object.create(webpackConfig);
devConfig.devtool = 'sourcemap';
devConfig = updateDevConfig(devConfig);

const devCompiler = webpack(devConfig);

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
