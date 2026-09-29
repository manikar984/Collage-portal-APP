import { getStore } from "./store";

/**
 * Production worker: a BullMQ Worker on the `payments` queue.
 * Job id is the gateway reference, so a replayed webhook cannot settle twice.
 * The HTTP handler only verifies the signature and enqueues. It does not update invoices.
 */
export function enqueuePaymentSettlement(payload: { txnId: string; gatewayRef: string; method: string }) {
  const queued = getStore().enqueueSettlement(payload);
  setImmediate(() => getStore().drainSettlements());
  return queued;
}

export function queueDepth() {
  return getStore().jobs.length;
}
