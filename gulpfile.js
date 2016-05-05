"use strict";

const gulp = require('gulp');
const ava = require('gulp-ava');

const browserify = require('browserify');
const watchify = require('watchify');
const babelify = require('babelify');

const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const merge = require('utils-merge');

const rename = require('gulp-rename');
const uglify = require('gulp-uglify');
const sourcemaps = require('gulp-sourcemaps');

const markdown = require('gulp-markdown');
const ftp = require( 'vinyl-ftp' );

/* nicer browserify errors */
const gutil = require('gulp-util');
const chalk = require('chalk');

const fs = require('fs');
const tap = require('gulp-tap');
const insert = require('gulp-insert');
const path = require('path');

function map_error(err) {
  if (err.fileName) {
    // regular error
    gutil.log(chalk.red(err.name)
      + ': '
      + chalk.yellow(err.fileName.replace(__dirname + '/src/js/', ''))
      + ': '
      + 'Line '
      + chalk.magenta(err.lineNumber)
      + ' & '
      + 'Column '
      + chalk.magenta(err.columnNumber || err.column)
      + ': '
      + chalk.blue(err.description))
  } else {
    // browserify error..
    gutil.log(chalk.red(err.name)
      + ': '
      + chalk.yellow(err.message))
  }

  this.end()
}
/* */

gulp.task('watchify', function () {
  var args = merge(watchify.args, { debug: true });
  var bundler = watchify(browserify('./src/js/app.js', args)).transform(babelify, { presets: ["es2015"] });
  bundle_js(bundler);

  bundler.on('update', function () {
    bundle_js(bundler)
  })
});

function bundle_js(bundler) {
  return bundler.bundle()
    .on('error', map_error)
    .pipe(source('app.js'))
    .pipe(buffer())
    .pipe(gulp.dest('./dist/js'))
    .pipe(rename('app.min.js'))
    .pipe(sourcemaps.init({ loadMaps: true }))
    // capture sourcemaps from transforms
    .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./dist/js'))
}

// Without watchify
gulp.task('browserify', function () {
  var bundler = browserify('./src/js/app.js', { debug: true }).transform(babelify, { presets: ["es2015"] });

  return bundle_js(bundler)
});

gulp.task('markdown-common', function () {
  return gulp.src('src/md/*.md')
    .pipe(markdown())
    .pipe(gulp.dest('./dist/pages'));
});

let counter = 0;
const writeArticleArray = function writeArticleArray(filename) {
  if(counter++ === 0) {
    return "window.articles = [" + filename + ", ";
  }
  else {
    return filename+ ", ";
  }
};


gulp.task('markdown-articles', function (cb) {
  const files = [];
  let bundle = gulp.src('src/md/articles/*.md')
    .pipe(tap(function(file, t) {
      files.push("'" + path.basename(file.path) + "'");
    }))
    .pipe(markdown());


  return bundle.pipe(gulp.dest('./dist/pages/articles')).on('finish', function() {
    const articleList = 'window.articles = [' + files.join(',') + '];';

    fs.writeFile('dist/js/article-list.js', articleList);
  });
});
gulp.task('markdown', ['markdown-common', 'markdown-articles']);


// Without sourcemaps
gulp.task('browserify-production', function () {
  var bundler = browserify('./src/js/app.js').transform(babelify, { presets: ["es2015"] });

  return bundler.bundle()
    .on('error', map_error)
    .pipe(source('app.js'))
    .pipe(buffer())
    .pipe(rename('app.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('./dist/js'))
});

gulp.task('test', () =>
  gulp.src('./test/js/app.js')
    // gulp-ava needs filepaths so you can't have any plugins before it
    .pipe(ava())
);

gulp.task('root-files', () =>
  gulp.src('./src/index.html')
    .pipe(gulp.dest('./dist'))
);

gulp.task('default', ['test', 'markdown', 'browserify', 'root-files', 'watchify']);

gulp.task('dist', ['browserify', 'markdown', 'root-files']);


gulp.task( 'deploy', function () {
  var conn = ftp.create( {
    host:     'ftp.swaray.de',
    user:     gutil.env.FTP_USER,
    password: gutil.env.FTP_PASS,
    parallel: 1,
    log:      gutil.log
  } );

  var globs = [
    '**',
  ];

  // using base = '.' will transfer everything to /public_html correctly
  // turn off buffering in gulp.src for best performance
  return gulp.src( globs, { cwd: './dist', buffer: false } )
    .pipe( conn.newer( '/marklabenskidotcom' ) ) // only upload newer files
    .pipe( conn.dest( '/marklabenskidotcom' ) );
} );
