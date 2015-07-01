/// <reference path="../typings/node/node.d.ts"/>
/// <reference path="../typings/mocha/mocha.d.ts"/>
/// <reference path="../typings/chai/chai.d.ts"/>
/// <reference path="../typings/q/Q.d.ts"/>

import fs = require('fs');

require('chai').should();
import Q = require('q');

import CA = require('../src/CertificateAuthority');
import MitmProxy = require('../src/MitmProxy');

describe('MitmProxy', function() {
	var ca: CA;
	var mitmProxy: MitmProxy;

	describe('#listen()', function() {
		before(function() {
			ca = new CA('FR', 'Some-State', 'TestMitmProxy', 'TestMitmProxy');
		});
		it('should start', function(done) {
			mitmProxy = new MitmProxy(undefined, ca).listen(13132, 13133, done);
		});
		it('should proxy HTTP requests (http://example.com)');
		it('should proxy HTTPS requests (https://example.com)');
	});
	describe('#close()', function() {
		it('should stop', function(done) {
			mitmProxy.close(done);
		});
		it('should not proxy HTTP requests anymore (http://example.com)');
		it('should not proxy HTTPS requests anymore (https://example.com)');
	});
	after(function() {
		return Q.nfcall(fs.unlink, 'keys/TestMitmProxy-key.pem').finally(function() {
			return Q.nfcall(fs.unlink, 'keys/TestMitmProxy-CA-cert.pem');
		}).finally(function() {
			return Q.nfcall(fs.unlink, 'keys/TestMitmProxy-CA-cert.srl');
		}).done();
	});
});