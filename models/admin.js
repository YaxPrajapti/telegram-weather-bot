const mongoose = require('mongoose'); 
const passportLocalMongoose = require('passport-local-mongoose'); 

const adminSchema = new mongoose.Schema({
    email: {
        type: String, 
        required: true,
        unique: true, 
    }
})
adminSchema.plugin(passportLocalMongoose); 
const Admin = mongoose.model('Admin', adminSchema); 
module.exports = Admin; 