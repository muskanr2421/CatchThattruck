const nodemailer = require('nodemailer')
const random = require('random-string-alphanumeric-generator')
const config = require('../config/otherConfig.json')

const admin = require('firebase-admin');

var serviceAccount = require('../catch-that-truck-firebase-adminsdk-ij7zy-04cef22b80.json');
const ringtone = require('../models/ringtone');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://catch-that-truck.firebaseio.com/"
});

function sendFogotPasswordMail(req, res) {
    var otp = random.randomNumber(6)
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: config.SMTP.user,
        pass: config.SMTP.password
      },
      tls: { rejectUnauthorized: false }
    });
  
    var mailOptions = {
      from: 'cisbackend@gmail.com',
      to: req.body.email,
      subject: 'Reset password code',
      html: `<html>Your Reset password code is ${otp}.</html>`
    };
    transporter.sendMail(mailOptions, (erro, info) => {
      if (erro) {
        console.log(erro)
      }
    })
    req.otp = otp;
}

const mailSender = async (email,title, body) => {
  try {
      let transporter = nodemailer.createTransport({
        host: 'mail.catchthattruck.com',
        secure: false,
        auth: {
          user: "noreply@catchthattruck.com",
          pass: "Download@2290"
        },
        tls: { rejectUnauthorized: false }
      })

      let info  = await transporter.sendMail({
          from: 'noreply@catchthattruck.com',
          to: `${email}`,
          subject: `${title}`,
          html: `${body}`,
      })
      return info;
  } catch (error) {
      console.log(error);
  }
}

async function CustomNotification(title, body, fcmToken) {
  // if (FCMToken.rows[0].FCMToken.length > 15) {
    const message = {
      data: {
        score: '850',
        time: '2:45'
      },
      notification: {
        title: title,
        body: body
      },
      apns: {
        payload: {
          aps: {
            sound: "Brahms Lullaby.wav"
          }
        }
      },
      token: fcmToken
    };

    admin.messaging().send(message)
      .then((response) => {
        // Response is a message ID string.
        console.log('Successfully sent message:', response);
        return true;
      })
      .catch((error) => {
        console.log('Error sending message:', error);
        return false;
      });


  // }

  return false;
};


module.exports = {
    sendFogotPasswordMail,
    mailSender,
    CustomNotification
}  