import React, { useState, useEffect, useMemo } from 'react';
import { VocabWord } from '../../types';
import { playSound } from '../../utils/audio';
import { getWordImageUrl } from '../../utils/wordVisuals';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, CheckCircle2, GitCommit, Image as ImageIcon, BookOpen } from 'lucide-react';

interface Props {
  words: VocabWord[];
  showPictures?: boolean;
  onTogglePictures?: () => void;
}

export const ConnectMode: React.FC<Props> = ({ words, showPictures: initialPictures = false, onTogglePictures }) => {
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

  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const [connections, setConnections] = useState<{ [termId: string]: string }>({}); // termId -> defWordId
  const [isWon, setIsWon] = useState(false);

  // Take 5 words for a clean connection round
  const activeWords = useMemo(() => {
    return [...words].sort(() => Math.random() - 0.5).slice(0, 5);
  }, [words]);

  // Shuffled definitions on the right
  const shuffledDefs = useMemo(() => {
    return [...activeWords].sort(() => Math.random() - 0.5);
  }, [activeWords]);

  useEffect(() => {
    setSelectedTermId(null);
    setConnections({});
    setIsWon(false);
  }, [activeWords, isPicturesMode]);

  const handleTermClick = (id: string) => {
    if (connections[id]) return; // Already paired
    playSound('click');
    setSelectedTermId(id);
  };

  const handleDefClick = (defWordId: string) => {
    if (!selectedTermId) return;

    // Check if correct pair
    if (selectedTermId === defWordId) {
      playSound('correct');
      const updated = { ...connections, [selectedTermId]: defWordId };
      setConnections(updated);
      setSelectedTermId(null);

      if (Object.keys(updated).length === activeWords.length) {
        setIsWon(true);
        playSound('win');
        confetti({ particleCount: 70, spread: 60 });
      }
    } else {
      playSound('wrong');
      setSelectedTermId(null);
    }
  };

  const handleReset = () => {
    setSelectedTermId(null);
    setConnections({});
    setIsWon(false);
  };

  if (isWon) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-1">All Connected!</h2>
        <p className="text-slate-500 mb-6">You successfully paired all terms to their exact meanings!</p>
        <button
          onClick={handleReset}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl inline-flex items-center gap-2 shadow-md transition"
        >
          <RotateCcw className="w-4 h-4" />
          Play Connect Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 px-1">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <GitCommit className="w-5 h-5 text-indigo-600" />
            Connect & Match
          </h2>
          <p className="text-xs text-slate-500">
            {isPicturesMode
              ? 'Click a term on the left, then connect it to its matching picture on the right!'
              : 'Click a term on the left, then click its matching definition on the right!'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Clue Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <span className="text-slate-400 text-[10px] uppercase font-bold px-2 select-none">
              Clues:
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
              <span>Definition</span>
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
              <span>Picture</span>
            </button>
          </div>

          <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
            {Object.keys(connections).length} / {activeWords.length}
          </div>
        </div>
      </div>

      {/* Two columns connection arena */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left Column: Terms */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block px-1">
            Vocabulary Terms
          </span>
          {activeWords.map(word => {
            const isConnected = !!connections[word.id];
            const isSelected = selectedTermId === word.id;

            let style = 'bg-white border-slate-200 hover:border-indigo-400 text-slate-800';
            if (isConnected) {
              style = 'bg-emerald-50 border-emerald-400 text-emerald-950 opacity-60';
            } else if (isSelected) {
              style = 'bg-indigo-50 border-indigo-600 text-indigo-950 ring-2 ring-indigo-400 font-bold';
            }

            return (
              <button
                key={word.id}
                onClick={() => handleTermClick(word.id)}
                disabled={isConnected}
                className={`w-full text-left p-4 rounded-xl border-2 transition shadow-xs flex items-center justify-between min-h-[72px] ${style}`}
              >
                <span className="font-bold text-base">{word.term}</span>
                {isConnected ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <span className="w-3 h-3 rounded-full bg-slate-200 border-2 border-slate-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Right Column: Definitions or Pictures */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block px-1">
            {isPicturesMode ? 'Picture Cards' : 'Definitions & Meanings'}
          </span>
          {shuffledDefs.map(defWord => {
            const isConnected = Object.values(connections).includes(defWord.id);
            const imgUrl = getWordImageUrl(defWord);

            let style = 'bg-white border-slate-200 hover:border-indigo-400 text-slate-800';
            if (isConnected) {
              style = 'bg-emerald-50 border-emerald-400 text-emerald-950 opacity-60';
            } else if (selectedTermId) {
              style = 'bg-indigo-50/50 border-indigo-200 hover:border-indigo-500 text-slate-900 cursor-pointer';
            }

            return (
              <button
                key={defWord.id}
                onClick={() => handleDefClick(defWord.id)}
                disabled={isConnected}
                className={`w-full text-left p-3 rounded-xl border-2 transition shadow-xs flex items-center justify-between min-h-[72px] overflow-hidden ${style}`}
              >
                {isPicturesMode && imgUrl ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={imgUrl}
                      alt="Visual clue"
                      className="w-16 h-12 rounded-lg object-cover border border-slate-200 shadow-2xs shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-xs text-slate-500 font-medium line-clamp-2">
                      Visual representation
                    </span>
                  </div>
                ) : (
                  <span className="text-xs sm:text-sm font-medium leading-snug">{defWord.definition}</span>
                )}
                {isConnected ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 ml-2" />
                ) : (
                  <span className="w-3 h-3 rounded-full bg-slate-200 border-2 border-slate-400 shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
