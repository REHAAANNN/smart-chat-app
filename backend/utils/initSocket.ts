import { Server, Socket } from "socket.io";
import { PriorityMessageQueue, MessagePriority } from "./messageQueue";
import { LRUCache } from "./lruCache";
import { Semaphore } from "./semaphore";
import { RoundRobinScheduler } from "./roundRobin";
import { DeadlockDetector } from "./deadlockDetector";

export interface User {
  id: string;
  name: string;
  online: boolean;
  socketId?: string;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
}

export interface Thread {
  id: string;
  participants: string[];
  messages: Message[];
}

// Use Map for threads
export const threads: Map<string, Thread> = new Map();

// Store users by ID with socketId
export const users: Record<string, User> = {};

// Store groups in-memory
export interface Group {
  id: string;
  name: string;
  members: string[];
  creatorId?: string;
}

export const groups: Map<string, Group> = new Map();

// 🚀 OS Algorithm Instances
const messageQueue = new PriorityMessageQueue();
const threadCache = new LRUCache<string, Thread>(100); // Cache 100 threads
const connectionSemaphore = new Semaphore(100); // Max 100 concurrent connections
const messageScheduler = new RoundRobinScheduler(1000); // 1 second time quantum
const deadlockDetector = new DeadlockDetector();

// Initialize 3 message processing workers
messageScheduler.addWorker("worker-1", 50);
messageScheduler.addWorker("worker-2", 50);
messageScheduler.addWorker("worker-3", 50);

