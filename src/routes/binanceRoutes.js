const express = require('express');
const { randomUUID } = require('crypto');
const {
  allowedChainIds,
  searchTokenMarket,
  getTokenDetails,
  auditTokenRecord,
  getRankedMarket,
} = require('../services/binanceService');

const router = express.Router();

function isValidChain(chainId) {
  return allowedChainIds.has(String(chainId));
}

function validateContractAddress(contractAddress) {
  return typeof contractAddress === 'string' && contractAddress.trim().length > 0;
}

router.get('/tokens/search', async (req, res, next) => {
  try {
    const keyword = (req.query.keyword || '').toString().trim();
    const chainIds = (req.query.chainIds || '').toString().trim();

    if (!keyword) {
      return res.status(400).json({ error: 'keyword is required' });
    }

    const data = await searchTokenMarket({ keyword, chainIds: chainIds || undefined });
    return res.json(data);
  } catch (error) {
    return next(error);
  }
});

router.get('/tokens/:chainId/:contractAddress', async (req, res, next) => {
  try {
    const { chainId, contractAddress } = req.params;

    if (!isValidChain(chainId)) {
      return res.status(400).json({ error: 'Unsupported chainId. Supported: 1, 56, 8453, CT_501' });
    }

    if (!validateContractAddress(contractAddress)) {
      return res.status(400).json({ error: 'contractAddress is required' });
    }

    const data = await getTokenDetails({ chainId, contractAddress });
    return res.json(data);
  } catch (error) {
    return next(error);
  }
});

router.post('/tokens/audit', async (req, res, next) => {
  try {
    const { chainId, contractAddress, requestId } = req.body || {};

    if (!isValidChain(chainId)) {
      return res.status(400).json({ error: 'Unsupported chainId. Supported: 1, 56, 8453, CT_501' });
    }

    if (!validateContractAddress(contractAddress)) {
      return res.status(400).json({ error: 'contractAddress is required' });
    }

    const payload = await auditTokenRecord({
      chainId,
      contractAddress,
      requestId: requestId || randomUUID(),
    });

    return res.json({
      chainId,
      contractAddress,
      ...payload,
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/market/rank', async (req, res, next) => {
  try {
    const chainId = (req.query.chainId || '').toString();
    const rankType = Number(req.query.rankType || 10);
    const period = Number(req.query.period || 50);
    const sortBy = Number(req.query.sortBy || 70);
    const orderAsc = (req.query.orderAsc || 'false').toString() === 'true';
    const page = Number(req.query.page || 1);
    const size = Number(req.query.size || 20);

    if (!isValidChain(chainId)) {
      return res.status(400).json({ error: 'chainId is required and must be one of: 1, 56, 8453, CT_501' });
    }

    const data = await getRankedMarket({ chainId, rankType, period, sortBy, orderAsc, page, size });
    return res.json(data);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
