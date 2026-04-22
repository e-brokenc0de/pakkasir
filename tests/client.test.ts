import { describe, expect, it } from 'vitest';
import { PakasirClient } from '../src/client.js';
import { ValidationError } from '../src/errors/validation-error.js';
import { MockTransport } from './helpers/mock-transport.js';

describe('PakasirClient', () => {
  it('requires an API key', () => {
    expect(() => new PakasirClient({ project: 'p' })).toThrow(ValidationError);
  });

  it('requires a project', () => {
    expect(() => new PakasirClient({ apiKey: 'k' })).toThrow(ValidationError);
  });

  it('exposes each module when constructed with a mock transport', () => {
    const transport = new MockTransport();
    const client = new PakasirClient({
      apiKey: 'k',
      project: 'my-shop',
      transport,
    });
    expect(client.transactions).toBeDefined();
    expect(client.payments).toBeDefined();
    expect(client.webhooks).toBeDefined();
    expect(client.project).toBe('my-shop');
    expect(client.baseUrl).toBe('https://app.pakasir.com');
    expect(client.transport).toBe(transport);
  });

  it('respects a custom base URL', () => {
    const client = new PakasirClient({
      apiKey: 'k',
      project: 'p',
      baseUrl: 'https://sandbox.example.com/',
      transport: new MockTransport(),
    });
    expect(client.baseUrl).toBe('https://sandbox.example.com');
  });
});
