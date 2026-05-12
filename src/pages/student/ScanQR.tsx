import { useEffect, useState, useRef } from 'react';
// ĐÃ CHỈNH SỬA: Import Html5Qrcode thay vì Html5QrcodeScanner
import { Html5Qrcode } from 'html5-qrcode';
import { checkinApi } from '@/api/checkin.api';
import { Button } from '@/components/common/Button';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  Camera,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Scan,
  Satellite,
  Activity,
  Wifi,
  Target
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';

type TabMode = 'qr' | 'gps';
type Status = 'idle' | 'scanning' | 'processing' | 'success' | 'error';

export const ScanQR = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabMode>('qr');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [gpsStatus, setGpsStatus] = useState<'connecting' | 'ready' | 'checking'>('connecting');
  
  // ĐÃ CHỈNH SỬA: Định dạng kiểu cho ref là Html5Qrcode
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // ĐÃ CHỈNH SỬA: Hàm dừng và dọn dẹp camera
  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error("Failed to stop camera", err);
      }
    }
  };

  // QR Scanner Logic - SỬ DỤNG CLASS CORE ĐỂ MỞ CAMERA TRỰC TIẾP
  const startScanner = async () => {
    setStatus('scanning');
    
    // Đợi 1 chút để DOM render xong thẻ div #reader
    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        // Bắt đầu stream camera trực tiếp (ưu tiên camera sau)
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          onScanSuccess,
          onScanFailure
        );
      } catch (err) {
        console.error("Lỗi mở camera:", err);
        setStatus('error');
        setMessage('Không thể mở Camera. Vui lòng kiểm tra quyền truy cập trên trình duyệt của bạn.');
      }
    }, 200);
  };

  const onScanSuccess = async (decodedText: string) => {
    // Chặn quét nhiều lần cùng lúc
    if (status === 'processing') return;
    setStatus('processing');

    // Tắt camera ngay khi quét thành công
    await stopCamera();

    try {
      const res = await checkinApi.scanQr({ token: decodedText });
      setStatus('success');
      setMessage(res.data.message || 'Điểm danh thành công!');
      triggerConfetti();
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Điểm danh thất bại. Vui lòng thử lại.');
    }
  };

  const onScanFailure = (error: any) => {
    // Ignore frame scan errors
  };

  const resetScanner = () => {
    setStatus('idle');
    setMessage('');
    startScanner();
  };

  // GPS Check-in Logic
  const handleGpsCheckin = async () => {
    setStatus('processing');
    setGpsStatus('checking');

    // Simulate GPS verification
    setTimeout(async () => {
      try {
        setStatus('success');
        setMessage('Điểm danh GPS thành công!');
        triggerConfetti();
        setGpsStatus('ready');
      } catch (err) {
        setStatus('error');
        setMessage('Không thể xác minh vị trí. Vui lòng thử lại.');
        setGpsStatus('ready');
      }
    }, 2000);
  };

  // Confetti effect
  const triggerConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 100,
      colors: ['#10b981', '#14b8a6', '#34d399', '#6ee7b7']
    };

    function fire(particleRatio: number, opts: any) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  };

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Tự động mở camera khi ở tab QR và trạng thái đang là idle
  useEffect(() => {
    if (activeTab === 'qr' && status === 'idle') {
      startScanner();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, status]);

  // Xử lý chuyển tab an toàn (tắt camera nếu chuyển sang GPS)
  const handleTabSwitch = async (tab: TabMode) => {
    if (tab === 'gps') {
      await stopCamera();
    }
    setActiveTab(tab);
    setStatus('idle');
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 py-8 px-4 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-green-100/50 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-500 hover:text-green-600 transition-colors mb-4 group"
          >
            <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Quay lại</span>
          </button>
          <h1 className="text-3xl font-black text-green-900 tracking-tight mb-2">Điểm danh sự kiện</h1>
          <p className="text-green-700/70 font-medium">Hệ thống nhận diện thông minh & định vị GPS</p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-white rounded-2xl p-1.5 flex shadow-sm border border-green-100">
          <button
            onClick={() => handleTabSwitch('qr')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 ${
              activeTab === 'qr'
                ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-md transform scale-[1.02]'
                : 'text-gray-500 hover:bg-green-50 hover:text-green-700'
            }`}
          >
            <Camera className="h-4 w-4" />
            <span>Quét mã QR</span>
          </button>
          <button
            onClick={() => handleTabSwitch('gps')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 ${
              activeTab === 'gps'
                ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-md transform scale-[1.02]'
                : 'text-gray-500 hover:bg-green-50 hover:text-green-700'
            }`}
          >
            <MapPin className="h-4 w-4" />
            <span>Điểm danh GPS</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {activeTab === 'qr' && (
              <motion.div
                key="qr-mode"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* Idle State - Hiển thị chớp nhoáng trong lúc xin quyền Camera */}
                {status === 'idle' && (
                  <div className="bg-white rounded-3xl shadow-sm border border-green-100 p-8 text-center">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className="relative"
                    >
                      <div className="relative w-64 h-64 mx-auto mb-8 bg-gray-50 rounded-3xl overflow-hidden shadow-inner border border-green-50">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="w-10 h-10 text-green-400 animate-spin" />
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 max-w-sm mx-auto animate-pulse">
                        Đang khởi động Camera... Vui lòng cấp quyền truy cập.
                      </p>
                    </motion.div>
                  </div>
                )}

                {/* Scanning State - Custom Scanner UI */}
                <div className={`${status === 'scanning' ? 'block' : 'hidden'}`}>
                  <div className="bg-white rounded-3xl shadow-lg border border-green-100 p-3">
                    <div className="bg-gray-950 rounded-2xl overflow-hidden relative shadow-inner">
                      <div className="relative aspect-square [&>div]:!border-none">
                        {/* Video Preview: Thư viện sẽ nhúng thẻ <video> trực tiếp vào div này */}
                        <div id="reader" className="w-full h-full object-cover" />

                        {/* Overlay Frame */}
                        <div className="absolute inset-0 pointer-events-none">
                          {/* Dark vignette */}
                          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" style={{ maskImage: 'radial-gradient(circle, transparent 45%, black 50%)', WebkitMaskImage: 'radial-gradient(circle, transparent 45%, black 50%)' }} />

                          {/* Target Brackets */}
                          <div className="absolute inset-10">
                            <div className="absolute top-0 left-0 w-14 h-14 border-l-4 border-t-4 border-green-400 rounded-tl-2xl shadow-[0_0_15px_rgba(74,222,128,0.5)]" />
                            <div className="absolute top-0 right-0 w-14 h-14 border-r-4 border-t-4 border-green-400 rounded-tr-2xl shadow-[0_0_15px_rgba(74,222,128,0.5)]" />
                            <div className="absolute bottom-0 left-0 w-14 h-14 border-l-4 border-b-4 border-green-400 rounded-bl-2xl shadow-[0_0_15px_rgba(74,222,128,0.5)]" />
                            <div className="absolute bottom-0 right-0 w-14 h-14 border-r-4 border-b-4 border-green-400 rounded-br-2xl shadow-[0_0_15px_rgba(74,222,128,0.5)]" />
                          </div>

                          {/* Center Crosshair */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-70">
                            <div className="w-20 h-20 flex items-center justify-center">
                              <div className="w-full h-[1px] bg-green-400" />
                              <div className="absolute w-[1px] h-full bg-green-400" />
                              <div className="absolute w-4 h-4 border border-green-400 rounded-full" />
                            </div>
                          </div>

                          {/* Laser Scanner */}
                          <motion.div
                            className="absolute left-10 right-10 h-0.5 bg-green-400 shadow-[0_0_20px_rgba(74,222,128,1)]"
                            animate={{ y: [40, 320, 40] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                          />

                          {/* Status Text */}
                          <div className="absolute bottom-6 left-0 right-0 text-center">
                            <span className="text-green-50 font-medium text-sm bg-black/60 backdrop-blur-md px-5 py-2.5 rounded-full border border-green-500/30 flex items-center justify-center w-max mx-auto shadow-lg">
                              <Scan className="w-4 h-4 mr-2 animate-pulse text-green-400" />
                              Đưa mã QR vào khung hình
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Processing State */}
                {status === 'processing' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white rounded-3xl shadow-sm border border-green-100 p-16 text-center"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      className="w-20 h-20 mx-auto mb-8 rounded-full border-4 border-green-100 border-t-green-500 shadow-lg shadow-green-100/50"
                    />
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Đang phân tích dữ liệu...</h3>
                    <p className="text-sm text-gray-500">Hệ thống đang mã hóa và đối soát</p>
                  </motion.div>
                )}

                {/* Success State */}
                {status === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl shadow-md border border-green-100 p-12 text-center relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-teal-500" />
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", duration: 0.6 }}
                      className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-green-50 to-green-100 rounded-full flex items-center justify-center border-4 border-white shadow-xl shadow-green-100"
                    >
                      <CheckCircle2 className="h-14 w-14 text-green-500" />
                    </motion.div>
                    <h3 className="text-3xl font-black text-gray-800 mb-3">Thành công!</h3>
                    <p className="text-gray-600 mb-10 text-lg">{message}</p>
                    <Button
                      onClick={() => navigate('/')}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                    >
                      Về trang chủ
                    </Button>
                  </motion.div>
                )}

                {/* Error State */}
                {status === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl shadow-sm border border-red-100 p-12 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", duration: 0.6 }}
                      className="w-28 h-28 mx-auto mb-6 bg-red-50 rounded-full flex items-center justify-center border-4 border-white shadow-lg shadow-red-100"
                    >
                      <AlertCircle className="h-14 w-14 text-red-500" />
                    </motion.div>
                    <h3 className="text-2xl font-black text-gray-800 mb-3">Thất bại</h3>
                    <p className="text-gray-600 mb-10">{message}</p>
                    <div className="space-y-4">
                      <Button
                        onClick={resetScanner}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
                      >
                        Thử lại ngay
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => navigate(-1)}
                        className="w-full py-4 rounded-xl bg-green-50 text-green-700 border-none hover:bg-green-100 font-medium transition-colors"
                      >
                        Hủy bỏ
                      </Button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* PHẦN GPS CODE GIỮ NGUYÊN HOÀN TOÀN NHƯ CŨ CỦA BẠN */}
            {activeTab === 'gps' && (
              <motion.div
                key="gps-mode"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* Radar Display Modernized */}
                <div className="bg-white rounded-3xl shadow-sm border border-green-100 overflow-hidden relative">
                  <div className="aspect-square flex items-center justify-center bg-gradient-to-b from-green-50/50 to-white">
                    {/* Radar Rings */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        className="absolute w-[80%] h-[80%] border border-green-200 rounded-full"
                        animate={{ scale: [1, 1.1], opacity: [0.2, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                      />
                      <motion.div
                        className="absolute w-[60%] h-[60%] border border-green-300/50 rounded-full"
                        animate={{ scale: [1, 1.1], opacity: [0.4, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, delay: 0.4 }}
                      />
                      <motion.div
                        className="absolute w-[40%] h-[40%] border border-green-400/50 rounded-full bg-green-50/20"
                        animate={{ scale: [1, 1.1], opacity: [0.6, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, delay: 0.8 }}
                      />
                    </div>

                    {/* Center Icon */}
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="relative z-10"
                    >
                      <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(74,222,128,0.4)] border-4 border-white">
                        <MapPin className="h-10 w-10 text-white" />
                      </div>
                    </motion.div>

                    {/* Scanning Line - Modern */}
                    <motion.div
                      className="absolute inset-0"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    >
                      <div className="absolute top-1/2 left-1/2 w-[40%] h-1 bg-gradient-to-r from-green-500 to-transparent origin-left opacity-60" style={{ filter: 'blur(2px)' }}/>
                    </motion.div>
                  </div>

                  {/* Overlay Status */}
                  <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-green-50 p-4">
                    <div className="flex items-center justify-center space-x-2">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                      </span>
                      <p className="text-green-800 text-center text-sm font-bold">
                        {gpsStatus === 'connecting' && 'Đang đồng bộ vệ tinh GPS...'}
                        {gpsStatus === 'ready' && 'Định vị thành công - Trong vùng sự kiện'}
                        {gpsStatus === 'checking' && 'Đang trích xuất tọa độ...'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Technical Specs */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl p-4 border border-green-100 shadow-sm hover:shadow-md transition-shadow text-center group">
                    <div className="w-12 h-12 mx-auto mb-3 bg-green-50 rounded-full flex items-center justify-center group-hover:bg-green-100 transition-colors">
                      <Target className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Độ chính xác</p>
                    <p className="text-lg font-black text-gray-800">±15m</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 border border-green-100 shadow-sm hover:shadow-md transition-shadow text-center group">
                    <div className="w-12 h-12 mx-auto mb-3 bg-green-50 rounded-full flex items-center justify-center group-hover:bg-green-100 transition-colors">
                      <Satellite className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Vệ tinh</p>
                    <p className="text-lg font-black text-green-600">Đã kết nối</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 border border-green-100 shadow-sm hover:shadow-md transition-shadow text-center group">
                    <div className="w-12 h-12 mx-auto mb-3 bg-green-50 rounded-full flex items-center justify-center group-hover:bg-green-100 transition-colors">
                      <Activity className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Trạng thái</p>
                    <p className="text-lg font-black text-green-600">Ổn định</p>
                  </div>
                </div>

                {/* Processing / Success / Error States */}
                <AnimatePresence mode="wait">
                  {status === 'processing' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-white rounded-3xl shadow-sm border border-green-100 p-12 text-center"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="w-20 h-20 mx-auto mb-6 rounded-full border-4 border-green-100 border-t-green-500 shadow-lg shadow-green-100/50"
                      />
                      <h3 className="text-xl font-bold text-gray-800 mb-2">Đang xác minh vị trí...</h3>
                      <p className="text-sm text-gray-500">Hệ thống đang kiểm tra tọa độ an toàn</p>
                    </motion.div>
                  )}

                  {status === 'success' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-3xl shadow-sm border border-green-100 p-12 text-center"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", duration: 0.6 }}
                        className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-green-50 to-green-100 rounded-full flex items-center justify-center border-4 border-white shadow-xl shadow-green-100"
                      >
                        <CheckCircle2 className="h-14 w-14 text-green-500" />
                      </motion.div>
                      <h3 className="text-2xl font-black text-gray-800 mb-2">Điểm danh thành công!</h3>
                      <p className="text-gray-600 mb-4">{message}</p>
                      <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-medium mb-8 inline-block">
                        Vị trí hợp lệ trong phạm vi sự kiện
                      </div>
                      <Button
                        onClick={() => navigate('/')}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                      >
                        Về trang chủ
                      </Button>
                    </motion.div>
                  )}

                  {status === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-3xl shadow-sm border border-red-100 p-12 text-center"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", duration: 0.6 }}
                        className="w-28 h-28 mx-auto mb-6 bg-red-50 rounded-full flex items-center justify-center border-4 border-white shadow-lg shadow-red-100"
                      >
                        <AlertCircle className="h-14 w-14 text-red-500" />
                      </motion.div>
                      <h3 className="text-2xl font-black text-gray-800 mb-2">Ngoài vùng khả dụng</h3>
                      <p className="text-gray-600 mb-4">{message}</p>
                      <p className="text-sm text-red-500 mb-8 bg-red-50 p-3 rounded-lg inline-block">
                        Vui lòng di chuyển vào phạm vi sự kiện và thử lại
                      </p>
                      <Button
                        onClick={() => {
                          setStatus('idle');
                          setGpsStatus('ready');
                        }}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                      >
                        Cập nhật lại tọa độ
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* GPS Action Button */}
                {status === 'idle' && activeTab === 'gps' && (
                  <Button
                    onClick={handleGpsCheckin}
                    className="w-full py-5 text-lg rounded-2xl shadow-md bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold transition-all duration-300 transform hover:-translate-y-0.5"
                  >
                    <MapPin className="h-6 w-6 mr-2" />
                    XÁC NHẬN VỊ TRÍ & ĐIỂM DANH
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Info Box */}
        <div className="bg-white shadow-sm border-l-4 border-l-green-500 border border-green-100 rounded-2xl p-6 mt-6">
          <h4 className="font-bold text-gray-800 mb-3 flex items-center text-base">
            <div className="p-1.5 bg-green-50 rounded-lg mr-3">
              <AlertCircle className="h-5 w-5 text-green-600" />
            </div>
            Lưu ý kỹ thuật
          </h4>
          <ul className="text-sm text-gray-600 space-y-3 pl-2">
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 mr-2 flex-shrink-0" />
              Mã QR mã hóa động, tự động làm mới sau mỗi 15 giây để bảo mật dữ liệu.
            </li>
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 mr-2 flex-shrink-0" />
              Chế độ GPS yêu cầu thiết bị nằm trong bán kính 50m so với tâm sự kiện.
            </li>
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 mr-2 flex-shrink-0" />
              Đảm bảo cấp quyền truy cập Camera/Vị trí và duy trì kết nối mạng ổn định.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};