import { moneyInputMessage } from "@retrosum/money";

/** Only application-owned, deliberately written guidance may use this type. */
export class UserFacingError extends RangeError {}

export function userFacingError(cause: unknown, fallback: string): string {
  return cause instanceof UserFacingError ? cause.message : moneyInputMessage(cause, fallback);
}
