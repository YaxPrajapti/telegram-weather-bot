const axios = require('axios')

const weatherEndPoint = (city, api_key) => {
    return `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=imperial&appid=${api_key}`;
}

const covertCel = (temp) => {
    return parseFloat((temp - 32)*5/9).toFixed(2);
}

const getWeatherData = async (city,api_key) => {
    try{
        const APIendPoint = weatherEndPoint(city, api_key); 
        const data = await axios.get(APIendPoint); 
        return data;
    }catch(err){
        console.log(err); 
    } 
}

module.exports = {getWeatherData, covertCel};