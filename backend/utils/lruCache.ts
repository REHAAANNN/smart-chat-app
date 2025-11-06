// LRU (Least Recently Used) Cache Implementation
// OS Algorithm: Page Replacement (LRU)
// Used for caching message history to reduce memory usage

export interface CacheNode<K, V> {
  key: K;
  value: V;
  prev: CacheNode<K, V> | null;
  next: CacheNode<K, V> | null;
  accessCount: number;
  lastAccessed: number;
}

export class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, CacheNode<K, V>>;
  private head: CacheNode<K, V> | null;
  private tail: CacheNode<K, V> | null;
  private hits: number = 0;
  private misses: number = 0;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map();
    this.head = null;
    this.tail = null;
  }

  // Get value from cache (OS: Memory access)
  get(key: K): V | null {
    const node = this.cache.get(key);
    
    if (!node) {
      this.misses++;
      console.log(`❌ Cache MISS for key: ${key}`);
      return null;
    }

    this.hits++;
    node.accessCount++;
    node.lastAccessed = Date.now();
    
    // Move to front (most recently used)
    this.moveToFront(node);
    
    console.log(`✅ Cache HIT for key: ${key} (hits: ${this.hits}, misses: ${this.misses})`);
    return node.value;
  }

  // Put value in cache (OS: Page replacement)
  put(key: K, value: V): void {
    // Update existing node
    if (this.cache.has(key)) {
      const node = this.cache.get(key)!;
      node.value = value;
      node.lastAccessed = Date.now();
      this.moveToFront(node);
      return;
    }

    // Evict if at capacity (LRU eviction)
    if (this.cache.size >= this.capacity) {
      this.evictLRU();
    }

    // Create new node
    const newNode: CacheNode<K, V> = {
      key,
      value,
      prev: null,
      next: this.head,
      accessCount: 1,
      lastAccessed: Date.now(),
    };

    if (this.head) {
      this.head.prev = newNode;
    }

    this.head = newNode;

    if (!this.tail) {
      this.tail = newNode;
    }

    this.cache.set(key, newNode);
    console.log(`💾 Cached key: ${key} (size: ${this.cache.size}/${this.capacity})`);
  }

  // Move node to front (most recently used)
  private moveToFront(node: CacheNode<K, V>): void {
    if (node === this.head) return;

    // Remove from current position
    if (node.prev) {
      node.prev.next = node.next;
    }
    if (node.next) {
      node.next.prev = node.prev;
    }
    if (node === this.tail) {
      this.tail = node.prev;
    }

    // Move to front
    node.prev = null;
    node.next = this.head;
    if (this.head) {
      this.head.prev = node;
    }
    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  // Evict least recently used (OS: Page replacement - LRU)
  private evictLRU(): void {
    if (!this.tail) return;

    const evictedKey = this.tail.key;
    console.log(`🗑️  EVICTED (LRU): ${evictedKey}`);

    if (this.tail.prev) {
      this.tail.prev.next = null;
      this.tail = this.tail.prev;
    } else {
      this.head = null;
      this.tail = null;
    }

    this.cache.delete(evictedKey);
  }

  // Clear cache
  clear(): void {
    this.cache.clear();
    this.head = null;
    this.tail = null;
    this.hits = 0;
    this.misses = 0;
  }

  // Get cache statistics (OS: Performance monitoring)
  getStats() {
    const hitRate = this.hits + this.misses > 0 
      ? (this.hits / (this.hits + this.misses) * 100).toFixed(2) 
      : 0;

    return {
      size: this.cache.size,
      capacity: this.capacity,
      hits: this.hits,
      misses: this.misses,
      hitRate: `${hitRate}%`,
      utilizationRate: `${((this.cache.size / this.capacity) * 100).toFixed(2)}%`,
    };
  }

  // Get all cached keys (for debugging)
  keys(): K[] {
    return Array.from(this.cache.keys());
  }
}

// Example usage for message caching
export const messageCache = new LRUCache<string, any>(100); // Cache last 100 threads
