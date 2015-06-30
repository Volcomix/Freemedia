/// <reference path="../typings/node/node.d.ts"/>
/// <reference path="../typings/express/express.d.ts"/>
/// <reference path="../typings/request/request.d.ts"/>

import url = require('url');

import express = require('express');
import request = require('request');

import CA = require('./CertificateAuthority');
import MitmServer = require('./MitmServer');
import ProxyServer = require('./ProxyServer');

class MitmProxy {

	constructor(private app = express(), private ca?: CA, private verbose?: boolean,
		private proxyVerbose?: boolean, private mitmVerbose?: boolean) {

		app.use((req, res) => {
			var reqUrl: string;
			if (req.secure) {
				reqUrl = url.resolve(req.protocol + '://' + req.header('host'), req.url);
			} else {
				reqUrl = req.url;
			}

			if (this.verbose) {
				console.log(reqUrl);
			}

			req.pipe(request({ uri: reqUrl, followRedirect: false })).pipe(res);
		});
	}

	listen(proxyPort = 3128, mitmPort = 3129) {

		var mitmServer = new MitmServer(this.app, this.ca, this.mitmVerbose)
			.listen(mitmPort, () => {
				var host = mitmServer.address.address;
				var port = mitmServer.address.port;

				if (this.verbose) {
					console.log('MITM server listening at https://%s:%s', host, port);
				}
			});

		var proxyServer = new ProxyServer(this.app, mitmServer, this.proxyVerbose)
			.listen(proxyPort, () => {
				var host = proxyServer.address.address;
				var port = proxyServer.address.port;

				console.log('Proxy listening at http://%s:%s', host, port);

			});
	}
}

export = MitmProxy;