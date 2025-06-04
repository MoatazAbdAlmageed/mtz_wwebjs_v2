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

```bash
sudo apt update
sudo apt install -y \
  gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 \
  libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 \
  libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 \
  libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 \
  libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation \
  libnss3 lsb-release xdg-utils wget libatk-bridge2.0-0 libatk1.0-0 libatk-bridge2.0-0


```
## Usage

Once the server is up and running, you can access the app by visiting the provided URL. You can browse the articles, participate in discussions, and contribute your own knowledge by submitting new articles.

## Contributing

Contributions to this project are welcome! If you have any ideas, bug reports, or feature requests, please open an issue or submit a pull request. Make sure to follow the project's code of conduct.

## License

This project is licensed under the [MIT License](LICENSE).
