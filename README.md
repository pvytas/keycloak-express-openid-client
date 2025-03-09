
# Keycloak Express openid-client

This project was created for learning about using Open ID Connect with Keycloak with a node.js application. 
It is based on the code from https://github.com/austincunningham/keycloak-express-openid-client .

>**NOTE:** Keycloak is [deprecating](https://www.keycloak.org/2022/02/adapter-d**eprecation) their client adapters (keycloak-connect) for Node and recommending openid-client as a replacement.
>

# Overview
This project contains a simple one file node.js web application that uses Keycloak authentications via OIDC.
There are scripts to start two instances of this application to demonstrate SSO behaviour.
Each instance listens on a separate HTTP port and is registered as a separate Client in Keycloak. 

# Prerequisites
- node v16 or later. Used node v22.14.0 in my own testing.
- npm v8 or later. Used v10.9.2 in my own testing.
- docker. Used v28.0.1 in my own testing.
- docker compose command will download keycloack
- open INBOUND port 8443 for the Keycloak UI
- open INBOUND ports 3000 and 3001 for the two web apps 

# Find your public IP address (or DNS name)
The simplest approach is to run the Keycloak server and both web applications on the same server or VM.
You will need to find the public IP of your server to register the web applications, and also for the applications to connect to Keycloak.
  
# Start and setup Keycloak
The folder `keycloak-https` contains a docker script for starting keycloak in HTTPS mode with a self-signed certificate.
It is possible to run keycloak in plain HTTP mode, but it requires that the web browser run on localhost.
I was running this setup in an Azure VM and wanted to use the browser on my laptop, so I stuck with the HTTPS version for now.
The `start.sh` and `stop.sh` scripts can be used to start and stop the keycloak server and internally invoke `docker-compose.yml`.
The `keycloak_data` folder is used to persist that state of keycloak so the settings don't disappear after `stop.sh`

```
cd keycloak-https
./start.sh
```

The initial admin user and password is defined in the `docker-compose.yml` file and can be changed by editing this file.

## Setup Keycloak
Point your browser to `https://<host-ip-address>:8443/`.
This is using a self-signed certificate, so your browser will likely display a warning about this.
Login as `admin` / `admin` (replace with your own admin userid / password)

Create a keycloak realm
* click on the "Select realm" drop down menu in the upper left hand corner of the Keycloak and press the "Add realm" button. Enter the realm name "keycloak-express". This is the default realm in the node.js web app configuration. 

Create a Client using openid-connect
* make sure that the realm "keycloak-express" is selected then in the sidebar click on "Clients" to see a list of clients then press the "Create client" button.
* for the "General settings" select the client type "OpenID Connect" and Client ID "keycloak-express" and Name "keycloak-express"
* set the "Valid Redirect URI" to "http://<host-ip-address>:3000/*" (our demo app is configured for port 3000). For simplicity we are using a wild card for the route (not a recommended practice).
* leave the other parameters with their default value. The keycloak Authentication flow "Standard flow" corresponds to the OIDC 'Authorization Code Flow'.
* create another client named "keycloak-express-3001" using the "Valid Redirect URI" set to "http://<host-ip-address>:3001/*". This is for running the second instance of our demo app.

Create a user 
* while in the realm "keycloak-express", click on the "Users" item in the sidebar.
* click the button "Add user", enter the details for the new user then click the "Save" button. After saving the details, the Management page for the new user is displayed.

## Setup Openid-client with Passport in Express

We are going to use this [openid-client](https://www.npmjs.com/package/openid-client) and [passport](https://www.npmjs.com/package/passport) to connect to keycloak.

From the Realm we need the openid-configuration can be got an endpoint 
```
/realms/{realm-name}/.well-known/openid-configuration
```
So in my case the realm name is keycloak-express so the url will be http://localhost:8080/realms/keycloak-express/.well-known/openid-configuration the output is as follows
![.well-known url output](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ruaxgvsvycdhubwhm7b1.png) 
All we need for is the `issuer:"http://localhost:8080/realms/keycloak-express"` url to connect openid-client to keycloak as follows

```js
'use strict';

import express from 'express';
import { Issuer, Strategy } from 'openid-client';
import passport from 'passport';
import expressSession from 'express-session';

const app = express();

// use the issuer url here
const keycloakIssuer = await Issuer.discover('http://localhost:8080/realms/keycloak-express');


// client_id and client_secret can be what ever you want
// may be worth setting them up as env vars 
const client = new keycloakIssuer.Client({
    client_id: 'keycloak-express',
    client_secret: 'long_secret-here',
    redirect_uris: ['http://localhost:3000/auth/callback'],
    post_logout_redirect_uris: ['http://localhost:3000/logout/callback'],
    response_types: ['code'],
  });
```

## Views and login flow

![login flow](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/auslqsikfxvsfvkp1lz4.gif)
