import React, { useState, useEffect } from 'react';
import { VocabWord } from '../../types';
import { speakWord, playSound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { Volume2, CheckCircle2, XCircle, Lightbulb, RotateCcw, ArrowRight } from 'lucide-react';

interface Props {
  words: VocabWord[];
  accent: string;
}

export const TypeMode: React.FC<Props> = ({ words, accent }) => {
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState('');
  const [revealedHintLetters, setRevealedHintLetters] = useState(0);
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  const currentWord = words[index];

  useEffect(() => {
    setTyped('');
    setRevealedHintLetters(0);
    setStatus('idle');
  }, [index]);

  if (!currentWord) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
        No words available.
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'correct') {
      handleNext();
      return;
    }

    const cleanInput = typed.trim().toLowerCase();
    const cleanTarget = currentWord.term.trim().toLowerCase();

    if (cleanInput === cleanTarget) {
      playSound('correct');
      setStatus('correct');
      setScore(s => s + 10 + streak * 2);
      setStreak(st => st + 1);
      confetti({ particleCount: 25, spread: 45, origin: { y: 0.7 } });
    } else {
      playSound('wrong');
      setStatus('wrong');
      setStreak(0);
    }
  };

  const handleNext = () => {
    playSound('click');
    if (index + 1 < words.length) {
      setIndex(i => i + 1);
    } else {
      setIndex(0);
    }
  };

  const handleHint = () => {
    playSound('click');
    if (revealedHintLetters < currentWord.term.length) {
      setRevealedHintLetters(h => h + 1);
    }
  };

  const maskedSentence = currentWord.exampleSentence
    ? currentWord.exampleSentence.replace(new RegExp(currentWord.term, 'gi'), '_______')
    : null;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Score & Streak Bar */}
      <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-xl shadow-sm mb-6">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-xs text-slate-400 font-semibold block">PROGRESS</span>
            <span className="text-sm font-bold text-slate-800">{index + 1} / {words.length}</span>
          </div>
          <div className="border-l border-slate-200 pl-4">
            <span className="text-xs text-slate-400 font-semibold block">STREAK</span>
            <span className="text-sm font-bold text-amber-600">🔥 {streak}</span>
          </div>
        </div>
        <div>
          <span className="text-xs text-slate-400 font-semibold block text-right">SCORE</span>
          <span className="text-lg font-black text-indigo-600">{score} pts</span>
        </div>
      </div>

      {/* Main Typing Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex justify-between items-start mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
            Type Mode
          </span>
          <button
            onClick={() => speakWord(currentWord.term, accent)}
            className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"
            title="Listen to word"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6 space-y-2">
          <div className="flex items-center gap-2">
            {currentWord.partOfSpeech && (
              <span className="text-xs font-semibold text-slate-500 uppercase">
                [{currentWord.partOfSpeech}]
              </span>
            )}
            {currentWord.phonetic && (
              <span className="text-xs font-mono text-slate-400">
                {currentWord.phonetic}
              </span>
            )}
          </div>
          <p className="text-xl font-semibold text-slate-800 leading-snug">
            {currentWord.definition}
          </p>
          {maskedSentence && (
            <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
              &ldquo;{maskedSentence}&rdquo;
            </p>
          )}
        </div>

        {/* Hint Box if letters revealed */}
        {revealedHintLetters > 0 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-mono">
            Hint: <span className="font-bold text-amber-900">{currentWord.term.slice(0, revealedHintLetters)}</span>
            {'_'.repeat(Math.max(0, currentWord.term.length - revealedHintLetters))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={typed}
              onChange={e => setTyped(e.target.value)}
              placeholder="Type the English word here..."
              disabled={status === 'correct'}
              autoFocus
              className="w-full text-xl px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none transition"
            />
          </div>

          {status === 'correct' && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-emerald-900">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="font-bold">Correct! You spelled: {currentWord.term}</span>
              </div>
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition flex items-center gap-1"
              >
                Next Word <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {status === 'wrong' && (
            <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl flex items-center justify-between text-rose-900">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                <span>
                  Incorrect. Target word: <strong className="font-mono">{currentWord.term}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition"
              >
                Skip
              </button>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleHint}
              disabled={revealedHintLetters >= currentWord.term.length}
              className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-2 rounded-lg transition disabled:opacity-50"
            >
              <Lightbulb className="w-4 h-4" />
              Give me a letter hint
            </button>

            {status !== 'correct' && (
              <button
                type="submit"
                disabled={!typed.trim()}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-md transition"
              >
                Submit Answer
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
