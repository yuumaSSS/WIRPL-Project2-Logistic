# Panduan Backend Dhimas — Auth & Courier Service

Dokumen ini membantu Dhimas melanjutkan pengerjaan dua service:

- **Auth Service** — `backend/auth/` (port 8001)
- **Courier Service** — `backend/courier/` (port 8002)

---

## Kondisi Saat Ini

### Auth Service (`backend/auth/`)

| File | Status |
|---|---|
| `server.js` | ✅ Sudah ada |
| `config/database.js` | ✅ Sudah ada |
| `models/User.js` | ✅ Sudah ada |
| `routes/authRoutes.js` | ✅ Sudah ada |
| `middleware/verifyToken.js` | ✅ Sudah ada |
| `controllers/authController.js` | ❌ Masih TODO — perlu diisi |

### Courier Service (`backend/courier/`)

| File | Status |
|---|---|
| Seluruh folder `courier/` | ❌ Belum ada — perlu dibuat dari nol |

---

## Bagian 1 — Setup Database

### Buka MySQL

MySQL belum terdaftar di PATH Windows. Gunakan perintah berikut:

```bash
& "C:\Program Files\MySQL\MySQL Server 9.4\bin\mysql.exe" -u root -p
```

> Tips: supaya bisa langsung pakai `mysql`, tambahkan `C:\Program Files\MySQL\MySQL Server 9.4\bin` ke Environment Variables → PATH.

### Buat Database

```sql
CREATE DATABASE IF NOT EXISTS wirpl_auth_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS wirpl_courier_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

SHOW DATABASES;
```

### Buat Tabel `users` di `wirpl_auth_db`

```sql
USE wirpl_auth_db;

CREATE TABLE IF NOT EXISTS users (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(255)          NOT NULL,
  email     VARCHAR(255)          NOT NULL UNIQUE,
  password  VARCHAR(255)          NOT NULL,
  role      ENUM('admin','kurir') NOT NULL DEFAULT 'kurir',
  createdAt DATETIME              NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME              NOT NULL DEFAULT CURRENT_TIMESTAMP
            ON UPDATE CURRENT_TIMESTAMP
);
```

### Buat Tabel `fleets` dan `couriers` di `wirpl_courier_db`

> **Penting:** Buat tabel `fleets` dulu sebelum `couriers` karena ada relasi foreign key.

```sql
USE wirpl_courier_db;

CREATE TABLE IF NOT EXISTS fleets (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  plateNumber VARCHAR(20)                               NOT NULL UNIQUE,
  type        ENUM('motor','mobil','pickup','truk')     NOT NULL,
  status      ENUM('available','in_use','maintenance')  NOT NULL DEFAULT 'available',
  createdAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
              ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS couriers (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(255)                           NOT NULL,
  phone     VARCHAR(20)                            NOT NULL,
  vehicleId INT                                    NULL,
  status    ENUM('available','on_duty','inactive') NOT NULL DEFAULT 'available',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicleId) REFERENCES fleets(id) ON DELETE SET NULL
);
```

### Verifikasi

```sql
USE wirpl_auth_db;
SHOW TABLES;
DESCRIBE users;

USE wirpl_courier_db;
SHOW TABLES;
DESCRIBE fleets;
DESCRIBE couriers;

EXIT;
```

---

## Referensi Struktur Tabel

### Tabel `users` — wirpl_auth_db

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | INT AUTO_INCREMENT | Primary key |
| `name` | VARCHAR(255) | Nama lengkap |
| `email` | VARCHAR(255) UNIQUE | Email login |
| `password` | VARCHAR(255) | Hash bcrypt dari password asli |
| `role` | ENUM | `admin` atau `kurir` |
| `createdAt` | DATETIME | Dibuat otomatis |
| `updatedAt` | DATETIME | Update otomatis |

### Tabel `couriers` — wirpl_courier_db

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | INT AUTO_INCREMENT | Primary key |
| `name` | VARCHAR(255) | Nama kurir |
| `phone` | VARCHAR(20) | Nomor telepon |
| `vehicleId` | INT (FK → fleets.id) | Armada yang sedang dipakai, bisa null |
| `status` | ENUM | `available` / `on_duty` / `inactive` |

