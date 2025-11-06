// Deadlock Detection Algorithm
// OS Concept: Resource allocation graph & Banker's Algorithm

export interface Resource {
  id: string;
  type: string;
  holder: string | null;
  waitQueue: string[];
}

export interface Process {
  id: string;
  holding: string[];
  waiting: string[];
}

export class DeadlockDetector {
  private resources: Map<string, Resource> = new Map();
  private processes: Map<string, Process> = new Map();

  // Request resource (OS: Resource allocation)
  requestResource(processId: string, resourceId: string): boolean {
    let resource = this.resources.get(resourceId);
    
    if (!resource) {
      // Create new resource
      resource = {
        id: resourceId,
        type: "thread",
        holder: null,
        waitQueue: [],
      };
      this.resources.set(resourceId, resource);
    }

    let process = this.processes.get(processId);
    if (!process) {
      process = { id: processId, holding: [], waiting: [] };
      this.processes.set(processId, process);
    }

    // Resource is free
    if (!resource.holder) {
      resource.holder = processId;
      process.holding.push(resourceId);
      console.log(`✅ Process ${processId} acquired resource ${resourceId}`);
      return true;
    }

    // Resource is held by another process
    resource.waitQueue.push(processId);
    process.waiting.push(resourceId);
    console.log(`⏳ Process ${processId} waiting for resource ${resourceId} (held by ${resource.holder})`);

    // Check for deadlock
    if (this.detectDeadlock()) {
      console.log(`🚨 DEADLOCK DETECTED! Process ${processId} requesting ${resourceId}`);
      // Remove from wait queue to prevent deadlock
      resource.waitQueue = resource.waitQueue.filter(p => p !== processId);
      process.waiting = process.waiting.filter(r => r !== resourceId);
      return false;
    }

    return false;
  }

  // Release resource (OS: Resource deallocation)
  releaseResource(processId: string, resourceId: string): void {
    const resource = this.resources.get(resourceId);
    const process = this.processes.get(processId);

    if (!resource || !process || resource.holder !== processId) {
      console.log(`❌ Cannot release: resource ${resourceId} not held by process ${processId}`);
      return;
    }

    // Release resource
    resource.holder = null;
    process.holding = process.holding.filter(r => r !== resourceId);
    console.log(`🔓 Process ${processId} released resource ${resourceId}`);

    // Assign to next waiting process
    if (resource.waitQueue.length > 0) {
      const nextProcess = resource.waitQueue.shift()!;
      const nextProcessObj = this.processes.get(nextProcess);
      
      if (nextProcessObj) {
        resource.holder = nextProcess;
        nextProcessObj.holding.push(resourceId);
        nextProcessObj.waiting = nextProcessObj.waiting.filter(r => r !== resourceId);
        console.log(`✅ Resource ${resourceId} assigned to waiting process ${nextProcess}`);
      }
    }
  }

  // Detect deadlock using cycle detection (OS: Deadlock detection)
  private detectDeadlock(): boolean {
    const graph = this.buildResourceAllocationGraph();
    return this.hasCycle(graph);
  }

  // Build resource allocation graph
  private buildResourceAllocationGraph(): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    // Process -> Resource edges (waiting for)
    this.processes.forEach((process) => {
      if (!graph.has(process.id)) {
        graph.set(process.id, []);
      }
      process.waiting.forEach(resourceId => {
        graph.get(process.id)!.push(resourceId);
      });
    });

    // Resource -> Process edges (held by)
    this.resources.forEach((resource) => {
      if (!graph.has(resource.id)) {
        graph.set(resource.id, []);
      }
      if (resource.holder) {
        graph.get(resource.id)!.push(resource.holder);
      }
    });

    return graph;
  }

  // Detect cycle in directed graph (DFS)
  private hasCycle(graph: Map<string, string[]>): boolean {
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfs = (node: string): boolean => {
      visited.add(node);
      recStack.add(node);

      const neighbors = graph.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) return true;
        } else if (recStack.has(neighbor)) {
          // Cycle detected!
          console.log(`🔄 Cycle detected: ${node} -> ${neighbor}`);
          return true;
        }
      }

      recStack.delete(node);
      return false;
    };

    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        if (dfs(node)) return true;
      }
    }

    return false;
  }

  // Get system state
  getState() {
    return {
      processes: Array.from(this.processes.values()).map(p => ({
        id: p.id,
        holding: p.holding,
        waiting: p.waiting,
      })),
      resources: Array.from(this.resources.values()).map(r => ({
        id: r.id,
        holder: r.holder,
        waitQueue: r.waitQueue,
      })),
      deadlockDetected: this.detectDeadlock(),
    };
  }

  // Clear all resources and processes
  clear(): void {
    this.resources.clear();
    this.processes.clear();
  }
}

// Example usage for thread locking
export const deadlockDetector = new DeadlockDetector();
