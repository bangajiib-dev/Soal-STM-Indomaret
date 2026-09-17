import { Participant, Question, ExamResult, ExamConfig } from '../types';

export const SPREADSHEET_ID = '1_tN7NvG4HWERgWkMHE3vggeFKFX_vi6mP5yzOiJ0DuU';
export const SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit?gid=1268070659#gid=1268070659`;

export const DEFAULT_EXAM_CONFIG: ExamConfig = {
  durasiMenit: 15,
  passingGrade: 75,
  acakSoal: false,
  judulMeeting: 'Meeting STM INDOMARET - Store Of The Month',
  lokasiCabang: 'Indomaret Cabang Surabaya',
  isExamOpen: true,
};

export const INITIAL_PARTICIPANTS: Participant[] = [
  { nik: '2003002562', nama: 'ERNO LISANDI', password: '123', toko: 'TOWJ', jabatan: 'Store Sr. Leader', status: 'Belum Ujian' },
  { nik: '2011016788', nama: 'AKHMAT KHOIRUL', password: '123', toko: 'TMUN', jabatan: 'Chief Of Store', status: 'Belum Ujian' },
  { nik: '2011006903', nama: 'RIA FARAHDIBA', password: '123', toko: 'T5PU', jabatan: 'Chief Of Store', status: 'Belum Ujian' },
  { nik: '2012024114', nama: 'HUSNUL KAROMAH', password: '123', toko: 'T6F8', jabatan: 'Chief Of Store', status: 'Belum Ujian' },
  { nik: '2012024519', nama: 'FITRIA NUR ROCHMAWATI', password: '123', toko: 'FUS2', jabatan: 'Chief Of Store', status: 'Belum Ujian' },
  { nik: '2012025487', nama: 'LUSI KRISNAWATI', password: '123', toko: 'F77C', jabatan: 'Chief Of Store', status: 'Belum Ujian' },
  { nik: '2010001642', nama: 'MUHAMMAD NURYADI', password: '123', toko: 'FEF5', jabatan: 'Chief Of Store', status: 'Belum Ujian' },
  { nik: '2010024746', nama: 'MUTIA AYU PRAMESWARI', password: '123', toko: 'FSFL', jabatan: 'Chief Of Store', status: 'Belum Ujian' },
  { nik: '2011008881', nama: 'MARIANI KARTIKA DEWI', password: '123', toko: 'FL83', jabatan: 'Chief Of Store', status: 'Belum Ujian' },
  { nik: '2011017615', nama: 'MUHAMMAD SHIROT JUDIN', password: '123', toko: 'TH2S', jabatan: 'Chief Of Store', status: 'Belum Ujian' },
  { nik: '2011012381', nama: 'ATIK ALIFA SARI', password: '123', toko: 'T1KH', jabatan: 'Chief Of Store', status: 'Belum Ujian' },
  { nik: '2011017617', nama: 'RUDIONO', password: '123', toko: 'FPYR', jabatan: 'Chief Of Store', status: 'Belum Ujian' },
  { nik: '2011018572', nama: 'imam syafii', password: '123', toko: 'TKWF', jabatan: 'Chief Of Store', status: 'Belum Ujian' },
  { nik: '2011019481', nama: 'DWI HERIYANTI', password: '123', toko: 'T5JA', jabatan: 'Chief Of Store', status: 'Belum Ujian' },
  { nik: '2010008779', nama: 'NURUL WAHYUDA', password: '123', toko: 'TRFZ', jabatan: 'Store Crew Boy', status: 'Belum Ujian' },
  { nik: '2011020947', nama: 'INDRA KURNIAWAN', password: '123', toko: 'TSSG', jabatan: 'Chief Of Store', status: 'Belum Ujian' },
  { nik: '2010024915', nama: 'SUTRIYAH', password: '123', toko: 'TIO9', jabatan: 'Chief Of Store', status: 'Belum Ujian' },
  { nik: '2012022257', nama: 'SISKA MIRNAWATI', password: '123', toko: 'F1FY', jabatan: 'Chief Of Store', status: 'Belum Ujian' },
  { nik: '2010026366', nama: 'ZAHIRATUL ISNAINI', password: '123', toko: 'T7XG', jabatan: 'Chief Of Store', status: 'Belum Ujian' },
  { nik: '2012028591', nama: 'FANDI AGUNG SASMITO', password: '123', toko: 'F8WN', jabatan: 'Chief Of Store', status: 'Belum Ujian' },
  { nik: '2011013782', nama: 'PUPUT DWI PUSPITA W', password: '123', toko: 'TWSL', jabatan: 'Chief Of Store', status: 'Belum Ujian' },
  { nik: '2010011606', nama: 'MOHAMMAD RIDWAN', password: '123', toko: 'TWAR', jabatan: 'Chief Of Store', status: 'Belum Ujian' },
  { nik: '2012028610', nama: 'MUHAMMAD ANDIK PRAYITNO', password: '123', toko: 'TGPX', jabatan: 'Chief Of Store', status: 'Belum Ujian' },
  { nik: '2010011788', nama: 'PARIANTO', password: '123', toko: 'TPXS', jabatan: 'Chief Of Store', status: 'Belum Ujian' },
  { nik: '2012028819', nama: 'LINDA AGUS LESTIANA', password: '123', toko: 'TF16', jabatan: 'Chief Of Store', status: 'Belum Ujian' },
  { nik: '2010028327', nama: 'HERU KURNIAWAN', password: '123', toko: 'T9W9', jabatan: 'Chief Of Store', status: 'Belum Ujian' },
  { nik: '2010030282', nama: 'AHMAD KHARIRI', password: '123', toko: 'FTN5', jabatan: 'Chief Of Store', status: 'Belum Ujian' },
  { nik: '2010013898', nama: 'ACHMAD FARICH', password: '123', toko: 'TQ7S', jabatan: 'Chief Of Store', status: 'Belum Ujian' },
  { nik: '2012029389', nama: 'NIKEN AYUNINGTYAS', password: '123', toko: 'TB0Q', jabatan: 'Chief Of Store', status: 'Belum Ujian' },
  { nik: '2012030382', nama: 'KHAMIM RIDOI', password: '123', toko: 'FD42', jabatan: 'Chief Of Store', status: 'Belum Ujian' },
  { nik: '2011003127', nama: 'ACHMAD ARDIEANSYAH', password: '123', toko: 'TTHO', jabatan: 'Chief Of Store', status: 'Belum Ujian' },
  { nik: '2011003355', nama: 'ERNI FARIASRI', password: '123', toko: 'T8DO', jabatan: 'Chief Of Store', status: 'Belum Ujian' },
  { nik: '2012041964', nama: 'KHATIJAH KHAIR', password: '123', toko: 'TRDQ', jabatan: 'Chief Of Store', status: 'Belum Ujian' },
  { nik: '2010016665', nama: 'LUKIANTO WIBOWO', password: '123', toko: 'TOUW', jabatan: 'Chief Of Store', status: 'Belum Ujian' },
  { nik: '2012044031', nama: 'EPA YUNIATIN', password: '123', toko: 'T1JA', jabatan: 'Chief Of Store', status: 'Belum Ujian' },
  { nik: '2012046692', nama: 'PUPUT ROSIANTO', password: '123', toko: 'TMUK', jabatan: 'Chief Of Store', status: 'Belum Ujian' },
];

