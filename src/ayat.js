const express = require("express");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const socketIO = require("socket.io");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const app = express();
const pm2 = require("pm2");
const wweb_version = "2.2413.51-beta";
const pm2_filename = "wwebjs";
const https = require('https');
const http = require('http');
const DomainName = "test.quranayat.com";
const privateKeyPath = "/etc/letsencrypt/live/" + DomainName + "/privkey.pem";
const certificatePath ="/etc/letsencrypt/live/" + DomainName + "/fullchain.pem";
const whatsapp_reviews_endpoint = `https://${DomainName}/whatsapp/reviews`;
const QRCode = require("qrcode");

const privateKey = fs.readFileSync(
  path.resolve(__dirname, privateKeyPath),
  "utf8"
);
const certificate = fs.readFileSync(
  path.resolve(__dirname, certificatePath),
  "utf8"
);

const credentials = { key: privateKey, cert: certificate };

// Domain name without https

// TODO: use corsOptions

// TODO: use corsOptions
const corsOptions = {
 origin: [
         "*"
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};





const server = http.createServer(credentials, app);
const io = socketIO(server, {
  //  cors: corsOptions,
});

let clientready = false;
let qrCodeData = "";
let isAuthenticated = undefined;
let isLoading = false;
let currentClientPhoneNumber = "";

// process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

// app.use(cors());
app.use(cors(corsOptions));
app.use(express.static(__dirname, { dotfiles: "allow" }));
app.use(express.json());

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});


io.on("connection", (socket) => {
  console.log("connection");
  socket.on("disconnect", (socket) => {
    console.log("Disconnect");
  });
});

// Start the client
let client = new Client({
  authStrategy: new LocalAuth(),
  restartOnAuthFail: true, // related problem solution
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
    ],
  },
});

// Set up middleware to parse request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/raw-qr-code", (req, res) => {
  if (!qrCodeData) {
    return res.status(401).json({ status: 401, error: "No QR Code RECEIVE" });
  }
  // Send the QR code as a response
  // io.emit("qrCode", qrCodeData);
  res.send(qrCodeData);
});

app.get("/qr-code", (req, res) => {
  // Generate QR codei
  if (!qrCodeData) {
    return res.status(401).json({ status: 401, error: "No QR Code RECEIVE" });
  }
  qrcode.generate(qrCodeData, { small: true }, (qrCode) => {
    // Send the QR code as a response
    res.send(qrCode);
  });
});


app.get("/scan", async (req, res) => {
  if (!qrCodeData) {
    return res.send("<p>QR not generated yet. Please refresh in a few seconds.</p>");
  }

  try {
    const qrImgDataUrl = await QRCode.toDataURL(qrCodeData);

    res.send(`
      <html>
        <head>
          <title>Scan WhatsApp QR</title>
          <style>
            body { display: flex; justify-content: center; align-items: center; height: 100vh; }
            img { width: 300px; height: 300px; }
          </style>
        </head>
        <body>
          <img src="${qrImgDataUrl}" alt="WhatsApp QR Code"/>
        </body>
      </html>
    `);
  } catch (err) {
    console.error("QR Render Error:", err);
    res.status(500).send("Error generating QR");
  }
});

app.get("/is-authenticated", async (req, res) => {
  let data;
  if (!clientready || isAuthenticated == undefined) {
    data = false;
  } else if (isLoading) {
    data = "Whatsapp is loading";
  } else {
    data = client.info.wid.user;
  }
  return res.status(200).json({
    status: 200,
    data: data,
  });
});

app.get("/logout", async (req, res) => {
  if (!isAuthenticated) {
    return res
      .status(401)
      .json({ status: 401, error: "You are not authenticated" });
  }

  try {
    await client.logout();
  } catch (e) {
    console.log(e);
  }

  try {
    await client.destroy();
  } catch (e) {
    console.log(e);
  }

  isAuthenticated = undefined;
  qrCodeData = "";
  client = new Client({
    authStrategy: new LocalAuth(),
    restartOnAuthFail: true, // related problem solution
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
    },
  });
  initializeClient();
  console.log("logged out");
  io.emit("status", {
    status: "logged_out",
  });
});

