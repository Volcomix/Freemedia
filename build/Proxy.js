/// <reference path="../typings/node/node.d.ts"/>
/// <reference path="../typings/express/express.d.ts"/>
/// <reference path="../typings/http-proxy/http-proxy.d.ts"/>
var express = require('express');
var http = require('http');
var net = require('net');
var httpProxy = require('http-proxy');
var url = require('url');
var proxy = httpProxy.createProxyServer({});
proxy.on('error', function (err, req, res) {
    console.error(err);
});
var app = express();
app.use(function (req, res) {
    var options = {
        target: req.protocol + '://' + url.parse(req.url).host
    };
    console.log(options.target);
    proxy.web(req, res, options);
});
var server = http.createServer(app);
server.on('connect', function (req, cltSocket, head) {
    var srvUrl = url.parse('https://' + req.url);
    console.log(srvUrl.href);
    var srvSocket = net.connect(parseInt(srvUrl.port), srvUrl.hostname, function () {
        cltSocket.write('HTTP/1.1 200 Connection Established\r\n' + '\r\n');
        srvSocket.write(head);
        srvSocket.pipe(cltSocket);
        cltSocket.pipe(srvSocket);
    });
    srvSocket.on('error', function (err) {
        console.error(err);
    });
});
server.listen(3128, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Proxy listening at http://%s:%s', host, port);
});
