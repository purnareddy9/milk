import { InrCurrencyPipe } from './inr-currency.pipe';

describe('InrCurrencyPipe', () => {
  let pipe: InrCurrencyPipe;

  beforeEach(() => {
    pipe = new InrCurrencyPipe();
  });

  it('should format numbers with Indian Rupee symbol', () => {
    expect(pipe.transform(58)).toBe('₹58');
    expect(pipe.transform(1740)).toBe('₹1,740');
    expect(pipe.transform(194880)).toBe('₹1,94,880');
  });

  it('should handle zero, null, and undefined safely', () => {
    expect(pipe.transform(0)).toBe('₹0');
    expect(pipe.transform(null)).toBe('₹0');
    expect(pipe.transform(undefined)).toBe('₹0');
    expect(pipe.transform('')).toBe('₹0');
  });
});
