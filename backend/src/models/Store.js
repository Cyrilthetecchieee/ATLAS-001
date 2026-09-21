// ─── In-Memory Store ─────────────────────────────────────────────────────────
// Generic time-series store used by telemetry, events, and logs.
// Will be replaced by database persistence in a future phase.

class Store {
  /**
   * @param {number} maxCapacity — maximum items before oldest are evicted
   */
  constructor(maxCapacity = 5000) {
    this.items = [];
    this.maxCapacity = maxCapacity;
  }

  /** Add an item to the store (newest first internally, but stored chronologically). */
  add(item) {
    this.items.push(item);
    if (this.items.length > this.maxCapacity) {
      this.items.shift(); // evict oldest
    }
    return item;
  }

  /** Return all items (newest first). */
  getAll() {
    return [...this.items].reverse();
  }

  /** Return the most recent item, optionally filtered. */
  getLatest(filterFn) {
    if (filterFn) {
      for (let i = this.items.length - 1; i >= 0; i--) {
        if (filterFn(this.items[i])) return this.items[i];
      }
      return null;
    }
    return this.items.length > 0 ? this.items[this.items.length - 1] : null;
  }

  /**
   * Query items with optional filters.
   * @param {Object} opts
   * @param {Function} [opts.filter] — predicate function
   * @param {number}   [opts.limit]  — max results (default 100)
   * @returns {Array}
   */
  query({ filter, limit = 100 } = {}) {
    let results = filter ? this.items.filter(filter) : [...this.items];
    results.reverse(); // newest first
    if (limit && limit > 0) results = results.slice(0, limit);
    return results;
  }

  /** Current count. */
  get count() {
    return this.items.length;
  }

  /** Clear all items. */
  clear() {
    this.items = [];
  }
}

module.exports = Store;
