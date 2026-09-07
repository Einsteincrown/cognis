class InMemoryCache {
  constructor(ttlMs = 30000) {
    this.ttlMs = ttlMs;
    this.store = new Map();
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  set(key, value, ttlMs = this.ttlMs) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
    return value;
  }

  delete(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

module.exports = { InMemoryCache };
