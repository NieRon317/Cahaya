// js/cetak.js - Dokumen cetak: invoice, surat jalan, terbilang
FILE_VERSI["cetak"] = "v10";

// ---------- terbilang (angka -> kata) ----------
function terbilangAngka(n) {
    const s = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
    n = Math.floor(n);
    if (n < 12) return s[n];
    if (n < 20) return terbilangAngka(n - 10) + " belas";
    if (n < 100) return terbilangAngka(Math.floor(n / 10)) + " puluh" + (n % 10 ? " " + terbilangAngka(n % 10) : "");
    if (n < 200) return "seratus" + (n - 100 ? " " + terbilangAngka(n - 100) : "");
    if (n < 1000) return terbilangAngka(Math.floor(n / 100)) + " ratus" + (n % 100 ? " " + terbilangAngka(n % 100) : "");
    if (n < 2000) return "seribu" + (n - 1000 ? " " + terbilangAngka(n - 1000) : "");
    if (n < 1e6) return terbilangAngka(Math.floor(n / 1e3)) + " ribu" + (n % 1e3 ? " " + terbilangAngka(n % 1e3) : "");
    if (n < 1e9) return terbilangAngka(Math.floor(n / 1e6)) + " juta" + (n % 1e6 ? " " + terbilangAngka(n % 1e6) : "");
    if (n < 1e12) return terbilangAngka(Math.floor(n / 1e9)) + " miliar" + (n % 1e9 ? " " + terbilangAngka(n % 1e9) : "");
    return terbilangAngka(Math.floor(n / 1e12)) + " triliun" + (n % 1e12 ? " " + terbilangAngka(n % 1e12) : "");
}
function terbilangRupiah(n) {
    n = Math.round(Number(n) || 0);
    if (n <= 0) return "Nol rupiah";
    let t = terbilangAngka(n).trim();
    return t.charAt(0).toUpperCase() + t.slice(1) + " rupiah";
}

// ---------- dokumen cetak: invoice & surat jalan ----------
function rpTabel(n) {
    return '<div class="rp"><span>Rp.</span><span>' + Number(n || 0).toLocaleString("id-ID") + ',-</span></div>';
}

function htmlInvoice(inv, isJual) {
    const MIN_BARIS = 12;
    let baris = inv.items.map((it, i) => `
        <tr>
            <td class="c">${i + 1}.</td>
            <td>${esc(it.nama)}</td>
            <td class="c">${esc(String(it.jumlah).replace(".", ","))}</td>
            <td>${isJual ? rpTabel(it.harga) : '<div class="c">-</div>'}</td>
            <td>${isJual ? rpTabel(it.total) : '<div class="c">-</div>'}</td>
        </tr>`);
    for (let i = inv.items.length; i < MIN_BARIS; i++) {
        baris.push('<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>');
    }

    let totalRow = isJual ? `
        <tfoot><tr>
            <td colspan="3" class="tanpa"></td>
            <td class="tlabel">TOTAL :</td>
            <td><div class="rp"><b>Rp.</b><b>${Number(inv.total || 0).toLocaleString("id-ID")},-</b></div></td>
        </tr></tfoot>` : "";

    let terbilang = isJual ? `
        <div class="iv-terbilang">
            <div>Terbilang:</div>
            <div>${esc(terbilangRupiah(inv.total))}</div>
        </div>` : "";

    return `
        <div class="iv-doc">
            <div class="iv-title">${esc(NAMA_TOKO)}</div>
            <div class="iv-top">
                <div>
                    <div class="iv-judul">INVOICE</div>
                    <div class="iv-kepada">
                        <div class="lbl">Kepada:</div>
                        <div class="baris"><b>${esc(inv.pelanggan)}</b></div>
                        <div class="baris">${esc(inv.alamat) || "&nbsp;"}</div>
                    </div>
                </div>
                <table class="iv-box">
                    <tr>
                        <td>Tanggal:<br><b>${esc(tglCetak(inv.tanggal))}</b></td>
                        <td>Nomor:<br><b>${esc(inv.no_invoice)}</b></td>
                    </tr>
                    <tr>
                        <td>Tanggal Jatuh Tempo:<br>&nbsp;</td>
                        <td>Surat Jalan No.:<br><b>${esc(nomorSJ(inv.no_invoice))}</b></td>
                    </tr>
                </table>
            </div>
            <table class="iv-tabel">
                <colgroup>
                    <col style="width:5%"><col style="width:49%"><col style="width:10%">
                    <col style="width:17%"><col style="width:19%">
                </colgroup>
                <thead>
                    <tr><th>No:</th><th>Nama Barang</th><th>QTY</th><th>@Harga</th><th>Total Harga</th></tr>
                </thead>
                <tbody>${baris.join("")}</tbody>
                ${totalRow}
            </table>
            ${terbilang}
            <div class="iv-hormat">
                Hormat kami,
                <div class="garis"></div>
            </div>
        </div>
    `;
}

function htmlSuratJalan(inv, nomor) {
    let baris = inv.items.map((it, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${esc(it.nama)}</td>
            <td class="num">${esc(String(it.jumlah).replace(".", ","))}</td>
            <td>${esc(it.satuan || "Pcs")}</td>
        </tr>`).join("");

    return `
        <div class="inv-head">
            <div>
                <h1>${esc(NAMA_TOKO)}</h1>
                <div class="sub">Bukti Barang Keluar</div>
            </div>
            <div class="inv-no">
                <strong>No. ${esc(nomor)}</strong><br>
                Tanggal: ${esc(tglCetak(inv.tanggal))}
            </div>
        </div>
        <table class="inv-meta">
            <tr><td>Pelanggan / Tujuan</td><td>: ${esc(inv.pelanggan)}</td></tr>
            ${inv.alamat ? `<tr><td>Alamat</td><td>: ${esc(inv.alamat)}</td></tr>` : ""}
            <tr><td>Tipe Keluar</td><td>: ${esc(inv.tipe)}</td></tr>
            ${inv.catatan ? `<tr><td>Catatan</td><td>: ${esc(inv.catatan)}</td></tr>` : ""}
        </table>
        <table>
            <thead>
                <tr><th style="width:50px;">No</th><th>Nama Barang</th><th class="num" style="width:100px;">Jumlah</th><th style="width:100px;">Satuan</th></tr>
            </thead>
            <tbody>${baris}</tbody>
        </table>
        <div class="inv-sign">
            <div class="kolom">Pengirim<div class="garis"></div></div>
            <div class="kolom">Penerima<div class="garis"></div></div>
        </div>
    `;
}

function bukaDokumen(inv, jenis) {
    if (!inv) return;
    let isSJ = jenis === "sj";
    let nomor = isSJ ? nomorSJ(inv.no_invoice) : inv.no_invoice;

    document.getElementById("invoice-isi").innerHTML =
        isSJ ? htmlSuratJalan(inv, nomor) : htmlInvoice(inv, inv.tipe === "Penjualan");

    // judul tab = nama file saat disimpan sebagai PDF
    document.title = (isSJ ? "Surat Jalan " : "Invoice ") + String(nomor).replace(/[\/\\]/g, "-");
    document.getElementById("modal-invoice").style.display = "block";
}
function tutupInvoice() {
    document.getElementById("modal-invoice").style.display = "none";
    document.title = JUDUL_ASLI;
}
