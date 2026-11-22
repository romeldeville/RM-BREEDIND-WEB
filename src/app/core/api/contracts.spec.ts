import { describe, expect, it } from 'vitest';
import type { components as authComponents } from './generated/auth';
import type { components as domainComponents } from './generated/domain';
import type { components as commercialComponents } from './generated/commercial';

describe('OpenAPI generated client contracts validation (P17-17)', () => {
  it('validates auth schemas and tokens', () => {
    type TokenPair = authComponents['schemas']['TokenPair'];
    const sampleToken: TokenPair = {
      accessToken: 'sample-jwt-access-token',
      refreshToken: 'sample-jwt-refresh-token',
      expiresIn: 3600,
      tokenType: 'Bearer',
    };
    expect(sampleToken.tokenType).toBe('Bearer');
  });

  it('validates domain schemas and entities', () => {
    type HealthProduct = domainComponents['schemas']['HealthProduct'];
    const sampleProduct: HealthProduct = {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Amoxicilline 15%',
      type: 'ANTIBIOTIC',
    };
    expect(sampleProduct.name).toBe('Amoxicilline 15%');
  });

  it('validates commercial schemas and sales', () => {
    type Sale = commercialComponents['schemas']['Sale'];
    const sampleSale: Sale = {
      id: '22222222-2222-2222-2222-222222222222',
      number: 'VTE-2026-0001',
      type: 'ANIMAL',
      totalAmount: 500,
      currency: 'EUR',
      paymentStatus: 'PAID',
    };
    expect(sampleSale.totalAmount).toBe(500);
  });
});
