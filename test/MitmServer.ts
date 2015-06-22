/// <reference path="../typings/node/node.d.ts"/>
/// <reference path="../typings/mocha/mocha.d.ts"/>
/// <reference path="../typings/chai/chai.d.ts"/>
/// <reference path="../typings/q/Q.d.ts"/>

import net = require('net');
import https = require('https');
import fs = require('fs');

require('chai').should();
import Q = require('q');

import CA = require('../src/CertificateAuthority');
import MitmServer = require('../src/MitmServer');

describe('MitmServer', function() {
	var ca = new CA('FR', 'Some-State', 'TestMITM', 'TestMITM');
	var mitmServer: MitmServer;

	describe('#listen()', function() {
		it('should start', function(done) {
			mitmServer = new MitmServer(function(request, response) {
				response.writeHead(200, { 'Content-Type': 'text/plain' });
				response.end('OK');
			}, ca).listen(13129, done);
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
		it('should proxy HTTPS requests without SNI', function(done) {
			ca.caCertificate.then(function(caCert) {
				var options = {
					port: 13129,
					ca: caCert.certificate,
					agent: false
				};

				var request = https.get(options, function(response) {
					response.statusCode.should.be.equal(200);
					response.on('data', function(data) {
						('' + data).should.be.equal('OK');
					});
					response.on('end', done);
				});
				request.on('error', done);
			});
		});
		it('should proxy HTTPS requests with SNI');
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
	after(function() {
		return Q.nfcall(fs.unlink, 'keys/TestMITM-key.pem').finally(function() {
			return Q.nfcall(fs.unlink, 'keys/TestMITM-CA-cert.pem');
		}).finally(function() {
			return Q.nfcall(fs.unlink, 'keys/TestMITM-CA-cert.srl')
		}).done();
	});
});