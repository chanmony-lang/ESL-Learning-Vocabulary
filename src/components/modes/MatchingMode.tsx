import React, { useState, useEffect, useMemo } from 'react';
import { VocabWord } from '../../types';
import { playSound } from '../../utils/audio';
import { getWordImageUrl } from '../../utils/wordVisuals';
import confetti from 'canvas-confetti';
import { Timer, RotateCcw, Trophy, CheckCircle2, Image as ImageIcon, BookOpen } from 'lucide-react';

interface Props {
  words: VocabWord[];
  showPictures?: boolean;
  onTogglePictures?: () => void;
}

interface TileItem {
  id: string;
  wordId: string;
  type: 'term' | 'definition';
  text: string;
  imageUrl?: string;
}

export const MatchingMode: React.FC<Props> = ({ words, showPictures: initialPictures = false, onTogglePictures }) => {
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

  const [tiles, setTiles] = useState<TileItem[]>([]);
  const [selectedTile, setSelectedTile] = useState<TileItem | null>(null);
  const [matchedWordIds, setMatchedWordIds] = useState<string[]>([]);
  const [wrongMatch, setWrongMatch] = useState<{ id1: string; id2: string } | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Take up to 6 words for a 12-card match round
  const activeWords = useMemo(() => {
    return [...words].sort(() => Math.random() - 0.5).slice(0, 6);
  }, [words]);

  useEffect(() => {
    const list: TileItem[] = [];
    activeWords.forEach(w => {
      const imgUrl = getWordImageUrl(w);
      list.push({ id: `t_${w.id}`, wordId: w.id, type: 'term', text: w.term });
      list.push({ id: `d_${w.id}`, wordId: w.id, type: 'definition', text: w.definition, imageUrl: imgUrl });
    });
    setTiles(list.sort(() => Math.random() - 0.5));
    setMatchedWordIds([]);
    setSelectedTile(null);
    setSeconds(0);
    setIsCompleted(false);
  }, [activeWords, isPicturesMode]);

  // Timer
  useEffect(() => {
    if (isCompleted || matchedWordIds.length === activeWords.length) return;
    const timer = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, [isCompleted, matchedWordIds.length, activeWords.length]);

  const handleTileClick = (tile: TileItem) => {
    if (matchedWordIds.includes(tile.wordId) || wrongMatch !== null) return;
    playSound('click');

    if (!selectedTile) {
      setSelectedTile(tile);
      return;
    }

    if (selectedTile.id === tile.id) {
      setSelectedTile(null);
      return;
    }

    // Check if match
    if (selectedTile.wordId === tile.wordId && selectedTile.type !== tile.type) {
      // MATCH!
      playSound('correct');
      const newMatched = [...matchedWordIds, tile.wordId];
      setMatchedWordIds(newMatched);
      setSelectedTile(null);

      if (newMatched.length === activeWords.length) {
        setIsCompleted(true);
        playSound('win');
        confetti({ particleCount: 80, spread: 70 });
      }
    } else {
      // MISMATCH
      playSound('wrong');
      setWrongMatch({ id1: selectedTile.id, id2: tile.id });
      setTimeout(() => {
        setWrongMatch(null);
        setSelectedTile(null);
      }, 700);
    }
  };

  const handleRestart = () => {
    const list: TileItem[] = [];
    activeWords.forEach(w => {
      list.push({ id: `t_${w.id}`, wordId: w.id, type: 'term', text: w.term });
      list.push({ id: `d_${w.id}`, wordId: w.id, type: 'definition', text: w.definition });
    });
    setTiles(list.sort(() => Math.random() - 0.5));
    setMatchedWordIds([]);
    setSelectedTile(null);
    setSeconds(0);
    setIsCompleted(false);
  };

  if (isCompleted) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-1">Board Cleared!</h2>
        <p className="text-slate-500 mb-6">Completed in <strong className="text-indigo-600">{seconds} seconds</strong></p>
        <button
          onClick={handleRestart}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl inline-flex items-center gap-2 shadow-md transition"
        >
          <RotateCcw className="w-4 h-4" />
          Play Another Match Round
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 px-1">
        <div className="flex items-center gap-4 text-slate-600 font-semibold text-sm">
          <div className="flex items-center gap-1.5">
            <Timer className="w-4 h-4 text-indigo-600" />
            <span>Time: {seconds}s</span>
          </div>
          <div className="text-xs font-semibold text-slate-500">
            Matched: {matchedWordIds.length} / {activeWords.length} pairs
          </div>
        </div>

        {/* Clue Mode Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <span className="text-slate-400 text-[10px] uppercase font-bold px-2 select-none">
            Clue Tile:
          </span>
          <button
            type="button"
            onClick={() => togglePicturesMode(false)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
              !isPicturesMode
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Match word with text definition"
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
            title="Match word with picture clue"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Picture</span>
          </button>
        </div>
      </div>

      {/* Tiles Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {tiles.map(tile => {
          const isMatched = matchedWordIds.includes(tile.wordId);
          const isSelected = selectedTile?.id === tile.id;
          const isWrong = wrongMatch?.id1 === tile.id || wrongMatch?.id2 === tile.id;

          if (isMatched) {
            return (
              <div
                key={tile.id}
                className="p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50/50 text-emerald-700 opacity-40 flex items-center justify-center min-h-[100px] text-center text-xs font-medium"
              >
                <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" /> Matched
              </div>
            );
          }

          let style = 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-md text-slate-800';
          if (isSelected) {
            style = 'bg-indigo-50 border-indigo-600 text-indigo-950 ring-2 ring-indigo-300 font-semibold shadow-md';
          } else if (isWrong) {
            style = 'bg-rose-50 border-rose-500 text-rose-950 animate-shake';
          }

          return (
            <button
              key={tile.id}
              onClick={() => handleTileClick(tile)}
              className={`p-3 rounded-xl border-2 transition-all flex items-center justify-center text-center min-h-[100px] cursor-pointer overflow-hidden ${style}`}
            >
              {tile.type === 'term' ? (
                <span className="font-bold text-base sm:text-lg text-indigo-900 leading-tight">
                  {tile.text}
                </span>
              ) : isPicturesMode && tile.imageUrl ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-0.5">
                  <img
                    src={tile.imageUrl}
                    alt="Visual clue"
                    className="w-full h-20 object-cover rounded-lg shadow-2xs"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <span className="text-xs sm:text-sm font-medium leading-tight">
                  {tile.text}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
