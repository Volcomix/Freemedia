/// <reference path="typings/gulp/gulp.d.ts"/>
/// <reference path="typings/gulp-typescript/gulp-typescript.d.ts"/>
/// <reference path="typings/gulp-mocha/gulp-mocha.d.ts" />

var gulp = require('gulp');
var tsc = require('gulp-typescript');
var nodemon = require('gulp-nodemon');
var mocha = require('gulp-mocha');

var tsProject = tsc.createProject('tsconfig.json');

gulp.task('build', function () {
	return gulp.src('src/**/*.ts')
		.pipe(tsc(tsProject))
		.pipe(gulp.dest('build/src'));
});

gulp.task('build:test', function () {
	return gulp.src(['src/**/*.ts', 'test/**/*.ts'], { base: '.' })
		.pipe(tsc(tsProject))
		.pipe(gulp.dest('build'));
});

gulp.task('watch', function () {
	gulp.watch('src/**/*.ts', ['build']);
});

gulp.task('develop', ['build', 'watch'], function () {
	nodemon({
		script: 'build/src/Proxy.js',
		watch: ['build/src/Proxy.js']
	});
});

gulp.task('test', ['build:test'], function () {
	return gulp.src('build/test/**/*.js')
		.pipe(mocha());
});

gulp.task('start:MitmServer', ['build'], function () {
	var MitmServer = require('./build/src/MitmServer');

	var mitmServer = new MitmServer(function (request, response) {
		response.writeHead(200, { 'Content-Type': 'text/plain' });
		response.end('OK');
	}).listen(3129, function () {
		var host = mitmServer.address.address;
		var port = mitmServer.address.port;

		console.log('Proxy listening at https://%s:%s', host, port);
	});
});