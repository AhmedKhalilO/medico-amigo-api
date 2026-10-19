export type ScanResult = {
  name: string;
  dosage: string;
  form: string;
  quantity: string;
  expiry: string | null;
  confidence: number;
};

const DOSAGE_RE = /(\d+(?:[.,]\d+)?)\s?(mg|mcg|µg|g|ml)\b(?:\s?\/\s?\d+\s?ml)?/i;
const QTY_RE = /(\d+)\s?(comprimidos|comp\.?|cápsulas|capsulas|unidades|un\.?|saquetas|ml)\b/i;
const FORM_RE = /(comprimidos(?: revestidos)?|cápsulas|xarope|solução oral|pomada|gotas|saquetas)/i;
const EXPIRY_RE = /(?:val(?:idade)?\.?|exp\.?)\s*[:.]?\s*(\d{2}[\/.-]\d{2,4})/i;

/**
 * Extrait nom, dosage, forme, quantité et validité à partir des lignes de texte
 * lues sur une boîte (par l'OCR du téléphone).
 */
export function parsePackageText(lines: string[]): ScanResult {
  const text = lines.join('\n');
  const dosage = text.match(DOSAGE_RE)?.[0] ?? '—';
  const quantity = text.match(QTY_RE)?.[0] ?? '—';
  const formRaw = text.match(FORM_RE)?.[0] ?? '—';
  const expiry = text.match(EXPIRY_RE)?.[1] ?? null;

  const name =
    lines.find(
      (l) =>
        /[A-Za-zÀ-ÿ]{4,}/.test(l) && !DOSAGE_RE.test(l) && !QTY_RE.test(l) && !FORM_RE.test(l)
    ) ?? '—';

  const found = [name, dosage, formRaw, quantity].filter((v) => v !== '—').length;
  return {
    name,
    dosage,
    form: formRaw === '—' ? formRaw : formRaw.charAt(0).toUpperCase() + formRaw.slice(1),
    quantity,
    expiry,
    confidence: Math.round((found / 4) * 98),
  };
}