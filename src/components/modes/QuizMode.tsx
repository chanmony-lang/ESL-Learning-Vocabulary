import React, { useState, useMemo } from 'react';
import { VocabWord } from '../../types';
import { speakWord, playSound } from '../../utils/audio';
import { getWordImageUrl } from '../../utils/wordVisuals';
import { recordActivityCompletion } from '../../utils/gamification';
import confetti from 'canvas-confetti';
import { Volume2, CheckCircle2, XCircle, RotateCcw, Award, Image as ImageIcon, BookOpen } from 'lucide-react';

interface Props {
  words: VocabWord[];
  accent: string;
  showPictures?: boolean;
  onTogglePictures?: () => void;
}

interface QuizOption {
  id: string;
  text: string;
  imageUrl?: string;
  word: VocabWord;
}

export const QuizMode: React.FC<Props> = ({ words, accent, showPictures: initialPictures = false, onTogglePictures }) => {
  const [internalPictures, setInternalPictures] = useState<boolean>(() => {
    return localStorage.getItem('lexiquest_pictures_in_games') === 'true';
  });

  const isPicturesMode = onTogglePictures !== undefined ? initialPictures : internalPictures;

  const togglePicturesMode = (val: boolean) => {
    if (onTogglePictures) {
      if (initialPictures !== val) onTogglePictures();
    } else {
      setInternalPictures(val);
      localStorage.setItem('lexiquest_pictures_in_games', String(val));
    }
  };

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

  // 4 answer options (current word + 3 distractors)
  const options = useMemo<QuizOption[]>(() => {
    if (!currentWord) return [];
    const otherWords = words
      .filter(w => w.id !== currentWord.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const pool = [currentWord, ...otherWords].sort(() => Math.random() - 0.5);
    return pool.map(w => ({
      id: w.id,
      text: w.definition,
      imageUrl: getWordImageUrl(w),
      word: w,
    }));
  }, [currentWord, words]);

  const handleSelectOption = (opt: QuizOption) => {
    if (selectedAnswer !== null || !currentWord) return;

    setSelectedAnswer(opt.id);
    const isCorrect = opt.id === currentWord.id;

    if (isCorrect) {
      playSound('correct');
      setScore(s => s + 1);
    } else {
      playSound('wrong');
    }

    setHistory(prev => [
      ...prev,
      { word: currentWord, correct: isCorrect, chosen: isPicturesMode ? opt.word.term : opt.text },
    ]);

    setTimeout(() => {
      if (currentIndex + 1 < questionWords.length) {
        setCurrentIndex(c => c + 1);
        setSelectedAnswer(null);
      } else {
        setShowResults(true);
        recordActivityCompletion('quiz', 15);
        playSound('win');
        confetti({ particleCount: 70, spread: 70 });
      }
    }, 1200);
  };

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

  return (
    <div className="max-w-2xl mx-auto">
      {/* Quiz Header & Clue Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 px-1">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Question</span>
          <p className="text-base font-bold text-slate-800">
            {currentIndex + 1} of {questionWords.length}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Clue Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <span className="text-slate-400 text-[10px] uppercase font-bold px-2 select-none">
              Options:
            </span>
            <button
              type="button"
              onClick={() => togglePicturesMode(false)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                !isPicturesMode
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Definitions</span>
            </button>
            <button
              type="button"
              onClick={() => togglePicturesMode(true)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                isPicturesMode
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Pictures</span>
            </button>
          </div>

          <div className="text-right">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Score</span>
            <p className="text-base font-bold text-indigo-600">{score} pts</p>
          </div>
        </div>
      </div>

      {/* Target Word Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-6 text-center">
        {!isPicturesMode && currentWord.imageUrl && (
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
          {isPicturesMode ? 'Select the matching picture for:' : 'What is the definition of:'}
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
      {isPicturesMode ? (
        /* Picture cards grid (2x2) */
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {options.map((option, idx) => {
            const isSelected = selectedAnswer === option.id;
            const isCorrect = option.id === currentWord.id;
            let btnStyle = 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-md text-slate-800';

            if (selectedAnswer !== null) {
              if (isCorrect) {
                btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold ring-2 ring-emerald-400';
              } else if (isSelected) {
                btnStyle = 'bg-rose-50 border-rose-500 text-rose-950';
              } else {
                btnStyle = 'bg-slate-50 border-slate-200 opacity-50';
              }
            }

            return (
              <button
                key={option.id}
                onClick={() => handleSelectOption(option)}
                disabled={selectedAnswer !== null}
                className={`p-3 rounded-2xl border-2 transition flex flex-col items-center justify-between text-center relative overflow-hidden group ${btnStyle}`}
              >
                <div className="w-full flex items-center justify-between mb-2">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  {selectedAnswer !== null && isCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  )}
                  {selectedAnswer !== null && isSelected && !isCorrect && (
                    <XCircle className="w-5 h-5 text-rose-600" />
                  )}
                </div>

                <div className="w-full h-28 sm:h-36 rounded-xl overflow-hidden bg-slate-100 mb-1 flex items-center justify-center border border-slate-200 shadow-2xs">
                  {option.imageUrl ? (
                    <img
                      src={option.imageUrl}
                      alt="Quiz visual clue"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-xs text-slate-400 font-semibold">Visual Representation</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        /* Text definitions list */
        <div className="space-y-3">
          {options.map((option, idx) => {
            const isSelected = selectedAnswer === option.id;
            const isCorrect = option.id === currentWord.id;
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
                key={option.id}
                onClick={() => handleSelectOption(option)}
                disabled={selectedAnswer !== null}
                className={`w-full text-left p-4 rounded-xl border-2 transition flex items-center justify-between gap-3 ${btnStyle}`}
              >
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-sm sm:text-base leading-snug">{option.text}</span>
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
      )}
    </div>
  );
};
