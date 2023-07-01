const express = require('express'); 
const User = require('../models/user'); 
const router = express.Router(); 

router.route('/')
    .get(async (req, res) => {
        try {
            if(!req.isAuthenticated()){
                req.flash('error', 'You must be signed in.'); 
                return res.redirect('/login'); 
            }
            const users = await User.find({});
            res.render('users/userlist', { users, path: "/users" })
        } catch (error) {
            console.log(error);
        }
    })

router.route('/:id')
    .delete(async (req, res) => {
        try {
            const {id} = req.params; 
        await User.findOneAndDelete({userId : id});
        console.log("User deleted successfully");
        res.redirect('/users');
        } catch (error) {
            console.log(error)
        }  
    })
    .put(async (req, res) => {
        try {
            const {id} = req.params; 
        const user = await User.findOne({userId: id}); 
        if(user.isBlocked){
            user.isBlocked = false; 
        }else{
            user.isBlocked = true;   
        }
        await user.save(); 
        req.flash("User blocked is toggled."); 
        res.redirect('/users');
        } catch (error) {
            console.log(error);
        } 
    })

router.route('/subscribers/:id')
    .put(async (req, res) => {
        try {
            const { id } = req.params;
            const subscriber = await User.findOne({ userId: id, isSubscribed: true });
            if (!subscriber) {
                return res.send("User not found");
            }
            subscriber.isSubscribed = false;
            while (subscriber.subscribedCity.length) {
                subscriber.subscribedCity.pop();
            }
            await subscriber.save();
            res.redirect('/users');
        } catch (err) {
            console.log(err);
        }
    })

router.route('/subscribers')
.get(async (req, res) => {
    try {
        if(!req.isAuthenticated()){
            req.flash('error', 'You must be signed in.'); 
            return res.redirect('/login'); 
        }
        const subscribers = await User.find({isSubscribed: true}); 
        res.render('users/subscribersList', {subscribers, path: "/users/subscribers"});
    } catch (error) {
        console.log(error); 
    }  
});







module.exports = router; 