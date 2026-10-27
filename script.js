const key = "3ff8e72a637d774bf6b4629ae1966b5d";
const url = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";
const search = document.querySelector(".search input");
const btn = document.querySelector(".search button");
const icon = document.querySelector(".weather-icon");
let lastWeatherData = null;
let forecastData = null;
let currentCityName = "";
let favoriteCities = JSON.parse(
    localStorage.getItem("pilviFavorites") || "[]"
);
const heartButton = document.getElementById("heart");
const favoritesButton = document.getElementById("show-favorites");
const favoritesMenu = document.getElementById("favorites-menu");
let openMeteoTemperatures = null;
let openWeatherTemperatures = null;
let comparisonChart = null;
let fmiTemperatures = null;


async function fetchForecast(lat, lon) {
    const forecast_url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m&hourly=temperature_2m,weather_code` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
        `&forecast_days=7&timezone=auto`;

    try {
        const response = await fetch(forecast_url);
        if (!response.ok) {
            throw new Error("Could not load forecast");
        }
        forecastData = await response.json();
        openMeteoTemperatures = forecastData.hourly;
        displayForecasts();
        return true;
    } catch (error) {
        console.error("Forecast error:", error);
        return false;
    }
}


//convert open meteo weather codes into descriptions
function getForecastDescription(code) {
    if (code === 0) return "Clear";
    if (code === 1) return "Mostly clear";
    if (code === 2) return "Partly cloudy";
    if (code === 3) return "Cloudy";
    if ([45, 48].includes(code)) return "Fog";
    if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain";
    if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
    if ([95, 96, 99].includes(code)) return "Thunderstorm";

    return "Unknown";
}

//match weather codes to image files
function getForecastIcon(code) {
    if (code === 0 || code === 1) return "images/clear.png";
    if ([2, 3].includes(code)) return "images/clouds.png";
    if ([45, 48].includes(code)) return "images/mist.png";
    if ([51, 53, 55, 56, 57].includes(code)) return "images/drizzle.png";
    if ([71, 73, 75, 77, 85, 86].includes(code)) return "images/snow.png";
    if ([95, 96, 99].includes(code)) return "images/rain.png";

    return "images/rain.png";
}

// Format a temperature using Pilvi's selected unit
function formatForecastTemperature(celsius) {
    const converted = convertTemperature(celsius);

    if (currentUnit === "F") {
        return Math.round(converted) + "°F";
    }

    if (currentUnit === "K") {
        return Math.round(converted * 10) / 10 + " K";
    }

    return Math.round(converted) + "°C";
}

//display both forecast sections
function displayForecasts() {
    if (!forecastData) return;

    const hourly = forecastData.hourly;
    const daily = forecastData.daily;

    const hourlyContainer =
        document.getElementById("hourly-forecast");

    const dailyContainer =
        document.getElementById("daily-forecast");

    hourlyContainer.innerHTML = "";
    dailyContainer.innerHTML = "";

    // Find the first forecast hour at or after the API's current time
    const currentTime = forecastData.current.time;
    let startIndex = hourly.time.findIndex(
        time => time >= currentTime
    );

    if (startIndex === -1) startIndex = 0;

    // Show the next 24 hours
    for (let i = startIndex;
         i < Math.min(startIndex + 24, hourly.time.length);
         i++) {

        const time = hourly.time[i].slice(11, 16);
        const temperature = formatForecastTemperature(
            hourly.temperature_2m[i]
        );
        const icon = getForecastIcon(hourly.weather_code[i]);

        const item = document.createElement("div");
        item.className = "hourly-item";

        item.innerHTML = `
            <p>${time}</p>
            <img src="${icon}" alt="${getForecastDescription(hourly.weather_code[i])}">
            <p>${temperature}</p>
        `;

        hourlyContainer.appendChild(item);
    }

    // Show seven days vertically
    for (let i = 0; i < daily.time.length; i++) {
        const date = new Date(daily.time[i] + "T12:00:00");

        let dayName = date.toLocaleDateString("en", {
            weekday: "short"
        });

        if (i === 0) dayName = "Today";
        if (i === 1) dayName = "Tomorrow";

        const code = daily.weather_code[i];
        const description = getForecastDescription(code);
        const icon = getForecastIcon(code);

        const high = formatForecastTemperature(
            daily.temperature_2m_max[i]
        );

        const low = formatForecastTemperature(
            daily.temperature_2m_min[i]
        );

        const item = document.createElement("div");
        item.className = "daily-item";

        item.innerHTML = `
            <span>${dayName}</span>
            <img src="${icon}" alt="${description}">
            <span class="daily-condition">${description}</span>
            <span class="daily-temperatures">${high} / ${low}</span>
        `;

        dailyContainer.appendChild(item);
    }
}

async function checkWeather(city) {
    if (!city.trim()) {
        return;
    }
    const response = await fetch(url + encodeURIComponent(city.trim()) + `&appid=${key}`);
    const data = await response.json();
    if (!response.ok) {
        document.querySelector(".error").style.display = "block";
        document.querySelector(".weather").style.display = "none";
        return;
    }
    document.getElementById("hourly-title").style.display = "block";
    displayWeather(data);
    const lat = data.coord.lat;
    const lon = data.coord.lon;
    try {
        await fetchFmiForecast(lat, lon);
    } catch (error) {
        console.error("FMI forecast error:", error);
    }
    
    
    try {
    const meteoLoaded = await fetchForecast(lat, lon);
    if (!meteoLoaded) return;
        openWeatherTemperatures = await fetchOpenWeatherForecast(lat, lon);
        drawComparisonChart();
    } catch (error) {
        console.error("Forecast comparison error:", error);
}

}

let currentUnit = "C";
function convertTemperature(celsius) {
    if (currentUnit === "F") {
        return (celsius * 9 / 5) + 32;
    } else if (currentUnit === "K") {
        return celsius + 273.15;
    }

    return celsius;
}

function displayWeather(data) {
    if (data.coord) {
        fetchForecast(data.coord.lat, data.coord.lon);
    }
    lastWeatherData = data;
    const condition = data.weather[0].main;

    updateTheme(data);
    document.querySelector(".city").innerHTML = data.name;
    const temperature = convertTemperature(data.main.temp);
    let symbol = "°C";
    if (currentUnit === "F") {
        symbol = "°F";
    } else if (currentUnit === "K") {
        symbol = " K";
    }
    currentCityName = data.name;
    updateFavoriteButton();


document.querySelector(".temp").innerHTML =
    Math.round(temperature * 10) / 10 + symbol;
    document.querySelector(".humidity").innerHTML = data.main.humidity + "%";
    document.querySelector(".wind").innerHTML = data.wind.speed + " km/h";
    const weatherIcons = {
    Clouds: "images/clouds.png",
    Clear: "images/clear.png",
    Rain: "images/rain.png",
    Drizzle: "images/drizzle.png",
    Mist: "images/mist.png",
    Snow: "images/snow.png",
    Haze: "images/mist.png",
    Fog: "images/mist.png",
    Thunderstorm: "images/rain.png"
    };
    icon.src = weatherIcons[condition] || "images/clear.png";
    document.querySelector(".error").style.display = "none";
    document.querySelector(".weather").style.display = "block";
    document.querySelectorAll(".forecast").forEach(section => {
    section.style.display = "block";
});
}


async function checkWeatherByLocation(lat, lon) {
    const locationUrl =
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${key}`;

    const response = await fetch(locationUrl);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Weather request failed");
    }

    displayWeather(data);
}


