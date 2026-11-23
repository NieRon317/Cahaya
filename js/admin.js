// js/admin.js - Tab Admin: masuk ulang dengan password, kelola user dan barang
FILE_VERSI["admin"] = "v11";

let adminTerbuka = false;      // sudah masuk ulang ke menu Admin?
let adminData = null;          // { users, menu_def, izin_def }
let adminMode = "baru";        // "baru" | "ubah" (dialog user)
let adminTargetReset = "";
let adminBarangPending = { sig: "", id: "" };

function byId(id) { return document.getElementById(id); }

// ---------- masuk ulang ----------
function adminTampil() {
    let login = byId("admin-login"), isi = byId("admin-isi");
    if (!adminTerbuka) {
        login.style.display = "block"; isi.style.display = "none";
        byId("admin-pass").value = "";
        hapusPesanForm("admin-login");
        return;
    }
    login.style.display = "none"; isi.style.display = "block";
    let bolehUser = punyaIzin("kelola_user");
    let bolehBarang = punyaIzin("kelola_barang");
    byId("admin-bagian-user").style.display = bolehUser ? "block" : "none";
    byId("admin-bagian-barang").style.display = bolehBarang ? "block" : "none";
    byId("admin-tanpa-fitur").style.display = (bolehUser || bolehBarang) ? "none" : "block";
    if (bolehUser) adminMuatUser();
    if (bolehBarang) adminMuatBarang();
}

async function adminMasuk(event) {
    event.preventDefault();
    let pass = byId("admin-pass").value;
    if (!pass) return;
    let btn = byId("btn-admin-masuk");
    btn.disabled = true; btn.textContent = "⏳ Memeriksa...";
    try {
        let res = await kirimPost({ aksi: "admin_masuk", password: pass });
        if (!sesi) return;
        if (res.status === "success") { adminTerbuka = true; adminTampil(); }
        else pesanForm("admin-login", "❌ " + res.message, "error", 0);
    } catch (e) {
        pesanForm("admin-login", pesanKoneksi(e), "error", 0);
    } finally {
        btn.disabled = false; btn.textContent = "🔓 Masuk Menu Admin";
        byId("admin-pass").value = "";
    }
}

async function adminKunci() {
    if (!adminTerbuka) return;
    adminReset();
    try { await kirimPost({ aksi: "admin_keluar" }); } catch (e) { /* izin akan habis sendiri */ }
}

function adminReset() {
    adminTerbuka = false;
    adminData = null;
    let tb = byId("admin-user-body"); if (tb) tb.innerHTML = "";
    let bb = byId("admin-barang-body"); if (bb) bb.innerHTML = "";
    tutupDlg("user"); tutupDlg("reset"); tutupDlg("barang");
}

// ---------- kelola barang (hanya tambah, tanpa mengubah stok lama) ----------
async function adminMuatBarang() {
    let tbody = byId("admin-barang-body");
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Memuat...</td></tr>';
    try {
        let res = await kirimPost({ aksi: "admin_barang_daftar" });
        if (!sesi || !adminTerbuka) return;
        if (adminCekKedaluwarsa(res)) return;
        if (res.status !== "success") {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:red;">' + esc(res.message) + '</td></tr>';
            return;
        }
        let barang = res.barang || [];
        tbody.innerHTML = barang.length ? barang.map(b => '<tr class="' + (b.aktif ? '' : 'baris-nonaktif') + '">' +
            '<td><strong>' + esc(b.sku) + '</strong></td><td>' + esc(b.nama) + '</td><td>' + esc(b.kategori) +
            '</td><td>' + esc(b.satuan || 'Pcs') + '</td><td>' + esc(b.minimum === '' ? 'Bawaan' : b.minimum) +
            '</td><td>' + (b.aktif ? '🟢 Aktif' : '⚪ Nonaktif') + '</td></tr>').join('') :
            '<tr><td colspan="6" style="text-align:center;">Belum ada barang.</td></tr>';
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:red;">Gagal terhubung ke server.</td></tr>';
    }
}

function adminBukaBarang() {
    byId("db-nama").value = "";
    byId("db-kategori").value = "Minuman";
    byId("db-satuan").value = "Pcs";
    byId("db-minimum").value = "5";
    hapusPesanForm("dlg-barang");
    bukaDlg("barang");
    byId("db-nama").focus();
}

