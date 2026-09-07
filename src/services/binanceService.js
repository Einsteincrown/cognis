const { randomUUID } = require('crypto');
const { InMemoryCache } = require('../utils/cache');
const {
  searchTokens,
  getTokenDynamic,
  getTokenMeta,
  auditToken,
  getMarketRank,
} = require('../providers/binanceProvider');

const cache = new InMemoryCache(30000);

const allowedChainIds = new Set(['1', '56', '8453', 'CT_501']);

function parseStringish(value, fallback = null) {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value);
}

function normalizeTokenSummary(item = {}) {
  return {
    chainId: parseStringish(item.chainId),
    contractAddress: parseStringish(item.contractAddress),
    name: parseStringish(item.name),
    symbol: parseStringish(item.symbol),
    price: parseStringish(item.price),
    percentChange24h: parseStringish(item.percentChange24h),
    volume24h: parseStringish(item.volume24h),
    marketCap: parseStringish(item.marketCap),
    liquidity: parseStringish(item.liquidity),
    holders: parseStringish(item.holders),
  };
}

function normalizeTokenDetail({ dynamicData, metaData }) {
  const dynamic = dynamicData?.data || {};
  const meta = metaData?.data || {};

  return {
    chainId: parseStringish(dynamic.chainId || meta.chainId),
    contractAddress: parseStringish(dynamic.contractAddress || meta.contractAddress),
    name: parseStringish(meta.name || dynamic.name),
    symbol: parseStringish(meta.symbol || dynamic.symbol),
    price: parseStringish(dynamic.price),
    nativeTokenPrice: parseStringish(dynamic.nativeTokenPrice),
    percentChange24h: parseStringish(dynamic.percentChange24h),
    volume24h: parseStringish(dynamic.volume24h),
    marketCap: parseStringish(dynamic.marketCap),
    liquidity: parseStringish(dynamic.liquidity),
    holders: parseStringish(dynamic.holders),
    fdv: parseStringish(dynamic.fdv),
    totalSupply: parseStringish(dynamic.totalSupply),
    circulatingSupply: parseStringish(dynamic.circulatingSupply),
    allChainCirculatingSupply: parseStringish(dynamic.allChainCirculatingSupply),
    links: Array.isArray(meta.links) ? meta.links.map((link) => ({
      label: parseStringish(link.label),
      link: parseStringish(link.link),
    })) : [],
    tokenId: parseStringish(meta.tokenId),
  };
}

function normalizeAuditResult(data = {}) {
  const result = data.data || {};

  const normalized = {
    hasResult: Boolean(result.hasResult),
    isSupported: Boolean(result.isSupported),
    riskLevel: result.riskLevel != null ? Number(result.riskLevel) : null,
    riskLevelEnum: parseStringish(result.riskLevelEnum),
    extraInfo: {
      buyTax: parseStringish(result.extraInfo?.buyTax),
      sellTax: parseStringish(result.extraInfo?.sellTax),
      isVerified: Boolean(result.extraInfo?.isVerified),
    },
    riskItems: Array.isArray(result.riskItems) ? result.riskItems.map((item) => ({
      id: parseStringish(item.id),
      name: parseStringish(item.name),
      details: Array.isArray(item.details) ? item.details.map((detail) => ({
        title: parseStringish(detail.title),
        description: parseStringish(detail.description),
        isHit: Boolean(detail.isHit),
        riskType: parseStringish(detail.riskType),
      })) : [],
    })) : [],
  };

  return normalized;
}

function normalizeMarketRank(data = {}) {
  const items = Array.isArray(data.data) ? data.data : Array.isArray(data.data?.list) ? data.data.list : [];
  return items.map((item) => ({
    rank: item.rank ?? item.ranking ?? null,
    tokenId: parseStringish(item.tokenId),
    chainId: parseStringish(item.chainId),
    contractAddress: parseStringish(item.contractAddress),
    name: parseStringish(item.name),
    symbol: parseStringish(item.symbol),
    price: parseStringish(item.price),
    percentChange24h: parseStringish(item.percentChange24h),
    volume24h: parseStringish(item.volume24h),
    marketCap: parseStringish(item.marketCap),
    liquidity: parseStringish(item.liquidity),
    holders: parseStringish(item.holders),
  }));
}

async function searchTokenMarket({ keyword, chainIds }) {
  const key = `token-search:${keyword || 'all'}:${chainIds || 'all'}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const response = await searchTokens({ keyword, chainIds });
  const items = Array.isArray(response?.data) ? response.data.map(normalizeTokenSummary) : [];
  const payload = { items };
  cache.set(key, payload);
  return payload;
}

async function getTokenDetails({ chainId, contractAddress }) {
  const key = `token-details:${chainId}:${contractAddress}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const [dynamicResponse, metaResponse] = await Promise.all([
    getTokenDynamic({ chainId, contractAddress }),
    getTokenMeta({ chainId, contractAddress }),
  ]);

  const payload = normalizeTokenDetail({
    dynamicData: dynamicResponse,
    metaData: metaResponse,
  });

  cache.set(key, payload);
  return payload;
}

async function auditTokenRecord({ chainId, contractAddress, requestId = randomUUID() }) {
  const key = `token-audit:${chainId}:${contractAddress}:${requestId}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const response = await require('../providers/binanceProvider').auditToken({ chainId, contractAddress, requestId });
  const payload = normalizeAuditResult(response);
  cache.set(key, payload, 60000);
  return payload;
}

async function getRankedMarket({ chainId, rankType = 10, period = 50, sortBy = 70, orderAsc = false, page = 1, size = 20 }) {
  const key = `market-rank:${chainId}:${rankType}:${period}:${sortBy}:${orderAsc}:${page}:${size}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const response = await getMarketRank({ chainId, rankType, period, sortBy, orderAsc, page, size });
  const payload = {
    items: normalizeMarketRank(response),
  };

  cache.set(key, payload, 30000);
  return payload;
}

module.exports = {
  allowedChainIds,
  searchTokenMarket,
  getTokenDetails,
  auditTokenRecord,
  getRankedMarket,
};
