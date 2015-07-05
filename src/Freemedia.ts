/// <reference path="../typings/tsd.d.ts"/>

import express = require('express');
import WebSocket = require('ws');

import CA = require('certificate-authority');
import MitmProxy = require('express-mitm-proxy');

var app = express();

var mitmProxy = new MitmProxy(app, new CA('FR', 'Some-State', 'Freemedia', 'Freemedia'));
var wss = new WebSocket.Server({ server: mitmProxy.server });

var staticRouter = express.Router();
staticRouter.use(express.static('app'));
staticRouter.use(express.static('bower_components'));

var proxyRouter = express.Router();

proxyRouter.use(function(req: express.Request, res: express.Response, next: Function) {
    console.log(req.url);
    wss.clients.forEach(function(ws) {
        ws.send(req.url);
    });
    next();
});

proxyRouter.use(mitmProxy.proxy);

proxyRouter.use(function(req: express.Request, res: express.Response, next: Function) {
    console.log(res.statusCode);
    next();
});

app.use(function(req: express.Request, res: express.Response, next: Function) {
    if (req.url.indexOf('/') == 0) {
        staticRouter(req, res, next);
    } else {
        proxyRouter(req, res, next);
    }
});

mitmProxy.listen(8080, 3129, function() {
    console.log('Proxy listening at http://0.0.0.0:8080');
});