async function adminSimpanBarang(event) {
    event.preventDefault();
    let payload = {
        aksi: "admin_barang_tambah", nama: byId("db-nama").value.trim(),
        kategori: byId("db-kategori").value.trim(), satuan: byId("db-satuan").value.trim(),
        minimum: byId("db-minimum").value.trim()
    };
    let sig = JSON.stringify(payload);
    if (adminBarangPending.sig !== sig) adminBarangPending = { sig: sig, id: buatId() };
    payload.request_id = adminBarangPending.id;
    let btn = byId("btn-db-simpan");
    btn.disabled = true; btn.textContent = "⏳ Menyimpan...";
    pesanForm("dlg-barang", "Menyimpan...", "info", 0);
    try {
        let res = await kirimPost(payload);
        if (!sesi) return;
        if (adminCekKedaluwarsa(res)) return;
        if (res.status === "success") {
            adminBarangPending = { sig: "", id: "" };
            tutupDlg("barang");
            pesanForm("admin-barang", "✅ " + res.message, "success", 10000);
            adminMuatBarang();
            if (punyaMenu("barang_masuk") || punyaMenu("barang_keluar") || punyaMenu("stok_gudang")) loadData();
        } else {
            pesanForm("dlg-barang", "❌ " + res.message, "error", 0);
        }
    } catch (e) {
        pesanForm("dlg-barang", pesanKoneksi(e), "error", 0);
    } finally {
        btn.disabled = false; btn.textContent = "💾 Simpan Barang";
    }
}

// izin Admin sudah habis di server -> kembali ke layar masuk ulang
function adminCekKedaluwarsa(res) {
    if (res && res.code === "admin_login") {
        adminReset(); adminTampil();
        pesanForm("admin-login", "⏱️ Izin Admin berakhir. Masukkan password Anda lagi.", "info", 0);
        return true;
    }
    return false;
}

// ---------- daftar user ----------
async function adminMuatUser() {
    let tbody = byId("admin-user-body");
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Memuat...</td></tr>';
    try {
        let res = await kirimPost({ aksi: "admin_user_daftar" });
        if (!sesi || !adminTerbuka) return;
        if (adminCekKedaluwarsa(res)) return;
        if (res.status !== "success") {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:red;">' + esc(res.message) + '</td></tr>';
            return;
        }
        adminData = res;
        adminRender();
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:red;">Gagal terhubung ke server.</td></tr>';
    }
}

function adminRender() {
    let d = adminData, tbody = byId("admin-user-body");
    if (!d.users.length) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Belum ada user.</td></tr>'; return; }
    tbody.innerHTML = d.users.map((u, i) => {
        let chips = d.menu_def.concat(d.izin_def).filter(m => u.akses[m.kunci])
            .map(m => '<span class="chip">' + esc(m.label) + '</span>').join("");
        let pw = u.password === "hash" ? "✅ terenkripsi" : (u.password === "teks" ? "⚠️ teks biasa" : "❌ kosong");
        let diriSendiri = u.user.toLowerCase() === sesi.user.toLowerCase();
        let tombol = '<button class="btn btn-small" onclick="adminUbah(' + i + ')">✏️ Ubah</button>';
        if (!diriSendiri) {
            tombol += ' <button class="btn btn-small btn-teal" onclick="adminBukaReset(' + i + ')">🔑 Reset Password</button>' +
                      ' <button class="btn btn-small ' + (u.aktif ? "btn-danger" : "btn-success") + '" onclick="adminToggleAktif(' + i + ')">' +
                      (u.aktif ? "⛔ Nonaktifkan" : "✅ Aktifkan") + '</button>';
        }
        return '<tr class="' + (u.aktif ? "" : "baris-nonaktif") + '">' +
            '<td><strong>' + esc(u.user) + '</strong></td><td>' + esc(u.nama) + '</td><td>' + (esc(u.jabatan) || "-") + '</td>' +
            '<td>' + (u.aktif ? "🟢 Aktif" : "⚪ Nonaktif") + '</td><td>' + (chips || "-") + '</td><td>' + pw + '</td>' +
            '<td class="aksi-cell">' + tombol + '</td></tr>';
    }).join("");
}

// ---------- dialog tambah / ubah ----------
function adminIsiCek(wadahId, defs, akses) {
    byId(wadahId).innerHTML = defs.map(d =>
        '<label><input type="checkbox" data-kunci="' + esc(d.kunci) + '"' + (akses && akses[d.kunci] ? " checked" : "") + '> ' + esc(d.label) + '</label>').join("");
}

function adminTambah() {
    adminMode = "baru";
    byId("dlg-user-judul").textContent = "➕ Tambah User";
    let u = byId("du-user"); u.value = ""; u.readOnly = false;
    byId("du-nama").value = ""; byId("du-jabatan").value = ""; byId("du-pass").value = "";
    byId("du-pw-grup").style.display = "block";
    adminIsiCek("du-menu", adminData.menu_def, {});
    adminIsiCek("du-izin", adminData.izin_def, {});
    hapusPesanForm("dlg-user");
    bukaDlg("user");
    u.focus();
}

