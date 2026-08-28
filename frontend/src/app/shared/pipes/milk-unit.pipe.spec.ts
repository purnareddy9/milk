import { MilkUnitPipe } from './milk-unit.pipe';

describe('MilkUnitPipe', () => {
  let pipe: MilkUnitPipe;

  beforeEach(() => {
    pipe = new MilkUnitPipe();
  });

  it('should transform milk packaging units into readable labels', () => {
    expect(pipe.transform('1L')).toBe('1 Liter');
    expect(pipe.transform('500ml')).toBe('500 ml');
    expect(pipe.transform('2L')).toBe('2 Liters');
    expect(pipe.transform('200g')).toBe('200 grams');
    expect(pipe.transform('1kg')).toBe('1 kg');
  });

  it('should handle empty or null values', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });
});
