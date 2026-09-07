const axios = require('axios');
const { randomUUID } = require('crypto');
const dns = require('dns');
const https = require('https');

const BINANCE_BASE_URL = 'https://web3.binance.com';
const DEFAULT_TIMEOUT_MS = 10000;

const resolver = new dns.Resolver();
resolver.setServers(['1.1.1.1', '8.8.8.8']);

function binanceDnsLookup(hostname, options, callback) {
  resolver.resolve4(hostname, (error, addresses) => {
    if (error || !addresses?.length) return dns.lookup(hostname, options, callback);
    if (options?.all) return callback(null, addresses.map((address) => ({ address, family: 4 })));
    return callback(null, addresses[0], 4);
  });
}

const httpsAgent = new https.Agent({ lookup: binanceDnsLookup });

const client = axios.create({
  baseURL: BINANCE_BASE_URL,
  timeout: DEFAULT_TIMEOUT_MS,
  httpsAgent,
  headers: {
    'Accept-Encoding': 'identity',
    'User-Agent': 'binance-web3/2.0 (Skill)',
  },
});

const normalizeChainId = (chainId) => String(chainId || '').trim();

async function searchTokens({ keyword, chainIds }) {
  const params = {};
  if (keyword) params.keyword = keyword;
  if (chainIds) params.chainIds = chainIds;

  const response = await client.get('/bapi/defi/v5/public/wallet-direct/buw/wallet/market/token/search/ai', { params });
  return response.data;
}

async function getTokenDynamic({ chainId, contractAddress }) {
  const response = await client.get('/bapi/defi/v4/public/wallet-direct/buw/wallet/market/token/dynamic/info/ai', {
    params: { chainId: normalizeChainId(chainId), contractAddress },
  });
  return response.data;
}

async function getTokenMeta({ chainId, contractAddress }) {
  const response = await client.get('/bapi/defi/v1/public/wallet-direct/buw/wallet/dex/market/token/meta/info/ai', {
    params: { chainId: normalizeChainId(chainId), contractAddress },
  });
  return response.data;
}

async function auditToken({ chainId, contractAddress, requestId = randomUUID() }) {
  const response = await client.post('/bapi/defi/v1/public/wallet-direct/security/token/audit', {
    binanceChainId: normalizeChainId(chainId),
    contractAddress,
    requestId,
  });
  return response.data;
}

async function getMarketRank({ chainId, rankType = 10, period = 50, sortBy = 70, orderAsc = false, page = 1, size = 20 }) {
  const response = await client.post('/bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/pulse/unified/rank/list/ai', {
    chainId: normalizeChainId(chainId),
    rankType,
    period,
    sortBy,
    orderAsc,
    page,
    size,
  });
  return response.data;
}

module.exports = {
  searchTokens,
  getTokenDynamic,
  getTokenMeta,
  auditToken,
  getMarketRank,
};
