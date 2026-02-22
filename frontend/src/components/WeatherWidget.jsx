import { API_URL } from '../config.js';
import { useEffect, useState } from 'react'
import { Cloud, Sun, CloudRain, Snowflake, Wind, Droplets } from 'lucide-react'

const weatherIcons = {
  '113': Sun,      // Sunny
  '116': Cloud,    // Partly cloudy
  '119': Cloud,    // Cloudy
  '122': Cloud,    // Overcast
  '176': CloudRain, // Patchy rain
  '200': CloudRain, // Thundery
  '296': CloudRain, // Light rain
  '299': CloudRain, // Moderate rain
  '302': CloudRain, // Heavy rain
  '395': Snowflake, // Snow
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/weather?location=Pensacola,FL`)
      .then(res => res.json())
      .then(data => {
        setWeather(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-20 bg-cream-200 rounded-lg"></div>
      </div>
    )
  }

  if (error || !weather?.current) {
    return null // Silently fail
  }

  const WeatherIcon = weatherIcons[weather.current.icon] || Cloud

  return (
    <div className="card bg-gradient-to-br from-sky-50 to-blue-50 border-sky-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-warm-500">{weather.location}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-semibold text-warm-800">{weather.current.temp_f}°</span>
            <span className="text-sm text-warm-500">Feels {weather.current.feels_like_f}°</span>
          </div>
          <p className="text-sm text-warm-600 mt-1">{weather.current.condition}</p>
        </div>
        <div className="flex flex-col items-center">
          <WeatherIcon className="w-12 h-12 text-sky-500" />
          <div className="flex items-center gap-2 mt-2 text-xs text-warm-500">
            <Droplets className="w-3 h-3" />
            <span>{weather.current.humidity}%</span>
            <Wind className="w-3 h-3 ml-1" />
            <span>{weather.current.wind_mph}mph</span>
          </div>
        </div>
      </div>
      
      {weather.forecast?.length > 0 && (
        <div className="mt-4 pt-3 border-t border-sky-100 flex justify-between">
          {weather.forecast.slice(0, 3).map((day, i) => {
            const DayIcon = weatherIcons[day.icon] || Cloud
            const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })
            return (
              <div key={day.date} className="text-center flex-1">
                <p className="text-xs text-warm-500">{dayName}</p>
                <DayIcon className="w-5 h-5 text-sky-400 mx-auto my-1" />
                <p className="text-xs">
                  <span className="text-warm-700">{day.max_f}°</span>
                  <span className="text-warm-400 mx-1">/</span>
                  <span className="text-warm-400">{day.min_f}°</span>
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
