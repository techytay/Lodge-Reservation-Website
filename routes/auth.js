const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth');


//log in page
router.post('/login', authController.login);

//register page get request
router.post('/register', authController.register);

// Logout route
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.log(err);
            // Handle error
            res.redirect('/');
        } else {
            res.clearCookie('connect.sid', {path: '/'}); 
            res.redirect('/');
        }
    });
});



module.exports = router; 