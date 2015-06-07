/// <reference path="../node/node.d.ts"/>

declare module 'http-proxy' {

	import http = require('http');
	import https = require('https');
	import net = require('net');
	
	/** Creates the proxy server */
	function createProxyServer(options: ProxyOptions): Proxy;

	export interface Options {
		/** url string to be parsed with the url module */
		target?: string;
	}

	export interface ProxyOptions extends Options {
		/**url string to be parsed with the url module */
		forward?: string;
		/** object to be passed to http(s).request (see Node's https agent and
		 * 	http agent objects)
		 */
		agent?: https.Agent;
		/** true/false, if you want to verify the SSL Certs */
		secure?: boolean;
		/** true/false, adds x-forward headers */
		xfwd?: boolean;
		/** passes the absolute URL as the path (useful for proxying to proxies) */
		toProxy?: string;
		/** rewrites the location hostname on (301/302/307/308) redirects. */
		hostRewrite?: string;
		
		/** object to be passed to https.createServer() */
		ssl?: any;
		/** true/false, if you want to proxy websockets */
		ws?: boolean;
	}

	export interface Proxy {
		/** used for proxying regular HTTP(S) requests */
		web(request: http.IncomingMessage, response: http.ServerResponse, options?: Options);
		
		/** used for proxying WS(S) requests */
		ws(request: http.IncomingMessage, socket: net.Socket,
			head: { [key: string]: string; }, options?: Options);
		
		/** a function that wraps the object in a webserver, for your convenience */
		listen(port: number);
		
		/** a function that closes the inner webserver and stops listening on given port */
		close(callback?: () => void);
		
		/** listen for proxy events
		 * 	error: The error event is emitted if the request to the target fail.
		 * 	proxyRes: This event is emitted if the request to the target got a response.
		 * 	open: This event is emitted once the proxy websocket was created and
		 *		  piped into the target websocket.
		 * 	close: This event is emitted once the proxy websocket was closed.
		 * 	(DEPRECATED) proxySocket: Deprecated in favor of open.
		 */
		on(event: string, callback: (result: any, request?: http.IncomingMessage,
			response?: http.ServerResponse) => void);
	}
}