import React, { useState } from 'react';
import { UserStats } from '../types';
import { getLeaderboard } from '../utils/gamification';
import { X, Trophy, Medal, Flame, Sparkles, Globe, User } from 'lucide-react';

interface Props {
  stats: UserStats;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<Props> = ({ stats, onClose }) => {
  const [tab, setTab] = useState<'weekly' | 'alltime'>('weekly');
  const leaderboard = getLeaderboard(stats);
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  const currentUserEntry = leaderboard.find(l => l.isCurrentUser);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">ESL Global Leaderboard</h2>
              <p className="text-[11px] text-slate-400">Compete with vocabulary learners worldwide</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 px-6 bg-white">
          <button
            onClick={() => setTab('weekly')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
              tab === 'weekly'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Weekly League
          </button>
          <button
            onClick={() => setTab('alltime')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
              tab === 'alltime'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            All-Time Hall of Fame
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Top 3 Podium */}
          <div className="grid grid-cols-3 gap-2 pt-4 items-end text-center">
            {/* 2nd Place */}
            {top3[1] && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col items-center">
                <span className="text-2xl mb-1">{top3[1].avatar}</span>
                <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-700 font-black text-xs flex items-center justify-center shadow-xs mb-1">
                  2
                </span>
                <span className="text-xs font-bold text-slate-800 truncate w-full">
                  {top3[1].username}
                </span>
                <span className="text-[10px] text-slate-400">{top3[1].country}</span>
                <span className="text-xs font-extrabold text-indigo-600 mt-1">
                  {top3[1].xp} XP
                </span>
              </div>
            )}

            {/* 1st Place (Champion) */}
            {top3[0] && (
              <div className="bg-amber-50/80 border-2 border-amber-300 rounded-2xl p-3.5 flex flex-col items-center -mt-4 shadow-md">
                <div className="relative">
                  <span className="text-3xl mb-1 block">{top3[0].avatar}</span>
                  <span className="absolute -top-3 -right-2 text-base">👑</span>
                </div>
                <span className="w-7 h-7 rounded-full bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center shadow-xs mb-1 ring-2 ring-amber-200">
                  1
                </span>
                <span className="text-xs font-bold text-slate-900 truncate w-full">
                  {top3[0].username}
                </span>
                <span className="text-[10px] text-amber-700">{top3[0].country}</span>
                <span className="text-xs font-extrabold text-amber-600 mt-1">
                  {top3[0].xp} XP
                </span>
              </div>
            )}

            {/* 3rd Place */}
            {top3[2] && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col items-center">
                <span className="text-2xl mb-1">{top3[2].avatar}</span>
                <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-black text-xs flex items-center justify-center shadow-xs mb-1">
                  3
                </span>
                <span className="text-xs font-bold text-slate-800 truncate w-full">
                  {top3[2].username}
                </span>
                <span className="text-[10px] text-slate-400">{top3[2].country}</span>
                <span className="text-xs font-extrabold text-indigo-600 mt-1">
                  {top3[2].xp} XP
                </span>
              </div>
            )}
          </div>

          {/* Rest of Leaderboard */}
          <div className="space-y-1.5 divide-y divide-slate-100">
            {rest.map(entry => (
              <div
                key={entry.id}
                className={`py-2.5 px-3 rounded-xl flex items-center justify-between transition ${
                  entry.isCurrentUser
                    ? 'bg-indigo-50 border border-indigo-200 font-bold'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 text-center text-xs font-extrabold text-slate-400">
                    #{entry.rank}
                  </span>
                  <span className="text-xl">{entry.avatar}</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800">
                        {entry.username}
                      </span>
                      {entry.isCurrentUser && (
                        <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.2 rounded-full font-bold">
                          YOU
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">{entry.country}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-indigo-600 block">
                    {entry.xp} XP
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {entry.wordsMastered} words mastered
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* User's Current Position Summary */}
          {currentUserEntry && (
            <div className="bg-indigo-600 text-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌟</span>
                <div>
                  <span className="text-xs font-bold block">Your Global Standing</span>
                  <span className="text-[11px] text-indigo-200">
                    Rank #{currentUserEntry.rank} • Level {currentUserEntry.level} ({stats.levelTitle})
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-black font-mono">{currentUserEntry.xp} XP</span>
                <span className="text-[10px] text-indigo-200 block">+25 XP next quiz</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
