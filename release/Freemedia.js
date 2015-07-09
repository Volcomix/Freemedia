/// <reference path="../typings/tsd.d.ts"/>
var express = require('express');
var SocketIOStatic = require('socket.io');
var CA = require('certificate-authority');
var MitmProxy = require('express-mitm-proxy');
var app = express();
var mitmProxy = new MitmProxy(app, new CA('FR', 'Some-State', 'Freemedia', 'Freemedia'));
var io = SocketIOStatic(mitmProxy.server);
var staticRouter = express.Router();
staticRouter.use(express.static('app'));
staticRouter.use(express.static('bower_components'));
var proxyRouter = express.Router();
proxyRouter.use(function (req, res, next) {
    mitmProxy.proxy(req, res, next).once('data', function (data) {
        var contentType = res.get('Content-Type');
        if (contentType && contentType.indexOf('video') == 0) {
            io.emit('freemedia', {
                title: req.get('Referer'),
                url: req.url
            });
        }
    });
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
