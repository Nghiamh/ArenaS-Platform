# Frontend Application Documentation

## 📋 Mô tả

Frontend được xây dựng với React, TypeScript, TailwindCSS sử dụng Vite build tool.

## 🎯 Cấu trúc thư mục

### Pages (`src/pages/`)
- HomePage: Danh sách items
- CreatePage: Form tạo mới
- Mỗi chức năng một page riêng

### Components (`src/components/`)
- Layout: Header, Footer, Layout container
- Button: Reusable button component
- FormField: Input field component
- Các component nhỏ khác

### Services (`src/services/`)
- **axios.ts:** Cấu hình Axios với interceptors
- **exampleService.ts:** API service
- Mỗi feature một file service

### Types (`src/types/`)
- Định nghĩa TypeScript interfaces
- Props types
- API response types

### Hooks (`src/hooks/`)
- Custom React hooks
- useAsync: Hook cho async operations

### Utils (`src/utils/`)
- Helper functions
- Formatters
- Constants

### Styles (`src/styles/`)
- Global CSS
- TailwindCSS imports

## 🚀 Chạy Frontend

```bash
# Development
npm run dev

# Build
npm run build

# Preview production build
npm run preview
```

## 📡 Axios Configuration

File: `src/services/axios.ts`

```typescript
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  timeout: 10000
});

// Request interceptor - thêm token
axiosInstance.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - xử lý lỗi
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
```

## 🔌 API Service Pattern

```typescript
// src/services/exampleService.ts
import axiosInstance from './axios';

export const exampleService = {
  getAll: async () => {
    const response = await axiosInstance.get('/examples');
    return response.data.data;
  },
  
  create: async (data) => {
    const response = await axiosInstance.post('/examples', data);
    return response.data.data;
  },
  
  update: async (id, data) => {
    const response = await axiosInstance.put(`/examples/${id}`, data);
    return response.data.data;
  },
  
  delete: async (id) => {
    await axiosInstance.delete(`/examples/${id}`);
  }
};
```

## 🎨 TailwindCSS Styling

File: `tailwind.config.js`

```javascript
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
        danger: '#EF4444'
      }
    }
  }
};
```

## 📝 Tạo Page Mới

1. Tạo file trong `src/pages/YourPage.tsx`
2. Tạo component page
3. Add route trong `src/main.tsx`

```typescript
// src/pages/YourPage.tsx
import { Layout } from '@/components/Layout';
import { exampleService } from '@/services/exampleService';
import { useState, useEffect } from 'react';

export const YourPage: React.FC = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await exampleService.getAll();
      setData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      {/* Your content here */}
    </Layout>
  );
};
```

```typescript
// src/main.tsx - Add route
<Route path="/your-path" element={<YourPage />} />
```

## 🔐 Authentication Flow

1. User login -> Backend return JWT token
2. Save token ở localStorage
3. Axios interceptor tự động thêm token vào request header
4. Backend check token validate request
5. Nếu token expired (401) -> Auto logout redirect to login

## 🎯 Component Props Example

```typescript
// src/types/index.ts
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

// Usage
<Button 
  variant="primary" 
  size="lg" 
  isLoading={loading}
  onClick={handleSubmit}
>
  Submit
</Button>
```

## 🔄 Custom Hooks

```typescript
// src/hooks/useAsync.ts
export const useAsync = <T,>(
  asyncFunction: () => Promise<T>,
  immediate: boolean = true
) => {
  const [state, setState] = useState({
    data: null,
    loading: immediate,
    error: null
  });

  // ...implementation
  
  return state;
};

// Usage
const { data, loading, error } = useAsync(exampleService.getAll);
```

## ⚙️ Environment Variables

File: `.env`

```env
VITE_API_URL=http://localhost:5000/api/v1
```

## 📦 Path Aliases

File: `tsconfig.json` & `vite.config.ts`

```typescript
// Có thể imports như này
import { Button } from '@/components/Button';
import { exampleService } from '@/services/exampleService';
import { useAsync } from '@/hooks/useAsync';
```

## 🛠 Debugging

- Dùng React DevTools browser extension
- Check Network tab để verify API calls
- Check Console cho errors
- Verify localStorage cho tokens

---

[Back to Main README](../README.md)
