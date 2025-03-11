# KARTA CUP V

Aplikasi manajemen turnamen sepak bola berbasis web.

## Teknologi yang Digunakan

- React
- TypeScript
- Vite
- Firebase
- Tailwind CSS

## Cara Menjalankan Aplikasi Secara Lokal

1. Clone repositori ini
2. Install dependensi dengan menjalankan `npm install`
3. Jalankan aplikasi dengan `npm run dev`
4. Buka browser dan akses `http://localhost:5173`

## Deployment ke Vercel

### Cara Otomatis (Direkomendasikan)

1. Buat akun di [Vercel](https://vercel.com) jika belum memiliki
2. Hubungkan repositori GitHub Anda dengan Vercel
3. Pilih repositori ini dan klik "Import"
4. Vercel akan otomatis mendeteksi konfigurasi Vite dan melakukan deployment
5. Setelah proses build selesai, aplikasi Anda akan tersedia di URL yang disediakan oleh Vercel

### Cara Manual

1. Install Vercel CLI: `npm i -g vercel`
2. Login ke Vercel: `vercel login`
3. Deploy aplikasi: `vercel`
4. Ikuti petunjuk yang muncul di terminal

## Konfigurasi Tambahan

File `vercel.json` sudah dikonfigurasi untuk menangani routing di aplikasi React single-page. Ini memastikan bahwa semua rute akan diarahkan ke `index.html` sehingga React Router dapat menangani navigasi dengan benar.
