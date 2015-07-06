/// <reference path="typings/tsd.d.ts" />

var gulp = require('gulp');
var tsc = require('gulp-typescript');
var nodemon = require('gulp-nodemon');
var browserSync = require('browser-sync').create();

var tsProject = tsc.createProject('tsconfig.json');

gulp.task('build', function () {
	return gulp.src('src/**/*.ts')
		.pipe(tsc(tsProject))
		.pipe(gulp.dest('release'));
});

gulp.task('watch', function () {
	gulp.watch('src/**/*.ts', ['build']);
});

gulp.task('develop', ['build', 'watch'], function () {
	nodemon({
		script: 'release/Freemedia.js',
		watch: ['release/Freemedia.js']
	});
});

gulp.task('test', ['develop'], function () {
	browserSync.init({
        proxy: 'localhost:8080'
    });
	
	gulp.watch("app/**").on('change', browserSync.reload);
});