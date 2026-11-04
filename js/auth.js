// js/auth.js - Login, logout, pemeriksaan versi server, pita lingkungan
FILE_VERSI["auth"] = "v10";

// ---------- login / logout ----------
function pesanLogin(teks, error) {
    let el = document.getElementById("login-pesan");
    el.textContent = teks;
    el.className = error ? "err" : "";
}
// pastikan script Google sudah versi terbaru sebelum login
async function cekVersiServer() {
    try {
        let r = await fetch(SCRIPT_URL);
        let j = await r.json();
        tampilkanRibbon(j.lingkungan);
        if (j.versi !== VERSI_SERVER) {
            document.getElementById("login-screen").style.display = "flex";
            pesanLogin("⚠️ Versi server tidak cocok. Website ini butuh server " + VERSI_SERVER +
                ", yang terdeteksi: " + (j.versi || "kode lama / tidak dikenal") +
                ". Di editor Apps Script: Deploy → Manage deployments → ✏️ → Version: New version → Deploy.", true);
            document.getElementById("btn-login").disabled = true;
            return false;
        }
    } catch (e) { /* gagal cek: biarkan proses login yang menampilkan error koneksi */ }
    return true;
}

// pita merah di atas halaman bila server berjalan di lingkungan uji
function tampilkanRibbon(lingkungan) {
    let el = document.getElementById("ribbon-uji");
    if (!el) return;
    if (lingkungan && lingkungan !== "PRODUKSI") {
        el.textContent = "⚠️ LINGKUNGAN " + lingkungan + " - data di sini BUKAN data asli";
        el.style.display = "block";
    }
}

function tampilkanLogin(pesan) {
    document.getElementById("app").style.display = "none";
    document.getElementById("login-screen").style.display = "flex";
    document.getElementById("login-user").value = "";
    document.getElementById("login-pass").value = "";
    pesanLogin(pesan || "", !!pesan);
    document.getElementById("login-user").focus();
}

async function prosesLogin(event) {
    event.preventDefault();
    let id = document.getElementById("login-user").value.trim();
    let pass = document.getElementById("login-pass").value;
    if (!id || !pass) return;

    let btn = document.getElementById("btn-login");
    btn.disabled = true; btn.textContent = "⏳ Memeriksa...";
    pesanLogin("", false);

    try {
        let res = await kirimPost({ aksi: "login", user_id: id, password: pass });
        if (res.status === "success" && res.token && res.user && res.user.level) {
            simpanSesi(res.token);
            masukAplikasi(Object.assign({}, res.user, { token: res.token, lingkungan: res.lingkungan }));
        } else if (res.status === "success") {
            pesanLogin("❌ Balasan server tidak sesuai. Kemungkinan script di Google belum diperbarui (Deploy → Manage deployments → New version).", true);
        } else {
            pesanLogin("❌ " + res.message, true);
        }
    } catch (error) {
        pesanLogin("❌ Gagal terhubung ke server. Periksa koneksi internet lalu coba lagi.", true);
    } finally {
        btn.disabled = false; btn.textContent = "🔑 Masuk";
        document.getElementById("login-pass").value = "";
    }
}

function masukAplikasi(user) {
    sesi = user;
    tampilkanRibbon(user.lingkungan);
    setTanggalKeluar();
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("app").style.display = "block";

    document.getElementById("hello-text").textContent = "Hello " + user.nama;
    let badge = document.getElementById("hello-level");
    badge.textContent = user.level;
    badge.className = "badge " + user.level;

    let izin = TAB_LEVEL[user.level] || ["tab-stok"];
    SEMUA_TAB.forEach(id => {
        document.getElementById("btn-" + id).style.display = izin.indexOf(id) >= 0 ? "" : "none";
    });
    bukaTab(izin[0]);
    loadData();
}

function logout(pesan, tanpaServer) {
    // beritahu server supaya token sesi langsung dihapus
    if (sesi && sesi.token && !tanpaServer) {
        kirimPost({ aksi: "logout" }).catch(() => {});
    }
    sesi = null;
    hapusSesi();
    globalListBarang = []; globalRiwayat = []; lastInvoice = null;
    pendingMasuk = { sig: "", id: "" }; pendingKeluar = { sig: "", id: "" };

    tutupInvoice();
    document.getElementById("form-barang-masuk").reset();
    document.getElementById("form-barang-keluar").reset();
    document.getElementById("container-item-list").innerHTML = "";
    document.getElementById("container-keluar-list").innerHTML = "";
    document.getElementById("tabel-stok-body").innerHTML = "";
    document.getElementById("tabel-riwayat-body").innerHTML = "";
    document.getElementById("report-isi").innerHTML = "";
    reportData = null;
    document.getElementById("hasil-keluar").style.display = "none";
    document.getElementById("status-message").style.display = "none";

    tampilkanLogin(typeof pesan === "string" ? pesan : "");
}
