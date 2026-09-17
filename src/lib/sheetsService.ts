import { Participant, Question, ExamResult } from '../types';
import { SPREADSHEET_ID, INITIAL_PARTICIPANTS, INITIAL_QUESTIONS, INITIAL_RESULTS } from '../data/defaultData';
import { getAccessToken } from './firebase';

const STORAGE_KEYS = {
  PARTICIPANTS: 'stm_participants_cache',
  DATA_PESERTA: 'stm_data_peserta_cache',
  DATA_LOGIN: 'stm_data_login_cache',
  QUESTIONS: 'stm_questions_cache',
  RESULTS: 'stm_results_cache',
  CONFIG: 'stm_exam_config',
};

// Helper: Read from LocalStorage or fallback
export const getCachedDataPeserta = (): Participant[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DATA_PESERTA);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading data_peserta cache', e);
  }
  return INITIAL_PARTICIPANTS;
};

export const saveCachedDataPeserta = (data: Participant[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.DATA_PESERTA, JSON.stringify(data));
  } catch (e) {
    console.warn('Error saving data_peserta cache (quota exceeded or storage disabled)', e);
  }
};

export const getCachedDataLogin = (): Participant[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DATA_LOGIN);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading data_login cache', e);
  }
  return INITIAL_PARTICIPANTS;
};

export const saveCachedDataLogin = (data: Participant[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.DATA_LOGIN, JSON.stringify(data));
  } catch (e) {
    console.warn('Error saving data_login cache (quota exceeded or storage disabled)', e);
  }
};

export const getCachedParticipants = (): Participant[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PARTICIPANTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading participants cache', e);
  }
  return INITIAL_PARTICIPANTS;
};

export const saveCachedParticipants = (data: Participant[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.PARTICIPANTS, JSON.stringify(data));
  } catch (e) {
    console.warn('Error saving participants cache (quota exceeded or storage disabled)', e);
  }
};

export const getCachedQuestions = (): Question[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading questions cache', e);
  }
  return INITIAL_QUESTIONS;
};

export const saveCachedQuestions = (data: Question[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving questions cache', e);
  }
};

export const getCachedResults = (): ExamResult[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RESULTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading results cache', e);
  }
  return INITIAL_RESULTS;
};

export const saveCachedResults = (data: ExamResult[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving results cache', e);
  }
};