function adminUbah(i) {
    let u = adminData.users[i];
    adminMode = "ubah";
    byId("dlg-user-judul").textContent = "✏️ Ubah User: " + u.user;
    let f = byId("du-user"); f.value = u.user; f.readOnly = true;
    byId("du-nama").value = u.nama; byId("du-jabatan").value = u.jabatan; byId("du-pass").value = "";
    byId("du-pw-grup").style.display = "none";
    adminIsiCek("du-menu", adminData.menu_def, u.akses);
    adminIsiCek("du-izin", adminData.izin_def, u.akses);
    hapusPesanForm("dlg-user");
    bukaDlg("user");
}

async function adminSimpan(event) {
    event.preventDefault();
    let akses = {};
    byId("dlg-user").querySelectorAll("input[type=checkbox]").forEach(c => { akses[c.dataset.kunci] = c.checked; });
    let payload = {
        aksi: "admin_user_simpan", mode: adminMode,
        user: byId("du-user").value.trim(), nama: byId("du-nama").value.trim(),
        jabatan: byId("du-jabatan").value.trim(), akses: akses
    };
    if (adminMode === "baru") payload.password = byId("du-pass").value;

    let btn = byId("btn-du-simpan");
    btn.disabled = true; btn.textContent = "⏳ Menyimpan...";
    pesanForm("dlg-user", "Menyimpan...", "info", 0);
    try {
        let res = await kirimPost(payload);
        if (!sesi) return;
        if (adminCekKedaluwarsa(res)) return;
        if (res.status === "success") {
            tutupDlg("user");
            let perluLoginUlang = payload.user.toLowerCase() === sesi.user.toLowerCase() &&
                payload.akses.kelola_barang && !punyaIzin("kelola_barang");
            pesanForm("admin", "✅ " + res.message +
                (perluLoginUlang ? " Keluar lalu masuk lagi agar menu Kelola Barang tampil." : ""), "success", 10000);
            adminMuatUser();
        } else {
            pesanForm("dlg-user", "❌ " + res.message, "error", 0);
        }
    } catch (e) {
        pesanForm("dlg-user", pesanKoneksi(e), "error", 0);
    } finally {
        btn.disabled = false; btn.textContent = "💾 Simpan";
    }
}

// ---------- reset password ----------
function adminBukaReset(i) {
    let u = adminData.users[i];
    adminTargetReset = u.user;
    byId("dr-user").textContent = u.user + " (" + u.nama + ")";
    byId("dr-pass").value = "";
    hapusPesanForm("dlg-reset");
    bukaDlg("reset");
    byId("dr-pass").focus();
}

async function adminSimpanReset(event) {
    event.preventDefault();
    let btn = byId("btn-dr-simpan");
    btn.disabled = true; btn.textContent = "⏳ Menyimpan...";
    pesanForm("dlg-reset", "Menyimpan...", "info", 0);
    try {
        let res = await kirimPost({ aksi: "admin_user_reset_password", user: adminTargetReset, password_baru: byId("dr-pass").value });
        if (!sesi) return;
        if (adminCekKedaluwarsa(res)) return;
        if (res.status === "success") {
            tutupDlg("reset");
            pesanForm("admin", "✅ " + res.message + " Sampaikan password baru ke yang bersangkutan.", "success", 10000);
            adminMuatUser();
        } else {
            pesanForm("dlg-reset", "❌ " + res.message, "error", 0);
        }
    } catch (e) {
        pesanForm("dlg-reset", pesanKoneksi(e), "error", 0);
    } finally {
        btn.disabled = false; btn.textContent = "💾 Simpan Password Baru";
    }
}

// ---------- aktif / nonaktif ----------
async function adminToggleAktif(i) {
    let u = adminData.users[i];
    let aktifkan = !u.aktif;
    let tanya = aktifkan ? "Aktifkan kembali user " + u.user + "?" : "Nonaktifkan user " + u.user + "? Sesi yang sedang berjalan langsung berakhir.";
    if (!confirm(tanya)) return;
    try {
        let res = await kirimPost({ aksi: "admin_user_aktif", user: u.user, aktif: aktifkan });
        if (!sesi) return;
        if (adminCekKedaluwarsa(res)) return;
        let ok = res.status === "success";
        pesanForm("admin", (ok ? "✅ " : "❌ ") + res.message, ok ? "success" : "error", ok ? 8000 : 0);
        adminMuatUser();
    } catch (e) {
        pesanForm("admin", pesanKoneksi(e), "error", 0);
    }
}

// password acak (huruf/angka yang mudah dibaca) untuk password awal / reset
function adminAcak(idInput) {
    const abjad = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let acak = new Uint32Array(12);
    (window.crypto || window.msCrypto).getRandomValues(acak);
    byId(idInput).value = Array.from(acak).map(n => abjad[n % abjad.length]).join("");
}
