import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

router.post("/mail-test", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "email is required in request body",
      });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Hello from Expense Tracker",
      text: "Hello",
      html: "<h3>Hello</h3>",
    });

    return res.status(200).json({
      success: true,
      message: "Hello email sent successfully",
      sentTo: email,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to send test email",
      error: error.message,
    });
  }
});

export default router;
