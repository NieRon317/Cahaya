// js/app.js - Perpindahan tab + proses start halaman
FILE_VERSI["app"] = "v10";

// ---------- tab ----------
function tabBoleh(id) {
    let izin = sesi ? (TAB_LEVEL[sesi.level] || ["tab-stok"]) : [];
    return izin.indexOf(id) >= 0;
}
function bukaTab(id) {
    if (!tabBoleh(id)) return;
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.getElementById(id).classList.add("active");
    document.getElementById("btn-" + id).classList.add("active");
    if (id === "tab-riwayat") loadRiwayat();
    if (id === "tab-report") loadReport(false);
}
function refreshSemua() {
    loadData();
    if (document.getElementById("tab-riwayat").classList.contains("active")) loadRiwayat();
    if (document.getElementById("tab-report").classList.contains("active")) loadReport(false);
}

// ---------- start ----------
window.onload = async function () {
    let lbl = document.getElementById("versi-web");
    if (lbl) lbl.textContent = VERSI_WEB;
    if (new URLSearchParams(location.search).get("debug") === "1") {
        document.getElementById("debug-wrap").style.display = "block";
    }

    // coba lanjutkan sesi (selama tab browser belum ditutup), tetap diverifikasi ke server
    if (!cekKelengkapanFile()) return;
    if (!(await cekVersiServer())) return;
    let tersimpan = ambilSesi();
    if (tersimpan) {
        document.getElementById("login-screen").style.display = "flex";
        pesanLogin("⏳ Memeriksa sesi...", false);
        try {
            let res = await kirimPost({ aksi: "sesi", token: tersimpan });
            if (res.status === "success" && res.user && res.user.level) {
                masukAplikasi(Object.assign({}, res.user, { token: tersimpan, lingkungan: res.lingkungan }));
                return;
            }
            hapusSesi();
            tampilkanLogin(res.message);
        } catch (e) {
            tampilkanLogin("Koneksi gagal. Silakan login kembali.");
        }
    } else {
        tampilkanLogin("");
    }
};

// pastikan semua file website termuat dan satu versi (cegah campuran file lama & baru)
function cekKelengkapanFile() {
    let hilang = FILE_WAJIB.filter(n => !FILE_VERSI[n]);
    let beda = FILE_WAJIB.filter(n => FILE_VERSI[n] && FILE_VERSI[n] !== VERSI_WEB);
    if (!hilang.length && !beda.length) return true;
    let pesan = "⚠️ File website tidak lengkap atau tidak seragam. ";
    if (hilang.length) pesan += "Belum termuat: " + hilang.map(n => "js/" + n + ".js").join(", ") + ". ";
    if (beda.length) pesan += "Versi berbeda (cache lama): " + beda.map(n => "js/" + n + ".js").join(", ") + ". ";
    pesan += "Pastikan semua file di folder js/ sudah di-upload, tunggu 1-2 menit, lalu tekan Ctrl+Shift+R.";
    document.getElementById("login-screen").style.display = "flex";
    let el = document.getElementById("login-pesan");
    if (el) { el.textContent = pesan; el.className = "err"; }
    let btn = document.getElementById("btn-login");
    if (btn) btn.disabled = true;
    return false;
}
