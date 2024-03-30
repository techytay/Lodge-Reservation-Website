const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const db = require('../database');
const loggedIn = require('../controllers/loggedIn');
const logout = require('../controllers/logout');
const { body, validationResult } = require('express-validator');

//about us page get request 
router.get('/aboutus', (req,res) =>{
    res.render('aboutus')
})

//attraction page get request
router.get('/attractions', (req, res) =>{
    res.render('attractions')
})

//booking page to reserve your lodge 
router.get('/booking', (req, res) =>{
    res.render('booking')
})

// //contact us page 
// router.get('/contactus', (req,res) =>{
//     res.render('contactus');
// })

// home page
router.get('/', (req, res) =>{
    res.render('home')
})

//log in page
// router.get('/login', (req, res) =>{
//     const message = {
//         emailMessage: '',
//         passwordMessage: '',
//         alertMessage: ''
//     }
//     res.render('login', {...message})
// })

router.get('/login', (req, res) => {
    // Retrieve flash messages
    const successMessages = req.flash('successMessages');
   // Pass them to the view
    res.render('login', { successMessages });
});


// reservation page to look up reservations
router.get('/reservations', (req, res) =>{
    res.render('reservations')
})

// //register page get request
// router.get('/register', (req, res) =>{
//     res.render('register', {message:''})
// })

router.get('/register', (req, res) => {
    const messages = req.flash('errorMessages');
    res.render('register', {
        errorMessages: messages
    });
});

//summary page that displays the book dates for customer 
router.get('/reservation-summary', (req, res) =>{
    console.log(bookingDetails);
    res.render('reservation-summary')
})

//thank you page, page after user confirm booking 
router.get('/thankyou', (req, res) => {
    console.log(req.session); // Debugging
    const reservationId = req.session.reservationId;
    res.render('thankyou', { reservationId });
});

router.get('/forgot-password', (req, res) => {
    res.render('forgotPassword');
});


//------------------New updated booking-------------------------------------------------------------
router.post('/create-booking', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login'); // Ensure user is logged in
    }

    const { checkinDate, checkoutDate, roomSize, numGuests } = req.body;
    const customerId = req.session.user.id; // Assuming the user ID is stored in session

    // Convert checkin and checkout dates to Date objects for comparison
    const checkin = new Date(checkinDate);
    const checkout = new Date(checkoutDate);

    // Validate that checkout date is after checkin date
    if (checkout <= checkin) {
        return res.render('booking', { error: 'Checkout date must be after the checkin date.' });
    }

    // Adjusted pricing logic based on number of guests
    const pricePerNight = numGuests >= 1 && numGuests <= 2 ? 120.75 :
                          numGuests >= 3 && numGuests <= 5 ? 157.50 : null;

    if (!pricePerNight) {
        return res.render('booking', { error: 'Invalid number of guests.' });
    }

    // SQL query to accurately find an available room
    const findAvailableRoomQuery = `
        SELECT rd.roomdetailid FROM roomdetail rd
        INNER JOIN roomsize rs ON rd.roomsizeid = rs.roomsizeid
        WHERE rs.roomsize = ?
        AND NOT EXISTS (
            SELECT 1 FROM reservations r
            WHERE r.roomdetailid = rd.roomdetailid
            AND NOT (r.checkoutdate <= ? OR r.checkindate >= ?)
        )
        LIMIT 1;
    `;

    // Execute the query to find an available room
    db.query(findAvailableRoomQuery, [roomSize, checkin.toISOString().split('T')[0], checkout.toISOString().split('T')[0]], (error, results) => {
        if (error || results.length === 0) {
            console.error('Error finding available room:', error);
            return res.render('booking', { error: 'No available rooms for the selected criteria.' });
        }

        const roomDetailId = results[0].roomdetailid;

        // Insert reservation into the database
        const insertReservationQuery = `
            INSERT INTO reservations (roomdetailid, customerid, checkindate, checkoutdate)
            VALUES (?, ?, ?, ?);
        `;

        db.query(insertReservationQuery, [roomDetailId, customerId, checkinDate, checkoutDate], (error, result) => {
            if (error) {
                console.error('Error creating reservation:', error);
                return res.render('booking', { error: 'An error occurred while creating your reservation.' });
            }

            // Capturing the auto-generated reservationId
            const reservationId = result.insertId; // This line captures the auto-generated ID

            // Calculate total price based on the number of nights
            const diffTime = Math.abs(checkout.getTime() - checkin.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            const totalPrice = pricePerNight * diffDays;

            // Collect booking details for confirmation, including the reservationId
            const bookingDetails = {
                reservationId, 
                roomSize,
                numGuests,
                checkinDate,
                checkoutDate,
                pricePerNight,
                totalPrice,
                roomDetailId,
                customerId
            };

            // Render reservation summary page with booking details
            res.render('reservation-summary', { bookingDetails }); 
        });
    });
});

