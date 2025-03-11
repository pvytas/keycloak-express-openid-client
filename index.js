'use strict';

import express from 'express';
import { Issuer, Strategy } from 'openid-client';
import passport from 'passport';
import expressSession from 'express-session';
import { engine } from 'express-handlebars';


const config = {
    keycloakBaseURL : process.env.KEYCLOAK_BASE_URL,
    keycloakClientID : process.env.KEYCLOAK_CLIENT_ID,
    appHost : process.env.APP_HOST,
    appPort : process.env.APP_PORT
};

console.log('config=', config);

const app = express();

// Register 'handelbars' extension with The Mustache Express
app.engine('hbs', engine({
    extname: 'hbs',
    defaultLayout: 'layout.hbs'
})
);
app.set('view engine', 'hbs');

console.log('calling Issuer.discover()');

const keycloakIssuer = await Issuer.discover(config.keycloakBaseURL + 'realms/keycloak-express');
// console.log('Discovered issuer %s %O', keycloakIssuer.issuer, keycloakIssuer.metadata);

const client = new keycloakIssuer.Client({
    client_id: config.keycloakClientID,
    client_secret: 'long_secret-here',
    redirect_uris: [`http://${config.appHost}:${config.appPort}/auth/callback`],
    post_logout_redirect_uris: [`http://${config.appHost}:${config.appPort}/logout/callback`],
    response_types: ['code'],
});

/*
express-session is used to manage the user session.
It directly reads and writes cookies on req/res to store the sessionID.
Session data is stored server-side.

Warning The default server-side session storage, MemoryStore, 
is purposely not designed for a production environment. 
It will leak memory under most conditions, does not scale past a single process, 
and is meant for debugging and developing.

The default name for the session cookie is 'connect.sid'.
*/

var memoryStore = new expressSession.MemoryStore();
app.use(
    expressSession({
        secret: 'another_long_secret',
        resave: false,
        saveUninitialized: true,
        store: memoryStore
    })
);

app.use(passport.initialize());
app.use(passport.authenticate('session'));

passport.use('oidc', new Strategy({ client }, (tokenSet, userinfo, done) => {
    console.log("Strategy()");
    // here is where we can get a copy of the access, refresh and ID tokens
    console.log("tokenSet = ",tokenSet);
    console.log("userinfo = ",userinfo);

    return done(null, tokenSet.claims());
})
)

passport.serializeUser(function (user, done) {
    // console.log('-----------------------------');
    console.log('serialize user');
    // console.log(user);
    // console.log('-----------------------------');
    done(null, user);
});
passport.deserializeUser(function (user, done) {
    // console.log('-----------------------------');
    console.log('deserialize user');
    // console.log(user);
    // console.log('-----------------------------');
    done(null, user);
});



// default protected route /test
app.get('/test', (req, res, next) => {
    console.log('GET /test  - calling passport.authenticate.');
    console.log('  req.rawHeaders=', req.rawHeaders);
    passport.authenticate('oidc')(req, res, next);
});

// callback always routes to test 
app.get('/auth/callback', (req, res, next) => {
    console.log('GET /auth/callback  - calling passport.authenticate.');
    passport.authenticate('oidc', {
        successRedirect: '/testauth',
        failureRedirect: '/'
    })(req, res, next);
});

// function to check weather user is authenticated, req.isAuthenticated is populated by password.js
// use this function to protect all routes
var checkAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect("/test")
}

app.get('/testauth', checkAuthenticated, (req, res) => {
    console.log('GET /testauth');
    console.log('  user=', req.user);
    console.log('  req.session=', req.session);

    res.render('test', {username: req.user.name});
});

app.get('/other', checkAuthenticated, (req, res) => {
    console.log('GET /other');
    console.log('  user=', req.user);
    res.render('other', {username: req.user.name});
}); 

//unprotected route
app.get('/', function (req, res) {
    console.log('GET /');
    console.log('  user=', req.user);
    if (req.user) {
        res.render('index', {username: req.user.name});
    } else {
        res.render('index', {username: "<no user>"});
    }
});

// start logout request
app.get('/logout', (req, res) => {
    res.redirect(client.endSessionUrl());
});

// logout callback
app.get('/logout/callback', (req, res) => {
    // clears the persisted user from the local storage
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
    
});

app.listen(config.appPort, function () {
    console.log(`Listening at http://${config.appHost}:${config.appPort}`);
});

