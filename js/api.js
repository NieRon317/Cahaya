// js/api.js - Komunikasi dengan server Google Apps Script (kirim, anti-dobel, pesan koneksi)
FILE_VERSI["api"] = "v11";

// ---------- kirim ke server ----------
async function kirimPost(payload) {
    if (payload.aksi !== "login" && sesi) payload.token = sesi.token;
    let aman = Object.assign({}, payload);   // password & token tidak ditulis utuh ke log debug
    if (aman.password) aman.password = "***";
    if (aman.token) aman.token = String(aman.token).substring(0, 6) + "...";
    debug("KIRIM POST: " + JSON.stringify(aman));

    let ctrl = new AbortController();
    let timer = setTimeout(() => ctrl.abort(), 45000);
    let response;
    try {
        response = await fetch(SCRIPT_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload),
            signal: ctrl.signal
        });
    } finally {
        clearTimeout(timer);
    }
    let raw = await response.text();
    debug("BALASAN SERVER (HTTP " + response.status + "):\n" + raw.substring(0, 1500));

    let res;
    try { res = JSON.parse(raw); }
    catch (e) {
        return { status: "error", message: "Server tidak membalas JSON. Kemungkinan script belum di-deploy ulang / URL salah." };
    }
    // user dinonaktifkan / tidak valid saat sedang login -> keluarkan
    if (res.code === "auth" && payload.aksi !== "login" && sesi) {
        logout(res.message, true);
    }
    return res;
}

// kirim dengan perlindungan dobel
async function kirimAman(payload, state) {
    let sig = JSON.stringify(payload);
    if (state.sig !== sig) { state.sig = sig; state.id = buatId(); }
    payload.request_id = state.id;

    let result = await kirimPost(payload);
    if (result.status === "duplikat") {
        if (confirm("⚠️ " + result.message + "\n\nTetap simpan lagi?")) {
            payload.paksa = true;
            result = await kirimPost(payload);
        } else {
            return { status: "batal", message: "Dibatalkan. Tidak ada data yang disimpan." };
        }
    }
    return result;
}

function pesanKoneksi(error) {
    let sebab = error.name === "AbortError" ? "koneksi terlalu lama" : error.message;
    return "❌ Koneksi terganggu (" + sebab + "). Data MUNGKIN sudah tersimpan. " +
           "Silakan tekan tombol Simpan sekali lagi, sistem otomatis mencegah data tersimpan dobel.";
}
