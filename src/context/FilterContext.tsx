import React, { createContext, useContext, useState } from 'react';

export interface FilterState {
  status: string;
  role: string;
}

interface FilterContextType {
  filters: FilterState;
  updateFilter: (key: keyof FilterState, value: string) => void;
}

const FilterContext = createContext<FilterContextType | null>(null);

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    role: '',
  });

  // const updateFilter = (key: keyof FilterState, value: string) => {
  //   (filters as unknown as Record<string, string>)[key] = value;
  //   setFilters(filters);
  // };
  //syptom - radio button were not updating on the UI when change in change in status
  // root cause - state was being mutated directly instead of creating a new object reference, which prevented the react from remembering the change and re-rendering the component.
  // fix - create a new object reference to copy the existing filters and update the specific key with the new value, then set the new object as the state.

  const updateFilter = (key: keyof FilterState, value: string) => {
  setFilters(prev => ({ ...prev, [key]: value }));
};

  return (
    <FilterContext.Provider value={{ filters, updateFilter }}>
      {children}
    </FilterContext.Provider>
  );
};

export function useFilters(): FilterContextType {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within a FilterProvider');
  return ctx;
}
