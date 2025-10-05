import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { AlertTriangle, Flame, Shield, Search, MapPin, Trees, Wind, Droplets, CloudRain, Gauge, ThermometerSun, Snowflake, CloudSnow, Info } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import './App.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const fireIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjZWY0NDQ0Ij48cGF0aCBkPSJNOC41IDEyYzAtMS42NS42LTMuMTUgMS41LTQuMzUgMC0yLjI1IDEuNS00LjY1IDMuNS00LjY1czMuNSAyLjQgMy41IDQuNjVjLjkgMS4yIDEuNSAyLjcgMS41IDQuMzUgMCAyLjc2LTIuMjQgNS01IDVzLTUtMi4yNC01LTV6bTQuNSA0YzEuNjYgMCAzLTEuMzQgMy0zczEuMzQtMyAzLTMtMS4zNC0zLTMtMy0zIDEuMzQtMyAzIDEuMzQgMyAzIDN6Ii8+PC9zdmc+',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const eventIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjZjU5ZTBiIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMSI+PHBhdGggZD0iTTEyIDJMMiAyMmgyMEwxMiAyem0wIDRsNy41IDE0aC0xNUwxMiA2em0tMSA1djRoMnYtNGgtMnptMCA2djJoMnYtMmgtMnoiLz48L3N2Zz4=',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28]
});

