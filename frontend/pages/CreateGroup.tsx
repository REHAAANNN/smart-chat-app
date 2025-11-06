import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { X, Plus, Users, Check } from "lucide-react";
import "./CreateGroup.css";

interface CreateGroupProps {
  onClose: () => void;
  onlineUsers: Array<{ id: string; name: string; avatar?: string; online: boolean }>;
  onCreateGroup: (name: string, members: string[]) => void;
}

export default function CreateGroup({ onClose, onlineUsers, onCreateGroup }: CreateGroupProps) {
  const { user } = useUser();
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [groupIcon, setGroupIcon] = useState("👥");

  const icons = ["👥", "💬", "🚀", "⭐", "🎯", "💡", "🔥", "⚡", "🎨", "🎮", "📚", "🏆"];

  const toggleMember = (userId: string) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== userId));
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  const handleCreate = () => {
    if (!groupName.trim() || selectedMembers.length === 0) {
      alert("Please enter a group name and select at least one member");
      return;
    }
    
    // Include current user in the group
    const allMembers = [user!.id, ...selectedMembers];
    onCreateGroup(groupName, allMembers);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Group</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Group Icon Selection */}
          <div className="form-group">
            <label>Group Icon</label>
            <div className="icon-grid">
              {icons.map((icon) => (
                <button
                  key={icon}
                  className={`icon-btn ${groupIcon === icon ? "active" : ""}`}
                  onClick={() => setGroupIcon(icon)}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Group Name */}
          <div className="form-group">
            <label>Group Name</label>
            <input
              type="text"
              placeholder="e.g., Project Team, Friends, Study Group"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="group-input"
            />
          </div>

          {/* Member Selection */}
          <div className="form-group">
            <label>Add Members ({selectedMembers.length} selected)</label>
            <div className="members-list">
              {onlineUsers.map((u) => (
                <div
                  key={u.id}
                  className={`member-item ${selectedMembers.includes(u.id) ? "selected" : ""}`}
                  onClick={() => toggleMember(u.id)}
                >
                  <div className="member-avatar">{u.avatar || "👤"}</div>
                  <div className="member-info">
                    <span className="member-name">{u.name}</span>
                    <span className="member-status">{u.online ? "Online" : "Offline"}</span>
                  </div>
                  {selectedMembers.includes(u.id) && (
                    <div className="check-icon">
                      <Check size={18} />
                    </div>
                  )}
                </div>
              ))}
              {onlineUsers.length === 0 && (
                <p className="no-users">No other users online</p>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-create" onClick={handleCreate}>
            <Plus size={18} />
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
}
