# Panduan Backend Faris

Dokumen ini merangkum service yang dikelola Faris supaya kerja Dhimas lebih mudah saat menghubungkan `auth`, `product`, dan `supplier` dengan alur `order -> payment -> logistics`.

## Scope Tanggung Jawab

- `backend/order` untuk pembuatan order, ambil detail order, dan update status order.
- `backend/payment` untuk pencatatan pembayaran, ambil pembayaran per order, dan update status payment.
- `backend/logistics` untuk pembuatan shipment, tracking resi, ambil shipment per order, dan update status pengiriman.
- `backend/gateway` sebagai API gateway dan orchestrator checkout end-to-end.

## Port Service

Gunakan port berikut agar konsisten di semua environment lokal:

- Gateway: `8000`
- Order: `8004`
- Payment: `8005`
- Logistics: `8006`

Kalau ingin override, masing-masing service membaca `PORT` dari `.env`.

## File Utama Tiap Service

Setiap service Faris mengikuti pola yang sama:

- `server.js` untuk bootstrap Express + koneksi database.
- `config/database.js` untuk konfigurasi Sequelize.
- `routes/*.js` untuk definisi endpoint.
- `controllers/*.js` untuk logic request/response.
- `models/*.js` untuk definisi tabel.

## Environment Variable Minimal

Semua service backend Faris memakai pola `.env` seperti ini:

```env
PORT=8004
DB_HOST=localhost
DB_PORT=3306
DB_NAME=wirpl_order_db
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_DIALECT=mysql
```

Sesuaikan nilai `PORT` dan `DB_NAME` per service.

Untuk gateway, tambahkan target service bila perlu:

```env
PORT=8000
AUTH_SERVICE_URL=http://localhost:8001
PRODUCT_SERVICE_URL=http://localhost:8002
SUPPLIER_SERVICE_URL=http://localhost:8003
ORDER_SERVICE_URL=http://localhost:8004
PAYMENT_SERVICE_URL=http://localhost:8005
LOGISTICS_SERVICE_URL=http://localhost:8006
```

## Cara Menjalankan Lokal

1. Masuk ke folder service.
2. Install dependency jika belum:

```bash
npm install
```

3. Jalankan service:

```bash
npm run dev
```

Atau:

```bash
npm start
```

4. Cek health endpoint:

- `GET /health` untuk `order`, `payment`, `logistics`, dan `gateway`.

## Kontrak Endpoint

### Order Service

Base URL lokal: `http://localhost:8004`

- `GET /` -> ambil semua order
- `GET /:id` -> ambil order berdasarkan ID
- `POST /` -> buat order baru
- `PATCH /:id/status` -> update status order

### Payment Service

Base URL lokal: `http://localhost:8005`

- `POST /` -> buat payment baru
- `GET /order/:orderId` -> ambil payment berdasarkan order
- `PATCH /:id/status` -> update status payment

### Logistics Service

Base URL lokal: `http://localhost:8006`

- `POST /` -> buat shipment baru
- `GET /track/:resi` -> tracking berdasarkan nomor resi
- `GET /order/:orderId` -> ambil shipment berdasarkan order
- `PATCH /:id/status` -> update status pengiriman

### Gateway

Base URL lokal: `http://localhost:8000`

- `GET /health` -> cek status gateway dan target service
- `POST /checkout` atau `POST /api/checkout` -> flow checkout full
- Proxy API:
  - `/api/auth`
  - `/api/products`
  - `/api/suppliers`
  - `/api/orders`
  - `/api/payments`
  - `/api/logistics`

## Alur Checkout End-to-End

Urutan yang dipakai gateway saat checkout:

1. Gateway menerima payload checkout dari frontend.
2. Gateway membuat order ke `order service`.
3. Gateway membuat payment ke `payment service`.
4. Gateway meng-update status order berdasarkan status payment.
5. Gateway membuat shipment ke `logistics service`.
6. Gateway mengembalikan hasil gabungan `order`, `payment`, dan `shipment`.

Payload minimal checkout yang aman dipakai:

```json
{
  "userId": 1,
  "items": [
    {
      "productId": 10,
      "name": "Product A",
      "price": 50000,
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "recipientName": "Faris",
    "phone": "08123456789",
    "address": "Jl. Contoh No. 1"
  },
  "paymentMethod": "bank_transfer",
  "paymentStatus": "paid",
  "courier": "WIRPL Express",
  "service": "regular"
}
```

## Checklist untuk Dhimas

Supaya integrasi ke frontend dan service lain tidak pecah, Dhimas cukup ikuti kontrak ini:

- Pastikan response endpoint punya field `data` dan `message` bila diperlukan.
- Pastikan semua service punya `GET /health`.
- Pastikan format ID yang dipakai konsisten antar service.
- Pastikan gateway tidak mengubah struktur payload tanpa alasan.
- Jika menambah field baru, update juga dokumen ini dan request frontend.

## Catatan Teknis

- Gateway memakai `fetch` bawaan Node.js, jadi aman dijalankan di Node.js 18+.
- Semua service Faris memakai Sequelize + MySQL saat ini.
- Jika database belum siap, service akan berhenti di tahap `sequelize.authenticate()`.
- CORS di gateway sudah diatur di `server.js`.

## Rekomendasi Untuk Kolaborasi

- Gunakan satu format status yang sama di seluruh flow: `waiting_payment`, `processing`, `shipped`, `delivered`, atau status lain yang disepakati.
- Jangan ganti path endpoint tanpa update gateway dan frontend.
- Bila Dhimas menambah field di order/product/supplier, beri contoh payload di README atau Postman collection.

## Ringkasan Cepat

- Faris pegang `order`, `payment`, `logistics`, dan `gateway`.
- Port lokal utama: `8000`, `8004`, `8005`, `8006`.
- Gateway jadi pintu masuk utama untuk checkout dan proxy ke service lain.
- Dokumen ini dipakai sebagai patokan supaya integrasi antar tim lebih rapi.
