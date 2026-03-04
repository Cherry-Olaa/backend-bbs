// routes/contactRoutes.ts
import { Router } from "express";
import { sendContactFormEmail } from "../utils/email";

const router = Router();
// routes/contactRoutes.ts
router.post('/send', async (req, res) => {
    try {
      const { name, email, message } = req.body;
  
      if (!name || !email || !message) {
        return res.status(400).json({ message: "All fields are required" });
      }
  
      const sent = await sendContactFormEmail(name, email, message);
  
      if (sent) {
        res.json({ message: "Message sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send message" });
      }
    } catch (error) {
      console.error("Contact form error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

export default router;