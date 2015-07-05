/// <reference path="../typings/tsd.d.ts"/>
var express = require('express');
var WebSocket = require('ws');
var CA = require('certificate-authority');
var MitmProxy = require('express-mitm-proxy');
var app = express();
var mitmProxy = new MitmProxy(app, new CA('FR', 'Some-State', 'Freemedia', 'Freemedia'));
var wss = new WebSocket.Server({ server: mitmProxy.server });
app.use(function (req, res, next) {
    console.log(req.url);
    wss.clients.forEach(function (ws) {
        ws.send(req.url);
    });
    next();
});
app.use(mitmProxy.proxy);
app.use(function (req, res, next) {
    console.log(res.statusCode);
    next();
});
mitmProxy.listen(3128, 3129, function () {
    console.log('Proxy listening at http://0.0.0.0:3128');
});
