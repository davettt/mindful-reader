import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';

import { useSettingsStore } from './stores/settingsStore';
import Home from './pages/Home';
import Feeds from './pages/Feeds';
import Insights from './pages/Insights';
import Onboarding from './pages/Onboarding';
import Nav from './components/Nav';

export default function App() {
  const { settings, loading, fetch } = useSettingsStore();

  useEffect(() => {
    fetch();
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
