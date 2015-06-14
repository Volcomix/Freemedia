/// <reference path="../typings/node/node.d.ts"/>
/// <reference path="../typings/q/Q.d.ts"/>

// openssl req -newkey rsa:2048 -sha256 -subj /C=FR/ST=Some-State/O=Freemedia/CN=Freemedia -nodes -keyout freemedia-key.pem | openssl x509 -req -signkey freemedia-key.pem -out freemedia-cert.pem
// openssl req -new -sha256 -subj /CN=duckduckgo.com -key freemedia-key.pem | openssl x509 -req -CA freemedia-cert.pem -CAkey freemedia-key.pem -CAcreateserial -serial -out duckduckgo.com-cert.pem

import childProcess = require('child_process');

import Q = require('q');

export function init(silent?: boolean) {
    return Q.Promise(function(resolve, reject) {

        var req = childProcess.spawn('openssl',
            [
                'req',
                '-newkey',
                'rsa:2048',
                '-sha256',
                '-subj', '/C=FR/ST=Some-State/O=Freemedia/CN=Freemedia',
                '-nodes',
                '-keyout', 'freemedia-key.pem'
            ], {
                cwd: 'keys',
                stdio: silent ? null : [null, null, process.stderr]
            });

        req.on('close', function(code) {
            if (code != 0) {
                reject(new Error('Generating CA request process exited with code ' + code));
            }
        });

        var sign = childProcess.spawn('openssl',
            [
                'x509',
                '-req',
                '-signkey', 'freemedia-key.pem',
                '-out', 'freemedia-cert.pem'
            ], {
                cwd: 'keys',
                stdio: silent ? null : [null, process.stdout, process.stderr]
            });

        req.stdout.pipe(sign.stdin);

        sign.on('close', function(code) {
            if (code == 0) {
                resolve(code);
            } else {
                reject(new Error('CA signing process exited with code ' + code));
            }
        });
    });
}

export function generate(commonName: string, subjectAltName: string) {
    return Q.Promise(function(resolve, reject) {

        var req = childProcess.spawn('openssl',
            [
                'req',
                '-new',
                '-sha256',
                '-subj', '/C=FR/ST=Some-State/O=Freemedia/CN=' + commonName,
                '-key', 'freemedia-key.pem'
            ], {
                cwd: 'keys',
                stdio: [null, null, process.stderr]
            });

        req.on('close', function(code) {
            if (code != 0) {
                reject(new Error('Generating request process exited with code ' + code));
            }
        });

        var sign = childProcess.spawn('openssl',
            [
                'x509',
                '-req',
                '-extfile', 'openssl.cnf',
                '-CA', 'freemedia-cert.pem',
                '-CAkey', 'freemedia-key.pem',
                '-CAcreateserial'
            ], {
                cwd: 'keys',
                env: {
                    RANDFILE: '.rnd',
                    SAN: subjectAltName
                },
                stdio: [null, null, process.stderr]
            });

        req.stdout.pipe(sign.stdin);

        var certificate = '';
        sign.stdout.on('data', function(data) {
            certificate += data;
        });

        sign.on('close', function(code) {
            if (code == 0) {
                resolve(certificate);
            } else {
                reject(new Error('Signing process exited with code ' + code));
            }
        });
    });
}