import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useCommentSearch, type Comment } from '../../hooks/useCommentSearch';
import './SearchOverlay.css';

const ITEM_HEIGHT = 120;
const OVERSCAN = 5;

/* ── Highlight helper ── */
function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;

  const lower = text.toLowerCase();
  const needle = query.trim().toLowerCase();
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let idx = lower.indexOf(needle, cursor);

  while (idx !== -1) {
    if (idx > cursor) {
      parts.push(<span key={cursor}>{text.slice(cursor, idx)}</span>);
    }
    parts.push(
      <mark className="search-highlight" key={`m${idx}`}>
        {text.slice(idx, idx + needle.length)}
      </mark>,
    );
    cursor = idx + needle.length;
    idx = lower.indexOf(needle, cursor);
  }

  if (cursor < text.length) {
    parts.push(<span key={cursor}>{text.slice(cursor)}</span>);
  }

  return <>{parts}</>;
}

/* ── Single result row ── */
const ResultItem = React.memo(function ResultItem({
  comment,
  query,
  isActive,
  isExpanded,
  onToggle,
  onHover,
  itemRef,
}: {
  comment: Comment;
  query: string;
  isActive: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onHover: () => void;
  itemRef: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div
      ref={itemRef}
      className={`search-result${isActive ? ' search-result--active' : ''}${isExpanded ? ' search-result--expanded' : ''}`}
      role="option"
      aria-selected={isActive}
      onClick={onToggle}
      onMouseEnter={onHover}
    >
      <div className="search-result__header">
        <span className="search-result__name">{comment.name}</span>
        <span className="search-result__email">{comment.email}</span>
      </div>
      <div className="search-result__body">
        <HighlightedText text={comment.body} query={query} />
      </div>
    </div>
  );
});

/* ── Main overlay ── */
export const SearchOverlay: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { query, setQuery, results, isLoading, error } = useCommentSearch();
  const [activeIndex, setActiveIndex] = useState(-1);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLDivElement | null>(null);

  // Virtualisation state
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Focus input when overlay opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure the overlay is rendered
      requestAnimationFrame(() => inputRef.current?.focus());
      setActiveIndex(-1);
      setExpandedIds(new Set());
    }
  }, [isOpen]);

  // Reset activeIndex when results change
  useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

  // Measure container height
  useEffect(() => {
    if (!listRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setContainerHeight(entry.contentRect.height);
    });
    observer.observe(listRef.current);
    return () => observer.disconnect();
  }, [isOpen]);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const itemTop = activeIndex * ITEM_HEIGHT;
    const itemBottom = itemTop + ITEM_HEIGHT;
    const list = listRef.current;

    if (itemTop < list.scrollTop) {
      list.scrollTop = itemTop;
    } else if (itemBottom > list.scrollTop + containerHeight) {
      list.scrollTop = itemBottom - containerHeight;
    }
  }, [activeIndex, containerHeight]);

  const handleScroll = useCallback(() => {
    if (listRef.current) {
      setScrollTop(listRef.current.scrollTop);
    }
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (results.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % results.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        const comment = results[activeIndex];
        setExpandedIds((prev) => {
          const next = new Set(prev);
          if (next.has(comment.id)) {
            next.delete(comment.id);
          } else {
            next.add(comment.id);
          }
          return next;
        });
      }
    },
    [results, activeIndex, onClose],
  );

  // Close on backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  if (!isOpen) return null;

  // Virtual window calculation
  const totalHeight = results.length * ITEM_HEIGHT;
  const startIdx = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
  const endIdx = Math.min(
    results.length,
    Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + OVERSCAN,
  );
  const visibleResults = results.slice(startIdx, endIdx);

  return (
    <div
      className="search-overlay"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="Search comments"
    >
      <div className="search-overlay__panel">
        {/* Search input */}
        <div className="search-overlay__input-row">
          <span className="search-overlay__icon" aria-hidden="true">🔍</span>
          <input
            ref={inputRef}
            className="search-overlay__input"
            type="text"
            placeholder="Search comments by body text…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search comments"
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button
              className="search-overlay__clear"
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
          <kbd className="search-overlay__kbd">Esc</kbd>
        </div>

        {/* Results area */}
        <div
          className="search-overlay__results"
          ref={listRef}
          onScroll={handleScroll}
          role="listbox"
          aria-label="Search results"
        >
          {isLoading && (
            <div className="search-overlay__status">
              <div className="search-overlay__spinner" />
              <span>Searching…</span>
            </div>
          )}

          {error && !isLoading && (
            <div className="search-overlay__status search-overlay__status--error">
              <span>⚠️ {error}</span>
            </div>
          )}

          {!isLoading && !error && query.trim() && results.length === 0 && (
            <div className="search-overlay__status">
              <span>No comments match "<strong>{query.trim()}</strong>"</span>
            </div>
          )}

          {!isLoading && !error && !query.trim() && (
            <div className="search-overlay__status search-overlay__status--hint">
              <span>Start typing to search </span>
            </div>
          )}

          {results.length > 0 && !isLoading && (
            <>
              <div className="search-overlay__count">
                {results.length} result{results.length !== 1 ? 's' : ''}
              </div>
              <div
                className="search-overlay__virtual-list"
                style={{ height: totalHeight, position: 'relative' }}
              >
                {visibleResults.map((comment, i) => {
                  const realIndex = startIdx + i;
                  return (
                    <div
                      key={comment.id}
                      style={{
                        position: 'absolute',
                        top: realIndex * ITEM_HEIGHT,
                        left: 0,
                        right: 0,
                        height: ITEM_HEIGHT,
                      }}
                    >
                      <ResultItem
                        comment={comment}
                        query={query}
                        isActive={realIndex === activeIndex}
                        isExpanded={expandedIds.has(comment.id)}
                        onToggle={() =>
                          setExpandedIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(comment.id)) next.delete(comment.id);
                            else next.add(comment.id);
                            return next;
                          })
                        }
                        onHover={() => setActiveIndex(realIndex)}
                        itemRef={(el) => {
                          if (realIndex === activeIndex) activeItemRef.current = el;
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
