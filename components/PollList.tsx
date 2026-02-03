import React from 'react';
import { Poll } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface PollListProps {
  polls: Poll[];
  onVote: (pollId: string, optionId: string) => void;
  isAdmin: boolean;
  onSelectPollForAdmin: (pollId: string) => void;
  userIp: string;
}

const PollList: React.FC<PollListProps> = ({ polls, onVote, isAdmin, onSelectPollForAdmin, userIp }) => {
  return (
    <div className="space-y-8">
      {polls.map((poll) => (
        <div key={poll.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-800">{poll.question}</h3>
            {isAdmin && (
              <button
                onClick={() => onSelectPollForAdmin(poll.id)}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                Manage / Audit
              </button>
            )}
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Voting Section */}
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-600 uppercase text-xs tracking-wider mb-2">Cast your vote</h4>
              {poll.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => onVote(poll.id, option.id)}
                  className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200 group"
                >
                  <span className="font-medium text-slate-700 group-hover:text-indigo-700">{option.text}</span>
                </button>
              ))}
            </div>

            {/* Live Results Section */}
            <div className="h-64 bg-slate-50 rounded-lg p-4 border border-slate-100">
               <h4 className="font-semibold text-slate-600 uppercase text-xs tracking-wider mb-4 text-center">Live Results</h4>
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={poll.options} layout="vertical" margin={{ left: 20 }}>
                   <XAxis type="number" hide />
                   <YAxis 
                      dataKey="text" 
                      type="category" 
                      width={80} 
                      tick={{fontSize: 12}} 
                      interval={0}
                   />
                   <Tooltip cursor={{fill: 'transparent'}} />
                   <Bar dataKey="votes" radius={[0, 4, 4, 0]}>
                      {poll.options.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6'][index % 4]} />
                      ))}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
            </div>
          </div>
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 flex justify-between">
             <span>Your simulated IP: <span className="font-mono text-slate-600">{userIp}</span></span>
             <span>Real-time updates active</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PollList;