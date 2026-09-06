import React, { useState, useEffect, useMemo } from 'react';
import { VocabWord } from '../../types';
import { speakWord, playSound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import {
  Volume2,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  BookOpen,
} from 'lucide-react';

interface Props {
  words: VocabWord[];
  onUpdateWord?: (wordId: string, updates: Partial<VocabWord>) => void;
  accent: string;
}

type StepType = 'introduce' | 'multiple-choice' | 'spell-check';

export const LearnMode: React.FC<Props> = ({ words, onUpdateWord, accent }) => {
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState<StepType>('introduce');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [typedInput, setTypedInput] = useState('');
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [completed, setCompleted] = useState(false);

  const currentWord = words[index];

  // Generate 4 multiple choice options for current word
  const options = useMemo(() => {
    if (!currentWord || words.length < 2) return [currentWord?.definition || ''];
    const otherDefs = words
      .filter(w => w.id !== currentWord.id)
      .map(w => w.definition)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const combined = [currentWord.definition, ...otherDefs];
    return combined.sort(() => Math.random() - 0.5);
  }, [currentWord, words]);

  useEffect(() => {
    setSelectedOption(null);
    setTypedInput('');
    setIsAnswerChecked(false);
    setIsCorrect(false);
    setStep('introduce');
    if (currentWord) {
      speakWord(currentWord.term, accent);
    }
  }, [index, currentWord, accent]);

  if (!currentWord || completed) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Learning Session Complete!</h2>
        <p className="text-slate-600 mb-6">
          You mastered {completedCount} terms in this round. Regular practice strengthens long-term vocabulary retention!
        </p>
        <button
          onClick={() => {
            setIndex(0);
            setCompletedCount(0);
            setCompleted(false);
            setStep('introduce');
          }}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl inline-flex items-center gap-2 shadow-md transition"
        >
          <RotateCcw className="w-4 h-4" />
          Restart Learn Mode
        </button>
      </div>
    );
  }

  const handleIntroduceNext = () => {
    playSound('click');
    setStep('multiple-choice');
  };

  const handleSelectOption = (opt: string) => {
    if (isAnswerChecked) return;
    setSelectedOption(opt);
    setIsAnswerChecked(true);
    const correct = opt === currentWord.definition;
    setIsCorrect(correct);
    if (correct) {
      playSound('correct');
    } else {
      playSound('wrong');
    }
  };

  const handleNextFromChoice = () => {
    if (isCorrect) {
      // Advance to spelling step
      setSelectedOption(null);
      setIsAnswerChecked(false);
      setStep('spell-check');
    } else {
      // Re-introduce word
      setStep('introduce');
      setIsAnswerChecked(false);
      setSelectedOption(null);
    }
  };

  const handleCheckSpelling = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isAnswerChecked) return;
    const cleanTyped = typedInput.trim().toLowerCase();
    const cleanTarget = currentWord.term.trim().toLowerCase();
    const correct = cleanTyped === cleanTarget;
    setIsCorrect(correct);
    setIsAnswerChecked(true);

    if (correct) {
      playSound('correct');
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
      onUpdateWord?.(currentWord.id, { masteryLevel: Math.min(3, (currentWord.masteryLevel || 0) + 1) });
    } else {
      playSound('wrong');
    }
  };

  const handleAdvanceToNextWord = () => {
    setCompletedCount(c => c + 1);
    if (index + 1 >= words.length) {
      setCompleted(true);
      playSound('win');
      confetti({ particleCount: 100, spread: 70 });
    } else {
      setIndex(i => i + 1);
    }
  };

  const progressPercent = Math.round(((index) / words.length) * 100);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5">
          <span>Mastery Progress</span>
          <span>{index + 1} of {words.length} ({progressPercent}%)</span>
        </div>
        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* STEP 1: INTRODUCE */}
      {step === 'introduce' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Step 1: Discover & Understand
            </span>
            <button
              onClick={() => speakWord(currentWord.term, accent)}
              className="p-2 rounded-full hover:bg-slate-100 text-indigo-600 transition"
              title="Listen"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          <div className="text-center py-6">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 mb-2">
              {currentWord.term}
            </h1>
            {currentWord.phonetic && (
              <p className="text-slate-500 font-mono text-sm mb-4">{currentWord.phonetic}</p>
            )}
            <div className="max-w-md mx-auto p-4 bg-slate-50 rounded-xl border border-slate-200/80 mb-6">
              <p className="text-slate-800 text-lg font-medium leading-relaxed mb-2">
                {currentWord.definition}
              </p>
              {currentWord.exampleSentence && (
                <p className="text-sm text-slate-600 italic">
                  &ldquo;{currentWord.exampleSentence}&rdquo;
                </p>
              )}
            </div>

            {currentWord.translation && (
              <p className="text-xs text-slate-500 mb-6">
                <span className="font-semibold">Clue / Translation:</span> {currentWord.translation}
              </p>
            )}

            <button
              onClick={handleIntroduceNext}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl inline-flex items-center gap-2 shadow-md transition active:scale-95"
            >
              I Understand, Test Meaning
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: MULTIPLE CHOICE MEANING CHECK */}
      {step === 'multiple-choice' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Step 2: Choose the Correct Definition
            </span>
            <button
              onClick={() => speakWord(currentWord.term, accent)}
              className="p-2 rounded-full hover:bg-slate-100 text-indigo-600 transition"
              title="Hear term again"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6 text-center">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Target Term</p>
            <h2 className="text-3xl font-extrabold text-slate-900">{currentWord.term}</h2>
          </div>

          <div className="space-y-3 mb-6">
            {options.map((option, idx) => {
              const isSelected = selectedOption === option;
              const isOptionCorrect = option === currentWord.definition;
              let btnClass = 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-800';

              if (isAnswerChecked) {
                if (isOptionCorrect) {
                  btnClass = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold';
                } else if (isSelected) {
                  btnClass = 'bg-rose-50 border-rose-500 text-rose-900';
                } else {
                  btnClass = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(option)}
                  disabled={isAnswerChecked}
                  className={`w-full text-left p-4 rounded-xl border-2 transition flex items-start justify-between gap-3 ${btnClass}`}
                >
                  <span className="text-sm sm:text-base leading-snug">{option}</span>
                  {isAnswerChecked && isOptionCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  )}
                  {isAnswerChecked && isSelected && !isOptionCorrect && (
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {isAnswerChecked && (
            <div className="flex justify-end">
              <button
                onClick={handleNextFromChoice}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl inline-flex items-center gap-2 shadow-md transition"
              >
                {isCorrect ? 'Proceed to Spelling Check' : 'Review & Retry'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 3: SPELL CHECK */}
      {step === 'spell-check' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Step 3: Active Recall & Spelling
            </span>
            <button
              onClick={() => speakWord(currentWord.term, accent)}
              className="p-2 rounded-full hover:bg-slate-100 text-indigo-600 transition"
              title="Hear pronunciation clue"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mb-6">
            <p className="text-sm font-semibold text-slate-500 mb-1">Definition Clue:</p>
            <p className="text-base text-slate-800 font-medium mb-3">{currentWord.definition}</p>
            {currentWord.exampleSentence && (
              <p className="text-xs text-slate-600 italic">
                Context: &ldquo;{currentWord.exampleSentence.replace(new RegExp(currentWord.term, 'gi'), '_____')}&rdquo;
              </p>
            )}
          </div>

          <form onSubmit={handleCheckSpelling} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Type the English word:
              </label>
              <input
                type="text"
                value={typedInput}
                onChange={e => setTypedInput(e.target.value)}
                disabled={isAnswerChecked && isCorrect}
                placeholder="Type word here..."
                autoFocus
                className="w-full text-lg px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none transition"
              />
            </div>

            {isAnswerChecked && (
              <div
                className={`p-4 rounded-xl flex items-center gap-3 ${
                  isCorrect
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                    : 'bg-rose-50 text-rose-900 border border-rose-300'
                }`}
              >
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold">Perfect spelling!</p>
                      <p className="text-xs">Word mastered: {currentWord.term}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
                    <div>
                      <p className="font-bold">Not quite right</p>
                      <p className="text-xs">
                        Correct spelling is: <span className="font-mono font-bold">{currentWord.term}</span>
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              {!isAnswerChecked ? (
                <button
                  type="submit"
                  disabled={!typedInput.trim()}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-md transition"
                >
                  Check Spelling
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleAdvanceToNextWord}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl inline-flex items-center gap-2 shadow-md transition"
                >
                  Next Vocabulary Term
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
