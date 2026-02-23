import { API_URL } from '../config.js'
import { useEffect, useState } from 'react'
import { Cloud, Sun, CloudRain, Snowflake, Wind, Droplets } from 'lucide-react'

const weatherIcons = {
  '113': Sun,
  '116': Cloud,
  '119': Cloud,
  '122': Cloud,
  '176': CloudRain,
  '200': CloudRain,
  '296': CloudRain,
  '299': CloudRain,
  '302': CloudRain,
  '395': Snowflake,
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
      <div className="card animate-pulse h-full">
        <div className="h-20 bg-dark-500 rounded-lg"></div>
      </div>
    )
  }

  if (error || !weather?.current) {
    return null
  }

  const WeatherIcon = weatherIcons[weather.current.icon] || Cloud

  return (
    <div className="card h-full border-dark-300/30">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-text-500 uppercase tracking-wider">{weather.location}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-semibold text-text-100">{weather.current.temp_f}°</span>
            <span className="text-xs text-text-500">Feels {weather.current.feels_like_f}°</span>
          </div>
          <p className="text-xs text-text-400 mt-1">{weather.current.condition}</p>
        </div>
        <div className="flex flex-col items-center">
          <WeatherIcon className="w-10 h-10 text-gold-400" />
          <div className="flex items-center gap-2 mt-2 text-[10px] text-text-500">
            <Droplets className="w-3 h-3" />
            <span>{weather.current.humidity}%</span>
            <Wind className="w-3 h-3 ml-1" />
            <span>{weather.current.wind_mph}mph</span>
          </div>
        </div>
      </div>

      {weather.forecast?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-dark-300/30 flex justify-between">
          {weather.forecast.slice(0, 3).map((day, i) => {
            const DayIcon = weatherIcons[day.icon] || Cloud
            const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })
            return (
              <div key={day.date} className="text-center flex-1">
                <p className="text-[10px] text-text-500">{dayName}</p>
                <DayIcon className="w-4 h-4 text-text-400 mx-auto my-1" />
                <p className="text-[10px]">
                  <span className="text-text-300">{day.max_f}°</span>
                  <span className="text-text-600 mx-0.5">/</span>
                  <span className="text-text-500">{day.min_f}°</span>
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
