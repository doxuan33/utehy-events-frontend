import { motion } from 'motion/react';

export const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-4">
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"
        />
        <p className="text-sm font-medium text-gray-600 animate-pulse">
          Đang tải dữ liệu...
        </p>
      </div>
    </div>
  );
};
