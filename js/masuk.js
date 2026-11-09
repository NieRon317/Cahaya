// js/masuk.js - Form Barang Masuk
FILE_VERSI["masuk"] = "v11";

// ---------- barang masuk ----------
function tambahBarisItem() {
    let container = document.getElementById("container-item-list");
    let rowDiv = document.createElement("div");
    rowDiv.className = "grid-container item-row";
    rowDiv.style.marginBottom = "8px";
    rowDiv.innerHTML = `
        <div><select class="input-nama-barang" onchange="hitungMasuk()" required>${opsiMasuk()}</select></div>
        <div><input type="number" class="input-jumlah" min="1" value="1" oninput="hitungMasuk()" required></div>
        <div><input type="text" class="input-harga" value="0" oninput="formatRupiah(this); hitungMasuk()" required></div>
        <div class="subtotal">Rp 0</div>
        <div><button type="button" class="btn btn-danger" onclick="hapusBarisItem(this)">Hapus</button></div>
    `;
    container.appendChild(rowDiv);
    hitungMasuk();
}
function hapusBarisItem(button) {
    let container = document.getElementById("container-item-list");
    if (container.children.length > 1) { button.closest(".item-row").remove(); hitungMasuk(); }
    else alert("Minimal harus ada 1 item barang dalam transaksi!");
}

async function submitData(event) {
    event.preventDefault();

    let items = [];
    document.querySelectorAll(".item-row").forEach(row => {
        let namaBarang = row.querySelector(".input-nama-barang").value;
        let jumlah = parseInt(row.querySelector(".input-jumlah").value) || 0;
        let hargaStr = row.querySelector(".input-harga").value;
        if (namaBarang && jumlah > 0) items.push({ nama_barang: namaBarang, jumlah: jumlah, harga: hargaStr });
    });
    if (items.length === 0) { alert("Harap isi setidaknya satu item barang dengan benar!"); return; }

    let payload = {
        aksi: "barang_masuk",
        nama_toko: document.getElementById("nama_toko").value,
        tanggal_invoice: document.getElementById("tanggal_invoice").value,
        nomor_invoice: document.getElementById("nomor_invoice").value,
        items: items
    };

    let btn = document.getElementById("btn-simpan");
    btn.disabled = true; btn.textContent = "⏳ Menyimpan...";
    pesanForm("masuk", "Menyimpan data invoice ke Google Sheets...", "info", 0);

    try {
        let result = await kirimAman(payload, pendingMasuk);
        if (result.status === "success") {
            let tambahan = (result.total !== undefined) ? " • Total " + rp(result.total) : "";
            pesanForm("masuk", "✅ " + (result.message || "Berhasil disimpan") + tambahan, "success", result.duplikat ? 9000 : 6000);
            pendingMasuk = { sig: "", id: "" };
            document.getElementById("form-barang-masuk").reset();
            document.getElementById("container-item-list").innerHTML = "";
            tambahBarisItem();
            loadData();
        } else if (result.status === "batal") {
            pesanForm("masuk", "ℹ️ " + result.message, "info");
        } else {
            pesanForm("masuk", "❌ Gagal menyimpan: " + result.message, "error", 0);
        }
    } catch (error) {
        pesanForm("masuk", pesanKoneksi(error), "error", 0);
        debug("POST error: " + error.message);
    } finally {
        btn.disabled = false; btn.textContent = "💾 Simpan Semua Barang Masuk";
    }
}
