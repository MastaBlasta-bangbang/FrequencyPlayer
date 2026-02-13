'use client';
import { App } from 'konsta/react';
import { LanguageProvider } from '@/lib/i18n';

export default function KonstaProvider({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <App theme="ios">
        {children}
      </App>
    </LanguageProvider>
  );
}
