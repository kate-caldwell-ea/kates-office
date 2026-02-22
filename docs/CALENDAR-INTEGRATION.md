# Calendar Integration

## Overview

Kate's Office now includes Google Calendar integration, allowing visibility into upcoming events from connected Google accounts.

## Features

- **Calendar Page**: New `/calendar` route with event list
- **7-day view**: Shows upcoming events, grouped by day
- **Multi-calendar support**: Aggregates events from all calendars an account has access to
- **Video call links**: Direct links to Google Meet, Zoom from event display
- **Real-time refresh**: Manual refresh button to update events

## API Endpoints

### GET /api/calendar/accounts
Returns available configured calendar accounts.

### GET /api/calendar/events
Returns aggregated events from all configured accounts.

Query parameters:
- `days` (default: 7) - Number of days to fetch
- `accounts` - Comma-separated list of accounts (default: zack-gosolvr)

### GET /api/calendar/:account/events
Returns events from a specific account.

## Configuration

### Environment Variables

OAuth tokens can be provided via environment variables:

```
GOOGLE_OAUTH_ZACK_GOSOLVR_JSON='{"client_id":"...","client_secret":"...","access_token":"...","refresh_token":"..."}'
```

Format: `GOOGLE_OAUTH_<ACCOUNT>_JSON` where account name is uppercase with dashes replaced by underscores.

### File-based Tokens

Alternatively, tokens can be stored as files:
- Path: `/data/workspace/config/google-oauth-<account>.json`
- Set `GOOGLE_TOKEN_DIR` to customize the directory

## Token Refresh

The integration automatically refreshes expired access tokens using the stored refresh token. For file-based tokens, refreshed tokens are written back to the file. For environment-based tokens, refreshed tokens are cached in memory.

## Fly.io Deployment

Set secrets via Fly CLI:

```bash
fly secrets set GOOGLE_OAUTH_ZACK_GOSOLVR_JSON="$(cat /path/to/token.json | tr -d '\n')" -a kates-office-api
```

## Required OAuth Scopes

- `https://www.googleapis.com/auth/calendar` (read/write)
- `https://www.googleapis.com/auth/calendar.readonly` (read only - minimum required)
