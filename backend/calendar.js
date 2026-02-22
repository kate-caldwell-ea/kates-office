/**
 * Google Calendar API integration for Kate's Office
 * Fetches events from Zack's calendars using OAuth tokens
 * 
 * Token sources (in order of precedence):
 * 1. Environment variables: GOOGLE_OAUTH_<ACCOUNT>_JSON (e.g., GOOGLE_OAUTH_ZACK_GOSOLVR_JSON)
 * 2. Token directory files: /data/workspace/config/google-oauth-<account>.json
 */

const fs = require('fs');
const path = require('path');

// Token file paths (configurable via env vars)
const TOKEN_DIR = process.env.GOOGLE_TOKEN_DIR || '/data/workspace/config';

// Google OAuth endpoints
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

// In-memory token cache (for env var-based tokens that can't be written to disk)
const tokenCache = {};

/**
 * Convert account name to env var format
 * e.g., "zack-gosolvr" -> "ZACK_GOSOLVR"
 */
function accountToEnvKey(account) {
  return account.toUpperCase().replace(/-/g, '_');
}

/**
 * Load OAuth tokens from environment variable or file
 */
function loadTokens(account) {
  // Check for in-memory cache first (for refreshed tokens)
  if (tokenCache[account]) {
    return tokenCache[account];
  }
  
  // Try environment variable first
  const envKey = `GOOGLE_OAUTH_${accountToEnvKey(account)}_JSON`;
  if (process.env[envKey]) {
    try {
      const tokens = JSON.parse(process.env[envKey]);
      tokenCache[account] = tokens;
      console.log(`Loaded tokens for ${account} from environment variable`);
      return tokens;
    } catch (e) {
      console.error(`Failed to parse ${envKey}:`, e.message);
    }
  }
  
  // Fall back to file
  const filename = `google-oauth-${account}.json`;
  const filepath = path.join(TOKEN_DIR, filename);
  
  if (!fs.existsSync(filepath)) {
    throw new Error(`Token file not found: ${filepath} (and no ${envKey} env var set)`);
  }
  
  return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

/**
 * Save updated tokens to file or cache
 */
function saveTokens(account, tokens) {
  // Update in-memory cache
  tokenCache[account] = tokens;
  
  // Try to save to file if directory is writable
  const filename = `google-oauth-${account}.json`;
  const filepath = path.join(TOKEN_DIR, filename);
  
  try {
    if (fs.existsSync(TOKEN_DIR)) {
      fs.writeFileSync(filepath, JSON.stringify(tokens, null, 2));
      console.log(`Saved refreshed tokens for ${account} to file`);
    }
  } catch (e) {
    console.log(`Could not save tokens to file (using in-memory cache): ${e.message}`);
  }
}

/**
 * Refresh access token if needed
 */
async function refreshAccessToken(tokens, account) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: tokens.client_id,
      client_secret: tokens.client_secret,
      refresh_token: tokens.refresh_token,
      grant_type: 'refresh_token'
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }
  
  const newTokenData = await response.json();
  
  // Update tokens in memory and file
  tokens.access_token = newTokenData.access_token;
  if (newTokenData.refresh_token) {
    tokens.refresh_token = newTokenData.refresh_token;
  }
  
  saveTokens(account, tokens);
  console.log(`Refreshed access token for ${tokens.account}`);
  
  return tokens;
}

/**
 * Make an authenticated request to Google Calendar API
 */
async function calendarApiRequest(tokens, account, endpoint) {
  let response = await fetch(`${GOOGLE_CALENDAR_API}${endpoint}`, {
    headers: { 'Authorization': `Bearer ${tokens.access_token}` }
  });
  
  // If token expired, refresh and retry
  if (response.status === 401) {
    console.log(`Token expired for ${account}, refreshing...`);
    tokens = await refreshAccessToken(tokens, account);
    
    response = await fetch(`${GOOGLE_CALENDAR_API}${endpoint}`, {
      headers: { 'Authorization': `Bearer ${tokens.access_token}` }
    });
  }
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Calendar API error: ${response.status} - ${error}`);
  }
  
  return response.json();
}

/**
 * Fetch calendar list for an account
 */
async function getCalendarList(account) {
  const tokens = loadTokens(account);
  const data = await calendarApiRequest(tokens, account, '/users/me/calendarList');
  return data.items || [];
}

/**
 * Fetch events from a specific calendar
 */
async function getCalendarEvents(account, calendarId = 'primary', options = {}) {
  const tokens = loadTokens(account);
  
  // Default: next 7 days
  const timeMin = options.timeMin || new Date().toISOString();
  const timeMax = options.timeMax || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const maxResults = options.maxResults || 100;
  
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    maxResults: maxResults.toString(),
    singleEvents: 'true',
    orderBy: 'startTime'
  });
  
  const data = await calendarApiRequest(
    tokens,
    account,
    `/calendars/${encodeURIComponent(calendarId)}/events?${params}`
  );
  
  return data.items || [];
}

/**
 * Fetch events from all calendars for an account
 */
async function getAllEventsForAccount(account, options = {}) {
  const calendars = await getCalendarList(account);
  const allEvents = [];
  
  // Filter to owned/writable calendars to reduce noise
  const primaryCalendars = calendars.filter(cal => 
    cal.accessRole === 'owner' || cal.accessRole === 'writer' || cal.primary
  );
  
  for (const calendar of primaryCalendars) {
    try {
      const events = await getCalendarEvents(account, calendar.id, options);
      events.forEach(event => {
        event.calendarName = calendar.summary;
        event.calendarId = calendar.id;
        event.accountEmail = account.replace('-', '@').replace('gosolvr', 'gosolvr.com').replace('gmail', 'gmail.com');
      });
      allEvents.push(...events);
    } catch (error) {
      console.error(`Error fetching from ${calendar.summary}:`, error.message);
    }
  }
  
  // Sort by start time
  allEvents.sort((a, b) => {
    const aTime = new Date(a.start?.dateTime || a.start?.date);
    const bTime = new Date(b.start?.dateTime || b.start?.date);
    return aTime - bTime;
  });
  
  return allEvents;
}

/**
 * Get available accounts (from env vars and files)
 */
function getAvailableAccounts() {
  const accounts = new Set();
  
  // Check environment variables
  for (const key of Object.keys(process.env)) {
    const match = key.match(/^GOOGLE_OAUTH_(.+)_JSON$/);
    if (match) {
      // Convert env key back to account format: ZACK_GOSOLVR -> zack-gosolvr
      const account = match[1].toLowerCase().replace(/_/g, '-');
      accounts.add(account);
    }
  }
  
  // Check files in token directory
  try {
    if (fs.existsSync(TOKEN_DIR)) {
      const files = fs.readdirSync(TOKEN_DIR);
      for (const file of files) {
        const match = file.match(/^google-oauth-(.+)\.json$/);
        if (match) {
          accounts.add(match[1]);
        }
      }
    }
  } catch (e) {
    console.log(`Could not read token directory: ${e.message}`);
  }
  
  return Array.from(accounts);
}

module.exports = {
  loadTokens,
  getCalendarList,
  getCalendarEvents,
  getAllEventsForAccount,
  getAvailableAccounts
};
