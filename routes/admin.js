const express = require('express'); 
const router = express.Router(); 
const Admin = require('../models/admin'); 
const passport = require('passport');

router.route('/register')
    .get((req, res) => {
        res.render('admin/register');
    })
    .post(async (req, res) => {
        try {
            const { email, username, password } = req.body;
            const admin = new Admin({ email, username });
            const registredAdmin = await Admin.register(admin, password);
            req.login(registredAdmin, (err) => {
                if(err){
                    return next(err);
                }
                req.flash('success', `welcome to weatherX ${registredAdmin.username}`); 
                res.redirect('/users'); 
            })
            req.flash('success', "welcome to weatherX ${registredAdmin.username}");
            res.redirect('/users');
        } catch (err) {
            req.flash('error', err.message);
            res.redirect('/register')
        }
    })

router.route('/login')
    .get((req, res) => {
        res.render('admin/login');
    })
    .post(passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }),async (req, res) => {
        req.flash('success', 'Welcom, Admin'); 
        res.redirect('/users');  
    })

router.route('/logout')
.get((req, res) => {
    req.logOut((err) => {
        if(err){
            return next(err); 
        }
    }); 
    req.flash('success', "See you soon, Admin"); 
    res.redirect('/login'); 
})

module.exports = router; 