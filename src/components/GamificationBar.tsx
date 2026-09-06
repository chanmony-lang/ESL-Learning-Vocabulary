import React from 'react';
import { UserStats } from '../types';
import { getLevelInfo } from '../utils/gamification';
import { Trophy, Award, Flame, Sparkles, Heart, Gem } from 'lucide-react';

interface Props {
  stats: UserStats;
  onOpenBadges: () => void;
  onOpenLeaderboard: () => void;
}

export const GamificationBar: React.FC<Props> = ({
  stats,
  onOpenBadges,
  onOpenLeaderboard,
}) => {
  const levelInfo = getLevelInfo(stats.xp);
  const gemsCount = stats.gems ?? 420;
  const heartsCount = stats.hearts ?? 5;

  return (
    <div className="bg-white border-b-2 border-slate-200 px-4 sm:px-6 py-2 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Level and Duolingo XP Progress */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[#58cc02] border-b-4 border-[#46a302] text-white flex items-center justify-center font-black text-xs shadow-xs">
            L{levelInfo.level}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-800">{levelInfo.title}</span>
              <span className="text-[10px] text-slate-500 font-bold">
                {stats.xp} / {levelInfo.nextLevelXp} XP
              </span>
            </div>
            {/* Duolingo style rounded progress bar */}
            <div className="w-32 sm:w-48 bg-slate-200 h-2.5 rounded-full overflow-hidden mt-1 p-0.5 border border-slate-300">
              <div
                className="bg-[#58cc02] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, levelInfo.progressPercent)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Duolingo Gamification HUD Items */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Flame Streak */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ff9600]/10 border-2 border-[#ff9600]/40 rounded-2xl text-xs font-black text-[#d97706] shadow-xs cursor-default"
            title="Daily Learning Streak"
          >
            <Flame className="w-4 h-4 text-[#ff9600] fill-[#ff9600] animate-pulse" />
            <span>{stats.streakDays} Days</span>
          </div>

          {/* Duolingo Gems / Lingots */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1cb0f6]/10 border-2 border-[#1cb0f6]/40 rounded-2xl text-xs font-black text-[#0284c7] shadow-xs cursor-default"
            title="Duo Lingots & Gems"
          >
            <Gem className="w-4 h-4 text-[#1cb0f6] fill-[#1cb0f6]" />
            <span>{gemsCount}</span>
          </div>

          {/* Hearts / Lives */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ff4b4b]/10 border-2 border-[#ff4b4b]/40 rounded-2xl text-xs font-black text-[#e11d48] shadow-xs cursor-default"
            title="Learning Energy & Lives"
          >
            <Heart className="w-4 h-4 text-[#ff4b4b] fill-[#ff4b4b]" />
            <span>{heartsCount}/5</span>
          </div>

          {/* Badges Button (Duo 3D style) */}
          <button
            onClick={onOpenBadges}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 border-2 border-slate-200 border-b-4 border-b-slate-300 active:border-b-2 active:translate-y-0.5 rounded-2xl text-xs font-black text-slate-700 transition"
          >
            <Award className="w-4 h-4 text-[#ffc800] fill-[#ffc800]" />
            <span>{stats.unlockedBadgeIds.length} Badges</span>
          </button>

          {/* Leaderboard Button (Duo 3D style) */}
          <button
            onClick={onOpenLeaderboard}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 border-2 border-slate-200 border-b-4 border-b-slate-300 active:border-b-2 active:translate-y-0.5 rounded-2xl text-xs font-black text-slate-700 transition"
          >
            <Trophy className="w-4 h-4 text-[#1cb0f6]" />
            <span className="hidden sm:inline">Leaderboard</span>
            <span className="sm:hidden">Rank</span>
          </button>
        </div>
      </div>
    </div>
  );
};
