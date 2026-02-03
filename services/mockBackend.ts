import { Poll, PollOption, VoteRecord, AuditLog, UserRole } from '../types';

// Constants for localStorage keys
const STORAGE_KEY_POLLS = 'livepoll_polls';
const STORAGE_KEY_VOTES = 'livepoll_votes';
const STORAGE_KEY_AUDIT = 'livepoll_audit';

// Initial Data
const INITIAL_POLLS: Poll[] = [
  {
    id: 'poll_1',
    question: 'Which frontend framework do you prefer?',
    isActive: true,
    createdAt: new Date().toISOString(),
    options: [
      { id: 'opt_1', text: 'React', votes: 0 },
      { id: 'opt_2', text: 'Vue', votes: 0 },
      { id: 'opt_3', text: 'Angular', votes: 0 },
      { id: 'opt_4', text: 'Svelte', votes: 0 },
    ],
  },
  {
    id: 'poll_2',
    question: 'What is your favorite backend language?',
    isActive: true,
    createdAt: new Date().toISOString(),
    options: [
      { id: 'opt_a', text: 'PHP', votes: 0 },
      { id: 'opt_b', text: 'Node.js', votes: 0 },
      { id: 'opt_c', text: 'Python', votes: 0 },
      { id: 'opt_d', text: 'Go', votes: 0 },
    ],
  },
];

// Helper to simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class MockBackend {
  private getStorage<T>(key: string, defaultVal: T): T {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  }

  private setStorage<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // --- Read Operations ---

  async getPolls(): Promise<Poll[]> {
    await delay(300); // Simulate network
    const polls = this.getStorage<Poll[]>(STORAGE_KEY_POLLS, INITIAL_POLLS);
    const votes = this.getStorage<VoteRecord[]>(STORAGE_KEY_VOTES, []);

    // Recalculate counts dynamically based on active votes
    return polls.map(poll => {
      const pollVotes = votes.filter(v => v.pollId === poll.id && !v.isReleased);
      const optionsWithCounts = poll.options.map(opt => ({
        ...opt,
        votes: pollVotes.filter(v => v.optionId === opt.id).length
      }));
      return { ...poll, options: optionsWithCounts };
    });
  }

  async getVoteHistory(pollId: string): Promise<{ votes: VoteRecord[], audit: AuditLog[] }> {
    await delay(200);
    const votes = this.getStorage<VoteRecord[]>(STORAGE_KEY_VOTES, []);
    const audit = this.getStorage<AuditLog[]>(STORAGE_KEY_AUDIT, []);
    return {
      votes: votes.filter(v => v.pollId === pollId),
      audit: audit.filter(a => a.pollId === pollId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    };
  }

  // --- Write Operations (The "Core PHP" Logic) ---

  async castVote(pollId: string, optionId: string, ipAddress: string): Promise<{ success: boolean; message: string }> {
    await delay(400); // Simulate processing

    const votes = this.getStorage<VoteRecord[]>(STORAGE_KEY_VOTES, []);
    const polls = this.getStorage<Poll[]>(STORAGE_KEY_POLLS, INITIAL_POLLS);
    const audit = this.getStorage<AuditLog[]>(STORAGE_KEY_AUDIT, []);

    // 1. Validate Poll exists
    const poll = polls.find(p => p.id === pollId);
    if (!poll) return { success: false, message: 'Poll not found' };

    // 2. IP Restriction Check (Core Rule #3 & #4)
    // Check if there is an ACTIVE (not released) vote for this IP on this Poll
    const existingActiveVote = votes.find(v => v.pollId === pollId && v.ipAddress === ipAddress && !v.isReleased);
    
    if (existingActiveVote) {
      return { success: false, message: 'Error: This IP has already voted on this poll.' };
    }

    // 3. Check for Revote (History)
    const previousReleasedVote = votes.find(v => v.pollId === pollId && v.ipAddress === ipAddress && v.isReleased);
    const isRevote = !!previousReleasedVote;

    // 4. Record Vote
    const newVote: VoteRecord = {
      id: `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      pollId,
      optionId,
      ipAddress,
      timestamp: new Date().toISOString(),
      isReleased: false
    };

    votes.push(newVote);
    this.setStorage(STORAGE_KEY_VOTES, votes);

    // 5. Audit Log
    const actionType = isRevote ? 'REVOTE' : 'VOTE';
    const logDetails = isRevote 
      ? `Revoted. New Option: ${poll.options.find(o => o.id === optionId)?.text}` 
      : `Voted for: ${poll.options.find(o => o.id === optionId)?.text}`;

    audit.push({
      id: `audit_${Date.now()}`,
      action: actionType,
      pollId,
      ipAddress,
      details: logDetails,
      timestamp: new Date().toISOString()
    });
    this.setStorage(STORAGE_KEY_AUDIT, audit);

    return { success: true, message: 'Vote cast successfully.' };
  }

  // --- Admin Operations ---

  async releaseIp(pollId: string, ipAddress: string): Promise<{ success: boolean; message: string }> {
    await delay(300);

    const votes = this.getStorage<VoteRecord[]>(STORAGE_KEY_VOTES, []);
    const audit = this.getStorage<AuditLog[]>(STORAGE_KEY_AUDIT, []);

    // Find the active vote
    const voteIndex = votes.findIndex(v => v.pollId === pollId && v.ipAddress === ipAddress && !v.isReleased);
    if (voteIndex === -1) {
      return { success: false, message: 'No active vote found for this IP.' };
    }

    // "Release" the vote (Soft delete for active calculation, but keep for history)
    // Core Rule #7: Delete active vote (mark released), update results immediately (via state refresh), store history
    votes[voteIndex].isReleased = true;
    this.setStorage(STORAGE_KEY_VOTES, votes);

    // Audit Trail
    audit.push({
      id: `audit_${Date.now()}`,
      action: 'RELEASE',
      pollId,
      ipAddress,
      details: `Admin released IP. Previous Vote ID: ${votes[voteIndex].id}`,
      timestamp: new Date().toISOString()
    });
    this.setStorage(STORAGE_KEY_AUDIT, audit);

    return { success: true, message: 'IP released successfully.' };
  }
}

export const mockBackend = new MockBackend();