// =====================================================================
//  CONFIG.gs  -  semua pengaturan teknis di SATU tempat
//
//  Untuk membuat LINGKUNGAN UJI (salinan), cukup ubah dua baris ini di salinan:
//     SS_URL     -> alamat spreadsheet salinan
//     LINGKUNGAN -> "UJI"   (website akan menampilkan pita peringatan)
//  Nilai di sheet "Pengaturan" (kalau ada) menimpa nilai bawaan bertanda [P].
// =====================================================================
var SS_URL = "https://docs.google.com/spreadsheets/d/1cfav5csuDHrKNAz9y3GbLJIkzTuITSmFjamRMYyr6fc/edit";
var LINGKUNGAN = "PRODUKSI";    // "PRODUKSI" atau "UJI"
var BUILD = "12.0";              // nomor build kode server (hanya informasi)
var VERSI = "v11";               // protokol server; dicek oleh website

var TZ = "Asia/Jakarta";
var TZ_OFFSET_MS = 7 * 3600 * 1000;   // WIB = UTC+7 (tanpa jam musim panas)

// ---- nilai bawaan [P] = bisa ditimpa lewat sheet Pengaturan ----
var MINIMUM_DEFAULT = 5;         // [P] Minimum_Stok_Bawaan
var BATAS_DUPLIKAT_MENIT = 10;   // [P] Batas_Duplikat_Menit
var NOMOR_DIGIT = 3;             // [P] Nomor_Digit
var PREFIX_INVOICE = "IV.CHY";   // nomor invoice: IV.CHY/2026.10.14/001

// ---- keamanan & sesi ----
var CACHE_DETIK = 21600;         // ingatan request_id: 6 jam
var SESI_MENIT_BAWAAN = 30;      // [P] Sesi_Menit: keluar otomatis bila tidak ada aktivitas
var ADMIN_MENIT_BAWAAN = 10;     // [P] Admin_Menit: lama izin menu Admin setelah masuk ulang
var MAX_GAGAL = 5;               // salah password X kali -> user dikunci sementara
var KUNCI_DETIK = 900;           // lama kunci: 15 menit
var HASH_PUTARAN = 300;          // jumlah putaran hash password baru (ukur dengan ujiKecepatanHash())
var PASSWORD_MIN = 8;            // panjang minimal password baru

// ---- report ----
var JUMLAH_BULAN = 13;           // 12 bulan ke belakang + bulan berjalan
var CACHE_REPORT_DETIK = 600;    // hasil report disimpan 10 menit
