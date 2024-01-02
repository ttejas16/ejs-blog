const bcrypt = require('bcryptjs');
const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../utils/database');
const { verifyToken } = require('../middleware/verifyToken');
const router = express.Router();

router.use(verifyToken);
router.use((req, res, next) => {
    res.locals.messages = req.flash();
    if (req.user.isAuthenticated) {
        res.redirect('/');
    }
    else {
        next();
    }
})

router.get('/login', (req, res) => {
    res.render('login', { isAuthenticated: req.user.isAuthenticated });
})

router.post('/login', async (req, res) => {

    const email = req.body.email;
    const password = req.body.password;


    try {
        var client = await pool.connect();
        const result = await client.query("select * from user_lookup($1)", [email]);

        if (result.rowCount > 0 && bcrypt.compareSync(password, result.rows[0].hash)) {
            // log the user in
            // generate token

            const dataToBeEncoded = {
                email: email,
                user_id: result.rows[0].user_id
            }
            const token = jwt.sign(dataToBeEncoded, process.env.SECRET_KEY);
            res.cookie('token', token, { httpOnly: true });

            setTimeout(() => {
                res.redirect('/');
            }, 1500);
            return;

        }
        else {
            req.flash('response', "Invalid Credentials!");
            res.redirect('login');
            return;
        }

    } catch (error) {
        console.log(error);
    }

    client.release((err) => {
        console.log(err);
    })

    req.flash('response', "Internal Server Error");
    res.redirect('login');
})



router.get('/signup', (req, res) => {
    res.render('signup', { isAuthenticated: req.user.isAuthenticated });
})

router.post('/signup', async (req, res) => {

    const email = req.body.email;
    const password = req.body.password;


    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    // console.log(hash.length);

    try {
        var client = await pool.connect();
        const result = await client.query("select * from insert_user($1,$2)", [email, hash]);

        if (result.rowCount > 0) {
            // signed up the user
            // generate new token

            const dataToBeEncoded = {
                email: email,
                user_id: result.rows[0].user_id
            }
            const token = jwt.sign(dataToBeEncoded, process.env.SECRET_KEY);
            res.cookie('token', token, { httpOnly: true, maxAge: 1000 * 60 * 2 });

            setTimeout(() => {
                res.redirect('/');
            }, 1500);
            return;

        }
        else {
            req.flash('response', "Internal Server Error");
            console.log("error occured while signing up");
        }
    } catch (error) {
        req.flash('response', "Email Already Registered");
        console.log(error);
    }

    client.release((err) => {
        console.log(err);
    })

    res.redirect('/auth/signup');


})


module.exports = router;