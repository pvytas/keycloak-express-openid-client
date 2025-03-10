
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
  
# Start Keycloak
The folder `keycloak-https` contains a script and a docker-compose file for starting keycloak in a docker container in HTTPS mode with a self-signed certificate.
It is possible to run keycloak in plain HTTP mode, but it requires that the web browser run on localhost.
I was running this setup in an Azure VM and wanted to use the browser on my laptop, so I stuck with the HTTPS version for now.
The `start.sh` and `stop.sh` scripts can be used to start and stop the keycloak server and internally invoke `docker-compose.yml`.
The `keycloak_data` folder is used to persist that state of keycloak so the settings don't disappear after `stop.sh`

```
cd keycloak-https
./start.sh
```

The initial admin user and password is defined in the `docker-compose.yml` file and can be changed by editing this file.

# Setup Keycloak
Point your browser to `https://<host-ip-address>:8443/`.
This is using a self-signed certificate, so your browser will likely display a warning about this.
Login as `admin` (using the admin userid / password you defined in the docker-compose file)

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

# Run one demo instance
Edit the `start-3000.sh` file to set the IP address in the Keycloak base URL and the IP address for the server that will be running the demo web app. 
Start one instance of the demo web app
```
./start-3000.sh
```
Then open a browser to `http://<host-ip-address>:3000/`. It will display a web page with a title bar displaying "Keycloak-Express : user=\<no user\>" and the body displaying "Welcome to Keycloak-Express".

Click the 'Test' button in the upper right hand corner and this will redirect the browser to the Keycloak login page. Log in with the user credentials that you created in the "Setup Keycloak" section and the browser will redirect to our web app page "Welcome to Keycloak-Express Demo" and the title bar displays your username.

Now open a browser tab to the Keycloak URL `https://<host-ip-address>:8443/` and login as admin. Then select the "keycloak-express" realm and click on "Sessions" in the sidebar. This will list all the users that are currently logged in to this realm.

# Run a second demo instance


## Views and login flow

![login flow](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/auslqsikfxvsfvkp1lz4.gif)
