# Authentication Setup

Kate's Office uses simple password-based authentication to protect the app.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `KATES_OFFICE_PASSWORD` | Yes* | Password to access the app |
| `SESSION_SECRET` | No | Secret for signing session cookies (auto-generated if not set) |

*If `KATES_OFFICE_PASSWORD` is not set, the app runs **without authentication** (useful for development).

## How It Works

1. **Login Page**: Users are redirected to `/login` if not authenticated
2. **Session Cookie**: After successful login, a session cookie (`kates_office_session`) is set
3. **7-day Expiry**: Sessions last 7 days before requiring re-login
4. **All API Routes Protected**: Every `/api/*` route (except `/api/auth/*` and `/api/health`) requires authentication

## Deployment

### Fly.io

Set the password as a secret:

```bash
fly secrets set KATES_OFFICE_PASSWORD=your-secure-password
fly secrets set SESSION_SECRET=your-random-secret-key
```

### Other Platforms

Set environment variables in your deployment configuration:

- **Render**: Dashboard → Environment Variables
- **Vercel**: Dashboard → Settings → Environment Variables
- **Docker**: `-e KATES_OFFICE_PASSWORD=yourpassword`

## Security Notes

- Passwords are compared using timing-safe comparison to prevent timing attacks
- Session cookies are `httpOnly` (not accessible via JavaScript)
- In production (`NODE_ENV=production`), cookies require HTTPS (`secure: true`)
- Use a strong, unique password
- Consider setting `SESSION_SECRET` to a consistent value across deploys to maintain sessions

## Local Development

```bash
# Run without auth
npm run dev

# Run with auth
KATES_OFFICE_PASSWORD=testpass npm run dev
```
