import React, { useState } from 'react';
import { StatsCards } from '../components/StatsCards/StatsCards';
import { MemberGrid } from '../components/MemberGrid/MemberGrid';
import { StandupTimer } from '../components/Timer/StandupTimer';
import { MemberModal } from '../components/MemberModal/MemberModal';
import type { Member } from '../api/mockApi';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  return (
    <div className="dashboard">
      <div className="dashboard__title">
        <h1>Dashboard</h1>
        <p>Team overview and activity at a glance</p>
      </div>
      <div className="dashboard__top">
        <StatsCards />
        <StandupTimer />
      </div>
      <MemberGrid onSelectMember={setSelectedMember} />
      {selectedMember && (
        <MemberModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          onUpdateMember={(updated) => setSelectedMember(updated)}
        />
      )}
    </div>
  );
};
