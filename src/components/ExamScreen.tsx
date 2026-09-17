import React, { useState, useEffect, useRef } from 'react';
import { Clock, CheckCircle2, Flag, ArrowLeft, ArrowRight, AlertTriangle, Send, ShieldAlert, Sparkles } from 'lucide-react';
import { Participant, Question, ExamConfig, ExamResult } from '../types';
import { submitResultToSheet } from '../lib/sheetsService';

interface ExamScreenProps {
  participant: Participant;
  questions: Question[];
  config: ExamConfig;
  onFinishExam: (result: ExamResult) => void;
  onCancelExam: () => void;
}

export const ExamScreen: React.FC<ExamScreenProps> = ({
  participant,
  questions,
  config,
  onFinishExam,
  onCancelExam,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Time tracking
  const totalSeconds = config.durasiMenit * 60;
  const [secondsRemaining, setSecondsRemaining] = useState(totalSeconds);
  const startTimeRef = useRef<Date>(new Date());
  const timerIntervalRef = useRef<any>(null);

  // Storage key for recovery during active session
  const activeSessionKey = `stm_session_${participant.nik}`;

  // Restore saved state if page refreshed accidentally
  useEffect(() => {
    try {
      const saved = localStorage.getItem(activeSessionKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.answers) setAnswers(parsed.answers);
        if (parsed.flagged) setFlagged(parsed.flagged);
        if (parsed.startTime) {
          const started = new Date(parsed.startTime);
          startTimeRef.current = started;
          const elapsed = Math.floor((new Date().getTime() - started.getTime()) / 1000);
          const remaining = Math.max(0, totalSeconds - elapsed);
          setSecondsRemaining(remaining);
        }
      } else {
        startTimeRef.current = new Date();
        localStorage.setItem(
          activeSessionKey,
          JSON.stringify({
            startTime: startTimeRef.current.toISOString(),
            answers: {},
            flagged: {},
          })
        );
      }
    } catch (e) {
      console.warn('Session cache read error', e);
    }
  }, [participant.nik, totalSeconds]);

  // Persist answers changes
  const saveAnswersState = (newAnswers: Record<number, string>, newFlagged: Record<number, boolean>) => {
    try {
      localStorage.setItem(
        activeSessionKey,
        JSON.stringify({
          startTime: startTimeRef.current.toISOString(),
          answers: newAnswers,
          flagged: newFlagged,
        })
      );
    } catch (e) {
      // ignore
    }
  };

  // Countdown timer
  useEffect(() => {
    timerIntervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          handleFinalSubmit(); // Auto-submit on time up
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSelectOption = (questionId: number, optionLetter: string) => {
    const updatedAnswers = { ...answers, [questionId]: optionLetter };
    setAnswers(updatedAnswers);
    saveAnswersState(updatedAnswers, flagged);
  };

  const handleToggleFlag = (questionId: number) => {
    const updatedFlagged = { ...flagged, [questionId]: !flagged[questionId] };
    setFlagged(updatedFlagged);
    saveAnswersState(answers, updatedFlagged);
  };

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;
  const flaggedCount = Object.values(flagged).filter(Boolean).length;

  const currentQuestion = questions[currentIndex] || questions[0];

  const handleFinalSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    const endTime = new Date();
    const durationSeconds = Math.max(
      1,
      Math.floor((endTime.getTime() - startTimeRef.current.getTime()) / 1000)
    );
    const durationFormatted = formatTimer(durationSeconds);

    // Calculate score
    let correctAnswersCount = 0;
    const detailList: string[] = [];

    questions.forEach((q) => {
      const selected = answers[q.id];
      const isCorrect = selected === q.kunciJawaban;
      if (isCorrect) {
        correctAnswersCount += 1;
      }
      detailList.push(`${q.id}:${selected || '-'}`);
    });

    const finalScore = questions.length > 0
      ? Math.round((correctAnswersCount / questions.length) * 100)
      : 0;

    const isPassed = finalScore >= config.passingGrade;

    const result: ExamResult = {
      id: `res-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      nik: participant.nik,
      nama: participant.nama,
      toko: participant.toko,
      jabatan: participant.jabatan || 'Store Trainee Manager',
      skor: finalScore,
      totalSoal: questions.length,
      jumlahBenar: correctAnswersCount,
      jumlahSalah: questions.length - correctAnswersCount,
      waktuMulai: startTimeRef.current.toTimeString().substring(0, 8),
      waktuSelesai: endTime.toTimeString().substring(0, 8),
      durasiDetik: durationSeconds,
      durasiFormatted: durationFormatted,
      statusKelulusan: isPassed ? 'LULUS' : 'TIDAK LULUS',
      detailJawaban: detailList.join(', '),
    };

    // Submit directly to connected Google Spreadsheet (Hasil_Jawaban)
    await submitResultToSheet(result);

    // Clear active session storage
    localStorage.removeItem(activeSessionKey);

    // Callback to display real-time result screen
    onFinishExam(result);
  };

  return (
    <div className="max-w-6xl mx-auto py-4 px-3 sm:px-6">
      {/* Top Exam App Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3.5 sm:p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
        {/* Participant & Store Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
            {participant.nama.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span>{participant.nama}</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-normal">
                NIK: {participant.nik}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              {participant.toko} &bull; {participant.jabatan || 'STM'}
            </div>
          </div>
        </div>

        {/* Progress & Countdown Timer */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-slate-500">Progress Ujian</div>
            <div className="text-xs font-bold text-slate-800">
              {answeredCount} / {questions.length} Terjawab
            </div>
          </div>

          {/* Timer Display */}
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-mono font-bold text-sm shadow-xs ${
              secondsRemaining <= 180
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-slate-900 text-amber-400'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatTimer(secondsRemaining)}</span>
          </div>

          {/* Finish Button in Header */}
          <button
            id="finish-exam-top-btn"
            onClick={() => setShowConfirmModal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Selesai Ujian</span>
          </button>
        </div>
      </div>

      {/* Main Exam Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Question Box */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6">
            {/* Question Header & Category */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-100 text-blue-800 font-extrabold text-sm">
                  {currentIndex + 1}
                </span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Dari {questions.length} Soal
                </span>
              </div>

              <div className="flex items-center gap-2">
                {currentQuestion.kategori && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium border border-blue-200/60 hidden sm:inline-block">
                    {currentQuestion.kategori}
                  </span>
                )}
                {/* Ragu-ragu / Flag toggle */}
                <button
                  onClick={() => handleToggleFlag(currentQuestion.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                    flagged[currentQuestion.id]
                      ? 'bg-amber-100 border-amber-300 text-amber-800'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5 fill-current" />
                  <span>{flagged[currentQuestion.id] ? 'Ditandai' : 'Ragu-ragu'}</span>
                </button>
              </div>
            </div>

            {/* Question Text */}
            <div className="mb-6">
              <p className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed">
                {currentQuestion.pertanyaan}
              </p>
            </div>

            {/* Multiple Choice Options */}
            <div className="space-y-3 mb-6">
              {[
                { key: 'A', text: currentQuestion.pilihanA },
                { key: 'B', text: currentQuestion.pilihanB },
                { key: 'C', text: currentQuestion.pilihanC },
                { key: 'D', text: currentQuestion.pilihanD },
                ...(currentQuestion.pilihanE ? [{ key: 'E', text: currentQuestion.pilihanE }] : []),
              ].map(({ key, text }) => {
                const isSelected = answers[currentQuestion.id] === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectOption(currentQuestion.id, key)}
                    className={`w-full text-left p-3.5 sm:p-4 rounded-xl border-2 transition-all flex items-start gap-3 cursor-pointer group ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50/70'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center font-bold text-xs transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700 group-hover:bg-blue-100 group-hover:text-blue-700'
                      }`}
                    >
                      {key}
                    </div>
                    <div className="text-sm sm:text-base text-slate-800 leading-snug pt-0.5">
                      {text}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium text-xs sm:text-sm hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Sebelumnya</span>
              </button>

              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <span>Berikutnya</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Kirim Jawaban</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Question Palette / Navigation */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5 sticky top-20">
            <h3 className="text-sm font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Nomor Soal</span>
              <span className="text-xs font-normal text-slate-500">
                {answeredCount}/{questions.length} Terjawab
              </span>
            </h3>

            {/* Palette Grid */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              {questions.map((q, idx) => {
                const isAnswered = Boolean(answers[q.id]);
                const isFlagged = Boolean(flagged[q.id]);
                const isCurrent = idx === currentIndex;

                let btnClass = 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50';
                if (isAnswered) {
                  btnClass = 'bg-blue-600 border-blue-600 text-white font-bold';
                }
                if (isFlagged) {
                  btnClass = 'bg-amber-400 border-amber-500 text-slate-950 font-bold';
                }
                if (isCurrent) {
                  btnClass += ' ring-2 ring-blue-500 ring-offset-1';
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded-lg text-xs font-semibold border flex items-center justify-center transition-all cursor-pointer relative ${btnClass}`}
                  >
                    <span>{idx + 1}</span>
                    {isAnswered && (
                      <span className="absolute bottom-1 right-1 text-[9px] leading-none opacity-80">
                        {answers[q.id]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-blue-600 shrink-0" />
                <span>Sudah Dijawab</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-400 shrink-0" />
                <span>Ragu-ragu</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-white border border-slate-300 shrink-0" />
                <span>Belum Dijawab</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded ring-2 ring-blue-500 bg-white shrink-0" />
                <span>Sedang Aktif</span>
              </div>
            </div>

            {/* Final Submit CTA */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Kumpulkan Semua Jawaban</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-center text-slate-900 mb-1">
              Konfirmasi Selesai Ujian?
            </h3>
            <p className="text-xs text-center text-slate-500 mb-4">
              Setelah dikirim, jawaban Anda akan langsung tersimpan ke Google Spreadsheet sheet <strong className="text-blue-600">Hasil_Jawaban</strong> dan skor akhir Anda akan ditampilkan secara real-time.
            </p>

            {/* Stats Overview */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 mb-5 space-y-2 text-xs">
              <div className="flex justify-between text-slate-700">
                <span>Total Soal:</span>
                <span className="font-bold">{questions.length} Soal</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Soal Terjawab:</span>
                <span className="font-bold">{answeredCount} Soal</span>
              </div>
              {unansweredCount > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>Belum Terjawab:</span>
                  <span>{unansweredCount} Soal</span>
                </div>
              )}
              {flaggedCount > 0 && (
                <div className="flex justify-between text-amber-700">
                  <span>Masih Ditandai Ragu-ragu:</span>
                  <span className="font-bold">{flaggedCount} Soal</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
              >
                Cek Kembali
              </button>
              <button
                id="confirm-submit-exam-btn"
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Ya, Kumpulkan</span>
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
