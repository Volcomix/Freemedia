/// <reference path="../typings/node/node.d.ts"/>
/// <reference path="../typings/express/express.d.ts"/>
/// <reference path="../typings/request/request.d.ts"/>
/// <reference path="../typings/q/Q.d.ts"/>

import url = require('url');

import express = require('express');
import request = require('request');
import Q = require('q');

import CA = require('./CertificateAuthority');
import MitmServer = require('./MitmServer');
import ProxyServer = require('./ProxyServer');

class MitmProxy {

	private mitmServer: MitmServer;
	private proxyServer: ProxyServer;

	constructor(app = express(), ca?: CA,
		private verbose?: boolean, proxyVerbose?: boolean, mitmVerbose?: boolean) {

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

		this.mitmServer = new MitmServer(app, ca, mitmVerbose);
		this.proxyServer = new ProxyServer(app, this.mitmServer, proxyVerbose)
	}

	listen(proxyPort = 3128, mitmPort = 3129, listeningListener?: () => void): MitmProxy {
		Q.all([
			Q.Promise((resolve) => {
				this.mitmServer.listen(mitmPort, () => {
					var host = this.mitmServer.address.address;
					var port = this.mitmServer.address.port;

					if (this.verbose) {
						console.log('MITM server listening at https://%s:%s', host, port);
					}

					resolve({});
				});
			}),
			Q.Promise((resolve) => {
				this.proxyServer.listen(proxyPort, () => {
					var host = this.proxyServer.address.address;
					var port = this.proxyServer.address.port;

					if (this.verbose) {
						console.log('Proxy listening at http://%s:%s', host, port);
					}

					resolve({});
				});
			})
		]).done(() => { listeningListener(); });

		return this;
	}

	close(listeningListener?: () => void) {
		Q.all([
			Q.Promise((resolve) => {
				this.proxyServer.close().on('close', resolve);
			}),
			Q.Promise((resolve) => {
				this.mitmServer.close().on('close', resolve);
			})
		]).done(() => { listeningListener(); });
	}
}

export = MitmProxy;