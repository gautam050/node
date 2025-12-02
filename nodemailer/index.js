const express = require("express");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();

app.get("/sendemail", async (req, res) => {
  try {
   
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

  
    let mailOptions = {
      from: process.env.EMAIL,
      to: [
        process.env.EMAIL,
        "venugopal.burli@masaischool.com"
      ],
      subject: "Testing Mail",
      text: "This is a testing Mail sent by NEM student, no need to reply.",
    };

    
    await transporter.sendMail(mailOptions);

    res.send("Email sent successfully!");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error sending email");
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
