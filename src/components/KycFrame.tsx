import { Alert } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';

import { KycCallbacks, KYC_BASE_URL, loadKycScript, PUBLIC_KEY } from '../loader';

interface Props {
  flowId: string;
  hidden: boolean;
  callbacks: KycCallbacks;
}

// El iframe nunca se desmonta al ocultarlo: el wrapper se recorta a alto 0 con visibility:hidden.
// display:none se evita porque el iframe dejaría de tener layout y podría reportar alto 0 al volver.
export const KycFrame = ({ flowId, hidden, callbacks }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let instance: { destroy: () => void } | undefined;
    setError(null);
    loadKycScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.ConektaKYC) return;
        instance = window.ConektaKYC.init({
          config: { publicKey: PUBLIC_KEY, flowId, container: containerRef.current, locale: 'es' },
          callbacks: {
            onReady: () => callbacksRef.current.onReady?.(),
            onStepChange: (s) => callbacksRef.current.onStepChange?.(s),
            onComplete: (r) => callbacksRef.current.onComplete?.(r),
            onError: (e) => callbacksRef.current.onError?.(e),
          },
          options: { showIntro: false, autoResize: true },
        });
      })
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
      instance?.destroy();
    };
  }, [flowId]);

  return (
    <>
      {error && (
        <Alert color='red' title='No se pudo cargar el flujo de verificación'>
          {error}. Revisa VITE_KYC_BASE_URL ({KYC_BASE_URL}) y VITE_CONEKTA_PUBLIC_KEY.
        </Alert>
      )}
      <div
        style={{
          height: hidden ? 0 : 'auto',
          overflow: hidden ? 'hidden' : 'visible',
          visibility: hidden ? 'hidden' : 'visible',
        }}
      >
        <div ref={containerRef} />
      </div>
    </>
  );
};
