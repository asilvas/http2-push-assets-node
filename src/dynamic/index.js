import htmlparser from 'htmlparser2';
import util from '../util';

function Http2DependsDynamic(connect, options) {
  options.pushAttribute = options.pushAttribute || 'data-push-asset'; // this
  options.includeTags = options.includeTags || [ 'script', 'link[rel=stylesheet]', 'link[type=text/css]', 'img', 'image' ] // or that

  // todo: optimize tags lookup
  var includeTags = {};
  options.includeTags.forEach((t) => {
    const split = t.split('[');
    const tagName = split[0].toLowerCase();
    const tag = includeTags[tagName] || { attributes: [] };
    if (split.length > 1) {
      // tag attributes
      split[1].substr(0, split[1].length - 1).split(',').forEach((ta) => {
        const taSplit = ta.split('=');
        if (taSplit.length === 2) {
          tag.attributes.push({ name: taSplit[0].toLowerCase(), value: taSplit[1].toLowerCase() });
        }
      });
    }
    includeTags[tagName] = tag;
  });

  return function(requestAssets, req, res, next) {
    console.log('* DYNAMIC HANDLER', req.url);
    
    const chunks = [];
    var isHtml = false;
    
    const setHeader = res.setHeader;
    res.setHeader = function(name, val) {
console.log('setHeader', name, val);
      if (/content\-type/i.test(name) && /html/i.test(val)) {
        isHtml = true;
      }
      setHeader.apply(res, arguments);
    }.bind(res);
    
    const writeHead = res.writeHead;
    res.writeHead = function() {
console.log('writeHead', arguments);
      if (arguments.length > 1) {
        const lastArg = arguments[arguments.length - 1];
        if (typeof lastArg === 'object') {
          const ct = lastArg['Content-Type'];
          if (ct && /html/i.test(ct)) {
            isHtml = true;
          }
        } 
      }
      writeHead.apply(res, arguments);
    }.bind(res);
    
    const end = res.end;
    res.end = function(chunk) {
      if (chunk && isHtml) chunks.push(Buffer.isBuffer(chunk) ? chunk.toString() : chunk);
      
      if (isHtml && chunks.length > 0) {
        const html = chunks.join('');
        var pushAssets = {};
console.log('isHtml=true');
        var parser = new htmlparser.Parser({
          onopentag: function(name, attr) {
            const pushAttribute = attr[options.pushAttribute];
            let match = pushAttribute !== undefined;
            if (!match) {
              // check tag
              const tag = includeTags[name];
              if (tag) {
                // verify attribute match, if any provided
                if (tag.attributes.length === 0) {
                  match = true; // any attributes suffice
                } else {
                  // check against attributes
                  match = tag.attributes.filter((ta) => {
                    const attrMatch = attr[ta.name];
                    return (attrMatch && attrMatch === ta.value);
                  }).length > 0; // one or more matches will suffice (either OR)
                }
              }
            }
            
            if (match) {
              // sufficient url detection for demo only
              var assetUrl = attr['xlink:href'] /* svg */ || attr.src || attr.href;
              if (typeof assetUrl === 'string') {
                const asset = {
                  // key is equal to url unless the matching attribute contains a valid key
                  key: pushAttribute && pushAttribute !== '$' ? pushAttribute : '$'
                };
                console.log('pushAsset:', asset);
                pushAssets[assetUrl] = asset;
              }
            }
          }
        }, { decodeEntities: false, lowerCaseTags: true, lowerCaseAttributeNames: true });
        parser.write(html);
        parser.end();
        
        // push available assets
        util.pushAssets(connect, req, res, requestAssets, pushAssets);
      }
      
      end.apply(res, arguments);
    }.bind(res);
    
    const write = res.write;
    res.write = function(chunk) {
      if (isHtml) chunks.push(Buffer.isBuffer(chunk) ? chunk.toString() : chunk); // only if html
      write.apply(res, arguments);
    }.bind(res);
    
    // continue
    next();
  };
  
}

export default Http2DependsDynamic;
