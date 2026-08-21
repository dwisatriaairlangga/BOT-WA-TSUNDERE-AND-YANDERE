require('dotenv').config(); 
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; 

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios'); 
const ytdl = require('@distube/ytdl-core'); 

// 1. KUNCI API GEMINI 
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// === TEMPAT MENYIMPAN INGATAN ===
const userChats = new Map();

// 2. PENGATURAN CLIENT (Otomatis deteksi Laptop vs Railway)
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
       executablePath: process.platform === 'win32' ? undefined : (process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium'), 
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

// Menampilkan QR
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

// Bot Siap
client.on('ready', () => {
    console.log('=========================================');
    console.log(' BOT RA (INGATAN + GAMES + TIKTOK 2-LAYER) AKTIF!');
    console.log('=========================================');
});

// 3. MEMBACA PESAN MASUK
client.on('message', async msg => {
    if (msg.from === 'status@broadcast') return;
    
    const delayWaktu = Math.floor(Math.random() * 2000) + 3000;

    // === FITUR STIKER ===
    if (msg.hasMedia && msg.body.toLowerCase() === '.stiker') {
        try {
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
        } catch (error) {
            console.log('Eror stiker:', error);
            msg.reply('Ck, sistem download gambarku lagi diblokir!');
        }
    }

    // === FITUR PERINTAH BIASA ===
    else if (msg.body.toLowerCase() === '.halo') {
        setTimeout(() => { msg.reply('Apa?! Ngapain sapa-sapa aku?!') }, delayWaktu);
    }
    else if (msg.body.toLowerCase() === '.ping') {
        setTimeout(() => { msg.reply('Pong! Berisik tau, aku lagi sibuk!') }, delayWaktu);
    }

    // === MENU BANTUAN (DIPERBARUI) ===
    else if (msg.body.toLowerCase() === '.menu' || msg.body.toLowerCase() === '.help') {
        const teksMenu = `*=== 🤖 DAFTAR PERINTAH RA 🤖 ===*\n\nJangan harap aku bakal ngajarin kamu dua kali ya!\n\n💬 *Chat & Interaksi*\n*.halo* : Nyapa RA (Resiko ditanggung sendiri)\n*.ping* : Cek status RA\n*.stiker* : Kirim gambar lalu kasih caption .stiker buat bikin stiker WA.\n\n🎮 *Mini Games AI*\n*.kuis* : RA bakal ngasih soal cerdas cermat.\n*.tekateki* : RA bakal ngasih kamu teka-teki logika.\n*.tebaklagu* : Uji wawasan musikmu bareng RA.\n*.suit* [batu/gunting/kertas] : Ayo lawan aku kalau berani!\n\n📥 *Super Downloader*\n*.tiktok* [link] : Download video TikTok (TikMate + AEMT Backup).\n*.ig* [link] : Download video/reels Instagram.\n*.yt* [link] : Download video YouTube (NPM + API Backup).\n*.mp3* [link] : Download musik YouTube (NPM + API Backup).\n\n💡 *Catatan:* Selain perintah di atas, kamu bisa ngobrol langsung sama aku kayak biasa. Udah sana pakai!`;
        setTimeout(() => { msg.reply(teksMenu); }, delayWaktu);
    }

    // === FITUR DOWNLOADER TIKTOK (2 LAPIS: TIKMATE + AEMT) ===
    else if (msg.body.toLowerCase().startsWith('.tiktok')) {
        const link = msg.body.split(' ')[1];
        if (!link) {
            setTimeout(() => { msg.reply('Linknya mana bodoh?!') }, delayWaktu);
            return;
        }
        msg.reply('Ck, bawel banget sih. Bentar, aku ambilin videonya dengan 2 mesin cadangan...');
        
        try {
            // LAPIS 1: MENGGUNAKAN API TIKMATE
            const apiUrl1 = `https://api.tikmate.app/api/lookup?url=${link}`;
            const response1 = await axios.get(apiUrl1);
            const videoUrl1 = `https://tikmate.app/download/${response1.data.id}.mp4`;
            
            const media = await MessageMedia.fromUrl(videoUrl1);
            await client.sendMessage(msg.from, media, { caption: 'Nih videonya (Mesin TikMate)! Jangan bilang makasih!' });

        } catch (error1) {
            try {
                // LAPIS 2: MENGGUNAKAN API AEMT
                const apiUrl2 = `https://api.aemt.me/download/tiktok?url=${link}`;
                const response2 = await axios.get(apiUrl2);
                const videoUrl2 = response2.data.result.nowm; 
                
                const media = await MessageMedia.fromUrl(videoUrl2);
                await client.sendMessage(msg.from, media, { caption: 'Mesin utama error, tapi lapis cadangan AEMT berhasil. Nih videonya!' });

            } catch (error2) {
                msg.reply('Gagal Total! Kedua mesinku gagal mengambil video TikTok-nya, mungkin link-nya salah atau privat!');
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
        msg.reply('Sabar! IG itu pelit ngasih data, jadi agak lama...');
        
        try {
            const apiUrl = `https://api.aemt.me/download/igdl?url=${link}`;
            const response = await axios.get(apiUrl);
            const mediaUrl = response.data.result[0].url;
            
            const media = await MessageMedia.fromUrl(mediaUrl);
            await client.sendMessage(msg.from, media, { caption: 'Nih, IG Reels kamu!' });
        } catch (error) {
            msg.reply('Gagal! Entah API-nya lagi mati, atau videonya di-private!');
        }
    }

    // === FITUR DOWNLOADER YOUTUBE (2 LAPIS) ===
    else if (msg.body.toLowerCase().startsWith('.yt')) {
        const link = msg.body.split(' ')[1];
        if (!link) {
            setTimeout(() => { msg.reply('Link YouTubenya mana?') }, delayWaktu);
            return;
        }
        
        msg.reply('Ck, bawel! Aku siapkan 2 mesin cadangan. Tunggu bentar!');
        
        try {
            if (!ytdl.validateURL(link)) return msg.reply('Hmph! Itu bukan link YouTube!');
            const info = await ytdl.getInfo(link);
            const format = ytdl.chooseFormat(info.formats, { quality: 'highest', filter: 'audioandvideo' });
            
            const media = await MessageMedia.fromUrl(format.url);
            await client.sendMessage(msg.from, media, { caption: 'Berhasil pakai mesin utama NPM! Nih videonya!' });
        } catch (error1) {
            try {
                const apiUrl = `https://api.aemt.me/download/ytdl?url=${link}`;
                const response = await axios.get(apiUrl);
                const media = await MessageMedia.fromUrl(response.data.result.mp4);
                await client.sendMessage(msg.from, media, { caption: 'Mesin utama error, tapi API AEMT berhasil. Nih!' });
            } catch (error2) {
                msg.reply('Gagal Total! Kedua mesinku tumbang semua, kemungkinan videonya di-private atau kegedean!');
            }
        }
    }

    // === FITUR DOWNLOADER MUSIK YOUTUBE (2 LAPIS) ===
    else if (msg.body.toLowerCase().startsWith('.mp3')) {
        const link = msg.body.split(' ')[1];
        if (!link) {
            setTimeout(() => { msg.reply('Link lagunya mana?') }, delayWaktu);
            return;
        }
        
        msg.reply('Ck, iya iya ini lagi di-download lagunya (2 Lapis Mesin)...');
        
        try {
            if (!ytdl.validateURL(link)) return msg.reply('Itu bukan link YouTube!');
            const info = await ytdl.getInfo(link);
            const format = ytdl.chooseFormat(info.formats, { filter: 'audioonly' });
            
            const media = await MessageMedia.fromUrl(format.url);
            await client.sendMessage(msg.from, media, { sendAudioAsVoice: false });
            msg.reply('Berhasil pakai mesin utama. Udah tuh audionya!');
        } catch (error1) {
            try {
                const apiUrl = `https://api.aemt.me/download/ytdl?url=${link}`;
                const response = await axios.get(apiUrl);
                const media = await MessageMedia.fromUrl(response.data.result.mp3);
                await client.sendMessage(msg.from, media, { sendAudioAsVoice: false });
                msg.reply('Mesin 1 error, Lapis 2 (AEMT) berhasil. Jangan dengerin keras-keras!');
            } catch (error2) {
                msg.reply('Gagal Total! Susah banget sih ngambil lagunya!');
            }
        }
    }

    // === FITUR GAME AI & LOGIKA ===
    else if (msg.body.toLowerCase() === '.kuis') {
        try {
            if (!userChats.has(msg.from)) userChats.set(msg.from, genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }).startChat({ history: [] }));
            const chatSesi = userChats.get(msg.from);
            msg.reply('Mencari soal tersulit untukmu...');
            const promptGame = "RA, ayo main cerdas cermat! Berikan aku 1 pertanyaan singkat, jangan langsung beri jawaban.";
            const result = await chatSesi.sendMessage(promptGame);
            setTimeout(() => { msg.reply(result.response.text()); }, delayWaktu);
        } catch (error) { msg.reply('Lagi males mikir soal, nanti aja ya!'); }
    }
    else if (msg.body.toLowerCase() === '.tekateki') {
        try {
            if (!userChats.has(msg.from)) userChats.set(msg.from, genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }).startChat({ history: [] }));
            const chatSesi = userChats.get(msg.from);
            msg.reply('Heh, siap-siap otakmu berasap...');
            const promptGame = "RA, berikan aku 1 teka-teki logika yang susah, tapi jangan kasih tau jawabannya.";
            const result = await chatSesi.sendMessage(promptGame);
            setTimeout(() => { msg.reply(result.response.text()); }, delayWaktu);
        } catch (error) { msg.reply('Lagi males mikir teka-teki, nanti aja!'); }
    }
    else if (msg.body.toLowerCase() === '.tebaklagu') {
        try {
            if (!userChats.has(msg.from)) userChats.set(msg.from, genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }).startChat({ history: [] }));
            const chatSesi = userChats.get(msg.from);
            msg.reply('Hmph, mari kita lihat seberapa luas seleramu...');
            const promptGame = "RA, ayo main tebak lagu! Berikan 1 penggalan lirik lagu populer dan suruh aku tebak judulnya.";
            const result = await chatSesi.sendMessage(promptGame);
            setTimeout(() => { msg.reply(result.response.text()); }, delayWaktu);
        } catch (error) { msg.reply('Playlist-ku lagi error, nanti aja!'); }
    }
    else if (msg.body.toLowerCase().startsWith('.suit')) {
        const pilihanUser = msg.body.toLowerCase().split(' ')[1];
        const pilihanRA = ['batu', 'gunting', 'kertas'][Math.floor(Math.random() * 3)];
        if (!pilihanUser || !['batu', 'gunting', 'kertas'].includes(pilihanUser)) {
            setTimeout(() => { msg.reply('Main suit yang bener bodoh! Ketik .suit batu, .suit gunting, atau .suit kertas!'); }, delayWaktu);
            return;
        }
        let hasil = '';
        if (pilihanUser === pilihanRA) {
            hasil = 'Seri! Hmph, kebetulan aja tebakan kita sama!';
        } else if (
            (pilihanUser === 'batu' && pilihanRA === 'gunting') ||
            (pilihanUser === 'gunting' && pilihanRA === 'kertas') ||
            (pilihanUser === 'kertas' && pilihanRA === 'batu')
        ) {
            hasil = 'Cih... kamu menang. Jangan besar kepala ya!';
        } else {
            hasil = 'Bwahaha! Aku menang! Sudah kuduga otakmu gampang ditebak!';
        }
        setTimeout(() => { msg.reply(`Kamu milih: *${pilihanUser}*\nAku milih: *${pilihanRA}*\n\n${hasil}`); }, delayWaktu);
    }

    // === FITUR CHAT AI DENGAN MEMORI ===
    else if (!msg.hasMedia) {
        try {
            const model = genAI.getGenerativeModel({
                model: 'gemini-2.5-flash',
                systemInstruction: "Kamu adalah 'RA', seorang asisten virtual tsundere. Jawab dengan gaya ketus tapi tetap diam-diam perhatian dan membantu."
            });

            if (!userChats.has(msg.from)) {
                const newChat = model.startChat({ history: [] });
                userChats.set(msg.from, newChat);
            }

            const chatSesi = userChats.get(msg.from);
            const result = await chatSesi.sendMessage(msg.body);
            const jawabanAI = result.response.text();

            setTimeout(() => {
                msg.reply(jawabanAI);
            }, delayWaktu);

        } catch (error) {
            console.error('Ada masalah dengan AI:', error);
            msg.reply('A-aduh, kepalaku pusing! Otak AI-ku lagi error!');
        }
    }
});

client.initialize();
