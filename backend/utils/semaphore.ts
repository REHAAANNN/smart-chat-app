// Semaphore Implementation for Concurrency Control
// OS Concept: Synchronization primitive for managing concurrent access

export class Semaphore {
  private permits: number;
  private maxPermits: number;
  private waitQueue: Array<() => void> = [];

  constructor(initialPermits: number) {
    this.permits = initialPermits;
    this.maxPermits = initialPermits;
  }

  // Acquire a permit (OS: P operation / wait)
  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      console.log(`🔒 Semaphore acquired (${this.permits}/${this.maxPermits} available)`);
      return Promise.resolve();
    }

    // Wait in queue
    return new Promise<void>((resolve) => {
      console.log(`⏳ Semaphore waiting (queue size: ${this.waitQueue.length + 1})`);
      this.waitQueue.push(resolve);
    });
  }

  // Release a permit (OS: V operation / signal)
  release(): void {
    if (this.waitQueue.length > 0) {
      const resolve = this.waitQueue.shift()!;
      console.log(`🔓 Semaphore released to waiting process (queue size: ${this.waitQueue.length})`);
      resolve();
    } else {
      this.permits++;
      console.log(`🔓 Semaphore released (${this.permits}/${this.maxPermits} available)`);
    }
  }

  // Try to acquire without waiting (non-blocking)
  tryAcquire(): boolean {
    if (this.permits > 0) {
      this.permits--;
      console.log(`✅ Semaphore try-acquired (${this.permits}/${this.maxPermits} available)`);
      return true;
    }
    console.log(`❌ Semaphore try-acquire failed (no permits available)`);
    return false;
  }

  // Get available permits
  availablePermits(): number {
    return this.permits;
  }

  // Get queue length
  getQueueLength(): number {
    return this.waitQueue.length;
  }

  // Get statistics
  getStats() {
    return {
      available: this.permits,
      capacity: this.maxPermits,
      inUse: this.maxPermits - this.permits,
      queueLength: this.waitQueue.length,
      utilizationRate: ((this.maxPermits - this.permits) / this.maxPermits * 100).toFixed(2) + "%"
    };
  }
}

// Mutex - Binary Semaphore (OS: Mutual Exclusion)
export class Mutex extends Semaphore {
  private owner: string | null = null;

  constructor() {
    super(1); // Binary semaphore
  }

  async lock(ownerId: string): Promise<void> {
    await this.acquire();
    this.owner = ownerId;
    console.log(`🔐 Mutex locked by: ${ownerId}`);
  }

  unlock(ownerId: string): void {
    if (this.owner !== ownerId) {
      throw new Error(`❌ Cannot unlock mutex: not owned by ${ownerId}`);
    }
    this.owner = null;
    this.release();
    console.log(`🔓 Mutex unlocked by: ${ownerId}`);
  }

  getOwner(): string | null {
    return this.owner;
  }
}

// Example: Limit concurrent socket connections
export const socketSemaphore = new Semaphore(100); // Max 100 concurrent connections

// Example: Protect shared resource (thread/user data)
export const userDataMutex = new Mutex();
