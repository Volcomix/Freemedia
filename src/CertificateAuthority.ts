/// <reference path="../typings/node/node.d.ts"/>
/// <reference path="../typings/q/Q.d.ts"/>

import childProcess = require('child_process');
import util = require('util');
import fs = require('fs');

import Q = require('q');

class CertificateAuthority {

    private countryName: string;
    private stateOrProvinceName: string;
    private organizationName: string;
    private keyFileName: string;
    private caCertFileName: string;

    private _commonName: string;

    private get commonName() {
        return this._commonName;
    }

    private set commonName(value: string) {
        this._commonName = value;
        this.keyFileName = value + '-key.pem';
        this.caCertFileName = value + '-CA-cert.pem';
    }

    private _privateKey: string;

    get privateKey() {
        return this._privateKey;
    }

    private _certificate: string;

    get certificate() {
        return this._certificate;
    }
    
    /**
     * countryName: Country Name (2 letter code)
     * stateOrProvinceName: State or Province Name (full name)
     * organizationName: Organization Name (eg, company)
     * commonName: Common Name (e.g. server FQDN or YOUR name)
     * verbose: Redirect print OpenSSL stdout and stderr
     */
    static createCA(
        countryName: string,
        stateOrProvinceName: string,
        organizationName: string,
        commonName: string,
        verbose?: boolean) {

        var ca = new CertificateAuthority();
        ca.countryName = countryName;
        ca.stateOrProvinceName = stateOrProvinceName;
        ca.organizationName = organizationName;
        ca.commonName = commonName;

        return ca.init(verbose);
    }

    private init(verbose?: boolean) {

        var req = childProcess.spawn('openssl',
            [
                'req', '-newkey', 'rsa:2048', '-sha256',
                '-subj', util.format('/C=%s/ST=%s/O=%s/CN=%s',
                    this.countryName,
                    this.stateOrProvinceName,
                    this.organizationName,
                    this.commonName),
                '-nodes', '-keyout', this.keyFileName
            ], { cwd: 'keys', stdio: verbose ? [null, null, process.stderr] : null });

        var keyPromise = Q.Promise<Buffer>((resolve, reject) => {
            req.on('close', (code) => {
                if (code == 0) {
                    Q.nfcall(fs.readFile, 'keys/' + this.keyFileName)
                        .then(resolve).catch(reject);
                } else {
                    reject(
                        new Error('Generating CA request process exited with code ' + code));
                }
            });
        }).then((data) => { this._privateKey = '' + data; });

        var sign = childProcess.spawn('openssl',
            [
                'x509', '-req', '-signkey', this.keyFileName, '-out', this.caCertFileName
            ], {
                cwd: 'keys',
                stdio: verbose ? [null, process.stdout, process.stderr] : null
            });

        req.stdout.pipe(sign.stdin);

        var certPromise = Q.Promise<Buffer>((resolve, reject) => {
            sign.on('close', (code) => {
                if (code == 0) {
                    Q.nfcall(fs.readFile, 'keys/' + this.caCertFileName)
                        .then(resolve).catch(reject);
                } else {
                    reject(new Error('CA signing process exited with code ' + code));
                }
            });
        }).then((data) => { this._certificate = '' + data });

        return Q.all([keyPromise, certPromise]).then(() => { return this; });
    }

    sign(commonName: string, subjectAltName: string, verbose?: boolean) {
        return Q.Promise((resolve, reject) => {

            var req = childProcess.spawn('openssl',
                [
                    'req', '-new', '-sha256',
                    '-subj', util.format('/C=%s/ST=%s/O=%s/CN=%s',
                        this.countryName,
                        this.stateOrProvinceName,
                        this.organizationName,
                        commonName),
                    '-key', this.keyFileName
                ], { cwd: 'keys', stdio: verbose ? [null, null, process.stderr] : null });

            req.on('close', (code) => {
                if (code != 0) {
                    reject(
                        new Error('Generating request process exited with code ' + code));
                }
            });

            var sign = childProcess.spawn('openssl',
                [
                    'x509', '-req', '-extfile', 'openssl.cnf', '-CAcreateserial',
                    '-CA', this.caCertFileName, '-CAkey', this.keyFileName
                ], {
                    cwd: 'keys',
                    env: { RANDFILE: '.rnd', SAN: subjectAltName },
                    stdio: verbose ? [null, null, process.stderr] : null
                });

            req.stdout.pipe(sign.stdin);

            var certificate = '';
            sign.stdout.on('data', (data) => { certificate += data; });

            sign.on('close', (code) => {
                if (code == 0) {
                    resolve(certificate);
                } else {
                    reject(new Error('Signing process exited with code ' + code));
                }
            });
        });
    }
}

export = CertificateAuthority;