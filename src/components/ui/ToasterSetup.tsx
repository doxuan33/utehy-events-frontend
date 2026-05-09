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
        richColors
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
          success: {
            style: {
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(59, 130, 246, 0.15))',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderLeft: '4px solid #22c55e',
            },
            iconTheme: {
              primary: '#22c55e',
              secondary: '#dcfce7',
            },
          },
          error: {
            style: {
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(249, 115, 22, 0.1))',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              borderLeft: '4px solid #f59e0b',
            },
            iconTheme: {
              primary: '#f59e0b',
              secondary: '#fef3c7',
            },
          },
          warning: {
            style: {
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(249, 115, 22, 0.1))',
              border: '1px solid rgba(251, 191, 36, 0.3)',
            },
          },
          info: {
            style: {
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(99, 102, 241, 0.1))',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            },
          },
        }}
      />
      {children}
    </>
  );
};

export { toast };