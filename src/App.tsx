import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ParticipantLogin } from './components/ParticipantLogin';
import { ExamScreen } from './components/ExamScreen';
import { ResultScreen } from './components/ResultScreen';
import { LeaderboardScreen } from './components/LeaderboardScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { ParticipantManagement } from './components/ParticipantManagement';
import { AdminLoginModal } from './components/AdminLoginModal';
import { Participant, Question, ExamResult, ExamConfig, SheetSyncStatus } from './types';
import { DEFAULT_EXAM_CONFIG, SPREADSHEET_URL } from './data/defaultData';
import {
  initAuth,
  googleSignIn,
} from './lib/firebase';
import {
  fetchDataPesertaFromSheet,
  fetchDataLoginFromSheet,
  fetchQuestionsFromSheet,
  fetchResultsFromSheet,
  getCachedParticipants,
  getCachedDataPeserta,
  getCachedDataLogin,
  saveCachedDataPeserta,
  saveCachedDataLogin,
  saveCachedParticipants,
  getCachedQuestions,
  getCachedResults,
  saveCachedQuestions,
  saveCachedResults,
  clearCachedResults,
  clearAllResultsFromSheet,
} from './lib/sheetsService';
import { AlertCircle, CheckCircle2, FileSpreadsheet, Lock, Smartphone } from 'lucide-react';

