/// <reference path="../typings/node/node.d.ts"/>
/// <reference path="../typings/express/express.d.ts"/>
/// <reference path="../typings/ws/ws.d.ts"/>

import express = require('express');
import WebSocket = require('ws');

import CA = require('./CertificateAuthority');
import MitmProxy = require('./MitmProxy');

var app = express();

var mitmProxy = new MitmProxy(app, new CA('FR', 'Some-State', 'Freemedia', 'Freemedia'));
var wss = new WebSocket.Server({ server: mitmProxy.proxyServer.server });

app.use(function(req: express.Request, res: express.Response, next: Function) {
	console.log(req.url);
	wss.clients.forEach(function(ws) {
		ws.send(req.url);
	});
	next();
});

app.use(mitmProxy.proxy);

app.use(function(req: express.Request, res: express.Response, next: Function) {
	console.log(res.statusCode);
	next();
});

mitmProxy.listen(3128, 3129, function() {
	console.log('Proxy listening at http://0.0.0.0:3128');
});