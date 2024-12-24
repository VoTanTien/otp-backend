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
    // const expiresAt = Date.now() + 3 * 60 * 1000; 
    otpStore[phoneNumber] = {
        otp: otp,
        expiresAt: Date.now() + 3 * 60 * 1000, // 3 phút
    }; 

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

    console.log('Stored OTP:', otpStore[phoneNumber].otp);
    console.log('Received OTP:', otp);
    console.log('Stored Time:', otpStore[phoneNumber].expiresAt);
    console.log('Current Time:', Date.now());
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

const verifyPassword = (req, res, next) => {
    const { adminPassword } = req.body;
    const correctPassword = process.env.ADMIN_PASSWORD; 
    if (!adminPassword || adminPassword !== correctPassword) {
        return res.status(403).send({ message: 'Forbidden: Invalid password' });
    }
    next();
};

// Xóa toàn bộ OTP với bảo mật mật khẩu
app.post('/clear-otp', verifyPassword, (req, res) => {
    Object.keys(otpStore).forEach((key) => delete otpStore[key]);
    console.log('All OTPs have been cleared.');
    res.status(200).send({ message: 'All OTPs have been cleared.' });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
