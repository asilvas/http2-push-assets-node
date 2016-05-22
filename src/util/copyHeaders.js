function copyHeaders(headersToCopy, fromHeaders, newHeaders) {
  newHeaders = newHeaders || {};
  
  headersToCopy.forEach(function(headerName) {
    const header = fromHeaders[headerName];
    if (header) {
      newHeaders[headerName] = header;
    }
  });
  
  return newHeaders;
}

export default copyHeaders;
