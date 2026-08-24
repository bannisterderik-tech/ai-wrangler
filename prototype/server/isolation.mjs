export class IsolationError extends Error {
  constructor(message, status = 403) {
    super(message);
    this.name = 'IsolationError';
    this.status = status;
  }
}

/** Every Vercel call for a customer must pass through here. Never trust a projectId from the UI. */
export function assertBoundProject(customer, projectId) {
  if (!customer) throw new IsolationError('unknown customer', 404);
  if (!customer.vercel?.connected) throw new IsolationError('vercel is not connected for this customer', 409);
  if (!projectId) throw new IsolationError('projectId required', 400);
  const allowed = new Set(customer.boundProjectIds || []);
  if (!allowed.size) {
    throw new IsolationError('no projects bound — pick the projects this customer owns before deploying', 409);
  }
  if (!allowed.has(projectId)) {
    throw new IsolationError(
      `refused: project ${projectId} is not bound to customer ${customer.id}. tokens never cross customers.`,
      403,
    );
  }
}

export function workspacePath(customerId, projectId) {
  // Isolated checkout root: workspaces/<customer>/<project>/
  return ['workspaces', customerId, projectId];
}

export function tenantQuery(teamId, extra = {}) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(extra)) {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  }
  if (teamId) q.set('teamId', teamId);
  return q;
}
