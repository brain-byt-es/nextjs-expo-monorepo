'use client';

import React, { useEffect, useRef } from 'react';
import posthog from 'posthog-js';
import { useSession } from '@/lib/auth-client';
import { getConsent } from '@/lib/cookie-consent';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const initializedRef = useRef(false);

  // Initialize or tear down PostHog based on consent
  useEffect(() => {
    function initPostHog() {
      if (initializedRef.current) return;
      if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

      const consent = getConsent();
      if (!consent?.analytics) return;

      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.posthog.com',
        loaded: (ph) => {
          if (process.env.NODE_ENV === 'development') {
            ph.debug();
          }
        },
      });
      initializedRef.current = true;
    }

    function handleConsentUpdate(e: Event) {
      const consent = (e as CustomEvent)?.detail;
      if (consent?.analytics) {
        initPostHog();
      } else if (initializedRef.current) {
        // User revoked analytics consent — opt out and reset
        posthog.opt_out_capturing();
        posthog.reset();
        initializedRef.current = false;
      }
    }

    // Try to init on mount (consent may already exist)
    initPostHog();

    window.addEventListener('cookie-consent-updated', handleConsentUpdate);
    return () => window.removeEventListener('cookie-consent-updated', handleConsentUpdate);
  }, []);

  // Identify user when session changes
  useEffect(() => {
    if (session?.user?.id && initializedRef.current) {
      posthog.identify(session.user.id, {
        email: session.user.email,
        name: session.user.name,
      });
    }
  }, [session?.user?.id, session?.user?.email, session?.user?.name]);

  return <>{children}</>;
}
