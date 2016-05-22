/* FORMAT:

  {HEADER_NAME}: {URL1}=[etag({URL1_ETAG}),][last-modified({URL1_LAST_MODIFIED})]; {URL2}=[etag({URL2_ETAG}),][last-modified({URL2_LAST_MODIFIED})]

  OR if unknown dependencies, requestor should send:
  
  {HEADER_NAME}: *

*/

import constants from '../constants';
import isAssetNoPush from './isAssetNoPush';

function buildHeaderFromFiles(files) {
  var header = '';

  // TODO: Add support for `Cache-Control` to bypass modified checks altogether

  (files || []).forEach((f) => {
    if (!f.headers) return; // do not include files w/o headers
    // validate `Cache-Control` and do request not to have an asset pushed if not desired
    var cacheHeaders = [];
    if (isAssetNoPush(f) === true) {
      cacheHeaders.push(constants.REQUEST_HEADER_NOPUSH);
    } else { // rely on etag/last-modified for 304 check
      var etag = f.headers['etag'];
      var lastModified = f.headers['last-modified'];
      if (!etag && lastModified) return; // do not include files w/o any cache support
      if (etag) cacheHeaders.push('etag(' + etag + ')');
      if (lastModified) cacheHeaders.push('last-modified(' + lastModified + ')');
    }
    // add file to header with available caching headers
    header += (f.pushKey + '=' + cacheHeaders.join(',') + ';');
  });
  
  // if no files, use default
  if (!header.length) header = constants.REQUEST_HEADER_DEFAULT;

  return header;
}

export default buildHeaderFromFiles;
