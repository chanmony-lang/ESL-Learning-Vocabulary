import React, { useState, useEffect, useMemo } from 'react';
import { VocabSet, Folder, ModeType, VocabWord, UserStats } from './types';
import { loadSavedSets, saveSets, loadSavedFolders, saveFolders } from './utils/storage';
import { ALL_MODES, MODE_CATEGORIES, getModeById } from './data/modeRegistry';
import { ModeIcon } from './components/ModeIcon';
import { speakWord, playSound } from './utils/audio';
import { loadUserStats, recordActivityCompletion } from './utils/gamification';

// Mode Components
import { FlashCardMode } from './components/modes/FlashCardMode';
import { LearnMode } from './components/modes/LearnMode';
import { TypeMode } from './components/modes/TypeMode';
import { MatchingMode } from './components/modes/MatchingMode';
import { MemoryMode } from './components/modes/MemoryMode';
import { QuizMode } from './components/modes/QuizMode';
import { Quiz2Mode } from './components/modes/Quiz2Mode';
import { Quiz4Mode } from './components/modes/Quiz4Mode';
import { SpellingBeeMode } from './components/modes/SpellingBeeMode';
import { WordSearchMode } from './components/modes/WordSearchMode';
import { WordSearch2Mode } from './components/modes/WordSearch2Mode';
import { WheelMode } from './components/modes/WheelMode';
import { SushiSpellMode } from './components/modes/SushiSpellMode';
import { UnscrambleMode } from './components/modes/UnscrambleMode';
import { Unscramble2Mode } from './components/modes/Unscramble2Mode';
import { MissingLetterMode } from './components/modes/MissingLetterMode';
import { CatchLettersMode } from './components/modes/CatchLettersMode';
import { BattleMode } from './components/modes/BattleMode';
import { WordFishMode } from './components/modes/WordFishMode';
import { ConnectMode } from './components/modes/ConnectMode';
import { TicTacToeMode } from './components/modes/TicTacToeMode';
import { MysteryMode } from './components/modes/MysteryMode';
import { HangmanMode } from './components/modes/HangmanMode';
import { Hangman2Mode } from './components/modes/Hangman2Mode';
import { DictionaryMode } from './components/modes/DictionaryMode';
import { TranslateMode } from './components/modes/TranslateMode';
import { MindmapMode } from './components/modes/MindmapMode';
import { GameMode } from './components/modes/GameMode';

// NYT Style Game Modes
import { WordleMode } from './components/modes/WordleMode';
import { ConnectionsMode } from './components/modes/ConnectionsMode';
import { CrosswordMode } from './components/modes/CrosswordMode';
import { MysteryMiniMode } from './components/modes/MysteryMiniMode';

// Modals & Gamification Components
import { CreateSetModal } from './components/CreateSetModal';
import { CreateFolderModal } from './components/CreateFolderModal';
import { GamificationBar } from './components/GamificationBar';
import { BadgesModal } from './components/BadgesModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { PronunciationCoachModal } from './components/PronunciationCoachModal';
import { ImagePickerModal } from './components/ImagePickerModal';
import { PrintModal } from './components/PrintModal';

