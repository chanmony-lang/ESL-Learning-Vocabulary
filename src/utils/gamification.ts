import { UserStats, Badge, LeaderboardEntry } from '../types';
import confetti from 'canvas-confetti';
import { playSound } from './audio';

const STATS_KEY = 'esl_gamification_stats_v1';

export const ALL_BADGES: Badge[] = [
  {
    id: 'first_word',
    title: 'First Step',
    description: 'Mastered your first vocabulary word',
    icon: '🌱',
    category: 'learning',
    xpReward: 50,
  },
  {
    id: 'vocab_10',
    title: 'Lexicon Novice',
    description: 'Mastered 10 vocabulary words across sets',
    icon: '📚',
    category: 'learning',
    xpReward: 100,
  },
  {
    id: 'vocab_25',
    title: 'Word Collector',
    description: 'Mastered 25 vocabulary words',
    icon: '🏆',
    category: 'learning',
    xpReward: 250,
  },
  {
    id: 'flashcard_champ',
    title: 'Card Master',
    description: 'Completed a full flashcard study session',
    icon: '🃏',
    category: 'learning',
    xpReward: 75,
  },
  {
    id: 'quiz_ace',
    title: 'Quiz Ace',
    description: 'Scored 100% on any quiz activity',
    icon: '⭐',
    category: 'quiz',
    xpReward: 150,
  },
  {
    id: 'spelling_pro',
    title: 'Spelling Champion',
    description: 'Spelled words accurately in Spelling Bee',
    icon: '🐝',
    category: 'quiz',
    xpReward: 120,
  },
  {
    id: 'boss_slayer',
    title: 'Dragon Slayer',
    description: 'Defeated the Vocab Dragon in Battle RPG',
    icon: '🐉',
    category: 'arcade',
    xpReward: 200,
  },
  {
    id: 'pronunciation_star',
    title: 'Accent Star',
    description: 'Recorded pronunciation comparison for 5 words',
    icon: '🎙️',
    category: 'pronunciation',
    xpReward: 150,
  },
  {
    id: 'streak_3',
    title: 'On Fire',
    description: 'Studied for 3 consecutive days',
    icon: '🔥',
    category: 'streak',
    xpReward: 100,
  },
  {
    id: 'speed_demon',
    title: 'Speed Rush Blitz',
    description: 'Scored 100+ points in Speed Rush',
    icon: '⚡',
    category: 'arcade',
    xpReward: 120,
  },
  {
    id: 'wordsearch_pro',
    title: 'Eagle Eye',
    description: 'Solved a complete WordSearch matrix',
    icon: '🔍',
    category: 'arcade',
    xpReward: 100,
  },
  {
    id: 'polyglot',
    title: 'Bilingual Pro',
    description: 'Practiced bilingual translations in Translate mode',
    icon: '🌐',
    category: 'learning',
    xpReward: 100,
  },
];

export const LEVEL_THRESHOLDS = [
  { level: 1, minXp: 0, title: 'Novice Speaker' },
  { level: 2, minXp: 250, title: 'Apprentice Linguist' },
  { level: 3, minXp: 600, title: 'Vocabulary Explorer' },
  { level: 4, minXp: 1200, title: 'Fluent Scholar' },
  { level: 5, minXp: 2200, title: 'Polyglot Master' },
  { level: 6, minXp: 3800, title: 'ESL Grandmaster' },
];

export function getLevelInfo(xp: number): { level: number; title: string; currentLevelXp: number; nextLevelXp: number; progressPercent: number } {
  let currentTier = LEVEL_THRESHOLDS[0];
  let nextTier = LEVEL_THRESHOLDS[1];

  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i].minXp) {
      currentTier = LEVEL_THRESHOLDS[i];
      nextTier = LEVEL_THRESHOLDS[i + 1] || { level: currentTier.level + 1, minXp: currentTier.minXp + 2000, title: 'ESL Legend' };
    }
  }

  const range = nextTier.minXp - currentTier.minXp;
  const progressInTier = Math.max(0, xp - currentTier.minXp);
  const progressPercent = Math.min(100, Math.round((progressInTier / range) * 100));

  return {
    level: currentTier.level,
    title: currentTier.title,
    currentLevelXp: currentTier.minXp,
    nextLevelXp: nextTier.minXp,
    progressPercent,
  };
}

export function loadUserStats(): UserStats {
  const defaultStats: UserStats = {
    xp: 350, // Starts at Level 2 so user immediately experiences progression!
    level: 2,
    levelTitle: 'Apprentice Linguist',
    wordsMastered: 6,
    streakDays: 3,
    completedActivities: { flashcard: 2, learn: 1 },
    pronunciationsRecorded: 1,
    unlockedBadgeIds: ['first_word'],
  };

  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) {
      localStorage.setItem(STATS_KEY, JSON.stringify(defaultStats));
      return defaultStats;
    }
    const parsed = JSON.parse(raw);
    return { ...defaultStats, ...parsed };
  } catch {
    return defaultStats;
  }
}

