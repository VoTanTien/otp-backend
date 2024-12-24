const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const twilio = require('twilio');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(cors());


const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const client = twilio(accountSid, authToken);

const otpStore = {}; 

// Gửi OTP
app.post('/send-otp', (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
        return res.status(400).send({ message: 'Phone number is required' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 3 * 60 * 1000; 
    otpStore[phoneNumber] = { otp, expiresAt }; 

    setTimeout(() => {
        if (otpStore[phoneNumber] && otpStore[phoneNumber].expiresAt <= Date.now()) {
            delete otpStore[phoneNumber];
            console.log(`OTP for ${phoneNumber} has expired and been removed.`);
        }
    }, 3 * 60 * 1000);

    client.messages
        .create({
            body: `Your OTP code is: ${otp}`,
            from: twilioPhoneNumber,
            to: phoneNumber,
        })
        .then(() => res.status(200).send({ message: 'OTP sent successfully' }))
        .catch((err) => res.status(500).send({ message: err.message }));
});


app.post('/verify-otp', (req, res) => {
    const { phoneNumber, otp } = req.body;
    if (!phoneNumber || !otp) {
        return res.status(400).send({ message: 'Phone number and OTP are required' });
    }


    if (
        otpStore[phoneNumber] &&
        otpStore[phoneNumber].otp === otp &&
        otpStore[phoneNumber].expiresAt > Date.now()
    ) {
        delete otpStore[phoneNumber];
        return res.status(200).send({ message: 'OTP verified successfully' });
    } else {
        return res.status(400).send({ message: 'Invalid or expired OTP' });
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
