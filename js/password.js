// js/password.js - Ganti Password (untuk semua user yang sudah login)
FILE_VERSI["password"] = "v11";

function bukaGantiPassword() {
    ["gp-lama", "gp-baru", "gp-konf"].forEach(id => { document.getElementById(id).value = ""; });
    hapusPesanForm("dlg-password");
    bukaDlg("password");
    document.getElementById("gp-lama").focus();
}

async function simpanGantiPassword(event) {
    event.preventDefault();
    let lama = document.getElementById("gp-lama").value;
    let baru = document.getElementById("gp-baru").value;
    let konf = document.getElementById("gp-konf").value;

    if (baru.trim().length < PASSWORD_MIN_WEB) { pesanForm("dlg-password", "❌ Password baru minimal " + PASSWORD_MIN_WEB + " karakter.", "error", 0); return; }
    if (baru !== konf) { pesanForm("dlg-password", "❌ Konfirmasi password baru tidak sama.", "error", 0); return; }
    if (baru === lama) { pesanForm("dlg-password", "❌ Password baru harus berbeda dari password lama.", "error", 0); return; }

    let btn = document.getElementById("btn-gp-simpan");
    btn.disabled = true; btn.textContent = "⏳ Menyimpan...";
    pesanForm("dlg-password", "Menyimpan...", "info", 0);
    try {
        let res = await kirimPost({ aksi: "ganti_password", password_lama: lama, password_baru: baru });
        if (!sesi) return;
        if (res.status === "success") {
            pesanForm("dlg-password", "✅ " + res.message, "success", 0);
            ["gp-lama", "gp-baru", "gp-konf"].forEach(id => { document.getElementById(id).value = ""; });
            setTimeout(() => tutupDlg("password"), 1800);
        } else {
            pesanForm("dlg-password", "❌ " + res.message, "error", 0);
        }
    } catch (e) {
        pesanForm("dlg-password", pesanKoneksi(e), "error", 0);
    } finally {
        btn.disabled = false; btn.textContent = "💾 Simpan Password Baru";
    }
}
