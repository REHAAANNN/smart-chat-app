import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { io, Socket } from "socket.io-client";
import {
  ArrowLeft,
  Send,
  Search,
  MoreVertical,
  Phone,
  Video,
  MessageCircle,
  Image as ImageIcon,
  Mic,
  Paperclip,
  X,
} from "lucide-react";
import "./ChatApp.css";

export type UserContact = {
  id: string;
  name: string;
  online: boolean;
  avatar?: string;
};

export type Message = {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  type?: "text" | "image" | "audio";
  imageUrl?: string;
  audioUrl?: string;
  audioDuration?: number;
};

export type Thread = {
  id: string;
  name: string;
  participants: UserContact[];
  messages: Message[];
  avatar?: string;
};

interface ChatAppProps {
  onNavigateBack: () => void;
  threadId?: string;
}

let socket: Socket | null = null;
const getSocket = () => {
  if (!socket) {
    socket = io("http://localhost:5000", {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

export default function ChatApp({ onNavigateBack, threadId }: ChatAppProps) {
  const { user } = useUser();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [users, setUsers] = useState<UserContact[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(
    threadId || null
  );
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();

    const currentUser = {
      id: user.id,
      name: user.fullName || "Anonymous",
      online: true,
    };

    socket.emit("user-online", currentUser);

    socket.on("update-user-list", (userList: UserContact[]) => {
      setUsers(userList.filter((u) => u.id !== user.id));
    });

    socket.on("receive-message", (msg: Message & { threadId: string }) => {
      console.log("📥 Received message:", msg);
      console.log("👤 From user:", msg.senderId, "Current user:", user.id);

      setThreads((prev) => {
        // ensure thread exists locally
        const existing = prev.find((t) => t.id === msg.threadId);
        if (!existing) {
          const newThread: Thread = {
            id: msg.threadId,
            name: msg.threadId.startsWith("group-") ? "Group" : "Announcement",
            participants: [],
            messages: [],
            avatar: msg.threadId.startsWith("group-") ? "👥" : "📣",
          };
          prev = [...prev, newThread];
        }

        // Only append the incoming message when it's not from the current user (avoid duplicate local+server adds)
        if (msg.senderId === user.id) {
          return prev;
        }

        return prev.map((t) => (t.id === msg.threadId ? { ...t, messages: [...t.messages, msg] } : t));
      });

      // Show notification if message is from someone else
      if (msg.senderId !== user.id && Notification.permission === "granted") {
        const senderName = users.find((u) => u.id === msg.senderId)?.name || "Someone";
        console.log("🔔 Showing notification from:", senderName);
        const notification = new Notification(`New message from ${senderName}`, {
          body: msg.content,
          icon: "/vite.svg",
          tag: msg.threadId,
        });

        notification.onclick = () => {
          window.focus();
          setActiveThreadId(msg.threadId);
          notification.close();
        };

        // Auto-close after 5 seconds
        setTimeout(() => notification.close(), 5000);
      }
    });

    socket.on("thread-history", ({ threadId, messages }) => {
      setThreads((prev) => {
        const existing = prev.find((t) => t.id === threadId);
        if (existing) {
          return prev.map((t) =>
            t.id === threadId ? { ...t, messages } : t
          );
        } else {
          return [...prev, { id: threadId, name: "Chat", participants: [], messages }];
        }
      });
    });

    socket.io.on("reconnect", () => {
      socket.emit("user-online", currentUser);
    });

    // Listen for groups updates to create group threads if needed
    socket.on("groups-updated", (serverGroups: any[]) => {
      setThreads((prev) => {
        const next = [...prev];
        serverGroups.forEach((g) => {
          const threadId = `group-${g.id}`;
          if (!next.find((t) => t.id === threadId)) {
            next.push({ id: threadId, name: g.name, participants: [], messages: [], avatar: "👥" });
          }
        });
        return next;
      });
    });

    return () => {
      socket.off("update-user-list");
      socket.off("receive-message");
      socket.off("thread-history");
      socket.io.off("reconnect");
      socket.off("groups-updated");
    };
  }, [user]);

  // Load persisted threads from localStorage for this user on mount
  useEffect(() => {
    if (!user) return;
    try {
      const key = `chat_threads_${user.id}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed: Thread[] = JSON.parse(raw);
        if (parsed && parsed.length) {
          // Filter out messages older than 7 days
          const now = Date.now();
          const sevenDays = 7 * 24 * 60 * 60 * 1000;
          const filtered = parsed.map((t) => ({
            ...t,
            messages: t.messages.filter((m: Message) => {
              try {
                const ts = new Date(m.timestamp).getTime();
                return now - ts <= sevenDays;
              } catch (e) {
                return false;
              }
            }),
          })).filter((t) => t.messages.length > 0);
          setThreads(filtered);
        }
      }
    } catch (e) {
      console.warn("Failed to load persisted threads:", e);
    }
  }, [user]);

  // Persist threads to localStorage whenever they change
  useEffect(() => {
    if (!user) return;
    try {
      const key = `chat_threads_${user.id}`;
      localStorage.setItem(key, JSON.stringify(threads));
    } catch (e) {
      console.warn("Failed to persist threads:", e);
    }
  }, [threads, user]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeThreadId || !user) return;
    const socket = getSocket();

    const msg: Message = {
      id: Date.now().toString(),
      senderId: user.id,
      content: newMessage,
      timestamp: new Date().toISOString(),
      type: "text",
    };

    console.log("📤 Sending message:", msg);
    console.log("📍 Thread ID:", activeThreadId);

    // Add message to local state immediately for instant feedback
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThreadId ? { ...t, messages: [...t.messages, msg] } : t
      )
    );

    // Emit to socket for other users
    socket.emit("send-message", { threadId: activeThreadId, message: msg });
    console.log("✅ Message emitted to socket");

    setNewMessage("");
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      setSelectedImage(imageUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSendImage = () => {
    if (!selectedImage || !activeThreadId || !user) return;
    const socket = getSocket();

    const msg: Message = {
      id: Date.now().toString(),
      senderId: user.id,
      content: "📷 Photo",
      timestamp: new Date().toISOString(),
      type: "image",
      imageUrl: selectedImage,
    };

    // Add image to local state immediately
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThreadId ? { ...t, messages: [...t.messages, msg] } : t
      )
    );

    socket.emit("send-message", { threadId: activeThreadId, message: msg });
    setSelectedImage(null);
    setShowAttachMenu(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        
        // Convert blob to base64 for sharing
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          handleSendAudio(base64Audio, recordingTime);
        };
        reader.readAsDataURL(audioBlob);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please grant permission.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
      audioChunksRef.current = [];
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      const stream = mediaRecorderRef.current.stream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleSendAudio = (audioUrl: string, duration: number) => {
    if (!activeThreadId || !user) return;
    const socket = getSocket();

    const msg: Message = {
      id: Date.now().toString(),
      senderId: user.id,
      content: "🎤 Voice message",
      timestamp: new Date().toISOString(),
      type: "audio",
      audioUrl: audioUrl,
      audioDuration: duration,
    };

    // Add audio message to local state immediately
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThreadId ? { ...t, messages: [...t.messages, msg] } : t
      )
    );

    socket.emit("send-message", { threadId: activeThreadId, message: msg });
    setRecordingTime(0);
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const activeThread = threads.find((t) => t.id === activeThreadId);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="chat-app">
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <button onClick={onNavigateBack} className="back-button" aria-label="Go back to dashboard">
            <ArrowLeft size={20} />
          </button>
          <h2>Messages</h2>
        </div>

        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="threads-list">
          {users
            .filter((u) => u.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((u) => (
              <div
                key={u.id}
                className={`thread-item ${u.online ? "online" : "offline"}`}
                onClick={() => {
                  const threadId = [user.id, u.id].sort().join("-");
                  setActiveThreadId(threadId);
                  const socket = getSocket();
                  socket.emit("join-thread", threadId);

                  setThreads((prev) => {
                    const existing = prev.find((t) => t.id === threadId);
                    if (existing) return prev;
                    return [
                      ...prev,
                      {
                        id: threadId,
                        name: u.name,
                        participants: [u],
                        messages: [],
                        avatar: "💬",
                      },
                    ];
                  });
                }}
              >
                <div className="thread-avatar">{u.avatar || "👤"}</div>
                <div className="thread-info">
                  <span>{u.name}</span>
                  <span className={`status-dot ${u.online ? "on" : "off"}`} />
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="chat-main">
        {activeThread ? (
          <>
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="chat-avatar-large">{activeThread.avatar}</div>
                <div>
                  <h3>{activeThread.name}</h3>
                  <p>{activeThread.participants.some((p) => p.online) ? "Online" : "Offline"}</p>
                </div>
              </div>
              <div className="chat-actions">
                <Phone size={18} />
                <Video size={18} />
                <MoreVertical size={18} />
              </div>
            </div>

            <div className="messages-container">
              {activeThread.messages.map((msg) => {
                const isMe = msg.senderId === user.id;
                return (
                  <div key={msg.id} className={`message ${isMe ? "sent" : "received"}`}>
                    <div className="bubble">
                      {msg.type === "image" && msg.imageUrl && (
                        <div className="message-image">
                          <img src={msg.imageUrl} alt="Shared image" />
                        </div>
                      )}
                      {msg.type === "audio" && msg.audioUrl && (
                        <div className="message-audio">
                          <audio controls src={msg.audioUrl} controlsList="nodownload">
                            Your browser does not support audio.
                          </audio>
                          <div className="audio-meta">
                            <span className="audio-duration">
                              {msg.audioDuration ? formatRecordingTime(msg.audioDuration) : "0:00"}
                            </span>
                            <a 
                              href={msg.audioUrl} 
                              download={`voice-message-${msg.id}.webm`}
                              className="audio-download"
                              title="Download voice message"
                            >
                              ⬇️
                            </a>
                          </div>
                        </div>
                      )}
                      {msg.type === "text" && <p>{msg.content}</p>}
                      <span>{formatTime(msg.timestamp)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Image Preview Modal */}
            {selectedImage && (
              <div className="image-preview-modal">
                <div className="preview-content">
                  <button className="close-preview" onClick={() => setSelectedImage(null)} aria-label="Close preview">
                    <X size={24} />
                  </button>
                  <img src={selectedImage} alt="Preview" />
                  <button className="send-image-btn" onClick={handleSendImage}>
                    <Send size={20} /> Send Photo
                  </button>
                </div>
              </div>
            )}

            <div className="message-input-container">
              {isRecording ? (
                <div className="recording-controls">
                  <div className="recording-indicator">
                    <span className="recording-dot"></span>
                    <span className="recording-time">{formatRecordingTime(recordingTime)}</span>
                  </div>
                  <button className="cancel-recording" onClick={cancelRecording} aria-label="Cancel recording">
                    <X size={20} />
                  </button>
                  <button className="stop-recording" onClick={stopRecording} aria-label="Stop recording">
                    <Send size={20} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="attach-button-container">
                    <button 
                      className="attach-btn" 
                      onClick={() => setShowAttachMenu(!showAttachMenu)}
                      aria-label="Attach file"
                    >
                      <Paperclip size={20} />
                    </button>
                    {showAttachMenu && (
                      <div className="attach-menu">
                        <button onClick={() => fileInputRef.current?.click()}>
                          <ImageIcon size={18} /> Photo
                        </button>
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <button 
                    className="mic-btn" 
                    onClick={startRecording}
                    aria-label="Record audio"
                  >
                    <Mic size={20} />
                  </button>
                  <button onClick={handleSendMessage} aria-label="Send message">
                    <Send size={18} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden-file-input"
                    aria-label="Select image to send"
                  />
                </>
              )}
            </div>
          </>
        ) : (
          <div className="no-chat-selected">
            <MessageCircle size={48} />
            <p>Select a conversation to start</p>
          </div>
        )}
      </div>
    </div>
  );
}
