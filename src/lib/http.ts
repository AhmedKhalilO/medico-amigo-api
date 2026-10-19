import { unstable_rethrow } from 'next/navigation';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
  }
}

/** Enveloppe un handler : transforme ApiError / erreurs inattendues en réponses JSON propres. */
export function route<C = unknown>(
  handler: (req: Request, ctx: C) => Promise<Response>
): (req: Request, ctx: C) => Promise<Response> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (e) {
      // Laisse passer les erreurs internes de Next.js (interruption du pré-rendu, etc.)
      unstable_rethrow(e);
      if (e instanceof ApiError) {
        return NextResponse.json(
          { error: { code: e.code, message: e.message, details: e.details } },
          { status: e.status }
        );
      }
      console.error('[api] erreur inattendue', e);
      return NextResponse.json(
        { error: { code: 'INTERNAL', message: 'Erro interno do servidor.' } },
        { status: 500 }
      );
    }
  };
}

/** Lit et valide le corps JSON. */
export async function parseBody<T extends z.ZodType>(req: Request, schema: T): Promise<z.infer<T>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiError(400, 'INVALID_JSON', 'Corpo do pedido inválido.');
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new ApiError(
      422,
      'VALIDATION',
      'Dados inválidos.',
      result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }))
    );
  }
  return result.data;
}

export const ok = <T>(data: T, status = 200) => NextResponse.json(data, { status });