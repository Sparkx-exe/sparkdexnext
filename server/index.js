const express = require('express');
const cors = require('cors');
const dns = require('dns');

// Monkeypatch dns.lookup for mangadex domains using a custom resolver
const originalLookup = dns.lookup;
const resolver = new dns.Resolver();
resolver.setServers(['8.8.8.8', '1.1.1.1']);

dns.lookup = function (hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  if (hostname && (hostname.endsWith('mangadex.org') || hostname.endsWith('mangadex.dev'))) {
    resolver.resolve4(hostname, (err, addresses) => {
      if (err || !addresses || addresses.length === 0) {
        return originalLookup(hostname, options, callback);
      }
      if (options && options.all) {
        return callback(null, addresses.map(addr => ({ address: addr, family: 4 })));
      }
      return callback(null, addresses[0], 4);
    });
    return;
  }
  return originalLookup(hostname, options, callback);
};

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

const { Readable, pipeline } = require('stream');

// Proxy endpoint for dynamic node uploads (chapter pages)
app.use('/api/uploads-node/:host', async (req, res) => {
  try {
    const targetHost = req.params.host;
    const targetUrl = `https://${targetHost}${req.url}`;
    console.log(`Proxying node upload to: ${targetUrl}`);

    const options = {
      method: req.method,
      headers: {
        'User-Agent': 'Sparkdex/1.0.0 (https://github.com/sparkdex/sparkdex)',
      }
    };

    const response = await fetch(targetUrl, options);

    const contentType = response.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);

    const contentLength = response.headers.get('content-length');
    if (contentLength) res.setHeader('Content-Length', contentLength);

    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');

    if (response.body) {
      pipeline(Readable.fromWeb(response.body), res, (err) => {
        if (err) console.error('Uploads-node proxy pipeline error:', err.message);
      });
    } else {
      res.end();
    }
  } catch (error) {
    console.error('Node Upload Proxy Error:', error);
    res.status(500).send('Node Upload Proxy Error');
  }
});

// Proxy endpoint for general uploads (like cover art)
app.use('/api/uploads', async (req, res) => {
  try {
    const targetUrl = `https://uploads.mangadex.org${req.url}`;
    console.log(`Proxying general upload to: ${targetUrl}`);

    const options = {
      method: req.method,
      headers: {
        'User-Agent': 'Sparkdex/1.0.0 (https://github.com/sparkdex/sparkdex)',
      }
    };

    const response = await fetch(targetUrl, options);

    const contentType = response.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);

    const contentLength = response.headers.get('content-length');
    if (contentLength) res.setHeader('Content-Length', contentLength);

    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    const etag = response.headers.get('etag');
    if (etag) res.setHeader('ETag', etag);

    if (response.body) {
      pipeline(Readable.fromWeb(response.body), res, (err) => {
        if (err) console.error('Uploads proxy pipeline error:', err.message);
      });
    } else {
      res.end();
    }
  } catch (error) {
    console.error('General Upload Proxy Error:', error);
    res.status(500).send('General Upload Proxy Error');
  }
});

// Proxy endpoint for API
app.use('/api', async (req, res) => {
  try {
    const targetUrl = `https://api.mangadex.org${req.url}`;
    console.log(`Proxying API to: ${targetUrl}`);

    const options = {
      method: req.method,
      headers: {
        'User-Agent': 'Sparkdex/1.0.0 (https://github.com/sparkdex/sparkdex)',
        'Accept': 'application/json',
      }
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body && Object.keys(req.body).length > 0) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, options);

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();

      // ✏️ CHANGED: rewrite baseUrl to absolute Render URL so <img> tags work in production
      if (req.url.includes('/at-home/server/') && data.baseUrl) {
        try {
          const originalHost = new URL(data.baseUrl).host;
          const protocol = req.headers['x-forwarded-proto'] || req.protocol;
          const host = req.headers['x-forwarded-host'] || req.headers.host;
          console.log(`Rewriting baseUrl to ${protocol}://${host}/api/uploads-node/${originalHost}`);
          data.baseUrl = `${protocol}://${host}/api/uploads-node/${originalHost}`;
        } catch (urlErr) {
          console.error(`Failed to parse baseUrl: ${data.baseUrl}`, urlErr);
        }
      }

      res.status(response.status).json(data);
    } else {
      const textData = await response.text();
      res.status(response.status).send(textData);
    }
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({
      result: 'error',
      errors: [{
        status: 500,
        title: 'Proxy Server Error',
        detail: error.message
      }]
    });
  }
});

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'sparkdex-proxy' });
});

app.listen(PORT, () => {
  console.log(`Sparkdex Proxy Server running on port ${PORT}`);
});