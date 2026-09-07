const request = require('supertest');
const assert = require('assert');
const app = require('../src/app');

(async () => {
  try {
    const health = await request(app).get('/health');
    assert.strictEqual(health.status, 200);
    console.log('HEALTH_OK', JSON.stringify(health.body));

    const tokenSearch = await request(app)
      .get('/api/binance/tokens/search')
      .query({ keyword: 'BNB', chainIds: '56' });
    assert.strictEqual(tokenSearch.status, 200, tokenSearch.text);
    assert.ok(Array.isArray(tokenSearch.body.items), 'search items missing');
    console.log('SEARCH_OK', JSON.stringify(tokenSearch.body).slice(0, 220));

    const tokenDetail = await request(app)
      .get('/api/binance/tokens/56/0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c');
    assert.strictEqual(tokenDetail.status, 200, tokenDetail.text);
    const detailBody = tokenDetail.body;
    assert.ok(detailBody.price || detailBody.name || detailBody.symbol, 'detail payload missing essential fields');
    console.log('DETAIL_OK', JSON.stringify(detailBody).slice(0, 220));

    const rank = await request(app)
      .get('/api/binance/market/rank')
      .query({ chainId: '56', rankType: 10, period: 50, sortBy: 70, page: 1, size: 3 });
    assert.strictEqual(rank.status, 200, rank.text);
    assert.ok(Array.isArray(rank.body.items), 'market rank items missing');
    console.log('RANK_OK', JSON.stringify(rank.body).slice(0, 220));

    const audit = await request(app)
      .post('/api/binance/tokens/audit')
      .send({ chainId: '56', contractAddress: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' });
    assert.strictEqual(audit.status, 200, audit.text);
    assert.ok(audit.body.hasResult !== undefined || audit.body.riskItems !== undefined, 'audit payload missing result fields');
    console.log('AUDIT_OK', JSON.stringify(audit.body).slice(0, 220));

    console.log('ALL_BACKEND_LIVE_TESTS_PASSED');
    process.exit(0);
  } catch (error) {
    console.error('LIVE_BACKEND_TEST_FAILED');
    console.error(error.stack || error.message);
    process.exit(1);
  }
})();
