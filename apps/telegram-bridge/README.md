Telegram Bridge (mautrix-telegram) for Umbrel

This Umbrel app packages `mautrix-telegram`, a Matrix↔Telegram bridge. It is designed to work with a Matrix homeserver (Synapse) app and optionally Element Web for client access.

Key facts
- Headless: no web UI; provides a simple static status page for Umbrel.
- Storage: persists config and database under Umbrel app data.
- Network: exposes the appservice port (29317) so Synapse can reach it. Works great with Tailscale (MagicDNS or 100.x IP).
- Settings: ships a minimal settings page to write `/data/config.yaml` (open the app from Umbrel).
  - Validate button checks homeserver connectivity and optional well-known.
  - Optional default Appservice host via env `DEFAULT_APPSERVICE_HOST` (prefills to `http://<host>:29317`).

Get started
1) Install Synapse and (optionally) Element on Umbrel first.
2) Install this Telegram Bridge app.
3) Open the app’s Settings UI in Umbrel, fill in Homeserver/Domain/Appservice URL and tokens, and Save. Restart the app. Alternatively, use env-driven config via `.env` as documented. Next, follow `docs/INTEGRATION.md` to generate the appservice registration and finish setup. Prefer your Umbrel node’s Tailscale address (e.g., `http://umbrel.<tailnet>.ts.net:29317`).

Files
- `docker-compose.yml`: services for the bridge and a tiny static UI.
- `umbrel-app.yml`: app manifest and metadata.
- `templates/config.template.yaml`: template rendered from env vars.
- `scripts/render-config.sh`: renders `config.yaml` from env on startup.
- `data/config.example.yaml`: example config for reference.
- `docs/INTEGRATION.md`: step-by-step integration with Synapse.
- `ui/`: minimal settings UI (Node/Express) with validation and restart tip.
