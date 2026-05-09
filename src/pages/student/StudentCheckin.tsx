import { useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { checkinApi } from '@/api/checkin.api';
import { Button } from '@/components/common/Button';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Camera, CheckCircle2, AlertCircle, ArrowLeft, Loader2, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const StudentCheckin = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'idle' | 'getting-gps' | 'scanning' | 'processing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [distance, setDistance] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const gpsCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const eventIdRef = useRef<string | null>(null);

  const getGpsLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Trình duyệt không hỗ trợ GPS'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          let errorMessage = 'Không thể lấy vị trí GPS';
          if (error.code === error.PERMISSION_DENIED) {
            errorMessage = 'Bạn từ chối cấp quyền truy cập vị trí';
          } else if (error.code === error.TIMEOUT) {
            errorMessage = 'Hết thời gian lấy vị trí';
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  const startScanner = async () => {
    setStatus('getting-gps');
    setMessage('Đang lấy tọa độ GPS...');

    try {
      const position = await getGpsLocation();
      gpsCoordsRef.current = position;

      const urlParams = new URLSearchParams(window.location.search);
      const eventId = urlParams.get('eventId');
      if (!eventId) {
        throw new Error('Không tìm thấy ID sự kiện');
      }
      eventIdRef.current = eventId;

      setStatus('scanning');
      setMessage('');

      setTimeout(() => {
        const scanner = new Html5QrcodeScanner(
          "qr-reader",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          false
        );

        scanner.render(onScanSuccess, onScanError);
        scannerRef.current = scanner;
      }, 100);
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Không thể lấy vị trí GPS');
      toast.error(err.message || 'Không thể lấy vị trí GPS');
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    if (status === 'processing') return;

    if (scannerRef.current) {
      try {
        await scannerRef.current.clear();
      } catch (err) {
        console.error("Failed to clear scanner", err);
      }
    }

    setStatus('processing');
    setMessage('Đang xác thực điểm danh...');

    try {
      const response = await checkinApi.scanGps({
        event_id: eventIdRef.current!,
        token: decodedText,
        lat: gpsCoordsRef.current!.lat,
        lng: gpsCoordsRef.current!.lng,
      });

      setDistance(response.data.distance || null);
      setStatus('success');
      setMessage(response.data.message || 'Điểm danh thành công!');
      toast.success(response.data.message || 'Điểm danh thành công!');
    } catch (err: any) {
      setStatus('error');
      const errorMsg = err.response?.data?.message || 'Điểm danh thất bại. Vui lòng thử lại.';
      setMessage(errorMsg);
      toast.error(errorMsg);
    }
  };

   const onScanError = (error: any) => {
     // QR scan error (user may cancel, camera denied, etc.)
   };

  const resetProcess = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }
    gpsCoordsRef.current = null;
    eventIdRef.current = null;
    setDistance(null);
    setStatus('idle');
    setMessage('');
  };

  return (
    <div className="max-w-md mx-auto py-8 px-4">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center text-gray-500 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Quay lại
      </button>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8 text-center">
          <h1 className="text-2xl font-black text-gray-900 mb-2">Điểm danh GPS</h1>
          <p className="text-gray-500 text-sm mb-6">Quét mã QR và xác nhận vị trí của bạn</p>

          <AnimatePresence mode="wait">
            {status === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="py-10"
              >
                <div className="h-40 w-40 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Navigation className="h-20 w-20 text-blue-600" />
                </div>
                <Button
                  onClick={startScanner}
                  className="w-full py-6 text-lg rounded-2xl shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Bật Camera Quét Mã
                </Button>
              </motion.div>
            )}

            {status === 'getting-gps' && (
              <motion.div
                key="getting-gps"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-20 flex flex-col items-center"
              >
                <div className="relative">
                  <Loader2 className="h-16 w-16 text-blue-600 animate-spin mb-4" />
                  <div className="absolute inset-0 h-16 w-16 border-4 border-blue-200 rounded-full animate-ping" />
                </div>
                <p className="font-bold text-gray-900">Đang lấy tọa độ GPS...</p>
                <p className="text-sm text-gray-500 mt-2">Vui lòng cho phép truy cập vị trí</p>
              </motion.div>
            )}

            {status === 'scanning' && (
              <motion.div
                key="scanning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-center space-x-2 text-green-600 mb-4">
                  <MapPin className="h-5 w-5" />
                  <span className="font-medium">GPS đã sẵn sàng</span>
                </div>
                <div id="qr-reader" className="overflow-hidden rounded-2xl border-2 border-blue-100 shadow-inner"></div>
              </motion.div>
            )}

            {status === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-20 flex flex-col items-center"
              >
                <Loader2 className="h-16 w-16 text-blue-600 animate-spin mb-4" />
                <p className="font-bold text-gray-900">Đang xác thực điểm danh...</p>
              </motion.div>
            )}

            {status === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-10 text-center"
              >
                <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="h-16 w-16 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Thành công!</h3>
                <p className="text-gray-600 mb-2">{message}</p>
                {distance && (
                  <p className="text-blue-600 font-bold mb-4">Khoảng cách: {distance}</p>
                )}
                <Button
                  onClick={() => navigate('/')}
                  className="w-full py-4 rounded-xl"
                >
                  Về trang chủ
                </Button>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-10 text-center"
              >
                <div className="h-24 w-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="h-16 w-16 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Thất bại</h3>
                <p className="text-gray-600 mb-8">{message}</p>
                <div className="space-y-3">
                  <Button
                    onClick={resetProcess}
                    className="w-full py-4 rounded-xl"
                  >
                    Thử lại
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="w-full py-4 rounded-xl"
                  >
                    Hủy bỏ
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-100">
        <h4 className="font-bold text-blue-900 mb-2 flex items-center">
          <AlertCircle className="h-4 w-4 mr-2" />
          Lưu ý quan trọng
        </h4>
        <ul className="text-xs text-blue-800 space-y-2 list-disc pl-4">
          <li>Mã QR là mã động, sẽ thay đổi sau mỗi 15 giây để tránh gian lận.</li>
          <li>Vui lòng đưa camera lại gần mã QR để quét chính xác.</li>
          <li>Bạn cần ở đúng vị trí sự kiện để điểm danh được chấp nhận.</li>
        </ul>
      </div>
    </div>
  );
};