const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();

/**
 * ERRATIC PROXY CONFIGURATION
 * Northflank dynamically assigns a port via process.env.PORT.
 * We must bind to 0.0.0.0 to be accessible publicly.
 */
const PORT = process.env.PORT || 3000;

// 1. Serve static files (index.html)
app.use(express.static(path.join(__dirname)));

// 2. Proxy Middleware
// Usage: your-app.northflank.app/proxy?url=https://api.example.com
app.use('/proxy', (req, res, next) => {
    const targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).json({ 
            error: 'erratic: missing target url',
            usage: '/proxy?url=https://example.com' 
        });
    }

    // Initialize proxy
    const proxy = createProxyMiddleware({
        target: targetUrl,
        changeOrigin: true,
        pathRewrite: {
            '^/proxy': '', // Strip /proxy from the outgoing request
        },
        onProxyRes: (proxyRes) => {
            // Overwrite CORS headers to allow browser access
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
        },
        onError: (err, req, res) => {
            res.status(500).json({ error: 'erratic: proxy connection failed', details: err.message });
        },
        logLevel: 'silent'
    });

    return proxy(req, res, next);
});

// Root route fallback
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start erratic
app.listen(PORT, '0.0.0.0', () => {
    console.log(`erratic is listening on port ${PORT}`);
    console.log(`proxy endpoint: http://0.0.0.0:${PORT}/proxy?url=`);
});
