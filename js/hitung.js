// js/hitung.js - Perhitungan subtotal & total di form barang masuk/keluar
FILE_VERSI["hitung"] = "v10";

// ---------- hitung total harga ----------
function hitungTotal(cfg) {
    let totalQty = 0, total = 0;
    let pakai = cfg.pakaiHarga();
    document.querySelectorAll(cfg.row).forEach(row => {
        let jml = parseFloat(row.querySelector(cfg.jumlah).value) || 0;
        let harga = pakai ? angka(row.querySelector(cfg.harga).value) : 0;
        let sub = jml * harga;
        row.querySelector(".subtotal").textContent = pakai ? rp(sub) : "-";
        if (row.querySelector(cfg.barang).value) { totalQty += jml; total += sub; }
    });
    document.getElementById(cfg.idQty).textContent = totalQty;
    document.getElementById(cfg.idTotal).textContent = pakai ? rp(total) : "-";
}
const CFG_MASUK = {
    row: ".item-row", barang: ".input-nama-barang", jumlah: ".input-jumlah", harga: ".input-harga",
    idQty: "masuk-total-qty", idTotal: "masuk-total-harga", pakaiHarga: () => true
};
const CFG_KELUAR = {
    row: ".keluar-row", barang: ".keluar-barang", jumlah: ".keluar-jumlah", harga: ".keluar-harga",
    idQty: "keluar-total-qty", idTotal: "keluar-total-harga",
    pakaiHarga: () => document.getElementById("tipe_keluar").value === "Penjualan"
};
function hitungMasuk() { hitungTotal(CFG_MASUK); }
function hitungKeluar() { hitungTotal(CFG_KELUAR); }
