/// <reference path="../typings/tsd.d.ts"/>
var express = require('express');
var WebSocket = require('ws');
var CA = require('certificate-authority');
var MitmProxy = require('express-mitm-proxy');
var app = express();
var mitmProxy = new MitmProxy(app, new CA('FR', 'Some-State', 'Freemedia', 'Freemedia'));
var wss = new WebSocket.Server({ server: mitmProxy.server });
var staticRouter = express.Router();
staticRouter.use(express.static('app'));
staticRouter.use(express.static('bower_components'));
var proxyRouter = express.Router();
proxyRouter.use(function (req, res, next) {
    console.log(req.url);
    wss.clients.forEach(function (ws) {
        ws.send(req.url);
    });
    next();
});
proxyRouter.use(mitmProxy.proxy);
proxyRouter.use(function (req, res, next) {
    console.log(res.statusCode);
    next();
});
app.use(function (req, res, next) {
    if (req.url.indexOf('/') == 0) {
        staticRouter(req, res, next);
    }
    else {
        proxyRouter(req, res, next);
    }
});
mitmProxy.listen(8080, 3129, function () {
    console.log('Proxy listening at http://0.0.0.0:8080');
});
