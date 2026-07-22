import React from 'react';

export const DownloadAppPage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#0A0A0B] flex items-center justify-center p-4 md:p-8 font-sans">
      
      {/* Main Container */}
      <div className="w-full max-w-[1000px] md:h-[640px] bg-white rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl">
        
        {/* Left Side: Image Placeholder */}
        <div className="w-full md:w-1/2 h-64 md:h-full bg-slate-900 relative">
           {/* Thay src bằng link ảnh mà bạn muốn */}
           <img 
             src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop" 
             alt="ArenaS App Banner" 
             className="w-full h-full object-cover" 
           />
           <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
              <p className="text-white font-semibold tracking-widest uppercase border border-white/40 px-4 py-2 rounded-lg backdrop-blur-sm">
                Ảnh Placeholder
              </p>
           </div>
        </div>

        {/* Right Column: QR & Download */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col items-center justify-center bg-white text-center">
          <h2 className="text-2xl md:text-[28px] font-black text-slate-900 mb-3 font-montserrat tracking-tight">Cài đặt trực tiếp (APK)</h2>
          <p className="text-sm text-slate-500 mb-10 max-w-[280px] leading-relaxed font-medium">
            Quét mã QR bằng camera điện thoại hoặc nhấn nút tải xuống để cài đặt ứng dụng Android.
          </p>

          <div className="bg-white p-5 rounded-[24px] mb-10 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
             <img src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent('https://apkpure.com/arenas/com.arenas.mobile')}&color=0f172a&bgcolor=ffffff`} alt="QR Code" className="w-[200px] h-[200px]" />
          </div>

          <a
            href="https://apkpure.com/arenas/com.arenas.mobile"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full max-w-[280px] bg-[#00D26A] hover:bg-[#00c060] text-white font-bold text-base py-4 rounded-xl flex items-center justify-center gap-2.5 transition-transform hover:-translate-y-1 shadow-[0_10px_25px_rgba(0,210,106,0.35)]"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
               <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
            </svg>
            Tải file APK ngay
          </a>
          
          <div className="flex items-center justify-center gap-1.5 mt-5 text-[#00D26A] text-[13px] font-bold">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            File an toàn, đã được kiểm duyệt
          </div>
        </div>

      </div>
    </div>
  );
};
