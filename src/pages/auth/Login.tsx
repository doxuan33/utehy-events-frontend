import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/auth.store';
import { motion } from 'motion/react';
import { Loader2, Lock, User, ChevronDown } from 'lucide-react';

export const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const res = await authApi.login(identifier, password);
      const { access_token, refresh_token, user } = res.data.data;
      setAuth(access_token, refresh_token, user);
      
      if (user.role === 'SYSTEM_ADMIN') navigate('/admin');
      else if (user.role === 'PAGE_ADMIN') navigate('/page-admin');
      else navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-200/40 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-200/40 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-4xl flex flex-col items-center relative z-10">
        
        {/* Header Section - Đã tối ưu để hiển thị 1 dòng */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full flex flex-col items-center mb-8"
        >
          <img src="/logo.png" alt="UTEHY Logo" className="h-20 md:h-24 w-auto mb-5 drop-shadow-md" loading="lazy" />
          
          <div className="text-center space-y-1.5 w-full">
            <h1 className="text-[11px] sm:text-base md:text-xl lg:text-[22px] font-black text-transparent bg-clip-text bg-gradient-to-r from-green-800 to-teal-600 tracking-wide whitespace-nowrap">
              TRƯỜNG ĐẠI HỌC SƯ PHẠM KỸ THUẬT HƯNG YÊN
            </h1>
            <p className="text-[8px] sm:text-xs md:text-sm text-green-600/80 font-bold tracking-widest uppercase whitespace-nowrap">
              HUNGYEN UNIVERSITY OF TECHNOLOGY AND EDUCATION
            </p>
          </div>
        </motion.div>

        {/* Main Content Layout */}
        <div className="w-full flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
          
          {/* Instructions (Left side on Desktop, Top on Mobile) */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-[400px] bg-white/60 backdrop-blur-md border border-green-100 p-6 rounded-[2rem] shadow-sm order-2 lg:order-1"
          >
            <div className="flex items-center gap-3 mb-4 border-b border-green-100 pb-4">
              <div className="p-2.5 bg-green-100 rounded-xl">
                <User className="h-5 w-5 text-green-600" />
              </div>
              <h2 className="text-lg font-extrabold text-green-800">Hướng dẫn sử dụng</h2>
            </div>
            <ul className="text-gray-600 text-sm space-y-3 font-medium">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-green-50 text-green-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                Truy cập vào hệ thống bằng tài khoản (Mã sinh viên) được cấp.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-green-50 text-green-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                <span>Hotline hỗ trợ kỹ thuật: <br/><strong className="text-green-700 text-base">0912.681.066</strong></span>
              </li>
            </ul>
          </motion.div>

          {/* Login Form Card (Right side on Desktop, Bottom on Mobile) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full max-w-[420px] bg-white/90 backdrop-blur-xl border border-white rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)] order-1 lg:order-2"
          >
            <div className="text-center mb-8">
              <h3 className="text-xl font-black text-gray-800 uppercase tracking-wider">
                Cổng thông tin
              </h3>
              <p className="text-sm font-bold text-teal-600 mt-1">Đăng nhập hệ thống</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-3 text-sm font-medium text-red-600 bg-red-50 rounded-xl border border-red-100 text-center">
                  {error}
                </motion.div>
              )}

              <div className="space-y-4">
                {/* Role Select */}
                <div className="relative group">
                  <select className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-gray-700 text-sm font-bold outline-none focus:bg-white focus:border-green-400 focus:ring-4 focus:ring-green-500/10 transition-all cursor-pointer">
                    <option>Sinh viên</option>
                    <option>Cán bộ/Giảng viên</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-green-500 transition-colors">
                    <ChevronDown className="h-5 w-5" />
                  </div>
                </div>

                {/* Identifier Input */}
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors">
                    <User className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Mã sinh viên hoặc Email"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-3.5 text-gray-800 text-sm font-bold outline-none focus:bg-white focus:border-green-400 focus:ring-4 focus:ring-green-500/10 transition-all placeholder:font-medium placeholder:text-gray-400"
                  />
                </div>

                {/* Password Input */}
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mật khẩu"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-3.5 text-gray-800 text-sm font-bold outline-none focus:bg-white focus:border-green-400 focus:ring-4 focus:ring-green-500/10 transition-all placeholder:font-medium placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold py-3.5 rounded-2xl text-sm shadow-md shadow-green-500/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'Đăng nhập'
                  )}
                </button>
                <button
                  type="button"
                  className="w-full flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-600 font-bold py-3.5 rounded-2xl text-sm transition-all"
                >
                  Quên mật khẩu?
                </button>
              </div>
            </form>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.p 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-gray-400 text-xs font-medium text-center mt-12"
        >
          © 2026 UTEHY_Events - Cổng thông tin & Sự kiện sinh viên
        </motion.p>
      </div>
    </div>
  );
};