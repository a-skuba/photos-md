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
    sass = require('gulp-sass');

// SASS
gulp.task('sass', function () {
    return gulp.src('src/css/photos-md.scss')
        .pipe(sass({
            errLogToConsole: true,      // log to console
            outputStyle: 'compressed',  // nested, expanded, compact, compressed
        }))
        .pipe(autoprefixer(['last 3 versions', '> 1% in SI']))
        //.pipe(browserSync.stream())
        .pipe(ftp(ftpData))
        .pipe(gulp.dest('dist'));
});

// WATCH
gulp.task('watch', ['sass'], function () {
    gulp.watch('src/css/photos-md.scss', ['sass']);
});

// SERVE
gulp.task('serve', function () {
    browserSync.init({
        proxy: "localhost",
        /*server: {
            baseDir: 'demo'
        }*/
    });
});