import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

import { useSettingsStore } from './stores/settingsStore';
import Home from './pages/Home';
import Feeds from './pages/Feeds';
import Insights from './pages/Insights';
import Onboarding from './pages/Onboarding';
import Nav from './components/Nav';

export default function App() {
  const { settings, loading, fetch } = useSettingsStore();
  const [buildStale, setBuildStale] = useState(false);

  useEffect(() => {
    fetch();
    void window
      .fetch('/api/build-status')
      .then((r) => r.json())
      .then((d) => setBuildStale(d.stale === true))
      .catch(() => {});
  }, [fetch]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-serif text-lg text-stone-400">Loading...</p>
      </div>
    );
  }

  if (!settings?.onboardingComplete) {
    return <Onboarding />;
  }

  return (
    <BrowserRouter>
      <div className="mx-auto min-h-screen max-w-2xl px-4 pb-24">
        {buildStale && (
          <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Source files have changed since the last build. Run{' '}
            <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">
              npm run restart:pm2
            </code>{' '}
            to apply updates.
          </div>
        )}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/feeds" element={<Feeds />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Nav />
      </div>
    </BrowserRouter>
  );
}
