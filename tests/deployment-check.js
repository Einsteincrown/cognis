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

    const video = await request(app).get('/lantern_anticlockwise_rotation.mp4');
    assert.strictEqual(video.status, 200);
    assert.match(video.headers['content-type'], /video\/mp4/);

    const health = await request(app).get('/health');
    assert.strictEqual(health.status, 200);
    assert.strictEqual(health.body.ok, true);

    console.log('VERCEL_ENTRYPOINT_AND_STATIC_ASSETS_OK');
  } catch (error) {
    console.error('DEPLOYMENT_CHECK_FAILED');
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
})();
