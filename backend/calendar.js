/**
 * Google Calendar API integration for Kate's Office
 * Fetches events from Zack's calendars using OAuth tokens
 */

const fs = require('fs');
const path = require('path');

// Token file paths (configurable via env vars)
const TOKEN_DIR = process.env.GOOGLE_TOKEN_DIR || '/data/workspace/config';

// Google OAuth endpoints
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

/**
 * Load OAuth tokens from file
 */
function loadTokens(account) {
  const filename = `google-oauth-${account}.json`;
  const filepath = path.join(TOKEN_DIR, filename);
  
  if (!fs.existsSync(filepath)) {
    throw new Error(`Token file not found: ${filepath}`);
  }
  
  return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

/**
 * Save updated tokens to file
 */
function saveTokens(account, tokens) {
  const filename = `google-oauth-${account}.json`;
  const filepath = path.join(TOKEN_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(tokens, null, 2));
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
 * Get available accounts
 */
function getAvailableAccounts() {
  const accounts = [];
  const files = fs.readdirSync(TOKEN_DIR);
  
  for (const file of files) {
    const match = file.match(/^google-oauth-(.+)\.json$/);
    if (match) {
      accounts.push(match[1]);
    }
  }
  
  return accounts;
}

module.exports = {
  loadTokens,
  getCalendarList,
  getCalendarEvents,
  getAllEventsForAccount,
  getAvailableAccounts
};