btn.addEventListener("click", () => {
    checkWeather(search.value);
});
search.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        checkWeather(search.value);
    }
});

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        document.getElementById("self-loc-btn").innerHTML = "Geolocation is not supported by this browser.";
    }
}

function getLocation() {
    const message = document.getElementById("location");

    if (navigator.geolocation) {
        message.textContent = "Finding your location...";

        navigator.geolocation.getCurrentPosition(
            showPosition,
            showError,
            { 
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 300000
            }
        );
    } else {
        message.textContent =
            "Geolocation is not supported by this browser.";
    }
}

function showPosition(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    document.getElementById("location").textContent =
        "Getting your local weather...";

    checkWeatherByLocation(lat, lon)
        .then(() => {
            document.getElementById("location").textContent = "";
            document.getElementById("hourly-title").style.display = "block";
        })
        .catch(() => {
            document.getElementById("location").textContent =
                "Something went wrong while fetching your weather.";
        });
}

function showError(error) {
    const message = document.getElementById("location");

    switch (error.code) {
        case error.PERMISSION_DENIED:
            message.textContent =
                "Location permission denied. Please allow location access.";
            break;

        case error.POSITION_UNAVAILABLE:
            message.textContent =
                "Your location is currently unavailable.";
            break;

        case error.TIMEOUT:
            message.textContent =
                "Location request timed out. Please try again.";
            break;

        default:
            message.textContent =
                "An unknown error occurred.";
    }
}


