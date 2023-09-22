const express = require("express");
const { Client } = require("whatsapp-web.js");
const app = express();
const client = new Client();

// Set up middleware to parse request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static("public"));

// Handle incoming messages
client.on("message", (message) => {
  console.log("Received message:", message.body);
});

// Start the client
client.initialize();

// Define routes
app.get("/", (req, res) => {
  res.send("Hello, WhatsApp!");
});

app.post("/send-message", (req, res) => {
  const recipientNumber = req.body.number;
  const message = req.body.message;
  console.log(recipientNumber);
  console.log(message);
  res.send("Message sent successfully");
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
