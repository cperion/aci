// No more atomic contexts needed - all simplified to hooks!

// Combined provider component for easy setup - now just passes through children
import React, { type ReactNode } from 'react';

export function AtomicContextProviders({ children }: { children: ReactNode }) {
  return <>{children}</>;
}