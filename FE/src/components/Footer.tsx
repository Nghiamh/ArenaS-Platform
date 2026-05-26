import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0A0A0B] text-slate-400 border-t border-white/5 font-inter">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About Section */}
          <div>
            <div className="flex items-center gap-2 mb-4 group">
              <div className="bg-[#CCFF00] rounded-full w-10 h-10 flex items-center justify-center font-black text-[#0A0A0B] text-lg transition-transform group-hover:scale-105">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                  <path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 6.7 1.4 1.1-5.4z" />
                </svg>
              </div>
              <span className="text-2xl font-black font-montserrat uppercase tracking-[0.2em] text-[#CCFF00]">ArenaS</span>
            </div>
            <p className="text-sm leading-relaxed mt-2 text-slate-500">
              Nền tảng đặt sân thể thao toàn diện dành cho vận động viên và chủ sân. Tìm kiếm, đặt sân và quản lý dễ dàng.
            </p>
          </div>

          {/* NỀN TẢNG */}
          <div>
            <h4 className="text-[#00F5FF] font-bold uppercase tracking-widest text-xs mb-6">NỀN TẢNG</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/tim-san"
                  className="hover:text-[#CCFF00] transition duration-300 text-sm font-medium"
                >
                  Tìm Sân
                </Link>
              </li>
              <li>
                <Link
                  to="#"
                  className="hover:text-[#CCFF00] transition duration-300 text-sm font-medium"
                >
                  Ghép Đội
                </Link>
              </li>
              <li>
                <Link
                  to="#"
                  className="hover:text-[#CCFF00] transition duration-300 text-sm font-medium"
                >
                  Blog & Tin Tức
                </Link>
              </li>
            </ul>
          </div>

          {/* DÀNH CHO CHỦ SÂN */}
          <div>
            <h4 className="text-[#00F5FF] font-bold uppercase tracking-widest text-xs mb-6">DÀNH CHO CHỦ SÂN</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="#"
                  className="hover:text-[#CCFF00] transition duration-300 text-sm font-medium"
                >
                  Đăng Kí Sân Của Bạn
                </Link>
              </li>
              <li>
                <Link
                  to="#"
                  className="hover:text-[#CCFF00] transition duration-300 text-sm font-medium"
                >
                  Phần Mềm Quản Lý Sân
                </Link>
              </li>
              <li>
                <Link
                  to="#"
                  className="hover:text-[#CCFF00] transition duration-300 text-sm font-medium"
                >
                  Giá Cước & Kế Hoạch
                </Link>
              </li>
            </ul>
          </div>

          {/* CÔNG TY */}
          <div>
            <h4 className="text-[#00F5FF] font-bold uppercase tracking-widest text-xs mb-6">CÔNG TY</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="#"
                  className="hover:text-[#CCFF00] transition duration-300 text-sm font-medium"
                >
                  Về Chúng Tôi
                </Link>
              </li>
              <li>
                <Link
                  to="#"
                  className="hover:text-[#CCFF00] transition duration-300 text-sm font-medium"
                >
                  Liên Hệ
                </Link>
              </li>
              <li>
                <Link
                  to="#"
                  className="hover:text-[#CCFF00] transition duration-300 text-sm font-medium"
                >
                  Chính Sách Bảo Mật
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/5 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 text-center md:text-left">
              © 2024 ArenaS. Tất cả quyền được bảo lưu.
            </p>
            <div className="flex gap-6">
              <Link to="#" className="text-slate-500 hover:text-[#00F5FF] transition text-xs font-bold uppercase tracking-widest">
                Điều Khoản Dịch Vụ
              </Link>
              <Link to="#" className="text-slate-500 hover:text-[#00F5FF] transition text-xs font-bold uppercase tracking-widest">
                Chính Sách Bảo Mật
              </Link>
              <Link to="#" className="text-slate-500 hover:text-[#00F5FF] transition text-xs font-bold uppercase tracking-widest">
                Liên Hệ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
