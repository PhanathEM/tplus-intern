// Equipment/record column labels and status values often come straight from
// the backend (admin-typed per category), so the exact casing/spacing can
// drift from our locale keys (e.g. "Owner name" vs "Owner Name"). translateLabel
// falls back to a case/whitespace-insensitive match against the active
// language's resource bundle before giving up and showing the raw text.
function normalize(value) {
  return String(value).trim().toLowerCase().replace(/\s+/g, " ");
}

export function translateLabel(t, i18n, label) {
  if (!label) return label;

  const direct = t(label);
  if (direct !== label) return direct;

  const bundle = i18n.getResourceBundle(i18n.language, "translation");
  if (!bundle) return label;

  const target = normalize(label);
  const matchKey = Object.keys(bundle).find((key) => normalize(key) === target);
  return matchKey ? bundle[matchKey] : label;
}
