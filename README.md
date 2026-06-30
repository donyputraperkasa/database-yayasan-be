npm install @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
npm install class-validator class-transformer
npm install @prisma/client
npm install -D prisma @types/bcrypt @types/passport-jwt

npx nest g module auth
npx nest g controller auth --no-spec
npx nest g service auth --no-spec

npx nest g module users
npx nest g controller users --no-spec
npx nest g service users --no-spec

npx nest g module schools
npx nest g controller schools --no-spec
npx nest g service schools --no-spec

npx nest g module dashboard
npx nest g controller dashboard --no-spec
npx nest g service dashboard --no-spec

npx nest g module school-profile
npx nest g controller school-profile --no-spec
npx nest g service school-profile --no-spec

npx nest g module staffs
npx nest g controller staffs --no-spec
npx nest g service staffs --no-spec

npx nest g module students
npx nest g controller students --no-spec
npx nest g service students --no-spec

npx nest g module assets
npx nest g controller assets --no-spec
npx nest g service assets --no-spec

npx nest g module facilities
npx nest g controller facilities --no-spec
npx nest g service facilities --no-spec

npx nest g module finances
npx nest g controller finances --no-spec
npx nest g service finances --no-spec

npx nest g module documents
npx nest g controller documents --no-spec
npx nest g service documents --no-spec

npx nest g module contacts
npx nest g controller contacts --no-spec
npx nest g service contacts --no-spec

================================================

mkdir -p src/common/enums
mkdir -p src/common/decorators
mkdir -p src/common/guards
mkdir -p src/common/types
mkdir -p src/common/dto
mkdir -p src/prisma

================================================

touch src/common/enums/role.enum.ts
touch src/common/decorators/roles.decorator.ts
touch src/common/guards/roles.guard.ts
touch src/common/guards/jwt-auth.guard.ts
touch src/common/types/auth-user.type.ts

================================================

mkdir -p src/auth/dto
mkdir -p src/users/dto
mkdir -p src/schools/dto
mkdir -p src/school-profile/dto
mkdir -p src/staffs/dto
mkdir -p src/students/dto
mkdir -p src/assets/dto
mkdir -p src/facilities/dto
mkdir -p src/finances/dto
mkdir -p src/documents/dto
mkdir -p src/contacts/dto

================================================

touch src/auth/dto/login.dto.ts

touch src/users/dto/create-user.dto.ts
touch src/users/dto/update-user.dto.ts

touch src/schools/dto/create-school.dto.ts
touch src/schools/dto/update-school.dto.ts

touch src/school-profile/dto/update-school-profile.dto.ts

touch src/staffs/dto/create-staff.dto.ts
touch src/staffs/dto/update-staff.dto.ts

touch src/students/dto/create-student.dto.ts
touch src/students/dto/update-student.dto.ts

touch src/assets/dto/create-asset.dto.ts
touch src/assets/dto/update-asset.dto.ts

touch src/facilities/dto/create-facility.dto.ts
touch src/facilities/dto/update-facility.dto.ts

touch src/finances/dto/create-finance.dto.ts
touch src/finances/dto/update-finance.dto.ts

touch src/documents/dto/create-document.dto.ts

touch src/contacts/dto/create-contact.dto.ts

touch src/prisma/prisma.service.ts
touch src/prisma/prisma.module.ts

npm install @nestjs/swagger swagger-ui-express
# Database Yayasan Backend

Backend API untuk Sistem Informasi Database Yayasan yang dibangun menggunakan **NestJS**, **Prisma ORM**, dan **PostgreSQL**. Aplikasi ini dirancang untuk membantu pengelolaan data sekolah di bawah yayasan dalam satu sistem yang terintegrasi.

---

## 🚀 Tech Stack

- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Passport
- Swagger API Documentation
- Class Validator
- Bcrypt

---

## 📦 Fitur

- 🔐 Authentication (JWT)
- 👤 Manajemen User
- 🏫 Manajemen Sekolah
- 📋 Profil Sekolah
- 👨‍🏫 Data Staff
- 🎓 Data Siswa
- 🪑 Data Sarana & Prasarana
- 💰 Data Keuangan
- 📁 Dokumen Sekolah
- 📞 Kontak Sekolah
- 📊 Dashboard Statistik

---

## 📂 Struktur Project

```text
src/
├── auth/
├── users/
├── schools/
├── school-profile/
├── staffs/
├── students/
├── assets/
├── facilities/
├── finances/
├── documents/
├── contacts/
├── dashboard/
├── common/
│   ├── decorators/
│   ├── dto/
│   ├── enums/
│   ├── guards/
│   └── types/
└── prisma/
```

---

## ⚙️ Instalasi

```bash
# Install dependency
npm install
```

---

## 📚 Package Tambahan

```bash
npm install @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
npm install class-validator class-transformer
npm install @prisma/client
npm install @nestjs/swagger swagger-ui-express
npm install -D prisma @types/bcrypt @types/passport-jwt
```

---

## ▶️ Menjalankan Project

```bash
# Development
npm run start:dev

# Production
npm run start:prod
```

---

## 🗄️ Prisma

```bash
# Generate Prisma Client
npx prisma generate

# Migration
npx prisma migrate dev

# Prisma Studio
npx prisma studio
```

---

## 📖 API Documentation

Setelah aplikasi berjalan:

```text
http://localhost:3000/api
```

---

## 🔐 Modul

| Modul | Deskripsi |
|--------|-----------|
| Auth | Login dan autentikasi JWT |
| Users | Manajemen pengguna |
| Schools | Data sekolah |
| School Profile | Profil sekolah |
| Staffs | Data tenaga pendidik & kependidikan |
| Students | Data peserta didik |
| Assets | Data aset |
| Facilities | Data fasilitas |
| Finances | Data keuangan |
| Documents | Arsip dokumen |
| Contacts | Informasi kontak |
| Dashboard | Ringkasan statistik |

---

## 👨‍💻 Author

**Dony Putra Perkasa**

Backend Developer • Mathematics Teacher# database-yayasan-be
