const key = "3ff8e72a637d774bf6b4629ae1966b5d";
const url = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";
const search = document.querySelector(".search input");
const btn = document.querySelector(".search button");
const icon = document.querySelector(".weather-icon");

async function checkWeather(city) {
    const response = await fetch(url + city + `&appid=${key}`);

    if (response.status == 404) {
        document.querySelector(".error").style.display = "block";
        document.querySelector(".weather").style.display = "none";
    } else {
        var data = await response.json();
        displayWeather(data);
        
    }
}



function displayWeather(data) {
    const condition = data.weather[0].main;

    document.querySelector(".city").innerHTML = data.name;
    document.querySelector(".temp").innerHTML = Math.round(data.main.temp) + "°C";
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