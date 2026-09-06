import React, { useState, useEffect, useMemo } from 'react';
import { VocabWord } from '../../types';
import { speakWord, playSound } from '../../utils/audio';
import { recordActivityCompletion } from '../../utils/gamification';
import confetti from 'canvas-confetti';
import { Sparkles, Clock, CheckCircle2, ArrowRight, Lightbulb, Volume2, HelpCircle, Trophy } from 'lucide-react';

interface Props {
  words: VocabWord[];
  accent: string;
}

export const MysteryMiniMode: React.FC<Props> = ({ words, accent }) => {
  const [stage, setStage] = useState(0); // 0, 1, 2 for micro-clues, then final
  const [userInputs, setUserInputs] = useState<string[]>(['', '', '']);
  const [completedStages, setCompletedStages] = useState<boolean[]>([false, false, false]);
  const [finalGuess, setFinalGuess] = useState('');
  const [isWon, setIsWon] = useState(false);
  const [seconds, setSeconds] = useState(0);

  // Pick 4 words: 3 clue words and 1 master word
  const activeSet = useMemo(() => {
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    return {
      clueWords: shuffled.slice(0, 3),
      masterWord: shuffled[3] || shuffled[0] || { term: 'MASTER', definition: 'Main target word' },
    };
  }, [words]);

  useEffect(() => {
    const timer = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentClueWord = activeSet.clueWords[stage];

  const handleCheckMicroClue = (idx: number) => {
    const target = activeSet.clueWords[idx]?.term.trim().toLowerCase();
    const input = userInputs[idx].trim().toLowerCase();

    if (input === target) {
      playSound('correct');
      const updated = [...completedStages];
      updated[idx] = true;
      setCompletedStages(updated);
      if (idx < 2) {
        setStage(idx + 1);
      }
    } else {
      playSound('wrong');
    }
  };

  const handleFinalSubmit = () => {
    const target = activeSet.masterWord.term.trim().toLowerCase();
    if (finalGuess.trim().toLowerCase() === target) {
      playSound('correct');
      setIsWon(true);
      confetti({ particleCount: 65, spread: 80 });
      recordActivityCompletion('mysterymini', 45);
      speakWord(activeSet.masterWord.term, accent);
    } else {
      playSound('wrong');
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="max-w-xl mx-auto px-2">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#ff9600] border-b-4 border-[#e58600] text-white flex items-center justify-center font-black text-lg">
            M
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              NYT Mystery Mini <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">Fast Challenge</span>
            </h2>
            <p className="text-xs font-semibold text-slate-500">
              Solve 3 micro-clues to unlock the secret Master Word
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-black bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>{formatTime(seconds)}</span>
        </div>
      </div>

      {/* 3 Step Progress */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {activeSet.clueWords.map((cw, idx) => {
          const isDone = completedStages[idx];
          const isCurrent = stage === idx && !isDone;
          return (
            <div
              key={idx}
              onClick={() => setStage(idx)}
              className={`p-3 rounded-2xl border-2 text-center cursor-pointer transition ${
                isDone
                  ? 'bg-emerald-50 border-[#58cc02] text-emerald-900 border-b-4 border-b-[#46a302]'
                  : isCurrent
                  ? 'bg-amber-50 border-amber-400 text-amber-900 border-b-4 border-b-amber-500 scale-102'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}
            >
              <span className="text-[10px] font-black uppercase tracking-wider block">Clue {idx + 1}</span>
              <span className="font-extrabold text-xs">
                {isDone ? '✓ Unlocked' : `${cw.term.length} Letters`}
              </span>
            </div>
          );
        })}
      </div>

      {/* Current Micro-Clue Card */}
      {!completedStages.every(Boolean) && currentClueWord && (
        <div className="bg-white rounded-3xl border-2 border-slate-200 border-b-4 border-b-slate-300 p-6 mb-6 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase text-amber-600 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
              Clue #{stage + 1} &bull; {currentClueWord.partOfSpeech || 'Vocabulary'}
            </span>
            <button
              onClick={() => speakWord(currentClueWord.term, accent)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-600 transition"
              title="Hear pronunciation"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          <h3 className="text-base font-bold text-slate-900 mb-2">
            &ldquo;{currentClueWord.definition}&rdquo;
          </h3>

          {currentClueWord.exampleSentence && (
            <p className="text-xs text-slate-500 italic mb-4">
              Example: &ldquo;{currentClueWord.exampleSentence}&rdquo;
            </p>
          )}

          {/* Input field */}
          <div className="flex gap-2">
            <input
              type="text"
              value={userInputs[stage]}
              onChange={e => {
                const next = [...userInputs];
                next[stage] = e.target.value;
                setUserInputs(next);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') handleCheckMicroClue(stage);
              }}
              placeholder={`Enter ${currentClueWord.term.length}-letter word...`}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 border-2 border-slate-200 focus:border-[#58cc02] focus:bg-white font-black text-sm uppercase tracking-wider transition outline-none"
            />
            <button
              onClick={() => handleCheckMicroClue(stage)}
              className="px-5 py-2.5 bg-[#58cc02] hover:bg-[#61e002] text-white font-black text-xs rounded-xl border-b-4 border-[#46a302] active:border-b-0 active:translate-y-1 transition shadow-sm"
            >
              Check
            </button>
          </div>
        </div>
      )}

      {/* Master Word Mystery Vault */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl border-2 border-indigo-200 border-b-4 border-b-indigo-300 p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-sm">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-base font-black text-indigo-950 mb-1">Final Secret Master Word</h3>
        <p className="text-xs text-indigo-700 mb-4 max-w-sm mx-auto">
          Definition Clue: &ldquo;{activeSet.masterWord.definition}&rdquo;
        </p>

        {/* Revealed letters preview */}
        <div className="flex justify-center gap-2 mb-5">
          {activeSet.masterWord.term.split('').map((char, idx) => {
            // Reveal letter if corresponding micro-clue is solved or game is won
            const isRevealed = completedStages[idx % 3] || isWon;
            return (
              <div
                key={idx}
                className={`w-10 h-12 rounded-xl border-2 flex items-center justify-center font-black text-lg transition-all ${
                  isRevealed
                    ? 'bg-white border-indigo-300 text-indigo-950 shadow-xs'
                    : 'bg-indigo-100/50 border-indigo-200 text-indigo-300'
                }`}
              >
                {isRevealed ? char.toUpperCase() : '?'}
              </div>
            );
          })}
        </div>

        {!isWon ? (
          <div className="flex justify-center gap-2 max-w-sm mx-auto">
            <input
              type="text"
              value={finalGuess}
              onChange={e => setFinalGuess(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleFinalSubmit();
              }}
              placeholder="Solve Master Word..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-white border-2 border-indigo-200 focus:border-indigo-500 font-black text-sm uppercase tracking-wider transition outline-none shadow-xs"
            />
            <button
              onClick={handleFinalSubmit}
              className="px-6 py-2.5 bg-[#1cb0f6] hover:bg-[#24bcff] text-white font-black text-xs rounded-xl border-b-4 border-[#1899d6] active:border-b-0 active:translate-y-1 transition shadow-sm"
            >
              Solve
            </button>
          </div>
        ) : (
          <div className="p-4 bg-emerald-100 rounded-2xl border-2 border-[#58cc02] text-emerald-950 font-black text-sm animate-fadeIn">
            🎉 Bravo! Master Word Unlocked: {activeSet.masterWord.term.toUpperCase()}!
          </div>
        )}
      </div>
    </div>
  );
};
