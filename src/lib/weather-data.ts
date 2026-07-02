export type WeatherCurrent = {
  temperatureC: number;
  humidityPct: number;
  windSpeedMph: number;
  windDirectionDeg: number;
  precipitationMm: number;
  rainMm: number;
  weatherCode: number;
};

export type WeatherDaily = {
  date: string;
  weatherCode: number;
  tempMaxC: number;
  tempMinC: number;
  precipitationMm: number;
  rainMm: number;
  windSpeedMaxMph: number;
  windDirectionDeg: number;
  humidityMeanPct: number;
};

export type LocationWeather = {
  latitude: number;
  longitude: number;
  label: string;
  timezone: string;
  current: WeatherCurrent;
  daily: WeatherDaily[];
};

type OpenMeteoResponse = {
  latitude: number;
  longitude: number;
  timezone: string;
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    precipitation: number;
    rain: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    weather_code: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    rain_sum: number[];
    wind_speed_10m_max: number[];
    wind_direction_10m_dominant: number[];
    relative_humidity_2m_mean: number[];
  };
};

export function buildOpenMeteoUrl(latitude: number, longitude: number) {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current:
      "temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m,wind_direction_10m,weather_code",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,rain_sum,wind_speed_10m_max,wind_direction_10m_dominant,relative_humidity_2m_mean",
    timezone: "auto",
    forecast_days: "7",
    wind_speed_unit: "mph",
  });

  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

export function parseOpenMeteoResponse(data: OpenMeteoResponse): Omit<LocationWeather, "label"> {
  return {
    latitude: data.latitude,
    longitude: data.longitude,
    timezone: data.timezone,
    current: {
      temperatureC: data.current.temperature_2m,
      humidityPct: data.current.relative_humidity_2m,
      windSpeedMph: data.current.wind_speed_10m,
      windDirectionDeg: data.current.wind_direction_10m,
      precipitationMm: data.current.precipitation,
      rainMm: data.current.rain,
      weatherCode: data.current.weather_code,
    },
    daily: data.daily.time.map((date, index) => ({
      date,
      weatherCode: data.daily.weather_code[index],
      tempMaxC: data.daily.temperature_2m_max[index],
      tempMinC: data.daily.temperature_2m_min[index],
      precipitationMm: data.daily.precipitation_sum[index],
      rainMm: data.daily.rain_sum[index],
      windSpeedMaxMph: data.daily.wind_speed_10m_max[index],
      windDirectionDeg: data.daily.wind_direction_10m_dominant[index],
      humidityMeanPct: data.daily.relative_humidity_2m_mean[index],
    })),
  };
}

export function formatWindDirection(degrees: number) {
  const directions = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  return directions[Math.round(degrees / 22.5) % 16];
}

export function weatherCodeLabel(code: number) {
  if (code === 0) return "Clear";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Fog";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Showers";
  if (code <= 86) return "Snow showers";
  if (code <= 99) return "Thunderstorm";
  return "Unknown";
}

export function weatherCodeEmoji(code: number) {
  if (code === 0) return "☀️";
  if (code <= 2) return "🌤️";
  if (code === 3) return "☁️";
  if (code <= 48) return "🌫️";
  if (code <= 57) return "🌦️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "❄️";
  if (code <= 82) return "🌦️";
  if (code <= 86) return "🌨️";
  if (code <= 99) return "⛈️";
  return "🌡️";
}

export function formatForecastDay(date: string, timezone: string) {
  const value = new Date(`${date}T12:00:00`);
  const today = new Date();
  const todayKey = today.toLocaleDateString("en-GB", { timeZone: timezone });
  const dayKey = value.toLocaleDateString("en-GB", { timeZone: timezone });

  if (todayKey === dayKey) return "Today";

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = tomorrow.toLocaleDateString("en-GB", { timeZone: timezone });
  if (tomorrowKey === dayKey) return "Tomorrow";

  return value.toLocaleDateString("en-GB", {
    weekday: "short",
    timeZone: timezone,
  });
}

export type WeatherTimeframe = "today" | "tomorrow" | "next-7-days";

export function weatherMapTint(code: number) {
  if (code === 0) return "rgba(251, 191, 36, 0.18)";
  if (code <= 2) return "rgba(148, 163, 184, 0.14)";
  if (code === 3) return "rgba(100, 116, 139, 0.28)";
  if (code <= 48) return "rgba(148, 163, 184, 0.32)";
  if (code <= 57) return "rgba(96, 165, 250, 0.28)";
  if (code <= 67) return "rgba(37, 99, 235, 0.38)";
  if (code <= 77) return "rgba(186, 230, 253, 0.35)";
  if (code <= 82) return "rgba(59, 130, 246, 0.34)";
  if (code <= 86) return "rgba(191, 219, 254, 0.36)";
  if (code <= 99) return "rgba(79, 70, 229, 0.4)";
  return "rgba(59, 130, 246, 0.2)";
}

export type WeatherDisplaySnapshot = {
  dayLabel: string;
  weatherCode: number;
  tempHighC: number;
  tempLowC: number;
  windSpeedMph: number;
  windDirectionDeg: number;
  humidityPct: number;
  rainMm: number;
  precipMm: number;
  isLive: boolean;
};

export function getWeatherDisplaySnapshot(
  weather: LocationWeather,
  timeframe: WeatherTimeframe,
  weekDayIndex = 0,
): WeatherDisplaySnapshot {
  if (timeframe === "today") {
    const today = weather.daily[0];
    return {
      dayLabel: "Today",
      weatherCode: weather.current.weatherCode,
      tempHighC: today?.tempMaxC ?? weather.current.temperatureC,
      tempLowC: today?.tempMinC ?? weather.current.temperatureC,
      windSpeedMph: weather.current.windSpeedMph,
      windDirectionDeg: weather.current.windDirectionDeg,
      humidityPct: weather.current.humidityPct,
      rainMm: weather.current.rainMm,
      precipMm: weather.current.precipitationMm,
      isLive: true,
    };
  }

  const dailyIndex = timeframe === "tomorrow" ? 1 : weekDayIndex;
  const day = weather.daily[dailyIndex] ?? weather.daily[0];

  return {
    dayLabel:
      timeframe === "tomorrow"
        ? "Tomorrow"
        : formatForecastDay(day.date, weather.timezone),
    weatherCode: day.weatherCode,
    tempHighC: day.tempMaxC,
    tempLowC: day.tempMinC,
    windSpeedMph: day.windSpeedMaxMph,
    windDirectionDeg: day.windDirectionDeg,
    humidityPct: day.humidityMeanPct,
    rainMm: day.rainMm,
    precipMm: day.precipitationMm,
    isLive: false,
  };
}
