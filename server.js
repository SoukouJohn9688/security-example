const fs=require('fs')
const https=require('https')
const path=require('path');
const express=require('express');
const passport=require('passport')
const cookieSession=require('cookie-session');
const {Strategy}=require('passport-google-oauth20')

const helmet=require('helmet');
const { deserialize } = require('v8');
// porque solo vamos a usar el metodo config()
require('dotenv').config();

const config={
    CLIENT_ID:process.env.CLIENT_ID,
    CLIENT_SECRET:process.env.CLIENT_SECRET,
    COOKIE_KEY_1:process.env.COOKIE_KEY_1,
    COOKIE_KEY_2:process.env.COOKIE_KEY_2
}

const AUTH_OPTIONS={
    callbackURL:'/auth/google/callback',
    clientID: config.CLIENT_ID,
    clientSecret:config.CLIENT_SECRET,
}

function verifyCallback(accessToken,refreshToken,profile,done){
    console.log('Google profile',profile);
    done(null,profile);
}
passport.use(new Strategy(AUTH_OPTIONS,verifyCallback))

//Save session to cookie
//Serilize makes reference to saving the req.user information into our custom cookie
passport.serializeUser((user,done)=>{
    done(null,user.id);
})
//Read session from cookie
passport.deserializeUser((id,done)=>{
    // User.findById(id).then(user=>{
    //     done(null,user);
    // });
    done(null,id);
})


app=express();
const PORT=3000;

app.use(helmet());

// middleware for our cookie session
app.use(cookieSession({
    name:'Session',
    maxAge:24*60*60*1000,
    keys:[config.COOKIE_KEY_1,config.COOKIE_KEY_2]
}));
app.use(passport.initialize());
//Initializes and authenticates our cookie session
// Using the respective cookie keys that we provided
// Allows the passport.deserializeUser() function to be called
//Which sets the req.user property in the requests
app.use(passport.session());

function checkLoggedIn(req,res,next){
    console.log("Current user: "+ req.user)
    const isLoggedIn=req.isAuthenticated() && req.user;
    if (!isLoggedIn){
        return res.status(401).json({
            error:'You must log in aragan!'
        })
    }
    next();
}


app.get('/auth/google',
passport.authenticate('google',{
    scope:['email'],
}))
//authentication process
app.get('/auth/google/callback',
    passport.authenticate('google',{
        failureRedirect:'/failure',
        successRedirect:'/',
        //Si no especificamos session=true, esta queda true de todas formas por defecto
        session:true,
    }),
    (req,res)=>{
    console.log('Google called us back!')
    }
);
// to logout we dont need to specify the endpoint of google
// as it is independant of any third party oAuth provider
app.get('/auth/logout',(req,res)=>{
 req.logout(); //Removes req.user and clears any logged in session
 return res.redirect('/');


})

// se puede ingresar un middle ware en emisor de eventos gracias a express
// this is how we do authorization in express
app.get('/secret',checkLoggedIn,(req,res)=>{
    return res.send('Tu secretito, ese yo lo conozco!')
})

app.get('/failure',(req,res)=>{
    return res.send('Failed to log in! hahaha')
})

app.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname,'public','index.html'));

});

https.createServer({
    key:fs.readFileSync('key.pem'),
    cert:fs.readFileSync('cert.pem')
},app).listen(PORT,()=>{
    console.log(`Listening on port: ${PORT}...`)
})