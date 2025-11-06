import React, { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import "./OSStats.css";

let socket: Socket | null = null;

const getSocket = () => {
  if (!socket) {
    socket = io("http://localhost:5000", {
      transports: ["websocket"],
    });
  }
  return socket;
};

interface OSStatsData {
  messageQueue: {
    urgent: number;
    high: number;
    normal: number;
    low: number;
    total: number;
  };
  threadCache: {
    size: number;
    capacity: number;
    hits: number;
    misses: number;
    hitRate: string;
    utilizationRate: string;
  };
  connectionSemaphore: {
    available: number;
    capacity: number;
    inUse: number;
    queueLength: number;
    utilizationRate: string;
  };
  messageScheduler: {
    totalWorkers: number;
    activeWorkers: number;
    totalLoad: number;
    totalCapacity: number;
    avgLoad: string;
    utilizationRate: string;
    workers: Array<{
      id: string;
      load: number;
      maxLoad: number;
      utilizationRate: string;
    }>;
  };
  deadlockDetector: {
    processes: Array<any>;
    resources: Array<any>;
    deadlockDetected: boolean;
  };
}

export default function OSStats() {
  const [stats, setStats] = useState<OSStatsData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    // Request stats every 2 seconds
    const interval = setInterval(() => {
      socket.emit("get-os-stats");
    }, 2000);

    // Listen for stats
    socket.on("os-stats", (data: OSStatsData) => {
      setStats(data);
    });

    return () => {
      clearInterval(interval);
      socket.off("os-stats");
    };
  }, []);

  if (!isVisible) {
    return (
      <button className="os-stats-toggle" onClick={() => setIsVisible(true)}>
        📊 OS Algorithms
      </button>
    );
  }

  return (
    <div className="os-stats-panel">
      <div className="os-stats-header">
        <h2>🎓 Operating System Algorithms</h2>
        <button className="close-btn" onClick={() => setIsVisible(false)}>
          ✕
        </button>
      </div>

      {stats ? (
        <div className="os-stats-content">
          {/* Priority Queue */}
          <div className="stat-card">
            <h3>⭐ Priority Message Queue</h3>
            <p className="stat-description">Priority Scheduling + FCFS</p>
            <div className="stat-card-inner">
              <div className="stat-grid">
              <div className="stat-item urgent">
                <span className="stat-label">URGENT</span>
                <span className="stat-value">{stats.messageQueue.urgent}</span>
              </div>
              <div className="stat-item high">
                <span className="stat-label">HIGH</span>
                <span className="stat-value">{stats.messageQueue.high}</span>
              </div>
              <div className="stat-item normal">
                <span className="stat-label">NORMAL</span>
                <span className="stat-value">{stats.messageQueue.normal}</span>
              </div>
              <div className="stat-item low">
                <span className="stat-label">LOW</span>
                <span className="stat-value">{stats.messageQueue.low}</span>
              </div>
              </div>
              <div className="stat-total">
                Total Messages: <strong>{stats.messageQueue.total}</strong>
              </div>
            </div>
          </div>

          {/* LRU Cache */}
          <div className="stat-card">
            <h3>💾 LRU Cache</h3>
            <p className="stat-description">Least Recently Used Page Replacement</p>
            <div className="stat-card-inner">
              <div className="stat-row">
                <div className="stat-col">
                  <span className="stat-label">Hit Rate</span>
                  <span className="stat-value highlight">{stats.threadCache.hitRate}</span>
                </div>
                <div className="stat-col">
                  <span className="stat-label">Utilization</span>
                  <span className="stat-value">{stats.threadCache.utilizationRate}</span>
                </div>
              </div>
              <div className="stat-row">
                <div className="stat-col">
                  <span className="stat-label">Hits</span>
                  <span className="stat-value">{stats.threadCache.hits}</span>
                </div>
                <div className="stat-col">
                  <span className="stat-label">Misses</span>
                  <span className="stat-value">{stats.threadCache.misses}</span>
                </div>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: stats.threadCache.utilizationRate,
                    backgroundColor: "#4CAF50",
                  }}
                />
              </div>
              <small>
                {stats.threadCache.size} / {stats.threadCache.capacity} cached threads
              </small>
            </div>
          </div>

          {/* Semaphore */}
          <div className="stat-card">
            <h3>🚦 Connection Semaphore</h3>
            <p className="stat-description">Synchronization Primitive</p>
            <div className="stat-card-inner">
              <div className="stat-row">
                <div className="stat-col">
                  <span className="stat-label">In Use</span>
                  <span className="stat-value">{stats.connectionSemaphore.inUse}</span>
                </div>
                <div className="stat-col">
                  <span className="stat-label">Available</span>
                  <span className="stat-value">{stats.connectionSemaphore.available}</span>
                </div>
              </div>

              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: stats.connectionSemaphore.utilizationRate,
                    backgroundColor: "#2196F3",
                  }}
                />
              </div>

              <small>
                {stats.connectionSemaphore.inUse} / {stats.connectionSemaphore.capacity} connections (
                {stats.connectionSemaphore.queueLength} waiting)
              </small>
            </div>
          </div>

          {/* Round Robin Scheduler */}
          <div className="stat-card">
            <h3>⚖️ Round Robin Scheduler</h3>
            <p className="stat-description">Fair CPU Scheduling</p>
            <div className="stat-card-inner">
              <div className="stat-row">
                <div className="stat-col">
                  <span className="stat-label">Workers</span>
                  <span className="stat-value">{stats.messageScheduler.activeWorkers}</span>
                </div>
                <div className="stat-col">
                  <span className="stat-label">Avg Load</span>
                  <span className="stat-value">{stats.messageScheduler.avgLoad}</span>
                </div>
              </div>
              <div className="workers-list">
                {stats.messageScheduler.workers.map((worker) => (
                  <div key={worker.id} className="worker-item">
                    <span className="worker-name">{worker.id}</span>
                    <div className="worker-progress">
                      <div
                        className="worker-progress-fill"
                        style={{
                          width: worker.utilizationRate,
                          backgroundColor: "#FF9800",
                        }}
                      />
                    </div>
                    <span className="worker-load">
                      {worker.load}/{worker.maxLoad}
                    </span>
                  </div>
                ))}
              </div>
              <div className="stat-total">
                Total Utilization: <strong>{stats.messageScheduler.utilizationRate}</strong>
              </div>
            </div>
          </div>

          {/* Deadlock Detector */}
          <div className="stat-card">
            <h3>🔒 Deadlock Detector</h3>
            <p className="stat-description">Resource Allocation Graph</p>
            <div className="stat-card-inner">
              <div className="stat-row">
              <div className="stat-col">
                <span className="stat-label">Processes</span>
                <span className="stat-value">{stats.deadlockDetector.processes.length}</span>
              </div>
              <div className="stat-col">
                <span className="stat-label">Resources</span>
                <span className="stat-value">{stats.deadlockDetector.resources.length}</span>
              </div>
              </div>
              <div
                className={`deadlock-status ${
                  stats.deadlockDetector.deadlockDetected ? "deadlock-detected" : "deadlock-safe"
                }`}
              >
              {stats.deadlockDetector.deadlockDetected ? (
                <>
                  <span className="status-icon">⚠️</span>
                  <span>DEADLOCK DETECTED</span>
                </>
              ) : (
                <>
                  <span className="status-icon">✅</span>
                  <span>SAFE STATE</span>
                </>
              )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="loading">Loading OS stats...</div>
      )}
    </div>
  );
}
