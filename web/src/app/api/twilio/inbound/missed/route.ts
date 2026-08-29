import { readInbound, twiml } from "@/lib/twilio-inbound";
import { callRecord, configFor, opening, overCap } from "@/lib/receptionist";
import { sayAndListen } from "@/lib/receptionist-twiml";

/**
 * The humans did not pick up.
 *
 * Twilio comes here when a <Dial> ends, which includes nobody answering. This
 * is the layer that actually pays for itself: the office keeps working exactly
 * as it did, and the calls that used to become voicemail get answered instead.
 *
 * If the humans DID answer, the call is already over and there is nothing to
 * do — saying anything here would talk over the end of a real conversation.
 */
export async function POST(req: Request) {
  const read = await readInbound(req, "/api/twilio/inbound/missed");
  if ("refusal" in read) return read.refusal;
  const { params, who } = read;

  const status = params.DialCallStatus ?? "";
  if (status === "completed" || status === "answered") return twiml("");
  if (!who) return twiml("");

  const config = await configFor(who.customerId);
  if (!config?.enabled || (await overCap(config))) {
    return twiml(
      "<Say>Sorry, we could not reach anyone. Please leave your name and number after the tone.</Say>" +
        '<Record maxLength="120" playBeep="true" />',
    );
  }

  await callRecord(params.CallSid ?? "", who, params.From ?? "");
  return twiml(
    sayAndListen(
      `Sorry to keep you. ${opening(config)}`,
      "/api/twilio/inbound/gather",
      config.brief ?? undefined,
    ),
  );
}
