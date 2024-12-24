const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const twilio = require('twilio');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Load Twilio credentials từ biến môi trường
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const client = twilio(accountSid, authToken);

const otpStore = {}; // Lưu OTP tạm thời {phoneNumber: otp}

// Gửi OTP
app.post('/send-otp', (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
        return res.status(400).send({ message: 'Phone number is required' });
    }

    // Tạo OTP ngẫu nhiên
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[phoneNumber] = otp; // Lưu OTP vào bộ nhớ tạm

    // Gửi OTP qua SMS
    client.messages
        .create({
            body: `Your OTP code is: ${otp}`,
            from: twilioPhoneNumber,
            to: phoneNumber,
        })
        .then(() => res.status(200).send({ message: 'OTP sent successfully' }))
        .catch((err) => res.status(500).send({ message: err.message }));
});

// Xác thực OTP
app.post('/verify-otp', (req, res) => {
    const { phoneNumber, otp } = req.body;
    if (!phoneNumber || !otp) {
        return res.status(400).send({ message: 'Phone number and OTP are required' });
    }

    // Kiểm tra OTP
    if (otpStore[phoneNumber] && otpStore[phoneNumber] === otp) {
        delete otpStore[phoneNumber]; // Xóa OTP sau khi xác thực
        return res.status(200).send({ message: 'OTP verified successfully' });
    } else {
        return res.status(400).send({ message: 'Invalid OTP' });
    }
});

// Khởi chạy server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
