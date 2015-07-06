/// <reference path="../typings/tsd.d.ts"/>

import express = require('express');
import SocketIOStatic = require('socket.io');

import CA = require('certificate-authority');
import MitmProxy = require('express-mitm-proxy');

var app = express();

var mitmProxy = new MitmProxy(app, new CA('FR', 'Some-State', 'Freemedia', 'Freemedia'));
var io = SocketIOStatic(mitmProxy.server);

var staticRouter = express.Router();
staticRouter.use(express.static('app'));
staticRouter.use(express.static('bower_components'));

var proxyRouter = express.Router();

proxyRouter.use(function(req: express.Request, res: express.Response, next: Function) {
    io.emit('freemedia', {
        title: 'URL visitée',
        url: req.url
    });
    next();
});

proxyRouter.use(mitmProxy.proxy);

proxyRouter.use(function(req: express.Request, res: express.Response, next: Function) {
    console.log(res.statusCode + ' ' + req.url);
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