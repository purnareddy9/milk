import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'milkUnit',
  standalone: true,
})
export class MilkUnitPipe implements PipeTransform {
  transform(unit: string | null | undefined): string {
    if (!unit) return '';
    const u = unit.toLowerCase().trim();
    if (u === '1l' || u === '1 l') return '1 Liter';
    if (u === '500ml') return '500 ml';
    if (u === '2l') return '2 Liters';
    if (u === '200g') return '200 grams';
    if (u === '400g') return '400 grams';
    if (u === '500g') return '500 grams';
    if (u === '1kg') return '1 kg';
    return unit;
  }
}
