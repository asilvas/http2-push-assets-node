function isContentTypeUtf8(contenType) {
  // TODO: in the future make this configurable
  return /\/javascript|text\/|utf\-8|xml/i.test(contenType || '');
}

export default isContentTypeUtf8;
