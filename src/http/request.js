import assert from 'assert';
import crypto from 'crypto';
import http2 from 'http2';
import util from '../util';
import constants from '../constants';
import extend from 'extend';

function Http2DependsRequest(url, reqOptions, cb) {
  if (typeof url === 'object') {
    cb = reqOptions;
    reqOptions = url;
    url = reqOptions.url;
  }
  
  // copy original
  const options = extend(true, { headers: {} }, reqOptions || {});

  let resRemaining = 1; // track remaining responses to wait for
  var files = [];
  var body, mainRes;

  if (!options.headers[constants.REQUEST_HEADER]) {
    // if not provided, reconstruct header from files
    options.headers[constants.REQUEST_HEADER] = util.buildHeaderFromFiles(options.files);
    (options.files || []).forEach((f) => {
      if (util.isAssetNoPush(f)) {
        // if no-push is enabled on an asset, pass reference to return collection to avoid client from requesting cached files
        f.noPush = true;
        files.push(f);
      } else {
        f.noPush = false;
      }
    });
  }
  
  const finish = function() {
    resRemaining--;
    //console.log('client.finish.remaining:', resRemaining, 'handles:', process._getActiveHandles().length);
    if (resRemaining === 0) {
      cb(null, mainRes, body, files);
    }
  };
  
  const req = http2.request(options);
  
  req.on('response', (res) => {
    var parts = [];
    
    mainRes = res;
    
    const isUtf8 = util.isContentTypeUtf8(res.headers['content-type']);
    if (isUtf8) {
      res.setEncoding('utf8');
    }
    
    res.on('data', (chunk) => {
      parts.push(chunk);
    });
    
    res.on('finish', () => {
      const fileData = isUtf8 ? parts.join('') : Buffer.concat(parts);
      
      body = fileData;
      
      finish();
    });
  });

  req.on('push', (req) => {
    resRemaining++;
    
    var parts = [];
    
    req.on('response', (res) => {
      const isUtf8 = util.isContentTypeUtf8(res.headers['content-type']);
      if (isUtf8) {
        res.setEncoding('utf8');
      }
      res.on('data', (chunk) => {
        parts.push(chunk);
      });
      
      res.on('finish', () => {
        const fileData = isUtf8 ? parts.join('') : Buffer.concat(parts);
        
        files.push({
          url: req.url,
          pushKey: res.headers[constants.PUSH_RESPONSE_KEY_HEADER] || crypto.createHash('md5').update(req.url).digest("hex"),
          statusCode: res.statusCode,
          headers: res.headers,
          body: fileData
        });

        finish();
      });
    });
  });
  
  req.on('error', (err) => {
    cb(err);
  });

  req.end();
}

export default Http2DependsRequest;
