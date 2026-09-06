import React, { useState, useEffect, useMemo } from 'react';
import { VocabWord } from '../../types';
import { playSound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, CheckCircle2, GitCommit } from 'lucide-react';

interface Props {
  words: VocabWord[];
}

export const ConnectMode: React.FC<Props> = ({ words }) => {
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
  }, [activeWords]);

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
      <div className="flex items-center justify-between mb-6 px-1">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <GitCommit className="w-5 h-5 text-indigo-600" />
            Connect & Match
          </h2>
          <p className="text-xs text-slate-500">
            Click a term on the left, then click its matching definition on the right!
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          Connected: {Object.keys(connections).length} / {activeWords.length}
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
                className={`w-full text-left p-4 rounded-xl border-2 transition shadow-xs flex items-center justify-between ${style}`}
              >
                <span className="font-bold text-base">{word.term}</span>
                {isConnected ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <span className="w-3 h-3 rounded-full bg-slate-200 border-2 border-slate-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Right Column: Definitions */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block px-1">
            Definitions & Meanings
          </span>
          {shuffledDefs.map(defWord => {
            const isConnected = Object.values(connections).includes(defWord.id);

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
                className={`w-full text-left p-4 rounded-xl border-2 transition shadow-xs flex items-center justify-between ${style}`}
              >
                <span className="text-xs sm:text-sm font-medium leading-snug">{defWord.definition}</span>
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