// Google Sheets API Helpers
const BASE_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`;

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('NO_TOKEN');
  }

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(message);
  }
  return response.json();
}

// Fetch all sheets metadata
export async function getSpreadsheetDetails() {
  return await fetchWithAuth(BASE_URL);
}

// Ensure sheet exists; if not, create it
export async function ensureSheetExists(sheetTitle: string) {
  try {
    const meta = await getSpreadsheetDetails();
    const sheets = meta.sheets || [];
    const exists = sheets.some((s: any) => s.properties?.title === sheetTitle);

    if (!exists) {
      // Add sheet
      await fetchWithAuth(`${BASE_URL}:batchUpdate`, {
        method: 'POST',
        body: JSON.stringify({
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetTitle,
                },
              },
            },
          ],
        }),
      });
    }
  } catch (err) {
    console.warn(`Could not verify sheet ${sheetTitle}:`, err);
  }
}

// Fetch rows from public Google Visualization API endpoint (works with no OAuth required)
async function fetchPublicGvizRows(sheetName: string): Promise<any[]> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const text = await response.text();
    const match = text.match(/google\.visualization\.Query\.setResponse\((.*)\);/s);
    if (!match) return [];
    const parsed = JSON.parse(match[1]);
    return parsed?.table?.rows || [];
  } catch (err) {
    console.warn(`Public gviz fetch failed for ${sheetName}:`, err);
    return [];
  }
}

// 1. Fetch Data_Peserta from Google Sheets (Used for Aktivitas & Status Peserta)
export async function fetchDataPesertaFromSheet(): Promise<Participant[]> {
  try {
    // Attempt 1: Fetch via public Google Visualization endpoint (captures all 5,011+ rows immediately)
    const gvizRows = await fetchPublicGvizRows('Data_Peserta');
    if (gvizRows && gvizRows.length > 0) {
      const participants: Participant[] = [];
      for (let i = 0; i < gvizRows.length; i++) {
        const c = gvizRows[i]?.c || [];
        const nik = c[0]?.f ? String(c[0].f).trim() : (c[0]?.v !== undefined && c[0]?.v !== null ? String(c[0].v).trim() : '');
        const nama = c[1]?.v !== undefined && c[1]?.v !== null ? String(c[1].v).trim() : '';
        const valC = c[2]?.v !== undefined && c[2]?.v !== null ? String(c[2].v).trim() : '';
        const valD = c[3]?.v !== undefined && c[3]?.v !== null ? String(c[3].v).trim() : '';

        // Determine Toko vs Jabatan
        let toko = 'TOWJ';
        let jabatan = 'Store Crew';

        if (valC.length <= 6 && /^[A-Za-z0-9]+$/.test(valC) && valD.length > 6) {
          toko = valC;
          jabatan = valD;
        } else if (valD.length <= 6 && /^[A-Za-z0-9]+$/.test(valD) && valC.length > 4) {
          jabatan = valC;
          toko = valD;
        } else {
          jabatan = valC || jabatan;
          toko = valD || toko;
        }

        if (nik && nama) {
          participants.push({
            nik,
            nama,
            password: '123',
            toko,
            jabatan,
            status: 'Belum Ujian',
          });
        }
      }

      if (participants.length > 0) {
        saveCachedDataPeserta(participants);
        return participants;
      }
    }

    // Attempt 2: Fetch via authenticated Google Sheets API (Data_Peserta!A2:D without hard row limits)
    try {
      const data = await fetchWithAuth(`${BASE_URL}/values/Data_Peserta!A1:Z10000`);
      const rows = data.values;
      if (rows && rows.length >= 2) {
        const headers = rows[0].map((h: string) => (h || '').toString().toLowerCase().trim());
        const nikIdx = headers.findIndex((h: string) => h.includes('nik'));
        const namaIdx = headers.findIndex((h: string) => h.includes('nama'));

        const participants: Participant[] = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          const nik = String(row[nikIdx !== -1 ? nikIdx : 0] || '').trim();
          const nama = String(row[namaIdx !== -1 ? namaIdx : 1] || '').trim();
          const valC = String(row[2] || '').trim();
          const valD = String(row[3] || '').trim();

          let toko = 'TOWJ';
          let jabatan = 'Store Crew';
          if (valC.length <= 6 && /^[A-Za-z0-9]+$/.test(valC) && valD.length > 6) {
            toko = valC;
            jabatan = valD;
          } else if (valD.length <= 6 && /^[A-Za-z0-9]+$/.test(valD) && valC.length > 4) {
            jabatan = valC;
            toko = valD;
          } else {
            jabatan = valC || jabatan;
            toko = valD || toko;
          }

          if (nik && nama) {
            participants.push({
              nik,
              nama,
              password: '123',
              toko,
              jabatan,
              status: 'Belum Ujian',
            });
          }
        }

        if (participants.length > 0) {
          saveCachedDataPeserta(participants);
          return participants;
        }
      }
    } catch {
      // Ignored, proceed to cache fallback
    }

    return getCachedDataPeserta();
  } catch (error) {
    console.error('Failed to fetch Data_Peserta from Google Sheets:', error);
    return getCachedDataPeserta();
  }
}

// 2. Fetch Data_Login from Google Sheets (Used for Menu Data Peserta / Login Accounts)
export async function fetchDataLoginFromSheet(): Promise<Participant[]> {
  try {
    // Attempt 1: Fetch via public Google Visualization endpoint
    const gvizRows = await fetchPublicGvizRows('Data_Login');
    if (gvizRows && gvizRows.length > 0) {
      const list: Participant[] = [];
      for (let i = 0; i < gvizRows.length; i++) {
        const c = gvizRows[i]?.c || [];
        const nik = c[0]?.f ? String(c[0].f).trim() : (c[0]?.v !== undefined && c[0]?.v !== null ? String(c[0].v).trim() : '');
        const nama = c[1]?.v !== undefined && c[1]?.v !== null ? String(c[1].v).trim() : '';
        const password = c[2]?.f ? String(c[2].f).trim() : (c[2]?.v !== undefined && c[2]?.v !== null ? String(c[2].v).trim() : '123');

        if (nik && nama) {
          list.push({
            nik,
            nama,
            password: password || '123',
            toko: 'Indomaret',
            jabatan: 'Store Crew',
            status: 'Belum Ujian',
          });
        }
      }

      if (list.length > 0) {
        saveCachedDataLogin(list);
        return list;
      }
    }

    // Attempt 2: Fetch via authenticated Google Sheets API
    try {
      const data = await fetchWithAuth(`${BASE_URL}/values/Data_Login!A1:Z10000`);
      const rows = data.values;
      if (rows && rows.length >= 2) {
        const headers = rows[0].map((h: string) => (h || '').toString().toLowerCase().trim());
        const nikIdx = headers.findIndex((h: string) => h.includes('nik'));
        const namaIdx = headers.findIndex((h: string) => h.includes('nama'));
        const passIdx = headers.findIndex((h: string) => h.includes('pass') || h.includes('pin') || h.includes('pwd'));

        const list: Participant[] = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          const nik = String(row[nikIdx !== -1 ? nikIdx : 0] || '').trim();
          const nama = String(row[namaIdx !== -1 ? namaIdx : 1] || '').trim();
          const password = String(row[passIdx !== -1 ? passIdx : 2] || '123').trim();

          if (nik && nama) {
            list.push({
              nik,
              nama,
              password: password || '123',
              toko: 'Indomaret',
              jabatan: 'Store Crew',
              status: 'Belum Ujian',
            });
          }
        }

        if (list.length > 0) {
          saveCachedDataLogin(list);
          return list;
        }
      }
    } catch {
      // Ignored, proceed to cache fallback
    }

    return getCachedDataLogin();
  } catch (error) {
    console.error('Failed to fetch Data_Login from Google Sheets:', error);
    return getCachedDataLogin();
  }
}

// Append new login account to sheet Data_Login
export async function addLoginAccountToSheet(p: { nik: string; nama: string; password: string }): Promise<boolean> {
  try {
    const body = {
      values: [[p.nik, p.nama, p.password || '123']],
    };
    await fetchWithAuth(`${BASE_URL}/values/Data_Login!A:C:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return true;
  } catch (err) {
    console.warn('Could not append login account to Data_Login in Google Sheets:', err);
    return false;
  }
}

