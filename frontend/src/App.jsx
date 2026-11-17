import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import UploadSection from './components/UploadSection';
import AdaptiveMCQModal from './components/AdaptiveMCQModal';
import RiskReportCard from './components/RiskReportCard';
import DietaryGuidance from './components/DietaryGuidance';
import LifestyleAdvice from './components/LifestyleAdvice';
import DoctorDiscussion from './components/DoctorDiscussion';
import DisclaimerBanner from './components/DisclaimerBanner';
import AuthPage from './components/AuthPage';

import {
  getCurrentUser,
  signOut,
} from './supabaseClient';

import {
  getSampleReports,
  uploadReportFile,
  parseTextReport,
  analyzeRisk,
} from './api';

export default function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [sampleReports, setSampleReports] = useState([]);

  // Authenticated User State
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Step Data
  const [parsedData, setParsedData] = useState(null);
  const [finalReport, setFinalReport] = useState(null);

  // Check auth and initial presets on app launch
  useEffect(() => {
    async function init() {
      try {
        const u = await getCurrentUser();
        setUser(u);

        const samples = await getSampleReports();
        setSampleReports(samples);
      } catch (err) {
        console.warn('Initial bootstrap check:', err);
      } finally {
        setIsInitializing(false);
      }
    }
    init();
  }, []);

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    setCurrentStep(1);
    setParsedData(null);
    setFinalReport(null);
    setErrorMessage('');
  };

  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
  };

  const handleFileUpload = async (file) => {
    setIsProcessing(true);
    setErrorMessage('');
    try {
      const data = await uploadReportFile(file, user?.id);
      setParsedData(data);
      setCurrentStep(2);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to extract biomarkers from file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectSample = async (sample) => {
    setIsProcessing(true);
    setErrorMessage('');
    try {
      const data = await parseTextReport(sample.title, sample.text, user?.id);
      setParsedData(data);
      setCurrentStep(2);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to parse preset scenario.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleParseText = async (title, text) => {
    setIsProcessing(true);
    setErrorMessage('');
    try {
      const data = await parseTextReport(title, text, user?.id);
      setParsedData(data);
      setCurrentStep(2);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to parse text report.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMCQSubmit = async (answers) => {
    if (!parsedData) return;
    setIsAnalyzing(true);
    setErrorMessage('');
    try {
      const payload = {
        report_id: parsedData.report_id,
        user_id: user?.id,
        biomarkers: parsedData.biomarkers,
        mcq_answers: answers,
        demographics: parsedData.demographics || {},
        ecg_findings: parsedData.ecg_findings || []
      };

      const report = await analyzeRisk(payload);
      setFinalReport(report);
      setCurrentStep(3);
      window.scrollTo({ top: 300, behavior: 'smooth' });
    } catch (err) {
      setErrorMessage(err.message || 'Risk analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setParsedData(null);
    setFinalReport(null);
    setErrorMessage('');
  };

  const handlePrint = () => {
    window.print();
  };

  // 1. Loading splash
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-500/30 border-t-teal-400 rounded-full animate-spin" />
      </div>
    );
  }

  // 2. If user is NOT logged in: 1st show Sign Up / Sign In Page!
  if (!user) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  // 3. If user IS logged in: show CardioDiab Dashboard with ONLY Logout at top right
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-teal-100 selection:text-teal-900">
      <div>
        <Navbar user={user} onLogout={handleLogout} />

        <HeroBanner currentStep={currentStep} />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold flex items-center justify-between">
              <span>⚠️ {errorMessage}</span>
              <button
                onClick={() => setErrorMessage('')}
                className="text-rose-600 hover:text-rose-900 ml-4 font-bold"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* STEP 1: Upload */}
          {currentStep === 1 && (
            <UploadSection
              onFileUpload={handleFileUpload}
              onSelectSample={handleSelectSample}
              onParseText={handleParseText}
              isProcessing={isProcessing}
              sampleReports={sampleReports}
            />
          )}

          {/* STEP 2: Auto-Extracted Values & Smart Adaptive MCQs */}
          {currentStep === 2 && parsedData && (
            <AdaptiveMCQModal
              parsedData={parsedData}
              onComplete={handleMCQSubmit}
              isAnalyzing={isAnalyzing}
            />
          )}

          {/* STEP 3: Comprehensive Clinical Risk Report */}
          {currentStep === 3 && finalReport && (
            <div className="space-y-8 animate-fadeIn">
              {/* Traffic Light Urgency & Condition Risk Gauges */}
              <RiskReportCard reportData={finalReport} />

              {/* Precise Dietary Guidance */}
              <DietaryGuidance
                dietaryData={finalReport.dietary_guidance}
                urgencyLevel={finalReport.urgency?.urgency_level}
              />

              {/* Lifestyle, Sleep, Activity & Stress */}
              <LifestyleAdvice
                lifestyleData={finalReport.lifestyle_advice}
                urgencyLevel={finalReport.urgency?.urgency_level}
              />

              {/* Doctor Discussion Points & Recommended Tests */}
              <DoctorDiscussion
                followUpTests={finalReport.follow_up_tests}
                urgencyLevel={finalReport.urgency?.urgency_level}
                onPrint={handlePrint}
                onReset={handleReset}
              />
            </div>
          )}
        </main>
      </div>

      {/* Medical Disclaimer Banner */}
      <DisclaimerBanner />
    </div>
  );
}
