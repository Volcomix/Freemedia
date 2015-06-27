/// <reference path="../typings/node/node.d.ts"/>
/// <reference path="../typings/express/express.d.ts"/>
/// <reference path="../typings/http-proxy/http-proxy.d.ts"/>

import url = require('url');

import express = require('express');
import httpProxy = require('http-proxy');

import CA = require('./CertificateAuthority');
import ProxyServer = require('./ProxyServer');

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
var proxyServer = new ProxyServer(app, ca, true).listen(3128, () => {

    var host = proxyServer.address.address;
    var port = proxyServer.address.port;

    console.log('Proxy listening at http://%s:%s', host, port);

});