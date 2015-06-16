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
				value.should.be.an.instanceof(CA);
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
	describe('#sign()', function() {
		before(function() {
			return Q.nfcall(fs.unlink, 'ssl/.rnd').catch(function() {
				// No problem, random state file does not exist
			});
		});
		var serial: string;
		context('when 1st certificate', function() {
			it('should return certificate', function() {
				return ca.sign('*.test1.com', 'DNS: test1.com').then(function(certificate) {
					certificate.indexOf('-----BEGIN CERTIFICATE-----').should.be.equal(0);
					certificate.indexOf('-----END CERTIFICATE-----').should.be.greaterThan(0);
				});
			});
			it('should write random state', function() {
				return Q.nfcall(fs.stat, 'ssl/.rnd');
			});
			it('should create CA serial number file', function() {
				return Q.nfcall<Buffer>(fs.readFile, 'keys/Test-CA-cert.srl').then(
					function(data) {
						serial = '' + data;
						serial.should.be.a('string').with.length.above(0);
					});
			});
		});
		context('when 2nd certificate', function() {
			it('should return certificate', function() {
				return ca.sign('*.test2.com', 'DNS: test2.com').then(function(certificate) {
					certificate.indexOf('-----BEGIN CERTIFICATE-----').should.be.equal(0);
					certificate.indexOf('-----END CERTIFICATE-----').should.be.greaterThan(0);
				});
			});
			it('should generate a new CA serial number', function() {
				return Q.nfcall<Buffer>(fs.readFile, 'keys/Test-CA-cert.srl').then(
					function(data) {
						var newSerial = '' + data;
						newSerial.should.be.a('string').not.equal(serial);
						serial = newSerial;
					});
			});
		});
		context('when no subject alt name specified', function() {
			it('should return certificate', function() {
				return ca.sign('*.test3.com').then(function(certificate) {
					certificate.indexOf('-----BEGIN CERTIFICATE-----').should.be.equal(0);
					certificate.indexOf('-----END CERTIFICATE-----').should.be.greaterThan(0);
				});
			});
			it('should generate a new CA serial number', function() {
				return Q.nfcall<Buffer>(fs.readFile, 'keys/Test-CA-cert.srl').then(
					function(data) {
						var newSerial = '' + data;
						newSerial.should.be.a('string').not.equal(serial);
					});
			});
		});
		it('should store certificates into subfolders');
	});
	after(function() {
		return Q.nfcall(fs.unlink, 'keys/Test-key.pem').finally(function() {
			return Q.nfcall(fs.unlink, 'keys/Test-CA-cert.pem');
		}).finally(function() {
			return Q.nfcall(fs.unlink, 'keys/Test-CA-cert.srl')
		})
	});
});