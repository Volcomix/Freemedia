/// <reference path="../typings/node/node.d.ts"/>
/// <reference path="../typings/express/express.d.ts"/>
/// <reference path="../typings/http-proxy/http-proxy.d.ts"/>

import express = require('express');
import http = require('http');
import https = require('https');
import fs = require('fs');
import net = require('net');
import httpProxy = require('http-proxy');
import url = require('url');

var proxy = httpProxy.createProxyServer({});

proxy.on('error', function(err, req, res) {
	console.error(err);
});

var app = express();

app.use(function(req, res) {
	var reqUrl: url.Url;
	if (req.secure) {
		reqUrl = url.parse(url.resolve(req.protocol + '://' + req.header('host'), req.url));
	} else {
		reqUrl = url.parse(req.url);
	}
	
	var options: httpProxy.Options = {
		target: reqUrl.protocol + '//' + reqUrl.host
	};
	
	console.log(reqUrl.href);
	
	proxy.web(req, res, options);
});

var proxyServer = http.createServer(app);

var options = {
	key: fs.readFileSync('keys/key.pem'),
	cert: fs.readFileSync('keys/cert.pem')
};
var mitmServer = https.createServer(options, app).listen(3129, function() {
	var host = mitmServer.address().address;
	var port = mitmServer.address().port;

	console.log('Internal MITM server listening at https://%s:%s', host, port);
});

proxyServer.on('connect', function(req: http.IncomingMessage, cltSocket: net.Socket, head: { [key: string]: string; }) {
	var srvSocket = net.connect(mitmServer.address().port, mitmServer.address().address, function() {
		cltSocket.write(
			'HTTP/1.1 200 Connection Established\r\n' +
			'\r\n');
		srvSocket.write(head);
		srvSocket.pipe(cltSocket);
		cltSocket.pipe(srvSocket);
	});

	srvSocket.on('error', function(err) {
		console.error(err);
	});
});

proxyServer.listen(3128, function() {

	var host = proxyServer.address().address;
	var port = proxyServer.address().port;

	console.log('Proxy listening at http://%s:%s', host, port);

});