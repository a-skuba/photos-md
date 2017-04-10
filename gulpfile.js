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
    ftp = require('vinyl-ftp'),
    del = require('del'),
    plumber = require('gulp-plumber'),
    babel = require('gulp-babel'),
    sourcemaps = require('gulp-sourcemaps'),
    svgstore = require('gulp-svgstore'),
    svgmin = require('gulp-svgmin'),
    minify = require('gulp-minify'),
    sass = require('gulp-sass');

var conf = require('./conf.json');

// SASS
gulp.task('sass', function () {
    return gulp.src('src/css/photos-md.scss')
        .pipe(plumber())
        .pipe(sass({
            errLogToConsole: true,      // log to console
            outputStyle: 'compressed',  // nested, expanded, compact, compressed
        }))
        .pipe(autoprefixer(['last 3 versions', '> 1% in SI']))
        .pipe(plumber.stop())
        .pipe(gulp.dest('dist'));
});

// JS
gulp.task('js', function () {
    return gulp.src('src/js/*.js')
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(babel({
            //"plugins": ['transform-es2015-modules-umd']
            "sourceMaps": true,
            "presets": [
                ["env", {
                    "targets": {
                        "browsers": ['last 3 versions', 'safari >= 7', '> 1% in SI']
                    },
                    "modules": "umd",
                    //"include": ['transform-es2015-modules-umd']
                }]
            ],
        }))
        .pipe(sourcemaps.write()) //('.'))
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
            ignoreFiles: ['.min.js', '*.map']
        }))
        .pipe(plumber.stop())
        .pipe(gulp.dest('dist'));
});


// SVG
gulp.task('svg', function () {
    return gulp.src('src/sprite/!(symbol-defs)*.svg')
        .pipe(plumber())
        .pipe(svgmin({
            plugins: [
                { removeDesc: true }
            ]
        }))
        .pipe(svgstore())
        .pipe(plumber.stop())
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
    let conn = ftp.create(conf.ftp);

    return gulp.src(conf.ftp.src)
        .pipe(conn.newerOrDifferentSize(conf.ftp.remotePath))
        .pipe(conn.dest(conf.ftp.remotePath));
});
// LIVE
gulp.task('live', ['upload'], function () {
    gulp.watch(['src/**/*', 'demo/**/*.?(jpg|html|php)'], ['upload']);
});

// DEMO
gulp.task('demo', ['build'], function () {
    return gulp.src(['dist/photos-md.?(css|js|min.js|js.map)', 'dist/sprite.svg'])
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
        proxy: conf.bs.proxy,
        logFileChanges: true,
        browser: conf.bs.browser,
        injectChanges: true,
        notify: true,
        startPath: "?debug"
    });
});

// CLEAN
gulp.task('clean', function () {
    return del([
        'dist/*.css',
        'dist/*.js',
        'dist/*.map',
        'dist/*.svg'
    ]);
});
// CLEAN-DEMO
gulp.task('clean-all', function () {
    return del([
        'demo/assets/*.css',
        'demo/assets/*.js',
        'demo/assets/*.map',
        'demo/assets/*.svg'
    ]);
});