async function getForecast(lat, lon) {
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${key}`;

    const response = await fetch(forecastUrl);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Forecast request failed");
    }
    const now = Date.now();
    const next24Hours = data.list.filter(item => {
        const forecastTime = item.dt * 1000;

        return forecastTime > now &&
               forecastTime <= now + 24 * 60 * 60 * 1000;
    });

    console.log("Next 24 hours:", next24Hours);

    return next24Hours;
}

function updateTheme(data) {
    const temperature = data.main.temp;
    const isNight = data.weather[0].icon.endsWith("n");

    document.body.classList.remove("cold", "hot", "day", "night");

    if (isNight) {
        document.body.classList.add("night");
    } else if (temperature <= 5) {
        document.body.classList.add("cold");
    } else if (temperature >= 25) {
        document.body.classList.add("hot");
    } else {
        document.body.classList.add("day");
    }
}

const unitSelector = document.getElementById("units");

unitSelector.addEventListener("change", () => {
    currentUnit = unitSelector.value;

    if (lastWeatherData) {
        displayWeather(lastWeatherData);
    }

    // Re-render using the forecast data already fetched
    displayForecasts();
});


function updateFavoriteButton() {
    const isFavorite = favoriteCities.some(
        city => city.toLowerCase() === currentCityName.toLowerCase()
    );

    heartButton.textContent = "";
    heartButton.innerHTML = isFavorite ? "♥" : "♡";
    heartButton.title = isFavorite
        ? "Remove from favourites"
        : "Add to favourites";
}

heartButton.addEventListener("click", () => {
    if (!currentCityName) return;

    const existingIndex = favoriteCities.findIndex(
        city => city.toLowerCase() === currentCityName.toLowerCase()
    );

    if (existingIndex !== -1) {
        favoriteCities.splice(existingIndex, 1);
    } else {
        favoriteCities.push(currentCityName);
    }

    localStorage.setItem(
        "pilviFavorites",
        JSON.stringify(favoriteCities)
    );

    updateFavoriteButton();
    renderFavorites();
});

favoritesButton.addEventListener("click", () => {
    const isHidden = favoritesMenu.style.display === "none";
    favoritesMenu.style.display = isHidden ? "block" : "none";
    renderFavorites();
});

function renderFavorites() {
    favoritesMenu.innerHTML = "";

    if (favoriteCities.length === 0) {
        favoritesMenu.textContent = "No favourite cities yet!";
        return;
    }

    favoriteCities.forEach(city => {
        const row = document.createElement("div");
        row.className = "favorite-city";

        const cityButton = document.createElement("button");
        cityButton.textContent = city;
        cityButton.addEventListener("click", () => {
            checkWeather(city);
        });

        const removeButton = document.createElement("button");
        removeButton.textContent = "✕";
        removeButton.title = "Remove favourite";
        removeButton.addEventListener("click", () => {
            favoriteCities = favoriteCities.filter(
                savedCity => savedCity.toLowerCase() !== city.toLowerCase()
            );

            localStorage.setItem(
                "pilviFavorites",
                JSON.stringify(favoriteCities)
            );

            renderFavorites();
            updateFavoriteButton();
        });

        row.append(cityButton, removeButton);
        favoritesMenu.appendChild(row);
    });
}

renderFavorites();


async function fetchOpenWeatherForecast(lat, lon) {
    const forecastUrl =
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${key}`;

    const response = await fetch(forecastUrl);

    if (!response.ok) {
        throw new Error("Could not load OpenWeatherMap forecast");
    }

    const data = await response.json();

    // OpenWeatherMap provides forecasts in 3-hour intervals.
    return data.list.slice(0, 8).map(item => ({
        time: item.dt_txt,
        temperature: item.main.temp
    }));
}


