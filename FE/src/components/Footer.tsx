import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-gray-400 border-t border-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center font-bold text-white text-sm">
                A
              </div>
              <span className="text-white font-bold text-lg">ArenaS</span>
            </div>
            <p className="text-sm leading-relaxed">
              Nền tảng đặt sân thể thao toàn diện dành cho vận động viên và chủ sân. Tìm kiếm, đặt sân và quản lý dễ dàng.
            </p>
          </div>

          {/* NỀN TẢNG */}
          <div>
            <h4 className="text-white font-bold mb-4">NỀN TẢNG</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="#"
                  className="hover:text-blue-400 transition duration-300 text-sm"
                >
                  Tìm Sân
                </Link>
              </li>
              <li>
                <Link
                  to="#"
                  className="hover:text-blue-400 transition duration-300 text-sm"
                >
                  Ghép Đội
                </Link>
              </li>
              <li>
                <Link
                  to="#"
                  className="hover:text-blue-400 transition duration-300 text-sm"
                >
                  Blog & Tin Tức
                </Link>
              </li>
            </ul>
          </div>

          {/* DÀNH CHO CHỦ SÂN */}
          <div>
            <h4 className="text-white font-bold mb-4">DÀNH CHO CHỦ SÂN</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="#"
                  className="hover:text-blue-400 transition duration-300 text-sm"
                >
                  Đăng Sân Của Bạn
                </Link>
              </li>
              <li>
                <Link
                  to="#"
                  className="hover:text-blue-400 transition duration-300 text-sm"
                >
                  Bảng Quản Lý
                </Link>
              </li>
              <li>
                <Link
                  to="#"
                  className="hover:text-blue-400 transition duration-300 text-sm"
                >
                  Giá Cước & Kế Hoạch
                </Link>
              </li>
            </ul>
          </div>

          {/* CÔNG TY */}
          <div>
            <h4 className="text-white font-bold mb-4">CÔNG TY</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="#"
                  className="hover:text-blue-400 transition duration-300 text-sm"
                >
                  Về Chúng Tôi
                </Link>
              </li>
              <li>
                <Link
                  to="#"
                  className="hover:text-blue-400 transition duration-300 text-sm"
                >
                  Liên Hệ
                </Link>
              </li>
              <li>
                <Link
                  to="#"
                  className="hover:text-blue-400 transition duration-300 text-sm"
                >
                  Chính Sách Bảo Mật
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500 mb-4 md:mb-0">
              © 2024 ArenaS. Tất cả quyền được bảo lưu.
            </p>
            <div className="flex gap-4">
              <Link to="#" className="text-gray-500 hover:text-blue-400 transition text-sm">
                Điều Khoản Dịch Vụ
              </Link>
              <Link to="#" className="text-gray-500 hover:text-blue-400 transition text-sm">
                Chính Sách Bảo Mật
              </Link>
              <Link to="#" className="text-gray-500 hover:text-blue-400 transition text-sm">
                Liên Hệ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
