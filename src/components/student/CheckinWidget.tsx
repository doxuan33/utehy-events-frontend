import { QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

interface CheckinWidgetProps {
  className?: string;
}

export const CheckinWidget = ({ className }: CheckinWidgetProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 ${className || ''}`}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
          <QrCode className="h-5 w-5 text-emerald-600" />
        </div>
        <h3 className="font-bold text-gray-900">Check-in Sự kiện</h3>
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Vui lòng quét mã QR tại địa điểm sự kiện để điểm danh nhanh chóng.
      </p>

       <Link to="/checkin">
         <button className="w-full py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2">
           <QrCode className="h-5 w-5" />
           QUÉT MÃ ĐIỂM DANH
         </button>
       </Link>

      <p className="text-[10px] text-gray-400 text-center mt-2">
        GPS + DYNAMIC QR
      </p>
    </motion.div>
  );
};