app.post("/send-message", async (req, res) => {
  if (!isAuthenticated) {
    return res
      .status(401)
      .json({ status: 401, error: "You are not authenticated" });
  }
  // number should be group id like 120363164648354136@g.us or account id like  201150064746@c.us
  try {
    const result = await client.sendMessage(
      req.body.groupName,
      req.body.message
    );
    console.log(result);
    if (result) {
      return res
        .status(200)
        .json({ status: 200, data: "Message sent successfully!" });
    }
  } catch (error) {
    return res.json({ status: 404, data: "Phone Number Not Found" });
  }
});

app.post("/send-group-message", async (req, res) => {
  // Check if the user is authenticated (implementation required)
  if (!isAuthenticated) {
    return res
      .status(401)
      .json({ status: 401, error: "You are not authenticated" });
  }

  // Check if the groupName is provided
  if (!req.body.groupName) {
    return res.status(400).json({ status: 400, error: "groupName required" });
  }

  // Send the message to the group
  try {
    const result = await client.sendMessage(
      req.body.groupName,
      req.body.message
    );
    // Check if there was an error sending the message
    if (result === undefined) {
      return res
        .status(500)
        .json({ status: 500, error: "Error sending message" });
    }
console.log(result)
    // Send a success response
    const successMessage = "Message sent successfully!";
    return res.status(200).json({ status: 200, data: successMessage });
  } catch (error) {
    console.log(req.body.groupName);
    return res.status(500).json({ status: 500, error: error });
  }
});



// Helper to safely get chats, filtering out corrupted ones
async function getSafeChats(retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const chats = await client.getChats();
        // Filter out chats that have missing or undefined IDs
        return chats.filter(chat => chat?.id?._serialized);
      } catch (err) {
        console.warn(`Attempt ${attempt + 1} failed to fetch chats:`, err.message);
        if (attempt === retries) throw err;
        await new Promise(res => setTimeout(res, 1000));
      }
    }
  }

  
  let groupCache = {};


  app.post("/get-group-id2", async (req, res) => {
    if (!isAuthenticated) {
      return res.status(401).json({ status: 401, error: "You are not authenticated" });
    }
  
    const { groupName, parentPhone } = req.body;
  
    if (!groupName) {
      return res.status(400).json({ status: 400, error: "groupName required" });
    }
  
    if (!parentPhone) {
      return res.status(400).json({ status: 400, error: "parentPhone required" });
    }
  
    const targetName = groupName.trim().toLowerCase();
  
    try {
      let group = groupCache[targetName];
  
      // If not cached, fetch and cache it
      if (!group) {
        console.log(`Group "${targetName}" not in cache. Fetching chats...`);
        const chats = await client.getChats();
        const safeGroups = chats.filter(chat => chat.isGroup && chat.name && chat.id?._serialized);
        group = safeGroups.find(chat => chat.name.trim().toLowerCase() === targetName);
  
        if (!group) {
          return res.status(404).json({ status: 404, error: "Group Not Found" });
        }
  
        groupCache[targetName] = group; // Cache it
      } else {
        console.log(`Group "${targetName}" found in cache.`);
      }
  
      // Normalize parentPhone
      let onlyDigits = parentPhone.replace(/\D/g, "");
      if (onlyDigits.startsWith("0")) {
        onlyDigits = "20" + onlyDigits.slice(1);
      }
      const normalizedPhone = onlyDigits + "@c.us";
      console.log("Normalized parentPhone:", normalizedPhone);
  
      // Get the client's own number
      const clientInfo = await client.info;
      const myNumber = clientInfo.wid._serialized;
      console.log("Client's own number:", myNumber);
  
      const participants = group.participants || [];
      console.log(`Group "${group.name}" members (${participants.length}):`);
      participants.forEach((p, i) => {
        const pid = p?.id?._serialized;
        if (pid) console.log(`${i + 1}. ${pid}`);
      });
  
      const isInGroup = participants.some(p => {
        return p?.id?._serialized?.startsWith(onlyDigits);
      });
  
      const isOwnNumber = normalizedPhone === myNumber;
  
      if (!isInGroup && !isOwnNumber) {
        console.log("Parent phone NOT in group.");
        return res.status(403).json({ status: 403, error: "Parent phone not in group" });
      }
  
      console.log("Parent phone found in group.");
      return res.status(200).json({ status: 200, group_id: group.id._serialized });
  
    } catch (err) {
      console.error("Error:", err);
      return res.status(500).json({ status: 500, error: "Internal Server Error" });
    }
  });
  

  


