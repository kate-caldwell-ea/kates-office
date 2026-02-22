import { API_URL } from '../config.js';
import { useEffect, useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Video,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(7);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/calendar/events?days=${days}`);
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setEvents(data.events || []);
        setLastRefresh(new Date());
      }
    } catch (err) {
      console.error('Error fetching calendar:', err);
      setError('Failed to fetch calendar events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [days]);

  // Group events by date
  const eventsByDate = events.reduce((acc, event) => {
    const dateStr = event.start?.dateTime || event.start?.date;
    const date = new Date(dateStr);
    const dateKey = date.toISOString().split('T')[0];
    
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {});

  const formatTime = (event) => {
    if (event.start?.date && !event.start?.dateTime) {
      return 'All day';
    }
    
    const start = new Date(event.start?.dateTime);
    const end = new Date(event.end?.dateTime);
    
    const timeOptions = { hour: 'numeric', minute: '2-digit' };
    return `${start.toLocaleTimeString('en-US', timeOptions)} - ${end.toLocaleTimeString('en-US', timeOptions)}`;
  };

  const formatDateHeader = (dateStr) => {
    const date = new Date(dateStr + 'T12:00:00');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    if (isToday) return `Today · ${monthDay}`;
    if (isTomorrow) return `Tomorrow · ${monthDay}`;
    return `${dayName} · ${monthDay}`;
  };

  const getEventColor = (event) => {
    // Color based on calendar or status
    if (event.status === 'cancelled') return 'border-red-300 bg-red-50';
    if (event.calendarName?.toLowerCase().includes('personal')) return 'border-rose-gold-300 bg-rose-gold-50';
    if (event.calendarName?.toLowerCase().includes('work') || event.calendarName?.toLowerCase().includes('solvr')) return 'border-sage-300 bg-sage-50';
    return 'border-warm-200 bg-cream-50';
  };

  const hasVideoConference = (event) => {
    return event.hangoutLink || 
           event.conferenceData?.entryPoints?.some(e => e.entryPointType === 'video') ||
           event.description?.includes('zoom.us') ||
           event.location?.includes('zoom.us') ||
           event.description?.includes('meet.google.com');
  };

  const getVideoLink = (event) => {
    if (event.hangoutLink) return event.hangoutLink;
    if (event.conferenceData?.entryPoints) {
      const videoEntry = event.conferenceData.entryPoints.find(e => e.entryPointType === 'video');
      if (videoEntry) return videoEntry.uri;
    }
    // Try to extract from description or location
    const zoomMatch = (event.description || event.location || '').match(/https:\/\/[^\s]*zoom\.us[^\s]*/);
    if (zoomMatch) return zoomMatch[0];
    const meetMatch = (event.description || event.location || '').match(/https:\/\/meet\.google\.com[^\s]*/);
    if (meetMatch) return meetMatch[0];
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-warm-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sage-100 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-sage-600" />
            </div>
            Calendar
          </h1>
          <p className="mt-1 text-warm-500">
            Upcoming events from Zack's calendars
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Day Range Selector */}
          <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-cream-200">
            <button
              onClick={() => setDays(d => Math.max(1, d - 7))}
              className="p-1 hover:bg-cream-100 rounded-lg text-warm-500 hover:text-warm-700"
              disabled={days <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-warm-700 min-w-[80px] text-center">
              {days} days
            </span>
            <button
              onClick={() => setDays(d => Math.min(30, d + 7))}
              className="p-1 hover:bg-cream-100 rounded-lg text-warm-500 hover:text-warm-700"
              disabled={days >= 30}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={fetchEvents}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-sage-500 hover:bg-sage-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Last refresh time */}
      {lastRefresh && (
        <p className="text-xs text-warm-400">
          Last updated: {lastRefresh.toLocaleTimeString()}
        </p>
      )}

      {/* Error State */}
      {error && (
        <div className="card bg-red-50 border-red-200">
          <p className="text-red-700">{error}</p>
          <p className="text-sm text-red-500 mt-1">
            Calendar integration may not be configured. Check server logs.
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && !events.length && (
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-warm-500">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Loading calendar...</span>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && events.length === 0 && (
        <div className="card">
          <div className="text-center py-12">
            <CalendarIcon className="w-12 h-12 text-warm-300 mx-auto mb-4" />
            <p className="text-warm-600 font-medium">No upcoming events</p>
            <p className="text-warm-400 text-sm mt-1">
              The next {days} days are clear!
            </p>
          </div>
        </div>
      )}

      {/* Events List Grouped by Day */}
      {!loading && Object.keys(eventsByDate).length > 0 && (
        <div className="space-y-6">
          {Object.entries(eventsByDate)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([dateKey, dayEvents]) => (
              <div key={dateKey} className="space-y-3">
                {/* Date Header */}
                <h2 className="text-lg font-semibold text-warm-700 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-sage-400"></div>
                  {formatDateHeader(dateKey)}
                  <span className="text-sm font-normal text-warm-400">
                    ({dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''})
                  </span>
                </h2>

                {/* Events for this day */}
                <div className="space-y-3">
                  {dayEvents.map((event, index) => (
                    <div
                      key={event.id || index}
                      className={`card border-l-4 ${getEventColor(event)} hover:shadow-md transition-shadow`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        {/* Time Column */}
                        <div className="sm:w-32 flex-shrink-0">
                          <div className="flex items-center gap-2 text-warm-600">
                            <Clock className="w-4 h-4 text-warm-400" />
                            <span className="text-sm font-medium">
                              {formatTime(event)}
                            </span>
                          </div>
                        </div>

                        {/* Event Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-warm-800 truncate">
                            {event.summary || '(No title)'}
                            {event.status === 'cancelled' && (
                              <span className="ml-2 text-xs text-red-500 font-normal">(Cancelled)</span>
                            )}
                          </h3>

                          {/* Meta info */}
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-warm-500">
                            {/* Location */}
                            {event.location && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5" />
                                <span className="truncate max-w-[200px]">{event.location}</span>
                              </div>
                            )}

                            {/* Video Conference */}
                            {hasVideoConference(event) && (
                              <a
                                href={getVideoLink(event)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-sage-600 hover:text-sage-700"
                              >
                                <Video className="w-3.5 h-3.5" />
                                <span>Join video call</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}

                            {/* Attendees count */}
                            {event.attendees && event.attendees.length > 0 && (
                              <div className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5" />
                                <span>{event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}</span>
                              </div>
                            )}

                            {/* Calendar name */}
                            {event.calendarName && (
                              <span className="text-warm-400">
                                • {event.calendarName}
                              </span>
                            )}
                          </div>

                          {/* Description preview */}
                          {event.description && (
                            <p className="mt-2 text-sm text-warm-500 line-clamp-2">
                              {event.description.replace(/<[^>]*>/g, '').substring(0, 200)}
                            </p>
                          )}
                        </div>

                        {/* Google Calendar Link */}
                        {event.htmlLink && (
                          <a
                            href={event.htmlLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-cream-100 rounded-lg text-warm-400 hover:text-warm-600 transition-colors"
                            title="Open in Google Calendar"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
