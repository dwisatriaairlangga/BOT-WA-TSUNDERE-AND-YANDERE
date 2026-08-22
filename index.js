require('dotenv').config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const Groq = require('groq-sdk');
const axios = require('axios');
const ytdl = require('@distube/ytdl-core');

// 1. KUNCI API GROQ
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// === TEMPAT MENYIMPAN INGATAN ===
const userChats = new Map();

// === FUNGSI PENGAMAN TYPING ===
async function setTyping(msg, isTyping) {
  try {
    const chat = await msg.getChat();
    if (isTyping) chat.sendStateTyping();
    else chat.clearState();
  } catch (e) {
    // Abaikan dalam diam jika WA gagal memunculkan status
  }
}

// 2. PENGATURAN CLIENT
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  }
});

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('=============================');
  console.log(' BOT RA (GROQ MIXTRAL + ANTI-ERROR TYPING) AKTIF!');
  console.log('=============================');
});

// 3. MEMBACA PESAN MASUK
client.on('message', async msg => {
  if (msg.from === 'status@broadcast') return;

  const delayWaktu = Math.floor(Math.random() * 2000) + 3000;

  // === FITUR STIKER ===
  if (msg.hasMedia && msg.body.toLowerCase() === '.stiker') {
    try {
      await setTyping(msg, true);
      const media = await msg.downloadMedia();
      if (media.mimetype.includes('image')) {
        msg.reply('Tunggu sebentar! Jangan cerewet, ini lagi dibuat...');
        await client.sendMessage(msg.from, media, {
          sendMediaAsSticker: true,
          stickerName: 'Stiker buatan RA',
          stickerAuthor: 'Hanya milik RA'
        });
      } else {
        msg.reply('Hmph, itu bukan gambar bodoh! Kirim gambar!');
      }
      await setTyping(msg, false);
    } catch (error) {
      msg.reply('Ck, sistem download gambarku lagi diblokir. Coba lagi nanti.');
    }
  }

  // === FITUR PERINTAH BIASA ===
  else if (msg.body.toLowerCase() === '.halo') {
    await setTyping(msg, true);
    setTimeout(async () => {
      msg.reply('Apa?! Ngapain sapa-sapa aku?!');
      await setTyping(msg, false);
    }, delayWaktu);
  }
  
  else if (msg.body.toLowerCase() === '.ping') {
    await setTyping(msg, true);
    setTimeout(async () => {
      msg.reply('Pong! Berisik tau, aku lagi sibuk!');
      await setTyping(msg, false);
    }, delayWaktu);
  }

  // === MENU BANTUAN ===
  else if (msg.body.toLowerCase() === '.menu' || msg.body.toLowerCase() === '.help') {
    await setTyping(msg, true);
    const teksMenu = `*=== DAFTAR PERINTAH RA (GROQ) ===*
    
Silakan gunakan perintah berikut:
- *.stiker* (Kirim gambar dengan caption ini)
- *.tiktok [link]* (Download video TikTok)
- *.ig [link]* (Download video Instagram)
- *.yt [link]* (Download video YouTube)
- *.mp3 [link]* (Download lagu YouTube)
- *.kuis* / *.tekateki* / *.tebaklagu* (Main game dengan AI)
- *.suit batu/gunting/kertas* (Main suit denganku)
- *.halo* / *.ping* (Menyapaku)
Atau langsung chat saja, aku akan membalas dengan otak Groq-ku!`;

    setTimeout(async () => {
      msg.reply(teksMenu);
      await setTyping(msg, false);
    }, delayWaktu);
  }

  // === FITUR DOWNLOADER TIKTOK ===
  else if (msg.body.toLowerCase().startsWith('.tiktok')) {
    const link = msg.body.split(' ')[1];
    if (!link) return msg.reply('Linknya mana bodoh?!');
    msg.reply('Ck, bawel banget sih. Bentar, aku ambilin videonya.');
    try {
      const apiUrl1 = `https://api.tikmate.app/api/lookup?url=${link}`;
      const response1 = await axios.get(apiUrl1);
      const media = await MessageMedia.fromUrl(`https://tikmate.app/download/${response1.data.id}.mp4`);
      await client.sendMessage(msg.from, media, { caption: 'Ini videonya. Puas?!' });
    } catch (error1) {
      try {
        const apiUrl2 = `https://api.aemt.me/download/tiktok?url=${link}`;
        const response2 = await axios.get(apiUrl2);
        const media = await MessageMedia.fromUrl(response2.data.result.nowm);
        await client.sendMessage(msg.from, media, { caption: 'Tuh! Untung mesin keduaku jalan.' });
      } catch (error2) {
        msg.reply('Gagal Total! Kedua mesinku gagal mengambil video itu.');
      }
    }
  }

  // === FITUR DOWNLOADER INSTAGRAM ===
  else if (msg.body.toLowerCase().startsWith('.ig')) {
    const link = msg.body.split(' ')[1];
    if (!link) return msg.reply('Link IG-nya mana?');
    msg.reply('Sabar! IG itu pelit ngasih data...');
    try {
      const apiUrl = `https://api.aemt.me/download/igdl?url=${link}`;
      const response = await axios.get(apiUrl);
      const media = await MessageMedia.fromUrl(response.data.result[0].url);
      await client.sendMessage(msg.from, media, { caption: 'Nih videonya!' });
    } catch (error) {
      msg.reply('Gagal! Entah API-nya lagi mati atau videonya diprivate.');
    }
  }

  // === FITUR DOWNLOADER YOUTUBE ===
  else if (msg.body.toLowerCase().startsWith('.yt')) {
    const link = msg.body.split(' ')[1];
    if (!link) return msg.reply('Link YouTubenya mana?')
    msg.reply('Lagi ngambil videonya...');
    try {
      if (!ytdl.validateURL(link)) return msg.reply('Itu bukan link YouTube yang valid!');
      const info = await ytdl.getInfo(link);
      const format = ytdl.chooseFormat(info.formats, { quality: 'highestvideo' });
      const media = await MessageMedia.fromUrl(format.url);
      await client.sendMessage(msg.from, media, { caption: 'Berhasil pakai mesin utama. Udah tuh!' });
    } catch (error1) {
      try {
        const response = await axios.get(`https://api.aemt.me/download/ytdl?url=${link}`);
        const media = await MessageMedia.fromUrl(response.data.result.url);
        await client.sendMessage(msg.from, media, { caption: 'Nih dari mesin cadanganku.' });
      } catch (error2) {
        msg.reply('Gagal Total! Videonya kegedean atau diblokir YouTube.');
      }
    }
  }

  // === FITUR DOWNLOADER MUSIK (MP3) ===
  else if (msg.body.toLowerCase().startsWith('.mp3')) {
    const link = msg.body.split(' ')[1];
    if (!link) return msg.reply('Link lagunya mana?');
    msg.reply('Lagi download lagunya...');
    try {
      if (!ytdl.validateURL(link)) return msg.reply('Itu bukan link YouTube!');
      const info = await ytdl.getInfo(link);
      const format = ytdl.chooseFormat(info.formats, { filter: 'audioonly' });
      const media = await MessageMedia.fromUrl(format.url);
      await client.sendMessage(msg.from, media, { sendAudioAsVoice: true });
      msg.reply('Udah tuh audionya!');
    } catch (error1) {
      try {
        const response = await axios.get(`https://api.aemt.me/download/ytmp3?url=${link}`);
        const media = await MessageMedia.fromUrl(response.data.result.url);
        await client.sendMessage(msg.from, media, { sendAudioAsVoice: true });
        msg.reply('Audionya berhasil diambil dari cadangan!');
      } catch (error2) {
        msg.reply('Gagal mengambil lagu.');
      }
    }
  }

  // === FITUR GAME AI GROQ ===
  else if (msg.body.toLowerCase() === '.kuis' || msg.body.toLowerCase() === '.tekateki' || msg.body.toLowerCase() === '.tebaklagu') {
    try {
      await setTyping(msg, true);
      if (!userChats.has(msg.from)) userChats.set(msg.from, []);
      let history = userChats.get(msg.from);
      let promptGame = "RA, ayo main cerdas cermat! Beri aku pertanyaan sulit!";
      if (msg.body.toLowerCase() === '.tekateki') promptGame = "RA, berikan aku 1 teka-teki logika yang menjebak!";
      if (msg.body.toLowerCase() === '.tebaklagu') promptGame = "RA, ayo main tebak lagu! Beri aku lirik acak dan biar aku tebak.";
      
      history.push({ role: "user", content: promptGame });
      
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: "Kamu adalah 'RA', bot tsundere. Kamu akan memberikan soal permainan sesuai permintaan." },
          ...history
        ],
        model: "mixtral-8x7b-32768", // Model Groq yang stabil dan cepat
      });
      
      const jawabanAI = chatCompletion.choices[0]?.message?.content;
      history.push({ role: "assistant", content: jawabanAI });
      
      setTimeout(async () => { 
        msg.reply(jawabanAI); 
        await setTyping(msg, false);
      }, delayWaktu);
    } catch (error) {
      msg.reply('Lagi males mikir game-nya!');
    }
  }

  // === MINI GAME SUIT ===
  else if (msg.body.toLowerCase().startsWith('.suit')) {
    await setTyping(msg, true);
    const pilihanUser = msg.body.toLowerCase().split(' ')[1];
    const pilihanRA = ['batu', 'gunting', 'kertas'][Math.floor(Math.random() * 3)];
    
    if (!pilihanUser || !['batu', 'gunting', 'kertas'].includes(pilihanUser)) {
      setTimeout(async () => { 
        msg.reply('Ketik .suit batu, .suit gunting, atau .suit kertas yang bener!'); 
        await setTyping(msg, false);
      }, delayWaktu);
      return;
    }
    
    let hasil = pilihanUser === pilihanRA ? 'Seri!' : ((pilihanUser === 'batu' && pilihanRA === 'gunting') || (pilihanUser === 'gunting' && pilihanRA === 'kertas') || (pilihanUser === 'kertas' && pilihanRA === 'batu')) ? 'Cih, kamu menang.' : 'Bwahaha! Aku menang!';
    
    setTimeout(async () => { 
      msg.reply(`Kamu: ${pilihanUser}\nRA: ${pilihanRA}\n\nHasil: ${hasil}`); 
      await setTyping(msg, false);
    }, delayWaktu);
  }

  // === FITUR CHAT AI GROQ DENGAN MEMORI ===
  else if (!msg.hasMedia) {
    try {
      await setTyping(msg, true);
      if (!userChats.has(msg.from)) {
        userChats.set(msg.from, []);  
      }
      
      let history = userChats.get(msg.from);
      history.push({ role: "user", content: msg.body });
      
      if (history.length > 10) history.shift();
      
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { 
            role: "system", 
            content: "Kamu adalah 'RA', seorang gadis anime tsundere pemarah yang ahli pemrograman, tapi sebenarnya peduli." 
          },
          ...history
        ],
        model: "mixtral-8x7b-32768", // Model Groq yang stabil dan cepat
      });
      
      const jawabanAI = chatCompletion.choices[0]?.message?.content;
      history.push({ role: "assistant", content: jawabanAI });
      
      setTimeout(async () => {
        msg.reply(jawabanAI);
        await setTyping(msg, false);
      }, delayWaktu);
      
    } catch (error) {
      console.error('Error Groq AI:', error);
      msg.reply('A-aduh, otak Groq-ku lagi konslet!');
    }
  }
});

client.initialize();