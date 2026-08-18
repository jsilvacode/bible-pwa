import React, { lazy, Suspense, useEffect, useState } from 'react';

const Telemetry = lazy(async () => {
  const [{ Analytics }, { SpeedInsights }] = await Promise.all([
    import('@vercel/analytics/react'),
    import('@vercel/speed-insights/react'),
  ]);

  return {
    default: function TelemetryComponents() {
      return (
        <>
          <Analytics />
          <SpeedInsights />
        </>
      );
    },
  };
});

export default function DeferredTelemetry() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let idleId = null;
    let timeoutId = null;
    const reveal = () => setReady(true);

    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(reveal, { timeout: 4000 });
    } else {
      timeoutId = window.setTimeout(reveal, 2500);
    }

    return () => {
      if (idleId !== null) window.cancelIdleCallback(idleId);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, []);

  if (!ready) return null;

  return (
    <Suspense fallback={null}>
      <Telemetry />
    </Suspense>
  );
}
