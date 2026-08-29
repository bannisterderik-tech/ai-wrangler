import { escapeXml } from "./twilio";

/**
 * The TwiML a receptionist turn produces.
 *
 * Kept apart from the decision logic so the shape of what a caller actually
 * hears can be read, and tested, without a model in the loop.
 */

/** Say something, then listen. `speechTimeout="auto"` ends the turn on a pause. */
export function sayAndListen(say: string, actionUrl: string, hints?: string) {
  return (
    `<Gather input="speech" speechTimeout="auto" speechModel="phone_call" ` +
    `action="${escapeXml(actionUrl)}" method="POST" actionOnEmptyResult="true"` +
    (hints ? ` hints="${escapeXml(hints)}"` : "") +
    `>` +
    `<Say>${escapeXml(say)}</Say>` +
    `</Gather>`
  );
}

/**
 * Hand to a person, and fall through to voicemail if nobody picks up.
 *
 * The fall-through is the point. A transfer that rings out and hangs up loses
 * exactly the urgent call it was reaching for.
 */
export function handOver(say: string, forwardTo: string | null, callerId: string) {
  const head = `<Say>${escapeXml(say)}</Say>`;
  if (!forwardTo) {
    return `${head}<Say>Nobody is available right now. Please leave your name and number after the tone.</Say>` +
      `<Record maxLength="120" playBeep="true" />`;
  }
  return (
    head +
    `<Dial callerId="${escapeXml(callerId)}" answerOnBridge="true" timeout="25">` +
    `<Number>${escapeXml(forwardTo)}</Number></Dial>` +
    `<Say>Sorry, we could not reach anyone. Please leave your name and number after the tone.</Say>` +
    `<Record maxLength="120" playBeep="true" />`
  );
}

/** We have what we need. Say so and stop — no dead air, no loop. */
export function signOff(say: string) {
  return `<Say>${escapeXml(say)}</Say><Hangup />`;
}
