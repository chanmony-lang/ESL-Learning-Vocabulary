import React, { useState, useEffect, useMemo, useRef } from 'react';
import { VocabWord } from '../../types';
import { speakWord, playSound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { Zap, Timer, Flame, RotateCcw, Trophy } from 'lucide-react';

interface Props {
  words: VocabWord[];
  accent: string;
}

const QUESTION_SECONDS = 7;

export const Quiz4Mode: React.FC<Props> = ({ words, accent }) => {
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_SECONDS);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [isOver, setIsOver] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'timeout' | null>(null);

  const questionWords = useMemo(() => {
    return [...words].sort(() => Math.random() - 0.5);
  }, [words]);

  const currentWord = questionWords[index];

  // 4 random definition choices
  const options = useMemo(() => {
    if (!currentWord) return [];
    const others = words
      .filter(w => w.id !== currentWord.id)
      .map(w => w.definition)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    return [currentWord.definition, ...others].sort(() => Math.random() - 0.5);
  }, [currentWord, words]);

  // Countdown timer
  useEffect(() => {
    if (isOver || feedback !== null) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [index, isOver, feedback]);

  const handleTimeout = () => {
    playSound('wrong');
    setFeedback('timeout');
    setCombo(0);
    setTimeout(advanceToNext, 1200);
  };

  const handleChoice = (option: string) => {
    if (feedback !== null || isOver) return;

    const isCorrect = option === currentWord.definition;
    if (isCorrect) {
      playSound('correct');
      const newCombo = combo + 1;
      setCombo(newCombo);
      setMaxCombo(prev => Math.max(prev, newCombo));
      const bonus = Math.round(timeLeft * 10 * (1 + newCombo * 0.2));
      setScore(s => s + bonus);
      setFeedback('correct');
      if (newCombo % 3 === 0) {
        confetti({ particleCount: 20, spread: 40 });
      }
    } else {
      playSound('wrong');
      setCombo(0);
      setFeedback('wrong');
    }

    setTimeout(advanceToNext, 1000);
  };

  const advanceToNext = () => {
    setFeedback(null);
    setTimeLeft(QUESTION_SECONDS);
    if (index + 1 < questionWords.length) {
      setIndex(i => i + 1);
    } else {
      setIsOver(true);
      playSound('win');
      confetti({ particleCount: 100, spread: 80 });
    }
  };

  if (!currentWord || isOver) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-1">Blitz Finished!</h2>
        <p className="text-slate-500 mb-6">Incredible lightning reaction speed!</p>

        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-6 grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs font-semibold text-slate-400 block">TOTAL SCORE</span>
            <span className="text-3xl font-black text-indigo-600">{score}</span>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">MAX STREAK</span>
            <span className="text-3xl font-black text-amber-500">🔥 {maxCombo}x</span>
          </div>
        </div>

        <button
          onClick={() => {
            setIndex(0);
            setScore(0);
            setCombo(0);
            setMaxCombo(0);
            setTimeLeft(QUESTION_SECONDS);
            setIsOver(false);
            setFeedback(null);
          }}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl inline-flex items-center gap-2 shadow-md transition"
        >
          <RotateCcw className="w-4 h-4" />
          Play Blitz Again
        </button>
      </div>
    );
  }

  const timerPercent = (timeLeft / QUESTION_SECONDS) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      {/* HUD Header */}
      <div className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-2xl mb-4 shadow">
        <div className="flex items-center gap-3">
          <Zap className="w-6 h-6 text-amber-400" />
          <div>
            <span className="text-xs text-slate-400 font-semibold block">SPEED BLITZ</span>
            <span className="text-sm font-bold">{index + 1} / {questionWords.length}</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5 text-amber-400 font-black">
            <Flame className="w-5 h-5" />
            <span>{combo}x Combo</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">SCORE</span>
            <span className="text-xl font-black text-indigo-400">{score}</span>
          </div>
        </div>
      </div>

      {/* Timer progress bar */}
      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mb-6">
        <div
          className={`h-full transition-all duration-1000 ${
            timeLeft <= 2 ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'
          }`}
          style={{ width: `${timerPercent}%` }}
        />
      </div>

      {/* Target Word */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-6 sm:p-8 text-center mb-6">
        <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
          <span>{currentWord.partOfSpeech?.toUpperCase()}</span>
          <span className="flex items-center gap-1 text-slate-700 font-bold">
            <Timer className="w-3.5 h-3.5 text-amber-500" /> {timeLeft}s
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-1">{currentWord.term}</h2>
      </div>

      {/* 4 Choices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt, i) => {
          const isCorrect = opt === currentWord.definition;
          let btnClass = 'bg-white border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 text-slate-800';

          if (feedback !== null) {
            if (isCorrect) {
              btnClass = 'bg-emerald-500 border-emerald-600 text-white font-bold';
            } else {
              btnClass = 'bg-slate-100 border-slate-200 text-slate-400 opacity-50';
            }
          }

          return (
            <button
              key={i}
              onClick={() => handleChoice(opt)}
              disabled={feedback !== null}
              className={`p-4 rounded-xl border-2 text-left text-sm font-medium transition shadow-sm ${btnClass}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
};
