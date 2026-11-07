# ArenaS – Sports Arena Booking & Management Platform

A full-stack sports arena booking and tournament management solution featuring a Web Portal, Mobile Application, and a RESTful Backend API.

## 📁 Repository Structure

```text
ArenaS/
├── BE/                 # Backend REST API (Node.js, Express, MongoDB/MySQL, TypeScript)
├── FE/                 # Web Application / Dashboard (React 18, Vite, TypeScript, TailwindCSS)
├── mobile/             # Mobile App for Users (React Native, Expo, Redux Toolkit, TailwindCSS)
└── README.md           # Project Documentation
```

## 🚀 Quick Start Guide

### 1. Backend (BE)
```bash
cd BE
npm install
cp .env.example .env    # Configure your DB and environment variables
npm run dev
```

### 2. Frontend Web (FE)
```bash
cd FE
npm install
npm run dev
```

### 3. Mobile App (mobile)
```bash
cd mobile
npm install
npx expo start
```
   npm install
   ```

2. **Cấu hình environment:**
   ```bash
   cp .env.example .env
   # Chỉnh sửa các giá trị trong .env
   ```

3. **Chạy server dev:**
   ```bash
   npm run dev
   ```

4. **Build production:**
   ```bash
   npm run build
   npm start
   ```

### Frontend Setup

1. **Cài đặt dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Cấu hình environment:**
   ```bash
   cp .env.example .env
   # Cấu hình API_URL
   ```

3. **Chạy dev server:**
   ```bash
   npm run dev
   ```

4. **Build production:**
   ```bash
   npm run build
   ```

## 🛠 Tech Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB + Mongoose
- **Authentication:** JWT + bcrypt
- **Validation:** express-validator
- **Security:** Helmet, CORS

### Frontend
- **Library:** React 18
- **Language:** TypeScript
- **Build Tool:** Vite
- **Styling:** TailwindCSS
- **HTTP Client:** Axios
- **Routing:** React Router v6
- **State Management:** Zustand (optional)

## 📚 Kiến trúc Backend (MVC)

### Models
- MongoDB schemas để định nghĩa structure dữ liệu
- Validation rules
- Relationships giữa collections

### Controllers
- Xử lý business logic
- Validate request data
- Gọi Model để thao tác database
- Return response

### Routes
- Định nghĩa API endpoints
- Gắn controller methods
- Apply middleware

### Middleware
- Authentication
- Error handling
- Logging
- CORS

## 📚 Cấu trúc Frontend

### Pages
- HomePage: Danh sách items
- CreatePage: Tạo item mới
- Chi tiết pages cho từng chức năng

### Components
- Layout: Header, Footer, Main container
- Button: Reusable button component
- FormField: Input field component
- Các components nhỏ khác

### Services
- **axios.ts:** Cấu hình axios instance với interceptors
- **exampleService.ts:** API service calls
- Mỗi chức năng có file service riêng

### Types
- TypeScript interfaces cho dữ liệu
- Props interfaces cho components
- API response types

### Hooks
- Custom React hooks (useAsync, v.v.)
- Logic tái sử dụng

## 🔐 Security

### Backend
- JWT authentication
- Password hashing với bcrypt
- Environment variables cho secrets
- CORS configuration
- Helmet for HTTP headers

### Frontend
- Token được lưu ở localStorage
- Axios interceptor tự động attach token
- Auto logout khi token expired (401)
- TypeScript type safety

## 📝 API Endpoints (Example)

```
GET    /api/v1/examples        - Lấy tất cả examples
GET    /api/v1/examples/:id    - Lấy 1 example
POST   /api/v1/examples        - Tạo example mới
PUT    /api/v1/examples/:id    - Cập nhật example
DELETE /api/v1/examples/:id    - Xóa example
```

## 🔄 Data Flow

1. Frontend gọi API thông qua axios service
2. Request đi qua axios interceptor (thêm token)
3. Backend nhận request tại route
4. Route gọi controller method
5. Controller gọi Model để thao tác database
6. Response được trả về qua middleware
7. Frontend nhận response và update UI

## ⚙️ Environment Variables

### Backend (.env)
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/arena
JWT_SECRET=your_secret_key
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api/v1
```

## 🎯 Lưu ý quan trọng

- ✅ Entire codebase là TypeScript
- ✅ .env và node_modules trong .gitignore
- ✅ Axios file để call API tập trung
- ✅ Folder structure rõ ràng theo chức năng
- ✅ Error handling ở cả FE và BE
- ✅ Responsive design với TailwindCSS

## 📦 Git Workflow

```bash
# Clone repository
git clone <repo-url>
cd ArenaS

# Backend
cd backend
npm install
cp .env.example .env
npm run dev

# Frontend (new terminal)
cd frontend
npm install
cp .env.example .env
npm run dev
```

## 🤝 Contribution

1. Tạo branch mới cho feature
2. Commit với message rõ ràng
3. Push lên repository
4. Tạo Pull Request

---

**Happy Coding! 🎉**
