# Backend API Documentation

## 📋 Mô tả

Backend API được xây dựng với Node.js, Express.js, MongoDB sử dụng mô hình MVC.

## 🎯 Cấu trúc MVC

### Models (`src/models/`)
- Định nghĩa MongoDB schemas
- Validation rules
- Instance methods và static methods

Ví dụ:
```typescript
// src/models/exampleModel.ts
interface IExample extends Document {
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const exampleSchema = new Schema<IExample>({
  title: { type: String, required: true },
  description: { type: String, required: true }
}, { timestamps: true });

const Example = mongoose.model<IExample>('Example', exampleSchema);
```

### Controllers (`src/controllers/`)
- Xử lý business logic
- Validate request data
- Call Model methods
- Return response

Ví dụ:
```typescript
// src/controllers/exampleController.ts
export const createExample = async (req, res, next) => {
  try {
    const example = new Example(req.body);
    await example.save();
    res.status(201).json({ success: true, data: example });
  } catch (error) {
    next(error);
  }
};
```

### Routes (`src/routes/`)
- Định nghĩa API endpoints
- Gắn controller methods
- Apply middleware

Ví dụ:
```typescript
// src/routes/exampleRoutes.ts
router.get('/', getAllExamples);
router.post('/', createExample);
router.put('/:id', updateExample);
router.delete('/:id', deleteExample);
```

## 🚀 Chạy Backend

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start
```

## 🔌 REST API Endpoints

### Examples CRUD
- `GET /api/v1/examples` - Lấy tất cả
- `GET /api/v1/examples/:id` - Lấy detail
- `POST /api/v1/examples` - Tạo mới
- `PUT /api/v1/examples/:id` - Cập nhật
- `DELETE /api/v1/examples/:id` - Xóa

## 📝 Request/Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed",
  "data": {}
}
```

### Error Response
```json
{
  "success": false,
  "status": "error",
  "message": "Error message"
}
```

## 🔒 Middleware

- **errorHandler:** Xử lý lỗi toàn bộ app
- **CORS:** Cho phép request từ frontend
- **Helmet:** Security headers
- **express.json():** Parse JSON body

## 📚 Thêm Feature Mới

1. Tạo Model trong `src/models/`
2. Tạo Controller trong `src/controllers/`
3. Tạo Routes trong `src/routes/`
4. Import routes trong `server.ts`

Ví dụ:
```typescript
import userRoutes from './routes/userRoutes';
app.use('/api/v1/users', userRoutes);
```

## ⚙️ Configuration

Chỉnh sửa file `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/arena
JWT_SECRET=your_secret_key
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Gmail API OAuth2
GMAIL_CLIENT_ID=your_google_oauth_client_id
GMAIL_CLIENT_SECRET=your_google_oauth_client_secret
GMAIL_REFRESH_TOKEN=your_google_oauth_refresh_token
GMAIL_SENDER_EMAIL=your_gmail_address@gmail.com
```

## 🔐 Authentication Endpoints

- `POST /api/auth/forgot-password`
  - Body: `{ "email": "user@example.com" }`
  - Response: thông báo đã gửi email nếu email tồn tại

- `POST /api/auth/reset-password`
  - Body: `{ "token": "reset_token_from_email", "password": "new_password" }`
  - Response: đặt lại mật khẩu thành công

## 🛡 Rate Limit (Forgot/Reset Password)

- `POST /api/auth/forgot-password`: tối đa 5 request / 15 phút / IP
- `POST /api/auth/reset-password`: tối đa 10 request / 15 phút / IP

## 📄 Env Example Files

- File mẫu backend: `BE/.env.example`
- File mẫu frontend: `FE/.env.example`

## 🛠 Debugging

- Kiểm tra logs trong console
- Check MongoDB connection
- Verify environment variables
- Test API bằng Postman/curl

---

[Back to Main README](../README.md)
