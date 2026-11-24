// Menu Piutang: daftar tagihan aktif dan pencatatan pembayaran.
FILE_VERSI["piutang"] = "v11";
let piutangData = null;
let pendingBayar = { sig: "", id: "" };
let piutangDipilih = null;

async function loadPiutang() {
    const box = document.getElementById("piutang-isi");
    box.textContent = "Memuat daftar piutang...";
    try {
        const res = await kirimPost({ aksi: "piutang_daftar" });
        if (!sesi) return;
        if (res.status !== "success") { box.textContent = res.message || "Gagal memuat piutang."; return; }
        piutangData = res;
        renderPiutang();
    } catch (e) { box.textContent = "Gagal terhubung ke server."; }
}

function renderPiutang() {
    let d = piutangData, bolehBayar = punyaIzin("catat_pembayaran");
    let rows = d.piutang.map((v, i) => `<tr>
        <td>${esc(v.no_invoice)}</td><td>${esc(tglCetak(v.tanggal))}</td><td>${esc(v.pelanggan)}</td>
        <td class="num">${rp(v.total)}</td><td class="num">${rp(v.dibayar)}</td><td class="num"><b>${rp(v.sisa)}</b></td>
        <td>${esc(tglCetak(v.jatuh_tempo))}</td><td>${v.terlambat ? '<span class="bdg merah">Terlambat</span>' : 'Belum jatuh tempo'}</td>
        <td>${bolehBayar ? `<button class="btn btn-small" onclick="bukaBayar(${i})">Catat pembayaran</button>` : ''}</td>
        </tr>`).join("");
    document.getElementById("piutang-isi").innerHTML = `<div class="rep-bar"><span>${d.piutang.length} invoice belum lunas • Total piutang: <b>${rp(d.total)}</b> • Terlambat: <b>${rp(d.total_terlambat)}</b></span><button class="btn btn-small btn-gray" onclick="loadPiutang()">Muat ulang</button></div>
      <div style="overflow-x:auto"><table><thead><tr><th>Invoice</th><th>Tanggal</th><th>Pembeli</th><th class="num">Total</th><th class="num">Dibayar</th><th class="num">Sisa</th><th>Jatuh tempo</th><th>Status</th><th>Aksi</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="9" style="text-align:center">Tidak ada piutang yang belum lunas.</td></tr>'}</tbody></table></div>
      <div id="piutang-form" class="form-card" style="display:none;margin-top:18px;max-width:520px">
        <h3 id="piutang-judul">Catat pembayaran</h3>
        <form onsubmit="simpanPembayaran(event)">
          <div class="form-group"><label>Tanggal bayar</label><input type="date" id="bayar-tanggal" required></div>
          <div class="form-group"><label>Nominal diterima (Rp)</label><input type="number" id="bayar-nominal" min="0.01" step="0.01" required></div>
          <div id="bayar-riwayat" class="catatan-kecil"></div>
          <div style="display:flex;gap:8px;margin-top:12px"><button type="submit" class="btn" id="btn-bayar">Simpan pembayaran</button>
            <button type="button" class="btn btn-gray" onclick="document.getElementById('piutang-form').style.display='none'">Tutup</button></div>
          <div id="pesan-piutang" class="pesan-form"></div>
        </form>
      </div>`;
}

function bukaBayar(i) {
    if (!punyaIzin("catat_pembayaran") || !piutangData || !piutangData.piutang[i]) return;
    piutangDipilih = piutangData.piutang[i];
    document.getElementById("piutang-judul").textContent = "Pembayaran " + piutangDipilih.no_invoice + " — sisa " + rp(piutangDipilih.sisa);
    document.getElementById("bayar-tanggal").value = hariIniWIB();
    document.getElementById("bayar-tanggal").max = hariIniWIB();
    document.getElementById("bayar-nominal").value = piutangDipilih.sisa;
    document.getElementById("bayar-nominal").max = piutangDipilih.sisa;
    document.getElementById("bayar-riwayat").innerHTML = piutangDipilih.riwayat.length ?
        "Pembayaran sebelumnya: " + piutangDipilih.riwayat.map(b => `${esc(tglCetak(b.tanggal))} ${rp(b.nominal)} (${esc(b.oleh)})`).join("; ") : "Belum ada pembayaran sebelumnya.";
    document.getElementById("piutang-form").style.display = "block";
    hapusPesanForm("piutang");
    document.getElementById("piutang-form").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

async function simpanPembayaran(event) {
    event.preventDefault();
    if (!piutangDipilih) return;
    let payload = { aksi: "piutang_bayar", no_invoice: piutangDipilih.no_invoice,
        tanggal_bayar: document.getElementById("bayar-tanggal").value,
        nominal: Number(document.getElementById("bayar-nominal").value) };
    let btn = document.getElementById("btn-bayar");
    btn.disabled = true;
    try {
        let res = await kirimAman(payload, pendingBayar);
        if (!sesi) return;
        if (res.status === "success") {
            pendingBayar = { sig: "", id: "" };
            piutangDipilih = null;
            await loadPiutang();
            showStatus("Pembayaran tercatat. Sisa tagihan: " + rp(res.sisa), "success");
        } else pesanForm("piutang", res.message || "Pembayaran gagal.", "error", 0);
    } catch (e) { pesanForm("piutang", pesanKoneksi(e), "error", 0); }
    finally { btn.disabled = false; }
}
