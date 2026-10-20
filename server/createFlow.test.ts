import type { IncomingMessage, ServerResponse } from 'node:http';
import { describe, expect, it, vi } from 'vitest';

import { buildCreateCustomerRequest, createFlow, extractFlowId, FlowError } from './createFlow';
import { configScript, createFlowHandler } from './handlers';

const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body });
const withKyc = (kyc: unknown) => ({ payment_sources: { data: [{ kyc }] } });

// Llama al handler con un request/response mínimos y regresa lo que respondió.
const call = async (method: string, fetchImpl = vi.fn(), privateKey = 'key_secret') => {
  const headers: Record<string, string> = {};
  const res = { statusCode: 0, body: '' };
  const fakeRes = Object.assign(res, {
    setHeader: (name: string, value: string) => (headers[name] = value),
    end: (chunk: string) => (res.body = chunk),
  });
  await createFlowHandler({ CONEKTA_PRIVATE_KEY: privateKey }, fetchImpl)({ method } as IncomingMessage, fakeRes as unknown as ServerResponse);
  return { status: res.statusCode, headers, json: JSON.parse(res.body) };
};

describe('createFlow', () => {
  it('arma el request con headers y body esperados', () => {
    const { url, init } = buildCreateCustomerRequest('key_secret');
    expect(url).toBe('https://api.stg.conekta.io/customers');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer key_secret');
    expect(init.headers.Accept).toBe('application/vnd.conekta-v2.2.0+json');
    expect(JSON.parse(init.body).payment_sources[0].service_description).toBe('Seguro de auto · Plan Amplio');
  });

  it('usa CONEKTA_API_URL si viene, con o sin / final', () => {
    expect(buildCreateCustomerRequest('k', 'https://api.uat.conekta.com/').url).toBe('https://api.uat.conekta.com/customers');
    expect(buildCreateCustomerRequest('k', '').url).toBe('https://api.stg.conekta.io/customers');
  });

  it('falla sin llave privada', () => {
    expect(() => buildCreateCustomerRequest('')).toThrow(/CONEKTA_PRIVATE_KEY/);
  });

  it('regresa el id del último kyc', async () => {
    const body = withKyc([{ id: 'a' }, { id: 'b' }]);
    expect(await createFlow('k', vi.fn().mockResolvedValue(ok(body)))).toEqual({ flowId: 'b' });
  });

  it.each([null, []])('kyc %j da error claro con 422', (kyc) => {
    expect(() => extractFlowId(withKyc(kyc))).toThrow(/no tiene pasos de KYC configurados/);
  });

  it('una respuesta sin payment_sources no se confunde con un merchant sin KYC', () => {
    expect(() => extractFlowId({})).toThrow(/no trae payment_sources/);
  });

  it('propaga el error de la API', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ details: [{ message: 'Acceso no autorizado' }] }),
    });
    await expect(createFlow('k', fetchImpl)).rejects.toThrow(/401.*Acceso no autorizado/);
  });

  it('error de red', async () => {
    const err = createFlow('k', vi.fn().mockRejectedValue(new Error('boom')));
    await expect(err).rejects.toBeInstanceOf(FlowError);
  });
});

describe('POST /api/create-flow', () => {
  it('solo acepta POST y no llama a la API con otros métodos', async () => {
    const fetchImpl = vi.fn();
    const { status, headers } = await call('GET', fetchImpl);
    expect(status).toBe(405);
    expect(headers.Allow).toBe('POST');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('responde el flowId', async () => {
    const { status, json } = await call('POST', vi.fn().mockResolvedValue(ok(withKyc([{ id: 'flow-1' }]))));
    expect(status).toBe(200);
    expect(json).toEqual({ flowId: 'flow-1' });
  });

  it('responde 422 con el mensaje si el merchant no tiene KYC', async () => {
    const { status, json } = await call('POST', vi.fn().mockResolvedValue(ok(withKyc(null))));
    expect(status).toBe(422);
    expect(json.error).toMatch(/no tiene pasos de KYC configurados/);
  });

  it('responde 500 si falta la llave privada', async () => {
    const { status, json } = await call('POST', vi.fn(), '');
    expect(status).toBe(500);
    expect(json.error).toMatch(/CONEKTA_PRIVATE_KEY/);
  });
});

describe('GET /config.js', () => {
  it('expone solo la configuración pública', () => {
    const script = configScript({ CONEKTA_PUBLIC_KEY: 'key_pub', KYC_BASE_URL: 'https://kyc.x', CONEKTA_PRIVATE_KEY: 'key_secret' });
    expect(script).toBe('window.__KYC_DEMO__ = {"publicKey":"key_pub","kycBaseUrl":"https://kyc.x"};');
  });
});
