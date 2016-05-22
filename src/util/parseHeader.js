/* FORMAT:

  {HEADER_NAME}: {URL1}=[etag({URL1_ETAG}),][last-modified({URL1_LAST_MODIFIED})]; {URL2}=[etag({URL2_ETAG}),][last-modified({URL2_LAST_MODIFIED})]

  OR if unknown dependencies, requestor should send:
  
  {HEADER_NAME}: *

*/

import constants from '../constants';

function parseHeader(headerStr) {
  if (typeof headerStr !== 'string') return; // undefined
  const docs = {};
  
  const split = headerStr.split(';');
  split.forEach((d) => {
    d = d.trim();
    if (d === '*') {
      return; // reserved
    }
    const indexOfEqual = d.indexOf('=');
    if (indexOfEqual < 0) {
      return; // invalid key/value
    }
    const key = d.substr(0, indexOfEqual).trim();
    const val = d.substr(indexOfEqual + 1).trim();

    const noPush = val.toLowerCase() === constants.REQUEST_HEADER_NOPUSH;
    const etag = getETag(val);
    const lastModified = getLastModified(val);    
    
    if (!noPush && !etag && !lastModified) {
      return; // invalid headers
    }
    
    const doc = { key, noPush };
    
    if (etag) {
      doc.etag = etag;
    }

    if (lastModified) {
      doc.lastModified = lastModified;
    }
    
    docs[doc.key] = doc;
  });
  
  return docs;
}

function getETag(header) {
  const exec = /etag\((.*?)\)/i.exec(header);
  return exec && exec.length === 2 ? exec[1] : null;
}

function getLastModified(header) {
  const exec = /last-modified\((.*?)\)/i.exec(header);
  return exec && exec.length === 2 ? exec[1] : null;
}

export default parseHeader;
