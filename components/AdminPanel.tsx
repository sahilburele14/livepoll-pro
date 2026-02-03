import React, { useEffect, useState } from 'react';
import { Poll, VoteRecord, AuditLog } from '../types';
import { mockBackend } from '../services/mockBackend';

interface AdminPanelProps {
  poll: Poll;
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ poll, onClose }) => {
  const [votes, setVotes] = useState<VoteRecord[]>([]);
  const [audit, setAudit] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchData = async () => {
    // Silent update if not first load
    const data = await mockBackend.getVoteHistory(poll.id);
    setVotes(data.votes);
    setAudit(data.audit);
  };

  useEffect(() => {
    setIsLoading(true);
    fetchData().finally(() => setIsLoading(false));
    
    // Auto-refresh for admin view
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poll.id]);

  const handleReleaseIP = async (ip: string) => {
    const result = await mockBackend.releaseIp(poll.id, ip);
    setFeedback(result.message);
    if (result.success) {
      fetchData(); // Immediate refresh
    }
    setTimeout(() => setFeedback(null), 3000);
  };

  // Group votes by IP to show history
  const uniqueIps: string[] = Array.from(new Set(votes.map(v => v.ipAddress)));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Admin Moderation</h2>
            <p className="text-sm text-slate-500">Managing Poll: {poll.question}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          
          {feedback && (
             <div className={`p-4 rounded-lg text-sm font-medium ${feedback.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
               {feedback}
             </div>
          )}

          {/* Active Votes Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 font-semibold text-slate-700">
              IP Management (Live)
            </div>
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3">IP Address</th>
                  <th className="px-4 py-3">Current Status</th>
                  <th className="px-4 py-3">Last Vote Time</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {uniqueIps.length === 0 && (
                   <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No votes recorded yet.</td></tr>
                )}
                {uniqueIps.map(ip => {
                  const ipVotes = votes.filter(v => v.ipAddress === ip);
                  // Sort by latest
                  ipVotes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                  const latestVote = ipVotes[0];
                  const hasActiveVote = !latestVote.isReleased;

                  return (
                    <tr key={ip} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-slate-600">{ip}</td>
                      <td className="px-4 py-3">
                        {hasActiveVote ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Voted (Locked)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Released (Can Vote)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{new Date(latestVote.timestamp).toLocaleTimeString()}</td>
                      <td className="px-4 py-3 text-right">
                        {hasActiveVote && (
                          <button
                            onClick={() => handleReleaseIP(ip)}
                            className="text-xs bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1 rounded shadow-sm transition-colors"
                          >
                            Release IP
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Audit Trail */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 font-semibold text-slate-700">
              Audit Trail (History)
            </div>
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 sticky top-0">
                  <tr>
                    <th className="px-4 py-2">Time</th>
                    <th className="px-4 py-2">Action</th>
                    <th className="px-4 py-2">IP</th>
                    <th className="px-4 py-2">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {audit.length === 0 && (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">Log is empty.</td></tr>
                   )}
                   {audit.map(log => (
                     <tr key={log.id} className="hover:bg-slate-50">
                       <td className="px-4 py-2 text-slate-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString()}</td>
                       <td className="px-4 py-2 font-medium">
                         <span className={`
                           ${log.action === 'RELEASE' ? 'text-amber-600' : ''}
                           ${log.action === 'VOTE' ? 'text-indigo-600' : ''}
                           ${log.action === 'REVOTE' ? 'text-purple-600' : ''}
                         `}>{log.action}</span>
                       </td>
                       <td className="px-4 py-2 font-mono text-xs text-slate-500">{log.ipAddress}</td>
                       <td className="px-4 py-2 text-slate-600 truncate max-w-xs" title={log.details}>{log.details}</td>
                     </tr>
                   ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-right">
            <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium">
              Close Panel
            </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;