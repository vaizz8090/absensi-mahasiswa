// script.js (fixed) -------------------------------------------------------
// LocalStorage key
const LS_KEY = "absensi_mahasiswa_v4";

// DOM elements (match dengan HTML terbaru)
const tableBody = document.getElementById("absenBody");
const form = document.getElementById("absenForm");
const formSection = document.getElementById("formSection");
const addBtn = document.getElementById("addBtn");
const cancelBtn = document.getElementById("cancelBtn");
const totalSpan = document.getElementById("totalMahasiswa");
const searchInput = document.getElementById("searchInput");
const clearAllBtn = document.getElementById("clearAll");
const exportCsvBtn = document.getElementById("exportCsv");

// safe checks
if (!tableBody || !form || !addBtn || !formSection) {
  console.error("Element penting tidak ditemukan. Periksa id pada HTML.");
}

// helper load/save
function loadData() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch (err) {
    console.warn("LocalStorage parse error, resetting key:", err);
    localStorage.removeItem(LS_KEY);
    return [];
  }
}
function saveData(data) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

// render table with mapping original indexes — so delete works while filtered
// filter: string (nama/nim). animate: boolean to animate rows
function renderTable(filter = "", animate = true) {
  const data = loadData();
  // build array of { item, idx } to preserve original index for delete
  const mapped = data.map((item, i) => ({ item, idx: i }));
  const filtered = mapped.filter(({ item }) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (item.nama || "").toLowerCase().includes(q) || (item.nim || "").toLowerCase().includes(q);
  });

  // update total (always total of full dataset)
  totalSpan.textContent = data.length;

  if (filtered.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#888;">Tidak ada data</td></tr>`;
    return;
  }

  // create rows
  tableBody.innerHTML = "";
  filtered.forEach(({ item, idx }, i) => {
    const tr = document.createElement("tr");
    // Put data-index attribute as original index
    tr.setAttribute("data-idx", idx);
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${escapeHtml(item.nama)}</td>
      <td>${escapeHtml(item.nim)}</td>
      <td>${escapeHtml(item.alasan)}</td>
      <td>${new Date(item.waktu).toLocaleString()}</td>
      <td><button class="btn-danger btn-delete" data-idx="${idx}">Hapus</button></td>
    `;
    // initial animation style
    if (animate) {
      tr.style.opacity = "0";
      tr.style.transform = "translateY(-8px)";
      tr.style.transition = "transform 260ms ease, opacity 260ms ease";
    }
    tableBody.appendChild(tr);
    // trigger animation
    if (animate) {
      // small timeout to allow browser paint
      requestAnimationFrame(() => {
        tr.style.opacity = "1";
        tr.style.transform = "translateY(0)";
      });
    }
  });

  // attach delete listeners (delegation also possible)
  attachDeleteHandlers();
}

// small escape for HTML output
function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// attach delete handlers to current .btn-delete elements
function attachDeleteHandlers() {
  document.querySelectorAll(".btn-delete").forEach(btn => {
    btn.removeEventListener("click", deleteClickHandler); // safe remove
    btn.addEventListener("click", deleteClickHandler);
  });
}
function deleteClickHandler(e) {
  const idx = Number(e.currentTarget.getAttribute("data-idx"));
  if (Number.isNaN(idx)) return;
  if (!confirm("Hapus data ini?")) return;
  const data = loadData();
  if (idx < 0 || idx >= data.length) {
    alert("Index data tidak valid.");
    renderTable(searchInput.value || "");
    return;
  }
  data.splice(idx, 1);
  saveData(data);
  // re-render with same filter so UI doesn't jump unexpectedly
  renderTable(searchInput.value || "");
}

// form submit -> add new
form.addEventListener("submit", (ev) => {
  ev.preventDefault();
  const namaEl = document.getElementById("nama");
  const nimEl = document.getElementById("nim");
  const alasanEl = document.getElementById("alasan");
  const nama = (namaEl && namaEl.value || "").trim();
  const nim = (nimEl && nimEl.value || "").trim();
  const alasan = (alasanEl && alasanEl.value || "").trim();

  if (!nama || !nim || !alasan) {
    alert("Semua kolom wajib diisi!");
    return;
  }

  const data = loadData();
  data.push({ nama, nim, alasan, waktu: new Date().toISOString() });
  saveData(data);
  form.reset();
  // close form
  toggleForm(false);
  // render and animate newly inserted row
  renderTable(searchInput.value || "", true);
});

// toggle form visibility and change addBtn icon
function toggleForm(show) {
  if (show) {
    formSection.classList.add("show");
    addBtn.textContent = "×";
    // focus first input after a frame
    setTimeout(() => {
      const nama = document.getElementById("nama");
      if (nama) nama.focus();
    }, 200);
  } else {
    formSection.classList.remove("show");
    addBtn.textContent = "+";
  }
}

// add button / cancel
addBtn.addEventListener("click", () => {
  const isShown = formSection.classList.contains("show");
  toggleForm(!isShown);
});
if (cancelBtn) {
  cancelBtn.addEventListener("click", () => {
    form.reset();
    toggleForm(false);
  });
}

// search live
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    renderTable(e.target.value || "");
  });
}

// clear all
if (clearAllBtn) {
  clearAllBtn.addEventListener("click", () => {
    if (!confirm("Yakin ingin menghapus semua data?")) return;
    localStorage.removeItem(LS_KEY);
    renderTable(searchInput.value || "");
  });
}

// export CSV (handles commas/quotes)
if (exportCsvBtn) {
  exportCsvBtn.addEventListener("click", () => {
    const data = loadData();
    if (!data.length) {
      alert("Tidak ada data untuk diexport!");
      return;
    }
    const header = ["No","Nama","NIM","Alasan","Waktu"];
    const rows = data.map((d, i) => [
      i+1,
      csvEscape(d.nama),
      csvEscape(d.nim),
      csvEscape(d.alasan),
      csvEscape(new Date(d.waktu).toLocaleString())
    ]);
    const csvContent = [header, ...rows].map(r => r.join(",")).join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "absensi_mahasiswa.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

function csvEscape(value) {
  if (value == null) return '""';
  const s = String(value).replace(/"/g, '""');
  return `"${s}"`;
}

// initial render
renderTable();
