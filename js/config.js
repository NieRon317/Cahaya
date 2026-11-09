// js/config.js - Konfigurasi & keadaan aplikasi (alamat server, nama toko, hak tab, data yang dipegang halaman)
FILE_VERSI["config"] = "v11";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxxctN-seNGKAk-6d5vxygaEpbFOE2jCNOmsKUfGjsgm-07Dv9H2gGC_oZSruhR0hVgAQ/exec";
const VERSI_SERVER = "v11";    // versi script Google yang dibutuhkan website ini
const JUDUL_ASLI = document.title;
const NAMA_TOKO = "CAHAYA";   // tampil di kop invoice / surat jalan

// menu dari server (kunci) -> id tab. SERVER yang menentukan menu mana yang boleh dibuka
// dan mengecek ulang di setiap permintaan; ini hanya pemetaan untuk tampilan.
const MENU_TAB = {
    barang_masuk: "tab-masuk",
    barang_keluar: "tab-keluar",
    cetak_invoice: "tab-riwayat",
    stok_gudang: "tab-stok",
    report: "tab-report",
    admin: "tab-admin"
};
const SEMUA_TAB = ["tab-masuk", "tab-keluar", "tab-riwayat", "tab-stok", "tab-report", "tab-admin"];
const PASSWORD_MIN_WEB = 8;       // server tetap mengecek ulang

// keluar otomatis bila tidak ada aktivitas (nilai Sesi_Menit dikirim server saat login)
let INAKTIF_MENIT = 30;
let CEK_AKTIVITAS_DETIK = 15;

let sesi = null;   // { user, nama, jabatan, menu:[...], izin:[...], token }
let globalListBarang = [];
let globalRiwayat = [];
let lastInvoice = null;
let statusTimer = null;

// penanda kiriman (anti transaksi dobel)
let pendingMasuk = { sig: "", id: "" };
let pendingKeluar = { sig: "", id: "" };
