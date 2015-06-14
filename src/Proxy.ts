/// <reference path="../typings/node/node.d.ts"/>
/// <reference path="../typings/express/express.d.ts"/>
/// <reference path="../typings/http-proxy/http-proxy.d.ts"/>

import http = require('http');
import https = require('https');
import tls = require('tls');
import fs = require('fs');
import net = require('net');
import url = require('url');

import express = require('express');
import httpProxy = require('http-proxy');

import Cert = require('./Cert');

var proxy = httpProxy.createProxyServer({});

proxy.on('error', function(err, req, res) {
    console.error(err);
});

var app = express();

app.use(function(req, res) {
    var reqUrl: url.Url;
    if (req.secure) {
        reqUrl = url.parse(url.resolve(req.protocol + '://' + req.header('host'), req.url));
    } else {
        reqUrl = url.parse(req.url);
    }

    var options: httpProxy.Options = {
        target: reqUrl.protocol + '//' + reqUrl.host
    };

    console.log(reqUrl.href);

    proxy.web(req, res, options);
});

var proxyServer = http.createServer(app);

var options = {
    key: fs.readFileSync('keys/freemedia-key.pem'),
    cert: fs.readFileSync('keys/freemedia-cert.pem')
};
var mitmServer = https.createServer(options, app);

mitmServer.on('connect', function(
    req: http.IncomingMessage,
    cltSocket: net.Socket,
    head: { [key: string]: string; }) {

    console.log('MITM receive connect: ' + req.url);
});

mitmServer.listen(3129, function() {
    var host = mitmServer.address().address;
    var port = mitmServer.address().port;

    console.log('Internal MITM server listening at https://%s:%s', host, port);
});

proxyServer.on('connect', function(
    req: http.IncomingMessage,
    cltSocket: net.Socket,
    head: { [key: string]: string; }) {

    console.log('Getting peer certificate: ' + req.url);

    var srvUrl = url.parse('https://' + req.url);
    var srvSocket = tls.connect(parseInt(srvUrl.port), srvUrl.hostname, undefined,
        function() {
            var peerCertificate = srvSocket.getPeerCertificate();

            Cert.generate(peerCertificate.subject.CN, peerCertificate.subjectaltname)
                .then(function(certificate) {

                mitmServer.addContext(srvUrl.hostname, {
                    key: '' + fs.readFileSync('keys/freemedia-key.pem'),
                    cert: '' + certificate,
                    ca: '' + fs.readFileSync('keys/freemedia-cert.pem')
                });

                console.log('Piping to MITM server: ' + req.url);

                var mitmSocket = net.connect(
                    mitmServer.address().port,
                    mitmServer.address().address,
                    function() {
                        cltSocket.write(
                            'HTTP/1.1 200 Connection Established\r\n' +
                            '\r\n');
                        mitmSocket.write(head);
                        mitmSocket.pipe(cltSocket);
                        cltSocket.pipe(mitmSocket);
                    });

                mitmSocket.on('error', function(err) {
                    console.error(err);
                });
            });
        });
});

proxyServer.listen(3128, function() {

    var host = proxyServer.address().address;
    var port = proxyServer.address().port;

    console.log('Proxy listening at http://%s:%s', host, port);

});