// //------------------Confirmation-reservation-------------------------------------------------------------------------------
router.post('/confirm-reservation', (req, res) => {
    console.log("Request body received:", req.body);

    // Assuming the reservationId is correctly obtained from the request body
    const { reservationId } = req.body;

    console.log(`Attempting to confirm Reservation ID: ${reservationId}`);

    // SQL query to update the reservation status
    const query = 'UPDATE reservations SET status = "Confirmed" WHERE reservationsid = ?';

    db.query(query, [reservationId], (error, results) => {
        if (error) {
            console.error('Error confirming reservation:', error);
            return res.status(500).send('Error confirming reservation');
        }
        
        console.log(`Reservation ${reservationId} confirmed.`);

        req.session.reservationId = reservationId; 
        console.log("Assigning reservation ID to session:", req.session.reservationId);

        req.session.save(() => {
            console.log("Session saved with reservation ID:", req.session.reservationId);
            res.redirect('/thankyou');
        });
    });
});

//-------------------Cancel-Reservation------------------------------------------------------------------

router.post('/cancel-reservation', (req, res) => {
    console.log("Received request body:", req.body);;
    const { reservationId } = req.body;
    if (!reservationId) {
        console.error('No reservation ID provided');
        req.flash('errorMessages', 'No reservation ID provided.');
        return res.redirect('/booking');
    }
    
    const deleteQuery = 'DELETE FROM reservations WHERE reservationsid = ?';
    db.query(deleteQuery, [reservationId], (error, results) => {
        if (error) {
            console.error('Database error during cancellation:', error);
            req.flash('errorMessages', 'Error cancelling reservation.');
            return res.redirect('/booking');
        }

        // Check if the deletion was successful, e.g., by checking affected rows
        if (results.affectedRows > 0) {
            req.flash('successMessages', 'Reservation cancelled successfully.');
            res.redirect('/booking');
        } else {
            // If no rows were affected, it means the reservationId did not match any record
            req.flash('errorMessages', 'Reservation not found.');
            res.redirect('/booking');
        }
    });
});



//------------------Reservation-Summary----------------------------------------------------------------------------------------
router.get('/reservations-summary', (req, res) => {
    console.log('Query Parameters:', req.query);
    const query = `
        SELECT 
            r.reservationsid, 
            r.checkindate, 
            r.checkoutdate, 
            rs.roomsize, 
            gc.capacityNumber AS guestCapacity, 
            rpn.roompricepernight
        FROM 
            reservations r
            INNER JOIN roomdetail rd ON r.roomdetailid = rd.roomdetailid
            INNER JOIN roomsize rs ON rd.roomsizeid = rs.roomsizeid
            INNER JOIN guestcapacity gc ON rd.guestcapacityid = gc.guestcapacityid
            INNER JOIN roompricepernight rpn ON rd.roompricepernightid = rpn.roompricepernightid;
    `;

    db.query(query, (error, results) => {
        if (error) {
            console.error('Error fetching reservation summaries:', error);
            return res.status(500).send("An error occurred fetching the reservation details.");
        }
        res.render('reservations-summary', { reservations: results });
    });
});

//---------------------------My reservations look up code-----------------------------------------------------------------------
router.get('/search', (req, res) => {
    console.log('Query Parameters:', req.query);
    const { email, reservationsid } = req.query;
    const isAuthenticated = req.session.user; // Check if user is logged in
    let baseQuery = `
    SELECT 
        r.reservationsid AS 'Reservation ID',
        r.checkindate AS 'Checkindate',
        r.checkoutdate AS 'Checkoutdate',
        CONCAT(c.firstname, ' ', c.lastname) AS 'Customer Name',
        rs.roomsize AS 'Roomsize', 
        gc.capacityNumber AS 'Guest Capacity'
       -- rp.roompricepernight AS 'Price Per Night'
    FROM 
        reservations r
    INNER JOIN customer c ON r.customerid = c.customerid
    INNER JOIN roomdetail rd ON r.roomdetailid = rd.roomdetailid
    INNER JOIN roomsize rs ON rd.roomsizeid = rs.roomsizeid
    INNER JOIN guestcapacity gc ON rd.guestcapacityid = gc.guestcapacityid
    -- INNER JOIN roompricepernight rp ON rd.roompricepernightid = rp.roompricepernightid
    `;
    let queryConditions = [];
    let queryParams = [];

    // For authenticated users, restrict the search to their own reservations
    if (isAuthenticated) {
        queryConditions.push("c.customerid = ?");
        queryParams.push(req.session.user.id);
    }

    // Apply search filters based on query parameters
    if (email) {
        queryConditions.push("c.email = ?");
        queryParams.push(email);
    } else if (reservationsid) {
        queryConditions.push("r.reservationsid = ?");
        queryParams.push(reservationsid);
    }

    // If there are any conditions to apply to the query, append them
    if (queryConditions.length > 0) {
        baseQuery += " WHERE " + queryConditions.join(" AND ");
    }

    // If there are no search criteria provided by an unauthenticated user, prompt for input
    if (!isAuthenticated && queryConditions.length === 0) {
        return res.render('reservations', { reservations: [], message: 'Please enter a search query.' });
    }

    db.query(baseQuery, queryParams, (error, results) => {
        if (error) {
            console.error('Error searching for reservation:', error);
            res.render('errorPage', { error: 'Error performing search' });// Will route to errorPage.ejs
        } else {
            res.render('reservations', { reservations: results });
        }
    });
});



