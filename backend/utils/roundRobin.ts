// Round Robin Scheduler for Load Balancing
// OS Algorithm: Round Robin Process Scheduling

export interface Worker {
  id: string;
  load: number;
  maxLoad: number;
  active: boolean;
  lastAssigned: number;
}

export class RoundRobinScheduler {
  private workers: Worker[] = [];
  private currentIndex: number = 0;
  private quantum: number; // Time slice in milliseconds

  constructor(quantum: number = 1000) {
    this.quantum = quantum;
  }

  // Add worker to the pool
  addWorker(id: string, maxLoad: number = 10): void {
    this.workers.push({
      id,
      load: 0,
      maxLoad,
      active: true,
      lastAssigned: 0,
    });
    console.log(`➕ Worker added: ${id} (total workers: ${this.workers.length})`);
  }

  // Remove worker from pool
  removeWorker(id: string): void {
    this.workers = this.workers.filter(w => w.id !== id);
    console.log(`➖ Worker removed: ${id} (remaining workers: ${this.workers.length})`);
  }

  // Assign task using Round Robin (OS: Process scheduling)
  assignTask(): Worker | null {
    if (this.workers.length === 0) {
      console.log("❌ No workers available");
      return null;
    }

    let attempts = 0;
    const maxAttempts = this.workers.length;

    while (attempts < maxAttempts) {
      const worker = this.workers[this.currentIndex];
      
      // Move to next worker (Round Robin)
      this.currentIndex = (this.currentIndex + 1) % this.workers.length;
      attempts++;

      // Check if worker can handle more load
      if (worker.active && worker.load < worker.maxLoad) {
        worker.load++;
        worker.lastAssigned = Date.now();
        console.log(`🔄 Task assigned to worker ${worker.id} (load: ${worker.load}/${worker.maxLoad})`);
        return worker;
      }
    }

    console.log("⚠️  All workers at capacity");
    return null;
  }

  // Release task from worker
  releaseTask(workerId: string): void {
    const worker = this.workers.find(w => w.id === workerId);
    if (worker && worker.load > 0) {
      worker.load--;
      console.log(`✅ Task released from worker ${workerId} (load: ${worker.load}/${worker.maxLoad})`);
    }
  }

  // Get load statistics
  getStats() {
    const totalLoad = this.workers.reduce((sum, w) => sum + w.load, 0);
    const totalCapacity = this.workers.reduce((sum, w) => sum + w.maxLoad, 0);
    const avgLoad = this.workers.length > 0 
      ? (totalLoad / this.workers.length).toFixed(2) 
      : 0;

    return {
      totalWorkers: this.workers.length,
      activeWorkers: this.workers.filter(w => w.active).length,
      totalLoad,
      totalCapacity,
      avgLoad,
      utilizationRate: totalCapacity > 0 
        ? `${((totalLoad / totalCapacity) * 100).toFixed(2)}%` 
        : "0%",
      workers: this.workers.map(w => ({
        id: w.id,
        load: w.load,
        maxLoad: w.maxLoad,
        utilizationRate: `${((w.load / w.maxLoad) * 100).toFixed(2)}%`,
      })),
    };
  }

  // Get next worker (without assigning)
  getNextWorker(): Worker | null {
    return this.workers[this.currentIndex] || null;
  }
}

// Example: Load balance message processing
export const messageScheduler = new RoundRobinScheduler(1000);

// Initialize with 3 workers
messageScheduler.addWorker("worker-1", 50);
messageScheduler.addWorker("worker-2", 50);
messageScheduler.addWorker("worker-3", 50);
