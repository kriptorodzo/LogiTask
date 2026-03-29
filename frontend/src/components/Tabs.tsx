'use client';

import Link from 'next/link';

interface TabItem {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  basePath?: string;
}

export default function Tabs({ tabs, activeTab, onChange, basePath }: TabsProps) {
  return (
    <div className="tabs">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            className={`tab-item ${isActive ? 'active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="tab-count">{tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

interface TabPanelProps {
  children: React.ReactNode;
  isActive: boolean;
}

export function TabPanel({ children, isActive }: TabPanelProps) {
  if (!isActive) return null;
  return <div className="tab-panel">{children}</div>;
}