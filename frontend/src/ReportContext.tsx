import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ReportData } from './types/reportsData';
// Type definitions for the report data


// Type for the context provider props
interface ReportProviderProps {
  children: ReactNode;
}

// Create the context with an initial value
const ReportContext = createContext<{
  reportData: ReportData;
  setReport: (data: ReportData) => void;
} | undefined>(undefined);

// Custom hook to access the ReportContext
export const useReportContext = () => {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReportContext must be used within a ReportProvider');
  }
  return context;
};

// ReportProvider component to provide the context state to the app
export const ReportProvider: React.FC<ReportProviderProps> = ({ children }) => {
  const [reportData, setReportData] = useState<ReportData>({ forecastType: '', pdfPath: '' });

  const setReport = (data: ReportData) => {
    setReportData(data);
  };

  return (
    <ReportContext.Provider value={{ reportData, setReport }}>
      {children}
    </ReportContext.Provider>
  );
};
