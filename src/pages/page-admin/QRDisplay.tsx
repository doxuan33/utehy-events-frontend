import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { checkinApi } from '@/api/checkin.api';
import { useAuthStore } from '@/store/auth.store';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Users, ArrowLeft, Maximize, Minimize, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export const QRDisplay = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const token = useAuthStore(state => state.token);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!eventId || !token) return;

    const eventSource = new EventSource(checkinApi.getStreamUrl(eventId, token));

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.error) {
        setError(data.error);
        setIsLoading(false);
        return;
      }
      setQrToken(data.token);
      setExpiresAt(new Date(data.expires_at));
      setTimeLeft(data.ttl || 15);
      setIsLoading(false);
    };

    eventSource.onerror = (err) => {
      console.error("SSE Error:", err);
      setError("Mất kết nối với máy chủ. Vui lòng thử lại.");
      setIsLoading(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [eventId]);

  useEffect(() => {
    if (!timeLeft || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
        <p className="font-bold text-gray-900">Đang khởi tạo mã QR động...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="h-12 w-12 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Lỗi hiển thị mã QR</h2>
        <p className="text-gray-600 mb-8 text-center max-w-md">{error}</p>
        <button 
          onClick={() => navigate(-1)}
          className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100"
        >
          Quay lại trang quản lý
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${isFullscreen ? 'bg-white' : 'bg-gray-50 p-6'}`}>
      {!isFullscreen && (
        <div className="absolute top-8 left-8">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Quay lại
          </button>
        </div>
      )}

      <div className="absolute top-8 right-8 flex items-center space-x-4">
        <button 
          onClick={toggleFullscreen}
          className="p-3 bg-white rounded-full shadow-md text-gray-500 hover:text-blue-600 transition-colors"
        >
          {isFullscreen ? <Minimize className="h-6 w-6" /> : <Maximize className="h-6 w-6" />}
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-white rounded-[40px] shadow-2xl border border-gray-100 flex flex-col items-center ${isFullscreen ? 'p-12' : 'p-10 max-w-xl w-full'}`}
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-tight">Điểm danh sự kiện</h1>
          <p className="text-gray-500 font-medium">Sử dụng ứng dụng UTEHY Social để quét mã</p>
        </div>

        <div className="relative p-6 bg-white rounded-3xl border-8 border-blue-50 shadow-inner mb-8">
          <AnimatePresence mode="wait">
            {qrToken && (
              <motion.div
                key={qrToken}
                initial={{ opacity: 0, rotate: -5 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 5 }}
                transition={{ duration: 0.3 }}
              >
                <QRCodeSVG 
                  value={qrToken} 
                  size={isFullscreen ? 400 : 300} 
                  level="H"
                  includeMargin={true}
                  imageSettings={{
                    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Logo_UTEHY.png/1200px-Logo_UTEHY.png",
                    x: undefined,
                    y: undefined,
                    height: isFullscreen ? 60 : 45,
                    width: isFullscreen ? 60 : 45,
                    excavate: true,
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Progress ring for time left */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-2 rounded-full font-black text-xl shadow-lg flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>{timeLeft}s</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 w-full mt-4">
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Thời gian</div>
            <div className="text-lg font-black text-gray-900">{format(new Date(), 'HH:mm:ss')}</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Ngày</div>
            <div className="text-lg font-black text-gray-900">{format(new Date(), 'dd/MM/yyyy')}</div>
          </div>
        </div>

        <div className="mt-10 flex items-center space-x-3 text-blue-600 bg-blue-50 px-6 py-3 rounded-2xl border border-blue-100">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm font-bold">Mã QR sẽ tự động cập nhật để bảo mật</span>
        </div>
      </motion.div>

      {!isFullscreen && (
        <div className="mt-12 text-center text-gray-400 text-sm font-medium">
          © 2026 UTEHY Social - Nền tảng quản lý sự kiện ngoại khóa
        </div>
      )}
    </div>
  );
};
