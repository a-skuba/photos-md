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
    del = require('del'),
    babel = require('gulp-babel'),
    svgstore = require('gulp-svgstore'),
    svgmin = require('gulp-svgmin'),
    minify = require('gulp-minify'),
    sass = require('gulp-sass');

var ftpData = require('./ftp.json');

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
            //"plugins": ['transform-es2015-modules-umd']
            "presets": [
                ["env", {
                    "targets": {
                        "browsers": ['last 2 versions', 'safari >= 7']
                    },
                    "modules": "umd",
                    //"include": ['transform-es2015-modules-umd']
                }]
            ],
        }))
        .pipe(minify({
            preserveComments: 'some',
            ext: {
                src: '.js',
                min:'.min.js'
            },
            output: {
                comments: 'some'
            },
            //exclude: ['/dir'],
            ignoreFiles: ['.min.js']
        }))
        .pipe(gulp.dest('dist'));
});


// SVG
gulp.task('svg', function () {
    return gulp
        .src('src/sprite/!(symbol-defs)*.svg')
        .pipe(svgmin({
            plugins: [
                { removeDesc: true }
            ]
        }))
        .pipe(svgstore())
        .pipe(gulp.dest('dist'));
});

// WATCH
gulp.task('watch', ['build'], function () {
    gulp.watch('src/css/photos-md.scss', ['sass']);
    gulp.watch('src/js/*.js', ['js']);
});

// SERVE
gulp.task('serve', ['dev', 'server']);
// BUILD
gulp.task('build', ['js', 'sass', 'svg']);
// UPLOAD
gulp.task('upload', ['demo'], function () {
    return gulp.src('demo/**/*')
        .pipe(ftp(ftpData));
});

// DEMO
gulp.task('demo', ['build'], function () {
    return gulp.src(['dist/photos-md.?(css|js|min.js)', 'dist/sprite.svg'])
        .pipe(gulp.dest('demo/assets'));
});
// DEV
gulp.task('dev', ['demo'], function () {
    gulp.watch('src/**/*', ['demo']);
});

// SERVER
gulp.task('server', function () {
    return browserSync.init({
        files: [
            "dist/**/*.?(css|js|png|jpeg|jpg)",
            "*.?(php|html)"
        ],
        proxy: "http://pmd.anej/",
        logFileChanges: true,
        browser: ["chrome"],
        injectChanges: true,
        //startPath: "/demo"
    });
});

// CLEAN
gulp.task('clean', function () {
    return del([
        'dist/*.css',
        'dist/*.js'
    ]);
});
