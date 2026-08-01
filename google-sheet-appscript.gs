// ============================================================
// KANTIN BALMON — Google Sheets (Pesanan + Stok Terpusat)
// ------------------------------------------------------------
// CARA SETUP (sekali saja, gratis):
// 1. Buka https://sheets.new  -> buat spreadsheet baru
// 2. Menu: Extensions -> Apps Script, hapus isi editor,
//    tempel SEMUA kode di bawah ini.
// 3. (Opsional) Ganti TOKEN di bawah dengan kata sandi sendiri.
//    Toko pakai token itu untuk mengubah stok (aman dari orang luar).
// 4. Deploy -> New deployment
//    - Choose type: Web app
//    - Execute as : Me
//    - Who has access: Anyone
// 5. Salin "Web app URL" (berakhiran /exec)
// 6. Tempel URL (dan token, jika dipakai) di halaman /admin
//    -> Simpan.
// PENTING: setiap kali kode ini diubah, buat deployment baru:
//    Deploy -> Manage deployments -> (edit) -> Version: New
//    -> Deploy, lalu salin URL /exec yang baru.
//
// Sheet "Pesanan" = rekap daftar belanja.
// Sheet "Stok"    = stok terpusat (Produk ID, Nama, Stok).
// ============================================================

const TOKEN = ''; // ganti, mis. TOKEN = 'rahasia123';

// Isi dengan ID spreadsheet yang dipakai untuk rekap & stok.
// Contoh URL: https://docs.google.com/spreadsheets/d/ABCDEF12345/edit
// maka ID = ABCDEF12345
// Biarkan '' kalau script dibuat lewat Extensions > Apps Script dari spreadsheet.
const SPREADSHEET_ID = '';

function getSpreadsheet_() {
  if (SPREADSHEET_ID) return SpreadsheetApp.openById(SPREADSHEET_ID);
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getStokSheet_() {
  const ss = getSpreadsheet_();
  let sh = ss.getSheetByName('Stok');
  if (!sh) {
    sh = ss.insertSheet('Stok');
    sh.appendRow(['Produk ID', 'Nama', 'Stok']);
  }
  return sh;
}

function getPesananSheet_() {
  const ss = getSpreadsheet_();
  let sh = ss.getSheetByName('Pesanan');
  if (!sh) {
    sh = ss.insertSheet('Pesanan');
    sh.appendRow([
      'Waktu', 'No. Daftar', 'Nama Pembeli', 'Catatan',
      'Rincian Item', 'Jumlah Item', 'Total (Rp)',
    ]);
  }
  return sh;
}

function readStocks_() {
  const sh = getStokSheet_();
  const rows = sh.getDataRange().getValues();
  const stocks = {};
  for (let i = 1; i < rows.length; i++) {
    const id = rows[i][0];
    if (id != null && String(id).trim() !== '') {
      stocks[String(id)] = Number(rows[i][2]) || 0;
    }
  }
  return stocks;
}

function writeStock_(productId, value) {
  const sh = getStokSheet_();
  const n = Math.max(0, Number(value) || 0);
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(productId)) {
      sh.getRange(i + 1, 3).setValue(n);
      return;
    }
  }
  sh.appendRow([String(productId), '', n]);
}

function deleteStock_(productId) {
  const sh = getStokSheet_();
  const rows = sh.getDataRange().getValues();
  for (let i = rows.length - 1; i >= 1; i--) {
    if (String(rows[i][0]) === String(productId)) {
      sh.getRange(i + 1, 1, 1, sh.getLastColumn()).deleteCells(
        SpreadsheetApp.Dimension.ROWS
      );
      return;
    }
  }
}

function decrementStock_(productId, qty) {
  const stocks = readStocks_();
  if (!(productId in stocks)) return;
  writeStock_(productId, Math.max(0, stocks[productId] - qty));
}

function getUnggulanSheet_() {
  const ss = getSpreadsheet_();
  let sh = ss.getSheetByName('Unggulan');
  if (!sh) {
    sh = ss.insertSheet('Unggulan');
    sh.appendRow(['Produk ID']);
  }
  return sh;
}

function readFeatured_() {
  const sh = getUnggulanSheet_();
  const rows = sh.getDataRange().getValues();
  const ids = [];
  for (let i = 1; i < rows.length; i++) {
    const id = rows[i][0];
    if (id != null && String(id).trim() !== '') ids.push(String(id));
  }
  return ids;
}

function writeFeatured_(ids) {
  const sh = getUnggulanSheet_();
  sh.clearContents();
  sh.appendRow(['Produk ID']);
  (Array.isArray(ids) ? ids : []).forEach(function (id) {
    if (id != null && String(id).trim() !== '') sh.appendRow([String(id)]);
  });
}

function authorized_(data) {
  if (!TOKEN) return true;
  return !!data && data.token === TOKEN;
}

function doGet() {
  return json_({ ok: true, stocks: readStocks_(), featured: readFeatured_() });
}

function doPost(e) {
  let data = {};
  try {
    data = JSON.parse(e.postData.contents || '{}');
  } catch (err) {
    return json_({ ok: false, error: 'parse' });
  }

  const action = data.action || 'order';

  if (action === 'setStock') {
    if (!authorized_(data)) return json_({ ok: false, error: 'forbidden' });
    if (data.productId == null) return json_({ ok: false, error: 'productId' });
    writeStock_(data.productId, data.value);
    return json_({ ok: true, stocks: readStocks_(), featured: readFeatured_() });
  }

  if (action === 'removeStock') {
    if (!authorized_(data)) return json_({ ok: false, error: 'forbidden' });
    if (data.productId == null) return json_({ ok: false, error: 'productId' });
    deleteStock_(data.productId);
    return json_({ ok: true, stocks: readStocks_(), featured: readFeatured_() });
  }

  if (action === 'setFeatured') {
    if (!authorized_(data)) return json_({ ok: false, error: 'forbidden' });
    writeFeatured_(data.ids);
    return json_({ ok: true, stocks: readStocks_(), featured: readFeatured_() });
  }

  if (action === 'order') {
    const sheet = getPesananSheet_();
    const items = Array.isArray(data.items) ? data.items : [];
    const totalQty = items.reduce((s, it) => s + (Number(it.qty) || 0), 0);
    const lines = items
      .map(function (it) {
        var name = it.name || it.productId || '';
        var variant = it.variant ? ' (' + it.variant + ')' : '';
        var price = it.price != null ? ' @ ' + it.price : ' (harga on request)';
        return (it.qty || 0) + 'x ' + name + variant + price;
      })
      .join('\n');

    sheet.appendRow([
      data.createdAt || new Date(),
      data.id || '',
      data.name || '',
      data.notes || '',
      lines,
      totalQty,
      Number(data.subtotal) || 0,
    ]);

    items.forEach(function (it) {
      if (it.productId != null) decrementStock_(String(it.productId), Number(it.qty) || 0);
    });

    return json_({ ok: true, stocks: readStocks_() });
  }

  return json_({ ok: false, error: 'unknown-action' });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
