/**
 * Next.js instrumentation — production-visible error capture hook.
 *
 * Implements `onRequestError` for structured observability without adding
 * third-party dependencies, network requests, or env-var requirements.
 * Works alongside the existing React error boundary on the client.
 *
 * Reference: Next.js `Instrumentation.onRequestError` type.
 */
import type { Instrumentation } from "next";

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  errorRequest,
  errorContext,
) => {
  const payload = {
    kind: "onRequestError" as const,
    route: errorContext.routePath,
    path: errorRequest.path,
    method: errorRequest.method,
    routerKind: errorContext.routerKind,
    routeType: errorContext.routeType,
    renderSource: errorContext.renderSource,
    digest: (error as { digest?: string }).digest,
    timestamp: new Date().toISOString(),
  };

  // Structured log for production error capture — ingested by platform
  // observability (e.g. Datadog, CloudWatch, Vercel Logs, etc.).
  console.error("[pre-utn:request-error]", JSON.stringify(payload));
};
