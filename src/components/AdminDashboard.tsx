import React, { useState } from 'react';
import {
  Users,
  BookOpen,
  Settings,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Clock,
  Sparkles,
  AlertCircle,
  Search,
  Database,
  Sliders,
  Award,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Participant, Question, ExamResult, ExamConfig, SheetSyncStatus } from '../types';
import { SPREADSHEET_URL, SPREADSHEET_ID } from '../data/defaultData';
import { addQuestionToSheet, deleteQuestionFromSheet, seedSpreadsheetWithDefaultData } from '../lib/sheetsService';

interface AdminDashboardProps {
  participants: Participant[];
  questions: Question[];
  results: ExamResult[];
  config: ExamConfig;
  onUpdateConfig: (config: ExamConfig) => void;
  onUpdateQuestions: (questions: Question[]) => void;
  syncStatus: SheetSyncStatus;
  onSyncWithSheets: () => void;
  onConnectGoogle: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  participants,
  questions,
  results,
  config,
  onUpdateConfig,
  onUpdateQuestions,
  syncStatus,
  onSyncWithSheets,
  onConnectGoogle,
}) => {
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'monitoring' | 'bank_soal' | 'spreadsheet' | 'pengaturan'>('monitoring');
  const [participantSearch, setParticipantSearch] = useState('');
  const [questionSearch, setQuestionSearch] = useState('');
  const [activityPage, setActivityPage] = useState(1);
  const activityPageSize = 25;

  // Add Question Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    pertanyaan: '',
    pilihanA: '',
    pilihanB: '',
    pilihanC: '',
    pilihanD: '',
    kunciJawaban: 'A',
    bobot: 10,
    kategori: 'STM BULAN ',
    penjelasan: '',
  });

  // Delete Question state (replaces window.confirm)
  const [deletingQuestion, setDeletingQuestion] = useState<Question | null>(null);
  const [isDeletingQuestion, setIsDeletingQuestion] = useState(false);
  const [deleteFeedback, setDeleteFeedback] = useState<string | null>(null);

  // Seed status message
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedFeedback, setSeedFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Metrics calculation
  const totalParticipants = participants.length;
  const completedCount = results.length;
  const passedCount = results.filter((r) => r.skor >= config.passingGrade).length;
  const averageScore =
    completedCount > 0
      ? Math.round(results.reduce((acc, r) => acc + r.skor, 0) / completedCount)
      : 0;
  const highestScore =
    completedCount > 0 ? Math.max(...results.map((r) => r.skor)) : 0;

  // Filtered participants with exam status
  const participantActivityList = participants
    .map((p) => {
      const exam = results.find((r) => r.nik === p.nik);
      return {
        ...p,
        examResult: exam || null,
        status: exam ? ('Selesai' as const) : ('Belum Ujian' as const),
      };
    })
    .filter((p) => {
      const q = participantSearch.toLowerCase();
      return (
        p.nama.toLowerCase().includes(q) ||
        p.nik.toLowerCase().includes(q) ||
        p.toko.toLowerCase().includes(q)
      );
    });

  const totalActivityPages = Math.max(1, Math.ceil(participantActivityList.length / activityPageSize));
  const currentActivityPage = Math.min(activityPage, totalActivityPages);
  const paginatedActivityList = participantActivityList.slice(
    (currentActivityPage - 1) * activityPageSize,
    currentActivityPage * activityPageSize
  );

  // Handle adding new question
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.pertanyaan || !newQuestion.pilihanA || !newQuestion.pilihanB) {
      alert('Harap lengkapi pertanyaan dan minimal pilihan A dan B.');
      return;
    }

    setIsSavingQuestion(true);
    const nextId = questions.length > 0 ? Math.max(...questions.map((q) => q.id)) + 1 : 1;

    const questionToAdd: Question = {
      id: nextId,
      pertanyaan: newQuestion.pertanyaan!,
      pilihanA: newQuestion.pilihanA!,
      pilihanB: newQuestion.pilihanB!,
      pilihanC: newQuestion.pilihanC || '-',
      pilihanD: newQuestion.pilihanD || '-',
      kunciJawaban: newQuestion.kunciJawaban || 'A',
      bobot: Number(newQuestion.bobot) || 10,
      kategori: newQuestion.kategori || 'Operasional Toko',
      penjelasan: newQuestion.penjelasan || '',
    };

    // Save to Google Sheets sheet Soal_Test & local state
    await addQuestionToSheet(questionToAdd);
    onUpdateQuestions([...questions, questionToAdd]);

    setIsSavingQuestion(false);
    setShowAddModal(false);
    setNewQuestion({
      pertanyaan: '',
      pilihanA: '',
      pilihanB: '',
      pilihanC: '',
      pilihanD: '',
      kunciJawaban: 'A',
      bobot: 10,
      kategori: 'Operasional Toko & Display',
      penjelasan: '',
    });
  };

  const handleConfirmDeleteQuestion = async () => {
    if (!deletingQuestion) return;
    setIsDeletingQuestion(true);
    try {
      const updated = await deleteQuestionFromSheet(deletingQuestion.id, questions);
      onUpdateQuestions(updated);
      setDeleteFeedback(`Soal #${deletingQuestion.id} berhasil dihapus dari sistem dan spreadsheet.`);
      setTimeout(() => setDeleteFeedback(null), 3500);
      setDeletingQuestion(null);
    } catch (err) {
      console.error('Failed to delete question:', err);
    } finally {
      setIsDeletingQuestion(false);
    }
  };

  const handleSeedTemplate = async () => {
    if (!syncStatus.isConnected) {
      alert('Silakan hubungkan akun Google terlebih dahulu untuk mengisi data ke Google Spreadsheet.');
      return;
    }

    if (
      confirm(
        'Tindakan ini akan membuat/memperbarui sheet Data_Peserta, Soal_Test, dan Hasil_Jawaban di Google Spreadsheet Anda dengan format standar. Lanjutkan?'
      )
    ) {
      setSeedLoading(true);
      setSeedFeedback(null);
      const res = await seedSpreadsheetWithDefaultData();
      setSeedFeedback(res);
      setSeedLoading(false);
      if (res.success) {
        onSyncWithSheets();
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 text-slate-100 mb-2">
            <Settings className="w-3.5 h-3.5 text-blue-400" />
            <span>Dashboard Administrator STM</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Manajemen Evaluasi & Bank Soal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pantau partisipasi peserta, kelola bank soal di Google Sheets, dan atur parameter ujian.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSyncWithSheets}
            disabled={syncStatus.isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncStatus.isLoading ? 'animate-spin' : ''}`} />
            <span>{syncStatus.isLoading ? 'Menyinkronkan...' : 'Sinkronkan Sheets'}</span>
          </button>

          <a
            href={SPREADSHEET_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Buka Google Sheets</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Total Peserta
          </div>
          <div className="text-2xl font-black text-slate-900">{totalParticipants}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Sheet Data_Peserta</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Sudah Selesai
          </div>
          <div className="text-2xl font-black text-blue-600">{completedCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {totalParticipants > 0 ? Math.round((completedCount / totalParticipants) * 100) : 0}% Partisipasi
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Rata-rata Skor
          </div>
          <div className="text-2xl font-black text-slate-900">{averageScore}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Dari skala 100</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Nilai Tertinggi
          </div>
          <div className="text-2xl font-black text-amber-600">{highestScore}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Juara 1 Klasemen</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs col-span-2 lg:col-span-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Tingkat Kelulusan
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {completedCount > 0 ? Math.round((passedCount / completedCount) * 100) : 0}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {passedCount} dari {completedCount} Lulus (KKM: {config.passingGrade})
          </div>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex border-b border-slate-200 mb-6 space-x-2 sm:space-x-4 overflow-x-auto">
        <button
          onClick={() => setActiveAdminSubTab('monitoring')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeAdminSubTab === 'monitoring'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Monitoring Aktivitas Peserta</span>
        </button>

        <button
          onClick={() => setActiveAdminSubTab('bank_soal')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeAdminSubTab === 'bank_soal'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Bank Soal Test ({questions.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminSubTab('spreadsheet')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeAdminSubTab === 'spreadsheet'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Status Google Spreadsheet</span>
        </button>

        <button
          onClick={() => setActiveAdminSubTab('pengaturan')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeAdminSubTab === 'pengaturan'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Pengaturan Ujian</span>
        </button>
      </div>

      {/* Sub Tab 1: Monitoring Aktivitas Peserta */}
      {activeAdminSubTab === 'monitoring' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Aktivitas & Status Peserta
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  Sheet: Data_Peserta
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Data profil, jabatan, dan kode toko bersumber langsung dari sheet{' '}
                <span className="font-bold text-blue-700">Data_Peserta</span> di Google Spreadsheet
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={participantSearch}
                onChange={(e) => {
                  setParticipantSearch(e.target.value);
                  setActivityPage(1);
                }}
                placeholder="Cari Peserta / NIK / Toko..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-[11px] font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">NIK</th>
                  <th className="py-3 px-4">Nama Peserta</th>
                  <th className="py-3 px-4">Toko / Cabang</th>
                  <th className="py-3 px-4">Jabatan</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Skor Akhir</th>
                  <th className="py-3 px-4 text-center">Durasi Pengerjaan</th>
                  <th className="py-3 px-4 text-right">Waktu Submit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                {paginatedActivityList.length > 0 ? (
                  paginatedActivityList.map((row) => (
                    <tr key={row.nik} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        {row.nik}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {row.nama}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {row.toko}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {row.jabatan || 'STM'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {row.status === 'Selesai' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            Selesai
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                            Belum Ujian
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-bold">
                        {row.examResult ? (
                          <span
                            className={`text-sm ${
                              row.examResult.skor >= config.passingGrade
                                ? 'text-emerald-600'
                                : 'text-rose-600'
                            }`}
                          >
                            {row.examResult.skor} / 100
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {row.examResult ? (
                          <span className="font-mono text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                            {row.examResult.durasiFormatted}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-[11px] text-slate-500 font-mono">
                        {row.examResult ? row.examResult.waktuSelesai : '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                      Tidak ada data peserta ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Activity Table Pagination Controls */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Menampilkan{' '}
              <span className="font-bold text-slate-900">
                {participantActivityList.length === 0
                  ? 0
                  : (currentActivityPage - 1) * activityPageSize + 1}
              </span>{' '}
              sampai{' '}
              <span className="font-bold text-slate-900">
                {Math.min(currentActivityPage * activityPageSize, participantActivityList.length)}
              </span>{' '}
              dari{' '}
              <span className="font-bold text-blue-700">
                {participantActivityList.length}
              </span>{' '}
              Peserta
            </div>

            {totalActivityPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                  disabled={currentActivityPage === 1}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Sebelumnya</span>
                </button>

                <span className="px-2.5 py-1 font-semibold text-slate-700">
                  Halaman {currentActivityPage} / {totalActivityPages}
                </span>

                <button
                  onClick={() => setActivityPage((p) => Math.min(totalActivityPages, p + 1))}
                  disabled={currentActivityPage === totalActivityPages}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium flex items-center gap-1"
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub Tab 2: Kelola Bank Soal (Soal_Test) */}
      {activeAdminSubTab === 'bank_soal' && (
        <div className="space-y-4">
          {deleteFeedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{deleteFeedback}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Daftar Soal Ujian ({questions.length} Butir)
              </h3>
              <p className="text-xs text-slate-500">
                Tersinkronisasi dengan sheet <span className="font-mono text-blue-600">Soal_Test</span> di Google Spreadsheet
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-60">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={questionSearch}
                  onChange={(e) => setQuestionSearch(e.target.value)}
                  placeholder="Cari materi soal..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                id="add-question-btn"
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Soal</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {questions
              .filter((q) =>
                q.pertanyaan.toLowerCase().includes(questionSearch.toLowerCase()) ||
                (q.kategori && q.kategori.toLowerCase().includes(questionSearch.toLowerCase()))
              )
              .map((q, idx) => (
                <div
                  key={q.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      {q.kategori && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {q.kategori}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">
                        Bobot: {q.bobot || 10} poin
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        Kunci: Pilihan {q.kunciJawaban}
                      </span>
                      <button
                        onClick={() => setDeletingQuestion(q)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Hapus soal ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm font-medium text-slate-900 mb-3">
                    {q.pertanyaan}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                    <div className={`p-2 rounded-lg border ${q.kunciJawaban === 'A' ? 'bg-emerald-50 border-emerald-300 font-semibold' : 'bg-slate-50 border-slate-200'}`}>
                      <strong>A:</strong> {q.pilihanA}
                    </div>
                    <div className={`p-2 rounded-lg border ${q.kunciJawaban === 'B' ? 'bg-emerald-50 border-emerald-300 font-semibold' : 'bg-slate-50 border-slate-200'}`}>
                      <strong>B:</strong> {q.pilihanB}
                    </div>
                    <div className={`p-2 rounded-lg border ${q.kunciJawaban === 'C' ? 'bg-emerald-50 border-emerald-300 font-semibold' : 'bg-slate-50 border-slate-200'}`}>
                      <strong>C:</strong> {q.pilihanC}
                    </div>
                    <div className={`p-2 rounded-lg border ${q.kunciJawaban === 'D' ? 'bg-emerald-50 border-emerald-300 font-semibold' : 'bg-slate-50 border-slate-200'}`}>
                      <strong>D:</strong> {q.pilihanD}
                    </div>
                  </div>

                  {q.penjelasan && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                      <strong>Pembahasan:</strong> {q.penjelasan}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Sub Tab 3: Status Google Spreadsheet */}
      {activeAdminSubTab === 'spreadsheet' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span>Konfigurasi Google Spreadsheet</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Aplikasi ini terhubung langsung ke Google Sheets yang ditentukan pada parameter tugas.
            </p>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3 mb-6 text-xs">
              <div className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Spreadsheet Target:</span>
                <a
                  href={SPREADSHEET_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono font-medium text-blue-600 hover:underline flex items-center gap-1 break-all"
                >
                  <span>{SPREADSHEET_ID}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Status Akun Google:</span>
                <span className="font-semibold text-slate-900">
                  {syncStatus.isConnected ? (
                    <span className="text-emerald-700 flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Terhubung ({syncStatus.userEmail || 'Google Account'})
                    </span>
                  ) : (
                    <span className="text-amber-700 flex items-center gap-1 font-semibold">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Belum Terhubung
                    </span>
                  )}
                </span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-slate-500">Struktur Sheet Wajib:</span>
                <span className="text-slate-800 font-mono">
                  Data_Peserta, Soal_Test, Hasil_Jawaban
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {!syncStatus.isConnected && (
                <button
                  onClick={onConnectGoogle}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Hubungkan Akun Google</span>
                </button>
              )}

              <button
                onClick={onSyncWithSheets}
                disabled={syncStatus.isLoading}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncStatus.isLoading ? 'animate-spin' : ''}`} />
                <span>Tarik Data Terbaru Sekarang</span>
              </button>

              <button
                onClick={handleSeedTemplate}
                disabled={seedLoading}
                className="px-4 py-2 bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Database className="w-3.5 h-3.5" />
                <span>{seedLoading ? 'Sedang Inisialisasi...' : 'Inisialisasi Sample ke Spreadsheet'}</span>
              </button>
            </div>

            {seedFeedback && (
              <div
                className={`mt-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
                  seedFeedback.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {seedFeedback.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{seedFeedback.message}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub Tab 4: Pengaturan Ujian */}
      {activeAdminSubTab === 'pengaturan' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-2xl">
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Konfigurasi Parameter Ujian
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Atur durasi waktu pengerjaan dan ambang batas kelulusan (KKM)
          </p>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Judul Sesi Meeting / Asesmen
              </label>
              <input
                type="text"
                value={config.judulMeeting}
                onChange={(e) => onUpdateConfig({ ...config, judulMeeting: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Durasi Pengerjaan (Menit)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={config.durasiMenit}
                    onChange={(e) =>
                      onUpdateConfig({ ...config, durasiMenit: Number(e.target.value) || 20 })
                    }
                    className="w-full pl-3.5 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Clock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Standar Kelulusan / KKM (Skor)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={config.passingGrade}
                    onChange={(e) =>
                      onUpdateConfig({ ...config, passingGrade: Number(e.target.value) || 75 })
                    }
                    className="w-full pl-3.5 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Award className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.isExamOpen}
                  onChange={(e) => onUpdateConfig({ ...config, isExamOpen: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-semibold text-slate-800">
                  Buka Pintu Ujian (Peserta dapat langsung mulai mengerjakan)
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Question */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Tambah Soal Baru ke Sheet Soal_Test
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Kategori / Topik Soal
                </label>
                <input
                  type="text"
                  value={newQuestion.kategori}
                  onChange={(e) => setNewQuestion({ ...newQuestion, kategori: e.target.value })}
                  placeholder="Contoh: Operasional Toko & Display"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Pertanyaan Soal
                </label>
                <textarea
                  rows={3}
                  value={newQuestion.pertanyaan}
                  onChange={(e) => setNewQuestion({ ...newQuestion, pertanyaan: e.target.value })}
                  placeholder="Tuliskan pertanyaan ujian dengan jelas..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block font-semibold text-slate-700 uppercase tracking-wider">
                  Pilihan Jawaban (A, B, C, D)
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 font-bold text-center">A:</span>
                    <input
                      type="text"
                      value={newQuestion.pilihanA}
                      onChange={(e) => setNewQuestion({ ...newQuestion, pilihanA: e.target.value })}
                      placeholder="Teks pilihan A"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 font-bold text-center">B:</span>
                    <input
                      type="text"
                      value={newQuestion.pilihanB}
                      onChange={(e) => setNewQuestion({ ...newQuestion, pilihanB: e.target.value })}
                      placeholder="Teks pilihan B"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 font-bold text-center">C:</span>
                    <input
                      type="text"
                      value={newQuestion.pilihanC}
                      onChange={(e) => setNewQuestion({ ...newQuestion, pilihanC: e.target.value })}
                      placeholder="Teks pilihan C"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 font-bold text-center">D:</span>
                    <input
                      type="text"
                      value={newQuestion.pilihanD}
                      onChange={(e) => setNewQuestion({ ...newQuestion, pilihanD: e.target.value })}
                      placeholder="Teks pilihan D"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Kunci Jawaban Benar
                  </label>
                  <select
                    value={newQuestion.kunciJawaban}
                    onChange={(e) => setNewQuestion({ ...newQuestion, kunciJawaban: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-emerald-700"
                  >
                    <option value="A">Pilihan A</option>
                    <option value="B">Pilihan B</option>
                    <option value="C">Pilihan C</option>
                    <option value="D">Pilihan D</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Bobot Poin
                  </label>
                  <input
                    type="number"
                    value={newQuestion.bobot}
                    onChange={(e) => setNewQuestion({ ...newQuestion, bobot: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Pembahasan / Penjelasan (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={newQuestion.penjelasan}
                  onChange={(e) => setNewQuestion({ ...newQuestion, penjelasan: e.target.value })}
                  placeholder="Keterangan singkat materi SOP..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingQuestion}
                  className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs flex items-center justify-center gap-1.5"
                >
                  {isSavingQuestion ? 'Menyimpan...' : 'Simpan ke Bank Soal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Question Confirmation Modal */}
      {deletingQuestion && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Hapus Butir Soal #{deletingQuestion.id}
                </h3>
                <p className="text-xs text-slate-500">
                  Tindakan ini akan menghapus soal dari database & spreadsheet
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs text-slate-700 mb-5">
              <span className="font-semibold text-slate-900 block mb-1">Pertanyaan:</span>
              <p className="line-clamp-3 text-slate-600">{deletingQuestion.pertanyaan}</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingQuestion(null)}
                disabled={isDeletingQuestion}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleConfirmDeleteQuestion}
                disabled={isDeletingQuestion}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDeletingQuestion ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Soal</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