app.post("/restart", async (req, res) => {
  console.log("Restarting...");

  // Restart the PM2 process
  pm2.restart(pm2_filename, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error restarting application");
    }
    console.log("Application restarted successfully");
    return res
      .status(200)
      .json({ status: 200, message: "Application restarted successfully" });
  });
});

app.post("/send-to-all", async (req, res) => {
  console.log(req.body);
  // if you passed group name will find it's id and send it
  // if group name not passed it will use saved groupId from created group endpoint
  if (!isAuthenticated) {
    return res
      .status(401)
      .json({ status: 401, error: "You are not authenticated" });
  }
  if (!req.body.sendToContacts && !req.body.sendToContacts) {
    return res.status(400).json({
      status: 400,
      error: "shoul pass sendToContacts or  sendToContacts",
    });
  }

  // Get a list of all of the user's chats
  const chats = await client.getChats();
  // Check to make sure that the chats object is not empty
  if (chats.length > 0) {
    chats.map((chat) => {
      if (req.body.sendToContacts) {
        !chat.isGroup &&
          client.sendMessage(
            chat.id._serialized,
            `${req.body.message}  via whatsapp bot`
          );
      }
      if (req.body.sendToGroups) {
        chat.isGroup &&
          client.sendMessage(
            chat.id._serialized,
            `${req.body.message}  via whatsapp bot`
          );
      }
    });
    return res.status(200).json({ data: "Message sent successfully!" });
  }
});

function initializeClient() {
  client.on("ready", async () => {





    clientready = true;
    isLoading = false;
    isAuthenticated = true;
    console.log("client.ready");
    io.emit("status", {
      status: "ready",
      user: client.info.wid.user,
    });
    fetch(whatsapp_reviews_endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => response.json())
      .then((data) => console.log(data))
      .catch((error) => console.error(error));
  });

  client.on("qr", (qr) => {
    console.log("client.qr");

    // Generate and scan this code with your phone
    console.log("QR RECEIVED", qr);
    qrCodeData = qr;
    io.emit("qrCode", qrCodeData);
  });

  client.on("loading_screen", (percent, message) => {
    console.log("client.loading_screen");
    isLoading = true;
    io.emit("status", {
      status: "loading",
      percent: percent,
    });
    console.log("LOADING SCREEN", percent, message);
  });

  client.on("authenticated", () => {
    console.log("client.authenticated");
    isAuthenticated = true;
    isLoading = false;
    io.emit("status", {
      status: "authenticated",
    });
  });

  client.on("auth_failure", (msg) => {
    console.log("client.auth_failure");

    isAuthenticated = false;
    isLoading = false;
    io.emit("status", {
      status: "auth_failure",
    });
    // Fired if session restore was unsuccessful
    console.error("AUTHENTICATION FAILURE", msg);
  });

  client.on("disconnected", (reason) => {
    io.emit("status", {
      status: "disconnected",
    });
  });

  client.initialize();
}

// Define routes
app.get("/", (req, res) => {
  res.send("Hello from whatsapp-web.js!");
});

initializeClient();
const port = 3000;

app.listen(port, () => {
  console.log('App listening on port 3000');
});

