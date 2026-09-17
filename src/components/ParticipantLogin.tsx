import React, { useState } from 'react';
import {
  User,
  KeyRound,
  LogIn,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Briefcase,
  Sparkles,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import { Participant, ExamConfig, ExamResult } from '../types';

interface ParticipantLoginProps {
  participants: Participant[];
  onLoginSuccess: (participant: Participant) => void;
  examConfig: ExamConfig;
  totalQuestions: number;
  existingResults: ExamResult[];
  onViewResult: (result: ExamResult) => void;
  onOpenAdminLogin: () => void;
}

export const ParticipantLogin: React.FC<ParticipantLoginProps> = ({
  participants,
  onLoginSuccess,
  examConfig,
  existingResults,
  onViewResult,
  onOpenAdminLogin,
}) => {
  const [nik, setNik] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [authenticatedUser, setAuthenticatedUser] = useState<Participant | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanNik = nik.trim();
    const cleanPass = password.trim();

    if (!cleanNik || !cleanPass) {
      setErrorMsg('Harap masukkan NIK dan Password Anda.');
      return;
    }

    // Match participant in sheet data
    const foundByNik = participants.find(
      (p) => p.nik.toString().trim() === cleanNik
    );

    if (foundByNik) {
      if (foundByNik.password.toString().trim() === cleanPass) {
        setAuthenticatedUser(foundByNik);
      } else {
        setErrorMsg(
          `NIK terdaftar atas nama ${foundByNik.nama}, tetapi Password yang dimasukkan salah. Password default di spreadsheet adalah: 123`
        );
      }
    } else {
      setErrorMsg(
        `NIK "${cleanNik}" belum terdaftar dalam sheet Data_Login Google Spreadsheet. Pastikan NIK sudah sesuai atau hubungi admin.`
      );
    }
  };

  // Check if authenticated user already has submitted result
  const userResult = authenticatedUser
    ? existingResults.find((r) => r.nik === authenticatedUser.nik)
    : null;

  return (
    <div className="w-full max-w-md mx-auto px-4 py-3 sm:py-6">
      {/* Mobile Top Welcome Card */}
      <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 rounded-2xl p-5 text-white shadow-md mb-5 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 rounded-full bg-blue-400/20 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-32 h-32 rounded-full bg-amber-400/15 blur-xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-700/60 border border-blue-400/30 text-[11px] font-semibold text-blue-200 mb-2.5 backdrop-blur-xs">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Portal STM INDOMARET</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-2 leading-snug">
            {examConfig.judulMeeting}
          </h1>

          <p className="text-xs text-blue-100/90 leading-relaxed mb-3">
            Selamat datang di sistem evaluasi kompetensi Store Of The Month (STM). Silakan login menggunakan NIK dan Password yang terdaftar di spreadsheet untuk mengerjakan soal.
          </p>

          {/* Only Durasi: 20 Menit (Jumlah Soal & KKM removed as requested) */}
          <div className="inline-flex items-center gap-1.5 bg-blue-950/60 px-3 py-1.5 rounded-lg border border-blue-600/40 text-xs font-semibold text-amber-300">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Durasi: <strong>{examConfig.durasiMenit} Menit</strong></span>
          </div>
        </div>
      </div>

      {/* Main Container - Mobile Centered Card */}
      {!authenticatedUser ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 mb-6">
          <div className="flex items-center gap-3 pb-3 mb-4 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <LogIn className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Login Peserta Ujian</h2>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Gagal Masuk:</span> {errorMsg}
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="nik-input"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Nomor Induk Karyawan (NIK)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="nik-input"
                  type="text"
                  value={nik}
                  onChange={(e) => setNik(e.target.value)}
                  placeholder="Contoh: 2015000000"
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password-input"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
                >
                  Password Peserta
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                >
                  {showPassword ? 'Sembunyikan' : 'Tampilkan'}
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                id="submit-login-btn"
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk ke Ruang Ujian</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Authenticated Participant Confirmation Card */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 mb-6">
          <div className="flex items-center gap-3 pb-3 mb-4 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Verifikasi Peserta Berhasil</h2>
              <p className="text-[11px] text-slate-500">Data terverifikasi</p>
            </div>
          </div>

          {/* Profile Details */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 mb-5 space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
              <span className="text-slate-500">Nama Lengkap</span>
              <span className="font-bold text-slate-900">{authenticatedUser.nama}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
              <span className="text-slate-500">Nomor Induk Karyawan (NIK)</span>
              <span className="font-mono font-semibold text-slate-800">{authenticatedUser.nik}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
              <span className="text-slate-500">Kode Toko</span>
              <span className="font-medium text-slate-800 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>{authenticatedUser.toko}</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Jabatan</span>
              <span className="font-medium text-slate-800 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>{authenticatedUser.jabatan || 'Store Trainee Manager'}</span>
              </span>
            </div>
          </div>

          {/* If participant already finished exam */}
          {userResult && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-amber-900">
                  Anda Sudah Mengerjakan Ujian Ini
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    userResult.statusKelulusan === 'LULUS'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {userResult.statusKelulusan}
                </span>
              </div>
              <p className="text-amber-800 mb-2.5">
                Skor Anda: <strong>{userResult.skor}/100</strong> dengan durasi pengerjaan <strong>{userResult.durasiFormatted}</strong>.
              </p>
              <button
                onClick={() => onViewResult(userResult)}
                className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs"
              >
                Lihat Rincian Hasil & Pembahasan
              </button>
            </div>
          )}

          {/* Action CTA */}
          <div className="space-y-2.5">
            <button
              id="start-exam-button"
              onClick={() => onLoginSuccess(authenticatedUser)}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{userResult ? 'Kerjakan Ulang Ujian' : 'Mulai Kerjakan Ujian Sekarang'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthenticatedUser(null);
                setNik('');
                setPassword('');
              }}
              className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Bukan akun Anda? Ganti NIK
            </button>
          </div>
        </div>
      )}

      {/* Admin Login Discreet Trigger at Bottom */}
      <div className="text-center pt-2 pb-6">
        <button
          onClick={onOpenAdminLogin}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors py-2 px-3 rounded-lg hover:bg-slate-200/60 cursor-pointer"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Akses Admin / Panitia Ujian</span>
        </button>
      </div>
    </div>
  );
};
