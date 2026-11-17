import React from 'react';
import { Moon, Footprints, Dumbbell, AlertOctagon, CheckCircle2, Clock, ShieldCheck, Heart } from 'lucide-react';

export default function LifestyleAdvice({ lifestyleData }) {
  const { sleep, physical_activity } = lifestyleData || {};

  const isWalkOnly = physical_activity?.decision?.includes('WALK ONLY');
  const isBoth = physical_activity?.decision?.includes('BOTH');
  const isCleared = physical_activity?.decision?.includes('FULL WORKOUT');

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-100">
        <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold mb-1">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          <span>Direct Clinical Prescription</span>
        </div>
        <h3 className="text-xl font-bold text-slate-900">
          Sleep Requirement &amp; Physical Activity (Workout vs. Walk)
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Direct, condition-based guidance answering exactly how much sleep is mandatory and whether you should workout or walk.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. MANDATORY SLEEP REQUIREMENT */}
        <div className="p-6 rounded-2xl bg-indigo-50/60 border border-indigo-200 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-indigo-900">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <Moon className="w-4 h-4 fill-white" />
                </div>
                <h4 className="font-bold text-base text-indigo-950">
                  Mandatory Sleep Amount
                </h4>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-200 text-indigo-900">
                Non-Negotiable
              </span>
            </div>

            {/* Big Mandatory Amount Callout */}
            <div className="p-4 rounded-xl bg-white border border-indigo-200 shadow-xs">
              <div className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                Mandatory Nightly Sleep:
              </div>
              <div className="text-3xl font-extrabold text-indigo-950 mt-1 flex items-baseline space-x-2">
                <span>{sleep?.mandatory_hours || '7 to 8 Hours'}</span>
                <span className="text-xs font-semibold text-slate-500">uninterrupted every night</span>
              </div>
            </div>

            {/* Why it is mandatory for THIS patient */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                Why This Sleep Amount Is Mandatory for Your Report:
              </h5>
              <p className="text-xs text-slate-700 leading-relaxed font-medium bg-white/70 p-3 rounded-xl border border-indigo-100">
                {sleep?.why_mandatory}
              </p>
            </div>
          </div>

          {/* Key sleep action points */}
          <div className="pt-3 border-t border-indigo-200/60 space-y-1.5 text-[11px] text-slate-600">
            {sleep?.key_steps?.slice(1, 4).map((step, idx) => (
              <div key={idx} className="flex items-start space-x-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. SHOULD THE PERSON WORKOUT OR WALK? */}
        <div className={`p-6 rounded-2xl border flex flex-col justify-between space-y-4 ${
          isWalkOnly
            ? 'bg-rose-50/60 border-rose-200'
            : isBoth
            ? 'bg-amber-50/60 border-amber-200'
            : 'bg-emerald-50/60 border-emerald-200'
        }`}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${
                  isWalkOnly ? 'bg-rose-600' : isBoth ? 'bg-amber-500' : 'bg-emerald-600'
                }`}>
                  <Footprints className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-base text-slate-900">
                  Should You Workout or Walk?
                </h4>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                isWalkOnly
                  ? 'bg-rose-200 text-rose-900'
                  : isBoth
                  ? 'bg-amber-200 text-amber-900'
                  : 'bg-emerald-200 text-emerald-900'
              }`}>
                Clinical Triage
              </span>
            </div>

            {/* Big Decision Callout Badge */}
            <div className="p-4 rounded-xl bg-white border shadow-xs space-y-1">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Direct Decision for Your Condition:
              </div>
              <div className={`text-xl sm:text-2xl font-black ${
                isWalkOnly ? 'text-rose-700' : isBoth ? 'text-amber-800' : 'text-emerald-700'
              }`}>
                {physical_activity?.decision}
              </div>
            </div>

            {/* Explanation */}
            <p className="text-xs text-slate-700 leading-relaxed font-medium bg-white/70 p-3 rounded-xl border">
              {physical_activity?.explanation}
            </p>

            {/* Specific Walking vs Workout Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/90 border">
                <div className="font-bold text-slate-900 flex items-center space-x-1.5 mb-0.5">
                  <Footprints className="w-3.5 h-3.5 text-teal-600" />
                  <span>Walking Recommendation:</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {physical_activity?.daily_walking_plan}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white/90 border">
                <div className="font-bold text-slate-900 flex items-center space-x-1.5 mb-0.5">
                  <Dumbbell className="w-3.5 h-3.5 text-slate-700" />
                  <span>Workout Status:</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {physical_activity?.workout_instructions}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
