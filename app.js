const http = require('http');
const next = require('next');

const port = Number(process.env.PORT || 3000);
const app = next({ dev: false, hostname: '0.0.0.0', port });
const handle = app.getRequestHandler();

app.prepare().then(() => http.createServer((req, res) => handle(req, res)).listen(port, '0.0.0.0'));
