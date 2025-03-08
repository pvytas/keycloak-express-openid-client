
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

After starting keycloak, point your browser to `https://172.208.26.77:8443/` (replace IP address with your server's address).
This is using a self-signed certificate, so your browser will likely display a warning about this.
Login as `admin` / `admin` (replace with your own admin userid / password)

# 
## Install

```bash
npm install
npm start
```



## Setup Keycloak
Login as admin in keycloak.

Create a Realm and give it an name and create it. I am using keycloak-express for my realm name
![Create realm](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/e0erj948wmmrbng0v14l.gif)

The create a Client using openid-connect in the Realm
![Create a client](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/wctbp51o639k3hgu16q0.gif)

Set the Valid Redirect URIs and select save, 
![set valid redirect URIs](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/07crr8q4tmtovxodehgq.gif)

>**NOTE**:you can specify specific routes here but I am using a wild card(not recommend best practice)

Create a user its documented [here](https://www.keycloak.org/docs/latest/server_admin/index.html#proc-creating-user_server_administration_guide) so I won't go into it.

That's it for Keycloak setup 

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
