var http = require('http'),
    httpProxy = require('http-proxy'),
    os = require('os'),
    nets = os.networkInterfaces(),
    port = 3003,
    zlib = require('zlib');

console.log('IP Addresses');
for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        if (net.family === 'IPv4' && !net.internal) {
            console.log(name + ' - ' + net.address);
        }
    }
}
console.log(`port ${port}`);
var p = httpProxy.createProxyServer({
    target:'http://dev.funnygames.org:3000', 
    changeOrigin: true, 
    selfHandleResponse : true}
).listen(3003);

p.on('error', function() {
    console.log("err \n\n", ...arguments);
    //console.log("proxyReq \n\n", proxyReq);
});

p.on('proxyRes', function(proxyRes, req, res) {
    //console.log("response ", proxyRes);

    var responseBodyBufferArray = [];
    proxyRes.on('data', function (chunk) {
        //console.log(typeof chunk, chunk)
        responseBodyBufferArray.push(chunk);
    });

    proxyRes.on('end', function() {
        var resBodyBuffer = Buffer.concat(responseBodyBufferArray);
        var unzippedBodyString = zlib.gunzipSync(resBodyBuffer).toString();
        var domainReg = /http:\/\/dev.funnygames.org:3000/g;
        var isReplace = domainReg.test(unzippedBodyString);
        
        if(isReplace) {
            res.writeHead(proxyRes.statusCode, {...proxyRes.headers, 'content-encoding': ''});
            res.end(unzippedBodyString.replace(domainReg, ''));
        } else {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            res.end(resBodyBuffer);
        }
    });
});


//httpProxy.createProxyServer({target:'https://www.juegos.com/', changeOrigin: true}).listen(3003); 

// var proxy = httpProxy.createProxyServer({});

// var server = http.createServer(function(req, res) {
//     //console.log(res.on);
//     req.on('data', (chunk) => {
//         console.log("res ", chunk)
//     });
//     req.on('end', (chunk) => {
//         console.log(chunk)
//     });
//     proxy.web(req, res, {target:'http://dev.funnygames.org:3000', changeOrigin: true});
// });

// server.listen(3003)
