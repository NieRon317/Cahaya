// js/util.js - Fungsi bantu umum: format rupiah/tanggal, escape HTML, pesan, sesi browser
FILE_VERSI["util"] = "v11";

// ---------- util ----------
function esc(s) {
    return String(s === undefined || s === null ? "" : s)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function rp(n) { return "Rp " + Number(n || 0).toLocaleString("id-ID"); }
function debug(text) {
    let box = document.getElementById("debug-box");
    box.textContent = "[" + new Date().toLocaleTimeString() + "] " + text + "\n\n" + box.textContent;
}
function showStatus(message, type, duration = 4000) {
    let msgDiv = document.getElementById("status-message");
    msgDiv.style.display = "block";
    msgDiv.className = type === "success" ? "alert-success" : (type === "info" ? "alert-info" : "alert-error");
    msgDiv.textContent = message;
    clearTimeout(statusTimer);
    if (duration > 0) statusTimer = setTimeout(() => { msgDiv.style.display = "none"; }, duration);
}
function formatRupiah(input) {
    let value = input.value.replace(/[^,\d]/g, "").toString();
    let split = value.split(",");
    let sisa = split[0].length % 3;
    let rupiah = split[0].substr(0, sisa);
    let ribuan = split[0].substr(sisa).match(/\d{3}/gi);
    if (ribuan) rupiah += (sisa ? "." : "") + ribuan.join(".");
    input.value = split[1] != undefined ? rupiah + "," + split[1] : rupiah;
}
function angka(str) { return parseFloat(String(str || "0").replace(/\./g, "").replace(/,/g, "")) || 0; }
function buatId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "r" + Date.now() + "-" + Math.random().toString(36).slice(2, 10);
}
function tglCetak(s) {
    let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || "");
    if (!m) return s || "";
    let bln = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
    return parseInt(m[3], 10) + " " + bln[parseInt(m[2], 10) - 1] + " " + m[1];
}
function nomorSJ(no) {
    return String(no || "-").replace(/^IV\.CHY/, "SJ.CHY").replace(/^OUT/, "SJ.CHY");
}
// "hari ini" menurut WIB (UTC+7), selaras dengan server
function hariIniWIB() {
    let d = new Date(Date.now() + 7 * 3600 * 1000);
    let p = n => String(n).padStart(2, "0");
    return d.getUTCFullYear() + "-" + p(d.getUTCMonth() + 1) + "-" + p(d.getUTCDate());
}
function setTanggalKeluar() {
    let el = document.getElementById("tanggal_keluar");
    el.value = hariIniWIB();
    el.max = hariIniWIB();
}
function simpanSesi(id) { try { sessionStorage.setItem("cahaya_uid", id); } catch (e) {} }
function ambilSesi() { try { return sessionStorage.getItem("cahaya_uid") || ""; } catch (e) { return ""; } }
function hapusSesi() { try { sessionStorage.removeItem("cahaya_uid"); } catch (e) {} }

// pesan di bawah tombol simpan (form "masuk" / "keluar"): error tetap tampil sampai ditutup
let pesanFormTimer = {};
function pesanForm(form, teks, jenis, durasi = 4000) {
    let el = document.getElementById("pesan-" + form);
    if (!el) return;
    clearTimeout(pesanFormTimer[form]);
    el.className = "pesan-form " + (jenis === "success" ? "alert-success" : (jenis === "info" ? "alert-info" : "alert-error"));
    el.innerHTML = '<span class="pesan-teks"></span><button type="button" class="pesan-tutup" title="Tutup" onclick="hapusPesanForm(\'' + form + '\')">✕</button>';
    el.querySelector(".pesan-teks").textContent = teks;
    el.style.display = "block";
    try { el.scrollIntoView({ behavior: "smooth", block: "nearest" }); } catch (e) {}
    if (durasi > 0) pesanFormTimer[form] = setTimeout(() => hapusPesanForm(form), durasi);
}
function hapusPesanForm(form) {
    let el = document.getElementById("pesan-" + form);
    if (el) el.style.display = "none";
}

// dialog (jendela kecil) untuk Admin & Ganti Password. Pesan dialog tampil DI BAWAH tombol simpan.
function bukaDlg(nama) { let e = document.getElementById("dlg-" + nama); if (e) e.style.display = "flex"; }
function tutupDlg(nama) {
    let e = document.getElementById("dlg-" + nama);
    if (e) e.style.display = "none";
    hapusPesanForm("dlg-" + nama);
}
