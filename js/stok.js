// js/stok.js - Tab Stok Gudang + dropdown barang
FILE_VERSI["stok"] = "v10";

// ---------- load data stok ----------
async function loadData() {
    let tbodyStok = document.getElementById("tabel-stok-body");
    tbodyStok.innerHTML = '<tr><td colspan="4" style="text-align: center;">Memuat data...</td></tr>';

    try {
        let result = await kirimPost({ aksi: "data" });
        if (!sesi) return; // sudah logout

        if (result.status === "success") {
            globalListBarang = result.listBarang || [];
            segarkanDropdown();

            if (sesi.level === "admin") {
                if (document.getElementById("container-item-list").children.length === 0) tambahBarisItem();
                if (document.getElementById("container-keluar-list").children.length === 0) tambahBarisKeluar();
            }

            tbodyStok.innerHTML = "";
            if (!result.dataStok || result.dataStok.length === 0) {
                tbodyStok.innerHTML = '<tr><td colspan="4" style="text-align:center;">Belum ada data stok tersedia.</td></tr>';
            } else {
                result.dataStok.forEach(row => {
                    let ikon = row.status === "Habis" ? "🔴" : (row.status === "Menipis" ? "🟡" : "🟢");
                    let tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td>${esc(row.nama_barang) || '-'}</td>
                        <td>${esc(row.kategori) || '-'}</td>
                        <td class="num"><strong>${row.stok || 0}</strong></td>
                        <td>${ikon} ${esc(row.status) || '-'}</td>
                    `;
                    tbodyStok.appendChild(tr);
                });
            }
            debug("DATA OK: " + (result.dataStok || []).length + " baris stok");
        } else {
            tbodyStok.innerHTML = '<tr><td colspan="4" style="text-align:center;color:red;">' + esc(result.message || "Gagal memuat data") + '</td></tr>';
        }
    } catch (error) {
        console.error("Error:", error);
        tbodyStok.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">Gagal terhubung ke Google Sheets.</td></tr>';
        debug("DATA error: " + error.message);
    }
}

// ---------- dropdown ----------
function opsiMasuk() {
    let h = '<option value="">-- Pilih Nama Barang --</option>';
    if (globalListBarang.length > 0) {
        globalListBarang.forEach(b => { h += `<option value="${esc(b.nama_barang)}">${esc(b.nama_barang)}</option>`; });
    } else {
        h += '<option value="" disabled>Data barang kosong</option>';
    }
    return h;
}
function opsiKeluar() {
    let h = '<option value="">-- Pilih Nama Barang --</option>';
    if (globalListBarang.length > 0) {
        globalListBarang.forEach(b => {
            let stok = Number(b.stok) || 0;
            h += `<option value="${esc(b.nama_barang)}" ${stok <= 0 ? "disabled" : ""}>${esc(b.nama_barang)} (stok: ${stok})</option>`;
        });
    } else {
        h += '<option value="" disabled>Data barang kosong</option>';
    }
    return h;
}
function segarkanDropdown() {
    document.querySelectorAll(".input-nama-barang").forEach(sel => {
        let v = sel.value; sel.innerHTML = opsiMasuk(); sel.value = v;
    });
    document.querySelectorAll(".keluar-barang").forEach(sel => {
        let v = sel.value; sel.innerHTML = opsiKeluar(); sel.value = v;
    });
}
