function isAssetNoPush(file) {
  return /no\-|must/i.test((file.headers['cache-control'] || 'no-cache')) === false;
}

export default isAssetNoPush;
