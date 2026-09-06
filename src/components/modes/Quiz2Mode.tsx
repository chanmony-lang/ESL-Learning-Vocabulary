import React, { useState, useEffect, useMemo } from 'react';
import { VocabWord } from '../../types';
import { speakWord, playSound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { Headphones, Volume2, CheckCircle2, XCircle, RotateCcw, Award } from 'lucide-react';

interface Props {
  words: VocabWord[];
  accent: string;
}

export const Quiz2Mode: React.FC<Props> = ({ words, accent }) => {
  const [index, setIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isDone, setIsDone] = useState(false);

  const questionWords = useMemo(() => {
    return [...words].sort(() => Math.random() - 0.5);
  }, [words]);

  const currentWord = questionWords[index];

  // Play audio upon opening new question
  useEffect(() => {
    if (currentWord && !isDone) {
      const timer = setTimeout(() => {
        speakWord(currentWord.term, accent);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [index, currentWord, accent, isDone]);

  // Options: 4 terms
  const options = useMemo(() => {
    if (!currentWord) return [];
    const otherTerms = words
      .filter(w => w.id !== currentWord.id)
      .map(w => w.term)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    return [currentWord.term, ...otherTerms].sort(() => Math.random() - 0.5);
  }, [currentWord, words]);

  if (!currentWord || isDone) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Headphones className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Listening Challenge Complete!</h2>
        <p className="text-slate-500 mb-6">
          Your listening comprehension score: <strong className="text-indigo-600">{score}</strong> / {questionWords.length}
        </p>
        <button
          onClick={() => {
            setIndex(0);
            setSelectedOption(null);
            setScore(0);
            setIsDone(false);
          }}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl inline-flex items-center gap-2 shadow-md transition"
        >
          <RotateCcw className="w-4 h-4" />
          Play Listening Quiz Again
        </button>
      </div>
    );
  }

  const handleSelect = (option: string) => {
    if (selectedOption !== null) return;
    setSelectedOption(option);
    const isCorrect = option === currentWord.term;

    if (isCorrect) {
      playSound('correct');
      setScore(s => s + 1);
      confetti({ particleCount: 20, spread: 40 });
    } else {
      playSound('wrong');
    }

    setTimeout(() => {
      if (index + 1 < questionWords.length) {
        setIndex(i => i + 1);
        setSelectedOption(null);
      } else {
        setIsDone(true);
        playSound('win');
        confetti({ particleCount: 80, spread: 60 });
      }
    }, 1300);
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-6 px-1">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Audio Quiz</span>
          <p className="text-base font-bold text-slate-800">{index + 1} / {questionWords.length}</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Score</span>
          <p className="text-base font-bold text-sky-600">{score} correct</p>
        </div>
      </div>

      {/* Audio Player Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center mb-6">
        <div className="w-20 h-20 bg-sky-50 text-sky-600 border border-sky-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
          <Headphones className="w-10 h-10 animate-pulse" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-1">Listen carefully</h3>
        <p className="text-xs text-slate-400 mb-6">Which vocabulary term was spoken?</p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => speakWord(currentWord.term, accent, 0.9)}
            className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm shadow-md transition flex items-center gap-2 active:scale-95"
          >
            <Volume2 className="w-4 h-4" />
            Play Normal Speed
          </button>
          <button
            onClick={() => speakWord(currentWord.term, accent, 0.65)}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition active:scale-95"
          >
            Slow (0.65x)
          </button>
        </div>

        {selectedOption !== null && (
          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
            Meaning: <span className="font-semibold text-slate-700">{currentWord.definition}</span>
          </div>
        )}
      </div>

      {/* 4 Term choices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((option, i) => {
          const isSelected = selectedOption === option;
          const isCorrect = option === currentWord.term;
          let btnStyle = 'bg-white border-slate-200 hover:border-sky-400 hover:bg-sky-50 text-slate-800';

          if (selectedOption !== null) {
            if (isCorrect) {
              btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold';
            } else if (isSelected) {
              btnStyle = 'bg-rose-50 border-rose-500 text-rose-900';
            } else {
              btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-50';
            }
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(option)}
              disabled={selectedOption !== null}
              className={`p-4 rounded-xl border-2 font-semibold text-base transition flex items-center justify-between shadow-sm ${btnStyle}`}
            >
              <span>{option}</span>
              {selectedOption !== null && isCorrect && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              )}
              {selectedOption !== null && isSelected && !isCorrect && (
                <XCircle className="w-5 h-5 text-rose-600" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
