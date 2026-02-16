import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ReportData } from './types/reportsData';

interface ReportProviderProps {
  children: ReactNode;
}


const ReportContext = createContext<{
  reportData: ReportData;
  setReport: (data: ReportData) => void;
} | undefined>(undefined);

export const useReportContext = () => {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReportContext must be used within a ReportProvider');
  }
  return context;
};

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