export const INITIAL_QUESTIONS: Question[] = [
  {
    id: 1,
    pertanyaan: 'Dalam prinsip manajemen display barang di Indomaret, metode FEFO (First Expired First Out) diterapkan dengan tujuan utama apa?',
    pilihanA: 'Mempercepat perputaran barang yang memiliki profit margin tertinggi',
    pilihanB: 'Memastikan produk dengan tanggal kedaluwarsa paling dekat dipajang paling depan agar terjual lebih dulu',
    pilihanC: 'Mengurangi beban kerja pramuniaga saat melakukan penataan rak',
    pilihanD: 'Mempermudah proses stock opname bulanan toko',
    kunciJawaban: 'B',
    bobot: 10,
    kategori: 'STM BULAN',
    penjelasan: 'FEFO (First Expired First Out) memastikan produk yang mendekati tanggal kedaluwarsa diposisikan di depan untuk meminimalkan produk retur/rusak (BTA/BTB).'
  },
  {
    id: 2,
    pertanyaan: 'Bila terjadi selisih minus pada saat proses serah terima kasir (Closing Shift), langkah pertama yang WAJIB dilakukan oleh kasir bersama ACOS/COS adalah?',
    pilihanA: 'Langsung mengganti selisih dari uang saku kasir tanpa pelaporan ke sistem',
    pilihanB: 'Melakukan re-counting fisik uang kas, cek transaksi void, transaksi gantung, dan rekonsiliasi struk POS',
    pilihanC: 'Membebankan seluruh selisih pada shift berikutnya yang bertugas',
    pilihanD: 'Menghapus data transaksi terakhir pada sistem POS Indomaret',
    kunciJawaban: 'B',
    bobot: 10,
    kategori: 'SOP Kasir & Finansial',
    penjelasan: 'Langkah pertama adalah penghitungan ulang fisik, verifikasi transaksi batal/void, periksa mutasi i-saku/EDC, dan cetak ulang rincian setoran shift.'
  },
  {
    id: 3,
    pertanyaan: 'Konsep 5R (Ringkas, Rapi, Resik, Rawat, Rajin) di area sales dan gudang Indomaret bertujuan untuk?',
    pilihanA: 'Membuat display hanya terlihat bagus saat kunjungan Area Manager saja',
    pilihanB: 'Menciptakan lingkungan kerja yang higienis, tertata, aman, serta meningkatkan efisiensi operasional toko',
    pilihanC: 'Menggantikan seluruh prosedur standar kebersihan pihak ketiga',
    pilihanD: 'Mengurangi jumlah personel kerja di toko saat shift malam',
    kunciJawaban: 'B',
    bobot: 10,
    kategori: 'Budaya Kerja 5R',
    penjelasan: '5R menjaga standar operasional toko tetap higienis, mempermudah pencarian stok, mencegah kecelakaan kerja, dan memberikan kenyamanan bagi konsumen.'
  },
  {
    id: 4,
    pertanyaan: 'Ketika seorang konsumen ingin membayar menggunakan aplikasi I-Saku namun scan QR barcode gagal berulang kali, tindakan kasir yang paling tepat adalah?',
    pilihanA: 'Menolak transaksi dan meminta konsumen menggunakan uang tunai saja',
    pilihanB: 'Meminta konsumen menunjukkan kode token bayar (Payment Code) manual lalu menginputnya ke sistem POS',
    pilihanC: 'Merestart komputer server toko di tengah jam ramai',
    pilihanD: 'Meminta nomor PIN rahasia akun I-Saku konsumen untuk dimasukkan kasir',
    kunciJawaban: 'B',
    bobot: 10,
    kategori: 'Layanan Digital & Kasir',
    penjelasan: 'SOP pembayaran digital I-Saku menyediakan token pembayaran numerik yang dapat diinput langsung oleh kasir jika kamera barcode scanner terkendala.'
  },
  {
    id: 5,
    pertanyaan: 'Dokumen Planogram rak di toko Indomaret berfungsi sebagai panduan untuk?',
    pilihanA: 'Jadwal giliran libur dan shift kerja seluruh karyawan toko',
    pilihanB: 'Daftar harga diskon mingguan promo JSM (Jumat Sabtu Minggu)',
    pilihanC: 'Tata letak dan visual merchandising penempatan produk pada rak/chiller sesuai kategori dan eye-level konsumen',
    pilihanD: 'Formulir pengajuan klaim barang retur ke Distribution Center (DC)',
    kunciJawaban: 'C',
    bobot: 10,
    kategori: 'Planogram & Merchandising',
    penjelasan: 'Planogram merupakan diagram visual penataan letak produk pada rak yang dirancang agar memaksimalkan keterlihatan produk dan omzet penjualan.'
  },
  {
    id: 6,
    pertanyaan: 'Dalam prosedur penerimaan barang dari Distribution Center (DC), apa yang harus dilakukan tim toko bila ditemukan segel mobil box dalam keadaan rusak atau nomor segel tidak cocok dengan Surat Jalan?',
    pilihanA: 'Tetap membongkar seluruh muatan tanpa konfirmasi pihak DC',
    pilihanB: 'Menandatangani tanda terima bersih dan membiarkan supir segera pergi',
    pilihanC: 'Segera konfirmasi ke Driver, hubungi pihak DC / Korlap, dan foto kondisi segel sebelum pembongkaran muatan',
    pilihanD: 'Menolak semua kiriman barang tanpa membuat berita acara apapun',
    kunciJawaban: 'C',
    bobot: 10,
    kategori: 'Penerimaan Barang DC',
    penjelasan: 'SOP pengiriman mewajibkan verifikasi nomor segel fisik sesuai dokumen Surat Jalan dan dokumentasi foto sebelum disetujui untuk pembongkaran.'
  },
  {
    id: 7,
    pertanyaan: 'Batas toleransi maksimal (SLA) transaksi pembayaran per konsumen di kasir Indomaret dalam kondisi normal dirancang singkat demi?',
    pilihanA: 'Menghindari konsumen melihat rincian harga di layar monitor',
    pilihanB: 'Mencegah antrean panjang (Queue Management) dan mewujudkan Service Excellence',
    pilihanC: 'Menghemat daya listrik perangkat mesin kasir POS',
    pilihanD: 'Memungkinkan kasir segera beristirahat lebih awal',
    kunciJawaban: 'B',
    bobot: 10,
    kategori: 'Pelayanan & Service Excellence',
    penjelasan: 'Kecepatan dan ketepatan kasir dalam melayani (Service Speed) adalah pilar kepuasan pelanggan dan mencegah hilangnya calon pembeli akibat antrean menumpuk.'
  },
  {
    id: 8,
    pertanyaan: 'Pada saat pelaksanaan Stock Opname (SO) harian/parsial toko, produk kategori apakah yang umumnya diprioritaskan untuk dihitung secara berkala?',
    pilihanA: 'Barang-barang promosi yang sudah tidak berlaku',
    pilihanB: 'Barang perlengkapan kantor toko (ATK)',
    pilihanC: 'Produk Fast Moving dan High Risk (bernilai tinggi dan rawan selisih/rusak)',
    pilihanD: 'Produk non-food yang slow moving di gudang atas',
    kunciJawaban: 'C',
    bobot: 10,
    kategori: 'Stock Opname & Asset Protection',
    penjelasan: 'Stock opname harian/parsial memfokuskan pada kategori rawan kehilangan (High Value/High Risk) seperti rokok, susu kaleng, kosmetik, dan barang fast moving.'
  },
  {
    id: 9,
    pertanyaan: 'Sapaan standar wajib kasir/pramuniaga Indomaret kepada setiap pelanggan yang baru memasuki pintu toko adalah?',
    pilihanA: '"Silakan beli produk promosi kami hari ini!"',
    pilihanB: '"Selamat pagi/siang/malam, selamat datang di Indomaret, selamat berbelanja!" dengan senyum ramah dan kontak mata',
    pilihanC: '"Tolong titipkan tas bawaan Anda di loker kasir!"',
    pilihanD: '"Mau bayar tunai atau non-tunai?"',
    kunciJawaban: 'B',
    bobot: 10,
    kategori: 'Standar Layanan Indomaret',
    penjelasan: 'Standar salam sapa Indomaret mencerminkan keramahan (Friendly Service) yang menciptakan kesan ramah dan mengundang sejak awal masuk toko.'
  },
  {
    id: 10,
    pertanyaan: 'Sebagai calon Store Trainee Manager (STM), langkah strategis apa yang paling tepat jika toko Anda mengalami penurunan Gross Margin dalam 2 bulan terakhir?',
    pilihanA: 'Mengurangi jumlah lampu penerangan toko dan mematikan AC secara total',
    pilihanB: 'Menganalisis mix penjualan produk (fokus pada item high margin/Private Label), menekan pemusnahan barang rusak (BTA), dan meningkatkan up-selling kasir',
    pilihanC: 'Menaikkan harga jual di atas ketentuan sistem pusat secara sepihak',
    pilihanD: 'Menghilangkan display promo yang ditentukan kantor cabang',
    kunciJawaban: 'B',
    bobot: 10,
    kategori: 'Leadership & Analisa Bisnis Retail',
    penjelasan: 'Peningkatan gross margin dicapai dengan mengoptimalkan penjualan produk margin tinggi (termasuk Indomaret Brand / Private Label), menekan waste/loss, dan penawaran aktif di kasir.'
  }
];

export const INITIAL_RESULTS: ExamResult[] = [];
