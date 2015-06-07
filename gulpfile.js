/// <reference path="typings/gulp/gulp.d.ts"/>

var gulp = require('gulp');
var tsc = require('gulp-typescript');
var server = require('gulp-express');

var tsProject = tsc.createProject('tsconfig.json');

gulp.task('build', function () {
	return gulp.src('src/**/**.ts')
		.pipe(tsc(tsProject))
		.pipe(gulp.dest('build'));
});

gulp.task('test', function () {
	require('./build/Proxy');
});

gulp.task('run', ['build'], function () {
	server.run(['build/Proxy.js'], undefined, false);
});

gulp.task('serve', ['run'], function () {
	gulp.watch('src/**/**.ts', ['run']);
});