function drawComparisonChart() {
    if (!openMeteoTemperatures || !openWeatherTemperatures) {
        return;
    }

    const times = openMeteoTemperatures.time.slice(0, 24);

    const openMeteoValues = times.map(time => {
        const index = openMeteoTemperatures.time.indexOf(time);
        return openMeteoTemperatures.temperature_2m[index];
    });

    const openWeatherValues = times.map(time => {
    const meteoTime = new Date(time).getTime();
    const forecast = openWeatherTemperatures.find(item => {
        const weatherTime = new Date(
            item.time.replace(" ", "T") + "Z"
        ).getTime();

        return Math.abs(weatherTime - meteoTime) < 60 * 60 * 1000;
    });
    return forecast ? forecast.temperature : null;
});
    const fmiValues = times.map(time => {
    if (!fmiTemperatures) return null;

    const meteoTime = new Date(time).getTime();

    const forecast = fmiTemperatures.find(item => {
        const fmiTime = new Date(item.time).getTime();

        return Math.abs(fmiTime - meteoTime) < 60 * 60 * 1000;
    });

    return forecast ? forecast.temperature : null;
    });
    const canvas = document.getElementById("comparison-chart");

    if (comparisonChart) {
        comparisonChart.destroy();
    }

    comparisonChart = new Chart(canvas, {
        type: "line",
        data: {
            labels: times.map(time => time.slice(11, 16)),
            datasets: [
                {
                    label: "Open-Meteo (°C)",
                    data: openMeteoValues,
                    borderColor: "#00b894",
                    tension: 0.3,
                    spanGaps: false
                },
                {
                    label: "OpenWeatherMap (°C)",
                    data: openWeatherValues,
                    borderColor: "#6c5ce7",
                    tension: 0.3,
                    spanGaps: false
                },
                {
                    label: "FMI (°C)",
                    data: fmiValues,
                    borderColor: "#e17055",
                    tension: 0.3,
                    spanGaps: false
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    title: {
                        display: true,
                        text: "Temperature (°C)"
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: "Time"
                    }
                }
            }
        }
    });
}
async function fetchFmiForecast(lat, lon) {
    const city = search.value.trim();

    const params = new URLSearchParams({
        service: "WFS",
        version: "2.0.0",
        request: "getFeature",
        storedquery_id:
            "fmi::forecast::harmonie::surface::point::timevaluepair",
        place: city,
        parameters: "Temperature",
        starttime: new Date().toISOString(),
        endtime: new Date(
            Date.now() + 24 * 60 * 60 * 1000
        ).toISOString(),
        timestep: "60"
    });

    const response = await fetch(
        `https://opendata.fmi.fi/wfs?${params}`
    );

    if (!response.ok) {
        throw new Error(`FMI request failed: ${response.status}`);
    }

    const xmlText = await response.text();
    const xml = new DOMParser().parseFromString(
        xmlText,
        "application/xml"
    );

    const points = xml.getElementsByTagNameNS(
        "*",
        "MeasurementTVP"
    );

    fmiTemperatures = Array.from(points).map(point => {
        return {
            time: point.getElementsByTagNameNS("*", "time")[0]
                .textContent,
            temperature: Number(
                point.getElementsByTagNameNS("*", "value")[0]
                    .textContent
            )
        };
    });

    console.log("FMI temperatures:", fmiTemperatures);

    return fmiTemperatures;
}



