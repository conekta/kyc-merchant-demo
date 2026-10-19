import { Alert, Anchor, Box, Group, Skeleton, Stack, Text } from '@mantine/core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { CollapsedBar } from './components/CollapsedBar';
import { EventsPanel, KycEvent } from './components/EventsPanel';
import { KycFrame } from './components/KycFrame';
import { OrderSummary } from './components/OrderSummary';
import { Method, PaymentMethods } from './components/PaymentMethods';
import { KycCallbacks } from './loader';
import { getParam, setParam } from './query';

const pad = (n: number) => String(n).padStart(2, '0');
const now = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const debug = getParam('debug') === 'true';

export const App = () => {
  const [flowId, setFlowId] = useState<string | null>(() => getParam('flow'));
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<Method>('direct_debit');
  const [collapsed, setCollapsed] = useState(false);
  const [events, setEvents] = useState<KycEvent[]>([]);
  const creating = useRef(false); // evita crear dos customers con StrictMode

  const createFlow = useCallback(async () => {
    if (creating.current) return;
    creating.current = true;
    setError(null);
    try {
      const response = await fetch('/api/create-flow', { method: 'POST' });
      const body: { flowId?: string; error?: string } = await response.json().catch(() => ({}));
      if (!response.ok || !body.flowId) throw new Error(body.error || `Error ${response.status} al crear el flujo`);
      setParam('flow', body.flowId);
      setFlowId(body.flowId);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      creating.current = false;
    }
  }, []);

  useEffect(() => {
    if (!flowId) createFlow();
  }, [flowId, createFlow]);

  const newFlow = () => {
    setParam('flow', null);
    setFlowId(null);
    setCollapsed(false);
    setMethod('direct_debit');
    setEvents([]);
  };

  const callbacks = useMemo<KycCallbacks>(() => {
    const log = (name: string, payload?: unknown) => setEvents((prev) => [...prev, { time: now(), name, payload }]);
    return {
      onReady: () => log('onReady'),
      onStepChange: (step) => {
        log('onStepChange', step);
        if (step.index >= 2) setCollapsed(true);
      },
      onComplete: (result) => log('onComplete', result),
      onError: (err) => log('onError', err),
    };
  }, []);

  const showKyc = method === 'direct_debit';

  // "Nuevo flujo" y el panel de eventos son controles del presentador: van fuera del checkout del merchant.
  return (
    <Box bg='neutral.0' mih='100vh' px='lg' style={{ paddingBlock: 32 }}>
      <Stack gap='sm' maw={1000} mx='auto'>
        <Group justify='flex-end'>
          <Anchor size='xs' component='button' type='button' onClick={newFlow}>
            Nuevo flujo
          </Anchor>
        </Group>
        <Box
          bg='#fff'
          style={{ border: '1px solid var(--mantine-color-neutral-3)', borderRadius: 12, overflow: 'hidden' }}
        >
          <Group wrap='nowrap' align='stretch' gap={0} mih={640}>
            <OrderSummary />
            <Stack gap='md' p='xl' style={{ flex: 1, minWidth: 0 }}>
              {collapsed && showKyc ? (
                <CollapsedBar onChange={() => setCollapsed(false)} />
              ) : (
                <>
                  <Text fw={600}>Método de pago</Text>
                  <PaymentMethods method={method} onChange={setMethod} />
                </>
              )}
              {!showKyc && (
                <Text size='sm' c='neutral.5' ta='center' py='xl'>
                  No disponible en esta demo
                </Text>
              )}
              {error && (
                <Alert color='red' title='No se pudo crear el flujo'>
                  {error}{' '}
                  <Anchor component='button' type='button' size='sm' onClick={createFlow}>
                    Reintentar
                  </Anchor>
                </Alert>
              )}
              {!flowId && !error && showKyc && <Skeleton h={480} radius='md' />}
              {flowId && <KycFrame flowId={flowId} hidden={!showKyc} callbacks={callbacks} />}
            </Stack>
          </Group>
        </Box>
        {debug && <EventsPanel events={events} />}
      </Stack>
    </Box>
  );
};
