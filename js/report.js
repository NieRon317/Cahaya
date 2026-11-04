// js/report.js - Tab Report + cetak report
FILE_VERSI["report"] = "v10";

// ---------- report (admin) ----------
let reportData = null;
let reportMode = "jual";      // "jual" = penjualan saja | "lain" = pemakaian, rusak, retur (tanpa penjualan)
let reportUrut = "laris";
let reportCari = "";
let reportLimit = 60;
const BLN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function kompak(n) {
    n = Number(n) || 0;
    let a = Math.abs(n);
    let f = (x, suf) => (Math.round(x * 10) / 10).toString().replace(".", ",") + suf;
    if (a >= 1e9) return f(n / 1e9, " M");
    if (a >= 1e6) return f(n / 1e6, " jt");
    if (a >= 1e3) return f(n / 1e3, " rb");
    return (Math.round(n * 10) / 10).toString().replace(".", ",");
}
function niceMax(v) {
    if (!(v > 0)) return 1;
    let e = Math.pow(10, Math.floor(Math.log10(v)));
    let f = v / e;
    let steps = [1, 2, 4, 6, 8, 10];
    let nf = steps.find(x => f <= x) || 10;
    return nf * e;
}
function labelBulan(key, pendek) {
    let p = key.split("-");
    let nm = BLN[parseInt(p[1], 10) - 1];
    return pendek ? nm : nm + " " + p[0].slice(2);
}

function barChartSVG(labels, values, opt) {
    opt = opt || {};
    let mini = !!opt.mini;
    let W = opt.w || (mini ? 300 : 1000), H = opt.h || (mini ? 130 : 320);
    let m = mini ? { l: 6, r: 6, t: 18, b: 20 } : { l: 64, r: 16, t: 24, b: 40 };
    let fmt = opt.fmt || kompak;
    let nice = niceMax(Math.max.apply(null, values.concat([0])));
    let iw = W - m.l - m.r, ih = H - m.t - m.b;
    let n = values.length, slot = iw / n, bw = slot * (mini ? 0.7 : 0.6);
    let fs = opt.fs || (mini ? 8 : 11);

    let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px;display:block;margin:0 auto" role="img" font-family="Segoe UI, Arial, sans-serif">`;
    if (!mini) {
        for (let i = 0; i <= 4; i++) {
            let y = m.t + ih - ih * i / 4;
            s += `<line x1="${m.l}" y1="${y}" x2="${W - m.r}" y2="${y}" stroke="#e5e8eb"/>`;
            s += `<text x="${m.l - 8}" y="${y + 4}" text-anchor="end" font-size="${fs}" fill="#777">${esc(fmt(nice * i / 4))}</text>`;
        }
    } else {
        s += `<line x1="${m.l}" y1="${m.t + ih}" x2="${W - m.r}" y2="${m.t + ih}" stroke="#cfd5da"/>`;
    }
    values.forEach((v, i) => {
        let h = nice > 0 ? ih * v / nice : 0;
        let x = m.l + slot * i + (slot - bw) / 2;
        let y = m.t + ih - h;
        let akhir = (i === n - 1);   // bulan berjalan (belum penuh)
        let warna = akhir ? "#9fc9ec" : (opt.warna || "#3498db");
        let judul = esc((opt.judulLabel ? opt.judulLabel[i] : labels[i]) + ": " + (opt.tip ? opt.tip(v) : fmt(v)));
        s += `<rect x="${x}" y="${y}" width="${bw}" height="${Math.max(h, v > 0 ? 1 : 0)}" fill="${warna}" rx="2" ${akhir ? 'stroke="#2c7fb8" stroke-dasharray="3 2"' : ""}><title>${judul}</title></rect>`;
        if (v > 0) s += `<text x="${x + bw / 2}" y="${y - 4}" text-anchor="middle" font-size="${fs}" fill="#333">${esc(fmt(v))}</text>`;
        s += `<text x="${m.l + slot * i + slot / 2}" y="${H - (mini ? 6 : 16)}" text-anchor="middle" font-size="${fs}" fill="${akhir ? "#2c7fb8" : "#666"}">${esc(labels[i])}</text>`;
    });
    return s + "</svg>";
}

