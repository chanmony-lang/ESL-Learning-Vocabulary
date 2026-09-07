import React, { useState, useEffect, useCallback } from 'react';
import { VocabWord } from '../../types';
import { speakWord, playSound } from '../../utils/audio';
import { recordActivityCompletion } from '../../utils/gamification';
import {
  Volume2,
  Shuffle,
  Star,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
  Image as ImageIcon,
} from 'lucide-react';

interface Props {
  words: VocabWord[];
  onUpdateWord?: (wordId: string, updates: Partial<VocabWord>) => void;
  accent: string;
}

export const FlashCardMode: React.FC<Props> = ({ words, onUpdateWord, accent }) => {
  const [cardList, setCardList] = useState<VocabWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [onlyStarred, setOnlyStarred] = useState(false);
  const [cardFront, setCardFront] = useState<'word' | 'definition'>(() => {
    const saved = localStorage.getItem('flashcard_front_preference');
    return saved === 'definition' || saved === 'word' ? saved : 'word';
  });

  useEffect(() => {
    let filtered = words;
    if (onlyStarred) {
      filtered = words.filter(w => w.starred);
      if (filtered.length === 0) filtered = words; // fallback
    }
    setCardList(filtered);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [words, onlyStarred]);

  const currentWord = cardList[currentIndex] || words[0];

  const handleFlip = useCallback(() => {
    playSound('flip');
    setIsFlipped(prev => !prev);
  }, []);

  const handleNext = useCallback(() => {
    if (cardList.length <= 1) return;
    setIsFlipped(false);
    playSound('click');
    setCurrentIndex(prev => (prev + 1) % cardList.length);
  }, [cardList.length]);

  const handlePrev = useCallback(() => {
    if (cardList.length <= 1) return;
    setIsFlipped(false);
    playSound('click');
    setCurrentIndex(prev => (prev - 1 + cardList.length) % cardList.length);
  }, [cardList.length]);

  const handleShuffle = () => {
    playSound('click');
    const shuffled = [...cardList].sort(() => Math.random() - 0.5);
    setCardList(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const toggleStar = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentWord) return;
    playSound('click');
    onUpdateWord?.(currentWord.id, { starred: !currentWord.starred });
  };

  const handleAudio = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    speakWord(text, accent);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        if (currentWord) {
          if (cardFront === 'definition' && !isFlipped) {
            speakWord(currentWord.definition, accent);
          } else {
            speakWord(currentWord.term, accent);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleNext, handlePrev, currentWord, accent, cardFront, isFlipped]);

  if (!currentWord) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
        No words in this set yet. Add some words to start studying!
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col items-center">
      {/* Top Controls Bar */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 px-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
            {currentIndex + 1} / {cardList.length}
          </span>
          <button
            onClick={() => setOnlyStarred(!onlyStarred)}
            className={`text-xs flex items-center gap-1 px-3 py-1 rounded-full font-medium transition ${
              onlyStarred
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${onlyStarred ? 'fill-amber-500 text-amber-500' : ''}`} />
            Starred Only
          </button>
        </div>

        {/* Front Card Option Switcher (Word vs Definition) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <span className="text-slate-400 text-[10px] uppercase font-bold px-2 select-none">
              Front Card:
            </span>
            <button
              type="button"
              onClick={() => {
                setCardFront('word');
                localStorage.setItem('flashcard_front_preference', 'word');
                setIsFlipped(false);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                cardFront === 'word'
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Show the Word on the front, Definition on the back"
            >
              <span>🔤 Word</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCardFront('definition');
                localStorage.setItem('flashcard_front_preference', 'definition');
                setIsFlipped(false);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                cardFront === 'definition'
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Show the Definition on the front, Word on the back"
            >
              <span>📖 Definition</span>
            </button>
          </div>

          <button
            onClick={handleShuffle}
            className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm transition"
            title="Shuffle cards"
          >
            <Shuffle className="w-3.5 h-3.5" />
            Shuffle
          </button>
        </div>
      </div>

      {/* 3D Flip Flashcard */}
      <div
        className="w-full h-88 sm:h-96 cursor-pointer select-none perspective"
        style={{ perspective: '1000px' }}
        onClick={handleFlip}
        id="flashcard-container"
      >
        <div
          className={`w-full h-full relative duration-500 transform-style-3d transition-transform ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* FRONT OF CARD */}
          {cardFront === 'word' ? (
            /* FRONT: WORD */
            <div
              className="absolute inset-0 w-full h-full bg-white rounded-2xl border-2 border-indigo-100 shadow-lg p-6 sm:p-8 flex flex-col justify-between backface-hidden"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  {currentWord.partOfSpeech && (
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2.5 py-0.5 rounded-md">
                      {currentWord.partOfSpeech}
                    </span>
                  )}
                  {currentWord.phonetic && (
                    <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded">
                      {currentWord.phonetic}
                    </span>
                  )}
                </div>
                <button
                  onClick={toggleStar}
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition"
                  title={currentWord.starred ? 'Starred' : 'Star word'}
                >
                  <Star
                    className={`w-5 h-5 ${
                      currentWord.starred
                        ? 'fill-amber-400 text-amber-500'
                        : 'text-slate-300 hover:text-slate-400'
                    }`}
                  />
                </button>
              </div>

              <div className="text-center my-auto flex flex-col items-center">
                {currentWord.imageUrl && (
                  <div className="mb-3 max-h-32 sm:max-h-36 rounded-xl overflow-hidden border border-slate-200 shadow-xs">
                    <img
                      src={currentWord.imageUrl}
                      alt={currentWord.term}
                      className="max-h-32 sm:max-h-36 object-contain bg-slate-50"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight mb-3">
                  {currentWord.term}
                </h2>
                <button
                  onClick={e => handleAudio(e, currentWord.term)}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-medium transition active:scale-95"
                  title="Hear pronunciation"
                >
                  <Volume2 className="w-4 h-4" />
                  Listen
                </button>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <RotateCw className="w-3.5 h-3.5" />
                  Click or press Space to flip
                </span>
                <span>Hint: definition on back</span>
              </div>
            </div>
          ) : (
            /* FRONT: DEFINITION */
            <div
              className="absolute inset-0 w-full h-full bg-white rounded-2xl border-2 border-indigo-100 shadow-lg p-6 sm:p-8 flex flex-col justify-between backface-hidden"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2.5 py-0.5 rounded-md">
                    Definition Clue
                  </span>
                  {currentWord.partOfSpeech && (
                    <span className="text-xs font-semibold uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {currentWord.partOfSpeech}
                    </span>
                  )}
                </div>
                <button
                  onClick={toggleStar}
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition"
                  title={currentWord.starred ? 'Starred' : 'Star word'}
                >
                  <Star
                    className={`w-5 h-5 ${
                      currentWord.starred
                        ? 'fill-amber-400 text-amber-500'
                        : 'text-slate-300 hover:text-slate-400'
                    }`}
                  />
                </button>
              </div>

              <div className="text-center my-auto flex flex-col items-center max-w-xl mx-auto">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                  What word matches this meaning?
                </span>
                <p className="text-xl sm:text-2xl font-bold text-slate-800 leading-snug mb-4">
                  &ldquo;{currentWord.definition}&rdquo;
                </p>

                {currentWord.exampleSentence && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 italic max-w-lg mb-3">
                    Context: &ldquo;{currentWord.exampleSentence.replace(new RegExp(`\\b${currentWord.term}\\b`, 'gi'), '_____')}&rdquo;
                  </div>
                )}

                <button
                  onClick={e => handleAudio(e, currentWord.definition)}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition active:scale-95"
                  title="Listen to definition clue"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  Listen to Definition
                </button>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <RotateCw className="w-3.5 h-3.5" />
                  Click or press Space to reveal word
                </span>
                <span>Word & pronunciation on back</span>
              </div>
            </div>
          )}

          {/* BACK OF CARD */}
          {cardFront === 'word' ? (
            /* BACK: DEFINITION */
            <div
              className="absolute inset-0 w-full h-full bg-indigo-900 text-white rounded-2xl shadow-xl p-6 sm:p-8 flex flex-col justify-between backface-hidden"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200 bg-indigo-800/80 px-2.5 py-0.5 rounded-md">
                  Definition & Context
                </span>
                <button
                  onClick={e => handleAudio(e, currentWord.term + '. ' + currentWord.definition)}
                  className="p-1.5 rounded-lg hover:bg-indigo-800 transition text-indigo-200"
                  title="Listen to definition"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 my-auto">
                <p className="text-lg sm:text-xl font-medium text-indigo-50 leading-relaxed">
                  {currentWord.definition}
                </p>

                {currentWord.exampleSentence && (
                  <div className="bg-indigo-800/60 p-3.5 rounded-xl border border-indigo-700/50 text-sm text-indigo-100 italic">
                    &ldquo;{currentWord.exampleSentence}&rdquo;
                  </div>
                )}

                {currentWord.synonyms && currentWord.synonyms.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap text-xs">
                    <span className="text-indigo-300 font-medium">Synonyms:</span>
                    {currentWord.synonyms.map(syn => (
                      <span key={syn} className="bg-indigo-800 text-indigo-200 px-2 py-0.5 rounded">
                        {syn}
                      </span>
                    ))}
                  </div>
                )}

                {currentWord.translation && (
                  <div className="text-xs text-indigo-300">
                    <span className="font-semibold text-indigo-200">Translations: </span>
                    {currentWord.translation}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center text-xs text-indigo-300">
                <span className="flex items-center gap-1">
                  <RotateCw className="w-3.5 h-3.5" />
                  Click to flip back
                </span>
                <span>{currentWord.term}</span>
              </div>
            </div>
          ) : (
            /* BACK: WORD (WHEN FRONT IS DEFINITION) */
            <div
              className="absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-xl p-6 sm:p-8 flex flex-col justify-between backface-hidden"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300 bg-emerald-950/80 border border-emerald-800 px-2.5 py-0.5 rounded-md">
                    Target Word
                  </span>
                  {currentWord.partOfSpeech && (
                    <span className="text-xs font-mono text-indigo-200 bg-indigo-800/80 px-2 py-0.5 rounded">
                      {currentWord.partOfSpeech}
                    </span>
                  )}
                  {currentWord.phonetic && (
                    <span className="text-xs font-mono text-indigo-300">
                      {currentWord.phonetic}
                    </span>
                  )}
                </div>
                <button
                  onClick={e => handleAudio(e, currentWord.term)}
                  className="p-1.5 rounded-lg hover:bg-indigo-800 transition text-indigo-200"
                  title="Listen to word pronunciation"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              <div className="text-center my-auto flex flex-col items-center">
                {currentWord.imageUrl && (
                  <div className="mb-3 max-h-32 sm:max-h-36 rounded-xl overflow-hidden border border-indigo-700/60 shadow-lg">
                    <img
                      src={currentWord.imageUrl}
                      alt={currentWord.term}
                      className="max-h-32 sm:max-h-36 object-contain bg-slate-900/50"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
                  {currentWord.term}
                </h2>
                <button
                  onClick={e => handleAudio(e, currentWord.term)}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-md transition active:scale-95 mb-3"
                  title="Hear native pronunciation"
                >
                  <Volume2 className="w-4 h-4" />
                  Listen Pronunciation
                </button>

                {currentWord.translation && (
                  <p className="text-xs text-indigo-200 font-medium">
                    Translation: {currentWord.translation}
                  </p>
                )}
              </div>

              <div className="flex justify-between items-center text-xs text-indigo-300">
                <span className="flex items-center gap-1">
                  <RotateCw className="w-3.5 h-3.5" />
                  Click to flip back
                </span>
                <span className="truncate max-w-[200px]">{currentWord.definition}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="flex items-center gap-4 mt-6">
        <button
          onClick={handlePrev}
          disabled={cardList.length <= 1}
          className="p-3 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition"
          title="Previous card (Left Arrow)"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={handleFlip}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md transition active:scale-95 flex items-center gap-2"
        >
          <RotateCw className="w-4 h-4" />
          Flip Card
        </button>

        <button
          onClick={handleNext}
          disabled={cardList.length <= 1}
          className="p-3 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition"
          title="Next card (Right Arrow)"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Keyboard Shortcut Hints */}
      <div className="mt-6 flex items-center gap-4 text-xs text-slate-400">
        <span><kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-600">Space</kbd> Flip</span>
        <span><kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-600">←</kbd> Prev</span>
        <span><kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-600">→</kbd> Next</span>
        <span><kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-600">↑</kbd> Audio</span>
      </div>
    </div>
  );
};
