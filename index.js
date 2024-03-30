//express is the server used to render the pages 
const express = require('express');
const moffatApp = express();
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');

moffatApp.use(flash());

// Session configuration
moffatApp.use(session({
    secret: 'y2L9EW1g5sAfsWLNFugDsND2fl38BbfUi4hxORcGnQuw', //secret phrase
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 } // For HTTPS: set secure to true
}));

//if there's a user stored in the session, their information will be accessible as a local variable in all views.
moffatApp.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

moffatApp.use(flash());

moffatApp.use(express.static(path.join(__dirname, 'public')))


//setting the view point directory to pull the web pages
moffatApp.set('view engine', 'ejs');
moffatApp.set('views', path.join(__dirname, '/views'));

//Parse URL encoded bodies (as sent by HTML Forms)
moffatApp.use(express.urlencoded({ extended: true}));
//This makes sure the data is sent back as JSON 
moffatApp.use(express.json());
moffatApp.use(cookieParser());

//Define routes
moffatApp.use('/', require('./routes/pages'));
moffatApp.use('/auth', require('./routes/auth'));

//Port number 3000 localhost:3000
moffatApp.listen(3000, ()=>{
    console.log('LISTENING ON PORT 3000')
})