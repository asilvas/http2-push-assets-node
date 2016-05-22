# HTTP/2 Push-Assets (for Node.js)

Includes both Client & Server implementations of **Internet Draft** HTTP/2 Push-Assets.


## Other Resources

* [http2-push-assets](https://github.com/asilvas/http2-push-assets) - Home of HTTP/2 Push-Assets Extension **Proposal**
* [http2-push-assets-demo](https://github.com/asilvas/http2-push-assets-demo) - Demo of HTTP/2 Push-Assets for Client & Server



## Client

```javascript
  var request = require('http2-push-assets').http.request;
  var options = {
    method: 'GET',
    url: '/some/resource',
    cachedFiles: undefined // unique to Push-Assets
  };
  request(options, function(err, res, body, children) {
    // do something with document and its children
  });
```

### Client Options

TODO


## Server

```javascript
  var connect = require('connect');
  var http2 = require('http2');
  var connectPushAssets = require('http2-push-assets').http.connect;
  var connectStatic = require('connect-static');

  var app = connect();  
  
  // enable HTTP/2 Push-Assets for any html requests
  app.use(connectPushAssets(app, {
    forcePush: false, // only enable for demo purposes, to force push on non-compatible browsers
    dynamic: {
      pushAttribute: 'data-push-asset', // match this
      includeTags: [ 'script', 'link[rel=stylesheet]', 'link[type=text/css]', 'img', 'image' ] // or match that
    }
  });

  // server static files with HTTP/2 Push-Assets enabled  
  connectStatic({
    dir: path.resolve(__dirname, './static'),
    aliases: [
      ['/', '/index.html'],
    ]
  }, function(err, middleware) {
    app.use(middleware);

    http2.createServer({
      cert: fs.readFileSync(path.resolve(__dirname, './ssl/public.crt')),
      key: fs.readFileSync(path.resolve(__dirname, './ssl/private.key'))
    }, app).listen(443);
  });
```

### Server Options

TODO

