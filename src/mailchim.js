const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fetch = require('node-fetch');

const app = express();

// Bodyparser Middleware
app.use(bodyParser.urlencoded({ extended: false }));

// Static folder


// Signup Route
app.post('/subscribe', (req, res) => {
  const {email } = req.body;
  console.log(email)


  // Construct req data
  const data = {
    members: [
      {
        email_address: email,
        status: 'subscribed',
      }
    ]
  };

  const postData = JSON.stringify(data);

  fetch('https://us6.api.mailchimp.com/3.0/lists/7ec5e98f12', {
    method: 'POST',
    headers: {
      Authorization: 'auth ada3f477a929ba8443c1ac8b8232df69'
    },
    body: postData
  })
    .then(res.statusCode === 200 ?res.send() :res.send())
    .catch(err => console.log(err))
})

const PORT = process.env.PORT || 3000;

app.listen(PORT, console.log(`Server started on ${PORT}`));