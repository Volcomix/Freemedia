/// <reference path="../typings/node/node.d.ts"/>

import http = require('http');
import net = require('net');

import MitmServer = require('./MitmServer');

class ProxyServer {

    public server: http.Server;

    get address() {
        return this.server.address();
    }

    constructor(
        private requestListener:
        (request: http.IncomingMessage, response: http.ServerResponse) => void,
        private mitmServer = new MitmServer(requestListener),
        private verbose?: boolean) {

        this.server = http.createServer(requestListener);
    }

    listen(port: number, hostname?: string, backlog?: number, cb?: Function): ProxyServer;
    listen(port: number, hostname?: string, cb?: Function): ProxyServer;
    listen(path: string, cb?: Function): ProxyServer;
    listen(handle: any, listeningListener?: Function): ProxyServer;
    listen(...args): ProxyServer {
        this.server.listen.apply(this.server, args).on('connect', (
            req: http.IncomingMessage,
            cltSocket: net.Socket,
            head: { [key: string]: string; }) => {

            if (this.verbose) {
                console.log('Piping to MITM server: ' + req.url);
            }

            var mitmSocket = net.connect(
                this.mitmServer.address.port,
                this.mitmServer.address.address,
                () => {
                    cltSocket.write(
                        'HTTP/1.1 200 Connection Established\r\n' +
                        '\r\n');
                    mitmSocket.write(head);
                    mitmSocket.pipe(cltSocket);
                    cltSocket.pipe(mitmSocket);
                });

            mitmSocket.on('error', (err) => {
                console.error(err);
            });
        });
        return this;
    }

    close(): http.Server {
        return this.server.close();
    }
}

export = ProxyServer;