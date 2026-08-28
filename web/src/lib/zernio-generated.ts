// GENERATED FILE — DO NOT EDIT BY HAND.
//
// Every Zernio operation, from Zernio's own OpenAPI spec.
// Regenerate with:  npm run zernio:pull
//
// 596 operations across 13 resource groups.
//
// Request and response bodies are typed only where the spec spells the shape
// out inline. Where it uses a $ref, the parameter is `unknown` rather than a
// guess — a wrong type here would read as verified and be exactly the mistake
// this file exists to prevent. Path and query parameters, the required flags,
// and the methods are all exact.
import { zernioCall } from "./zernio-http";


/* ======================================================================
 * accounts — 154 operations
 * ====================================================================== */

/**
 * Activate workflow
 * Validate the graph is runnable and set the workflow live. Once active, matching inbound messages start executions. Idempotent.
 * POST /v1/workflows/{workflowId}/activate
 */
export function activateWorkflow(workflowId: string) {
  return zernioCall("POST", `/v1/workflows/${encodeURIComponent(String(workflowId))}/activate`, undefined, undefined);
}

/**
 * Assign GBP location to another profile
 * Connect a Google Business location onto a DIFFERENT profile by reusing the OAuth grant from an already-connected GBP account — no browser, no re-authorization. Built for agencies whose single Google account has manager access to many client locations and who run one profile per client: connect one location the normal way (browser OAuth), then bulk-assign the rest onto each client's profile via this endpoint. The path `accountId` is a SOURCE connected GBP account (the token holder); the body `profileId` is the TARGET profile. Returns 409 if the target profile already has a Google Business conn…
 * POST /v1/accounts/{accountId}/gmb-locations/assign
 */
export function assignGoogleBusinessLocation(accountId: string, body: { profileId: string; selectedLocationId: string; googleAccountId?: string }) {
  return zernioCall("POST", `/v1/accounts/${encodeURIComponent(String(accountId))}/gmb-locations/assign`, undefined, body);
}

/**
 * Complete a verification
 * Completes a PENDING verification by submitting the PIN/code Google sent the business (postcard code, SMS PIN, etc.). On success the verification moves to COMPLETED.
 * POST /v1/accounts/{accountId}/gmb-verifications/{verificationId}/complete
 */
export function completeGoogleBusinessVerification(accountId: string, verificationId: string, query: { locationId?: string } | undefined, body: { pin: string }) {
  return zernioCall("POST", `/v1/accounts/${encodeURIComponent(String(accountId))}/gmb-verifications/${encodeURIComponent(String(verificationId))}/complete`, query, body);
}

/**
 * Check Telegram status
 * Poll this endpoint to check if a Telegram access code has been used to connect a channel/group. Recommended polling interval: 3 seconds. Status values: pending (waiting for user), connected (channel/group linked), expired (generate a new code).
 * PATCH /v1/connect/telegram
 */
export function completeTelegramConnect(query: { code: string }) {
  return zernioCall("PATCH", "/v1/connect/telegram", query, undefined);
}

/**
 * Complete number selection
 * Bind a specific WhatsApp phone number to the Zernio profile after the user picks one from `listWhatsAppPhoneNumbers`. Exchanges the short-lived OAuth token for a long-lived token, subscribes the WABA to webhooks, and creates the SocialAccount.
 * POST /v1/connect/whatsapp/select-phone-number
 */
export function completeWhatsAppPhoneSelection(body: { profileId: string; phoneNumberId: string; wabaId: string; tempToken: string; userProfile?: Record<string, unknown>; redirect_url?: string }) {
  return zernioCall("POST", "/v1/connect/whatsapp/select-phone-number", undefined, body);
}

/**
 * Set TikTok brand identity
 * Set or update the Brand Identity (display name + avatar) for a `tiktokads` SocialAccount. TikTok requires every ad to carry an `identity_id + identity_type` pair. The Brand Identity is the CUSTOMIZED_USER alternative to attributing ads to a real @username (TT_USER). This route uploads the supplied image to TikTok, creates the identity via `/v2/identity/create/`, and caches the resulting `identity_id` on the account so subsequent `POST /v1/ads/create` calls can opt into it via `identityType: 'CUSTOMIZED_USER'`. Configurable on every `tiktokads` account, including linked-mode ones (those with a…
 * PATCH /v1/connect/tiktok-ads
 */
export function configureTikTokAdsBrandIdentity(body: { accountId: string; displayName: string; imageUrl: string }) {
  return zernioCall("PATCH", "/v1/connect/tiktok-ads", undefined, body);
}

/**
 * Connect ads for a platform
 * Unified ads connection endpoint. Creates a dedicated ads SocialAccount for the specified platform. Same-token platforms (facebook, instagram, linkedin, pinterest): Creates an ads SocialAccount (metaads, linkedinads, pinterestads) with a copied OAuth token from the parent posting account. If the ads account already exists, returns alreadyConnected: true. No extra OAuth needed. Separate-token platforms (tiktok, twitter): Starts the platform-specific marketing API OAuth flow and creates an ads SocialAccount (tiktokads, xads) with its own token. If the ads account already exists, returns alreadyC…
 * GET /v1/connect/{platform}/ads
 */
export function connectAds(platform: "facebook" | "instagram" | "linkedin" | "tiktok" | "twitter" | "pinterest" | "googleads", query: { profileId: string; accountId?: string; redirect_url?: string; headless?: boolean; force?: boolean; adAccountId?: string; adAccountIds?: string[] }) {
  return zernioCall("GET", `/v1/connect/${encodeURIComponent(String(platform))}/ads`, query, undefined);
}

/**
 * Connect Bluesky account
 * Connect a Bluesky account using identifier (handle or email) and an app password. To get your userId for the state parameter, call GET /v1/users which includes a currentUserId field.
 * POST /v1/connect/bluesky/credentials
 */
export function connectBlueskyCredentials(body: { identifier: string; appPassword: string; state: string; redirectUri?: string }) {
  return zernioCall("POST", "/v1/connect/bluesky/credentials", undefined, body);
}

/**
 * Connect a Discord channel
 * Finalize a Discord connect by binding one channel to a profile. Served by a dedicated route, so it is not reachable through POST /v1/connect/{platform}. One connected account per channel: repeat the call with a different channelId to add another.
 * POST /v1/connect/discord
 */
export function connectDiscordChannel(body: { guildId: string; channelId: string; profileId: string }) {
  return zernioCall("POST", "/v1/connect/discord", undefined, body);
}

/**
 * Connect an OpenAI Ads account
 * Connect an OpenAI Ads account using an API key from ChatGPT Ads Manager. The key grants full campaign write access on OpenAI's side (OpenAI does not offer a read-only key scope). Zernio uses it to read ads and performance, and to create and manage campaigns you set up through Zernio (create, status, budget, and cancel). Campaigns created directly in ChatGPT Ads Manager can still be managed there.
 * POST /v1/connect/openai-ads/credentials
 */
export function connectOpenAIAdsCredentials(body: { apiKey: string; profileId: string; state?: string; redirectUri?: string }) {
  return zernioCall("POST", "/v1/connect/openai-ads/credentials", undefined, body);
}

/**
 * Connect a Shopify store with a custom-app Admin token
 * Token-paste alternative to the OAuth flow: connect a store using the Admin API access token of a custom app the merchant created in their own Shopify admin (Settings → Apps and sales channels → Develop apps, with the `read_content`/`write_content` scopes). Use this when the one-click OAuth connect is unavailable or when your users prefer not to install a third-party app on their store. The token is validated against the store before anything is saved; custom-app tokens do not expire. Connecting the same profile to a store again replaces the stored token in place.
 * POST /v1/connect/shopify/token
 */
export function connectShopifyWithToken(body: { profileId: string; shop: string; accessToken: string }) {
  return zernioCall("POST", "/v1/connect/shopify/token", undefined, body);
}

/**
 * Connect a Slack channel
 * Finalize a Slack connect by creating the per-channel account. Served by a dedicated route, so it is not reachable through POST /v1/connect/{platform}. Send pendingDataToken for a first connect (the nonce from the OAuth redirect) or accountId to add another channel to a workspace already connected.
 * POST /v1/connect/slack
 */
export function connectSlackChannel(body: { profileId: string; channelId: string; pendingDataToken?: string; accountId?: string }) {
  return zernioCall("POST", "/v1/connect/slack", undefined, body);
}

/**
 * Connect WhatsApp via credentials
 * Connect a WhatsApp Business Account by providing Meta credentials directly. This is the headless alternative to the Embedded Signup browser flow. To get the required credentials: 1. Go to Meta Business Suite (business.facebook.com) 2. Create or select a WhatsApp Business Account 3. In Business Settings > System Users, create a System User 4. Assign it the whatsapp_business_management and whatsapp_business_messaging permissions 5. Generate a permanent access token 6. Get the WABA ID from WhatsApp Manager > Account Tools > Phone Numbers 7. Get the Phone Number ID from the same page (click on th…
 * POST /v1/connect/whatsapp/credentials
 */
export function connectWhatsAppCredentials(body: { profileId: string; accessToken: string; wabaId: string; phoneNumberId: string; pin?: string }) {
  return zernioCall("POST", "/v1/connect/whatsapp/credentials", undefined, body);
}

/**
 * Connect WhatsApp from Embedded Signup
 * Exchange the authorization code Meta Embedded Signup returns to your browser SDK. This is the headless completion path for WhatsApp: the code never passes through a redirect_uri, so POST /v1/connect/{platform} cannot accept it.
 * POST /v1/connect/whatsapp/embedded-signup
 */
export function connectWhatsAppEmbeddedSignup(body: { code: string; profileId: string; wabaId?: string; phoneNumberId?: string; isCoexistence?: boolean; expectedPhoneNumber?: string }) {
  return zernioCall("POST", "/v1/connect/whatsapp/embedded-signup", undefined, body);
}

/**
 * Create group
 * Creates a new account group with a name and a list of social account IDs. Accounts can belong to different profiles; the caller must have access to every account's profile. Group names must be unique per user.
 * POST /v1/account-groups
 */
export function createAccountGroup(body: { name: string; accountIds: string[]; profileId?: string }) {
  return zernioCall("POST", "/v1/account-groups", undefined, body);
}

/**
 * Create or reuse a custom conversion
 * Provision the Meta custom conversion an ads flow optimises toward, and hand back the `customConversionId` for `promotedObject.customConversionId` on POST /v1/ads/create. Removes the manual "create it in Ads Manager first" step. **Reuse is ours, not Meta's.** Meta's create is not idempotent, so a retried request would otherwise mint a duplicate carrying none of the original's optimisation history. A non-archived conversion with the same `name` on the same `pixelId` is returned instead of created, with `reused: true` and a 200 rather than a 201. `rule` is forwarded verbatim in Meta's own gramma…
 * POST /v1/accounts/{accountId}/custom-conversions
 * Platforms: meta
 */
export function createCustomConversion(accountId: string, body: { adAccountId: string; name: string; pixelId: string; customEventType: string; rule: Record<string, unknown> }) {
  return zernioCall("POST", `/v1/accounts/${encodeURIComponent(String(accountId))}/custom-conversions`, undefined, body);
}

/**
 * Create custom field
 * Create a new custom field definition. Supported types are text, number, date, boolean, and select.
 * POST /v1/custom-fields
 */
export function createCustomField(body: { profileId: string; name: string; slug?: string; type: "text" | "number" | "date" | "boolean" | "select"; options?: string[] }) {
  return zernioCall("POST", "/v1/custom-fields", undefined, body);
}

/**
 * Upload photo
 * Creates a media item (photo) for a location from a publicly accessible URL. Categories determine where the photo appears: CATEGORY_UNSPECIFIED, COVER, PROFILE, LOGO, EXTERIOR, INTERIOR, PRODUCT, FOOD_AND_DRINK, MENU, COMMON_AREA, ROOMS, TEAMS, AT_WORK, ADDITIONAL.
 * POST /v1/accounts/{accountId}/gmb-media
 */
export function createGoogleBusinessMedia(accountId: string, query: { locationId?: string } | undefined, body: { sourceUrl: string; mediaFormat?: "PHOTO" | "VIDEO"; description?: string; category?: "CATEGORY_UNSPECIFIED" | "COVER" | "PROFILE" | "LOGO" | "EXTERIOR" | "INTERIOR" | "PRODUCT" | "FOOD_AND_DRINK" | "MENU" | "COMMON_AREA" | "ROOMS" | "TEAMS" | "AT_WORK" | "ADDITIONAL" }) {
  return zernioCall("POST", `/v1/accounts/${encodeURIComponent(String(accountId))}/gmb-media`, query, body);
}

/**
 * Create action link
 * Creates a place action link for a location. Available action types: APPOINTMENT, ONLINE_APPOINTMENT, DINING_RESERVATION, FOOD_ORDERING, FOOD_DELIVERY, FOOD_TAKEOUT, SHOP_ONLINE.
 * POST /v1/accounts/{accountId}/gmb-place-actions
 */
export function createGoogleBusinessPlaceAction(accountId: string, query: { locationId?: string } | undefined, body: { uri: string; placeActionType: "APPOINTMENT" | "ONLINE_APPOINTMENT" | "DINING_RESERVATION" | "FOOD_ORDERING" | "FOOD_DELIVERY" | "FOOD_TAKEOUT" | "SHOP_ONLINE" }) {
  return zernioCall("POST", `/v1/accounts/${encodeURIComponent(String(accountId))}/gmb-place-actions`, query, body);
}

/**
 * Create Pinterest board
 * Creates a new board on the connected Pinterest account. The returned board ID can be used immediately as `platformSpecificData.boardId` when creating a Pinterest post.
 * POST /v1/accounts/{accountId}/pinterest-boards
 */
export function createPinterestBoard(accountId: string, body: { name: string; description?: string; privacy?: "PUBLIC" | "PROTECTED" | "SECRET" }) {
  return zernioCall("POST", `/v1/accounts/${encodeURIComponent(String(accountId))}/pinterest-boards`, undefined, body);
}

/**
 * Create profile
 * Creates a new profile with a name, optional description, and color. Names are unique per workspace: a duplicate returns a 409 whose details.existingProfileId carries the id of the existing profile. Send an Idempotency-Key header to make retries safe: a retried create with the same key and body replays the original 201 (same _id) instead of conflicting.
 * POST /v1/profiles
 */
export function createProfile(body: { name: string; description?: string; color?: string }) {
  return zernioCall("POST", "/v1/profiles", undefined, body);
}

/**
 * Provision CTWA dataset
 * Creates (or fetches, if one already exists) the Meta dataset that Click-to-WhatsApp ad events are reported against via the Conversions API, and persists its ID on the account as `metadata.metaCapiDatasetId`. The call is GET-first idempotent — a WABA can only own one CTWA dataset, so a second call after a successful provision is a safe no-op that returns the same ID with `created: false`. Requires the connected WhatsApp account's token to carry the `whatsapp_business_manage_events` permission. If the permission is missing the endpoint returns 422 with a message asking the user to reconnect the…
 * POST /v1/whatsapp/dataset
 */
export function createWhatsAppDataset(body: { accountId: string }) {
  return zernioCall("POST", "/v1/whatsapp/dataset", undefined, body);
}

/**
 * Create flow
 * Create a new WhatsApp Flow in DRAFT status. Optionally clone an existing flow. After creating, upload a Flow JSON definition, then publish to make it sendable.
 * POST /v1/whatsapp/flows
 */
export function createWhatsAppFlow(body: { accountId: string; name: string; categories: ("SIGN_UP" | "SIGN_IN" | "APPOINTMENT_BOOKING" | "LEAD_GENERATION" | "CONTACT_US" | "CUSTOMER_SUPPORT" | "SURVEY" | "OTHER")[]; cloneFlowId?: string; asVersion?: boolean; endpointUri?: string }) {
  return zernioCall("POST", "/v1/whatsapp/flows", undefined, body);
}

/**
 * Create template
 * Create a new message template. Supports two modes: Custom template: Provide components with your own content. Submitted to Meta for review (can take up to 24h). Library template: Provide library_template_name instead of components to use a pre-built template from Meta's template library. Library templates are pre-approved (no review wait). You can optionally customize parameters and buttons via library_template_body_inputs and library_template_button_inputs. Browse available library templates at: https://business.facebook.com/wa/manage/message-templates/
 * POST /v1/whatsapp/templates
 */
export function createWhatsAppTemplate(body: { accountId: string; name: string; category: "AUTHENTICATION" | "MARKETING" | "UTILITY"; language: string; parameter_format?: "POSITIONAL" | "NAMED" | "positional" | "named"; components?: unknown[]; library_template_name?: string; library_template_body_inputs?: Record<string, unknown>; library_template_button_inputs?: ({ type?: "quick_reply" | "url" | "phone_number"; url?: { base_url?: string }; phone_number?: string })[] }) {
  return zernioCall("POST", "/v1/whatsapp/templates", undefined, body);
}

/**
 * Create workflow
 * Create a branching conversation workflow (draft) from a node/edge graph. Created in `draft` status; activate it to start matching inbound messages. The graph is validated structurally; completeness (a trigger node + reachable entry) is required at activation.
 * POST /v1/workflows
 */
export function createWorkflow(body: { profileId: string; accountId: string; platform?: "whatsapp" | "instagram" | "facebook" | "telegram" | "twitter" | "bluesky" | "reddit"; name: string; description?: string; nodes?: unknown[]; edges?: unknown[]; entryNodeId?: string }) {
  return zernioCall("POST", "/v1/workflows", undefined, body);
}

/**
 * Disconnect account
 * Disconnects and removes a connected social account.
 * DELETE /v1/accounts/{accountId}
 */
export function deleteAccount(accountId: string) {
  return zernioCall("DELETE", `/v1/accounts/${encodeURIComponent(String(accountId))}`, undefined, undefined);
}

/**
 * Delete group
 * Permanently deletes an account group. The accounts themselves are not affected.
 * DELETE /v1/account-groups/{groupId}
 */
export function deleteAccountGroup(groupId: string) {
  return zernioCall("DELETE", `/v1/account-groups/${encodeURIComponent(String(groupId))}`, undefined, undefined);
}

/**
 * Delete custom field
 * Delete a custom field definition and remove its values from all contacts.
 * DELETE /v1/custom-fields/{fieldId}
 */
export function deleteCustomField(fieldId: string) {
  return zernioCall("DELETE", `/v1/custom-fields/${encodeURIComponent(String(fieldId))}`, undefined, undefined);
}

/**
 * Delete photo
 * Deletes a photo or media item from a GBP location.
 * DELETE /v1/accounts/{accountId}/gmb-media
 */
export function deleteGoogleBusinessMedia(accountId: string, query: { locationId?: string; mediaId: string }) {
  return zernioCall("DELETE", `/v1/accounts/${encodeURIComponent(String(accountId))}/gmb-media`, query, undefined);
}

/**
 * Delete action link
 * Deletes a place action link (e.g. booking or ordering URL) from a GBP location.
 * DELETE /v1/accounts/{accountId}/gmb-place-actions
 */
export function deleteGoogleBusinessPlaceAction(accountId: string, query: { locationId?: string; name: string }) {
  return zernioCall("DELETE", `/v1/accounts/${encodeURIComponent(String(accountId))}/gmb-place-actions`, query, undefined);
}

/**
 * Delete IG ice breakers
 * Removes the ice breaker questions from an Instagram account's Messenger experience.
 * DELETE /v1/accounts/{accountId}/instagram-ice-breakers
 */
export function deleteInstagramIceBreakers(accountId: string) {
  return zernioCall("DELETE", `/v1/accounts/${encodeURIComponent(String(accountId))}/instagram-ice-breakers`, undefined, undefined);
}

/**
 * Delete FB persistent menu
 * Removes the persistent menu from Facebook Messenger conversations for this account.
 * DELETE /v1/accounts/{accountId}/messenger-menu
 */
export function deleteMessengerMenu(accountId: string) {
  return zernioCall("DELETE", `/v1/accounts/${encodeURIComponent(String(accountId))}/messenger-menu`, undefined, undefined);
}

/**
 * Delete profile
 * Permanently deletes a profile. Active connected accounts block deletion (returns 400) - disconnect them first. Any remaining disconnected accounts and provisioned WhatsApp numbers are moved to another of your profiles (a new one is created only if needed), never deleted.
 * DELETE /v1/profiles/{profileId}
 */
export function deleteProfile(profileId: string) {
  return zernioCall("DELETE", `/v1/profiles/${encodeURIComponent(String(profileId))}`, undefined, undefined);
}

/**
 * Delete TG bot commands
 * Clears all bot commands configured for a Telegram bot account.
 * DELETE /v1/accounts/{accountId}/telegram-commands
 */
export function deleteTelegramCommands(accountId: string) {
  return zernioCall("DELETE", `/v1/accounts/${encodeURIComponent(String(accountId))}/telegram-commands`, undefined, undefined);
}

/**
 * Delete business username
 * Release the currently claimed WhatsApp Business username from the account. After deletion the username becomes available for other accounts to claim.
 * DELETE /v1/whatsapp/business-profile/username
 */
export function deleteWhatsappBusinessUsername(body: { accountId: string }) {
  return zernioCall("DELETE", "/v1/whatsapp/business-profile/username", undefined, body);
}

/**
 * Delete flow
 * Delete a DRAFT flow. This is irreversible. Only flows in DRAFT status can be deleted.
 * DELETE /v1/whatsapp/flows/{flowId}
 */
export function deleteWhatsAppFlow(flowId: string, query: { accountId: string }) {
  return zernioCall("DELETE", `/v1/whatsapp/flows/${encodeURIComponent(String(flowId))}`, query, undefined);
}

/**
 * Delete template
 * Permanently delete a message template. **Without `language` this deletes every language variant of the name** (Meta's own contract for deletion by name). Pass `language` to delete one variant only; the response `scope` says which happened. Meta keeps a deleted approved template in `PENDING_DELETION` for a while and the name cannot be reused for 30 days.
 * DELETE /v1/whatsapp/templates/{templateName}
 */
export function deleteWhatsAppTemplate(templateName: string, query: { accountId: string; language?: string }) {
  return zernioCall("DELETE", `/v1/whatsapp/templates/${encodeURIComponent(String(templateName))}`, query, undefined);
}

/**
 * Delete template by id
 * Delete one language variant by its Meta id. Other languages of the same name are untouched. The name cannot be reused for 30 days once its last variant is deleted.
 * DELETE /v1/whatsapp/templates/id/{templateId}
 */
export function deleteWhatsAppTemplateById(templateId: string, query: { accountId: string }) {
  return zernioCall("DELETE", `/v1/whatsapp/templates/id/${encodeURIComponent(String(templateId))}`, query, undefined);
}

/**
 * Delete workflow
 * Permanently delete a workflow and all of its executions.
 * DELETE /v1/workflows/{workflowId}
 */
export function deleteWorkflow(workflowId: string) {
  return zernioCall("DELETE", `/v1/workflows/${encodeURIComponent(String(workflowId))}`, undefined, undefined);
}

/**
 * Deprecate flow
 * Deprecate a PUBLISHED flow. This is irreversible. Deprecated flows cannot be sent or opened, but existing active sessions may continue until they complete.
 * POST /v1/whatsapp/flows/{flowId}/deprecate
 */
export function deprecateWhatsAppFlow(flowId: string, body: { accountId: string }) {
  return zernioCall("POST", `/v1/whatsapp/flows/${encodeURIComponent(String(flowId))}/deprecate`, undefined, body);
}

/**
 * Duplicate a workflow
 * Create an independent copy of a workflow's graph, name, description, and account binding. The copy is created in `draft` status with fresh execution counters and a new id — execution history is NOT copied. Useful for branching off a known-good workflow before making experimental edits.
 * POST /v1/workflows/{workflowId}/duplicate
 */
export function duplicateWorkflow(workflowId: string) {
  return zernioCall("POST", `/v1/workflows/${encodeURIComponent(String(workflowId))}/duplicate`, undefined, undefined);
}

/**
 * Fetch verification options
 * Reports the verification methods Google currently offers for the location. Non-mutating (nothing is sent to the business). `languageCode` is required; service-area ("CUSTOMER_LOCATION_ONLY") businesses also require `context.address`, otherwise Google returns 400.
 * POST /v1/accounts/{accountId}/gmb-verifications/options
 */
export function fetchGoogleBusinessVerificationOptions(accountId: string, query: { locationId?: string } | undefined, body: { languageCode: string; context?: Record<string, unknown> }) {
  return zernioCall("POST", `/v1/accounts/${encodeURIComponent(String(accountId))}/gmb-verifications/options`, query, body);
}

/**
 * Check account health
 * Returns detailed health info for a specific account including token status, permissions, and recommendations. For WhatsApp accounts the response also includes `platformConnection`, a live probe of the Meta link behind the channel (the same read as `GET /v1/whatsapp/number-info`). The OAuth token can be perfectly valid while Meta refuses to serve the phone-number object (for example after a phone-side coexistence disconnect), so `tokenStatus` alone is not a liveness signal for WhatsApp. When the Meta link is dead, `platformConnection.status` is `disconnected` and the overall `status` is `error…
 * GET /v1/accounts/{accountId}/health
 */
export function getAccountHealth(accountId: string) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/health`, undefined, undefined);
}

/**
 * List posts published on the platform
 * Returns the 25 most recent posts that exist on the platform for a connected account, read live from the platform API. This covers everything on the account, including posts that were never created through Zernio. Use it to obtain the platform's own post id, which the analytics endpoints take as input. On YouTube the returned `id` is the video ID that `GET /v1/analytics/youtube/daily-views`, `/video-retention` and `/demographics` expect as `videoId`, so this endpoint is what backs a video picker in your own UI. Not every field applies to every platform: `reactionCount` is Facebook and LinkedIn…
 * GET /v1/accounts/{accountId}/posts
 * Platforms: facebook, instagram, twitter, bluesky, threads, youtube, linkedin, reddit, tiktok, pinterest
 */
export function getAccountPosts(accountId: string) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/posts`, undefined, undefined);
}

/**
 * Check accounts health
 * Returns health status of all connected accounts including token validity, permissions, and issues needing attention.
 * GET /v1/accounts/health
 */
export function getAllAccountsHealth(query?: { profileId?: string; platform?: "facebook" | "instagram" | "linkedin" | "twitter" | "tiktok" | "youtube" | "threads" | "pinterest" | "reddit" | "bluesky" | "googlebusiness" | "telegram" | "snapchat" | "discord" | "slack" | "whatsapp"; status?: "healthy" | "warning" | "error" }) {
  return zernioCall("GET", "/v1/accounts/health", query, undefined);
}

/**
 * Get Bluesky account settings
 * Returns the account's default post languages (defaultLangs), applied at publish time whenever a post's platformSpecificData.langs is absent. Null when no default is set.
 * GET /v1/accounts/{accountId}/bluesky-settings
 */
export function getBlueskySettings(accountId: string) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/bluesky-settings`, undefined, undefined);
}

/**
 * Get OAuth connect URL
 * Initiate an OAuth connection flow. Returns an authUrl to redirect the user to. Standard flow: Zernio hosts the selection UI, then redirects to your redirect_url. Headless mode (headless=true): user is redirected to your redirect_url with OAuth data for custom UI. Use the platform-specific selection endpoints to complete.
 * GET /v1/connect/{platform}
 */
export function getConnectUrl(platform: "facebook" | "instagram" | "linkedin" | "twitter" | "tiktok" | "youtube" | "threads" | "reddit" | "pinterest" | "bluesky" | "googlebusiness" | "telegram" | "snapchat" | "discord" | "slack" | "whatsapp", query: { profileId: string; redirect_url?: string; headless?: boolean; loginMethod?: "instagram_login" | "facebook_login"; onboarding?: "api" | "business_app" }) {
  return zernioCall("GET", `/v1/connect/${encodeURIComponent(String(platform))}`, query, undefined);
}

/**
 * List Discord guild channels
 * Returns the text, announcement, and forum channels in the connected Discord guild. Use this to discover available channels when switching the connected channel via PATCH /v1/accounts/{accountId}/discord-settings.
 * GET /v1/accounts/{accountId}/discord-channels
 */
export function getDiscordChannels(accountId: string) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/discord-channels`, undefined, undefined);
}

/**
 * Get Discord account settings
 * Returns the current Discord account settings including webhook identity (display name and avatar), connected channel, and guild information.
 * GET /v1/accounts/{accountId}/discord-settings
 */
export function getDiscordSettings(accountId: string) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/discord-settings`, undefined, undefined);
}

/**
 * List Facebook pages
 * Returns all Facebook pages the connected account has access to, including the currently selected page.
 * GET /v1/accounts/{accountId}/facebook-page
 */
export function getFacebookPages(accountId: string, query?: { refresh?: boolean }) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/facebook-page`, query, undefined);
}

/**
 * Get attribute metadata
 * Returns metadata about which Google Business Profile attributes are available for a location or business category. Use this endpoint to discover valid attribute names, value types, and allowed enum values before reading or writing via gmb-attributes. Two mutually exclusive query modes: **Location mode**: pass `locationId` (or rely on the account's stored `selectedLocationId`). Google returns attributes valid for that specific location. **Category mode**: pass `categoryName` (must start with `categories/`) and `regionCode`. Google returns attributes valid for that category across the given reg…
 * GET /v1/accounts/{accountId}/gmb-attribute-metadata
 */
export function getGmbAttributeMetadata(accountId: string, query?: { locationId?: string; categoryName?: string; regionCode?: string; languageCode?: string; pageSize?: number; pageToken?: string }) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/gmb-attribute-metadata`, query, undefined);
}

/**
 * List GBP locations
 * Returns Google Business Profile locations the connected account can access, plus the currently selected location. The list is bounded (see hasMore); for accounts that own many locations, use the search or filter query params to find a specific one instead of loading them all, or raise limit to enumerate an account with more than 100 locations.
 * GET /v1/accounts/{accountId}/gmb-locations
 */
export function getGmbLocations(accountId: string, query?: { search?: string; filter?: string; limit?: number }) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/gmb-locations`, query, undefined);
}

/**
 * Get attributes
 * Returns GBP location attributes (amenities, services, accessibility, payment types). Available attributes vary by business category.
 * GET /v1/accounts/{accountId}/gmb-attributes
 */
export function getGoogleBusinessAttributes(accountId: string, query?: { locationId?: string }) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/gmb-attributes`, query, undefined);
}

/**
 * Get food menus
 * Returns food menus for a GBP location including sections, items, pricing, and dietary info. Only for locations with food menu support.
 * GET /v1/accounts/{accountId}/gmb-food-menus
 */
export function getGoogleBusinessFoodMenus(accountId: string, query?: { locationId?: string }) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/gmb-food-menus`, query, undefined);
}

/**
 * Get location details
 * Returns detailed GBP location info (hours, description, phone, website, categories, services). Use readMask to request specific fields.
 * GET /v1/accounts/{accountId}/gmb-location-details
 */
export function getGoogleBusinessLocationDetails(accountId: string, query?: { locationId?: string; readMask?: string }) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/gmb-location-details`, query, undefined);
}

/**
 * Get services
 * Gets the services offered by a Google Business Profile location. Returns an array of service items (structured or free-form with optional price).
 * GET /v1/accounts/{accountId}/gmb-services
 */
export function getGoogleBusinessServices(accountId: string, query?: { locationId?: string }) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/gmb-services`, query, undefined);
}

/**
 * Get verification state
 * Returns the location's Voice of Merchant state plus its verification history. `voiceOfMerchantState.hasVoiceOfMerchant` tells you whether the listing is verified and published; when it is false, `verify` reports whether a verification is already pending. Each entry in `verifications` has a `state` of PENDING, COMPLETED, or FAILED.
 * GET /v1/accounts/{accountId}/gmb-verifications
 */
export function getGoogleBusinessVerifications(accountId: string, query?: { locationId?: string }) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/gmb-verifications`, query, undefined);
}

/**
 * Get Instagram audio metadata
 * Fetch one audio asset's metadata by ID. Use it to re-validate a stored `audioId` before a scheduled Reel publishes, or to refresh the preview `downloadUrl` (Meta expires preview URLs after roughly 1.5 days). Same connection requirement as the search endpoint: Facebook-Login Instagram accounts only.
 * GET /v1/accounts/{accountId}/instagram/audio/{audioId}
 */
export function getInstagramAudio(accountId: string, audioId: string) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/instagram/audio/${encodeURIComponent(String(audioId))}`, undefined, undefined);
}

/**
 * Get IG ice breakers
 * Get the ice breaker configuration for an Instagram account.
 * GET /v1/accounts/{accountId}/instagram-ice-breakers
 */
export function getInstagramIceBreakers(accountId: string) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/instagram-ice-breakers`, undefined, undefined);
}

/**
 * Get Instagram publishing limit
 * Returns the account's remaining content-publishing quota for Instagram's rolling 24-hour window, so you can pace publishing and warn before the cap is reached. `quotaUsage` counts containers published since the start of the window. Always compare against the returned `quotaTotal` rather than hardcoding a number: Meta's prose documentation and the live API disagree on the value, and the live value is authoritative.
 * GET /v1/accounts/{accountId}/instagram/publishing-limit
 */
export function getInstagramPublishingLimit(accountId: string) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/instagram/publishing-limit`, undefined, undefined);
}

/**
 * Resolve LinkedIn mention
 * Converts a LinkedIn profile or company URL to a URN for @mentions in posts. How to use LinkedIn @mentions (2-step workflow): 1. Call this endpoint with the LinkedIn profile/company URL to get the mention URN and format. 2. Embed the returned mentionFormat (e.g. @[Vincent Jong](urn:li:person:xxx)) directly in your post's content field. Example: - Resolve: GET /v1/accounts/{id}/linkedin-mentions?url=linkedin.com/in/vincentjong&displayName=Vincent Jong - Returns: mentionFormat: "@[Vincent Jong](urn:li:person:xxx)" - Use in post content: "Great talk with @[Vincent Jong](urn:li:person:xxx) today!"…
 * GET /v1/accounts/{accountId}/linkedin-mentions
 */
export function getLinkedInMentions(accountId: string, query: { url: string; displayName?: string }) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/linkedin-mentions`, query, undefined);
}

/**
 * List LinkedIn orgs
 * Returns LinkedIn organizations (company pages) the connected account has admin access to.
 * GET /v1/accounts/{accountId}/linkedin-organizations
 */
export function getLinkedInOrganizations(accountId: string) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/linkedin-organizations`, undefined, undefined);
}

/**
 * Get FB persistent menu
 * Get the persistent menu configuration for a Facebook Messenger account.
 * GET /v1/accounts/{accountId}/messenger-menu
 */
export function getMessengerMenu(accountId: string) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/messenger-menu`, undefined, undefined);
}

/**
 * List Pinterest boards
 * Returns the boards available for a connected Pinterest account. Use this to get a board ID when creating a Pinterest post.
 * GET /v1/accounts/{accountId}/pinterest-boards
 */
export function getPinterestBoards(accountId: string) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/pinterest-boards`, undefined, undefined);
}

/**
 * Get profile
 * Returns a single profile by ID, including its name, color, and default status.
 * GET /v1/profiles/{profileId}
 */
export function getProfile(profileId: string) {
  return zernioCall("GET", `/v1/profiles/${encodeURIComponent(String(profileId))}`, undefined, undefined);
}

/**
 * List subreddit flairs
 * Returns available post flairs for a subreddit. Some subreddits require a flair when posting.
 * GET /v1/accounts/{accountId}/reddit-flairs
 */
export function getRedditFlairs(accountId: string, query: { subreddit: string }) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/reddit-flairs`, query, undefined);
}

/**
 * List Reddit subreddits
 * Returns the subreddits the connected Reddit account can post to. Use this to get a subreddit name when creating a Reddit post.
 * GET /v1/accounts/{accountId}/reddit-subreddits
 */
export function getRedditSubreddits(accountId: string) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/reddit-subreddits`, undefined, undefined);
}

/**
 * Get Shopify OAuth connect URL
 * Initiate the Shopify OAuth flow for a store. Shopify is a connect-only platform: the connected account does not publish social posts, it powers the Blogs API (`/v1/accounts/{accountId}/blogs`). Returns an `authUrl` to redirect the merchant to; after they approve the install, Shopify redirects their browser to Zernio's callback, the account is created on the profile (platform `shopify`), and the browser is redirected to `redirect_url` (or the Zernio dashboard when omitted). Requested scopes are `read_content` and `write_content` (content only; no customer or order data). Connecting the same pr…
 * GET /v1/connect/shopify
 */
export function getShopifyConnectUrl(query: { profileId: string; shop: string; redirect_url?: string }) {
  return zernioCall("GET", "/v1/connect/shopify", query, undefined);
}

/**
 * Get Slack account settings
 * Returns the connected Slack channel details and the default message identity (name and avatar shown as the author on every post, with Slack's APP badge). The identity applies to messages only; the app's own Slack profile is global and cannot be changed per workspace.
 * GET /v1/accounts/{accountId}/slack-settings
 */
export function getSlackSettings(accountId: string) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/slack-settings`, undefined, undefined);
}

/**
 * Get subreddit rules
 * Returns a subreddit's posting rules plus Reddit's site-wide rules, so you can check them before submitting and avoid a removal. Use this alongside `POST /v1/tools/validate/subreddit`, which only confirms that a subreddit exists and reports its basic posting settings.
 * GET /v1/accounts/{accountId}/reddit-subreddits/{subreddit}/rules
 */
export function getSubredditRules(accountId: string, subreddit: string) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/reddit-subreddits/${encodeURIComponent(String(subreddit))}/rules`, undefined, undefined);
}

/**
 * Get TG bot commands
 * Get the bot commands configuration for a Telegram account.
 * GET /v1/accounts/{accountId}/telegram-commands
 */
export function getTelegramCommands(accountId: string) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/telegram-commands`, undefined, undefined);
}

/**
 * Generate Telegram code
 * Generate an access code (valid 15 minutes) for connecting a Telegram channel or group. Add the bot as admin, then send the code + @yourchannel to the bot. Poll PATCH /v1/connect/telegram to check status.
 * GET /v1/connect/telegram
 */
export function getTelegramConnectStatus(query: { profileId: string }) {
  return zernioCall("GET", "/v1/connect/telegram", query, undefined);
}

/**
 * Get TikTok creator info
 * Returns TikTok creator details, available privacy levels, posting limits, and commercial content options for a specific TikTok account. Only works with TikTok accounts.
 * GET /v1/accounts/{accountId}/tiktok/creator-info
 */
export function getTikTokCreatorInfo(accountId: string, query?: { mediaType?: "video" | "photo" }) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/tiktok/creator-info`, query, undefined);
}

/**
 * Get user
 * Returns a single user's details by ID, including name, email, and role.
 * GET /v1/users/{userId}
 */
export function getUser(userId: string) {
  return zernioCall("GET", `/v1/users/${encodeURIComponent(String(userId))}`, undefined, undefined);
}

/**
 * Get business profile
 * Retrieve the WhatsApp Business profile for the account (about, address, description, email, websites, etc.).
 * GET /v1/whatsapp/business-profile
 */
export function getWhatsAppBusinessProfile(query: { accountId: string }) {
  return zernioCall("GET", "/v1/whatsapp/business-profile", query, undefined);
}

/**
 * Get business username
 * Fetch the current WhatsApp Business username and its approval status. Username status can be `approved` (active), `reserved` (pending activation), or `none` (no username set).
 * GET /v1/whatsapp/business-profile/username
 */
export function getWhatsappBusinessUsername(query: { accountId: string }) {
  return zernioCall("GET", "/v1/whatsapp/business-profile/username", query, undefined);
}

/**
 * Get username suggestions
 * Retrieve a list of available WhatsApp Business username suggestions based on the account's business profile name. Use these to help users discover valid, unclaimed usernames.
 * GET /v1/whatsapp/business-profile/username/suggestions
 */
export function getWhatsappBusinessUsernameSuggestions(query: { accountId: string }) {
  return zernioCall("GET", "/v1/whatsapp/business-profile/username/suggestions", query, undefined);
}

/**
 * Get calling config for an account
 * Returns the local calling configuration snapshot for the connected WhatsApp account: whether calling is enabled, the forward-to destination URI, recording opt-in state, the phone number record id (use as `{id}` on the read-write calling sub-resource at /v1/phone-numbers/{id}/whatsapp/calling) and whether SIP digest credentials are stored (the encrypted password itself is never returned). Also carries account-level extras (billing eligibility, current-period spend) that the number-keyed GET does not.
 * GET /v1/whatsapp/calling
 */
export function getWhatsAppCallingConfig(query: { accountId: string }) {
  return zernioCall("GET", "/v1/whatsapp/calling", query, undefined);
}

/**
 * Get CTWA conversions dataset
 * Returns the Meta Click-to-WhatsApp conversions dataset currently linked to the WhatsApp account, if one has been provisioned. Reads only from the stored `metadata.metaCapiDatasetId` — never hits Meta, never creates a dataset. Use this to detect whether `POST /v1/whatsapp/conversions` is configured for an account.
 * GET /v1/whatsapp/dataset
 */
export function getWhatsAppDataset(query: { accountId: string }) {
  return zernioCall("GET", "/v1/whatsapp/dataset", query, undefined);
}

/**
 * Get display name status
 * Fetch the current display name and its Meta review status for a WhatsApp Business account. Display name changes require Meta approval and can take 1-3 business days.
 * GET /v1/whatsapp/business-profile/display-name
 */
export function getWhatsAppDisplayName(query: { accountId: string }) {
  return zernioCall("GET", "/v1/whatsapp/business-profile/display-name", query, undefined);
}

/**
 * Get flow
 * Get details for a specific flow, including status, categories, validation errors, and preview URL.
 * GET /v1/whatsapp/flows/{flowId}
 */
export function getWhatsAppFlow(flowId: string, query: { accountId: string; fields?: string }) {
  return zernioCall("GET", `/v1/whatsapp/flows/${encodeURIComponent(String(flowId))}`, query, undefined);
}

/**
 * Get flow JSON asset
 * Get the flow JSON asset metadata, including a temporary download URL for the Flow JSON file.
 * GET /v1/whatsapp/flows/{flowId}/json
 */
export function getWhatsAppFlowJson(flowId: string, query: { accountId: string }) {
  return zernioCall("GET", `/v1/whatsapp/flows/${encodeURIComponent(String(flowId))}/json`, query, undefined);
}

/**
 * Get flow preview URL
 * Get Meta's public web-preview URL for a flow (drafts included), embeddable as an interactive iframe. The link is reused across calls (valid ~30 days); pass invalidate=true to mint a fresh one (the previous link stops working).
 * GET /v1/whatsapp/flows/{flowId}/preview
 */
export function getWhatsAppFlowPreview(flowId: string, query: { accountId: string; invalidate?: boolean }) {
  return zernioCall("GET", `/v1/whatsapp/flows/${encodeURIComponent(String(flowId))}/preview`, query, undefined);
}

/**
 * Look up a library template
 * Look up a single pre-approved Template Library template by its exact name, to introspect its structure before importing it. Most importantly it returns the template's `buttons`: a library template with `URL` / `PHONE_NUMBER` buttons must be created with a matching `library_template_button_inputs` array (see Create Template), or Meta rejects it. Use this to discover which inputs to collect.
 * GET /v1/whatsapp/template-library
 */
export function getWhatsAppLibraryTemplate(query: { accountId: string; name: string; language?: string }) {
  return zernioCall("GET", "/v1/whatsapp/template-library", query, undefined);
}

/**
 * Get template
 * Retrieve one message template variant by name. Meta stores one template per **name + language**, so a name identifies a family of variants, each with its own Meta id. Pass `language` to address one variant. Without it, a name with a single variant resolves to that variant; a name with several returns `409 ambiguous_template` with `details.languages`. A bare language (`es`) matches a single regional variant (`es_ES`); if the family has several regional variants for it, that is also a 409. A full code (`es_ES`) must match exactly. Variants in `PENDING_DELETION` are not part of the family.
 * GET /v1/whatsapp/templates/{templateName}
 */
export function getWhatsAppTemplate(templateName: string, query: { accountId: string; language?: string }) {
  return zernioCall("GET", `/v1/whatsapp/templates/${encodeURIComponent(String(templateName))}`, query, undefined);
}

/**
 * Get template by id
 * Retrieve one template variant by its Meta id, the id every variant of a family has on its own and the one the `whatsapp.template.status_updated` webhook carries.
 * GET /v1/whatsapp/templates/id/{templateId}
 */
export function getWhatsAppTemplateById(templateId: string, query: { accountId: string }) {
  return zernioCall("GET", `/v1/whatsapp/templates/id/${encodeURIComponent(String(templateId))}`, query, undefined);
}

/**
 * List templates
 * List message templates for the WhatsApp Business Account (WABA) associated with the given account. Templates are fetched directly from the WhatsApp Cloud API. One entry per **name + language**: a multi-language template appears once per language, each with its own Meta `id`.
 * GET /v1/whatsapp/templates
 */
export function getWhatsAppTemplates(query: { accountId: string; name?: string; language?: string; status?: "APPROVED" | "REJECTED" | "PENDING" | "PAUSED" | "DISABLED" | "IN_APPEAL" | "PENDING_DELETION" }) {
  return zernioCall("GET", "/v1/whatsapp/templates", query, undefined);
}

/**
 * Get workflow with graph
 * Returns a workflow including its full node/edge graph and run stats.
 * GET /v1/workflows/{workflowId}
 */
export function getWorkflow(workflowId: string) {
  return zernioCall("GET", `/v1/workflows/${encodeURIComponent(String(workflowId))}`, undefined, undefined);
}

/**
 * Get a specific workflow version
 * Returns the full snapshot for a single historical version, including the graph.
 * GET /v1/workflows/{workflowId}/versions/{version}
 */
export function getWorkflowVersion(workflowId: string, version: number) {
  return zernioCall("GET", `/v1/workflows/${encodeURIComponent(String(workflowId))}/versions/${encodeURIComponent(String(version))}`, undefined, undefined);
}

/**
 * Get a YouTube video transcript
 * Returns the caption track YouTube already holds for one of the connected channel's own videos, as plain text plus timed cues. Use it instead of downloading and transcribing the video yourself. Auto-generated (ASR) tracks are included: YouTube serves them to the channel owner, which is what the connected account is. Uploaded tracks win over auto-generated ones when both exist for a language. Caching: we store the transcript on first read and serve it from there afterwards, so you do not need to cache it yourself. A cached read costs no YouTube quota and does not call YouTube at all. `source` t…
 * GET /v1/accounts/{accountId}/youtube-captions
 */
export function getYoutubeCaptions(accountId: string, query: { videoId: string; language?: string; format?: "json" | "srt"; refresh?: boolean }) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/youtube-captions`, query, undefined);
}

/**
 * List YouTube playlists
 * Returns the playlists available for a connected YouTube account. Use this to get a playlist ID when creating a YouTube post with the playlistId field.
 * GET /v1/accounts/{accountId}/youtube-playlists
 */
export function getYoutubePlaylists(accountId: string) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/youtube-playlists`, undefined, undefined);
}

/**
 * Complete OAuth callback
 * Exchange the OAuth authorization code for tokens and connect the account to the specified profile. Facebook, Google Business, Snapchat and WhatsApp are not accepted here: their account identity is a destination chosen after OAuth, which this single-shot exchange cannot do. Connect them through the redirect flow from `GET /v1/connect/{platform}`, or, for WhatsApp Embedded Signup, through `POST /v1/connect/whatsapp/embedded-signup`.
 * POST /v1/connect/{platform}
 */
export function handleOAuthCallback(platform: "instagram" | "twitter" | "threads" | "linkedin" | "youtube" | "tiktok" | "reddit" | "pinterest", body: { code: string; state: string; profileId: string }) {
  return zernioCall("POST", `/v1/connect/${encodeURIComponent(String(platform))}`, undefined, body);
}

/**
 * Connect Telegram directly
 * Connect a Telegram channel/group directly using the chat ID. Alternative to the access code flow. The bot must already be an admin in the channel/group.
 * POST /v1/connect/telegram
 */
export function initiateTelegramConnect(body: { chatId: string; profileId: string }) {
  return zernioCall("POST", "/v1/connect/telegram", undefined, body);
}

/**
 * List groups
 * Returns all account groups visible to the authenticated user. Groups can contain accounts from multiple profiles. For API keys scoped to specific profiles, only groups whose accounts all live in allowed profiles are returned.
 * GET /v1/account-groups
 */
export function listAccountGroups() {
  return zernioCall("GET", "/v1/account-groups", undefined, undefined);
}

/**
 * List accounts
 * Returns connected social accounts. Only includes accounts within the plan limit by default. Follower data requires analytics add-on. Supports optional server-side pagination via page/limit params. When omitted, returns all accounts (backward-compatible). page and limit must be supplied together; out-of-range page/limit values are rejected with 400 rather than silently clamped.
 * GET /v1/accounts
 */
export function listAccounts(query?: { profileId?: string; platform?: string; status?: "connected" | "disconnected"; includeOverLimit?: boolean; page?: number; limit?: number }) {
  return zernioCall("GET", "/v1/accounts", query, undefined);
}

/**
 * List custom conversions
 * The ad account's Meta custom conversions, including archived ones (`isArchived`).
 * GET /v1/accounts/{accountId}/custom-conversions
 * Platforms: meta
 */
export function listCustomConversions(accountId: string, query: { adAccountId: string }) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/custom-conversions`, query, undefined);
}

/**
 * List custom field definitions
 * Returns all custom field definitions. Optionally filter by profile.
 * GET /v1/custom-fields
 */
export function listCustomFields(query?: { profileId?: string }) {
  return zernioCall("GET", "/v1/custom-fields", query, undefined);
}

/**
 * List Facebook pages
 * Returns the list of Facebook Pages the user can manage after OAuth. Extract tempToken and userProfile from the OAuth redirect params and pass them here. Use the X-Connect-Token header if connecting via API key.
 * GET /v1/connect/facebook/select-page
 */
export function listFacebookPages(query: { profileId: string; tempToken: string }) {
  return zernioCall("GET", "/v1/connect/facebook/select-page", query, undefined);
}

/**
 * List GBP locations
 * For headless flows. Returns the list of GBP locations the user can manage. Use pendingDataToken (from the OAuth callback redirect) to list locations without consuming the token, so it remains available for select-location. Use X-Connect-Token header if connecting via API key.
 * GET /v1/connect/googlebusiness/locations
 */
export function listGoogleBusinessLocations(query?: { profileId?: string; pendingDataToken?: string; tempToken?: string; search?: string; filter?: string }) {
  return zernioCall("GET", "/v1/connect/googlebusiness/locations", query, undefined);
}

/**
 * List media
 * Lists media items (photos) for a Google Business Profile location. Returns photo URLs, descriptions, categories, and metadata.
 * GET /v1/accounts/{accountId}/gmb-media
 */
export function listGoogleBusinessMedia(accountId: string, query?: { locationId?: string; pageSize?: number; pageToken?: string }) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/gmb-media`, query, undefined);
}

/**
 * List action links
 * Lists place action links for a Google Business Profile location. Place actions are the booking, ordering, and reservation buttons that appear on your listing.
 * GET /v1/accounts/{accountId}/gmb-place-actions
 */
export function listGoogleBusinessPlaceActions(accountId: string, query?: { locationId?: string; pageSize?: number; pageToken?: string }) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/gmb-place-actions`, query, undefined);
}

/**
 * List Pinterest boards
 * For headless flows. Returns Pinterest boards the user can post to. Use X-Connect-Token from the redirect URL.
 * GET /v1/connect/pinterest/select-board
 */
export function listPinterestBoardsForSelection(query: { profileId: string; tempToken: string }) {
  return zernioCall("GET", "/v1/connect/pinterest/select-board", query, undefined);
}

/**
 * List profiles
 * Returns profiles sorted default-first, then by creation date. Filter with name (exact match) and paginate with limit/skip; without those params the full list is returned unchanged. Use includeOverLimit=true to include profiles that exceed the plan limit.
 * GET /v1/profiles
 */
export function listProfiles(query?: { includeOverLimit?: boolean; name?: string; limit?: number; skip?: number }) {
  return zernioCall("GET", "/v1/profiles", query, undefined);
}

/**
 * List Snapchat profiles
 * For headless flows. Returns Snapchat Public Profiles the user can post to. Use X-Connect-Token from the redirect URL.
 * GET /v1/connect/snapchat/select-profile
 */
export function listSnapchatProfiles(query: { profileId: string; tempToken: string }) {
  return zernioCall("GET", "/v1/connect/snapchat/select-profile", query, undefined);
}

/**
 * List users
 * Returns all users in the workspace including roles and profile access. Also returns the currentUserId of the caller.
 * GET /v1/users
 */
export function listUsers() {
  return zernioCall("GET", "/v1/users", undefined, undefined);
}

/**
 * List account notifications
 * Returns Meta-originated events recorded for a WhatsApp account, newest first: template review outcomes (approved, rejected, paused, category changes) and WABA status changes (restricted, disabled, reinstated, disconnected). Events are captured from Meta webhooks as they happen; the feed starts at the account's first recorded event and is not backfilled. Complements the push events `whatsapp.template.status_updated` and `account.disconnected` with a pollable history.
 * GET /v1/whatsapp/account-events
 */
export function listWhatsAppAccountEvents(query: { accountId: string; limit?: number }) {
  return zernioCall("GET", "/v1/whatsapp/account-events", query, undefined);
}

/**
 * List flows
 * List all WhatsApp Flows for the Business Account (WABA) associated with the given account.
 * GET /v1/whatsapp/flows
 */
export function listWhatsAppFlows(query: { accountId: string }) {
  return zernioCall("GET", "/v1/whatsapp/flows", query, undefined);
}

/**
 * List flow versions
 * List the flow's version history (the clone lineage Zernio tracks, since Meta has no native versioning), newest version first. Each entry is enriched with the version's live name and status from Meta. A flow with no lineage returns just itself as version 1.
 * GET /v1/whatsapp/flows/{flowId}/versions
 */
export function listWhatsAppFlowVersions(flowId: string, query: { accountId: string }) {
  return zernioCall("GET", `/v1/whatsapp/flows/${encodeURIComponent(String(flowId))}/versions`, query, undefined);
}

/**
 * List numbers for selection
 * Fetch the WhatsApp phone numbers available across the user's WhatsApp Business Accounts (WABAs) after a headless OAuth flow. WhatsApp OAuth grants access at the WABA level. When a connected WABA has 2 or more phone numbers, you must call this endpoint to list them and then `POST /v1/connect/whatsapp/select-phone-number` to bind one to the Zernio profile. Single-phone WABAs auto-complete during the OAuth callback and never reach this endpoint. Use the `profileId` and `tempToken` returned in the headless redirect (`step=select_phone_number`). Alternative: if you already know `wabaId` and `phone…
 * GET /v1/connect/whatsapp/select-phone-number
 */
export function listWhatsAppPhoneNumbers(query: { profileId: string; tempToken: string }) {
  return zernioCall("GET", "/v1/connect/whatsapp/select-phone-number", query, undefined);
}

/**
 * List workflows
 * Returns workflows with run stats. Filter by status or profile.
 * GET /v1/workflows
 */
export function listWorkflows(query?: { profileId?: string; status?: "draft" | "active" | "paused"; limit?: number; skip?: number }) {
  return zernioCall("GET", "/v1/workflows", query, undefined);
}

/**
 * List a workflow's version history
 * Returns the snapshot history. A new version is recorded automatically before every PATCH to `nodes` / `edges` / `entryNodeId`, and explicitly when a previous version is restored. Lightweight list — call `getWorkflowVersion` for the full snapshot graph.
 * GET /v1/workflows/{workflowId}/versions
 */
export function listWorkflowVersions(workflowId: string) {
  return zernioCall("GET", `/v1/workflows/${encodeURIComponent(String(workflowId))}/versions`, undefined, undefined);
}

/**
 * Move account to another profile
 * Moves a connected social account to a different profile owned by the same user. The target profile must belong to the same user as the account. For API keys restricted to specific profiles, BOTH the source account's current profile AND the target profile must be in the key's allowed set. Calls with a target profile outside the key's scope return 403.
 * PATCH /v1/accounts/{accountId}
 */
export function moveAccountToProfile(accountId: string, body: { profileId: string }) {
  return zernioCall("PATCH", `/v1/accounts/${encodeURIComponent(String(accountId))}`, undefined, body);
}

/**
 * Pause workflow
 * Stop matching new inbound messages. In-flight executions continue to completion. Idempotent.
 * POST /v1/workflows/{workflowId}/pause
 */
export function pauseWorkflow(workflowId: string) {
  return zernioCall("POST", `/v1/workflows/${encodeURIComponent(String(workflowId))}/pause`, undefined, undefined);
}

/**
 * Publish flow
 * Publish a DRAFT flow. This is irreversible. Once published, the flow and its JSON become immutable and the flow can be sent to users. To update a published flow, create a new flow (optionally cloning this one via cloneFlowId).
 * POST /v1/whatsapp/flows/{flowId}/publish
 */
export function publishWhatsAppFlow(flowId: string, body: { accountId: string }) {
  return zernioCall("POST", `/v1/whatsapp/flows/${encodeURIComponent(String(flowId))}/publish`, undefined, body);
}

/**
 * Register a connected WhatsApp number on the Cloud API
 * Re-runs Meta's Cloud API registration for a WhatsApp account that is already connected. Use it when the number has its own two-step verification PIN: the connect flows register with a default PIN, Meta rejects that with error 133005, and the number then fails every send with the misleading '(#200) You do not have the necessary permission to send messages' while the account still shows as connected. The PIN is used for this call only and is not stored.
 * POST /v1/accounts/{accountId}/whatsapp/register
 */
export function registerWhatsAppNumber(accountId: string, body?: { pin?: string }) {
  return zernioCall("POST", `/v1/accounts/${encodeURIComponent(String(accountId))}/whatsapp/register`, undefined, body);
}

/**
 * Restore a workflow version
 * Replace the current graph with the named version's snapshot. Before the swap, the current graph is itself snapshotted as a new version, so a restore is reversible. The workflow must be in `draft` or `paused` status (same gate as a normal graph edit). The returned workflow carries `restoredFromVersion` so the UI can surface which version was rolled back to.
 * POST /v1/workflows/{workflowId}/versions/{version}/restore
 */
export function restoreWorkflowVersion(workflowId: string, version: number) {
  return zernioCall("POST", `/v1/workflows/${encodeURIComponent(String(workflowId))}/versions/${encodeURIComponent(String(version))}/restore`, undefined, undefined);
}

/**
 * Search Instagram audio
 * Search Instagram's audio catalog (licensed music or original sounds), or list what is currently trending by omitting `q`. Returns up to ~30 assets; Meta exposes no pagination on this edge. Pass the returned `audioId` as `platformSpecificData.audioConfiguration.audioId` when creating a Reel to publish it with that track. Requires an Instagram account connected via **Facebook Login**. Meta hosts this catalog on graph.facebook.com only, so accounts connected with classic Instagram Login receive a 400 (`instagram_audio_requires_facebook_login`) and must be reconnected choosing the Facebook option.
 * GET /v1/accounts/{accountId}/instagram/audio
 */
export function searchInstagramAudio(accountId: string, query: { audioType: "music" | "original_sound"; q?: string }) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/instagram/audio`, query, undefined);
}

/**
 * Select Facebook page
 * Complete the headless flow by saving the user's selected Facebook page. Pass the userProfile from the OAuth redirect and use X-Connect-Token if connecting via API key.
 * POST /v1/connect/facebook/select-page
 */
export function selectFacebookPage(body: { profileId: string; pageId: string; tempToken: string; userProfile: { id?: string; name?: string; profilePicture?: string }; redirect_url?: string }) {
  return zernioCall("POST", "/v1/connect/facebook/select-page", undefined, body);
}

/**
 * Select GBP location
 * Complete the headless GBP flow by saving the user's selected location. The pendingDataToken is returned in your redirect URL after OAuth completes (step=select_location). Tokens and profile data are stored server-side, so only the pendingDataToken is needed here. Use X-Connect-Token header if connecting via API key.
 * POST /v1/connect/googlebusiness/select-location
 */
export function selectGoogleBusinessLocation(body: { profileId: string; locationId: string; accountId?: string; pendingDataToken: string; redirect_url?: string }) {
  return zernioCall("POST", "/v1/connect/googlebusiness/select-location", undefined, body);
}

/**
 * Select LinkedIn org
 * Complete the LinkedIn connection flow. Set accountType to "personal" or "organization" to connect as a company page. Use X-Connect-Token if connecting via API key.
 * POST /v1/connect/linkedin/select-organization
 */
export function selectLinkedInOrganization(body: { profileId: string; tempToken: string; userProfile: Record<string, unknown>; accountType: "personal" | "organization"; selectedOrganization?: { id: string; urn: string; name: string; logoUrl?: string; vanityName?: string }; redirect_url?: string }) {
  return zernioCall("POST", "/v1/connect/linkedin/select-organization", undefined, body);
}

/**
 * Select Pinterest board
 * Complete the Pinterest connection flow. After OAuth, use this endpoint to save the selected board and complete the account connection. Use the X-Connect-Token header if you initiated the connection via API key.
 * POST /v1/connect/pinterest/select-board
 */
export function selectPinterestBoard(body: { profileId: string; boardId: string; boardName?: string; tempToken: string; userProfile?: Record<string, unknown>; refreshToken?: string; expiresIn?: number; redirect_url?: string }) {
  return zernioCall("POST", "/v1/connect/pinterest/select-board", undefined, body);
}

/**
 * Select Snapchat profile
 * Complete the Snapchat connection flow by saving the selected Public Profile. Snapchat requires a Public Profile to publish content. Use X-Connect-Token if connecting via API key.
 * POST /v1/connect/snapchat/select-profile
 */
export function selectSnapchatProfile(body: { profileId: string; selectedPublicProfile: { id: string; display_name: string; username?: string; profile_image_url?: string; subscriber_count?: number }; tempToken: string; userProfile: Record<string, unknown>; refreshToken?: string; expiresIn?: number; redirect_url?: string }) {
  return zernioCall("POST", "/v1/connect/snapchat/select-profile", undefined, body);
}

/**
 * Set IG ice breakers
 * Set ice breakers for an Instagram account. Max 4 ice breakers, question max 80 chars.
 * PUT /v1/accounts/{accountId}/instagram-ice-breakers
 */
export function setInstagramIceBreakers(accountId: string, body: { ice_breakers: { question: string; payload: string }[] }) {
  return zernioCall("PUT", `/v1/accounts/${encodeURIComponent(String(accountId))}/instagram-ice-breakers`, undefined, body);
}

/**
 * Set FB persistent menu
 * Set the persistent menu for a Facebook Messenger account. Max 3 top-level items, max 5 nested items.
 * PUT /v1/accounts/{accountId}/messenger-menu
 */
export function setMessengerMenu(accountId: string, body: { persistent_menu: Record<string, unknown>[] }) {
  return zernioCall("PUT", `/v1/accounts/${encodeURIComponent(String(accountId))}/messenger-menu`, undefined, body);
}

/**
 * Set Reddit post flair
 * Applies a flair to a post the connected account already published. Use the GET on this path to list the available `flairTemplateId` values for the subreddit. Flair can also be set at submit time by passing `flairId` in `platformSpecificData` when creating the post. This endpoint is for changing it afterwards. The subreddit must allow users to select their own post flair. Setting flair on another user's post requires moderator permissions, which Zernio does not request.
 * POST /v1/accounts/{accountId}/reddit-flairs
 */
export function setRedditPostFlair(accountId: string, body: { subreddit: string; postId: string; flairTemplateId: string; text?: string }) {
  return zernioCall("POST", `/v1/accounts/${encodeURIComponent(String(accountId))}/reddit-flairs`, undefined, body);
}

/**
 * Set TG bot commands
 * Set bot commands for a Telegram account.
 * PUT /v1/accounts/{accountId}/telegram-commands
 */
export function setTelegramCommands(accountId: string, body: { commands: { command: string; description: string }[] }) {
  return zernioCall("PUT", `/v1/accounts/${encodeURIComponent(String(accountId))}/telegram-commands`, undefined, body);
}

/**
 * Set business username
 * Claim or transfer a WhatsApp Business username for the account. Username rules: 3-35 characters, letters/digits/period/underscore only, must contain at least one letter, no leading or trailing periods, no consecutive periods, no `www` prefix, no domain TLD suffix (e.g. `.com`). If the desired username is currently held by another account, pass `transferAction: "force_transfer"` to request a transfer. On failure the API returns a standard error envelope with one of these codes: `whatsapp_username_unavailable` (already taken and transfer not requested), `whatsapp_username_ineligible` (account n…
 * POST /v1/whatsapp/business-profile/username
 */
export function setWhatsappBusinessUsername(body: { accountId: string; username: string; transferAction?: "none" | "force_transfer" }) {
  return zernioCall("POST", "/v1/whatsapp/business-profile/username", undefined, body);
}

/**
 * Start a verification
 * Starts a verification for the location. This is a mutating action: depending on `method`, Google mails a postcard, places a call, or sends an SMS/email to the business. Submit the resulting code with POST /gmb-verifications/{verificationId}/complete. Use POST /gmb-verifications/options first to discover which methods are eligible.
 * POST /v1/accounts/{accountId}/gmb-verifications
 */
export function startGoogleBusinessVerification(accountId: string, query: { locationId?: string } | undefined, body: { method: "ADDRESS" | "EMAIL" | "PHONE_CALL" | "SMS" | "AUTO" | "VETTED_PARTNER"; languageCode?: string; phoneNumber?: string; emailAddress?: string; mailerContact?: Record<string, unknown>; context?: Record<string, unknown> }) {
  return zernioCall("POST", `/v1/accounts/${encodeURIComponent(String(accountId))}/gmb-verifications`, query, body);
}

/**
 * Update account
 * Updates a connected social account's display name or username override. For X/Twitter accounts on usage-based billing, also accepts an `xCapabilities` object to toggle background API operations that incur X API pass-through costs. Both fields are opt-in (default `false`) — when off, no analytics syncs or DM polling are performed for that account, and no API call is metered for those operations. Publishing and deleting posts are always available regardless of these toggles. Setting `xCapabilities` on a non-X account returns 400.
 * PUT /v1/accounts/{accountId}
 */
export function updateAccount(accountId: string, body: { username?: string; displayName?: string; xCapabilities?: { analytics?: boolean; inbox?: boolean } }) {
  return zernioCall("PUT", `/v1/accounts/${encodeURIComponent(String(accountId))}`, undefined, body);
}

/**
 * Update group
 * Updates the name or account list of an existing group. You can rename the group, change its accounts, or both.
 * PUT /v1/account-groups/{groupId}
 */
export function updateAccountGroup(groupId: string, body: { name?: string; accountIds?: string[] }) {
  return zernioCall("PUT", `/v1/account-groups/${encodeURIComponent(String(groupId))}`, undefined, body);
}

/**
 * Update Bluesky account settings
 * Set or clear the account's default post languages. 1-3 BCP-47 codes (e.g. "pt", "en-US"), the same validation as per-post langs; explicit null clears the default. Per-post platformSpecificData.langs always overrides this default. Applies to posts published after the change; already-published posts cannot be retagged (Bluesky has no post edit).
 * PATCH /v1/accounts/{accountId}/bluesky-settings
 */
export function updateBlueskySettings(accountId: string, body: { defaultLangs: unknown }) {
  return zernioCall("PATCH", `/v1/accounts/${encodeURIComponent(String(accountId))}/bluesky-settings`, undefined, body);
}

/**
 * Update custom field
 * Update a custom field definition. The field type cannot be changed after creation.
 * PATCH /v1/custom-fields/{fieldId}
 */
export function updateCustomField(fieldId: string, body: { name?: string; options?: string[] }) {
  return zernioCall("PATCH", `/v1/custom-fields/${encodeURIComponent(String(fieldId))}`, undefined, body);
}

/**
 * Update Discord settings
 * Update Discord account settings. Supports two operations (can be combined): 1. **Webhook identity** - Set the default display name and avatar that appear as the message author on every post. These are account-level defaults; individual posts can override them via platformSpecificData.webhookUsername / webhookAvatarUrl. 2. **Switch channel** - Move the connection to a different channel in the same guild. A new webhook is automatically created in the target channel.
 * PATCH /v1/accounts/{accountId}/discord-settings
 */
export function updateDiscordSettings(accountId: string, body: { webhookUsername?: string; webhookAvatarUrl?: string; channelId?: string }) {
  return zernioCall("PATCH", `/v1/accounts/${encodeURIComponent(String(accountId))}/discord-settings`, undefined, body);
}

/**
 * Update Facebook page
 * Switch which Facebook Page is active for a connected account.
 * PUT /v1/accounts/{accountId}/facebook-page
 */
export function updateFacebookPage(accountId: string, body: { selectedPageId: string }) {
  return zernioCall("PUT", `/v1/accounts/${encodeURIComponent(String(accountId))}/facebook-page`, undefined, body);
}

/**
 * Update GBP location
 * Switch which GBP location is active for a connected account.
 * PUT /v1/accounts/{accountId}/gmb-locations
 */
export function updateGmbLocation(accountId: string, body: { selectedLocationId: string; googleAccountId?: string }) {
  return zernioCall("PUT", `/v1/accounts/${encodeURIComponent(String(accountId))}/gmb-locations`, undefined, body);
}

/**
 * Update attributes
 * Updates location attributes (amenities, services, etc.). The attributeMask specifies which attributes to update (comma-separated).
 * PUT /v1/accounts/{accountId}/gmb-attributes
 */
export function updateGoogleBusinessAttributes(accountId: string, query: { locationId?: string } | undefined, body: { attributes: ({ name: string; valueType?: "ATTRIBUTE_VALUE_TYPE_UNSPECIFIED" | "BOOL" | "ENUM" | "URL" | "REPEATED_ENUM"; values?: unknown[]; repeatedEnumValue?: { setValues?: unknown[]; unsetValues?: unknown[] }; uriValues?: { uri: unknown }[] })[]; attributeMask: string }) {
  return zernioCall("PUT", `/v1/accounts/${encodeURIComponent(String(accountId))}/gmb-attributes`, query, body);
}

/**
 * Update food menus
 * Updates food menus for a GBP location. Send the full menus array. Use updateMask for partial updates.
 * PUT /v1/accounts/{accountId}/gmb-food-menus
 */
export function updateGoogleBusinessFoodMenus(accountId: string, query: { locationId?: string } | undefined, body: { menus: unknown[]; updateMask?: string }) {
  return zernioCall("PUT", `/v1/accounts/${encodeURIComponent(String(accountId))}/gmb-food-menus`, query, body);
}

/**
 * Update location details
 * Updates GBP location details. The updateMask field is required and specifies which fields to update. This endpoint proxies Google's Business Information API locations.patch, so any valid updateMask field is supported. Common fields: regularHours, specialHours, profile.description, websiteUri, phoneNumbers, categories, serviceItems.
 * PUT /v1/accounts/{accountId}/gmb-location-details
 */
export function updateGoogleBusinessLocationDetails(accountId: string, query: { locationId?: string } | undefined, body: { updateMask: string; regularHours?: { periods?: { openDay?: string; openTime?: string; closeDay?: string; closeTime?: string }[] }; specialHours?: { specialHourPeriods?: { startDate?: { year?: unknown; month?: unknown; day?: unknown }; endDate?: { year?: unknown; month?: unknown; day?: unknown }; openTime?: string; closeTime?: string; closed?: boolean }[] }; profile?: { description?: string }; websiteUri?: string; phoneNumbers?: { primaryPhone?: string; additionalPhones?: string[] }; categories?: { primaryCategory?: { name?: string }; additionalCategories?: { name?: string }[] }; serviceItems?: { structuredServiceItem?: { serviceTypeId?: string; description?: string }; freeFormServiceItem?: { category?: string; label?: { displayName?: unknown; languageCode?: unknown } }; price?: { currencyCode?: string; units?: string; nanos?: number } }[] }) {
  return zernioCall("PUT", `/v1/accounts/${encodeURIComponent(String(accountId))}/gmb-location-details`, query, body);
}

/**
 * Update action link
 * Updates a place action link (change URL or action type). Only the fields included in the request body will be updated.
 * PATCH /v1/accounts/{accountId}/gmb-place-actions
 */
export function updateGoogleBusinessPlaceAction(accountId: string, query: { locationId?: string } | undefined, body: { name: string; uri?: string; placeActionType?: "APPOINTMENT" | "ONLINE_APPOINTMENT" | "DINING_RESERVATION" | "FOOD_ORDERING" | "FOOD_DELIVERY" | "FOOD_TAKEOUT" | "SHOP_ONLINE" }) {
  return zernioCall("PATCH", `/v1/accounts/${encodeURIComponent(String(accountId))}/gmb-place-actions`, query, body);
}

/**
 * Replace services
 * Replaces the entire service list for a location. Google's API requires full replacement; individual item updates are not supported. Each service can be structured (using a predefined serviceTypeId) or free-form (custom label).
 * PUT /v1/accounts/{accountId}/gmb-services
 */
export function updateGoogleBusinessServices(accountId: string, query: { locationId?: string } | undefined, body: { serviceItems: { structuredServiceItem?: { serviceTypeId: string; description?: string }; freeFormServiceItem?: { category: string; label: { displayName: unknown; description?: unknown; languageCode?: unknown } }; price?: { currencyCode?: string; units?: string; nanos?: number } }[] }) {
  return zernioCall("PUT", `/v1/accounts/${encodeURIComponent(String(accountId))}/gmb-services`, query, body);
}

/**
 * Switch LinkedIn account type
 * Switch a LinkedIn account between personal profile and organization (company page) posting.
 * PUT /v1/accounts/{accountId}/linkedin-organization
 */
export function updateLinkedInOrganization(accountId: string, body: { accountType: "personal" | "organization"; selectedOrganization?: Record<string, unknown> }) {
  return zernioCall("PUT", `/v1/accounts/${encodeURIComponent(String(accountId))}/linkedin-organization`, undefined, body);
}

/**
 * Set default Pinterest board
 * Sets the default board used when publishing pins for this account.
 * PUT /v1/accounts/{accountId}/pinterest-boards
 */
export function updatePinterestBoards(accountId: string, body: { defaultBoardId: string; defaultBoardName?: string }) {
  return zernioCall("PUT", `/v1/accounts/${encodeURIComponent(String(accountId))}/pinterest-boards`, undefined, body);
}

/**
 * Update profile
 * Updates a profile's name, description, color, or default status.
 * PUT /v1/profiles/{profileId}
 */
export function updateProfile(profileId: string, body: { name?: string; description?: unknown; color?: string; isDefault?: boolean }) {
  return zernioCall("PUT", `/v1/profiles/${encodeURIComponent(String(profileId))}`, undefined, body);
}

/**
 * Set default subreddit
 * Sets the default subreddit used when publishing posts for this Reddit account.
 * PUT /v1/accounts/{accountId}/reddit-subreddits
 */
export function updateRedditSubreddits(accountId: string, body: { defaultSubreddit: string }) {
  return zernioCall("PUT", `/v1/accounts/${encodeURIComponent(String(accountId))}/reddit-subreddits`, undefined, body);
}

/**
 * Update Slack account settings
 * Set or clear the default message identity for this channel. Empty string clears a field; per-post platformSpecificData.username/iconUrl still override these defaults.
 * PATCH /v1/accounts/{accountId}/slack-settings
 */
export function updateSlackSettings(accountId: string, body: { defaultUsername?: string; defaultIconUrl?: string }) {
  return zernioCall("PATCH", `/v1/accounts/${encodeURIComponent(String(accountId))}/slack-settings`, undefined, body);
}

/**
 * Update business profile
 * Update the WhatsApp Business profile. All fields are optional; only provided fields will be updated. Constraints: about max 139 chars, description max 512 chars, max 2 websites.
 * POST /v1/whatsapp/business-profile
 */
export function updateWhatsAppBusinessProfile(body: { accountId: string; about?: string; address?: string; description?: string; email?: string; websites?: string[]; vertical?: string; profilePictureHandle?: string }) {
  return zernioCall("POST", "/v1/whatsapp/business-profile", undefined, body);
}

/**
 * Request display name change
 * Submit a display name change request for the WhatsApp Business account. The new name must follow WhatsApp naming guidelines (3-512 characters, must represent your business). Changes require Meta review and approval, which typically takes 1-3 business days.
 * POST /v1/whatsapp/business-profile/display-name
 */
export function updateWhatsAppDisplayName(body: { accountId: string; displayName: string }) {
  return zernioCall("POST", "/v1/whatsapp/business-profile/display-name", undefined, body);
}

/**
 * Update flow
 * Update metadata (name, categories, endpointUri) of a DRAFT flow. Published flows are immutable.
 * PATCH /v1/whatsapp/flows/{flowId}
 */
export function updateWhatsAppFlow(flowId: string, body: { accountId: string; name?: string; categories?: ("SIGN_UP" | "SIGN_IN" | "APPOINTMENT_BOOKING" | "LEAD_GENERATION" | "CONTACT_US" | "CUSTOMER_SUPPORT" | "SURVEY" | "OTHER")[]; endpointUri?: string }) {
  return zernioCall("PATCH", `/v1/whatsapp/flows/${encodeURIComponent(String(flowId))}`, undefined, body);
}

/**
 * Update template
 * Update one variant's components. Name, language and category cannot change after creation. Meta stores one template per **name + language**, so a name identifies a family of variants, each with its own Meta id. Pass `language` to address one variant. Without it, a name with a single variant resolves to that variant; a name with several returns `409 ambiguous_template` with `details.languages`. A bare language (`es`) matches a single regional variant (`es_ES`); if the family has several regional variants for it, that is also a 409. A full code (`es_ES`) must match exactly. Variants in `PENDING…
 * PATCH /v1/whatsapp/templates/{templateName}
 */
export function updateWhatsAppTemplate(templateName: string, body: { accountId: string; language?: string; components: unknown[] }) {
  return zernioCall("PATCH", `/v1/whatsapp/templates/${encodeURIComponent(String(templateName))}`, undefined, body);
}

/**
 * Update template by id
 * Update one variant's components by its Meta id. Name, language and category cannot change. Meta only allows editing templates in `APPROVED`, `REJECTED` or `PAUSED` state; an approved template can be edited once per 24 hours and up to 10 times per 30 days. A successful update sends the variant back to Meta for review, so the `status` returned here is normally `PENDING`. The final outcome arrives on the `whatsapp.template.status_updated` webhook (which carries the variant's `templateId` and `language`). A variant already in `PENDING` cannot be edited again until Meta finishes reviewing it.
 * PATCH /v1/whatsapp/templates/id/{templateId}
 */
export function updateWhatsAppTemplateById(templateId: string, body: { accountId: string; components: unknown[] }) {
  return zernioCall("PATCH", `/v1/whatsapp/templates/id/${encodeURIComponent(String(templateId))}`, undefined, body);
}

/**
 * Update workflow
 * Update name, description, the graph, or reassign to a different account. The graph can only be modified while the workflow is draft or paused. Account swaps re-validate the graph against the new platform (so e.g. moving from WhatsApp to Facebook surfaces a `start_call` node as an error instead of silently saving an unrunnable graph).
 * PATCH /v1/workflows/{workflowId}
 */
export function updateWorkflow(workflowId: string, body?: { name?: string; description?: string; nodes?: unknown[]; edges?: unknown[]; entryNodeId?: unknown; accountId?: string }) {
  return zernioCall("PATCH", `/v1/workflows/${encodeURIComponent(String(workflowId))}`, undefined, body);
}

/**
 * Set default YouTube playlist
 * Sets the default playlist used when publishing videos for this account. When a post does not specify a playlistId, the default playlist is not automatically used (it is stored for client-side convenience).
 * PUT /v1/accounts/{accountId}/youtube-playlists
 */
export function updateYoutubeDefaultPlaylist(accountId: string, body: { defaultPlaylistId: string; defaultPlaylistName?: string }) {
  return zernioCall("PUT", `/v1/accounts/${encodeURIComponent(String(accountId))}/youtube-playlists`, undefined, body);
}

/**
 * Upload flow JSON
 * Upload or update the Flow JSON for a DRAFT flow. The Flow JSON defines all screens, components (text inputs, dropdowns, date pickers, etc.), and navigation. Meta validates the JSON on upload and returns any validation errors. See: https://developers.facebook.com/docs/whatsapp/flows/reference/flowjson
 * PUT /v1/whatsapp/flows/{flowId}/json
 */
export function uploadWhatsAppFlowJson(flowId: string, body: { accountId: string; flow_json: unknown }) {
  return zernioCall("PUT", `/v1/whatsapp/flows/${encodeURIComponent(String(flowId))}/json`, undefined, body);
}

/**
 * Upload profile picture
 * Upload a new profile picture for the WhatsApp Business Profile. Uses Meta's resumable upload API under the hood: creates an upload session, uploads the image bytes, then updates the business profile with the resulting handle. Provide the image either as a binary upload (`multipart/form-data` with `file`) or as a download URL (`application/json` with `url`) — with a URL we fetch the image server-side and upload the bytes for you. Meta's profile-photo API is bytes-only, so there is no direct URL passthrough. JPEG/PNG, max 5MB either way.
 * POST /v1/whatsapp/business-profile/photo
 */
export function uploadWhatsAppProfilePhoto(body: FormData) {
  return zernioCall("POST", "/v1/whatsapp/business-profile/photo", undefined, body);
}


/* ======================================================================
 * admin-plane — 6 operations
 * ====================================================================== */

/**
 * Create key
 * Creates a new API key with an optional expiry. The full key value is only returned once in the response.
 * POST /v1/api-keys
 */
export function createApiKey(body: { name: string; expiresIn?: number; scope?: "full" | "profiles"; profileIds?: string[]; permission?: "read-write" | "read"; disabledResourceGroups?: ("publishing" | "engagement" | "messages" | "contacts" | "analytics" | "ads" | "telephony" | "accounts" | "billing" | "webhooks")[] }) {
  return zernioCall("POST", "/v1/api-keys", undefined, body);
}

/**
 * Create invite token
 * Generate a secure invite link to grant team members access to your profiles. Invites expire after 7 days and are single-use. Returns 403 when a requested profile is not found or not owned, or when called with a restricted (zrk_) API key: invite management is admin-plane.
 * POST /v1/invite/tokens
 */
export function createInviteToken(body: { scope: "all" | "profiles"; profileIds?: string[]; role?: "admin" | "member" | "billing_admin" | "viewer"; readOnly?: boolean }) {
  return zernioCall("POST", "/v1/invite/tokens", undefined, body);
}

/**
 * Delete key
 * Permanently revokes and deletes an API key.
 * DELETE /v1/api-keys/{keyId}
 */
export function deleteApiKey(keyId: string) {
  return zernioCall("DELETE", `/v1/api-keys/${encodeURIComponent(String(keyId))}`, undefined, undefined);
}

/**
 * List keys
 * Returns all API keys for the authenticated user. Keys are returned with a preview only, not the full key value.
 * GET /v1/api-keys
 */
export function listApiKeys() {
  return zernioCall("GET", "/v1/api-keys", undefined, undefined);
}

/**
 * List connected apps
 * Returns the OAuth clients (AI assistants and MCP connectors) the authenticated user has authorized and that still hold a live token. Requires a session or a full-access API key. A profile-scoped API key, a restricted (zrk_) API key, or an OAuth access token is rejected with 403: an app must not be able to enumerate its sibling authorizations, and connected-app management is admin-plane.
 * GET /v1/me/connected-apps
 */
export function listConnectedApps() {
  return zernioCall("GET", "/v1/me/connected-apps", undefined, undefined);
}

/**
 * Revoke connected app
 * Ends an app's access: invalidates the client's pending authorization codes and revokes every live token it holds for the authenticated user. Takes effect on the app's next request. Idempotent while the authorization is still on record: revoking an app that was already revoked returns 200 with `revokedTokens: 0`. Requires a session or a full-access API key. A profile-scoped API key, a restricted (zrk_) API key, or an OAuth access token is rejected with 403.
 * DELETE /v1/me/connected-apps/{clientId}
 */
export function revokeConnectedApp(clientId: string) {
  return zernioCall("DELETE", `/v1/me/connected-apps/${encodeURIComponent(String(clientId))}`, undefined, undefined);
}


/* ======================================================================
 * ads — 113 operations
 * ====================================================================== */

/**
 * Associate campaigns
 * Associate one or more campaigns with this conversion rule. Returns a per-campaign success/failure result so callers can retry only the rows that failed (e.g. wrong campaign type for the rule's objective).
 * POST /v1/accounts/{accountId}/conversion-destinations/{destinationId}/associations
 * Platforms: meta, google, tiktok, linkedin
 */
export function addConversionAssociations(accountId: string, destinationId: string, body: { adAccountId: string; campaignIds: string[] }) {
  return zernioCall("POST", `/v1/accounts/${encodeURIComponent(String(accountId))}/conversion-destinations/${encodeURIComponent(String(destinationId))}/associations`, undefined, body);
}

/**
 * Share with an ad account
 * Shares the pixel with another ad account so campaigns/audiences in that account can use it. Requires that you administer both the pixel's owning Business Manager and the target ad account; a pixel on a personal (non-BM) ad account can't be shared (Meta will reject the call). Meta only (platform `metaads`); other platforms return 405.
 * POST /v1/accounts/{accountId}/tracking-tags/{tagId}/shared-accounts
 * Platforms: meta
 */
export function addTrackingTagSharedAccount(accountId: string, tagId: string, body: { adAccountId: string }) {
  return zernioCall("POST", `/v1/accounts/${encodeURIComponent(String(accountId))}/tracking-tags/${encodeURIComponent(String(tagId))}/shared-accounts`, undefined, body);
}

/**
 * Add users to audience
 * Upload user data to a customer_list audience. Data is SHA256-hashed server-side before sending to the platform. Email is used on every platform; phone is used on Meta only (other platforms ignore it). On TikTok and Pinterest, the first upload also provisions the audience (deferred create). LinkedIn uploads are full-replace. Max 10,000 users per request. customer_list only. A LinkedIn `company_list` audience takes company rows, not people: send those to `POST /v1/ads/audiences/{audienceId}/companies`. This endpoint 422s for every other audience type.
 * POST /v1/ads/audiences/{audienceId}/users
 * Platforms: meta, google, tiktok, linkedin, pinterest, x
 */
export function addUsersToAdAudience(audienceId: string, body: { users: { email?: string; phone?: string }[] }) {
  return zernioCall("POST", `/v1/ads/audiences/${encodeURIComponent(String(audienceId))}/users`, undefined, body);
}

/**
 * Adjust uploaded conversions
 * Adjust conversions that were previously uploaded via `POST /v1/ads/conversions` — retract them, restate their value, or enhance them with first-party data. Requires the Ads add-on. **Google Ads only.** Google handles adjustments through the classic Google Ads API (`ConversionAdjustmentUploadService`); the Data Manager `ingestEvents` path used for sending conversions is ingest-only. Meta and LinkedIn have no equivalent, so this endpoint returns `405` for those platforms. Adjustment types: - `RETRACTION` — remove the conversion entirely (refund, chargeback, cancelled order, churn). - `RESTATEME…
 * POST /v1/ads/conversions/adjustments
 * Platforms: meta
 */
export function adjustConversions(body: { accountId: string; destinationId: string; adjustments: ({ adjustmentType: "RETRACTION" | "RESTATEMENT" | "ENHANCEMENT"; adjustmentTime: number; orderId?: string; gclid?: string; conversionTime?: number; restatementValue?: number; currency?: string; user?: { email?: string; phone?: string }; userAgent?: string })[] }) {
  return zernioCall("POST", "/v1/ads/conversions/adjustments", undefined, body);
}

/**
 * Archive a lead form
 * Neither platform hard-deletes a form; this archives it (Meta status=ARCHIVED; LinkedIn state=ARCHIVED via PARTIAL_UPDATE).
 * DELETE /v1/ads/lead-forms/{formId}
 * Platforms: meta, linkedin
 */
export function archiveLeadForm(formId: string, query: { accountId: string }) {
  return zernioCall("DELETE", `/v1/ads/lead-forms/${encodeURIComponent(String(formId))}`, query, undefined);
}

/**
 * Attach extension assets to a Google Search campaign
 * Attach sitelinks, callouts and/or structured snippets to an already-existing Google Search campaign — the same builders POST /v1/ads/create uses, but without rebuilding the hierarchy. At least one of sitelinks, callouts or structuredSnippets is required. Google-only. Other platforms have no equivalent extension surface and return 501. Approval status is Google-async; poll `asset.policy_summary` after review. Assets stay in the account library even if the campaign is later deleted.
 * POST /v1/ads/campaigns/{campaignId}/assets
 * Platforms: google
 */
export function attachCampaignAssets(campaignId: string, body: { accountId: string; sitelinks?: { text: string; linkUrl: string; description1?: string; description2?: string }[]; callouts?: string[]; structuredSnippets?: ({ header: "Amenities" | "Brands" | "Courses" | "Degree programs" | "Destinations" | "Featured hotels" | "Insurance coverage" | "Models" | "Neighborhoods" | "Service catalog" | "Shows" | "Styles" | "Types"; values: string[] })[] }) {
  return zernioCall("POST", `/v1/ads/campaigns/${encodeURIComponent(String(campaignId))}/assets`, undefined, body);
}

/**
 * Boost post as ad
 * Creates a paid ad from an existing published post, keeping the post's engagement. By default it provisions the whole hierarchy (campaign, ad set, ad). **Attach shape (Meta).** Send `adSetId` to put the ad under an EXISTING ad set instead, so that ad set keeps its learning phase. It then owns `budget`, `schedule` and `targeting`, and sending any of those alongside `adSetId` is a 400 rather than a silent drop. `budget` is required only without `adSetId`. `instagramAccountId`, `destinationType` and `adSetId` are Meta-only and return 400 on other platforms. **Retries.** Boosts are NOT idempotent …
 * POST /v1/ads/boost
 * Platforms: meta
 */
export function boostPost(body: { postId?: string; platformPostId?: string; accountId: string; adAccountId: string; name: string; goal: "engagement" | "traffic" | "awareness" | "video_views" | "lead_generation" | "conversions" | "app_promotion"; adSetId?: string; budget?: { amount: number; type: "daily" | "lifetime" }; instagramAccountId?: string; destinationType?: "INSTAGRAM_PROFILE" | "WEBSITE" | "ON_AD" | "MESSENGER" | "WHATSAPP"; currency?: string; schedule?: { startDate?: string; endDate?: string }; targeting?: { ageMin?: number; ageMax?: number; gender?: "all" | "male" | "female"; languages?: string[]; countries?: string[]; regions?: { key: string; name?: string }[]; cities?: ({ key: string; name?: string; radius?: number; distanceUnit?: "mile" | "kilometer" })[]; zips?: { key: string; name?: string }[]; metros?: { key: string; name?: string }[]; customLocations?: ({ latitude: number; longitude: number; radius: number; distanceUnit: "mile" | "kilometer"; name?: string; address?: string })[]; interests?: { id: string; name: string }[]; advantage_audience?: 0 | 1 }; rawTargeting?: Record<string, unknown>; bidStrategy?: unknown; bidAmount?: number; roasAverageFloor?: number; platformSpecificData?: unknown; tracking?: { pixelId?: string; urlTags?: { key?: string; value?: string }[] }; specialAdCategories?: ("HOUSING" | "EMPLOYMENT" | "CREDIT" | "FINANCIAL_PRODUCTS_SERVICES" | "ISSUES_ELECTIONS_POLITICS" | "ONLINE_GAMBLING_AND_GAMING")[]; specialAdCategoryCountry?: string[]; linkUrl?: string; callToAction?: string; sparkAuthCode?: string; dsaBeneficiary?: string; dsaPayor?: string; optimizationGoal?: string }) {
  return zernioCall("POST", "/v1/ads/boost", undefined, body);
}

/**
 * Pause or resume many campaigns
 * Process up to 50 campaigns in one call. Each campaign is updated concurrently and the response contains a per-campaign result so a single bad row does not fail the whole batch.
 * POST /v1/ads/campaigns/bulk-status
 * Platforms: meta, google, tiktok, linkedin, pinterest, x
 */
export function bulkUpdateAdCampaignStatus(body: { status: "active" | "paused"; campaigns: ({ platformCampaignId: string; platform: "facebook" | "instagram" | "tiktok" | "linkedin" | "pinterest" | "google" | "twitter" | "openai" })[] }) {
  return zernioCall("POST", "/v1/ads/campaigns/bulk-status", undefined, body);
}

/**
 * Cancel a Reach & Frequency reservation
 * Releases a RESERVATION's locked price and inventory. Unreserved predictions expire on their own.
 * DELETE /v1/ads/rf-predictions/{predictionId}
 * Platforms: meta
 */
export function cancelRfReservation(predictionId: string, query: { accountId: string; adAccountId: string }) {
  return zernioCall("DELETE", `/v1/ads/rf-predictions/${encodeURIComponent(String(predictionId))}`, query, undefined);
}

/**
 * Create custom audience
 * Create a custom audience. `customer_list` is supported on Meta, Google, X, LinkedIn, TikTok, and Pinterest; `website` and `lookalike` are Meta-only; `company_list`, `engagement` and `website_retargeting` are LinkedIn-only. `saved_targeting` stores a reusable TargetingSpec (no member upload, no adAccountId) that you reference later via `savedTargetingId` on `POST /v1/ads/create`. How the audience gets filled depends on the type: - `customer_list` is created empty. Add members with `POST /v1/ads/audiences/{audienceId}/users`. On TikTok and Pinterest the audience is provisioned lazily on that fi…
 * POST /v1/ads/audiences
 * Platforms: meta, google, tiktok, linkedin, pinterest, x
 */
export function createAdAudience(body: Record<string, unknown>) {
  return zernioCall("POST", "/v1/ads/audiences", undefined, body);
}

/**
 * Create a standalone campaign
 * Creates a campaign WITHOUT its first ad set / ad (the ODAX shell only). Ad sets join it later via `existingCampaignId` on the create endpoints. A budget here is campaign-level (CBO) by definition; omit it for ABO (each ad set carries its own budget). Created `PAUSED` unless `status: ACTIVE`. The campaign materializes in `/v1/ads/tree` via the next sync discovery pass. **Idempotency:** send an `Idempotency-Key` header to make retries safe.
 * POST /v1/ads/campaigns
 * Platforms: meta
 */
export function createAdCampaign(body: { accountId: string; adAccountId: string; name: string; goal: "engagement" | "traffic" | "awareness" | "video_views" | "lead_generation" | "lead_conversion" | "job_applicants" | "conversions" | "app_promotion" | "catalog_sales" | "page_likes"; specialAdCategories?: ("HOUSING" | "EMPLOYMENT" | "CREDIT" | "ISSUES_ELECTIONS_POLITICS" | "FINANCIAL_PRODUCTS_SERVICES" | "ONLINE_GAMBLING_AND_GAMING")[]; budgetAmount?: number; budgetType?: "daily" | "lifetime"; status?: "ACTIVE" | "PAUSED"; bidStrategy?: "LOWEST_COST_WITHOUT_CAP" | "LOWEST_COST_WITH_BID_CAP" | "COST_CAP" | "LOWEST_COST_WITH_MIN_ROAS"; bidAmount?: number; roasAverageFloor?: number }) {
  return zernioCall("POST", "/v1/ads/campaigns", undefined, body);
}

/**
 * Create a standalone creative
 * Creates a creative in the library WITHOUT an ad, reusable on the create endpoints via `existingCreativeId`. Provide exactly one of `imageUrl` (uploaded server-side), `imageHash` (from POST /v1/ads/images or the library list), or `carouselCards` (2-10 hand-built cards). The Page (and linked Instagram account, when present) is resolved from `accountId` as the story actor.
 * POST /v1/ads/creatives
 * Platforms: meta
 */
export function createAdCreative(body: { accountId: string; adAccountId: string; headline: string; body: string; description?: string; callToAction?: string; linkUrl: string; imageUrl?: string; imageHash?: string; carouselCards?: { imageUrl: string; linkUrl: string; headline?: string; description?: string; callToAction?: string }[]; urlTags?: string; creativeFeatures?: Record<string, unknown>; multiAdvertiser?: "OPT_IN" | "OPT_OUT" }) {
  return zernioCall("POST", "/v1/ads/creatives", undefined, body);
}

/**
 * Submit an async insights report run
 * Submits an asynchronous Meta insights report. Same query surface as GET /v1/ads/insights, but in the JSON body; Meta processes the report server-side, which is the right choice for long ranges or large accounts where the sync query is slow or rate-limited. Returns a `reportRunId` to poll via GET /v1/ads/insights/reports/{reportRunId}.
 * POST /v1/ads/insights/reports
 * Platforms: meta
 */
export function createAdInsightsReport(body: { accountId: string; objectId: string; level?: "ad" | "adset" | "campaign" | "account"; fields?: string; breakdowns?: string; actionBreakdowns?: string; actionAttributionWindows?: string[]; actionReportTime?: string; useUnifiedAttributionSetting?: boolean; filtering?: { field: string; operator: string; value?: unknown }[]; datePreset?: string; fromDate?: string; toDate?: string; timeIncrement?: unknown }) {
  return zernioCall("POST", "/v1/ads/insights/reports", undefined, body);
}

/**
 * Create Click-to-Call ad
 * Same shape and flow as POST /v1/ads/ctwa, but the CTA is CALL_NOW dialing `phoneNumber` via a tel: link. The ad set is destination_type PHONE_CALL optimizing QUALITY_CALL and the campaign objective defaults to OUTCOME_LEADS. Supports the same single-creative and multi-creative shapes as CTWA.
 * POST /v1/ads/call
 * Platforms: meta
 */
export function createCallAd(body: Record<string, unknown>) {
  return zernioCall("POST", "/v1/ads/call", undefined, body);
}

/**
 * Create a conversion destination
 * Create a new conversion destination on the platform. Supported for LinkedIn (conversion rule) and Google Ads (conversion action). Meta and OpenAI Ads pixels are created via their own tracking-tags flow instead (`POST /v1/accounts/{accountId}/tracking-tags`); this endpoint returns 405 for both. **LinkedIn:** creation is NOT idempotent. A retry creates a second destination. Deduplicate before retrying. **Google Ads:** calling with a name that already exists reuses the existing conversion action transparently (the response is identical to a fresh create). Calling with the same name but a differe…
 * POST /v1/accounts/{accountId}/conversion-destinations
 * Platforms: meta, google, tiktok, linkedin
 */
export function createConversionDestination(accountId: string, body: { adAccountId: string; name: string; type: string; attributionType?: "LAST_TOUCH_BY_CAMPAIGN" | "LAST_TOUCH_BY_CONVERSION"; postClickAttributionWindowSize?: 1 | 7 | 30 | 90 | 365; viewThroughAttributionWindowSize?: 1 | 7 | 30 | 90 | 365; valueType?: "DYNAMIC" | "FIXED" | "NO_VALUE"; value?: { currencyCode: string; amount: string }; autoAssociationType?: "ALL_CAMPAIGNS" | "OBJECTIVE_BASED" | "NONE"; countingType?: "MANY_PER_CLICK" | "ONE_PER_CLICK"; primaryForGoal?: boolean }) {
  return zernioCall("POST", `/v1/accounts/${encodeURIComponent(String(accountId))}/conversion-destinations`, undefined, body);
}

/**
 * Create Click-to-WhatsApp ad (deprecated)
 * Deprecated: use POST /v1/ads/messaging with `destination: whatsapp`. This endpoint stays available for back-compat; no removal planned. Creates one or more Click-to-WhatsApp (CTWA) ads on Meta under a single campaign and ad set. When tapped, each ad opens a WhatsApp conversation with the business attached to the supplied Facebook Page. The full hierarchy (campaign, ad set, creative(s), ad(s)) is created and activated in one call. The CTA is locked to WHATSAPP_MESSAGE and the destination is hard-coded to api.whatsapp.com/send; Meta resolves the actual WhatsApp number from the Page-to-WA pairin…
 * POST /v1/ads/ctwa
 * Platforms: meta
 */
export function createCtwaAd(body: Record<string, unknown>) {
  return zernioCall("POST", "/v1/ads/ctwa", undefined, body);
}

/**
 * Schedule a budget increase
 * Pre-schedule a temporary budget increase (Black Friday, a launch, a sale) instead of editing the budget by hand on the day. Same target rule as the GET: exactly one of `campaignId` / `adSetId`. Two Meta constraints worth knowing before you call it. `timeStart` / `timeEnd` must fall on a 15-minute boundary, and a campaign cannot mix `ABSOLUTE` and `MULTIPLIER` across its schedules — the second type is rejected with "Can't mix your budget scaling selection". Window rules (must sit inside the campaign's run dates, minimum lead time, no overlap) are Meta's and its message is forwarded verbatim.
 * POST /v1/ads/high-demand-periods
 * Platforms: meta
 */
export function createHighDemandPeriod(body: { accountId: string; campaignId?: string; adSetId?: string; budgetValue: number; budgetValueType: "ABSOLUTE" | "MULTIPLIER"; timeStart: number; timeEnd: number; recurrenceType?: "ONE_TIME" | "WEEKLY" | "MONTHLY"; currency?: string }) {
  return zernioCall("POST", "/v1/ads/high-demand-periods", undefined, body);
}

/**
 * Create a lead form
 * Creates a Lead Gen form. The form content goes inside `platformSpecificData` for both platforms (the shape is selected by the accountId's platform). Meta: created on the connected Facebook Page (POST /{page-id}/leadgen_forms); the old top-level Meta fields (questions, thankYou*, contextCard, …) are DEPRECATED but still accepted while platformSpecificData is absent — mixing both shapes is a 400. LinkedIn: created on the ad account's Company Page. NOT idempotent — a retry creates a second form. Meta prefilled question types (EMAIL, PHONE, FULL_NAME, …) must omit label/key; CUSTOM questions requ…
 * POST /v1/ads/lead-forms
 * Platforms: meta, linkedin
 */
export function createLeadForm(body: { accountId: string; name: string; questions?: { type: string; key?: string; label?: string; options?: { key?: unknown; value?: unknown }[]; inline_context?: string }[]; privacyPolicyUrl: string; privacyPolicyLinkText?: string; followUpActionUrl?: string; locale?: string; thankYouTitle?: string; thankYouBody?: string; thankYouButtonText?: string; thankYouButtonType?: string; thankYouWebsiteUrl?: string; isOptimizedForQuality?: boolean; platformSpecificData?: unknown }) {
  return zernioCall("POST", "/v1/ads/lead-forms", undefined, body);
}

/**
 * Create click-to-message ad (WhatsApp / Messenger / Instagram Direct)
 * Creates a click-to-message ad; `destination` selects where the tapped ad opens a conversation: WhatsApp, the Page's Messenger inbox or the linked Instagram account's Direct inbox. The ad set is created with the matching destination_type and CONVERSATIONS optimization; the campaign objective defaults to OUTCOME_ENGAGEMENT. Supports single-creative and multi-creative shapes. Supersedes POST /v1/ads/ctwa (deprecated, equivalent to `destination: whatsapp`).
 * POST /v1/ads/messaging
 * Platforms: meta
 */
export function createMessagingAd(body: Record<string, unknown>) {
  return zernioCall("POST", "/v1/ads/messaging", undefined, body);
}

/**
 * Create a Reach & Frequency prediction
 * Creates an R&F prediction — a QUOTE, nothing is bought and no ad entities are created. Provide a date range plus exactly one of `budgetAmount` (Meta predicts reach) or `reach` (Meta predicts the budget). The response carries the estimate and its allowed bounds (min/max budget and reach). Predictions expire on their own; to buy, reserve one via POST /v1/ads/rf-predictions/{predictionId}/reserve and pass the RESERVED id to POST /v1/ads/create with `buyingType: "RESERVED"`. Reservation campaigns reject automatic placements. Top-level `placements` wins; when it is omitted, `targeting.placements` …
 * POST /v1/ads/rf-predictions
 * Platforms: meta
 */
export function createRfPrediction(body: { accountId: string; adAccountId: string; budgetAmount?: number; reach?: number; startDate: string; endDate: string; frequencyCap?: number; targeting?: Record<string, unknown>; placements?: Record<string, unknown> }) {
  return zernioCall("POST", "/v1/ads/rf-predictions", undefined, body);
}

/**
 * Create standalone ad
 * Creates a paid ad with custom creative across Meta, Google Ads, Pinterest, TikTok, X/Twitter, LinkedIn, and OpenAI Ads (ChatGPT Ads). Supports three mutually-exclusive request shapes selected by the body, a legacy single-creative shape (all platforms, default), a Meta-only multi-creative shape via the creatives array (one ad set with N ads sharing budget and targeting), and an attach shape via adSetId that adds one new ad to an existing ad set, inheriting its budget, targeting, and schedule (Meta, TikTok, and LinkedIn; on LinkedIn adSetId is the existing Campaign id, and the budget, schedule,…
 * POST /v1/ads/create
 * Platforms: meta, google, tiktok, linkedin, pinterest, x, openai
 */
export function createStandaloneAd(body: { accountId: string; adAccountId: string; name: string; campaignName?: string; adSetName?: string; adName?: string; tracking?: { pixelId?: string; urlTags?: { key: string; value: string }[] }; goal?: "engagement" | "traffic" | "awareness" | "video_views" | "lead_generation" | "lead_conversion" | "conversions" | "app_promotion" | "catalog_sales" | "page_likes" | "job_applicants"; optimizationGoal?: string; billingEvent?: string; buyingType?: "AUCTION" | "RESERVED"; rfPredictionId?: string; creativeFeatures?: Record<string, unknown>; multiAdvertiser?: "OPT_IN" | "OPT_OUT"; validateOnly?: boolean; budgetAmount?: number; budgetType?: "daily" | "lifetime"; status?: "ACTIVE" | "PAUSED"; campaignStatus?: "ACTIVE" | "PAUSED"; budgetLevel?: "adset" | "campaign"; currency?: string; headline?: string; longHeadline?: string; body?: string; description?: string; callToAction?: "LEARN_MORE" | "SHOP_NOW" | "SIGN_UP" | "BOOK_TRAVEL" | "CONTACT_US" | "DOWNLOAD" | "GET_OFFER" | "GET_QUOTE" | "SUBSCRIBE" | "WATCH_MORE" | "ADD_TO_CART" | "APPLY_NOW" | "BOOK_NOW" | "BUY_TICKETS" | "DONATE" | "DONATE_NOW" | "GET_DIRECTIONS" | "GET_SHOWTIMES" | "LISTEN_NOW" | "ORDER_NOW" | "PLAY_GAME" | "REQUEST_TIME" | "SEE_MENU" | "START_ORDER" | "INSTALL_MOBILE_APP" | "USE_APP" | "REGISTER" | "JOIN" | "ATTEND" | "REQUEST_DEMO" | "VIEW_QUOTE" | "APPLY" | "SEE_MORE" | "BUY_NOW"; linkUrl?: string; leadGenFormId?: string; imageUrl?: string; images?: { landscape?: string; square?: string }; video?: { url?: string; id?: string; thumbnailUrl?: string }; creatives?: ({ name?: string; headline: string; body: string; description?: string; imageUrl?: string; video?: { url: string; thumbnailUrl?: string }; linkUrl: string; callToAction: "LEARN_MORE" | "SHOP_NOW" | "SIGN_UP" | "BOOK_TRAVEL" | "CONTACT_US" | "DOWNLOAD" | "GET_OFFER" | "GET_QUOTE" | "SUBSCRIBE" | "WATCH_MORE" | "ADD_TO_CART" | "APPLY_NOW" | "BOOK_NOW" | "BUY_TICKETS" | "DONATE" | "DONATE_NOW" | "GET_DIRECTIONS" | "GET_SHOWTIMES" | "LISTEN_NOW" | "ORDER_NOW" | "PLAY_GAME" | "REQUEST_TIME" | "SEE_MENU" | "START_ORDER" | "INSTALL_MOBILE_APP" | "USE_APP" })[]; adSetId?: string; existingCampaignId?: string; existingCreativeId?: string; businessName?: string; boardId?: string; organizationId?: string; targeting?: unknown; countries?: string[]; cities?: ({ key: string; radius?: number; distance_unit?: "mile" | "kilometer" })[]; regions?: { key: string }[]; ageMin?: number; ageMax?: number; interests?: { id: string; name: string }[]; zips?: { key: string; name?: string }[]; metros?: { key: string; name?: string }[]; customLocations?: ({ latitude: number; longitude: number; radius: number; distanceUnit: "mile" | "kilometer"; name?: string; address?: string })[]; behaviors?: { id: string; name?: string }[]; incomeTier?: "top_5" | "top_10" | "top_10_25" | "top_25_50"; languages?: string[]; placements?: { publisherPlatforms?: ("facebook" | "instagram" | "threads" | "messenger" | "audience_network" | "whatsapp")[]; facebookPositions?: ("feed" | "right_hand_column" | "marketplace" | "video_feeds" | "story" | "search" | "instream_video" | "facebook_reels" | "facebook_reels_overlay" | "profile_feed" | "notification")[]; instagramPositions?: ("stream" | "story" | "explore" | "explore_home" | "reels" | "profile_feed" | "ig_search" | "profile_reels")[]; messengerPositions?: ("messenger_home" | "sponsored_messages" | "story")[]; audienceNetworkPositions?: ("classic" | "rewarded_video")[]; threadsPositions?: "threads_stream"[]; whatsappPositions?: "status"[]; devicePlatforms?: ("mobile" | "desktop")[] }; savedTargetingId?: string; rawTargeting?: Record<string, unknown>; specialAdCategories?: ("HOUSING" | "EMPLOYMENT" | "CREDIT" | "FINANCIAL_PRODUCTS_SERVICES" | "ISSUES_ELECTIONS_POLITICS" | "ONLINE_GAMBLING_AND_GAMING")[]; specialAdCategoryCountry?: string[]; endDate?: string; startDate?: string; instagramAccountId?: string; dynamicCreative?: { imageUrls?: string[]; videoUrls?: string[]; bodies?: string[]; titles?: string[]; descriptions?: string[]; linkUrls?: string[]; callToActionTypes?: ("LEARN_MORE" | "SHOP_NOW" | "SIGN_UP" | "BOOK_TRAVEL" | "CONTACT_US" | "DOWNLOAD" | "GET_OFFER" | "GET_QUOTE" | "SUBSCRIBE" | "WATCH_MORE" | "ADD_TO_CART" | "APPLY_NOW" | "BOOK_NOW" | "BUY_TICKETS" | "DONATE" | "DONATE_NOW" | "GET_DIRECTIONS" | "GET_SHOWTIMES" | "LISTEN_NOW" | "ORDER_NOW" | "PLAY_GAME" | "REQUEST_TIME" | "SEE_MENU" | "START_ORDER" | "INSTALL_MOBILE_APP" | "USE_APP" | "REGISTER" | "JOIN" | "ATTEND" | "REQUEST_DEMO" | "VIEW_QUOTE" | "APPLY" | "SEE_MORE" | "BUY_NOW")[]; adFormat?: "SINGLE_IMAGE" | "CAROUSEL_IMAGE" | "SINGLE_VIDEO" }; carouselCards?: { imageUrl: string; linkUrl?: string; headline?: string; description?: string; callToAction?: string }[]; defaultLocale?: string; translations?: { locale: string; headline: string; body: string; description: string; linkUrl?: string; imageUrl?: string; videoUrl?: string; thumbnailUrl?: string }[]; placementAssets?: { defaultImageUrl?: string; defaultVideoUrl?: string; defaultThumbnailUrl?: string; rules: { imageUrl?: string; videoUrl?: string; thumbnailUrl?: string; placements: { publisherPlatforms?: unknown; facebookPositions?: unknown; instagramPositions?: unknown; messengerPositions?: unknown; audienceNetworkPositions?: unknown; threadsPositions?: unknown; whatsappPositions?: unknown; devicePlatforms?: unknown } }[] }; audienceId?: string; campaignType?: "display" | "search"; keywords?: string[]; negativeKeywords?: string[]; additionalHeadlines?: string[]; additionalDescriptions?: string[]; sitelinks?: { text: string; linkUrl: string; description1?: string; description2?: string }[]; callouts?: string[]; structuredSnippets?: ({ header: "Amenities" | "Brands" | "Courses" | "Degree programs" | "Destinations" | "Featured hotels" | "Insurance coverage" | "Models" | "Neighborhoods" | "Service catalog" | "Shows" | "Styles" | "Types"; values: string[] })[]; advantageAudience?: 0 | 1; attributionSpec?: ({ eventType: "CLICK_THROUGH" | "VIEW_THROUGH" | "ENGAGED_VIDEO_VIEW"; windowDays: 1 | 7 | 28 })[]; gender?: "all" | "male" | "female"; bidStrategy?: unknown; bidAmount?: number; roasAverageFloor?: number; valueRuleSetId?: string; valueRulesApplied?: boolean; platformSpecificData?: unknown; dsaBeneficiary?: string; dsaPayor?: string; brandIdentity?: { displayName: string; imageUrl: string }; identityType?: "TT_USER" | "CUSTOMIZED_USER"; smartPlus?: boolean; promotedObject?: { pixelId?: string; customEventType?: string; customEventStr?: string; pageId?: string; applicationId?: string; objectStoreUrl?: string; customConversionId?: string; productCatalogId?: string; productSetId?: string; offlineConversionDataSetId?: string; whatsappPhoneNumber?: string } }) {
  return zernioCall("POST", "/v1/ads/create", undefined, body);
}

/**
 * Create a tracking tag
 * Meta: creates a Meta Pixel on the given ad account (`POST /act_{id}/adspixels` — `name` is the only input). Returns the created tag including its install `code`. The pixel is owned by the Business Manager that owns the ad account; a pixel created on a personal (non-BM) ad account ends up with `ownerBusinessId: null` and can't be shared with other ad accounts. Creating a Meta pixel does NOT install it — install the returned `code` snippet on the site, or send events server-side via `POST /v1/ads/conversions`. The check `installed` is derived from `lastFiredTime`. OpenAI Ads: creates an OpenAI …
 * POST /v1/accounts/{accountId}/tracking-tags
 * Platforms: meta
 */
export function createTrackingTag(accountId: string, body: { adAccountId: string; name: string }) {
  return zernioCall("POST", `/v1/accounts/${encodeURIComponent(String(accountId))}/tracking-tags`, undefined, body);
}

/**
 * Create a value rule set
 * Creates a value rule set on the ad account (Meta's `POST /act_X/value_rule_set`). Attach the returned id to an ad set with `valueRuleSetId` on `POST /v1/ads/create` or `PUT /v1/ads/ad-sets/{adSetId}`. **Rule order is semantic**: rules are evaluated in array order and only the first matching rule adjusts the bid for an overlapping audience. `adjustValue` is an unsigned magnitude in percent; the direction lives in `adjustSign`. `INCREASE` accepts 1-1000, `DECREASE` accepts 1-90. There is no signed field and 0 is out of range. `criteriaValueTypes` is positionally paired with `criteriaValues` (sa…
 * POST /v1/ads/value-rule-sets
 * Platforms: meta
 */
export function createValueRuleSet(body: { accountId: string; adAccountId: string; name: string; rules: unknown[] }) {
  return zernioCall("POST", "/v1/ads/value-rule-sets", undefined, body);
}

/**
 * Cancel an ad
 * Cancels the ad on the platform and marks it as cancelled in the database. The ad is preserved for history. OpenAI Ads has no delete API; the ad is archived instead (a terminal state, the closest equivalent).
 * DELETE /v1/ads/{adId}
 * Platforms: meta, google, tiktok, linkedin, pinterest, x
 */
export function deleteAd(adId: string) {
  return zernioCall("DELETE", `/v1/ads/${encodeURIComponent(String(adId))}`, undefined, undefined);
}

/**
 * Delete custom audience
 * Deletes the audience from both the platform and the local database. `saved_targeting` audiences exist only on Zernio, so only the local record is removed.
 * DELETE /v1/ads/audiences/{audienceId}
 * Platforms: meta, google, tiktok, linkedin, pinterest, x
 */
export function deleteAdAudience(audienceId: string) {
  return zernioCall("DELETE", `/v1/ads/audiences/${encodeURIComponent(String(audienceId))}`, undefined, undefined);
}

/**
 * Delete a campaign
 * Deletes the whole campaign on the platform, cascading to its ad sets and ads. Locally, all Ad documents for this campaign are marked `status: cancelled`. **Empty campaigns.** A campaign with zero ads has no local Ad documents to resolve, so it is invisible to `/v1/ads/tree` and this endpoint would 404. That state is produced by the two-step create flow (campaign, then ads via `existingCampaignId`) whenever Meta rejects the ad step. To delete such a shell, send `accountId` in the body: we skip the local lookup entirely and forward the delete to Meta. `accountId` is ignored when the campaign do…
 * DELETE /v1/ads/campaigns/{campaignId}
 * Platforms: meta, google, tiktok, linkedin, pinterest, x, openai
 */
export function deleteAdCampaign(campaignId: string, body: { platform: "facebook" | "instagram" | "google"; accountId?: string }) {
  return zernioCall("DELETE", `/v1/ads/campaigns/${encodeURIComponent(String(campaignId))}`, undefined, body);
}

/**
 * Delete a creative
 * Deletes a creative from the library. Meta only allows deleting creatives not referenced by any ad — otherwise its 400 surfaces verbatim.
 * DELETE /v1/ads/creatives/{creativeId}
 * Platforms: meta
 */
export function deleteAdCreative(creativeId: string, query: { accountId: string }) {
  return zernioCall("DELETE", `/v1/ads/creatives/${encodeURIComponent(String(creativeId))}`, query, undefined);
}

/**
 * Delete an ad set
 * Deletes the ad set on the platform, cascading to its ads only (never the campaign). Locally, every Ad document under the ad set is marked `status: cancelled`. Delete is soft on platforms that have no hard delete: LinkedIn moves the campaign to `PENDING_DELETION`, Pinterest archives the ad group, and X soft-flags the line item. Google removes the ad group. All remain readable for reporting.
 * DELETE /v1/ads/ad-sets/{adSetId}
 * Platforms: meta, google, tiktok, linkedin, pinterest, x
 */
export function deleteAdSet(adSetId: string) {
  return zernioCall("DELETE", `/v1/ads/ad-sets/${encodeURIComponent(String(adSetId))}`, undefined, undefined);
}

/**
 * Delete an ad video
 * Removes a video from the ad account's video library. Meta's canonical `DELETE /{video_id}` fails with code 10 / subcode 1363055 for videos uploaded via `/act_X/advideos` even with `ads_management`; this endpoint uses the working account-scoped shape `DELETE /act_X/advideos?video_id=<id>` and returns Meta's `{success: true}` verbatim. Deleting a video that lives in a different ad account, or that Meta has already removed, returns Meta's error verbatim as a 4xx.
 * DELETE /v1/ads/videos/{videoId}
 * Platforms: meta
 */
export function deleteAdVideo(videoId: string, query: { accountId: string; adAccountId: string }) {
  return zernioCall("DELETE", `/v1/ads/videos/${encodeURIComponent(String(videoId))}`, query, undefined);
}

/**
 * Delete a conversion destination
 * LinkedIn-only today. LinkedIn does not expose hard-delete on conversion rules — what their UI calls "delete" is the same `enabled: false` flip we apply here. The rule remains fetchable via GET with `status: 'inactive'`; the unified discovery endpoint hides it by default. `adAccountId` may be passed as a query parameter (recommended) or as a JSON body field for clients that can send DELETE bodies.
 * DELETE /v1/accounts/{accountId}/conversion-destinations/{destinationId}
 * Platforms: meta, google, tiktok, linkedin
 */
export function deleteConversionDestination(accountId: string, destinationId: string, query?: { adAccountId?: string }) {
  return zernioCall("DELETE", `/v1/accounts/${encodeURIComponent(String(accountId))}/conversion-destinations/${encodeURIComponent(String(destinationId))}`, query, undefined);
}

/**
 * Delete a value rule set
 * Deletes the rule set (Meta's `POST /{value-rule-set-id}/delete_rule_set`, a custom action edge rather than an HTTP DELETE on its side). Ad sets pointing at it are not modified here; detach them first with `valueRulesApplied: false` on `PUT /v1/ads/ad-sets/{adSetId}`.
 * DELETE /v1/ads/value-rule-sets/{valueRuleSetId}
 * Platforms: meta
 */
export function deleteValueRuleSet(valueRuleSetId: string, query: { accountId: string }) {
  return zernioCall("DELETE", `/v1/ads/value-rule-sets/${encodeURIComponent(String(valueRuleSetId))}`, query, undefined);
}

/**
 * Duplicate an ad
 * Duplicates a single ad via Meta's native `POST /{ad-id}/copies`. The copy is created paused. `adSetId` retargets the copy into another ad set; omitted = the source's own ad set. Accepts the Zernio ad id or the platform ad id. Sync discovery is triggered automatically (`syncAfter: false` to skip).
 * POST /v1/ads/{adId}/duplicate
 * Platforms: meta
 */
export function duplicateAd(adId: string, body?: { adSetId?: string; statusOption?: "ACTIVE" | "PAUSED" | "INHERITED_FROM_SOURCE"; renameStrategy?: "DEEP_RENAME" | "ONLY_TOP_LEVEL_RENAME" | "NO_RENAME"; renamePrefix?: string; renameSuffix?: string; syncAfter?: boolean }) {
  return zernioCall("POST", `/v1/ads/${encodeURIComponent(String(adId))}/duplicate`, undefined, body);
}

/**
 * Duplicate a campaign
 * Duplicates a campaign, including its ad sets, ads, creatives, and targeting by default (`deepCopy: true`). The copy is created paused so callers can review before launching. Per-platform implementation: - **Meta** uses the native `POST /{campaign-id}/copies` endpoint. - **TikTok** has no native copy primitive; Zernio walks the source graph (`/v2/campaign/get/`, `/v2/adgroup/get/`, `/v2/ad/get/`) and recreates each entity via the corresponding `/create/` endpoints, carrying over budget / targeting / bid_type / bid_price / deep_bid_type / creative fields. Spark Ad linkage (`tiktok_item_id`) is …
 * POST /v1/ads/campaigns/{campaignId}/duplicate
 * Platforms: meta, tiktok, linkedin
 */
export function duplicateAdCampaign(campaignId: string, body: { platform: "facebook" | "instagram" | "tiktok" | "linkedin"; deepCopy?: boolean; statusOption?: "ACTIVE" | "PAUSED" | "INHERITED_FROM_SOURCE"; startTime?: string; endTime?: string; renameStrategy?: "DEEP_RENAME" | "ONLY_TOP_LEVEL_RENAME" | "NO_RENAME"; renamePrefix?: string; renameSuffix?: string; syncAfter?: boolean }) {
  return zernioCall("POST", `/v1/ads/campaigns/${encodeURIComponent(String(campaignId))}/duplicate`, undefined, body);
}

/**
 * Duplicate an ad set
 * Duplicates an ad set, including its ads and creatives by default (`deepCopy: true`), via Meta's native `POST /{adset-id}/copies`. The copy is created paused so callers can review before launching. `campaignId` retargets the copy into another campaign; omitted = the source's own campaign. The new hierarchy materializes asynchronously — sync discovery is triggered automatically (`syncAfter: false` to skip).
 * POST /v1/ads/ad-sets/{adSetId}/duplicate
 * Platforms: meta
 */
export function duplicateAdSet(adSetId: string, body: { platform: "facebook" | "instagram"; campaignId?: string; deepCopy?: boolean; statusOption?: "ACTIVE" | "PAUSED" | "INHERITED_FROM_SOURCE"; startTime?: string; endTime?: string; renameStrategy?: "DEEP_RENAME" | "ONLY_TOP_LEVEL_RENAME" | "NO_RENAME"; renamePrefix?: string; renameSuffix?: string; syncAfter?: boolean }) {
  return zernioCall("POST", `/v1/ads/ad-sets/${encodeURIComponent(String(adSetId))}/duplicate`, undefined, body);
}

/**
 * Estimate audience reach
 * Returns a normalized pre-flight audience-size estimate for a targeting spec, before any campaign is created. Backed by each platform's native reach API (Meta `delivery_estimate`, LinkedIn `audienceCounts`, X `audience_summary`, Pinterest `audience_sizing`). Platforms without a usable pre-flight reach API (Google Search/Display, TikTok) return `available: false` with no bounds, so clients can hide or grey out the estimate rather than treat the absence as an error.
 * POST /v1/ads/targeting/reach-estimate
 * Platforms: meta
 */
export function estimateAdReach(body: { accountId: string; adAccountId: string; spec: unknown; optimizationGoal?: string }) {
  return zernioCall("POST", "/v1/ads/targeting/reach-estimate", undefined, body);
}

/**
 * Render pre-create ad previews
 * Renders how a creative would look per placement BEFORE any ad exists, via Meta's `/generatepreviews`. Provide exactly one creative source: `existingCreativeId` or `creativeSpec`. Each preview is an HTML `<iframe>` snippet embeddable directly. Unknown `formats` values return Meta's 400 verbatim.
 * POST /v1/ads/preview
 * Platforms: meta
 */
export function generateAdPreviews(body: { accountId: string; adAccountId: string; formats?: string[]; existingCreativeId?: string; creativeSpec?: Record<string, unknown> }) {
  return zernioCall("POST", "/v1/ads/preview", undefined, body);
}

/**
 * Historical keyword metrics (Google Keyword Planner)
 * Google Ads only. Runs Keyword Planner's generateKeywordHistoricalMetrics for up to 1,000 exact keywords: historical search volume, competition and top-of-page bid ranges, plus averageCpcMicros when includeAverageCpc is set. Rows come back verbatim; counters are int64s encoded as strings, bid/CPC values are micros of the account currency.
 * POST /v1/ads/keywords/historical-metrics
 * Platforms: google
 */
export function generateKeywordHistoricalMetrics(body: { accountId: string; customerId?: string; keywords: string[]; countries?: string[]; languageConstantId?: string; network?: "GOOGLE_SEARCH" | "GOOGLE_SEARCH_AND_PARTNERS"; includeAdultKeywords?: boolean; includeAverageCpc?: boolean }) {
  return zernioCall("POST", "/v1/ads/keywords/historical-metrics", undefined, body);
}

/**
 * Generate keyword ideas (Google Keyword Planner)
 * Google Ads only. Runs Keyword Planner's generateKeywordIdeas from seed keywords, a seed URL, or both, returning idea rows verbatim (avgMonthlySearches, competition, competitionIndex, top-of-page bid micros, monthlySearchVolumes). Counters are int64s encoded as strings; bid values are micros of the account currency. Omitting `countries` targets worldwide.
 * POST /v1/ads/keywords/ideas
 * Platforms: google
 */
export function generateKeywordIdeas(body: { accountId: string; customerId?: string; seedKeywords?: string[]; seedUrl?: string; countries?: string[]; languageConstantId?: string; network?: "GOOGLE_SEARCH" | "GOOGLE_SEARCH_AND_PARTNERS"; includeAdultKeywords?: boolean; pageSize?: number; pageToken?: string }) {
  return zernioCall("POST", "/v1/ads/keywords/ideas", undefined, body);
}

/**
 * Get ad details
 * Returns an ad with its creative, targeting, status, and performance metrics. The `{adId}` path segment accepts any identifier dialect Zernio indexes for the ad: - the Zernio internal `_id` (24-char hex) - Meta's numeric `platformAdId` (the value shipped in `comment.received` webhooks as `comment.ad.id`) - the creative's `effective_object_story_id` (`{pageId}_{postId}` shape, Facebook side) - the creative's `effective_instagram_media_id` (Instagram side) Any of the four resolve to the same ad. Caller doesn't need a translation step.
 * GET /v1/ads/{adId}
 * Platforms: meta, google, tiktok, linkedin, pinterest, x
 */
export function getAd(adId: string) {
  return zernioCall("GET", `/v1/ads/${encodeURIComponent(String(adId))}`, undefined, undefined);
}

/**
 * Ad account finances
 * Finances of one Meta ad account: prepaid `balance`, lifetime `amountSpent`, account `spendCap` (null = no cap) and the `fundingSource`. Money values are converted from Meta's minor units to whole units of `currency`.
 * GET /v1/ads/accounts/finance
 * Platforms: meta
 */
export function getAdAccountFinance(query: { accountId: string; adAccountId: string }) {
  return zernioCall("GET", "/v1/ads/accounts/finance", query, undefined);
}

/**
 * Get ad analytics
 * Returns detailed performance analytics for an ad. Includes summary metrics, a daily timeline over the requested date range, and optional demographic breakdowns (Meta and TikTok only). If no date range is provided, defaults to the last 90 days. Date range is capped at 730 days max.
 * GET /v1/ads/{adId}/analytics
 * Platforms: meta, google, tiktok, linkedin, pinterest, x
 */
export function getAdAnalytics(adId: string, query?: { fromDate?: string; toDate?: string; breakdowns?: string }) {
  return zernioCall("GET", `/v1/ads/${encodeURIComponent(String(adId))}/analytics`, query, undefined);
}

/**
 * Get audience details
 * Returns the local audience record and fresh data from Meta (if available).
 * GET /v1/ads/audiences/{audienceId}
 * Platforms: meta, google, tiktok, linkedin, pinterest, x
 */
export function getAdAudience(audienceId: string) {
  return zernioCall("GET", `/v1/ads/audiences/${encodeURIComponent(String(audienceId))}`, undefined, undefined);
}

/**
 * Creative details
 * One creative's details, verbatim from Meta. `fields` is a raw-passthrough override of the default projection.
 * GET /v1/ads/creatives/{creativeId}
 * Platforms: meta
 */
export function getAdCreative(creativeId: string, query: { accountId: string; fields?: string }) {
  return zernioCall("GET", `/v1/ads/creatives/${encodeURIComponent(String(creativeId))}`, query, undefined);
}

/**
 * Poll an async insights report run
 * Status and results for a report run created via POST /v1/ads/insights/reports. While the job runs, returns `status` and `percentCompletion`. Once `status` is "Job Completed" the response also carries a `data` page, cursor-paginated via `limit` / `after`.
 * GET /v1/ads/insights/reports/{reportRunId}
 * Platforms: meta
 */
export function getAdInsightsReport(reportRunId: string, query: { accountId: string; limit?: number; after?: string }) {
  return zernioCall("GET", `/v1/ads/insights/reports/${encodeURIComponent(String(reportRunId))}`, query, undefined);
}

/**
 * Direct video and image URLs for an ad
 * Returns the direct signed URLs for every video and image asset used by an ad's live creative, normalised across shapes: single image/video, carousel, Reels/Story (`object_story_spec.video_data`) and dynamic creative (`asset_feed_spec`). Video items include Meta's poster thumbnail and the video's Meta id when available. Reads Meta live rather than the stored creative blob because Meta's signed fbcdn URLs carry an `oe=<hex>` expiration (image_url ~24 h, video source ~12 d). Treat URLs as short-lived — re-fetch this endpoint before serving or downloading assets instead of caching URLs beyond tha…
 * GET /v1/ads/{adId}/media
 * Platforms: meta
 */
export function getAdMedia(adId: string) {
  return zernioCall("GET", `/v1/ads/${encodeURIComponent(String(adId))}/media`, undefined, undefined);
}

/**
 * Render previews of an existing ad
 * Renders an EXISTING ad per placement via Meta's `/{ad_id}/previews`. Each preview is an HTML `<iframe>` snippet embeddable directly. Unknown `formats` values return Meta's 400 verbatim.
 * GET /v1/ads/{adId}/preview
 * Platforms: meta
 */
export function getAdPreviews(adId: string, query?: { formats?: string }) {
  return zernioCall("GET", `/v1/ads/${encodeURIComponent(String(adId))}/preview`, query, undefined);
}

/**
 * Ad account change / audit log
 * Account-level audit log from Meta's `/act_X/activities`: who changed what and when (creates, edits, status flips, budget changes...) with Meta's translated event names and the structured before/after in `extra_data`. Rows are returned verbatim. Meta has no server-side per-object filter on this edge, so `objectId` filters the returned page client-side (combine with paging to walk history for one campaign/ad set/ad).
 * GET /v1/ads/activity
 * Platforms: meta
 */
export function getAdsActivityLog(query: { accountId: string; adAccountId: string; since?: string; until?: string; objectId?: string; limit?: number; after?: string }) {
  return zernioCall("GET", "/v1/ads/activity", query, undefined);
}

/**
 * Live ad-set details incl. learning phase
 * Reads the ad set live from Meta, returned verbatim. The default projection includes `learning_stage_info` (learning-phase status: LEARNING / SUCCESS / FAIL / WAIVING — Meta omits its `status` key on paused ad sets), delivery settings, budgets, schedule and targeting. `fields` is a raw-passthrough override; unknown fields return Meta's 400 verbatim.
 * GET /v1/ads/ad-sets/{adSetId}
 * Platforms: meta
 */
export function getAdSetDetails(adSetId: string, query: { accountId: string; fields?: string }) {
  return zernioCall("GET", `/v1/ads/ad-sets/${encodeURIComponent(String(adSetId))}`, query, undefined);
}

/**
 * Google Ads search terms report
 * The actual search queries that triggered your ads, with matched-keyword status and spend metrics — the raw material for wasted-spend analysis and negative-keyword lists. Reads Google's `search_term_view` live; defaults to the last 30 days. Rows are ordered by cost, descending. Draws on the shared Google Ads operations budget.
 * GET /v1/ads/search-terms
 * Platforms: google
 */
export function getAdsSearchTerms(query: { accountId: string; customerId?: string; fromDate?: string; toDate?: string; campaignId?: string; adGroupId?: string; pageToken?: string }) {
  return zernioCall("GET", "/v1/ads/search-terms", query, undefined);
}

/**
 * Get daily account metrics
 * Returns daily aggregate metrics across all ads in a SocialAccount as a single time series — one row per calendar day in the requested range. Use this for dashboards that draw a daily-spend or daily-conversions chart, instead of calling `/v1/ads/tree` once per day. `accountId` is required. The lookup is sibling-expanded so passing the `metaads` ID also includes ads under the linked `facebook` / `instagram` posting account (and vice-versa) — same convention as `/v1/ads/tree` and `/v1/ads`. Date range defaults to the last 90 days. Capped at 730 days. Ranges older than the ingested history return…
 * GET /v1/ads/timeline
 * Platforms: meta, google, tiktok, linkedin, pinterest, x
 */
export function getAdsTimeline(query: { accountId: string; adAccountId?: string; fromDate?: string; toDate?: string; platform?: "facebook" | "instagram" | "tiktok" | "linkedin" | "pinterest" | "google" | "twitter" | "openai" }) {
  return zernioCall("GET", "/v1/ads/timeline", query, undefined);
}

/**
 * Get ad tracking tags
 * Unified read of the platform's native click-URL tracking params. - Meta (facebook/instagram): the creative's `url_tags` (and template_url_spec). - Google (googleads): the campaign's `trackingUrlTemplate` + `finalUrlSuffix`. Subject to the Google Ads API access-tier daily quota; bulk audits need Standard access. - LinkedIn (linkedinads): the campaign's Dynamic UTM `dynamicValueParameters` + `customValueParameters`. Returns 405 for platforms without a click-URL tracking surface (TikTok, X, Pinterest). **Not pixels.** Despite the shared path segment, this endpoint has nothing to do with measurem…
 * GET /v1/ads/{adId}/tracking-tags
 * Platforms: meta
 */
export function getAdTrackingTags(adId: string) {
  return zernioCall("GET", `/v1/ads/${encodeURIComponent(String(adId))}/tracking-tags`, undefined, undefined);
}

/**
 * Get campaign tree
 * Returns a nested Campaign > Ad Set > Ad hierarchy with rolled-up metrics at each level. Uses a two-stage aggregation: ads are grouped into ad sets, then ad sets into campaigns. Metrics are computed over an optional date range, then rolled up from ad level to ad set and campaign levels. Pagination is at the campaign level. Ads without a campaign or ad set ID are grouped into synthetic "Ungrouped" buckets. If no date range is provided, defaults to the last 90 days. Date range is capped at 730 days max. Pass `timeIncrement=1` to also get a daily breakdown: each node gains a `daily[]` array of pe…
 * GET /v1/ads/tree
 * Platforms: meta, google, tiktok, linkedin, pinterest, x
 */
export function getAdTree(query?: { limit?: number; source?: "zernio" | "all"; platform?: "facebook" | "instagram" | "tiktok" | "linkedin" | "pinterest" | "google" | "twitter" | "openai"; status?: string; adAccountId?: string; pageId?: string; accountId?: string; profileId?: string; campaignId?: string; fromDate?: string; toDate?: string; hasDelivery?: boolean; minSpend?: number; sort?: "newest" | "oldest" | "spend_desc" | "spend_asc"; timeIncrement?: 1; dailyLevel?: "campaign" | "adset" | "ad" }) {
  return zernioCall("GET", "/v1/ads/tree", query, undefined);
}

/**
 * Get campaign analytics
 * Returns performance analytics for a whole campaign in one call: summary metrics, a daily timeline over the requested date range (summed across the campaign's ads), and optional demographic breakdowns. Breakdowns are fetched live from Meta at the campaign level (one call per dimension, no per-ad fan-out), so an agency dashboard gets campaign-level age/gender/etc. without summing thousands of per-ad reads. `campaignId` is the platform campaign id; pass `platform` when a campaign id could be ambiguous across platforms. If no date range is provided, defaults to the last 90 days. Date range is cap…
 * GET /v1/ads/campaigns/{campaignId}/analytics
 * Platforms: meta, google, tiktok, linkedin, pinterest, x
 */
export function getCampaignAnalytics(campaignId: string, query?: { platform?: string; fromDate?: string; toDate?: string; breakdowns?: string }) {
  return zernioCall("GET", `/v1/ads/campaigns/${encodeURIComponent(String(campaignId))}/analytics`, query, undefined);
}

/**
 * Get a conversion destination
 * LinkedIn-only today. Returns the full destination record for one conversion rule. The `adAccountId` query parameter is required because LinkedIn rules are scoped to a sponsored ad account.
 * GET /v1/accounts/{accountId}/conversion-destinations/{destinationId}
 * Platforms: meta, google, tiktok, linkedin
 */
export function getConversionDestination(accountId: string, destinationId: string, query: { adAccountId: string }) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/conversion-destinations/${encodeURIComponent(String(destinationId))}`, query, undefined);
}

/**
 * Get attribution metrics
 * LinkedIn-only today. Returns conversion-attribution metrics (`externalWebsiteConversions`, `externalWebsitePostClickConversions`, `externalWebsitePostViewConversions`, `conversionValueInLocalCurrency`, `qualifiedLeads`, `costInLocalCurrency`) bucketed by date. Date-range constraints (passed through from LinkedIn): - `granularity=DAILY` is retained for ~6 months only - `granularity=ALL` with a range > 6 months auto-rounds to month boundaries - `granularity=MONTHLY`/`YEARLY` retains 24 months Throttle: LinkedIn caps adAnalytics at 45M metric values per 5-minute window across the calling token. …
 * GET /v1/accounts/{accountId}/conversion-destinations/{destinationId}/metrics
 * Platforms: meta, google, tiktok, linkedin
 */
export function getConversionMetrics(accountId: string, destinationId: string, query: { adAccountId: string; startDate: string; endDate?: string; granularity?: "ALL" | "DAILY" | "MONTHLY" | "YEARLY" }) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/conversion-destinations/${encodeURIComponent(String(destinationId))}/metrics`, query, undefined);
}

/**
 * Get Event Match Quality
 * Reads Meta Event Match Quality (EMQ) and pixel↔CAPI event coverage for a pixel/dataset, live from Meta's Dataset Quality API. Web events only (a Meta limitation). Meta-only; other platforms return 405. Requires the Ads add-on.
 * GET /v1/ads/conversions/quality
 * Platforms: meta
 */
export function getConversionsQuality(query: { accountId: string; destinationId: string }) {
  return zernioCall("GET", "/v1/ads/conversions/quality", query, undefined);
}

/**
 * Get ad account DSA defaults
 * Returns the default DSA beneficiary and payor currently set on a Meta ad account, whether they were set via `PATCH /v1/ads/accounts` or in Meta Ads Manager. Fields are omitted when no default is configured. Meta accounts only.
 * GET /v1/ads/dsa-defaults
 * Platforms: meta
 */
export function getDsaDefaults(query: { accountId: string; adAccountId: string }) {
  return zernioCall("GET", "/v1/ads/dsa-defaults", query, undefined);
}

/**
 * List DSA beneficiary/payor suggestions
 * Returns Meta's suggested beneficiary/payor names for an ad account, derived by Meta from the account's recent activity. Useful for prefilling `dsaBeneficiary`/`dsaPayor` inputs, or the defaults sent to `PATCH /v1/ads/accounts`, in your own UI. Meta returns a single flat list. Entries are not labeled as beneficiary or payor, and since these are legal disclosures Zernio never applies them automatically: let your user pick the right entity. The list may be empty for accounts with little activity. Meta accounts only.
 * GET /v1/ads/dsa-recommendations
 * Platforms: meta
 */
export function getDsaRecommendations(query: { accountId: string; adAccountId: string }) {
  return zernioCall("GET", "/v1/ads/dsa-recommendations", query, undefined);
}

/**
 * Get a lead form
 * GET /v1/ads/lead-forms/{formId}
 * Platforms: meta, linkedin
 */
export function getLeadForm(formId: string, query: { accountId: string }) {
  return zernioCall("GET", `/v1/ads/lead-forms/${encodeURIComponent(String(formId))}`, query, undefined);
}

/**
 * Suggested bid and budget bounds
 * LinkedIn-only. Returns the suggested bid and bid limits for a targeting spec, plus the daily-budget bounds LinkedIn will accept. Use it before creating a campaign to pick a bid inside the allowed range and warn the user if their daily budget is below the minimum. Wraps LinkedIn's `adBudgetPricing` finder. Non-LinkedIn accounts return `available: false` so clients can hide the pricing UI without treating it as a failure.
 * POST /v1/ads/targeting/bid-pricing
 * Platforms: linkedin
 */
export function getLinkedInBidPricing(body: { accountId: string; adAccountId: string; spec: unknown; campaignType?: "TEXT_AD" | "SPONSORED_UPDATES" | "SPONSORED_INMAILS"; bidType?: "CPM" | "CPC" | "CPV"; matchType?: "EXACT" | "AUDIENCE_EXPANDED"; currency?: string; objectiveType?: string; optimizationTargetType?: string; dailyBudget?: number }) {
  return zernioCall("POST", "/v1/ads/targeting/bid-pricing", undefined, body);
}

/**
 * Impressions, clicks and spend forecast
 * LinkedIn-only. Forecasted impressions, clicks, spend and ~20 other metrics for a targeting spec over a time range. Wraps LinkedIn's `adSupplyForecasts` finder. Each returned series carries a `metricType` (IMPRESSION, CLICK, SPENDING, MAX_POTENTIAL_BUDGET, COST_PER_MILLION_IMPRESSIONS, ...) and a `granularity` (DAILY, SEVEN_DAY, THIRTY_DAY, CUSTOM). LinkedIn caps the daily spending forecast at 1.2x the daily budget and returns 0 once the total budget is exhausted. Non-LinkedIn accounts return `available: false`.
 * POST /v1/ads/targeting/supply-forecast
 * Platforms: linkedin
 */
export function getLinkedInSupplyForecast(body: { accountId: string; adAccountId: string; spec: unknown; campaignType?: "SPONSORED_UPDATES" | "SPONSORED_INMAILS" | "DYNAMIC"; timeRangeStart: number; timeRangeEnd: number; objectiveType?: string; optimizationTarget?: string; dailyBudget?: number; totalBudget?: number; currency?: string; competingBid?: { bidType: "CPM" | "CPC" | "CPV"; amount: number }; enableAudienceNetwork?: boolean; enableAudienceExpansion?: boolean; connectedTelevisionOnly?: boolean }) {
  return zernioCall("POST", "/v1/ads/targeting/supply-forecast", undefined, body);
}

/**
 * Read a Reach & Frequency prediction
 * GET /v1/ads/rf-predictions/{predictionId}
 * Platforms: meta
 */
export function getRfPrediction(predictionId: string, query: { accountId: string; adAccountId: string }) {
  return zernioCall("GET", `/v1/ads/rf-predictions/${encodeURIComponent(String(predictionId))}`, query, undefined);
}

/**
 * Get a tracking tag
 * Returns the full tag record including the base-code `code` snippet, `lastFiredTime`, `ownerBusinessId`, `isUnavailable`, etc. Meta only (platform `metaads`); other platforms return 405. OpenAI Ads has no get-by-id endpoint, so it 405s here too — use `GET /v1/accounts/{accountId}/tracking-tags` (list) instead.
 * GET /v1/accounts/{accountId}/tracking-tags/{tagId}
 * Platforms: meta
 */
export function getTrackingTag(accountId: string, tagId: string) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/tracking-tags/${encodeURIComponent(String(tagId))}`, undefined, undefined);
}

/**
 * Get aggregated event stats
 * Returns aggregated event counts for the pixel (`GET /{pixel_id}/stats`). Rows are passed through from Meta as-is — their shape depends on the `aggregation` requested. Meta only (platform `metaads`); other platforms return 405.
 * GET /v1/accounts/{accountId}/tracking-tags/{tagId}/stats
 * Platforms: meta
 */
export function getTrackingTagStats(accountId: string, tagId: string, query?: { aggregation?: "event" | "host" | "url" | "url_by_rule" | "pixel_fire" | "device_type" | "device_os" | "browser_type" | "had_pii" | "custom_data_field" | "match_keys" | "event_source" | "event_detection_method" | "event_processing_results" | "event_total_counts" | "event_value_count"; startTime?: number; endTime?: number }) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/tracking-tags/${encodeURIComponent(String(tagId))}/stats`, query, undefined);
}

/**
 * Read a value rule set
 * Reads one value rule set including every nested rule id and criterion id. This is step one of any edit: `PUT` is a full replace, so you need the ids before you can keep the objects you are not changing. Meta's own read returns `GENDER` values lowercase (`"male"`) while writes require `"MALE"`. Values are passed through untouched, so never case-compare a stored rule against a fetched one.
 * GET /v1/ads/value-rule-sets/{valueRuleSetId}
 * Platforms: meta
 */
export function getValueRuleSet(valueRuleSetId: string, query: { accountId: string }) {
  return zernioCall("GET", `/v1/ads/value-rule-sets/${encodeURIComponent(String(valueRuleSetId))}`, query, undefined);
}

/**
 * List ad accounts
 * Returns the platform ad accounts available for the given social account (e.g. Meta ad accounts, TikTok advertiser IDs, Google Ads customer IDs). For TikTok agencies: enumerates every advertiser under every Business Center the token can read (paginated server-side), then chunks the lookup against TikTok's `/advertiser/info/` endpoint (which has a per-call cap of ≤100 IDs). Solo advertisers without a BC fall back to the OAuth-time `advertiser_ids` list. Cached for 1h on the SocialAccount; lazy-refreshed on first call after expiry. For Google Ads: responds `429` when Google's API quota is tempor…
 * GET /v1/ads/accounts
 * Platforms: meta, google, tiktok, linkedin, pinterest, x
 */
export function listAdAccounts(query: { accountId: string; adAccountId?: string; limit?: number }) {
  return zernioCall("GET", "/v1/ads/accounts", query, undefined);
}

/**
 * List custom audiences
 * Returns custom audiences for the given ad account. Supports Meta, Google, TikTok, Pinterest, LinkedIn, and X (Twitter).
 * GET /v1/ads/audiences
 * Platforms: meta, google, tiktok, linkedin, pinterest, x
 */
export function listAdAudiences(query: { accountId: string; adAccountId: string; platform?: "facebook" | "instagram" | "googleads" | "tiktok" | "tiktokads" | "pinterest" | "linkedin" | "linkedinads" | "twitter" | "xads"; type?: "customer_list" | "company_list" | "engagement" | "meta_engagement" | "website" | "website_retargeting" | "lookalike" | "saved_targeting" }) {
  return zernioCall("GET", "/v1/ads/audiences", query, undefined);
}

/**
 * List campaigns
 * Returns campaigns as virtual aggregations over ad documents grouped by platform campaign ID. Metrics (spend, impressions, clicks, etc.) are summed across all ads in each campaign. Campaign status is derived from child ad statuses (active > pending_review > paused > error > completed > cancelled > rejected).
 * GET /v1/ads/campaigns
 * Platforms: meta, google, tiktok, linkedin, pinterest, x
 */
export function listAdCampaigns(query?: { includeEmpty?: boolean; limit?: number; source?: "zernio" | "all"; platform?: "facebook" | "instagram" | "tiktok" | "linkedin" | "pinterest" | "google" | "twitter" | "openai"; status?: string; adAccountId?: string; pageId?: string; accountId?: string; profileId?: string; fromDate?: string; toDate?: string; hasDelivery?: boolean; minSpend?: number }) {
  return zernioCall("GET", "/v1/ads/campaigns", query, undefined);
}

/**
 * List a catalog's product sets
 * Lists a Meta product catalog's product sets — the unit a catalog ad promotes. Pass the chosen set as `promotedObject.productSetId` on POST /v1/ads/create with `goal: catalog_sales`.
 * GET /v1/ads/catalogs/{catalogId}/product-sets
 * Platforms: meta
 */
export function listAdCatalogProductSets(catalogId: string, query: { accountId: string }) {
  return zernioCall("GET", `/v1/ads/catalogs/${encodeURIComponent(String(catalogId))}/product-sets`, query, undefined);
}

/**
 * List Meta product catalogs
 * Lists the Meta product catalogs reachable from an ad account (owned + agency-shared catalogs of the ad account's business), for Advantage+ catalog ads (`goal: catalog_sales` on POST /v1/ads/create — e.g. vehicle inventory catalogs). Read-only; uses scopes customers already granted (no reconnect needed). Catalog contents (items, feeds) are managed in Meta Commerce Manager, not through this API.
 * GET /v1/ads/catalogs
 * Platforms: meta
 */
export function listAdCatalogs(query: { accountId: string; adAccountId: string }) {
  return zernioCall("GET", "/v1/ads/catalogs", query, undefined);
}

/**
 * Creative library
 * Lists the ad account's creative library (Meta's `/act_X/adcreatives`), rows returned verbatim. The default projection covers id, name, status, object type, thumbnail, object_story_spec / asset_feed_spec and url_tags; `fields` is a raw-passthrough override. Any creative id here is reusable on the create endpoints via `existingCreativeId`.
 * GET /v1/ads/creatives
 * Platforms: meta
 */
export function listAdCreatives(query: { accountId: string; adAccountId: string; fields?: string; limit?: number; after?: string }) {
  return zernioCall("GET", "/v1/ads/creatives", query, undefined);
}

/**
 * Ad image library
 * Lists the ad account's image library (Meta's `/act_X/adimages`), rows returned verbatim. The default projection covers hash, url, name, dimensions and status; `fields` is a raw-passthrough override. Any `hash` here is reusable wherever Meta accepts `image_hash` (e.g. `imageHash` on POST /v1/ads/creatives).
 * GET /v1/ads/images
 * Platforms: meta
 */
export function listAdImages(query: { accountId: string; adAccountId: string; fields?: string; limit?: number; after?: string }) {
  return zernioCall("GET", "/v1/ads/images", query, undefined);
}

/**
 * List Search keywords
 * Returns the Google Search keyword criteria (positive and negative) synced from connected Google Ads accounts, one row per ad-group keyword. Refreshed about once a week per Google Ads customer (the keyword sweep rides the ads discovery pass on a slower slot, to stay inside Google's shared daily API quota), so keywords added on Google can take several days to appear. A customer synced for the first time is populated on the next discovery pass rather than waiting for its weekly slot, and connecting an account or triggering a manual sync refreshes it immediately. Campaign-level negative keywords …
 * GET /v1/ads/keywords
 * Platforms: google
 */
export function listAdKeywords(query?: { limit?: number; accountId?: string; adAccountId?: string; profileId?: string; campaignId?: string; adSetId?: string; status?: "active" | "paused"; matchType?: "exact" | "phrase" | "broad" | "unknown"; negative?: boolean; search?: string }) {
  return zernioCall("GET", "/v1/ads/keywords", query, undefined);
}

/**
 * Ad labels
 * Lists the ad account's organizational labels (Meta's `/act_X/adlabels`), rows returned verbatim (id, name, created/updated time).
 * GET /v1/ads/labels
 * Platforms: meta
 */
export function listAdLabels(query: { accountId: string; adAccountId: string; limit?: number; after?: string }) {
  return zernioCall("GET", "/v1/ads/labels", query, undefined);
}

/**
 * List ads
 * Returns a paginated list of ads with metrics computed over an optional date range. Use source=all to include externally-synced ads from platform ad managers. If no date range is provided, defaults to the last 90 days. Date range is capped at 730 days max. To find the Zernio ad behind a comment you see in Meta Business Manager, filter by platformAdId (the Meta ad ID), effectiveObjectStoryId (Facebook), or effectiveInstagramMediaId (Instagram) — those are the post/media the ad's engagement lives on, and are also returned on each ad's `creative` object. Then call GET /v1/ads/{adId}/comments with…
 * GET /v1/ads
 * Platforms: meta, google, tiktok, linkedin, pinterest, x
 */
export function listAds(query?: { limit?: number; source?: "zernio" | "all"; status?: string; platform?: "facebook" | "instagram" | "tiktok" | "linkedin" | "pinterest" | "google" | "twitter" | "openai"; accountId?: string; adAccountId?: string; pageId?: string; profileId?: string; campaignId?: string; platformAdId?: string; effectiveObjectStoryId?: string; effectiveInstagramMediaId?: string; fromDate?: string; toDate?: string }) {
  return zernioCall("GET", "/v1/ads", query, undefined);
}

/**
 * List TikTok Business Centers
 * Returns the TikTok Business Centers (BCs) the connected `tiktokads` account can read. Each BC reports its advertiser count so callers can build agency-style pickers without re-walking `/v1/ads/accounts` per BC. TikTok-only. Solo advertisers (non-agency tokens) return an empty array.
 * GET /v1/ads/business-centers
 * Platforms: tiktok
 */
export function listAdsBusinessCenters(query: { accountId: string }) {
  return zernioCall("GET", "/v1/ads/business-centers", query, undefined);
}

/**
 * A/B tests and lift studies
 * Lists the ad account's A/B tests and lift studies (Meta's `/act_X/ad_studies`), rows returned verbatim. The default projection covers id, name, type, timing and cells with split percentages; `fields` is a raw-passthrough override.
 * GET /v1/ads/studies
 * Platforms: meta
 */
export function listAdStudies(query: { accountId: string; adAccountId: string; fields?: string; limit?: number; after?: string }) {
  return zernioCall("GET", "/v1/ads/studies", query, undefined);
}

/**
 * Ad video library
 * Lists the ad account's video library (Meta's `/act_X/advideos`), rows returned verbatim. The default projection covers id, title, status, poster frames, length and `source` (the playable MP4); `fields` is a raw-passthrough override. Any `id` here is reusable as `video.id` on the create endpoints, so N ads that differ only in copy share one upload. `source` lets you PLAY a video before picking it, which a poster frame alone can't settle when several videos share a first frame. It is a signed CDN URL that EXPIRES, so treat it as good for preview at selection time only — never persist it, re-lis…
 * GET /v1/ads/videos
 * Platforms: meta
 */
export function listAdVideos(query: { accountId: string; adAccountId: string; fields?: string; limit?: number; after?: string }) {
  return zernioCall("GET", "/v1/ads/videos", query, undefined);
}

/**
 * List associated campaigns
 * LinkedIn-only today. Returns the campaigns currently associated with this conversion rule. Note that auto-association on rule creation runs once at create time; campaigns created after the rule still need explicit association.
 * GET /v1/accounts/{accountId}/conversion-destinations/{destinationId}/associations
 * Platforms: meta, google, tiktok, linkedin
 */
export function listConversionAssociations(accountId: string, destinationId: string, query: { adAccountId: string }) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/conversion-destinations/${encodeURIComponent(String(destinationId))}/associations`, query, undefined);
}

/**
 * List conversion destinations
 * Returns the list of pixels (Meta), conversion actions (Google), conversion rules (LinkedIn), or pixels (OpenAI Ads) accessible to the connected ads account. Use the returned `id` as `destinationId` when posting to `POST /v1/ads/conversions`. For Google and LinkedIn, each destination's `type` reflects the conversion type (PURCHASE, LEAD, SIGN_UP, etc.) — the event type is locked to the destination. For Meta and OpenAI Ads, `type` is absent: pixels accept any event name per request. For LinkedIn, destinations are returned across every sponsored ad account the connected token can access; the `ad…
 * GET /v1/accounts/{accountId}/conversion-destinations
 * Platforms: meta, google, tiktok, linkedin
 */
export function listConversionDestinations(accountId: string) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/conversion-destinations`, undefined, undefined);
}

/**
 * High demand periods / budget schedules
 * Scheduled budget increases (Meta's budget-scheduling API). The Graph edge lives on the campaign and ad-set nodes only, so exactly one of `campaignId` / `adSetId` (platform ids) is required. Rows returned verbatim (budget_value, budget_value_type, time window, recurrence).
 * GET /v1/ads/high-demand-periods
 * Platforms: meta
 */
export function listHighDemandPeriods(query: { accountId: string; campaignId?: string; adSetId?: string; limit?: number; after?: string }) {
  return zernioCall("GET", "/v1/ads/high-demand-periods", query, undefined);
}

/**
 * List lead forms
 * Lists the Lead Gen forms owned by the account. Meta: forms on the connected Facebook Page. LinkedIn: forms owned by the ad account's Company Page — pass `adAccountId` (LinkedIn forms are org-owned). Requires the Ads add-on.
 * GET /v1/ads/lead-forms
 * Platforms: meta, linkedin
 */
export function listLeadForms(query: { accountId: string; adAccountId?: string; limit?: number; cursor?: string }) {
  return zernioCall("GET", "/v1/ads/lead-forms", query, undefined);
}

/**
 * Conversations of a Local Services lead
 * Conversation entries of one Local Services lead: phone calls (duration, recording URL) and messages (text, attachment URLs), oldest first. Read live from `local_services_lead_conversation`, always scoped to a single lead. Call-recording URLs require read access on the Google Ads account. Draws on the shared Google Ads operations budget.
 * GET /v1/ads/local-services/leads/{leadId}/conversations
 * Platforms: google
 */
export function listLocalServicesLeadConversations(leadId: string, query: { accountId: string; customerId?: string; pageToken?: string }) {
  return zernioCall("GET", `/v1/ads/local-services/leads/${encodeURIComponent(String(leadId))}/conversations`, query, undefined);
}

/**
 * Google Local Services Ads leads
 * Leads generated by Local Services Ads (phone calls, messages, bookings), read live from Google's `local_services_lead` resource, newest first. No persistence: Google is the source of truth and lead/credit statuses keep changing server-side. Google never returns healthcare-category leads, and `WIPED_OUT` leads arrive with contact erased (`contact` is null). Draws on the shared Google Ads operations budget.
 * GET /v1/ads/local-services/leads
 * Platforms: google
 */
export function listLocalServicesLeads(query: { accountId: string; customerId?: string; fromDate?: string; toDate?: string; leadType?: "PHONE_CALL" | "MESSAGE" | "BOOKING"; leadStatus?: string; chargedOnly?: boolean; pageToken?: string }) {
  return zernioCall("GET", "/v1/ads/local-services/leads", query, undefined);
}

/**
 * Businesses list
 * Business Manager portfolios the connected Meta user belongs to (Meta's `/me/businesses`), rows returned verbatim (id, name, verification_status, created_time). Token-scoped, so no `adAccountId` is needed. For TikTok Business Centers use `GET /v1/ads/business-centers`.
 * GET /v1/ads/businesses
 * Platforms: meta
 */
export function listMetaBusinesses(query: { accountId: string; limit?: number; after?: string }) {
  return zernioCall("GET", "/v1/ads/businesses", query, undefined);
}

/**
 * List tracking tags
 * Returns the tracking tags (Meta Pixels, or OpenAI Ads pixels) the connected ads account can see. Pass `?adAccountId=act_...` (Meta only) to scope the list to a single ad account; omit it to list every pixel reachable by the token (the name is then suffixed with the ad account it was discovered on, for disambiguation). The list view omits `code` — call `getTrackingTag` for the install snippet and full detail (Meta only; OpenAI Ads has no get-by-id endpoint). Meta (platform `metaads`) and OpenAI Ads (platform `openaiads`); other platforms return 405. The `accountId` must be the ads SocialAccoun…
 * GET /v1/accounts/{accountId}/tracking-tags
 * Platforms: meta
 */
export function listTrackingTags(accountId: string, query?: { adAccountId?: string }) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/tracking-tags`, query, undefined);
}

/**
 * List accounts it is shared with
 * Meta only (platform `metaads`); other platforms return 405.
 * GET /v1/accounts/{accountId}/tracking-tags/{tagId}/shared-accounts
 * Platforms: meta
 */
export function listTrackingTagSharedAccounts(accountId: string, tagId: string) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/tracking-tags/${encodeURIComponent(String(tagId))}/shared-accounts`, undefined, undefined);
}

/**
 * List value rule sets
 * Lists the ad account's value rule sets (Meta's `/act_X/value_rule_set`). A value rule set adjusts the auction bid up or down for audience segments you value differently; attach one to an ad set with `valueRuleSetId` on `POST /v1/ads/create` or `PUT /v1/ads/ad-sets/{adSetId}`. Rows are returned in the same camelCase shape the `PUT` body takes, ids included, so a set round-trips 1:1: **the update is a full replace, not a patch**, so you GET, mutate and send the whole thing back. Limits: 6 rule sets per ad account, 10 rules per set, 4 criteria per rule. **Rule order is semantic.** Rules are eval…
 * GET /v1/ads/value-rule-sets
 * Platforms: meta
 */
export function listValueRuleSets(query: { accountId: string; adAccountId: string; limit?: number; after?: string }) {
  return zernioCall("GET", "/v1/ads/value-rule-sets", query, undefined);
}

/**
 * List conversion events
 * Returns the most recent conversion events sent through `POST /v1/whatsapp/conversions` for the given WhatsApp account. Sourced from delivery logs (Axiom `late` dataset), so the visible window is bounded by log retention (about 30 days). Useful for rendering a "recent activity" panel on the conversions setup tab without standing up a parallel persistence layer. Per-event payload mirrors the structured log we write on every successful send: `eventName`, `conversationId`, `eventsReceived`, `eventsFailed`, `traceId`, `durationMs`, and the wall-clock `timestamp`.
 * GET /v1/whatsapp/conversions
 */
export function listWhatsAppConversions(query: { accountId: string; limit?: number }) {
  return zernioCall("GET", "/v1/whatsapp/conversions", query, undefined);
}

/**
 * Flexible live insights query
 * Live, flexible insights query. The account's platform picks the contract: **Meta (facebook/instagram)**: forwards caller-chosen `fields`, `breakdowns` and `filtering` to any Meta insights node and returns Meta's rows verbatim. `objectId` (required) selects the node; `level` sets row granularity. Semantic validation is Meta's: an unknown field or invalid breakdown combination returns a 400 carrying Meta's message. For long ranges or agency-scale accounts prefer the async variant (POST /v1/ads/insights/reports). **Google Ads (googleads)**: raw GAQL passthrough. Send any read-only GAQL SELECT vi…
 * GET /v1/ads/insights
 * Platforms: meta, google
 */
export function queryAdInsights(query: { accountId: string; objectId?: string; query?: string; customerId?: string; pageToken?: string; level?: "ad" | "adset" | "campaign" | "account"; fields?: string; breakdowns?: string; actionBreakdowns?: string; actionAttributionWindows?: string; actionReportTime?: string; useUnifiedAttributionSetting?: boolean; filtering?: string; datePreset?: string; fromDate?: string; toDate?: string; timeIncrement?: string; limit?: number; after?: string }) {
  return zernioCall("GET", "/v1/ads/insights", query, undefined);
}

/**
 * Remove associated campaigns
 * Remove one or more campaign associations from this conversion rule. Pass `adAccountId` and `campaignIds` as query parameters (`campaignIds` is comma-separated). The route also accepts a JSON body with the same fields for clients that prefer DELETE-with-body, but the documented surface is query-only because some SDK code generators (e.g. Python) collapse query + body parameters with the same name into a single kwarg.
 * DELETE /v1/accounts/{accountId}/conversion-destinations/{destinationId}/associations
 * Platforms: meta, google, tiktok, linkedin
 */
export function removeConversionAssociations(accountId: string, destinationId: string, query: { adAccountId: string; campaignIds: string }) {
  return zernioCall("DELETE", `/v1/accounts/${encodeURIComponent(String(accountId))}/conversion-destinations/${encodeURIComponent(String(destinationId))}/associations`, query, undefined);
}

/**
 * Stop sharing with an account
 * `adAccountId` may be passed as a query parameter (recommended) or as a JSON body field for clients that can send DELETE bodies. Meta only (platform `metaads`); other platforms return 405.
 * DELETE /v1/accounts/{accountId}/tracking-tags/{tagId}/shared-accounts
 * Platforms: meta
 */
export function removeTrackingTagSharedAccount(accountId: string, tagId: string, query?: { adAccountId?: string }) {
  return zernioCall("DELETE", `/v1/accounts/${encodeURIComponent(String(accountId))}/tracking-tags/${encodeURIComponent(String(tagId))}/shared-accounts`, query, undefined);
}

/**
 * Replace audience companies
 * Upload the company rows of a LinkedIn `company_list` audience (account-based marketing). LinkedIn-only, every other platform returns 422. A LinkedIn audience segment holds exactly one uploaded list, so the list you send here REPLACES the segment's list instead of being appended to it: always send the full set of companies. LinkedIn returns only the identifier of the uploaded file, never its rows, so the merge cannot be done for you, keep the source list on your side. LinkedIn does not document how quickly companies dropped from the list stop being targeted, so treat removals as eventual rathe…
 * POST /v1/ads/audiences/{audienceId}/companies
 * Platforms: linkedin
 */
export function replaceAdAudienceCompanies(audienceId: string, body: { companies: { name?: string; domain?: string; website?: string; linkedinPageUrl?: string }[] }) {
  return zernioCall("POST", `/v1/ads/audiences/${encodeURIComponent(String(audienceId))}/companies`, undefined, body);
}

/**
 * Reserve a Reach & Frequency prediction
 * Locks the quoted price + inventory until the returned `expiresAt` and mints a NEW prediction id — pass that RESERVED id (not the original) as `rfPredictionId` on POST /v1/ads/create. Release an unused reservation via DELETE.
 * POST /v1/ads/rf-predictions/{predictionId}/reserve
 * Platforms: meta
 */
export function reserveRfPrediction(predictionId: string, body: { accountId: string; adAccountId: string }) {
  return zernioCall("POST", `/v1/ads/rf-predictions/${encodeURIComponent(String(predictionId))}/reserve`, undefined, body);
}

/**
 * Search targeting interests
 * Deprecated alias for `GET /v1/ads/targeting/search?dimension=interest`. Kept for backward compatibility, it returns the legacy `{ interests: [...] }` shape rather than the normalized `{ results: [...] }`. New integrations should use `GET /v1/ads/targeting/search` with `dimension=interest`.
 * GET /v1/ads/interests
 * Platforms: meta
 */
export function searchAdInterests(query: { q: string; accountId: string }) {
  return zernioCall("GET", "/v1/ads/interests", query, undefined);
}

/**
 * Search targeting options
 * Resolve a human-readable query into the platform's opaque targeting ids used in the `TargetingSpec` (`countries`/`regions`/`cities`/`zips`/`metros` geo keys, and `interests`/`behaviors` entity ids) on `POST /v1/ads/create`, `POST /v1/ads/targeting/reach-estimate`, and `saved_targeting` audiences. The `dimension` param selects what is searched, `geo` (locations, further scoped by `geoType`), `interest`, `behavior`, or `income`. Availability of each dimension varies by platform (e.g. behaviours are Meta/TikTok only). Results are normalized across platforms into a single shape, so the same clien…
 * GET /v1/ads/targeting/search
 * Platforms: meta, google, tiktok, linkedin, pinterest
 */
export function searchAdTargeting(query: { accountId: string; q: string; dimension?: "geo" | "interest" | "behavior" | "income"; geoType?: "all" | "country" | "region" | "city" | "subcity" | "neighborhood" | "place" | "zip" | "metro_area" | "geo_market"; countryCode?: string; limit?: number }) {
  return zernioCall("GET", "/v1/ads/targeting/search", query, undefined);
}

/**
 * Send conversion events
 * Relay one or more conversion events to the target ad platform's native Conversions API. Platform is inferred from the provided `accountId`. Requires the Ads add-on. Supported platforms: - Meta (`metaads`) via Graph API - Google Ads (`googleads`) via Data Manager API `ingestEvents` - LinkedIn (`linkedinads`) via `/rest/conversionEvents` - TikTok (`tiktokads`) via the Offline Events API `/offline/batch/` — OFFLINE conversions only - OpenAI Ads (`openaiads`) via its Conversions API (a separate host, `bzr.openai.com`) `destinationId` semantics differ per platform: - Meta: pixel (dataset) ID, e.g.…
 * POST /v1/ads/conversions
 * Platforms: meta, google, tiktok, linkedin
 */
export function sendConversions(body: { accountId: string; destinationId: string; events: unknown[]; testCode?: string; consent?: { adUserData?: "GRANTED" | "DENIED"; adPersonalization?: "GRANTED" | "DENIED" } }) {
  return zernioCall("POST", "/v1/ads/conversions", undefined, body);
}

/**
 * Send WhatsApp conversion event
 * Forward a WhatsApp Business Messaging conversion event (`LeadSubmitted`, `Purchase`, `AddToCart`, `InitiateCheckout`, `ViewContent`) to Meta's Conversions API with `action_source = business_messaging` and `messaging_channel = whatsapp`. The endpoint looks up the originating CTWA click ID (`ctwa_clid`) captured on the first inbound message of the conversation and replays it on every event so Meta can attribute the conversion back to the Click-to-WhatsApp ad that drove the chat. Configuration prerequisite on the WhatsApp account metadata: - `metaCapiDatasetId`: the Meta dataset ID linked to the…
 * POST /v1/whatsapp/conversions
 */
export function sendWhatsAppConversion(body: { accountId: string; eventName: "LeadSubmitted" | "Purchase" | "AddToCart" | "InitiateCheckout" | "ViewContent"; eventTime?: number; eventId: string; conversationId?: string; phoneE164?: string; value?: number; currency?: string; contentIds?: string[]; email?: string; externalId?: string; testCode?: string }) {
  return zernioCall("POST", "/v1/whatsapp/conversions", undefined, body);
}

/**
 * Update ad
 * Patch one or more fields on an ad. Status, budget, targeting, and creative changes are propagated to the platform. Per-platform support: - **Meta** (Facebook + Instagram): all fields supported. - **TikTok**: status, budget, targeting (via `/v2/adgroup/update/`), and creative (via `/v2/ad/update/` patch-style — `headline` is ignored, `body` becomes `ad_text`). - **Google**: status, budget, and KEYWORD edits via `targeting.keywords` / `targeting.negativeKeywords` — each list you send becomes the FULL new set of its kind on the ad group (criteria not in the list are removed); a kind left out is …
 * PUT /v1/ads/{adId}
 * Platforms: meta, google, tiktok, linkedin, pinterest, x
 */
export function updateAd(adId: string, body: { status?: "active" | "paused"; budget?: { amount?: number; type?: "daily" | "lifetime" }; targeting?: { keywords?: unknown[]; negativeKeywords?: unknown[]; ageMin?: number; ageMax?: number; countries?: string[]; interests?: { id: string; name: string }[]; advantage_audience?: 0 | 1 }; creative?: { headline?: string; body?: string; callToAction?: string; linkUrl?: string; imageUrl?: string; videoUrl?: string }; name?: string }) {
  return zernioCall("PUT", `/v1/ads/${encodeURIComponent(String(adId))}`, undefined, body);
}

/**
 * Update ad account settings
 * Sets the default DSA beneficiary and payor on a Meta ad account (EU DSA, Article 26). Set them once and every EU-targeted call to `/v1/ads/create`, `/v1/ads/boost` and `/v1/ads/ctwa` on that ad account can omit `dsaBeneficiary`/`dsaPayor`: Meta applies the defaults automatically. The values are written to the ad account on Meta, the same setting Ads Manager edits. Nothing is stored in Zernio, and defaults already set in Ads Manager work identically. Zernio never guesses these values for you. Beneficiary and payor are legal disclosures shown to EU users, so you must provide the entity names ex…
 * PATCH /v1/ads/accounts
 * Platforms: meta
 */
export function updateAdAccount(body: { accountId: string; adAccountId: string; defaultDsaBeneficiary: string; defaultDsaPayor?: string }) {
  return zernioCall("PATCH", "/v1/ads/accounts", undefined, body);
}

/**
 * Update an audience
 * Update an audience. `saved_targeting` audiences accept `name`, `description`, and `spec` (full replacement, no merge, Zernio-only, no platform call). Platform audiences (uploaded/website/lookalike) accept `name` and `description` only, updated on the platform first and then mirrored locally; their rules are immutable, so `spec` returns 400 for them. Platform audience updates are Meta-only for now (other platforms return 501). Ads already created from a saved_targeting audience are unaffected, they snapshot the targeting at creation.
 * PUT /v1/ads/audiences/{audienceId}
 * Platforms: meta, google, tiktok, linkedin, pinterest, x
 */
export function updateAdAudience(audienceId: string, body: { name?: string; description?: string; spec?: unknown }) {
  return zernioCall("PUT", `/v1/ads/audiences/${encodeURIComponent(String(audienceId))}`, undefined, body);
}

/**
 * Update a campaign
 * Campaign-level edits. Send at least one of `budget`, `bidStrategy`, `name` or `platformSpecificData`. An unsupported field is always an error, never a silent drop. | Body field | Meta | Google | Others | |---|---|---|---| | `bidStrategy` | Yes | Yes | 501 | | `bidAmount`, `roasAverageFloor` | 400 — ad-set level | Yes | 400 | | `budget` (CBO; ABO returns 409) | Yes | 501 | 501 | | `name` | Yes | 501 | 501 | | `platformSpecificData.spendCap` | Yes | 400 | 400 | | `accountId` (empty campaigns) | Yes | - | - | Google maps the shared enum onto its own strategies: `LOWEST_COST_WITHOUT_CAP` to Maxim…
 * PUT /v1/ads/campaigns/{campaignId}
 * Platforms: meta, google, tiktok, linkedin, pinterest, x, openai
 */
export function updateAdCampaign(campaignId: string, body: { platform: "facebook" | "instagram" | "google"; accountId?: string; bidStrategy?: unknown; bidAmount?: number; roasAverageFloor?: number; budget?: { amount: number; type: "daily" | "lifetime" }; name?: string; platformSpecificData?: { spendCap?: unknown } }) {
  return zernioCall("PUT", `/v1/ads/campaigns/${encodeURIComponent(String(campaignId))}`, undefined, body);
}

/**
 * Pause or resume a campaign
 * Writes the campaign's own on/off switch, then lets the platform cascade delivery to its ad sets and ads. Makes one platform API call, not one per ad. The switch is always written, whatever delivery status the ads underneath report: an ad still in review does not block resuming its campaign. The echoed `status` is the confirmation that it landed. `updated` / `skipped` describe only the ads whose own stored status CHANGED alongside it, so `updated: 0` is a normal successful response, not a no-op. Ads are skipped when they are in a terminal status (rejected, completed, cancelled), already in the…
 * PUT /v1/ads/campaigns/{campaignId}/status
 * Platforms: meta, google, tiktok, linkedin, pinterest, x, openai
 */
export function updateAdCampaignStatus(campaignId: string, body: { status: "active" | "paused"; platform: "facebook" | "instagram" | "tiktok" | "linkedin" | "pinterest" | "google" | "twitter" | "openai" }) {
  return zernioCall("PUT", `/v1/ads/campaigns/${encodeURIComponent(String(campaignId))}/status`, undefined, body);
}

/**
 * Rename a creative
 * Renames a creative. Creatives are immutable on Meta beyond `name` — for content changes create a new creative (POST /v1/ads/creatives) and swap it onto the ad (PUT /v1/ads/{adId} with `creative`).
 * PUT /v1/ads/creatives/{creativeId}
 * Platforms: meta
 */
export function updateAdCreative(creativeId: string, body: { accountId: string; name: string }) {
  return zernioCall("PUT", `/v1/ads/creatives/${encodeURIComponent(String(creativeId))}`, undefined, body);
}

/**
 * Update an ad set
 * Ad-set-level writes. Use this for ABO budget updates, ad-set-scoped pause/resume, bid-strategy edits, Meta value-rule-set attach/detach, and Meta-only post-launch delivery settings via `platformSpecificData`. At least one updatable field is required. Value rule sets (Meta only, see `/v1/ads/value-rule-sets`): - ATTACH or REPLACE: send `valueRuleSetId`. Attachment is driven by the id's presence, so `valueRulesApplied: true` is optional. Sending a different id replaces the previous association; there is no separate replace call. - DETACH: send `valueRulesApplied: false` and OMIT `valueRuleSetId…
 * PUT /v1/ads/ad-sets/{adSetId}
 * Platforms: meta, google, tiktok, linkedin, pinterest, x, openai
 */
export function updateAdSet(adSetId: string, body: { platform: "facebook" | "instagram" | "tiktok" | "linkedin" | "pinterest" | "google" | "twitter" | "openai"; budget?: { amount?: number; type?: "daily" | "lifetime" }; status?: "active" | "paused"; name?: string; bidStrategy?: unknown; bidAmount?: number; roasAverageFloor?: number; valueRuleSetId?: string; valueRulesApplied?: boolean; platformSpecificData?: { optimizationGoal?: string; billingEvent?: string; startDate?: string; endDate?: string; promotedObject?: { pixelId?: string; customEventType?: string; customEventStr?: string; pageId?: string; applicationId?: string; objectStoreUrl?: string; customConversionId?: string; productCatalogId?: string; productSetId?: string; offlineConversionDataSetId?: string; whatsappPhoneNumber?: string } } }) {
  return zernioCall("PUT", `/v1/ads/ad-sets/${encodeURIComponent(String(adSetId))}`, undefined, body);
}

/**
 * Pause or resume a single ad set
 * Ad-set-scoped pause/resume (doesn't touch sibling ad sets). Thin wrapper over PUT /v1/ads/ad-sets/{adSetId} for callers that only want the status toggle and prefer a symmetric URL to /v1/ads/campaigns/{campaignId}/status. On Meta and LinkedIn this writes the ad set's own on/off switch (Meta: `configured_status`), whatever delivery status its ads report — an ad still in review does not block resuming its ad set. The echoed `status` is the confirmation that it landed. Where the platform has no ad-set switch (TikTok and others) the toggle is emulated by flipping the child ads; a call with no act…
 * PUT /v1/ads/ad-sets/{adSetId}/status
 * Platforms: meta, tiktok
 */
export function updateAdSetStatus(adSetId: string, body: { status: "active" | "paused"; platform: "facebook" | "instagram" | "tiktok" | "linkedin" | "pinterest" | "google" | "twitter" | "openai" }) {
  return zernioCall("PUT", `/v1/ads/ad-sets/${encodeURIComponent(String(adSetId))}/status`, undefined, body);
}

/**
 * Pause or resume a single ad
 * Ad-scoped pause/resume — touches ONLY this ad, never its parent ad set or campaign (so sibling ads keep running). Thin wrapper over the `status` field of PUT /v1/ads/{adId}, for callers that want a URL symmetric to /v1/ads/campaigns/{campaignId}/status and /v1/ads/ad-sets/{adSetId}/status. `{adId}` accepts the same identifier dialects as GET/PUT /v1/ads/{adId} (Zernio hex `_id`, Meta numeric `platformAdId`, or the creative's effective story/media IDs). `platform` is inferred from the ad, so it's not required in the body. Ads in terminal statuses (rejected, completed, cancelled) and no-op flip…
 * PUT /v1/ads/{adId}/status
 * Platforms: meta, google, tiktok, linkedin, pinterest, x
 */
export function updateAdStatus(adId: string, body: { status: "active" | "paused" }) {
  return zernioCall("PUT", `/v1/ads/${encodeURIComponent(String(adId))}/status`, undefined, body);
}

/**
 * Set ad tracking tags
 * Unified update. Send only the fields for the ad's platform: - Meta: `urlTags` (array of {key,value}). Meta creatives are immutable, so this rebuilds the creative and repoints the ad. By DEFAULT we PRESERVE the existing creative verbatim (re-post its object_story_spec + the new url_tags, reusing the image), so you send `urlTags` ALONE — no need to read back headline/body/CTA. `creative` (headline, body, callToAction, linkUrl, imageUrl) is OPTIONAL and only needed to rebuild explicitly, or for SHARE / page-post / dark / asset_feed creatives whose object_story_spec Meta strips (those return 422 …
 * PATCH /v1/ads/{adId}/tracking-tags
 * Platforms: meta
 */
export function updateAdTrackingTags(adId: string, body: { urlTags?: { key: string; value: string }[]; creative?: { headline: string; body: string; callToAction: string; linkUrl: string; imageUrl: string; videoUrl?: string }; trackingUrlTemplate?: string; finalUrlSuffix?: string; dynamicValueParameters?: Record<string, unknown>; customValueParameters?: Record<string, unknown> }) {
  return zernioCall("PATCH", `/v1/ads/${encodeURIComponent(String(adId))}/tracking-tags`, undefined, body);
}

/**
 * Update a conversion destination
 * Partial-update a conversion rule. LinkedIn-only today. Whitelisted fields: `name`, `enabled`, attribution windows, `valueType`, `value`, `attributionType`. The rule's `type` and parent ad account are intentionally not exposed for update — recreate the rule if those need to change.
 * PATCH /v1/accounts/{accountId}/conversion-destinations/{destinationId}
 * Platforms: meta, google, tiktok, linkedin
 */
export function updateConversionDestination(accountId: string, destinationId: string, body: { adAccountId: string; name?: string; enabled?: boolean; attributionType?: "LAST_TOUCH_BY_CAMPAIGN" | "LAST_TOUCH_BY_CONVERSION"; postClickAttributionWindowSize?: 1 | 7 | 30 | 90 | 365; viewThroughAttributionWindowSize?: 1 | 7 | 30 | 90 | 365; valueType?: "DYNAMIC" | "FIXED" | "NO_VALUE"; value?: { currencyCode?: string; amount?: string } }) {
  return zernioCall("PATCH", `/v1/accounts/${encodeURIComponent(String(accountId))}/conversion-destinations/${encodeURIComponent(String(destinationId))}`, undefined, body);
}

/**
 * Update a tracking tag
 * Partial-update a pixel. Whitelisted fields: `name` (rename), `enableAutomaticMatching`, `automaticMatchingFields`, `firstPartyCookieStatus`, `dataUseSetting`. At least one is required. Returns the re-fetched canonical tag. Meta only (platform `metaads`); other platforms return 405. There is no DELETE — Meta has no API to delete a pixel. To stop using one, unshare it from your ad accounts (`DELETE .../tracking-tags/{tagId}/shared-accounts`) or disable it in Events Manager.
 * PATCH /v1/accounts/{accountId}/tracking-tags/{tagId}
 * Platforms: meta
 */
export function updateTrackingTag(accountId: string, tagId: string, body: { name?: string; enableAutomaticMatching?: boolean; automaticMatchingFields?: ("em" | "ph" | "fn" | "ln" | "ge" | "db" | "ct" | "st" | "zp" | "country" | "external_id")[]; firstPartyCookieStatus?: "empty" | "first_party_cookie_disabled" | "first_party_cookie_enabled"; dataUseSetting?: "advertising_and_analytics" | "analytics_only" | "empty" }) {
  return zernioCall("PATCH", `/v1/accounts/${encodeURIComponent(String(accountId))}/tracking-tags/${encodeURIComponent(String(tagId))}`, undefined, body);
}

/**
 * Replace a value rule set
 * **THIS IS A FULL REPLACE, NOT A PATCH.** Meta's update is declarative: the body you send becomes the rule set. - `GET /v1/ads/value-rule-sets/{valueRuleSetId}` FIRST. - Keep a rule or criterion by echoing its `id`. - Create one by including the object WITHOUT an `id`. - Delete one by OMITTING it from the array. There is no warning and no undo. `name` and `rules` are both required for exactly this reason: a partial body would silently destroy every rule left out. **Rule order is semantic**: the array order you send is the evaluation order, and only the first matching rule adjusts the bid for a…
 * PUT /v1/ads/value-rule-sets/{valueRuleSetId}
 * Platforms: meta
 */
export function updateValueRuleSet(valueRuleSetId: string, body: { accountId: string; name: string; rules: unknown[] }) {
  return zernioCall("PUT", `/v1/ads/value-rule-sets/${encodeURIComponent(String(valueRuleSetId))}`, undefined, body);
}

/**
 * Upload an ad image from base64
 * Uploads raw image bytes to the Meta ad account's image library — for callers whose creatives aren't hosted at a public URL. Returns the image `hash` (Meta's identifier for the asset) and the Meta-hosted `url`, which can be used directly as `imageUrl` on the create endpoints. Max 30 MB decoded.
 * POST /v1/ads/images
 * Platforms: meta
 */
export function uploadAdImage(body: { accountId: string; adAccountId: string; imageBase64: string; filename?: string }) {
  return zernioCall("POST", "/v1/ads/images", undefined, body);
}

/**
 * Upload an ad video
 * Standalone ad-video upload (parallel to POST /v1/ads/images), so a video creative can be rendered via POST /v1/ads/preview or attached via `video.id` on POST /v1/ads/create before an ad exists. Accepts either an https `videoUrl` we download server-side (SSRF-guarded) or raw `videoBase64` bytes; exactly one is required. `videoBase64` is capped by Vercel's body limit — around 4.5 MB payload in practice, so larger videos must come via `videoUrl`. Returns the Meta `video.id` (reusable wherever `video.id` is accepted) plus Meta's auto-generated poster URL when available. The endpoint waits until M…
 * POST /v1/ads/videos
 * Platforms: meta
 */
export function uploadAdVideo(body: { accountId: string; adAccountId: string; videoUrl?: string; videoBase64?: string; filename?: string }) {
  return zernioCall("POST", "/v1/ads/videos", undefined, body);
}


/* ======================================================================
 * analytics — 31 operations
 * ====================================================================== */

/**
 * Get post analytics
 * Returns analytics for posts. With postId, returns a single post. Without it, returns a paginated list with overview stats. Accepts both Zernio Post IDs and External Post IDs (auto-resolved). fromDate defaults to 90 days ago if omitted, max range 366 days. Single post lookups may return 202 (sync pending) or 424 (all platforms failed). For follower stats, use /v1/accounts/follower-stats. LinkedIn personal accounts: Analytics are only available for posts published through Zernio. LinkedIn's API only returns metrics for posts authored by the authenticated user. Organization/company page analytic…
 * GET /v1/analytics
 */
export function getAnalytics(query?: { postId?: string; platform?: string; profileId?: string; accountId?: string; source?: "all" | "late" | "external"; fromDate?: string; toDate?: string; limit?: number; page?: number; sortBy?: "date" | "engagement" | "impressions" | "reach" | "likes" | "comments" | "shares" | "saves" | "clicks" | "views" | "follows" | "ig_reels_avg_watch_time" | "ig_reels_video_view_total_time" | "reposts" | "reels_skip_rate"; order?: "asc" | "desc" }) {
  return zernioCall("GET", "/v1/analytics", query, undefined);
}

/**
 * Get best times to post
 * Returns the best times to post based on historical engagement data. Groups all published posts by day of week and hour (UTC), calculating average engagement per slot. Use this to auto-schedule posts at optimal times. Requires the Analytics add-on.
 * GET /v1/analytics/best-time
 */
export function getBestTimeToPost(query?: { platform?: string; profileId?: string; accountId?: string; source?: "all" | "late" | "external" }) {
  return zernioCall("GET", "/v1/analytics/best-time", query, undefined);
}

/**
 * Get content performance decay
 * Returns how engagement accumulates over time after a post is published. Each bucket shows what percentage of the post's total engagement had been reached by that time window. Useful for understanding content lifespan (e.g. "posts reach 78% of total engagement within 24 hours"). Requires the Analytics add-on.
 * GET /v1/analytics/content-decay
 */
export function getContentDecay(query?: { platform?: string; profileId?: string; accountId?: string; source?: "all" | "late" | "external" }) {
  return zernioCall("GET", "/v1/analytics/content-decay", query, undefined);
}

/**
 * Get daily aggregated metrics
 * Returns daily aggregated analytics metrics and a per-platform breakdown. Each day includes post count, platform distribution, and summed metrics (impressions, reach, likes, comments, shares, saves, clicks, views). Defaults to the last 180 days. Requires the Analytics add-on.
 * GET /v1/analytics/daily-metrics
 */
export function getDailyMetrics(query?: { platform?: string; profileId?: string; accountId?: string; fromDate?: string; toDate?: string; source?: "all" | "late" | "external"; attribution?: "publish" | "received" }) {
  return zernioCall("GET", "/v1/analytics/daily-metrics", query, undefined);
}

/**
 * Get Facebook Page insights
 * Returns page-level Facebook insights (media views, views, post engagements, video metrics, follower counts). Response shape matches /v1/analytics/instagram/account-insights so the same client handling works across platforms. Metric names track the current (post-November 2025) Meta Graph API. The legacy page_impressions / page_fans / page_fan_adds / page_fan_removes metrics were deprecated by Meta on November 15, 2025 and are NOT accepted by this endpoint. Use the replacements below. Because Meta did not provide direct adds/removes replacements, Zernio synthesizes followers_gained / followers_…
 * GET /v1/analytics/facebook/page-insights
 */
export function getFacebookPageInsights(query: { accountId: string; metrics?: string; since?: string; until?: string; metricType?: "time_series" | "total_value" }) {
  return zernioCall("GET", "/v1/analytics/facebook/page-insights", query, undefined);
}

/**
 * Get Facebook post monetization earnings
 * Returns lifetime monetization earnings for ONE Facebook post, read live from Meta on every request. Requires the Analytics add-on. Earnings are CUMULATIVE since the post was published, not earnings within a date range, so this endpoint takes no since/until and the totals must not be summed across dates or across posts. Page-level daily earnings live on /v1/analytics/facebook/page-insights. A post on a Page that is not enrolled in monetization, or that earned nothing, returns "total": 0 rather than an error: Meta does not distinguish the two. A metric Meta returned no bucket for at all is repo…
 * GET /v1/analytics/facebook/post-earnings
 */
export function getFacebookPostEarnings(query: { accountId: string; postId: string; metrics?: string }) {
  return zernioCall("GET", "/v1/analytics/facebook/post-earnings", query, undefined);
}

/**
 * Get Facebook post reactions
 * Returns the reaction breakdown for a Facebook Page post: a count per reaction type plus the overall total. The whole breakdown is fetched in a single Graph call. Note that the post analytics endpoint reports only an aggregate reaction count (surfaced there as `likes`), so use this endpoint when you need per-type counts.
 * GET /v1/accounts/{accountId}/facebook-post-reactions
 */
export function getFacebookPostReactions(accountId: string, query: { postId: string }) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/facebook-post-reactions`, query, undefined);
}

/**
 * Get follower stats
 * Returns follower count history and growth metrics for connected social accounts. Requires analytics add-on subscription. Follower counts are refreshed once per day.
 * GET /v1/accounts/follower-stats
 */
export function getFollowerStats(query?: { accountIds?: string; profileId?: string; fromDate?: string; toDate?: string; granularity?: "daily" | "weekly" | "monthly" }) {
  return zernioCall("GET", "/v1/accounts/follower-stats", query, undefined);
}

/**
 * Get GBP performance metrics
 * Returns daily performance metrics for a Google Business Profile location. Metrics include impressions (Maps/Search, desktop/mobile), website clicks, call clicks, direction requests, conversations, bookings, and food orders. Data may be delayed 2-3 days. Max 18 months of historical data. Requires the Analytics add-on.
 * GET /v1/analytics/googlebusiness/performance
 */
export function getGoogleBusinessPerformance(query: { accountId: string; metrics?: string; startDate?: string; endDate?: string }) {
  return zernioCall("GET", "/v1/analytics/googlebusiness/performance", query, undefined);
}

/**
 * Get GBP search keywords
 * Returns search keywords that triggered impressions for a Google Business Profile location. Data is aggregated monthly. Keywords below a minimum impression threshold set by Google are excluded. Max 18 months of historical data. Requires the Analytics add-on.
 * GET /v1/analytics/googlebusiness/search-keywords
 */
export function getGoogleBusinessSearchKeywords(query: { accountId: string; startMonth?: string; endMonth?: string }) {
  return zernioCall("GET", "/v1/analytics/googlebusiness/search-keywords", query, undefined);
}

/**
 * Get day × hour heatmap
 * Day-of-week × hour-of-day breakdown of inbox messages. Buckets are sparse — only cells with at least one event are returned; clients zero-fill the rest to render the full 7×24 grid. The `dow` field follows ClickHouse's `toDayOfWeek` convention (1 = Monday … 7 = Sunday). Max date range is 365 days.
 * GET /v1/analytics/inbox/heatmap
 */
export function getInboxHeatmap(query: { fromDate: string; toDate?: string; profileId?: string; platform?: string; accountId?: string; source?: string; action?: "message.received" | "message.sent" | "message.read" | "all" }) {
  return zernioCall("GET", "/v1/analytics/inbox/heatmap", query, undefined);
}

/**
 * Get inbox response-time stats
 * Time-to-first-response stats. Pairs each received message with the next sent message in the same conversation and reports the delta as both summary statistics and a fixed-bucket histogram suited for the analytics page's TTR chart. `sampleSize` reflects only conversations that received AND got a reply in the window — received-but-never-answered conversations are excluded. Compare against /v1/analytics/inbox/volume's `summary.received` to compute reply rate. Max date range is 365 days.
 * GET /v1/analytics/inbox/response-time
 */
export function getInboxResponseTime(query: { fromDate: string; toDate?: string; profileId?: string; platform?: string; accountId?: string }) {
  return zernioCall("GET", "/v1/analytics/inbox/response-time", query, undefined);
}

/**
 * Get inbox source breakdown
 * Breakdown of inbox messages by their lineage source (the `metadata.source` field set at ingest time: human / workflow / sequence / broadcast / comment_automation / api / contact / platform). Each source row also carries a per-platform sub-split. Max date range is 365 days.
 * GET /v1/analytics/inbox/source-breakdown
 */
export function getInboxSourceBreakdown(query: { fromDate: string; toDate?: string; profileId?: string; platform?: string; accountId?: string }) {
  return zernioCall("GET", "/v1/analytics/inbox/source-breakdown", query, undefined);
}

/**
 * Get top accounts by inbox volume
 * Leaderboard of social accounts by inbox message volume. Decorates each row with display labels from the live SocialAccount record (so the UI shows username + displayName, not just an ID). Accounts that no longer map to a SocialAccount surface as "(disconnected)" so the row stays visible. Max date range is 365 days.
 * GET /v1/analytics/inbox/top-accounts
 */
export function getInboxTopAccounts(query: { fromDate: string; toDate?: string; profileId?: string; platform?: string; source?: string; limit?: number }) {
  return zernioCall("GET", "/v1/analytics/inbox/top-accounts", query, undefined);
}

/**
 * Get inbox messaging volume
 * Daily inbox messaging volume + breakdowns. Folds the raw messaging events into three projections so the client can render the volume chart, KPI strip, and per-platform stacked bar from a single call. Max date range is 365 days.
 * GET /v1/analytics/inbox/volume
 */
export function getInboxVolume(query: { fromDate: string; toDate?: string; profileId?: string; platform?: string; accountId?: string; source?: string }) {
  return zernioCall("GET", "/v1/analytics/inbox/volume", query, undefined);
}

/**
 * Get Instagram insights
 * Returns account-level Instagram insights such as reach, views, accounts engaged, and total interactions. These metrics reflect the entire account's performance across all content surfaces (feed, stories, explore, profile), and are fundamentally different from post-level metrics. Data may be delayed up to 48 hours. Max 90 days, defaults to last 30 days. Requires the Analytics add-on.
 * GET /v1/analytics/instagram/account-insights
 */
export function getInstagramAccountInsights(query: { accountId: string; metrics?: string; since?: string; until?: string; metricType?: "time_series" | "total_value"; breakdown?: string }) {
  return zernioCall("GET", "/v1/analytics/instagram/account-insights", query, undefined);
}

/**
 * Get Instagram demographics
 * Returns audience demographic insights for an Instagram account, broken down by age, city, country, and/or gender. Requires at least 100 followers. Returns top 45 entries per dimension. Data may be delayed up to 48 hours. Requires the Analytics add-on.
 * GET /v1/analytics/instagram/demographics
 */
export function getInstagramDemographics(query: { accountId: string; metric?: "follower_demographics" | "engaged_audience_demographics"; breakdown?: string; timeframe?: "this_week" | "this_month" }) {
  return zernioCall("GET", "/v1/analytics/instagram/demographics", query, undefined);
}

/**
 * Get Instagram follower history
 * Returns a daily running Instagram follower count time series, served from Zernio's cross-platform daily snapshotter. Exists because Meta removed follower_count from the /insights endpoint in Graph API v22+ and never exposed a historical daily series via any public API. Response envelope matches /v1/analytics/instagram/account-insights so the same client handling works. Max 89 days, defaults to last 30 days. Requires the Analytics add-on.
 * GET /v1/analytics/instagram/follower-history
 */
export function getInstagramFollowerHistory(query: { accountId: string; metrics?: string; since?: string; until?: string; metricType?: "time_series" | "total_value" }) {
  return zernioCall("GET", "/v1/analytics/instagram/follower-history", query, undefined);
}

/**
 * Get Instagram story insights
 * Returns metrics for a single story. The `source` field discriminates between three states: - `live` — fetched from Meta in real time (story is still active) - `cached` — fetched from a persisted `story_insights` webhook payload (story has expired but we received its final-state metrics from Meta) - `unavailable` — story has expired and we never received its webhook payload (for example, the account connected after the story expired) Meta can report an expired story as an empty successful result rather than an error, so an expired story resolves to `cached` or `unavailable` even though the ups…
 * GET /v1/accounts/{accountId}/instagram/stories/{storyId}/insights
 */
export function getInstagramStoryInsights(accountId: string, storyId: string) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/instagram/stories/${encodeURIComponent(String(storyId))}/insights`, undefined, undefined);
}

/**
 * Get LinkedIn aggregate stats
 * Returns aggregate analytics across all posts for a LinkedIn personal account. Only includes posts published through Zernio (LinkedIn API limitation). Org accounts should use /v1/analytics instead. Requires r_member_postAnalytics scope. Saves (POST_SAVE) and sends (POST_SEND) are available for personal accounts; organization pages always return 0 for these two metrics because LinkedIn does not expose them on the organization analytics endpoint.
 * GET /v1/accounts/{accountId}/linkedin-aggregate-analytics
 */
export function getLinkedInAggregateAnalytics(accountId: string, query?: { aggregation?: "TOTAL" | "DAILY"; startDate?: string; endDate?: string; metrics?: string }) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/linkedin-aggregate-analytics`, query, undefined);
}

/**
 * Get LinkedIn org analytics
 * Returns aggregate analytics for a LinkedIn organization page. Parallel to /v1/accounts/{id}/linkedin-aggregate-analytics (which handles personal accounts only). Backed by LinkedIn's organizationalEntityShareStatistics, organizationalEntityFollowerStatistics, and organizationPageStatistics endpoints. Response shape matches /v1/analytics/instagram/account-insights. Max 89 days, defaults to last 30 days. Requires the Analytics add-on. Scope requirements: r_organization_social, r_organization_followers, and r_organization_admin must all be present on the account. Accounts connected before these s…
 * GET /v1/analytics/linkedin/org-aggregate-analytics
 */
export function getLinkedInOrgAggregateAnalytics(query: { accountId: string; metrics?: string; since?: string; until?: string; metricType?: "time_series" | "total_value" }) {
  return zernioCall("GET", "/v1/analytics/linkedin/org-aggregate-analytics", query, undefined);
}

/**
 * Get LinkedIn post stats
 * Returns analytics for a specific LinkedIn post by URN. Works for both personal and organization accounts. Saves and sends are only populated for personal accounts (LinkedIn does not expose these metrics on the organization analytics endpoint).
 * GET /v1/accounts/{accountId}/linkedin-post-analytics
 */
export function getLinkedInPostAnalytics(accountId: string, query: { urn: string }) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/linkedin-post-analytics`, query, undefined);
}

/**
 * Get LinkedIn post reactions
 * Returns individual reactions for a specific LinkedIn post, including reactor profiles (name, headline/job title, profile picture, profile URL, reaction type). Only works for organization/company page accounts. LinkedIn restricts reaction data for personal profiles (r_member_social_feed is a closed permission).
 * GET /v1/accounts/{accountId}/linkedin-post-reactions
 */
export function getLinkedInPostReactions(accountId: string, query: { urn: string; limit?: number; cursor?: number }) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/linkedin-post-reactions`, query, undefined);
}

/**
 * Get frequency vs engagement
 * Returns the correlation between posting frequency (posts per week) and engagement rate, broken down by platform. Helps find the optimal posting cadence for each platform. Each row represents a specific (platform, posts_per_week) combination with the average engagement rate observed across all weeks matching that frequency. Requires the Analytics add-on.
 * GET /v1/analytics/posting-frequency
 */
export function getPostingFrequency(query?: { platform?: string; profileId?: string; accountId?: string; source?: "all" | "late" | "external" }) {
  return zernioCall("GET", "/v1/analytics/posting-frequency", query, undefined);
}

/**
 * Get post analytics timeline
 * Returns a daily timeline of analytics metrics for a specific post, showing how impressions, likes, and other metrics evolved day-by-day since publishing. Each row represents one day of data per platform. For multi-platform Zernio posts, returns separate rows for each platform. Requires the Analytics add-on.
 * GET /v1/analytics/post-timeline
 */
export function getPostTimeline(query: { postId: string; fromDate?: string; toDate?: string }) {
  return zernioCall("GET", "/v1/analytics/post-timeline", query, undefined);
}

/**
 * Get TikTok account-level insights
 * Returns account-level TikTok insights from /v2/user/info/ (live) plus historical time series joined from Zernio's daily snapshotter (AccountStats). Response shape matches /v1/analytics/instagram/account-insights. Max 89 days, defaults to last 30 days. Requires the Analytics add-on and the user.info.stats scope on the account (412 if missing). Scope intentionally narrow. TikTok's public API exposes only the four counter metrics below. The deep metrics that live in TikTok Studio are NOT available on any public TikTok API, even for Business accounts: - profile_views - account-level impressions /…
 * GET /v1/analytics/tiktok/account-insights
 */
export function getTikTokAccountInsights(query: { accountId: string; metrics?: string; since?: string; until?: string; metricType?: "time_series" | "total_value" }) {
  return zernioCall("GET", "/v1/analytics/tiktok/account-insights", query, undefined);
}

/**
 * Get YouTube channel insights
 * Returns channel-scoped aggregate metrics from YouTube Analytics API v2. Saves you from looping /v1/analytics/youtube/daily-views over every video when you only need channel totals. Response shape matches /v1/analytics/instagram/account-insights so the same client handling works. Requires yt-analytics.readonly scope (412 with reauthorizeUrl if missing). Data has a 2-3 day delay (endDate is clamped accordingly). Max 89 days, defaults to last 30 days. Requires the Analytics add-on. NOT exposed: impressions (Studio thumbnail impressions) and impressionsClickThroughRate. YouTube Analytics API v2 d…
 * GET /v1/analytics/youtube/channel-insights
 */
export function getYouTubeChannelInsights(query: { accountId: string; metrics?: string; since?: string; until?: string; metricType?: "time_series" | "total_value" }) {
  return zernioCall("GET", "/v1/analytics/youtube/channel-insights", query, undefined);
}

/**
 * Get YouTube daily views
 * Returns daily view counts for a YouTube video including views, watch time, and subscriber changes. Requires yt-analytics.readonly scope (re-authorization may be needed). YouTube finalizes analytics with a ~3-day delay; by default only finalized days are returned, and an explicit endDate can reach into the delay window (see the endDate parameter). Max 90 days, defaults to last 30 days.
 * GET /v1/analytics/youtube/daily-views
 */
export function getYouTubeDailyViews(query: { videoId: string; accountId: string; startDate?: string; endDate?: string }) {
  return zernioCall("GET", "/v1/analytics/youtube/daily-views", query, undefined);
}

/**
 * Get YouTube demographics
 * Returns audience demographic insights for a YouTube channel, broken down by age, gender, and/or country. Pass videoId to get the audience profile of a single video instead of the whole channel. Age and gender values are viewer percentages (0-100). Country values are view counts. Data is based on signed-in viewers only, with a 2-3 day delay. YouTube suppresses demographics for videos with too few signed-in views, so low-traffic videos can return empty breakdowns. Requires the Analytics add-on.
 * GET /v1/analytics/youtube/demographics
 */
export function getYouTubeDemographics(query: { accountId: string; videoId?: string; breakdown?: string; startDate?: string; endDate?: string }) {
  return zernioCall("GET", "/v1/analytics/youtube/demographics", query, undefined);
}

/**
 * Get YouTube video retention curve
 * Returns the audience retention curve for a single YouTube video, plus the video's duration for rendering the curve on a time axis. The curve has up to 100 points (elapsedVideoTimeRatio 0.01-1.0) aggregated over the whole date range; YouTube does not support per-day retention breakdowns. audienceWatchRatio is the absolute share of viewers watching at that point in the video and can exceed 1 (rewinds and looping, common on Shorts). relativeRetentionPerformance compares against videos of similar length (0 = worst, 0.5 = median, 1 = best). YouTube returns an empty curve for videos with very few v…
 * GET /v1/analytics/youtube/video-retention
 */
export function getYouTubeVideoRetention(query: { videoId: string; accountId: string; startDate?: string; endDate?: string }) {
  return zernioCall("GET", "/v1/analytics/youtube/video-retention", query, undefined);
}

/**
 * List active Instagram stories
 * Returns the IG Business/Creator account's currently-active stories. Meta keeps stories live for 24h; expired stories are not returned. Limitations propagated from Meta (these are NOT bugs): - 24h window only - Live videos excluded - Reshared stories not returned - `mediaUrl` may be null if Meta flagged the story for copyright - `caption`, `likeCount`, `commentsCount` do not apply to story media
 * GET /v1/accounts/{accountId}/instagram/stories
 */
export function listInstagramStories(accountId: string) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/instagram/stories`, undefined, undefined);
}


/* ======================================================================
 * billing — 6 operations
 * ====================================================================== */

/**
 * Account billing snapshot (plan, cycle, balance, caps, status)
 * The billing "wallet/statement" view: current plan, billing cycle, accrued balance + remaining credits this period, spend caps, and payment / access status. This is the billing half of the legacy `/v1/usage-stats` snapshot — the per-product consumption half is metering and lives on `GET /v1/usage`. Usage-based (Metronome) accounts get a populated `balance`; legacy Stripe accounts get `balance: null` plus a deprecated `legacy.limits` block and, when payment-blocked, `status.openInvoiceUrl` / `status.declineReason`.
 * GET /v1/billing
 */
export function getBilling() {
  return zernioCall("GET", "/v1/billing", undefined, undefined);
}

/**
 * Calling usage and cost
 * Aggregated calling usage across your numbers, both channels (WhatsApp Business Calling + regular phone/PSTN): call counts, answered counts, minutes, and cost. Use it for cost visibility or to rebill your own customers per number. Costs come from each call's billing snapshot, so this endpoint always agrees with the invoice: `billableUSD` is what Zernio bills; `metaUSD` is the WhatsApp per-minute charge Meta bills directly to your WABA (display only, never billed by Zernio). Optional `groupBy` returns a breakdown by UTC day, by your number, or by channel. Defaults to the last 30 days.
 * GET /v1/usage/calls
 */
export function getCallsUsage(query?: { since?: string; until?: string; channel?: "whatsapp" | "pstn"; number?: string; groupBy?: "day" | "number" | "channel" }) {
  return zernioCall("GET", "/v1/usage/calls", query, undefined);
}

/**
 * SMS usage (volumes)
 * Aggregated SMS/MMS volumes across your numbers: sent, received, and total message counts, with an optional breakdown by UTC day or by number. Defaults to the last 30 days. Volumes only, deliberately: SMS cost is carrier-rated asynchronously and billed to your invoice, so per-message cost is not available here. Calling usage (GET /v1/usage/calls) does include billable cost.
 * GET /v1/usage/sms
 */
export function getSmsUsage(query?: { since?: string; until?: string; number?: string; groupBy?: "day" | "number" }) {
  return zernioCall("GET", "/v1/usage/sms", query, undefined);
}

/**
 * Usage snapshot (default) or billed-spend metering (with params)
 * Dual-mode endpoint, selected by query params — fully backward compatible: **Without metering params (the default):** the plan / quota / usage snapshot — plan name, billing period, limits, usage counts, access state. Identical to `GET /v1/usage-stats`. Existing integrations keep working unchanged. **With `range`, `granularity`, `from`, or `to`:** usage METERING — billed spend (USD) by product family (`accounts`, `numbers`, `calls`, `sms`, `dlc`, `xApi`, `credits`, `other`) over the window, at `day` / `month` / `total` granularity, from Metronome's invoice breakdown (the CHARGE view — always re…
 * GET /v1/usage
 */
export function getUsage(query?: { reconcile?: boolean; range?: "cycle" | "prev-cycle" | "7d" | "14d" | "30d" | "3mo" | "12mo" | "custom"; from?: string; to?: string; granularity?: "day" | "month" | "total"; groupBy?: "profile" | "account"; profileId?: string; accountId?: string }) {
  return zernioCall("GET", "/v1/usage", query, undefined);
}

/**
 * Get plan and usage snapshot (plan, limits, payment status)
 * The plan / quota / payment-status snapshot: current plan name, billing period, plan limits, usage counts, and access state. Identical to a bare `GET /v1/usage` call (this path is its deprecated alias). For billed spend by product, call `GET /v1/usage` with `range` / `granularity` params. The statement view (balance, credits, caps, payment status) lives at `GET /v1/billing`. The response shape depends on the account's `billingSystem`: * Stripe users: per-period `usage.uploads` / `usage.profiles` counters. * Metronome (usage-based) users: `usage.connectedAccounts`, `usage.xApiCallsByOperation` …
 * GET /v1/usage-stats
 */
export function getUsageStats(query?: { reconcile?: boolean }) {
  return zernioCall("GET", "/v1/usage-stats", query, undefined);
}

/**
 * Get X/Twitter API pricing table
 * Returns Zernio's canonical X/Twitter API pricing table. Each X action has its own Metronome product and its own rate, and Zernio passes X API costs through at exact rates with zero markup. The response is identical for every authenticated user (pricing is universal), so it is safe to cache on the client for the duration of a billing period. To compute your own per-operation spend, pair this endpoint with `GET /v1/usage-stats` — that endpoint returns `usage.xApiCallsByOperation` keyed by the same `operation` field you get here.
 * GET /v1/billing/x-pricing
 */
export function getXApiPricing() {
  return zernioCall("GET", "/v1/billing/x-pricing", undefined, undefined);
}


/* ======================================================================
 * contacts — 27 operations
 * ====================================================================== */

/**
 * Assign a role to a guild member
 * Assign one role to one member. Idempotent on Discord's side — re-running on a member who already has the role is a 204 no-op. Path shape mirrors Discord's own API (`PUT /guilds/{guild}/members/{user}/roles/{role}`) for zero-translation mental mapping. Bot needs MANAGE_ROLES permission in the guild AND its highest role must be above the target role (Discord hierarchy rule). The `@everyone` role (where roleId == guildId) cannot be assigned.
 * PUT /v1/discord/guilds/{guildId}/members/{userId}/roles/{roleId}
 */
export function addDiscordMemberRole(guildId: string, userId: string, roleId: string, query: { accountId: string }) {
  return zernioCall("PUT", `/v1/discord/guilds/${encodeURIComponent(String(guildId))}/members/${encodeURIComponent(String(userId))}/roles/${encodeURIComponent(String(roleId))}`, query, undefined);
}

/**
 * Block users
 * Block one or more WhatsApp users on this number. Blocked users cannot message your number or see that you are online, and your sends to them return an error. Meta constraints, surfaced per-user in `failed` (the request itself still succeeds for the rest of the batch): - Only users who messaged your business within the last 24 hours can be blocked (failures outside the window report "Re-engagement required"). - Up to 1,000 users per request; the blocklist caps at 64,000. - Other WhatsApp Business accounts cannot be blocked.
 * POST /v1/whatsapp/block-users
 */
export function blockWhatsAppUsers(body: { accountId: string; users: string[] }) {
  return zernioCall("POST", "/v1/whatsapp/block-users", undefined, body);
}

/**
 * Bulk create contacts
 * Import up to 1000 contacts at a time. Skips duplicates, merging any new tags onto the existing contact. accountId is required whenever contacts carry a platformIdentifier (or a row-level accountId); platform is always derived from the resolved account, never used to decide whether channels are created, and a mismatched platform 404s as account not found. When accountId is set, each contact must carry a platformIdentifier; a row missing it is rejected individually (reported in errors[], HTTP 200), not a 400 for the whole import. On phone platforms (whatsapp, sms) the platformIdentifier is norm…
 * POST /v1/contacts/bulk
 */
export function bulkCreateContacts(body: { profileId: string; accountId?: string; platform?: string; contacts: { name: string; platformIdentifier?: string; displayIdentifier?: string; email?: string; company?: string; tags?: string[] }[] }) {
  return zernioCall("POST", "/v1/contacts/bulk", undefined, body);
}

/**
 * Clear custom field value
 * Remove a custom field value from a contact. The field definition is not affected.
 * DELETE /v1/contacts/{contactId}/fields/{slug}
 */
export function clearContactFieldValue(contactId: string, slug: string) {
  return zernioCall("DELETE", `/v1/contacts/${encodeURIComponent(String(contactId))}/fields/${encodeURIComponent(String(slug))}`, undefined, undefined);
}

/**
 * Create contact
 * Create a new contact. Optionally create a platform channel in the same request by providing accountId, platform, and platformIdentifier.
 * POST /v1/contacts
 */
export function createContact(body: { profileId: string; name: string; email?: string; company?: string; tags?: string[]; isSubscribed?: boolean; notes?: string; accountId?: string; platform?: string; platformIdentifier?: string; displayIdentifier?: string }) {
  return zernioCall("POST", "/v1/contacts", undefined, body);
}

/**
 * Create a test lead
 * Submits a test lead against the form (POST /{form-id}/test_leads) to exercise retrieval without waiting for real ad impressions. Meta allows one test lead per form at a time.
 * POST /v1/ads/lead-forms/{formId}/test-leads
 * Platforms: meta
 */
export function createTestLead(formId: string, body: { accountId: string; fieldData: { name: string; values: string[] }[] }) {
  return zernioCall("POST", `/v1/ads/lead-forms/${encodeURIComponent(String(formId))}/test-leads`, undefined, body);
}

/**
 * Delete contact
 * Permanently deletes a contact and all associated channels.
 * DELETE /v1/contacts/{contactId}
 */
export function deleteContact(contactId: string) {
  return zernioCall("DELETE", `/v1/contacts/${encodeURIComponent(String(contactId))}`, undefined, undefined);
}

/**
 * Get contact
 * Returns a contact with all associated messaging channels.
 * GET /v1/contacts/{contactId}
 */
export function getContact(contactId: string) {
  return zernioCall("GET", `/v1/contacts/${encodeURIComponent(String(contactId))}`, undefined, undefined);
}

/**
 * List channels for a contact
 * Returns all messaging channels linked to a contact (e.g. Instagram DM, Telegram, WhatsApp).
 * GET /v1/contacts/{contactId}/channels
 */
export function getContactChannels(contactId: string) {
  return zernioCall("GET", `/v1/contacts/${encodeURIComponent(String(contactId))}/channels`, undefined, undefined);
}

/**
 * Get a Discord guild member
 * Fetch a single guild member by Discord user id. Cheaper than paginating the full member listing when you already know who you are looking for.
 * GET /v1/discord/guilds/{guildId}/members/{userId}
 */
export function getDiscordGuildMember(guildId: string, userId: string, query: { accountId: string }) {
  return zernioCall("GET", `/v1/discord/guilds/${encodeURIComponent(String(guildId))}/members/${encodeURIComponent(String(userId))}`, query, undefined);
}

/**
 * List blocked users
 * List the WhatsApp users blocked on this number. Cursor-paginated; pass `nextCursor` back as `after` to fetch the next page. The blocklist holds up to 64,000 users.
 * GET /v1/whatsapp/block-users
 */
export function getWhatsAppBlockedUsers(query: { accountId: string; limit?: number; after?: string }) {
  return zernioCall("GET", "/v1/whatsapp/block-users", query, undefined);
}

/**
 * Check if a user is blocked
 * Definitive blocked-state lookup for a single contact. Meta exposes no membership endpoint, so this reads Zernio's blocklist mirror (kept in sync by the block/unblock endpoints; the first call per account backfills the mirror from Meta's full list). Constant-time regardless of blocklist size.
 * GET /v1/whatsapp/block-users/status
 */
export function getWhatsAppBlockStatus(query: { accountId: string; user: string }) {
  return zernioCall("GET", "/v1/whatsapp/block-users/status", query, undefined);
}

/**
 * Check call permission
 * Returns the permission state and the list of available actions for a given consumer wa_id (e.g. `start_call`, `send_call_permission_request`). Use this before placing a call to decide whether to prompt for consent first.
 * GET /v1/whatsapp/call-permissions
 */
export function getWhatsAppCallPermissions(query: { accountId: string; to: string }) {
  return zernioCall("GET", "/v1/whatsapp/call-permissions", query, undefined);
}

/**
 * Get number status
 * Live snapshot of a connected number straight from Meta: the phone-number node (display number, display name + approval, quality rating, messaging-limit tier, throughput, official-business badge, connection status, health_status) and its owning WhatsApp Business Account (name, business verification, timezone, health_status). Fetched live because Meta updates quality/tier/name/health over time; the call also refreshes the cached values shown on the connection card.
 * GET /v1/whatsapp/number-info
 */
export function getWhatsAppNumberInfo(query: { accountId: string }) {
  return zernioCall("GET", "/v1/whatsapp/number-info", query, undefined);
}

/**
 * List contacts
 * List and search contacts for a profile. Supports filtering by tags, platform, subscription status, and text search on name, email and company.
 * GET /v1/contacts
 */
export function listContacts(query?: { profileId?: string; accountId?: string; search?: string; tag?: string; tags?: string; platform?: "instagram" | "facebook" | "telegram" | "twitter" | "bluesky" | "reddit" | "whatsapp"; isSubscribed?: "true" | "false"; limit?: number; skip?: number }) {
  return zernioCall("GET", "/v1/contacts", query, undefined);
}

/**
 * List Discord guild members
 * Cursor-paginated list of guild members. Returns Discord's raw member objects so callers can build community-ops automation (e.g. "add role to all members joined in the last 7 days") on the actual platform shape. Pagination: pass `after` = the last `user.id` from the previous page. Omit on the first call. Response includes a `nextCursor` and `hasMore` flag so callers don't need to know Discord's pagination shape.
 * GET /v1/discord/guilds/{guildId}/members
 */
export function listDiscordGuildMembers(guildId: string, query: { accountId: string; limit?: number; after?: string }) {
  return zernioCall("GET", `/v1/discord/guilds/${encodeURIComponent(String(guildId))}/members`, query, undefined);
}

/**
 * List leads for a single form
 * Returns leads for one form. Serves persisted leads (ingested via the leadgen webhook) when available, falling back to a live Graph read.
 * GET /v1/ads/lead-forms/{formId}/leads
 * Platforms: meta
 */
export function listFormLeads(formId: string, query: { accountId: string; limit?: number; cursor?: string; since?: number }) {
  return zernioCall("GET", `/v1/ads/lead-forms/${encodeURIComponent(String(formId))}/leads`, query, undefined);
}

/**
 * List submitted leads
 * Returns submitted Lead Gen leads for your team, newest-first, with keyset pagination on `cursor`. For Meta (default) leads are served from the persisted cache, ingested in real time from the `leadgen` webhook. When `accountId` is a LinkedIn ads account, leads are fetched live from LinkedIn's `leadFormResponses` (LinkedIn has no webhook and enforces 90-day retention, so nothing is persisted) and `adAccountId` is required. Reading LinkedIn responses needs the `r_marketing_leadgen_automation` permission; accounts connected before it was added must reconnect. Requires the Ads add-on.
 * GET /v1/ads/leads
 * Platforms: meta, linkedin
 */
export function listLeads(query?: { formId?: string; accountId?: string; adAccountId?: string; limit?: number; since?: number; cursor?: string }) {
  return zernioCall("GET", "/v1/ads/leads", query, undefined);
}

/**
 * List Slack workspace members
 * Members of the connected Slack workspace that can receive a direct message, for populating a recipient picker. Bots, deactivated members and Slackbot are excluded. Start a DM by passing a member id as `participantId` to POST /v1/inbox/conversations.
 * GET /v1/accounts/{accountId}/slack-members
 */
export function listSlackMembers(accountId: string, query?: { query?: string; limit?: number }) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/slack-members`, query, undefined);
}

/**
 * List SMS opt-outs
 * The recipients who opted out of SMS (replied STOP) across your numbers, most recent first. Compliance surface: you must be able to see and export your opt-out list. Read-only: a recipient is re-subscribed only by replying START. Pass `format=csv` to download a CSV instead of JSON.
 * GET /v1/sms/opt-outs
 */
export function listSmsOptOuts(query?: { format?: "json" | "csv"; limit?: number }) {
  return zernioCall("GET", "/v1/sms/opt-outs", query, undefined);
}

/**
 * Remove a role from a guild member
 * Remove one role from one member. Idempotent — removing a role the member doesn't have returns 204 no-op. Same permission + hierarchy constraints as the PUT counterpart.
 * DELETE /v1/discord/guilds/{guildId}/members/{userId}/roles/{roleId}
 */
export function removeDiscordMemberRole(guildId: string, userId: string, roleId: string, query: { accountId: string }) {
  return zernioCall("DELETE", `/v1/discord/guilds/${encodeURIComponent(String(guildId))}/members/${encodeURIComponent(String(userId))}/roles/${encodeURIComponent(String(roleId))}`, query, undefined);
}

/**
 * Search Discord guild members
 * Search guild members whose username or nickname **starts with** the query (Discord matches prefixes only, not substrings). Cheaper than paginating the full member listing when you already know who you are looking for.
 * GET /v1/discord/guilds/{guildId}/members/search
 */
export function searchDiscordGuildMembers(guildId: string, query: { accountId: string; query: string; limit?: number }) {
  return zernioCall("GET", `/v1/discord/guilds/${encodeURIComponent(String(guildId))}/members/search`, query, undefined);
}

/**
 * Set custom field value
 * Set or overwrite a custom field value on a contact. The value type must match the field definition.
 * PUT /v1/contacts/{contactId}/fields/{slug}
 */
export function setContactFieldValue(contactId: string, slug: string, body: { value: unknown }) {
  return zernioCall("PUT", `/v1/contacts/${encodeURIComponent(String(contactId))}/fields/${encodeURIComponent(String(slug))}`, undefined, body);
}

/**
 * Unblock users
 * Unblock one or more previously blocked WhatsApp users on this number. Up to 1,000 users per request; per-user failures are reported in `failed` without failing the rest of the batch.
 * DELETE /v1/whatsapp/block-users
 */
export function unblockWhatsAppUsers(body: { accountId: string; users: string[] }) {
  return zernioCall("DELETE", "/v1/whatsapp/block-users", undefined, body);
}

/**
 * Update contact
 * Update one or more fields on a contact. Only provided fields are changed.
 * PATCH /v1/contacts/{contactId}
 */
export function updateContact(contactId: string, body?: { name?: string; email?: string; company?: string; avatarUrl?: string; tags?: string[]; isSubscribed?: boolean; isBlocked?: boolean; notes?: string }) {
  return zernioCall("PATCH", `/v1/contacts/${encodeURIComponent(String(contactId))}`, undefined, body);
}

/**
 * Upload opt-in form proof for an appeal
 * Hosts a screenshot (or PDF) of your SMS opt-in form and returns its public URL. Carrier reviewers reject campaigns whose consent can't be verified and ask for a "link/screenshot of the opt-in form" — the registry has no attachment field, so include the returned URL inside the `messageFlow` you submit with the appeal (`POST /v1/sms/registrations/{id}/appeal`).
 * POST /v1/sms/registrations/{id}/opt-in-proof
 */
export function uploadSmsOptInProof(id: string, body: FormData) {
  return zernioCall("POST", `/v1/sms/registrations/${encodeURIComponent(String(id))}/opt-in-proof`, undefined, body);
}

/**
 * Upload opt-in form proof
 * Hosts a screenshot (or PDF) of your SMS opt-in form and returns its public URL. Include that URL in the campaign's `messageFlow` (the opt-in workflow text) — the carrier registry has no attachment field, so reviewers verify consent by opening links in that answer. Works before a registration exists (use it when registering) and for appeals. `/v1/sms/registrations/{id}/opt-in-proof` is an alias.
 * POST /v1/sms/opt-in-proof
 */
export function uploadSmsOptInProofFile(body: FormData) {
  return zernioCall("POST", "/v1/sms/opt-in-proof", undefined, body);
}


/* ======================================================================
 * engagement — 47 operations
 * ====================================================================== */

/**
 * Batch get reviews
 * Fetches reviews across multiple locations in a single request. More efficient than calling GET /gmb-reviews per location for multi-location businesses. Returns a flat locationReviews array (not grouped by location): each item carries the location resource name it belongs to (`name`) plus the review object (`review`), whose identity is `review.reviewId`. Reviews are requested from Google ordered by `orderBy` (default `updateTime desc`, newest first), so callers polling for recent reviews can stop paginating once they cross their date window. Note: this endpoint does not return aggregate metric…
 * POST /v1/accounts/{accountId}/gmb-reviews/batch
 */
export function batchGetGoogleBusinessReviews(accountId: string, body: { locationNames: string[]; pageSize?: number; pageToken?: string; orderBy?: "updateTime desc" | "rating" | "rating desc" }) {
  return zernioCall("POST", `/v1/accounts/${encodeURIComponent(String(accountId))}/gmb-reviews/batch`, undefined, body);
}

/**
 * Bookmark a tweet
 * Bookmark a tweet by ID. Requires the bookmark.write OAuth scope. Rate limit: 50 requests per 15-min window.
 * POST /v1/twitter/bookmark
 */
export function bookmarkPost(body: { accountId: string; tweetId: string }) {
  return zernioCall("POST", "/v1/twitter/bookmark", undefined, body);
}

/**
 * Create a Discord guild role
 * Creates a new role in the guild. Requires the bot to hold the Manage Roles permission. Guilds that added the Zernio bot before role management shipped must re-invite it, because Discord applies the permission set at invite time. Discord's role hierarchy applies: the bot cannot create a role positioned at or above its own highest role, and cannot grant permissions it does not itself hold. Either attempt returns a 403 carrying Discord's own error.
 * POST /v1/discord/guilds/{guildId}/roles
 */
export function createDiscordGuildRole(guildId: string, query: { accountId: string }, body: { name: string; color?: number; hoist?: boolean; mentionable?: boolean; permissions?: string }) {
  return zernioCall("POST", `/v1/discord/guilds/${encodeURIComponent(String(guildId))}/roles`, query, body);
}

/**
 * Create a Discord scheduled event
 * Create a guild scheduled event. Three event types, selected via the discriminator on `entity.type`: - `external` — off-platform (Zoom, in-person, livestream). Requires both `location` and `endsAt`. Most common type for scheduler integrations. - `voice` — hosted in a Discord voice channel. Requires `channelId`. - `stage` — hosted in a Discord stage channel. Requires `channelId`. Bot needs MANAGE_EVENTS in the guild. Existing installs (pre-events PR) need a re-invite OR a server admin manually granting the permission — see route header for details.
 * POST /v1/discord/guilds/{guildId}/events
 */
export function createDiscordScheduledEvent(guildId: string, body: { accountId: string; name: string; description?: string; startsAt: string; entity: unknown; imageDataUri?: string }) {
  return zernioCall("POST", `/v1/discord/guilds/${encodeURIComponent(String(guildId))}/events`, undefined, body);
}

/**
 * Create a Discord public thread
 * Creates a public thread in a channel. Pass `messageId` to start the thread from an existing message, or omit it to create a standalone thread. Threads created here are always public. Requires the bot to hold Create Public Threads, which the Zernio bot requests at install time.
 * POST /v1/discord/channels/{channelId}/threads
 */
export function createDiscordThread(channelId: string, query: { accountId: string }, body: { name: string; messageId?: string; autoArchiveDuration?: 60 | 1440 | 4320 | 10080 }) {
  return zernioCall("POST", `/v1/discord/channels/${encodeURIComponent(String(channelId))}/threads`, query, body);
}

/**
 * Crosspost Discord message
 * Publishes a message from an announcement channel so it propagates to every server following that channel. The source channel must be an announcement channel. Calling this on a regular text channel returns a 400 before Discord is contacted, because Discord's own error for this case is opaque.
 * POST /v1/discord/channels/{channelId}/messages/{messageId}/crosspost
 */
export function crosspostDiscordMessage(channelId: string, messageId: string, query: { accountId: string }) {
  return zernioCall("POST", `/v1/discord/channels/${encodeURIComponent(String(channelId))}/messages/${encodeURIComponent(String(messageId))}/crosspost`, query, undefined);
}

/**
 * Delete a Discord guild role
 * Permanently deletes a role from the guild and removes it from every member. This cannot be undone. Requires the bot to hold Manage Roles, and the target role must sit below the bot's highest role.
 * DELETE /v1/discord/guilds/{guildId}/roles/{roleId}
 */
export function deleteDiscordGuildRole(guildId: string, roleId: string, query: { accountId: string }) {
  return zernioCall("DELETE", `/v1/discord/guilds/${encodeURIComponent(String(guildId))}/roles/${encodeURIComponent(String(roleId))}`, query, undefined);
}

/**
 * Delete a Discord channel message
 * Deletes a message from a channel, for moderation and cleanup. This cannot be undone. Deleting a message the bot did not send requires the bot to hold the Manage Messages permission, which the Zernio bot requests at install time. Deleting the bot's own message needs no extra permission. Ownership is verified by resolving the channel's guild and confirming the caller owns a Discord account bound to it.
 * DELETE /v1/discord/channels/{channelId}/messages/{messageId}
 */
export function deleteDiscordMessage(channelId: string, messageId: string, query: { accountId: string }) {
  return zernioCall("DELETE", `/v1/discord/channels/${encodeURIComponent(String(channelId))}/messages/${encodeURIComponent(String(messageId))}`, query, undefined);
}

/**
 * Delete a Discord scheduled event
 * Hard-delete an event. Use PATCH with `status: 'cancelled'` instead if you want the event preserved in the guild's history.
 * DELETE /v1/discord/guilds/{guildId}/events/{eventId}
 */
export function deleteDiscordScheduledEvent(guildId: string, eventId: string, query: { accountId: string }) {
  return zernioCall("DELETE", `/v1/discord/guilds/${encodeURIComponent(String(guildId))}/events/${encodeURIComponent(String(eventId))}`, query, undefined);
}

/**
 * Delete a review reply
 * Removes the business owner reply from a Google Business review. The review itself remains.
 * DELETE /v1/accounts/{accountId}/gmb-reviews/{reviewId}/reply
 */
export function deleteGoogleBusinessReviewReply(accountId: string, reviewId: string) {
  return zernioCall("DELETE", `/v1/accounts/${encodeURIComponent(String(accountId))}/gmb-reviews/${encodeURIComponent(String(reviewId))}/reply`, undefined, undefined);
}

/**
 * Delete comment
 * Delete a comment on a post. Supported by Facebook, Instagram, Bluesky, Reddit, YouTube, and LinkedIn. Requires accountId and commentId query parameters.
 * DELETE /v1/inbox/comments/{postId}
 */
export function deleteInboxComment(postId: string, query: { accountId: string; commentId: string }) {
  return zernioCall("DELETE", `/v1/inbox/comments/${encodeURIComponent(String(postId))}`, query, undefined);
}

/**
 * Delete review reply
 * Delete a reply to a review (Google Business only). Requires accountId in request body.
 * DELETE /v1/inbox/reviews/{reviewId}/reply
 */
export function deleteInboxReviewReply(reviewId: string, body: { accountId: string }) {
  return zernioCall("DELETE", `/v1/inbox/reviews/${encodeURIComponent(String(reviewId))}/reply`, undefined, body);
}

/**
 * Edit a Discord guild role
 * Updates a role's name, color, hoist, mentionable flag, or permission bitfield. At least one field must be supplied. Omitted fields are left unchanged. Requires the bot to hold Manage Roles, and the target role must sit below the bot's highest role. See the create-role operation for the re-invite requirement.
 * PATCH /v1/discord/guilds/{guildId}/roles/{roleId}
 */
export function editDiscordGuildRole(guildId: string, roleId: string, query: { accountId: string }, body: { name?: string; color?: number; hoist?: boolean; mentionable?: boolean; permissions?: string }) {
  return zernioCall("PATCH", `/v1/discord/guilds/${encodeURIComponent(String(guildId))}/roles/${encodeURIComponent(String(roleId))}`, query, body);
}

/**
 * Edit comment
 * Edit the body of a comment the connected account posted. Supported on Reddit only. Reddit keeps the same comment id after an edit. Reddit exposes no API to edit a post title, and a link post has no editable body. To edit a published post's body, use `POST /v1/posts/{postId}/edit`.
 * PATCH /v1/inbox/comments/{postId}/{commentId}
 */
export function editInboxComment(postId: string, commentId: string, body: { accountId: string; platform: "reddit"; content: string }) {
  return zernioCall("PATCH", `/v1/inbox/comments/${encodeURIComponent(String(postId))}/${encodeURIComponent(String(commentId))}`, undefined, body);
}

/**
 * Follow a user
 * Follow a user on X/Twitter. Requires the follows.write OAuth scope. For protected accounts, a follow request is sent instead (pending_follow will be true).
 * POST /v1/twitter/follow
 */
export function followUser(body: { accountId: string; targetUserId: string }) {
  return zernioCall("POST", "/v1/twitter/follow", undefined, body);
}

/**
 * List comments on an ad
 * Returns comments on an ad's underlying creative post. Useful for moderating or analyzing engagement on dark posts (ad creatives that never went live organically), which the regular GET /v1/inbox/comments/{postId} endpoint cannot serve because dark posts are not in Zernio's post database. An ad that runs on both Facebook feed and Instagram feed has two separate underlying posts with separate comment threads (the creative's effective_object_story_id and effective_instagram_media_id). Use the `placement` query param to pick one; with no param the Instagram side is returned when it exists, otherw…
 * GET /v1/ads/{adId}/comments
 * Platforms: meta
 */
export function getAdComments(adId: string, query?: { placement?: "facebook" | "instagram"; limit?: number; cursor?: string }) {
  return zernioCall("GET", `/v1/ads/${encodeURIComponent(String(adId))}/comments`, query, undefined);
}

/**
 * Get a Discord scheduled event
 * GET /v1/discord/guilds/{guildId}/events/{eventId}
 */
export function getDiscordScheduledEvent(guildId: string, eventId: string, query: { accountId: string }) {
  return zernioCall("GET", `/v1/discord/guilds/${encodeURIComponent(String(guildId))}/events/${encodeURIComponent(String(eventId))}`, query, undefined);
}

/**
 * Get a review
 * Returns one Google Business review, in the same shape as the entries of GET /v1/accounts/{accountId}/gmb-reviews. The review is read from the account's selected location unless locationId overrides it, and Google returns 404 for a review id that belongs to another location. Read the review before replying if a human may have answered it already: replies are overwritten in place and Google keeps no history.
 * GET /v1/accounts/{accountId}/gmb-reviews/{reviewId}
 */
export function getGoogleBusinessReview(accountId: string, reviewId: string, query?: { locationId?: string }) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/gmb-reviews/${encodeURIComponent(String(reviewId))}`, query, undefined);
}

/**
 * Get reviews
 * Returns reviews for a GBP account including ratings, comments, and owner replies. Use nextPageToken for pagination.
 * GET /v1/accounts/{accountId}/gmb-reviews
 */
export function getGoogleBusinessReviews(accountId: string, query?: { locationId?: string; pageSize?: number; pageToken?: string }) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/gmb-reviews`, query, undefined);
}

/**
 * Get post comments
 * Fetch comments for a specific post. Requires accountId query parameter. On Facebook and Instagram, passing a COMMENT id as `postId` is also supported and returns that comment's replies instead of the post's top-level comments. This is not available on YouTube, where `postId` must be a video id. Responses are cached for up to 10 minutes, so a page may lag new comments by that window. Do not poll this endpoint for real-time updates: subscribe to the `comment.received` webhook, which delivers new comments as they arrive. Your own writes (creating, replying to, or deleting a comment) refresh the …
 * GET /v1/inbox/comments/{postId}
 */
export function getInboxPostComments(postId: string, query: { accountId: string; subreddit?: string; limit?: number; cursor?: string; commentId?: string }) {
  return zernioCall("GET", `/v1/inbox/comments/${encodeURIComponent(String(postId))}`, query, undefined);
}

/**
 * Get subreddit feed
 * Fetch posts from a subreddit feed. Supports sorting, time filtering, and cursor-based pagination.
 * GET /v1/reddit/feed
 */
export function getRedditFeed(query: { accountId: string; subreddit?: string; sort?: "hot" | "new" | "top" | "rising"; limit?: number; after?: string; t?: "hour" | "day" | "week" | "month" | "year" | "all" }) {
  return zernioCall("GET", "/v1/reddit/feed", query, undefined);
}

/**
 * Look up a tweet
 * Resolve a single tweet by ID or URL into its text, author and public metrics. Use this to render a post you are referencing, e.g. the tweet quoted by a quote-style post. Unlike `/v1/twitter/search` this is not limited to the last 7 days and works for any tweet visible to the connected account. Billed as an X posts read ($0.005). Repeat lookups of the same tweet within the same UTC day are charged once.
 * GET /v1/twitter/tweet
 */
export function getTweet(query: { accountId: string; id: string }) {
  return zernioCall("GET", "/v1/twitter/tweet", query, undefined);
}

/**
 * Hide comment
 * Hide a comment on a post. Supported by Facebook, Instagram, Threads, and X/Twitter. Hidden comments are only visible to the commenter and page admin. For X/Twitter, the reply must belong to a conversation started by the authenticated user.
 * POST /v1/inbox/comments/{postId}/{commentId}/hide
 */
export function hideInboxComment(postId: string, commentId: string, body: { accountId: string }) {
  return zernioCall("POST", `/v1/inbox/comments/${encodeURIComponent(String(postId))}/${encodeURIComponent(String(commentId))}/hide`, undefined, body);
}

/**
 * Like comment
 * Like or upvote a comment on a post. Supported platforms: Facebook, Twitter/X, Bluesky, Reddit, LinkedIn, and Instagram in limited release (see below). For Bluesky, the cid (content identifier) is required in the request body. For LinkedIn, pass the composite comment URN returned by the comments endpoints as commentId; an optional reactionType picks the reaction (defaults to LIKE), and accounts connected before the social-feed scopes were requested get a 403 with code `linkedin_reconnect_required`. Instagram is in LIMITED RELEASE and not generally available: the call needs `instagram_manage_en…
 * POST /v1/inbox/comments/{postId}/{commentId}/like
 */
export function likeInboxComment(postId: string, commentId: string, body: { accountId: string; reactionType?: "LIKE" | "PRAISE" | "EMPATHY" | "INTEREST" | "APPRECIATION" | "ENTERTAINMENT"; cid?: string }) {
  return zernioCall("POST", `/v1/inbox/comments/${encodeURIComponent(String(postId))}/${encodeURIComponent(String(commentId))}/like`, undefined, body);
}

/**
 * List Discord guild roles
 * Returns all roles in a Discord guild. Useful for building role-mention pickers, role-permission UIs, or finding the role ID before calling the role-assign endpoint. Roles are returned unordered — sort client-side by `position` if you need Discord's UI ordering. Caller must pass `accountId` of a Discord SocialAccount bound to this guild (route verifies team access + guild match).
 * GET /v1/discord/guilds/{guildId}/roles
 */
export function listDiscordGuildRoles(guildId: string, query: { accountId: string }) {
  return zernioCall("GET", `/v1/discord/guilds/${encodeURIComponent(String(guildId))}/roles`, query, undefined);
}

/**
 * List pinned messages
 * Returns the channel's pinned messages, sorted most-recently-pinned first. Discord caps a channel at 50 pinned messages and returns the full list unpaginated. Bot needs READ_MESSAGE_HISTORY in the channel (granted by default BOT_PERMISSIONS).
 * GET /v1/discord/channels/{channelId}/pins
 */
export function listDiscordPinnedMessages(channelId: string, query: { accountId: string }) {
  return zernioCall("GET", `/v1/discord/channels/${encodeURIComponent(String(channelId))}/pins`, query, undefined);
}

/**
 * List Discord scheduled events
 * Return all scheduled events in the guild. Events are distinct from messages — they appear in the server's Events panel and Discord auto-notifies interested members ahead of start time. Pass `withUserCount=true` to include `user_count` (number of members who RSVP'd) on each event. Useful for surfacing engagement.
 * GET /v1/discord/guilds/{guildId}/events
 */
export function listDiscordScheduledEvents(guildId: string, query: { accountId: string; withUserCount?: boolean }) {
  return zernioCall("GET", `/v1/discord/guilds/${encodeURIComponent(String(guildId))}/events`, query, undefined);
}

/**
 * List commented posts
 * Returns posts with comment counts from all connected accounts. Aggregates data across multiple accounts. Responses are cached for up to 10 minutes, so the feed may lag new comments by that window. Do not poll this endpoint for real-time updates: subscribe to the `comment.received` webhook, which fires for every new comment across your posts and carries the post reference needed to keep this list current. For users with the Ads add-on (Metronome plans always qualify), the user's Meta ads (boosted/dark posts) are included too. There's one row per (ad, placement-with-comments): an ad that runs o…
 * GET /v1/inbox/comments
 */
export function listInboxComments(query?: { profileId?: string; platform?: "facebook" | "instagram" | "twitter" | "bluesky" | "threads" | "youtube" | "linkedin" | "reddit" | "metaads"; minComments?: number; since?: string; sortBy?: "date" | "comments"; sortOrder?: "asc" | "desc"; limit?: number; cursor?: string; accountId?: string }) {
  return zernioCall("GET", "/v1/inbox/comments", query, undefined);
}

/**
 * List mentions
 * Returns mentions of your connected organization accounts, delivered via platform webhooks. Currently supports LinkedIn organization mentions. Requires Inbox addon.
 * GET /v1/inbox/mentions
 */
export function listInboxMentions(query?: { accountId?: string; profileId?: string; sortOrder?: "asc" | "desc"; limit?: number; cursor?: string }) {
  return zernioCall("GET", "/v1/inbox/mentions", query, undefined);
}

/**
 * List reviews
 * Fetch reviews from all connected Facebook Pages and Google Business accounts. Aggregates data with filtering and sorting options. Supported platforms: Facebook, Google Business.
 * GET /v1/inbox/reviews
 */
export function listInboxReviews(query?: { profileId?: string; platform?: "facebook" | "googlebusiness"; minRating?: number; maxRating?: number; hasReply?: boolean; sortBy?: "date" | "rating"; sortOrder?: "asc" | "desc"; limit?: number; cursor?: string; accountId?: string }) {
  return zernioCall("GET", "/v1/inbox/reviews", query, undefined);
}

/**
 * Pin a Discord message
 * Pin a specific message in a channel. Path shape mirrors Discord's own API (`PUT /channels/{cid}/pins/{mid}`). Idempotent — re-pinning an already-pinned message is a 204 no-op. Constraints: - Bot needs MANAGE_MESSAGES in the channel. - 50-pin cap per channel — hitting it returns 400 (Discord-side). Caller should unpin one first.
 * PUT /v1/discord/channels/{channelId}/pins/{messageId}
 */
export function pinDiscordMessage(channelId: string, messageId: string, query: { accountId: string }) {
  return zernioCall("PUT", `/v1/discord/channels/${encodeURIComponent(String(channelId))}/pins/${encodeURIComponent(String(messageId))}`, query, undefined);
}

/**
 * Remove bookmark
 * Remove a bookmark from a tweet.
 * DELETE /v1/twitter/bookmark
 */
export function removeBookmark(query: { accountId: string; tweetId: string }) {
  return zernioCall("DELETE", "/v1/twitter/bookmark", query, undefined);
}

/**
 * Reply to a review
 * Posts (or updates) the business owner reply to a Google Business review. The reply is associated with the account's currently selected location (set via /v1/accounts/{accountId}/gmb-locations). Calling this endpoint a second time on the same review overwrites the previous reply (PUT semantics on Google's side). Google keeps no history, so an automated retry silently replaces a reply someone edited by hand in the Google Business Profile UI. Read the review before retrying if a human may have answered it.
 * POST /v1/accounts/{accountId}/gmb-reviews/{reviewId}/reply
 */
export function replyToGoogleBusinessReview(accountId: string, reviewId: string, body: { comment: string }) {
  return zernioCall("POST", `/v1/accounts/${encodeURIComponent(String(accountId))}/gmb-reviews/${encodeURIComponent(String(reviewId))}/reply`, undefined, body);
}

/**
 * Reply to comment
 * Post a reply to a post or specific comment. Requires accountId in request body. **Idempotency:** send an `Idempotency-Key` header to make retries safe (e.g. after a client-side timeout where delivery is unknown): same key + same body replays the original response (with `Idempotent-Replayed: true`) instead of posting the comment a second time; same key + different body returns 422; a key still in flight returns 409. Keys are retained for 24 hours and are scoped to the credential and to this exact path, so reusing a key against a different postId returns 422 rather than replaying the other post…
 * POST /v1/inbox/comments/{postId}
 */
export function replyToInboxPost(postId: string, body: { accountId: string; message: string; attachmentUrl?: string; commentId?: string; parentCid?: string; rootUri?: string; rootCid?: string }) {
  return zernioCall("POST", `/v1/inbox/comments/${encodeURIComponent(String(postId))}`, undefined, body);
}

/**
 * Reply to review
 * Post a reply to a review. Requires accountId in request body. **Idempotency:** send an `Idempotency-Key` header to make retries safe (e.g. after a client-side timeout where delivery is unknown): same key + same body replays the original response (with `Idempotent-Replayed: true`) instead of sending the reply to the platform again; same key + different body returns 422; a key still in flight returns 409. Keys are retained for 24 hours and are scoped to the credential and to this exact path, so reusing a key against a different reviewId returns 422 rather than replaying the other review's respo…
 * POST /v1/inbox/reviews/{reviewId}/reply
 */
export function replyToInboxReview(reviewId: string, body: { accountId: string; message: string }) {
  return zernioCall("POST", `/v1/inbox/reviews/${encodeURIComponent(String(reviewId))}/reply`, undefined, body);
}

/**
 * Reply to a mention
 * Reply to a mention of the connected account. Supported on Instagram only. Two shapes, selected by whether `commentId` is present: - **Comment mention** (someone @mentioned the account inside a comment): pass both `mediaId` and `commentId`. Instagram posts a reply under that comment. - **Caption mention** (someone @mentioned the account in their media caption, so no comment exists): pass `mediaId` only. Instagram posts a comment on their media. Story mentions are not supported by Instagram's API. Note that `GET /v1/inbox/mentions` currently returns LinkedIn mentions only and does not surface I…
 * POST /v1/inbox/mentions/reply
 */
export function replyToMention(body: { accountId: string; mediaId: string; commentId?: string; message: string }) {
  return zernioCall("POST", "/v1/inbox/mentions/reply", undefined, body);
}

/**
 * Retweet a post
 * Retweet (repost) a tweet by ID. Rate limit: 50 requests per 15-min window. Shares the 300/3hr creation limit with tweet creation.
 * POST /v1/twitter/retweet
 */
export function retweetPost(body: { accountId: string; tweetId: string }) {
  return zernioCall("POST", "/v1/twitter/retweet", undefined, body);
}

/**
 * Search posts
 * Search Reddit posts using a connected account. Optionally scope to a specific subreddit.
 * GET /v1/reddit/search
 */
export function searchReddit(query: { accountId: string; subreddit?: string; q: string; restrict_sr?: "0" | "1"; sort?: "relevance" | "hot" | "top" | "new" | "comments"; limit?: number; after?: string }) {
  return zernioCall("GET", "/v1/reddit/search", query, undefined);
}

/**
 * Search recent tweets
 * Search public tweets from the last 7 days matching an X search query, e.g. to discover tweets to reply to. The query string is passed through to X unchanged and supports X's search operators (`from:user`, `-is:retweet`, `is:reply`, `lang:en`, `"exact phrase"`, `conversation_id:123`, boolean `OR`, ...). Note that standalone operators like `is:` / `has:` / `lang:` must be combined with a keyword or `from:` clause. To reply to a found tweet, pass its `id` as the twitter platform entry's `platformSpecificData.replyToTweetId` when creating a post. Rate limit: 300 requests per 15-min window per con…
 * GET /v1/twitter/search
 */
export function searchTweets(query: { accountId: string; query: string; limit?: number; sinceId?: string; untilId?: string; startTime?: string; endTime?: string; cursor?: string; sortOrder?: "recency" | "relevancy" }) {
  return zernioCall("GET", "/v1/twitter/search", query, undefined);
}

/**
 * Set comment moderation status
 * Set a comment's moderation status. Supported on YouTube only. Use this to work a moderation queue: approve a held comment (`published`), reject it (`rejected`), or send it back for review (`heldForReview`). The request must be authorized by the owner of the channel or video the comment belongs to. You cannot moderate comments on videos you do not own. This is distinct from `POST /v1/inbox/comments/{postId}/{commentId}/hide`, which covers Facebook, Instagram, Threads, and X/Twitter and does not apply to YouTube.
 * POST /v1/inbox/comments/{postId}/{commentId}/moderation
 */
export function setCommentModeration(postId: string, commentId: string, body: { accountId: string; platform: "youtube"; moderationStatus: "published" | "rejected" | "heldForReview"; banAuthor?: boolean }) {
  return zernioCall("POST", `/v1/inbox/comments/${encodeURIComponent(String(postId))}/${encodeURIComponent(String(commentId))}/moderation`, undefined, body);
}

/**
 * Undo retweet
 * Undo a retweet (un-repost a tweet).
 * DELETE /v1/twitter/retweet
 */
export function undoRetweet(query: { accountId: string; tweetId: string }) {
  return zernioCall("DELETE", "/v1/twitter/retweet", query, undefined);
}

/**
 * Unfollow a user
 * Unfollow a user on X/Twitter.
 * DELETE /v1/twitter/follow
 */
export function unfollowUser(query: { accountId: string; targetUserId: string }) {
  return zernioCall("DELETE", "/v1/twitter/follow", query, undefined);
}

/**
 * Unhide comment
 * Unhide a previously hidden comment. Supported by Facebook, Instagram, Threads, and X/Twitter.
 * DELETE /v1/inbox/comments/{postId}/{commentId}/hide
 */
export function unhideInboxComment(postId: string, commentId: string, query: { accountId: string }) {
  return zernioCall("DELETE", `/v1/inbox/comments/${encodeURIComponent(String(postId))}/${encodeURIComponent(String(commentId))}/hide`, query, undefined);
}

/**
 * Unlike comment
 * Remove a like from a comment. Supported platforms: Facebook, Twitter/X, Bluesky, Reddit, LinkedIn, and Instagram in limited release. For Bluesky, the likeUri query parameter is required. Instagram has the same limited release, Facebook Login, `instagram_manage_engagement` and burst-limit constraints as liking.
 * DELETE /v1/inbox/comments/{postId}/{commentId}/like
 */
export function unlikeInboxComment(postId: string, commentId: string, query: { accountId: string; likeUri?: string }) {
  return zernioCall("DELETE", `/v1/inbox/comments/${encodeURIComponent(String(postId))}/${encodeURIComponent(String(commentId))}/like`, query, undefined);
}

/**
 * Unpin a Discord message
 * Unpin a message. Same MANAGE_MESSAGES permission requirement as pin. Idempotent — unpinning a non-pinned message is a 204 no-op.
 * DELETE /v1/discord/channels/{channelId}/pins/{messageId}
 */
export function unpinDiscordMessage(channelId: string, messageId: string, query: { accountId: string }) {
  return zernioCall("DELETE", `/v1/discord/channels/${encodeURIComponent(String(channelId))}/pins/${encodeURIComponent(String(messageId))}`, query, undefined);
}

/**
 * Update a Discord scheduled event
 * Patch any subset of fields. Passing `status: 'cancelled'` is how you cancel an event — Discord doesn't have a dedicated cancel endpoint, it's a status transition. Most status transitions Discord enforces (you can't go SCHEDULED → COMPLETED directly). The common consumer case is SCHEDULED → CANCELED.
 * PATCH /v1/discord/guilds/{guildId}/events/{eventId}
 */
export function updateDiscordScheduledEvent(guildId: string, eventId: string, body: { accountId: string; name?: string; description?: string; startsAt?: string; endsAt?: string; location?: string; status?: "scheduled" | "active" | "completed" | "cancelled"; imageDataUri?: string }) {
  return zernioCall("PATCH", `/v1/discord/guilds/${encodeURIComponent(String(guildId))}/events/${encodeURIComponent(String(eventId))}`, undefined, body);
}

/**
 * Vote on a Reddit post or comment
 * Cast, change, or clear the connected account's vote on a Reddit post or comment. **Reddit requires that votes be cast by humans.** Reddit's API terms permit a client to proxy a human's action one-for-one, and prohibit a bot from deciding how to vote or from amplifying a human's vote. Call this endpoint only in direct response to an explicit action by the account owner. Automated or agent-decided voting is vote manipulation and puts API access at risk.
 * POST /v1/accounts/{accountId}/reddit-vote
 */
export function voteRedditThing(accountId: string, body: { thingId: string; direction: 1 | 0 | -1 }) {
  return zernioCall("POST", `/v1/accounts/${encodeURIComponent(String(accountId))}/reddit-vote`, undefined, body);
}


/* ======================================================================
 * messages — 82 operations
 * ====================================================================== */

/**
 * Activate sequence
 * Start a draft or paused sequence. The sequence must have at least one step.
 * POST /v1/sequences/{sequenceId}/activate
 */
export function activateSequence(sequenceId: string) {
  return zernioCall("POST", `/v1/sequences/${encodeURIComponent(String(sequenceId))}/activate`, undefined, undefined);
}

/**
 * Add recipients to a broadcast
 * Add recipients by contact IDs, raw phone numbers, or from the broadcast's segment filters.
 * POST /v1/broadcasts/{broadcastId}/recipients
 */
export function addBroadcastRecipients(broadcastId: string, body: { contactIds?: string[]; phones?: string[]; useSegment?: boolean }) {
  return zernioCall("POST", `/v1/broadcasts/${encodeURIComponent(String(broadcastId))}/recipients`, undefined, body);
}

/**
 * Add reaction
 * Add an emoji reaction to a message. Platform support: - Telegram: Supports a subset of Unicode emoji reactions - WhatsApp: Supports any standard emoji (one reaction per message per sender) - Instagram and Facebook Messenger: Any standard emoji, subject to Meta's 24h messaging window - Slack: The emoji must have a Slack name (e.g. `:thumbsup:`); unnamed characters return 400 - All others: Returns 400 (not supported)
 * POST /v1/inbox/conversations/{conversationId}/messages/{messageId}/reactions
 */
export function addMessageReaction(conversationId: string, messageId: string, body: { accountId: string; emoji: string }) {
  return zernioCall("POST", `/v1/inbox/conversations/${encodeURIComponent(String(conversationId))}/messages/${encodeURIComponent(String(messageId))}/reactions`, undefined, body);
}

/**
 * Add participants
 * Add participants to a WhatsApp group. Maximum 8 participants per request. Not available on [Coexistence](/platforms/whatsapp/connection#whatsapp-business-app-coexistence) numbers. Requires a Cloud API-only number.
 * POST /v1/whatsapp/wa-groups/{groupId}/participants
 */
export function addWhatsAppGroupParticipants(groupId: string, query: { accountId: string }, body: { phoneNumbers: string[] }) {
  return zernioCall("POST", `/v1/whatsapp/wa-groups/${encodeURIComponent(String(groupId))}/participants`, query, body);
}

/**
 * Approve join requests
 * Approve pending join requests for a WhatsApp group. Not available on [Coexistence](/platforms/whatsapp/connection#whatsapp-business-app-coexistence) numbers. Requires a Cloud API-only number.
 * POST /v1/whatsapp/wa-groups/{groupId}/join-requests
 */
export function approveWhatsAppGroupJoinRequests(groupId: string, query: { accountId: string }, body: { phoneNumbers: string[] }) {
  return zernioCall("POST", `/v1/whatsapp/wa-groups/${encodeURIComponent(String(groupId))}/join-requests`, query, body);
}

/**
 * Cancel broadcast
 * Cancel a scheduled or in-progress broadcast. Already-sent messages are not affected.
 * POST /v1/broadcasts/{broadcastId}/cancel
 */
export function cancelBroadcast(broadcastId: string) {
  return zernioCall("POST", `/v1/broadcasts/${encodeURIComponent(String(broadcastId))}/cancel`, undefined, undefined);
}

/**
 * Create broadcast draft
 * Create a broadcast in draft status. Add recipients and then send or schedule it.
 * POST /v1/broadcasts
 */
export function createBroadcast(body: { profileId: string; accountId: string; platform: "instagram" | "facebook" | "telegram" | "twitter" | "bluesky" | "reddit" | "whatsapp"; name: string; description?: string; message?: { text?: string; attachments?: { type?: string; url?: string; filename?: string }[] }; template?: { name?: string; language?: string; components?: Record<string, unknown>[]; variableMapping?: Record<string, unknown> }; segmentFilters?: { tags?: string[]; isSubscribed?: boolean } }) {
  return zernioCall("POST", "/v1/broadcasts", undefined, body);
}

/**
 * Create comment-to-DM automation
 * Create a keyword-triggered DM automation on an Instagram or Facebook account. When someone comments a matching keyword (or, with `trigger: story_reply`, replies to your Instagram story with one), they automatically receive a DM. Triggers (`trigger`): * `comment` (default): fires on keyword comments on a post or reel. * `story_reply`: fires when someone replies to your Instagram story with a keyword, and answers them with a DM. Set `platformPostId` to a story media id to scope to one story, or omit it to match replies to any story. Targeting (comment trigger): * Per-post: set `platformPostId` …
 * POST /v1/comment-automations
 */
export function createCommentAutomation(body: { profileId: string; accountId: string; trigger?: "comment" | "story_reply"; platformPostId?: string; postId?: string; postTitle?: string; name: string; keywords?: string[]; matchMode?: "exact" | "contains" | "word"; excludeKeywords?: string[]; typoTolerance?: boolean; dmMessage: string; buttons?: unknown[]; template?: unknown; commentReply?: string; dmMessageVariations?: string[]; commentReplyVariations?: string[]; linkTracking?: boolean; clickTag?: string; dmDelaySeconds?: number; commentReplyDelaySeconds?: number; alsoMatchInDms?: boolean; audience?: unknown; followGate?: unknown }) {
  return zernioCall("POST", "/v1/comment-automations", undefined, body);
}

/**
 * Create conversation
 * Initiate a new direct message conversation with a specified user. If a conversation already exists with the recipient, the message is added to the existing thread. Supported platforms: X/Twitter, Bluesky, Reddit, WhatsApp, SMS, and Slack. Other platforms return PLATFORM_NOT_SUPPORTED. Slack: pass a workspace member id as participantId (list them with GET /v1/accounts/{accountId}/slack-members). Zernio opens the DM channel with that member and sends the message; the thread then behaves like any other Slack conversation in the inbox. The member must belong to the connected workspace. WhatsApp: …
 * POST /v1/inbox/conversations
 */
export function createInboxConversation(body: FormData) {
  return zernioCall("POST", "/v1/inbox/conversations", undefined, body);
}

/**
 * Create sequence
 * Create a multi-step messaging sequence. Each step has a delay and a message or WhatsApp template.
 * POST /v1/sequences
 */
export function createSequence(body: { profileId: string; accountId: string; platform: "instagram" | "facebook" | "telegram" | "twitter" | "bluesky" | "reddit" | "whatsapp"; name: string; description?: string; steps?: { order: number; delayMinutes: number; message?: { text?: string }; template?: { name?: string; language?: string; variableMapping?: Record<string, unknown> } }[]; exitOnReply?: boolean; exitOnUnsubscribe?: boolean }) {
  return zernioCall("POST", "/v1/sequences", undefined, body);
}

/**
 * Place an outbound phone call
 * Dials `to` FROM one of your voice-enabled numbers and, on answer, bridges the callee to the number's stored forward destination, or to the per-call `forwardTo` override. Destinations can be your own AI voice agent (Vapi/Retell), a phone, or a SIP endpoint. An optional `greeting` is spoken to the callee before the bridge. The 200 response means the call is dialing; the lifecycle continues asynchronously (track it via `GET /v1/voice/calls/{id}` or the `call.*` webhooks). Outbound calls are capped per rolling hour (429 when hit). **Idempotency:** send an `Idempotency-Key` header to make retries …
 * POST /v1/voice/calls
 */
export function createVoiceCall(body: { to: string; fromNumber?: string; forwardTo?: string; greeting?: string; recordOverride?: boolean; transcribeOverride?: boolean; transcriptionLanguage?: "auto" | "en" | "es"; amd?: boolean; voicemailDropMessage?: string }) {
  return zernioCall("POST", "/v1/voice/calls", undefined, body);
}

/**
 * Mint a browser softphone session
 * Step 1 of the two-step browser softphone handshake. Mints a WebRTC session (token + credential) the browser registers with the `@telnyx/webrtc` SDK. Once registered, call `POST /v1/voice/calls/web/dial` with the returned `credentialId` to place the call. The split avoids bridging to a browser that has not finished registering. The token lives ~1 hour (it must outlive the whole call, not just the handshake).
 * POST /v1/voice/calls/web
 */
export function createVoiceWebSession() {
  return zernioCall("POST", "/v1/voice/calls/web", undefined, undefined);
}

/**
 * Create group
 * Create a new WhatsApp group chat. Returns the group ID and optionally an invite link. Not available on [Coexistence](/platforms/whatsapp/connection#whatsapp-business-app-coexistence) numbers. Requires a Cloud API-only number.
 * POST /v1/whatsapp/wa-groups
 */
export function createWhatsAppGroupChat(body: { accountId: string; subject: string; description?: string; joinApprovalMode?: "approval_required" | "auto_approve" }) {
  return zernioCall("POST", "/v1/whatsapp/wa-groups", undefined, body);
}

/**
 * Create invite link
 * Create a new invite link for a WhatsApp group. The previous link is revoked. Not available on [Coexistence](/platforms/whatsapp/connection#whatsapp-business-app-coexistence) numbers. Requires a Cloud API-only number.
 * POST /v1/whatsapp/wa-groups/{groupId}/invite-link
 */
export function createWhatsAppGroupInviteLink(groupId: string, query: { accountId: string }) {
  return zernioCall("POST", `/v1/whatsapp/wa-groups/${encodeURIComponent(String(groupId))}/invite-link`, query, undefined);
}

/**
 * Start a sandbox activation
 * Creates (or refreshes) a pending sandbox session for the given phone and immediately fires the verified sandbox template from the shared sandbox number to that phone. The session activates when the phone owner replies to that WhatsApp message — the reply itself is proof of ownership. One phone per user: if the caller already has a non-expired session for a DIFFERENT phone, the request is rejected with `invalid_field_value` (the message names the existing phone so it can be revoked first). Re-creating a session for the SAME phone is idempotent and refreshes the verification template. If Meta r…
 * POST /v1/whatsapp/sandbox/sessions
 */
export function createWhatsAppSandboxSession(body: { phone: string }) {
  return zernioCall("POST", "/v1/whatsapp/sandbox/sessions", undefined, body);
}

/**
 * Delete broadcast
 * Permanently delete a broadcast. Only drafts can be deleted.
 * DELETE /v1/broadcasts/{broadcastId}
 */
export function deleteBroadcast(broadcastId: string) {
  return zernioCall("DELETE", `/v1/broadcasts/${encodeURIComponent(String(broadcastId))}`, undefined, undefined);
}

/**
 * Delete automation
 * Permanently delete an automation and all its trigger logs.
 * DELETE /v1/comment-automations/{automationId}
 */
export function deleteCommentAutomation(automationId: string) {
  return zernioCall("DELETE", `/v1/comment-automations/${encodeURIComponent(String(automationId))}`, undefined, undefined);
}

/**
 * Delete message
 * Delete a message from a conversation. Platform support varies: - Telegram: Full delete (bot's own messages anytime, others if admin) - X/Twitter: Full delete (own DM events only) - Bluesky: Delete for self only (recipient still sees it) - Reddit: Delete from sender's view only - Facebook, Instagram, WhatsApp: Not supported (returns 400)
 * DELETE /v1/inbox/conversations/{conversationId}/messages/{messageId}
 */
export function deleteInboxMessage(conversationId: string, messageId: string, query: { accountId: string }) {
  return zernioCall("DELETE", `/v1/inbox/conversations/${encodeURIComponent(String(conversationId))}/messages/${encodeURIComponent(String(messageId))}`, query, undefined);
}

/**
 * Delete sequence
 * Permanently delete a sequence. Active enrollments are stopped.
 * DELETE /v1/sequences/{sequenceId}
 */
export function deleteSequence(sequenceId: string) {
  return zernioCall("DELETE", `/v1/sequences/${encodeURIComponent(String(sequenceId))}`, undefined, undefined);
}

/**
 * Delete group
 * Delete a WhatsApp group and remove all participants. Not available on [Coexistence](/platforms/whatsapp/connection#whatsapp-business-app-coexistence) numbers. Requires a Cloud API-only number.
 * DELETE /v1/whatsapp/wa-groups/{groupId}
 */
export function deleteWhatsAppGroupChat(groupId: string, query: { accountId: string }) {
  return zernioCall("DELETE", `/v1/whatsapp/wa-groups/${encodeURIComponent(String(groupId))}`, query, undefined);
}

/**
 * Revoke a sandbox session
 * Hard-deletes the session. The user loses the ability to send to that phone via the sandbox until they re-activate it. Existing conversations and messages already exchanged with that phone are untouched — revocation only blocks FUTURE sends. Sessions belonging to other users cannot be revoked; the response is the same 400 as "session not found" so existence isn't leaked.
 * DELETE /v1/whatsapp/sandbox/sessions/{sessionId}
 */
export function deleteWhatsAppSandboxSession(sessionId: string) {
  return zernioCall("DELETE", `/v1/whatsapp/sandbox/sessions/${encodeURIComponent(String(sessionId))}`, undefined, undefined);
}

/**
 * Dial from the browser softphone
 * Step 2 of the browser softphone handshake: places an outbound call whose answered leg is bridged to the browser registered with the credential from `POST /v1/voice/calls/web`. The call runs through the normal outbound lane, so it is logged as outbound (from = your number, to = target) and recorded per the number's settings.
 * POST /v1/voice/calls/web/dial
 */
export function dialVoiceWebCall(body: { to: string; credentialId: string; fromNumber?: string; recordOverride?: boolean }) {
  return zernioCall("POST", "/v1/voice/calls/web/dial", undefined, body);
}

/**
 * Edit message
 * Edit the text and/or reply markup of a previously sent Telegram message. Only supported for Telegram. Returns 400 for other platforms.
 * PATCH /v1/inbox/conversations/{conversationId}/messages/{messageId}
 */
export function editInboxMessage(conversationId: string, messageId: string, body: { accountId: string; text?: string; replyMarkup?: { type?: "inline_keyboard"; keyboard?: { text?: unknown; callbackData?: unknown; url?: unknown }[][] } }) {
  return zernioCall("PATCH", `/v1/inbox/conversations/${encodeURIComponent(String(conversationId))}/messages/${encodeURIComponent(String(messageId))}`, undefined, body);
}

/**
 * Hang up a live call
 * Hangs up a live call on demand. Idempotent: ending a call that already ended (or never connected) returns success with the call's current status. Final duration/cost are written asynchronously when the hangup event lands, so the call doc may briefly still show its prior status.
 * POST /v1/voice/calls/{id}/end
 */
export function endVoiceCall(id: string) {
  return zernioCall("POST", `/v1/voice/calls/${encodeURIComponent(String(id))}/end`, undefined, undefined);
}

/**
 * Enroll contacts in a sequence
 * Enroll one or more contacts into a sequence. Contacts already enrolled are skipped.
 * POST /v1/sequences/{sequenceId}/enroll
 */
export function enrollContacts(sequenceId: string, body: { contactIds: string[]; channelIds?: string[] }) {
  return zernioCall("POST", `/v1/sequences/${encodeURIComponent(String(sequenceId))}/enroll`, undefined, body);
}

/**
 * Get broadcast details
 * Returns a broadcast with its full configuration and delivery stats.
 * GET /v1/broadcasts/{broadcastId}
 */
export function getBroadcast(broadcastId: string) {
  return zernioCall("GET", `/v1/broadcasts/${encodeURIComponent(String(broadcastId))}`, undefined, undefined);
}

/**
 * Get a call (any channel)
 * Channel-agnostic call detail: works for both WhatsApp and regular phone (PSTN) calls, so any row from `GET /v1/calls` can be opened without branching on `channel`. Returns the full call including transcript segments, with `contactId`/`contactName` set when the counterparty matches a CRM contact.
 * GET /v1/calls/{id}
 */
export function getCall(id: string) {
  return zernioCall("GET", `/v1/calls/${encodeURIComponent(String(id))}`, undefined, undefined);
}

/**
 * Get a call recording
 * Channel-agnostic recording fetch: resolves a fresh, playable MP3 URL for any call regardless of channel (provider-signed URLs expire ~10 minutes after signing, so this re-signs on demand). Default responds `302 Found` redirecting to the fresh URL; pass `as=json` to receive `{ url }` instead.
 * GET /v1/calls/{id}/recording
 */
export function getCallRecording(id: string, query?: { as?: "json" }) {
  return zernioCall("GET", `/v1/calls/${encodeURIComponent(String(id))}/recording`, query, undefined);
}

/**
 * Get automation details
 * Returns an automation with its configuration, stats, and recent trigger logs.
 * GET /v1/comment-automations/{automationId}
 */
export function getCommentAutomation(automationId: string) {
  return zernioCall("GET", `/v1/comment-automations/${encodeURIComponent(String(automationId))}`, undefined, undefined);
}

/**
 * Get conversation
 * Retrieve details and metadata for a specific conversation. Requires accountId query parameter.
 * GET /v1/inbox/conversations/{conversationId}
 */
export function getInboxConversation(conversationId: string, query: { accountId: string }) {
  return zernioCall("GET", `/v1/inbox/conversations/${encodeURIComponent(String(conversationId))}`, query, undefined);
}

/**
 * Get conversation analytics
 * Per-conversation inbox analytics. The inbox analog of /v1/analytics/post-timeline — one conversation, daily totals, source mix. The {conversationId} path param accepts EITHER the Mongo `_id` of the Conversation document OR its `platformConversationId` (the same identity used by metadata.conversationId at ingest time). Ownership is verified in MongoDB against the caller's team before the Tinybird query fires. Max date range is 365 days.
 * GET /v1/analytics/inbox/conversations/{conversationId}
 */
export function getInboxConversationAnalytics(conversationId: string, query: { fromDate: string; toDate?: string }) {
  return zernioCall("GET", `/v1/analytics/inbox/conversations/${encodeURIComponent(String(conversationId))}`, query, undefined);
}

/**
 * List messages
 * Fetch messages for a specific conversation, with cursor-based pagination and ordering control. Pagination: pass `pagination.nextCursor` from a prior response back as the `cursor` query param to fetch the next page. The cursor is opaque; do not parse or construct it client-side. Sort order: defaults to `asc` (oldest first, chat style). For the "show me the latest messages" pattern, pass `?sortOrder=desc&limit=N`. Twitter, Instagram, Telegram, WhatsApp and Reddit honor the requested order from the local message store. For Facebook and Bluesky, the upstream APIs only return newest-first and have…
 * GET /v1/inbox/conversations/{conversationId}/messages
 */
export function getInboxConversationMessages(conversationId: string, query: { accountId: string; limit?: number; cursor?: string; sortOrder?: "asc" | "desc" }) {
  return zernioCall("GET", `/v1/inbox/conversations/${encodeURIComponent(String(conversationId))}/messages`, query, undefined);
}

/**
 * Resolve message attachment
 * Resolve one attachment on a message to a media url that works right now. Instagram and Facebook sign DM media urls per request and expire them, so the `url` on a message is a snapshot: it works when you read the message and stops working later. This endpoint checks the stored url and, when it has gone stale, re-mints the message's media from Meta and persists it before answering. The message id never expires, so this URL is the one to store — it is returned on each attachment as `refreshUrl`. By default it responds `302` to the live media url, so it can be used directly as an `<img src>` on a…
 * GET /v1/inbox/conversations/{conversationId}/messages/{messageId}/attachments/{index}
 */
export function getMessageAttachment(conversationId: string, messageId: string, index: number, query: { accountId: string; format?: "redirect" | "json" }) {
  return zernioCall("GET", `/v1/inbox/conversations/${encodeURIComponent(String(conversationId))}/messages/${encodeURIComponent(String(messageId))}/attachments/${encodeURIComponent(String(index))}`, query, undefined);
}

/**
 * Get sequence with steps
 * Returns a sequence with all its steps and enrollment stats.
 * GET /v1/sequences/{sequenceId}
 */
export function getSequence(sequenceId: string) {
  return zernioCall("GET", `/v1/sequences/${encodeURIComponent(String(sequenceId))}`, undefined, undefined);
}

/**
 * Get a phone call
 * Full call detail, including the transcript segments when transcription was on.
 * GET /v1/voice/calls/{id}
 */
export function getVoiceCall(id: string) {
  return zernioCall("GET", `/v1/voice/calls/${encodeURIComponent(String(id))}`, undefined, undefined);
}

/**
 * Estimate call cost
 * Pre-call cost estimate for a PSTN call: the carrier leg plus optional recording and transcription add-ons. Same billing formula as the post-call invoice, so the quote and the final charge can't disagree. The per-minute figure is deliberately conservative (the real cost comes from the settled carrier record after the call), so estimates trend slightly over the actual invoice. Parity endpoint of `GET /v1/whatsapp/calls/estimate`, minus the Meta line (PSTN calls have no separate Meta bill, so `totalCostUSD` equals `billableCostUSD`).
 * GET /v1/voice/calls/estimate
 */
export function getVoiceCallEstimate(query: { to: string; minutes?: number; recording?: boolean; transcription?: boolean }) {
  return zernioCall("GET", "/v1/voice/calls/estimate", query, undefined);
}

/**
 * Get a call recording
 * Resolves a fresh, playable MP3 URL for the call's recording (provider-signed URLs expire ~10 minutes after signing, so this endpoint re-signs on demand). Default responds `302 Found` redirecting to the fresh URL; pass `as=json` to receive `{ url }` instead.
 * GET /v1/voice/calls/{id}/recording
 */
export function getVoiceCallRecording(id: string, query?: { as?: "json" }) {
  return zernioCall("GET", `/v1/voice/calls/${encodeURIComponent(String(id))}/recording`, query, undefined);
}

/**
 * Get a single call
 * GET /v1/whatsapp/calls/{id}
 */
export function getWhatsAppCall(id: string, query: { accountId: string }) {
  return zernioCall("GET", `/v1/whatsapp/calls/${encodeURIComponent(String(id))}`, query, undefined);
}

/**
 * Estimate per-minute cost
 * Returns a zero-markup estimated cost for an outbound call to the given destination, broken down by Meta + Telnyx + recording line items. Costs are pass-through, no margin applied.
 * GET /v1/whatsapp/calls/estimate
 */
export function getWhatsAppCallEstimate(query: { accountId: string; to: string; minutes?: number; recording?: boolean }) {
  return zernioCall("GET", "/v1/whatsapp/calls/estimate", query, undefined);
}

/**
 * Get a call recording
 * Resolves a fresh, playable MP3 URL for the call's recording. Provider-signed recording URLs expire ~10 minutes after signing, so the `recordingUrl` stored on the call is usually stale by the time it is played; this endpoint re-signs on demand. Default responds `302 Found` redirecting to the fresh URL (point an `<audio>` element or a link straight at this endpoint); pass `as=json` to receive `{ url }` instead.
 * GET /v1/whatsapp/calls/{id}/recording
 */
export function getWhatsAppCallRecording(id: string, query: { accountId: string; as?: "json" }) {
  return zernioCall("GET", `/v1/whatsapp/calls/${encodeURIComponent(String(id))}/recording`, query, undefined);
}

/**
 * Get group info
 * Retrieve metadata about a WhatsApp group including subject, description, participants, and settings. Not available on [Coexistence](/platforms/whatsapp/connection#whatsapp-business-app-coexistence) numbers. Requires a Cloud API-only number.
 * GET /v1/whatsapp/wa-groups/{groupId}
 */
export function getWhatsAppGroupChat(groupId: string, query: { accountId: string }) {
  return zernioCall("GET", `/v1/whatsapp/wa-groups/${encodeURIComponent(String(groupId))}`, query, undefined);
}

/**
 * Download WhatsApp media
 * Streams the binary for a WhatsApp attachment. This is the endpoint the `url` on a WhatsApp `attachments[]` entry points at, in both the `message.received` webhook and the List messages response. **This is an authenticated endpoint, not a public link.** Send `Authorization: Bearer <your API key>` exactly as you would for any other call. Passing the URL straight to a browser, an LLM vision API, or a no-code "download file" step without the header returns `401`. This is the most common integration mistake on this endpoint, and it differs from Instagram, Facebook and Telegram, whose `attachments[…
 * GET /v1/whatsapp/media/{mediaId}
 */
export function getWhatsAppMedia(mediaId: string, query: { accountId: string }) {
  return zernioCall("GET", `/v1/whatsapp/media/${encodeURIComponent(String(mediaId))}`, query, undefined);
}

/**
 * Initiate outbound call
 * Initiates an outbound Business-Initiated Call. The Telnyx-side SIP leg is originated server-side (Option B: SIP-first). Telnyx INVITEs Meta directly over TLS:5061 with the SIP digest credentials we captured at calling-enablement time). No client-side SDP is required; pass only `accountId` and `to`. To send the consumer the call-consent prompt instead of placing a call, pass `action: "send_call_permission_request"` (+ optional `bodyText`). The consumer must tap Allow in WhatsApp before `start_call` is permitted; Meta limits the prompt to 1 per consumer per 24h (2 per 7 days) and requires an op…
 * POST /v1/whatsapp/calls
 */
export function initiateWhatsAppCall(body: { accountId: string; to: string; action?: "send_call_permission_request"; bodyText?: string; forwardTo?: string; recordOverride?: boolean; biz_opaque_callback_data?: string }) {
  return zernioCall("POST", "/v1/whatsapp/calls", undefined, body);
}

/**
 * List broadcast recipients
 * Returns recipients for a broadcast with individual delivery status. Filter by status.
 * GET /v1/broadcasts/{broadcastId}/recipients
 */
export function listBroadcastRecipients(broadcastId: string, query?: { status?: "pending" | "sent" | "delivered" | "read" | "failed"; limit?: number; skip?: number }) {
  return zernioCall("GET", `/v1/broadcasts/${encodeURIComponent(String(broadcastId))}/recipients`, query, undefined);
}

/**
 * List broadcasts
 * Returns broadcasts with delivery stats. Filter by status, platform, or profile.
 * GET /v1/broadcasts
 */
export function listBroadcasts(query?: { profileId?: string; status?: "draft" | "scheduled" | "sending" | "completed" | "failed" | "cancelled"; platform?: string; limit?: number; skip?: number }) {
  return zernioCall("GET", "/v1/broadcasts", query, undefined);
}

/**
 * List all calls (unified history)
 * Unified call history across ALL of your numbers: both channels (WhatsApp Business Calling + regular phone/PSTN), inbound and outbound, newest first. Unlike `GET /v1/voice/calls` (PSTN-only) and `GET /v1/whatsapp/calls` (one account at a time), this endpoint needs no `accountId` and never requires fanning out one request per number. Any row can be opened channel-agnostically via `GET /v1/calls/{id}` and `GET /v1/calls/{id}/recording`; no branching on `channel` needed. When the counterparty number matches a CRM contact, `contactId` and `contactName` are set. Cursor pagination: pass the returned…
 * GET /v1/calls
 */
export function listCalls(query?: { channel?: "whatsapp" | "pstn"; status?: "ringing" | "answered" | "ended" | "failed"; direction?: "inbound" | "outbound"; number?: string; search?: string; before?: string; limit?: number }) {
  return zernioCall("GET", "/v1/calls", query, undefined);
}

/**
 * List automation logs
 * Paginated list of every comment that triggered this automation, with send status and commenter info.
 * GET /v1/comment-automations/{automationId}/logs
 */
export function listCommentAutomationLogs(automationId: string, query?: { status?: "pending" | "sent" | "failed" | "skipped" | "gated"; limit?: number; skip?: number }) {
  return zernioCall("GET", `/v1/comment-automations/${encodeURIComponent(String(automationId))}/logs`, query, undefined);
}

/**
 * List comment-to-DM automations
 * List all comment-to-DM automations for a profile. Returns automations with their stats.
 * GET /v1/comment-automations
 */
export function listCommentAutomations(query?: { profileId?: string }) {
  return zernioCall("GET", "/v1/comment-automations", query, undefined);
}

/**
 * List conversation analytics
 * Per-conversation listing with per-row totals + first/last message timestamps. The inbox analog of GET /v1/analytics (posts listing) — same filter shape, same pagination, same sort/order semantics. Use as the entry point for the per-conversation analytics drawer at /v1/analytics/inbox/conversations/{conversationId}. Rows are enriched with the conversation's participant info (`participantName`, `participantUsername`, `participantPicture`) and last-message preview by joining the Conversation document scoped to the caller's team. Max date range is 365 days.
 * GET /v1/analytics/inbox/conversations
 */
export function listInboxConversationAnalytics(query: { fromDate: string; toDate?: string; profileId?: string; platform?: string; accountId?: string; source?: string; limit?: number; page?: number; sortBy?: "lastMessageAt" | "firstMessageAt" | "totalMessages" | "received" | "sent" | "read" | "failed"; order?: "asc" | "desc" }) {
  return zernioCall("GET", "/v1/analytics/inbox/conversations", query, undefined);
}

/**
 * List conversations
 * Fetch conversations (DMs) from all connected messaging accounts in a single API call. Supports filtering by profile and platform. Results are aggregated and deduplicated. Supported platforms: Facebook, Instagram, Twitter/X, Bluesky, Reddit, Telegram. Twitter/X limitation: X has replaced traditional DMs with encrypted "X Chat" for many accounts. Messages sent or received through encrypted X Chat are not accessible via X's API (the /2/dm_events endpoint only returns legacy unencrypted DMs). This means some Twitter/X conversations may show only outgoing messages or appear empty. This is an X pla…
 * GET /v1/inbox/conversations
 */
export function listInboxConversations(query?: { profileId?: string; platform?: "facebook" | "instagram" | "twitter" | "bluesky" | "reddit" | "telegram" | "whatsapp"; status?: "active" | "archived"; sortOrder?: "asc" | "desc"; limit?: number; cursor?: string; accountId?: string }) {
  return zernioCall("GET", "/v1/inbox/conversations", query, undefined);
}

/**
 * List enrollments for a sequence
 * Returns enrolled contacts with their progress, status, and next scheduled step.
 * GET /v1/sequences/{sequenceId}/enrollments
 */
export function listSequenceEnrollments(sequenceId: string, query?: { status?: "active" | "completed" | "exited" | "paused"; limit?: number; skip?: number }) {
  return zernioCall("GET", `/v1/sequences/${encodeURIComponent(String(sequenceId))}/enrollments`, query, undefined);
}

/**
 * List sequences
 * Returns sequences with enrollment stats. Filter by status, platform, or profile.
 * GET /v1/sequences
 */
export function listSequences(query?: { profileId?: string; status?: "draft" | "active" | "paused"; limit?: number; skip?: number }) {
  return zernioCall("GET", "/v1/sequences", query, undefined);
}

/**
 * List phone calls
 * Your PSTN voice calls (inbound + outbound), newest first. Cursor pagination: pass the returned `nextCursor` as `before` for the next page. For a history that also includes WhatsApp calls, use `GET /v1/calls`.
 * GET /v1/voice/calls
 */
export function listVoiceCalls(query?: { status?: "ringing" | "answered" | "ended" | "failed"; direction?: "inbound" | "outbound"; number?: string; before?: string; limit?: number }) {
  return zernioCall("GET", "/v1/voice/calls", query, undefined);
}

/**
 * List call history for an account
 * Compact history listing for a single connected account. Results are scoped to the resolved SocialAccount; profile-scoped team members cannot read calls on sibling accounts. Cursor pagination: pass the returned `nextCursor` as `before` to fetch the next page (same scheme as `GET /v1/calls`). `since`/`until` remain as absolute range filters and combine with the cursor.
 * GET /v1/whatsapp/calls
 */
export function listWhatsAppCalls(query: { accountId: string; status?: "ringing" | "answered" | "ended" | "failed"; direction?: "inbound" | "outbound"; since?: string; until?: string; before?: string; limit?: number }) {
  return zernioCall("GET", "/v1/whatsapp/calls", query, undefined);
}

/**
 * List flow responses
 * List the responses customers submitted when completing a flow (parsed from the nfm_reply messages received via webhook), newest first. Scope to a single flow with `flowId` — this matches responses whose flow_token carries the `<flowId>:` prefix that Zernio stamps on auto-generated tokens at send time. Responses sent with a custom integrator-supplied flow_token are not attributed to a flow.
 * GET /v1/whatsapp/flow-responses
 */
export function listWhatsAppFlowResponses(query: { accountId: string; flowId?: string; limit?: number }) {
  return zernioCall("GET", "/v1/whatsapp/flow-responses", query, undefined);
}

/**
 * List active groups
 * List active WhatsApp group chats for a business phone number. These are actual WhatsApp group conversations on the platform. Not available on [Coexistence](/platforms/whatsapp/connection#whatsapp-business-app-coexistence) numbers. Requires a Cloud API-only number.
 * GET /v1/whatsapp/wa-groups
 */
export function listWhatsAppGroupChats(query: { accountId: string; limit?: number; after?: string }) {
  return zernioCall("GET", "/v1/whatsapp/wa-groups", query, undefined);
}

/**
 * List join requests
 * List pending join requests for a WhatsApp group (only for groups with approval_required mode). Not available on [Coexistence](/platforms/whatsapp/connection#whatsapp-business-app-coexistence) numbers. Requires a Cloud API-only number.
 * GET /v1/whatsapp/wa-groups/{groupId}/join-requests
 */
export function listWhatsAppGroupJoinRequests(groupId: string, query: { accountId: string }) {
  return zernioCall("GET", `/v1/whatsapp/wa-groups/${encodeURIComponent(String(groupId))}/join-requests`, query, undefined);
}

/**
 * List your sandbox sessions
 * Returns all of the authenticated user's non-expired sandbox sessions (pending + active) plus the sandbox phone number. In practice there is at most one session per user since the sandbox is one-phone-per-user; the array shape is preserved for forward compatibility.
 * GET /v1/whatsapp/sandbox/sessions
 */
export function listWhatsAppSandboxSessions() {
  return zernioCall("GET", "/v1/whatsapp/sandbox/sessions", undefined, undefined);
}

/**
 * Get an execution's timeline
 * Returns the per-step run-log for a single workflow execution: trigger fired, each node visited, edge handles taken, errors, and durations. Backed by Tinybird (90-day retention). Used by the Runs UI drawer to render the timeline.
 * GET /v1/workflows/{workflowId}/executions/{executionId}/events
 */
export function listWorkflowExecutionEvents(workflowId: string, executionId: string) {
  return zernioCall("GET", `/v1/workflows/${encodeURIComponent(String(workflowId))}/executions/${encodeURIComponent(String(executionId))}/events`, undefined, undefined);
}

/**
 * List workflow runs
 * Returns recent executions (runs) with their status, current node, and accumulated variables.
 * GET /v1/workflows/{workflowId}/executions
 */
export function listWorkflowExecutions(workflowId: string, query?: { status?: "running" | "waiting" | "completed" | "exited" | "failed"; limit?: number; skip?: number }) {
  return zernioCall("GET", `/v1/workflows/${encodeURIComponent(String(workflowId))}/executions`, query, undefined);
}

/**
 * Mark a conversation as read
 * Marks all unread incoming messages in the conversation as read. For WhatsApp, this also sends read receipts (blue ticks) to the contact, EXCEPT on coexistence accounts (where the WhatsApp Business app on the customer's phone owns read state and we never override it). This is the explicit, human-driven counterpart to `GET .../messages`, which is side-effect-free and does NOT mark anything read. Call this when a user actually views the conversation.
 * POST /v1/inbox/conversations/{conversationId}/read
 */
export function markConversationRead(conversationId: string, body: { accountId: string }) {
  return zernioCall("POST", `/v1/inbox/conversations/${encodeURIComponent(String(conversationId))}/read`, undefined, body);
}

/**
 * Pause sequence
 * Pause an active sequence. Enrolled contacts stop receiving messages until the sequence is reactivated.
 * POST /v1/sequences/{sequenceId}/pause
 */
export function pauseSequence(sequenceId: string) {
  return zernioCall("POST", `/v1/sequences/${encodeURIComponent(String(sequenceId))}/pause`, undefined, undefined);
}

/**
 * Reject join requests
 * Reject pending join requests for a WhatsApp group. Not available on [Coexistence](/platforms/whatsapp/connection#whatsapp-business-app-coexistence) numbers. Requires a Cloud API-only number.
 * DELETE /v1/whatsapp/wa-groups/{groupId}/join-requests
 */
export function rejectWhatsAppGroupJoinRequests(groupId: string, query: { accountId: string }, body: { phoneNumbers: string[] }) {
  return zernioCall("DELETE", `/v1/whatsapp/wa-groups/${encodeURIComponent(String(groupId))}/join-requests`, query, body);
}

/**
 * Remove reaction
 * Remove a reaction from a message. Platform support: - Telegram: Send empty reaction array to clear - WhatsApp: Send empty emoji to remove - Instagram and Facebook Messenger: Sends Meta's `unreact` action; the emoji does not need to be repeated - Slack: Removes the reaction we previously sent on that message - All others: Returns 400 (not supported)
 * DELETE /v1/inbox/conversations/{conversationId}/messages/{messageId}/reactions
 */
export function removeMessageReaction(conversationId: string, messageId: string, query: { accountId: string }) {
  return zernioCall("DELETE", `/v1/inbox/conversations/${encodeURIComponent(String(conversationId))}/messages/${encodeURIComponent(String(messageId))}/reactions`, query, undefined);
}

/**
 * Remove participants
 * Remove participants from a WhatsApp group. Not available on [Coexistence](/platforms/whatsapp/connection#whatsapp-business-app-coexistence) numbers. Requires a Cloud API-only number.
 * DELETE /v1/whatsapp/wa-groups/{groupId}/participants
 */
export function removeWhatsAppGroupParticipants(groupId: string, query: { accountId: string }, body: { phoneNumbers: string[] }) {
  return zernioCall("DELETE", `/v1/whatsapp/wa-groups/${encodeURIComponent(String(groupId))}/participants`, query, body);
}

/**
 * Schedule broadcast for later
 * Schedule a draft broadcast to be sent at a future date and time.
 * POST /v1/broadcasts/{broadcastId}/schedule
 */
export function scheduleBroadcast(broadcastId: string, body: { scheduledAt: string }) {
  return zernioCall("POST", `/v1/broadcasts/${encodeURIComponent(String(broadcastId))}/schedule`, undefined, body);
}

/**
 * Search conversations
 * Search your conversations two ways at once, and get back the matching conversations, most-recent match first: - Message text: matches words inside message bodies. Case-insensitive and accent-insensitive, exact tokens only (no substrings, no stemming). Each hit carries up to 3 most-recent matching messages. With direction=outgoing you can collect examples of how you write to customers, for example to teach an AI agent your tone of voice. - Contact identity: matches the participant's name, username, or phone number as a case-insensitive substring. These hits have matchCount 0 and an empty match…
 * GET /v1/inbox/conversations/search
 */
export function searchInboxConversations(query: { query: string; direction?: "incoming" | "outgoing"; profileId?: string; platform?: "facebook" | "instagram" | "telegram" | "whatsapp" | "sms" | "slack"; accountId?: string; limit?: number; cursor?: string }) {
  return zernioCall("GET", "/v1/inbox/conversations/search", query, undefined);
}

/**
 * Send broadcast now
 * Immediately start sending a draft broadcast to its recipients.
 * POST /v1/broadcasts/{broadcastId}/send
 */
export function sendBroadcast(broadcastId: string) {
  return zernioCall("POST", `/v1/broadcasts/${encodeURIComponent(String(broadcastId))}/send`, undefined, undefined);
}

/**
 * Send a Discord Direct Message
 * Send a 1:1 Direct Message from the bot to a Discord user (by snowflake ID). Supports the same payload shape as channel posts — content, embeds, media attachments, and TTS. Constraints (Discord platform limits): - The bot can only DM users it shares at least one guild with. - If the recipient has DMs disabled for non-friends, Discord returns 403 (surfaces as a 502 platform error). - `content` capped at 2,000 chars. - At least one of `content`, `embeds`, or `attachments` is required. - The recipient must be identified by Discord snowflake ID (not username). This is a dedicated endpoint rather t…
 * POST /v1/discord/dms
 */
export function sendDiscordDirectMessage(body: { accountId: string; userId: string; content?: string; embeds?: Record<string, unknown>[]; attachments?: ({ type: "image" | "video" | "gif" | "document"; url: string; filename?: string; mimeType?: string; size?: number })[]; tts?: boolean }) {
  return zernioCall("POST", "/v1/discord/dms", undefined, body);
}

/**
 * Send message
 * Send a message in a conversation. Supports text, attachments, quick replies, buttons, templates, and message tags. Attachment and interactive message support varies by platform. WhatsApp per-recipient rate limit: WhatsApp caps how many messages you may send to the same recipient in a short window and rejects the excess with error code `131056` ("Too many messages sent to this recipient"). Pace sends to a single recipient at roughly 10 per minute; bursts above that return a `400` with code `131056`. Sends to other recipients are unaffected, so parallelise across recipients rather than flooding…
 * POST /v1/inbox/conversations/{conversationId}/messages
 */
export function sendInboxMessage(conversationId: string, body: FormData) {
  return zernioCall("POST", `/v1/inbox/conversations/${encodeURIComponent(String(conversationId))}/messages`, undefined, body);
}

/**
 * Send private reply
 * Send a private message to the author of a comment. Supported on Instagram and Facebook only. One reply per comment, must be sent within 7 days. Optionally attach interactive elements: `quickReplies` (chips above the keyboard, max 13) or `buttons` (1-3 inline postback/url buttons rendered in the same bubble via Meta's button_template). Buttons are recommended for cold reach since chips do not render in the Instagram Message Requests folder. `quickReplies` and `buttons` are mutually exclusive.
 * POST /v1/inbox/comments/{postId}/{commentId}/private-reply
 */
export function sendPrivateReplyToComment(postId: string, commentId: string, body: { accountId: string; message: string; quickReplies?: { title: string; payload: string; imageUrl?: string }[]; buttons?: unknown[] }) {
  return zernioCall("POST", `/v1/inbox/comments/${encodeURIComponent(String(postId))}/${encodeURIComponent(String(commentId))}/private-reply`, undefined, body);
}

/**
 * Send an SMS/MMS
 * Sends an SMS (or MMS when `mediaUrls` is set) from one of your SMS-enabled numbers. At least one of `text` / `mediaUrls` is required. Both numbers are normalized to E.164, so `from` matches regardless of formatting and replies thread into the same inbox conversation. US numbers must have an approved carrier registration (`/v1/sms/registrations`) before messages deliver. **Replies and delivery status arrive as webhooks**, not by polling: an inbound reply fires `message.received` with `platform: "sms"`, the first message of a new thread also fires `conversation.started`, and this message's own …
 * POST /v1/sms/messages
 */
export function sendSms(body: { from: string; to: string; text?: string; mediaUrls?: string[]; sendAt?: string }) {
  return zernioCall("POST", "/v1/sms/messages", undefined, body);
}

/**
 * Send typing indicator
 * Show a typing indicator in a conversation. Platform support: - Facebook Messenger: Shows "Page is typing..." for 20 seconds - Instagram: Shows "typing..." to the recipient (works for both Instagram Login and Facebook Login accounts). The recipient must be signed in to Instagram to see it. - Telegram: Shows "Bot is typing..." for 5 seconds - WhatsApp: Shows "typing..." for up to 25 seconds. Requires a recent inbound message in the conversation (Meta references the inbound message id) and also marks that message as read as a side-effect. - All others: Returns 200 but no-op (platform doesn't sup…
 * POST /v1/inbox/conversations/{conversationId}/typing
 */
export function sendTypingIndicator(conversationId: string, body: { accountId: string }) {
  return zernioCall("POST", `/v1/inbox/conversations/${encodeURIComponent(String(conversationId))}/typing`, undefined, body);
}

/**
 * Send flow message
 * Send a published flow as an interactive message with a CTA button. When the recipient taps the button, the flow opens natively in WhatsApp. Flow responses are received via webhooks.
 * POST /v1/whatsapp/flows/send
 */
export function sendWhatsAppFlowMessage(body: { accountId: string; to: string; flow_id: string; flow_cta: string; flow_action?: "navigate" | "data_exchange"; flow_token?: string; flow_action_payload?: { screen?: string; data?: Record<string, unknown> }; body: string; header?: { type?: "text"; text?: string }; footer?: string; draft?: boolean }) {
  return zernioCall("POST", "/v1/whatsapp/flows/send", undefined, body);
}

/**
 * Blind-transfer a live call
 * Moves the call's current leg to a new destination (a phone number or a SIP endpoint). This is a BLIND transfer: control of the leg is handed off and the call ends normally when the transferred leg hangs up. The caller ID presented on the transfer leg is always your own number.
 * POST /v1/voice/calls/{id}/transfer
 */
export function transferVoiceCall(id: string, body: { to: string }) {
  return zernioCall("POST", `/v1/voice/calls/${encodeURIComponent(String(id))}/transfer`, undefined, body);
}

/**
 * Manually start a workflow run
 * Kick off a run without waiting for an inbound message (useful for testing). Target an existing conversation by `conversationId`, or — WhatsApp only — a phone number via `to` (a conversation is found or created). `text` seeds the run's `lastMessage` variable. The graph must be runnable.
 * POST /v1/workflows/{workflowId}/executions
 */
export function triggerWorkflow(workflowId: string, body: { to?: string; conversationId?: string; text?: string }) {
  return zernioCall("POST", `/v1/workflows/${encodeURIComponent(String(workflowId))}/executions`, undefined, body);
}

/**
 * Unenroll contact
 * Remove a contact from a sequence. No further messages will be sent to this contact.
 * DELETE /v1/sequences/{sequenceId}/enroll/{contactId}
 */
export function unenrollContact(sequenceId: string, contactId: string) {
  return zernioCall("DELETE", `/v1/sequences/${encodeURIComponent(String(sequenceId))}/enroll/${encodeURIComponent(String(contactId))}`, undefined, undefined);
}

/**
 * Update broadcast
 * Update a broadcast's name, message, template, or segment filters. Only draft broadcasts can be updated.
 * PATCH /v1/broadcasts/{broadcastId}
 */
export function updateBroadcast(broadcastId: string, body?: { name?: string; description?: string; message?: { text?: string }; template?: { name?: string; language?: string; variableMapping?: Record<string, unknown> }; segmentFilters?: Record<string, unknown> }) {
  return zernioCall("PATCH", `/v1/broadcasts/${encodeURIComponent(String(broadcastId))}`, undefined, body);
}

/**
 * Update automation settings
 * Update an automation's keywords, DM message, inline buttons, comment reply, or active status. Pass `buttons: []` to clear all buttons. When `buttons` is non-empty, `dmMessage` (the new one if you're changing it, otherwise the stored one) must be 640 characters or less.
 * PATCH /v1/comment-automations/{automationId}
 */
export function updateCommentAutomation(automationId: string, body?: { name?: string; trigger?: "comment" | "story_reply"; keywords?: string[]; matchMode?: "exact" | "contains" | "word"; excludeKeywords?: string[]; typoTolerance?: boolean; dmMessage?: string; buttons?: unknown[]; template?: unknown; commentReply?: string; dmMessageVariations?: string[]; commentReplyVariations?: string[]; linkTracking?: boolean; clickTag?: string; alsoMatchInDms?: boolean; dmDelaySeconds?: number; commentReplyDelaySeconds?: number; audience?: unknown; followGate?: unknown; isActive?: boolean }) {
  return zernioCall("PATCH", `/v1/comment-automations/${encodeURIComponent(String(automationId))}`, undefined, body);
}

/**
 * Update conversation status
 * Archive or activate a conversation. Requires accountId in request body.
 * PUT /v1/inbox/conversations/{conversationId}
 */
export function updateInboxConversation(conversationId: string, body: { accountId: string; status: "active" | "archived" }) {
  return zernioCall("PUT", `/v1/inbox/conversations/${encodeURIComponent(String(conversationId))}`, undefined, body);
}

/**
 * Update sequence
 * Update a sequence's name, steps, or exit conditions. Steps can only be modified while the sequence is draft or paused.
 * PATCH /v1/sequences/{sequenceId}
 */
export function updateSequence(sequenceId: string, body?: { name?: string; description?: string; steps?: { order: number; delayMinutes: number; message?: { text?: string }; template?: { name?: string; language?: string; variableMapping?: Record<string, unknown> } }[]; exitOnReply?: boolean; exitOnUnsubscribe?: boolean }) {
  return zernioCall("PATCH", `/v1/sequences/${encodeURIComponent(String(sequenceId))}`, undefined, body);
}

/**
 * Update group settings
 * Update the subject, description, or join approval mode of a WhatsApp group. Not available on [Coexistence](/platforms/whatsapp/connection#whatsapp-business-app-coexistence) numbers. Requires a Cloud API-only number.
 * POST /v1/whatsapp/wa-groups/{groupId}
 */
export function updateWhatsAppGroupChat(groupId: string, query: { accountId: string }, body: { subject?: string; description?: string; joinApprovalMode?: "approval_required" | "auto_approve" }) {
  return zernioCall("POST", `/v1/whatsapp/wa-groups/${encodeURIComponent(String(groupId))}`, query, body);
}


/* ======================================================================
 * other — 5 operations
 * ====================================================================== */

/**
 * Check whether an Instagram user follows the account
 * Resolves the follow relationship between an Instagram user and the connected account, plus their public profile counters. `userId` is the Instagram-scoped id (IGSID) Meta gives you on a webhook: `sender.id` on `message.received`, `comment.author.id` on `comment.received`. **Meta only answers for people who have MESSAGED the account.** Commenting grants no consent, so a commenter who has never DMed you is unresolvable - that is a platform rule, not a limitation of this endpoint. When it cannot be resolved the response is still `200` with `isFollower: null` and an `unavailableReason`, because "…
 * GET /v1/accounts/{accountId}/follow-status/{userId}
 * Platforms: instagram
 */
export function getInstagramFollowStatus(accountId: string, userId: string, query?: { refresh?: boolean }) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/follow-status/${encodeURIComponent(String(userId))}`, query, undefined);
}

/**
 * Like post
 * Like (or react to) a post as a connected account. Supported platforms: LinkedIn, Twitter/X, Facebook, YouTube, Bluesky, and Instagram in limited release (see below). Threads, TikTok and Pinterest expose no like endpoint in their APIs and return 400. Reddit returns 400 too, pointing at `POST /v1/accounts/{accountId}/reddit-vote`, which covers upvote, downvote and clear on both posts and comments. The account does not have to be the one that published the post, which is what makes executive engagement possible: pass an exec's `accountId` and the brand post's ID. `postId` accepts either a Zernio…
 * POST /v1/inbox/posts/{postId}/like
 */
export function likePost(postId: string, body: { accountId: string; reactionType?: "LIKE" | "PRAISE" | "EMPATHY" | "INTEREST" | "APPRECIATION" | "ENTERTAINMENT"; cid?: string }) {
  return zernioCall("POST", `/v1/inbox/posts/${encodeURIComponent(String(postId))}/like`, undefined, body);
}

/**
 * List Pages with a linked Instagram account
 * Completes the `loginMethod=facebook_login` Instagram flow, i.e. "Instagram API with Facebook Login". After the user authorizes on Facebook, extract `tempToken` from the redirect params (headless mode adds `step=select_account`) and pass it here to list the Facebook Pages they manage. Only Pages that have a linked Instagram professional account are returned, so an empty array means the user has no eligible Page. Use the X-Connect-Token header if connecting via API key. Not used by the default `instagram_login` flow, which creates the account without a selection step.
 * GET /v1/connect/instagram/select-account
 */
export function listInstagramPages(query: { profileId: string; tempToken: string }) {
  return zernioCall("GET", "/v1/connect/instagram/select-account", query, undefined);
}

/**
 * Select the Page whose Instagram account to connect
 * Saves the selected Page as an Instagram account connected via Facebook Login. The Page access token becomes the account's access token, so every Instagram call for it runs against the Facebook Graph host. One Instagram account per profile: if the profile already has an Instagram account, this replaces it, and picking a different Instagram identity purges the previous account's conversations, external posts and stats.
 * POST /v1/connect/instagram/select-account
 */
export function selectInstagramAccount(body: { profileId: string; pageId: string; tempToken: string; redirect_url?: string }) {
  return zernioCall("POST", "/v1/connect/instagram/select-account", undefined, body);
}

/**
 * Unlike post
 * Remove this account's like from a post. Supported platforms: LinkedIn, Twitter/X, Facebook, YouTube, Bluesky, and Instagram in limited release. On YouTube this clears the rating. Instagram has the same limited release, Facebook Login, `instagram_manage_engagement` and burst-limit constraints as liking. For Bluesky, `likeUri` (returned when the post was liked) is required. Reddit uses `POST /v1/accounts/{accountId}/reddit-vote` with `direction: 0`.
 * DELETE /v1/inbox/posts/{postId}/like
 */
export function unlikePost(postId: string, query: { accountId: string; likeUri?: string }) {
  return zernioCall("DELETE", `/v1/inbox/posts/${encodeURIComponent(String(postId))}/like`, query, undefined);
}


/* ======================================================================
 * public — 3 operations
 * ====================================================================== */

/**
 * Get pending OAuth data
 * Fetch pending OAuth data for headless mode using the pendingDataToken from the redirect URL. **Scope**: This endpoint is used for LinkedIn organizations, Snapchat profiles, and Pinterest boards, where the selection list is too large to fit in URL params. The redirect carries a `pendingDataToken` instead of the full payload; the response includes the corresponding selection array (e.g. `boards` for Pinterest). WhatsApp, Facebook, Google Business and other platforms pass selection state directly via URL query params on the redirect (`profileId`, `tempToken`, `step`), no pending record is create…
 * GET /v1/connect/pending-data
 */
export function getPendingOAuthData(query: { token: string }) {
  return zernioCall("GET", "/v1/connect/pending-data", query, undefined);
}

/**
 * List LinkedIn orgs
 * Fetch full LinkedIn organization details (logos, vanity names, websites) for custom UI. No authentication required, just the tempToken from OAuth.
 * GET /v1/connect/linkedin/organizations
 */
export function listLinkedInOrganizations(query: { tempToken: string; orgIds: string }) {
  return zernioCall("GET", "/v1/connect/linkedin/organizations", query, undefined);
}

/**
 * Verify credential
 * Checks whether the bearer credential on this request is valid, without reading any data. Accepts an API key or an OAuth access token. Intended for clients that must validate a credential before use (for example an MCP server verifying an incoming token) so they do not have to call a data endpoint to do it.
 * GET /v1/auth/verify
 */
export function verifyCredential() {
  return zernioCall("GET", "/v1/auth/verify", undefined, undefined);
}


/* ======================================================================
 * publishing — 34 operations
 * ====================================================================== */

/**
 * Bulk upload from CSV
 * Create multiple posts by uploading a CSV file. Use dryRun=true to validate without creating posts.
 * POST /v1/posts/bulk-upload
 */
export function bulkUploadPosts(query: { dryRun?: boolean } | undefined, body: FormData) {
  return zernioCall("POST", "/v1/posts/bulk-upload", query, body);
}

/**
 * Create a blog
 * Creates a blog on the connected store. The platform generates the URL `handle` from the title when omitted. Supported on Shopify (platform `shopify`). Accounts on platforms without blogs support return 400; a blogs-capable platform that lacks this specific operation returns 405.
 * POST /v1/accounts/{accountId}/blogs
 * Platforms: shopify
 */
export function createBlog(accountId: string, body: { title: string; handle?: string }) {
  return zernioCall("POST", `/v1/accounts/${encodeURIComponent(String(accountId))}/blogs`, undefined, body);
}

/**
 * Create a blog article
 * Creates an article on the blog. Publishing behavior: - `isPublished: false` keeps the article as a draft. - A future `publishDate` schedules publication natively on the platform; the platform publishes it at that time with no Zernio queue involved. - `seo.title` / `seo.description` map to Shopify's global `title_tag` and `description_tag` metafields (the fields Shopify themes read for the page title and meta description). Supported on Shopify (platform `shopify`). Accounts on platforms without blogs support return 400; a blogs-capable platform that lacks this specific operation returns 405.
 * POST /v1/accounts/{accountId}/blogs/{blogId}/articles
 * Platforms: shopify
 */
export function createBlogArticle(accountId: string, blogId: string, body: { title: string; bodyHtml?: string; handle?: string; tags?: string[]; author?: string; excerpt?: string; image?: { url: string; altText?: string }; seo?: { title?: string; description?: string }; isPublished?: boolean; publishDate?: string }) {
  return zernioCall("POST", `/v1/accounts/${encodeURIComponent(String(accountId))}/blogs/${encodeURIComponent(String(blogId))}/articles`, undefined, body);
}

/**
 * Create post
 * Create and optionally publish a post. Immediate posts (`publishNow: true`) include `platformPostUrl` in the response. Content is optional when media is attached, all platforms have `customContent`, every platform entry is an X Article (`platformSpecificData.article`), or every platform entry is a LinkedIn text-free reshare (`platformSpecificData.reshareUrl` with no text). See each platform's schema for media constraints. ## Idempotency Two layers of duplicate-protection apply, so safe-to-retry callers (network blips, n8n / Zapier retries, etc.) don't accidentally double-post. **1. Same-reques…
 * POST /v1/posts
 */
export function createPost(body: { title?: string; content?: string; mediaItems?: unknown[]; platforms?: { platform: string; accountId: string; customContent?: string; customMedia?: unknown[]; scheduledFor?: string; platformSpecificData?: unknown }[]; scheduledFor?: string; publishNow?: boolean; isDraft?: boolean; timezone?: string; tags?: string[]; hashtags?: string[]; mentions?: string[]; crosspostingEnabled?: boolean; metadata?: Record<string, unknown>; tiktokSettings?: unknown; facebookSettings?: unknown; recycling?: unknown; queuedFromProfile?: string; queueId?: string }) {
  return zernioCall("POST", "/v1/posts", undefined, body);
}

/**
 * Create schedule
 * Create an additional queue for a profile. The first queue created becomes the default. Subsequent queues are non-default unless explicitly set.
 * POST /v1/queue/slots
 */
export function createQueueSlot(body: { profileId: string; name: string; timezone: string; slots: unknown[]; active?: boolean }) {
  return zernioCall("POST", "/v1/queue/slots", undefined, body);
}

/**
 * Delete a blog
 * Deletes the blog AND every article in it. The delete happens on the platform and is permanent; Zernio stores nothing to restore it from. Supported on Shopify (platform `shopify`). Accounts on platforms without blogs support return 400; a blogs-capable platform that lacks this specific operation returns 405.
 * DELETE /v1/accounts/{accountId}/blogs/{blogId}
 * Platforms: shopify
 */
export function deleteBlog(accountId: string, blogId: string) {
  return zernioCall("DELETE", `/v1/accounts/${encodeURIComponent(String(accountId))}/blogs/${encodeURIComponent(String(blogId))}`, undefined, undefined);
}

/**
 * Delete a blog article
 * Deletes the article. The delete happens on the platform and is permanent; Zernio stores nothing to restore it from. Supported on Shopify (platform `shopify`). Accounts on platforms without blogs support return 400; a blogs-capable platform that lacks this specific operation returns 405.
 * DELETE /v1/accounts/{accountId}/blogs/{blogId}/articles/{articleId}
 * Platforms: shopify
 */
export function deleteBlogArticle(accountId: string, blogId: string, articleId: string) {
  return zernioCall("DELETE", `/v1/accounts/${encodeURIComponent(String(accountId))}/blogs/${encodeURIComponent(String(blogId))}/articles/${encodeURIComponent(String(articleId))}`, undefined, undefined);
}

/**
 * Delete post
 * Delete a draft or scheduled post from Zernio. Published posts cannot be deleted; use the Unpublish endpoint instead. Upload quota is automatically refunded.
 * DELETE /v1/posts/{postId}
 */
export function deletePost(postId: string) {
  return zernioCall("DELETE", `/v1/posts/${encodeURIComponent(String(postId))}`, undefined, undefined);
}

/**
 * Delete schedule
 * Delete a queue from a profile. Pass queueId to delete a specific queue; omit it to delete all queues for the profile. If deleting the default queue, another queue will be promoted to default.
 * DELETE /v1/queue/slots
 */
export function deleteQueueSlot(query: { profileId: string; queueId?: string }) {
  return zernioCall("DELETE", "/v1/queue/slots", query, undefined);
}

/**
 * Edit published post
 * Edit the text of an already-published post. Supported on X (Twitter), Discord, Facebook, Reddit, LinkedIn, Telegram, Pinterest, Google Business Profile, YouTube, and Slack. When a post was published to several accounts on the same platform, pass `accountId` to pick which account's copy to edit (the first entry is edited otherwise). Each platform enforces its own rules: **X (Twitter)** - Connected X account must have an active X Premium subscription - Must be within 1 hour of original publish time - Maximum 5 edits per tweet (enforced by X) - Threads cannot be edited, only single tweets - X as…
 * POST /v1/posts/{postId}/edit
 */
export function editPost(postId: string, body: { platform: "twitter" | "discord" | "facebook" | "reddit" | "linkedin" | "telegram" | "pinterest" | "googlebusiness" | "youtube" | "slack"; content: string; accountId?: string }) {
  return zernioCall("POST", `/v1/posts/${encodeURIComponent(String(postId))}/edit`, undefined, body);
}

/**
 * Get a blog
 * Fetches a single blog. `blogId` is the platform's numeric blog id from `GET /v1/accounts/{accountId}/blogs`, not a Zernio id. Supported on Shopify (platform `shopify`). Accounts on platforms without blogs support return 400; a blogs-capable platform that lacks this specific operation returns 405.
 * GET /v1/accounts/{accountId}/blogs/{blogId}
 * Platforms: shopify
 */
export function getBlog(accountId: string, blogId: string) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/blogs/${encodeURIComponent(String(blogId))}`, undefined, undefined);
}

/**
 * Get a blog article
 * Fetches a single article. An article addressed through a blog it does not belong to is a 404 (code blog_article_not_found). Supported on Shopify (platform `shopify`). Accounts on platforms without blogs support return 400; a blogs-capable platform that lacks this specific operation returns 405.
 * GET /v1/accounts/{accountId}/blogs/{blogId}/articles/{articleId}
 * Platforms: shopify
 */
export function getBlogArticle(accountId: string, blogId: string, articleId: string) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/blogs/${encodeURIComponent(String(blogId))}/articles/${encodeURIComponent(String(articleId))}`, undefined, undefined);
}

/**
 * Get upload URL
 * Get a presigned URL to upload files directly to cloud storage (up to 5GB). Returns an uploadUrl and publicUrl. PUT your file to the uploadUrl, then use the publicUrl in your posts.
 * POST /v1/media/presign
 */
export function getMediaPresignedUrl(body: { filename: string; contentType: unknown; size?: number }) {
  return zernioCall("POST", "/v1/media/presign", undefined, body);
}

/**
 * Get next available slot
 * Returns the next available queue slot for preview purposes. To create a queue post, use POST /v1/posts with queuedFromProfile instead of scheduledFor.
 * GET /v1/queue/next-slot
 */
export function getNextQueueSlot(query: { profileId: string; queueId?: string }) {
  return zernioCall("GET", "/v1/queue/next-slot", query, undefined);
}

/**
 * Get post
 * Fetch a single post by ID. For published posts, this returns platformPostUrl for each platform.
 * GET /v1/posts/{postId}
 */
export function getPost(postId: string) {
  return zernioCall("GET", `/v1/posts/${encodeURIComponent(String(postId))}`, undefined, undefined);
}

/**
 * List blog articles
 * Lists the articles of a blog. Cursor-paginated: pass `limit` (1-50, default 20) and the `cursor` from a previous response's `nextCursor`; `nextCursor` is null when there are no more pages. Supported on Shopify (platform `shopify`). Accounts on platforms without blogs support return 400; a blogs-capable platform that lacks this specific operation returns 405.
 * GET /v1/accounts/{accountId}/blogs/{blogId}/articles
 * Platforms: shopify
 */
export function listBlogArticles(accountId: string, blogId: string, query?: { limit?: number; cursor?: string }) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/blogs/${encodeURIComponent(String(blogId))}/articles`, query, undefined);
}

/**
 * List blogs
 * Lists the blogs on the connected store, newest-first as the platform returns them. Cursor-paginated: pass `limit` (1-50, default 20) and the `cursor` from a previous response's `nextCursor`; `nextCursor` is null when there are no more pages. Supported on Shopify (platform `shopify`). Accounts on platforms without blogs support return 400; a blogs-capable platform that lacks this specific operation returns 405.
 * GET /v1/accounts/{accountId}/blogs
 * Platforms: shopify
 */
export function listBlogs(accountId: string, query?: { limit?: number; cursor?: string }) {
  return zernioCall("GET", `/v1/accounts/${encodeURIComponent(String(accountId))}/blogs`, query, undefined);
}

/**
 * List activity logs
 * Unified logs endpoint. Returns logs for publishing, connections, webhooks, and messaging. Filter by type, platform, status, and time range. Logs are retained for 90 days.
 * GET /v1/logs
 */
export function listLogs(query?: { type?: "all" | "publishing" | "connections" | "webhooks" | "messaging" | "workflow_event" | "api_request"; status?: "success" | "failed" | "pending" | "skipped" | "all"; platform?: "tiktok" | "instagram" | "whatsapp" | "facebook" | "youtube" | "linkedin" | "twitter" | "threads" | "pinterest" | "reddit" | "bluesky" | "googlebusiness" | "telegram" | "snapchat" | "all"; action?: string; search?: string; days?: number; limit?: number; skip?: number; account_id?: string; event?: string; request_id?: string; from?: string; to?: string; status_code?: number; api_key_id?: string; include_read_receipts?: boolean }) {
  return zernioCall("GET", "/v1/logs", query, undefined);
}

/**
 * List posts
 * Returns a paginated list of posts. Published posts include platformPostUrl with the public URL on each platform.
 * GET /v1/posts
 */
export function listPosts(query?: { limit?: number; source?: "zernio" | "external"; status?: "draft" | "scheduled" | "published" | "failed"; platform?: string; profileId?: string; createdBy?: string; dateFrom?: string; dateTo?: string; includeHidden?: boolean; search?: string; sortBy?: "scheduled-desc" | "scheduled-asc" | "created-desc" | "created-asc" | "status" | "platform"; accountId?: string }) {
  return zernioCall("GET", "/v1/posts", query, undefined);
}

/**
 * List schedules
 * Returns queue schedules for a profile. Use all=true for all queues, or queueId for a specific one. Defaults to the default queue.
 * GET /v1/queue/slots
 */
export function listQueueSlots(query: { profileId: string; queueId?: string; all?: "true" | "false" }) {
  return zernioCall("GET", "/v1/queue/slots", query, undefined);
}

/**
 * Preview upcoming slots
 * Returns the next N upcoming queue slot times for a profile as ISO datetime strings.
 * GET /v1/queue/preview
 */
export function previewQueue(query: { profileId: string; queueId?: string; count?: number }) {
  return zernioCall("GET", "/v1/queue/preview", query, undefined);
}

/**
 * Retry failed post
 * Immediately retries publishing a failed post. Returns the updated post with its new status.
 * POST /v1/posts/{postId}/retry
 */
export function retryPost(postId: string) {
  return zernioCall("POST", `/v1/posts/${encodeURIComponent(String(postId))}/retry`, undefined, undefined);
}

/**
 * Sync an external post
 * Fetch an account's latest external posts (published directly on the platform, not through Zernio) on demand, so a just-published post is retrievable within seconds instead of waiting for the background sync (which refreshes each account at most every ~90 minutes). Primary use case: verifying a submitted post. When a user publishes on the platform and immediately pastes the post URL into your app, call this with `accountId` plus `url` (or `postId`) to confirm the post exists and return its metadata. Behavior: - We check our stored copy first and return immediately if the post is already known …
 * POST /v1/posts/sync-external
 */
export function syncExternalPosts(body: { accountId: string; url?: string; postId?: string }) {
  return zernioCall("POST", "/v1/posts/sync-external", undefined, body);
}

/**
 * Unpublish post
 * Deletes a published post from the specified platform. The post record in Zernio is kept but its status is updated to cancelled. Not supported on Instagram, TikTok, or Snapchat. Threaded posts delete all items. YouTube deletion is permanent.
 * POST /v1/posts/{postId}/unpublish
 */
export function unpublishPost(postId: string, body: { platform: "threads" | "facebook" | "twitter" | "linkedin" | "youtube" | "pinterest" | "reddit" | "bluesky" | "googlebusiness" | "telegram" }) {
  return zernioCall("POST", `/v1/posts/${encodeURIComponent(String(postId))}/unpublish`, undefined, body);
}

/**
 * Update a blog
 * Partial-updates a blog. Send any subset of `title` and `handle`; at least one field is required (an empty body returns 400). Supported on Shopify (platform `shopify`). Accounts on platforms without blogs support return 400; a blogs-capable platform that lacks this specific operation returns 405.
 * PATCH /v1/accounts/{accountId}/blogs/{blogId}
 * Platforms: shopify
 */
export function updateBlog(accountId: string, blogId: string, body: { title?: string; handle?: string }) {
  return zernioCall("PATCH", `/v1/accounts/${encodeURIComponent(String(accountId))}/blogs/${encodeURIComponent(String(blogId))}`, undefined, body);
}

/**
 * Update a blog article
 * Partial-updates an article. Send any subset of the create fields (`title`, `bodyHtml`, `handle`, `tags`, `author`, `excerpt`, `image`, `seo`, `isPublished`, `publishDate`); at least one field is required (an empty body returns 400). `isPublished` and `publishDate` behave as on create: `isPublished: false` unpublishes back to a draft and a future `publishDate` schedules publication natively on the platform. Supported on Shopify (platform `shopify`). Accounts on platforms without blogs support return 400; a blogs-capable platform that lacks this specific operation returns 405.
 * PATCH /v1/accounts/{accountId}/blogs/{blogId}/articles/{articleId}
 * Platforms: shopify
 */
export function updateBlogArticle(accountId: string, blogId: string, articleId: string, body: { title?: string; bodyHtml?: string; handle?: string; tags?: string[]; author?: string; excerpt?: string; image?: { url: string; altText?: string }; seo?: { title?: string; description?: string }; isPublished?: boolean; publishDate?: string }) {
  return zernioCall("PATCH", `/v1/accounts/${encodeURIComponent(String(accountId))}/blogs/${encodeURIComponent(String(blogId))}/articles/${encodeURIComponent(String(articleId))}`, undefined, body);
}

/**
 * Update post
 * Update an existing post. Draft, scheduled, failed, partial, and cancelled posts can be edited. Published posts can only have their recycling config updated. To promote a draft to scheduled, send `isDraft: false` together with `scheduledFor` (or `publishNow: true`, or `queuedFromProfile`). If `isDraft` is omitted the post keeps its current draft status, so sending only `scheduledFor` to a draft returns 200 but the post remains a draft. Non-draft updates run the same per-platform validation as post creation (media requirements, platform-specific field rules, etc.) against the resulting platform…
 * PUT /v1/posts/{postId}
 */
export function updatePost(postId: string, body: { title?: string; content?: string; mediaItems?: unknown[]; platforms?: { platform: string; accountId: string; customContent?: string; customMedia?: unknown[]; scheduledFor?: string; platformSpecificData?: Record<string, unknown> }[]; scheduledFor?: string; publishNow?: boolean; isDraft?: boolean; timezone?: string; visibility?: "public" | "private" | "unlisted"; tags?: string[]; hashtags?: string[]; mentions?: string[]; crosspostingEnabled?: boolean; metadata?: Record<string, unknown>; queuedFromProfile?: string; queueId?: string; tiktokSettings?: unknown; facebookSettings?: unknown; recycling?: unknown }) {
  return zernioCall("PUT", `/v1/posts/${encodeURIComponent(String(postId))}`, undefined, body);
}

/**
 * Update post metadata
 * Updates metadata of a published video on the specified platform without re-uploading. Currently only supported for YouTube. At least one updatable field is required. Two modes: 1. Post-based (video published through Zernio): pass the Zernio postId in the URL and platform in the body. 2. Direct video ID (video uploaded outside Zernio, e.g. directly to YouTube): use _ as the postId, and pass videoId + accountId + platform in the body. The accountId is the Zernio social account ID for the connected YouTube channel.
 * POST /v1/posts/{postId}/update-metadata
 */
export function updatePostMetadata(postId: string, body: { platform: "youtube"; videoId?: string; accountId?: string; title?: string; description?: string; tags?: string[]; categoryId?: string; privacyStatus?: "public" | "private" | "unlisted"; thumbnailUrl?: string; madeForKids?: boolean; containsSyntheticMedia?: boolean; playlistId?: string }) {
  return zernioCall("POST", `/v1/posts/${encodeURIComponent(String(postId))}/update-metadata`, undefined, body);
}

/**
 * Update schedule
 * Create a new queue or update an existing one. Without queueId, creates/updates the default queue. With queueId, updates a specific queue. With setAsDefault=true, makes this queue the default for the profile.
 * PUT /v1/queue/slots
 */
export function updateQueueSlot(body: { profileId: string; queueId?: string; name?: string; timezone: string; slots: unknown[]; active?: boolean; setAsDefault?: boolean; reshuffleExisting?: boolean }) {
  return zernioCall("PUT", "/v1/queue/slots", undefined, body);
}

/**
 * Upload media file
 * Upload a media file using API key authentication and get back a publicly accessible URL. The URL can be used as attachmentUrl when sending inbox messages. Files are stored in temporary storage and auto-delete after 7 days. Maximum file size is 25MB. Unlike /v1/media/upload (which uses upload tokens for end-user flows), this endpoint uses standard Bearer token authentication for programmatic use.
 * POST /v1/media/upload-direct
 */
export function uploadMediaDirect(body: FormData) {
  return zernioCall("POST", "/v1/media/upload-direct", undefined, body);
}

/**
 * Validate media URL
 * Check if a media URL is accessible and return metadata (content type, file size) plus per-platform size limit comparisons. Performs a HEAD request (with GET fallback) to detect content type and size. Rejects private/localhost URLs for SSRF protection. Platform limits are sourced from each platform's actual upload constraints.
 * POST /v1/tools/validate/media
 */
export function validateMedia(body: { url: string }) {
  return zernioCall("POST", "/v1/tools/validate/media", undefined, body);
}

/**
 * Validate post content
 * Dry-run the full post validation pipeline without publishing. Catches issues like missing media for Instagram/TikTok/YouTube, hashtag limits, invalid thread formats, Facebook Reel requirements, and character limit violations. Accepts the same body as POST /v1/posts. Does NOT validate accounts, process media, or track usage. Account lookups are limit-only: a twitter accountId is resolved, scoped to the caller, only to pick the 280 vs 25000 character limit. Missing, foreign, or invalid ids fall back to 280 and never error. Returns errors for failures and warnings for near-limit content (>90% of…
 * POST /v1/tools/validate/post
 */
export function validatePost(body: { content?: string; platforms: ({ platform: "twitter" | "instagram" | "tiktok" | "youtube" | "facebook" | "linkedin" | "bluesky" | "threads" | "reddit" | "pinterest" | "telegram" | "snapchat" | "googlebusiness" | "discord" | "slack"; accountId?: string; customContent?: string; platformSpecificData?: Record<string, unknown>; customMedia?: unknown[] })[]; mediaItems?: unknown[] }) {
  return zernioCall("POST", "/v1/tools/validate/post", undefined, body);
}

/**
 * Validate character count
 * Check weighted character count per platform and whether the text is within each platform's limit. Twitter/X uses weighted counting (URLs = 23 chars via t.co, emojis = 2 chars). All other platforms use plain character length. Returns counts and limits for all 15 supported platform variants.
 * POST /v1/tools/validate/post-length
 */
export function validatePostLength(body: { text: string }) {
  return zernioCall("POST", "/v1/tools/validate/post-length", undefined, body);
}

/**
 * Check subreddit existence
 * Check if a subreddit exists and return basic info (title, subscriber count, NSFW status, post types allowed). When accountId is provided, uses authenticated Reddit OAuth API with automatic token refresh (recommended). Falls back to Reddit's public JSON API, which may be unreliable from server IPs. Returns exists: false for private, banned, or nonexistent subreddits.
 * GET /v1/tools/validate/subreddit
 */
export function validateSubreddit(query: { name: string; accountId?: string }) {
  return zernioCall("GET", "/v1/tools/validate/subreddit", query, undefined);
}


/* ======================================================================
 * telephony — 82 operations
 * ====================================================================== */

/**
 * Appeal a rejected campaign
 * Appeals a rejected 10DLC campaign with the carrier registry. Only a registration that reached campaign creation can be appealed; a brand-level rejection should be fixed and re-verified instead. On success the registration returns to `pending`. Content rejections (e.g. an opt-in flow without a verifiable form link, or unrealistic samples) should be FIXED in the same call: pass the corrected `messageFlow` / `sample1` / `sample2` and the campaign is updated before the appeal is filed, so the reviewer sees the new content. The current content is on `GET /v1/sms/registrations/{id}` (`campaignConte…
 * POST /v1/sms/registrations/{id}/appeal
 */
export function appealSmsRegistration(id: string, body: { appealReason: string; messageFlow?: string; sample1?: string; sample2?: string }) {
  return zernioCall("POST", `/v1/sms/registrations/${encodeURIComponent(String(id))}/appeal`, undefined, body);
}

/**
 * Attach a number to a SIP trunk
 * Routes the number's calls to the trunk: the external platform receives its inbound directly and can present it as outbound caller ID. While attached, Zernio-side voice features are off for this number (call forwarding, IVR, voicemail, recording, the softphone, and WhatsApp calling), so the number must have Calls and WhatsApp calling disabled before attaching. SMS and WhatsApp messaging are unaffected.
 * POST /v1/phone-numbers/{id}/sip-trunk
 */
export function attachNumberToSipTrunk(id: string, body: { trunkId: string }) {
  return zernioCall("POST", `/v1/phone-numbers/${encodeURIComponent(String(id))}/sip-trunk`, undefined, body);
}

/**
 * Cancel a port-in
 * Cancel an in-flight port (wrong number, staying with the old carrier). Only orders that haven't ported can be cancelled; a completed port is a normal number release instead. The carrier may report `cancel-pending` briefly while the losing carrier acknowledges; it settles to `cancelled`.
 * DELETE /v1/phone-numbers/port-in/{id}
 */
export function cancelPhoneNumberPortIn(id: string) {
  return zernioCall("DELETE", `/v1/phone-numbers/port-in/${encodeURIComponent(String(id))}`, undefined, undefined);
}

/**
 * Check country availability
 * Pre-purchase check, so you can warn BEFORE a customer invests in KYC (regulated review is async, 1-3 days). Tells you whether we have deliverable inventory, and what address the customer needs: - `addressConstraint: geo` → the registered address MUST be in one of the returned `areas` (the only place we have stock). A different-area address passes pre-approval but the number can never be assigned. - `addressConstraint: country` → any in-country address works. - `addressConstraint: none` → field-only / instant country, no address. Call this before starting the KYC form for regulated countries.
 * GET /v1/phone-numbers/availability
 */
export function checkPhoneNumberAvailability(query: { country: string; numberType?: "local" | "mobile" | "national" | "toll_free"; sms?: boolean }) {
  return zernioCall("GET", "/v1/phone-numbers/availability", query, undefined);
}

/**
 * Check portability
 * Pre-flight portability check: whether each number can be ported in and whether it qualifies for FastPort, BEFORE the user commits to a port order (LOA, invoice, service address). Read-only; creates no order and bills nothing.
 * POST /v1/phone-numbers/port-in/check
 */
export function checkPhoneNumberPortability(body: { phoneNumbers: string[] }) {
  return zernioCall("POST", "/v1/phone-numbers/port-in/check", undefined, body);
}

/**
 * Check a verification code
 * Verify the code the user typed. Wrong, expired, and exhausted codes answer 200 with `valid: false` and the settled `status` — only an unknown id is a 404. A correct code consumes the verification (single-use, `status: approved`) and fires the `verification.approved` webhook; the 5th wrong attempt settles it as `max_attempts_reached` and fires `verification.failed`.
 * POST /v1/verify/verifications/{verificationId}/check
 */
export function checkVerification(verificationId: string, body: { code: string }) {
  return zernioCall("POST", `/v1/verify/verifications/${encodeURIComponent(String(verificationId))}/check`, undefined, body);
}

/**
 * Check country availability
 * Deprecated alias of `/v1/phone-numbers/availability`; same contract. New integrations should use that path. Pre-purchase check, so you can warn BEFORE a customer invests in KYC (regulated review is async, 1-3 days). Tells you whether we have deliverable inventory, and what address the customer needs: - `addressConstraint: geo` → the registered address MUST be in one of the returned `areas` (the only place we have stock). A different-area address passes pre-approval but the number can never be assigned. - `addressConstraint: country` → any in-country address works. - `addressConstraint: none` …
 * GET /v1/whatsapp/phone-numbers/availability
 */
export function checkWhatsAppNumberAvailability(query: { country: string; numberType?: "local" | "mobile" | "national" | "toll_free"; sms?: boolean }) {
  return zernioCall("GET", "/v1/whatsapp/phone-numbers/availability", query, undefined);
}

/**
 * Create a hosted KYC link
 * Create a single-use, 7-day hosted KYC link that your end customer completes WITHOUT a Zernio login — useful when the person who holds the ID and address is not your team. They fill the regulated verification on a Zernio-hosted page; the number provisions under YOUR account once they submit. Only regulated (KYC) countries are valid: a country that does not require KYC returns 400. White-label the page with `branding` (your company name, logo, brand color). Supply `redirect_url` to send the end customer back to your own site after a successful submit (completion params are appended — see below)…
 * POST /v1/phone-numbers/kyc/share
 */
export function createPhoneNumberKycLink(body: { profileId: string; country: string; areaCode?: string; branding?: { companyName?: string; logoUrl?: string; brandColor?: string }; redirect_url?: string }) {
  return zernioCall("POST", "/v1/phone-numbers/kyc/share", undefined, body);
}

/**
 * Port numbers in
 * Submit a port-in for one or more existing numbers from another carrier. Creates the carrier order(s), attaches the end-user (current account) info plus the LOA and invoice documents, and submits to the losing carrier. The transfer PIN is forwarded to the carrier and never stored. Ported numbers arrive voice-ready (and SMS-ready where the order supports messaging). Run the portability check (POST /v1/phone-numbers/port-in/check) and upload the two documents (POST /v1/phone-numbers/port-in/documents) first — uploaded documents must be attached to an order within 30 minutes or the carrier delete…
 * POST /v1/phone-numbers/port-in
 */
export function createPhoneNumberPortIn(body: { phoneNumbers: string[]; endUser: { entityName: string; authPersonName: string; billingPhoneNumber?: string; accountNumber: string; pinPasscode?: string; taxIdentifier?: string; businessIdentifier?: string; streetAddress: string; extendedAddress?: string; locality: string; administrativeArea?: string; postalCode: string; countryCode: "US" | "CA" | "GB" | "ES" | "DE" | "FR" | "NL" | "AU" | "BR" }; loaDocumentId: string; invoiceDocumentId: string; focDatetimeRequested?: string; customerReference?: string; portType?: "full" | "partial"; requirements?: { requirementTypeId: string; fieldValue: string }[] }) {
  return zernioCall("POST", "/v1/phone-numbers/port-in", undefined, body);
}

/**
 * Watch an out-of-stock country
 * Get notified the first time an out-of-stock country has deliverable numbers again: an email to the account holder plus the `phone_number.stock_available` webhook. Stock is re-checked every 6h. One watch per country; a repeat request returns the existing watch (200). The watch is consumed when it fires, so re-create it if you miss the stock. Up to 20 countries can be watched at once.
 * POST /v1/phone-numbers/stock-watches
 */
export function createPhoneNumberStockWatch(body: { country: string }) {
  return zernioCall("POST", "/v1/phone-numbers/stock-watches", undefined, body);
}

/**
 * Create a SIP trunk
 * Creates a SIP trunk an external voice platform (Retell, ElevenLabs, Vapi, or any SIP endpoint) can import your Zernio numbers into. The trunk carries both directions: inbound calls on attached numbers are delivered to `sipHost`, and the platform originates outbound calls through `termination.uri` with the digest credentials. The `digestPassword` is returned only by this call (and by rotate-credentials); store it immediately. Attach any number of numbers to a trunk. Several trunks may point at the same host — each carries its own credentials and spend cap, so separate destination workspaces (e…
 * POST /v1/phone-numbers/sip-trunks
 */
export function createSipTrunk(body: { label: string; sipHost: string; sipPort?: number; transport?: "tls" | "tcp" | "udp" }) {
  return zernioCall("POST", "/v1/phone-numbers/sip-trunks", undefined, body);
}

/**
 * Create an alphanumeric sender ID
 * Registers an alphanumeric sender ID (e.g. `ZERNIO`) — a branded `from` for one-way international SMS. No phone number purchase or carrier registration is needed; once created, pass it as `from` on `POST /v1/sms/messages`. Constraints: 3-11 characters (letters, digits, spaces; at least one letter). Sends cannot reach the US, Canada, or Puerto Rico, are text-only, and recipients cannot reply. Sender IDs that impersonate well-known brands or institutions are rejected. Names are not exclusive: the same sender ID can be registered by any number of workspaces. Creating the same sender ID again is a…
 * POST /v1/sms/sender-ids
 */
export function createSmsSenderId(body: { senderId: string }) {
  return zernioCall("POST", "/v1/sms/sender-ids", undefined, body);
}

/**
 * Send a verification code
 * Generate a one-time code, deliver it to the recipient, and store only its hash. Check the user-typed code with POST /v1/verify/verifications/{verificationId}/check. Re-POSTing for the same (channel, to) while a verification is active RESENDS a fresh code on the existing verification (200 with `resend: true`) instead of creating a new one; resends are limited to one per 60 seconds (429 with `retryAfterSeconds` inside the cooldown). The stored brandName/codeLength/ttlMinutes win on a resend. Codes deliver by SMS from a phone number on your account (`from` optional when you own exactly one SMS-e…
 * POST /v1/verify/verifications
 */
export function createVerification(body: { channel: "sms"; to: string; from?: string; brandName?: string; codeLength?: number; ttlMinutes?: number }) {
  return zernioCall("POST", "/v1/verify/verifications", undefined, body);
}

/**
 * Create a hosted KYC link
 * Deprecated alias of `/v1/phone-numbers/kyc/share`; same contract. New integrations should use that path. Create a single-use, 7-day hosted KYC link that your end customer completes WITHOUT a Zernio login — useful when the person who holds the ID and address is not your team. They fill the regulated verification on a Zernio-hosted page; the number provisions under YOUR account once they submit. Only regulated (KYC) countries are valid: a country that does not require KYC returns 400. White-label the page with `branding` (your company name, logo, brand color). Supply `redirect_url` to send the …
 * POST /v1/whatsapp/phone-numbers/kyc/share
 */
export function createWhatsAppNumberKycLink(body: { profileId: string; country: string; areaCode?: string; branding?: { companyName?: string; logoUrl?: string; brandColor?: string }; redirect_url?: string }) {
  return zernioCall("POST", "/v1/whatsapp/phone-numbers/kyc/share", undefined, body);
}

/**
 * Deactivate a brand/campaign registration
 * Terminates the campaign with the carrier registry so the recurring monthly campaign fee stops (carriers bill the first 3 months of a campaign regardless). Numbers covered by it can no longer SEND texts — receiving is unaffected — until they're registered under a new brand. Irreversible: a deactivated campaign cannot be restored; texting again later requires a new registration (new one-time and review fees). Idempotent.
 * DELETE /v1/sms/registrations/{id}
 */
export function deactivateSmsRegistration(id: string) {
  return zernioCall("DELETE", `/v1/sms/registrations/${encodeURIComponent(String(id))}`, undefined, undefined);
}

/**
 * Stop watching a country
 * DELETE /v1/phone-numbers/stock-watches/{id}
 */
export function deletePhoneNumberStockWatch(id: string) {
  return zernioCall("DELETE", `/v1/phone-numbers/stock-watches/${encodeURIComponent(String(id))}`, undefined, undefined);
}

/**
 * Delete a SIP trunk
 * Tears down the trunk and its carrier-side objects. Refused while any number is still attached: detach them first.
 * DELETE /v1/phone-numbers/sip-trunks/{id}
 */
export function deleteSipTrunk(id: string) {
  return zernioCall("DELETE", `/v1/phone-numbers/sip-trunks/${encodeURIComponent(String(id))}`, undefined, undefined);
}

/**
 * Delete an alphanumeric sender ID
 * Deactivates the sender ID so it can no longer send. Re-creating the same sender ID via `POST /v1/sms/sender-ids` re-activates it.
 * DELETE /v1/sms/sender-ids/{id}
 */
export function deleteSmsSenderId(id: string) {
  return zernioCall("DELETE", `/v1/sms/sender-ids/${encodeURIComponent(String(id))}`, undefined, undefined);
}

/**
 * Detach a number from its SIP trunk
 * Returns the number's calls to Zernio routing. Idempotent when the number is not attached to any trunk.
 * DELETE /v1/phone-numbers/{id}/sip-trunk
 */
export function detachNumberFromSipTrunk(id: string) {
  return zernioCall("DELETE", `/v1/phone-numbers/${encodeURIComponent(String(id))}/sip-trunk`, undefined, undefined);
}

/**
 * Disable SMS on a number
 * Turns off SMS for the number (deactivates its SMS account). The carrier registration is untouched, so re-enabling later just reactivates it, with no re-registration.
 * DELETE /v1/phone-numbers/{id}/sms
 */
export function disableSmsOnNumber(id: string) {
  return zernioCall("DELETE", `/v1/phone-numbers/${encodeURIComponent(String(id))}/sms`, undefined, undefined);
}

/**
 * Disable phone calling on a number
 * Turns off PSTN calling for the number. The stored forward destination and settings are preserved, so re-enabling restores the prior config.
 * DELETE /v1/phone-numbers/{id}/voice
 */
export function disableVoiceOnNumber(id: string) {
  return zernioCall("DELETE", `/v1/phone-numbers/${encodeURIComponent(String(id))}/voice`, undefined, undefined);
}

/**
 * Disable calling on a number
 * Disable calling. Sends calling.status=DISABLED to Meta (best-effort) and flips the local `callingEnabled` flag off. forwardTo and SIP creds are preserved so a re-enable does not lose the destination.
 * DELETE /v1/phone-numbers/{id}/whatsapp/calling
 */
export function disableWhatsAppCalling(id: string, query: { accountId: string }) {
  return zernioCall("DELETE", `/v1/phone-numbers/${encodeURIComponent(String(id))}/whatsapp/calling`, query, undefined);
}

/**
 * Disable calling on a number
 * Deprecated alias of `/v1/phone-numbers/{id}/whatsapp/calling`; same contract. New integrations should use that path. Disable calling. Sends calling.status=DISABLED to Meta (best-effort) and flips the local `callingEnabled` flag off. forwardTo and SIP creds are preserved so a re-enable does not lose the destination.
 * DELETE /v1/whatsapp/phone-numbers/{id}/calling
 */
export function disableWhatsAppCallingLegacy(id: string, query: { accountId: string }) {
  return zernioCall("DELETE", `/v1/whatsapp/phone-numbers/${encodeURIComponent(String(id))}/calling`, query, undefined);
}

/**
 * Enable SMS on a number
 * Turns on SMS for one of your numbers. The number's real carrier capability is checked first: some number types can't do SMS at all (`smsCapable: false`), and a number still provisioning at the carrier returns `notReady: true` (try again once provisioning finishes). US numbers additionally need a carrier registration before messages deliver; the response tells you which path applies: - `alreadyRegistered: true`: a prior registration still covers this number; SMS was simply reactivated. - `reusable` set: you have an approved registration this number can join in one click via `POST /v1/phone-num…
 * POST /v1/phone-numbers/{id}/sms
 */
export function enableSmsOnNumber(id: string) {
  return zernioCall("POST", `/v1/phone-numbers/${encodeURIComponent(String(id))}/sms`, undefined, undefined);
}

/**
 * Enable phone calling on a number
 * Turns on regular phone (PSTN) calling for one of your numbers and configures how inbound calls are handled. Inbound calls route to `forwardTo`: your own AI voice agent (Vapi/Retell), a phone, or a SIP endpoint. Optional extras: voicemail, business-hours windows, an IVR menu, a caller blocklist, recording, and transcription. A number can also be voice-enabled with no forward (outbound-only). Idempotent, and doubles as the settings update: only fields present in the body are written. Omitting `forwardTo` preserves the current destination; sending an empty string clears it.
 * POST /v1/phone-numbers/{id}/voice
 */
export function enableVoiceOnNumber(id: string, body?: { forwardTo?: string; recordingEnabled?: boolean; transcriptionEnabled?: boolean; transcriptionLanguage?: "auto" | "en" | "es"; voicemailEnabled?: boolean; voicemailGreeting?: string; businessHoursEnabled?: boolean; businessHoursTimezone?: string; businessHours?: { day: number; open: string; close: string }[]; blockedCallers?: string[]; forwardCallerId?: "business" | "caller"; ivrEnabled?: boolean; ivrPrompt?: string; ivrOptions?: { digit: string; forwardTo: string; label?: string }[] }) {
  return zernioCall("POST", `/v1/phone-numbers/${encodeURIComponent(String(id))}/voice`, undefined, body);
}

/**
 * Enable calling on a number
 * Enable WhatsApp Business Calling on a connected number. Configures Meta calling.status=ENABLED with our Telnyx SIP endpoint, fetches and stores the Meta-issued SIP password (encrypted), and snapshots the customer's forward-to destination.
 * POST /v1/phone-numbers/{id}/whatsapp/calling
 */
export function enableWhatsAppCalling(id: string, body: { accountId: string; forwardTo: string; sipAuthUsername?: string; sipAuthPassword?: string; recordingEnabled?: boolean; callIconCountries?: string[]; maxCallDurationSeconds?: number; forwardCallerId?: "business" | "caller" }) {
  return zernioCall("POST", `/v1/phone-numbers/${encodeURIComponent(String(id))}/whatsapp/calling`, undefined, body);
}

/**
 * Enable calling on a number
 * Deprecated alias of `/v1/phone-numbers/{id}/whatsapp/calling`; same contract. New integrations should use that path. Enable WhatsApp Business Calling on a connected number. Configures Meta calling.status=ENABLED with our Telnyx SIP endpoint, fetches and stores the Meta-issued SIP password (encrypted), and snapshots the customer's forward-to destination.
 * POST /v1/whatsapp/phone-numbers/{id}/calling
 */
export function enableWhatsAppCallingLegacy(id: string, body: { accountId: string; forwardTo: string; sipAuthUsername?: string; sipAuthPassword?: string; recordingEnabled?: boolean; callIconCountries?: string[]; maxCallDurationSeconds?: number; forwardCallerId?: "business" | "caller" }) {
  return zernioCall("POST", `/v1/whatsapp/phone-numbers/${encodeURIComponent(String(id))}/calling`, undefined, body);
}

/**
 * Get phone number
 * Retrieve the current status of a purchased phone number. Poll this to track Meta pre-verification (US sync path) and, for regulated (Tier 3/4) numbers, the async lifecycle: pending_regulatory → active (or regulatory_declined). When a regulated number has an Onfido ID step, `onfidoVerificationUrl` appears here once the order is placed — forward it to the end user. (Or subscribe to the whatsapp.number.* webhooks instead of polling.)
 * GET /v1/phone-numbers/{id}
 */
export function getPhoneNumber(id: string) {
  return zernioCall("GET", `/v1/phone-numbers/${encodeURIComponent(String(id))}`, undefined, undefined);
}

/**
 * Get KYC form spec
 * For a Tier 3/4 country, the fields the end customer must provide (Telnyx regulatory requirements) before a number can be ordered: text, date, address, or file (document) per requirement.
 * GET /v1/phone-numbers/kyc
 */
export function getPhoneNumberKycForm(query: { country: string; numberType?: "local" | "mobile" | "national" | "toll_free" }) {
  return zernioCall("GET", "/v1/phone-numbers/kyc", query, undefined);
}

/**
 * A port-in order's pending requirements
 * The live requirements on an EXISTING porting order: which are filled, which are still pending, and which bounced on review (`requirement-info-exception`). Use it to fix and resubmit a rejected international port. Same field shape as the country-level requirements endpoint, plus per-requirement status.
 * GET /v1/phone-numbers/port-in/{id}/requirements
 */
export function getPhoneNumberPortInOrderRequirements(id: string) {
  return zernioCall("GET", `/v1/phone-numbers/port-in/${encodeURIComponent(String(id))}/requirements`, undefined, undefined);
}

/**
 * Country porting requirements
 * The country-specific information a port-in needs BEYOND the LOA, invoice, and account/address details — e.g. an ID copy, proof of address, a tax id, or a porting code. Call it after the portability check (which returns each number's `countryCode` and `phoneNumberType`), render the fields, and pass the collected values as the create request's `requirements`. US/CA return an empty list.
 * GET /v1/phone-numbers/port-in/requirements
 */
export function getPhoneNumberPortInRequirements(query: { country: string; numberType?: "local" | "mobile" | "national" | "toll_free" }) {
  return zernioCall("GET", "/v1/phone-numbers/port-in/requirements", query, undefined);
}

/**
 * Get declined requirements
 * For a number in `regulatory_declined`, returns ONLY the requirements the reviewer flagged declined, as a form spec (same shape as the KYC form GET). The customer fixes just those — Telnyx supports correcting a declined requirement group and re-submitting it (no new number/group). Falls back to the full spec if the provider exposes no per-requirement flags.
 * GET /v1/phone-numbers/{id}/remediate
 */
export function getPhoneNumberRemediation(id: string) {
  return zernioCall("GET", `/v1/phone-numbers/${encodeURIComponent(String(id))}/remediate`, undefined, undefined);
}

/**
 * Get a SIP trunk
 * GET /v1/phone-numbers/sip-trunks/{id}
 */
export function getSipTrunk(id: string) {
  return zernioCall("GET", `/v1/phone-numbers/sip-trunks/${encodeURIComponent(String(id))}`, undefined, undefined);
}

/**
 * Get a carrier registration
 * Poll this for approval progress after starting a registration.
 * GET /v1/sms/registrations/{id}
 */
export function getSmsRegistration(id: string) {
  return zernioCall("GET", `/v1/sms/registrations/${encodeURIComponent(String(id))}`, undefined, undefined);
}

/**
 * Get a verification
 * Current state of a verification. `status` is effective (a pending code past its expiry reads as `expired`). Verification records are deleted 24 hours after creation, after which this returns 404.
 * GET /v1/verify/verifications/{verificationId}
 */
export function getVerification(verificationId: string) {
  return zernioCall("GET", `/v1/verify/verifications/${encodeURIComponent(String(verificationId))}`, undefined, undefined);
}

/**
 * Get calling config for a number
 * The WhatsApp Business Calling configuration of this number, keyed the same way as the POST/PATCH/DELETE below (full read-write on one sub-resource). Encrypted secrets are never returned; only a boolean saying whether a SIP password is stored. The account-scoped read (`GET /v1/whatsapp/calling?accountId=`) remains for callers that only know the social account id, and additionally carries account-level extras (billing eligibility, current-period spend).
 * GET /v1/phone-numbers/{id}/whatsapp/calling
 */
export function getWhatsAppCalling(id: string) {
  return zernioCall("GET", `/v1/phone-numbers/${encodeURIComponent(String(id))}/whatsapp/calling`, undefined, undefined);
}

/**
 * Get KYC form spec
 * Deprecated alias of `/v1/phone-numbers/kyc`; same contract. New integrations should use that path. For a Tier 3/4 country, the fields the end customer must provide (Telnyx regulatory requirements) before a number can be ordered: text, date, address, or file (document) per requirement.
 * GET /v1/whatsapp/phone-numbers/kyc
 */
export function getWhatsAppNumberKycForm(query: { country: string; profileId: string }) {
  return zernioCall("GET", "/v1/whatsapp/phone-numbers/kyc", query, undefined);
}

/**
 * Get declined requirements
 * Deprecated alias of `/v1/phone-numbers/{id}/remediate`; same contract. New integrations should use that path. For a number in `regulatory_declined`, returns ONLY the requirements the reviewer flagged declined, as a form spec (same shape as the KYC form GET). The customer fixes just those — Telnyx supports correcting a declined requirement group and re-submitting it (no new number/group). Falls back to the full spec if the provider exposes no per-requirement flags.
 * GET /v1/whatsapp/phone-numbers/{id}/remediate
 */
export function getWhatsAppNumberRemediation(id: string) {
  return zernioCall("GET", `/v1/whatsapp/phone-numbers/${encodeURIComponent(String(id))}/remediate`, undefined, undefined);
}

/**
 * Get phone number
 * Deprecated alias of `/v1/phone-numbers/{id}`; same contract. New integrations should use that path. Retrieve the current status of a purchased phone number. Poll this to track Meta pre-verification (US sync path) and, for regulated (Tier 3/4) numbers, the async lifecycle: pending_regulatory → active (or regulatory_declined). When a regulated number has an Onfido ID step, `onfidoVerificationUrl` appears here once the order is placed — forward it to the end user. (Or subscribe to the whatsapp.number.* webhooks instead of polling.)
 * GET /v1/whatsapp/phone-numbers/{phoneNumberId}
 */
export function getWhatsAppPhoneNumber(phoneNumberId: string) {
  return zernioCall("GET", `/v1/whatsapp/phone-numbers/${encodeURIComponent(String(phoneNumberId))}`, undefined, undefined);
}

/**
 * List phone numbers
 * Deprecated alias of `/v1/phone-numbers`; same contract. New integrations should use that path. List all WhatsApp phone numbers purchased by the authenticated user. By default, released numbers are excluded. Connected (bring-your-own) numbers are returned in the separate `connected` array — they are not billed and have no provisioning lifecycle.
 * GET /v1/whatsapp/phone-numbers
 */
export function getWhatsAppPhoneNumbers(query?: { status?: "provisioning" | "verifying" | "pending_payment" | "pending_regulatory" | "regulatory_declined" | "active" | "suspended" | "releasing" | "released"; profileId?: string }) {
  return zernioCall("GET", "/v1/whatsapp/phone-numbers", query, undefined);
}

/**
 * List offerable number countries
 * The phone number countries available to purchase, each with its flat monthly price (cents), regulatory tier, whether it needs end-user KYC (Tier 3/4), and per-feature availability (PSTN calls, WhatsApp, SMS, and WhatsApp Business Calling outbound). Drives the country picker. Tier-4 countries appear only when enabled.
 * GET /v1/phone-numbers/countries
 */
export function listPhoneNumberCountries() {
  return zernioCall("GET", "/v1/phone-numbers/countries", undefined, undefined);
}

/**
 * List port-in orders
 * Your porting orders, newest first (max 50). Poll this for port progress: pending, confirmed FOC date, exception reason, or ported.
 * GET /v1/phone-numbers/port-in
 */
export function listPhoneNumberPortIns() {
  return zernioCall("GET", "/v1/phone-numbers/port-in", undefined, undefined);
}

/**
 * List phone numbers
 * List all phone numbers purchased by the authenticated user. By default, released numbers are excluded. Connected (bring-your-own) WhatsApp numbers are returned in the separate `connected` array; they are not billed and have no provisioning lifecycle.
 * GET /v1/phone-numbers
 */
export function listPhoneNumbers(query?: { status?: "provisioning" | "verifying" | "pending_payment" | "pending_regulatory" | "regulatory_declined" | "active" | "suspended" | "releasing" | "released"; profileId?: string }) {
  return zernioCall("GET", "/v1/phone-numbers", query, undefined);
}

/**
 * List stock watches
 * GET /v1/phone-numbers/stock-watches
 */
export function listPhoneNumberStockWatches() {
  return zernioCall("GET", "/v1/phone-numbers/stock-watches", undefined, undefined);
}

/**
 * List SIP trunks
 * GET /v1/phone-numbers/sip-trunks
 */
export function listSipTrunks() {
  return zernioCall("GET", "/v1/phone-numbers/sip-trunks", undefined, undefined);
}

/**
 * List carrier registrations
 * GET /v1/sms/registrations
 */
export function listSmsRegistrations(query?: { includeDeactivated?: boolean }) {
  return zernioCall("GET", "/v1/sms/registrations", query, undefined);
}

/**
 * List alphanumeric sender IDs
 * GET /v1/sms/sender-ids
 */
export function listSmsSenderIds() {
  return zernioCall("GET", "/v1/sms/sender-ids", undefined, undefined);
}

/**
 * List offerable number countries
 * Deprecated alias of `/v1/phone-numbers/countries`; same contract. New integrations should use that path. The WhatsApp number countries available to purchase, each with its flat monthly price (cents), regulatory tier, whether it needs end-user KYC (Tier 3/4), and whether outbound calling is available (not BIC-blocked). Drives the country picker. Tier-4 countries appear only when enabled.
 * GET /v1/whatsapp/phone-numbers/countries
 */
export function listWhatsAppNumberCountries() {
  return zernioCall("GET", "/v1/whatsapp/phone-numbers/countries", undefined, undefined);
}

/**
 * Look up carrier + line type
 * Carrier name and line type (mobile / landline / voip / toll-free) for a number, plus `smsReachable` (landlines can't receive SMS). Use it to validate recipients before sending. Each lookup is billed by the carrier-data provider, so call it explicitly (e.g. pre-validating an opt-in list), not on every send.
 * GET /v1/sms/lookup
 */
export function lookupSmsNumber(query: { number: string }) {
  return zernioCall("GET", "/v1/sms/lookup", query, undefined);
}

/**
 * Move a number to another profile
 * Move a provisioned number to a different profile. A number is not a single record. Alongside the number itself there are hidden telephony owner accounts (platform `phone`, plus `sms` when SMS is enabled) and, once WhatsApp is connected, the `whatsapp` account. They all carry a profileId and this endpoint moves them together. Use this instead of `PATCH /v1/accounts/{accountId}`: that one moves the social account only and leaves the number itself pinned to its original profile, which splits the number across two profiles. Connecting a Zernio-provisioned number from any profile but its own is re…
 * PATCH /v1/whatsapp/phone-numbers/{id}/profile
 */
export function moveWhatsAppNumberToProfile(id: string, body: { profileId: string }) {
  return zernioCall("PATCH", `/v1/whatsapp/phone-numbers/${encodeURIComponent(String(id))}/profile`, undefined, body);
}

/**
 * Pre-check a carrier registration
 * Dry-run of `POST /v1/sms/registrations` for 10DLC: validates and composes the exact brand/campaign payloads a submission would store (branding, disclosures, auto-replies), runs deterministic compliance lints plus an AI reviewer over them, and returns the findings WITHOUT creating anything. Use it to fix issues before submitting; `block` severity findings indicate a near-certain carrier rejection.
 * POST /v1/sms/registrations/preflight
 */
export function preflightSmsRegistration(body: { registrationType: "standard_10dlc" | "sole_prop_10dlc"; phoneNumbers?: string[]; brand: Record<string, unknown>; campaign: Record<string, unknown>; messagingBrandName?: string }) {
  return zernioCall("POST", "/v1/sms/registrations/preflight", undefined, body);
}

/**
 * Purchase phone number
 * Payment-first: you do not pick a specific number, the system provisions one and auto-assigns it. With usage-based billing active and a payment method on file, the number provisions inline and bills per month on your usage-based invoice (there is no checkout redirect). No payment method on file returns `402 PAYMENT_REQUIRED`; a regulated country returns `202` with `status: "kyc_required"` and a `kycUrl`. Requires usage-based billing (the Usage plan). The maximum number of phone numbers is determined by the user's plan.
 * POST /v1/phone-numbers/purchase
 */
export function purchasePhoneNumber(body: { profileId: string; country?: string; numberType?: "local" | "mobile" | "national" | "toll_free"; areaCode?: string; connectWhatsapp?: boolean; wantsSms?: boolean; wantsWhatsapp?: boolean; purchaseIntentId?: string; allowMultiple?: boolean }) {
  return zernioCall("POST", "/v1/phone-numbers/purchase", undefined, body);
}

/**
 * Purchase phone number
 * Deprecated alias of `/v1/phone-numbers/purchase`; same contract. New integrations should use that path. Payment-first: you do not pick a specific number, the system provisions one and auto-assigns it. With usage-based billing active and a payment method on file, the number provisions inline and bills per month on your usage-based invoice (there is no checkout redirect). No payment method on file returns `402 PAYMENT_REQUIRED`; a regulated country returns `202` with `status: "kyc_required"` and a `kycUrl`. Requires usage-based billing (the Usage plan). The maximum number of phone numbers is de…
 * POST /v1/whatsapp/phone-numbers/purchase
 */
export function purchaseWhatsAppPhoneNumber(body: { profileId: string; country?: string; purchaseIntentId?: string; allowMultiple?: boolean }) {
  return zernioCall("POST", "/v1/whatsapp/phone-numbers/purchase", undefined, body);
}

/**
 * Release phone number
 * Release a purchased phone number. This will: 1. Disconnect any linked WhatsApp social account 2. Decrement the Stripe subscription quantity (or cancel if last number) 3. Release the number from Telnyx 4. Mark the number as released
 * DELETE /v1/phone-numbers/{id}
 */
export function releasePhoneNumber(id: string) {
  return zernioCall("DELETE", `/v1/phone-numbers/${encodeURIComponent(String(id))}`, undefined, undefined);
}

/**
 * Release phone number
 * Deprecated alias of `/v1/phone-numbers/{id}`; same contract. New integrations should use that path. Release a purchased phone number. This will: 1. Disconnect any linked WhatsApp social account 2. Decrement the Stripe subscription quantity (or cancel if last number) 3. Release the number from Telnyx 4. Mark the number as released
 * DELETE /v1/whatsapp/phone-numbers/{phoneNumberId}
 */
export function releaseWhatsAppPhoneNumber(phoneNumberId: string) {
  return zernioCall("DELETE", `/v1/whatsapp/phone-numbers/${encodeURIComponent(String(phoneNumberId))}`, undefined, undefined);
}

/**
 * Resubmit a declined number
 * Submit corrected values/documents for the declined requirement(s). We PATCH them onto the SAME requirement group and re-submit it for approval; the number goes `regulatory_declined` → `pending_regulatory`. No new number and no new billing. Body shape matches the KYC submit (values / documents / address) — send only the corrected fields.
 * POST /v1/phone-numbers/{id}/remediate
 */
export function remediatePhoneNumber(id: string, body: { values?: Record<string, unknown>; documents?: unknown[]; address?: Record<string, unknown> }) {
  return zernioCall("POST", `/v1/phone-numbers/${encodeURIComponent(String(id))}/remediate`, undefined, body);
}

/**
 * Resubmit a declined number
 * Deprecated alias of `/v1/phone-numbers/{id}/remediate`; same contract. New integrations should use that path. Submit corrected values/documents for the declined requirement(s). We PATCH them onto the SAME requirement group and re-submit it for approval; the number goes `regulatory_declined` → `pending_regulatory`. No new number and no new billing. Body shape matches the KYC submit (values / documents / address) — send only the corrected fields.
 * POST /v1/whatsapp/phone-numbers/{id}/remediate
 */
export function remediateWhatsAppNumber(id: string, body: { values?: Record<string, unknown>; documents?: unknown[]; address?: Record<string, unknown> }) {
  return zernioCall("POST", `/v1/whatsapp/phone-numbers/${encodeURIComponent(String(id))}/remediate`, undefined, body);
}

/**
 * Reply to the regulatory reviewer
 * Post a free-text reply (with optional file attachments) to the reviewer on a number awaiting remediation — for asks the structured form can't express (e.g. "is this personal or business?"). Attachments are stored by us and their links are added to the reviewer's comment thread (the carrier's number order takes no loose files). A reply to a comment-style ask moves the number back to "in review"; a reply on a formal decline is supplementary and you must still resubmit the fix. Requires text or at least one attachment.
 * POST /v1/phone-numbers/{id}/remediate/reply
 */
export function replyToPhoneNumberReviewer(id: string, body: { text?: string; attachments?: { filename: string; base64: string }[] }) {
  return zernioCall("POST", `/v1/phone-numbers/${encodeURIComponent(String(id))}/remediate/reply`, undefined, body);
}

/**
 * Request a higher sender ID daily limit
 * Asks support to raise the workspace's daily sender-ID message cap. There is no self-serve raise: the request (desired cap + use case) is reviewed manually, usually within a business day.
 * POST /v1/sms/sender-ids/limit-request
 */
export function requestSmsSenderIdLimitIncrease(body: { requestedCap: number; reason: string }) {
  return zernioCall("POST", "/v1/sms/sender-ids/limit-request", undefined, body);
}

/**
 * Re-send the sole-prop OTP
 * Re-sends the sole-proprietor verification PIN to the brand's mobile number — use it when the original code expired or never arrived. Only valid while the registration is pending and awaiting its OTP; rate limited to one send per minute.
 * POST /v1/sms/registrations/{id}/resend-otp
 */
export function resendSmsRegistrationOtp(id: string) {
  return zernioCall("POST", `/v1/sms/registrations/${encodeURIComponent(String(id))}/resend-otp`, undefined, undefined);
}

/**
 * Respond to the regulatory reviewer (message + corrections)
 * Send a single response to the reviewer on a number awaiting remediation: a free-text message and/or corrected requirement documents, in one call. If corrections are present they are PATCHed onto the requirement group and re-submitted (the number goes back to "in review"); if a message or file attachments are present they are posted to the reviewer's comment thread. When both are present, your message is the thread comment and the resubmit drives the state change. At least one of message, corrections, or attachments is required. `documents` correct requirement slots; `attachments` are loose fi…
 * POST /v1/phone-numbers/{id}/remediate/respond
 */
export function respondToPhoneNumberReviewer(id: string, body: { message?: string; documents?: { requirementId: string; filename?: string; base64?: string; documentId?: string }[]; address?: Record<string, unknown>; entityType?: "individual" | "business" | null; attachments?: { filename: string; base64: string }[] }) {
  return zernioCall("POST", `/v1/phone-numbers/${encodeURIComponent(String(id))}/remediate/respond`, undefined, body);
}

/**
 * Reply to a change request
 * Replies to a reviewer change request on a registration in `changes_requested` state: a note, hosted document URLs (from `POST /v1/sms/opt-in-proof`), or both, sent together. The registration returns to `requested` (back in review) — no need to resubmit the whole registration. To change the submitted brand/campaign fields themselves, resubmit via `POST /v1/sms/registrations` with `resubmitRequestId` instead.
 * POST /v1/sms/registrations/{id}/respond
 */
export function respondToSmsRegistrationReview(id: string, body: { note?: string; files?: string[] }) {
  return zernioCall("POST", `/v1/sms/registrations/${encodeURIComponent(String(id))}/respond`, undefined, body);
}

/**
 * Add number to SMS registration
 * Attaches this number to your existing approved 10DLC campaign instead of running a fresh registration: the number inherits the campaign's approval (no new brand or campaign, no extra carrier fee). Enable SMS on the number first (`POST /v1/phone-numbers/{id}/sms`; its response tells you whether a reusable registration exists).
 * POST /v1/phone-numbers/{id}/sms/reuse-registration
 */
export function reuseSmsRegistrationForNumber(id: string) {
  return zernioCall("POST", `/v1/phone-numbers/${encodeURIComponent(String(id))}/sms/reuse-registration`, undefined, undefined);
}

/**
 * Pre-review a KYC packet
 * Advisory dry-run of a regulated-KYC packet before submitting: reviews the exact documents the regulator will see (referenced by the ids from POST /v1/phone-numbers/kyc/upload-document) against the declared values and address, and returns plain-language advisories for likely decline reasons (wrong document type, mismatched address, one-sided ID scans). Non-blocking: advisories are warnings, submitting anyway is always allowed, and any review failure degrades to an empty list.
 * POST /v1/phone-numbers/kyc/review-packet
 */
export function reviewPhoneNumberKycPacket(body: { country: string; numberType: string; values?: Record<string, unknown>; address?: Record<string, unknown>; docs: { requirementId: string; documentId: string }[] }) {
  return zernioCall("POST", "/v1/phone-numbers/kyc/review-packet", undefined, body);
}

/**
 * Rotate a SIP trunk's password
 * Mints a new digest password on the trunk. The old password stops working immediately, so update the destination platform right away.
 * POST /v1/phone-numbers/sip-trunks/{id}/rotate-credentials
 */
export function rotateSipTrunkCredentials(id: string) {
  return zernioCall("POST", `/v1/phone-numbers/sip-trunks/${encodeURIComponent(String(id))}/rotate-credentials`, undefined, undefined);
}

/**
 * Search available numbers
 * Search the provider's inventory for numbers available to purchase in a country (default US). Optional filters narrow the results. The country must be offerable (see GET /v1/phone-numbers/countries). Voice capability is always required; pass `sms=true` to only see numbers that can also text (SMS support is per-number, not per-country).
 * GET /v1/phone-numbers/available
 */
export function searchAvailablePhoneNumbers(query?: { country?: string; type?: string; prefix?: string; locality?: string; contains?: string; sms?: boolean; limit?: number }) {
  return zernioCall("GET", "/v1/phone-numbers/available", query, undefined);
}

/**
 * Search available numbers
 * Deprecated alias of `/v1/phone-numbers/available`; same contract. New integrations should use that path. Search the provider's inventory for numbers available to purchase in a country (default US). Optional filters narrow the results. The country must be offerable (see GET /v1/whatsapp/phone-numbers/countries).
 * GET /v1/whatsapp/phone-numbers/available
 */
export function searchAvailableWhatsAppNumbers(query?: { country?: string; type?: string; prefix?: string; locality?: string; contains?: string; limit?: number }) {
  return zernioCall("GET", "/v1/whatsapp/phone-numbers/available", query, undefined);
}

/**
 * Create a registration share link
 * Creates a single-use, expiring link (valid 7 days) that lets someone else (whoever has the legal business details) fill in the carrier registration form for one of your numbers, without a Zernio login. The registration is created under your account once the form is submitted.
 * POST /v1/sms/registrations/share
 */
export function shareSmsRegistration(body: { numberId: string }) {
  return zernioCall("POST", "/v1/sms/registrations/share", undefined, body);
}

/**
 * Start a carrier registration
 * Starts the US carrier registration that a number needs before SMS delivers: 10DLC (standard company or sole-proprietor) or toll-free verification. 10DLC needs `brand` + `campaign`; toll-free needs `tollFree`. Approval is asynchronous; poll `GET /v1/sms/registrations/{id}` (sole-prop registrations first need the OTP step: a code is texted to the brand's mobile number, submit it via `/verify-otp`). Already have an approved registration? Add another number to it with `POST /v1/phone-numbers/{id}/sms/reuse-registration` instead of registering (and paying the carrier brand fee) again. Rather have …
 * POST /v1/sms/registrations
 */
export function startSmsRegistration(body: { registrationType: "standard_10dlc" | "sole_prop_10dlc" | "toll_free"; phoneNumbers?: string[]; brand?: { entityType: "PRIVATE_PROFIT" | "PUBLIC_PROFIT" | "NON_PROFIT" | "GOVERNMENT" | "SOLE_PROPRIETOR"; displayName: string; companyName?: string; ein?: string; phone?: string; mobilePhone?: string; street: string; city: string; state: string; postalCode: string; country: string; email?: string; website: string; vertical: "AGRICULTURE" | "COMMUNICATION" | "CONSTRUCTION" | "EDUCATION" | "ENERGY" | "ENTERTAINMENT" | "FINANCIAL" | "GAMBLING" | "GOVERNMENT" | "HEALTHCARE" | "HOSPITALITY" | "HUMAN_RESOURCES" | "INSURANCE" | "LEGAL" | "MANUFACTURING" | "NGO" | "POLITICAL" | "POSTAL" | "PROFESSIONAL" | "REAL_ESTATE" | "RETAIL" | "TECHNOLOGY" | "TRANSPORTATION"; stockSymbol?: string }; campaign?: { usecase: string; subUsecases?: ("2FA" | "ACCOUNT_NOTIFICATION" | "CUSTOMER_CARE" | "DELIVERY_NOTIFICATION" | "FRAUD_ALERT" | "HIGHER_EDUCATION" | "MARKETING" | "POLLING_VOTING" | "PUBLIC_SERVICE_ANNOUNCEMENT" | "SECURITY_ALERT")[]; description: string; messageFlow: string; sample1: string; sample2: string; helpMessage?: string; optinKeywords: string; optinMessage?: string; optoutKeywords: string; optoutMessage?: string; helpKeywords: string; embeddedLink?: boolean; embeddedPhone?: boolean; numberPool?: boolean; ageGated?: boolean; directLending?: boolean; privacyPolicyLink?: string; termsAndConditionsLink?: string }; messagingBrandName?: string; wizardValues?: Record<string, unknown>; resubmitRequestId?: string; tollFree?: { businessName: string; corporateWebsite: string; phoneNumbers: string[]; useCase: string; useCaseSummary: string; productionMessageContent: string; optInWorkflow: string; optInWorkflowImageUrls: string[]; messageVolume: "10" | "100" | "1,000" | "10,000" | "100,000" | "250,000" | "500,000" | "750,000" | "1,000,000" | "5,000,000" | "10,000,000+"; additionalInformation: string; businessAddr1: string; businessAddr2?: string; businessCity: string; businessState: string; businessZip: string; businessContactFirstName: string; businessContactLastName: string; businessContactEmail: string; businessContactPhone: string; businessRegistrationNumber: string; businessRegistrationType: string; businessRegistrationCountry: string } }) {
  return zernioCall("POST", "/v1/sms/registrations", undefined, body);
}

/**
 * Start caller-ID verification for a customer-brought number
 * Customer-brought (BYO) WhatsApp numbers cannot present themselves as caller ID on `tel:` call forwards until verified (carrier anti-spoofing); until then forwarded calls show a Zernio number (`callerIdMode: platform` on the calling config). This sends a one-time code to the number by SMS or voice call. Re-POST to resend. Zernio-purchased numbers never need this and get a 400.
 * POST /v1/phone-numbers/{id}/whatsapp/caller-id-verification
 */
export function startWhatsAppCallerIdVerification(id: string, body?: { method?: "sms" | "call" }) {
  return zernioCall("POST", `/v1/phone-numbers/${encodeURIComponent(String(id))}/whatsapp/caller-id-verification`, undefined, body);
}

/**
 * Submit KYC
 * Submit the end customer's KYC (textual values, uploaded documents, address) for a Tier 3/4 country. Documents are streamed straight to the number provider and are not stored by Zernio. Builds + submits a regulatory requirement group and claims a pending_regulatory slot; the number is ordered + activated once the provider approves (asynchronous). A customer may hold several same-country numbers in review at once; a double-submit of the SAME attempt is deduped via `submissionId`. For an ID-card document requirement, carriers commonly require BOTH sides: combine the front and back into a single …
 * POST /v1/phone-numbers/kyc
 */
export function submitPhoneNumberKyc(body: { profileId: string; country: string; submissionId?: string; quantity?: number; reuse?: boolean; reuseOptionId?: string; reuseFrom?: string; areaCode?: string; endUserFirstName?: string; endUserLastName?: string; values?: Record<string, unknown>; documents?: unknown[]; address?: { requirementId?: string; country_code?: string; business_name?: string; first_name?: string; last_name?: string; street_address?: string; extended_address?: string; locality?: string; administrative_area?: string; postal_code?: string } }) {
  return zernioCall("POST", "/v1/phone-numbers/kyc", undefined, body);
}

/**
 * Submit KYC
 * Deprecated alias of `/v1/phone-numbers/kyc`; same contract. New integrations should use that path. Submit the end customer's KYC (textual values, uploaded documents, address) for a Tier 3/4 country. Documents are streamed straight to the number provider and are not stored by Zernio. Builds + submits a regulatory requirement group and claims a pending_regulatory slot; the number is ordered + activated once the provider approves (asynchronous). A customer may hold several same-country numbers in review at once; a double-submit of the SAME attempt is deduped via `submissionId`. For an ID-card do…
 * POST /v1/whatsapp/phone-numbers/kyc
 */
export function submitWhatsAppNumberKyc(body: { profileId: string; country: string; submissionId?: string; quantity?: number; reuse?: boolean; reuseOptionId?: string; reuseFrom?: string; areaCode?: string; endUserFirstName?: string; endUserLastName?: string; values?: Record<string, unknown>; documents?: unknown[]; address?: { requirementId?: string; country_code?: string; business_name?: string; first_name?: string; last_name?: string; street_address?: string; extended_address?: string; locality?: string; administrative_area?: string; postal_code?: string } }) {
  return zernioCall("POST", "/v1/whatsapp/phone-numbers/kyc", undefined, body);
}

/**
 * Update calling config
 * Update fields on an already-enabled number. Only fields present in the body are written; `undefined` leaves the stored value alone, explicit `null` clears a nullable field. No Meta side effect, this only changes local routing state consumed by the Telnyx webhook handler.
 * PATCH /v1/phone-numbers/{id}/whatsapp/calling
 */
export function updateWhatsAppCalling(id: string, body: { accountId: string; forwardTo?: string; sipAuthUsername?: unknown; sipAuthPassword?: unknown; recordingEnabled?: boolean; callIconCountries?: unknown; maxCallDurationSeconds?: unknown; forwardCallerId?: "business" | "caller" }) {
  return zernioCall("PATCH", `/v1/phone-numbers/${encodeURIComponent(String(id))}/whatsapp/calling`, undefined, body);
}

/**
 * Update calling config
 * Deprecated alias of `/v1/phone-numbers/{id}/whatsapp/calling`; same contract. New integrations should use that path. Update fields on an already-enabled number. Only fields present in the body are written; `undefined` leaves the stored value alone, explicit `null` clears a nullable field. No Meta side effect, this only changes local routing state consumed by the Telnyx webhook handler.
 * PATCH /v1/whatsapp/phone-numbers/{id}/calling
 */
export function updateWhatsAppCallingLegacy(id: string, body: { accountId: string; forwardTo?: string; sipAuthUsername?: unknown; sipAuthPassword?: unknown; recordingEnabled?: boolean; callIconCountries?: unknown; maxCallDurationSeconds?: unknown; forwardCallerId?: "business" | "caller" }) {
  return zernioCall("PATCH", `/v1/whatsapp/phone-numbers/${encodeURIComponent(String(id))}/calling`, undefined, body);
}

/**
 * Upload a KYC document
 * Upload ONE document and get back its provider document id, to reference from POST /v1/phone-numbers/kyc via `documents[].documentId`. Send the RAW file bytes as the request body (not base64); put the filename in the `X-Filename` header. Uploading documents one-per-request keeps each request under the ~4.5MB body limit. The document streams straight to the number provider and is not stored by Zernio.
 * POST /v1/phone-numbers/kyc/upload-document
 */
export function uploadPhoneNumberKycDocument() {
  return zernioCall("POST", "/v1/phone-numbers/kyc/upload-document", undefined, undefined);
}

/**
 * Upload a porting document
 * Upload ONE porting document and get back its `documentId`. For the signed LOA / carrier invoice the id goes to `loaDocumentId` / `invoiceDocumentId`; for a country-specific document requirement (international ports) it becomes that requirement's `fieldValue`. Requirement documents are normalized to PDF automatically (regulators reject raw images). PDF, JPEG, or PNG, 10MB max. Uploads must be attached to an order within 30 minutes or the carrier deletes them.
 * POST /v1/phone-numbers/port-in/documents
 */
export function uploadPhoneNumberPortInDocument(body: FormData) {
  return zernioCall("POST", "/v1/phone-numbers/port-in/documents", undefined, body);
}

/**
 * Upload a KYC document
 * Deprecated alias of `/v1/phone-numbers/kyc/upload-document`; same contract. New integrations should use that path. Upload ONE document and get back its provider document id, to reference from POST /v1/whatsapp/phone-numbers/kyc via `documents[].documentId`. Send the RAW file bytes as the request body (not base64); put the filename in the `X-Filename` header. Uploading documents one-per-request keeps each request under the ~4.5MB body limit. The document streams straight to the number provider and is not stored by Zernio.
 * POST /v1/whatsapp/phone-numbers/kyc/upload-document
 */
export function uploadWhatsAppNumberKycDocument() {
  return zernioCall("POST", "/v1/whatsapp/phone-numbers/kyc/upload-document", undefined, undefined);
}

/**
 * Pre-validate KYC address
 * Optional early check for the address step of a Tier 4 (end-user identity) registration: validates a postal address for deliverability BEFORE the full KYC submit, so it can be corrected before any documents are uploaded. The full submit (POST /v1/phone-numbers/kyc) re-validates the address, so this call is purely a fast feedback path and skipping it is safe. Only the postal address is sent (no documents, no gov-ID fields). A region (`administrative_area`) is required by the validator; when it is omitted the pre-check is skipped and `{ ok: true, skipped: true }` is returned (the final submit st…
 * POST /v1/phone-numbers/kyc/validate-address
 */
export function validatePhoneNumberKycAddress(body: { country: string; street_address: string; extended_address?: string; locality: string; administrative_area?: string; postal_code: string }) {
  return zernioCall("POST", "/v1/phone-numbers/kyc/validate-address", undefined, body);
}

/**
 * Pre-validate KYC address
 * Deprecated alias of `/v1/phone-numbers/kyc/validate-address`; same contract. New integrations should use that path. Optional early check for the address step of a Tier 4 (end-user identity) registration: validates a postal address for deliverability BEFORE the full KYC submit, so it can be corrected before any documents are uploaded. The full submit (POST /v1/whatsapp/phone-numbers/kyc) re-validates the address, so this call is purely a fast feedback path and skipping it is safe. Only the postal address is sent (no documents, no gov-ID fields). A region (`administrative_area`) is required by …
 * POST /v1/whatsapp/phone-numbers/kyc/validate-address
 */
export function validateWhatsAppNumberKycAddress(body: { country: string; street_address: string; extended_address?: string; locality: string; administrative_area?: string; postal_code: string }) {
  return zernioCall("POST", "/v1/whatsapp/phone-numbers/kyc/validate-address", undefined, body);
}

/**
 * Submit the sole-prop OTP
 * Completes sole-proprietor 10DLC brand verification by submitting the one-time PIN texted to the brand's mobile number. On success the registration continues to campaign creation automatically.
 * POST /v1/sms/registrations/{id}/verify-otp
 */
export function verifySmsRegistrationOtp(id: string, body: { otpPin: string }) {
  return zernioCall("POST", `/v1/sms/registrations/${encodeURIComponent(String(id))}/verify-otp`, undefined, body);
}

/**
 * Confirm the caller-ID verification code
 * Submits the one-time code the number received. On success, `tel:` call forwards present the business number itself as caller ID (`callerIdMode: business`).
 * POST /v1/phone-numbers/{id}/whatsapp/caller-id-verification/verify
 */
export function verifyWhatsAppCallerId(id: string, body: { code: string }) {
  return zernioCall("POST", `/v1/phone-numbers/${encodeURIComponent(String(id))}/whatsapp/caller-id-verification/verify`, undefined, body);
}

/**
 * View a KYC document on file
 * Stream a document backing a reusable verification (the `documentId` values from GET /v1/phone-numbers/kyc `reusable.options[].details[]`), so the account holder can see what's on file before reusing it. Returned inline as `application/pdf` (uploads are normalized to PDF). Auth-scoped: a document is viewable only when its id is referenced by one of the caller's own numbers — otherwise `404`.
 * GET /v1/phone-numbers/kyc/document/{documentId}
 */
export function viewPhoneNumberKycDocument(documentId: string) {
  return zernioCall("GET", `/v1/phone-numbers/kyc/document/${encodeURIComponent(String(documentId))}`, undefined, undefined);
}


/* ======================================================================
 * webhooks — 6 operations
 * ====================================================================== */

/**
 * Create webhook
 * Create a new webhook configuration. Maximum 50 webhooks per user. `name`, `url` and `events` are required. `url` must be a valid URL and `events` must contain at least one event. Whitespace is trimmed from `url` before validation. Webhooks are automatically disabled after 10 consecutive delivery failures. A restricted (zrk_) API key can only subscribe to events whose resource group the key holds; an event outside the key's groups is rejected with 403, so a restricted key can never create a subscription broader than itself. `disabledResourceGroups` restricts the subscription itself, independen…
 * POST /v1/webhooks/settings
 */
export function createWebhookSettings(body: { name: string; url: string; secret?: string; events: ("post.scheduled" | "post.published" | "post.failed" | "post.partial" | "post.cancelled" | "post.recycled" | "post.platform.published" | "post.platform.failed" | "post.platform.deleted" | "post.tiktok.url_resolved" | "post.external.created" | "post.external.updated" | "post.external.deleted" | "account.connected" | "account.disconnected" | "account.ads.initial_sync_completed" | "message.received" | "conversation.started" | "call.received" | "call.ended" | "call.failed" | "call.permission_request" | "message.sent" | "message.edited" | "message.deleted" | "message.delivered" | "message.read" | "message.failed" | "reaction.received" | "referral.received" | "comment.received" | "review.new" | "review.updated" | "lead.received" | "ad.status_changed" | "whatsapp.template.status_updated" | "whatsapp.template.category_updated" | "whatsapp.account.name_status_updated" | "whatsapp.automatic_event" | "whatsapp.number.activated" | "whatsapp.number.declined" | "whatsapp.number.action_required" | "whatsapp.number.verification_required" | "whatsapp.number.suspended" | "whatsapp.number.reactivated" | "whatsapp.number.released" | "whatsapp.number.kyc_submitted" | "phone_number.stock_available" | "verification.approved" | "verification.failed")[]; isActive?: boolean; customHeaders?: Record<string, unknown>; disabledResourceGroups?: ("publishing" | "engagement" | "messages" | "contacts" | "analytics" | "ads" | "telephony" | "accounts" | "billing" | "webhooks")[] }) {
  return zernioCall("POST", "/v1/webhooks/settings", undefined, body);
}

/**
 * Delete webhook
 * Permanently delete a webhook configuration.
 * DELETE /v1/webhooks/settings
 */
export function deleteWebhookSettings(query: { id: string }) {
  return zernioCall("DELETE", "/v1/webhooks/settings", query, undefined);
}

/**
 * List webhook delivery logs
 * Retrieve recorded webhook delivery attempts for the authenticated user, most recent first. Logs are retained for 30 days. Supports filtering by status, event type, webhook ID, and event ID, plus offset-based pagination. For a restricted (zrk_) API key, rows for events outside the key's resource groups are omitted (`pagination.total` may over-count), and an `event` filter naming such an event is rejected with 403. Events blocked by a subscription's own `disabledResourceGroups` are dropped before delivery, so they produce no log rows for anyone; the exception is the five-minute tail after a den…
 * GET /v1/webhooks/logs
 */
export function getWebhookLogs(query?: { limit?: number; skip?: number; status?: "success" | "failed"; event?: string; webhookId?: string; eventId?: string }) {
  return zernioCall("GET", "/v1/webhooks/logs", query, undefined);
}

/**
 * List webhooks
 * Retrieve all configured webhooks for the authenticated user. Supports up to 50 webhooks per user.
 * GET /v1/webhooks/settings
 */
export function getWebhookSettings() {
  return zernioCall("GET", "/v1/webhooks/settings", undefined, undefined);
}

/**
 * Send test webhook
 * Send a test webhook to verify your endpoint is configured correctly. The test payload includes event: "webhook.test" to distinguish it from real events. `webhook.test` belongs to the `webhooks` resource group, so a key with that group disabled is rejected with 403, as is a test fire on a subscription that lists `webhooks` in its own `disabledResourceGroups` (a 403, not a reported delivery failure). Replays of real events (redelivery, dead-letter requeue) run the same checks as live delivery, against both the key's groups and the subscription's.
 * POST /v1/webhooks/test
 */
export function testWebhook(body: { webhookId: string }) {
  return zernioCall("POST", "/v1/webhooks/test", undefined, body);
}

/**
 * Update webhook
 * Update an existing webhook configuration. All fields except `_id` are optional; only provided fields will be updated. When provided, `name` must be 1-50 characters, `url` must be a valid URL, and `events` must contain at least one event. Whitespace is trimmed from `url` before validation. Webhooks are automatically disabled after 10 consecutive delivery failures. A restricted (zrk_) API key can only set `events` to events whose resource group the key holds; an event outside the key's groups is rejected with 403. It also cannot widen an existing subscription past its own groups. `disabledResou…
 * PUT /v1/webhooks/settings
 */
export function updateWebhookSettings(body: { _id: string; name?: string; url?: string; secret?: string; events?: ("post.scheduled" | "post.published" | "post.failed" | "post.partial" | "post.cancelled" | "post.recycled" | "post.platform.published" | "post.platform.failed" | "post.platform.deleted" | "post.tiktok.url_resolved" | "post.external.created" | "post.external.updated" | "post.external.deleted" | "account.connected" | "account.disconnected" | "account.ads.initial_sync_completed" | "message.received" | "conversation.started" | "call.received" | "call.ended" | "call.failed" | "call.permission_request" | "message.sent" | "message.edited" | "message.deleted" | "message.delivered" | "message.read" | "message.failed" | "reaction.received" | "referral.received" | "comment.received" | "review.new" | "review.updated" | "lead.received" | "ad.status_changed" | "whatsapp.template.status_updated" | "whatsapp.template.category_updated" | "whatsapp.account.name_status_updated" | "whatsapp.automatic_event" | "whatsapp.number.activated" | "whatsapp.number.declined" | "whatsapp.number.action_required" | "whatsapp.number.verification_required" | "whatsapp.number.suspended" | "whatsapp.number.reactivated" | "whatsapp.number.released" | "whatsapp.number.kyc_submitted" | "phone_number.stock_available" | "verification.approved" | "verification.failed")[]; isActive?: boolean; customHeaders?: Record<string, unknown>; disabledResourceGroups?: ("publishing" | "engagement" | "messages" | "contacts" | "analytics" | "ads" | "telephony" | "accounts" | "billing" | "webhooks")[] }) {
  return zernioCall("PUT", "/v1/webhooks/settings", undefined, body);
}


/** Every operation, for the generic proxy and for the self-test. */
export const ZERNIO_OPERATIONS = [
  {
    "id": "activateWorkflow",
    "name": "activateWorkflow",
    "method": "POST",
    "path": "/v1/workflows/{workflowId}/activate",
    "group": "accounts",
    "platforms": null,
    "summary": "Activate workflow",
    "pathParams": [
      "workflowId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "assignGoogleBusinessLocation",
    "name": "assignGoogleBusinessLocation",
    "method": "POST",
    "path": "/v1/accounts/{accountId}/gmb-locations/assign",
    "group": "accounts",
    "platforms": null,
    "summary": "Assign GBP location to another profile",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "completeGoogleBusinessVerification",
    "name": "completeGoogleBusinessVerification",
    "method": "POST",
    "path": "/v1/accounts/{accountId}/gmb-verifications/{verificationId}/complete",
    "group": "accounts",
    "platforms": null,
    "summary": "Complete a verification",
    "pathParams": [
      "accountId",
      "verificationId"
    ],
    "query": [
      {
        "name": "locationId",
        "required": false
      }
    ],
    "hasBody": true
  },
  {
    "id": "completeTelegramConnect",
    "name": "completeTelegramConnect",
    "method": "PATCH",
    "path": "/v1/connect/telegram",
    "group": "accounts",
    "platforms": null,
    "summary": "Check Telegram status",
    "pathParams": [],
    "query": [
      {
        "name": "code",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "completeWhatsAppPhoneSelection",
    "name": "completeWhatsAppPhoneSelection",
    "method": "POST",
    "path": "/v1/connect/whatsapp/select-phone-number",
    "group": "accounts",
    "platforms": null,
    "summary": "Complete number selection",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "configureTikTokAdsBrandIdentity",
    "name": "configureTikTokAdsBrandIdentity",
    "method": "PATCH",
    "path": "/v1/connect/tiktok-ads",
    "group": "accounts",
    "platforms": null,
    "summary": "Set TikTok brand identity",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "connectAds",
    "name": "connectAds",
    "method": "GET",
    "path": "/v1/connect/{platform}/ads",
    "group": "accounts",
    "platforms": null,
    "summary": "Connect ads for a platform",
    "pathParams": [
      "platform"
    ],
    "query": [
      {
        "name": "profileId",
        "required": true
      },
      {
        "name": "accountId",
        "required": false
      },
      {
        "name": "redirect_url",
        "required": false
      },
      {
        "name": "headless",
        "required": false
      },
      {
        "name": "force",
        "required": false
      },
      {
        "name": "adAccountId",
        "required": false
      },
      {
        "name": "adAccountIds",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "connectBlueskyCredentials",
    "name": "connectBlueskyCredentials",
    "method": "POST",
    "path": "/v1/connect/bluesky/credentials",
    "group": "accounts",
    "platforms": null,
    "summary": "Connect Bluesky account",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "connectDiscordChannel",
    "name": "connectDiscordChannel",
    "method": "POST",
    "path": "/v1/connect/discord",
    "group": "accounts",
    "platforms": null,
    "summary": "Connect a Discord channel",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "connectOpenAIAdsCredentials",
    "name": "connectOpenAIAdsCredentials",
    "method": "POST",
    "path": "/v1/connect/openai-ads/credentials",
    "group": "accounts",
    "platforms": null,
    "summary": "Connect an OpenAI Ads account",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "connectShopifyWithToken",
    "name": "connectShopifyWithToken",
    "method": "POST",
    "path": "/v1/connect/shopify/token",
    "group": "accounts",
    "platforms": null,
    "summary": "Connect a Shopify store with a custom-app Admin token",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "connectSlackChannel",
    "name": "connectSlackChannel",
    "method": "POST",
    "path": "/v1/connect/slack",
    "group": "accounts",
    "platforms": null,
    "summary": "Connect a Slack channel",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "connectWhatsAppCredentials",
    "name": "connectWhatsAppCredentials",
    "method": "POST",
    "path": "/v1/connect/whatsapp/credentials",
    "group": "accounts",
    "platforms": null,
    "summary": "Connect WhatsApp via credentials",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "connectWhatsAppEmbeddedSignup",
    "name": "connectWhatsAppEmbeddedSignup",
    "method": "POST",
    "path": "/v1/connect/whatsapp/embedded-signup",
    "group": "accounts",
    "platforms": null,
    "summary": "Connect WhatsApp from Embedded Signup",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "createAccountGroup",
    "name": "createAccountGroup",
    "method": "POST",
    "path": "/v1/account-groups",
    "group": "accounts",
    "platforms": null,
    "summary": "Create group",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "createCustomConversion",
    "name": "createCustomConversion",
    "method": "POST",
    "path": "/v1/accounts/{accountId}/custom-conversions",
    "group": "accounts",
    "platforms": [
      "meta"
    ],
    "summary": "Create or reuse a custom conversion",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "createCustomField",
    "name": "createCustomField",
    "method": "POST",
    "path": "/v1/custom-fields",
    "group": "accounts",
    "platforms": null,
    "summary": "Create custom field",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "createGoogleBusinessMedia",
    "name": "createGoogleBusinessMedia",
    "method": "POST",
    "path": "/v1/accounts/{accountId}/gmb-media",
    "group": "accounts",
    "platforms": null,
    "summary": "Upload photo",
    "pathParams": [
      "accountId"
    ],
    "query": [
      {
        "name": "locationId",
        "required": false
      }
    ],
    "hasBody": true
  },
  {
    "id": "createGoogleBusinessPlaceAction",
    "name": "createGoogleBusinessPlaceAction",
    "method": "POST",
    "path": "/v1/accounts/{accountId}/gmb-place-actions",
    "group": "accounts",
    "platforms": null,
    "summary": "Create action link",
    "pathParams": [
      "accountId"
    ],
    "query": [
      {
        "name": "locationId",
        "required": false
      }
    ],
    "hasBody": true
  },
  {
    "id": "createPinterestBoard",
    "name": "createPinterestBoard",
    "method": "POST",
    "path": "/v1/accounts/{accountId}/pinterest-boards",
    "group": "accounts",
    "platforms": null,
    "summary": "Create Pinterest board",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "createProfile",
    "name": "createProfile",
    "method": "POST",
    "path": "/v1/profiles",
    "group": "accounts",
    "platforms": null,
    "summary": "Create profile",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "createWhatsAppDataset",
    "name": "createWhatsAppDataset",
    "method": "POST",
    "path": "/v1/whatsapp/dataset",
    "group": "accounts",
    "platforms": null,
    "summary": "Provision CTWA dataset",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "createWhatsAppFlow",
    "name": "createWhatsAppFlow",
    "method": "POST",
    "path": "/v1/whatsapp/flows",
    "group": "accounts",
    "platforms": null,
    "summary": "Create flow",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "createWhatsAppTemplate",
    "name": "createWhatsAppTemplate",
    "method": "POST",
    "path": "/v1/whatsapp/templates",
    "group": "accounts",
    "platforms": null,
    "summary": "Create template",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "createWorkflow",
    "name": "createWorkflow",
    "method": "POST",
    "path": "/v1/workflows",
    "group": "accounts",
    "platforms": null,
    "summary": "Create workflow",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "deleteAccount",
    "name": "deleteAccount",
    "method": "DELETE",
    "path": "/v1/accounts/{accountId}",
    "group": "accounts",
    "platforms": null,
    "summary": "Disconnect account",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "deleteAccountGroup",
    "name": "deleteAccountGroup",
    "method": "DELETE",
    "path": "/v1/account-groups/{groupId}",
    "group": "accounts",
    "platforms": null,
    "summary": "Delete group",
    "pathParams": [
      "groupId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "deleteCustomField",
    "name": "deleteCustomField",
    "method": "DELETE",
    "path": "/v1/custom-fields/{fieldId}",
    "group": "accounts",
    "platforms": null,
    "summary": "Delete custom field",
    "pathParams": [
      "fieldId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "deleteGoogleBusinessMedia",
    "name": "deleteGoogleBusinessMedia",
    "method": "DELETE",
    "path": "/v1/accounts/{accountId}/gmb-media",
    "group": "accounts",
    "platforms": null,
    "summary": "Delete photo",
    "pathParams": [
      "accountId"
    ],
    "query": [
      {
        "name": "locationId",
        "required": false
      },
      {
        "name": "mediaId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "deleteGoogleBusinessPlaceAction",
    "name": "deleteGoogleBusinessPlaceAction",
    "method": "DELETE",
    "path": "/v1/accounts/{accountId}/gmb-place-actions",
    "group": "accounts",
    "platforms": null,
    "summary": "Delete action link",
    "pathParams": [
      "accountId"
    ],
    "query": [
      {
        "name": "locationId",
        "required": false
      },
      {
        "name": "name",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "deleteInstagramIceBreakers",
    "name": "deleteInstagramIceBreakers",
    "method": "DELETE",
    "path": "/v1/accounts/{accountId}/instagram-ice-breakers",
    "group": "accounts",
    "platforms": null,
    "summary": "Delete IG ice breakers",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "deleteMessengerMenu",
    "name": "deleteMessengerMenu",
    "method": "DELETE",
    "path": "/v1/accounts/{accountId}/messenger-menu",
    "group": "accounts",
    "platforms": null,
    "summary": "Delete FB persistent menu",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "deleteProfile",
    "name": "deleteProfile",
    "method": "DELETE",
    "path": "/v1/profiles/{profileId}",
    "group": "accounts",
    "platforms": null,
    "summary": "Delete profile",
    "pathParams": [
      "profileId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "deleteTelegramCommands",
    "name": "deleteTelegramCommands",
    "method": "DELETE",
    "path": "/v1/accounts/{accountId}/telegram-commands",
    "group": "accounts",
    "platforms": null,
    "summary": "Delete TG bot commands",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "deleteWhatsappBusinessUsername",
    "name": "deleteWhatsappBusinessUsername",
    "method": "DELETE",
    "path": "/v1/whatsapp/business-profile/username",
    "group": "accounts",
    "platforms": null,
    "summary": "Delete business username",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "deleteWhatsAppFlow",
    "name": "deleteWhatsAppFlow",
    "method": "DELETE",
    "path": "/v1/whatsapp/flows/{flowId}",
    "group": "accounts",
    "platforms": null,
    "summary": "Delete flow",
    "pathParams": [
      "flowId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "deleteWhatsAppTemplate",
    "name": "deleteWhatsAppTemplate",
    "method": "DELETE",
    "path": "/v1/whatsapp/templates/{templateName}",
    "group": "accounts",
    "platforms": null,
    "summary": "Delete template",
    "pathParams": [
      "templateName"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "language",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "deleteWhatsAppTemplateById",
    "name": "deleteWhatsAppTemplateById",
    "method": "DELETE",
    "path": "/v1/whatsapp/templates/id/{templateId}",
    "group": "accounts",
    "platforms": null,
    "summary": "Delete template by id",
    "pathParams": [
      "templateId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "deleteWorkflow",
    "name": "deleteWorkflow",
    "method": "DELETE",
    "path": "/v1/workflows/{workflowId}",
    "group": "accounts",
    "platforms": null,
    "summary": "Delete workflow",
    "pathParams": [
      "workflowId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "deprecateWhatsAppFlow",
    "name": "deprecateWhatsAppFlow",
    "method": "POST",
    "path": "/v1/whatsapp/flows/{flowId}/deprecate",
    "group": "accounts",
    "platforms": null,
    "summary": "Deprecate flow",
    "pathParams": [
      "flowId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "duplicateWorkflow",
    "name": "duplicateWorkflow",
    "method": "POST",
    "path": "/v1/workflows/{workflowId}/duplicate",
    "group": "accounts",
    "platforms": null,
    "summary": "Duplicate a workflow",
    "pathParams": [
      "workflowId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "fetchGoogleBusinessVerificationOptions",
    "name": "fetchGoogleBusinessVerificationOptions",
    "method": "POST",
    "path": "/v1/accounts/{accountId}/gmb-verifications/options",
    "group": "accounts",
    "platforms": null,
    "summary": "Fetch verification options",
    "pathParams": [
      "accountId"
    ],
    "query": [
      {
        "name": "locationId",
        "required": false
      }
    ],
    "hasBody": true
  },
  {
    "id": "getAccountHealth",
    "name": "getAccountHealth",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/health",
    "group": "accounts",
    "platforms": null,
    "summary": "Check account health",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getAccountPosts",
    "name": "getAccountPosts",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/posts",
    "group": "accounts",
    "platforms": [
      "facebook",
      "instagram",
      "twitter",
      "bluesky",
      "threads",
      "youtube",
      "linkedin",
      "reddit",
      "tiktok",
      "pinterest"
    ],
    "summary": "List posts published on the platform",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getAllAccountsHealth",
    "name": "getAllAccountsHealth",
    "method": "GET",
    "path": "/v1/accounts/health",
    "group": "accounts",
    "platforms": null,
    "summary": "Check accounts health",
    "pathParams": [],
    "query": [
      {
        "name": "profileId",
        "required": false
      },
      {
        "name": "platform",
        "required": false
      },
      {
        "name": "status",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getBlueskySettings",
    "name": "getBlueskySettings",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/bluesky-settings",
    "group": "accounts",
    "platforms": null,
    "summary": "Get Bluesky account settings",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getConnectUrl",
    "name": "getConnectUrl",
    "method": "GET",
    "path": "/v1/connect/{platform}",
    "group": "accounts",
    "platforms": null,
    "summary": "Get OAuth connect URL",
    "pathParams": [
      "platform"
    ],
    "query": [
      {
        "name": "profileId",
        "required": true
      },
      {
        "name": "redirect_url",
        "required": false
      },
      {
        "name": "headless",
        "required": false
      },
      {
        "name": "loginMethod",
        "required": false
      },
      {
        "name": "onboarding",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getDiscordChannels",
    "name": "getDiscordChannels",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/discord-channels",
    "group": "accounts",
    "platforms": null,
    "summary": "List Discord guild channels",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getDiscordSettings",
    "name": "getDiscordSettings",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/discord-settings",
    "group": "accounts",
    "platforms": null,
    "summary": "Get Discord account settings",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getFacebookPages",
    "name": "getFacebookPages",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/facebook-page",
    "group": "accounts",
    "platforms": null,
    "summary": "List Facebook pages",
    "pathParams": [
      "accountId"
    ],
    "query": [
      {
        "name": "refresh",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getGmbAttributeMetadata",
    "name": "getGmbAttributeMetadata",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/gmb-attribute-metadata",
    "group": "accounts",
    "platforms": null,
    "summary": "Get attribute metadata",
    "pathParams": [
      "accountId"
    ],
    "query": [
      {
        "name": "locationId",
        "required": false
      },
      {
        "name": "categoryName",
        "required": false
      },
      {
        "name": "regionCode",
        "required": false
      },
      {
        "name": "languageCode",
        "required": false
      },
      {
        "name": "pageSize",
        "required": false
      },
      {
        "name": "pageToken",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getGmbLocations",
    "name": "getGmbLocations",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/gmb-locations",
    "group": "accounts",
    "platforms": null,
    "summary": "List GBP locations",
    "pathParams": [
      "accountId"
    ],
    "query": [
      {
        "name": "search",
        "required": false
      },
      {
        "name": "filter",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getGoogleBusinessAttributes",
    "name": "getGoogleBusinessAttributes",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/gmb-attributes",
    "group": "accounts",
    "platforms": null,
    "summary": "Get attributes",
    "pathParams": [
      "accountId"
    ],
    "query": [
      {
        "name": "locationId",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getGoogleBusinessFoodMenus",
    "name": "getGoogleBusinessFoodMenus",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/gmb-food-menus",
    "group": "accounts",
    "platforms": null,
    "summary": "Get food menus",
    "pathParams": [
      "accountId"
    ],
    "query": [
      {
        "name": "locationId",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getGoogleBusinessLocationDetails",
    "name": "getGoogleBusinessLocationDetails",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/gmb-location-details",
    "group": "accounts",
    "platforms": null,
    "summary": "Get location details",
    "pathParams": [
      "accountId"
    ],
    "query": [
      {
        "name": "locationId",
        "required": false
      },
      {
        "name": "readMask",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getGoogleBusinessServices",
    "name": "getGoogleBusinessServices",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/gmb-services",
    "group": "accounts",
    "platforms": null,
    "summary": "Get services",
    "pathParams": [
      "accountId"
    ],
    "query": [
      {
        "name": "locationId",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getGoogleBusinessVerifications",
    "name": "getGoogleBusinessVerifications",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/gmb-verifications",
    "group": "accounts",
    "platforms": null,
    "summary": "Get verification state",
    "pathParams": [
      "accountId"
    ],
    "query": [
      {
        "name": "locationId",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getInstagramAudio",
    "name": "getInstagramAudio",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/instagram/audio/{audioId}",
    "group": "accounts",
    "platforms": null,
    "summary": "Get Instagram audio metadata",
    "pathParams": [
      "accountId",
      "audioId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getInstagramIceBreakers",
    "name": "getInstagramIceBreakers",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/instagram-ice-breakers",
    "group": "accounts",
    "platforms": null,
    "summary": "Get IG ice breakers",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getInstagramPublishingLimit",
    "name": "getInstagramPublishingLimit",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/instagram/publishing-limit",
    "group": "accounts",
    "platforms": null,
    "summary": "Get Instagram publishing limit",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getLinkedInMentions",
    "name": "getLinkedInMentions",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/linkedin-mentions",
    "group": "accounts",
    "platforms": null,
    "summary": "Resolve LinkedIn mention",
    "pathParams": [
      "accountId"
    ],
    "query": [
      {
        "name": "url",
        "required": true
      },
      {
        "name": "displayName",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getLinkedInOrganizations",
    "name": "getLinkedInOrganizations",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/linkedin-organizations",
    "group": "accounts",
    "platforms": null,
    "summary": "List LinkedIn orgs",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getMessengerMenu",
    "name": "getMessengerMenu",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/messenger-menu",
    "group": "accounts",
    "platforms": null,
    "summary": "Get FB persistent menu",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getPinterestBoards",
    "name": "getPinterestBoards",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/pinterest-boards",
    "group": "accounts",
    "platforms": null,
    "summary": "List Pinterest boards",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getProfile",
    "name": "getProfile",
    "method": "GET",
    "path": "/v1/profiles/{profileId}",
    "group": "accounts",
    "platforms": null,
    "summary": "Get profile",
    "pathParams": [
      "profileId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getRedditFlairs",
    "name": "getRedditFlairs",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/reddit-flairs",
    "group": "accounts",
    "platforms": null,
    "summary": "List subreddit flairs",
    "pathParams": [
      "accountId"
    ],
    "query": [
      {
        "name": "subreddit",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "getRedditSubreddits",
    "name": "getRedditSubreddits",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/reddit-subreddits",
    "group": "accounts",
    "platforms": null,
    "summary": "List Reddit subreddits",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getShopifyConnectUrl",
    "name": "getShopifyConnectUrl",
    "method": "GET",
    "path": "/v1/connect/shopify",
    "group": "accounts",
    "platforms": null,
    "summary": "Get Shopify OAuth connect URL",
    "pathParams": [],
    "query": [
      {
        "name": "profileId",
        "required": true
      },
      {
        "name": "shop",
        "required": true
      },
      {
        "name": "redirect_url",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getSlackSettings",
    "name": "getSlackSettings",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/slack-settings",
    "group": "accounts",
    "platforms": null,
    "summary": "Get Slack account settings",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getSubredditRules",
    "name": "getSubredditRules",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/reddit-subreddits/{subreddit}/rules",
    "group": "accounts",
    "platforms": null,
    "summary": "Get subreddit rules",
    "pathParams": [
      "accountId",
      "subreddit"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getTelegramCommands",
    "name": "getTelegramCommands",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/telegram-commands",
    "group": "accounts",
    "platforms": null,
    "summary": "Get TG bot commands",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getTelegramConnectStatus",
    "name": "getTelegramConnectStatus",
    "method": "GET",
    "path": "/v1/connect/telegram",
    "group": "accounts",
    "platforms": null,
    "summary": "Generate Telegram code",
    "pathParams": [],
    "query": [
      {
        "name": "profileId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "getTikTokCreatorInfo",
    "name": "getTikTokCreatorInfo",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/tiktok/creator-info",
    "group": "accounts",
    "platforms": null,
    "summary": "Get TikTok creator info",
    "pathParams": [
      "accountId"
    ],
    "query": [
      {
        "name": "mediaType",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getUser",
    "name": "getUser",
    "method": "GET",
    "path": "/v1/users/{userId}",
    "group": "accounts",
    "platforms": null,
    "summary": "Get user",
    "pathParams": [
      "userId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getWhatsAppBusinessProfile",
    "name": "getWhatsAppBusinessProfile",
    "method": "GET",
    "path": "/v1/whatsapp/business-profile",
    "group": "accounts",
    "platforms": null,
    "summary": "Get business profile",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "getWhatsappBusinessUsername",
    "name": "getWhatsappBusinessUsername",
    "method": "GET",
    "path": "/v1/whatsapp/business-profile/username",
    "group": "accounts",
    "platforms": null,
    "summary": "Get business username",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "getWhatsappBusinessUsernameSuggestions",
    "name": "getWhatsappBusinessUsernameSuggestions",
    "method": "GET",
    "path": "/v1/whatsapp/business-profile/username/suggestions",
    "group": "accounts",
    "platforms": null,
    "summary": "Get username suggestions",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "getWhatsAppCallingConfig",
    "name": "getWhatsAppCallingConfig",
    "method": "GET",
    "path": "/v1/whatsapp/calling",
    "group": "accounts",
    "platforms": null,
    "summary": "Get calling config for an account",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "getWhatsAppDataset",
    "name": "getWhatsAppDataset",
    "method": "GET",
    "path": "/v1/whatsapp/dataset",
    "group": "accounts",
    "platforms": null,
    "summary": "Get CTWA conversions dataset",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "getWhatsAppDisplayName",
    "name": "getWhatsAppDisplayName",
    "method": "GET",
    "path": "/v1/whatsapp/business-profile/display-name",
    "group": "accounts",
    "platforms": null,
    "summary": "Get display name status",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "getWhatsAppFlow",
    "name": "getWhatsAppFlow",
    "method": "GET",
    "path": "/v1/whatsapp/flows/{flowId}",
    "group": "accounts",
    "platforms": null,
    "summary": "Get flow",
    "pathParams": [
      "flowId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "fields",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getWhatsAppFlowJson",
    "name": "getWhatsAppFlowJson",
    "method": "GET",
    "path": "/v1/whatsapp/flows/{flowId}/json",
    "group": "accounts",
    "platforms": null,
    "summary": "Get flow JSON asset",
    "pathParams": [
      "flowId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "getWhatsAppFlowPreview",
    "name": "getWhatsAppFlowPreview",
    "method": "GET",
    "path": "/v1/whatsapp/flows/{flowId}/preview",
    "group": "accounts",
    "platforms": null,
    "summary": "Get flow preview URL",
    "pathParams": [
      "flowId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "invalidate",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getWhatsAppLibraryTemplate",
    "name": "getWhatsAppLibraryTemplate",
    "method": "GET",
    "path": "/v1/whatsapp/template-library",
    "group": "accounts",
    "platforms": null,
    "summary": "Look up a library template",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "name",
        "required": true
      },
      {
        "name": "language",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getWhatsAppTemplate",
    "name": "getWhatsAppTemplate",
    "method": "GET",
    "path": "/v1/whatsapp/templates/{templateName}",
    "group": "accounts",
    "platforms": null,
    "summary": "Get template",
    "pathParams": [
      "templateName"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "language",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getWhatsAppTemplateById",
    "name": "getWhatsAppTemplateById",
    "method": "GET",
    "path": "/v1/whatsapp/templates/id/{templateId}",
    "group": "accounts",
    "platforms": null,
    "summary": "Get template by id",
    "pathParams": [
      "templateId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "getWhatsAppTemplates",
    "name": "getWhatsAppTemplates",
    "method": "GET",
    "path": "/v1/whatsapp/templates",
    "group": "accounts",
    "platforms": null,
    "summary": "List templates",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "name",
        "required": false
      },
      {
        "name": "language",
        "required": false
      },
      {
        "name": "status",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getWorkflow",
    "name": "getWorkflow",
    "method": "GET",
    "path": "/v1/workflows/{workflowId}",
    "group": "accounts",
    "platforms": null,
    "summary": "Get workflow with graph",
    "pathParams": [
      "workflowId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getWorkflowVersion",
    "name": "getWorkflowVersion",
    "method": "GET",
    "path": "/v1/workflows/{workflowId}/versions/{version}",
    "group": "accounts",
    "platforms": null,
    "summary": "Get a specific workflow version",
    "pathParams": [
      "workflowId",
      "version"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getYoutubeCaptions",
    "name": "getYoutubeCaptions",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/youtube-captions",
    "group": "accounts",
    "platforms": null,
    "summary": "Get a YouTube video transcript",
    "pathParams": [
      "accountId"
    ],
    "query": [
      {
        "name": "videoId",
        "required": true
      },
      {
        "name": "language",
        "required": false
      },
      {
        "name": "format",
        "required": false
      },
      {
        "name": "refresh",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getYoutubePlaylists",
    "name": "getYoutubePlaylists",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/youtube-playlists",
    "group": "accounts",
    "platforms": null,
    "summary": "List YouTube playlists",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "handleOAuthCallback",
    "name": "handleOAuthCallback",
    "method": "POST",
    "path": "/v1/connect/{platform}",
    "group": "accounts",
    "platforms": null,
    "summary": "Complete OAuth callback",
    "pathParams": [
      "platform"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "initiateTelegramConnect",
    "name": "initiateTelegramConnect",
    "method": "POST",
    "path": "/v1/connect/telegram",
    "group": "accounts",
    "platforms": null,
    "summary": "Connect Telegram directly",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "listAccountGroups",
    "name": "listAccountGroups",
    "method": "GET",
    "path": "/v1/account-groups",
    "group": "accounts",
    "platforms": null,
    "summary": "List groups",
    "pathParams": [],
    "query": [],
    "hasBody": false
  },
  {
    "id": "listAccounts",
    "name": "listAccounts",
    "method": "GET",
    "path": "/v1/accounts",
    "group": "accounts",
    "platforms": null,
    "summary": "List accounts",
    "pathParams": [],
    "query": [
      {
        "name": "profileId",
        "required": false
      },
      {
        "name": "platform",
        "required": false
      },
      {
        "name": "status",
        "required": false
      },
      {
        "name": "includeOverLimit",
        "required": false
      },
      {
        "name": "page",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listCustomConversions",
    "name": "listCustomConversions",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/custom-conversions",
    "group": "accounts",
    "platforms": [
      "meta"
    ],
    "summary": "List custom conversions",
    "pathParams": [
      "accountId"
    ],
    "query": [
      {
        "name": "adAccountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "listCustomFields",
    "name": "listCustomFields",
    "method": "GET",
    "path": "/v1/custom-fields",
    "group": "accounts",
    "platforms": null,
    "summary": "List custom field definitions",
    "pathParams": [],
    "query": [
      {
        "name": "profileId",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listFacebookPages",
    "name": "listFacebookPages",
    "method": "GET",
    "path": "/v1/connect/facebook/select-page",
    "group": "accounts",
    "platforms": null,
    "summary": "List Facebook pages",
    "pathParams": [],
    "query": [
      {
        "name": "profileId",
        "required": true
      },
      {
        "name": "tempToken",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "listGoogleBusinessLocations",
    "name": "listGoogleBusinessLocations",
    "method": "GET",
    "path": "/v1/connect/googlebusiness/locations",
    "group": "accounts",
    "platforms": null,
    "summary": "List GBP locations",
    "pathParams": [],
    "query": [
      {
        "name": "profileId",
        "required": false
      },
      {
        "name": "pendingDataToken",
        "required": false
      },
      {
        "name": "tempToken",
        "required": false
      },
      {
        "name": "search",
        "required": false
      },
      {
        "name": "filter",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listGoogleBusinessMedia",
    "name": "listGoogleBusinessMedia",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/gmb-media",
    "group": "accounts",
    "platforms": null,
    "summary": "List media",
    "pathParams": [
      "accountId"
    ],
    "query": [
      {
        "name": "locationId",
        "required": false
      },
      {
        "name": "pageSize",
        "required": false
      },
      {
        "name": "pageToken",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listGoogleBusinessPlaceActions",
    "name": "listGoogleBusinessPlaceActions",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/gmb-place-actions",
    "group": "accounts",
    "platforms": null,
    "summary": "List action links",
    "pathParams": [
      "accountId"
    ],
    "query": [
      {
        "name": "locationId",
        "required": false
      },
      {
        "name": "pageSize",
        "required": false
      },
      {
        "name": "pageToken",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listPinterestBoardsForSelection",
    "name": "listPinterestBoardsForSelection",
    "method": "GET",
    "path": "/v1/connect/pinterest/select-board",
    "group": "accounts",
    "platforms": null,
    "summary": "List Pinterest boards",
    "pathParams": [],
    "query": [
      {
        "name": "profileId",
        "required": true
      },
      {
        "name": "tempToken",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "listProfiles",
    "name": "listProfiles",
    "method": "GET",
    "path": "/v1/profiles",
    "group": "accounts",
    "platforms": null,
    "summary": "List profiles",
    "pathParams": [],
    "query": [
      {
        "name": "includeOverLimit",
        "required": false
      },
      {
        "name": "name",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "skip",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listSnapchatProfiles",
    "name": "listSnapchatProfiles",
    "method": "GET",
    "path": "/v1/connect/snapchat/select-profile",
    "group": "accounts",
    "platforms": null,
    "summary": "List Snapchat profiles",
    "pathParams": [],
    "query": [
      {
        "name": "profileId",
        "required": true
      },
      {
        "name": "tempToken",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "listUsers",
    "name": "listUsers",
    "method": "GET",
    "path": "/v1/users",
    "group": "accounts",
    "platforms": null,
    "summary": "List users",
    "pathParams": [],
    "query": [],
    "hasBody": false
  },
  {
    "id": "listWhatsAppAccountEvents",
    "name": "listWhatsAppAccountEvents",
    "method": "GET",
    "path": "/v1/whatsapp/account-events",
    "group": "accounts",
    "platforms": null,
    "summary": "List account notifications",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "limit",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listWhatsAppFlows",
    "name": "listWhatsAppFlows",
    "method": "GET",
    "path": "/v1/whatsapp/flows",
    "group": "accounts",
    "platforms": null,
    "summary": "List flows",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "listWhatsAppFlowVersions",
    "name": "listWhatsAppFlowVersions",
    "method": "GET",
    "path": "/v1/whatsapp/flows/{flowId}/versions",
    "group": "accounts",
    "platforms": null,
    "summary": "List flow versions",
    "pathParams": [
      "flowId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "listWhatsAppPhoneNumbers",
    "name": "listWhatsAppPhoneNumbers",
    "method": "GET",
    "path": "/v1/connect/whatsapp/select-phone-number",
    "group": "accounts",
    "platforms": null,
    "summary": "List numbers for selection",
    "pathParams": [],
    "query": [
      {
        "name": "profileId",
        "required": true
      },
      {
        "name": "tempToken",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "listWorkflows",
    "name": "listWorkflows",
    "method": "GET",
    "path": "/v1/workflows",
    "group": "accounts",
    "platforms": null,
    "summary": "List workflows",
    "pathParams": [],
    "query": [
      {
        "name": "profileId",
        "required": false
      },
      {
        "name": "status",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "skip",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listWorkflowVersions",
    "name": "listWorkflowVersions",
    "method": "GET",
    "path": "/v1/workflows/{workflowId}/versions",
    "group": "accounts",
    "platforms": null,
    "summary": "List a workflow's version history",
    "pathParams": [
      "workflowId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "moveAccountToProfile",
    "name": "moveAccountToProfile",
    "method": "PATCH",
    "path": "/v1/accounts/{accountId}",
    "group": "accounts",
    "platforms": null,
    "summary": "Move account to another profile",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "pauseWorkflow",
    "name": "pauseWorkflow",
    "method": "POST",
    "path": "/v1/workflows/{workflowId}/pause",
    "group": "accounts",
    "platforms": null,
    "summary": "Pause workflow",
    "pathParams": [
      "workflowId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "publishWhatsAppFlow",
    "name": "publishWhatsAppFlow",
    "method": "POST",
    "path": "/v1/whatsapp/flows/{flowId}/publish",
    "group": "accounts",
    "platforms": null,
    "summary": "Publish flow",
    "pathParams": [
      "flowId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "registerWhatsAppNumber",
    "name": "registerWhatsAppNumber",
    "method": "POST",
    "path": "/v1/accounts/{accountId}/whatsapp/register",
    "group": "accounts",
    "platforms": null,
    "summary": "Register a connected WhatsApp number on the Cloud API",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "restoreWorkflowVersion",
    "name": "restoreWorkflowVersion",
    "method": "POST",
    "path": "/v1/workflows/{workflowId}/versions/{version}/restore",
    "group": "accounts",
    "platforms": null,
    "summary": "Restore a workflow version",
    "pathParams": [
      "workflowId",
      "version"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "searchInstagramAudio",
    "name": "searchInstagramAudio",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/instagram/audio",
    "group": "accounts",
    "platforms": null,
    "summary": "Search Instagram audio",
    "pathParams": [
      "accountId"
    ],
    "query": [
      {
        "name": "audioType",
        "required": true
      },
      {
        "name": "q",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "selectFacebookPage",
    "name": "selectFacebookPage",
    "method": "POST",
    "path": "/v1/connect/facebook/select-page",
    "group": "accounts",
    "platforms": null,
    "summary": "Select Facebook page",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "selectGoogleBusinessLocation",
    "name": "selectGoogleBusinessLocation",
    "method": "POST",
    "path": "/v1/connect/googlebusiness/select-location",
    "group": "accounts",
    "platforms": null,
    "summary": "Select GBP location",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "selectLinkedInOrganization",
    "name": "selectLinkedInOrganization",
    "method": "POST",
    "path": "/v1/connect/linkedin/select-organization",
    "group": "accounts",
    "platforms": null,
    "summary": "Select LinkedIn org",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "selectPinterestBoard",
    "name": "selectPinterestBoard",
    "method": "POST",
    "path": "/v1/connect/pinterest/select-board",
    "group": "accounts",
    "platforms": null,
    "summary": "Select Pinterest board",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "selectSnapchatProfile",
    "name": "selectSnapchatProfile",
    "method": "POST",
    "path": "/v1/connect/snapchat/select-profile",
    "group": "accounts",
    "platforms": null,
    "summary": "Select Snapchat profile",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "setInstagramIceBreakers",
    "name": "setInstagramIceBreakers",
    "method": "PUT",
    "path": "/v1/accounts/{accountId}/instagram-ice-breakers",
    "group": "accounts",
    "platforms": null,
    "summary": "Set IG ice breakers",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "setMessengerMenu",
    "name": "setMessengerMenu",
    "method": "PUT",
    "path": "/v1/accounts/{accountId}/messenger-menu",
    "group": "accounts",
    "platforms": null,
    "summary": "Set FB persistent menu",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "setRedditPostFlair",
    "name": "setRedditPostFlair",
    "method": "POST",
    "path": "/v1/accounts/{accountId}/reddit-flairs",
    "group": "accounts",
    "platforms": null,
    "summary": "Set Reddit post flair",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "setTelegramCommands",
    "name": "setTelegramCommands",
    "method": "PUT",
    "path": "/v1/accounts/{accountId}/telegram-commands",
    "group": "accounts",
    "platforms": null,
    "summary": "Set TG bot commands",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "setWhatsappBusinessUsername",
    "name": "setWhatsappBusinessUsername",
    "method": "POST",
    "path": "/v1/whatsapp/business-profile/username",
    "group": "accounts",
    "platforms": null,
    "summary": "Set business username",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "startGoogleBusinessVerification",
    "name": "startGoogleBusinessVerification",
    "method": "POST",
    "path": "/v1/accounts/{accountId}/gmb-verifications",
    "group": "accounts",
    "platforms": null,
    "summary": "Start a verification",
    "pathParams": [
      "accountId"
    ],
    "query": [
      {
        "name": "locationId",
        "required": false
      }
    ],
    "hasBody": true
  },
  {
    "id": "updateAccount",
    "name": "updateAccount",
    "method": "PUT",
    "path": "/v1/accounts/{accountId}",
    "group": "accounts",
    "platforms": null,
    "summary": "Update account",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updateAccountGroup",
    "name": "updateAccountGroup",
    "method": "PUT",
    "path": "/v1/account-groups/{groupId}",
    "group": "accounts",
    "platforms": null,
    "summary": "Update group",
    "pathParams": [
      "groupId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updateBlueskySettings",
    "name": "updateBlueskySettings",
    "method": "PATCH",
    "path": "/v1/accounts/{accountId}/bluesky-settings",
    "group": "accounts",
    "platforms": null,
    "summary": "Update Bluesky account settings",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updateCustomField",
    "name": "updateCustomField",
    "method": "PATCH",
    "path": "/v1/custom-fields/{fieldId}",
    "group": "accounts",
    "platforms": null,
    "summary": "Update custom field",
    "pathParams": [
      "fieldId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updateDiscordSettings",
    "name": "updateDiscordSettings",
    "method": "PATCH",
    "path": "/v1/accounts/{accountId}/discord-settings",
    "group": "accounts",
    "platforms": null,
    "summary": "Update Discord settings",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updateFacebookPage",
    "name": "updateFacebookPage",
    "method": "PUT",
    "path": "/v1/accounts/{accountId}/facebook-page",
    "group": "accounts",
    "platforms": null,
    "summary": "Update Facebook page",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updateGmbLocation",
    "name": "updateGmbLocation",
    "method": "PUT",
    "path": "/v1/accounts/{accountId}/gmb-locations",
    "group": "accounts",
    "platforms": null,
    "summary": "Update GBP location",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updateGoogleBusinessAttributes",
    "name": "updateGoogleBusinessAttributes",
    "method": "PUT",
    "path": "/v1/accounts/{accountId}/gmb-attributes",
    "group": "accounts",
    "platforms": null,
    "summary": "Update attributes",
    "pathParams": [
      "accountId"
    ],
    "query": [
      {
        "name": "locationId",
        "required": false
      }
    ],
    "hasBody": true
  },
  {
    "id": "updateGoogleBusinessFoodMenus",
    "name": "updateGoogleBusinessFoodMenus",
    "method": "PUT",
    "path": "/v1/accounts/{accountId}/gmb-food-menus",
    "group": "accounts",
    "platforms": null,
    "summary": "Update food menus",
    "pathParams": [
      "accountId"
    ],
    "query": [
      {
        "name": "locationId",
        "required": false
      }
    ],
    "hasBody": true
  },
  {
    "id": "updateGoogleBusinessLocationDetails",
    "name": "updateGoogleBusinessLocationDetails",
    "method": "PUT",
    "path": "/v1/accounts/{accountId}/gmb-location-details",
    "group": "accounts",
    "platforms": null,
    "summary": "Update location details",
    "pathParams": [
      "accountId"
    ],
    "query": [
      {
        "name": "locationId",
        "required": false
      }
    ],
    "hasBody": true
  },
  {
    "id": "updateGoogleBusinessPlaceAction",
    "name": "updateGoogleBusinessPlaceAction",
    "method": "PATCH",
    "path": "/v1/accounts/{accountId}/gmb-place-actions",
    "group": "accounts",
    "platforms": null,
    "summary": "Update action link",
    "pathParams": [
      "accountId"
    ],
    "query": [
      {
        "name": "locationId",
        "required": false
      }
    ],
    "hasBody": true
  },
  {
    "id": "updateGoogleBusinessServices",
    "name": "updateGoogleBusinessServices",
    "method": "PUT",
    "path": "/v1/accounts/{accountId}/gmb-services",
    "group": "accounts",
    "platforms": null,
    "summary": "Replace services",
    "pathParams": [
      "accountId"
    ],
    "query": [
      {
        "name": "locationId",
        "required": false
      }
    ],
    "hasBody": true
  },
  {
    "id": "updateLinkedInOrganization",
    "name": "updateLinkedInOrganization",
    "method": "PUT",
    "path": "/v1/accounts/{accountId}/linkedin-organization",
    "group": "accounts",
    "platforms": null,
    "summary": "Switch LinkedIn account type",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updatePinterestBoards",
    "name": "updatePinterestBoards",
    "method": "PUT",
    "path": "/v1/accounts/{accountId}/pinterest-boards",
    "group": "accounts",
    "platforms": null,
    "summary": "Set default Pinterest board",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updateProfile",
    "name": "updateProfile",
    "method": "PUT",
    "path": "/v1/profiles/{profileId}",
    "group": "accounts",
    "platforms": null,
    "summary": "Update profile",
    "pathParams": [
      "profileId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updateRedditSubreddits",
    "name": "updateRedditSubreddits",
    "method": "PUT",
    "path": "/v1/accounts/{accountId}/reddit-subreddits",
    "group": "accounts",
    "platforms": null,
    "summary": "Set default subreddit",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updateSlackSettings",
    "name": "updateSlackSettings",
    "method": "PATCH",
    "path": "/v1/accounts/{accountId}/slack-settings",
    "group": "accounts",
    "platforms": null,
    "summary": "Update Slack account settings",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updateWhatsAppBusinessProfile",
    "name": "updateWhatsAppBusinessProfile",
    "method": "POST",
    "path": "/v1/whatsapp/business-profile",
    "group": "accounts",
    "platforms": null,
    "summary": "Update business profile",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updateWhatsAppDisplayName",
    "name": "updateWhatsAppDisplayName",
    "method": "POST",
    "path": "/v1/whatsapp/business-profile/display-name",
    "group": "accounts",
    "platforms": null,
    "summary": "Request display name change",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updateWhatsAppFlow",
    "name": "updateWhatsAppFlow",
    "method": "PATCH",
    "path": "/v1/whatsapp/flows/{flowId}",
    "group": "accounts",
    "platforms": null,
    "summary": "Update flow",
    "pathParams": [
      "flowId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updateWhatsAppTemplate",
    "name": "updateWhatsAppTemplate",
    "method": "PATCH",
    "path": "/v1/whatsapp/templates/{templateName}",
    "group": "accounts",
    "platforms": null,
    "summary": "Update template",
    "pathParams": [
      "templateName"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updateWhatsAppTemplateById",
    "name": "updateWhatsAppTemplateById",
    "method": "PATCH",
    "path": "/v1/whatsapp/templates/id/{templateId}",
    "group": "accounts",
    "platforms": null,
    "summary": "Update template by id",
    "pathParams": [
      "templateId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updateWorkflow",
    "name": "updateWorkflow",
    "method": "PATCH",
    "path": "/v1/workflows/{workflowId}",
    "group": "accounts",
    "platforms": null,
    "summary": "Update workflow",
    "pathParams": [
      "workflowId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updateYoutubeDefaultPlaylist",
    "name": "updateYoutubeDefaultPlaylist",
    "method": "PUT",
    "path": "/v1/accounts/{accountId}/youtube-playlists",
    "group": "accounts",
    "platforms": null,
    "summary": "Set default YouTube playlist",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "uploadWhatsAppFlowJson",
    "name": "uploadWhatsAppFlowJson",
    "method": "PUT",
    "path": "/v1/whatsapp/flows/{flowId}/json",
    "group": "accounts",
    "platforms": null,
    "summary": "Upload flow JSON",
    "pathParams": [
      "flowId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "uploadWhatsAppProfilePhoto",
    "name": "uploadWhatsAppProfilePhoto",
    "method": "POST",
    "path": "/v1/whatsapp/business-profile/photo",
    "group": "accounts",
    "platforms": null,
    "summary": "Upload profile picture",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "createApiKey",
    "name": "createApiKey",
    "method": "POST",
    "path": "/v1/api-keys",
    "group": "admin-plane",
    "platforms": null,
    "summary": "Create key",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "createInviteToken",
    "name": "createInviteToken",
    "method": "POST",
    "path": "/v1/invite/tokens",
    "group": "admin-plane",
    "platforms": null,
    "summary": "Create invite token",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "deleteApiKey",
    "name": "deleteApiKey",
    "method": "DELETE",
    "path": "/v1/api-keys/{keyId}",
    "group": "admin-plane",
    "platforms": null,
    "summary": "Delete key",
    "pathParams": [
      "keyId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "listApiKeys",
    "name": "listApiKeys",
    "method": "GET",
    "path": "/v1/api-keys",
    "group": "admin-plane",
    "platforms": null,
    "summary": "List keys",
    "pathParams": [],
    "query": [],
    "hasBody": false
  },
  {
    "id": "listConnectedApps",
    "name": "listConnectedApps",
    "method": "GET",
    "path": "/v1/me/connected-apps",
    "group": "admin-plane",
    "platforms": null,
    "summary": "List connected apps",
    "pathParams": [],
    "query": [],
    "hasBody": false
  },
  {
    "id": "revokeConnectedApp",
    "name": "revokeConnectedApp",
    "method": "DELETE",
    "path": "/v1/me/connected-apps/{clientId}",
    "group": "admin-plane",
    "platforms": null,
    "summary": "Revoke connected app",
    "pathParams": [
      "clientId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "addConversionAssociations",
    "name": "addConversionAssociations",
    "method": "POST",
    "path": "/v1/accounts/{accountId}/conversion-destinations/{destinationId}/associations",
    "group": "ads",
    "platforms": [
      "meta",
      "google",
      "tiktok",
      "linkedin"
    ],
    "summary": "Associate campaigns",
    "pathParams": [
      "accountId",
      "destinationId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "addTrackingTagSharedAccount",
    "name": "addTrackingTagSharedAccount",
    "method": "POST",
    "path": "/v1/accounts/{accountId}/tracking-tags/{tagId}/shared-accounts",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Share with an ad account",
    "pathParams": [
      "accountId",
      "tagId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "addUsersToAdAudience",
    "name": "addUsersToAdAudience",
    "method": "POST",
    "path": "/v1/ads/audiences/{audienceId}/users",
    "group": "ads",
    "platforms": [
      "meta",
      "google",
      "tiktok",
      "linkedin",
      "pinterest",
      "x"
    ],
    "summary": "Add users to audience",
    "pathParams": [
      "audienceId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "adjustConversions",
    "name": "adjustConversions",
    "method": "POST",
    "path": "/v1/ads/conversions/adjustments",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Adjust uploaded conversions",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "archiveLeadForm",
    "name": "archiveLeadForm",
    "method": "DELETE",
    "path": "/v1/ads/lead-forms/{formId}",
    "group": "ads",
    "platforms": [
      "meta",
      "linkedin"
    ],
    "summary": "Archive a lead form",
    "pathParams": [
      "formId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "attachCampaignAssets",
    "name": "attachCampaignAssets",
    "method": "POST",
    "path": "/v1/ads/campaigns/{campaignId}/assets",
    "group": "ads",
    "platforms": [
      "google"
    ],
    "summary": "Attach extension assets to a Google Search campaign",
    "pathParams": [
      "campaignId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "boostPost",
    "name": "boostPost",
    "method": "POST",
    "path": "/v1/ads/boost",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Boost post as ad",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "bulkUpdateAdCampaignStatus",
    "name": "bulkUpdateAdCampaignStatus",
    "method": "POST",
    "path": "/v1/ads/campaigns/bulk-status",
    "group": "ads",
    "platforms": [
      "meta",
      "google",
      "tiktok",
      "linkedin",
      "pinterest",
      "x"
    ],
    "summary": "Pause or resume many campaigns",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "cancelRfReservation",
    "name": "cancelRfReservation",
    "method": "DELETE",
    "path": "/v1/ads/rf-predictions/{predictionId}",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Cancel a Reach & Frequency reservation",
    "pathParams": [
      "predictionId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "adAccountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "createAdAudience",
    "name": "createAdAudience",
    "method": "POST",
    "path": "/v1/ads/audiences",
    "group": "ads",
    "platforms": [
      "meta",
      "google",
      "tiktok",
      "linkedin",
      "pinterest",
      "x"
    ],
    "summary": "Create custom audience",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "createAdCampaign",
    "name": "createAdCampaign",
    "method": "POST",
    "path": "/v1/ads/campaigns",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Create a standalone campaign",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "createAdCreative",
    "name": "createAdCreative",
    "method": "POST",
    "path": "/v1/ads/creatives",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Create a standalone creative",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "createAdInsightsReport",
    "name": "createAdInsightsReport",
    "method": "POST",
    "path": "/v1/ads/insights/reports",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Submit an async insights report run",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "createCallAd",
    "name": "createCallAd",
    "method": "POST",
    "path": "/v1/ads/call",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Create Click-to-Call ad",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "createConversionDestination",
    "name": "createConversionDestination",
    "method": "POST",
    "path": "/v1/accounts/{accountId}/conversion-destinations",
    "group": "ads",
    "platforms": [
      "meta",
      "google",
      "tiktok",
      "linkedin"
    ],
    "summary": "Create a conversion destination",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "createCtwaAd",
    "name": "createCtwaAd",
    "method": "POST",
    "path": "/v1/ads/ctwa",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Create Click-to-WhatsApp ad (deprecated)",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "createHighDemandPeriod",
    "name": "createHighDemandPeriod",
    "method": "POST",
    "path": "/v1/ads/high-demand-periods",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Schedule a budget increase",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "createLeadForm",
    "name": "createLeadForm",
    "method": "POST",
    "path": "/v1/ads/lead-forms",
    "group": "ads",
    "platforms": [
      "meta",
      "linkedin"
    ],
    "summary": "Create a lead form",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "createMessagingAd",
    "name": "createMessagingAd",
    "method": "POST",
    "path": "/v1/ads/messaging",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Create click-to-message ad (WhatsApp / Messenger / Instagram Direct)",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "createRfPrediction",
    "name": "createRfPrediction",
    "method": "POST",
    "path": "/v1/ads/rf-predictions",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Create a Reach & Frequency prediction",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "createStandaloneAd",
    "name": "createStandaloneAd",
    "method": "POST",
    "path": "/v1/ads/create",
    "group": "ads",
    "platforms": [
      "meta",
      "google",
      "tiktok",
      "linkedin",
      "pinterest",
      "x",
      "openai"
    ],
    "summary": "Create standalone ad",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "createTrackingTag",
    "name": "createTrackingTag",
    "method": "POST",
    "path": "/v1/accounts/{accountId}/tracking-tags",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Create a tracking tag",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "createValueRuleSet",
    "name": "createValueRuleSet",
    "method": "POST",
    "path": "/v1/ads/value-rule-sets",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Create a value rule set",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "deleteAd",
    "name": "deleteAd",
    "method": "DELETE",
    "path": "/v1/ads/{adId}",
    "group": "ads",
    "platforms": [
      "meta",
      "google",
      "tiktok",
      "linkedin",
      "pinterest",
      "x"
    ],
    "summary": "Cancel an ad",
    "pathParams": [
      "adId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "deleteAdAudience",
    "name": "deleteAdAudience",
    "method": "DELETE",
    "path": "/v1/ads/audiences/{audienceId}",
    "group": "ads",
    "platforms": [
      "meta",
      "google",
      "tiktok",
      "linkedin",
      "pinterest",
      "x"
    ],
    "summary": "Delete custom audience",
    "pathParams": [
      "audienceId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "deleteAdCampaign",
    "name": "deleteAdCampaign",
    "method": "DELETE",
    "path": "/v1/ads/campaigns/{campaignId}",
    "group": "ads",
    "platforms": [
      "meta",
      "google",
      "tiktok",
      "linkedin",
      "pinterest",
      "x",
      "openai"
    ],
    "summary": "Delete a campaign",
    "pathParams": [
      "campaignId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "deleteAdCreative",
    "name": "deleteAdCreative",
    "method": "DELETE",
    "path": "/v1/ads/creatives/{creativeId}",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Delete a creative",
    "pathParams": [
      "creativeId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "deleteAdSet",
    "name": "deleteAdSet",
    "method": "DELETE",
    "path": "/v1/ads/ad-sets/{adSetId}",
    "group": "ads",
    "platforms": [
      "meta",
      "google",
      "tiktok",
      "linkedin",
      "pinterest",
      "x"
    ],
    "summary": "Delete an ad set",
    "pathParams": [
      "adSetId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "deleteAdVideo",
    "name": "deleteAdVideo",
    "method": "DELETE",
    "path": "/v1/ads/videos/{videoId}",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Delete an ad video",
    "pathParams": [
      "videoId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "adAccountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "deleteConversionDestination",
    "name": "deleteConversionDestination",
    "method": "DELETE",
    "path": "/v1/accounts/{accountId}/conversion-destinations/{destinationId}",
    "group": "ads",
    "platforms": [
      "meta",
      "google",
      "tiktok",
      "linkedin"
    ],
    "summary": "Delete a conversion destination",
    "pathParams": [
      "accountId",
      "destinationId"
    ],
    "query": [
      {
        "name": "adAccountId",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "deleteValueRuleSet",
    "name": "deleteValueRuleSet",
    "method": "DELETE",
    "path": "/v1/ads/value-rule-sets/{valueRuleSetId}",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Delete a value rule set",
    "pathParams": [
      "valueRuleSetId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "duplicateAd",
    "name": "duplicateAd",
    "method": "POST",
    "path": "/v1/ads/{adId}/duplicate",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Duplicate an ad",
    "pathParams": [
      "adId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "duplicateAdCampaign",
    "name": "duplicateAdCampaign",
    "method": "POST",
    "path": "/v1/ads/campaigns/{campaignId}/duplicate",
    "group": "ads",
    "platforms": [
      "meta",
      "tiktok",
      "linkedin"
    ],
    "summary": "Duplicate a campaign",
    "pathParams": [
      "campaignId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "duplicateAdSet",
    "name": "duplicateAdSet",
    "method": "POST",
    "path": "/v1/ads/ad-sets/{adSetId}/duplicate",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Duplicate an ad set",
    "pathParams": [
      "adSetId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "estimateAdReach",
    "name": "estimateAdReach",
    "method": "POST",
    "path": "/v1/ads/targeting/reach-estimate",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Estimate audience reach",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "generateAdPreviews",
    "name": "generateAdPreviews",
    "method": "POST",
    "path": "/v1/ads/preview",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Render pre-create ad previews",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "generateKeywordHistoricalMetrics",
    "name": "generateKeywordHistoricalMetrics",
    "method": "POST",
    "path": "/v1/ads/keywords/historical-metrics",
    "group": "ads",
    "platforms": [
      "google"
    ],
    "summary": "Historical keyword metrics (Google Keyword Planner)",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "generateKeywordIdeas",
    "name": "generateKeywordIdeas",
    "method": "POST",
    "path": "/v1/ads/keywords/ideas",
    "group": "ads",
    "platforms": [
      "google"
    ],
    "summary": "Generate keyword ideas (Google Keyword Planner)",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "getAd",
    "name": "getAd",
    "method": "GET",
    "path": "/v1/ads/{adId}",
    "group": "ads",
    "platforms": [
      "meta",
      "google",
      "tiktok",
      "linkedin",
      "pinterest",
      "x"
    ],
    "summary": "Get ad details",
    "pathParams": [
      "adId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getAdAccountFinance",
    "name": "getAdAccountFinance",
    "method": "GET",
    "path": "/v1/ads/accounts/finance",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Ad account finances",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "adAccountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "getAdAnalytics",
    "name": "getAdAnalytics",
    "method": "GET",
    "path": "/v1/ads/{adId}/analytics",
    "group": "ads",
    "platforms": [
      "meta",
      "google",
      "tiktok",
      "linkedin",
      "pinterest",
      "x"
    ],
    "summary": "Get ad analytics",
    "pathParams": [
      "adId"
    ],
    "query": [
      {
        "name": "fromDate",
        "required": false
      },
      {
        "name": "toDate",
        "required": false
      },
      {
        "name": "breakdowns",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getAdAudience",
    "name": "getAdAudience",
    "method": "GET",
    "path": "/v1/ads/audiences/{audienceId}",
    "group": "ads",
    "platforms": [
      "meta",
      "google",
      "tiktok",
      "linkedin",
      "pinterest",
      "x"
    ],
    "summary": "Get audience details",
    "pathParams": [
      "audienceId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getAdCreative",
    "name": "getAdCreative",
    "method": "GET",
    "path": "/v1/ads/creatives/{creativeId}",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Creative details",
    "pathParams": [
      "creativeId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "fields",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getAdInsightsReport",
    "name": "getAdInsightsReport",
    "method": "GET",
    "path": "/v1/ads/insights/reports/{reportRunId}",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Poll an async insights report run",
    "pathParams": [
      "reportRunId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "after",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getAdMedia",
    "name": "getAdMedia",
    "method": "GET",
    "path": "/v1/ads/{adId}/media",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Direct video and image URLs for an ad",
    "pathParams": [
      "adId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getAdPreviews",
    "name": "getAdPreviews",
    "method": "GET",
    "path": "/v1/ads/{adId}/preview",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Render previews of an existing ad",
    "pathParams": [
      "adId"
    ],
    "query": [
      {
        "name": "formats",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getAdsActivityLog",
    "name": "getAdsActivityLog",
    "method": "GET",
    "path": "/v1/ads/activity",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Ad account change / audit log",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "adAccountId",
        "required": true
      },
      {
        "name": "since",
        "required": false
      },
      {
        "name": "until",
        "required": false
      },
      {
        "name": "objectId",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "after",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getAdSetDetails",
    "name": "getAdSetDetails",
    "method": "GET",
    "path": "/v1/ads/ad-sets/{adSetId}",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Live ad-set details incl. learning phase",
    "pathParams": [
      "adSetId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "fields",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getAdsSearchTerms",
    "name": "getAdsSearchTerms",
    "method": "GET",
    "path": "/v1/ads/search-terms",
    "group": "ads",
    "platforms": [
      "google"
    ],
    "summary": "Google Ads search terms report",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "customerId",
        "required": false
      },
      {
        "name": "fromDate",
        "required": false
      },
      {
        "name": "toDate",
        "required": false
      },
      {
        "name": "campaignId",
        "required": false
      },
      {
        "name": "adGroupId",
        "required": false
      },
      {
        "name": "pageToken",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getAdsTimeline",
    "name": "getAdsTimeline",
    "method": "GET",
    "path": "/v1/ads/timeline",
    "group": "ads",
    "platforms": [
      "meta",
      "google",
      "tiktok",
      "linkedin",
      "pinterest",
      "x"
    ],
    "summary": "Get daily account metrics",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "adAccountId",
        "required": false
      },
      {
        "name": "fromDate",
        "required": false
      },
      {
        "name": "toDate",
        "required": false
      },
      {
        "name": "platform",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getAdTrackingTags",
    "name": "getAdTrackingTags",
    "method": "GET",
    "path": "/v1/ads/{adId}/tracking-tags",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Get ad tracking tags",
    "pathParams": [
      "adId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getAdTree",
    "name": "getAdTree",
    "method": "GET",
    "path": "/v1/ads/tree",
    "group": "ads",
    "platforms": [
      "meta",
      "google",
      "tiktok",
      "linkedin",
      "pinterest",
      "x"
    ],
    "summary": "Get campaign tree",
    "pathParams": [],
    "query": [
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "source",
        "required": false
      },
      {
        "name": "platform",
        "required": false
      },
      {
        "name": "status",
        "required": false
      },
      {
        "name": "adAccountId",
        "required": false
      },
      {
        "name": "pageId",
        "required": false
      },
      {
        "name": "accountId",
        "required": false
      },
      {
        "name": "profileId",
        "required": false
      },
      {
        "name": "campaignId",
        "required": false
      },
      {
        "name": "fromDate",
        "required": false
      },
      {
        "name": "toDate",
        "required": false
      },
      {
        "name": "hasDelivery",
        "required": false
      },
      {
        "name": "minSpend",
        "required": false
      },
      {
        "name": "sort",
        "required": false
      },
      {
        "name": "timeIncrement",
        "required": false
      },
      {
        "name": "dailyLevel",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getCampaignAnalytics",
    "name": "getCampaignAnalytics",
    "method": "GET",
    "path": "/v1/ads/campaigns/{campaignId}/analytics",
    "group": "ads",
    "platforms": [
      "meta",
      "google",
      "tiktok",
      "linkedin",
      "pinterest",
      "x"
    ],
    "summary": "Get campaign analytics",
    "pathParams": [
      "campaignId"
    ],
    "query": [
      {
        "name": "platform",
        "required": false
      },
      {
        "name": "fromDate",
        "required": false
      },
      {
        "name": "toDate",
        "required": false
      },
      {
        "name": "breakdowns",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getConversionDestination",
    "name": "getConversionDestination",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/conversion-destinations/{destinationId}",
    "group": "ads",
    "platforms": [
      "meta",
      "google",
      "tiktok",
      "linkedin"
    ],
    "summary": "Get a conversion destination",
    "pathParams": [
      "accountId",
      "destinationId"
    ],
    "query": [
      {
        "name": "adAccountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "getConversionMetrics",
    "name": "getConversionMetrics",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/conversion-destinations/{destinationId}/metrics",
    "group": "ads",
    "platforms": [
      "meta",
      "google",
      "tiktok",
      "linkedin"
    ],
    "summary": "Get attribution metrics",
    "pathParams": [
      "accountId",
      "destinationId"
    ],
    "query": [
      {
        "name": "adAccountId",
        "required": true
      },
      {
        "name": "startDate",
        "required": true
      },
      {
        "name": "endDate",
        "required": false
      },
      {
        "name": "granularity",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getConversionsQuality",
    "name": "getConversionsQuality",
    "method": "GET",
    "path": "/v1/ads/conversions/quality",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Get Event Match Quality",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "destinationId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "getDsaDefaults",
    "name": "getDsaDefaults",
    "method": "GET",
    "path": "/v1/ads/dsa-defaults",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Get ad account DSA defaults",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "adAccountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "getDsaRecommendations",
    "name": "getDsaRecommendations",
    "method": "GET",
    "path": "/v1/ads/dsa-recommendations",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "List DSA beneficiary/payor suggestions",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "adAccountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "getLeadForm",
    "name": "getLeadForm",
    "method": "GET",
    "path": "/v1/ads/lead-forms/{formId}",
    "group": "ads",
    "platforms": [
      "meta",
      "linkedin"
    ],
    "summary": "Get a lead form",
    "pathParams": [
      "formId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "getLinkedInBidPricing",
    "name": "getLinkedInBidPricing",
    "method": "POST",
    "path": "/v1/ads/targeting/bid-pricing",
    "group": "ads",
    "platforms": [
      "linkedin"
    ],
    "summary": "Suggested bid and budget bounds",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "getLinkedInSupplyForecast",
    "name": "getLinkedInSupplyForecast",
    "method": "POST",
    "path": "/v1/ads/targeting/supply-forecast",
    "group": "ads",
    "platforms": [
      "linkedin"
    ],
    "summary": "Impressions, clicks and spend forecast",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "getRfPrediction",
    "name": "getRfPrediction",
    "method": "GET",
    "path": "/v1/ads/rf-predictions/{predictionId}",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Read a Reach & Frequency prediction",
    "pathParams": [
      "predictionId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "adAccountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "getTrackingTag",
    "name": "getTrackingTag",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/tracking-tags/{tagId}",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Get a tracking tag",
    "pathParams": [
      "accountId",
      "tagId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getTrackingTagStats",
    "name": "getTrackingTagStats",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/tracking-tags/{tagId}/stats",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Get aggregated event stats",
    "pathParams": [
      "accountId",
      "tagId"
    ],
    "query": [
      {
        "name": "aggregation",
        "required": false
      },
      {
        "name": "startTime",
        "required": false
      },
      {
        "name": "endTime",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getValueRuleSet",
    "name": "getValueRuleSet",
    "method": "GET",
    "path": "/v1/ads/value-rule-sets/{valueRuleSetId}",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Read a value rule set",
    "pathParams": [
      "valueRuleSetId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "listAdAccounts",
    "name": "listAdAccounts",
    "method": "GET",
    "path": "/v1/ads/accounts",
    "group": "ads",
    "platforms": [
      "meta",
      "google",
      "tiktok",
      "linkedin",
      "pinterest",
      "x"
    ],
    "summary": "List ad accounts",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "adAccountId",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listAdAudiences",
    "name": "listAdAudiences",
    "method": "GET",
    "path": "/v1/ads/audiences",
    "group": "ads",
    "platforms": [
      "meta",
      "google",
      "tiktok",
      "linkedin",
      "pinterest",
      "x"
    ],
    "summary": "List custom audiences",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "adAccountId",
        "required": true
      },
      {
        "name": "platform",
        "required": false
      },
      {
        "name": "type",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listAdCampaigns",
    "name": "listAdCampaigns",
    "method": "GET",
    "path": "/v1/ads/campaigns",
    "group": "ads",
    "platforms": [
      "meta",
      "google",
      "tiktok",
      "linkedin",
      "pinterest",
      "x"
    ],
    "summary": "List campaigns",
    "pathParams": [],
    "query": [
      {
        "name": "includeEmpty",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "source",
        "required": false
      },
      {
        "name": "platform",
        "required": false
      },
      {
        "name": "status",
        "required": false
      },
      {
        "name": "adAccountId",
        "required": false
      },
      {
        "name": "pageId",
        "required": false
      },
      {
        "name": "accountId",
        "required": false
      },
      {
        "name": "profileId",
        "required": false
      },
      {
        "name": "fromDate",
        "required": false
      },
      {
        "name": "toDate",
        "required": false
      },
      {
        "name": "hasDelivery",
        "required": false
      },
      {
        "name": "minSpend",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listAdCatalogProductSets",
    "name": "listAdCatalogProductSets",
    "method": "GET",
    "path": "/v1/ads/catalogs/{catalogId}/product-sets",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "List a catalog's product sets",
    "pathParams": [
      "catalogId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "listAdCatalogs",
    "name": "listAdCatalogs",
    "method": "GET",
    "path": "/v1/ads/catalogs",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "List Meta product catalogs",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "adAccountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "listAdCreatives",
    "name": "listAdCreatives",
    "method": "GET",
    "path": "/v1/ads/creatives",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Creative library",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "adAccountId",
        "required": true
      },
      {
        "name": "fields",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "after",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listAdImages",
    "name": "listAdImages",
    "method": "GET",
    "path": "/v1/ads/images",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Ad image library",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "adAccountId",
        "required": true
      },
      {
        "name": "fields",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "after",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listAdKeywords",
    "name": "listAdKeywords",
    "method": "GET",
    "path": "/v1/ads/keywords",
    "group": "ads",
    "platforms": [
      "google"
    ],
    "summary": "List Search keywords",
    "pathParams": [],
    "query": [
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "accountId",
        "required": false
      },
      {
        "name": "adAccountId",
        "required": false
      },
      {
        "name": "profileId",
        "required": false
      },
      {
        "name": "campaignId",
        "required": false
      },
      {
        "name": "adSetId",
        "required": false
      },
      {
        "name": "status",
        "required": false
      },
      {
        "name": "matchType",
        "required": false
      },
      {
        "name": "negative",
        "required": false
      },
      {
        "name": "search",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listAdLabels",
    "name": "listAdLabels",
    "method": "GET",
    "path": "/v1/ads/labels",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Ad labels",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "adAccountId",
        "required": true
      },
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "after",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listAds",
    "name": "listAds",
    "method": "GET",
    "path": "/v1/ads",
    "group": "ads",
    "platforms": [
      "meta",
      "google",
      "tiktok",
      "linkedin",
      "pinterest",
      "x"
    ],
    "summary": "List ads",
    "pathParams": [],
    "query": [
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "source",
        "required": false
      },
      {
        "name": "status",
        "required": false
      },
      {
        "name": "platform",
        "required": false
      },
      {
        "name": "accountId",
        "required": false
      },
      {
        "name": "adAccountId",
        "required": false
      },
      {
        "name": "pageId",
        "required": false
      },
      {
        "name": "profileId",
        "required": false
      },
      {
        "name": "campaignId",
        "required": false
      },
      {
        "name": "platformAdId",
        "required": false
      },
      {
        "name": "effectiveObjectStoryId",
        "required": false
      },
      {
        "name": "effectiveInstagramMediaId",
        "required": false
      },
      {
        "name": "fromDate",
        "required": false
      },
      {
        "name": "toDate",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listAdsBusinessCenters",
    "name": "listAdsBusinessCenters",
    "method": "GET",
    "path": "/v1/ads/business-centers",
    "group": "ads",
    "platforms": [
      "tiktok"
    ],
    "summary": "List TikTok Business Centers",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "listAdStudies",
    "name": "listAdStudies",
    "method": "GET",
    "path": "/v1/ads/studies",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "A/B tests and lift studies",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "adAccountId",
        "required": true
      },
      {
        "name": "fields",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "after",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listAdVideos",
    "name": "listAdVideos",
    "method": "GET",
    "path": "/v1/ads/videos",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Ad video library",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "adAccountId",
        "required": true
      },
      {
        "name": "fields",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "after",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listConversionAssociations",
    "name": "listConversionAssociations",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/conversion-destinations/{destinationId}/associations",
    "group": "ads",
    "platforms": [
      "meta",
      "google",
      "tiktok",
      "linkedin"
    ],
    "summary": "List associated campaigns",
    "pathParams": [
      "accountId",
      "destinationId"
    ],
    "query": [
      {
        "name": "adAccountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "listConversionDestinations",
    "name": "listConversionDestinations",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/conversion-destinations",
    "group": "ads",
    "platforms": [
      "meta",
      "google",
      "tiktok",
      "linkedin"
    ],
    "summary": "List conversion destinations",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "listHighDemandPeriods",
    "name": "listHighDemandPeriods",
    "method": "GET",
    "path": "/v1/ads/high-demand-periods",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "High demand periods / budget schedules",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "campaignId",
        "required": false
      },
      {
        "name": "adSetId",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "after",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listLeadForms",
    "name": "listLeadForms",
    "method": "GET",
    "path": "/v1/ads/lead-forms",
    "group": "ads",
    "platforms": [
      "meta",
      "linkedin"
    ],
    "summary": "List lead forms",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "adAccountId",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "cursor",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listLocalServicesLeadConversations",
    "name": "listLocalServicesLeadConversations",
    "method": "GET",
    "path": "/v1/ads/local-services/leads/{leadId}/conversations",
    "group": "ads",
    "platforms": [
      "google"
    ],
    "summary": "Conversations of a Local Services lead",
    "pathParams": [
      "leadId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "customerId",
        "required": false
      },
      {
        "name": "pageToken",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listLocalServicesLeads",
    "name": "listLocalServicesLeads",
    "method": "GET",
    "path": "/v1/ads/local-services/leads",
    "group": "ads",
    "platforms": [
      "google"
    ],
    "summary": "Google Local Services Ads leads",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "customerId",
        "required": false
      },
      {
        "name": "fromDate",
        "required": false
      },
      {
        "name": "toDate",
        "required": false
      },
      {
        "name": "leadType",
        "required": false
      },
      {
        "name": "leadStatus",
        "required": false
      },
      {
        "name": "chargedOnly",
        "required": false
      },
      {
        "name": "pageToken",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listMetaBusinesses",
    "name": "listMetaBusinesses",
    "method": "GET",
    "path": "/v1/ads/businesses",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Businesses list",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "after",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listTrackingTags",
    "name": "listTrackingTags",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/tracking-tags",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "List tracking tags",
    "pathParams": [
      "accountId"
    ],
    "query": [
      {
        "name": "adAccountId",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listTrackingTagSharedAccounts",
    "name": "listTrackingTagSharedAccounts",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/tracking-tags/{tagId}/shared-accounts",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "List accounts it is shared with",
    "pathParams": [
      "accountId",
      "tagId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "listValueRuleSets",
    "name": "listValueRuleSets",
    "method": "GET",
    "path": "/v1/ads/value-rule-sets",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "List value rule sets",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "adAccountId",
        "required": true
      },
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "after",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listWhatsAppConversions",
    "name": "listWhatsAppConversions",
    "method": "GET",
    "path": "/v1/whatsapp/conversions",
    "group": "ads",
    "platforms": null,
    "summary": "List conversion events",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "limit",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "queryAdInsights",
    "name": "queryAdInsights",
    "method": "GET",
    "path": "/v1/ads/insights",
    "group": "ads",
    "platforms": [
      "meta",
      "google"
    ],
    "summary": "Flexible live insights query",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "objectId",
        "required": false
      },
      {
        "name": "query",
        "required": false
      },
      {
        "name": "customerId",
        "required": false
      },
      {
        "name": "pageToken",
        "required": false
      },
      {
        "name": "level",
        "required": false
      },
      {
        "name": "fields",
        "required": false
      },
      {
        "name": "breakdowns",
        "required": false
      },
      {
        "name": "actionBreakdowns",
        "required": false
      },
      {
        "name": "actionAttributionWindows",
        "required": false
      },
      {
        "name": "actionReportTime",
        "required": false
      },
      {
        "name": "useUnifiedAttributionSetting",
        "required": false
      },
      {
        "name": "filtering",
        "required": false
      },
      {
        "name": "datePreset",
        "required": false
      },
      {
        "name": "fromDate",
        "required": false
      },
      {
        "name": "toDate",
        "required": false
      },
      {
        "name": "timeIncrement",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "after",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "removeConversionAssociations",
    "name": "removeConversionAssociations",
    "method": "DELETE",
    "path": "/v1/accounts/{accountId}/conversion-destinations/{destinationId}/associations",
    "group": "ads",
    "platforms": [
      "meta",
      "google",
      "tiktok",
      "linkedin"
    ],
    "summary": "Remove associated campaigns",
    "pathParams": [
      "accountId",
      "destinationId"
    ],
    "query": [
      {
        "name": "adAccountId",
        "required": true
      },
      {
        "name": "campaignIds",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "removeTrackingTagSharedAccount",
    "name": "removeTrackingTagSharedAccount",
    "method": "DELETE",
    "path": "/v1/accounts/{accountId}/tracking-tags/{tagId}/shared-accounts",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Stop sharing with an account",
    "pathParams": [
      "accountId",
      "tagId"
    ],
    "query": [
      {
        "name": "adAccountId",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "replaceAdAudienceCompanies",
    "name": "replaceAdAudienceCompanies",
    "method": "POST",
    "path": "/v1/ads/audiences/{audienceId}/companies",
    "group": "ads",
    "platforms": [
      "linkedin"
    ],
    "summary": "Replace audience companies",
    "pathParams": [
      "audienceId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "reserveRfPrediction",
    "name": "reserveRfPrediction",
    "method": "POST",
    "path": "/v1/ads/rf-predictions/{predictionId}/reserve",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Reserve a Reach & Frequency prediction",
    "pathParams": [
      "predictionId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "searchAdInterests",
    "name": "searchAdInterests",
    "method": "GET",
    "path": "/v1/ads/interests",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Search targeting interests",
    "pathParams": [],
    "query": [
      {
        "name": "q",
        "required": true
      },
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "searchAdTargeting",
    "name": "searchAdTargeting",
    "method": "GET",
    "path": "/v1/ads/targeting/search",
    "group": "ads",
    "platforms": [
      "meta",
      "google",
      "tiktok",
      "linkedin",
      "pinterest"
    ],
    "summary": "Search targeting options",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "q",
        "required": true
      },
      {
        "name": "dimension",
        "required": false
      },
      {
        "name": "geoType",
        "required": false
      },
      {
        "name": "countryCode",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "sendConversions",
    "name": "sendConversions",
    "method": "POST",
    "path": "/v1/ads/conversions",
    "group": "ads",
    "platforms": [
      "meta",
      "google",
      "tiktok",
      "linkedin"
    ],
    "summary": "Send conversion events",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "sendWhatsAppConversion",
    "name": "sendWhatsAppConversion",
    "method": "POST",
    "path": "/v1/whatsapp/conversions",
    "group": "ads",
    "platforms": null,
    "summary": "Send WhatsApp conversion event",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updateAd",
    "name": "updateAd",
    "method": "PUT",
    "path": "/v1/ads/{adId}",
    "group": "ads",
    "platforms": [
      "meta",
      "google",
      "tiktok",
      "linkedin",
      "pinterest",
      "x"
    ],
    "summary": "Update ad",
    "pathParams": [
      "adId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updateAdAccount",
    "name": "updateAdAccount",
    "method": "PATCH",
    "path": "/v1/ads/accounts",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Update ad account settings",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updateAdAudience",
    "name": "updateAdAudience",
    "method": "PUT",
    "path": "/v1/ads/audiences/{audienceId}",
    "group": "ads",
    "platforms": [
      "meta",
      "google",
      "tiktok",
      "linkedin",
      "pinterest",
      "x"
    ],
    "summary": "Update an audience",
    "pathParams": [
      "audienceId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updateAdCampaign",
    "name": "updateAdCampaign",
    "method": "PUT",
    "path": "/v1/ads/campaigns/{campaignId}",
    "group": "ads",
    "platforms": [
      "meta",
      "google",
      "tiktok",
      "linkedin",
      "pinterest",
      "x",
      "openai"
    ],
    "summary": "Update a campaign",
    "pathParams": [
      "campaignId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updateAdCampaignStatus",
    "name": "updateAdCampaignStatus",
    "method": "PUT",
    "path": "/v1/ads/campaigns/{campaignId}/status",
    "group": "ads",
    "platforms": [
      "meta",
      "google",
      "tiktok",
      "linkedin",
      "pinterest",
      "x",
      "openai"
    ],
    "summary": "Pause or resume a campaign",
    "pathParams": [
      "campaignId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updateAdCreative",
    "name": "updateAdCreative",
    "method": "PUT",
    "path": "/v1/ads/creatives/{creativeId}",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Rename a creative",
    "pathParams": [
      "creativeId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updateAdSet",
    "name": "updateAdSet",
    "method": "PUT",
    "path": "/v1/ads/ad-sets/{adSetId}",
    "group": "ads",
    "platforms": [
      "meta",
      "google",
      "tiktok",
      "linkedin",
      "pinterest",
      "x",
      "openai"
    ],
    "summary": "Update an ad set",
    "pathParams": [
      "adSetId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updateAdSetStatus",
    "name": "updateAdSetStatus",
    "method": "PUT",
    "path": "/v1/ads/ad-sets/{adSetId}/status",
    "group": "ads",
    "platforms": [
      "meta",
      "tiktok"
    ],
    "summary": "Pause or resume a single ad set",
    "pathParams": [
      "adSetId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updateAdStatus",
    "name": "updateAdStatus",
    "method": "PUT",
    "path": "/v1/ads/{adId}/status",
    "group": "ads",
    "platforms": [
      "meta",
      "google",
      "tiktok",
      "linkedin",
      "pinterest",
      "x"
    ],
    "summary": "Pause or resume a single ad",
    "pathParams": [
      "adId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updateAdTrackingTags",
    "name": "updateAdTrackingTags",
    "method": "PATCH",
    "path": "/v1/ads/{adId}/tracking-tags",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Set ad tracking tags",
    "pathParams": [
      "adId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updateConversionDestination",
    "name": "updateConversionDestination",
    "method": "PATCH",
    "path": "/v1/accounts/{accountId}/conversion-destinations/{destinationId}",
    "group": "ads",
    "platforms": [
      "meta",
      "google",
      "tiktok",
      "linkedin"
    ],
    "summary": "Update a conversion destination",
    "pathParams": [
      "accountId",
      "destinationId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updateTrackingTag",
    "name": "updateTrackingTag",
    "method": "PATCH",
    "path": "/v1/accounts/{accountId}/tracking-tags/{tagId}",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Update a tracking tag",
    "pathParams": [
      "accountId",
      "tagId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updateValueRuleSet",
    "name": "updateValueRuleSet",
    "method": "PUT",
    "path": "/v1/ads/value-rule-sets/{valueRuleSetId}",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Replace a value rule set",
    "pathParams": [
      "valueRuleSetId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "uploadAdImage",
    "name": "uploadAdImage",
    "method": "POST",
    "path": "/v1/ads/images",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Upload an ad image from base64",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "uploadAdVideo",
    "name": "uploadAdVideo",
    "method": "POST",
    "path": "/v1/ads/videos",
    "group": "ads",
    "platforms": [
      "meta"
    ],
    "summary": "Upload an ad video",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "getAnalytics",
    "name": "getAnalytics",
    "method": "GET",
    "path": "/v1/analytics",
    "group": "analytics",
    "platforms": null,
    "summary": "Get post analytics",
    "pathParams": [],
    "query": [
      {
        "name": "postId",
        "required": false
      },
      {
        "name": "platform",
        "required": false
      },
      {
        "name": "profileId",
        "required": false
      },
      {
        "name": "accountId",
        "required": false
      },
      {
        "name": "source",
        "required": false
      },
      {
        "name": "fromDate",
        "required": false
      },
      {
        "name": "toDate",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "page",
        "required": false
      },
      {
        "name": "sortBy",
        "required": false
      },
      {
        "name": "order",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getBestTimeToPost",
    "name": "getBestTimeToPost",
    "method": "GET",
    "path": "/v1/analytics/best-time",
    "group": "analytics",
    "platforms": null,
    "summary": "Get best times to post",
    "pathParams": [],
    "query": [
      {
        "name": "platform",
        "required": false
      },
      {
        "name": "profileId",
        "required": false
      },
      {
        "name": "accountId",
        "required": false
      },
      {
        "name": "source",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getContentDecay",
    "name": "getContentDecay",
    "method": "GET",
    "path": "/v1/analytics/content-decay",
    "group": "analytics",
    "platforms": null,
    "summary": "Get content performance decay",
    "pathParams": [],
    "query": [
      {
        "name": "platform",
        "required": false
      },
      {
        "name": "profileId",
        "required": false
      },
      {
        "name": "accountId",
        "required": false
      },
      {
        "name": "source",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getDailyMetrics",
    "name": "getDailyMetrics",
    "method": "GET",
    "path": "/v1/analytics/daily-metrics",
    "group": "analytics",
    "platforms": null,
    "summary": "Get daily aggregated metrics",
    "pathParams": [],
    "query": [
      {
        "name": "platform",
        "required": false
      },
      {
        "name": "profileId",
        "required": false
      },
      {
        "name": "accountId",
        "required": false
      },
      {
        "name": "fromDate",
        "required": false
      },
      {
        "name": "toDate",
        "required": false
      },
      {
        "name": "source",
        "required": false
      },
      {
        "name": "attribution",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getFacebookPageInsights",
    "name": "getFacebookPageInsights",
    "method": "GET",
    "path": "/v1/analytics/facebook/page-insights",
    "group": "analytics",
    "platforms": null,
    "summary": "Get Facebook Page insights",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "metrics",
        "required": false
      },
      {
        "name": "since",
        "required": false
      },
      {
        "name": "until",
        "required": false
      },
      {
        "name": "metricType",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getFacebookPostEarnings",
    "name": "getFacebookPostEarnings",
    "method": "GET",
    "path": "/v1/analytics/facebook/post-earnings",
    "group": "analytics",
    "platforms": null,
    "summary": "Get Facebook post monetization earnings",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "postId",
        "required": true
      },
      {
        "name": "metrics",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getFacebookPostReactions",
    "name": "getFacebookPostReactions",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/facebook-post-reactions",
    "group": "analytics",
    "platforms": null,
    "summary": "Get Facebook post reactions",
    "pathParams": [
      "accountId"
    ],
    "query": [
      {
        "name": "postId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "getFollowerStats",
    "name": "getFollowerStats",
    "method": "GET",
    "path": "/v1/accounts/follower-stats",
    "group": "analytics",
    "platforms": null,
    "summary": "Get follower stats",
    "pathParams": [],
    "query": [
      {
        "name": "accountIds",
        "required": false
      },
      {
        "name": "profileId",
        "required": false
      },
      {
        "name": "fromDate",
        "required": false
      },
      {
        "name": "toDate",
        "required": false
      },
      {
        "name": "granularity",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getGoogleBusinessPerformance",
    "name": "getGoogleBusinessPerformance",
    "method": "GET",
    "path": "/v1/analytics/googlebusiness/performance",
    "group": "analytics",
    "platforms": null,
    "summary": "Get GBP performance metrics",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "metrics",
        "required": false
      },
      {
        "name": "startDate",
        "required": false
      },
      {
        "name": "endDate",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getGoogleBusinessSearchKeywords",
    "name": "getGoogleBusinessSearchKeywords",
    "method": "GET",
    "path": "/v1/analytics/googlebusiness/search-keywords",
    "group": "analytics",
    "platforms": null,
    "summary": "Get GBP search keywords",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "startMonth",
        "required": false
      },
      {
        "name": "endMonth",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getInboxHeatmap",
    "name": "getInboxHeatmap",
    "method": "GET",
    "path": "/v1/analytics/inbox/heatmap",
    "group": "analytics",
    "platforms": null,
    "summary": "Get day × hour heatmap",
    "pathParams": [],
    "query": [
      {
        "name": "fromDate",
        "required": true
      },
      {
        "name": "toDate",
        "required": false
      },
      {
        "name": "profileId",
        "required": false
      },
      {
        "name": "platform",
        "required": false
      },
      {
        "name": "accountId",
        "required": false
      },
      {
        "name": "source",
        "required": false
      },
      {
        "name": "action",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getInboxResponseTime",
    "name": "getInboxResponseTime",
    "method": "GET",
    "path": "/v1/analytics/inbox/response-time",
    "group": "analytics",
    "platforms": null,
    "summary": "Get inbox response-time stats",
    "pathParams": [],
    "query": [
      {
        "name": "fromDate",
        "required": true
      },
      {
        "name": "toDate",
        "required": false
      },
      {
        "name": "profileId",
        "required": false
      },
      {
        "name": "platform",
        "required": false
      },
      {
        "name": "accountId",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getInboxSourceBreakdown",
    "name": "getInboxSourceBreakdown",
    "method": "GET",
    "path": "/v1/analytics/inbox/source-breakdown",
    "group": "analytics",
    "platforms": null,
    "summary": "Get inbox source breakdown",
    "pathParams": [],
    "query": [
      {
        "name": "fromDate",
        "required": true
      },
      {
        "name": "toDate",
        "required": false
      },
      {
        "name": "profileId",
        "required": false
      },
      {
        "name": "platform",
        "required": false
      },
      {
        "name": "accountId",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getInboxTopAccounts",
    "name": "getInboxTopAccounts",
    "method": "GET",
    "path": "/v1/analytics/inbox/top-accounts",
    "group": "analytics",
    "platforms": null,
    "summary": "Get top accounts by inbox volume",
    "pathParams": [],
    "query": [
      {
        "name": "fromDate",
        "required": true
      },
      {
        "name": "toDate",
        "required": false
      },
      {
        "name": "profileId",
        "required": false
      },
      {
        "name": "platform",
        "required": false
      },
      {
        "name": "source",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getInboxVolume",
    "name": "getInboxVolume",
    "method": "GET",
    "path": "/v1/analytics/inbox/volume",
    "group": "analytics",
    "platforms": null,
    "summary": "Get inbox messaging volume",
    "pathParams": [],
    "query": [
      {
        "name": "fromDate",
        "required": true
      },
      {
        "name": "toDate",
        "required": false
      },
      {
        "name": "profileId",
        "required": false
      },
      {
        "name": "platform",
        "required": false
      },
      {
        "name": "accountId",
        "required": false
      },
      {
        "name": "source",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getInstagramAccountInsights",
    "name": "getInstagramAccountInsights",
    "method": "GET",
    "path": "/v1/analytics/instagram/account-insights",
    "group": "analytics",
    "platforms": null,
    "summary": "Get Instagram insights",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "metrics",
        "required": false
      },
      {
        "name": "since",
        "required": false
      },
      {
        "name": "until",
        "required": false
      },
      {
        "name": "metricType",
        "required": false
      },
      {
        "name": "breakdown",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getInstagramDemographics",
    "name": "getInstagramDemographics",
    "method": "GET",
    "path": "/v1/analytics/instagram/demographics",
    "group": "analytics",
    "platforms": null,
    "summary": "Get Instagram demographics",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "metric",
        "required": false
      },
      {
        "name": "breakdown",
        "required": false
      },
      {
        "name": "timeframe",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getInstagramFollowerHistory",
    "name": "getInstagramFollowerHistory",
    "method": "GET",
    "path": "/v1/analytics/instagram/follower-history",
    "group": "analytics",
    "platforms": null,
    "summary": "Get Instagram follower history",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "metrics",
        "required": false
      },
      {
        "name": "since",
        "required": false
      },
      {
        "name": "until",
        "required": false
      },
      {
        "name": "metricType",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getInstagramStoryInsights",
    "name": "getInstagramStoryInsights",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/instagram/stories/{storyId}/insights",
    "group": "analytics",
    "platforms": null,
    "summary": "Get Instagram story insights",
    "pathParams": [
      "accountId",
      "storyId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getLinkedInAggregateAnalytics",
    "name": "getLinkedInAggregateAnalytics",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/linkedin-aggregate-analytics",
    "group": "analytics",
    "platforms": null,
    "summary": "Get LinkedIn aggregate stats",
    "pathParams": [
      "accountId"
    ],
    "query": [
      {
        "name": "aggregation",
        "required": false
      },
      {
        "name": "startDate",
        "required": false
      },
      {
        "name": "endDate",
        "required": false
      },
      {
        "name": "metrics",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getLinkedInOrgAggregateAnalytics",
    "name": "getLinkedInOrgAggregateAnalytics",
    "method": "GET",
    "path": "/v1/analytics/linkedin/org-aggregate-analytics",
    "group": "analytics",
    "platforms": null,
    "summary": "Get LinkedIn org analytics",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "metrics",
        "required": false
      },
      {
        "name": "since",
        "required": false
      },
      {
        "name": "until",
        "required": false
      },
      {
        "name": "metricType",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getLinkedInPostAnalytics",
    "name": "getLinkedInPostAnalytics",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/linkedin-post-analytics",
    "group": "analytics",
    "platforms": null,
    "summary": "Get LinkedIn post stats",
    "pathParams": [
      "accountId"
    ],
    "query": [
      {
        "name": "urn",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "getLinkedInPostReactions",
    "name": "getLinkedInPostReactions",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/linkedin-post-reactions",
    "group": "analytics",
    "platforms": null,
    "summary": "Get LinkedIn post reactions",
    "pathParams": [
      "accountId"
    ],
    "query": [
      {
        "name": "urn",
        "required": true
      },
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "cursor",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getPostingFrequency",
    "name": "getPostingFrequency",
    "method": "GET",
    "path": "/v1/analytics/posting-frequency",
    "group": "analytics",
    "platforms": null,
    "summary": "Get frequency vs engagement",
    "pathParams": [],
    "query": [
      {
        "name": "platform",
        "required": false
      },
      {
        "name": "profileId",
        "required": false
      },
      {
        "name": "accountId",
        "required": false
      },
      {
        "name": "source",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getPostTimeline",
    "name": "getPostTimeline",
    "method": "GET",
    "path": "/v1/analytics/post-timeline",
    "group": "analytics",
    "platforms": null,
    "summary": "Get post analytics timeline",
    "pathParams": [],
    "query": [
      {
        "name": "postId",
        "required": true
      },
      {
        "name": "fromDate",
        "required": false
      },
      {
        "name": "toDate",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getTikTokAccountInsights",
    "name": "getTikTokAccountInsights",
    "method": "GET",
    "path": "/v1/analytics/tiktok/account-insights",
    "group": "analytics",
    "platforms": null,
    "summary": "Get TikTok account-level insights",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "metrics",
        "required": false
      },
      {
        "name": "since",
        "required": false
      },
      {
        "name": "until",
        "required": false
      },
      {
        "name": "metricType",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getYouTubeChannelInsights",
    "name": "getYouTubeChannelInsights",
    "method": "GET",
    "path": "/v1/analytics/youtube/channel-insights",
    "group": "analytics",
    "platforms": null,
    "summary": "Get YouTube channel insights",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "metrics",
        "required": false
      },
      {
        "name": "since",
        "required": false
      },
      {
        "name": "until",
        "required": false
      },
      {
        "name": "metricType",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getYouTubeDailyViews",
    "name": "getYouTubeDailyViews",
    "method": "GET",
    "path": "/v1/analytics/youtube/daily-views",
    "group": "analytics",
    "platforms": null,
    "summary": "Get YouTube daily views",
    "pathParams": [],
    "query": [
      {
        "name": "videoId",
        "required": true
      },
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "startDate",
        "required": false
      },
      {
        "name": "endDate",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getYouTubeDemographics",
    "name": "getYouTubeDemographics",
    "method": "GET",
    "path": "/v1/analytics/youtube/demographics",
    "group": "analytics",
    "platforms": null,
    "summary": "Get YouTube demographics",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "videoId",
        "required": false
      },
      {
        "name": "breakdown",
        "required": false
      },
      {
        "name": "startDate",
        "required": false
      },
      {
        "name": "endDate",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getYouTubeVideoRetention",
    "name": "getYouTubeVideoRetention",
    "method": "GET",
    "path": "/v1/analytics/youtube/video-retention",
    "group": "analytics",
    "platforms": null,
    "summary": "Get YouTube video retention curve",
    "pathParams": [],
    "query": [
      {
        "name": "videoId",
        "required": true
      },
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "startDate",
        "required": false
      },
      {
        "name": "endDate",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listInstagramStories",
    "name": "listInstagramStories",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/instagram/stories",
    "group": "analytics",
    "platforms": null,
    "summary": "List active Instagram stories",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getBilling",
    "name": "getBilling",
    "method": "GET",
    "path": "/v1/billing",
    "group": "billing",
    "platforms": null,
    "summary": "Account billing snapshot (plan, cycle, balance, caps, status)",
    "pathParams": [],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getCallsUsage",
    "name": "getCallsUsage",
    "method": "GET",
    "path": "/v1/usage/calls",
    "group": "billing",
    "platforms": null,
    "summary": "Calling usage and cost",
    "pathParams": [],
    "query": [
      {
        "name": "since",
        "required": false
      },
      {
        "name": "until",
        "required": false
      },
      {
        "name": "channel",
        "required": false
      },
      {
        "name": "number",
        "required": false
      },
      {
        "name": "groupBy",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getSmsUsage",
    "name": "getSmsUsage",
    "method": "GET",
    "path": "/v1/usage/sms",
    "group": "billing",
    "platforms": null,
    "summary": "SMS usage (volumes)",
    "pathParams": [],
    "query": [
      {
        "name": "since",
        "required": false
      },
      {
        "name": "until",
        "required": false
      },
      {
        "name": "number",
        "required": false
      },
      {
        "name": "groupBy",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getUsage",
    "name": "getUsage",
    "method": "GET",
    "path": "/v1/usage",
    "group": "billing",
    "platforms": null,
    "summary": "Usage snapshot (default) or billed-spend metering (with params)",
    "pathParams": [],
    "query": [
      {
        "name": "reconcile",
        "required": false
      },
      {
        "name": "range",
        "required": false
      },
      {
        "name": "from",
        "required": false
      },
      {
        "name": "to",
        "required": false
      },
      {
        "name": "granularity",
        "required": false
      },
      {
        "name": "groupBy",
        "required": false
      },
      {
        "name": "profileId",
        "required": false
      },
      {
        "name": "accountId",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getUsageStats",
    "name": "getUsageStats",
    "method": "GET",
    "path": "/v1/usage-stats",
    "group": "billing",
    "platforms": null,
    "summary": "Get plan and usage snapshot (plan, limits, payment status)",
    "pathParams": [],
    "query": [
      {
        "name": "reconcile",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getXApiPricing",
    "name": "getXApiPricing",
    "method": "GET",
    "path": "/v1/billing/x-pricing",
    "group": "billing",
    "platforms": null,
    "summary": "Get X/Twitter API pricing table",
    "pathParams": [],
    "query": [],
    "hasBody": false
  },
  {
    "id": "addDiscordMemberRole",
    "name": "addDiscordMemberRole",
    "method": "PUT",
    "path": "/v1/discord/guilds/{guildId}/members/{userId}/roles/{roleId}",
    "group": "contacts",
    "platforms": null,
    "summary": "Assign a role to a guild member",
    "pathParams": [
      "guildId",
      "userId",
      "roleId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "blockWhatsAppUsers",
    "name": "blockWhatsAppUsers",
    "method": "POST",
    "path": "/v1/whatsapp/block-users",
    "group": "contacts",
    "platforms": null,
    "summary": "Block users",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "bulkCreateContacts",
    "name": "bulkCreateContacts",
    "method": "POST",
    "path": "/v1/contacts/bulk",
    "group": "contacts",
    "platforms": null,
    "summary": "Bulk create contacts",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "clearContactFieldValue",
    "name": "clearContactFieldValue",
    "method": "DELETE",
    "path": "/v1/contacts/{contactId}/fields/{slug}",
    "group": "contacts",
    "platforms": null,
    "summary": "Clear custom field value",
    "pathParams": [
      "contactId",
      "slug"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "createContact",
    "name": "createContact",
    "method": "POST",
    "path": "/v1/contacts",
    "group": "contacts",
    "platforms": null,
    "summary": "Create contact",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "createTestLead",
    "name": "createTestLead",
    "method": "POST",
    "path": "/v1/ads/lead-forms/{formId}/test-leads",
    "group": "contacts",
    "platforms": [
      "meta"
    ],
    "summary": "Create a test lead",
    "pathParams": [
      "formId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "deleteContact",
    "name": "deleteContact",
    "method": "DELETE",
    "path": "/v1/contacts/{contactId}",
    "group": "contacts",
    "platforms": null,
    "summary": "Delete contact",
    "pathParams": [
      "contactId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getContact",
    "name": "getContact",
    "method": "GET",
    "path": "/v1/contacts/{contactId}",
    "group": "contacts",
    "platforms": null,
    "summary": "Get contact",
    "pathParams": [
      "contactId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getContactChannels",
    "name": "getContactChannels",
    "method": "GET",
    "path": "/v1/contacts/{contactId}/channels",
    "group": "contacts",
    "platforms": null,
    "summary": "List channels for a contact",
    "pathParams": [
      "contactId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getDiscordGuildMember",
    "name": "getDiscordGuildMember",
    "method": "GET",
    "path": "/v1/discord/guilds/{guildId}/members/{userId}",
    "group": "contacts",
    "platforms": null,
    "summary": "Get a Discord guild member",
    "pathParams": [
      "guildId",
      "userId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "getWhatsAppBlockedUsers",
    "name": "getWhatsAppBlockedUsers",
    "method": "GET",
    "path": "/v1/whatsapp/block-users",
    "group": "contacts",
    "platforms": null,
    "summary": "List blocked users",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "after",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getWhatsAppBlockStatus",
    "name": "getWhatsAppBlockStatus",
    "method": "GET",
    "path": "/v1/whatsapp/block-users/status",
    "group": "contacts",
    "platforms": null,
    "summary": "Check if a user is blocked",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "user",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "getWhatsAppCallPermissions",
    "name": "getWhatsAppCallPermissions",
    "method": "GET",
    "path": "/v1/whatsapp/call-permissions",
    "group": "contacts",
    "platforms": null,
    "summary": "Check call permission",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "to",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "getWhatsAppNumberInfo",
    "name": "getWhatsAppNumberInfo",
    "method": "GET",
    "path": "/v1/whatsapp/number-info",
    "group": "contacts",
    "platforms": null,
    "summary": "Get number status",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "listContacts",
    "name": "listContacts",
    "method": "GET",
    "path": "/v1/contacts",
    "group": "contacts",
    "platforms": null,
    "summary": "List contacts",
    "pathParams": [],
    "query": [
      {
        "name": "profileId",
        "required": false
      },
      {
        "name": "accountId",
        "required": false
      },
      {
        "name": "search",
        "required": false
      },
      {
        "name": "tag",
        "required": false
      },
      {
        "name": "tags",
        "required": false
      },
      {
        "name": "platform",
        "required": false
      },
      {
        "name": "isSubscribed",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "skip",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listDiscordGuildMembers",
    "name": "listDiscordGuildMembers",
    "method": "GET",
    "path": "/v1/discord/guilds/{guildId}/members",
    "group": "contacts",
    "platforms": null,
    "summary": "List Discord guild members",
    "pathParams": [
      "guildId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "after",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listFormLeads",
    "name": "listFormLeads",
    "method": "GET",
    "path": "/v1/ads/lead-forms/{formId}/leads",
    "group": "contacts",
    "platforms": [
      "meta"
    ],
    "summary": "List leads for a single form",
    "pathParams": [
      "formId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "cursor",
        "required": false
      },
      {
        "name": "since",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listLeads",
    "name": "listLeads",
    "method": "GET",
    "path": "/v1/ads/leads",
    "group": "contacts",
    "platforms": [
      "meta",
      "linkedin"
    ],
    "summary": "List submitted leads",
    "pathParams": [],
    "query": [
      {
        "name": "formId",
        "required": false
      },
      {
        "name": "accountId",
        "required": false
      },
      {
        "name": "adAccountId",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "since",
        "required": false
      },
      {
        "name": "cursor",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listSlackMembers",
    "name": "listSlackMembers",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/slack-members",
    "group": "contacts",
    "platforms": null,
    "summary": "List Slack workspace members",
    "pathParams": [
      "accountId"
    ],
    "query": [
      {
        "name": "query",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listSmsOptOuts",
    "name": "listSmsOptOuts",
    "method": "GET",
    "path": "/v1/sms/opt-outs",
    "group": "contacts",
    "platforms": null,
    "summary": "List SMS opt-outs",
    "pathParams": [],
    "query": [
      {
        "name": "format",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "removeDiscordMemberRole",
    "name": "removeDiscordMemberRole",
    "method": "DELETE",
    "path": "/v1/discord/guilds/{guildId}/members/{userId}/roles/{roleId}",
    "group": "contacts",
    "platforms": null,
    "summary": "Remove a role from a guild member",
    "pathParams": [
      "guildId",
      "userId",
      "roleId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "searchDiscordGuildMembers",
    "name": "searchDiscordGuildMembers",
    "method": "GET",
    "path": "/v1/discord/guilds/{guildId}/members/search",
    "group": "contacts",
    "platforms": null,
    "summary": "Search Discord guild members",
    "pathParams": [
      "guildId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "query",
        "required": true
      },
      {
        "name": "limit",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "setContactFieldValue",
    "name": "setContactFieldValue",
    "method": "PUT",
    "path": "/v1/contacts/{contactId}/fields/{slug}",
    "group": "contacts",
    "platforms": null,
    "summary": "Set custom field value",
    "pathParams": [
      "contactId",
      "slug"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "unblockWhatsAppUsers",
    "name": "unblockWhatsAppUsers",
    "method": "DELETE",
    "path": "/v1/whatsapp/block-users",
    "group": "contacts",
    "platforms": null,
    "summary": "Unblock users",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updateContact",
    "name": "updateContact",
    "method": "PATCH",
    "path": "/v1/contacts/{contactId}",
    "group": "contacts",
    "platforms": null,
    "summary": "Update contact",
    "pathParams": [
      "contactId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "uploadSmsOptInProof",
    "name": "uploadSmsOptInProof",
    "method": "POST",
    "path": "/v1/sms/registrations/{id}/opt-in-proof",
    "group": "contacts",
    "platforms": null,
    "summary": "Upload opt-in form proof for an appeal",
    "pathParams": [
      "id"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "uploadSmsOptInProofFile",
    "name": "uploadSmsOptInProofFile",
    "method": "POST",
    "path": "/v1/sms/opt-in-proof",
    "group": "contacts",
    "platforms": null,
    "summary": "Upload opt-in form proof",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "batchGetGoogleBusinessReviews",
    "name": "batchGetGoogleBusinessReviews",
    "method": "POST",
    "path": "/v1/accounts/{accountId}/gmb-reviews/batch",
    "group": "engagement",
    "platforms": null,
    "summary": "Batch get reviews",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "bookmarkPost",
    "name": "bookmarkPost",
    "method": "POST",
    "path": "/v1/twitter/bookmark",
    "group": "engagement",
    "platforms": null,
    "summary": "Bookmark a tweet",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "createDiscordGuildRole",
    "name": "createDiscordGuildRole",
    "method": "POST",
    "path": "/v1/discord/guilds/{guildId}/roles",
    "group": "engagement",
    "platforms": null,
    "summary": "Create a Discord guild role",
    "pathParams": [
      "guildId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": true
  },
  {
    "id": "createDiscordScheduledEvent",
    "name": "createDiscordScheduledEvent",
    "method": "POST",
    "path": "/v1/discord/guilds/{guildId}/events",
    "group": "engagement",
    "platforms": null,
    "summary": "Create a Discord scheduled event",
    "pathParams": [
      "guildId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "createDiscordThread",
    "name": "createDiscordThread",
    "method": "POST",
    "path": "/v1/discord/channels/{channelId}/threads",
    "group": "engagement",
    "platforms": null,
    "summary": "Create a Discord public thread",
    "pathParams": [
      "channelId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": true
  },
  {
    "id": "crosspostDiscordMessage",
    "name": "crosspostDiscordMessage",
    "method": "POST",
    "path": "/v1/discord/channels/{channelId}/messages/{messageId}/crosspost",
    "group": "engagement",
    "platforms": null,
    "summary": "Crosspost Discord message",
    "pathParams": [
      "channelId",
      "messageId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "deleteDiscordGuildRole",
    "name": "deleteDiscordGuildRole",
    "method": "DELETE",
    "path": "/v1/discord/guilds/{guildId}/roles/{roleId}",
    "group": "engagement",
    "platforms": null,
    "summary": "Delete a Discord guild role",
    "pathParams": [
      "guildId",
      "roleId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "deleteDiscordMessage",
    "name": "deleteDiscordMessage",
    "method": "DELETE",
    "path": "/v1/discord/channels/{channelId}/messages/{messageId}",
    "group": "engagement",
    "platforms": null,
    "summary": "Delete a Discord channel message",
    "pathParams": [
      "channelId",
      "messageId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "deleteDiscordScheduledEvent",
    "name": "deleteDiscordScheduledEvent",
    "method": "DELETE",
    "path": "/v1/discord/guilds/{guildId}/events/{eventId}",
    "group": "engagement",
    "platforms": null,
    "summary": "Delete a Discord scheduled event",
    "pathParams": [
      "guildId",
      "eventId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "deleteGoogleBusinessReviewReply",
    "name": "deleteGoogleBusinessReviewReply",
    "method": "DELETE",
    "path": "/v1/accounts/{accountId}/gmb-reviews/{reviewId}/reply",
    "group": "engagement",
    "platforms": null,
    "summary": "Delete a review reply",
    "pathParams": [
      "accountId",
      "reviewId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "deleteInboxComment",
    "name": "deleteInboxComment",
    "method": "DELETE",
    "path": "/v1/inbox/comments/{postId}",
    "group": "engagement",
    "platforms": null,
    "summary": "Delete comment",
    "pathParams": [
      "postId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "commentId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "deleteInboxReviewReply",
    "name": "deleteInboxReviewReply",
    "method": "DELETE",
    "path": "/v1/inbox/reviews/{reviewId}/reply",
    "group": "engagement",
    "platforms": null,
    "summary": "Delete review reply",
    "pathParams": [
      "reviewId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "editDiscordGuildRole",
    "name": "editDiscordGuildRole",
    "method": "PATCH",
    "path": "/v1/discord/guilds/{guildId}/roles/{roleId}",
    "group": "engagement",
    "platforms": null,
    "summary": "Edit a Discord guild role",
    "pathParams": [
      "guildId",
      "roleId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": true
  },
  {
    "id": "editInboxComment",
    "name": "editInboxComment",
    "method": "PATCH",
    "path": "/v1/inbox/comments/{postId}/{commentId}",
    "group": "engagement",
    "platforms": null,
    "summary": "Edit comment",
    "pathParams": [
      "postId",
      "commentId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "followUser",
    "name": "followUser",
    "method": "POST",
    "path": "/v1/twitter/follow",
    "group": "engagement",
    "platforms": null,
    "summary": "Follow a user",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "getAdComments",
    "name": "getAdComments",
    "method": "GET",
    "path": "/v1/ads/{adId}/comments",
    "group": "engagement",
    "platforms": [
      "meta"
    ],
    "summary": "List comments on an ad",
    "pathParams": [
      "adId"
    ],
    "query": [
      {
        "name": "placement",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "cursor",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getDiscordScheduledEvent",
    "name": "getDiscordScheduledEvent",
    "method": "GET",
    "path": "/v1/discord/guilds/{guildId}/events/{eventId}",
    "group": "engagement",
    "platforms": null,
    "summary": "Get a Discord scheduled event",
    "pathParams": [
      "guildId",
      "eventId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "getGoogleBusinessReview",
    "name": "getGoogleBusinessReview",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/gmb-reviews/{reviewId}",
    "group": "engagement",
    "platforms": null,
    "summary": "Get a review",
    "pathParams": [
      "accountId",
      "reviewId"
    ],
    "query": [
      {
        "name": "locationId",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getGoogleBusinessReviews",
    "name": "getGoogleBusinessReviews",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/gmb-reviews",
    "group": "engagement",
    "platforms": null,
    "summary": "Get reviews",
    "pathParams": [
      "accountId"
    ],
    "query": [
      {
        "name": "locationId",
        "required": false
      },
      {
        "name": "pageSize",
        "required": false
      },
      {
        "name": "pageToken",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getInboxPostComments",
    "name": "getInboxPostComments",
    "method": "GET",
    "path": "/v1/inbox/comments/{postId}",
    "group": "engagement",
    "platforms": null,
    "summary": "Get post comments",
    "pathParams": [
      "postId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "subreddit",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "cursor",
        "required": false
      },
      {
        "name": "commentId",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getRedditFeed",
    "name": "getRedditFeed",
    "method": "GET",
    "path": "/v1/reddit/feed",
    "group": "engagement",
    "platforms": null,
    "summary": "Get subreddit feed",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "subreddit",
        "required": false
      },
      {
        "name": "sort",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "after",
        "required": false
      },
      {
        "name": "t",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getTweet",
    "name": "getTweet",
    "method": "GET",
    "path": "/v1/twitter/tweet",
    "group": "engagement",
    "platforms": null,
    "summary": "Look up a tweet",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "id",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "hideInboxComment",
    "name": "hideInboxComment",
    "method": "POST",
    "path": "/v1/inbox/comments/{postId}/{commentId}/hide",
    "group": "engagement",
    "platforms": null,
    "summary": "Hide comment",
    "pathParams": [
      "postId",
      "commentId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "likeInboxComment",
    "name": "likeInboxComment",
    "method": "POST",
    "path": "/v1/inbox/comments/{postId}/{commentId}/like",
    "group": "engagement",
    "platforms": null,
    "summary": "Like comment",
    "pathParams": [
      "postId",
      "commentId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "listDiscordGuildRoles",
    "name": "listDiscordGuildRoles",
    "method": "GET",
    "path": "/v1/discord/guilds/{guildId}/roles",
    "group": "engagement",
    "platforms": null,
    "summary": "List Discord guild roles",
    "pathParams": [
      "guildId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "listDiscordPinnedMessages",
    "name": "listDiscordPinnedMessages",
    "method": "GET",
    "path": "/v1/discord/channels/{channelId}/pins",
    "group": "engagement",
    "platforms": null,
    "summary": "List pinned messages",
    "pathParams": [
      "channelId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "listDiscordScheduledEvents",
    "name": "listDiscordScheduledEvents",
    "method": "GET",
    "path": "/v1/discord/guilds/{guildId}/events",
    "group": "engagement",
    "platforms": null,
    "summary": "List Discord scheduled events",
    "pathParams": [
      "guildId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "withUserCount",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listInboxComments",
    "name": "listInboxComments",
    "method": "GET",
    "path": "/v1/inbox/comments",
    "group": "engagement",
    "platforms": null,
    "summary": "List commented posts",
    "pathParams": [],
    "query": [
      {
        "name": "profileId",
        "required": false
      },
      {
        "name": "platform",
        "required": false
      },
      {
        "name": "minComments",
        "required": false
      },
      {
        "name": "since",
        "required": false
      },
      {
        "name": "sortBy",
        "required": false
      },
      {
        "name": "sortOrder",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "cursor",
        "required": false
      },
      {
        "name": "accountId",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listInboxMentions",
    "name": "listInboxMentions",
    "method": "GET",
    "path": "/v1/inbox/mentions",
    "group": "engagement",
    "platforms": null,
    "summary": "List mentions",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": false
      },
      {
        "name": "profileId",
        "required": false
      },
      {
        "name": "sortOrder",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "cursor",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listInboxReviews",
    "name": "listInboxReviews",
    "method": "GET",
    "path": "/v1/inbox/reviews",
    "group": "engagement",
    "platforms": null,
    "summary": "List reviews",
    "pathParams": [],
    "query": [
      {
        "name": "profileId",
        "required": false
      },
      {
        "name": "platform",
        "required": false
      },
      {
        "name": "minRating",
        "required": false
      },
      {
        "name": "maxRating",
        "required": false
      },
      {
        "name": "hasReply",
        "required": false
      },
      {
        "name": "sortBy",
        "required": false
      },
      {
        "name": "sortOrder",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "cursor",
        "required": false
      },
      {
        "name": "accountId",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "pinDiscordMessage",
    "name": "pinDiscordMessage",
    "method": "PUT",
    "path": "/v1/discord/channels/{channelId}/pins/{messageId}",
    "group": "engagement",
    "platforms": null,
    "summary": "Pin a Discord message",
    "pathParams": [
      "channelId",
      "messageId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "removeBookmark",
    "name": "removeBookmark",
    "method": "DELETE",
    "path": "/v1/twitter/bookmark",
    "group": "engagement",
    "platforms": null,
    "summary": "Remove bookmark",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "tweetId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "replyToGoogleBusinessReview",
    "name": "replyToGoogleBusinessReview",
    "method": "POST",
    "path": "/v1/accounts/{accountId}/gmb-reviews/{reviewId}/reply",
    "group": "engagement",
    "platforms": null,
    "summary": "Reply to a review",
    "pathParams": [
      "accountId",
      "reviewId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "replyToInboxPost",
    "name": "replyToInboxPost",
    "method": "POST",
    "path": "/v1/inbox/comments/{postId}",
    "group": "engagement",
    "platforms": null,
    "summary": "Reply to comment",
    "pathParams": [
      "postId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "replyToInboxReview",
    "name": "replyToInboxReview",
    "method": "POST",
    "path": "/v1/inbox/reviews/{reviewId}/reply",
    "group": "engagement",
    "platforms": null,
    "summary": "Reply to review",
    "pathParams": [
      "reviewId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "replyToMention",
    "name": "replyToMention",
    "method": "POST",
    "path": "/v1/inbox/mentions/reply",
    "group": "engagement",
    "platforms": null,
    "summary": "Reply to a mention",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "retweetPost",
    "name": "retweetPost",
    "method": "POST",
    "path": "/v1/twitter/retweet",
    "group": "engagement",
    "platforms": null,
    "summary": "Retweet a post",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "searchReddit",
    "name": "searchReddit",
    "method": "GET",
    "path": "/v1/reddit/search",
    "group": "engagement",
    "platforms": null,
    "summary": "Search posts",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "subreddit",
        "required": false
      },
      {
        "name": "q",
        "required": true
      },
      {
        "name": "restrict_sr",
        "required": false
      },
      {
        "name": "sort",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "after",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "searchTweets",
    "name": "searchTweets",
    "method": "GET",
    "path": "/v1/twitter/search",
    "group": "engagement",
    "platforms": null,
    "summary": "Search recent tweets",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "query",
        "required": true
      },
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "sinceId",
        "required": false
      },
      {
        "name": "untilId",
        "required": false
      },
      {
        "name": "startTime",
        "required": false
      },
      {
        "name": "endTime",
        "required": false
      },
      {
        "name": "cursor",
        "required": false
      },
      {
        "name": "sortOrder",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "setCommentModeration",
    "name": "setCommentModeration",
    "method": "POST",
    "path": "/v1/inbox/comments/{postId}/{commentId}/moderation",
    "group": "engagement",
    "platforms": null,
    "summary": "Set comment moderation status",
    "pathParams": [
      "postId",
      "commentId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "undoRetweet",
    "name": "undoRetweet",
    "method": "DELETE",
    "path": "/v1/twitter/retweet",
    "group": "engagement",
    "platforms": null,
    "summary": "Undo retweet",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "tweetId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "unfollowUser",
    "name": "unfollowUser",
    "method": "DELETE",
    "path": "/v1/twitter/follow",
    "group": "engagement",
    "platforms": null,
    "summary": "Unfollow a user",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "targetUserId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "unhideInboxComment",
    "name": "unhideInboxComment",
    "method": "DELETE",
    "path": "/v1/inbox/comments/{postId}/{commentId}/hide",
    "group": "engagement",
    "platforms": null,
    "summary": "Unhide comment",
    "pathParams": [
      "postId",
      "commentId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "unlikeInboxComment",
    "name": "unlikeInboxComment",
    "method": "DELETE",
    "path": "/v1/inbox/comments/{postId}/{commentId}/like",
    "group": "engagement",
    "platforms": null,
    "summary": "Unlike comment",
    "pathParams": [
      "postId",
      "commentId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "likeUri",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "unpinDiscordMessage",
    "name": "unpinDiscordMessage",
    "method": "DELETE",
    "path": "/v1/discord/channels/{channelId}/pins/{messageId}",
    "group": "engagement",
    "platforms": null,
    "summary": "Unpin a Discord message",
    "pathParams": [
      "channelId",
      "messageId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "updateDiscordScheduledEvent",
    "name": "updateDiscordScheduledEvent",
    "method": "PATCH",
    "path": "/v1/discord/guilds/{guildId}/events/{eventId}",
    "group": "engagement",
    "platforms": null,
    "summary": "Update a Discord scheduled event",
    "pathParams": [
      "guildId",
      "eventId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "voteRedditThing",
    "name": "voteRedditThing",
    "method": "POST",
    "path": "/v1/accounts/{accountId}/reddit-vote",
    "group": "engagement",
    "platforms": null,
    "summary": "Vote on a Reddit post or comment",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "activateSequence",
    "name": "activateSequence",
    "method": "POST",
    "path": "/v1/sequences/{sequenceId}/activate",
    "group": "messages",
    "platforms": null,
    "summary": "Activate sequence",
    "pathParams": [
      "sequenceId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "addBroadcastRecipients",
    "name": "addBroadcastRecipients",
    "method": "POST",
    "path": "/v1/broadcasts/{broadcastId}/recipients",
    "group": "messages",
    "platforms": null,
    "summary": "Add recipients to a broadcast",
    "pathParams": [
      "broadcastId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "addMessageReaction",
    "name": "addMessageReaction",
    "method": "POST",
    "path": "/v1/inbox/conversations/{conversationId}/messages/{messageId}/reactions",
    "group": "messages",
    "platforms": null,
    "summary": "Add reaction",
    "pathParams": [
      "conversationId",
      "messageId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "addWhatsAppGroupParticipants",
    "name": "addWhatsAppGroupParticipants",
    "method": "POST",
    "path": "/v1/whatsapp/wa-groups/{groupId}/participants",
    "group": "messages",
    "platforms": null,
    "summary": "Add participants",
    "pathParams": [
      "groupId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": true
  },
  {
    "id": "approveWhatsAppGroupJoinRequests",
    "name": "approveWhatsAppGroupJoinRequests",
    "method": "POST",
    "path": "/v1/whatsapp/wa-groups/{groupId}/join-requests",
    "group": "messages",
    "platforms": null,
    "summary": "Approve join requests",
    "pathParams": [
      "groupId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": true
  },
  {
    "id": "cancelBroadcast",
    "name": "cancelBroadcast",
    "method": "POST",
    "path": "/v1/broadcasts/{broadcastId}/cancel",
    "group": "messages",
    "platforms": null,
    "summary": "Cancel broadcast",
    "pathParams": [
      "broadcastId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "createBroadcast",
    "name": "createBroadcast",
    "method": "POST",
    "path": "/v1/broadcasts",
    "group": "messages",
    "platforms": null,
    "summary": "Create broadcast draft",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "createCommentAutomation",
    "name": "createCommentAutomation",
    "method": "POST",
    "path": "/v1/comment-automations",
    "group": "messages",
    "platforms": null,
    "summary": "Create comment-to-DM automation",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "createInboxConversation",
    "name": "createInboxConversation",
    "method": "POST",
    "path": "/v1/inbox/conversations",
    "group": "messages",
    "platforms": null,
    "summary": "Create conversation",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "createSequence",
    "name": "createSequence",
    "method": "POST",
    "path": "/v1/sequences",
    "group": "messages",
    "platforms": null,
    "summary": "Create sequence",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "createVoiceCall",
    "name": "createVoiceCall",
    "method": "POST",
    "path": "/v1/voice/calls",
    "group": "messages",
    "platforms": null,
    "summary": "Place an outbound phone call",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "createVoiceWebSession",
    "name": "createVoiceWebSession",
    "method": "POST",
    "path": "/v1/voice/calls/web",
    "group": "messages",
    "platforms": null,
    "summary": "Mint a browser softphone session",
    "pathParams": [],
    "query": [],
    "hasBody": false
  },
  {
    "id": "createWhatsAppGroupChat",
    "name": "createWhatsAppGroupChat",
    "method": "POST",
    "path": "/v1/whatsapp/wa-groups",
    "group": "messages",
    "platforms": null,
    "summary": "Create group",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "createWhatsAppGroupInviteLink",
    "name": "createWhatsAppGroupInviteLink",
    "method": "POST",
    "path": "/v1/whatsapp/wa-groups/{groupId}/invite-link",
    "group": "messages",
    "platforms": null,
    "summary": "Create invite link",
    "pathParams": [
      "groupId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "createWhatsAppSandboxSession",
    "name": "createWhatsAppSandboxSession",
    "method": "POST",
    "path": "/v1/whatsapp/sandbox/sessions",
    "group": "messages",
    "platforms": null,
    "summary": "Start a sandbox activation",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "deleteBroadcast",
    "name": "deleteBroadcast",
    "method": "DELETE",
    "path": "/v1/broadcasts/{broadcastId}",
    "group": "messages",
    "platforms": null,
    "summary": "Delete broadcast",
    "pathParams": [
      "broadcastId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "deleteCommentAutomation",
    "name": "deleteCommentAutomation",
    "method": "DELETE",
    "path": "/v1/comment-automations/{automationId}",
    "group": "messages",
    "platforms": null,
    "summary": "Delete automation",
    "pathParams": [
      "automationId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "deleteInboxMessage",
    "name": "deleteInboxMessage",
    "method": "DELETE",
    "path": "/v1/inbox/conversations/{conversationId}/messages/{messageId}",
    "group": "messages",
    "platforms": null,
    "summary": "Delete message",
    "pathParams": [
      "conversationId",
      "messageId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "deleteSequence",
    "name": "deleteSequence",
    "method": "DELETE",
    "path": "/v1/sequences/{sequenceId}",
    "group": "messages",
    "platforms": null,
    "summary": "Delete sequence",
    "pathParams": [
      "sequenceId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "deleteWhatsAppGroupChat",
    "name": "deleteWhatsAppGroupChat",
    "method": "DELETE",
    "path": "/v1/whatsapp/wa-groups/{groupId}",
    "group": "messages",
    "platforms": null,
    "summary": "Delete group",
    "pathParams": [
      "groupId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "deleteWhatsAppSandboxSession",
    "name": "deleteWhatsAppSandboxSession",
    "method": "DELETE",
    "path": "/v1/whatsapp/sandbox/sessions/{sessionId}",
    "group": "messages",
    "platforms": null,
    "summary": "Revoke a sandbox session",
    "pathParams": [
      "sessionId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "dialVoiceWebCall",
    "name": "dialVoiceWebCall",
    "method": "POST",
    "path": "/v1/voice/calls/web/dial",
    "group": "messages",
    "platforms": null,
    "summary": "Dial from the browser softphone",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "editInboxMessage",
    "name": "editInboxMessage",
    "method": "PATCH",
    "path": "/v1/inbox/conversations/{conversationId}/messages/{messageId}",
    "group": "messages",
    "platforms": null,
    "summary": "Edit message",
    "pathParams": [
      "conversationId",
      "messageId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "endVoiceCall",
    "name": "endVoiceCall",
    "method": "POST",
    "path": "/v1/voice/calls/{id}/end",
    "group": "messages",
    "platforms": null,
    "summary": "Hang up a live call",
    "pathParams": [
      "id"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "enrollContacts",
    "name": "enrollContacts",
    "method": "POST",
    "path": "/v1/sequences/{sequenceId}/enroll",
    "group": "messages",
    "platforms": null,
    "summary": "Enroll contacts in a sequence",
    "pathParams": [
      "sequenceId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "getBroadcast",
    "name": "getBroadcast",
    "method": "GET",
    "path": "/v1/broadcasts/{broadcastId}",
    "group": "messages",
    "platforms": null,
    "summary": "Get broadcast details",
    "pathParams": [
      "broadcastId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getCall",
    "name": "getCall",
    "method": "GET",
    "path": "/v1/calls/{id}",
    "group": "messages",
    "platforms": null,
    "summary": "Get a call (any channel)",
    "pathParams": [
      "id"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getCallRecording",
    "name": "getCallRecording",
    "method": "GET",
    "path": "/v1/calls/{id}/recording",
    "group": "messages",
    "platforms": null,
    "summary": "Get a call recording",
    "pathParams": [
      "id"
    ],
    "query": [
      {
        "name": "as",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getCommentAutomation",
    "name": "getCommentAutomation",
    "method": "GET",
    "path": "/v1/comment-automations/{automationId}",
    "group": "messages",
    "platforms": null,
    "summary": "Get automation details",
    "pathParams": [
      "automationId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getInboxConversation",
    "name": "getInboxConversation",
    "method": "GET",
    "path": "/v1/inbox/conversations/{conversationId}",
    "group": "messages",
    "platforms": null,
    "summary": "Get conversation",
    "pathParams": [
      "conversationId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "getInboxConversationAnalytics",
    "name": "getInboxConversationAnalytics",
    "method": "GET",
    "path": "/v1/analytics/inbox/conversations/{conversationId}",
    "group": "messages",
    "platforms": null,
    "summary": "Get conversation analytics",
    "pathParams": [
      "conversationId"
    ],
    "query": [
      {
        "name": "fromDate",
        "required": true
      },
      {
        "name": "toDate",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getInboxConversationMessages",
    "name": "getInboxConversationMessages",
    "method": "GET",
    "path": "/v1/inbox/conversations/{conversationId}/messages",
    "group": "messages",
    "platforms": null,
    "summary": "List messages",
    "pathParams": [
      "conversationId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "cursor",
        "required": false
      },
      {
        "name": "sortOrder",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getMessageAttachment",
    "name": "getMessageAttachment",
    "method": "GET",
    "path": "/v1/inbox/conversations/{conversationId}/messages/{messageId}/attachments/{index}",
    "group": "messages",
    "platforms": null,
    "summary": "Resolve message attachment",
    "pathParams": [
      "conversationId",
      "messageId",
      "index"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "format",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getSequence",
    "name": "getSequence",
    "method": "GET",
    "path": "/v1/sequences/{sequenceId}",
    "group": "messages",
    "platforms": null,
    "summary": "Get sequence with steps",
    "pathParams": [
      "sequenceId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getVoiceCall",
    "name": "getVoiceCall",
    "method": "GET",
    "path": "/v1/voice/calls/{id}",
    "group": "messages",
    "platforms": null,
    "summary": "Get a phone call",
    "pathParams": [
      "id"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getVoiceCallEstimate",
    "name": "getVoiceCallEstimate",
    "method": "GET",
    "path": "/v1/voice/calls/estimate",
    "group": "messages",
    "platforms": null,
    "summary": "Estimate call cost",
    "pathParams": [],
    "query": [
      {
        "name": "to",
        "required": true
      },
      {
        "name": "minutes",
        "required": false
      },
      {
        "name": "recording",
        "required": false
      },
      {
        "name": "transcription",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getVoiceCallRecording",
    "name": "getVoiceCallRecording",
    "method": "GET",
    "path": "/v1/voice/calls/{id}/recording",
    "group": "messages",
    "platforms": null,
    "summary": "Get a call recording",
    "pathParams": [
      "id"
    ],
    "query": [
      {
        "name": "as",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getWhatsAppCall",
    "name": "getWhatsAppCall",
    "method": "GET",
    "path": "/v1/whatsapp/calls/{id}",
    "group": "messages",
    "platforms": null,
    "summary": "Get a single call",
    "pathParams": [
      "id"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "getWhatsAppCallEstimate",
    "name": "getWhatsAppCallEstimate",
    "method": "GET",
    "path": "/v1/whatsapp/calls/estimate",
    "group": "messages",
    "platforms": null,
    "summary": "Estimate per-minute cost",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "to",
        "required": true
      },
      {
        "name": "minutes",
        "required": false
      },
      {
        "name": "recording",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getWhatsAppCallRecording",
    "name": "getWhatsAppCallRecording",
    "method": "GET",
    "path": "/v1/whatsapp/calls/{id}/recording",
    "group": "messages",
    "platforms": null,
    "summary": "Get a call recording",
    "pathParams": [
      "id"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "as",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getWhatsAppGroupChat",
    "name": "getWhatsAppGroupChat",
    "method": "GET",
    "path": "/v1/whatsapp/wa-groups/{groupId}",
    "group": "messages",
    "platforms": null,
    "summary": "Get group info",
    "pathParams": [
      "groupId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "getWhatsAppMedia",
    "name": "getWhatsAppMedia",
    "method": "GET",
    "path": "/v1/whatsapp/media/{mediaId}",
    "group": "messages",
    "platforms": null,
    "summary": "Download WhatsApp media",
    "pathParams": [
      "mediaId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "initiateWhatsAppCall",
    "name": "initiateWhatsAppCall",
    "method": "POST",
    "path": "/v1/whatsapp/calls",
    "group": "messages",
    "platforms": null,
    "summary": "Initiate outbound call",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "listBroadcastRecipients",
    "name": "listBroadcastRecipients",
    "method": "GET",
    "path": "/v1/broadcasts/{broadcastId}/recipients",
    "group": "messages",
    "platforms": null,
    "summary": "List broadcast recipients",
    "pathParams": [
      "broadcastId"
    ],
    "query": [
      {
        "name": "status",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "skip",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listBroadcasts",
    "name": "listBroadcasts",
    "method": "GET",
    "path": "/v1/broadcasts",
    "group": "messages",
    "platforms": null,
    "summary": "List broadcasts",
    "pathParams": [],
    "query": [
      {
        "name": "profileId",
        "required": false
      },
      {
        "name": "status",
        "required": false
      },
      {
        "name": "platform",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "skip",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listCalls",
    "name": "listCalls",
    "method": "GET",
    "path": "/v1/calls",
    "group": "messages",
    "platforms": null,
    "summary": "List all calls (unified history)",
    "pathParams": [],
    "query": [
      {
        "name": "channel",
        "required": false
      },
      {
        "name": "status",
        "required": false
      },
      {
        "name": "direction",
        "required": false
      },
      {
        "name": "number",
        "required": false
      },
      {
        "name": "search",
        "required": false
      },
      {
        "name": "before",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listCommentAutomationLogs",
    "name": "listCommentAutomationLogs",
    "method": "GET",
    "path": "/v1/comment-automations/{automationId}/logs",
    "group": "messages",
    "platforms": null,
    "summary": "List automation logs",
    "pathParams": [
      "automationId"
    ],
    "query": [
      {
        "name": "status",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "skip",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listCommentAutomations",
    "name": "listCommentAutomations",
    "method": "GET",
    "path": "/v1/comment-automations",
    "group": "messages",
    "platforms": null,
    "summary": "List comment-to-DM automations",
    "pathParams": [],
    "query": [
      {
        "name": "profileId",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listInboxConversationAnalytics",
    "name": "listInboxConversationAnalytics",
    "method": "GET",
    "path": "/v1/analytics/inbox/conversations",
    "group": "messages",
    "platforms": null,
    "summary": "List conversation analytics",
    "pathParams": [],
    "query": [
      {
        "name": "fromDate",
        "required": true
      },
      {
        "name": "toDate",
        "required": false
      },
      {
        "name": "profileId",
        "required": false
      },
      {
        "name": "platform",
        "required": false
      },
      {
        "name": "accountId",
        "required": false
      },
      {
        "name": "source",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "page",
        "required": false
      },
      {
        "name": "sortBy",
        "required": false
      },
      {
        "name": "order",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listInboxConversations",
    "name": "listInboxConversations",
    "method": "GET",
    "path": "/v1/inbox/conversations",
    "group": "messages",
    "platforms": null,
    "summary": "List conversations",
    "pathParams": [],
    "query": [
      {
        "name": "profileId",
        "required": false
      },
      {
        "name": "platform",
        "required": false
      },
      {
        "name": "status",
        "required": false
      },
      {
        "name": "sortOrder",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "cursor",
        "required": false
      },
      {
        "name": "accountId",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listSequenceEnrollments",
    "name": "listSequenceEnrollments",
    "method": "GET",
    "path": "/v1/sequences/{sequenceId}/enrollments",
    "group": "messages",
    "platforms": null,
    "summary": "List enrollments for a sequence",
    "pathParams": [
      "sequenceId"
    ],
    "query": [
      {
        "name": "status",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "skip",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listSequences",
    "name": "listSequences",
    "method": "GET",
    "path": "/v1/sequences",
    "group": "messages",
    "platforms": null,
    "summary": "List sequences",
    "pathParams": [],
    "query": [
      {
        "name": "profileId",
        "required": false
      },
      {
        "name": "status",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "skip",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listVoiceCalls",
    "name": "listVoiceCalls",
    "method": "GET",
    "path": "/v1/voice/calls",
    "group": "messages",
    "platforms": null,
    "summary": "List phone calls",
    "pathParams": [],
    "query": [
      {
        "name": "status",
        "required": false
      },
      {
        "name": "direction",
        "required": false
      },
      {
        "name": "number",
        "required": false
      },
      {
        "name": "before",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listWhatsAppCalls",
    "name": "listWhatsAppCalls",
    "method": "GET",
    "path": "/v1/whatsapp/calls",
    "group": "messages",
    "platforms": null,
    "summary": "List call history for an account",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "status",
        "required": false
      },
      {
        "name": "direction",
        "required": false
      },
      {
        "name": "since",
        "required": false
      },
      {
        "name": "until",
        "required": false
      },
      {
        "name": "before",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listWhatsAppFlowResponses",
    "name": "listWhatsAppFlowResponses",
    "method": "GET",
    "path": "/v1/whatsapp/flow-responses",
    "group": "messages",
    "platforms": null,
    "summary": "List flow responses",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "flowId",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listWhatsAppGroupChats",
    "name": "listWhatsAppGroupChats",
    "method": "GET",
    "path": "/v1/whatsapp/wa-groups",
    "group": "messages",
    "platforms": null,
    "summary": "List active groups",
    "pathParams": [],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "after",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listWhatsAppGroupJoinRequests",
    "name": "listWhatsAppGroupJoinRequests",
    "method": "GET",
    "path": "/v1/whatsapp/wa-groups/{groupId}/join-requests",
    "group": "messages",
    "platforms": null,
    "summary": "List join requests",
    "pathParams": [
      "groupId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "listWhatsAppSandboxSessions",
    "name": "listWhatsAppSandboxSessions",
    "method": "GET",
    "path": "/v1/whatsapp/sandbox/sessions",
    "group": "messages",
    "platforms": null,
    "summary": "List your sandbox sessions",
    "pathParams": [],
    "query": [],
    "hasBody": false
  },
  {
    "id": "listWorkflowExecutionEvents",
    "name": "listWorkflowExecutionEvents",
    "method": "GET",
    "path": "/v1/workflows/{workflowId}/executions/{executionId}/events",
    "group": "messages",
    "platforms": null,
    "summary": "Get an execution's timeline",
    "pathParams": [
      "workflowId",
      "executionId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "listWorkflowExecutions",
    "name": "listWorkflowExecutions",
    "method": "GET",
    "path": "/v1/workflows/{workflowId}/executions",
    "group": "messages",
    "platforms": null,
    "summary": "List workflow runs",
    "pathParams": [
      "workflowId"
    ],
    "query": [
      {
        "name": "status",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "skip",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "markConversationRead",
    "name": "markConversationRead",
    "method": "POST",
    "path": "/v1/inbox/conversations/{conversationId}/read",
    "group": "messages",
    "platforms": null,
    "summary": "Mark a conversation as read",
    "pathParams": [
      "conversationId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "pauseSequence",
    "name": "pauseSequence",
    "method": "POST",
    "path": "/v1/sequences/{sequenceId}/pause",
    "group": "messages",
    "platforms": null,
    "summary": "Pause sequence",
    "pathParams": [
      "sequenceId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "rejectWhatsAppGroupJoinRequests",
    "name": "rejectWhatsAppGroupJoinRequests",
    "method": "DELETE",
    "path": "/v1/whatsapp/wa-groups/{groupId}/join-requests",
    "group": "messages",
    "platforms": null,
    "summary": "Reject join requests",
    "pathParams": [
      "groupId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": true
  },
  {
    "id": "removeMessageReaction",
    "name": "removeMessageReaction",
    "method": "DELETE",
    "path": "/v1/inbox/conversations/{conversationId}/messages/{messageId}/reactions",
    "group": "messages",
    "platforms": null,
    "summary": "Remove reaction",
    "pathParams": [
      "conversationId",
      "messageId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "removeWhatsAppGroupParticipants",
    "name": "removeWhatsAppGroupParticipants",
    "method": "DELETE",
    "path": "/v1/whatsapp/wa-groups/{groupId}/participants",
    "group": "messages",
    "platforms": null,
    "summary": "Remove participants",
    "pathParams": [
      "groupId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": true
  },
  {
    "id": "scheduleBroadcast",
    "name": "scheduleBroadcast",
    "method": "POST",
    "path": "/v1/broadcasts/{broadcastId}/schedule",
    "group": "messages",
    "platforms": null,
    "summary": "Schedule broadcast for later",
    "pathParams": [
      "broadcastId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "searchInboxConversations",
    "name": "searchInboxConversations",
    "method": "GET",
    "path": "/v1/inbox/conversations/search",
    "group": "messages",
    "platforms": null,
    "summary": "Search conversations",
    "pathParams": [],
    "query": [
      {
        "name": "query",
        "required": true
      },
      {
        "name": "direction",
        "required": false
      },
      {
        "name": "profileId",
        "required": false
      },
      {
        "name": "platform",
        "required": false
      },
      {
        "name": "accountId",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "cursor",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "sendBroadcast",
    "name": "sendBroadcast",
    "method": "POST",
    "path": "/v1/broadcasts/{broadcastId}/send",
    "group": "messages",
    "platforms": null,
    "summary": "Send broadcast now",
    "pathParams": [
      "broadcastId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "sendDiscordDirectMessage",
    "name": "sendDiscordDirectMessage",
    "method": "POST",
    "path": "/v1/discord/dms",
    "group": "messages",
    "platforms": null,
    "summary": "Send a Discord Direct Message",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "sendInboxMessage",
    "name": "sendInboxMessage",
    "method": "POST",
    "path": "/v1/inbox/conversations/{conversationId}/messages",
    "group": "messages",
    "platforms": null,
    "summary": "Send message",
    "pathParams": [
      "conversationId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "sendPrivateReplyToComment",
    "name": "sendPrivateReplyToComment",
    "method": "POST",
    "path": "/v1/inbox/comments/{postId}/{commentId}/private-reply",
    "group": "messages",
    "platforms": null,
    "summary": "Send private reply",
    "pathParams": [
      "postId",
      "commentId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "sendSms",
    "name": "sendSms",
    "method": "POST",
    "path": "/v1/sms/messages",
    "group": "messages",
    "platforms": null,
    "summary": "Send an SMS/MMS",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "sendTypingIndicator",
    "name": "sendTypingIndicator",
    "method": "POST",
    "path": "/v1/inbox/conversations/{conversationId}/typing",
    "group": "messages",
    "platforms": null,
    "summary": "Send typing indicator",
    "pathParams": [
      "conversationId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "sendWhatsAppFlowMessage",
    "name": "sendWhatsAppFlowMessage",
    "method": "POST",
    "path": "/v1/whatsapp/flows/send",
    "group": "messages",
    "platforms": null,
    "summary": "Send flow message",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "transferVoiceCall",
    "name": "transferVoiceCall",
    "method": "POST",
    "path": "/v1/voice/calls/{id}/transfer",
    "group": "messages",
    "platforms": null,
    "summary": "Blind-transfer a live call",
    "pathParams": [
      "id"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "triggerWorkflow",
    "name": "triggerWorkflow",
    "method": "POST",
    "path": "/v1/workflows/{workflowId}/executions",
    "group": "messages",
    "platforms": null,
    "summary": "Manually start a workflow run",
    "pathParams": [
      "workflowId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "unenrollContact",
    "name": "unenrollContact",
    "method": "DELETE",
    "path": "/v1/sequences/{sequenceId}/enroll/{contactId}",
    "group": "messages",
    "platforms": null,
    "summary": "Unenroll contact",
    "pathParams": [
      "sequenceId",
      "contactId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "updateBroadcast",
    "name": "updateBroadcast",
    "method": "PATCH",
    "path": "/v1/broadcasts/{broadcastId}",
    "group": "messages",
    "platforms": null,
    "summary": "Update broadcast",
    "pathParams": [
      "broadcastId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updateCommentAutomation",
    "name": "updateCommentAutomation",
    "method": "PATCH",
    "path": "/v1/comment-automations/{automationId}",
    "group": "messages",
    "platforms": null,
    "summary": "Update automation settings",
    "pathParams": [
      "automationId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updateInboxConversation",
    "name": "updateInboxConversation",
    "method": "PUT",
    "path": "/v1/inbox/conversations/{conversationId}",
    "group": "messages",
    "platforms": null,
    "summary": "Update conversation status",
    "pathParams": [
      "conversationId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updateSequence",
    "name": "updateSequence",
    "method": "PATCH",
    "path": "/v1/sequences/{sequenceId}",
    "group": "messages",
    "platforms": null,
    "summary": "Update sequence",
    "pathParams": [
      "sequenceId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updateWhatsAppGroupChat",
    "name": "updateWhatsAppGroupChat",
    "method": "POST",
    "path": "/v1/whatsapp/wa-groups/{groupId}",
    "group": "messages",
    "platforms": null,
    "summary": "Update group settings",
    "pathParams": [
      "groupId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": true
  },
  {
    "id": "getInstagramFollowStatus",
    "name": "getInstagramFollowStatus",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/follow-status/{userId}",
    "group": "other",
    "platforms": [
      "instagram"
    ],
    "summary": "Check whether an Instagram user follows the account",
    "pathParams": [
      "accountId",
      "userId"
    ],
    "query": [
      {
        "name": "refresh",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "likePost",
    "name": "likePost",
    "method": "POST",
    "path": "/v1/inbox/posts/{postId}/like",
    "group": "other",
    "platforms": null,
    "summary": "Like post",
    "pathParams": [
      "postId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "listInstagramPages",
    "name": "listInstagramPages",
    "method": "GET",
    "path": "/v1/connect/instagram/select-account",
    "group": "other",
    "platforms": null,
    "summary": "List Pages with a linked Instagram account",
    "pathParams": [],
    "query": [
      {
        "name": "profileId",
        "required": true
      },
      {
        "name": "tempToken",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "selectInstagramAccount",
    "name": "selectInstagramAccount",
    "method": "POST",
    "path": "/v1/connect/instagram/select-account",
    "group": "other",
    "platforms": null,
    "summary": "Select the Page whose Instagram account to connect",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "unlikePost",
    "name": "unlikePost",
    "method": "DELETE",
    "path": "/v1/inbox/posts/{postId}/like",
    "group": "other",
    "platforms": null,
    "summary": "Unlike post",
    "pathParams": [
      "postId"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      },
      {
        "name": "likeUri",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getPendingOAuthData",
    "name": "getPendingOAuthData",
    "method": "GET",
    "path": "/v1/connect/pending-data",
    "group": "public",
    "platforms": null,
    "summary": "Get pending OAuth data",
    "pathParams": [],
    "query": [
      {
        "name": "token",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "listLinkedInOrganizations",
    "name": "listLinkedInOrganizations",
    "method": "GET",
    "path": "/v1/connect/linkedin/organizations",
    "group": "public",
    "platforms": null,
    "summary": "List LinkedIn orgs",
    "pathParams": [],
    "query": [
      {
        "name": "tempToken",
        "required": true
      },
      {
        "name": "orgIds",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "verifyCredential",
    "name": "verifyCredential",
    "method": "GET",
    "path": "/v1/auth/verify",
    "group": "public",
    "platforms": null,
    "summary": "Verify credential",
    "pathParams": [],
    "query": [],
    "hasBody": false
  },
  {
    "id": "bulkUploadPosts",
    "name": "bulkUploadPosts",
    "method": "POST",
    "path": "/v1/posts/bulk-upload",
    "group": "publishing",
    "platforms": null,
    "summary": "Bulk upload from CSV",
    "pathParams": [],
    "query": [
      {
        "name": "dryRun",
        "required": false
      }
    ],
    "hasBody": true
  },
  {
    "id": "createBlog",
    "name": "createBlog",
    "method": "POST",
    "path": "/v1/accounts/{accountId}/blogs",
    "group": "publishing",
    "platforms": [
      "shopify"
    ],
    "summary": "Create a blog",
    "pathParams": [
      "accountId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "createBlogArticle",
    "name": "createBlogArticle",
    "method": "POST",
    "path": "/v1/accounts/{accountId}/blogs/{blogId}/articles",
    "group": "publishing",
    "platforms": [
      "shopify"
    ],
    "summary": "Create a blog article",
    "pathParams": [
      "accountId",
      "blogId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "createPost",
    "name": "createPost",
    "method": "POST",
    "path": "/v1/posts",
    "group": "publishing",
    "platforms": null,
    "summary": "Create post",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "createQueueSlot",
    "name": "createQueueSlot",
    "method": "POST",
    "path": "/v1/queue/slots",
    "group": "publishing",
    "platforms": null,
    "summary": "Create schedule",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "deleteBlog",
    "name": "deleteBlog",
    "method": "DELETE",
    "path": "/v1/accounts/{accountId}/blogs/{blogId}",
    "group": "publishing",
    "platforms": [
      "shopify"
    ],
    "summary": "Delete a blog",
    "pathParams": [
      "accountId",
      "blogId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "deleteBlogArticle",
    "name": "deleteBlogArticle",
    "method": "DELETE",
    "path": "/v1/accounts/{accountId}/blogs/{blogId}/articles/{articleId}",
    "group": "publishing",
    "platforms": [
      "shopify"
    ],
    "summary": "Delete a blog article",
    "pathParams": [
      "accountId",
      "blogId",
      "articleId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "deletePost",
    "name": "deletePost",
    "method": "DELETE",
    "path": "/v1/posts/{postId}",
    "group": "publishing",
    "platforms": null,
    "summary": "Delete post",
    "pathParams": [
      "postId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "deleteQueueSlot",
    "name": "deleteQueueSlot",
    "method": "DELETE",
    "path": "/v1/queue/slots",
    "group": "publishing",
    "platforms": null,
    "summary": "Delete schedule",
    "pathParams": [],
    "query": [
      {
        "name": "profileId",
        "required": true
      },
      {
        "name": "queueId",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "editPost",
    "name": "editPost",
    "method": "POST",
    "path": "/v1/posts/{postId}/edit",
    "group": "publishing",
    "platforms": null,
    "summary": "Edit published post",
    "pathParams": [
      "postId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "getBlog",
    "name": "getBlog",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/blogs/{blogId}",
    "group": "publishing",
    "platforms": [
      "shopify"
    ],
    "summary": "Get a blog",
    "pathParams": [
      "accountId",
      "blogId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getBlogArticle",
    "name": "getBlogArticle",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/blogs/{blogId}/articles/{articleId}",
    "group": "publishing",
    "platforms": [
      "shopify"
    ],
    "summary": "Get a blog article",
    "pathParams": [
      "accountId",
      "blogId",
      "articleId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getMediaPresignedUrl",
    "name": "getMediaPresignedUrl",
    "method": "POST",
    "path": "/v1/media/presign",
    "group": "publishing",
    "platforms": null,
    "summary": "Get upload URL",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "getNextQueueSlot",
    "name": "getNextQueueSlot",
    "method": "GET",
    "path": "/v1/queue/next-slot",
    "group": "publishing",
    "platforms": null,
    "summary": "Get next available slot",
    "pathParams": [],
    "query": [
      {
        "name": "profileId",
        "required": true
      },
      {
        "name": "queueId",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getPost",
    "name": "getPost",
    "method": "GET",
    "path": "/v1/posts/{postId}",
    "group": "publishing",
    "platforms": null,
    "summary": "Get post",
    "pathParams": [
      "postId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "listBlogArticles",
    "name": "listBlogArticles",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/blogs/{blogId}/articles",
    "group": "publishing",
    "platforms": [
      "shopify"
    ],
    "summary": "List blog articles",
    "pathParams": [
      "accountId",
      "blogId"
    ],
    "query": [
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "cursor",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listBlogs",
    "name": "listBlogs",
    "method": "GET",
    "path": "/v1/accounts/{accountId}/blogs",
    "group": "publishing",
    "platforms": [
      "shopify"
    ],
    "summary": "List blogs",
    "pathParams": [
      "accountId"
    ],
    "query": [
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "cursor",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listLogs",
    "name": "listLogs",
    "method": "GET",
    "path": "/v1/logs",
    "group": "publishing",
    "platforms": null,
    "summary": "List activity logs",
    "pathParams": [],
    "query": [
      {
        "name": "type",
        "required": false
      },
      {
        "name": "status",
        "required": false
      },
      {
        "name": "platform",
        "required": false
      },
      {
        "name": "action",
        "required": false
      },
      {
        "name": "search",
        "required": false
      },
      {
        "name": "days",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "skip",
        "required": false
      },
      {
        "name": "account_id",
        "required": false
      },
      {
        "name": "event",
        "required": false
      },
      {
        "name": "request_id",
        "required": false
      },
      {
        "name": "from",
        "required": false
      },
      {
        "name": "to",
        "required": false
      },
      {
        "name": "status_code",
        "required": false
      },
      {
        "name": "api_key_id",
        "required": false
      },
      {
        "name": "include_read_receipts",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listPosts",
    "name": "listPosts",
    "method": "GET",
    "path": "/v1/posts",
    "group": "publishing",
    "platforms": null,
    "summary": "List posts",
    "pathParams": [],
    "query": [
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "source",
        "required": false
      },
      {
        "name": "status",
        "required": false
      },
      {
        "name": "platform",
        "required": false
      },
      {
        "name": "profileId",
        "required": false
      },
      {
        "name": "createdBy",
        "required": false
      },
      {
        "name": "dateFrom",
        "required": false
      },
      {
        "name": "dateTo",
        "required": false
      },
      {
        "name": "includeHidden",
        "required": false
      },
      {
        "name": "search",
        "required": false
      },
      {
        "name": "sortBy",
        "required": false
      },
      {
        "name": "accountId",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listQueueSlots",
    "name": "listQueueSlots",
    "method": "GET",
    "path": "/v1/queue/slots",
    "group": "publishing",
    "platforms": null,
    "summary": "List schedules",
    "pathParams": [],
    "query": [
      {
        "name": "profileId",
        "required": true
      },
      {
        "name": "queueId",
        "required": false
      },
      {
        "name": "all",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "previewQueue",
    "name": "previewQueue",
    "method": "GET",
    "path": "/v1/queue/preview",
    "group": "publishing",
    "platforms": null,
    "summary": "Preview upcoming slots",
    "pathParams": [],
    "query": [
      {
        "name": "profileId",
        "required": true
      },
      {
        "name": "queueId",
        "required": false
      },
      {
        "name": "count",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "retryPost",
    "name": "retryPost",
    "method": "POST",
    "path": "/v1/posts/{postId}/retry",
    "group": "publishing",
    "platforms": null,
    "summary": "Retry failed post",
    "pathParams": [
      "postId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "syncExternalPosts",
    "name": "syncExternalPosts",
    "method": "POST",
    "path": "/v1/posts/sync-external",
    "group": "publishing",
    "platforms": null,
    "summary": "Sync an external post",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "unpublishPost",
    "name": "unpublishPost",
    "method": "POST",
    "path": "/v1/posts/{postId}/unpublish",
    "group": "publishing",
    "platforms": null,
    "summary": "Unpublish post",
    "pathParams": [
      "postId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updateBlog",
    "name": "updateBlog",
    "method": "PATCH",
    "path": "/v1/accounts/{accountId}/blogs/{blogId}",
    "group": "publishing",
    "platforms": [
      "shopify"
    ],
    "summary": "Update a blog",
    "pathParams": [
      "accountId",
      "blogId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updateBlogArticle",
    "name": "updateBlogArticle",
    "method": "PATCH",
    "path": "/v1/accounts/{accountId}/blogs/{blogId}/articles/{articleId}",
    "group": "publishing",
    "platforms": [
      "shopify"
    ],
    "summary": "Update a blog article",
    "pathParams": [
      "accountId",
      "blogId",
      "articleId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updatePost",
    "name": "updatePost",
    "method": "PUT",
    "path": "/v1/posts/{postId}",
    "group": "publishing",
    "platforms": null,
    "summary": "Update post",
    "pathParams": [
      "postId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updatePostMetadata",
    "name": "updatePostMetadata",
    "method": "POST",
    "path": "/v1/posts/{postId}/update-metadata",
    "group": "publishing",
    "platforms": null,
    "summary": "Update post metadata",
    "pathParams": [
      "postId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updateQueueSlot",
    "name": "updateQueueSlot",
    "method": "PUT",
    "path": "/v1/queue/slots",
    "group": "publishing",
    "platforms": null,
    "summary": "Update schedule",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "uploadMediaDirect",
    "name": "uploadMediaDirect",
    "method": "POST",
    "path": "/v1/media/upload-direct",
    "group": "publishing",
    "platforms": null,
    "summary": "Upload media file",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "validateMedia",
    "name": "validateMedia",
    "method": "POST",
    "path": "/v1/tools/validate/media",
    "group": "publishing",
    "platforms": null,
    "summary": "Validate media URL",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "validatePost",
    "name": "validatePost",
    "method": "POST",
    "path": "/v1/tools/validate/post",
    "group": "publishing",
    "platforms": null,
    "summary": "Validate post content",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "validatePostLength",
    "name": "validatePostLength",
    "method": "POST",
    "path": "/v1/tools/validate/post-length",
    "group": "publishing",
    "platforms": null,
    "summary": "Validate character count",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "validateSubreddit",
    "name": "validateSubreddit",
    "method": "GET",
    "path": "/v1/tools/validate/subreddit",
    "group": "publishing",
    "platforms": null,
    "summary": "Check subreddit existence",
    "pathParams": [],
    "query": [
      {
        "name": "name",
        "required": true
      },
      {
        "name": "accountId",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "appealSmsRegistration",
    "name": "appealSmsRegistration",
    "method": "POST",
    "path": "/v1/sms/registrations/{id}/appeal",
    "group": "telephony",
    "platforms": null,
    "summary": "Appeal a rejected campaign",
    "pathParams": [
      "id"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "attachNumberToSipTrunk",
    "name": "attachNumberToSipTrunk",
    "method": "POST",
    "path": "/v1/phone-numbers/{id}/sip-trunk",
    "group": "telephony",
    "platforms": null,
    "summary": "Attach a number to a SIP trunk",
    "pathParams": [
      "id"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "cancelPhoneNumberPortIn",
    "name": "cancelPhoneNumberPortIn",
    "method": "DELETE",
    "path": "/v1/phone-numbers/port-in/{id}",
    "group": "telephony",
    "platforms": null,
    "summary": "Cancel a port-in",
    "pathParams": [
      "id"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "checkPhoneNumberAvailability",
    "name": "checkPhoneNumberAvailability",
    "method": "GET",
    "path": "/v1/phone-numbers/availability",
    "group": "telephony",
    "platforms": null,
    "summary": "Check country availability",
    "pathParams": [],
    "query": [
      {
        "name": "country",
        "required": true
      },
      {
        "name": "numberType",
        "required": false
      },
      {
        "name": "sms",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "checkPhoneNumberPortability",
    "name": "checkPhoneNumberPortability",
    "method": "POST",
    "path": "/v1/phone-numbers/port-in/check",
    "group": "telephony",
    "platforms": null,
    "summary": "Check portability",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "checkVerification",
    "name": "checkVerification",
    "method": "POST",
    "path": "/v1/verify/verifications/{verificationId}/check",
    "group": "telephony",
    "platforms": null,
    "summary": "Check a verification code",
    "pathParams": [
      "verificationId"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "checkWhatsAppNumberAvailability",
    "name": "checkWhatsAppNumberAvailability",
    "method": "GET",
    "path": "/v1/whatsapp/phone-numbers/availability",
    "group": "telephony",
    "platforms": null,
    "summary": "Check country availability",
    "pathParams": [],
    "query": [
      {
        "name": "country",
        "required": true
      },
      {
        "name": "numberType",
        "required": false
      },
      {
        "name": "sms",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "createPhoneNumberKycLink",
    "name": "createPhoneNumberKycLink",
    "method": "POST",
    "path": "/v1/phone-numbers/kyc/share",
    "group": "telephony",
    "platforms": null,
    "summary": "Create a hosted KYC link",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "createPhoneNumberPortIn",
    "name": "createPhoneNumberPortIn",
    "method": "POST",
    "path": "/v1/phone-numbers/port-in",
    "group": "telephony",
    "platforms": null,
    "summary": "Port numbers in",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "createPhoneNumberStockWatch",
    "name": "createPhoneNumberStockWatch",
    "method": "POST",
    "path": "/v1/phone-numbers/stock-watches",
    "group": "telephony",
    "platforms": null,
    "summary": "Watch an out-of-stock country",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "createSipTrunk",
    "name": "createSipTrunk",
    "method": "POST",
    "path": "/v1/phone-numbers/sip-trunks",
    "group": "telephony",
    "platforms": null,
    "summary": "Create a SIP trunk",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "createSmsSenderId",
    "name": "createSmsSenderId",
    "method": "POST",
    "path": "/v1/sms/sender-ids",
    "group": "telephony",
    "platforms": null,
    "summary": "Create an alphanumeric sender ID",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "createVerification",
    "name": "createVerification",
    "method": "POST",
    "path": "/v1/verify/verifications",
    "group": "telephony",
    "platforms": null,
    "summary": "Send a verification code",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "createWhatsAppNumberKycLink",
    "name": "createWhatsAppNumberKycLink",
    "method": "POST",
    "path": "/v1/whatsapp/phone-numbers/kyc/share",
    "group": "telephony",
    "platforms": null,
    "summary": "Create a hosted KYC link",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "deactivateSmsRegistration",
    "name": "deactivateSmsRegistration",
    "method": "DELETE",
    "path": "/v1/sms/registrations/{id}",
    "group": "telephony",
    "platforms": null,
    "summary": "Deactivate a brand/campaign registration",
    "pathParams": [
      "id"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "deletePhoneNumberStockWatch",
    "name": "deletePhoneNumberStockWatch",
    "method": "DELETE",
    "path": "/v1/phone-numbers/stock-watches/{id}",
    "group": "telephony",
    "platforms": null,
    "summary": "Stop watching a country",
    "pathParams": [
      "id"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "deleteSipTrunk",
    "name": "deleteSipTrunk",
    "method": "DELETE",
    "path": "/v1/phone-numbers/sip-trunks/{id}",
    "group": "telephony",
    "platforms": null,
    "summary": "Delete a SIP trunk",
    "pathParams": [
      "id"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "deleteSmsSenderId",
    "name": "deleteSmsSenderId",
    "method": "DELETE",
    "path": "/v1/sms/sender-ids/{id}",
    "group": "telephony",
    "platforms": null,
    "summary": "Delete an alphanumeric sender ID",
    "pathParams": [
      "id"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "detachNumberFromSipTrunk",
    "name": "detachNumberFromSipTrunk",
    "method": "DELETE",
    "path": "/v1/phone-numbers/{id}/sip-trunk",
    "group": "telephony",
    "platforms": null,
    "summary": "Detach a number from its SIP trunk",
    "pathParams": [
      "id"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "disableSmsOnNumber",
    "name": "disableSmsOnNumber",
    "method": "DELETE",
    "path": "/v1/phone-numbers/{id}/sms",
    "group": "telephony",
    "platforms": null,
    "summary": "Disable SMS on a number",
    "pathParams": [
      "id"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "disableVoiceOnNumber",
    "name": "disableVoiceOnNumber",
    "method": "DELETE",
    "path": "/v1/phone-numbers/{id}/voice",
    "group": "telephony",
    "platforms": null,
    "summary": "Disable phone calling on a number",
    "pathParams": [
      "id"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "disableWhatsAppCalling",
    "name": "disableWhatsAppCalling",
    "method": "DELETE",
    "path": "/v1/phone-numbers/{id}/whatsapp/calling",
    "group": "telephony",
    "platforms": null,
    "summary": "Disable calling on a number",
    "pathParams": [
      "id"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "disableWhatsAppCallingLegacy",
    "name": "disableWhatsAppCallingLegacy",
    "method": "DELETE",
    "path": "/v1/whatsapp/phone-numbers/{id}/calling",
    "group": "telephony",
    "platforms": null,
    "summary": "Disable calling on a number",
    "pathParams": [
      "id"
    ],
    "query": [
      {
        "name": "accountId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "enableSmsOnNumber",
    "name": "enableSmsOnNumber",
    "method": "POST",
    "path": "/v1/phone-numbers/{id}/sms",
    "group": "telephony",
    "platforms": null,
    "summary": "Enable SMS on a number",
    "pathParams": [
      "id"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "enableVoiceOnNumber",
    "name": "enableVoiceOnNumber",
    "method": "POST",
    "path": "/v1/phone-numbers/{id}/voice",
    "group": "telephony",
    "platforms": null,
    "summary": "Enable phone calling on a number",
    "pathParams": [
      "id"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "enableWhatsAppCalling",
    "name": "enableWhatsAppCalling",
    "method": "POST",
    "path": "/v1/phone-numbers/{id}/whatsapp/calling",
    "group": "telephony",
    "platforms": null,
    "summary": "Enable calling on a number",
    "pathParams": [
      "id"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "enableWhatsAppCallingLegacy",
    "name": "enableWhatsAppCallingLegacy",
    "method": "POST",
    "path": "/v1/whatsapp/phone-numbers/{id}/calling",
    "group": "telephony",
    "platforms": null,
    "summary": "Enable calling on a number",
    "pathParams": [
      "id"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "getPhoneNumber",
    "name": "getPhoneNumber",
    "method": "GET",
    "path": "/v1/phone-numbers/{id}",
    "group": "telephony",
    "platforms": null,
    "summary": "Get phone number",
    "pathParams": [
      "id"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getPhoneNumberKycForm",
    "name": "getPhoneNumberKycForm",
    "method": "GET",
    "path": "/v1/phone-numbers/kyc",
    "group": "telephony",
    "platforms": null,
    "summary": "Get KYC form spec",
    "pathParams": [],
    "query": [
      {
        "name": "country",
        "required": true
      },
      {
        "name": "numberType",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getPhoneNumberPortInOrderRequirements",
    "name": "getPhoneNumberPortInOrderRequirements",
    "method": "GET",
    "path": "/v1/phone-numbers/port-in/{id}/requirements",
    "group": "telephony",
    "platforms": null,
    "summary": "A port-in order's pending requirements",
    "pathParams": [
      "id"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getPhoneNumberPortInRequirements",
    "name": "getPhoneNumberPortInRequirements",
    "method": "GET",
    "path": "/v1/phone-numbers/port-in/requirements",
    "group": "telephony",
    "platforms": null,
    "summary": "Country porting requirements",
    "pathParams": [],
    "query": [
      {
        "name": "country",
        "required": true
      },
      {
        "name": "numberType",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getPhoneNumberRemediation",
    "name": "getPhoneNumberRemediation",
    "method": "GET",
    "path": "/v1/phone-numbers/{id}/remediate",
    "group": "telephony",
    "platforms": null,
    "summary": "Get declined requirements",
    "pathParams": [
      "id"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getSipTrunk",
    "name": "getSipTrunk",
    "method": "GET",
    "path": "/v1/phone-numbers/sip-trunks/{id}",
    "group": "telephony",
    "platforms": null,
    "summary": "Get a SIP trunk",
    "pathParams": [
      "id"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getSmsRegistration",
    "name": "getSmsRegistration",
    "method": "GET",
    "path": "/v1/sms/registrations/{id}",
    "group": "telephony",
    "platforms": null,
    "summary": "Get a carrier registration",
    "pathParams": [
      "id"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getVerification",
    "name": "getVerification",
    "method": "GET",
    "path": "/v1/verify/verifications/{verificationId}",
    "group": "telephony",
    "platforms": null,
    "summary": "Get a verification",
    "pathParams": [
      "verificationId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getWhatsAppCalling",
    "name": "getWhatsAppCalling",
    "method": "GET",
    "path": "/v1/phone-numbers/{id}/whatsapp/calling",
    "group": "telephony",
    "platforms": null,
    "summary": "Get calling config for a number",
    "pathParams": [
      "id"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getWhatsAppNumberKycForm",
    "name": "getWhatsAppNumberKycForm",
    "method": "GET",
    "path": "/v1/whatsapp/phone-numbers/kyc",
    "group": "telephony",
    "platforms": null,
    "summary": "Get KYC form spec",
    "pathParams": [],
    "query": [
      {
        "name": "country",
        "required": true
      },
      {
        "name": "profileId",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "getWhatsAppNumberRemediation",
    "name": "getWhatsAppNumberRemediation",
    "method": "GET",
    "path": "/v1/whatsapp/phone-numbers/{id}/remediate",
    "group": "telephony",
    "platforms": null,
    "summary": "Get declined requirements",
    "pathParams": [
      "id"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getWhatsAppPhoneNumber",
    "name": "getWhatsAppPhoneNumber",
    "method": "GET",
    "path": "/v1/whatsapp/phone-numbers/{phoneNumberId}",
    "group": "telephony",
    "platforms": null,
    "summary": "Get phone number",
    "pathParams": [
      "phoneNumberId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "getWhatsAppPhoneNumbers",
    "name": "getWhatsAppPhoneNumbers",
    "method": "GET",
    "path": "/v1/whatsapp/phone-numbers",
    "group": "telephony",
    "platforms": null,
    "summary": "List phone numbers",
    "pathParams": [],
    "query": [
      {
        "name": "status",
        "required": false
      },
      {
        "name": "profileId",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listPhoneNumberCountries",
    "name": "listPhoneNumberCountries",
    "method": "GET",
    "path": "/v1/phone-numbers/countries",
    "group": "telephony",
    "platforms": null,
    "summary": "List offerable number countries",
    "pathParams": [],
    "query": [],
    "hasBody": false
  },
  {
    "id": "listPhoneNumberPortIns",
    "name": "listPhoneNumberPortIns",
    "method": "GET",
    "path": "/v1/phone-numbers/port-in",
    "group": "telephony",
    "platforms": null,
    "summary": "List port-in orders",
    "pathParams": [],
    "query": [],
    "hasBody": false
  },
  {
    "id": "listPhoneNumbers",
    "name": "listPhoneNumbers",
    "method": "GET",
    "path": "/v1/phone-numbers",
    "group": "telephony",
    "platforms": null,
    "summary": "List phone numbers",
    "pathParams": [],
    "query": [
      {
        "name": "status",
        "required": false
      },
      {
        "name": "profileId",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listPhoneNumberStockWatches",
    "name": "listPhoneNumberStockWatches",
    "method": "GET",
    "path": "/v1/phone-numbers/stock-watches",
    "group": "telephony",
    "platforms": null,
    "summary": "List stock watches",
    "pathParams": [],
    "query": [],
    "hasBody": false
  },
  {
    "id": "listSipTrunks",
    "name": "listSipTrunks",
    "method": "GET",
    "path": "/v1/phone-numbers/sip-trunks",
    "group": "telephony",
    "platforms": null,
    "summary": "List SIP trunks",
    "pathParams": [],
    "query": [],
    "hasBody": false
  },
  {
    "id": "listSmsRegistrations",
    "name": "listSmsRegistrations",
    "method": "GET",
    "path": "/v1/sms/registrations",
    "group": "telephony",
    "platforms": null,
    "summary": "List carrier registrations",
    "pathParams": [],
    "query": [
      {
        "name": "includeDeactivated",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "listSmsSenderIds",
    "name": "listSmsSenderIds",
    "method": "GET",
    "path": "/v1/sms/sender-ids",
    "group": "telephony",
    "platforms": null,
    "summary": "List alphanumeric sender IDs",
    "pathParams": [],
    "query": [],
    "hasBody": false
  },
  {
    "id": "listWhatsAppNumberCountries",
    "name": "listWhatsAppNumberCountries",
    "method": "GET",
    "path": "/v1/whatsapp/phone-numbers/countries",
    "group": "telephony",
    "platforms": null,
    "summary": "List offerable number countries",
    "pathParams": [],
    "query": [],
    "hasBody": false
  },
  {
    "id": "lookupSmsNumber",
    "name": "lookupSmsNumber",
    "method": "GET",
    "path": "/v1/sms/lookup",
    "group": "telephony",
    "platforms": null,
    "summary": "Look up carrier + line type",
    "pathParams": [],
    "query": [
      {
        "name": "number",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "moveWhatsAppNumberToProfile",
    "name": "moveWhatsAppNumberToProfile",
    "method": "PATCH",
    "path": "/v1/whatsapp/phone-numbers/{id}/profile",
    "group": "telephony",
    "platforms": null,
    "summary": "Move a number to another profile",
    "pathParams": [
      "id"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "preflightSmsRegistration",
    "name": "preflightSmsRegistration",
    "method": "POST",
    "path": "/v1/sms/registrations/preflight",
    "group": "telephony",
    "platforms": null,
    "summary": "Pre-check a carrier registration",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "purchasePhoneNumber",
    "name": "purchasePhoneNumber",
    "method": "POST",
    "path": "/v1/phone-numbers/purchase",
    "group": "telephony",
    "platforms": null,
    "summary": "Purchase phone number",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "purchaseWhatsAppPhoneNumber",
    "name": "purchaseWhatsAppPhoneNumber",
    "method": "POST",
    "path": "/v1/whatsapp/phone-numbers/purchase",
    "group": "telephony",
    "platforms": null,
    "summary": "Purchase phone number",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "releasePhoneNumber",
    "name": "releasePhoneNumber",
    "method": "DELETE",
    "path": "/v1/phone-numbers/{id}",
    "group": "telephony",
    "platforms": null,
    "summary": "Release phone number",
    "pathParams": [
      "id"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "releaseWhatsAppPhoneNumber",
    "name": "releaseWhatsAppPhoneNumber",
    "method": "DELETE",
    "path": "/v1/whatsapp/phone-numbers/{phoneNumberId}",
    "group": "telephony",
    "platforms": null,
    "summary": "Release phone number",
    "pathParams": [
      "phoneNumberId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "remediatePhoneNumber",
    "name": "remediatePhoneNumber",
    "method": "POST",
    "path": "/v1/phone-numbers/{id}/remediate",
    "group": "telephony",
    "platforms": null,
    "summary": "Resubmit a declined number",
    "pathParams": [
      "id"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "remediateWhatsAppNumber",
    "name": "remediateWhatsAppNumber",
    "method": "POST",
    "path": "/v1/whatsapp/phone-numbers/{id}/remediate",
    "group": "telephony",
    "platforms": null,
    "summary": "Resubmit a declined number",
    "pathParams": [
      "id"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "replyToPhoneNumberReviewer",
    "name": "replyToPhoneNumberReviewer",
    "method": "POST",
    "path": "/v1/phone-numbers/{id}/remediate/reply",
    "group": "telephony",
    "platforms": null,
    "summary": "Reply to the regulatory reviewer",
    "pathParams": [
      "id"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "requestSmsSenderIdLimitIncrease",
    "name": "requestSmsSenderIdLimitIncrease",
    "method": "POST",
    "path": "/v1/sms/sender-ids/limit-request",
    "group": "telephony",
    "platforms": null,
    "summary": "Request a higher sender ID daily limit",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "resendSmsRegistrationOtp",
    "name": "resendSmsRegistrationOtp",
    "method": "POST",
    "path": "/v1/sms/registrations/{id}/resend-otp",
    "group": "telephony",
    "platforms": null,
    "summary": "Re-send the sole-prop OTP",
    "pathParams": [
      "id"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "respondToPhoneNumberReviewer",
    "name": "respondToPhoneNumberReviewer",
    "method": "POST",
    "path": "/v1/phone-numbers/{id}/remediate/respond",
    "group": "telephony",
    "platforms": null,
    "summary": "Respond to the regulatory reviewer (message + corrections)",
    "pathParams": [
      "id"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "respondToSmsRegistrationReview",
    "name": "respondToSmsRegistrationReview",
    "method": "POST",
    "path": "/v1/sms/registrations/{id}/respond",
    "group": "telephony",
    "platforms": null,
    "summary": "Reply to a change request",
    "pathParams": [
      "id"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "reuseSmsRegistrationForNumber",
    "name": "reuseSmsRegistrationForNumber",
    "method": "POST",
    "path": "/v1/phone-numbers/{id}/sms/reuse-registration",
    "group": "telephony",
    "platforms": null,
    "summary": "Add number to SMS registration",
    "pathParams": [
      "id"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "reviewPhoneNumberKycPacket",
    "name": "reviewPhoneNumberKycPacket",
    "method": "POST",
    "path": "/v1/phone-numbers/kyc/review-packet",
    "group": "telephony",
    "platforms": null,
    "summary": "Pre-review a KYC packet",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "rotateSipTrunkCredentials",
    "name": "rotateSipTrunkCredentials",
    "method": "POST",
    "path": "/v1/phone-numbers/sip-trunks/{id}/rotate-credentials",
    "group": "telephony",
    "platforms": null,
    "summary": "Rotate a SIP trunk's password",
    "pathParams": [
      "id"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "searchAvailablePhoneNumbers",
    "name": "searchAvailablePhoneNumbers",
    "method": "GET",
    "path": "/v1/phone-numbers/available",
    "group": "telephony",
    "platforms": null,
    "summary": "Search available numbers",
    "pathParams": [],
    "query": [
      {
        "name": "country",
        "required": false
      },
      {
        "name": "type",
        "required": false
      },
      {
        "name": "prefix",
        "required": false
      },
      {
        "name": "locality",
        "required": false
      },
      {
        "name": "contains",
        "required": false
      },
      {
        "name": "sms",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "searchAvailableWhatsAppNumbers",
    "name": "searchAvailableWhatsAppNumbers",
    "method": "GET",
    "path": "/v1/whatsapp/phone-numbers/available",
    "group": "telephony",
    "platforms": null,
    "summary": "Search available numbers",
    "pathParams": [],
    "query": [
      {
        "name": "country",
        "required": false
      },
      {
        "name": "type",
        "required": false
      },
      {
        "name": "prefix",
        "required": false
      },
      {
        "name": "locality",
        "required": false
      },
      {
        "name": "contains",
        "required": false
      },
      {
        "name": "limit",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "shareSmsRegistration",
    "name": "shareSmsRegistration",
    "method": "POST",
    "path": "/v1/sms/registrations/share",
    "group": "telephony",
    "platforms": null,
    "summary": "Create a registration share link",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "startSmsRegistration",
    "name": "startSmsRegistration",
    "method": "POST",
    "path": "/v1/sms/registrations",
    "group": "telephony",
    "platforms": null,
    "summary": "Start a carrier registration",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "startWhatsAppCallerIdVerification",
    "name": "startWhatsAppCallerIdVerification",
    "method": "POST",
    "path": "/v1/phone-numbers/{id}/whatsapp/caller-id-verification",
    "group": "telephony",
    "platforms": null,
    "summary": "Start caller-ID verification for a customer-brought number",
    "pathParams": [
      "id"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "submitPhoneNumberKyc",
    "name": "submitPhoneNumberKyc",
    "method": "POST",
    "path": "/v1/phone-numbers/kyc",
    "group": "telephony",
    "platforms": null,
    "summary": "Submit KYC",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "submitWhatsAppNumberKyc",
    "name": "submitWhatsAppNumberKyc",
    "method": "POST",
    "path": "/v1/whatsapp/phone-numbers/kyc",
    "group": "telephony",
    "platforms": null,
    "summary": "Submit KYC",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updateWhatsAppCalling",
    "name": "updateWhatsAppCalling",
    "method": "PATCH",
    "path": "/v1/phone-numbers/{id}/whatsapp/calling",
    "group": "telephony",
    "platforms": null,
    "summary": "Update calling config",
    "pathParams": [
      "id"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updateWhatsAppCallingLegacy",
    "name": "updateWhatsAppCallingLegacy",
    "method": "PATCH",
    "path": "/v1/whatsapp/phone-numbers/{id}/calling",
    "group": "telephony",
    "platforms": null,
    "summary": "Update calling config",
    "pathParams": [
      "id"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "uploadPhoneNumberKycDocument",
    "name": "uploadPhoneNumberKycDocument",
    "method": "POST",
    "path": "/v1/phone-numbers/kyc/upload-document",
    "group": "telephony",
    "platforms": null,
    "summary": "Upload a KYC document",
    "pathParams": [],
    "query": [],
    "hasBody": false
  },
  {
    "id": "uploadPhoneNumberPortInDocument",
    "name": "uploadPhoneNumberPortInDocument",
    "method": "POST",
    "path": "/v1/phone-numbers/port-in/documents",
    "group": "telephony",
    "platforms": null,
    "summary": "Upload a porting document",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "uploadWhatsAppNumberKycDocument",
    "name": "uploadWhatsAppNumberKycDocument",
    "method": "POST",
    "path": "/v1/whatsapp/phone-numbers/kyc/upload-document",
    "group": "telephony",
    "platforms": null,
    "summary": "Upload a KYC document",
    "pathParams": [],
    "query": [],
    "hasBody": false
  },
  {
    "id": "validatePhoneNumberKycAddress",
    "name": "validatePhoneNumberKycAddress",
    "method": "POST",
    "path": "/v1/phone-numbers/kyc/validate-address",
    "group": "telephony",
    "platforms": null,
    "summary": "Pre-validate KYC address",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "validateWhatsAppNumberKycAddress",
    "name": "validateWhatsAppNumberKycAddress",
    "method": "POST",
    "path": "/v1/whatsapp/phone-numbers/kyc/validate-address",
    "group": "telephony",
    "platforms": null,
    "summary": "Pre-validate KYC address",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "verifySmsRegistrationOtp",
    "name": "verifySmsRegistrationOtp",
    "method": "POST",
    "path": "/v1/sms/registrations/{id}/verify-otp",
    "group": "telephony",
    "platforms": null,
    "summary": "Submit the sole-prop OTP",
    "pathParams": [
      "id"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "verifyWhatsAppCallerId",
    "name": "verifyWhatsAppCallerId",
    "method": "POST",
    "path": "/v1/phone-numbers/{id}/whatsapp/caller-id-verification/verify",
    "group": "telephony",
    "platforms": null,
    "summary": "Confirm the caller-ID verification code",
    "pathParams": [
      "id"
    ],
    "query": [],
    "hasBody": true
  },
  {
    "id": "viewPhoneNumberKycDocument",
    "name": "viewPhoneNumberKycDocument",
    "method": "GET",
    "path": "/v1/phone-numbers/kyc/document/{documentId}",
    "group": "telephony",
    "platforms": null,
    "summary": "View a KYC document on file",
    "pathParams": [
      "documentId"
    ],
    "query": [],
    "hasBody": false
  },
  {
    "id": "createWebhookSettings",
    "name": "createWebhookSettings",
    "method": "POST",
    "path": "/v1/webhooks/settings",
    "group": "webhooks",
    "platforms": null,
    "summary": "Create webhook",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "deleteWebhookSettings",
    "name": "deleteWebhookSettings",
    "method": "DELETE",
    "path": "/v1/webhooks/settings",
    "group": "webhooks",
    "platforms": null,
    "summary": "Delete webhook",
    "pathParams": [],
    "query": [
      {
        "name": "id",
        "required": true
      }
    ],
    "hasBody": false
  },
  {
    "id": "getWebhookLogs",
    "name": "getWebhookLogs",
    "method": "GET",
    "path": "/v1/webhooks/logs",
    "group": "webhooks",
    "platforms": null,
    "summary": "List webhook delivery logs",
    "pathParams": [],
    "query": [
      {
        "name": "limit",
        "required": false
      },
      {
        "name": "skip",
        "required": false
      },
      {
        "name": "status",
        "required": false
      },
      {
        "name": "event",
        "required": false
      },
      {
        "name": "webhookId",
        "required": false
      },
      {
        "name": "eventId",
        "required": false
      }
    ],
    "hasBody": false
  },
  {
    "id": "getWebhookSettings",
    "name": "getWebhookSettings",
    "method": "GET",
    "path": "/v1/webhooks/settings",
    "group": "webhooks",
    "platforms": null,
    "summary": "List webhooks",
    "pathParams": [],
    "query": [],
    "hasBody": false
  },
  {
    "id": "testWebhook",
    "name": "testWebhook",
    "method": "POST",
    "path": "/v1/webhooks/test",
    "group": "webhooks",
    "platforms": null,
    "summary": "Send test webhook",
    "pathParams": [],
    "query": [],
    "hasBody": true
  },
  {
    "id": "updateWebhookSettings",
    "name": "updateWebhookSettings",
    "method": "PUT",
    "path": "/v1/webhooks/settings",
    "group": "webhooks",
    "platforms": null,
    "summary": "Update webhook",
    "pathParams": [],
    "query": [],
    "hasBody": true
  }
] as const;


/** Every event Zernio can send us. 51 of them. */
export const ZERNIO_EVENTS = [
  {
    "name": "account.ads.initial_sync_completed",
    "id": "onAccountAdsInitialSyncCompleted",
    "summary": "Ads initial sync completed event"
  },
  {
    "name": "account.connected",
    "id": "onAccountConnected",
    "summary": "Account connected event"
  },
  {
    "name": "account.disconnected",
    "id": "onAccountDisconnected",
    "summary": "Account disconnected event"
  },
  {
    "name": "ad.status_changed",
    "id": "onAdStatusChanged",
    "summary": "Ad status changed event"
  },
  {
    "name": "call.ended",
    "id": "onCallEnded",
    "summary": "Call ended event"
  },
  {
    "name": "call.failed",
    "id": "onCallFailed",
    "summary": "Call failed event"
  },
  {
    "name": "call.permission_request",
    "id": "onCallPermissionRequest",
    "summary": "Call permission request reply event"
  },
  {
    "name": "call.received",
    "id": "onCallReceived",
    "summary": "Call received event"
  },
  {
    "name": "comment.received",
    "id": "onCommentReceived",
    "summary": "Comment received event"
  },
  {
    "name": "conversation.started",
    "id": "onConversationStarted",
    "summary": "Conversation started event"
  },
  {
    "name": "lead.received",
    "id": "onLeadReceived",
    "summary": "Lead received event"
  },
  {
    "name": "message.deleted",
    "id": "onMessageDeleted",
    "summary": "Message deleted event"
  },
  {
    "name": "message.delivered",
    "id": "onMessageDelivered",
    "summary": "Message delivered event"
  },
  {
    "name": "message.edited",
    "id": "onMessageEdited",
    "summary": "Message edited event"
  },
  {
    "name": "message.failed",
    "id": "onMessageFailed",
    "summary": "Message delivery failed event"
  },
  {
    "name": "message.read",
    "id": "onMessageRead",
    "summary": "Message read event"
  },
  {
    "name": "message.received",
    "id": "onMessageReceived",
    "summary": "Message received event"
  },
  {
    "name": "message.sent",
    "id": "onMessageSent",
    "summary": "Message sent event"
  },
  {
    "name": "phone_number.stock_available",
    "id": "onPhoneNumberStockAvailable",
    "summary": "Phone-number stock available event"
  },
  {
    "name": "post.cancelled",
    "id": "onPostCancelled",
    "summary": "Post cancelled event"
  },
  {
    "name": "post.external.created",
    "id": "onPostExternalCreated",
    "summary": "External post created event"
  },
  {
    "name": "post.external.deleted",
    "id": "onPostExternalDeleted",
    "summary": "External post deleted event"
  },
  {
    "name": "post.external.updated",
    "id": "onPostExternalUpdated",
    "summary": "External post updated event"
  },
  {
    "name": "post.failed",
    "id": "onPostFailed",
    "summary": "Post failed event"
  },
  {
    "name": "post.partial",
    "id": "onPostPartial",
    "summary": "Post partial event"
  },
  {
    "name": "post.platform.deleted",
    "id": "onPostPlatformDeleted",
    "summary": "Post platform deleted event"
  },
  {
    "name": "post.platform.failed",
    "id": "onPostPlatformFailed",
    "summary": "Post platform failed event"
  },
  {
    "name": "post.platform.published",
    "id": "onPostPlatformPublished",
    "summary": "Post platform published event"
  },
  {
    "name": "post.published",
    "id": "onPostPublished",
    "summary": "Post published event"
  },
  {
    "name": "post.recycled",
    "id": "onPostRecycled",
    "summary": "Post recycled event"
  },
  {
    "name": "post.scheduled",
    "id": "onPostScheduled",
    "summary": "Post scheduled event"
  },
  {
    "name": "post.tiktok.url_resolved",
    "id": "onPostTikTokUrlResolved",
    "summary": "TikTok post URL resolved event"
  },
  {
    "name": "reaction.received",
    "id": "onReactionReceived",
    "summary": "Reaction received event"
  },
  {
    "name": "referral.received",
    "id": "onReferralReceived",
    "summary": "Referral received event"
  },
  {
    "name": "review.new",
    "id": "onReviewNew",
    "summary": "Review new event"
  },
  {
    "name": "review.updated",
    "id": "onReviewUpdated",
    "summary": "Review updated event"
  },
  {
    "name": "verification.approved",
    "id": "onVerificationApproved",
    "summary": "Verification approved event"
  },
  {
    "name": "verification.failed",
    "id": "onVerificationFailed",
    "summary": "Verification failed event"
  },
  {
    "name": "webhook.test",
    "id": "onWebhookTest",
    "summary": "Webhook test event"
  },
  {
    "name": "whatsapp.account.name_status_updated",
    "id": "onWhatsAppAccountNameStatusUpdated",
    "summary": "WhatsApp display-name review outcome event"
  },
  {
    "name": "whatsapp.automatic_event",
    "id": "onWhatsAppAutomaticEvent",
    "summary": "WhatsApp automatic event detected"
  },
  {
    "name": "whatsapp.number.action_required",
    "id": "onWhatsAppNumberActionRequired",
    "summary": "WhatsApp number action required event"
  },
  {
    "name": "whatsapp.number.activated",
    "id": "onWhatsAppNumberActivated",
    "summary": "WhatsApp number activated event"
  },
  {
    "name": "whatsapp.number.declined",
    "id": "onWhatsAppNumberDeclined",
    "summary": "WhatsApp number declined event"
  },
  {
    "name": "whatsapp.number.kyc_submitted",
    "id": "onWhatsAppNumberKycSubmitted",
    "summary": "WhatsApp number KYC submitted event"
  },
  {
    "name": "whatsapp.number.reactivated",
    "id": "onWhatsAppNumberReactivated",
    "summary": "WhatsApp number reactivated event"
  },
  {
    "name": "whatsapp.number.released",
    "id": "onWhatsAppNumberReleased",
    "summary": "WhatsApp number released event"
  },
  {
    "name": "whatsapp.number.suspended",
    "id": "onWhatsAppNumberSuspended",
    "summary": "WhatsApp number suspended event"
  },
  {
    "name": "whatsapp.number.verification_required",
    "id": "onWhatsAppNumberVerificationRequired",
    "summary": "WhatsApp number verification-required event"
  },
  {
    "name": "whatsapp.template.category_updated",
    "id": "onWhatsAppTemplateCategoryUpdated",
    "summary": "WhatsApp template category updated event"
  },
  {
    "name": "whatsapp.template.status_updated",
    "id": "onWhatsAppTemplateStatusUpdated",
    "summary": "WhatsApp template status updated event"
  }
] as const;

export type ZernioEventName = (typeof ZERNIO_EVENTS)[number]["name"];