//----------------Submit Reservations--------------------------------------------------------------------------------------------------
router.post('/submit-reservation', (req, res) => {
   
    if (!req.session.userId) {
        return res.status(403).send('User not logged in.');
    }

    const { reservationId } = req.body; // Extract the reservation ID from the request body

    // Query to update the reservation status
    const query = 'UPDATE reservations SET status = "Submitted" WHERE reservationsid = ?';

    db.query(query, [reservationId], (error, results) => { 
        if (error) {
            console.error('Error submitting reservation:', error);
            return res.status(500).send('Error submitting reservation');
        }
        if (results.affectedRows > 0) {
            res.send('Reservation submitted successfully');
        } else {
            res.status(404).send('Reservation not found');
        }
    });
});

//-------------------About us---------------------------------------------------------------------
router.post('/submit-contact', (req, res) => {
    const { email, comment } = req.body;

    // Validate input 
    if (!email || !comment) {
        return res.status(400).json({ error: 'Email and comment are required.' });
    }

    const customerQuery = 'SELECT customerid FROM customer WHERE email = ?';

    db.query(customerQuery, [email], (err, customerResults) => {
        if (err) {
            console.error('Error finding customer:', err);
            return res.status(500).json({ error: 'An error occurred while processing your request.' });
        }

        if (customerResults.length === 0) {
            // No customer found, instruct the frontend to redirect to the registration page
            return res.json({ redirect: 'register', message: 'Please register to leave a comment.' });
        } else {
            // Customer found, proceed to insert the comment
            const customerId = customerResults[0].customerid;
            const insertCommentQuery = 'INSERT INTO comment (customerid, comments) VALUES (?, ?)';

            // Using parameterized query for security
            db.query(insertCommentQuery, [customerId, comment], (insertErr, insertResults) => {
                if (insertErr) {
                    console.error('Error saving comment:', insertErr);
                    return res.status(500).json({ error: 'Failed to save your comment. Please try again.' });
                }
                // Comment successfully saved
                return res.json({ success: true, message: 'Your comment has been submitted successfully.' });
            });
        }
    });
});

//------------------------------forgot password--------------------------------------------------------------
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        // Check if the user exists
        db.query('SELECT * FROM customer WHERE email = ?', [email], async (err, results) => {
            if (err || results.length === 0) {
                // For security reasons, don't reveal if the email was found or not
                const acknowledge = "If an account with that email exists, we've sent a reset link to it.";
                return res.render('acknowledge', { acknowledge });
            }
            
            // Generate a reset token
            const resetToken = crypto.randomBytes(20).toString('hex');
            // Token expiration time, e.g., 1 hour from now
            const expireTime = new Date(Date.now() + 3600000); // 1 hour in milliseconds
            
            // Update user record with reset token and expiration
            const updateQuery = 'UPDATE customer SET resetToken = ?, resetTokenExpiry = ? WHERE email = ?';
            db.query(updateQuery, [resetToken, expireTime, email], (updateErr, updateResults) => {
                if (updateErr) {
                    console.error('Error saving the reset token:', updateErr);
                    const acknowledge = 'Error processing your request.';
                    return res.status(500).render('acknowledge', { acknowledge });
                }
                
                // Placeholder for sending the email
                const resetUrl = `http://moffatbay.com/reset-password/${resetToken}`;
                const message = `You are receiving this email because you (or someone else) have requested the reset of a password. Please click on the following link, or paste this into your browser to complete the process within 1 hour of receiving it: ${resetUrl}`;
                
                // Assuming sendEmail is a function you've defined to send emails
                sendEmail({
                    email: email,
                    subject: 'Password Reset Link',
                    message: message,
                });

                const acknowledge = "A password reset link has been sent to your email. Please check your email to continue the password reset process.";
                res.render('acknowledge', { acknowledge });
            });
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        const acknowledge = 'Error processing your request.';
        res.status(500).render('acknowledge', { acknowledge });
    }
});

// Example `sendEmail` function (you need to implement it based on your email service provider)
function sendEmail({ email, subject, message }) {
    // This function would use an email service like Nodemailer, SendGrid, etc., to send an email.
    console.log(`Sending email to ${email}: ${subject} - ${message}`);
    // Implement the actual send logic here.
}

module.exports = router; 