// Append new participant to Data_Peserta in Google Sheets
export async function addParticipantToSheet(p: Participant): Promise<boolean> {
  try {
    // 1. Append to Data_Peserta: NIK, NAMA, Jabatan, Kode Toko
    const pesertaBody = {
      values: [[p.nik, p.nama, p.jabatan || 'Store Crew', p.toko || 'TOWJ']],
    };
    await fetchWithAuth(`${BASE_URL}/values/Data_Peserta!A:D:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      body: JSON.stringify(pesertaBody),
    }).catch(() => null);

    // 2. Also append to Data_Login: NIK, NAMA, Password
    await addLoginAccountToSheet({
      nik: p.nik,
      nama: p.nama,
      password: p.password || '123',
    });

    return true;
  } catch (err) {
    console.warn('Could not append participant to Google Sheets:', err);
    return false;
  }
}

// Fetch all participants (merging Data_Peserta and Data_Login)
export async function fetchParticipantsFromSheet(): Promise<Participant[]> {
  try {
    const [pesertaList, loginList] = await Promise.all([
      fetchDataPesertaFromSheet(),
      fetchDataLoginFromSheet(),
    ]);

    // Merge by NIK: profiles from Data_Peserta + passwords from Data_Login
    const map = new Map<string, Participant>();
    pesertaList.forEach((p) => {
      map.set(p.nik, { ...p });
    });

    loginList.forEach((l) => {
      const existing = map.get(l.nik);
      if (existing) {
        existing.password = l.password || existing.password || '123';
        if (!existing.nama && l.nama) existing.nama = l.nama;
      } else {
        map.set(l.nik, { ...l });
      }
    });

    const merged = Array.from(map.values());
    if (merged.length > 0) {
      saveCachedParticipants(merged);
      return merged;
    }
    return getCachedParticipants();
  } catch (error) {
    console.error('Failed to fetch participants from Google Sheets:', error);
    return getCachedParticipants();
  }
}

// Fetch Soal_Test from Google Sheets
export async function fetchQuestionsFromSheet(): Promise<Question[]> {
  try {
    // Attempt 1: Fetch via public Google Visualization endpoint
    const gvizRows = await fetchPublicGvizRows('Soal_Test');
    if (gvizRows && gvizRows.length > 0) {
      const questions: Question[] = [];
      for (let i = 0; i < gvizRows.length; i++) {
        const c = gvizRows[i]?.c || [];
        const idVal = c[0]?.v !== undefined ? Number(c[0].v) : i + 1;
        const pertanyaan = c[1]?.v !== undefined ? String(c[1].v).trim() : '';
        const pilihanA = c[2]?.v !== undefined ? String(c[2].v).trim() : '';
        const pilihanB = c[3]?.v !== undefined ? String(c[3].v).trim() : '';
        const pilihanC = c[4]?.v !== undefined ? String(c[4].v).trim() : '';
        const pilihanD = c[5]?.v !== undefined ? String(c[5].v).trim() : '';
        const kunciRaw = c[6]?.v !== undefined ? String(c[6].v).trim().toUpperCase() : 'A';
        const bobot = c[7]?.v !== undefined ? Number(c[7].v) || 10 : 10;
        const kategori = c[8]?.v !== undefined ? String(c[8].v).trim() : 'Operasional STM';
        const penjelasan = c[9]?.v !== undefined ? String(c[9].v).trim() : '';

        if (pertanyaan && pilihanA) {
          questions.push({
            id: Number(idVal) || i + 1,
            pertanyaan,
            pilihanA,
            pilihanB,
            pilihanC,
            pilihanD,
            kunciJawaban: kunciRaw.charAt(0) || 'A',
            bobot,
            kategori: kategori || 'Operasional STM',
            penjelasan,
          });
        }
      }

      if (questions.length > 0) {
        saveCachedQuestions(questions);
        return questions;
      }
    }

    // Attempt 2: Fetch via authenticated Google Sheets API
    try {
      const data = await fetchWithAuth(`${BASE_URL}/values/Soal_Test!A1:Z500`);
      const rows = data.values;
      if (rows && rows.length >= 2) {
        const headers = rows[0].map((h: string) => (h || '').toString().toLowerCase().trim());
        const idIdx = headers.findIndex((h: string) => h.includes('no') || h.includes('id'));
        const soalIdx = headers.findIndex((h: string) => h.includes('soal') || h.includes('pertanyaan'));
        const aIdx = headers.findIndex((h: string) => h.includes('pilihan_a') || h.includes('opsi a') || h === 'a');
        const bIdx = headers.findIndex((h: string) => h.includes('pilihan_b') || h.includes('opsi b') || h === 'b');
        const cIdx = headers.findIndex((h: string) => h.includes('pilihan_c') || h.includes('opsi c') || h === 'c');
        const dIdx = headers.findIndex((h: string) => h.includes('pilihan_d') || h.includes('opsi d') || h === 'd');
        const eIdx = headers.findIndex((h: string) => h.includes('pilihan_e') || h.includes('opsi e') || h === 'e');
        const kunciIdx = headers.findIndex((h: string) => h.includes('kunci') || h.includes('jawaban'));
        const bobotIdx = headers.findIndex((h: string) => h.includes('bobot') || h.includes('poin'));
        const katIdx = headers.findIndex((h: string) => h.includes('kategori') || h.includes('topik'));
        const penjelIdx = headers.findIndex((h: string) => h.includes('penjelasan') || h.includes('pembahasan'));

        const questions: Question[] = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          const idVal = row[idIdx !== -1 ? idIdx : 0];
          const pertanyaan = String(row[soalIdx !== -1 ? soalIdx : 1] || '').trim();
          const pilihanA = String(row[aIdx !== -1 ? aIdx : 2] || '').trim();
          const pilihanB = String(row[bIdx !== -1 ? bIdx : 3] || '').trim();
          const pilihanC = String(row[cIdx !== -1 ? cIdx : 4] || '').trim();
          const pilihanD = String(row[dIdx !== -1 ? dIdx : 5] || '').trim();
          const pilihanE = eIdx !== -1 && row[eIdx] ? String(row[eIdx]).trim() : undefined;
          const kunciRaw = String(row[kunciIdx !== -1 ? kunciIdx : 6] || 'A').trim().toUpperCase();
          const kunciJawaban = kunciRaw.charAt(0) || 'A';
          const bobot = Number(row[bobotIdx !== -1 ? bobotIdx : 7]) || 10;
          const kategori = String(row[katIdx !== -1 ? katIdx : 8] || 'Operasional STM').trim();
          const penjelasan = String(row[penjelIdx !== -1 ? penjelIdx : 9] || '').trim();

          if (pertanyaan && pilihanA) {
            questions.push({
              id: Number(idVal) || i,
              pertanyaan,
              pilihanA,
              pilihanB,
              pilihanC,
              pilihanD,
              pilihanE,
              kunciJawaban,
              bobot,
              kategori,
              penjelasan,
            });
          }
        }

        if (questions.length > 0) {
          saveCachedQuestions(questions);
          return questions;
        }
      }
    } catch {
      // Fall through to cache
    }

    return getCachedQuestions();
  } catch (error) {
    console.error('Failed to fetch questions from Google Sheets:', error);
    return getCachedQuestions();
  }
}

// Fetch Hasil_Jawaban from Google Sheets
export async function fetchResultsFromSheet(): Promise<ExamResult[]> {
  try {
    // Attempt 1: Fetch via public Google Visualization endpoint
    const gvizRows = await fetchPublicGvizRows('Hasil_Jawaban');
    if (gvizRows && gvizRows.length > 0) {
      const results: ExamResult[] = [];
      for (let i = 0; i < gvizRows.length; i++) {
        const c = gvizRows[i]?.c || [];
        const timestamp = c[0]?.v !== undefined ? String(c[0].v).trim() : new Date().toISOString();
        const nik = c[1]?.f ? String(c[1].f).trim() : (c[1]?.v !== undefined ? String(c[1].v).trim() : '');
        const nama = c[2]?.v !== undefined ? String(c[2].v).trim() : '';
        const toko = c[3]?.v !== undefined ? String(c[3].v).trim() : '';
        const jabatan = c[4]?.v !== undefined ? String(c[4].v).trim() : '';
        const skor = c[5]?.v !== undefined ? Number(c[5].v) || 0 : 0;
        const totalSoal = c[6]?.v !== undefined ? Number(c[6].v) || 10 : 10;
        const jumlahBenar = c[7]?.v !== undefined ? Number(c[7].v) || 0 : 0;
        const jumlahSalah = c[8]?.v !== undefined ? Number(c[8].v) || 0 : 0;
        const waktuMulai = c[9]?.v !== undefined ? String(c[9].v).trim() : '';
        const waktuSelesai = c[10]?.v !== undefined ? String(c[10].v).trim() : '';
        const durasiDetik = c[11]?.v !== undefined ? Number(c[11].v) || 0 : 0;
        const durasiFormatted = c[12]?.v !== undefined ? String(c[12].v).trim() : `${Math.floor(durasiDetik / 60)}:${String(durasiDetik % 60).padStart(2, '0')}`;
        const statusRaw = c[13]?.v !== undefined ? String(c[13].v).trim().toUpperCase() : '';
        const statusKelulusan: 'LULUS' | 'TIDAK LULUS' = statusRaw.includes('TIDAK') ? 'TIDAK LULUS' : 'LULUS';
        const detailJawaban = c[14]?.v !== undefined ? String(c[14].v).trim() : '';

        if (nik || nama) {
          results.push({
            id: `sheet-${i}`,
            timestamp,
            nik,
            nama,
            toko,
            jabatan,
            skor,
            totalSoal,
            jumlahBenar,
            jumlahSalah,
            waktuMulai,
            waktuSelesai,
            durasiDetik,
            durasiFormatted,
            statusKelulusan,
            detailJawaban,
          });
        }
      }

      if (results.length > 0) {
        saveCachedResults(results);
        return results;
      }
    }

    // Attempt 2: Fetch via authenticated Google Sheets API
    try {
      const data = await fetchWithAuth(`${BASE_URL}/values/Hasil_Jawaban!A1:Z500`);
      const rows = data.values;
      if (rows && rows.length >= 2) {
        const headers = rows[0].map((h: string) => (h || '').toString().toLowerCase().trim());
        const tsIdx = headers.findIndex((h: string) => h.includes('time') || h.includes('tanggal') || h.includes('waktu'));
        const nikIdx = headers.findIndex((h: string) => h.includes('nik'));
        const namaIdx = headers.findIndex((h: string) => h.includes('nama'));
        const tokoIdx = headers.findIndex((h: string) => h.includes('toko'));
        const jabatanIdx = headers.findIndex((h: string) => h.includes('jabatan'));
        const skorIdx = headers.findIndex((h: string) => h.includes('skor') || h.includes('nilai'));
        const totalIdx = headers.findIndex((h: string) => h.includes('total'));
        const benarIdx = headers.findIndex((h: string) => h.includes('benar'));
        const salahIdx = headers.findIndex((h: string) => h.includes('salah'));
        const mulaiIdx = headers.findIndex((h: string) => h.includes('mulai'));
        const selesaiIdx = headers.findIndex((h: string) => h.includes('selesai'));
        const durasiDetikIdx = headers.findIndex((h: string) => h.includes('detik'));
        const durasiFmtIdx = headers.findIndex((h: string) => h.includes('durasi'));
        const statusIdx = headers.findIndex((h: string) => h.includes('status'));
        const detailIdx = headers.findIndex((h: string) => h.includes('detail') || h.includes('jawaban'));

        const results: ExamResult[] = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          const nik = String(row[nikIdx !== -1 ? nikIdx : 1] || '').trim();
          const nama = String(row[namaIdx !== -1 ? namaIdx : 2] || '').trim();
          const skor = Number(row[skorIdx !== -1 ? skorIdx : 5]) || 0;
          const durasiDetik = Number(row[durasiDetikIdx !== -1 ? durasiDetikIdx : 11]) || 0;
          const durasiFormatted = String(row[durasiFmtIdx !== -1 ? durasiFmtIdx : 12] || `${Math.floor(durasiDetik / 60)}:${String(durasiDetik % 60).padStart(2, '0')}`).trim();

          if (nik || nama) {
            results.push({
              id: `sheet-${i}`,
              timestamp: String(row[tsIdx !== -1 ? tsIdx : 0] || new Date().toISOString()).trim(),
              nik,
              nama,
              toko: String(row[tokoIdx !== -1 ? tokoIdx : 3] || '').trim(),
              jabatan: String(row[jabatanIdx !== -1 ? jabatanIdx : 4] || '').trim(),
              skor,
              totalSoal: Number(row[totalIdx !== -1 ? totalIdx : 6]) || 10,
              jumlahBenar: Number(row[benarIdx !== -1 ? benarIdx : 7]) || 0,
              jumlahSalah: Number(row[salahIdx !== -1 ? salahIdx : 8]) || 0,
              waktuMulai: String(row[mulaiIdx !== -1 ? mulaiIdx : 9] || '').trim(),
              waktuSelesai: String(row[selesaiIdx !== -1 ? selesaiIdx : 10] || '').trim(),
              durasiDetik,
              durasiFormatted,
              statusKelulusan: String(row[statusIdx !== -1 ? statusIdx : 13] || '').toUpperCase().includes('TIDAK') ? 'TIDAK LULUS' : 'LULUS',
              detailJawaban: String(row[detailIdx !== -1 ? detailIdx : 14] || '').trim(),
            });
          }
        }

        if (results.length > 0) {
          saveCachedResults(results);
          return results;
        }
      }
    } catch {
      // Fall through to cache
    }

    return getCachedResults();
  } catch (error) {
    console.error('Failed to fetch results from Google Sheets:', error);
    return getCachedResults();
  }
}

// Append Participant Result directly into sheet Hasil_Jawaban
export async function submitResultToSheet(result: ExamResult): Promise<boolean> {
  // Always update local cache first
  const existingCached = getCachedResults().filter((r) => r.nik !== result.nik);
  const updatedResults = [result, ...existingCached];
  saveCachedResults(updatedResults);

  try {
    await ensureSheetExists('Hasil_Jawaban');

    // Check if header row exists
    let hasHeader = false;
    try {
      const headerCheck = await fetchWithAuth(`${BASE_URL}/values/Hasil_Jawaban!A1:O1`);
      if (headerCheck.values && headerCheck.values.length > 0 && headerCheck.values[0].length > 0) {
        hasHeader = true;
      }
    } catch {
      hasHeader = false;
    }

    if (!hasHeader) {
      const headers = [
        'Timestamp',
        'NIK',
        'Nama Peserta',
        'Toko / Unit',
        'Jabatan',
        'Skor Akhir',
        'Total Soal',
        'Jumlah Benar',
        'Jumlah Salah',
        'Waktu Mulai',
        'Waktu Selesai',
        'Durasi (Detik)',
        'Durasi (MM:SS)',
        'Status Kelulusan',
        'Detail Jawaban',
      ];
      await fetchWithAuth(`${BASE_URL}/values/Hasil_Jawaban!A1:O1?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        body: JSON.stringify({
          range: 'Hasil_Jawaban!A1:O1',
          majorDimension: 'ROWS',
          values: [headers],
        }),
      });
    }

    // Append submission row
    const rowValues = [
      result.timestamp,
      result.nik,
      result.nama,
      result.toko,
      result.jabatan,
      result.skor,
      result.totalSoal,
      result.jumlahBenar,
      result.jumlahSalah,
      result.waktuMulai,
      result.waktuSelesai,
      result.durasiDetik,
      result.durasiFormatted,
      result.statusKelulusan,
      result.detailJawaban || '',
    ];

    await fetchWithAuth(`${BASE_URL}/values/Hasil_Jawaban!A1:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      body: JSON.stringify({
        range: 'Hasil_Jawaban!A1',
        majorDimension: 'ROWS',
        values: [rowValues],
      }),
    });

    return true;
  } catch (err) {
    console.warn('Could not append directly to Google Sheet (will stay in local cache):', err);
    return false;
  }
}

// Save complete questions list to Google Sheet (sync after delete/reorder)
export async function saveAllQuestionsToSheet(updatedQuestions: Question[]): Promise<boolean> {
  saveCachedQuestions(updatedQuestions);

  try {
    await ensureSheetExists('Soal_Test');
    const soalHeaders = ['No', 'Pertanyaan', 'Pilihan_A', 'Pilihan_B', 'Pilihan_C', 'Pilihan_D', 'Kunci_Jawaban', 'Bobot', 'Kategori', 'Penjelasan'];
    const soalRows = updatedQuestions.map((q, idx) => [
      idx + 1,
      q.pertanyaan,
      q.pilihanA,
      q.pilihanB,
      q.pilihanC,
      q.pilihanD,
      q.kunciJawaban,
      q.bobot || 10,
      q.kategori || 'Operasional STM',
      q.penjelasan || '',
    ]);

    // Clear and rewrite Soal_Test range
    await fetchWithAuth(`${BASE_URL}/values/Soal_Test!A1:J100:clear`, {
      method: 'POST',
    }).catch(() => null);

    await fetchWithAuth(`${BASE_URL}/values/Soal_Test!A1:J${soalRows.length + 1}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      body: JSON.stringify({
        range: `Soal_Test!A1:J${soalRows.length + 1}`,
        majorDimension: 'ROWS',
        values: [soalHeaders, ...soalRows],
      }),
    });

    return true;
  } catch (err) {
    console.warn('Could not rewrite Soal_Test in Google Sheets (saved to local cache):', err);
    return false;
  }
}

