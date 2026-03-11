import React, { useState, useEffect } from 'react';
import { fetchMembers } from '../../api/mockApi';
import { MemberCard } from '../MemberCard/MemberCard';
import { useFilters } from '../../context/FilterContext';
import type { Member } from '../../api/mockApi';
import './MemberGrid.css';

interface MemberGridProps {
  onSelectMember: (member: Member) => void;
}

export const MemberGrid: React.FC<MemberGridProps> = ({ onSelectMember }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [bookmarks, setBookmarks] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { filters } = useFilters();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchMembers(filters)
      .then(data => {
        if (!cancelled) {
          setMembers(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Failed to load members. Please try again later.');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [filters.status, filters.role]);

  const handleBookmark = (id: number) => {
    const next = new Set(bookmarks);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setBookmarks(next);
  };

  const displayMembers = members.map(m => ({
    ...m,
    bookmarked: bookmarks.has(m.id)
  }));
//sypmtoms - taking an example if  you bookmark 3 members and apply filter to on leave  which will show only 1 but the count still says bookmarked 3 even though only 0 or 1 of those bookmarked members may be visible.
// root cause - the bookmarked count is being calculated based on the total members array instead of the filtered members array
// fix - calculate the bookmarked count based on the displayMembers array which is the filtered members array

 return (
    <div className="member-grid">
      <div className="member-grid__header">
        <h2>Team Members ({displayMembers.length})</h2>
       <span>Bookmarked: {displayMembers.filter(m => m.bookmarked).length}</span>
       
      </div>
      <div className="member-grid__cards">
        {loading && <p className="member-grid__loading">Loading members...</p>}
        {error && !loading && <p className="member-grid__error">{error}</p>}
        {!loading && !error && displayMembers.length === 0 && <p className="member-grid__empty">No members found</p>}
        
        {!loading && !error && displayMembers.map(member => (
          <MemberCard
            key={member.id}
            member={member}
            onBookmark={handleBookmark}
            onClick={onSelectMember}
          />
        ))}
      </div>
    </div>
  );
};
