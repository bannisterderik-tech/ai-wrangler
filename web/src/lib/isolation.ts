export class IsolationError extends Error {
  status: number;
  constructor(message: string, status = 403) {
    super(message);
    this.name = "IsolationError";
    this.status = status;
  }
}

export function assertBound(
  customerId: string,
  kind: "vercel" | "github",
  resourceId: string,
  allow: string[],
) {
  if (!resourceId) throw new IsolationError(`${kind} resource id required`, 400);
  if (!allow.length) {
    throw new IsolationError(
      `no ${kind} resources bound to customer ${customerId} — bind one before a job can touch it`,
      409,
    );
  }
  if (!allow.includes(resourceId)) {
    throw new IsolationError(
      `refused: ${kind} ${resourceId} is not bound to customer ${customerId}. our github, their walls.`,
      403,
    );
  }
}