// Add question to sheet
export async function addQuestionToSheet(question: Question): Promise<boolean> {
  const currentQuestions = getCachedQuestions();
  const updated = [...currentQuestions, question];
  saveCachedQuestions(updated);

  try {
    await ensureSheetExists('Soal_Test');
    const row = [
      question.id,
      question.pertanyaan,
      question.pilihanA,
      question.pilihanB,
      question.pilihanC,
      question.pilihanD,
      question.kunciJawaban,
      question.bobot || 10,
      question.kategori || 'Operasional STM',
      question.penjelasan || '',
    ];

    await fetchWithAuth(`${BASE_URL}/values/Soal_Test!A1:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      body: JSON.stringify({
        range: 'Soal_Test!A1',
        majorDimension: 'ROWS',
        values: [row],
      }),
    });
    return true;
  } catch (err) {
    console.warn('Failed to append question to sheet:', err);
    return false;
  }
}

// Delete question helper
export async function deleteQuestionFromSheet(id: number, currentQuestions: Question[]): Promise<Question[]> {
  const updated = currentQuestions.filter((q) => q.id !== id);
  await saveAllQuestionsToSheet(updated);
  return updated;
}

// Initialize default template structure to Google Sheets if user wants to seed it
export async function seedSpreadsheetWithDefaultData(): Promise<{ success: boolean; message: string }> {
  try {
    await ensureSheetExists('Data_Peserta');
    await ensureSheetExists('Soal_Test');
    await ensureSheetExists('Hasil_Jawaban');

    // 1. Seed Data_Peserta
    const pesertaHeaders = ['NIK', 'Nama', 'Password', 'Toko', 'Jabatan', 'Cabang'];
    const pesertaRows = INITIAL_PARTICIPANTS.map((p) => [
      p.nik,
      p.nama,
      p.password,
      p.toko,
      p.jabatan,
      p.cabang,
    ]);
    await fetchWithAuth(`${BASE_URL}/values/Data_Peserta!A1:F${pesertaRows.length + 1}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      body: JSON.stringify({
        range: `Data_Peserta!A1:F${pesertaRows.length + 1}`,
        majorDimension: 'ROWS',
        values: [pesertaHeaders, ...pesertaRows],
      }),
    });

    // 2. Seed Soal_Test
    const soalHeaders = ['No', 'Pertanyaan', 'Pilihan_A', 'Pilihan_B', 'Pilihan_C', 'Pilihan_D', 'Kunci_Jawaban', 'Bobot', 'Kategori', 'Penjelasan'];
    const soalRows = INITIAL_QUESTIONS.map((q) => [
      q.id,
      q.pertanyaan,
      q.pilihanA,
      q.pilihanB,
      q.pilihanC,
      q.pilihanD,
      q.kunciJawaban,
      q.bobot || 10,
      q.kategori || '',
      q.penjelasan || '',
    ]);
    await fetchWithAuth(`${BASE_URL}/values/Soal_Test!A1:J${soalRows.length + 1}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      body: JSON.stringify({
        range: `Soal_Test!A1:J${soalRows.length + 1}`,
        majorDimension: 'ROWS',
        values: [soalHeaders, ...soalRows],
      }),
    });

    // 3. Seed Hasil_Jawaban Header & sample results
    const hasilHeaders = [
      'Timestamp',
      'NIK',
      'Nama Peserta',
      'Toko / Unit',
      'Jabatan',
      'Skor Akhir',
      'Total Soal',
      'Jumlah Benar',
      'Jumlah Salah',
      'Waktu Mulai',
      'Waktu Selesai',
      'Durasi (Detik)',
      'Durasi (MM:SS)',
      'Status Kelulusan',
      'Detail Jawaban',
    ];
    const hasilRows = INITIAL_RESULTS.map((r) => [
      r.timestamp,
      r.nik,
      r.nama,
      r.toko,
      r.jabatan,
      r.skor,
      r.totalSoal,
      r.jumlahBenar,
      r.jumlahSalah,
      r.waktuMulai,
      r.waktuSelesai,
      r.durasiDetik,
      r.durasiFormatted,
      r.statusKelulusan,
      r.detailJawaban,
    ]);

    await fetchWithAuth(`${BASE_URL}/values/Hasil_Jawaban!A1:O${hasilRows.length + 1}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      body: JSON.stringify({
        range: `Hasil_Jawaban!A1:O${hasilRows.length + 1}`,
        majorDimension: 'ROWS',
        values: [hasilHeaders, ...hasilRows],
      }),
    });

    return { success: true, message: 'Berhasil menginisialisasi sheet Data_Peserta, Soal_Test, dan Hasil_Jawaban ke Google Spreadsheet!' };
  } catch (error: any) {
    console.error('Seed error:', error);
    return { success: false, message: error.message || 'Gagal sinkronisasi data ke Google Sheets' };
  }
}
