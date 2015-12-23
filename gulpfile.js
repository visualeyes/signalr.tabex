'use strict';

var path = require('path');
var gulp = require('gulp');
var gutil = require('gulp-util');
var eslint = require('gulp-eslint');
var excludeGitignore = require('gulp-exclude-gitignore');
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');
var plumber = require('gulp-plumber');
var coveralls = require('gulp-coveralls');
var del = require('del');
var isparta = require('isparta');
var bump = require('gulp-bump');
var git = require('gulp-git');
var rename = require('gulp-rename');
var babel = require('gulp-babel');
var uglify = require('gulp-uglifyjs');

// Initialize the babel transpiler so ES2015 files gets compiled
// when they're loaded
require('babel-core/register');

var paths = {
  srcDir: 'src',
  srcSrc: 'src/**/*.js',
  distDir: 'dist',
  distSrc: 'dist/**/*.js',
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

gulp.task('build', ['concat']);

gulp.task('concat', ['compile'], function () {
  return gulp.src(paths.distSrc)
        .pipe(uglify('signalr.tabex.min.js', {
          outSourceMap: true
        }))
        .pipe(gulp.dest('.'));
});

gulp.task('compile', ['clean'], function () {
  return gulp.src(paths.srcSrc)
            .pipe(babel({
              presets: ['es2015']
            }))
            .pipe(gulp.dest(paths.distDir));
});

gulp.task('clean', function() {
  return del(paths.distDir);
});

gulp.task('bump', ['build'], function () {
  return gulp.src(['./package.json', './bower.json'])
    .pipe(bump())
    .pipe(gulp.dest('./'));
});

function getVersion() {
  var pkg = require('./package.json');
  var v = 'v' + pkg.version;
  var message = 'Release ' + v;
  return {
    version: v,
    message: message
  }
}

gulp.task('commit', ['bump'], function (cb) {
  var versionInfo = getVersion();
  return gulp.src('./')
          .pipe(git.add())
          .pipe(git.commit(versionInfo.message));
});
gulp.task('tag', ['commit'], function (cb) {
  var versionInfo = getVersion();

  git.tag(versionInfo.version, versionInfo.message, function(err) {
    if(err) throw err;
    git.push('origin', 'master', { args: '--tags' }, cb);
  });
});

gulp.task('npm', ['tag'], function (done) {
  require('child_process').spawn('npm', ['publish'], { stdio: 'inherit' })
    .on('close', done);
});


gulp.task('ci', ['build']);
gulp.task('release', ['npm']);
