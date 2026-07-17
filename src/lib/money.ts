/** Money formatting. Amounts are stored as integer euros in the mock data;
 *  switch to cents when a real backend lands. */

export function formatEUR(amount: number): string {
  const rounded = Math.round(amount);
  const s = String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${rounded < 0 ? '-' : ''}€${s}`;
}
