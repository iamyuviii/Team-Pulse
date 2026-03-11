import React, { useState, useEffect } from 'react';
import { NotificationDropdown } from '../NotificationDropdown/NotificationDropdown';
import { searchMembers } from '../../api/mockApi';
import type { Member } from '../../api/mockApi';
import './Header.css';

function computeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export const Header: React.FC<{ onNavigate: (page: string) => void; onToggleSidebar?: () => void }> = ({ onNavigate, onToggleSidebar }) => {
  // const [query, setQuery] = useState<string | undefined>();
  
  // symptom - there was a warning in the console 
  // Root cause - as we were trying to set the query state to undefined which was not the expected
  //fix - updated the state with empty string
  const [query, setQuery] = useState<string>(''); 
  
  // const [greeting, setGreeting] = useState(''); no need to have the greeting in the state as it is not changing on user interaction 
  const greeting = computeGreeting();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchResults, setSearchResults] = useState<Member[]>([]);

// setGreeting(computeGreeting());
// it was rededering again and again which is in a infinit loop so i updated it

useEffect(() => {
  if (!query) {
    setSearchResults([]);
    return;
  }
  let cancelled = false;
  const timer = setTimeout(() => {
    searchMembers(query).then(results => {
      if (!cancelled) setSearchResults(results);
    });
  }, 300);
  return () => {
    cancelled = true;
    clearTimeout(timer);
  };
}, [query]);
// symptom - Stale results flashing which was showing the old results from a previous search
//issue - Stale results flashing which was showing the old results from a previous search 
// fix - Clears the pending setTimeout and Sets a cancelled flag to ignore results from outdated searches

  return (
    <header className="header">
      <div className="header__left">
        {onToggleSidebar && (
          <button className="header__menu-btn" onClick={onToggleSidebar} aria-label="Toggle menu">
            <span className="header__menu-icon" />
          </button>
        )}
        <h1 className="header__logo" onClick={() => onNavigate('dashboard')}>TeamPulse</h1>
      </div>
      <div className="header__center">
        <div className="header__search-container">
          <input
            className="header__search"
            type="text"
            placeholder="Search members..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {searchResults.length > 0 && query && (
            <div className="header__search-results">
              {searchResults.map(m => (
                <div key={m.id} className="header__search-result-item">
                  <strong>{m.name}</strong>
                  <span>{m.role}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="header__right">
        <span className="header__greeting">{greeting}, John</span>
        <button
          className="header__notification-btn"
          onClick={() => setShowNotifications(!showNotifications)}
        >
          🔔
        </button>
        {showNotifications && <NotificationDropdown />}
        <div className="header__avatar">JD</div>
      </div>
    </header>
  );
};
