import React, { useState, useMemo } from 'react';
import { VocabWord } from '../../types';
import { speakWord, playSound } from '../../utils/audio';
import { recordActivityCompletion } from '../../utils/gamification';
import confetti from 'canvas-confetti';
import { Volume2, CheckCircle2, XCircle, RotateCcw, Award } from 'lucide-react';

interface Props {
  words: VocabWord[];
  accent: string;
}

export const QuizMode: React.FC<Props> = ({ words, accent }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [history, setHistory] = useState<Array<{ word: VocabWord; correct: boolean; chosen: string }>>([]);

  // Shuffle questions order
  const questionWords = useMemo(() => {
    return [...words].sort(() => Math.random() - 0.5);
  }, [words]);

  const currentWord = questionWords[currentIndex];

  // 4 answer options (current definition + 3 distractors)
  const options = useMemo(() => {
    if (!currentWord) return [];
    const otherDefs = words
      .filter(w => w.id !== currentWord.id)
      .map(w => w.definition)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    return [currentWord.definition, ...otherDefs].sort(() => Math.random() - 0.5);
  }, [currentWord, words]);

  if (!currentWord || showResults) {
    const percentage = Math.round((score / questionWords.length) * 100);
    return (
      <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Award className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-1">Quiz Completed!</h2>
        <p className="text-slate-500 mb-6">Here is how you performed on this vocabulary set:</p>

        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-6 flex justify-around">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase block">Score</span>
            <span className="text-3xl font-extrabold text-indigo-600">{score} / {questionWords.length}</span>
          </div>
          <div className="border-l border-slate-200 pl-6">
            <span className="text-xs font-semibold text-slate-400 uppercase block">Accuracy</span>
            <span className="text-3xl font-extrabold text-slate-800">{percentage}%</span>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="text-left mb-6 max-h-60 overflow-y-auto space-y-2 pr-1">
          {history.map((item, i) => (
            <div
              key={i}
              className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                item.correct ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-rose-50/70 border-rose-200 text-rose-900'
              }`}
            >
              <div>
                <span className="font-bold text-sm block">{item.word.term}</span>
                <span className="opacity-80">{item.word.definition}</span>
              </div>
              {item.correct ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 ml-2" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-600 shrink-0 ml-2" />
              )}
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            setCurrentIndex(0);
            setSelectedAnswer(null);
            setScore(0);
            setHistory([]);
            setShowResults(false);
          }}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl inline-flex items-center gap-2 shadow-md transition"
        >
          <RotateCcw className="w-4 h-4" />
          Retake Quiz
        </button>
      </div>
    );
  }

  const handleSelectOption = (option: string) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(option);

    const isCorrect = option === currentWord.definition;
    if (isCorrect) {
      playSound('correct');
      setScore(s => s + 1);
      confetti({ particleCount: 20, spread: 40 });
    } else {
      playSound('wrong');
    }

    setHistory(prev => [...prev, { word: currentWord, correct: isCorrect, chosen: option }]);

    // Automatically transition to next question after short delay
    setTimeout(() => {
      if (currentIndex + 1 < questionWords.length) {
        setCurrentIndex(i => i + 1);
        setSelectedAnswer(null);
      } else {
        setShowResults(true);
        playSound('win');
        confetti({ particleCount: 80, spread: 70 });
        recordActivityCompletion('quiz', 50);
      }
    }, 1300);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Quiz Header */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Question</span>
          <p className="text-base font-bold text-slate-800">
            {currentIndex + 1} of {questionWords.length}
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Current Score</span>
          <p className="text-base font-bold text-indigo-600">{score} points</p>
        </div>
      </div>

      {/* Target Word Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-6 text-center">
        {currentWord.imageUrl && (
          <div className="mb-3 max-h-32 rounded-xl overflow-hidden inline-block border border-slate-200 shadow-xs">
            <img
              src={currentWord.imageUrl}
              alt={currentWord.term}
              className="max-h-32 object-contain bg-slate-50"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
          What is the definition of:
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-800 my-2">{currentWord.term}</h2>

        <div className="flex items-center justify-center gap-3 mt-3">
          {currentWord.partOfSpeech && (
            <span className="text-xs uppercase font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded">
              {currentWord.partOfSpeech}
            </span>
          )}
          {currentWord.phonetic && (
            <span className="text-xs font-mono text-slate-500">{currentWord.phonetic}</span>
          )}
          <button
            onClick={() => speakWord(currentWord.term, accent)}
            className="p-1.5 rounded-full hover:bg-slate-100 text-indigo-600 transition"
            title="Hear pronunciation"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Multiple Choice Options */}
      <div className="space-y-3">
        {options.map((option, idx) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = option === currentWord.definition;
          let btnStyle = 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-800';

          if (selectedAnswer !== null) {
            if (isCorrect) {
              btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold ring-2 ring-emerald-400';
            } else if (isSelected) {
              btnStyle = 'bg-rose-50 border-rose-500 text-rose-950';
            } else {
              btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelectOption(option)}
              disabled={selectedAnswer !== null}
              className={`w-full text-left p-4 rounded-xl border-2 transition flex items-center justify-between gap-3 ${btnStyle}`}
            >
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="text-sm sm:text-base leading-snug">{option}</span>
              </div>
              {selectedAnswer !== null && isCorrect && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              )}
              {selectedAnswer !== null && isSelected && !isCorrect && (
                <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
