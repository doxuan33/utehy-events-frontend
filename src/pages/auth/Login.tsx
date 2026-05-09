import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/auth.store';
import { motion } from 'motion/react';

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
    <div className="min-h-screen bg-white flex flex-col items-center pt-8 pb-4 px-4 font-sans">
      <div className="w-full max-w-[500px] flex flex-col items-center">
        {/* Logo */}
        <img src="/logo.png" alt="UTEHY Logo" className="h-24 w-auto mb-4" />
        
        {/* University Header */}
        <div className="text-center mb-6 space-y-1">
          <h1 className="text-[22px] font-bold text-[#0072bc] leading-tight tracking-wide">
            TRƯỜNG ĐẠI HỌC SƯ PHẠM KỸ THUẬT HƯNG YÊN
          </h1>
          <p className="text-[14px] text-[#5496cf] font-medium tracking-wider uppercase">
            HUNGYEN UNIVERSITY OF TECHNOLOGY AND EDUCATION
          </p>
          <div className="w-full h-[1px] bg-gray-200 mt-4"></div>
        </div>

        {/* Instructions */}
        <div className="w-full mb-8">
          <h2 className="text-[20px] font-bold text-gray-800 mb-2">Hướng dẫn sử dụng</h2>
          <ul className="text-gray-600 text-[15px] space-y-1">
            <li>1. Truy cập vào hệ thống bằng tài khoản được cấp.</li>
            <li>2. Hotline hỗ trợ: <span className="font-bold text-gray-800 tracking-wide">0912.681.066</span></li>
          </ul>
        </div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full bg-white border border-gray-200 rounded-[8px] p-8 shadow-sm mb-6"
        >
          <h3 className="text-center text-[20px] font-bold text-[#333] mb-8">
            CỔNG THÔNG TIN SINH VIÊN
          </h3>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-lg border border-red-100 mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Role Select */}
              <div className="relative">
                <select className="w-full appearance-none bg-white border border-gray-300 rounded-[4px] px-4 py-3 text-gray-700 text-[16px] outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all">
                  <option>Sinh viên</option>
                  <option>Cán bộ/Giảng viên</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Identifier Input */}
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Mã sinh viên"
                className="w-full bg-[#E8F0FE] border border-[#CBD5E0] rounded-[4px] px-4 py-3 text-gray-800 text-[16px] outline-none focus:border-blue-400 transition-all font-medium"
              />

              {/* Password Input */}
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu"
                className="w-full bg-[#E8F0FE] border border-[#CBD5E0] rounded-[4px] px-4 py-3 text-gray-800 text-[16px] outline-none focus:border-blue-400 transition-all"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-[#5dade2] hover:bg-[#4a9ad4] text-white font-bold py-4 rounded-[40px] text-[16px] shadow-sm transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
              </button>
              <button
                type="button"
                className="flex-1 bg-[#337ab7] hover:bg-[#286090] text-white font-bold py-4 rounded-[40px] text-[16px] shadow-sm transition-colors"
              >
                Quên mật khẩu
              </button>
            </div>
          </form>
        </motion.div>

        {/* Footer */}
        <p className="text-gray-400 text-[14px] text-center mb-8">
          © 2026 UTEHY_Events - Cổng thông tin sinh viên
        </p>
      </div>
    </div>
  );
};
