'use client';

import { useEffect } from 'react';

/**
 * Polls /version.txt every 60 s.  When the deployed git SHA changes the
 * page force-reloads so users always see the latest build after a deploy.
 */
export function useVersionCheck() {
  useEffect(() => {
    let currentVersion: string | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function fetchVersion(): Promise<string | null> {
      try {
        const res = await fetch(`/version.txt?v=${Date.now()}`);
        if (!res.ok) return null;
        return (await res.text()).trim();
      } catch {
        return null;
      }
    }

    async function check() {
      const version = await fetchVersion();
      if (!version) return;
      if (currentVersion === null) {
        currentVersion = version;
        return;
      }
      if (version !== currentVersion) {
        window.location.reload();
      }
    }

    fetchVersion().then((v) => {
      if (v) currentVersion = v;
    });

    timer = setInterval(check, 60_000);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, []);
}
