import crypto from 'crypto';
import copyHeaders from './copyHeaders';
import constants from '../constants';

const headersToCopy = ['accept-encoding', 'accept-language', 'authorization', 'host', 'connection'];

export default function pushAssets(connect, req, res, requestAssets, pageAssets) {
  Object.keys(pageAssets).forEach(function(assetRoute) {
    const asset = pageAssets[assetRoute];
    let newHeaders = {
      referrer: req.url
    };
    newHeaders[constants.PUSH_REQUEST_HEADER] = constants.PUSH_REQUEST_VALUE;
    
    // hash key
    const pushKey = (asset.key && asset.key !== '$' && asset.key) || crypto.createHash('md5').update(assetRoute).digest("hex");
    
    const doc = requestAssets[pushKey];
    if (doc) {
      if (doc.noPush) return; // push-disabled by clients request (typically due to cache-control)
      
      // if doc found in request, supply child-request the proper headers
      // pull in caching headers
      if (doc.etag) newHeaders['if-none-match'] = doc.etag;
      if (doc.lastModified) newHeaders['if-modified-since'] = doc.lastModified;
    }
    // merge request headers into child request headers (for whitelisted headers only) 
    newHeaders = copyHeaders(headersToCopy, req.headers, newHeaders);

    // pull over minimum props
    const pushReq = {
      method: 'GET',
      url: assetRoute,
      originalUrl: req.originalUrl,
      headers: newHeaders
    };
    const pushRes = res.push(assetRoute);
    
    // response must include the push key
    pushRes.setHeader(constants.PUSH_RESPONSE_KEY_HEADER, pushKey);
    // flow the push request through the full connect pipeline 
    connect.handle(pushReq, pushRes, () => {});
  });
}
