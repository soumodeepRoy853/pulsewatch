export interface HttpCheckResult {
  status: "SUCCESS" | "FAILURE";

  statusCode: number | null;

  responseTimeMs: number | null;

  errorType:
    | "HTTP_ERROR"
    | "TIMEOUT"
    | "DNS_ERROR"
    | "TLS_ERROR"
    | "NETWORK_ERROR"
    | null;

  errorMessage: string | null;
}

export async function checkHttpEndpoint(
  url: string,
  method: "GET" | "HEAD",
  timeoutMs: number,
  expectedStatus: number,
): Promise<HttpCheckResult> {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  const start = performance.now();

  try {
    const response = await fetch(url, {
      method,

      signal: controller.signal,

      redirect: "manual",
    });

    const responseTimeMs = Math.round(performance.now() - start);

    if (response.status === expectedStatus) {
      return {
        status: "SUCCESS",
        statusCode: response.status,
        responseTimeMs,
        errorType: null,
        errorMessage: null,
      };
    }

    return {
      status: "FAILURE",
      statusCode: response.status,
      responseTimeMs,
      errorType: "HTTP_ERROR",
      errorMessage: `Expected ${expectedStatus}, received ${response.status}`,
    };
  } catch (error) {
    const responseTimeMs = Math.round(performance.now() - start);

    if (error instanceof DOMException && error.name === "AbortError") {
      return {
        status: "FAILURE",
        statusCode: null,
        responseTimeMs,
        errorType: "TIMEOUT",
        errorMessage: "Request timed out",
      };
    }

    const message =
      error instanceof Error ? error.message : "Unknown network error";

    return {
      status: "FAILURE",
      statusCode: null,
      responseTimeMs,
      errorType: classifyNetworkError(message),
      errorMessage: message,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function classifyNetworkError(message: string): HttpCheckResult["errorType"] {
  const normalized = message.toLowerCase();

  if (normalized.includes("dns") || normalized.includes("enotfound")) {
    return "DNS_ERROR";
  }

  if (
    normalized.includes("certificate") ||
    normalized.includes("tls") ||
    normalized.includes("ssl")
  ) {
    return "TLS_ERROR";
  }

  return "NETWORK_ERROR";
}
