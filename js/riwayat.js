// js/riwayat.js - Tab Cetak Invoice (daftar invoice keluar)
FILE_VERSI["riwayat"] = "v11";

// ---------- cetak invoice (daftar) ----------
async function loadRiwayat() {
    let tbody = document.getElementById("tabel-riwayat-body");
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Memuat data...</td></tr>';
    try {
        let result = await kirimPost({ aksi: "riwayat_keluar" });
        if (!sesi) return;
        if (result.status === "success") {
            globalRiwayat = result.riwayat || [];
            debug("RIWAYAT OK: " + globalRiwayat.length + " invoice");
            renderRiwayat();
        } else {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:red;">Gagal: ' + esc(result.message) + '</td></tr>';
        }
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:red;">Gagal terhubung ke Google Sheets.</td></tr>';
        debug("RIWAYAT error: " + error.message);
    }
}

function renderRiwayat() {
    let tbody = document.getElementById("tabel-riwayat-body");
    let cari = document.getElementById("cari-riwayat").value.trim().toLowerCase();
    let dari = document.getElementById("tgl-dari").value;
    let sampai = document.getElementById("tgl-sampai").value;

    let hasil = globalRiwayat.filter(inv => {
        let tgl = (inv.tanggal || "").substring(0, 10);
        if (dari && tgl < dari) return false;
        if (sampai && tgl > sampai) return false;
        if (cari) {
            let teks = (inv.no_invoice + " " + inv.pelanggan + " " + inv.tipe + " " +
                inv.items.map(i => i.nama).join(" ")).toLowerCase();
            if (teks.indexOf(cari) === -1) return false;
        }
        return true;
    });

    if (hasil.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Tidak ada invoice yang cocok.</td></tr>';
        return;
    }

    tbody.innerHTML = "";
    hasil.forEach(inv => {
        let idx = globalRiwayat.indexOf(inv);
        let tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${esc(inv.no_invoice)}</strong></td>
            <td>${esc(inv.tanggal)}</td>
            <td>${esc(inv.pelanggan)}</td>
            <td>${esc(inv.tipe)}</td>
            <td class="num">${inv.items.length}</td>
            <td class="num">${rp(inv.total)}</td>
            <td class="aksi-cell">
                <button class="btn btn-small" onclick="bukaDokumen(globalRiwayat[${idx}], 'invoice')">🖨️ Invoice</button>
                <button class="btn btn-small btn-teal" onclick="bukaDokumen(globalRiwayat[${idx}], 'sj')">🚚 Surat Jalan</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function resetFilterRiwayat() {
    document.getElementById("cari-riwayat").value = "";
    document.getElementById("tgl-dari").value = "";
    document.getElementById("tgl-sampai").value = "";
    renderRiwayat();
}
