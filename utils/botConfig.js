const { Telegraf } = require('telegraf');
const bot = require('../app'); 

const createBot = (api_key) => {
    const bot = new Telegraf(api_key);
    return bot; 
}

module.exports = createBot;