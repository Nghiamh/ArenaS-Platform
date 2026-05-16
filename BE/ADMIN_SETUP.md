# 🔐 Admin Account Setup Guide

## ✅ Tôi đã tạo 2 cách để setup tài khoản admin

### **Cách 1: Sử dụng Seed Script (Recommended)**

#### Step 1: Chạy seed script
```bash
cd BE
npm run seed:admin
```

#### Step 2: Xác nhận kết quả
Bạn sẽ thấy output:
```
✅ Connected to MongoDB
✅ Admin account created successfully!
   ID: 66123456789abcdef0123456
   Email: admin@arena.com
   Username: admin
   Role: admin

🔐 Login Credentials:
   Username: admin
   Password: admin
```

---

### **Cách 2: Sử dụng API Endpoint**

#### Step 1: Thêm ADMIN_SECRET_KEY vào `.env`
```bash
# BE/.env
ADMIN_SECRET_KEY=your_super_secret_key_here
```

#### Step 2: Gọi API với Postman/cURL
```bash
curl -X POST http://localhost:5000/api/auth/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "admin",
    "password": "admin",
    "email": "admin@arena.com",
    "name": "Admin User",
    "adminSecret": "your_super_secret_key_here"
  }'
```

#### Step 3: Response thành công
```json
{
  "message": "Admin account created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "redirectPath": "/admin/dashboard",
  "user": {
    "id": "66123456789abcdef0123456",
    "name": "Admin User",
    "email": "admin@arena.com",
    "userName": "admin",
    "role": "admin"
  }
}
```

---

## 🚀 Login vào Admin Dashboard

### Frontend
1. Mở `http://localhost:5173/login` hoặc login page
2. Nhập credentials:
   - **Username:** admin
   - **Password:** admin
3. Hệ thống sẽ redirect `/admin/dashboard`

### Backend
- Token JWT sẽ được cấp sau khi login
- Token có thể được dùng để gọi protected API endpoints

---

## ⚠️ Lưu ý quan trọng

### Đối với Seed Script:
- ✅ Đơn giản, chỉ cần chạy 1 lệnh
- ✅ Không cần ADMIN_SECRET_KEY
- ⚠️ Sẽ không tạo admin nếu đã tồn tại một admin khác

### Đối với API Endpoint:
- ✅ Linh hoạt, có thể tạo admin bất kỳ lúc nào
- ✅ Bảo vệ bằng ADMIN_SECRET_KEY
- ⚠️ Yêu cầu phải set `ADMIN_SECRET_KEY` trong `.env`
- ⚠️ Không thể tạo nhiều admin, phải xóa admin cũ trước

---

## 📁 File được tạo/sửa

### Tệp tạo mới:
- `BE/src/seeds/createAdminSeed.ts` - Seed script

### Tệp đã sửa:
- `BE/src/controllers/authController.ts` - Thêm `createAdmin` function
- `BE/src/routes/authRoutes.ts` - Thêm route POST `/api/auth/create-admin`
- `BE/package.json` - Thêm script `npm run seed:admin`

---

## 🎯 Bước tiếp theo

1. **Tạo admin ngay:**
   ```bash
   cd BE && npm run seed:admin
   ```

2. **Hoặc nếu muốn dùng endpoint:**
   - Thêm `ADMIN_SECRET_KEY=secret123` vào `BE/.env`
   - Gọi API `/api/auth/create-admin`

3. **Login vào Frontend:**
   - Username: `admin`
   - Password: `admin`

---

**Chúc bạn thành công!** 🎉
