export function logInfo(message: string, data?: unknown) {
  console.info(`[INFO] ${message}`, data ?? "");
}

export function logError(message: string, error?: unknown) {
  console.error(`[ERROR] ${message}`, error ?? "");
}

export function logDebug(message: string, data?: unknown) {
  if (process.env.NODE_ENV === "development") {
    console.debug(`[DEBUG] ${message}`, data ?? "");
  }
}
