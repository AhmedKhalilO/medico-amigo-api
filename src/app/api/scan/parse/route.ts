import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { ok, parseBody, route } from '@/lib/http';
import { parsePackageText } from '@/lib/ocr';

const schema = z.object({
  lines: z.array(z.string().trim().min(1).max(200)).min(1).max(60),
});

/** Reçoit les lignes de texte lues par l'OCR du téléphone et renvoie les champs structurés. */
export const POST = route(async (req) => {
  await requireUser(req);
  const { lines } = await parseBody(req, schema);
  return ok({ result: parsePackageText(lines) });
});