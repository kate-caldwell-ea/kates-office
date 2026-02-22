# Kate's Office - Chat Integration

## Overview

The chat feature in Kate's Office now connects directly to Kate via **Telegram**. When users send messages through the web chat, they are forwarded to Kate's Telegram bot, enabling real conversations instead of canned responses.

## How It Works

1. **User visits** Kate's Office web chat at https://kates-office-api.fly.dev/
2. **User enters their name** (optional) for personalized messages
3. **User sends a message** via the chat interface
4. **Server forwards to Telegram** using the Telegram Bot API
5. **Kate receives the message** in her Telegram chat
6. **Kate responds** via Telegram (v2 will show responses in web chat)

## Technical Details

### Architecture

```
User → Web Chat → Kate's Office API → Telegram Bot API → Kate (via Telegram)
                                                           ↓
                                          Kate responds via Telegram
```

### API Endpoints

- `POST /api/chat/send` - Send a message (forwards to Telegram)
  - Body: `{ "content": "message", "senderName": "optional name" }`
  - Returns: `{ "success": true, "telegramSent": true }`

- `GET /api/chat/status` - Check chat configuration
  - Returns: `{ "telegramEnabled": true, "chatIdConfigured": true }`

- `GET /api/chat` - Get recent chat history (stored locally)

### Configuration

Environment variables (set in Fly.io or locally):

- `TELEGRAM_BOT_TOKEN` - Kate's Telegram bot token
- `TELEGRAM_CHAT_ID` - Target chat ID for messages (Zack's DM with Kate)

## Message Format

Messages appear in Telegram like this:

```
📬 Kate's Office - Web Chat

From: John Doe

Hello Kate! I had a question about...

(Reply here and I'll see it. Web responses coming soon!)
```

## Future Improvements (v2)

- [ ] Show Kate's Telegram responses in the web chat
- [ ] Real-time WebSocket updates when Kate responds
- [ ] Message threading
- [ ] File/image attachments

## Deployment

The integration is deployed automatically via Fly.io when changes are pushed to the main branch.

**Live URL:** https://kates-office-api.fly.dev/

**GitHub:** https://github.com/kate-caldwell-ea/kates-office