### Tabel `fleets` — wirpl_courier_db

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | INT AUTO_INCREMENT | Primary key |
| `plateNumber` | VARCHAR(20) UNIQUE | Nomor plat kendaraan |
| `type` | ENUM | `motor` / `mobil` / `pickup` / `truk` |
| `status` | ENUM | `available` / `in_use` / `maintenance` |

---

## Bagian 2 — Setup Auth Service (port 8001)

### Install Dependencies

```bash
cd backend/auth
npm install
```

Dependency yang sudah ada di `package.json`:

| Package | Kegunaan |
|---|---|
| `express` | Framework server |
| `sequelize` + `mysql2` | ORM dan driver MySQL |
| `jsonwebtoken` | Generate dan verifikasi JWT token |
| `bcrypt` | Hash password sebelum disimpan ke DB |
| `dotenv` | Baca variabel dari file `.env` |

### Buat File `.env`

Buat file `.env` di `backend/auth/`:

```env
PORT=8001
DB_HOST=localhost
DB_PORT=3306
DB_NAME=wirpl_auth_db
DB_USER=root
DB_PASSWORD=isi_password_mysql_kamu
JWT_SECRET=wirpl_secret_jwt_key_2024
```

> `JWT_SECRET` bisa diisi string apapun yang panjang. Pastikan nilainya sama di semua service yang butuh verifikasi token.

### Jalankan Server

```bash
npm run dev
```

Output yang diharapkan:

```
Auth DB connected
Auth service running on port 8001
```

### Yang Perlu Dikerjakan di `authController.js`

File `controllers/authController.js` sudah ada tapi isinya masih placeholder. Berikut logika yang perlu diimplementasi:

#### `register`

1. Ambil `name`, `email`, `password`, `role` dari `req.body`
2. Cek apakah email sudah terdaftar
3. Hash password dengan `bcrypt.hash(password, 10)`
4. Simpan user baru ke database
5. Return data user (tanpa password)

#### `login`

1. Ambil `email`, `password` dari `req.body`
2. Cari user berdasarkan email
3. Bandingkan password dengan `bcrypt.compare(password, user.password)`
4. Kalau cocok, generate JWT dengan `jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '1d' })`
5. Return token

#### `getProfile`

1. Ambil `req.user.id` dari hasil decode JWT (sudah diset oleh `verifyToken` middleware)
2. Cari user berdasarkan ID
3. Return data user (tanpa password)

---

## Bagian 3 — Setup Courier Service (port 8002)

Folder `backend/courier/` belum ada. Buat dari nol dengan langkah berikut:

### Buat Folder dan Init Project

```bash
mkdir backend/courier
cd backend/courier
npm init -y
```

### Install Dependencies

```bash
npm install express sequelize mysql2 dotenv
npm install nodemon --save-dev
```

### Update `package.json` — Tambahkan Scripts

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

### Buat File `.env`

```env
PORT=8002
DB_HOST=localhost
DB_PORT=3306
DB_NAME=wirpl_courier_db
DB_USER=root
DB_PASSWORD=isi_password_mysql_kamu
```

### File yang Perlu Dibuat

#### `config/database.js`

Sama persis dengan `auth/config/database.js`. Salin dan sesuaikan nama DB:

```js
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    logging: false,
  }
);

module.exports = sequelize;
```

#### `models/Fleet.js`

Model untuk tabel `fleets`.

Field: `id`, `plateNumber`, `type` (ENUM), `status` (ENUM)

#### `models/Courier.js`

Model untuk tabel `couriers`.

Field: `id`, `name`, `phone`, `vehicleId`, `status` (ENUM)

#### `controllers/courierController.js`

Implementasi CRUD: `getAll`, `getById`, `create`, `update`, `delete`

#### `controllers/fleetController.js`

Implementasi CRUD: `getAll`, `getById`, `create`, `update`, `delete`

#### `routes/courierRoutes.js`

```
GET    /couriers
GET    /couriers/:id
POST   /couriers
PUT    /couriers/:id
DELETE /couriers/:id
```

#### `routes/fleetRoutes.js`

