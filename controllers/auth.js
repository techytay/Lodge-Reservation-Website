// Require necessary npm packages
const jwt = require('jsonwebtoken'); // Used for creating JWT tokens for authentication
const bcrypt = require('bcryptjs'); // Used for hashing passwords
const { body, validationResult } = require('express-validator'); // Used for validating and sanitizing input
const crypto = require('crypto');
//npm install express bcrypt mysql express-validator
//npm install -g npm
//npm install connect-flash
const flash = require('connect-flash');

// Database connection setup
const db = require('../database'); // Import the database configuration
db.connect( (err) => { // Connect to the database
    if(err){
        console.log(err) // Log any connection errors
    } 
});

//------------------New register Code------------------------------------------------------------------------------------------------------------------------------//
//--This registration code is to enhance the security feature of the user registration form. Checking the password complexity entry and duplicate data at the DB.--//
//-----------------------------------------------------------------------------------------------------------------------------------------------------------------//
exports.register = [
  // Validation rules
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required.'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required.'),
  body('phone').trim().isLength({ min: 1 }).withMessage('Phone number is required.'),
  body('email').isEmail().normalizeEmail({
       gmail_remove_dots: false,
  })
  .withMessage('Invalid email address.'),
  
  body('password').isStrongPassword().withMessage('Password does not meet the criteria.'),
  body('passwordConfirmation').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),

  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('errorMessages', errors.array().map(error => error.msg));
      return res.redirect('/register');
    }

    const { firstName, lastName, phone, email, password } = req.body;

    db.query('SELECT * FROM customer WHERE email = ? OR telephone = ?', [email, phone], (err, users) => {
      if (err) {
        console.error(err);
        req.flash('errorMessages', ['An error occurred during the registration process. Please try again.']);
        return res.redirect('/register');
      }

      if (users.length > 0) {
        const duplicateField = users.some(user => user.email === email) ? 'Email' : 'Phone number';
        req.flash('errorMessages', [`${duplicateField} is already in use`]);
        return res.redirect('/register');
      }

      // Proceed with hashing the password and creating the user
      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
          console.error(err);
          req.flash('errorMessages', ['An error occurred during password hashing. Please try again.']);
          return res.redirect('/register');
        }

        db.query('INSERT INTO customer (firstname, lastname, telephone, email, password) VALUES (?, ?, ?, ?, ?)', [firstName, lastName, phone, email, hashedPassword], (err) => {
          if (err) {
            console.error(err);
            req.flash('errorMessages', ['An error occurred during user registration. Please try again.']);
            return res.redirect('/register');
          }

          req.flash('successMessages', 'Registration successful. Please login.');
          res.redirect('/login');
        });
      });
    });
  }
];

//------------------------------------------------------------------------------------------------------------------------- 
//------------------Original Code---------------------------------------------------
//exports the register request body to the auth routes
// exports.register = (req,res) =>{
    ////long way of doing it 
    //// const firstName = req.body.firstName;
    ////const lastName = req.body.lastName;
    //// const email = req.body.email;
    //// const password = req.body.password;
    //// easier way to destruct from the body
//     const {firstName, lastName, phone, email, password } = req.body;


//     db.query('SELECT email FROM customer WHERE email = ?', [email], async (err, results) =>{
//         if(err){
//             console.log(err);
//         }

//         if(results.length > 0){
//            return res.render('register', {message:'That email is already in use'}) 
//         };

//         let hashedPassword = await bcrypt.hash(password, 8);
//         console.log(hashedPassword);

//         db.query('INSERT INTO customer SET ?', {firstname: firstName, lastname: lastName, telephone: phone, email: email, password: hashedPassword}, (err, results) =>{
//             if(err){
//                 console.log(err);
//             } else {
//                 return res.render('login', {message: 'Register Successful Please Login'});
//             }
//         });
//     });
// }
//-----------------------------------------------------------------------------------------------------------------------------------------
// exports.login = (req,res) =>{
    
//     //destruct the email and password from the req.body
//     const {email, password} = req.body;

//     db.query('SELECT * FROM customer WHERE email = ?', [email], async (err, results) =>{


//         if (err) {
//                 res.send('email not found');
//         }
//         else if(results.length==0){
//                res.render('login', {emailMessage: 'email not found'});
//         }
//         else{
//             //setting the results to a customer variable 
//             var customer = results[0]

//             //comparing the hashed password and the password entered in the req.body
//             bcrypt.compare(password, customer.password, (err, match) =>{
//                 if(err){
//                     res.render('login', {passwordMessage: 'Incorrect password'})
//                 } else {
//                     //setting the token for the session and the id is the customer id in the database 
//                     const token = jwt.sign({id: results[0].customerid}, process.env.JWT_SECRET, {
//                         expiresIn: process.env.JWT_EXPIRES,
//                     })
//                     //setting the cookie using the date function to change from mili seconds to days  math break down 24hr/60m/60sec/1000ms
//                     const cookieOptions = {
//                         //maxAge is use to set the cookies timeline 
//                         expiresIn: { maxAge : process.env.COOKIE_EXPIRES * 24 * 60 * 60 * 1000}
//                         //httpOnly means this will work in a http browser environment 

//                     }
//                     res.cookie("userRegistered", token, cookieOptions)
//                     res.render('login')
//                 }
//             });
//         }
               
//     });
    
// }
//----------------------------------------------------------------------------------------------------------------------------------------------

// Login functionality
exports.login = (req, res) => { // Extract login credentials
    const { email, password } = req.body;
    console.log(email, password);
    // Query database for user by email
    db.query('SELECT * FROM customer WHERE email = ?', [email], async (err, results) => {
        if (err) {
            // Handle database errors
            console.log(err);
            return res.render('errorPage', { error: 'An error occurred' });//Redirect to error page
            // return res.send('An error occurred');
        } else if (results.length == 0) {
            // Email not found
            return res.render('login', { emailMessage: 'Email not found' });
        } else {
            // Email found, proceed to check password
            var customer = results[0];

            bcrypt.compare(password, customer.password, (err, match) => {
                if (err) {
                    // Handle bcrypt errors
                    console.log(err);
                    return res.render('login', { passwordMessage: 'An error occurred' });
                } else if (match) {
                    // Password match, login successful                    
                    req.session.user = {
                        id: customer.customerid,
                        email: customer.email,
                        name: customer.firstname 
                    };
                    // Redirect to booking page after successful login
                    return res.redirect('/booking');
                } else {
                    // Password does not match
                    return res.render('login', { passwordMessage: 'Incorrect password' });
                }
            });
        }
    });
};

// db.close();