# TeamPulse — Frontend Intern Assignment

A React + TypeScript team activity dashboard with bug fixes and a fully implemented Search Comments feature.

## Getting Started

```bash
npm install
npm run dev
```

The app opens at `http://localhost:5173`.

## Stack

- React 19 + TypeScript
- Vite 7
- Raw CSS (no Tailwind, no component libraries)

---

## Approach

I worked **bug fixes first, feature second**. Many bugs were interconnected — e.g. the `FilterContext` state mutation (Bug 11) was upstream of the MemberGrid jitter (Bug 9) and stale bookmark count (Bug 10) — so I traced dependency chains rather than fixing symptoms individually. Each commit addresses one bug with a descriptive message.

For the Search Comments feature, I built it as a self-contained overlay (`SearchOverlay` component + `useCommentSearch` hook) triggered from the sidebar or via `Ctrl+K`. The search data comes from the JSONPlaceholder `/comments` API.

### Key Technical Choices

1. **Fetch-once, filter client-side for search.** All 500 comments are fetched once on overlay mount, then filtered in-memory with a 250ms debounce. This avoids hammering the API on every keystroke and makes subsequent searches feel instant. An `AbortController` cancels the fetch on unmount.

2. **Manual virtualisation for search results.** The `SearchOverlay` renders only the visible window of results (`ITEM_HEIGHT × index` positioning with an overscan buffer of 5). This keeps DOM size constant regardless of result count — implemented without any external library per the constraints.

3. **Immutability discipline across bug fixes.** Several bugs (Bugs 4, 11, 18) stemmed from direct mutation — `push()` on shared arrays, direct property assignment on state objects. Every fix uses immutable patterns (spread operator, new object/array creation) so React correctly detects changes.

4. **Stale-closure and lifecycle fixes.** The timer (Bug 13) used a functional `setState` updater to avoid a stale closure. Fetch effects (Bugs 16–17) received `cancelled` flags in their cleanup functions. The debounced search uses a `searchIdRef` counter to discard out-of-order results.

5. **CSS-first responsive layout.** Removed the inline `gridTemplateColumns` style and the dead resize handler (Bugs 14–15) so the existing CSS media queries properly control the grid at each breakpoint. Added a hamburger menu for mobile sidebar access.

### Trade-offs

- **No centralised state management.** Members live in `MemberGrid` local state, the modal receives a copy via props, and `Dashboard` acts as a passthrough. This keeps things simple but means the modal's `onUpdateMember` only updates what `Dashboard` holds — it does not push changes back to the grid or call `saveMember()`. A shared context or lifted state would resolve this.

- **Fixed-height virtualisation.** `ITEM_HEIGHT = 120px` is hardcoded. Expanded items (which show more text on click) may overflow or clip. Dynamic measurement would be more robust but adds significant complexity for a 500-item dataset.

- **Fetch-all doesn't scale.** Loading all comments upfront works for 500 items but wouldn't work for tens of thousands. A server-side search endpoint with pagination would be needed at real scale.

- **No test coverage.** Given the scope and time constraints, I prioritised fixes and the feature over writing tests. This means regressions are caught only by manual testing.

### What I'd Improve with More Time

1. **Fix the tag persistence gap.** Wire `saveMember()` into the `onUpdateMember` handler and either lift member state to `Dashboard` or introduce a `MemberContext` so the grid and modal share the same data source.

2. **Dynamic virtualisation heights.** Measure actual rendered row heights for expanded/collapsed items instead of assuming a fixed 120px.

3. **Tests.** Unit tests for `useCommentSearch` (debounce timing, stale-search cancellation, error states, abort on unmount) and for critical fix areas like `handleAddTag` immutability and `FilterContext` updates. Integration tests for the filter → grid → bookmark count pipeline.

4. **Full focus trap in modals.** The member modal and search overlay focus on mount but don't implement a complete focus trap — Tab can still escape to elements behind the backdrop. Adding `aria-activedescendant` to the search overlay's keyboard nav would also improve screen-reader support.

5. **Optimistic updates with rollback.** `saveMember()` exists in the mock API but is never called from the UI. A full implementation would optimistically update local state, fire the API call, and roll back on failure with a toast notification.

6. **Error boundaries.** A React error boundary wrapping each major section (grid, feed, modal) would prevent a crash in one component from taking down the entire app.

7. **Better UI handling** You have to tap again in notification icon to close it off same like for the header search by creating ref container
---

## Bugs Fixed

18 bugs found and fixed — see `BUG_REPORT.md` for full details with root causes, reproduction steps, and explanations.
