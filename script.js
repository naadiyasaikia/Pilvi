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
    

    
}
btn.addEventListener("click", () => {
    checkWeather(search.value);
});