export const initSocket = (io: Server) => {
  io.on("connection", async (socket: Socket) => {
    // 🚦 Semaphore: Limit concurrent connections
    await connectionSemaphore.acquire();

    console.log("⚡ Socket connected:", socket.id);
    const connStats = connectionSemaphore.getStats();
    console.log(`📊 Active connections: ${connStats.inUse}/${connStats.capacity}`);

    socket.on("user-online", (userData: User) => {
      users[userData.id] = { ...userData, socketId: socket.id, online: true };
      console.log(`🟢 ${userData.name} is online with socket ${socket.id}`);
      io.emit("update-user-list", Object.values(users));
      // send current groups to the newly connected client
      socket.emit("groups-updated", Array.from(groups.values()));
    });

    // Create group (persist in-memory and broadcast)
    socket.on("create-group", (data: { groupName: string; members: string[]; creatorId?: string }) => {
      const id = `g-${Date.now()}`;
      const group: Group = { id, name: data.groupName, members: data.members, creatorId: data.creatorId };
      groups.set(id, group);
      console.log(`👥 Group created: ${group.name} (${id}) with ${group.members.length} members`);
      io.emit("groups-updated", Array.from(groups.values()));
    });

    socket.on("send-message", async (data: { threadId: string; message: Message }) => {
      const { threadId, message } = data;
      console.log(`💬 Message in ${threadId}:`, message.content);

      // 🔒 Deadlock Detection: Request thread resource
      const resourceAcquired = deadlockDetector.requestResource(message.senderId, threadId);
      if (!resourceAcquired) {
        console.log(`⚠️ Deadlock detected! User ${message.senderId} cannot access ${threadId}`);
        socket.emit("error", { message: "Resource temporarily unavailable" });
        return;
      }

      // ⭐ Priority Queue: Determine message priority
      let priority = MessagePriority.NORMAL;
      const content = message.content.toLowerCase();
      if (content.includes("urgent") || content.includes("emergency")) {
        priority = MessagePriority.URGENT;
      } else if (content.includes("important") || content.startsWith("@")) {
        priority = MessagePriority.HIGH;
      }

      // Add to priority queue (automatically processes with 1 second delay)
      messageQueue.enqueue({
        id: message.id,
        threadId,
        message,
        priority,
        timestamp: Date.now(),
        retries: 0,
      });

      // Log queue stats (message is now queued and visible for 1 second)
      const queueStats = messageQueue.getStats();
      console.log(`📊 Queue: ${queueStats.total} messages (U:${queueStats.urgent} H:${queueStats.high} N:${queueStats.normal} L:${queueStats.low})`);

      // ⚖️ Round Robin: Assign to worker
      const worker = messageScheduler.assignTask();
      if (worker) {
        console.log(`🔄 Assigned to ${worker.id} (load: ${worker.load}/${worker.maxLoad})`);
      }

      // Get or create thread in the Map
      let thread = threads.get(threadId);
      if (!thread) {
        // If this is a group thread (group-<id>), use the groups store for participants
        if (threadId.startsWith("group-")) {
          const gid = threadId.replace("group-", "");
          const g = groups.get(gid);
          const participants = g ? [...g.members] : threadId.split("-");
          thread = { id: threadId, participants, messages: [] };
        } else {
          // Extract participants from threadId (sorted userIds joined by "-")
          const participants = threadId.split("-");
          thread = { id: threadId, participants, messages: [] };
        }
        threads.set(threadId, thread);
      }
      thread.messages.push(message);

      // 💾 LRU Cache: Update cache
      threadCache.put(threadId, thread);

      // Emit message to all participants (avoid duplicate emits by tracking socketIds)
      const emitted = new Set<string>();
      thread.participants.forEach((userId) => {
        const socketId = users[userId]?.socketId;
        if (socketId && !emitted.has(socketId)) {
          io.to(socketId).emit("receive-message", { ...message, threadId });
          emitted.add(socketId);
        }
      });

      // Release worker and resource
      if (worker) {
        messageScheduler.releaseTask(worker.id);
      }
      deadlockDetector.releaseResource(message.senderId, threadId);
    });

    socket.on("join-thread", (threadId: string) => {
      // 💾 LRU Cache: Try cache first
      let thread = threadCache.get(threadId);
      
      if (!thread) {
        // Cache miss - load from storage
        console.log(`🔍 Cache miss for thread ${threadId}`);
        const storageThread = threads.get(threadId);
        if (storageThread) {
          thread = storageThread;
          threadCache.put(threadId, thread);
        }
      } else {
        console.log(`✨ Cache hit for thread ${threadId}`);
      }

      if (thread) {
        socket.emit("thread-history", { threadId, messages: thread.messages });
      }

      // Log cache stats
      const cacheStats = threadCache.getStats();
      console.log(`📊 Cache: ${cacheStats.hitRate} hit rate, ${cacheStats.utilizationRate} utilization`);
    });

    socket.on("disconnect", (reason) => {
      // 🚦 Semaphore: Release connection slot
      connectionSemaphore.release();
      const connStats = connectionSemaphore.getStats();
      console.log(`📊 Connection released. Active: ${connStats.inUse}/${connStats.capacity}`);

      const user = Object.values(users).find((u) => u.socketId === socket.id);
      if (user) {
        user.online = false;
        user.socketId = undefined;
        io.emit("update-user-list", Object.values(users));
        console.log(`🔴 ${user.name} disconnected (${reason})`);
      }
    });

    // 📊 OS Algorithm Stats Endpoint
    socket.on("get-os-stats", () => {
      const stats = {
        messageQueue: messageQueue.getStats(),
        threadCache: threadCache.getStats(),
        connectionSemaphore: connectionSemaphore.getStats(),
        messageScheduler: messageScheduler.getStats(),
        deadlockDetector: deadlockDetector.getState(),
      };
      socket.emit("os-stats", stats);
      console.log("📊 OS Stats requested:", stats);
    });

    // Broadcast announcement to all online users and all groups
    socket.on("broadcast-announcement", async (data: { content: string; senderId?: string }) => {
      const content = data.content || "(announcement)";
      const senderId = data.senderId || "system";
      const message: Message = {
        id: `m-${Date.now()}`,
        senderId,
        content,
        timestamp: new Date().toISOString(),
      };

      // Determine priority
      let priority = MessagePriority.NORMAL;
      const lc = content.toLowerCase();
      if (lc.includes("urgent") || lc.includes("emergency")) priority = MessagePriority.URGENT;
      else if (lc.includes("important") || lc.startsWith("@")) priority = MessagePriority.HIGH;

      console.log(`📣 Announcement queued by ${senderId}: ${content}`);

      const sentSocketIds = new Set<string>();

      // 1) Send to all groups (as group threads)
      groups.forEach((g) => {
        const threadId = `group-${g.id}`;
        // ensure thread exists
        let thread = threads.get(threadId);
        if (!thread) {
          thread = { id: threadId, participants: g.members, messages: [] };
          threads.set(threadId, thread);
        }

        // push message into thread
        thread.messages.push(message);
        threadCache.put(threadId, thread);

        // enqueue for processing via messageQueue / scheduler
        messageQueue.enqueue({ id: message.id, threadId, message, priority, timestamp: Date.now(), retries: 0 });
        const worker = messageScheduler.assignTask();

        // emit to group members sockets
        g.members.forEach((uid) => {
          const sid = users[uid]?.socketId;
          if (sid && !sentSocketIds.has(sid)) {
            io.to(sid).emit("receive-message", { ...message, threadId });
            sentSocketIds.add(sid);
          }
        });

        if (worker) messageScheduler.releaseTask(worker.id);
      });

      // 2) Send to all online users (directly)
      Object.values(users).forEach((u) => {
        if (u.online && u.socketId && !sentSocketIds.has(u.socketId)) {
          // enqueue a per-user thread for audit
          const threadId = `announcement-user-${u.id}`;
          let thread = threads.get(threadId);
          if (!thread) {
            thread = { id: threadId, participants: [u.id], messages: [] };
            threads.set(threadId, thread);
          }
          thread.messages.push(message);
          threadCache.put(threadId, thread);

          messageQueue.enqueue({ id: message.id, threadId, message, priority, timestamp: Date.now(), retries: 0 });
          const worker = messageScheduler.assignTask();

          io.to(u.socketId).emit("receive-message", { ...message, threadId });
          sentSocketIds.add(u.socketId);

          if (worker) messageScheduler.releaseTask(worker.id);
        }
      });

      console.log(`📣 Announcement dispatched to ${sentSocketIds.size} sockets`);
    });
  });
};
