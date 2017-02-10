// ==========================================================================
// Gulp build script
//
// [help] https://css-tricks.com/gulp-for-beginners/
//        https://una.im/gulp-local-psi/
// [autoprefix] https://github.com/postcss/autoprefixer#browsers
// [browserlist] https://github.com/ai/browserslist#browsers
// ==========================================================================

var gulp = require('gulp'),
    browserSync = require('browser-sync').create(),
    autoprefixer = require('gulp-autoprefixer'),
    ftp = require('gulp-ftp'),
    ftpData = require('./ftp.json'),
    babel = require('gulp-babel'),
    minify = require('gulp-minify'),
    sass = require('gulp-sass');

// SASS
gulp.task('sass', function () {
    return gulp.src('src/css/photos-md.scss')
        .pipe(sass({
            errLogToConsole: true,      // log to console
            outputStyle: 'compressed',  // nested, expanded, compact, compressed
        }))
        .pipe(autoprefixer(['last 3 versions', '> 1% in SI']))
        //.pipe(ftp(ftpData))
        .pipe(gulp.dest('dist'));
});

// JS
gulp.task('js', function () {
  return gulp.src('src/js/*.js')
      .pipe(babel({
          plugins: ['transform-es2015-modules-umd']
    }))
    .pipe(minify({
        ext: {
            src: '.js',
            min:'.min.js'
        },
        //exclude: ['/dir'],
        ignoreFiles: ['.min.js', 'xapp.js']
    }))
    .pipe(gulp.dest('dist'));
});

// WATCH
gulp.task('watch', ['js', 'sass'], function () {
    gulp.watch('src/css/photos-md.scss', ['sass']);
    gulp.watch('src/js/*.js', ['js']);
});

// SERVE
gulp.task('server', function () {
    return browserSync.init({
        files: [
            "dist/**/*.?(css|js|png|jpeg|jpg)",
            "*.?(php|html)"
        ],
        proxy: "http://pmd.localhost/",
        logFileChanges: true,
        browser: ["chrome"],
        injectChanges: true,
        //startPath: "/demo"
    });
});
