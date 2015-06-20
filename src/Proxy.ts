/// <reference path="../typings/node/node.d.ts"/>
/// <reference path="../typings/express/express.d.ts"/>
/// <reference path="../typings/http-proxy/http-proxy.d.ts"/>

import http = require('http');
import https = require('https');
import tls = require('tls');
import fs = require('fs');
import net = require('net');
import url = require('url');
import util = require('util');

import express = require('express');
import httpProxy = require('http-proxy');
import Q = require('q');

import CA = require('./CertificateAuthority');
import MitmServer = require('./MitmServer');

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

    //console.log(reqUrl.href);

    proxy.web(req, res, options);
});

var ca = new CA('FR', 'Some-State', 'Freemedia', 'Freemedia');

var mitmServer = new MitmServer(app, ca).listen(3129, () => {
    var host = mitmServer.address.address;
    var port = mitmServer.address.port;

    console.log('Internal MITM server listening at https://%s:%s', host, port);
});

var proxyServer = http.createServer(app).listen(3128, () => {

    var host = proxyServer.address().address;
    var port = proxyServer.address().port;

    console.log('Proxy listening at http://%s:%s', host, port);

});

proxyServer.on('connect', (
    req: http.IncomingMessage,
    cltSocket: net.Socket,
    head: { [key: string]: string; }) => {

    //console.log('Piping to MITM server: ' + req.url);

    var mitmSocket = net.connect(
        mitmServer.address.port,
        mitmServer.address.address,
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