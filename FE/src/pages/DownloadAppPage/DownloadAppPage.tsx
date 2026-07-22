import React from 'react';
import { motion } from 'framer-motion';

export const DownloadAppPage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#0A0A0B] flex items-center justify-center p-4 md:p-8 font-sans relative overflow-hidden">
      
      {/* Background glowing blobs */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00D26A]/20 rounded-full blur-[120px] pointer-events-none"
      ></motion.div>
      <motion.div 
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"
      ></motion.div>

      {/* Main Container */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="force-dark-mode w-full max-w-[1000px] md:h-[640px] bg-[#111216]/90 backdrop-blur-xl rounded-[2rem] overflow-hidden flex flex-col md:flex-row shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5 relative z-10"
      >
        
        {/* Left Side: Image */}
        <div className="w-full md:w-1/2 h-80 md:h-full relative group overflow-hidden bg-[#0A101A]">
           {/* Blurred background image for seamless blending */}
           <img 
             src="https://res.cloudinary.com/dbtjki0vq/image/upload/v1784707404/1784706758534_8080801054458620480_g207763156161830534_15714a70e32f0895ff26de9bc75c0d96_jzsa2g.jpg" 
             className="absolute inset-0 w-full h-full object-cover opacity-40 blur-2xl scale-110"
             alt="bg-blur"
           />
           <img 
             src="https://res.cloudinary.com/dbtjki0vq/image/upload/v1784707404/1784706758534_8080801054458620480_g207763156161830534_15714a70e32f0895ff26de9bc75c0d96_jzsa2g.jpg" 
             alt="ArenaS App"
             className="relative z-10 w-full h-full object-contain transition-transform duration-1000 group-hover:scale-105 p-2 md:p-6"
           />
           {/* Overlay gradient */}
           <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-l from-[#111216] via-transparent to-transparent pointer-events-none opacity-90 md:opacity-50 z-20"></div>
        </div>

        {/* Right Column: QR & Download */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col items-center justify-center relative text-center">
          
          {/* Subtle noise/grid background */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, #ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

          <div className="relative z-10 w-full flex flex-col items-center">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-3xl md:text-4xl font-black mb-4 font-montserrat tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/60"
            >
              TẢI ỨNG DỤNG
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-sm md:text-base text-slate-400 mb-10 max-w-[320px] leading-relaxed"
            >
              Quét mã QR bằng camera điện thoại hoặc nhấn nút để cài đặt trực tiếp file APK.
            </motion.p>

            {/* QR Code Container */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.6, type: "spring", stiffness: 100 }}
              className="relative group mb-10"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-[#00D26A] to-blue-500 rounded-3xl blur opacity-30 group-hover:opacity-70 transition duration-500"></div>
              <div className="relative bg-[#1A1C23] p-5 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center">
                <div className="bg-white p-2 rounded-2xl">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent('https://apkpure.com/arenas/com.arenas.mobile')}&color=0f172a&bgcolor=ffffff`} 
                    alt="QR Code"
                    className="w-[180px] h-[180px] object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="absolute -bottom-3 bg-gradient-to-r from-[#00D26A] to-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(0,210,106,0.5)]">
                  Quét để tải
                </div>
              </div>
            </motion.div>

            {/* Download Button */}
            <motion.a
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              href="https://apkpure.com/arenas/com.arenas.mobile"
              target="_blank"
              rel="noopener noreferrer"
              className="relative w-full max-w-[280px] group rounded-xl overflow-hidden flex items-center justify-center p-[1px] bg-gradient-to-r from-[#00D26A] to-emerald-400 shadow-[0_0_20px_rgba(0,210,106,0.3)] hover:shadow-[0_0_30px_rgba(0,210,106,0.5)] transition-shadow duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#00D26A] to-emerald-500 opacity-100 transition-opacity duration-300"></div>
              <div className="relative w-full px-6 py-4 flex items-center justify-center gap-3 z-10">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                </svg>
                <span className="font-bold text-white text-base uppercase tracking-wide">
                  Tải file APK ngay
                </span>
              </div>
              {/* Shine effect */}
              <div className="absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[45deg] group-hover:left-[200%] transition-all duration-700 ease-out z-20"></div>
            </motion.a>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="flex items-center justify-center gap-2 mt-6 text-emerald-400/80 text-[13px] font-medium tracking-wide"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              File an toàn, đã được kiểm duyệt
            </motion.div>

          </div>
        </div>

      </motion.div>
    </div>
  );
};
