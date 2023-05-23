const fs=require('fs')
const https=require('https')
const path=require('path');
const express=require('express');
const passport=require('passport')
const {Strategy}=require('passport-google-oauth20')

const helmet=require('helmet');
// porque solo vamos a usar el metodo config()
require('dotenv').config();

const config={
    CLIENT_ID:process.env.CLIENT_ID,
    CLIENT_SECRET:process.env.CLIENT_SECRET,
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

app=express();
const PORT=3000;

app.use(helmet());
app.use(passport.initialize());

function checkLoggedIn(req,res,next){
    const isLoggedIn=true;
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

app.get('/auth/google/callback',
    passport.authenticate('google',{
        failureRedirect:'/failure',
        successRedirect:'/',
        session:false,
    }),
    (req,res)=>{
    console.log('Google called us back!')
    }
);
// to logout we dont need to specify the endpoint of google
// as it is independant of any third party oAuth provider
app.get('/auth/logout',(req,res)=>{})

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