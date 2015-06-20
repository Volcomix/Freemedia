import https = require('https');
import tls = require('tls');
import util = require('util');

import CA = require('CertificateAuthority');

class MitmServer {

    private ca: CA;
    private sni: tls.SecureContext[] = [];

    constructor(private requestListener?: Function) {
        this.ca = new CA('FR', 'Some-State', 'Freemedia', 'Freemedia');
    }

    private getSecureContext(servername: string, callback: Function) {

        var domain = servername.split('.').slice(-2).join('.');

        Q.Promise<tls.SecureContext>((resolve) => {
            var context: tls.SecureContext = this.sni[domain];

            if (context) {
                resolve(context);
            } else {
                var commonName = '*.' + domain;
                var subjectAltName = util.format('DNS: %s, DNS: %s', commonName, domain);

                console.log('Signing certificate: ' + commonName);

                this.ca.sign(commonName, subjectAltName).then((certificate) => {
                    return [certificate, this.ca.caCertificate];
                }).spread((certificate: string, caCert: CA.CACertificate) => {
                    resolve(this.sni[domain] = tls.createSecureContext({
                        key: caCert.privateKey,
                        cert: certificate,
                        ca: caCert.certificate
                    }));
                });
            }
        }).then((context) => { callback(null, context); });
    }

    private createServer(): Q.Promise<https.Server> {
        return this.ca.caCertificate.then((caCert) => {

            return https.createServer(<any>{
                key: caCert.privateKey,
                cert: caCert.certificate,
                SNICallback: this.getSecureContext
            }, this.requestListener);

        });
    }

    listen(port: number, hostname?: string, backlog?: number, callback?: Function)
        : https.Server {

    }

    listen(port: number, hostname?: string, callback?: Function): https.Server {

    }

    listen(path: string, callback?: Function): https.Server {

    }

    listen(handle: any, listeningListener?: Function): https.Server {

    }
}

export = MitmServer;