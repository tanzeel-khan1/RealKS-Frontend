export const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "INR", "PKR", "SAR"];

const CURRENCY_SYMBOLS = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  CAD: "CA$",
  AUD: "A$",
  INR: "₹",
  PKR: "₨",
  SAR: "SAR ",
};

export function getCurrencySymbol(currency) {
  return CURRENCY_SYMBOLS[currency] || (currency ? `${currency} ` : "$");
}

export function formatCurrency(value, currency = "USD", options) {
  const num = Number(value);
  const safe = Number.isFinite(num) ? num : 0;
  const symbol = getCurrencySymbol(currency);
  const formatted = Math.abs(safe).toLocaleString("en-US", options);
  return safe < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
}

export function formatCompactCurrency(value, currency = "USD") {
  const num = Number(value);
  const safe = Number.isFinite(num) ? num : 0;
  const symbol = getCurrencySymbol(currency);
  const formatted = `${Math.abs(safe) / 1000}k`;
  return safe < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
}
