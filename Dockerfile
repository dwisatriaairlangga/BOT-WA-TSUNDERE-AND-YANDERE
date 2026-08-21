# Menggunakan sistem Linux standar yang bersih
FROM node:lts-bullseye-slim

# Memaksa instalasi Chromium murni beserta semua komponen grafisnya
RUN apt-get update && apt-get install -y \
    chromium \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Memberitahu Puppeteer agar TIDAK MENDOWNLOAD Chrome sendiri
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
# Mengarahkan Puppeteer ke Chromium yang baru saja kita instal
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Menginstal modul-modul Node.js kamu
COPY package*.json ./
RUN npm install

# Memasukkan semua file bot kamu
COPY . .

# Menyalakan bot
CMD ["node", "index.js"]