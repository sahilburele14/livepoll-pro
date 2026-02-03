export enum UserRole {
  GUEST = 'GUEST',
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  isActive: boolean;
  createdAt: string;
}

export interface VoteRecord {
  id: string;
  pollId: string;
  optionId: string;
  ipAddress: string;
  timestamp: string;
  isReleased: boolean; // If true, this IP can vote again, but this record is kept for history
}

export interface AuditLog {
  id: string;
  action: 'VOTE' | 'RELEASE' | 'REVOTE';
  pollId: string;
  ipAddress: string;
  details: string;
  timestamp: string;
}

export interface UserSession {
  username: string;
  role: UserRole;
  ipAddress: string; // Simulated IP
}