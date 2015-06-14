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
		it('should return CertificateAuthority', function() {
			return CA.createCA('FR', 'Some-State', 'Test', 'Test').then(function(value) {
				value.should.be.instanceof(CA);
				ca = value;
			});
		});
		it('should create private key file', function() {
			return Q.nfcall(fs.stat, 'keys/Test-key.pem');
		});
		it('should create CA certificate file', function() {
			return Q.nfcall(fs.stat, 'keys/Test-CA-cert.pem');
		});
		it('should have private key', function() {
			ca.privateKey.indexOf('-----BEGIN PRIVATE KEY-----').should.be.equal(0);
			ca.privateKey.indexOf('-----END PRIVATE KEY-----').should.be.greaterThan(0);
		});
		it('should have CA certificate', function() {
			ca.certificate.indexOf('-----BEGIN CERTIFICATE-----').should.be.equal(0);
			ca.certificate.indexOf('-----END CERTIFICATE-----').should.be.greaterThan(0);
		});
	});
	describe('#generate()', function() {
		before(function() {
			return Q.nfcall(fs.unlink, 'keys/.rnd').catch(function() {
				// No problem, random state file does not exist
			});
		});
		context('when 1st certificate', function() {
			before(function() {
				return ca.sign('*.test.com', 'DNS: test.com');
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
			it('should increment CA serial number');
			it('should return certificate');
		});
		it('should delete openssl.cnf before 1st certificate');
		it('should not need subjectAltName parameter');
		it('should have subfolder to store certificates');
	});
	after(function() {
		return Q.nfcall(fs.unlink, 'keys/Test-key.pem').finally(function() {
			return Q.nfcall(fs.unlink, 'keys/Test-CA-cert.pem');
		}).finally(function() {
			return Q.nfcall(fs.unlink, 'keys/Test-CA-cert.srl')
		})
	});
});