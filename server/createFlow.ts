// Lógica pura de creación del flujo KYC (sin Vite ni red propia: el fetch se inyecta, así se puede probar).

export const CONEKTA_API_URL = 'https://api.stg.conekta.io/customers';

export class FlowError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = 'FlowError';
    this.status = status;
  }
}

export const buildCustomerBody = () => ({
  name: 'Pedro Ruix',
  email: 'alexis.ruiz@conekta.com',
  phone: '5528661416',
  payment_sources: [
    {
      type: 'direct_debit_recurrent',
      clabe: '012345678901234568',
      city: 'Ciudad de México',
      state: 'Test state',
      service_description: 'Seguro de auto · Plan Amplio',
      frequency: 'monthly',
      contract_date: '2025-11-12T00:00:00Z',
      max_amount: 15000,
      contract_type: 'domiciliation_simple',
    },
  ],
});

export const buildCreateCustomerRequest = (privateKey: string | undefined) => {
  if (!privateKey || !privateKey.trim()) {
    throw new FlowError('Falta CONEKTA_PRIVATE_KEY en el archivo .env (ver .env.example).', 500);
  }
  return {
    url: CONEKTA_API_URL,
    init: {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.conekta-v2.2.0+json',
        Authorization: `Bearer ${privateKey.trim()}`,
        'Content-type': 'application/json',
      },
      body: JSON.stringify(buildCustomerBody()),
    },
  };
};

interface ConektaErrorBody {
  details?: { message?: string; debug_message?: string }[];
  message?: string;
}

export const describeApiError = (status: number, body: unknown): string => {
  const error = (body ?? {}) as ConektaErrorBody;
  const details = Array.isArray(error.details)
    ? error.details.map((d) => d.message || d.debug_message).filter(Boolean)
    : [];
  const text = details.length ? details.join('; ') : error.message;
  return `La API de Conekta respondió ${status}${text ? `: ${text}` : ''}`;
};

interface CustomerResponse {
  payment_sources?: { data?: { kyc?: { id?: string }[] | null }[] };
}

// El flowId es el `id` del último elemento de payment_sources.data[0].kyc[].
export const extractFlowId = (body: unknown): string => {
  const source = (body as CustomerResponse | null)?.payment_sources?.data?.[0];
  if (!source || source.kyc === undefined) {
    throw new FlowError('La respuesta de Conekta no trae payment_sources.data[0].kyc.');
  }
  const { kyc } = source;
  if (kyc === null || (Array.isArray(kyc) && kyc.length === 0)) {
    throw new FlowError('El merchant no tiene pasos de KYC configurados (kyc viene vacío).', 422);
  }
  const id = Array.isArray(kyc) ? kyc[kyc.length - 1]?.id : undefined;
  if (!id) throw new FlowError('La respuesta de Conekta no trae el id del último paso de KYC.');
  return id;
};

export type FetchLike = (
  url: string,
  init: ReturnType<typeof buildCreateCustomerRequest>['init'],
) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

export const createFlow = async (privateKey: string | undefined, fetchImpl: FetchLike): Promise<{ flowId: string }> => {
  const { url, init } = buildCreateCustomerRequest(privateKey);
  let response;
  try {
    response = await fetchImpl(url, init);
  } catch (error) {
    throw new FlowError(`No se pudo contactar la API de Conekta: ${(error as Error).message}`);
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new FlowError(describeApiError(response.status, body));
  return { flowId: extractFlowId(body) };
};
