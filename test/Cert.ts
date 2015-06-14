/// <reference path="../typings/node/node.d.ts"/>
/// <reference path="../typings/mocha/mocha.d.ts"/>
/// <reference path="../typings/chai/chai.d.ts"/>

import fs = require('fs');

import Q = require('q');
require('chai').should();

import Cert = require('../src/Cert');

describe('Cert', function() {
	describe('#init()', function() {
		before(function() {
			return Cert.init(true);
		});
		it('should create private key file', function() {
			return Q.nfcall(fs.stat, 'keys/freemedia-key.pem');
		});
		it('should create CA certificate file', function() {
			return Q.nfcall(fs.stat, 'keys/freemedia-cert.pem');
		});
		it('should return private key');
		it('should return CA certificate');
		it('should take parameters (filename, C, ST, O, CN, ...)');
		it('should create dedicated CA certificate for tests');
		it('should create files with "CA" in filename');
		it('should remove all test files when done');
	});
	describe('#generate()', function() {
		before(function() {
			return Q.nfcall(fs.unlink, 'keys/.rnd').catch(function() {
				// No problem, random state file does not exist
			}).finally(function() {
				return Cert.generate('*.test.com', 'DNS: test.com');
			});
		});
		context('when 1st certificate', function() {
			it('should create OpenSSL config file if not exists');
			it('should write random state', function() {
				return Q.nfcall(fs.stat, 'keys/.rnd');
			});
			it('should create CA serial number file', function() {
				return Q.nfcall(fs.stat, 'keys/freemedia-cert.srl');
			});
			it('should return certificate');
		});
		context('when 2nd certificate', function() {
			it('should write random state');
			it('should increment CA serial number');
			it('should return certificate');
		});
		it('should not print stdout');
		it('should delete openssl.cnf before 1st certificate');
		it('should use dedicated CA certificate for tests');
		it('should not need subjectAltName parameter');
		it('should remove all test files when done');
		it('should have subfolder for certificates');
	});
});