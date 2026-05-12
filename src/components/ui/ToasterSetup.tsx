import { Toaster as SonnerToaster, toast } from 'sonner';
import { type ReactNode } from 'react';

interface ToasterSetupProps {
  children?: ReactNode;
}

export const ToasterSetup = ({ children }: ToasterSetupProps) => {
  return (
    <>
      <SonnerToaster
        theme="light"
        position="top-right"
        richColors // Thuộc tính này sẽ tự động lo phần màu sắc gradient chuẩn cho success/error/info
        closeButton
        duration={4000}
        className="toaster-container"
        toastOptions={{
          style: {
            background: 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            padding: '16px',
            fontSize: '14px',
            maxWidth: '420px',
          },
        }}
      />
      {children}
    </>
  );
};

export { toast };