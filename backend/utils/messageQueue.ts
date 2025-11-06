// Priority-based Message Queue using OS Scheduling Algorithms
// Implements: Priority Scheduling + FCFS (First Come First Serve)

export enum MessagePriority {
  URGENT = 1,      // System messages, alerts
  HIGH = 2,        // Direct messages
  NORMAL = 3,      // Group messages
  LOW = 4          // Background notifications
}

export interface QueuedMessage {
  id: string;
  threadId: string;
  message: any;
  priority: MessagePriority;
  timestamp: number;
  retries: number;
}

export class PriorityMessageQueue {
  private queues: Map<MessagePriority, QueuedMessage[]>;
  private processing: boolean = false;
  private maxRetries: number = 3;

  constructor() {
    this.queues = new Map([
      [MessagePriority.URGENT, []],
      [MessagePriority.HIGH, []],
      [MessagePriority.NORMAL, []],
      [MessagePriority.LOW, []],
    ]);
  }

  // Enqueue with priority (OS: Priority Scheduling)
  enqueue(message: QueuedMessage): void {
    const queue = this.queues.get(message.priority);
    if (queue) {
      queue.push(message);
      // Sort by timestamp within same priority (FCFS within priority)
      queue.sort((a, b) => a.timestamp - b.timestamp);
    }
    this.processQueue();
  }

  // Dequeue highest priority message (OS: Priority Scheduling)
  private dequeue(): QueuedMessage | null {
    for (const priority of [MessagePriority.URGENT, MessagePriority.HIGH, 
                             MessagePriority.NORMAL, MessagePriority.LOW]) {
      const queue = this.queues.get(priority);
      if (queue && queue.length > 0) {
        return queue.shift()!;
      }
    }
    return null;
  }

  // Process queue (OS: Process Scheduling)
  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (true) {
      const message = this.dequeue();
      if (!message) break;

      try {
        await this.sendMessage(message);
      } catch (error) {
        // Retry mechanism (OS: Error handling & recovery)
        if (message.retries < this.maxRetries) {
          message.retries++;
          this.enqueue(message);
        } else {
          console.error(`Message ${message.id} failed after ${this.maxRetries} retries`);
        }
      }
    }

    this.processing = false;
  }

  private async sendMessage(message: QueuedMessage): Promise<void> {
    // Simulate network delay
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`✉️  Sent message ${message.id} with priority ${message.priority}`);
        resolve();
      }, 100);
    });
  }

  // Get queue statistics
  getStats() {
    return {
      urgent: this.queues.get(MessagePriority.URGENT)?.length || 0,
      high: this.queues.get(MessagePriority.HIGH)?.length || 0,
      normal: this.queues.get(MessagePriority.NORMAL)?.length || 0,
      low: this.queues.get(MessagePriority.LOW)?.length || 0,
      total: Array.from(this.queues.values()).reduce((sum, q) => sum + q.length, 0),
    };
  }
}