async function loadReport(segar) {
    let box = document.getElementById("report-isi");
    box.innerHTML = '<div class="report-loading">⏳ Menghitung report... (pertama kali bisa beberapa detik)</div>';
    try {
        let res = await kirimPost({ aksi: "report", segar: !!segar });
        if (!sesi) return;
        if (res.status === "success") {
            reportData = res;
            renderReport();
        } else {
            box.innerHTML = '<div class="report-loading" style="color:#c0392b;">' + esc(res.message || "Gagal memuat report") + '</div>';
        }
    } catch (error) {
        box.innerHTML = '<div class="report-loading" style="color:#c0392b;">Gagal terhubung ke Google Sheets.</div>';
        debug("REPORT error: " + error.message);
    }
}

function renderReport() {
    let d = reportData;
    if (!d) return;
    let n = d.bulan.length;
    let rp13 = d.penjualan_rp;
    let labels = d.bulan.map(k => labelBulan(k, false));

    let pelRows = (d.top_pelanggan || []).map((p, i) => `
        <tr><td>${i + 1}</td><td>${esc(p.nama)}</td><td class="num">${p.invoice}</td><td class="num">${rp(p.total)}</td></tr>`).join("");

    document.getElementById("report-isi").innerHTML = `
        <div class="rep-bar">
            <span>Diperbarui: ${esc(d.diperbarui)} WIB • bulan ${esc(labels[n - 1])} belum penuh (batang paling kanan, putus-putus)</span>
            <span style="display:flex;gap:8px;"><button class="btn btn-small" onclick="cetakReport()">🖨️ Cetak Report</button><button class="btn btn-small btn-gray" onclick="loadReport(true)">🔄 Muat ulang</button></span>
        </div>

        <div class="kpi-grid">${kpiReportHTML(d)}</div>

        <div class="rep-box">
            <h4>💰 Total Penjualan per Bulan (Rp)</h4>
            ${barChartSVG(labels, rp13, { fmt: kompak, tip: v => rp(v) })}
        </div>

        <h3 style="margin-top:28px;">📦 Jumlah Item Terjual per Barang per Bulan</h3>
        <div class="rep-controls">
            <label><input type="radio" name="rep-mode" value="jual" ${reportMode === "jual" ? "checked" : ""} onchange="setReportMode(this.value)"> Penjualan saja</label>
            <label><input type="radio" name="rep-mode" value="lain" ${reportMode === "lain" ? "checked" : ""} onchange="setReportMode(this.value)"> Pemakaian, rusak, retur (tanpa penjualan)</label>
            <select id="rep-urut" onchange="setReportUrut(this.value)">
                <option value="laris" ${reportUrut === "laris" ? "selected" : ""}>Urut: Terlaris (12 bln)</option>
                <option value="restock" ${reportUrut === "restock" ? "selected" : ""}>Urut: Paling perlu restock</option>
                <option value="nama" ${reportUrut === "nama" ? "selected" : ""}>Urut: Nama A–Z</option>
            </select>
            <input type="text" id="rep-cari" placeholder="Cari barang..." value="${esc(reportCari)}" oninput="setReportCari(this.value)">
        </div>
        <div id="rep-grid" class="rep-grid"></div>

        <h3 style="margin-top:28px;">🏆 Top 10 Pelanggan (13 bulan, tipe Penjualan)</h3>
        <table>
            <thead><tr><th style="width:50px;">No</th><th>Pelanggan</th><th class="num">Invoice</th><th class="num">Total Penjualan</th></tr></thead>
            <tbody>${pelRows || '<tr><td colspan="4" style="text-align:center;">Belum ada data.</td></tr>'}</tbody>
        </table>
    `;
    renderBarangGrid();
}

function setReportMode(v) { reportMode = v; reportLimit = 60; renderBarangGrid(); }
function setReportUrut(v) { reportUrut = v; reportLimit = 60; renderBarangGrid(); }
function setReportCari(v) { reportCari = v; reportLimit = 60; renderBarangGrid(); }
function tampilSemuaBarang() { reportLimit = 100000; renderBarangGrid(); }

