/// <reference path="../typings/node/node.d.ts"/>
/// <reference path="../typings/express/express.d.ts"/>

import express = require('express');

import CA = require('./CertificateAuthority');
import MitmProxy = require('./MitmProxy');

var app = express();

var mitmProxy = new MitmProxy(app, new CA('FR', 'Some-State', 'Freemedia', 'Freemedia'));

app.use(function(req: express.Request, res: express.Response, next: Function) {
	console.log(req.url);
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