export function saveUserStats(stats: UserStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save stats', e);
  }
}

export function awardXP(
  amount: number,
  reason: string,
  onBadgeUnlocked?: (badge: Badge) => void
): { newStats: UserStats; leveledUp: boolean; newBadges: Badge[] } {
  const current = loadUserStats();
  const oldLevelInfo = getLevelInfo(current.xp);
  const updatedXp = current.xp + amount;
  const newLevelInfo = getLevelInfo(updatedXp);

  const leveledUp = newLevelInfo.level > oldLevelInfo.level;
  const newStats: UserStats = {
    ...current,
    xp: updatedXp,
    level: newLevelInfo.level,
    levelTitle: newLevelInfo.title,
  };

  // Check badges
  const newBadges: Badge[] = [];
  ALL_BADGES.forEach(badge => {
    if (!newStats.unlockedBadgeIds.includes(badge.id)) {
      let shouldUnlock = false;
      if (badge.id === 'first_word' && newStats.wordsMastered >= 1) shouldUnlock = true;
      if (badge.id === 'vocab_10' && newStats.wordsMastered >= 10) shouldUnlock = true;
      if (badge.id === 'vocab_25' && newStats.wordsMastered >= 25) shouldUnlock = true;
      if (badge.id === 'streak_3' && newStats.streakDays >= 3) shouldUnlock = true;
      if (badge.id === 'pronunciation_star' && newStats.pronunciationsRecorded >= 5) shouldUnlock = true;
      if (badge.id === 'flashcard_champ' && (newStats.completedActivities['flashcard'] || 0) >= 1) shouldUnlock = true;

      if (shouldUnlock) {
        newStats.unlockedBadgeIds.push(badge.id);
        newBadges.push(badge);
        if (onBadgeUnlocked) onBadgeUnlocked(badge);
      }
    }
  });

  if (leveledUp || newBadges.length > 0) {
    playSound('win');
    confetti({ particleCount: 70, spread: 60 });
  }

  saveUserStats(newStats);
  return { newStats, leveledUp, newBadges };
}

export function recordActivityCompletion(modeId: string, extraXp: number = 25): UserStats {
  const stats = loadUserStats();
  const currentCount = stats.completedActivities[modeId] || 0;
  stats.completedActivities[modeId] = currentCount + 1;
  saveUserStats(stats);
  const result = awardXP(extraXp, `Completed ${modeId} activity`);
  return result.newStats;
}

export function recordPronunciationAttempt(): UserStats {
  const stats = loadUserStats();
  stats.pronunciationsRecorded = (stats.pronunciationsRecorded || 0) + 1;
  saveUserStats(stats);
  const result = awardXP(30, 'Recorded pronunciation comparison');
  return result.newStats;
}

// Global realistic ESL Leaderboard
const BASE_LEADERBOARD: Omit<LeaderboardEntry, 'rank'>[] = [
  { id: 'u_1', username: 'Maria Santos', avatar: '👩‍💼', country: '🇧🇷 Brazil', xp: 2450, level: 5, wordsMastered: 84 },
  { id: 'u_2', username: 'Kenji Takahashi', avatar: '👨‍💻', country: '🇯🇵 Japan', xp: 1980, level: 4, wordsMastered: 62 },
  { id: 'u_3', username: 'Ahmed Al-Mansoor', avatar: '👨‍🎓', country: '🇦🇪 UAE', xp: 1620, level: 4, wordsMastered: 51 },
  { id: 'u_4', username: 'Chloe Dubois', avatar: '👩‍🎨', country: '🇫🇷 France', xp: 1340, level: 4, wordsMastered: 44 },
  { id: 'u_5', username: 'Sofia Rossi', avatar: '👩‍🔬', country: '🇮🇹 Italy', xp: 980, level: 3, wordsMastered: 35 },
  { id: 'u_6', username: 'Lukas Meyer', avatar: '👨‍🏫', country: '🇩🇪 Germany', xp: 750, level: 3, wordsMastered: 28 },
  { id: 'u_7', username: 'Ji-hoon Park', avatar: '👨‍🚀', country: '🇰🇷 S. Korea', xp: 510, level: 2, wordsMastered: 19 },
  { id: 'u_8', username: 'Elena Rostova', avatar: '👩‍⚕️', country: '🇺🇦 Ukraine', xp: 320, level: 2, wordsMastered: 12 },
];

export function getLeaderboard(currentUserStats: UserStats): LeaderboardEntry[] {
  const currentEntry: Omit<LeaderboardEntry, 'rank'> = {
    id: 'current_user',
    username: 'You (Champion)',
    avatar: '🌟',
    country: '🌍 Learner',
    xp: currentUserStats.xp,
    level: currentUserStats.level,
    wordsMastered: currentUserStats.wordsMastered,
    isCurrentUser: true,
  };

  const combined = [...BASE_LEADERBOARD, currentEntry].sort((a, b) => b.xp - a.xp);

  return combined.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));
}
