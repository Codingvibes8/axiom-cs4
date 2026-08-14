'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAxiomStore } from '@/lib/store';
import { Secret } from '@/lib/types';
import { Search, Key, X, Tag, Lock, Globe, Server, Cpu, ChevronRight } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface SearchResult {
  id: string;
  type: 'secret';
  label: string;
  sublabel: string;
  env: string;
  category?: string;
  tags: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tab: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const ENV_COLORS: Record<string, string> = {
  production: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  staging: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  development: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'API Key': <Key className="w-3.5 h-3.5" />,
  'Database': <Server className="w-3.5 h-3.5" />,
  'OAuth': <Lock className="w-3.5 h-3.5" />,
  'AI / LLM': <Cpu className="w-3.5 h-3.5" />,
  'Cloud / Infra': <Globe className="w-3.5 h-3.5" />,
  'General': <Key className="w-3.5 h-3.5" />,
};

function fuzzyMatch(needle: string, haystack: string): boolean {
  if (!needle) return true;
  const n = needle.toLowerCase();
  const h = haystack.toLowerCase();
  // Simple substring match for speed; could upgrade to Levenshtein
  return h.includes(n);
}

function scoreResult(query: string, result: SearchResult): number {
  const q = query.toLowerCase();
  let score = 0;
  if (result.label.toLowerCase().startsWith(q)) score += 3;
  else if (result.label.toLowerCase().includes(q)) score += 2;
  if (result.sublabel.toLowerCase().includes(q)) score += 1;
  if (result.tags.some((t) => t.toLowerCase().includes(q))) score += 1;
  return score;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { secrets, currentEnv, setActiveTab } = useAxiomStore();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build search index from secrets only (per user preference)
  const buildResults = useCallback(
    (q: string): SearchResult[] => {
      const matches: SearchResult[] = [];

      for (const s of secrets) {
        const keyMatch = fuzzyMatch(q, s.key);
        const tagMatch = s.tags.some((t) => fuzzyMatch(q, t));
        const envMatch = fuzzyMatch(q, s.environment);
        const catMatch = s.category ? fuzzyMatch(q, s.category) : false;
        const descMatch = s.description ? fuzzyMatch(q, s.description) : false;

        if (keyMatch || tagMatch || envMatch || catMatch || descMatch) {
          matches.push({
            id: s.id,
            type: 'secret',
            label: s.key,
            sublabel: s.description || s.category || 'Secret',
            env: s.environment,
            category: s.category,
            tags: s.tags,
          });
        }
      }

      if (!q) return matches.slice(0, 12);

      return matches
        .map((r) => ({ result: r, score: scoreResult(q, r) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ result }) => result)
        .slice(0, 12);
    },
    [secrets]
  );

  // Recompute on query change
  useEffect(() => {
    setResults(buildResults(query));
    setSelectedIdx(0);
  }, [query, buildResults]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIdx]) {
        handleSelect(results[selectedIdx]);
      }
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIdx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIdx]);

  const handleSelect = (result: SearchResult) => {
    setActiveTab('secrets');
    onNavigate?.('secrets');
    onClose();
  };

  if (!isOpen) return null;

  const hasResults = results.length > 0;
  const showEmpty = query.length > 0 && !hasResults;

  return (
    <>
      {/* Backdrop */}
      <div
        data-testid="command-palette-backdrop"
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Palette Panel */}
      <div
        data-testid="command-palette"
        role="dialog"
        aria-label="Search secrets"
        aria-modal="true"
        className="fixed top-[15vh] left-1/2 -translate-x-1/2 z-50 w-full max-w-xl
                   animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="rounded-2xl border border-zinc-700/80 bg-zinc-900/95 shadow-2xl shadow-black/60 backdrop-blur-xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-800">
            <Search className="w-4 h-4 text-zinc-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search secrets by key, tag, environment…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500
                         outline-none caret-emerald-400"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              aria-autocomplete="list"
              aria-controls="cmd-results"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px]
                            font-mono text-zinc-500 bg-zinc-800 border border-zinc-700">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto overscroll-contain">
            {hasResults && (
              <>
                {/* Section header */}
                <div className="px-4 pt-3 pb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Secrets
                    <span className="ml-2 text-zinc-600 font-normal normal-case tracking-normal">
                      {results.length} result{results.length !== 1 ? 's' : ''}
                    </span>
                  </span>
                </div>

                <ul
                  id="cmd-results"
                  ref={listRef}
                  role="listbox"
                  aria-label="Search results"
                  className="pb-2"
                >
                  {results.map((result, idx) => {
                    const isSelected = idx === selectedIdx;
                    const icon = CATEGORY_ICONS[result.category || 'General'] ?? CATEGORY_ICONS['General'];
                    const envColor = ENV_COLORS[result.env] || ENV_COLORS['development'];

                    return (
                      <li
                        key={result.id}
                        data-testid="search-result-item"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelect(result)}
                        onMouseEnter={() => setSelectedIdx(idx)}
                        className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl cursor-pointer
                                    transition-colors group
                                    ${isSelected
                                      ? 'bg-emerald-600/20 border border-emerald-500/30'
                                      : 'border border-transparent hover:bg-zinc-800/50'
                                    }`}
                      >
                        {/* Category icon */}
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0
                                         ${isSelected
                                           ? 'bg-emerald-600/30 text-emerald-300'
                                           : 'bg-zinc-800 text-zinc-400'
                                         }`}>
                          {icon}
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-mono font-semibold truncate
                                           ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
                            {result.label}
                          </div>
                          {result.sublabel && (
                            <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                              {result.sublabel}
                            </div>
                          )}
                        </div>

                        {/* Tags */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {result.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px]
                                         font-mono text-zinc-400 bg-zinc-800 border border-zinc-700/50"
                            >
                              <Tag className="w-2.5 h-2.5" />
                              {tag}
                            </span>
                          ))}
                          <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase
                                            tracking-wider border ${envColor}`}>
                            {result.env.slice(0, 3)}
                          </span>
                        </div>

                        <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-opacity
                                                   ${isSelected ? 'text-emerald-400 opacity-100' : 'opacity-0'}`} />
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            {/* Empty state */}
            {showEmpty && (
              <div
                data-testid="search-empty-state"
                className="flex flex-col items-center justify-center py-12 px-4 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-3">
                  <Search className="w-5 h-5 text-zinc-600" />
                </div>
                <p className="text-sm font-semibold text-zinc-400">No secrets found</p>
                <p className="text-xs text-zinc-600 mt-1">
                  Try searching by key name, tag, or environment
                </p>
              </div>
            )}

            {/* Initial state — show hint */}
            {!query && results.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <p className="text-xs text-zinc-500">
                  Start typing to search across all secrets
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-4 py-2.5
                           border-t border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center gap-3 text-[10px] text-zinc-500">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded text-[9px] bg-zinc-800 border border-zinc-700">↑↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded text-[9px] bg-zinc-800 border border-zinc-700">↵</kbd>
                jump to vault
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded text-[9px] bg-zinc-800 border border-zinc-700">esc</kbd>
                close
              </span>
            </div>
            <span className="text-[10px] font-mono text-zinc-600">
              {secrets.length} total secrets
            </span>
          </div>
        </div>
      </div>
    </>
  );
};