```
GET    /fleets
GET    /fleets/:id
POST   /fleets
PUT    /fleets/:id
DELETE /fleets/:id
```

#### `server.js`

```js
require("dotenv").config();
const express = require("express");
const sequelize = require("./config/database");

const app = express();
const PORT = process.env.PORT || 8002;

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ service: "courier", status: "ok" });
});

app.use("/couriers", require("./routes/courierRoutes"));
app.use("/fleets", require("./routes/fleetRoutes"));

sequelize
  .sync()
  .then(() => {
    console.log("Courier DB connected");
    app.listen(PORT, () => console.log(`Courier service running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("DB connection error:", err);
    process.exit(1);
  });
```

---

## Bagian 4 — Referensi Endpoint Lengkap

### Auth Service — `http://localhost:8001`

| Method | URL | Auth | Deskripsi |
|---|---|---|---|
| `POST` | `/register` | Publik | Daftar user baru |
| `POST` | `/login` | Publik | Login, dapat JWT token |
| `GET` | `/profile` | Bearer Token | Lihat profil user yang login |

**Via Gateway:** `http://localhost:8000/auth/...`

#### POST `/register`

Request:
```json
{
  "name": "Budi Santoso",
  "email": "budi@wirpl.com",
  "password": "password123",
  "role": "kurir"
}
```

Response `201`:
```json
{
  "message": "User registered successfully",
  "data": { "id": 1, "name": "Budi Santoso", "email": "budi@wirpl.com", "role": "kurir" }
}
```

#### POST `/login`

Request:
```json
{
  "email": "budi@wirpl.com",
  "password": "password123"
}
```

Response `200`:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": 1, "name": "Budi Santoso", "role": "kurir" }
}
```

#### GET `/profile`

Header: `Authorization: Bearer <token>`

Response `200`:
```json
{
  "data": { "id": 1, "name": "Budi Santoso", "email": "budi@wirpl.com", "role": "kurir" }
}
```

---

### Courier Service — `http://localhost:8002`

| Method | URL | Deskripsi |
|---|---|---|
| `GET` | `/couriers` | Daftar semua kurir |
| `GET` | `/couriers/:id` | Detail kurir |
| `POST` | `/couriers` | Tambah kurir baru |
| `PUT` | `/couriers/:id` | Update data kurir |
| `DELETE` | `/couriers/:id` | Hapus kurir |
| `GET` | `/fleets` | Daftar semua armada |
| `GET` | `/fleets/:id` | Detail kendaraan |
| `POST` | `/fleets` | Tambah kendaraan baru |
| `PUT` | `/fleets/:id` | Update data kendaraan |
| `DELETE` | `/fleets/:id` | Hapus kendaraan |

#### POST `/fleets` — Tambah Armada

Request:
```json
{
  "plateNumber": "B 1234 ABC",
  "type": "motor",
  "status": "available"
}
```

#### POST `/couriers` — Tambah Kurir

Request:
```json
{
  "name": "Andi Kurir",
  "phone": "081234567890",
  "vehicleId": 1,
  "status": "available"
}
```

---

## Port Mapping Keseluruhan

| Service | Port | Status |
|---|---|---|
| API Gateway | 8000 | ✅ Sudah jalan |
| Auth (Dhimas) | 8001 | ⚠️ Controller perlu diisi |
| Courier (Dhimas) | 8002 | ❌ Folder belum ada |
| Logistics (Faris) | 8006 | ✅ Sudah selesai |

---

## Troubleshooting

| Masalah | Solusi |
|---|---|
| `ER_ACCESS_DENIED_ERROR` | Cek `DB_USER` dan `DB_PASSWORD` di `.env` |
| `ER_BAD_DB_ERROR` | Jalankan `CREATE DATABASE` di MySQL dulu |
| `No token provided` | Tambahkan header `Authorization: Bearer <token>` |
| `Invalid token` | Token expired atau `JWT_SECRET` berbeda saat sign dan verify |
| `Cannot find module 'jsonwebtoken'` | Jalankan `npm install` di folder `auth/` |
| Port sudah dipakai | Ubah `PORT` di `.env` ke port lain |
