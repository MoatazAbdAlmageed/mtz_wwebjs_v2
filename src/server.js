const express = require("express");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
// const https = require("https");
const cors = require('cors');
// const fs = require('fs');
const { exec } = require('child_process');

const app = express();
let qrCodeData = "";
let isAuthenticated = false;
const port = 3000;
let currentClientPhoneNumber = "";


// TODO: use corsOptions
// const corsOptions = {
//   origin: 'https://qurantalent.net',
//   optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
// };

// app.use(cors(corsOptions));

app.use(cors());


// Start the client
const client = new Client({
  authStrategy: new LocalAuth(),
  restartOnAuthFail: true, // related problem solution
  puppeteer: {
    headless: true,
    args: ['--no-sandbox']
  }
});




// Set up middleware to parse request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static("public"));

client.on("qr", (qr) => {
  console.log("client.qr");

  // Generate and scan this code with your phone
  console.log("QR RECEIVED", qr);
  qrCodeData = qr;
});



app.get("/raw-qr-code", (req, res) => {
  if (!qrCodeData) {
    return res.status(401).json({ status: 401, error: "No QR Code RECEIVE" });
  }
  // Send the QR code as a response
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



client.on("ready", () => {
  console.log("client.ready");

  console.log("Client is ready!");



  app.get("/get-chats", async (req, res) => {
    if (!isAuthenticated) {
      return res.status(401).json({ status: 401, error: "You are not authenticated" });

    }
    const chats = await client.getChats();
    if (!chats.length > 0) {
      return res.status(200).json({ status: 200, data: "No chats" });

    }
    res.send(chats);

  });

  app.get("/is-authenticated", async (req, res) => {
    const chats = await client.getChats();
    if (chats?.length) {
      isAuthenticated = chats[0]?.lastMessage.to;
    }
    return res.status(200).json({
      status: 200,
      data: isAuthenticated
    });
  });

});




app.get('/logout', async (req, res) => {
  if (!isAuthenticated) {
    return res.status(401).json({ status: 401, error: "You are not authenticated" });

  }
  await client.logout();
  isAuthenticated = false;

  // Run the command to restart the PM2 process
  exec('sudo -u nodejs pm2 restart hello', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing command: ${error.message}`);
      return res.status(500).json({ status: 500, error: 'Error executing command' });
    }
    if (stderr) {
      console.error(`Command execution error: ${stderr}`);
      return res.status(500).json({ status: 500, error: 'Command execution error' });
    }
    console.log(`Command output: ${stdout}`);
    return res.status(200).json({ status: 200, data: 'Logout successful' });
  });
});


app.post("/send-message", async (req, res) => {
  if (!isAuthenticated) {
    return res.status(401).json({ status: 401, error: "You are not authenticated" });

  }
  // number should be group id like 120363164648354136@g.us or account id like  201150064746@c.us
  const result = await client.sendMessage(req.body.number, req.body.message);
  console.log(result)
  if (result) {
    return res.status(200).json({ status: 200, data: "Message sent successfully!" });
  }
});


app.post("/send-group-message", async (req, res) => {
  // Check if the user is authenticated (implementation required)
  if (!isAuthenticated) {
    return res.status(401).json({ status: 401, error: "You are not authenticated" });
  }

  // Check if the groupName is provided
  if (!req.body.groupName) {
    return res.status(400).json({ status: 400, error: "groupName required" });
  }

  // Get a list of all of the user's chats
  const chats = await client.getChats();

  // Check if the chats array is empty
  if (chats.length === 0) {
    return res.status(404).json({ status: 404, error: "No chats found" });
  }

  // Find the group chat by name
  const groupChat = chats.find((chat) => chat.isGroup && chat.name === req.body.groupName);

  // Check if the group chat is found
  if (!groupChat) {
    return res.status(404).json({ status: 404, error: "Group not found" });
  }

  // Get the group ID
  const groupId = groupChat.id._serialized;

  // Send the message to the group
  const result = await client.sendMessage(groupId, req.body.message);

  // Check if there was an error sending the message
  if (result === undefined) {
    return res.status(500).json({ status: 500, error: "Error sending message" });
  }

  // Send a success response
  const successMessage = "Message sent successfully!";
  return res.status(200).json({ status: 200, data: successMessage });
});


app.post("/send-to-all", async (req, res) => {

  console.log(req.body)
  // if you passed group name will find it's id and send it
  // if group name not passed it will use saved groupId from created group endpoint
  if (!isAuthenticated) {
    return res.status(401).json({ status: 401, error: "You are not authenticated" });

  }
  if (!req.body.sendToContacts && !req.body.sendToContacts) {
    return res.status(400).json({ status: 400, error: "shoul pass sendToContacts or  sendToContacts" });

  }

  // Get a list of all of the user's chats
  const chats = await client.getChats();
  // Check to make sure that the chats object is not empty
  if (chats.length > 0) {
    chats.map(chat => {

      if (req.body.sendToContacts) {
        !chat.isGroup && client.sendMessage(chat.id._serialized, `${req.body.message}  via whatsapp bot`)
      }
      if (req.body.sendToGroups) {
        chat.isGroup && client.sendMessage(chat.id._serialized, `${req.body.message}  via whatsapp bot`)
      }
    });
    return res.status(200).json({ data: "Message sent successfully!" });

  }

});


app.post("/create-group", async (req, res) => {
  if (!isAuthenticated) {
    return res.status(401).json({ status: 401, error: "You are not authenticated" });

  }
  const group = await client.createGroup(req.body.group_name, req.body.members);

  // save groupId so we can use it later when use sendmessagetogroup {{url}}/send-message-to-group
  const groupId = group.gid._serialized;

  return res.status(200).json({ status: 200, data: groupId });

});





client.on("loading_screen", (percent, message) => {
  console.log("client.loading_screen");

  console.log("LOADING SCREEN", percent, message);
});


client.on("authenticated", () => {
  console.log("client.authenticated");
  isAuthenticated = true;
});

client.on("auth_failure", (msg) => {
  console.log("client.auth_failure");

  isAuthenticated = false;
  // Fired if session restore was unsuccessful
  console.error("AUTHENTICATION FAILURE", msg);
});


// Handle incoming messages

client.on("message", async (msg) => {
  console.log("client.message");

  console.log("MESSAGE RECEIVED", msg);
  console.log("MESSAGE from", msg.from);
  console.log("MESSAGE to", msg.to);
  currentClientPhoneNumber = msg.to;
  isAuthenticated = currentClientPhoneNumber;

  if (msg.body === "!ping reply") {
    // Send a new message as a reply to the current one
    msg.reply("pong");
  }

  if (msg.body === "I love you!") {
    // Send a new message as a reply to the current one
    msg.reply("me too!");
  } else if (msg.body === "!ping") {
    // Send a new message to the same chat
    client.sendMessage(msg.from, "pong");
  } else if (msg.body.startsWith("!sendto ")) {
    // Direct send a new message to specific id
    let number = msg.body.split(" ")[1];
    let messageIndex = msg.body.indexOf(number) + number.length;
    let message = msg.body.slice(messageIndex, msg.body.length);
    number = number.includes("@c.us") ? number : `${number}@c.us`;
    let chat = await msg.getChat();
    chat.sendSeen();
    client.sendMessage(number, message);
  } else if (msg.body.startsWith("!subject ")) {
    // Change the group subject
    let chat = await msg.getChat();
    if (chat.isGroup) {
      let newSubject = msg.body.slice(9);
      chat.setSubject(newSubject);
    } else {
      msg.reply("This command can only be used in a group!");
    }
  } else if (msg.body.startsWith("!echo ")) {
    // Replies with the same message
    msg.reply(msg.body.slice(6));
  } else if (msg.body.startsWith("!desc ")) {
    // Change the group description
    let chat = await msg.getChat();
    if (chat.isGroup) {
      let newDescription = msg.body.slice(6);
      chat.setDescription(newDescription);
    } else {
      msg.reply("This command can only be used in a group!");
    }
  } else if (msg.body === "!leave") {
    // Leave the group
    let chat = await msg.getChat();
    if (chat.isGroup) {
      chat.leave();
    } else {
      msg.reply("This command can only be used in a group!");
    }
  } else if (msg.body.startsWith("!join ")) {
    const inviteCode = msg.body.split(" ")[1];
    try {
      await client.acceptInvite(inviteCode);
      msg.reply("Joined the group!");
    } catch (e) {
      msg.reply("That invite code seems to be invalid.");
    }
  } else if (msg.body === "!groupinfo") {
    let chat = await msg.getChat();
    if (chat.isGroup) {
      msg.reply(`
              *Group Details*
              Name: ${chat.name}
              Description: ${chat.description}
              Created At: ${chat.createdAt.toString()}
              Created By: ${chat.owner.user}
              Participant count: ${chat.participants.length}
          `);
    } else {
      msg.reply("This command can only be used in a group!");
    }
  } else if (msg.body === "!chats") {
    const chats = await client.getChats();
    client.sendMessage(msg.from, `The bot has ${chats.length} chats open.`);
  } else if (msg.body === "!info") {
    let info = client.info;
    client.sendMessage(
      msg.from,
      `
          *Connection info*
          User name: ${info.pushname}
          My number: ${info.wid.user}
          Platform: ${info.platform}
      `
    );
  } else if (msg.body === "!mediainfo" && msg.hasMedia) {
    const attachmentData = await msg.downloadMedia();
    msg.reply(`
          *Media info*
          MimeType: ${attachmentData.mimetype}
          Filename: ${attachmentData.filename}
          Data (length): ${attachmentData.data.length}
      `);
  } else if (msg.body === "!quoteinfo" && msg.hasQuotedMsg) {
    const quotedMsg = await msg.getQuotedMessage();

    quotedMsg.reply(`
          ID: ${quotedMsg.id._serialized}
          Type: ${quotedMsg.type}
          Author: ${quotedMsg.author || quotedMsg.from}
          Timestamp: ${quotedMsg.timestamp}
          Has Media? ${quotedMsg.hasMedia}
      `);
  } else if (msg.body === "!resendmedia" && msg.hasQuotedMsg) {
    const quotedMsg = await msg.getQuotedMessage();
    if (quotedMsg.hasMedia) {
      const attachmentData = await quotedMsg.downloadMedia();
      client.sendMessage(msg.from, attachmentData, {
        caption: "Here's your requested media.",
      });
    }
    if (quotedMsg.hasMedia && quotedMsg.type === "audio") {
      const audio = await quotedMsg.downloadMedia();
      await client.sendMessage(msg.from, audio, { sendAudioAsVoice: true });
    }
  } else if (msg.body === "!isviewonce" && msg.hasQuotedMsg) {
    const quotedMsg = await msg.getQuotedMessage();
    if (quotedMsg.hasMedia) {
      const media = await quotedMsg.downloadMedia();
      await client.sendMessage(msg.from, media, { isViewOnce: true });
    }
  } else if (msg.body === "!location") {
    // only latitude and longitude
    await msg.reply(new Location(37.422, -122.084));
    // location with name only
    await msg.reply(new Location(37.422, -122.084, { name: "Googleplex" }));
    // location with address only
    await msg.reply(
      new Location(37.422, -122.084, {
        address: "1600 Amphitheatre Pkwy, Mountain View, CA 94043, USA",
      })
    );
    // location with name, address and url
    await msg.reply(
      new Location(37.422, -122.084, {
        name: "Googleplex",
        address: "1600 Amphitheatre Pkwy, Mountain View, CA 94043, USA",
        url: "https://google.com",
      })
    );
  } else if (msg.location) {
    msg.reply(msg.location);
  } else if (msg.body.startsWith("!status ")) {
    const newStatus = msg.body.split(" ")[1];
    await client.setStatus(newStatus);
    msg.reply(`Status was updated to *${newStatus}*`);
  } else if (msg.body === "!mention") {
    const contact = await msg.getContact();
    const chat = await msg.getChat();
    chat.sendMessage(`Hi @${contact.number}!`, {
      mentions: [contact],
    });
  } else if (msg.body === "!delete") {
    if (msg.hasQuotedMsg) {
      const quotedMsg = await msg.getQuotedMessage();
      if (quotedMsg.fromMe) {
        quotedMsg.delete(true);
      } else {
        msg.reply("I can only delete my own messages");
      }
    }
  } else if (msg.body === "!pin") {
    const chat = await msg.getChat();
    await chat.pin();
  } else if (msg.body === "!archive") {
    const chat = await msg.getChat();
    await chat.archive();
  } else if (msg.body === "!mute") {
    const chat = await msg.getChat();
    // mute the chat for 20 seconds
    const unmuteDate = new Date();
    unmuteDate.setSeconds(unmuteDate.getSeconds() + 20);
    await chat.mute(unmuteDate);
  } else if (msg.body === "!typing") {
    const chat = await msg.getChat();
    // simulates typing in the chat
    chat.sendStateTyping();
  } else if (msg.body === "!recording") {
    const chat = await msg.getChat();
    // simulates recording audio in the chat
    chat.sendStateRecording();
  } else if (msg.body === "!clearstate") {
    const chat = await msg.getChat();
    // stops typing or recording in the chat
    chat.clearState();
  } else if (msg.body === "!jumpto") {
    if (msg.hasQuotedMsg) {
      const quotedMsg = await msg.getQuotedMessage();
      client.interface.openChatWindowAt(quotedMsg.id._serialized);
    }
  } else if (msg.body === "!buttons") {
    let button = new Buttons(
      "Button body",
      [{ body: "bt1" }, { body: "bt2" }, { body: "bt3" }],
      "title",
      "footer"
    );
    client.sendMessage(msg.from, button);
  } else if (msg.body === "!list") {
    let sections = [
      {
        title: "sectionTitle",
        rows: [
          { title: "ListItem1", description: "desc" },
          { title: "ListItem2" },
        ],
      },
    ];
    let list = new List("List body", "btnText", sections, "Title", "footer");
    client.sendMessage(msg.from, list);
  } else if (msg.body === "!reaction") {
    msg.react("👍");
  } else if (msg.body === "!edit") {
    if (msg.hasQuotedMsg) {
      const quotedMsg = await msg.getQuotedMessage();
      if (quotedMsg.fromMe) {
        quotedMsg.edit(msg.body.replace("!edit", ""));
      } else {
        msg.reply("I can only edit my own messages");
      }
    }
  } else if (msg.body === "!updatelabels") {
    const chat = await msg.getChat();
    await chat.changeLabels([0, 1]);
  } else if (msg.body === "!addlabels") {
    const chat = await msg.getChat();
    let labels = (await chat.getLabels()).map((l) => l.id);
    labels.push("0");
    labels.push("1");
    await chat.changeLabels(labels);
  } else if (msg.body === "!removelabels") {
    const chat = await msg.getChat();
    await chat.changeLabels([]);
  }
});

client.on("message_create", (msg) => {
  console.log("client.message_create");
  // Fired on all message creations, including your own
  if (msg.fromMe) {
    // do stuff here
  }
});

client.on("message_revoke_everyone", async (after, before) => {
  console.log("client.message_revoke_everyone");
  // Fired whenever a message is deleted by anyone (including you)
  console.log(after); // message after it was deleted.
  if (before) {
    console.log(before); // message before it was deleted.
  }
});

client.on("message_revoke_me", async (msg) => {
  console.log("client.message_revoke_me");

  // Fired whenever a message is only deleted in your own view.
  console.log(msg.body); // message before it was deleted.
});

client.on("message_ack", (msg, ack) => {
  console.log("client.message_ack");

  /*
      == ACK VALUES ==
      ACK_ERROR: -1
      ACK_PENDING: 0
      ACK_SERVER: 1
      ACK_DEVICE: 2
      ACK_READ: 3
      ACK_PLAYED: 4
  */

  if (ack == 3) {
    // The message was read
  }
});

client.on("group_join", (notification) => {
  console.log("client.group_join");

  // User has joined or been added to the group.
  console.log("join", notification);
  notification.reply("User joined.");
});

client.on("group_leave", (notification) => {
  console.log("client.group_leave");

  // User has left or been kicked from the group.
  console.log("leave", notification);
  notification.reply("User left.");
});

client.on("group_update", (notification) => {
  console.log("client.group_update");

  // Group picture, subject or description has been updated.
  console.log("update", notification);
});

client.on("change_state", (state) => {
  console.log("client.change_state");

  console.log("CHANGE STATE", state);
});

// Change to false if you don't want to reject incoming calls
let rejectCalls = false;

client.on("call", async (call) => {
  console.log("client.call");

  console.log("Call received, rejecting. GOTO Line 261 to disable", call);
  if (rejectCalls) await call.reject();
  await client.sendMessage(
    call.from,
    `[${call.fromMe ? "Outgoing" : "Incoming"}] Phone call from ${call.from
    }, type ${call.isGroup ? "group" : ""} ${call.isVideo ? "video" : "audio"
    } call. ${rejectCalls ? "This call was automatically rejected by the script." : ""
    }`
  );
});

client.on("disconnected", (reason) => {
  console.log("client.disconnected");

  console.log("Client was logged out", reason);
  // Destroy and reinitialize the client when disconnected
  // client.destroy();
  // client.initialize();

});

client.on("contact_changed", async (message, oldId, newId, isContact) => {
  console.log("client.contact_changed");

  /** The time the event occurred. */
  const eventTime = new Date(message.timestamp * 1000).toLocaleString();

  console.log(
    `The contact ${oldId.slice(0, -5)}` +
    `${!isContact
      ? " that participates in group " +
      `${(await client.getChatById(message.to ?? message.from)).name} `
      : " "
    }` +
    `changed their phone number\nat ${eventTime}.\n` +
    `Their new phone number is ${newId.slice(0, -5)}.\n`
  );

  /**
   * Information about the @param {message}:
   *
   * 1. If a notification was emitted due to a group participant changing their phone number:
   * @param {message.author} is a participant's id before the change.
   * @param {message.recipients[0]} is a participant's id after the change (a new one).
   *
   * 1.1 If the contact who changed their number WAS in the current user's contact list at the time of the change:
   * @param {message.to} is a group chat id the event was emitted in.
   * @param {message.from} is a current user's id that got an notification message in the group.
   * Also the @param {message.fromMe} is TRUE.
   *
   * 1.2 Otherwise:
   * @param {message.from} is a group chat id the event was emitted in.
   * @param {message.to} is @type {undefined}.
   * Also @param {message.fromMe} is FALSE.
   *
   * 2. If a notification was emitted due to a contact changing their phone number:
   * @param {message.templateParams} is an array of two user's ids:
   * the old (before the change) and a new one, stored in alphabetical order.
   * @param {message.from} is a current user's id that has a chat with a user,
   * whos phone number was changed.
   * @param {message.to} is a user's id (after the change), the current user has a chat with.
   */
});

client.on("group_admin_changed", (notification) => {
  console.log("client.group_admin_changed");

  if (notification.type === "promote") {
    /**
     * Emitted when a current user is promoted to an admin.
     * {@link notification.author} is a user who performs the action of promoting/demoting the current user.
     */
    console.log(`You were promoted by ${notification.author}`);
  } else if (notification.type === "demote")
    /** Emitted when a current user is demoted to a regular user. */
    console.log(`You were demoted by ${notification.author}`);
});

// Define routes
app.get("/", (req, res) => {
  res.send("Hello!");
});
client.initialize();

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// // const options = {
// //   key: fs.readFileSync('key.pem'),
// //   cert: fs.readFileSync('cert.pem')
// // };

// const options = {
//   key: fs.readFileSync('/etc/letsencrypt/live/whatsapp.qurantalent.net/privkey.pem'),
//   cert: fs.readFileSync('/etc/letsencrypt/live/whatsapp.qurantalent.net/fullchain.pem')
// };

// https.createServer({ options }, app)
//   .listen(port, function (req, res) {
//     console.log("Server started at port 3000");
//   });

