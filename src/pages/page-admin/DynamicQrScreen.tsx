import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, ArrowLeft, Maximize, Minimize, Loader2, AlertCircle } from 'lucide-react';
import { checkinApi } from '@/api/checkin.api';
import { format } from 'date-fns';

export const DynamicQrScreen = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!eventId) return;

    const fetchQrToken = async () => {
      try {
        const response = await checkinApi.getEventQrToken(eventId);
        setQrToken(response.data.data.token);
        setTimeLeft(15);
        setError(null);
        setIsLoading(false);
      } catch {
        setError('Không thể lấy mã QR. Vui lòng thử lại.');
        setIsLoading(false);
      }
    };

    fetchQrToken();
    intervalRef.current = setInterval(fetchQrToken, 15000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [eventId]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
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
    <div className={`min-h-screen flex flex-col items-center justify-center relative overflow-hidden ${isFullscreen ? 'bg-gray-900' : 'bg-gray-50 p-6'}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 opacity-30" />

      {!isFullscreen && (
        <div className="absolute top-8 left-8 z-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Quay lại
          </button>
        </div>
      )}

      <div className="absolute top-8 right-8 z-10 flex items-center space-x-4">
        <button
          onClick={toggleFullscreen}
          className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-md text-gray-500 hover:text-blue-600 transition-colors"
        >
          {isFullscreen ? <Minimize className="h-6 w-6" /> : <Maximize className="h-6 w-6" />}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10"
      >
        <div className={`bg-white/20 backdrop-blur-xl rounded-[40px] shadow-2xl border border-white/30 flex flex-col items-center p-12 max-w-xl w-full ${isFullscreen ? 'p-16' : 'p-12'}`}>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-gray-900 mb-2 uppercase tracking-tight">Điểm danh sự kiện</h1>
            <p className="text-gray-600 font-medium">Sử dụng ứng dụng UTEHY Social để quét mã</p>
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
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-2 rounded-full font-black text-xl shadow-lg flex items-center space-x-2"
              initial={{ scale: 1 }}
              animate={{ scale: timeLeft <= 5 ? [1, 1.1, 1] : 1 }}
            >
              <Clock className="h-5 w-5" />
              <span>{timeLeft}s</span>
            </motion.div>
          </div>

          <div className="w-full max-w-sm mb-8">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 text-center">
              Thời gian còn lại
            </div>
            <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                initial={{ width: '100%' }}
                animate={{ width: `${(timeLeft / 15) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 w-full mt-4">
            <div className="p-4 bg-white/50 rounded-2xl border border-white/30 text-center">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Thời gian</div>
              <div className="text-lg font-black text-gray-900">{format(new Date(), 'HH:mm:ss')}</div>
            </div>
            <div className="p-4 bg-white/50 rounded-2xl border border-white/30 text-center">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Ngày</div>
              <div className="text-lg font-black text-gray-900">{format(new Date(), 'dd/MM/yyyy')}</div>
            </div>
          </div>

          <div className="mt-10 flex items-center space-x-3 text-blue-600 bg-blue-500/10 px-6 py-3 rounded-2xl border border-blue-500/20">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-bold">Mã QR sẽ tự động cập nhật mỗi 15 giây</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};