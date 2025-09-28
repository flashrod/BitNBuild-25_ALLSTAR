import React, { createContext, useContext, useState, useCallback } from 'react';

const DataRefreshContext = createContext();

export const useDataRefresh = () => useContext(DataRefreshContext);

export const DataRefreshProvider = ({ children }) => {
  const [refreshCount, setRefreshCount] = useState(0);
  const refresh = useCallback(() => {
    setRefreshCount((c) => c + 1);
  }, []);
  return (
    <DataRefreshContext.Provider value={{ refresh, refreshCount }}>
      {children}
    </DataRefreshContext.Provider>
  );
};