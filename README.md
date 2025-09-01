Umbrel App Store: Telegram Bridge (Matrix ↔ Telegram)

This repository contains an Umbrel app for running a Matrix↔Telegram bridge using `mautrix-telegram`.

Important: Umbrel does not currently provide first‑class inter‑app networking or automatic configuration between apps. A Matrix appservice bridge must be reachable by your Matrix homeserver (Synapse). This repo ships a headless bridge container and documentation with practical integration options for Umbrel.

See `apps/telegram-bridge/README.md` and `apps/telegram-bridge/docs/INTEGRATION.md` for setup details.

