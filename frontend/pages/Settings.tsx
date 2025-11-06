import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { X, Bell, Moon, Globe, Lock, User, Palette, Volume2 } from "lucide-react";
import "./Settings.css";

interface SettingsProps {
  onClose: () => void;
}

export default function Settings({ onClose }: SettingsProps) {
  const { user } = useUser();
  const [settings, setSettings] = useState({
    notifications: true,
    soundEnabled: true,
    darkMode: true,
    language: "en",
    privacy: "friends",
    messagePreview: true,
    autoDownload: false,
    theme: "purple",
  });

  const handleToggle = (key: string) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const handleSelect = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // Save settings to localStorage
    localStorage.setItem("chatflow-settings", JSON.stringify(settings));
    alert("Settings saved successfully!");
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close settings">
            <X size={20} />
          </button>
        </div>

        <div className="settings-body">
          {/* Profile Section */}
          <div className="settings-section">
            <div className="section-header">
              <User size={20} />
              <h3>Profile</h3>
            </div>
            <div className="profile-info">
              <div className="profile-avatar">
                {user?.imageUrl ? (
                  <img src={user.imageUrl} alt={user.fullName || "User"} />
                ) : (
                  "👤"
                )}
              </div>
              <div className="profile-details">
                <p className="profile-name">{user?.fullName || "User"}</p>
                <p className="profile-email">{user?.primaryEmailAddress?.emailAddress}</p>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="settings-section">
            <div className="section-header">
              <Bell size={20} />
              <h3>Notifications</h3>
            </div>
            <div className="setting-item">
              <div className="setting-info">
                <p className="setting-title">Push Notifications</p>
                <p className="setting-desc">Receive notifications for new messages</p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={() => handleToggle("notifications")}
                  aria-label="Toggle push notifications"
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="setting-item">
              <div className="setting-info">
                <p className="setting-title">Message Preview</p>
                <p className="setting-desc">Show message content in notifications</p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.messagePreview}
                  onChange={() => handleToggle("messagePreview")}
                  aria-label="Toggle message preview"
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          {/* Appearance */}
          <div className="settings-section">
            <div className="section-header">
              <Palette size={20} />
              <h3>Appearance</h3>
            </div>
            <div className="setting-item">
              <div className="setting-info">
                <p className="setting-title">Theme</p>
                <p className="setting-desc">Choose your preferred theme</p>
              </div>
              <select
                className="setting-select"
                value={settings.theme}
                onChange={(e) => handleSelect("theme", e.target.value)}
                aria-label="Select theme"
              >
                <option value="purple">Purple</option>
                <option value="blue">Blue</option>
                <option value="green">Green</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <div className="setting-item">
              <div className="setting-info">
                <p className="setting-title">Dark Mode</p>
                <p className="setting-desc">Enable dark theme</p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.darkMode}
                  onChange={() => handleToggle("darkMode")}
                  aria-label="Toggle dark mode"
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          {/* Sound */}
          <div className="settings-section">
            <div className="section-header">
              <Volume2 size={20} />
              <h3>Sound</h3>
            </div>
            <div className="setting-item">
              <div className="setting-info">
                <p className="setting-title">Message Sounds</p>
                <p className="setting-desc">Play sound for new messages</p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={() => handleToggle("soundEnabled")}
                  aria-label="Toggle message sounds"
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          {/* Privacy */}
          <div className="settings-section">
            <div className="section-header">
              <Lock size={20} />
              <h3>Privacy</h3>
            </div>
            <div className="setting-item">
              <div className="setting-info">
                <p className="setting-title">Who can message you</p>
                <p className="setting-desc">Control who can send you messages</p>
              </div>
              <select
                className="setting-select"
                value={settings.privacy}
                onChange={(e) => handleSelect("privacy", e.target.value)}
                aria-label="Select who can message you"
              >
                <option value="everyone">Everyone</option>
                <option value="friends">Friends Only</option>
                <option value="nobody">Nobody</option>
              </select>
            </div>
            <div className="setting-item">
              <div className="setting-info">
                <p className="setting-title">Auto-download Media</p>
                <p className="setting-desc">Automatically download images and videos</p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.autoDownload}
                  onChange={() => handleToggle("autoDownload")}
                  aria-label="Toggle auto-download media"
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          {/* Language */}
          <div className="settings-section">
            <div className="section-header">
              <Globe size={20} />
              <h3>Language</h3>
            </div>
            <div className="setting-item">
              <div className="setting-info">
                <p className="setting-title">App Language</p>
                <p className="setting-desc">Choose your preferred language</p>
              </div>
              <select
                className="setting-select"
                value={settings.language}
                onChange={(e) => handleSelect("language", e.target.value)}
                aria-label="Select app language"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="ar">Arabic</option>
              </select>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-save" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
