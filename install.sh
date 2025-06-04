# 2. Update and upgrade the system
sudo apt update && sudo apt upgrade -y

# 3. Install curl
sudo apt install curl -y

# 4. Download and run NodeSource LTS setup script
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -

# 5. Install Node.js and npm
sudo apt install -y nodejs

# 6. Verify installation
node -v
npm -v


sudo apt-get install chromium-browser
sudo apt update
sudo apt install -y \
  libasound2t64 libatk1.0-0t64 libatk-bridge2.0-0t64 libc6 libcairo2 libcups2t64 libdbus-1-3 \
  libexpat1 libfontconfig1 libgbm1 libglib2.0-0t64 libgtk-3-0t64 libnspr4 libnss3 libpango-1.0-0 \
  libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 \
  libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation lsb-release xdg-utils wget


sudo apt install nginx -y


sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d info.your_domain.com
