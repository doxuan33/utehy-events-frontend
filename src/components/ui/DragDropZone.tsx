import { useState, useCallback } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { FileSpreadsheet, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

interface DragDropZoneProps {
  onFileSelect: (file: File | null) => void;
  selectedFile?: File | null;
  onClear?: () => void;
  disabled?: boolean;
}

export const DragDropZone = ({
  onFileSelect,
  selectedFile,
  onClear,
  disabled = false,
}: DragDropZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const controls = useAnimation();

  const handleDrag = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
    },
    []
  );

  const handleDragIn = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      controls.start({
        scale: 1.02,
        transition: { type: 'spring', stiffness: 300, damping: 20 },
      });
    },
    [controls]
  );

  const handleDragOut = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      controls.start({
        scale: 1,
        transition: { type: 'spring', stiffness: 300, damping: 20 },
      });
    },
    [controls]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      controls.start({ scale: 1 });

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (!file.type.includes('excel') && !file.type.includes('sheet') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
          toast.error('Vui lòng tải lên file Excel (.xlsx hoặc .xls)');
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error('File quá lớn. Giới hạn 5MB');
          return;
        }
        onFileSelect(file);
      }
    },
    [controls, onFileSelect]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (!file.type.includes('excel') && !file.type.includes('sheet') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast.error('Vui lòng tải lên file Excel (.xlsx hoặc .xls)');
        e.target.value = '';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File quá lớn. Giới hạn 5MB');
        e.target.value = '';
        return;
      }
      onFileSelect(file);
    } else {
      onFileSelect(null);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClear?.();
    onFileSelect(null);
  };

  return (
    <motion.div
      animate={controls}
      className={`relative rounded-3xl overflow-hidden ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onDragEnter={disabled ? undefined : handleDragIn}
      onDragLeave={disabled ? undefined : handleDragOut}
      onDragOver={disabled ? undefined : handleDrag}
      onDrop={disabled ? undefined : handleDrop}
    >
      {/* Animated gradient border when dragging */}
      <motion.div
        animate={{
          background: isDragging
            ? 'linear-gradient(135deg, #facc15 0%, #10b981 50%, #3b82f6 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%)',
          boxShadow: isDragging
            ? '0 0 20px rgba(250, 204, 21, 0.5), 0 0 40px rgba(16, 185, 129, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.2)'
            : '0 8px 32px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.2)',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="absolute inset-0 rounded-3xl"
      />

      {/* Inner glassmorphism area */}
      <div className="relative z-10 bg-white/60 backdrop-blur-xl border border-white/20 rounded-3xl p-8 min-h-[200px] flex flex-col items-center justify-center space-y-4">
        {!selectedFile ? (
          <>
            <motion.div
              animate={isDragging ? { scale: 1.2, rotate: [0, -10, 10, -10, 0] } : { scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400/20 via-emerald-400/20 to-blue-500/20 flex items-center justify-center"
            >
              <FileSpreadsheet className="h-8 w-8 text-yellow-500" />
            </motion.div>
            <div className="text-center space-y-2">
              <p className="text-lg font-black text-gray-900">Kéo thả file Excel vào đây</p>
              <p className="text-sm font-bold text-gray-500">hoặc click để chọn file</p>
            </div>
            <p className="text-xs font-bold text-gray-400">Chỉ chấp nhận file .xlsx hoặc .xls (Tối đa 5MB)</p>
          </>
        ) : (
          <div className="w-full space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400/20 via-emerald-400/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-gray-900 truncate">{selectedFile.name}</p>
                <p className="text-xs font-bold text-gray-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClear}
                className="p-2 hover:bg-red-50 rounded-xl transition-colors flex-shrink-0"
              >
                <X className="h-5 w-5 text-red-500" />
              </motion.button>
            </div>
            <p className="text-xs font-bold text-gray-400 text-center">Kéo thả file khác để thay thế</p>
          </div>
        )}
      </div>

      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        disabled={disabled}
        onClick={(e) => {
          if (disabled) {
            e.stopPropagation();
            e.preventDefault();
          }
        }}
      />
    </motion.div>
  );
};

export default DragDropZone;