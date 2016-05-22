import assert from 'assert';
import fs from 'fs';
import parseurl from 'parseurl';
import util from '../util';

const headersToCopy = ['accept-encoding', 'accept-language', 'authorization', 'host', 'connection'];

function Http2DependsFixed(connect, options) {
  assert(options.manifests !== undefined, 'options.fixed.manifests is required');

  const routes = {};
  let routeCount = 0;
  Object.keys(options.manifests).forEach(function(manifestRoute) {
    const manifest = options.manifests[manifestRoute];

    manifest.routes.forEach(function(route) {
      routes[route] = {
        url: route,
        manifestRoute: manifestRoute,
        manifestPath: manifest.path
      };
      
      routeCount++;
    });    
  });

  assert(routeCount > 0, 'options.fixed.manifests must define at least one route');

  // todo: add manifest cache support
  
  return function(requestAssets, req, res, next) {
    const parsedUrl = parseurl(req);
    const route = routes[parsedUrl.pathname];
    if (!route) {
      // route not found, continue
      return void next();
    }
    
    // todo: add cache support
    fs.readFile(route.manifestPath, 'utf8', function(err, data) {
      const manifest = JSON.parse(data);
      
      // push manifest assets
      util.pushAssets(connect, req, res, requestAssets, manifest.assets);
      
      // do not wait for push assets to be sent, promise is only requirement
      next();
    });
  };
}

export default Http2DependsFixed;
