// js/keluar.js - Form Barang Keluar
FILE_VERSI["keluar"] = "v11";

// ---------- barang keluar ----------
function tambahBarisKeluar() {
    let container = document.getElementById("container-keluar-list");
    let isJual = document.getElementById("tipe_keluar").value === "Penjualan";
    let rowDiv = document.createElement("div");
    rowDiv.className = "grid-container keluar-row";
    rowDiv.style.marginBottom = "8px";
    rowDiv.innerHTML = `
        <div><select class="keluar-barang" onchange="hitungKeluar()" required>${opsiKeluar()}</select></div>
        <div><input type="number" class="keluar-jumlah" min="1" value="1" oninput="hitungKeluar()" required></div>
        <div><input type="text" class="keluar-harga" value="0" oninput="formatRupiah(this); hitungKeluar()" ${isJual ? "" : "disabled"}></div>
        <div class="subtotal">Rp 0</div>
        <div><button type="button" class="btn btn-danger" onclick="hapusBarisKeluar(this)">Hapus</button></div>
    `;
    container.appendChild(rowDiv);
    hitungKeluar();
}
function hapusBarisKeluar(button) {
    let container = document.getElementById("container-keluar-list");
    if (container.children.length > 1) { button.closest(".keluar-row").remove(); hitungKeluar(); }
    else alert("Minimal harus ada 1 item barang dalam transaksi!");
}
function terapkanTipe() {
    let isJual = document.getElementById("tipe_keluar").value === "Penjualan";
    document.querySelectorAll(".keluar-harga").forEach(inp => {
        inp.disabled = !isJual;
        if (!isJual) inp.value = "0";
    });
    hitungKeluar();
}

async function submitKeluar(event) {
    event.preventDefault();

    let tipe = document.getElementById("tipe_keluar").value;
    let items = [];
    let perBarang = {};
    let adaHargaNol = false;

    document.querySelectorAll(".keluar-row").forEach(row => {
        let nama = row.querySelector(".keluar-barang").value;
        let jumlah = parseInt(row.querySelector(".keluar-jumlah").value) || 0;
        let harga = row.querySelector(".keluar-harga").value;
        if (nama && jumlah > 0) {
            items.push({ nama_barang: nama, jumlah: jumlah, harga: harga });
            perBarang[nama] = (perBarang[nama] || 0) + jumlah;
            if (tipe === "Penjualan" && angka(harga) === 0) adaHargaNol = true;
        }
    });
    if (items.length === 0) { alert("Harap isi setidaknya satu item barang dengan benar!"); return; }

    for (let nama in perBarang) {
        let b = globalListBarang.find(x => x.nama_barang === nama);
        let stok = b ? Number(b.stok) || 0 : 0;
        if (perBarang[nama] > stok) {
            alert("Stok " + nama + " tidak cukup! Tersedia: " + stok + ", diminta: " + perBarang[nama]);
            return;
        }
    }
    if (adaHargaNol && !confirm("Ada item dengan harga jual Rp 0. Tetap lanjut simpan?")) return;

    let tglPilih = document.getElementById("tanggal_keluar").value;
    if (!tglPilih) { alert("Tanggal invoice wajib diisi."); return; }
    if (tglPilih > hariIniWIB()) { alert("Tanggal invoice tidak boleh melebihi hari ini."); return; }
    let selisihHari = Math.round((Date.parse(hariIniWIB()) - Date.parse(tglPilih)) / 86400000);
    if (selisihHari > 31 && !confirm("Tanggal invoice " + tglCetak(tglPilih) + " adalah " + selisihHari + " hari yang lalu. Tetap lanjut simpan?")) return;

    let payload = {
        aksi: "barang_keluar",
        nama_pelanggan: document.getElementById("nama_pelanggan").value,
        tanggal: document.getElementById("tanggal_keluar").value,
        alamat: document.getElementById("alamat_pelanggan").value,
        tipe_keluar: tipe,
        catatan: document.getElementById("catatan_keluar").value,
        items: items
    };

    let btn = document.getElementById("btn-simpan-keluar");
    btn.disabled = true; btn.textContent = "⏳ Menyimpan...";
    document.getElementById("hasil-keluar").style.display = "none";
    pesanForm("keluar", "Menyimpan barang keluar ke Google Sheets...", "info", 0);

    try {
        let result = await kirimAman(payload, pendingKeluar);
        if (result.status === "success") {
            lastInvoice = result.invoice;
            pesanForm("keluar", "✅ " + result.message + (tipe === "Penjualan" ? " • Total " + rp(result.invoice.total) : ""), "success", 9000);
            document.getElementById("hasil-keluar-teks").textContent =
                (result.duplikat ? "ℹ️ Sudah tersimpan sebelumnya (tidak dobel): " : "✅ Tersimpan sebagai ") + result.invoice.no_invoice + "  ";
            document.getElementById("hasil-keluar").style.display = "block";
            pendingKeluar = { sig: "", id: "" };
            document.getElementById("form-barang-keluar").reset();
            setTanggalKeluar();
            document.getElementById("container-keluar-list").innerHTML = "";
            tambahBarisKeluar();
            loadData();
        } else if (result.status === "batal") {
            pesanForm("keluar", "ℹ️ " + result.message, "info");
        } else {
            pesanForm("keluar", "❌ " + result.message, "error", 0);
        }
    } catch (error) {
        pesanForm("keluar", pesanKoneksi(error), "error", 0);
        debug("POST error: " + error.message);
    } finally {
        btn.disabled = false; btn.textContent = "📤 Simpan Barang Keluar";
    }
}
