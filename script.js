const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const weatherContent = document.getElementById('weather-content');
const errorMessage = document.getElementById('error-message');
const forecastGrid = document.getElementById('forecast-grid');

// WMO Weather interpretation codes
function getWeatherDescription(code) {
    const codes = {
        0: 'Clear sky',
        1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
        45: 'Fog', 48: 'Depositing rime fog',
        51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
        61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
        71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
        95: 'Thunderstorm'
    };
    return codes[code] || 'Unknown';
}

function formatDate(dateString) {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

async function fetchWeather(city) {
    try {
        // Step 1: Geocoding (Get Lat/Lon for the city)
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`);
        const geoData = await geoRes.json();
        
        if (!geoData.results || geoData.results.length === 0) {
            throw new Error('City not found');
        }
        
        const { latitude, longitude, name, country } = geoData.results[0];

        // Step 2: Fetch Weather Data
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`);
        const weatherData = await weatherRes.json();

        updateUI(name, country, weatherData);
        
        weatherContent.classList.remove('hidden');
        errorMessage.classList.add('hidden');
    } catch (error) {
        weatherContent.classList.add('hidden');
        errorMessage.classList.remove('hidden');
    }
}

function updateUI(city, country, data) {
    // Current Weather
    document.getElementById('city-name').textContent = `${city}, ${country}`;
    document.getElementById('current-temp').textContent = Math.round(data.current_weather.temperature);
    document.getElementById('weather-desc').textContent = getWeatherDescription(data.current_weather.weathercode);
    document.getElementById('wind-speed').textContent = data.current_weather.windspeed;

    // 7-Day Forecast
    forecastGrid.innerHTML = '';
    const daily = data.daily;
    
    for (let i = 1; i < 7; i++) { // Skipping today (index 0)
        const card = document.createElement('div');
        card.className = 'forecast-card';
        
        const date = formatDate(daily.time[i]);
        const maxTemp = Math.round(daily.temperature_2m_max[i]);
        const minTemp = Math.round(daily.temperature_2m_min[i]);
        const desc = getWeatherDescription(daily.weathercode[i]);
        
        card.innerHTML = `
            <div class="day">${date}</div>
            <div class="desc">${desc}</div>
            <div class="temp"><strong>${maxTemp}°</strong> / ${minTemp}°</div>
        `;
        forecastGrid.appendChild(card);
    }
}

searchBtn.addEventListener('click', () => {
    if (cityInput.value.trim()) fetchWeather(cityInput.value);
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && cityInput.value.trim()) fetchWeather(cityInput.value);
});