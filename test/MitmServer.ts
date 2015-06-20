/// <reference path="../typings/node/node.d.ts"/>
/// <reference path="../typings/mocha/mocha.d.ts"/>
/// <reference path="../typings/chai/chai.d.ts"/>

import net = require('net');

require('chai').should();

import MitmServer = require('../src/MitmServer');

describe('MitmServer', function() {
	var mitmServer: MitmServer;

	describe('#listen()', function() {
		it('should start', function(done) {
			mitmServer = new MitmServer().listen(13129, done);
		});
		it('should be listening', function(done) {
			mitmServer.address.port.should.be.equal(13129);
			var client = net.connect(13129, 'localhost', function() {
				client.end();
			});
			client.on('error', done);
			client.on('end', done);
		});
	});
	context('when started', function() {
		it('should proxy HTTPS requests with SNI');
		it('should proxy HTTPS requests without SNI');
	});
	describe('#close()', function() {
		it('should stop', function(done) {
			mitmServer.close().on('close', done);
		});
		it('should not be listening anymore', function(done) {
			var client = net.connect(13129, 'localhost', function() {
				client.end();
				done(new Error('MitmServer is still listening on port 13129'));
			});
			client.on('error', function() { done(); });
		});
	});
});