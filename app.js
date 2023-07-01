// if(process.env.NODE_ENV !== "production"){
//     const dotenv = require('dotenv'); 
//     dotenv.config(); 
// }
const dotenv = require('dotenv'); 
dotenv.config();
const express = require('express'); 
const cron = require('node-cron'); 
const path = require('path');
const methodOverride = require('method-override'); 
const session = require('express-session'); 
const passport = require('passport'); 
const flash = require('connect-flash');
const ejsMate = require('ejs-mate');
const mongoSentize = require('express-mongo-sanitize'); 
const LocalStrategy = require('passport-local'); 
const mongoStore = require('connect-mongo')
const mongoose = require('mongoose'); 
// const mongo_url = process.env.MONGO_URI;
const mongo_url = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/Bot"; 
mongoose.connect(mongo_url)
    .then( () => {
        console.log('Connected to database ')
    })
    .catch( (err) => {
        console.error(`Error connecting to the database. \n${err}`);
    })

const User = require('./models/user'); 
const Weather = require('./utils/weatherdata'); 
const createBot = require('./utils/botConfig');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin'); 
const Admin = require('./models/admin');
const ExpressError = require('./utils/ExpressError'); 
// const sendWeatherUpdate = require('./utils/botConfig'); 

const bot = createBot(process.env.TOKEN); 
// const bot = new Telegraf(process.env.TOKEN);
const api_key = process.env.API_KEY; 
const PORT = process.env.PORT; 
 

const printData = async (chatId, data) => {
    const {main, visibility, wind, name} = data;
    return await bot.telegram.sendMessage(chatId ,`city: ${name}\ntemp: ${main.temp}\nhumidity: ${main.humidity}\nmax temp: ${main.temp_max}\nmin temp: ${main.temp_min}\nvisibility: ${visibility}\nwind speed: ${wind.speed}\nwind degree: ${wind.deg}`); 
}

//sends update msg to subscribers: 
const sendupdates = async (api_key) => {
  const users = await User.find({});
  const subscribedUser = users.filter((user) => user.isSubscribed);
  subscribedUser.forEach((user) => {
    if (!subscribedUser.isBlocked) {
      const subscribedCities = user.subscribedCity;
      subscribedCities.forEach(async (city) => {
        const data = await Weather.getWeatherData(city, api_key);
        printData(user.userId, data.data);
      });
    }
  });
};

console.log('started messages for all subscribers');
cron.schedule('00 00 0-23 * * *', () => {
    sendupdates(api_key);
}); 


const app = express(); 
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
const store = new mongoStore({
    mongoUrl: mongo_url, 
    touchAfter: 24 * 3600, 
    secret: process.env.SECRET, 
})
store.on("error", (err) => {
    console.log("Session error: ", e.message);
})
app.use(session({
    name: 'weatheX', 
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    store: store, 
    cookie: {
        httpOnly: true, 
        // secure: true, 
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, 
        maxAge: 1000 * 60 * 60 * 24 * 7,
    }
})); 
app.use(flash()); 
app.use(mongoSentize());
app.use(passport.initialize());
app.use(passport.session()); 
passport.use(new LocalStrategy(Admin.authenticate())); 

passport.serializeUser(Admin.serializeUser()); 
passport.deserializeUser(Admin.deserializeUser()); 

app.use((req, res, next) => {
    res.locals.currentUser = req.user;  
    res.locals.success = req.flash('success'); 
    res.locals.error = req.flash('error'); 
    next(); 
});

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use('/users', userRoutes); 
app.use('/', adminRoutes);

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('error', { err })
}); 



app.listen(PORT, () => {
    console.log(`server started on port: ${PORT}`); 
}); 

bot.start(async (ctx) => {
    try {
        const userId = ctx.from.id;
        const username = ctx.from.first_name + " " + ctx.from.last_name;
        const user = await User.findOne({userId: userId}); 
        if(!user){
            const newUser = new User({name: username, userId: userId}); 
            await newUser.save(); 
            console.log("User saved in database");
        }else{
            if(user.isBlocked){
                return ctx.reply("You are blocked from our services. Please contact owner"); 
            }
        }
        ctx.reply('Welcome to weatheX \n click /help to learn about available commands');
    } catch (err) {
        console.error(err);
    }
}); 

bot.command('subscribe', async (ctx) => {
    try {
        const userId = ctx.from.id;
        const city = ctx.message.text.split(" ")[1]; 
        const user = await User.findOne({userId: userId}); 
        if(user.isBlocked){
            return ctx.reply("You are blocked from our seviece. \n contact the owner"); 
        }
        if(city == undefined){
            return ctx.reply("Please provide city name")
        }
        user.isSubscribed = true; 
        user.subscribedCity.push(city); 
        await user.save(); 
        ctx.reply(`You are now subscribed for ${city}`);
    } catch (err) {
        console.error(err);
    }
})

bot.command('unsubscribe',async (ctx) => {
    try{
        const userId = ctx.from.id; 
        const user = await User.findOne({userId: userId});
        while(user.subscribedCity.length){
            user.subscribedCity.pop(); 
        }
        user.isSubscribed = false; 
        await user.save(); 
        ctx.reply("You are now unsubscribed.");
    }catch(err){
        console.error(err); 
    }
})

bot.command('weather',async (ctx) => {
    try{
        const userId = ctx.from.id; 
        const user = await User.findOne({userId: userId}); 
        if(user.isBlocked){
            return ctx.reply("You are blocked from our seviece. \n contact the owner"); 
        }
        const city = ctx.message.text.split(" ")[1]; 
        const weatherdata = await Weather.getWeatherData(city, api_key);
        const data = weatherdata.data; 
        printData(userId, data);  
        // console.log(city, country, main, description, tempreture, humidity, visibility, wind);                    
    }catch(err){
        ctx.reply(`Unable to fetch weather data.`)
    }

})

bot.command('help', (ctx) => {
    ctx.reply('The Bot Commands are as follows:\n\n/subscribe - Subscribe to bot\n/weather cityName - Get the current weather data\n/unsubscribe - Unsubscribe from bot');
});

bot.launch(); 

bot.catch(err => {
    console.log(err);
})

module.exports = bot; 