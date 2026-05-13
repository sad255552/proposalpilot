export type SupabaseMaybeError = {
  code?: string;
  message?: string;
  details?: string;
};

export function isMissingTable(error: SupabaseMaybeError | null | undefined) {
  const message = `${error?.code || ""} ${error?.message || ""} ${error?.details || ""}`.toLowerCase();
  return message.includes("42p01") || message.includes("pgrst205") || message.includes("could not find the table") || message.includes("does not exist");
}

export function isMissingColumn(error: SupabaseMaybeError | null | undefined) {
  const message = `${error?.code || ""} ${error?.message || ""} ${error?.details || ""}`.toLowerCase();
  return message.includes("42703") || message.includes("column") || message.includes("schema cache");
}

export function errorMessage(error: unknown, fallback = "Unknown error.") {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message?: unknown }).message || fallback);
  }
  return fallback;
}
