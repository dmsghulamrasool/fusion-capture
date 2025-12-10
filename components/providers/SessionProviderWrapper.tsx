'use client';

import { SessionProvider } from 'next-auth/react';

export function SessionProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider
      refetchInterval={0} // Disable auto-refetch to prevent loading loops
      refetchOnWindowFocus={false} // Disable refetch on window focus
    >
      {children}
    </SessionProvider>
  );
}

