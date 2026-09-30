import dns from "node:dns/promises";
import net from "node:net";

import ipaddr from "ipaddr.js";

import { AppError } from "../../lib/app-error.js";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata",
  "host.docker.internal",
]);

export async function validateMonitorUrl(rawUrl: string): Promise<URL> {
  let url: URL;

  try {
    url = new URL(rawUrl);
  } catch {
    throw new AppError("INVALID_MONITOR_URL", "Invalid monitor URL", 400);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new AppError(
      "INVALID_MONITOR_URL",
      "Only HTTP and HTTPS URLs are supported",
      400,
    );
  }

  if (url.username || url.password) {
    throw new AppError(
      "INVALID_MONITOR_URL",
      "Monitor URLs cannot contain credentials",
      400,
    );
  }

  if (url.hostname.length === 0) {
    throw new AppError(
      "INVALID_MONITOR_URL",
      "Monitor URL must contain a hostname",
      400,
    );
  }

  const hostname = url.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.has(hostname)) {
    throw new AppError(
      "UNSAFE_MONITOR_URL",
      "Monitor destination is not allowed",
      400,
    );
  }

  //Explicit IP address.
  if (net.isIP(hostname)) {
    if (isUnsafeIp(hostname)) {
      throw new AppError(
        "UNSAFE_MONITOR_URL",
        "Monitor destination is not allowed",
        400,
      );
    }

    return url;
  }

  //Domain name
  let addresses: Array<{
    address: string;
    family: number;
  }>;

  try {
    addresses = await dns.lookup(hostname, {
      all: true,
      verbatim: true,
    });
  } catch {
    throw new AppError(
      "MONITOR_DNS_ERROR",
      "Monitor hostname could not be resolved",
      400,
    );
  }

  if (addresses.length === 0) {
    throw new AppError(
      "MONITOR_DNS_ERROR",
      "Monitor hostname could not be resolved",
      400,
    );
  }

  for (const address of addresses) {
    if (isUnsafeIp(address.address)) {
      throw new AppError(
        "UNSAFE_MONITOR_URL",
        "Monitor destination resolves to a private or reserved network",
        400,
      );
    }
  }

  return url;
}

function isUnsafeIp(address: string): boolean {
  try {
    const parsed = ipaddr.process(address);

    /*
     * Only globally routable unicast
     * addresses are allowed.
     */
    return parsed.range() !== "unicast";
  } catch {
    return true;
  }
}
