import React from 'react';
import { Link } from 'react-router-dom';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-blue-400/15 bg-slate-950/90 text-white shadow-lg backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/home" className="flex items-center gap-2">
            <div className="bg-blue-500 rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">
              A
            </div>
            <span className="text-2xl font-bold">ArenaS</span>
          </Link>

          {/* Navigation Menu */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="#"
              className="hover:text-blue-400 transition duration-300 font-medium"
            >
              Môn Thể Thao
            </Link>
            <Link
              to="#"
              className="hover:text-blue-400 transition duration-300 font-medium"
            >
              Tìm Sân
            </Link>
            <Link
              to="#"
              className="hover:text-blue-400 transition duration-300 font-medium"
            >
              Cộng Đông
            </Link>
            <Link
              to="#"
              className="hover:text-blue-400 transition duration-300 font-medium"
            >
              Bảng Giá
            </Link>
            <Link
              to="#"
              className="hover:text-blue-400 transition duration-300 font-medium"
            >
              Dành Cho Chủ Sân
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden md:flex items-center gap-2 hover:text-blue-400 transition">
              🔔
              <span className="text-sm font-medium">Đăng Nhập</span>
            </Link>
            <Link
              to="/login"
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
            >
              Đăng Ký Miễn Phí
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
