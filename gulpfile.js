'use strict';

var gulp = require('gulp');
// var ts = require("gulp-typescript");
var sass = require('gulp-sass');

// var tsProject = ts.createProject('tsconfig.json');

var electron = require('electron-connect').server.create();

var baseURL = './'
var config = {
    scripts: { 
        in: baseURL + 'src/scripts/**/*',
        out: baseURL + 'app/assets/js/',
        watch: baseURL + '/src/scripts/**/*'
    },
    styles: {
        in: baseURL + 'src/styles/main.scss',
        out: baseURL + '/app/assets/css/',
        watch: baseURL + '/src/styles/**'
    },
    electron: {
        main: 'main.js',
        template: 'index.html'
    }
}

gulp.task('scripts:move', () => {
    var tsResult = gulp.src(config.scripts.in)
        // .pipe(tsProject().on('error', console.log));
    return tsResult.pipe(gulp.dest(config.scripts.out));
});

gulp.task('styles:compile', function () {
    return gulp.src(config.styles.in)
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest(config.styles.out));
});

gulp.task('serve', () => {

    // Start browser process
    electron.start();

    gulp.watch(config.styles.watch, ['styles:compile']);
    gulp.watch(config.scripts.watch, ['scripts:move']);

    // Restart browser process
    gulp.watch(config.electron.main, electron.restart);

    // Reload renderer process
    gulp.watch([config.scripts.watch, config.styles.watch, config.electron.template], electron.reload);
});