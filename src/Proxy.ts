/// <reference path="../typings/node/node.d.ts"/>
/// <reference path="../typings/express/express.d.ts"/>
/// <reference path="../typings/request/request.d.ts"/>

import url = require('url');

import express = require('express');
import request = require('request');

import CA = require('./CertificateAuthority');
import MitmServer = require('./MitmServer');
import ProxyServer = require('./ProxyServer');

var app = express();

app.use(function(req, res) {
    var reqUrl: string;
    if (req.secure) {
        reqUrl = url.resolve(req.protocol + '://' + req.header('host'), req.url);
    } else {
        reqUrl = req.url;
    }

    console.log(reqUrl);

    req.pipe(request(reqUrl)).pipe(res);
});

var ca = new CA('FR', 'Some-State', 'Freemedia', 'Freemedia');

var mitmServer = new MitmServer(app, ca).listen(3129, () => {
    var host = mitmServer.address.address;
    var port = mitmServer.address.port;

    console.log('MITM server listening at https://%s:%s', host, port);
});

var proxyServer = new ProxyServer(app, mitmServer).listen(3128, () => {

    var host = proxyServer.address.address;
    var port = proxyServer.address.port;

    console.log('Proxy listening at http://%s:%s', host, port);

});