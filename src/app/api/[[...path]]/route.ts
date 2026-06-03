import { handleApi } from '../../../lib/api-handler';

type RouteContext = { params: Promise<{ path?: string[] }> };

async function dispatch(request: Request, context: RouteContext): Promise<Response> {
  const { path = [] } = await context.params;
  return handleApi(request, path);
}

export const GET = dispatch;
export const POST = dispatch;
export const PUT = dispatch;
export const PATCH = dispatch;
export const DELETE = dispatch;
