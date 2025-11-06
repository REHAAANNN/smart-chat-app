import { useUser } from "@clerk/clerk-react";
import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import {
  MessageCircle,
  Users,
  Settings,
  Bell,
  TrendingUp,
  Clock,
} from "lucide-react";
import CreateGroup from "./CreateGroup";
import SettingsModal from "./Settings";
import OSStats from "./OSStats";
import "./Dashboard.css";

interface DashboardProps {
  onNavigateToChat: (threadId?: string) => void;
}

interface UserContact {
  id: string;
  name: string;
  avatar?: string;
  online: boolean;
}

interface GroupItem {
  id: string;
  name: string;
  members: string[];
}

const socket = io("http://localhost:5000", {
  withCredentials: true,
});

export default function Dashboard({ onNavigateToChat }: DashboardProps) {
  const { user } = useUser();
  const [onlineUsers, setOnlineUsers] = useState<UserContact[]>([]);
  const [stats, setStats] = useState({
    activeChats: 0,
    teamMembers: 0,
    messagesToday: 0,
    unread: 0,
  });
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  
  // Use useRef to persist active threads across re-renders
  const activeThreadsRef = useRef<Set<string>>(new Set());

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    console.log("Dashboard: User connected", user.id, user.fullName);

    // Notify backend this user is online
    socket.emit("user-online", {
      id: user.id,
      name: user.fullName || "Anonymous",
      online: true,
    });

    // Update user list when someone connects/disconnects
    socket.on("update-user-list", (users: UserContact[]) => {
      console.log("Dashboard: Received user list", users);
      const filtered = users.filter((u) => u.id !== user.id && u.online);
      setOnlineUsers(filtered);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        teamMembers: users.filter(u => u.online).length,
      }));
    });

    // Listen for messages to update stats
    socket.on("receive-message", (msg: any) => {
      console.log("Dashboard: Message received", msg);
      
      // Add thread to active threads set (persisted with useRef)
      if (msg.threadId) {
        activeThreadsRef.current.add(msg.threadId);
      }

      setStats(prev => ({
        ...prev,
        activeChats: activeThreadsRef.current.size,
        messagesToday: prev.messagesToday + 1,
        unread: msg.senderId !== user.id ? prev.unread + 1 : prev.unread,
      }));

      // Show desktop notification
      if (msg.senderId !== user.id && Notification.permission === "granted") {
        const notification = new Notification("New message", {
          body: msg.content || "New message received",
          icon: "/vite.svg",
        });
        setTimeout(() => notification.close(), 5000);
      }
    });

    // Handle incoming invites
    socket.on("receive-invite", (invite) => {
      const accept = confirm(`${invite.fromUserId} wants to chat. Accept?`);
      if (accept) {
        socket.emit("accept-invite", { inviteId: invite.id });
      }
    });

    // When invite accepted → open chat
    socket.on("invite-accepted", ({ threadId }) => {
      onNavigateToChat(threadId);
    });

    return () => {
      socket.off("update-user-list");
      socket.off("receive-invite");
      socket.off("invite-accepted");
      socket.off("receive-message");
      socket.off("groups-updated");
    };
  }, [user]);

  // Listen for server-side groups updates
  useEffect(() => {
    socket.on("groups-updated", (serverGroups: any[]) => {
      // Mirror server groups into local UI
      const mapped = serverGroups.map((g) => ({ id: g.id, name: g.name, members: g.members }));
      setGroups(mapped);
    });
    return () => {
      socket.off("groups-updated");
    };
  }, []);

  const startChat = (toUserId: string) => {
    if (!user) return;
    onNavigateToChat(); // Just go to chat view
  };

  const handleSendAnnouncement = () => {
    if (!user) return alert("You must be signed in to send announcements.");
    const content = prompt("Enter announcement message to send to all online users and groups:");
    if (!content || !content.trim()) return;
    socket.emit("broadcast-announcement", { content: content.trim(), senderId: user.id });
    alert("Announcement queued and being dispatched.");
  };

  const handleCreateGroup = (groupName: string, members: string[]) => {
    console.log("Creating group:", groupName, "with members:", members);
    socket.emit("create-group", { groupName, members });
    // Add to local groups list so user can see it immediately
    const id = `group-${Date.now()}`;
    setGroups((prev) => [{ id, name: groupName, members }, ...prev]);
    alert(`Group "${groupName}" created with ${members.length} members!`);
  };

  const statsDisplay = [
    { label: "Active Chats", value: stats.activeChats.toString(), icon: MessageCircle, color: "blue" },
    { label: "Team Members", value: stats.teamMembers.toString(), icon: Users, color: "green" },
    { label: "Messages Today", value: stats.messagesToday.toString(), icon: TrendingUp, color: "purple" },
    { label: "Unread", value: stats.unread.toString(), icon: Bell, color: "red" },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            Welcome back, {user?.firstName || "User"}! 👋
          </h1>
          <p className="dashboard-subtitle">
            Here's what's happening with your conversations today.
          </p>
        </div>

        <button className="primary-button" onClick={() => onNavigateToChat()}>
          <MessageCircle size={20} />
          New Message
        </button>
      </div>

      <div className="stats-grid">
        {statsDisplay.map((stat, index) => (
          <div key={index} className={`stat-card ${stat.color}`}>
            <div className="stat-icon">
              <stat.icon size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-content">
        {/* 🟣 Groups */}
        <div className="groups-section">
          <div className="section-header">
            <h2 className="section-title">Groups</h2>
          </div>
          {groups.length === 0 ? (
            <p>No groups yet. Create one with the button on the right.</p>
          ) : (
            <ul className="groups-list">
              {groups.map((g) => (
                <li key={g.id} className="group-item">
                  <div className="group-avatar">👥</div>
                  <div className="group-info">
                    <span className="group-name">{g.name}</span>
                    <span className="group-members">{g.members.length} members</span>
                  </div>
                  <button className="open-group-btn" onClick={() => onNavigateToChat(g.id ? `group-${g.id}` : undefined)}>
                    Open
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* 🟢 Online Users */}
        <div className="recent-chats-section">
          <div className="section-header">
            <h2 className="section-title">Online Users</h2>
          </div>
          {onlineUsers.length === 0 ? (
            <p>No users online right now.</p>
          ) : (
            <ul className="chat-list">
              {onlineUsers.map((u) => (
                <li key={u.id} className="chat-item">
                  <div className="chat-avatar">{u.avatar || "👤"}</div>
                  <div className="chat-info">
                    <span className="chat-name">{u.name}</span>
                    <span className="chat-status">
                      {u.online ? "Online" : "Offline"}
                    </span>
                  </div>
                  <button
                    className="start-chat-btn"
                    onClick={() => startChat(u.id)}
                  >
                    Start Chat
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="quick-actions-section">
          <h2 className="section-title">Quick Actions</h2>
          <div className="quick-actions">
            <button className="action-card" onClick={() => onNavigateToChat()}>
              <MessageCircle size={24} />
              <span>Start New Chat</span>
            </button>
            <button className="action-card" onClick={() => setShowCreateGroup(true)}>
              <Users size={24} />
              <span>Create Group</span>
            </button>
            <button className="action-card" onClick={() => setShowSettings(true)}>
              <Settings size={24} />
              <span>Settings</span>
            </button>
            <button className="action-card" onClick={handleSendAnnouncement}>
              <Clock size={24} />
              <span>Send Announcement</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateGroup && (
        <CreateGroup
          onClose={() => setShowCreateGroup(false)}
          onlineUsers={onlineUsers}
          onCreateGroup={handleCreateGroup}
        />
      )}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
      <OSStats />
    </div>
  );
}