function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export default function App() {
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState([56.1304, -106.3468]);
  const [mapZoom, setMapZoom] = useState(4);
  const [weather, setWeather] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [username, setUsername] = useState('');
  const [messageText, setMessageText] = useState('');

  // Load messages from localStorage on mount and poll for updates
  useEffect(() => {
    const loadMessages = () => {
      try {
        const stored = localStorage.getItem('wildfire_chat_messages');
        if (stored) {
          const messages = JSON.parse(stored);
          setChatMessages(messages);
        }
      } catch (err) {
        console.error('Error loading messages:', err);
      }
    };

    loadMessages();
    const interval = setInterval(loadMessages, 1000);
    window.addEventListener('storage', loadMessages);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', loadMessages);
    };
  }, []);

  useEffect(() => {
    const messagesEl = document.getElementById('messages');
    if (messagesEl) {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  }, [chatMessages]);

  const sendChatMessage = () => {
    if (!messageText.trim()) return;

    try {
      const stored = localStorage.getItem('wildfire_chat_messages');
      const messages = stored ? JSON.parse(stored) : [];

      const newMessage = {
        id: Date.now(),
        username: username.trim() || 'Anonymous',
        message: messageText.trim(),
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      };

      messages.push(newMessage);
      if (messages.length > 100) {
        messages.splice(0, messages.length - 100);
      }

      localStorage.setItem('wildfire_chat_messages', JSON.stringify(messages));
      setChatMessages(messages);
      setMessageText('');
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendChatMessage();
    }
  };

  const ecozoneData = {
    'boreal': { base: 0.85, seasonal: { 5: 0.92, 6: 0.95, 7: 0.93, 8: 0.88, 9: 0.75 }, description: 'Boreal Forest Zone' },
    'taiga': { base: 0.78, seasonal: { 5: 0.85, 6: 0.90, 7: 0.88, 8: 0.82, 9: 0.70 }, description: 'Taiga Zone' },
    'mixed_forest': { base: 0.45, seasonal: { 5: 0.58, 6: 0.65, 7: 0.63, 8: 0.55, 9: 0.40 }, description: 'Mixed Forest Zone' },
    'great_lakes': { base: 0.12, seasonal: { 5: 0.18, 6: 0.22, 7: 0.20, 8: 0.15, 9: 0.10 }, description: 'Great Lakes Lowland' },
    'agricultural': { base: 0.08, seasonal: { 5: 0.12, 6: 0.15, 7: 0.13, 8: 0.10, 9: 0.08 }, description: 'Agricultural Zone' },
    'atlantic': { base: 0.25, seasonal: { 5: 0.35, 6: 0.42, 7: 0.40, 8: 0.32, 9: 0.22 }, description: 'Atlantic Maritime' },
    'mountain': { base: 0.72, seasonal: { 5: 0.80, 6: 0.88, 7: 0.90, 8: 0.85, 9: 0.65 }, description: 'Mountain Forest Zone' },
    'prairie': { base: 0.15, seasonal: { 5: 0.25, 6: 0.32, 7: 0.28, 8: 0.20, 9: 0.12 }, description: 'Prairie Grassland' },
    'tundra': { base: 0.05, seasonal: { 5: 0.08, 6: 0.12, 7: 0.10, 8: 0.08, 9: 0.05 }, description: 'Arctic Tundra' }
  };

  const cityEcozones = {
    'windsor': 'great_lakes', 'london': 'great_lakes', 'toronto': 'great_lakes', 'mississauga': 'great_lakes', 'brampton': 'great_lakes',
    'hamilton': 'great_lakes', 'kitchener': 'great_lakes', 'waterloo': 'great_lakes', 'ottawa': 'mixed_forest',
    'thunder bay': 'boreal', 'sudbury': 'boreal', 'timmins': 'boreal',
    'montreal': 'mixed_forest', 'quebec city': 'mixed_forest',
    'halifax': 'atlantic', 'moncton': 'atlantic',
    'regina': 'prairie', 'saskatoon': 'prairie', 'winnipeg': 'agricultural',
    'calgary': 'prairie', 'edmonton': 'mixed_forest', 'fort mcmurray': 'boreal',
    'vancouver': 'mountain', 'victoria': 'mountain', 'kelowna': 'mountain',
    'yellowknife': 'taiga', 'whitehorse': 'taiga', 'iqaluit': 'tundra'
  };

  const provinceResources = {
    'AB': { name: 'Alberta', wildfire: '310-FIRE (310-3473)', wildfireInfo: 'Alberta Wildfire', website: 'https://www.alberta.ca/wildfire' },
    'BC': { name: 'British Columbia', wildfire: '1-800-663-5555', wildfireInfo: 'BC Wildfire Service', website: 'https://www2.gov.bc.ca/gov/content/safety/wildfire-status' },
    'SK': { name: 'Saskatchewan', wildfire: '1-866-404-4911', wildfireInfo: 'Saskatchewan Public Safety Agency', website: 'https://www.saskatchewan.ca/residents/environment-public-health-and-safety/wildfire-status' },
    'MB': { name: 'Manitoba', wildfire: '1-800-782-0076', wildfireInfo: 'Manitoba Wildfire Program', website: 'https://www.gov.mb.ca/sd/fire/' },
    'ON': { name: 'Ontario', wildfire: '1-877-847-1577', wildfireInfo: 'Ontario Fire Information', website: 'https://www.ontario.ca/page/forest-fires' },
    'QC': { name: 'Quebec', wildfire: '1-800-463-FEUX (3389)', wildfireInfo: 'SOPFEU', website: 'https://sopfeu.qc.ca/' },
    'NB': { name: 'New Brunswick', wildfire: '1-800-442-9799', wildfireInfo: 'NB Forest Fire Watch', website: 'https://www2.gnb.ca/content/gnb/en/departments/erd/natural_resources/content/forests/content/ForestProtection.html' },
    'NS': { name: 'Nova Scotia', wildfire: '1-800-565-2224', wildfireInfo: 'NS Forest Protection', website: 'https://novascotia.ca/natr/forestprotection/' },
    'PE': { name: 'Prince Edward Island', wildfire: '902-368-5044', wildfireInfo: 'PEI Forest Management', website: 'https://www.princeedwardisland.ca/en/information/environment-energy-and-climate-action/forest-management' },
    'NL': { name: 'Newfoundland and Labrador', wildfire: '1-877-709-3473', wildfireInfo: 'NL Forest Fire Management', website: 'https://www.gov.nl.ca/ffa/forestry-and-wildlife/forest-fire-management/' },
    'YT': { name: 'Yukon', wildfire: '1-888-798-3473', wildfireInfo: 'Yukon Wildland Fire', website: 'https://yukon.ca/en/emergencies-and-safety/emergency-preparedness/wildland-fire-information' },
    'NT': { name: 'Northwest Territories', wildfire: '1-877-698-3473', wildfireInfo: 'NWT Fire Operations', website: 'https://www.gov.nt.ca/ecc/en/services/wildfire-operations' },
    'NU': { name: 'Nunavut', wildfire: '1-867-975-5400', wildfireInfo: 'Nunavut Emergency Management', website: 'https://www.gov.nu.ca/community-and-government-services/information/emergency-management' }
  };

  const provinceNames = {
    'AB': 'Alberta', 'BC': 'British Columbia', 'SK': 'Saskatchewan', 'MB': 'Manitoba', 'ON': 'Ontario', 'QC': 'Quebec',
    'NB': 'New Brunswick', 'NS': 'Nova Scotia', 'PE': 'Prince Edward Island', 'NL': 'Newfoundland and Labrador',
    'YT': 'Yukon', 'NT': 'Northwest Territories', 'NU': 'Nunavut'
  };

  const getProvinceResources = () => {
    const provinceCode = province.toUpperCase().trim();
    return provinceResources[provinceCode] || null;
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const geocodeLocation = async (cityName, provinceName) => {
    const query = `${cityName}, ${provinceName}, Canada`;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=ca`,
      { headers: { 'User-Agent': 'WildfireRiskApp/1.0' } }
    );
    const data = await response.json();
    if (data.length === 0) throw new Error('Location not found');
    const canadianResult = data.find(result => result.display_name?.toLowerCase().includes('canada')) || data[0];
    const lat = parseFloat(canadianResult.lat);
    const lon = parseFloat(canadianResult.lon);
    if (lat < 41.7 || lat > 83.1 || lon < -141 || lon > -52.6) throw new Error('Location outside Canada');
    return { lat, lon };
  };

  const getWeatherData = async (lat, lon) => {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,pressure_msl&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=auto&forecast_days=3`
    );
    const data = await response.json();
    return {
      temperature: data.current.temperature_2m,
      feelsLike: data.current.apparent_temperature,
      humidity: data.current.relative_humidity_2m,
      precipitation: data.current.precipitation,
      windSpeed: data.current.wind_speed_10m,
      windGusts: data.current.wind_gusts_10m,
      windDirection: data.current.wind_direction_10m,
      pressure: data.current.pressure_msl,
      forecast: {
        temps: data.daily.temperature_2m_max.slice(0, 3),
        precipitation: data.daily.precipitation_sum.slice(0, 3),
        precipProb: data.daily.precipitation_probability_max.slice(0, 3)
      }
    };
  };

  const determineEcozone = (cityName, lat) => {
    const cityLower = cityName.toLowerCase().trim();
    if (cityEcozones[cityLower]) return cityEcozones[cityLower];
    if (lat > 60) return 'tundra';
    if (lat > 55) return 'taiga';
    if (lat > 50) return 'boreal';
    if (lat > 45) return 'mixed_forest';
    if (lat > 42) return 'great_lakes';
    return 'agricultural';
  };

  const getWindDirectionText = (degrees) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(degrees / 45) % 8];
  };

  const assessRisk = async () => {
    if (!city || !province) {
      alert('Please enter both city and province');
      return;
    }

    setLoading(true);
    const provinceUpper = province.toUpperCase().trim();
    const provinceFull = provinceNames[provinceUpper] || province;

    try {
      const location = await geocodeLocation(city, provinceFull);
      const { lat, lon } = location;
      const currentMonth = new Date().getMonth() + 1;

      setMapCenter([lat, lon]);
      setMapZoom(10);

      const weatherData = await getWeatherData(lat, lon).catch(() => null);
      setWeather(weatherData);

      const ecozone = determineEcozone(city, lat);
      const zoneData = ecozoneData[ecozone];

      let activeFires = [];
      try {
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        const dateString = oneDayAgo.toISOString().split('T')[0];
        const response = await fetch(
          `https://firms.modaps.eosdis.nasa.gov/api/area/csv/6c51ab1159d4ce6922cff4d350f9a66c/VIIRS_SNPP_NRT/${lat - 2},${lon - 2},${lat + 2},${lon + 2}/1/${dateString}`,
          { signal: AbortSignal.timeout(15000) }
        );
        if (response?.ok) {
          const text = await response.text();
          activeFires = text.split('\n').slice(1).filter(line => line.trim()).map(line => {
            const parts = line.split(',');
            return { lat: parseFloat(parts[0]), lon: parseFloat(parts[1]), brightness: parseFloat(parts[2]), acqDate: parts[5], acqTime: parts[6] };
          }).filter(fire => !isNaN(fire.lat));
        }
      } catch (err) { console.error('FIRMS failed:', err); }

      let naturalEvents = [];
      try {
        const eonetResponse = await fetch(`https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=100`, { signal: AbortSignal.timeout(10000) });
        if (eonetResponse?.ok) {
          const eonetData = await eonetResponse.json();
          naturalEvents = eonetData.events.filter(event => {
            if (!event.geometry?.[0]) return false;
            const coords = event.geometry[event.geometry.length - 1].coordinates;
            const eventLat = coords[1], eventLon = coords[0];
            const inRadius = Math.abs(eventLat - lat) <= 5 && Math.abs(eventLon - lon) <= 5;
            const inCanada = eventLat >= 41.7 && eventLat <= 83.1 && eventLon >= -141 && eventLon <= -52.6;
            return inRadius && inCanada;
          }).map(event => {
            const coords = event.geometry[event.geometry.length - 1].coordinates;
            return {
              id: event.id,
              title: event.title,
              category: event.categories[0].title,
              date: event.geometry[event.geometry.length - 1].date,
              lat: coords[1],
              lon: coords[0],
              distance: Math.round(calculateDistance(lat, lon, coords[1], coords[0])),
              link: event.sources?.[0]?.url
            };
          }).sort((a, b) => a.distance - b.distance);
        }
      } catch (err) { console.error('EONET failed:', err); }

      const minDistance = activeFires.reduce((min, fire) => Math.min(min, calculateDistance(lat, lon, fire.lat, fire.lon)), Infinity);
      const seasonalFactor = zoneData.seasonal[currentMonth] || zoneData.base;
      let riskScore = Math.round(seasonalFactor * 100);
      let status, threat, color, icon;

      if (minDistance < 10) {
        status = 'ACTIVE WILDFIRE';
        threat = 'You are in or very near an active wildfire zone';
        riskScore = 100;
        color = 'text-red-600';
        icon = <Flame className="w-8 h-8 text-red-600" />;
      } else if (minDistance < 50) {
        status = 'EXTREME THREAT';
        threat = `Active fire ${Math.round(minDistance)}km away`;
        riskScore = 95;
        color = 'text-orange-600';
        icon = <AlertTriangle className="w-8 h-8 text-orange-600" />;
      } else if (riskScore >= 75) {
        status = 'HIGH RISK';
        threat = 'High wildfire susceptibility in this region';
        color = 'text-orange-500';
        icon = <AlertTriangle className="w-8 h-8 text-orange-500" />;
      } else if (riskScore >= 50) {
        status = 'MODERATE RISK';
        threat = 'Moderate wildfire susceptibility';
        color = 'text-yellow-600';
        icon = <AlertTriangle className="w-8 h-8 text-yellow-600" />;
      } else if (riskScore >= 25) {
        status = 'LOW RISK';
        threat = 'Low wildfire susceptibility';
        color = 'text-blue-600';
        icon = <Shield className="w-8 h-8 text-blue-600" />;
      } else {
        status = 'MINIMAL RISK';
        threat = 'Very low wildfire risk';
        color = 'text-green-600';
        icon = <Shield className="w-8 h-8 text-green-600" />;
      }

      setResult({
        status, threat, riskScore, color, icon,
        location: `${city}, ${provinceUpper}`,
        coordinates: { lat, lon },
        ecozone: zoneData.description,
        activeFires,
        naturalEvents,
        nearestFireDistance: minDistance < 1000 ? Math.round(minDistance) : null
      });

    } catch (error) {
      setResult({ error: true, message: error.message || 'Error processing location' });
    }
    setLoading(false);
  };

  return (
    <div className="app-container">
      <div className="app-wrapper">
        <header className="hero-section">
          <div className="hero-content">
            <div className="hero-badge">
            </div>
            <h1 className="hero-title title-glow">
              Canadian Wildfire Risk Tracker
            </h1>
            <p className="hero-subtitle">
              Real-time monitoring powered by NASA FIRMS & EONET satellite data
            </p>
          </div>
        </header>

        <div className="search-section">
          <div className="search-card">
            <div className="search-inputs">
              <div className="input-group-modern">
                <MapPin className="input-icon" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Enter city (e.g., Toronto, Vancouver)"
                  className="input-modern"
                  onKeyPress={(e) => e.key === 'Enter' && assessRisk()}
                />
              </div>
              <div className="input-group-modern">
                <Trees className="input-icon" />
                <input
                  type="text"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder="Province (e.g., ON, BC, AB)"
                  className="input-modern"
                  onKeyPress={(e) => e.key === 'Enter' && assessRisk()}
                />
              </div>
            </div>
            <button onClick={assessRisk} disabled={loading} className="btn-primary">
              {loading ? (
                <div className="spinner" />
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>Analyze Location</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="map-section">
          <MapContainer center={mapCenter} zoom={mapZoom} className="map">
            <ChangeView center={mapCenter} zoom={mapZoom} />
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {result?.coordinates && (
              <>
                <Marker position={[result.coordinates.lat, result.coordinates.lon]}>
                  <Popup>{result.location}</Popup>
                </Marker>
                <Circle
                  center={[result.coordinates.lat, result.coordinates.lon]}
                  radius={5000}
                  pathOptions={{ color: result.riskScore >= 75 ? '#ef4444' : result.riskScore >= 50 ? '#f97316' : result.riskScore >= 25 ? '#eab308' : '#22c55e', fillOpacity: 0.2 }}
                />
              </>
            )}
            {result?.activeFires?.map((fire, idx) => (
              <Marker key={`fire-${idx}`} position={[fire.lat, fire.lon]} icon={fireIcon}>
                <Popup>
                  <strong>Active Fire</strong><br />
                  Brightness: {fire.brightness}K<br />
                  {fire.acqDate} at {fire.acqTime}
                </Popup>
              </Marker>
            ))}
            {result?.naturalEvents?.map((event, idx) => (
              <Marker key={`event-${idx}`} position={[event.lat, event.lon]} icon={eventIcon}>
                <Popup>
                  <strong>{event.category}</strong><br />
                  {event.title}<br />
                  {event.distance} km away
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {result && !result.error && (
          <div className="dashboard">
            <div className="risk-panel">
              <h3 className="section-title">Wildfire Susceptibility</h3>
              <div className="risk-header">
                <div className="risk-icon-wrapper">
                  {result.icon}
                </div>
                <div>
                  <h2 className={`risk-status ${result.color}`}>{result.status} Risk of Ignition</h2>
                  <p className="risk-location">{result.location}</p>
                </div>
                <div className="risk-score-badge">
                  <div className="score-number">{result.riskScore}</div>
                  <div className="score-label">Risk Score</div>
                </div>
              </div>

              <div className="threat-alert">
                <Info className="w-5 h-5" />
                <p>{result.threat}</p>
              </div>

              <div className="ecozone-tag">
                <Trees className="w-4 h-4" />
                <span>{result.ecozone}</span>
              </div>

              <div className="progress-container">
                <div className="progress-track">
                  <div
                    className={`progress-fill-modern ${result.riskScore >= 75 ? 'bg-red' : result.riskScore >= 50 ? 'bg-orange' : result.riskScore >= 25 ? 'bg-yellow' : 'bg-green'}`}
                    style={{ width: `${result.riskScore}%` }}
                  />
                </div>
              </div>

              <div className="fire-count-inline">
                <div className="metric-card">
                  <Flame className="metric-icon text-orange-500" />
                  <div className="metric-content">
                    <div className="metric-label">Active Fires (24h)</div>
                    <div className="metric-value">{result.activeFires.length}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="weather-panel">
              <h3 className="section-title">Current Local Weather</h3>
              <div className="metrics-grid">
                {weather && (
                  <>
                    <div className="metric-card">
                      <Wind className="metric-icon text-blue-400" />
                      <div className="metric-content">
                        <div className="metric-label">Wind Speed</div>
                        <div className="metric-value">{Math.round(weather.windSpeed)} km/h {getWindDirectionText(weather.windDirection)}</div>
                      </div>
                    </div>

                    <div className="metric-card">
                      <ThermometerSun className="metric-icon text-red-400" />
                      <div className="metric-content">
                        <div className="metric-label">Temperature</div>
                        <div className="metric-value">{Math.round(weather.temperature)}°C</div>
                      </div>
                    </div>

                    <div className="metric-card">
                      <Droplets className="metric-icon text-cyan-400" />
                      <div className="metric-content">
                        <div className="metric-label">Humidity</div>
                        <div className="metric-value">{weather.humidity}%</div>
                      </div>
                    </div>

                    <div className="metric-card">
                      <CloudRain className="metric-icon text-indigo-400" />
                      <div className="metric-content">
                        <div className="metric-label">Precipitation</div>
                        <div className="metric-value">{weather.precipitation} mm</div>
                      </div>
                    </div>

                    <div className="metric-card">
                      <Gauge className="metric-icon text-slate-400" />
                      <div className="metric-content">
                        <div className="metric-label">Pressure</div>
                        <div className="metric-value">{Math.round(weather.pressure)} hPa</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {weather?.forecast && (
              <div className="forecast-section">
                <h3 className="section-title">3-Day Forecast</h3>
                <div className="forecast-cards">
                  {[0, 1, 2].map((day) => {
                    const date = new Date();
                    date.setDate(date.getDate() + day);
                    const dayName = day === 0 ? 'Today' : day === 1 ? 'Tomorrow' : date.toLocaleDateString('en-CA', { weekday: 'short' });
                    return (
                      <div key={day} className="forecast-card-modern">
                        <div className="forecast-header">{dayName}</div>
                        <div className="forecast-temp">{Math.round(weather.forecast.temps[day])}°C</div>
                        <div className="forecast-details">
                          <div className="forecast-detail">
                            <CloudRain className="w-4 h-4" />
                            <span>{weather.forecast.precipitation[day].toFixed(1)} mm</span>
                          </div>
                          <div className="forecast-detail">
                            <Droplets className="w-4 h-4" />
                            <span>{weather.forecast.precipProb[day]}%</span>
                          </div>
                        </div>
                        {weather.forecast.precipitation[day] > 25 && (
                          <div className="forecast-warning">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Heavy Rain</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {result.naturalEvents?.length > 0 && (
              <div className="events-section">
                <h3 className="section-title">Nearest Natural Disasters</h3>
                <div className="events-list-modern">
                  {result.naturalEvents.slice(0, 5).map((event) => {
                    const getCategoryIcon = (category) => {
                      if (category.toLowerCase().includes('snow') || category.toLowerCase().includes('ice')) return <Snowflake className="w-5 h-5 text-blue-300" />;
                      if (category.toLowerCase().includes('storm')) return <CloudSnow className="w-5 h-5 text-purple-400" />;
                      if (category.toLowerCase().includes('flood')) return <Droplets className="w-5 h-5 text-cyan-400" />;
                      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
                    };

                    return (
                      <div key={event.id} className="event-card-modern">
                        <div className="event-icon-wrapper">
                          {getCategoryIcon(event.category)}
                        </div>
                        <div className="event-info">
                          <div className="event-category">{event.category}</div>
                          <div className="event-title">{event.title}</div>
                          <div className="event-meta">
                            {event.distance} km away • {new Date(event.date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                        {event.link && (
                          <a href={event.link} target="_blank" rel="noopener noreferrer" className="event-link-btn">
                            Details →
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="community-section">
              <div className="chat-panel">
                <h3 className="section-title">Alert Communication System</h3>
                <div className="chat-info" style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid var(--fire-1)',
                  borderRadius: '12px',
                  padding: '12px',
                  marginBottom: '16px',
                  fontSize: '14px',
                  color: 'var(--fire-1)'
                }}>
                </div>
                <div id="messages" className="chat-messages">
                  {chatMessages.length === 0 ? (
                    <div style={{ color: 'var(--text-primary)', opacity: 0.5, padding: '20px', textAlign: 'center' }}>
                      No messages yet. Be the first to send an alert!
                    </div>
                  ) : (
                    chatMessages.map((msg) => (
                      <div key={msg.id} className="chat-message">
                        <div className="chat-meta">
                          <strong>{msg.username}</strong> • {msg.timestamp}
                        </div>
                        <div className="chat-text">{msg.message}</div>
                      </div>
                    ))
                  )}
                </div>
                <div className="chat-controls">
                  <input
                    type="text"
                    placeholder="Your name (optional)"
                    className="chat-input-name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <input
                    type="text"
                    placeholder="Share alert or safety information..."
                    className="chat-input-message"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <button
                    className="chat-send-btn"
                    onClick={sendChatMessage}
                    type="button"
                  >
                    Send
                  </button>
                </div>
              </div>

              <div className="resources-panel">
                <h3 className="section-title">Emergency Resources</h3>

                {result && getProvinceResources() ? (
                  <div style={{
                    background: 'rgba(220, 38, 38, 0.15)',
                    border: '1px solid var(--fire-2)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    marginBottom: '16px',
                    fontSize: '14px',
                    color: 'var(--fire-accent)',
                    fontWeight: '600'
                  }}>
                    Resources for {getProvinceResources().name}
                  </div>
                ) : null}

                <div className="resources-list">
                  <div className="resource-item">
                    <div className="resource-icon">🚨</div>
                    <div className="resource-info">
                      <div className="resource-title">Emergency Services</div>
                      <div className="resource-detail">911 - Fire, Police, Ambulance</div>
                    </div>
                  </div>

                  {result && getProvinceResources() ? (
                    <div className="resource-item" style={{ borderColor: 'var(--fire-1)' }}>
                      <div className="resource-icon">🔥</div>
                      <div className="resource-info">
                        <div className="resource-title">{getProvinceResources().wildfireInfo}</div>
                        <div className="resource-detail">{getProvinceResources().wildfire}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="resource-item">
                      <div className="resource-icon">🔥</div>
                      <div className="resource-info">
                        <div className="resource-title">Wildfire Info Line</div>
                        <div className="resource-detail">Enter location to see provincial hotline</div>
                      </div>
                    </div>
                  )}

                  <div className="resource-item">
                    <div className="resource-icon">🌐</div>
                    <div className="resource-info">
                      <div className="resource-title">Red Cross Canada</div>
                      <div className="resource-detail">
                        <a
                          href="https://www.redcross.ca"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--fire-accent)', textDecoration: 'none' }}
                        >
                          redcross.ca - Disaster Help →
                        </a>
                      </div>
                    </div>
                  </div>

                  {result && getProvinceResources() && (
                    <div className="resource-item">
                      <div className="resource-icon">ℹ️</div>
                      <div className="resource-info">
                        <div className="resource-title">Provincial Wildfire Info</div>
                        <div className="resource-detail">
                          <a
                            href={getProvinceResources().website}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--fire-accent)', textDecoration: 'none' }}
                          >
                            Visit {getProvinceResources().name} Website →
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="safety-tips">
                  <h4 className="tips-title">Fire Safety Tips</h4>
                  <ul className="tips-list">
                    <li>Create a 30-meter safety zone around your home</li>
                    <li>Have an evacuation plan and emergency kit ready</li>
                    <li>Stay informed via official channels</li>
                    <li>Clear gutters and roof of dry debris</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="data-sources">
              <div className="source-badge">NASA FIRMS</div>
              <div className="source-badge">NASA EONET</div>
              <div className="source-badge">Open-Meteo</div>
            </div>
          </div>
        )}

        {result?.error && (
          <div className="error-panel">
            <AlertTriangle className="w-6 h-6" />
            <p>{result.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}