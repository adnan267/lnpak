import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import ConsultationModal from '../components/ConsultationModal';

const ConsultationContext = createContext(null);

/** Lets any button on the site open the Free Consultation popup:  const { open } = useConsultation(); */
export function ConsultationProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const value = useMemo(() => ({ open, close, isOpen }), [open, close, isOpen]);

  return (
    <ConsultationContext.Provider value={value}>
      {children}
      {isOpen && <ConsultationModal onClose={close} />}
    </ConsultationContext.Provider>
  );
}

export function useConsultation() {
  return useContext(ConsultationContext);
}
