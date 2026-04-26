import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppShell() {
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-ink-950">
      {/* Ambient Background */}
      <div className="ambient" aria-hidden="true">
        <div className="ambient__grid" />
        <div className="ambient__glow ambient__glow--cyan" />
        <div className="ambient__glow ambient__glow--purple" />
      </div>

      <div className="relative z-10 flex w-full h-full overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div
              key={location.pathname}
              className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
