# Final Project — E2E Automation Testing Agoda

**Nama: Fachri Alviansyah**

## 1. Deskripsi Project

Automation testing End-to-End untuk alur pemesanan tiket pesawat di [Agoda](https://www.agoda.com/). Alurnya mulai dari pencarian penerbangan sampai halaman pemilihan pembayaran. Project ini dibangun dengan Cypress + JavaScript dan menerapkan Page Object Model (POM). **Test tidak melakukan pembayaran**: alur berhenti di halaman `Payment information`.

## 2. Tujuan Pengujian

- Memastikan pencarian penerbangan one-way Jakarta (CGK) → Singapore (SIN) untuk besok berjalan.
- Memastikan penerbangan Malaysia Airlines dengan departure time paling awal dipilih berdasarkan data aktual di halaman.
- Memastikan data penumpang, total harga, dan detail penerbangan konsisten dari halaman hasil pencarian → Passenger Details → Payment.

## 3. Skenario E2E

| Step | Aksi | Validasi |
|---|---|---|
| 1 | Buka Agoda dari `AGODA_BASE_URL`, buka tab **Flights** | Judul halaman memuat "Agoda", form flight tampil |
| 2 | One-way, CGK → SIN, tanggal = hari ini + 1, 1 penumpang, Search | URL hasil memuat `departureFrom`, `arrivalTo`, `departDate`, `adults`, `searchType=1`; kartu hasil tampil |
| 3 | Filter Malaysia Airlines, muat semua halaman hasil, bandingkan semua departure time | Maskapai, bandara, dan tanggal penerbangan terpilih sesuai |
| 4 | Isi kontak + penumpang dari `cypress/fixtures/passenger.json`, pilih "No" untuk trip protection, simpan total ringkasan | Setiap field berisi nilai fixture |
| 5 | Lanjut ke Payment (menolak modal upsell jika muncul) | Total & mata uang sama dengan ringkasan sebelumnya |
| 6 | Baca ringkasan kontak & penumpang | Nama, email, telepon, jumlah penumpang, paspor sesuai |
| 7 | Baca ringkasan penerbangan | Maskapai, bandara asal/tujuan, tanggal, departure time, arrival time (+ offset hari) sesuai |
| 8 | Berhenti | Masih di `/packages/payment`, tombol Pay tidak diklik |

**Aturan pemilihan penerbangan:**
- Semua hasil dimuat dulu lewat infinite scroll. Test menunggu respons API pencarian sampai `lastPage`.
- Hanya kartu dengan nama maskapai persis `Malaysia Airlines` yang dihitung. Itinerary campuran maskapai tidak ikut.
- Penerbangan dengan departure time paling awal dipilih. Jika ada beberapa yang seri, tie-breaker-nya berurutan: harga termurah, lalu durasi terpendek, lalu urutan tampil.
- Jika tidak ada penerbangan Malaysia Airlines, test gagal dengan pesan `Malaysia Airlines flights found in search results: expected [] not to be empty`.

## 4. Teknologi

| Tool | Versi |
|---|---|
| Node.js | 24.x |
| Cypress | 16.2.0 |
| dotenv | 18.0.8 |
| cypress-mochawesome-reporter | 5.0.0 (Mochawesome) |

## 5. Struktur Folder

```text
1. Agoda/
├── cypress/
│   ├── e2e/
│   │   └── flight-booking.cy.js        # skenario bisnis + assertion
│   ├── pages/                          # Page Object Model
│   │   ├── HomePage.js
│   │   ├── FlightSearchPage.js
│   │   ├── FlightResultsPage.js
│   │   ├── PassengerDetailsPage.js
│   │   └── PaymentPage.js
│   ├── fixtures/
│   │   └── passenger.json              # data penumpang dummy
│   ├── support/
│   │   ├── commands.js                 # cy.selectListboxOption, cy.verifyListboxValue, cy.readSummaryTotal
│   │   ├── e2e.js
│   │   └── utils/
│   │       ├── helpers.js              # tanggal besok, parsing waktu/harga, pemilihan penerbangan
│   │       └── helpers.check.js        # self-check helper (node)
│   ├── reports/                        # HTML report (hasil run)
│   └── videos/                         # video Cypress (hasil run)
├── scripts/
│   └── verify-artifacts.js             # cek video + report + status test
├── .env / .env.example
├── .gitignore
├── cypress.config.js
├── package.json
└── README.md
```

## 6. Implementasi Page Object Model

| Page Object | Tanggung jawab |
|---|---|
| `HomePage` | Membuka Agoda, navigasi ke tab Flights |
| `FlightSearchPage` | One-way, asal/tujuan (autocomplete), tanggal kalender, verifikasi jumlah penumpang, Search |
| `FlightResultsPage` | Intercept & tunggu API pencarian, filter maskapai, load semua hasil, baca data kartu, pilih penerbangan paling awal, klik Select |
| `PassengerDetailsPage` | Isi & verifikasi form kontak/penumpang, tolak trip protection, baca total ringkasan, lanjut ke payment |
| `PaymentPage` | Baca total, kontak, penumpang, rute & waktu; pastikan berhenti sebelum bayar |

Spec `flight-booking.cy.js` hanya berisi alur bisnis dan assertion. Semua locator ada di page object.

Selector dipilih setelah memeriksa DOM Agoda yang asli. Yang dipakai hanya atribut stabil: `data-testid`, `data-element-name`, `data-component`, `data-selenium`, dan `td[data-day]` di kalender. Class CSS dinamis tidak dipakai.

## 7. Environment Variables

`cypress.config.js` memuat `.env` dengan `dotenv`. Sebelum test jalan, config memvalidasi semua variabel wajib; jika ada yang kosong, run langsung gagal dengan pesan yang jelas. Nilainya diteruskan ke test lewat `expose` dan dibaca dengan `Cypress.expose('NAMA')`. Ini karena `Cypress.env()` sudah dihapus di Cypress 16.

```dotenv
AGODA_BASE_URL=https://www.agoda.com/
DEPARTURE_CITY=Jakarta
DEPARTURE_AIRPORT=CGK
DESTINATION_CITY=Singapore
DESTINATION_AIRPORT=SIN
PASSENGER_COUNT=1
AIRLINE_NAME=Malaysia Airlines
```

`.env` ada di `.gitignore`, dan `.env.example` disediakan sebagai template. Tidak ada password atau data pembayaran yang disimpan.

## 8. Instalasi

```bash
npm install
npx cypress verify
cp .env.example .env
```

## 9. Menjalankan Test

```bash
npm run cy:run          # headless Chrome: video + HTML report
npm run cy:open         # mode interaktif (tanpa video)
npm run test:helpers    # self-check helper tanggal/waktu/harga
```

`npx cypress run` juga bisa dipakai dan menghasilkan artefak yang sama.

## 10. Video Cypress

`video: true` di `cypress.config.js`. Setiap `cypress run` merekam video ke `cypress/videos/flight-booking.cy.js.mp4`. Video juga disalin ke `cypress/reports/videos/` dan ditautkan di HTML report.

## 11. HTML Report

Reporter `cypress-mochawesome-reporter` otomatis membuat report di akhir `cypress run`. Report berisi nama suite/test, status, durasi, detail error, screenshot saat gagal, video, dan konteks test: kandidat penerbangan, penerbangan terpilih, dan total harga expected/actual.

```bash
npm run cy:report       # rebuild HTML dari JSON hasil run terakhir
npm run cy:verify       # cek video + report ada dan test lulus (exit code 1 jika tidak)
```

## 12. Lokasi Artefak

| Artefak | Lokasi |
|---|---|
| Video | `cypress/videos/flight-booking.cy.js.mp4` |
| HTML report | `cypress/reports/index.html` |
| JSON hasil | `cypress/reports/.jsons/mochawesome.json`, `cypress/reports/index.json` |
| Screenshot (saat gagal) | `cypress/screenshots/` |

## 13. Ringkasan Hasil Eksekusi Aktual

Run terakhir: 16 Oct 2026, `npm run cy:run`, Chrome 155 headless, Windows 11.

| Item | Hasil |
|---|---|
| Status | **1 test, 1 passed, 0 failed** (≈40 detik) |
| Tanggal keberangkatan | 17 Oct 2026 (hari ini + 1) |
| Kandidat Malaysia Airlines | 6 penerbangan (departure 09:10 ×4, 12:15 ×2) |
| Penerbangan terpilih | 09:10 CGK → 14:40 SIN, 1 transit (1h 0m di KUL), 4h 30m |
| Total harga | Rp 2,657,937 (IDR) di Passenger Details = Rp 2,657,937 di Payment |
| Penumpang | Budi Santoso, paspor C1234567, kontak cocok |
| Video | Ada (±11 MB) |
| HTML report | Ada |

Hasil ini bergantung pada jadwal dan harga Agoda saat test dijalankan, jadi angkanya bisa berbeda di run berikutnya.

## 14. Known Issues & Troubleshooting

- **Filter maskapai Agoda tidak eksklusif.** Checkbox airline hanya mengirim `carrier.preferred` ke API, jadi hasil tetap berisi maskapai lain. Karena itu test juga menyaring kartu berdasarkan nama maskapai yang tampil.
- **Zona waktu.** Agoda menampilkan waktu lokal masing-masing bandara (CGK UTC+7, SIN UTC+8), baik di hasil pencarian maupun di halaman Payment. Test membandingkan waktu lokal yang sama dengan waktu lokal yang sama, tanpa konversi, termasuk penanda `+1` hari.
- **Tanggal "besok"** dihitung dari jam lokal mesin yang menjalankan test. Kalender Agoda menampilkan dua bulan, sehingga pergantian bulan/tahun tetap tertangani.
- **Modal upsell** "Upgrade your support level" muncul setelah Continue dan ditolak otomatis ("No, thanks"). Banner cookie/pop-up lain tidak muncul di agoda.com dari Indonesia saat pengujian, jadi tidak ada handler untuk selector yang belum terverifikasi.
- **Jumlah penumpang.** Default Agoda sudah 1 penumpang (Economy). Test memverifikasinya tetapi belum mengubah jumlah penumpang. Jika `PASSENGER_COUNT` diubah, test gagal di verifikasi ini; kontrol +/- perlu ditambahkan.
- **Info transit** tidak ditampilkan di ringkasan halaman Payment, jadi hanya dicatat dari halaman hasil pencarian (lihat konteks di report).
- **Paspor kedaluwarsa.** Data paspor dummy berlaku sampai Dec 2031. Perbarui fixture setelah tanggal itu.
- **Mata uang** mengikuti lokasi (IDR dari Indonesia). Assertion membandingkan kode mata uang dan nominal, bukan format tampilan.
- **Bot protection / CAPTCHA** tidak muncul selama pengujian. Jika muncul, test akan gagal karena elemen tidak ditemukan. Jangan di-bypass; jalankan ulang atau verifikasi manual di browser.
- `uncaught:exception` dari script pihak ketiga Agoda (analytics/ads) diabaikan di `cypress/support/e2e.js`. Assertion test tetap berlaku.
