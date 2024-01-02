const express = require('express');
const pool = require('../utils/database');
const { verifyToken } = require('../middleware/verifyToken');
const router = express.Router();

// verify authentication token
router.use(verifyToken);
router.use((req, res, next) => {

    // get flash messages if any
    res.locals.message = req.flash();

    // if user not authenticated redirect to login route
    if (!req.user.isAuthenticated) {
        res.redirect('/auth/login');
    }
    else {
        next();
    }
})


router.get('/bloglist', async (req, res) => {
    let blogs = [];

    try {
        var client = await pool.connect();
        const result = await client.query("select * from bloglist_lookup($1);", [req.user.profile.email]);

        if (result.rowCount > 0) {
            blogs = result.rows;
        }

    } catch (error) {
        console.log(error);
    }

    client.release((err) => {
        err ? console.log(err) : null;
    })

    res.status(200).render('bloglist', {
        isAuthenticated: req.user.isAuthenticated,
        blogs: blogs
    });

})

router.get('/create', (req, res) => {

    res.status(200).render('create', {
        isAuthenticated: req.user.isAuthenticated
    });
})

router.post('/create', async (req, res) => {
    const date = new Date();

    const day = date.getDate();
    const month = date.getUTCMonth() + 1;
    const year = date.getFullYear()

    // generate date string for insertion
    const dateString = `${year}-${month}-${day}`;

    const formData = req.body;
    const dataToInsert = [
        req.user.profile.email,
        formData['blog-body'],
        formData['blog-title'],
        formData['blog-subtitle'],
        formData['blog-category'],
        formData['blog-image'],
        dateString
    ];

    try {
        var client = await pool.connect();
        const result = await client.query("select * from insert_blog($1,$2,$3,$4,$5,$6,$7);", dataToInsert);

        // query returns blog_id of inserted blog
        // check if blog_id is received
        if (result.rowCount > 0) {
            req.flash('response', "Published Successfully");
        }
        else {
            req.flash('response', "Could not publish blog");
        }

    } catch (error) {
        req.flash('response', 'Something went wrong!');
        console.log(error);
    }


    client.release((err) => {
        err ? console.log(err) : null;
    })
    res.redirect('/user/create');

})

router.patch('/like/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        var client =  await pool.connect();
        const result = await client.query("select * from toggle_like($1,$2);",[
            req.user.profile.user_id,
            id
        ])
        
        res.status(404).json(result.rows[0]);
        return;


    } catch (error) {
        console.log(error);
    }

    client.release((err) =>{
        console.log(err);
    })

    res.status(404).json("wrong request");
    

});

router.post('/delete/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        var client = await pool.connect();
        const result = await client.query("select * from delete_blog($1,$2);", [
            id,
            req.user.profile?.email
        ]);

        if (result.rowCount > 0) {
            // delete success
            // redirect to user bloglist
            setTimeout(() => {
                res.redirect('/user/bloglist');
            }, 1000);
            return;
        }
        else {
            // 404 not found
            console.log("hereeeee");
            res.render('error');
            return;
        }

    } catch (error) {
        console.log("here");
        console.log(error);

    }

    client.release((err) => {
        err ? console.log(err) : null;
    })

    // something went wrong with query
    req.flash('response', "Could not process request. Please try again after some time");
    setTimeout(() => {
        res.redirect(`/blogs/${req.params.id}`);
    }, 1000);

})


router.get('/profile', (req, res) => {
    res.status(200).render('profile',
        {
            isAuthenticated: req.user.isAuthenticated,
            profile: req.user.profile
        });
})


router.get('/logout', (req, res) => {

    req.session.destroy((err) => {
        if (err) {
            console.log('err -> ', err);
        }
        else {
            // clear session cookie
            res.clearCookie('session', { httpOnly: true });

            // clear token on log out
            res.clearCookie('token', { httpOnly: true });
            console.log("here");
            setTimeout(() => {
                res.redirect('/');
            }, 1500);
        }
    });
})


module.exports = router;