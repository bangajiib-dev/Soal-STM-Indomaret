import React, { useEffect } from 'react';
import { Award, CheckCircle2, XCircle, Clock, Calendar, Check, X, ArrowRight, RotateCcw, Share2, Sparkles, Building2, User } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ExamResult, Question, ExamConfig } from '../types';

interface ResultScreenProps {
  result: ExamResult;
  questions: Question[];
  config: ExamConfig;
  onGoToLeaderboard: () => void;
  onRetakeExam: () => void;
  onBackToLogin: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  result,
  questions,
  config,
  onGoToLeaderboard,
  onRetakeExam,
  onBackToLogin,
}) => {
  const isPassed = result.skor >= config.passingGrade;

  useEffect(() => {
    if (isPassed) {
      // Fire celebratory confetti!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#005ba9', '#ffcc00', '#ed1c24', '#10b981'],
        });
      } catch (e) {
        // ignore
      }
    }
  }, [isPassed]);

  // Parse detail answers string e.g. "1:B, 2:C"
  const answersMap: Record<number, string> = {};
  if (result.detailJawaban) {
    result.detailJawaban.split(',').forEach((part) => {
      const [qId, opt] = part.trim().split(':');
      if (qId && opt) {
        answersMap[Number(qId)] = opt.trim();
      }
    });
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 mb-8 text-center relative overflow-hidden">
        <div className="h-1.5 w-full absolute top-0 left-0 flex">
          <div className="w-1/3 bg-[#005ba9]" />
          <div className="w-1/3 bg-[#ffcc00]" />
          <div className="w-1/3 bg-[#ed1c24]" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-4">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Hasil Ujian Berhasil Dicatat Real-Time di Google Spreadsheet</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1">
          Laporan Hasil Evaluasi Peserta
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6">
          Berikut adalah rincian skor akhir dan analisis performa pengerjaan soal ujian Anda.
        </p>

        {/* Score Ring / Hero Metric */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 my-4 pb-6 border-b border-slate-100">
          <div className="relative flex items-center justify-center">
            {/* Visual Circular Score */}
            <div
              className={`w-36 h-36 rounded-full flex flex-col items-center justify-center border-8 shadow-inner ${
                isPassed
                  ? 'border-emerald-500 bg-emerald-50/60 text-emerald-900'
                  : 'border-rose-500 bg-rose-50/60 text-rose-900'
              }`}
            >
              <span className="text-4xl font-black tracking-tight">{result.skor}</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Skor Akhir
              </span>
            </div>
            {isPassed && (
              <div className="absolute -top-2 -right-1 bg-amber-400 text-slate-950 p-2 rounded-full shadow-xs">
                <Sparkles className="w-5 h-5 fill-current" />
              </div>
            )}
          </div>

          <div className="text-left space-y-2">
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Status Kelulusan
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`text-lg font-black px-3 py-1 rounded-lg ${
                    isPassed
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  {result.statusKelulusan}
                </span>
                <span className="text-xs text-slate-500">
                  (KKM: {config.passingGrade} Poin)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <span className="text-[11px] text-slate-500">Jumlah Jawaban Benar</span>
                <div className="text-base font-bold text-emerald-600 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  <span>{result.jumlahBenar} / {result.totalSoal} Soal</span>
                </div>
              </div>
              <div>
                <span className="text-[11px] text-slate-500">Durasi Pengerjaan</span>
                <div className="text-base font-bold text-slate-800 flex items-center gap-1">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>{result.durasiFormatted}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Participant Identification Card */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-left max-w-xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <User className="w-4 h-4 text-blue-600 shrink-0" />
            <span><strong>Peserta:</strong> {result.nama} ({result.nik})</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span><strong>Toko:</strong> {result.toko}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 sm:col-span-2">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Waktu Pengerjaan: {result.waktuMulai} s/d {result.waktuSelesai} &bull; {result.timestamp}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 mt-5">
          <button
            onClick={onRetakeExam}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Kerjakan Ulang Ujian</span>
          </button>

          <button
            onClick={onBackToLogin}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
          >
            <span>Selesai & Keluar</span>
          </button>
        </div>
      </div>

      {/* Question by Question Review Accordion / List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Pembahasan & Rekap Jawaban
            </h3>
            <p className="text-xs text-slate-500">
              Evaluasi setiap butir soal untuk memahami materi standar operasional toko
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Benar ({result.jumlahBenar})
            </span>
            <span className="flex items-center gap-1 text-rose-700 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              Salah ({result.jumlahSalah})
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {questions.map((q, idx) => {
            const userChoice = answersMap[q.id];
            const isCorrect = userChoice === q.kunciJawaban;

            return (
              <div
                key={q.id}
                className={`p-4 rounded-xl border ${
                  isCorrect
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-rose-200 bg-rose-50/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${
                        isCorrect
                          ? 'bg-emerald-600 text-white'
                          : 'bg-rose-600 text-white'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {q.kategori || 'Operasional Toko'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    {isCorrect ? (
                      <span className="text-emerald-700 flex items-center gap-1 bg-emerald-100 px-2 py-0.5 rounded">
                        <Check className="w-3.5 h-3.5" /> Benar (+10 Poin)
                      </span>
                    ) : (
                      <span className="text-rose-700 flex items-center gap-1 bg-rose-100 px-2 py-0.5 rounded">
                        <X className="w-3.5 h-3.5" /> Salah (0 Poin)
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm font-medium text-slate-900 mb-3">
                  {q.pertanyaan}
                </p>

                {/* Option comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-3">
                  <div
                    className={`p-2.5 rounded-lg border ${
                      isCorrect
                        ? 'border-emerald-300 bg-emerald-100/50 text-emerald-950 font-medium'
                        : 'border-rose-300 bg-rose-100/50 text-rose-950'
                    }`}
                  >
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">
                      Jawaban Anda:
                    </span>
                    <span>
                      {userChoice ? `Pilihan ${userChoice}` : 'Tidak dijawab'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg border border-blue-300 bg-blue-50/60 text-blue-950 font-medium">
                    <span className="text-[10px] text-blue-700 block uppercase font-bold">
                      Kunci Jawaban Resmi:
                    </span>
                    <span>Pilihan {q.kunciJawaban}</span>
                  </div>
                </div>

                {/* Explanation if available */}
                {q.penjelasan && (
                  <div className="text-xs bg-white/80 p-2.5 rounded-lg border border-slate-200 text-slate-700">
                    <strong className="text-slate-900">Pembahasan:</strong> {q.penjelasan}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
