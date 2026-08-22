require('dotenv').config(); 
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; 

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const Groq = require('groq-sdk'); 
const axios = require('axios'); 
const ytdl = require('@distube/ytdl-core'); 

// 1. KUNCI API GROQ
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// === TEMPAT MENYIMPAN INGATAN (RIWAYAT CHAT) ===
const userChats = new Map();

// 2. PENGATURAN CLIENT (Otomatis deteksi Docker Railway)
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

// Menampilkan QR Code di terminal
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

// Status Bot Siap
client.on('ready', () => {
    console.log('=========================================');
    console.log(' BOT RA (GROQ LLAMA + TYPING DELAY) AKTIF!');
    console.log('=========================================');
});

// 3. MEMBACA PESAN MASUK
client.on('message', async msg => {
    if (msg.from === 'status@broadcast') return;
    
    // Jeda balasan acak (3-5 detik) agar terlihat alami
    const delayWaktu = Math.floor(Math.random() * 2000) + 3000;

    // === FITUR STIKER ===
    if (msg.hasMedia && msg.body.toLowerCase() === '.stiker') {
        try {
            const chat = await msg.getChat();
            chat.sendStateTyping();
            
            const media = await msg.downloadMedia();
            if (media.mimetype.includes('image')) {
                msg.reply('Tunggu sebentar! Jangan cerewet, ini lagi dibikin stikernya!');
                await client.sendMessage(msg.from, media, {
                    sendMediaAsSticker: true,
                    stickerName: 'Stiker buatan RA',
                    stickerAuthor: 'Hanya milik RA'
                });
            } else {
                msg.reply('Hmph, itu bukan gambar bodoh! Kirim gambar aja!');
            }
            chat.clearState();
        } catch (error) {
            console.log('Eror stiker:', error);
            msg.reply('Ck, sistem download gambarku lagi diblokir!');
        }
    }

    // === FITUR PERINTAH BIASA ===
    else if (msg.body.toLowerCase() === '.halo') {
        const chat = await msg.getChat();
        chat.sendStateTyping();
        setTimeout(() => { 
            msg.reply('Apa?! Ngapain sapa-sapa aku?!'); 
            chat.clearState();
        }, delayWaktu);
    }
    else if (msg.body.toLowerCase() === '.ping') {
        const chat = await msg.getChat();
        chat.sendStateTyping();
        setTimeout(() => { 
            msg.reply('Pong! Berisik tau, aku lagi sibuk!'); 
            chat.clearState();
        }, delayWaktu);
    }

    // === MENU BANTUAN ===
    else if (msg.body.toLowerCase() === '.menu' || msg.body.toLowerCase() === '.help') {
        const chat = await msg.getChat();
        chat.sendStateTyping();
        const teksMenu = `*=== 🤖 DAFTAR PERINTAH RA (GROQ) 🤖 ===*\n\nJangan harap aku bakal ngajarin kamu dua kali ya!\n\n💬 *Chat & Interaksi*\n*.halo* : Nyapa RA\n*.ping* : Cek status RA\n*.stiker* : Bikin stiker WA dari gambar.\n\n🎮 *Mini Games AI*\n*.kuis* : Soal cerdas cermat.\n*.tekateki* : Teka-teki logika.\n*.tebaklagu* : Uji wawasan musik.\n*.suit* [batu/gunting/kertas] : Main suit lawan RA.\n\n📥 *Super Downloader*\n*.tiktok* [link] : Download TikTok (TikMate + AEMT).\n*.ig* [link] : Download IG Reels.\n*.yt* [link] : Download YouTube MP4 (2 Lapis).\n*.mp3* [link] : Download Musik YouTube MP3 (2 Lapis).\n\n💡 *Catatan:* Otakku sekarang pakai Groq (Llama), jadi jauh lebih ngebut!`;
        setTimeout(() => { 
            msg.reply(teksMenu); 
            chat.clearState();
        }, delayWaktu);
    }

    // === FITUR DOWNLOADER TIKTOK ===
    else if (msg.body.toLowerCase().startsWith('.tiktok')) {
        const link = msg.body.split(' ')[1];
        if (!link) {
            setTimeout(() => { msg.reply('Linknya mana bodoh?!') }, delayWaktu);
            return;
        }
        msg.reply('Ck, bawel banget sih. Bentar, aku ambilin videonya...');
        
        try {
            const apiUrl1 = `https://api.tikmate.app/api/lookup?url=${link}`;
            const response1 = await axios.get(apiUrl1);
            const videoUrl1 = `https://tikmate.app/download/${response1.data.id}.mp4`;
            
            const media = await MessageMedia.fromUrl(videoUrl1);
            await client.sendMessage(msg.from, media, { caption: 'Nih videonya!' });
        } catch (error1) {
            try {
                const apiUrl2 = `https://api.aemt.me/download/tiktok?url=${link}`;
                const response2 = await axios.get(apiUrl2);
                const media = await MessageMedia.fromUrl(response2.data.result.nowm);
                await client.sendMessage(msg.from, media, { caption: 'Nih videonya (Cadangan AEMT)!' });
            } catch (error2) {
                msg.reply('Gagal Total! Kedua mesinku gagal mengambil video TikTok-nya.');
            }
        }
    }

    // === FITUR DOWNLOADER INSTAGRAM ===
    else if (msg.body.toLowerCase().startsWith('.ig')) {
        const link = msg.body.split(' ')[1];
        if (!link) {
            setTimeout(() => { msg.reply('Link IG-nya mana?') }, delayWaktu);
            return;
        }
        msg.reply('Sabar! IG itu pelit ngasih data...');
        
        try {
            const apiUrl = `https://api.aemt.me/download/igdl?url=${link}`;
            const response = await axios.get(apiUrl);
            const media = await MessageMedia.fromUrl(response.data.result[0].url);
            await client.sendMessage(msg.from, media, { caption: 'Nih, IG Reels kamu!' });
        } catch (error) {
            msg.reply('Gagal! Entah API-nya lagi mati atau videonya di-private.');
        }
    }

    // === FITUR DOWNLOADER YOUTUBE ===
    else if (msg.body.toLowerCase().startsWith('.yt')) {
        const link = msg.body.split(' ')[1];
        if (!link) {
            setTimeout(() => { msg.reply('Link YouTubenya mana?') }, delayWaktu);
            return;
        }
        msg.reply('Lagi ngambil videonya...');
        
        try {
            if (!ytdl.validateURL(link)) return msg.reply('Itu bukan link YouTube!');
            const info = await ytdl.getInfo(link);
            const format = ytdl.chooseFormat(info.formats, { quality: 'highest', filter: 'audioandvideo' });
            
            const media = await MessageMedia.fromUrl(format.url);
            await client.sendMessage(msg.from, media, { caption: 'Nih videonya!' });
        } catch (error1) {
            try {
                const apiUrl = `https://api.aemt.me/download/ytdl?url=${link}`;
                const response = await axios.get(apiUrl);
                const media = await MessageMedia.fromUrl(response.data.result.mp4);
                await client.sendMessage(msg.from, media, { caption: 'Nih videonya (Cadangan AEMT)!' });
            } catch (error2) {
                msg.reply('Gagal Total! Videonya kegedean atau di-private.');
            }
        }
    }

    // === FITUR DOWNLOADER MUSIK (MP3) ===
    else if (msg.body.toLowerCase().startsWith('.mp3')) {
        const link = msg.body.split(' ')[1];
        if (!link) {
            setTimeout(() => { msg.reply('Link lagunya mana?') }, delayWaktu);
            return;
        }
        msg.reply('Lagi download lagunya...');
        
        try {
            if (!ytdl.validateURL(link)) return msg.reply('Itu bukan link YouTube!');
            const info = await ytdl.getInfo(link);
            const format = ytdl.chooseFormat(info.formats, { filter: 'audioonly' });
            
            const media = await MessageMedia.fromUrl(format.url);
            await client.sendMessage(msg.from, media, { sendAudioAsVoice: false });
            msg.reply('Udah tuh audionya!');
        } catch (error1) {
            try {
                const apiUrl = `https://api.aemt.me/download/ytdl?url=${link}`;
                const response = await axios.get(apiUrl);
                const media = await MessageMedia.fromUrl(response.data.result.mp3);
                await client.sendMessage(msg.from, media, { sendAudioAsVoice: false });
                msg.reply('Audionya berhasil diambil dari cadangan!');
            } catch (error2) {
                msg.reply('Gagal mengambil lagu.');
            }
        }
    }

    // === FITUR GAME AI GROQ ===
    else if (msg.body.toLowerCase() === '.kuis' || msg.body.toLowerCase() === '.tekateki' || msg.body.toLowerCase() === '.tebaklagu') {
        try {
            const chat = await msg.getChat();
            chat.sendStateTyping();

            if (!userChats.has(msg.from)) userChats.set(msg.from, []);
            let history = userChats.get(msg.from);

            let promptGame = "RA, ayo main cerdas cermat! Berikan aku 1 pertanyaan singkat.";
            if (msg.body.toLowerCase() === '.tekateki') promptGame = "RA, berikan aku 1 teka-teki logika yang susah.";
            if (msg.body.toLowerCase() === '.tebaklagu') promptGame = "RA, berikan 1 penggalan lirik lagu populer untuk aku tebak.";

            history.push({ role: "user", content: promptGame });

            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    { role: "system", content: "Kamu adalah 'RA', asisten virtual tsundere yang cerdas." },
                    ...history
                ],
                model: "llama3-8b-8192", 
            });

            const jawabanAI = chatCompletion.choices[0]?.message?.content || "Hmm...";
            history.push({ role: "assistant", content: jawabanAI });
            
            setTimeout(() => { 
                msg.reply(jawabanAI); 
                chat.clearState();
            }, delayWaktu);
        } catch (error) {
            msg.reply('Lagi males mikir game-nya!');
        }
    }

    // === MINI GAME SUIT ===
    else if (msg.body.toLowerCase().startsWith('.suit')) {
        const chat = await msg.getChat();
        chat.sendStateTyping();
        
        const pilihanUser = msg.body.toLowerCase().split(' ')[1];
        const pilihanRA = ['batu', 'gunting', 'kertas'][Math.floor(Math.random() * 3)];
        
        if (!pilihanUser || !['batu', 'gunting', 'kertas'].includes(pilihanUser)) {
            setTimeout(() => { 
                msg.reply('Ketik .suit batu, .suit gunting, atau .suit kertas!'); 
                chat.clearState();
            }, delayWaktu);
            return;
        }
        
        let hasil = pilihanUser === pilihanRA ? 'Seri!' : ((pilihanUser === 'batu' && pilihanRA === 'gunting') || (pilihanUser === 'gunting' && pilihanRA === 'kertas') || (pilihanUser === 'kertas' && pilihanRA === 'batu')) ? 'Cih... kamu menang.' : 'Bwahaha! Aku menang!';
        
        setTimeout(() => { 
            msg.reply(`Kamu: ${pilihanUser}\nRA: ${pilihanRA}\n\n${hasil}`); 
            chat.clearState();
        }, delayWaktu);
    }

    // === FITUR CHAT AI GROQ DENGAN MEMORI ===
    else if (!msg.hasMedia) {
        try {
            const chat = await msg.getChat();
            chat.sendStateTyping();

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
                        content: "Kamu adalah 'RA', seorang asisten virtual tsundere. Jawab dengan gaya ketus tapi tetap diam-diam perhatian dan membantu." 
                    },
                    ...history
                ],
                model: "llama3-8b-8192",
            });

            const jawabanAI = chatCompletion.choices[0]?.message?.content || "Hah?!";
            history.push({ role: "assistant", content: jawabanAI });

            setTimeout(() => {
                msg.reply(jawabanAI);
                chat.clearState();
            }, delayWaktu);

        } catch (error) {
            console.error('Error Groq AI:', error);
            msg.reply('A-aduh, otak Groq-ku lagi konslet!');
        }
    }
});

client.initialize();