const port = process.env.PORT || 3000;
require('dotenv').config();

const session = require('express-session');
const connectFlash = require('connect-flash');
const path = require('path');
const express = require('express');
const logger = require('morgan');
const cookieParser = require('cookie-parser');

const app = express();

const pool = require('./utils/database');
const { verifyToken } = require('./middleware/verifyToken');
const authRouter = require('./routes/authRouter');
const userRouter = require('./routes/userRouter');

app.set("view engine", "ejs");

app.use(session({
    name: "session",
    secret: process.env.SESSION_KEY,
    resave: true,
    saveUninitialized: true
}));
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.use(logger("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(connectFlash())


app.use('/auth', authRouter);
app.use('/user', userRouter);


app.get('/', verifyToken, async (req, res) => {
    let blogs = [];
    let categories = [];

    try {
        var client = await pool.connect();
        const result = await client.query("select * from random_lookup();");
        if (result.rowCount > 0) {
            blogs = result.rows;
        }

        const categoryResult = await client.query("select * from category_lookup();");
        if (categoryResult.rowCount > 0) {
            categories = categoryResult.rows;
        }

    } catch (error) {
        console.log(error);
    }

    client.release((err) => {
        console.log("error while closing connection", err);
    })

    console.log(categories);
    res.render("home", {
        isAuthenticated: req.user.isAuthenticated,
        randomBlogs: blogs,
        blogCategories: categories,
    });
});


app.get('/search', async (req, res) => {

    const queryText = req.query.q?.trim();
    let categoryFlag;
    if (req.query.category) {
        categoryFlag = true;
    } else {
        categoryFlag = false;
    }

    if(!queryText){
        res.status(404).render('error');
        return;
    }

    if (queryText.length != 0) {
        try {
            var client = await pool.connect();
            const result = await client.query("select * from search_blogs($1,$2);", [queryText, categoryFlag]);

            client.release((err) => {
                console.log(err);
            })
            // console.log(result.rows);
            setTimeout(() => {
                res.render('search', {
                    blogs: result.rows,
                    categoryFlag: categoryFlag,
                    query: queryText
                });
            }, 500);
            return;

        } catch (error) {
            console.log(error);
            res.render('error');
            return;
        }
    }

    res.render('search', { 
        blogs: [], 
        categoryFlag: categoryFlag,
        query: queryText
    });
})


app.get('/blogs/:id', verifyToken, async (req, res) => {
    res.locals.message = req.flash();
    let resultBlog = {};
    let isLiked = false;

    const id = Number(req.params.id);
   
    if (!id) {
        res.status(404).render('error');
        return;
    }

    try {
        var client = await pool.connect();

        if (req.user.isAuthenticated) {
            const likeResult = await client.query("select * from like_lookup($1,$2);", [
                req.user.profile.user_id,
                id,
            ]);

            isLiked = likeResult.rows[0]['is_liked'];
        }

        const result = await client.query("select * from blog_lookup($1);", [id]);
        if (result.rowCount > 0) {
            resultBlog = result.rows[0];
            // console.log(Buffer.from(resultBlog.blog_image_blob).toString().slice(0,10));
        }
        else {
            res.render('error');
            return;
        }

    } catch (error) {
        console.log(error);
    }

    client.release((err) => {
        console.log("error while closing connection", err);
    })


    res.render('blog', {
        blog: resultBlog,
        canDelete: req.user.profile?.email == resultBlog['author_email'],
        isLiked: isLiked
    });
})



app.get('/about', verifyToken, (req, res) => {
    res.render('about', { isAuthenticated: req.user.isAuthenticated });
});

app.get('/contact', verifyToken, (req, res) => {
    res.render('contact', { isAuthenticated: req.user.isAuthenticated });
});

app.use((req, res) => {
    res.status(404).render('error');
})

app.listen(port, () => {
    console.log("server listening on port 3000");
});