function kpiReportHTML(d) {
    let n = d.bulan.length;
    let rp13 = d.penjualan_rp;
    let labels = d.bulan.map(k => labelBulan(k, false));
    let ini = rp13[n - 1], lalu = rp13[n - 2];
    let total12 = rp13.slice(0, n - 1).reduce((x, y) => x + y, 0);   // 12 bulan PENUH, tanpa bulan berjalan
    let rata = total12 / (n - 1);
    return `
        <div class="kpi"><div class="kpi-label">Penjualan bulan berjalan (${esc(labels[n - 1])})</div><div class="kpi-val">${rp(ini)}</div><div class="kpi-sub">belum penuh • ${d.jumlah_invoice[n - 1]} invoice</div></div>
        <div class="kpi"><div class="kpi-label">Penjualan bulan lalu (${esc(labels[n - 2])})</div><div class="kpi-val">${rp(lalu)}</div><div class="kpi-sub">${d.jumlah_invoice[n - 2]} invoice</div></div>
        <div class="kpi"><div class="kpi-label">Rata-rata per bulan (12 bln penuh)</div><div class="kpi-val">${rp(Math.round(rata))}</div><div class="kpi-sub">${esc(labels[0])} – ${esc(labels[n - 2])}</div></div>
        <div class="kpi"><div class="kpi-label">Total 12 bulan penuh</div><div class="kpi-val">${rp(total12)}</div><div class="kpi-sub">${esc(labels[0])} – ${esc(labels[n - 2])}, tidak termasuk bulan berjalan. Dengan bulan berjalan: ${rp(total12 + ini)}</div></div>`;
}

function badgeCover(x) {
    if (x.cover === null) {
        return x.b.stok > 0 ? '<span class="bdg abu">tidak ada penjualan 3 bln terakhir</span>' : '<span class="bdg abu">stok kosong</span>';
    }
    let t = (Math.round(x.cover * 10) / 10).toString().replace(".", ",");
    if (x.cover < 1) return `<span class="bdg merah">⚠️ cukup ±${t} bln, segera restock</span>`;
    if (x.cover < 2) return `<span class="bdg kuning">cukup ±${t} bln, siap-siap restock</span>`;
    return `<span class="bdg hijau">cukup ±${t} bln</span>`;
}

// daftar barang sesuai pilihan (mode, urutan, pencarian) - dipakai layar & cetak
function susunDaftarBarang() {
    let d = reportData;
    let n = d.bulan.length;
    let cari = reportCari.trim().toLowerCase();

    let list = d.barang.map(b => {
        let arr = reportMode === "jual" ? b.jual : b.lain;
        let total12 = 0;
        for (let i = 0; i < n - 1; i++) total12 += arr[i];
        let avg3 = (arr[n - 2] + arr[n - 3] + arr[n - 4]) / 3;                   // 3 bulan penuh terakhir
        let avgJual = (b.jual[n - 2] + b.jual[n - 3] + b.jual[n - 4]) / 3;       // perkiraan stok cukup SELALU dari penjualan
        return { b: b, arr: arr, total12: total12, ini: arr[n - 1], avg3: avg3, cover: avgJual > 0 ? b.stok / avgJual : null };
    }).filter(x => !cari || String(x.b.nama).toLowerCase().indexOf(cari) >= 0 || String(x.b.sku).toLowerCase().indexOf(cari) >= 0);

    if (reportUrut === "nama") {
        list.sort((p, q) => String(p.b.nama).localeCompare(String(q.b.nama)));
    } else if (reportUrut === "restock") {
        list.sort((p, q) => (p.cover === null ? 1e9 : p.cover) - (q.cover === null ? 1e9 : q.cover));
    } else {
        list.sort((p, q) => (q.total12 - p.total12) || (q.ini - p.ini) || String(p.b.nama).localeCompare(String(q.b.nama)));
    }
    return list;
}

function kartuBarangHTML(x) {
    let d = reportData;
    let labelPendek = d.bulan.map(k => labelBulan(k, true));
    let labelPenuh = d.bulan.map(k => labelBulan(k, false));
    // badge "stok cukup" hanya relevan untuk mode penjualan
    let badge = reportMode === "jual" ? "&nbsp; " + badgeCover(x) : "";
    return `
        <div class="rep-card">
            <div class="rep-card-head"><strong>${esc(x.b.nama)}</strong><span class="rep-unit">${esc(x.b.satuan)}</span></div>
            ${barChartSVG(labelPendek, x.arr, { mini: true, fmt: kompak, judulLabel: labelPenuh, tip: v => kompak(v) + " " + x.b.satuan })}
            <div class="rep-stat">Total 12 bln: <b>${kompak(x.total12)}</b> • Bulan ini: <b>${kompak(x.ini)}</b> • Rata-rata 3 bln: <b>${kompak(x.avg3)}</b>/bln</div>
            <div class="rep-stat">Stok sekarang: <b>${kompak(x.b.stok)}</b> ${esc(x.b.satuan)}${badge}</div>
        </div>`;
}

