export interface KycCallbacks {
  onReady?: () => void;
  onStepChange?: (step: { index: number; total: number; type: string }) => void;
  onComplete?: (result: { status: 'approved' | 'rejected' }) => void;
  onError?: (error: { code: string; message: string }) => void;
}

interface KycInitParams {
  config: { publicKey: string; flowId: string; container: HTMLElement | string; locale?: 'es' | 'en' };
  callbacks?: KycCallbacks;
  options?: { showIntro?: boolean; autoResize?: boolean };
}

declare global {
  interface Window {
    ConektaKYC?: { init: (params: KycInitParams) => { destroy: () => void } };
  }
}

export const KYC_BASE_URL = (import.meta.env.VITE_KYC_BASE_URL || 'https://kyc.stg.conekta.io').replace(/\/$/, '');
export const PUBLIC_KEY = import.meta.env.VITE_CONEKTA_PUBLIC_KEY || '';
const SCRIPT_URL = `${KYC_BASE_URL}/v1.0/js/conekta-kyc.min.js`;

let scriptPromise: Promise<void> | null = null;

// Inyecta el <script> clásico (no módulo: el loader lee document.currentScript) una sola vez.
export const loadKycScript = (): Promise<void> => {
  if (window.ConektaKYC) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SCRIPT_URL;
      script.onload = () =>
        window.ConektaKYC ? resolve() : reject(new Error('El script cargó pero no definió ConektaKYC.'));
      script.onerror = () => reject(new Error(`No se pudo cargar ${SCRIPT_URL}`));
      document.head.appendChild(script);
    }).catch((error) => {
      scriptPromise = null; // permite reintentar
      document.querySelector(`script[src="${SCRIPT_URL}"]`)?.remove();
      throw error;
    });
  }
  return scriptPromise;
};
