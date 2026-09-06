import React, { useState, useEffect, useMemo } from 'react';
import { VocabWord } from '../../types';
import { playSound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { Eye, RotateCcw, Trophy, Check } from 'lucide-react';

interface Props {
  words: VocabWord[];
}

interface MemoryCard {
  id: string;
  wordId: string;
  type: 'term' | 'def';
  text: string;
}

export const MemoryMode: React.FC<Props> = ({ words }) => {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [matchedWordIds, setMatchedWordIds] = useState<string[]>([]);
  const [turns, setTurns] = useState(0);
  const [isWon, setIsWon] = useState(false);

  // Take 6 words for a 12-card grid (optimal memory difficulty)
  const chosenWords = useMemo(() => {
    return [...words].sort(() => Math.random() - 0.5).slice(0, 6);
  }, [words]);

  const initGame = () => {
    const list: MemoryCard[] = [];
    chosenWords.forEach(w => {
      list.push({ id: `term_${w.id}`, wordId: w.id, type: 'term', text: w.term });
      list.push({ id: `def_${w.id}`, wordId: w.id, type: 'def', text: w.definition });
    });
    setCards(list.sort(() => Math.random() - 0.5));
    setFlippedIds([]);
    setMatchedWordIds([]);
    setTurns(0);
    setIsWon(false);
  };

  useEffect(() => {
    initGame();
  }, [chosenWords]);

  const handleCardClick = (card: MemoryCard) => {
    // Cannot click if already matched or currently 2 cards flipped or clicking same card
    if (
      matchedWordIds.includes(card.wordId) ||
      flippedIds.includes(card.id) ||
      flippedIds.length >= 2
    ) {
      return;
    }

    playSound('flip');
    const newFlipped = [...flippedIds, card.id];
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setTurns(t => t + 1);
      const firstCard = cards.find(c => c.id === newFlipped[0])!;
      const secondCard = card;

      if (firstCard.wordId === secondCard.wordId && firstCard.type !== secondCard.type) {
        // MATCH
        setTimeout(() => {
          playSound('correct');
          const newMatched = [...matchedWordIds, firstCard.wordId];
          setMatchedWordIds(newMatched);
          setFlippedIds([]);

          if (newMatched.length === chosenWords.length) {
            setIsWon(true);
            playSound('win');
            confetti({ particleCount: 80, spread: 70 });
          }
        }, 500);
      } else {
        // MISMATCH -> Flip back after delay
        setTimeout(() => {
          playSound('wrong');
          setFlippedIds([]);
        }, 1200);
      }
    }
  };

  if (isWon) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-1">Memory Champion!</h2>
        <p className="text-slate-500 mb-6">
          You matched all pairs in <strong className="text-indigo-600">{turns} turns</strong>!
        </p>
        <button
          onClick={initGame}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl inline-flex items-center gap-2 shadow-md transition"
        >
          <RotateCcw className="w-4 h-4" />
          Play Memory Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
          <Eye className="w-4 h-4 text-indigo-600" />
          <span>Concentration Memory</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
          <span>Turns: {turns}</span>
          <span>Matched: {matchedWordIds.length} / {chosenWords.length}</span>
        </div>
      </div>

      {/* Grid of memory cards */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4">
        {cards.map(card => {
          const isFlipped = flippedIds.includes(card.id);
          const isMatched = matchedWordIds.includes(card.wordId);

          return (
            <div
              key={card.id}
              onClick={() => handleCardClick(card)}
              className="h-28 sm:h-32 cursor-pointer perspective"
              style={{ perspective: '1000px' }}
            >
              <div
                className={`w-full h-full duration-500 rounded-xl transition-transform transform-style-3d relative ${
                  isFlipped || isMatched ? 'rotate-y-180' : ''
                }`}
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isFlipped || isMatched ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                {/* Back (Face down) */}
                <div
                  className="absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-700 to-indigo-900 rounded-xl flex items-center justify-center text-indigo-200 font-black text-xl shadow-md border-2 border-indigo-600 backface-hidden select-none hover:border-indigo-400 transition"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  ?
                </div>

                {/* Front (Revealed) */}
                <div
                  className={`absolute inset-0 w-full h-full rounded-xl p-2.5 flex flex-col justify-center items-center text-center shadow-md border-2 backface-hidden select-none ${
                    isMatched
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                      : 'bg-white border-indigo-300 text-slate-800'
                  }`}
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  <span
                    className={
                      card.type === 'term'
                        ? 'font-bold text-sm sm:text-base text-indigo-900 leading-tight'
                        : 'text-xs leading-snug line-clamp-4 text-slate-600'
                    }
                  >
                    {card.text}
                  </span>
                  {isMatched && (
                    <span className="mt-1 flex items-center text-[10px] text-emerald-600 font-bold">
                      <Check className="w-3 h-3 mr-0.5" /> Paired
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
