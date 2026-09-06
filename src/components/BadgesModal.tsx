import React from 'react';
import { Badge, UserStats } from '../types';
import { ALL_BADGES } from '../utils/gamification';
import { X, Award, CheckCircle2, Lock, Sparkles } from 'lucide-react';

interface Props {
  stats: UserStats;
  onClose: () => void;
}

export const BadgesModal: React.FC<Props> = ({ stats, onClose }) => {
  const unlockedCount = stats.unlockedBadgeIds.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Achievement Badges</h2>
              <p className="text-[11px] text-slate-400">
                {unlockedCount} of {ALL_BADGES.length} milestone badges unlocked
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Badges Grid */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {ALL_BADGES.map(badge => {
              const isUnlocked = stats.unlockedBadgeIds.includes(badge.id);

              return (
                <div
                  key={badge.id}
                  className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                    isUnlocked
                      ? 'bg-amber-50/50 border-amber-200 shadow-xs'
                      : 'bg-slate-50 border-slate-200 opacity-65'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-xs ${
                      isUnlocked
                        ? 'bg-white border border-amber-300 ring-2 ring-amber-400/20'
                        : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    {badge.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{badge.title}</h4>
                      {isUnlocked ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/80 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Unlocked
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <Lock className="w-3 h-3" /> Locked
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {badge.description}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[11px] font-bold">
                      <span className="text-amber-600 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> +{badge.xpReward} XP
                      </span>
                      <span className="text-slate-400 uppercase text-[9px] tracking-wider">
                        {badge.category}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
