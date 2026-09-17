import React, { useState, useMemo } from 'react';
import { Trophy, Medal, Award, Clock, Search, Filter, Sparkles, Building2, User, CheckCircle2, ChevronRight, Printer } from 'lucide-react';
import { ExamResult } from '../types';

interface LeaderboardScreenProps {
  results: ExamResult[];
  onTakeExam?: () => void;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  results,
  onTakeExam,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'LULUS' | 'TIDAK LULUS'>('all');

  // Strict sorting based on user requirement:
  // 1. Highest Score (skor DESC)
  // 2. If score is equal: Fastest Completion Time (durasiDetik ASC)
  // 3. If duration is equal: Earliest submission timestamp (timestamp ASC)
  const rankedResults = useMemo(() => {
    const list = [...results];
    list.sort((a, b) => {
      // 1. Compare score descending
      if (b.skor !== a.skor) {
        return b.skor - a.skor;
      }
      // 2. Compare duration in seconds ascending (faster time wins)
      if (a.durasiDetik !== b.durasiDetik) {
        return a.durasiDetik - b.durasiDetik;
      }
      // 3. Compare timestamp ascending
      return a.timestamp.localeCompare(b.timestamp);
    });

    return list.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  }, [results]);

  // Filtered list
  const filteredResults = useMemo(() => {
    return rankedResults.filter((item) => {
      const matchQuery =
        item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nik.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.toko.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus =
        filterStatus === 'all' || item.statusKelulusan === filterStatus;

      return matchQuery && matchStatus;
    });
  }, [rankedResults, searchQuery, filterStatus]);

