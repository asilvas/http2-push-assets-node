import assert from 'assert';
import constants from '../constants';
import util from '../util';
import fixed from '../fixed';
import dynamic from '../dynamic';

function Http2DependsConnect(connect, options) {
  assert(options !== undefined, 'Options required');
  assert(typeof options.fixed === 'object' || options.dynamic, 'options.fixed OR options.dynamic required');
  
  const handler = options.fixed ?
    fixed(connect, options.fixed) :
    dynamic(connect, options.dynamic)
  ;
  
  return function(req, res, next) {
    //console.log('Http2DependsConnect', req.url);
    //console.log('* httpVersion', req.httpVersion, req.httpVersionMajor);
    //console.log('* Headers', req.headers);
    
    if (!req.httpVersionMajor || req.httpVersionMajor < 2) {      
      return void next();
    }

    const documents = util.parseHeader(req.headers[constants.REQUEST_HEADER]) || (options.forcePush && {});
    if (!documents) {
      // if header not provided (or force not set), this feature is disabled
      return void next();
    }
    //console.log('* ' + constants.REQUEST_HEADER, documents);

    handler(documents, req, res, next);
  }
}

export default Http2DependsConnect; 
