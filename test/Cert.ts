/// <reference path="../typings/node/node.d.ts"/>
/// <reference path="../typings/mocha/mocha.d.ts"/>
/// <reference path="../typings/chai/chai.d.ts"/>

import fs = require('fs');

import Q = require('q');
require('chai').should();

import Cert = require('../src/Cert');

describe('Cert', function() {
	describe('#init', function() {
		before(function() {
			return Cert.init(true);
		})
		it('should create private key file', function() {
			return Q.nfcall(fs.stat, 'keys/freemedia-key.pem');
		});
		it('should create CA certificate file', function() {
			return Q.nfcall(fs.stat, 'keys/freemedia-cert.pem');
		});
		it('should return private key');
		it('should return CA certificate');
	});

	describe('#generate', function() {
		it('should return certificate');
	});
});