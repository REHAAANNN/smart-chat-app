import { useState } from 'react';
import { SignedIn, SignedOut, SignIn, UserButton } from '@clerk/clerk-react';
import Dashboard from '../pages/Dashboard';
import ChatApp from '../pages/ChatApp';
import './App.css';



export default function App() {

  const [currentView, setCurrentView] = useState<'dashboard' | 'chat'>('dashboard');
  const [currentThreadId, setCurrentThreadId] = useState<string | undefined>(undefined);

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-left">

          
          <h1 className="title">💬 ChatFlow</h1>
          <SignedIn>
            <nav className="nav-links">


              <button 
                className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`}
                onClick={() => setCurrentView('dashboard')}
              >
                Dashboard
              </button>



              <button 
                className={`nav-link ${currentView === 'chat' ? 'active' : ''}`}
                onClick={() => setCurrentView('chat')}
              >
                Messages

              </button>
            </nav>
          </SignedIn>
        </div>
        <SignedIn>
          <div className="header-right">
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10"
                }
              }}
            />
          </div>
        </SignedIn>
      </header>

      <main className="main-content">
        <SignedOut>
          <div className="signed-out-wrapper">
            <div className="welcome-section">
              <h2 className="welcome-title">Welcome to ChatFlow</h2>
              <p className="welcome-subtitle">
                Connect, collaborate, and communicate seamlessly with your team
              </p>
              <div className="features-grid">
                <div className="feature-item">
                  <div className="feature-icon">💬</div>
                  <span>Real-time messaging</span>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">👥</div>
                  <span>Team collaboration</span>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">🔒</div>
                  <span>Secure & private</span>
                </div>
              </div>
            </div>
            <div className="signin-container">
              <SignIn 
                appearance={{
                  elements: {
                    formButtonPrimary: "bg-indigo-600 hover:bg-indigo-700",
                    card: "shadow-2xl border-0"
                  }
                }}
              />
            </div>
          </div>
        </SignedOut>

        <SignedIn>


          <div className="app-wrapper">
            {currentView === 'dashboard' ? (
              <Dashboard onNavigateToChat={(threadId?: string) => { setCurrentThreadId(threadId); setCurrentView('chat'); }} />
            ) : (
              <ChatApp onNavigateBack={() => { setCurrentThreadId(undefined); setCurrentView('dashboard'); }} threadId={currentThreadId} />
            )}
          </div>


          
        </SignedIn>
      </main>

      <footer className="footer">
        <p>© 2025 ChatFlow. Built for seamless communication.</p>
      </footer>
    </div>
  );
}