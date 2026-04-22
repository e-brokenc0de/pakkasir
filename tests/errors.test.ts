import { describe, expect, it } from 'vitest';
import {
  ApiError,
  NetworkError,
  PakasirError,
  ValidationError,
  WebhookVerificationError,
} from '../src/errors/index.js';

describe('Error hierarchy', () => {
  it('each subclass sets a distinct `kind` discriminant', () => {
    const api = new ApiError('x', {
      status: 400,
      statusText: 'Bad',
      body: null,
      rawBody: '',
      method: 'GET',
      url: 'https://x',
    });
    const net = new NetworkError('x', { url: 'https://x', method: 'GET' });
    const val = new ValidationError('x');
    const wh = new WebhookVerificationError('x', { rawBody: '{}' });

    expect(api.kind).toBe('api');
    expect(net.kind).toBe('network');
    expect(val.kind).toBe('validation');
    expect(wh.kind).toBe('webhook');
  });

  it('every subclass is an instance of PakasirError', () => {
    const api = new ApiError('x', {
      status: 500,
      statusText: '',
      body: null,
      rawBody: '',
      method: 'POST',
      url: 'https://x',
    });
    expect(api).toBeInstanceOf(PakasirError);
    expect(api).toBeInstanceOf(Error);
  });

  it('ApiError classifies client vs server errors', () => {
    const err = new ApiError('x', {
      status: 422,
      statusText: '',
      body: null,
      rawBody: '',
      method: 'POST',
      url: 'https://x',
    });
    expect(err.isClientError).toBe(true);
    expect(err.isServerError).toBe(false);
  });

  it('NetworkError preserves the cause when provided', () => {
    const cause = new Error('DNS failure');
    const err = new NetworkError('x', {
      url: 'https://x',
      method: 'GET',
      cause,
    });
    expect((err as Error & { cause?: unknown }).cause).toBe(cause);
  });
});
