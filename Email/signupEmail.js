const nodemailer = require("nodemailer")
require('dotenv').config()
//gmail auth
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      // TODO: replace `user` and `pass` values from <https://forwardemail.net>
      user: process.env.USEREMAIL,
      pass: process.env.PASS,
    },
  });

//email for signup verification
const  verifyEmail = async({userEmail, token})=> {
        let emailContent = `
        <div style="font-family: Arial, sans-serif; color: #333;">
        <p>Hello,</p>
        <b>Please verify your Keja account by clicking the button below</b>
        <br/><br/>
        <a href="#" 
           style="display: inline-block; padding: 10px 20px; background-color: #007BFF; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
           Activate email
        </a>
        <br/>
        <p style="color: #ff0000;"><b>Note:</b> This link is only valid for one hour.</p>
        <p>Best regards,<br/>Keja Team</p>
        </div>
    `;

        try{

            await transporter.sendMail({
                from: '"KEJA" <foo@example.com>',
                to:userEmail,
                subject:"Verify Keja Account",
                text: "",
                html: emailContent
            })
        }
        catch(error)
        {
            console.log(error)
        }
    }


module.exports = verifyEmail