import {
  Folder as FolderIcon,
  Plus,
  Search,
  BookOpen,
  Sparkles,
  Volume2,
  Settings,
  ChevronLeft,
  Star,
  Layers,
  FilePlus,
  FolderPlus,
  Upload,
  ArrowRight,
  GraduationCap,
  Play,
  CheckCircle2,
  Trash2,
  Edit,
  Mic,
  Trophy,
  Award,
  Image as ImageIcon,
  Flame,
  Printer,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

export default function App() {
  const [sets, setSets] = useState<VocabSet[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<ModeType | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Accent & Audio Settings
  const [accent, setAccent] = useState<string>('en-US');

  // Gamification & Features state
  const [userStats, setUserStats] = useState<UserStats>(loadUserStats);
  const [isBadgesModalOpen, setIsBadgesModalOpen] = useState(false);
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState(false);
  const [coachWord, setCoachWord] = useState<VocabWord | null>(null);
  const [pickingImageWordId, setPickingImageWordId] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Modals state
  const [isSetModalOpen, setIsSetModalOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<VocabSet | null>(null);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);

  // Sidebar visibility & collapsible sections
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('lexiquest_sidebar_open');
    return saved !== null ? saved === 'true' : true;
  });
  const [isFoldersSectionOpen, setIsFoldersSectionOpen] = useState<boolean>(true);
  const [isSetsSectionOpen, setIsSetsSectionOpen] = useState<boolean>(true);

  // Sync sidebar open state with localStorage
  useEffect(() => {
    localStorage.setItem('lexiquest_sidebar_open', String(isSidebarOpen));
  }, [isSidebarOpen]);

  // Refresh user stats whenever storage updates
  useEffect(() => {
    const handleStatsUpdate = () => {
      setUserStats(loadUserStats());
    };
    window.addEventListener('storage', handleStatsUpdate);
    window.addEventListener('user_stats_updated', handleStatsUpdate);
    return () => {
      window.removeEventListener('storage', handleStatsUpdate);
      window.removeEventListener('user_stats_updated', handleStatsUpdate);
    };
  }, []);

  // Initialize storage
  useEffect(() => {
    const loadedSets = loadSavedSets();
    const loadedFolders = loadSavedFolders();
    setSets(loadedSets);
    setFolders(loadedFolders);
    if (loadedSets.length > 0) {
      setActiveSetId(loadedSets[0].id);
    }
  }, []);

  const activeSet = useMemo(() => {
    return sets.find(s => s.id === activeSetId) || sets[0] || null;
  }, [sets, activeSetId]);

  // Filter sets by folder and search query
  const filteredSets = useMemo(() => {
    return sets.filter(s => {
      const matchesFolder = selectedFolderId ? s.folderId === selectedFolderId : true;
      const matchesSearch =
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.words.some(w => w.term.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesFolder && matchesSearch;
    });
  }, [sets, selectedFolderId, searchQuery]);

  // Set management
  const handleSaveSet = (savedSet: VocabSet) => {
    let updated: VocabSet[];
    const exists = sets.some(s => s.id === savedSet.id);
    if (exists) {
      updated = sets.map(s => (s.id === savedSet.id ? savedSet : s));
    } else {
      updated = [savedSet, ...sets];
    }
    setSets(updated);
    saveSets(updated);
    setActiveSetId(savedSet.id);
    setIsSetModalOpen(false);
    setEditingSet(null);
  };

  const handleDeleteSet = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this vocabulary set?')) return;
    const updated = sets.filter(s => s.id !== id);
    setSets(updated);
    saveSets(updated);
    if (activeSetId === id) {
      setActiveSetId(updated[0]?.id || null);
      setActiveMode(null);
    }
  };

  // Folder management
  const handleSaveFolder = (savedFolder: Folder) => {
    let updated: Folder[];
    const exists = folders.some(f => f.id === savedFolder.id);
    if (exists) {
      updated = folders.map(f => (f.id === savedFolder.id ? savedFolder : f));
    } else {
      updated = [...folders, savedFolder];
    }
    setFolders(updated);
    saveFolders(updated);
    setIsFolderModalOpen(false);
    setEditingFolder(null);
  };

  const handleDeleteFolder = (id: string) => {
    if (!window.confirm('Delete this folder? (Sets inside will remain in root)')) return;
    const updatedFolders = folders.filter(f => f.id !== id);
    setFolders(updatedFolders);
    saveFolders(updatedFolders);

    // Unassign sets
    const updatedSets = sets.map(s => (s.folderId === id ? { ...s, folderId: undefined } : s));
    setSets(updatedSets);
    saveSets(updatedSets);

    if (selectedFolderId === id) {
      setSelectedFolderId(null);
    }
  };

  const handleToggleStarWord = (wordId: string) => {
    if (!activeSet) return;
    const updatedWords = activeSet.words.map(w =>
      w.id === wordId ? { ...w, starred: !w.starred } : w
    );
    const updatedSet = { ...activeSet, words: updatedWords };
    const updatedSets = sets.map(s => (s.id === activeSet.id ? updatedSet : s));
    setSets(updatedSets);
    saveSets(updatedSets);
  };

  const handleUpdateWordImage = (wordId: string, imageUrl: string) => {
    if (!activeSet) return;
    const updatedWords = activeSet.words.map(w =>
      w.id === wordId ? { ...w, imageUrl } : w
    );
    const updatedSet = { ...activeSet, words: updatedWords };
    const updatedSets = sets.map(s => (s.id === activeSet.id ? updatedSet : s));
    setSets(updatedSets);
    saveSets(updatedSets);
    setPickingImageWordId(null);
  };

  // Render the selected activity mode
  const renderActiveModeComponent = () => {
    if (!activeSet || !activeMode) return null;
    const words = activeSet.words;

    switch (activeMode) {
      case 'learn':
        return <LearnMode words={words} accent={accent} />;
      case 'flashcard':
        return <FlashCardMode words={words} accent={accent} />;
      case 'type':
        return <TypeMode words={words} accent={accent} />;
      case 'matching':
        return <MatchingMode words={words} />;
      case 'memory':
        return <MemoryMode words={words} />;
      case 'quiz':
        return <QuizMode words={words} accent={accent} />;
      case 'quiz2':
        return <Quiz2Mode words={words} accent={accent} />;
      case 'quiz4':
        return <Quiz4Mode words={words} accent={accent} />;
      case 'spellingbee':
        return <SpellingBeeMode words={words} accent={accent} />;
      case 'wordsearch':
        return <WordSearchMode words={words} accent={accent} />;
      case 'wordsearch2':
        return <WordSearch2Mode words={words} accent={accent} />;
      case 'wheel':
        return <WheelMode words={words} accent={accent} />;
      case 'sushispell':
        return <SushiSpellMode words={words} accent={accent} />;
      case 'unscramble':
        return <UnscrambleMode words={words} accent={accent} />;
      case 'unscramble2':
        return <Unscramble2Mode words={words} accent={accent} />;
      case 'missingletter':
        return <MissingLetterMode words={words} accent={accent} />;
      case 'catchletters':
        return <CatchLettersMode words={words} accent={accent} />;
      case 'battle':
        return <BattleMode words={words} accent={accent} />;
      case 'wordfish':
        return <WordFishMode words={words} accent={accent} />;
      case 'connect':
        return <ConnectMode words={words} />;
      case 'tictactoe':
        return <TicTacToeMode words={words} accent={accent} />;
      case 'mystery':
        return <MysteryMode words={words} accent={accent} />;
      case 'hangman':
        return <HangmanMode words={words} accent={accent} />;
      case 'hangman2':
        return <Hangman2Mode words={words} accent={accent} />;
      case 'dictionary':
        return (
          <DictionaryMode
            words={words}
            currentSet={activeSet}
            accent={accent}
            onToggleStar={handleToggleStarWord}
            onPracticePronunciation={word => setCoachWord(word)}
          />
        );
      case 'translate':
        return <TranslateMode words={words} accent={accent} />;
      case 'mindmap':
        return <MindmapMode words={words} currentSet={activeSet} accent={accent} />;
      case 'game':
        return <GameMode words={words} accent={accent} />;
      case 'wordle':
        return <WordleMode words={words} accent={accent} />;
      case 'connections':
        return <ConnectionsMode words={words} accent={accent} />;
      case 'crossword':
        return <CrosswordMode words={words} accent={accent} />;
      case 'mysterymini':
        return <MysteryMiniMode words={words} accent={accent} />;
      default:
        return <FlashCardMode words={words} accent={accent} />;
    }
  };

  const currentModeConfig = activeMode ? getModeById(activeMode) : null;

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-800 flex flex-col font-sans">
      {/* Quizlet-Style Top Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand & Sidebar Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsSidebarOpen(prev => !prev)}
              className={`p-2 rounded-xl border transition flex items-center gap-1.5 ${
                !isSidebarOpen
                  ? 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700 shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200/70 border-slate-200 text-slate-700'
              }`}
              title={isSidebarOpen ? 'Close sidebar (Folders & Study Sets)' : 'Open sidebar (Folders & Study Sets)'}
              aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeftOpen className="w-4 h-4 text-indigo-600" />
              )}
              <span className="text-xs font-black hidden xl:inline">
                {isSidebarOpen ? 'Close Sidebar' : 'Folders & Sets'}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveMode(null);
              }}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-sm group-hover:bg-indigo-700 transition">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-black text-slate-900 tracking-tight block">
                  LexiQuest <span className="text-indigo-600">ESL</span>
                </span>
                <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase block">
                  28 Interactive Learning Modes
                </span>
              </div>
            </button>
          </div>

          {/* Search bar */}
          <div className="hidden md:flex items-center relative flex-1 max-w-md mx-4">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search vocabulary sets, words, or folders..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 hover:bg-slate-200/70 focus:bg-white border border-transparent focus:border-indigo-400 rounded-xl text-xs sm:text-sm transition focus:outline-none"
            />
          </div>

          {/* Action Buttons & Accent Selector */}
          <div className="flex items-center gap-2.5">
            {/* Accent Selector */}
            <select
              value={accent}
              onChange={e => setAccent(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition focus:outline-none"
              title="Pronunciation Accent"
            >
              <option value="en-US">🇺🇸 US English</option>
              <option value="en-GB">🇬🇧 UK English</option>
              <option value="en-AU">🇦🇺 AU English</option>
            </select>

            {/* Badges Button */}
            <button
              onClick={() => setIsBadgesModalOpen(true)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition flex items-center gap-1.5"
              title="Milestone Badges"
            >
              <Award className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold hidden sm:inline">Badges</span>
            </button>

            {/* Leaderboard Button */}
            <button
              onClick={() => setIsLeaderboardModalOpen(true)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition flex items-center gap-1.5"
              title="Global Leaderboard"
            >
              <Trophy className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold hidden sm:inline">Rankings</span>
            </button>

            {/* Folder creation */}
            <button
              onClick={() => {
                setEditingFolder(null);
                setIsFolderModalOpen(true);
              }}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition hidden sm:flex items-center"
              title="Create Folder"
            >
              <FolderPlus className="w-4 h-4" />
            </button>

            {/* Create / Import Set Button */}
            <button
              onClick={() => {
                setEditingSet(null);
                setIsSetModalOpen(true);
              }}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create Set</span>
            </button>
          </div>
        </div>
      </header>

      {/* Gamification Progress & Streak Bar */}
      <GamificationBar
        stats={userStats}
        onOpenBadges={() => setIsBadgesModalOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardModalOpen(true)}
      />

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row gap-6">
        {/* Left Sidebar: Folders & Sets Organizer (Quizlet-style) */}
        {isSidebarOpen && (
          <aside className="w-full md:w-64 lg:w-72 shrink-0 space-y-4">
            {/* Sidebar Header with Close button */}
            <div className="flex items-center justify-between px-3 py-2 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Folders & Study Sets
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono">
                  {sets.length}
                </span>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition flex items-center gap-1 text-xs font-bold"
                title="Close sidebar"
                aria-label="Close sidebar"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
                <span className="text-[11px]">Close</span>
              </button>
            </div>

            {/* Folders Section with collapsible toggle */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-3 px-1">
                <button
                  onClick={() => setIsFoldersSectionOpen(prev => !prev)}
                  className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-600 hover:text-indigo-600 transition"
                  title={isFoldersSectionOpen ? "Collapse Folders list" : "Expand Folders list"}
                >
                  {isFoldersSectionOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>Folders</span>
                  <span className="text-[10px] font-bold text-slate-400 font-mono">
                    ({folders.length})
                  </span>
                </button>
                <button
                  onClick={() => {
                    setEditingFolder(null);
                    setIsFolderModalOpen(true);
                  }}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" /> New
                </button>
              </div>

              {isFoldersSectionOpen && (
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedFolderId(null)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                      selectedFolderId === null
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5" /> All Study Sets
                    </span>
                    <span className="text-[11px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                      {sets.length}
                    </span>
                  </button>

                  {folders.map(folder => {
                    const count = sets.filter(s => s.folderId === folder.id).length;
                    const isSelected = selectedFolderId === folder.id;

                    return (
                      <div
                        key={folder.id}
                        className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                          isSelected
                            ? 'bg-indigo-50 text-indigo-700 font-bold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <button
                          onClick={() => setSelectedFolderId(folder.id)}
                          className="flex items-center gap-2 text-left truncate flex-1"
                        >
                          <FolderIcon
                            className="w-3.5 h-3.5 shrink-0"
                            style={{ color: folder.color || '#4f46e5' }}
                          />
                          <span className="truncate">{folder.name}</span>
                        </button>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                            {count}
                          </span>
                          <button
                            onClick={() => handleDeleteFolder(folder.id)}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition p-0.5"
                            title="Delete Folder"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sets List in Current Folder with collapsible toggle */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-3 px-1">
                <button
                  onClick={() => setIsSetsSectionOpen(prev => !prev)}
                  className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-600 hover:text-indigo-600 transition"
                  title={isSetsSectionOpen ? "Collapse Study Sets list" : "Expand Study Sets list"}
                >
                  {isSetsSectionOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>Study Sets</span>
                  <span className="text-[10px] font-bold text-slate-400 font-mono">
                    ({filteredSets.length})
                  </span>
                </button>
                <button
                  onClick={() => {
                    setEditingSet(null);
                    setIsSetModalOpen(true);
                  }}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>

              {isSetsSectionOpen && (
                <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                  {filteredSets.map(set => {
                    const isCurrent = activeSetId === set.id;
                    return (
                      <button
                        key={set.id}
                        onClick={() => {
                          setActiveSetId(set.id);
                          setActiveMode(null);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl text-xs transition border ${
                          isCurrent
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs font-bold'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="truncate font-bold pr-2">{set.title}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded ${
                              isCurrent
                                ? 'bg-indigo-500 text-indigo-100'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {set.words.length}w
                          </span>
                        </div>
                        <p
                          className={`text-[11px] truncate ${
                            isCurrent ? 'text-indigo-100' : 'text-slate-400'
                          }`}
                        >
                          {set.description || `${set.level || 'B1-B2'} • ESL`}
                        </p>
                      </button>
                    );
                  })}
                  {filteredSets.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-4 italic">
                      No sets found in this folder
                    </p>
                  )}
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Center / Right Content Area */}
        <main className="flex-1 min-w-0">
          {/* Quick reopen button when sidebar is collapsed */}
          {!isSidebarOpen && (
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border-2 border-slate-200 border-b-4 border-b-slate-300 hover:bg-slate-50 text-slate-700 font-black text-xs transition active:border-b-2 active:translate-y-0.5 shadow-xs"
                title="Open sidebar with folders and study sets"
              >
                <PanelLeftOpen className="w-4 h-4 text-[#1cb0f6]" />
                <span>Open Sidebar (Folders & Study Sets)</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono">
                  {sets.length}
                </span>
              </button>
            </div>
          )}

          {/* If an active mode is playing, show breadcrumb & back button */}
          {activeMode && currentModeConfig ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-white px-5 py-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={() => setIsSidebarOpen(prev => !prev)}
                    className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition"
                    title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                  >
                    {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4 text-indigo-600" />}
                  </button>
                  <button
                    onClick={() => setActiveMode(null)}
                    className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 hover:text-indigo-600 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back to {activeSet?.title}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-white font-bold"
                    style={{ backgroundColor: currentModeConfig.color }}
                  >
                    <ModeIcon iconName={currentModeConfig.icon} className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-800">
                    {currentModeConfig.title}
                  </span>
                </div>
              </div>

              {/* Active Activity Component */}
              <div className="min-h-[500px]">
                {renderActiveModeComponent()}
              </div>
            </div>
          ) : activeSet ? (
            /* Set Details & 28-Mode Hub View */
            <div className="space-y-8">
              {/* Set Hero Banner */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                        {activeSet.level || 'B1-B2'} ESL
                      </span>
                      {activeSet.folderId && (
                        <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <FolderIcon className="w-3 h-3 text-indigo-500" />
                          {folders.find(f => f.id === activeSet.folderId)?.name || 'Folder'}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">
                        {activeSet.words.length} vocabulary words
                      </span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      {activeSet.title}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1 max-w-2xl">
                      {activeSet.description || 'Master these English words through 28 distinct study, quiz, and arcade modes.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start">
                    <button
                      onClick={() => setIsPrintModalOpen(true)}
                      className="px-3.5 py-2 rounded-2xl border-2 border-slate-200 border-b-4 border-b-slate-300 hover:bg-slate-50 text-slate-700 font-black text-xs transition flex items-center gap-1.5 active:border-b-2 active:translate-y-0.5"
                      title="Print Flashcards, Study Sheets, Quizzes & Puzzles"
                    >
                      <Printer className="w-4 h-4 text-emerald-600" />
                      <span className="hidden sm:inline">Print Material</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditingSet(activeSet);
                        setIsSetModalOpen(true);
                      }}
                      className="p-2 rounded-2xl border-2 border-slate-200 border-b-4 border-b-slate-300 hover:bg-slate-50 text-slate-600 transition active:border-b-2 active:translate-y-0.5"
                      title="Edit Vocabulary Set"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={e => handleDeleteSet(activeSet.id, e)}
                      className="p-2 rounded-2xl border-2 border-slate-200 border-b-4 border-b-slate-300 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition active:border-b-2 active:translate-y-0.5"
                      title="Delete Set"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Quick Action Pills: Learn & Flashcards & Print in Duolingo Style */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100 flex-wrap">
                  <button
                    onClick={() => setActiveMode('learn')}
                    className="px-5 py-2.5 bg-[#58cc02] hover:bg-[#61e002] border-b-4 border-[#46a302] text-white font-black text-xs sm:text-sm rounded-2xl shadow-sm flex items-center gap-2 transition active:border-b-0 active:translate-y-1"
                  >
                    <Play className="w-4 h-4 fill-white" /> Start Learning (Mode 1)
                  </button>
                  <button
                    onClick={() => setActiveMode('flashcard')}
                    className="px-5 py-2.5 bg-white border-2 border-slate-200 border-b-4 border-b-slate-300 hover:bg-slate-50 text-slate-700 font-black text-xs sm:text-sm rounded-2xl shadow-xs flex items-center gap-2 transition active:border-b-2 active:translate-y-0.5"
                  >
                    <BookOpen className="w-4 h-4 text-[#1cb0f6]" /> Flash Cards (Mode 2)
                  </button>
                  <button
                    onClick={() => setActiveMode('quiz')}
                    className="px-5 py-2.5 bg-white border-2 border-slate-200 border-b-4 border-b-slate-300 hover:bg-slate-50 text-slate-700 font-black text-xs sm:text-sm rounded-2xl shadow-xs flex items-center gap-2 transition active:border-b-2 active:translate-y-0.5"
                  >
                    <Sparkles className="w-4 h-4 text-[#ff9600]" /> Standard Quiz (Mode 3)
                  </button>
                  <button
                    onClick={() => setIsPrintModalOpen(true)}
                    className="px-5 py-2.5 bg-[#1cb0f6] hover:bg-[#24bcff] border-b-4 border-[#1899d6] text-white font-black text-xs sm:text-sm rounded-2xl shadow-sm flex items-center gap-2 transition active:border-b-0 active:translate-y-1 ml-auto"
                  >
                    <Printer className="w-4 h-4" /> Print Material
                  </button>
                </div>
              </div>

              {/* 28 Study & Game Modes Grid categorized */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    All 28 Learning & Game Modes
                  </h2>
                  <span className="text-xs font-semibold text-slate-400">
                    Choose any mode to study this set
                  </span>
                </div>

                {MODE_CATEGORIES.map(category => {
                  const categoryModes = ALL_MODES.filter(m => m.category === category);
                  if (categoryModes.length === 0) return null;

                  return (
                    <div key={category} className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-1">
                        {category}
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                        {categoryModes.map(mode => (
                          <button
                            key={mode.id}
                            onClick={() => {
                              playSound('click');
                              setActiveMode(mode.id);
                            }}
                            className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-300 p-4 rounded-2xl shadow-2xs hover:shadow-md transition-all text-left flex flex-col justify-between group cursor-pointer"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs group-hover:scale-110 transition-transform"
                                style={{ backgroundColor: mode.color }}
                              >
                                <ModeIcon iconName={mode.icon} className="w-5 h-5" />
                              </div>
                              {mode.badge && (
                                <span className="text-[10px] font-black text-slate-400 group-hover:text-indigo-600 bg-slate-100 group-hover:bg-indigo-50 px-2 py-0.5 rounded-full transition">
                                  #{mode.badge}
                                </span>
                              )}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition">
                                {mode.title}
                              </h4>
                              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                {mode.description}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Vocabulary Word List in this Set */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Words in this set ({activeSet.words.length})
                    </h3>
                    <p className="text-xs text-slate-400">
                      Click the speaker icon to listen to native pronunciation
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveMode('dictionary')}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    Open Dictionary View <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {activeSet.words.map((word, idx) => (
                    <div
                      key={word.id || idx}
                      className="py-3.5 flex items-start justify-between gap-4 group hover:bg-slate-50/80 -mx-2 px-2 rounded-xl transition"
                    >
                      <div className="flex items-start gap-3">
                        {/* Word Visual Image or Add Image button */}
                        {word.imageUrl ? (
                          <div
                            onClick={() => setPickingImageWordId(word.id)}
                            className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100 cursor-pointer hover:opacity-90 relative group/img"
                            title="Click to replace image"
                          >
                            <img
                              src={word.imageUrl}
                              alt={word.term}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <span className="absolute inset-0 bg-slate-900/40 text-white text-[9px] font-bold flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition">
                              Change
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => setPickingImageWordId(word.id)}
                            className="w-14 h-14 rounded-xl border border-dashed border-slate-300 text-slate-400 hover:border-indigo-400 hover:text-indigo-600 flex flex-col items-center justify-center gap-0.5 shrink-0 bg-slate-50 transition"
                            title="Add image via search or upload"
                          >
                            <ImageIcon className="w-4 h-4" />
                            <span className="text-[9px] font-bold">+ Image</span>
                          </button>
                        )}

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-slate-900">{word.term}</span>
                            {word.phonetic && (
                              <span className="text-xs font-mono text-slate-400">{word.phonetic}</span>
                            )}
                            {word.partOfSpeech && (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded">
                                {word.partOfSpeech}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">{word.definition}</p>
                          {word.exampleSentence && (
                            <p className="text-[11px] text-slate-400 italic mt-0.5">
                              &ldquo;{word.exampleSentence}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Native Audio Listen */}
                        <button
                          onClick={() => speakWord(word.term, accent)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition"
                          title="Listen to native pronunciation"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>

                        {/* Pronunciation Coach & Recording Comparison */}
                        <button
                          onClick={() => setCoachWord(word)}
                          className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition flex items-center gap-1"
                          title="Record & Compare Pronunciation"
                        >
                          <Mic className="w-4 h-4" />
                          <span className="text-[11px] font-bold hidden md:inline">Practice</span>
                        </button>

                        {word.translation && (
                          <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
                            {word.translation}
                          </span>
                        )}
                        <button
                          onClick={() => handleToggleStarWord(word.id)}
                          className="p-1.5 text-slate-300 hover:text-amber-500 transition"
                          title="Star word"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              word.starred ? 'fill-amber-400 text-amber-500' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-2xs">
              <BookOpen className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800 mb-1">No Vocabulary Sets Found</h3>
              <p className="text-xs text-slate-500 mb-6">
                Create a new set manually or import your vocabulary from Quizlet or CSV.
              </p>
              <button
                onClick={() => {
                  setEditingSet(null);
                  setIsSetModalOpen(true);
                }}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Create First Vocabulary Set
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Create / Edit / Import Set Modal */}
      {isSetModalOpen && (
        <CreateSetModal
          folders={folders}
          initialSet={editingSet}
          onSave={handleSaveSet}
          onClose={() => {
            setIsSetModalOpen(false);
            setEditingSet(null);
          }}
        />
      )}

      {/* Create / Edit Folder Modal */}
      {isFolderModalOpen && (
        <CreateFolderModal
          initialFolder={editingFolder}
          onSave={handleSaveFolder}
          onClose={() => {
            setIsFolderModalOpen(false);
            setEditingFolder(null);
          }}
        />
      )}

      {/* Badges Achievement Modal */}
      {isBadgesModalOpen && (
        <BadgesModal
          stats={userStats}
          onClose={() => {
            setUserStats(loadUserStats());
            setIsBadgesModalOpen(false);
          }}
        />
      )}

      {/* Leaderboard Modal */}
      {isLeaderboardModalOpen && (
        <LeaderboardModal
          stats={userStats}
          onClose={() => setIsLeaderboardModalOpen(false)}
        />
      )}

      {/* Pronunciation Coach Laboratory Modal */}
      {coachWord && (
        <PronunciationCoachModal
          word={coachWord}
          accent={accent}
          onClose={() => {
            setCoachWord(null);
            setUserStats(loadUserStats());
          }}
        />
      )}

      {/* Word-Level Image Picker Modal */}
      {pickingImageWordId && activeSet && (
        <ImagePickerModal
          term={activeSet.words.find(w => w.id === pickingImageWordId)?.term || 'Vocabulary'}
          currentImageUrl={activeSet.words.find(w => w.id === pickingImageWordId)?.imageUrl}
          onSelectImage={url => handleUpdateWordImage(pickingImageWordId, url)}
          onClose={() => setPickingImageWordId(null)}
        />
      )}

      {/* Vocabulary Print Materials Modal */}
      {isPrintModalOpen && activeSet && (
        <PrintModal
          set={activeSet}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}
    </div>
  );
}