  const juara1 = rankedResults[0] || null;
  const juara2 = rankedResults[1] || null;
  const juara3 = rankedResults[2] || null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6">
      {/* Header Title & Rule Banner */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 mb-2">
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <span>Papan Juara STM Indomaret</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Klasemen & Peringkat Juara 1 - 3
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Penilaian otomatis real-time berdasarkan hasil pengerjaan soal ujian.
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Cetak Rekap</span>
          </button>
          {onTakeExam && (
            <button
              onClick={onTakeExam}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <span>Ikuti Ujian</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tie-Breaker Rule Notice Box */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-50/70 to-blue-50/50 border border-amber-300/80 rounded-xl p-3.5 mb-8 flex items-start gap-3 text-xs text-amber-950">
        <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-900">Ketentuan Penentuan Juara:</span>{' '}
          Peringkat utama ditentukan dari <strong>Nilai Skor Tertinggi</strong>. Apabila terdapat peserta dengan skor yang sama, juara ditentukan berdasarkan <strong>Waktu Penyelesaian Tercepat</strong> (durasi tersingkat).
        </div>
      </div>

      {/* Podium Display for Top 3 Champions */}
      <div className="mb-10">
        <div className="text-center mb-5">
          <h2 className="text-lg font-bold text-slate-900">
            Podium Juara 1, 2, dan 3
          </h2>
          <p className="text-xs text-slate-500">
            Peserta terbaik Meeting STM Indomaret
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 items-end max-w-4xl mx-auto pt-4">
          {/* JUARA 2 - Silver (Left) */}
          <div className="order-2 md:order-1">
            <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-sm p-5 text-center relative hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 border-2 border-slate-300 flex items-center justify-center mx-auto -mt-10 mb-3 shadow-sm font-black text-lg">
                🥈
              </div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-800 uppercase tracking-wider mb-2">
                Juara 2 (Perak)
              </span>

              {juara2 ? (
                <>
                  <h3 className="font-extrabold text-base text-slate-900 mb-1 line-clamp-1">
                    {juara2.nama}
                  </h3>
                  <div className="text-xs text-slate-500 mb-3 line-clamp-1">
                    {juara2.toko}
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1">
                    <div className="text-2xl font-black text-slate-800">
                      {juara2.skor} <span className="text-xs font-normal text-slate-500">/ 100</span>
                    </div>
                    <div className="text-xs text-slate-600 flex items-center justify-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>Waktu: <strong>{juara2.durasiFormatted}</strong></span>
                    </div>
                  </div>
                  <div className="mt-3 text-[11px] text-slate-400 font-mono">
                    NIK: {juara2.nik}
                  </div>
                </>
              ) : (
                <div className="py-6 text-xs text-slate-400 italic">
                  Belum ada peserta di posisi ini
                </div>
              )}
            </div>
            {/* Podium Base */}
            <div className="h-14 bg-gradient-to-b from-slate-200 to-slate-300 rounded-b-xl hidden md:flex items-center justify-center font-black text-slate-600 text-xl shadow-inner border border-slate-300">
              2
            </div>
          </div>

          {/* JUARA 1 - Gold (Center - Taller) */}
          <div className="order-1 md:order-2 -mt-4">
            <div className="bg-gradient-to-b from-amber-50/70 via-white to-amber-50/30 rounded-2xl border-2 border-amber-400 shadow-md p-6 text-center relative hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-white border-2 border-amber-400 flex items-center justify-center mx-auto -mt-12 mb-3 shadow-md font-black text-2xl">
                🥇
              </div>
              <span className="inline-block px-3 py-0.5 rounded-full text-xs font-black bg-amber-400 text-amber-950 uppercase tracking-wider mb-2 shadow-2xs">
                Juara 1 (Emas)
              </span>

              {juara1 ? (
                <>
                  <h3 className="font-black text-lg text-slate-900 mb-1 line-clamp-1">
                    {juara1.nama}
                  </h3>
                  <div className="text-xs text-slate-600 font-medium mb-3 line-clamp-1">
                    {juara1.toko}
                  </div>
                  <div className="bg-amber-100/60 rounded-xl p-3.5 border border-amber-300/80 space-y-1">
                    <div className="text-3xl font-black text-amber-950">
                      {juara1.skor} <span className="text-xs font-normal text-amber-800">/ 100</span>
                    </div>
                    <div className="text-xs text-amber-900 font-semibold flex items-center justify-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>Waktu Tercepat: <strong>{juara1.durasiFormatted}</strong></span>
                    </div>
                  </div>
                  <div className="mt-3 text-[11px] text-amber-800 font-mono">
                    NIK: {juara1.nik} &bull; {juara1.jumlahBenar}/{juara1.totalSoal} Benar
                  </div>
                </>
              ) : (
                <div className="py-8 text-xs text-slate-400 italic">
                  Belum ada peserta yang menyelesaikan ujian
                </div>
              )}
            </div>
            {/* Podium Base */}
            <div className="h-20 bg-gradient-to-b from-amber-400 to-amber-500 rounded-b-xl hidden md:flex items-center justify-center font-black text-amber-950 text-2xl shadow-inner border border-amber-400">
              1
            </div>
          </div>

          {/* JUARA 3 - Bronze (Right) */}
          <div className="order-3">
            <div className="bg-white rounded-2xl border-2 border-amber-700/30 shadow-sm p-5 text-center relative hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 border-2 border-amber-600/40 flex items-center justify-center mx-auto -mt-10 mb-3 shadow-sm font-black text-lg">
                🥉
              </div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-200 text-amber-950 uppercase tracking-wider mb-2">
                Juara 3 (Perunggu)
              </span>

              {juara3 ? (
                <>
                  <h3 className="font-extrabold text-base text-slate-900 mb-1 line-clamp-1">
                    {juara3.nama}
                  </h3>
                  <div className="text-xs text-slate-500 mb-3 line-clamp-1">
                    {juara3.toko}
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1">
                    <div className="text-2xl font-black text-slate-800">
                      {juara3.skor} <span className="text-xs font-normal text-slate-500">/ 100</span>
                    </div>
                    <div className="text-xs text-slate-600 flex items-center justify-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>Waktu: <strong>{juara3.durasiFormatted}</strong></span>
                    </div>
                  </div>
                  <div className="mt-3 text-[11px] text-slate-400 font-mono">
                    NIK: {juara3.nik}
                  </div>
                </>
              ) : (
                <div className="py-6 text-xs text-slate-400 italic">
                  Belum ada peserta di posisi ini
                </div>
              )}
            </div>
            {/* Podium Base */}
            <div className="h-10 bg-gradient-to-b from-amber-700/40 to-amber-700/60 rounded-b-xl hidden md:flex items-center justify-center font-black text-white text-lg shadow-inner border border-amber-700/40">
              3
            </div>
          </div>
        </div>
      </div>

      {/* Full Leaderboard Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Daftar Lengkap Peringkat Peserta
            </h3>
            <p className="text-xs text-slate-500">
              Total {filteredResults.length} hasil ujian terdata
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Nama, NIK, Toko..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e: any) => setFilterStatus(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Status</option>
              <option value="LULUS">Hanya Lulus</option>
              <option value="TIDAK LULUS">Tidak Lulus</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-[11px] font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4 text-center w-16">Peringkat</th>
                <th className="py-3 px-4">Nama Peserta & NIK</th>
                <th className="py-3 px-4">Unit / Toko</th>
                <th className="py-3 px-4 text-center">Skor Akhir</th>
                <th className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Durasi (Penentu)</span>
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Benar / Salah</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Waktu Submit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
              {filteredResults.length > 0 ? (
                filteredResults.map((row) => {
                  let badge = null;
                  let rowHighlight = '';

                  if (row.rank === 1) {
                    badge = (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-amber-950 font-black text-xs shadow-xs">
                        1
                      </span>
                    );
                    rowHighlight = 'bg-amber-50/40 font-medium';
                  } else if (row.rank === 2) {
                    badge = (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-800 font-bold text-xs shadow-xs">
                        2
                      </span>
                    );
                    rowHighlight = 'bg-slate-50/50';
                  } else if (row.rank === 3) {
                    badge = (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700/30 text-amber-900 font-bold text-xs shadow-xs">
                        3
                      </span>
                    );
                    rowHighlight = 'bg-amber-50/20';
                  } else {
                    badge = (
                      <span className="inline-flex items-center justify-center w-6 h-6 text-slate-500 font-semibold text-xs">
                        #{row.rank}
                      </span>
                    );
                  }

                  return (
                    <tr key={row.id || `${row.nik}-${row.timestamp}`} className={`hover:bg-blue-50/40 transition-colors ${rowHighlight}`}>
                      <td className="py-3 px-4 text-center">{badge}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{row.nama}</span>
                          {row.rank <= 3 && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              Top {row.rank}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          NIK: {row.nik}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{row.toko}</div>
                        <div className="text-[11px] text-slate-500">{row.jabatan}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm font-black text-slate-900">
                          {row.skor}
                        </span>
                        <span className="text-[10px] text-slate-400 block">/ 100</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-md font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200">
                          {row.durasiFormatted}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-emerald-600 font-semibold">{row.jumlahBenar}</span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className="text-rose-500 font-semibold">{row.jumlahSalah}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.statusKelulusan === 'LULUS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {row.statusKelulusan}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-[11px] text-slate-500 font-mono">
                        {row.timestamp}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                    Tidak ditemukan data hasil ujian yang sesuai filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
