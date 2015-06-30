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
	before(function() {
		ca = new CA('FR', 'Some-State', 'TestMitmProxy', 'TestMitmProxy');
		mitmProxy = new MitmProxy(undefined, ca);
	});
	it('should start');
	it('should proxy HTTP requests (http://example.com)');
	it('should proxy HTTPS requests (https://example.com)');
	it('should stop');
	after(function() {
		return Q.nfcall(fs.unlink, 'keys/TestMitmProxy-key.pem').finally(function() {
			return Q.nfcall(fs.unlink, 'keys/TestMitmProxy-CA-cert.pem');
		}).finally(function() {
			return Q.nfcall(fs.unlink, 'keys/TestMitmProxy-CA-cert.srl');
		}).done();
	});
});