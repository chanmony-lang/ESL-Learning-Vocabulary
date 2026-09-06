export interface VocabWord {
  id: string;
  term: string;
  definition: string;
  phonetic?: string;
  partOfSpeech?: 'noun' | 'verb' | 'adjective' | 'adverb' | 'idiom' | 'phrasal_verb' | 'other';
  exampleSentence?: string;
  synonyms?: string[];
  translation?: string; // Optional translation or bilingual clue
  imageUrl?: string; // Image URL or base64 data URI
  starred?: boolean;
  masteryLevel?: number; // 0 to 3
}

export interface UserStats {
  xp: number;
  level: number;
  levelTitle: string;
  wordsMastered: number;
  streakDays: number;
  completedActivities: { [modeId: string]: number };
  pronunciationsRecorded: number;
  unlockedBadgeIds: string[];
  gems?: number;
  hearts?: number;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'learning' | 'quiz' | 'arcade' | 'streak' | 'pronunciation';
  xpReward: number;
  unlockedAt?: number;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string;
  avatar: string;
  country: string;
  xp: number;
  level: number;
  wordsMastered: number;
  isCurrentUser?: boolean;
}

export interface PronunciationResult {
  word: string;
  transcript: string;
  accuracyScore: number; // 0 - 100
  feedback: string;
  recordedAudioUrl?: string;
}

export interface VocabSet {
  id: string;
  title: string;
  description: string;
  folderId?: string; // If placed in a folder
  category?: string;
  level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'All' | 'A1-A2' | 'B1-B2' | 'C1-C2' | string;
  words: VocabWord[];
  createdAt: number;
  updatedAt: number;
  color?: string;
  icon?: string;
  tags?: string[];
}

export interface Folder {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: number;
}

export type ModeType =
  | 'overview'
  | 'learn'
  | 'flashcard'
  | 'flashcards'
  | 'quiz'
  | 'quiz2'
  | 'quiz4'
  | 'type'
  | 'matching'
  | 'memory'
  | 'wordsearch'
  | 'wordsearch2'
  | 'wheel'
  | 'sushispell'
  | 'unscramble'
  | 'unscramble2'
  | 'spellingbee'
  | 'battle'
  | 'missingletter'
  | 'catchletters'
  | 'connect'
  | 'wordfish'
  | 'tictactoe'
  | 'dictionary'
  | 'mystery'
  | 'translate'
  | 'hangman'
  | 'hangman2'
  | 'mindmap'
  | 'game'
  | 'wordle'
  | 'connections'
  | 'crossword'
  | 'mysterymini';

export interface ModeInfo {
  id: ModeType;
  title: string;
  description: string;
  iconName: string;
  icon?: string;
  color?: string;
  category: 'Study' | 'Quizzes' | 'Arcade' | 'Puzzles' | 'Reference' | string;
  badge?: string;
}
