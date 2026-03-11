# FEATURE NOTES — Search Comments

## How I Approached It

### Fetch Once, Search Locally

Rather than hitting the API on every keystroke, I fetch all 500 comments a single time when the hook mounts and hold them in state. After that, every search is just a `filter()` over the local array — instant and no network dependency during typing.

The fetch uses an `AbortController` so if the component unmounts before the response comes back (say the user navigates away), we don't end up with a state update on an unmounted component.

### Debouncing Without Libraries

I didn't reach for lodash or any utility library. Instead, I used a plain `setTimeout` inside a `useEffect` with a 250ms delay. Every time the query changes, the previous timer gets cleared and a new one starts. This means the actual filtering only fires after the user stops typing for a quarter second — keeps things snappy without doing unnecessary work.

### Preventing Stale Results (The Race Condition Problem)

This was the trickiest part to get right. Imagine typing "vol", pausing, then continuing to "voluptatem". Without protection, the results for "vol" could arrive *after* "voluptatem" and overwrite them — showing the wrong results for a flash.

I solved this with a `searchIdRef` (a simple incrementing counter). Every time a new search kicks off, it increments the counter and captures the current value. When the debounced callback fires, it checks whether its captured ID still matches the latest one. If it doesn't, it bails out silently. No stale results ever make it to the screen.

### Highlighting Matches in the DOM

Each result shows the `name`, `email`, and `body` fields. The body text highlights the matched portion using a `HighlightedText` component that walks through the string, finds every occurrence of the search term, and splits it into alternating `<span>` and `<mark>` elements.

No `dangerouslySetInnerHTML` — everything is rendered as proper React elements. The highlighting updates automatically because the component re-renders whenever the query changes.

### Keyboard Navigation

The overlay supports full keyboard control:
- **Arrow Down / Up** moves a visible highlight through the results, wrapping around at both ends.
- **Enter** expands or collapses the currently highlighted result (shows the full body text).
- **Escape** closes the overlay entirely.

The active index resets to -1 whenever results change, so you never end up with a stale highlight pointing at the wrong item after a new search.


### Loading, Error, and Empty States

The overlay handles all the edge cases:
- **Loading** — a spinner shows while the initial fetch is in progress or while a debounced search is pending.
- **Error** — if the fetch fails, a friendly message appears instead of a blank screen.
- **Empty query** — a hint tells you to start typing.
- **No matches** — tells you explicitly that nothing was found.
- **Clearing the input** — instantly clears results, resets loading/error, and shows the hint again.

### Cleanup on Unmount

The fetch `AbortController` aborts in-flight requests, and the debounce timer gets cleared in the effect cleanup. So navigating away mid-search produces no warnings, no errors, and no stale state when you come back.

## Files Involved

| File | Purpose |
|------|---------|
| `src/hooks/useCommentSearch.ts` | Custom hook — fetch, debounce, filter, race-condition guard |
| `src/components/Search/SearchOverlay.tsx` | UI — overlay, input, results list, highlighting, keyboard nav, virtualisation |
| `src/components/Search/SearchOverlay.css` | Styling — overlay animations, spinner, highlight marks, scrollbar |