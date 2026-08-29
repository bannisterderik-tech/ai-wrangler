import { redirect } from "next/navigation";

/**
 * This was a mockup, and a dishonest one.
 *
 * It drew a single hardcoded card that said "claude-code connected · this
 * laptop" whether or not anything was connected. Sessions is the screen that
 * reads the real people table and the real tokens, so this is a signpost to it
 * rather than a second, invented answer to the same question.
 */
export default function TeamRedirect() {
  redirect("/sessions");
}
