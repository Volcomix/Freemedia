/// <reference path="../typings/node/node.d.ts"/>
/// <reference path="../typings/mocha/mocha.d.ts"/>
/// <reference path="../typings/chai/chai.d.ts"/>

import fs = require('fs');

import Q = require('q');
require('chai').should();

import CA = require('../src/CertificateAuthority');

describe('CertificateAuthority', function() {
	var ca: CA;
	describe('#createCA()', function() {
		before(function() {
			return CA.createCA('FR', 'Some-State', 'Test', 'Test').then(function(value) {
				ca = value;
			});
		});
		it('should return CertificateAuthority');
		it('should create private key file', function() {
			return Q.nfcall(fs.stat, 'keys/Test-key.pem');
		});
		it('should create CA certificate file', function() {
			return Q.nfcall(fs.stat, 'keys/Test-CA-cert.pem');
		});
		it('should return private key');
		it('should return CA certificate');
	});
	describe('#generate()', function() {
		before(function() {
			return Q.nfcall(fs.unlink, 'keys/.rnd').catch(function() {
				// No problem, random state file does not exist
			});
		});
		context('when 1st certificate', function() {
			before(function() {
				return ca.generate('*.test.com', 'DNS: test.com');
			});
			it('should return certificate');
			it('should create OpenSSL config file if not exists');
			it('should write random state', function() {
				return Q.nfcall(fs.stat, 'keys/.rnd');
			});
			it('should create CA serial number file', function() {
				return Q.nfcall(fs.stat, 'keys/Test-CA-cert.srl');
			});
		});
		context('when 2nd certificate', function() {
			it('should write random state');
			it('should increment CA serial number');
			it('should return certificate');
		});
		it('should delete openssl.cnf before 1st certificate');
		it('should not need subjectAltName parameter');
		it('should have subfolder for certificates');
	});
	after(function() {
		return Q.nfcall(fs.unlink, 'keys/Test-key.pem').finally(function() {
			return Q.nfcall(fs.unlink, 'keys/Test-CA-cert.pem');
		}).finally(function() {
			return Q.nfcall(fs.unlink, 'keys/Test-CA-cert.srl')
		})
	});
});