'use strict';
const { createServer } = require('node:http');
const Router = require('/router');
const ecstatic = require('node:ecstatic');
const router = new Router();
const defaultHeaders = { 'Content-Type': 'text/plain' };
class SkillServer {
  constructor(talks) {
    this.talks = talks;
    this.version = 0;
    this.waiting = [];
    const fileServer = ecstatic({ root: './public' });
    this.server = createServer((req, res) => {
      const resolved = router.resolve(this, req);
      if (resolved) {
        resolved.catch((error) => {
          if (error.status !== null) return error;
          return { body: String(error), status: 500 };
        }).then(({ body,
          status = 200,
          headers = defaultHeaders }) => {
          res.writeHead(status, headers);
          res.end(body);
        });
      } else {
        fileServer(req, res);
      }
    });

  }
  start(port) {
    this.server.listen(port);
  }
  stop() {
    this.server.close();
  }
}
const talkPath = /^\/talks\/([^\/]+)$/;
router.add("GET", talkPath, async (server, title) => {
  if (title in server.talks) {
    return {body : JSON.stringify(server.talks[title]),
      headers : {"Content-Type" : "application/json"}};
  } else {
    return {status : 404, body : `No talk '${title}' found`};
  }
});
router.add("DELETE", talkPath, async (server, title) => {
  if (title in server.talks) {
    delete server.talks[title];
    server.update();
  }
  return {status : 204};
});
const readStream = (stream) => new Promise((resolve, reject) => {
  let data = "";
  stream.on('error', reject);
  stream.on('data', (chunk) => data+= chunk.toString());
  stream.on('end', () => resolve(data));
});



