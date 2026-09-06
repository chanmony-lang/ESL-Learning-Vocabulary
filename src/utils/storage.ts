import { VocabSet, Folder, VocabWord } from '../types';
import { INITIAL_SETS, INITIAL_FOLDERS } from '../data/defaultSets';

const SETS_STORAGE_KEY = 'esl_vocab_sets_v1';
const FOLDERS_STORAGE_KEY = 'esl_vocab_folders_v1';
const ACCENT_KEY = 'esl_speech_accent_v1';

export function loadStoredSets(): VocabSet[] {
  try {
    const raw = localStorage.getItem(SETS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SETS_STORAGE_KEY, JSON.stringify(INITIAL_SETS));
      return INITIAL_SETS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_SETS;
  } catch {
    return INITIAL_SETS;
  }
}

export function saveStoredSets(sets: VocabSet[]): void {
  try {
    localStorage.setItem(SETS_STORAGE_KEY, JSON.stringify(sets));
  } catch (err) {
    console.error('Failed to save sets to localStorage', err);
  }
}

export function loadStoredFolders(): Folder[] {
  try {
    const raw = localStorage.getItem(FOLDERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(INITIAL_FOLDERS));
      return INITIAL_FOLDERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_FOLDERS;
  } catch {
    return INITIAL_FOLDERS;
  }
}

export function saveStoredFolders(folders: Folder[]): void {
  try {
    localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders));
  } catch (err) {
    console.error('Failed to save folders to localStorage', err);
  }
}

export function getSavedAccent(): string {
  try {
    return localStorage.getItem(ACCENT_KEY) || 'en-US';
  } catch {
    return 'en-US';
  }
}

export function saveAccent(accent: string): void {
  try {
    localStorage.setItem(ACCENT_KEY, accent);
  } catch {}
}

export function parseQuizletImportText(
  text: string,
  termDefSeparator: string = '\t',
  cardSeparator: string = '\n'
): Partial<VocabWord>[] {
  const lines = text.split(cardSeparator === '\\n' || cardSeparator === '\n' ? /\r?\n/ : cardSeparator);
  const words: Partial<VocabWord>[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let sep = termDefSeparator;
    if (sep === '\\t') sep = '\t';

    let parts: string[] = [];
    if (trimmed.includes(sep)) {
      parts = trimmed.split(sep);
    } else if (trimmed.includes('\t')) {
      parts = trimmed.split('\t');
    } else if (trimmed.includes(' - ')) {
      parts = trimmed.split(' - ');
    } else if (trimmed.includes(': ')) {
      parts = trimmed.split(': ');
    } else if (trimmed.includes(',')) {
      parts = trimmed.split(',');
    } else {
      parts = [trimmed, ''];
    }

    const term = (parts[0] || '').trim();
    const definition = (parts.slice(1).join(' ') || '').trim();

    if (term) {
      words.push({
        id: 'w_' + Math.random().toString(36).substring(2, 9),
        term,
        definition: definition || 'ESL Vocabulary item',
        starred: false,
        masteryLevel: 0,
      });
    }
  }

  return words;
}

// Aliases for seamless imports
export const loadSavedSets = loadStoredSets;
export const saveSets = saveStoredSets;
export const loadSavedFolders = loadStoredFolders;
export const saveFolders = saveStoredFolders;
export const parseImportedText = parseQuizletImportText;
