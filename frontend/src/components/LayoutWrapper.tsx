'use client';

import AppShell from './AppShell';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  return <AppShell>{children}</AppShell>;
}