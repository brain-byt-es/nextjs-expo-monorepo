import { NextResponse } from 'next/server';
import { getSessionAndOrg } from '@/app/api/_helpers/auth';
import { getOpenApiSpec } from '@/lib/openapi';

export async function GET(request: Request) {
  const result = await getSessionAndOrg(request);
  if (result.error) return result.error;

  const spec = getOpenApiSpec();
  return NextResponse.json(spec);
}
