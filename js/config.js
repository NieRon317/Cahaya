// js/config.js - Konfigurasi & keadaan aplikasi (alamat server, nama toko, hak tab, data yang dipegang halaman)
FILE_VERSI["config"] = "v10";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxxctN-seNGKAk-6d5vxygaEpbFOE2jCNOmsKUfGjsgm-07Dv9H2gGC_oZSruhR0hVgAQ/exec";
const VERSI_SERVER = "v9";    // versi script Google yang dibutuhkan website ini
const JUDUL_ASLI = document.title;
const NAMA_TOKO = "CAHAYA";   // tampil di kop invoice / surat jalan

// tab yang boleh dibuka per level (server juga mengecek ulang, ini hanya untuk tampilan)
const TAB_LEVEL = {
    admin:     ["tab-masuk", "tab-keluar", "tab-riwayat", "tab-stok", "tab-report"],
    moderator: ["tab-riwayat", "tab-stok"],
    view:      ["tab-stok"]
};
const SEMUA_TAB = ["tab-masuk", "tab-keluar", "tab-riwayat", "tab-stok", "tab-report"];

let sesi = null;   // { user, nama, level }
let globalListBarang = [];
let globalRiwayat = [];
let lastInvoice = null;
let statusTimer = null;

// penanda kiriman (anti transaksi dobel)
let pendingMasuk = { sig: "", id: "" };
let pendingKeluar = { sig: "", id: "" };
