// Match Result Enum
export enum MatchResult {
  WIN = 'WIN',
  LOSS = 'LOSS',
  DRAW = 'DRAW'
}

// Match Type Enum
export enum MatchType {
  SINGLES = 'SINGLES',
  DOUBLES = 'DOUBLES',
  PRACTICE = 'PRACTICE',
  TOURNAMENT = 'TOURNAMENT',
  FRIENDLY = 'FRIENDLY'
}

// Match Interface
export interface Match {
  id: number;
  studentId: number;
  studentName: string;
  opponentName: string;
  opponentId?: number;
  partnerId?: number;
  partnerName?: string;
  matchType: MatchType;
  result: MatchResult;
  score: string; // e.g., "21-15, 21-18"
  eventName?: string;
  location?: string;
  matchDate: string;
  duration?: number; // in minutes
  notes?: string;
  createdAt?: string;
}

// Match Create Request
export interface MatchCreateRequest {
  studentId: number;
  opponentName: string;
  opponentId?: number;
  partnerId?: number;
  partnerName?: string;
  matchType: MatchType;
  result: MatchResult;
  score: string;
  eventName?: string;
  location?: string;
  matchDate: string;
  duration?: number;
  notes?: string;
}

// Match Statistics
export interface MatchStatistics {
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  singlesWins: number;
  singlesLosses: number;
  doublesWins: number;
  doublesLosses: number;
}
