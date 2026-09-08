const assert = require('assert');
const request = require('supertest');
const app = require('../api');

(async () => {
  try {
    const home = await request(app).get('/');
    assert.strictEqual(home.status, 200);
    assert.match(home.headers['content-type'], /text\/html/);
    assert.match(home.text, /Cognis/i);

    const css = await request(app).get('/styles.css');
    assert.strictEqual(css.status, 200);
    assert.match(css.headers['content-type'], /text\/css/);

    const javascript = await request(app).get('/app.js');
    assert.strictEqual(javascript.status, 200);
    assert.match(javascript.headers['content-type'], /javascript/);
    assert.doesNotMatch(javascript.text, /http:\/\/localhost/);

    const favicon = await request(app).get('/favicon.svg');
    assert.strictEqual(favicon.status, 200);
    assert.match(favicon.headers['content-type'], /image\/svg\+xml/);

    const video = await request(app).get('/lantern_anticlockwise_rotation.mp4');
    assert.strictEqual(video.status, 200);
    assert.match(video.headers['content-type'], /video\/mp4/);
    assert.doesNotMatch(video.headers['content-type'], /text\/html/);

    const health = await request(app).get('/api/health');
    assert.strictEqual(health.status, 200);
    assert.match(health.headers['content-type'], /application\/json/);
    assert.strictEqual(health.body.ok, true);

    console.log('GET / 200 text/html');
    console.log('GET /styles.css 200 text/css');
    console.log('GET /app.js 200 application/javascript');
    console.log('GET /favicon.svg 200 image/svg+xml');
    console.log('GET /lantern_anticlockwise_rotation.mp4 200 video/mp4');
    console.log('GET /api/health 200 application/json');
    console.log('VERCEL_STATIC_FRONTEND_AND_API_ENTRYPOINT_OK');
  } catch (error) {
    console.error('DEPLOYMENT_CHECK_FAILED');
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
})();
