var net = require('net');
var fs = require('fs');

var configFile = process.argv[2] || 'config.json';
var config = {};
var router = {};
var matchers = [];

function loadConfigFile(cb) {
	console.log('Loading config file');
	fs.readFile(configFile, 'utf8', function(err, data) {
		if(err) return console.error(err);
		
		config = JSON.parse(data);
		router = config.router;
		matchers = Object.keys(router).map(function(domain) {
			return new RegExp('\\shost:\\s*(' + domain + ')\\s');
		});
		
		cb && cb();
	});
}
fs.watch(configFile, function(event, file) {
	loadConfigFile();
});

var app = net.createServer(function(c) {
	var blob;
	function ondata(data) {
		if(blob == null) blob = data; // Get first piece
		else blob = Buffer.concat([blob, data]); // or subsequent ones
		var string = blob.toString().toLowerCase(); // Get the string version of the data
		
		for(var i = 0; i < matchers.length; i++) { // See if any of the matchers can find their hostname in it
			var m = string.match(matchers[i]);
			//console.log(matchers[i], m);
			if(m && m[1]) {
				c.removeListener('data', ondata);
				
				var dest = net.connect(router[m[1]], function() {
					dest.write(blob);
					c.pipe(dest);
					dest.pipe(c);
				});
				dest.on('error', function(err) {
					if(err.code == 'ECONNREFUSED') {
						c.end('HTTP/1.1 503 Application Unavailable\n\nApplication Unavailable');
					} else {
						console.log(err.stack);
					}
				});
				
				return;
			}
		}
		
		c.end('HTTP/1.1 504 Gateway Timeout\n\nGateway Timeout');
	}
	c.on('data', ondata);
});

loadConfigFile(function() {
	var port = config.port || 80;
	console.log('Trying to listen on port', port);
	app.listen(port, function() {
		console.log('derproxy listening on port', port);
	});
});


process.on('uncaughtException', function(err) {
	console.error(err);
});
