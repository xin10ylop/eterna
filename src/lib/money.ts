/** Money formatting. Amounts are whole AED (dirhams) in the mock data;
 *  switch to fils when a real backend lands. */

export function formatAED(amount: number): string {
  const rounded = Math.round(amount);
  const s = String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${rounded < 0 ? '-' : ''}AED ${s}`;
}
