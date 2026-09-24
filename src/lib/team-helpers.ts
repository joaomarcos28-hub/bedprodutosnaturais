export function brlFmt(value: string | number | null | undefined): string {
  const n = typeof value === "string" ? parseFloat(value) : value ?? 0;
  return (n ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function startOfTodayISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function paymentLabel(m: string): string {
  return m === "pix" ? "PIX" : m === "dinheiro" ? "Dinheiro" : m === "cartao" ? "Cartão" : m;
}
