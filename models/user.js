const mongoose = require('mongoose'); 

const userSchema = new mongoose.Schema({
    name: {
        type: String, 
    },
    userId: {
        type: Number, 
    }, 
    time: {
        type: Date, 
        default: Date.now
    },
    isSubscribed: {
        type: Boolean,
        default: false, 
    },
    isBlocked: {
        type: Boolean, 
        default: false, 
    }, 
    subscribedCity: [
        {
            type: String, 
        }
    ]
});

const User = mongoose.model('User', userSchema); 
module.exports = User; 