export default function App() {
  // Mode: Participant vs Admin
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminTab, setAdminTab] = useState<'dashboard' | 'peserta' | 'juara'>('dashboard');
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);

  // Participant & Exam Session
  const [currentParticipant, setCurrentParticipant] = useState<Participant | null>(null);
  const [isExamActive, setIsExamActive] = useState<boolean>(false);
  const [activeResult, setActiveResult] = useState<ExamResult | null>(null);
  const [resultDeliveredToSheet, setResultDeliveredToSheet] = useState<boolean>(false);

  // App Data
  const [dataPeserta, setDataPeserta] = useState<Participant[]>(getCachedDataPeserta());
  const [dataLogin, setDataLogin] = useState<Participant[]>(getCachedDataLogin());
  const [participants, setParticipants] = useState<Participant[]>(getCachedParticipants());
  const [questions, setQuestions] = useState<Question[]>(getCachedQuestions());
  const [results, setResults] = useState<ExamResult[]>(getCachedResults());
  const [config, setConfig] = useState<ExamConfig>(DEFAULT_EXAM_CONFIG);

  // Google Sheets Connection & Sync Status
  const [syncStatus, setSyncStatus] = useState<SheetSyncStatus>({
    isConnected: false,
    userEmail: null,
    lastSynced: null,
    isLoading: false,
    error: null,
  });

  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sync with Google Sheets:
  // - Data_Peserta -> Aktivitas & Status Peserta
  // - Data_Login   -> Menu Data Peserta
  // - Soal_Test    -> Bank Soal
  // - Hasil_Jawaban -> Skor & Peringkat Juara
  const syncDataFromSheets = useCallback(async (silent: boolean = false) => {
    setSyncStatus((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const [fetchedPeserta, fetchedLogin, fetchedQuestions, fetchedResults] = await Promise.all([
        fetchDataPesertaFromSheet(),
        fetchDataLoginFromSheet(),
        fetchQuestionsFromSheet(),
        fetchResultsFromSheet(),
      ]);

      if (fetchedPeserta.length > 0) {
        setDataPeserta(fetchedPeserta);
        saveCachedDataPeserta(fetchedPeserta);
      }
      if (fetchedLogin.length > 0) {
        setDataLogin(fetchedLogin);
        saveCachedDataLogin(fetchedLogin);
      }
      if (fetchedQuestions.length > 0) {
        setQuestions(fetchedQuestions);
        saveCachedQuestions(fetchedQuestions);
      }
      // Hasil_Jawaban always reflects the exact spreadsheet state (including 0 / empty)
      setResults(fetchedResults);
      saveCachedResults(fetchedResults);

      // Merge Data_Peserta (Toko & Jabatan) and Data_Login (NIK, Nama & Password)
      const mergedMap = new Map<string, Participant>();
      fetchedPeserta.forEach((p) => {
        mergedMap.set(p.nik, { ...p });
      });
      fetchedLogin.forEach((l) => {
        const existing = mergedMap.get(l.nik);
        if (existing) {
          existing.password = l.password || existing.password || '123';
          if (!existing.nama && l.nama) existing.nama = l.nama;
        } else {
          mergedMap.set(l.nik, { ...l });
        }
      });

      const mergedList = Array.from(mergedMap.values());
      if (mergedList.length > 0) {
        setParticipants(mergedList);
        saveCachedParticipants(mergedList);
      }

      const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setSyncStatus((prev) => ({
        ...prev,
        isLoading: false,
        lastSynced: now,
      }));
      if (!silent) {
        showToast('Data berhasil disinkronkan dari Google Spreadsheet!', 'success');
      }
    } catch (err: any) {
      console.warn('Sync failed:', err);
      setSyncStatus((prev) => ({
        ...prev,
        isLoading: false,
        error: err.message,
      }));
    }
  }, []);

  // Fetch live sheets data immediately on mount
  useEffect(() => {
    syncDataFromSheets(true);
  }, [syncDataFromSheets]);

  // Initialize Auth listener on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setSyncStatus((prev) => ({
          ...prev,
          isConnected: true,
          userEmail: user.email,
        }));
        syncDataFromSheets(false);
      },
      () => {
        setSyncStatus((prev) => ({
          ...prev,
          isConnected: false,
          userEmail: null,
        }));
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [syncDataFromSheets]);

  // Connect Google via OAuth popup
  const handleConnectGoogle = async () => {
    setSyncStatus((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await googleSignIn();
      if (result) {
        setSyncStatus({
          isConnected: true,
          userEmail: result.user.email,
          lastSynced: new Date().toLocaleTimeString(),
          isLoading: false,
          error: null,
        });
        showToast(`Terhubung dengan akun Google: ${result.user.email}`, 'success');
        await syncDataFromSheets();
      }
    } catch (error: any) {
      console.error('Sign-in failed', error);
      const isDomainError =
        error.code === 'auth/unauthorized-domain' ||
        error.message?.includes('unauthorized-domain') ||
        error.message?.includes('Authorized Domains');
      
      const errorMessage = isDomainError
        ? `Domain "${window.location.hostname}" belum diizinkan di Firebase Authentication. Tambahkan domain ini ke Authorized Domains di Firebase Console.`
        : error.message || 'Gagal menghubungkan akun Google';

      setSyncStatus((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      showToast(
        isDomainError
          ? 'Domain belum diizinkan di Firebase. Lihat panduan di tab Status Google Spreadsheet.'
          : errorMessage,
        'error'
      );
    }
  };

  // Participant login callback
  const handleLoginSuccess = (participant: Participant) => {
    setCurrentParticipant(participant);
    setActiveResult(null);
    setIsExamActive(true);
  };

  // Exam completion callback
  const handleFinishExam = (result: ExamResult, deliveredToSheet: boolean = false) => {
    setIsExamActive(false);
    setActiveResult(result);
    setResultDeliveredToSheet(deliveredToSheet);
    setResults((prev) => {
      const filtered = prev.filter((r) => r.nik !== result.nik);
      return [result, ...filtered];
    });
    if (deliveredToSheet) {
      showToast('Jawaban Anda berhasil masuk ke sheet Hasil_Jawaban Google Spreadsheet!', 'success');
    } else {
      showToast(`Jawaban Anda berhasil disimpan! Skor: ${result.skor}`, 'success');
    }
  };

  // Logout participant
  const handleLogoutParticipant = () => {
    setCurrentParticipant(null);
    setIsExamActive(false);
    setActiveResult(null);
  };

  // Reset all exam results (kosongkan data pengerjaan & hapus semua nilai)
  const handleResetResults = async () => {
    setResults([]);
    try {
      const res = await clearAllResultsFromSheet();
      showToast(res.message, 'success');
    } catch {
      clearCachedResults();
      showToast('Seluruh nilai ujian berhasil direset ke 0 (semua peserta kembali ke status Belum Ujian).', 'success');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top duration-200 max-w-md w-full px-4">
          <div
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-lg border text-xs font-semibold ${
              toastMessage.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-700'
                : toastMessage.type === 'error'
                ? 'bg-rose-600 text-white border-rose-700'
                : 'bg-slate-900 text-white border-slate-800'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSuccess={() => {
          setIsAdminModalOpen(false);
          setIsAdmin(true);
          setAdminTab('dashboard');
          showToast('Mode Admin aktif: Dashboard & Papan Juara tersedia', 'success');
        }}
      />

      {/* Header */}
      <Header
        isAdmin={isAdmin}
        adminTab={adminTab}
        setAdminTab={setAdminTab}
        onLogoutAdmin={() => {
          setIsAdmin(false);
          showToast('Kembali ke tampilan peserta', 'info');
        }}
        onOpenAdminLogin={() => setIsAdminModalOpen(true)}
        currentParticipant={currentParticipant}
        onLogoutParticipant={handleLogoutParticipant}
        syncStatus={syncStatus}
        onSyncWithSheets={syncDataFromSheets}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col w-full">
        {/* ===================== PARTICIPANT VIEW ===================== */}
        {!isAdmin && (
          <div className="w-full flex-1 flex flex-col justify-center items-center">
            {isExamActive && currentParticipant ? (
              /* 1. Exam Screen */
              <div className="w-full">
                <ExamScreen
                  participant={currentParticipant}
                  questions={questions}
                  config={config}
                  onFinishExam={handleFinishExam}
                  onCancelExam={() => {
                    if (confirm('Batalkan ujian dan kembali ke menu login?')) {
                      setIsExamActive(false);
                    }
                  }}
                />
              </div>
            ) : activeResult ? (
              /* 2. Real-time Result Screen */
              <div className="w-full">
                <ResultScreen
                  result={activeResult}
                  questions={questions}
                  config={config}
                  deliveredToSheet={resultDeliveredToSheet}
                  onGoToLeaderboard={() => {}}
                  onRetakeExam={() => {
                    if (currentParticipant) {
                      setIsExamActive(true);
                      setActiveResult(null);
                    }
                  }}
                  onBackToLogin={() => {
                    setCurrentParticipant(null);
                    setActiveResult(null);
                  }}
                />
              </div>
            ) : (
              /* 3. Initial View: Login Menu */
              <div className="w-full max-w-lg mx-auto py-6 sm:py-10 px-4">
                <ParticipantLogin
                  participants={participants}
                  onLoginSuccess={handleLoginSuccess}
                  examConfig={config}
                  totalQuestions={questions.length}
                  existingResults={results}
                  onViewResult={(r) => setActiveResult(r)}
                  onOpenAdminLogin={() => setIsAdminModalOpen(true)}
                />
              </div>
            )}
          </div>
        )}

        {/* ===================== ADMIN VIEW ===================== */}
        {isAdmin && (
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            {adminTab === 'dashboard' ? (
              /* Aktivitas & Status Peserta mengambil data dari sheet Data_Peserta */
              <AdminDashboard
                participants={dataPeserta}
                questions={questions}
                results={results}
                config={config}
                onUpdateConfig={(newConfig) => {
                  setConfig(newConfig);
                  showToast('Konfigurasi ujian berhasil disimpan!', 'success');
                }}
                onUpdateQuestions={(newQuestions) => {
                  setQuestions(newQuestions);
                  saveCachedQuestions(newQuestions);
                  showToast('Bank soal berhasil diperbarui!', 'success');
                }}
                syncStatus={syncStatus}
                onSyncWithSheets={syncDataFromSheets}
                onConnectGoogle={handleConnectGoogle}
                onResetResults={handleResetResults}
              />
            ) : adminTab === 'peserta' ? (
              /* Menu Data Peserta (NIK, Nama, Password) mengambil data dari sheet Data_Login */
              <ParticipantManagement
                participants={dataLogin}
                results={results}
                onUpdateParticipants={(newLoginData) => {
                  setDataLogin(newLoginData);
                  saveCachedDataLogin(newLoginData);
                  showToast('Data akun peserta berhasil diperbarui!', 'success');
                }}
                syncStatus={syncStatus}
                onSyncWithSheets={syncDataFromSheets}
                onLoginAsParticipant={(p) => {
                  setIsAdmin(false);
                  const enriched = participants.find((item) => item.nik === p.nik) || p;
                  handleLoginSuccess(enriched);
                  showToast(`Login sebagai ${p.nama} (${p.nik})`, 'success');
                }}
              />
            ) : (
              <LeaderboardScreen
                results={results}
                onResetResults={handleResetResults}
              />
            )}
          </div>
        )}
      </main>

      {/* Responsive Footer */}
      <footer className="bg-white border-t border-slate-200 py-3.5 px-4 sm:px-6 text-xs text-slate-500 mt-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto text-center sm:text-left">
          <span>&copy; {new Date().getFullYear()} CBT Store Of The Month - Indomaret</span>
          {!isAdmin ? (
            <button
              onClick={() => setIsAdminModalOpen(true)}
              className="text-slate-400 hover:text-slate-700 flex items-center gap-1 font-medium transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAdmin(false)}
              className="text-blue-600 hover:underline font-semibold cursor-pointer"
            >
              Mode Peserta
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
