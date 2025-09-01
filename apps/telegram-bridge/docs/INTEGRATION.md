Integration with Synapse (Matrix) on Umbrel

Overview
- This app runs `mautrix-telegram` and listens on port 29317.
- Synapse must be able to reach the bridge’s appservice HTTP listener.
- Because Umbrel apps are isolated, cross‑app networking is not automatic. Using Tailscale simplifies this by providing a stable IP/FQDN for your Umbrel host.
 - This app can render its `config.yaml` from environment variables; see `.env.example`.

Option A: Use Tailscale IP or MagicDNS (recommended)
1) Install Synapse and this Telegram Bridge app in Umbrel.
2) The bridge publishes port `29317` on the Umbrel host. With Tailscale, prefer one of:
   - MagicDNS FQDN: `http://<umbrel-hostname>.<tailnet>.ts.net:29317`
   - Tailscale IP: `http://100.x.y.z:29317`
   If you want to restrict the port to Tailscale only, copy `.env.example` to `.env` in the app folder and set `HOST_BIND_IP=100.x.y.z` (your Umbrel node’s Tailscale IP). Restart the app.
3) Configure via env (recommended):
   - Copy `.env.example` to `.env` in the app folder.
   - Set `HOMESERVER_ADDRESS`, `MATRIX_DOMAIN`, `APPSERVICE_ADDRESS` (use MagicDNS/IP), and `HS_TOKEN`/`AS_TOKEN`.
   - Optionally set `HOST_BIND_IP` to your Tailscale IP.
   - Restart the app to render `/data/config.yaml`.
4) Generate the appservice registration file (inside the bridge container):
   - From a terminal on the Umbrel host: `docker ps | grep telegram-bridge`
   - Run: `docker exec -it telegram-bridge sh -lc "mautrix-telegram -g -c /data/config.yaml -r /data/registration.yaml"`
   - This creates `/data/registration.yaml`.
   - Optional: Set `GENERATE_REGISTRATION=1` in `.env` and restart the app to let the bridge generate `/data/registration.yaml` automatically if it is missing.
5) Copy `/data/registration.yaml` to your Synapse app’s config directory on the Umbrel host (location depends on the Synapse app packaging). Note the path you place it at, e.g., `/path/to/synapse/app-data/registration.yaml`.
6) Edit Synapse `homeserver.yaml` and add the registration file to `app_service_config_files`:
   ```yaml
   app_service_config_files:
     - /path/to/synapse/app-data/registration.yaml
   ```
7) Ensure the registration’s `url` points to your chosen endpoint, e.g. `http://umbrel.<tailnet>.ts.net:29317` or `http://100.x.y.z:29317`.
   - If not, edit `/data/registration.yaml` accordingly and keep tokens in sync with `/data/config.yaml`.
8) Restart Synapse and then restart the Telegram Bridge app.

Option B: Co‑locate the bridge inside Synapse’s compose (advanced)
- Umbrel doesn’t share networks between apps. If you need direct container‑to‑container access without host publishing, fork the Synapse Umbrel app and add this bridge service to the same `docker-compose.yml` so both share a network. This requires maintaining a custom Synapse app build.

Configure the bridge
1) Edit the bridge config at `~/umbrel/app-data/telegram-bridge/data/config.yaml` (path may vary).
2) Set:
   - `homeserver.address`: your Synapse client URL (http(s))
   - `homeserver.domain`: your Matrix domain
   - `appservice.address`: `http://umbrel.<tailnet>.ts.net:29317` or `http://100.x.y.z:29317`
   - `appservice.port`: `29317`
3) Generate or set `hs_token`/`as_token` and ensure they match in `registration.yaml`.

Verify
- After restarting Synapse, check its logs for appservice registration success.
- Check the bridge logs: `docker logs -f telegram-bridge`

Next steps
- Invite the bridge bot (`@telegrambot:your.matrix.domain`) and follow the pairing flow per mautrix-telegram docs.

Notes & Caveats
- Bare hostnames: `http://umbrel` without a domain is not guaranteed to resolve over Tailscale. Prefer MagicDNS FQDN (`umbrel.<tailnet>.ts.net`) or the Tailscale IP (`100.x.y.z`).
- Binding: To avoid exposing the port on your LAN, set `HOST_BIND_IP` to your Tailscale IP in `.env` and restart the app.
- TLS: Appservice traffic can be HTTP inside the tailnet. If you need TLS, place a reverse proxy with Tailscale certs in front of the bridge.
- Upgrades: Upgrading Synapse or the bridge may require rechecking tokens and registration URLs.
