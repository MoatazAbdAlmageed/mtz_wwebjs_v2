# Whatsapp sender

Welcome to MyApp! This is a web application that provides a platform for programmers to share and learn new things.

## TODO

- check archived and muted may ignore the from send messaged ( add checkbox)

## Table of Contents

- [Description](#description)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Description

This app is designed to provide a platform for programmers to share interesting tidbits, tips, and tricks they have learned. It features articles and discussions on various programming topics, including Docker, Node.js, GraphQL, Ruby, algorithms, and React.

## Installation

To run this app locally, follow these steps:

1. Clone the repository: `git clone <repository-url>`
2. Install dependencies: `npm install`
3. edit `vim /var/www/html/hello.js` and add this line : `require('./mtz_wwebjs/src/server.js');`
4. Start the server: `npm install --global yarn && cd /var/www/html/mtz_wwebjs/ && git pull && yarn  && sudo -u nodejs pm2 restart hello`
5. another way to run server `cd /var/www/html/mtz_wwebjs/src && nohup node server.js &`
check https://github.com/pedroslopez/whatsapp-web.js/issues/972 
```bash

sudo apt-get install chromium-browser
sudo apt update
sudo apt install -y \
  libasound2t64 libatk1.0-0t64 libatk-bridge2.0-0t64 libc6 libcairo2 libcups2t64 libdbus-1-3 \
  libexpat1 libfontconfig1 libgbm1 libglib2.0-0t64 libgtk-3-0t64 libnspr4 libnss3 libpango-1.0-0 \
  libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 \
  libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation lsb-release xdg-utils wget





```
## Usage

Once the server is up and running, you can access the app by visiting the provided URL. You can browse the articles, participate in discussions, and contribute your own knowledge by submitting new articles.


Great! Here's a complete guide to:

1. **Installing the Cairo font**
2. **Documenting the `/send-certificate-to-many` API endpoint**
3. **Creating a `postman.json` collection for easy import into Postman**

---

## ✅ Step 1: Install Cairo Font on Your System

### 🔵 On Ubuntu/Debian

```bash
sudo apt update
sudo apt install fonts-cairo
```

### 🔵 On Windows

1. Download the font:
   [https://fonts.google.com/specimen/Cairo](https://fonts.google.com/specimen/Cairo)
2. Extract and install the `.ttf` files by double-clicking them.

### 🔵 On macOS

1. Download the font from Google Fonts (link above).
2. Open the `.ttf` files and click **Install Font**.

---

## ✅ Step 2: Document the API Endpoint

### 🔹 Endpoint

```
POST /send-certificate-to-many
```

### 🔹 Description

Generates personalized image certificates for a list of members using a background template and sends them, typically via WhatsApp or email (depending on your app).

### 🔹 Request Body (JSON)

```json
{
  "cert": "card.png",                          // Template image (must be in crt/ folder)
  "members": [
    {
      "name": "معتز محمد عبدالجيد",
      "phone": "1150064746"
    }
  ],
  "out_folder": "generated",                   // Output folder to save generated images
  "name": {
    "size": 42,                                // Font size
    "y": 300                                   // Vertical position of text
  }
}
```

### 🔹 Response

```json
{
  "status": "success",
  "files": [
    "/crt/generated/معتز محمد عبدالجيد.png"
  ]
}
```

---

## ✅ Step 3: `postman.json` (Postman Collection)

Here’s a `postman.json` file you can import into Postman:

```json
{
  "info": {
    "name": "Certificate Generator API",
    "_postman_id": "12345678-abcd-efgh-ijkl-1234567890ab",
    "description": "Send certificates to many members by name using a template image and Cairo font.",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Send Certificate to Many",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json",
            "type": "text"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"cert\": \"card.png\",\n  \"members\": [\n    {\n      \"name\": \"معتز محمد عبدالجيد\",\n      \"phone\": \"1150064746\"\n    }\n  ],\n  \"out_folder\": \"generated\",\n  \"name\": {\n    \"size\": 42,\n    \"y\": 300\n  }\n}"
        },
        "url": {
          "raw": "http://localhost:3000/send-certificate-to-many",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["send-certificate-to-many"]
        }
      },
      "response": []
    }
  ]
}
```

---

### 🔄 To Use This File:

1. Save the above JSON as `postman.json`.
2. Open Postman.
3. Click **Import** > **Upload Files**.
4. Choose `postman.json`.
5. Modify the URL if your server isn’t on `localhost:3000`.

---

Let me know if you'd like to:

* Add file upload (`cert` as a file)
* Add automatic WhatsApp sending via `wwebjs`
* Zip all certificates in the response

I'm happy to extend the documentation further.


## Contributing

Contributions to this project are welcome! If you have any ideas, bug reports, or feature requests, please open an issue or submit a pull request. Make sure to follow the project's code of conduct.

## License

This project is licensed under the [MIT License](LICENSE).
