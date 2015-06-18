/// <reference path="../typings/node/node.d.ts"/>
/// <reference path="../typings/q/Q.d.ts"/>

import childProcess = require('child_process');
import util = require('util');
import fs = require('fs');

import Q = require('q');

class CertificateAuthority {

    private static configFile = 'ssl/openssl.cnf';
    private static randFile = 'ssl/.rnd';

    private countryName: string;
    private stateOrProvinceName: string;
    private organizationName: string;
    private commonName: string;

    private get keyFile() {
        return 'keys/' + this.commonName + '-key.pem';
    }

    private get caCertFile() {
        return 'keys/' + this.commonName + '-CA-cert.pem';
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
    static create(
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

        return Q.all([
            Q.nfcall(fs.stat, this.keyFile),
            Q.nfcall(fs.stat, this.caCertFile)
        ]).catch(() => {

            var req = childProcess.spawn('openssl',
                [
                    'req', '-newkey', 'rsa:2048', '-sha256',
                    '-subj', util.format('/C=%s/ST=%s/O=%s/CN=%s',
                        this.countryName,
                        this.stateOrProvinceName,
                        this.organizationName,
                        this.commonName),
                    '-nodes', '-keyout', this.keyFile
                ], { stdio: verbose ? [null, null, process.stderr] : null });

            var sign = childProcess.spawn('openssl',
                ['x509', '-req', '-signkey', this.keyFile, '-out', this.caCertFile],
                { stdio: verbose ? [null, process.stdout, process.stderr] : null });

            req.stdout.pipe(sign.stdin);

            req.on('close', (code) => {
                if (code != 0) {
                    throw new Error('Generating CA request process exited with code ' + code);
                }
            });

            return Q.Promise((resolve, reject) => {
                sign.on('close', (code) => {
                    if (code == 0) {
                        resolve(code);
                    } else {
                        throw new Error('CA signing process exited with code ' + code);
                    }
                });
            });

        }).then(() => {
            return [
                Q.nfcall(fs.readFile, this.keyFile),
                Q.nfcall(fs.readFile, this.caCertFile)
            ];
        }).spread<CertificateAuthority>((privateKey, certificate) => {
            this._privateKey = '' + privateKey;
            this._certificate = '' + certificate;
            return this;
        });

    }

    sign(commonName: string, subjectAltName?: string, verbose?: boolean) {

        var req = childProcess.spawn('openssl',
            [
                'req', '-new', '-sha256',
                '-subj', util.format('/C=%s/ST=%s/O=%s/CN=%s',
                    this.countryName,
                    this.stateOrProvinceName,
                    this.organizationName,
                    commonName),
                '-key', this.keyFile
            ], { stdio: verbose ? [null, null, process.stderr] : null });

        var args = [
            'x509', '-req', '-CAcreateserial',
            '-CA', this.caCertFile,
            '-CAkey', this.keyFile
        ];

        if (subjectAltName) {
            args.push('-extfile', CertificateAuthority.configFile);
        }

        var sign = childProcess.spawn('openssl', args, {
            env: { RANDFILE: CertificateAuthority.randFile, SAN: subjectAltName },
            stdio: verbose ? [null, null, process.stderr] : null
        });

        req.stdout.pipe(sign.stdin);

        var certificate = '';
        sign.stdout.on('data', (data) => { certificate += data; });

        req.on('close', (code) => {
            if (code != 0) {
                throw new Error('Generating request process exited with code ' + code);
            }
        });

        return Q.Promise<string>((resolve, reject) => {
            sign.on('close', (code) => {
                if (code == 0) {
                    resolve(certificate);
                } else {
                    throw new Error('Signing process exited with code ' + code);
                }
            });
        });
    }
}

export = CertificateAuthority;