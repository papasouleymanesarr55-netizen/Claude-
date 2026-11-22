import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

interface ShellState {
  vehiclePanelOpen: boolean;
  setVehiclePanelOpen: (open: boolean) => void;
}

const Ctx = createContext<ShellState>({ vehiclePanelOpen: false, setVehiclePanelOpen: () => {} });

/** État d'interface partagé entre la barre supérieure et les pages. */
export function ShellStateProvider({ children }: { children: ReactNode }) {
  const [vehiclePanelOpen, setVehiclePanelOpen] = useState(false);
  const value = useMemo(() => ({ vehiclePanelOpen, setVehiclePanelOpen }), [vehiclePanelOpen]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useShellState() {
  return useContext(Ctx);
}
