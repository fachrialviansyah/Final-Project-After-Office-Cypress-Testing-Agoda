const pad = (n) => String(n).padStart(2, '0');

/**
 * Tomorrow relative to `now`, in the formats Agoda uses. Date arithmetic via setDate()
 * rolls over month/year ends (e.g. 31 Dec -> 1 Jan).
 */
function getTomorrow(now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return {
    iso: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, // calendar td[data-day], URL departDate
    shortLabel: `${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })}`, // results card: "17 Oct"
    longLabel: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }), // summary: "Sat, Oct 17, 2026"
  };
}

/** "9:05" / "09:05" -> 545 minutes. Throws on anything else so bad data fails loudly. */
function toMinutes(time) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(time).trim());
  if (!m) throw new Error(`Cannot parse time "${time}"`);
  return Number(m[1]) * 60 + Number(m[2]);
}

/** "9:05" -> "09:05" */
function normalizeTime(time) {
  const minutes = toMinutes(time);
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

/**
 * "Rp 2,657,937" -> { currency: 'Rp', amount: 2657937 }.
 * Agoda en-us formats amounts with "," thousands and "." decimals.
 */
function parseMoney(text) {
  const m = /([^\d\s.,-]+)?\s*(-?[\d,]+(?:\.\d+)?)/.exec(String(text || '').trim());
  if (!m) throw new Error(`Cannot parse price "${text}"`);
  return { currency: (m[1] || '').trim(), amount: Number(m[2].replace(/,/g, '')) };
}

/** "10h 15m" -> 615, "45m" -> 45. Unknown format sorts last. */
function durationMinutes(text) {
  const m = /^(?:(\d+)h)?\s*(?:(\d+)m)?$/.exec(String(text || '').trim());
  return m && (m[1] || m[2]) ? Number(m[1] || 0) * 60 + Number(m[2] || 0) : Infinity;
}

/** Earliest departure; ties broken by lowest price, then shortest duration, then list position. */
function pickEarliestFlight(flights) {
  if (!flights.length) throw new Error('No flights to choose from');
  return [...flights].sort(
    (a, b) =>
      toMinutes(a.departureTime) - toMinutes(b.departureTime) ||
      a.price.amount - b.price.amount ||
      durationMinutes(a.duration) - durationMinutes(b.duration) ||
      a.index - b.index,
  )[0];
}

module.exports = { getTomorrow, toMinutes, normalizeTime, parseMoney, durationMinutes, pickEarliestFlight };
