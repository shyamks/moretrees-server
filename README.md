## Moretrees Server

Server for the [web client](https://github.com/shyamks/moretrees-client).

### Set up env 

Will need to install mongo and start the service. You can use [Robo 3T](https://robomongo.org/) to visualise the data.
Create .env.development file at the root of the directory.

```
MONGODB_URL=mongodb://localhost:27017/graphql-server
FRONTEND_URL=http://localhost:<port of frontend server>

RAZORPAY_KEY=<rzp_test_key>
RAZORPAY_SECRET=<rzp_test_secret>
JWT_SECRET=<some secret string>

MAILER_USERNAME=<mailer_username>
MAILER_PASSWORD=<mailer_password>
MAILER_HOST=<mailer-host>
MAILER_PORT=<mailer-port>
```

Mongo runs on 27017 port by default. graphql-server is the name of the db.
MAILER_* env variables are required for reset password only.


##### Install dependencies
```
npm install
```

##### Dev mode
```
npm run dev
```
