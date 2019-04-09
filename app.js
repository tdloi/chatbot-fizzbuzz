/**
 * Copyright 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * Starter Project for Messenger Platform Quick Start Tutorial
 *
 * Use this project as the starting point for following the 
 * Messenger Platform quick start tutorial.
 *
 * https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start/
 *
 */

'use strict';

// Imports dependencies and set up http server
const 
  request = require('request'),
  express = require('express'),
  body_parser = require('body-parser'),
  app = express().use(body_parser.json()), // creates express http server
  PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;


// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Accepts POST requests at /webhook endpoint
app.post('/webhook', (req, res) => {  

  // Parse the request body from the POST
  let body = req.body;

  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

      // Get the webhook event. entry.messaging is an array, but 
      // will only ever contain one event, so we get index 0
      let webhookEvent = entry.messaging[0];

      // Get the sender PSID
      let senderPSID = webhookEvent.sender.id;
      
      // Skip page response
      if (process.env.PAGE_PSID === senderPSID) return;

      console.log('Webhook Event: ' + JSON.stringify(webhookEvent));
      console.log('Sender PSID: ' + senderPSID);

      if (webhookEvent.message) {
        handleMessage(senderPSID, webhookEvent.message);        
      }
    });

    // Return a '200 OK' response to all events
    res.status(200).send('EVENT_RECEIVED');

  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

function handleMessage(senderPSID, receivedMessage) {

  let response = {
    "text": undefined,
  }

  // Check if the message contains text
  if (receivedMessage.text) {    
    const message = receivedMessage.text;
    if (message === 'Hi') {
      response.text = 'Hi, how can I help you ?';
    }

    const numberReceivedFromMessage = Number(message);
    // FizzBuzz message
    if (Number.isInteger(numberReceivedFromMessage)) {
      if (numberReceivedFromMessage % 3 === 0 && numberReceivedFromMessage % 5 === 0) {
        response.text = 'Hello Kitty';
      }
      else if (numberReceivedFromMessage % 3 === 0) {
        response.text = 'Hello';
      }
      else if (numberReceivedFromMessage % 5 === 0) {
        response.text = 'Beautiful';
      }
    }
  }  
  
  // Sends the response message only when the requirements are satisfied
  if (response != undefined) {
    callSendAPI(senderPSID, response);    
  }
}

function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }

  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v3.2/me/messages",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  }); 
}

// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {
  
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
  
  // Parse params from the webhook verification request
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {      
      // Respond with 200 OK and challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    }
  }
  // Responds with '403 Forbidden' if verify tokens do not match
  // or no query parameter is provided
  res.sendStatus(403);
});
