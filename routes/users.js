const express = require('express'); 
const User = require('../models/user'); 
const router = express.Router(); 

router.route('/')
    .get(async (req, res) => {
        if(!req.isAuthenticated()){
            req.flash('error', 'You must be signed in.'); 
            return res.redirect('/login'); 
        }
        const users = await User.find({});
        res.render('users/userlist', { users })
    })

router.route('/:id')
    .delete(async (req, res) => {
        const {id} = req.params; 
        await User.findOneAndDelete({userId : id});
        console.log("User deleted successfully");
        res.redirect('/users');  
    })

router.route('/subscribers/:id')
    .delete(async (req, res) => {
        try {
            const { id } = req.params;
            const subscriber = await User.findOne({ userId: id, isSubscribed: true });
            if (!subscriber) {
                return res.send("User not found");
            }
            console.log(subscriber.subscribedCity.length)
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
    const subscribers = await User.find({isSubscribed: true}); 
    res.render('users/subscribersList', {subscribers});  
});







module.exports = router; 