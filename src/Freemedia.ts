/// <reference path="../typings/node/node.d.ts"/>
/// <reference path="../typings/express/express.d.ts"/>

import url = require('url');

import express = require('express');

import CA = require('./CertificateAuthority');
import MitmProxy = require('./MitmProxy');

var ca = new CA('FR', 'Some-State', 'Freemedia', 'Freemedia')

var app = express();

app.use(function(req: express.Request, res: express.Response, next) {
	var reqUrl: string;
	if (req.secure) {
		reqUrl = url.resolve(req.protocol + '://' + req.header('host'), req.url);
	} else {
		reqUrl = req.url;
	}

	console.log(reqUrl);

	next();
});

new MitmProxy(app, ca).listen(3128, 3129, function() {
	console.log('Proxy listening at http://0.0.0.0:3128');
});