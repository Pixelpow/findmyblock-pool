// src/components/Toast.js
import React, { useState, useEffect } from 'react';

const Toast = ({ toast, onRemove }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const startFadingOut = () => {
      setIsFadingOut(true);
      // Attendre la fin de l'animation de fade-out pour supprimer le toast
      setTimeout(() => onRemove(toast.id), 500);
    };

    const timer = setTimeout(startFadingOut, 4000); // Le toast disparaît après 4 secondes

    return () => clearTimeout(timer);
  }, [toast.id, onRemove]); // Dépendre de l'ID unique du toast

  return (
    <div className={`toast-notification ${isFadingOut ? 'fade-out' : 'fade-in'}`}>
      <img src={toast.image} alt="Achievement" className="w-10 h-10 rounded-md mr-3" />
      <div>
        <p className="font-bold text-amber-400">{toast.title}</p>
        <p className="text-sm text-gray-300">{toast.message}</p>
      </div>
    </div>
  );
};

export const ToastContainer = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};
