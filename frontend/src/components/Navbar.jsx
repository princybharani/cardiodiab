import React from 'react';
import { Heart, LogOut } from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  const userDisplayName = user?.fullName || user?.email?.split('@')[0] || 'Patient';
  const userInitial = userDisplayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo on Left */}
          <div className="flex items-center space-x-3 select-none">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-rose-500 via-rose-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-rose-200">
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xl font-bold bg-gradient-to-r from-rose-600 to-teal-700 bg-clip-text text-transparent">
                  CardioDiab
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-semibold border border-teal-200">
                  AI Triage
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Cardiovascular & Diabetes Risk Stratification
              </p>
            </div>
          </div>

          {/* Right side: ONLY User Profile & Logout Button */}
          <div className="flex items-center space-x-3">
            {user && (
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-teal-600 to-rose-600 text-white font-bold flex items-center justify-center text-[11px] shadow-sm">
                  {userInitial}
                </div>
                <span className="font-semibold text-slate-700 hidden sm:inline max-w-[140px] truncate">
                  {userDisplayName}
                </span>
              </div>
            )}

            {/* Prominent Logout Button */}
            <button
              onClick={onLogout}
              className="px-3.5 py-1.5 text-xs sm:text-sm font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 hover:text-rose-800 border border-rose-200 rounded-xl transition-all shadow-sm flex items-center space-x-1.5"
              title="Log out of CardioDiab"
            >
              <LogOut className="w-4 h-4 text-rose-600" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
