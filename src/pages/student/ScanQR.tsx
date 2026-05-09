import { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
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
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // QR Scanner Logic
  const startScanner = () => {
    setStatus('scanning');
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        "reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        false
      );

      scanner.render(onScanSuccess, onScanFailure);
      scannerRef.current = scanner;
    }, 100);
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
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
    }
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
        // Mock GPS checkin - would call checkinApi.gpsCheckin() in real impl
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
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  // Reset scanner when tab switches to QR
  useEffect(() => {
    if (activeTab === 'qr' && status === 'idle') {
      // Don't auto-start, wait for user action
    }
  }, [activeTab]);

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-500 hover:text-emerald-600 transition-colors mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          <span className="font-medium">Quay lại</span>
        </button>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-1">Điểm danh sự kiện</h1>
        <p className="text-gray-500 font-medium">Quét mã QR hoặc xác nhận vị trí để điểm danh</p>
      </div>

      {/* Tab Switcher */}
      <div className="bg-gray-100 rounded-2xl p-1 flex mb-6">
        <button
          onClick={() => { setActiveTab('qr'); setStatus('idle'); setMessage(''); }}
          className={`flex-1 flex items-center justify-center space-x-2 py-3.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'qr'
              ? 'bg-white text-emerald-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Camera className="h-4 w-4" />
          <span>Quét mã QR</span>
        </button>
        <button
          onClick={() => { setActiveTab('gps'); setStatus('idle'); setMessage(''); }}
          className={`flex-1 flex items-center justify-center space-x-2 py-3.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'gps'
              ? 'bg-white text-emerald-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <MapPin className="h-4 w-4" />
          <span>Điểm danh GPS</span>
        </button>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {activeTab === 'qr' && (
          <motion.div
            key="qr-mode"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Idle State */}
            {status === 'idle' && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="relative"
                >
                  {/* Scanner Frame */}
                  <div className="relative w-64 h-64 mx-auto mb-8">
                    {/* Outer Dark Frame */}
                    <div className="absolute inset-0 bg-gray-950 rounded-3xl shadow-2xl" />

                    {/* Target Brackets - 4 Corners */}
                    <div className="absolute inset-4">
                      {/* Top-left */}
                      <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-emerald-500 rounded-tl-lg" />
                      {/* Top-right */}
                      <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-emerald-500 rounded-tr-lg" />
                      {/* Bottom-left */}
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-emerald-500 rounded-bl-lg" />
                      {/* Bottom-right */}
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-emerald-500 rounded-br-lg" />
                    </div>

                    {/* Center Target */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-48 border-2 border-dashed border-emerald-500/30 rounded-2xl" />
                    </div>

                    {/* Laser Scanner Line */}
                    <motion.div
                      className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-lg shadow-emerald-500/50"
                      animate={{ y: [0, 250, 0] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    />

                    {/* Corner Glow Effects */}
                    <div className="absolute top-2 left-2 w-16 h-16 bg-emerald-500/10 blur-xl rounded-full" />
                    <div className="absolute bottom-2 right-2 w-16 h-16 bg-emerald-500/10 blur-xl rounded-full" />
                  </div>

                  {/* Caption */}
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    Hãy đưa mã QR vào vùng nhận diện để điểm danh nhanh chóng.
                  </p>
                </motion.div>

                <Button
                  onClick={startScanner}
                  className="w-full py-5 text-lg rounded-2xl shadow-lg shadow-emerald-100 bg-emerald-500 hover:bg-emerald-600 mt-6"
                >
                  <Scan className="h-5 w-5 mr-2" />
                  Bắt đầu quét mã
                </Button>
              </div>
            )}

            {/* Scanning State - Custom Scanner UI */}
            {status === 'scanning' && (
              <div className="bg-gray-950 rounded-3xl shadow-2xl overflow-hidden">
                <div className="relative aspect-square">
                  {/* Video Preview */}
                  <div id="reader" className="w-full h-full" />

                  {/* Overlay Frame */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Dark vignette */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/60" />

                    {/* Target Brackets */}
                    <div className="absolute inset-8">
                      <div className="absolute top-0 left-0 w-12 h-12 border-l-4 border-t-4 border-emerald-500 rounded-tl-2xl" />
                      <div className="absolute top-0 right-0 w-12 h-12 border-r-4 border-t-4 border-emerald-500 rounded-tr-2xl" />
                      <div className="absolute bottom-0 left-0 w-12 h-12 border-l-4 border-b-4 border-emerald-500 rounded-bl-2xl" />
                      <div className="absolute bottom-0 right-0 w-12 h-12 border-r-4 border-b-4 border-emerald-500 rounded-br-2xl" />
                    </div>

                    {/* Center Crosshair */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 flex items-center justify-center">
                        <div className="w-full h-0.5 bg-emerald-500/50" />
                        <div className="absolute w-0.5 h-full bg-emerald-500/50" />
                        <div className="absolute w-3 h-3 border-2 border-emerald-500 rounded-full" />
                      </div>
                    </div>

                    {/* Laser Scanner */}
                    <motion.div
                      className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-lg"
                      animate={{ y: [100, 300, 100] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    />

                    {/* Status Text */}
                    <div className="absolute bottom-8 left-0 right-0 text-center">
                      <p className="text-white font-medium text-sm bg-black/50 inline-block px-4 py-2 rounded-full">
                        Đang quét mã QR...
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Processing State */}
            {status === 'processing' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-20 h-20 mx-auto mb-6 rounded-full border-4 border-emerald-100 border-t-emerald-500"
                />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Đang đối soát dữ liệu...</h3>
                <p className="text-sm text-gray-500">Vui lòng chờ trong giây lát</p>
              </motion.div>
            )}

            {/* Success State */}
            {status === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.6 }}
                  className="w-28 h-28 mx-auto mb-6 bg-emerald-100 rounded-full flex items-center justify-center"
                >
                  <CheckCircle2 className="h-16 w-16 text-emerald-500" />
                </motion.div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Thành công!</h3>
                <p className="text-gray-600 mb-8">{message}</p>
                <Button
                  onClick={() => navigate('/')}
                  className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-100"
                >
                  Về trang chủ
                </Button>
              </motion.div>
            )}

            {/* Error State */}
            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.6 }}
                  className="w-28 h-28 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center"
                >
                  <AlertCircle className="h-16 w-16 text-red-600" />
                </motion.div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Thất bại</h3>
                <p className="text-gray-600 mb-8">{message}</p>
                <div className="space-y-3">
                  <Button
                    onClick={resetScanner}
                    className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-100"
                  >
                    Thử lại
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate(-1)}
                    className="w-full py-4 rounded-xl"
                  >
                    Hủy bỏ
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {activeTab === 'gps' && (
          <motion.div
            key="gps-mode"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Radar Display */}
            <div className="bg-gray-950 rounded-3xl shadow-xl overflow-hidden relative">
              <div className="aspect-square flex items-center justify-center">
                {/* Radar Rings */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Ring 3 - Outermost */}
                  <motion.div
                    className="absolute w-64 h-64 border-2 border-emerald-500/20 rounded-full"
                    animate={{ scale: [1, 1.2], opacity: [0.5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  {/* Ring 2 - Middle */}
                  <motion.div
                    className="absolute w-48 h-48 border-2 border-emerald-500/30 rounded-full"
                    animate={{ scale: [1, 1.2], opacity: [0.6, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                  />
                  {/* Ring 1 - Innermost */}
                  <motion.div
                    className="absolute w-32 h-32 border-2 border-emerald-500/50 rounded-full"
                    animate={{ scale: [1, 1.2], opacity: [0.8, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                  />
                </div>

                {/* Center Icon */}
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="relative z-10"
                >
                  <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/50">
                    <MapPin className="h-10 w-10 text-white" />
                  </div>
                </motion.div>

                {/* Scanning Lines */}
                <motion.div
                  className="absolute inset-0 border-2 border-emerald-500/0"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <div className="absolute top-0 left-1/2 w-0.5 h-20 bg-gradient-to-b from-emerald-500 to-transparent origin-bottom" />
                </motion.div>
              </div>

              {/* Overlay Status */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <p className="text-white text-center text-sm font-medium">
                  {gpsStatus === 'connecting' && 'Đang kết nối hệ thống vệ tinh...'}
                  {gpsStatus === 'ready' && 'Hệ thống sẵn sàng - Vùng sự kiện: ĐÃ PHÁT HIỆN'}
                  {gpsStatus === 'checking' && 'Đang xác minh vị trí...'}
                </p>
              </div>
            </div>

            {/* Technical Specs */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
                <div className="w-10 h-10 mx-auto mb-2 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <Target className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="text-xs text-gray-500 font-medium uppercase">Độ chính xác</p>
                <p className="text-lg font-black text-gray-900">±15m</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
                <div className="w-10 h-10 mx-auto mb-2 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <Satellite className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="text-xs text-gray-500 font-medium uppercase">Vệ tinh</p>
                <p className="text-lg font-black text-emerald-600">Đã kết nối</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
                <div className="w-10 h-10 mx-auto mb-2 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <Activity className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="text-xs text-gray-500 font-medium uppercase">Trạng thái</p>
                <p className="text-lg font-black text-emerald-600">Trong vùng</p>
              </div>
            </div>

            {/* Processing / Success / Error States */}
            <AnimatePresence mode="wait">
              {status === 'processing' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-20 h-20 mx-auto mb-6 rounded-full border-4 border-emerald-100 border-t-emerald-500"
                  />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Đang xác minh vị trí...</h3>
                  <p className="text-sm text-gray-500">Hệ thống đang kiểm tra tọa độ của bạn</p>
                </motion.div>
              )}

              {status === 'success' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.6 }}
                    className="w-28 h-28 mx-auto mb-6 bg-emerald-100 rounded-full flex items-center justify-center"
                  >
                    <CheckCircle2 className="h-16 w-16 text-emerald-500" />
                  </motion.div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">Điểm danh thành công!</h3>
                  <p className="text-gray-600 mb-6">{message}</p>
                  <p className="text-sm text-emerald-600 font-medium mb-4">Vị trí đã xác nhận trong phạm vi sự kiện</p>
                  <Button
                    onClick={() => navigate('/')}
                    className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-100"
                  >
                    Về trang chủ
                  </Button>
                </motion.div>
              )}

              {status === 'error' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.6 }}
                    className="w-28 h-28 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center"
                  >
                    <AlertCircle className="h-16 w-16 text-red-600" />
                  </motion.div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">Không thể xác minh</h3>
                  <p className="text-gray-600 mb-6">{message}</p>
                  <p className="text-sm text-red-500 mb-4">Vui lòng di chuyển vào phạm vi sự kiện và thử lại</p>
                  <Button
                    onClick={() => {
                      setStatus('idle');
                      setGpsStatus('ready');
                    }}
                    className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-100"
                  >
                    Thử lại
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* GPS Action Button */}
            {status === 'idle' && activeTab === 'gps' && (
              <Button
                onClick={handleGpsCheckin}
                className="w-full py-5 text-lg rounded-2xl shadow-lg shadow-emerald-100 bg-emerald-500 hover:bg-emerald-600 font-bold"
              >
                <MapPin className="h-6 w-6 mr-2" />
                XÁC NHẬN VỊ TRÍ & ĐIỂM DANH
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Box */}
      <div className="mt-8 p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
        <h4 className="font-bold text-emerald-900 mb-2 flex items-center">
          <AlertCircle className="h-4 w-4 mr-2" />
          Lưu ý quan trọng
        </h4>
        <ul className="text-xs text-emerald-800 space-y-2 list-disc pl-4">
          <li>Mã QR là mã động, sẽ thay đổi sau mỗi 15 giây để tránh gian lận.</li>
          <li>Điểm danh GPS yêu cầu bạn phải trong phạm vi 50m của sự kiện.</li>
          <li>Hãy đảm bảo kết nối mạng ổn định và bật GPS trên thiết bị.</li>
        </ul>
      </div>
    </div>
  );
};
