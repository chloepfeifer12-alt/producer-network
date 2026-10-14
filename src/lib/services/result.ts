export type Result<T = void> = { ok: true; data: T } | { ok: false; error: string };

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/** Runs a command and converts thrown errors into a Result for the UI. */
export function attempt<T>(fn: () => T): Result<T> {
  try {
    return { ok: true, data: fn() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export function invariant(cond: unknown, message: string): asserts cond {
  if (!cond) throw new ValidationError(message);
}
