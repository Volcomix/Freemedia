/// <reference path="../typings/node/node.d.ts"/>
/// <reference path="../typings/express/express.d.ts"/>
/// <reference path="../typings/http-proxy/http-proxy.d.ts"/>

import express = require('express');
import http = require('http');
import net = require('net');
import httpProxy = require('http-proxy');
import url = require('url');

var proxy = httpProxy.createProxyServer({});

proxy.on('error', function(err, req, res) {
	console.error(err);
});

var app = express();

app.use(function(req, res) {
	var options: httpProxy.Options = {
		target: req.protocol + '://' + url.parse(req.url).host
	};
	console.log(options.target);
	proxy.web(req, res, options);
});

var server = http.createServer(app);

server.on('connect', function(req: http.IncomingMessage, cltSocket: net.Socket, head: { [key: string]: string; }) {
	var srvUrl = url.parse('https://' + req.url);
	console.log(srvUrl.href);
	var srvSocket = net.connect(parseInt(srvUrl.port), srvUrl.hostname, function() {
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

server.listen(3128, function() {

	var host = server.address().address;
	var port = server.address().port;

	console.log('Proxy listening at http://%s:%s', host, port);

});