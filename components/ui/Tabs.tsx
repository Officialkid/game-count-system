// components/ui/Tabs.tsx
'use client';

import React, { useState, createContext, useContext } from 'react';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (value: string) => void;
  activeColor?: string;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export interface TabsProps {
  defaultValue: string;
  children: React.ReactNode;
  className?: string;
  onValueChange?: (value: string) => void;
  activeColor?: string;
}

export function Tabs({ defaultValue, children, className = '', onValueChange, activeColor }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    onValueChange?.(value);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange, activeColor }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabsList({ children, className = '' }: TabsListProps) {
  return (
    <div className={`flex border-b border-gray-200 ${className}`}>
      {children}
    </div>
  );
}

export interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsTrigger({ value, children, className = '' }: TabsTriggerProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');

  const { activeTab, setActiveTab, activeColor } = context;
  const isActive = activeTab === value;

  return (
    <button
      className={`px-4 py-2 font-medium transition-all duration-200 border-b-2 ${className}`}
      style={{
        borderBottomColor: isActive ? (activeColor || '#6b46c1') : 'transparent',
        color: isActive ? (activeColor || '#6b46c1') : '#6b7280',
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.borderBottomColor = '#d1d5db';
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.borderBottomColor = 'transparent';
      }}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  );
}

export interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className = '' }: TabsContentProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');

  const { activeTab } = context;

  if (activeTab !== value) return null;

  return <div className={`pt-6 ${className}`}>{children}</div>;
}