function renderBarangGrid() {
    let d = reportData;
    let grid = document.getElementById("rep-grid");
    if (!d || !grid) return;

    let list = susunDaftarBarang();
    if (list.length === 0) {
        grid.innerHTML = '<div class="report-loading" style="grid-column:1/-1;">Tidak ada barang yang cocok.</div>';
        return;
    }
    let tampil = list.slice(0, reportLimit);
    grid.innerHTML = tampil.map(kartuBarangHTML).join("");
    if (list.length > tampil.length) {
        grid.innerHTML += `<div style="grid-column:1/-1;text-align:center;"><button class="btn btn-small" onclick="tampilSemuaBarang()">Tampilkan semua (${list.length} barang)</button></div>`;
    }
}

// ---------- cetak report ----------
function htmlReportCetak() {
    let d = reportData;
    let n = d.bulan.length;
    let labels = d.bulan.map(k => labelBulan(k, false));
    let list = susunDaftarBarang();
    let modeTxt = reportMode === "jual" ? "Penjualan saja" : "Pemakaian, rusak, retur (tanpa penjualan)";
    let urutTxt = { laris: "Terlaris (12 bln)", restock: "Paling perlu restock", nama: "Nama A–Z" }[reportUrut] || "";
    let cariTxt = reportCari.trim() ? " • Pencarian: \"" + esc(reportCari.trim()) + "\"" : "";

    let barisBulan = d.bulan.map((k, i) => `
        <tr><td>${esc(labels[i])}${i === n - 1 ? " (berjalan)" : ""}</td><td class="num">${rp(d.penjualan_rp[i])}</td><td class="num">${d.jumlah_invoice[i]}</td></tr>`).join("");
    let barisPel = (d.top_pelanggan || []).map((p, i) => `
        <tr><td>${i + 1}</td><td>${esc(p.nama)}</td><td class="num">${p.invoice}</td><td class="num">${rp(p.total)}</td></tr>`).join("");

    return `
        <div class="rp-doc">
            <div class="rp-head">
                <div><h1>${esc(NAMA_TOKO)}</h1><div class="sub">Laporan Penjualan &amp; Planning Stok</div></div>
                <div class="rp-meta">Dicetak: ${esc(tglCetak(hariIniWIB()))}<br>Data diperbarui: ${esc(d.diperbarui)} WIB</div>
            </div>

            <div class="kpi-grid">${kpiReportHTML(d)}</div>

            <h2>Total Penjualan per Bulan (Rp)</h2>
            ${barChartSVG(labels, d.penjualan_rp, { fmt: kompak, tip: v => rp(v), w: 720, h: 300, fs: 12 })}
            <div class="rp-info">Batang paling kanan = bulan berjalan (belum penuh). Hanya tipe Penjualan.</div>
            <table>
                <thead><tr><th>Bulan</th><th class="num">Total Penjualan</th><th class="num">Jumlah Invoice</th></tr></thead>
                <tbody>${barisBulan}</tbody>
            </table>

            <h2 class="baru-halaman">Jumlah Item per Barang per Bulan</h2>
            <div class="rp-info">Tampilan: <b>${esc(modeTxt)}</b> • Urut: ${esc(urutTxt)}${cariTxt} • ${list.length} barang</div>
            <div class="rep-grid">${list.map(kartuBarangHTML).join("") || "Tidak ada barang yang cocok."}</div>

            <h2>Top 10 Pelanggan (13 bulan, tipe Penjualan)</h2>
            <table>
                <thead><tr><th style="width:40px;">No</th><th>Pelanggan</th><th class="num">Invoice</th><th class="num">Total Penjualan</th></tr></thead>
                <tbody>${barisPel || '<tr><td colspan="4" style="text-align:center;">Belum ada data.</td></tr>'}</tbody>
            </table>
        </div>`;
}

function cetakReport() {
    if (!reportData) { alert("Report belum dimuat."); return; }
    document.getElementById("invoice-isi").innerHTML = htmlReportCetak();
    document.title = "Report Penjualan " + hariIniWIB();
    document.getElementById("modal-invoice").style.display = "block";
}
