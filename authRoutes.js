const router = require('express').Router()
const passport = require('passport')
const CLIENT_HOME_PAGE_URL = 'https://moretrees-client.herokuapp.com'
const CLIENT_HOME_PAGE_URL_LOCAL = 'http://localhost:3000'
const { TWITTER, getAccessToken } = require('./utils')

// when login is successful, retrieve user info
router.get('/login/success', (req, res) => {
  console.log(req,'/successs')
  if (req.user) {
    let accessToken = getAccessToken(TWITTER, req.user.twitterId)
    let userDoc = req.user._doc
    let userWithToken = { ...userDoc, accessToken }
    res.json({
      success: true,
      message: 'user has successfully authenticated',
      user: userWithToken,
      cookies: req.cookies
    });
  }
  else{
    res.status(401).json({
      success: false,
      message: 'user failed to authenticate.',
    })
  }
  
});

// when login failed, send failed msg
router.get('/login/failed', (req, res) => {
  res.status(401).json({
    success: false,
    message: 'user to authenticate failed.'
  });
});

// When logout, redirect to client
router.get('/logout', (req, res) => {
  req.logout();
  res.redirect(CLIENT_HOME_PAGE_URL_LOCAL);
});

// auth with twitter
router.get('/twitter', passport.authenticate('twitter'));

// redirect to home page after successfully login via twitter
router.get(
  '/twitter/redirect',
  passport.authenticate('twitter', {
    successRedirect: CLIENT_HOME_PAGE_URL_LOCAL,
    failureRedirect: '/auth/login/failed'
  })
);

module.exports = router;