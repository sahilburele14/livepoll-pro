import React, { useState, useEffect } from 'react';
import { UserRole, Poll, UserSession } from './types';
import { mockBackend } from './services/mockBackend';
import PollList from './components/PollList';
import AdminPanel from './components/AdminPanel';

// Simulate generating a persistent IP/Browser ID
const getOrSetSimulatedIP = () => {
  let ip = localStorage.getItem('simulated_ip');
  if (!ip) {
    ip = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    localStorage.setItem('simulated_ip', ip);
  }
  return ip;
};

const App: React.FC = () => {
  // State
  const [session, setSession] = useState<UserSession | null>(null);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [selectedAdminPollId, setSelectedAdminPollId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Constants
  const SIMULATED_IP = getOrSetSimulatedIP();

  // Load Polls (Simulate AJAX Long Polling or Interval)
  useEffect(() => {
    const fetchPolls = async () => {
      const data = await mockBackend.getPolls();
      setPolls(data);
      setIsLoading(false);
    };

    fetchPolls();
    const interval = setInterval(fetchPolls, 1000); // 1-second update per requirements
    return () => clearInterval(interval);
  }, []);

  // Handlers
  const handleLogin = (role: UserRole) => {
    setSession({
      username: role === UserRole.ADMIN ? 'Admin User' : 'Regular User',
      role,
      ipAddress: SIMULATED_IP
    });
  };

  const handleLogout = () => {
    setSession(null);
    setSelectedAdminPollId(null);
  };

  const handleVote = async (pollId: string, optionId: string) => {
    if (!session) {
      setNotification({ msg: 'You must be logged in to vote.', type: 'error' });
      return;
    }

    const result = await mockBackend.castVote(pollId, optionId, SIMULATED_IP);
    
    setNotification({ 
      msg: result.message, 
      type: result.success ? 'success' : 'error' 
    });

    // Clear notification after 3s
    setTimeout(() => setNotification(null), 3000);
  };

  // Render Login Screen if no session
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="mb-6">
             <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </div>
             <h1 className="text-2xl font-bold text-slate-800">LivePoll Pro</h1>
             <p className="text-slate-500 mt-2">Module 1: Authentication</p>
          </div>
          <div className="space-y-4">
            <button 
              onClick={() => handleLogin(UserRole.USER)}
              className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors"
            >
              Login as Student / User
            </button>
            <button 
              onClick={() => handleLogin(UserRole.ADMIN)}
              className="w-full bg-white text-slate-700 border border-slate-300 py-3 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Login as Admin
            </button>
          </div>
          <p className="mt-8 text-xs text-slate-400">
            Simulated IP: {SIMULATED_IP}
          </p>
        </div>
      </div>
    );
  }

  // Main App View
  return (
    <div className="min-h-screen bg-slate-100 pb-12">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">P</div>
            <span className="font-bold text-slate-800 text-xl tracking-tight">LivePoll Pro</span>
          </div>
          <div className="flex items-center space-x-6">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-slate-900">{session.username}</p>
              <p className="text-xs text-slate-500">{session.role}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="text-sm text-slate-500 hover:text-red-600 font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Notification Toast */}
        {notification && (
          <div className={`fixed top-20 right-4 md:right-8 p-4 rounded-lg shadow-lg max-w-sm w-full animate-[slideIn_0.3s_ease-out] z-50 text-white ${notification.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
             <div className="flex items-center">
               {notification.type === 'success' ? (
                 <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
               ) : (
                 <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
               )}
               <p className="font-medium">{notification.msg}</p>
             </div>
          </div>
        )}

        <div className="mb-8">
           <h2 className="text-2xl font-bold text-slate-900">Active Polls</h2>
           <p className="text-slate-500">Vote on the active sessions below.</p>
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">Loading polls...</p>
          </div>
        ) : (
          <PollList 
            polls={polls} 
            onVote={handleVote}
            isAdmin={session.role === UserRole.ADMIN}
            onSelectPollForAdmin={setSelectedAdminPollId}
            userIp={SIMULATED_IP}
          />
        )}
      </main>

      {/* Admin Modal */}
      {selectedAdminPollId && (
        <AdminPanel 
          poll={polls.find(p => p.id === selectedAdminPollId)!} 
          onClose={() => setSelectedAdminPollId(null)} 
        />
      )}
    </div>
  );
};

export default App;