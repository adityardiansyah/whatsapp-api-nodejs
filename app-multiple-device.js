const { Client, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode');
const socketIO = require('socket.io');
const fs = require('fs');
const http = require('http');
const { phoneNumberFormatter } = require('./helpers/formatter');
const axios = require('axios');
const { response } = require('express');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.get('/', (req, res) => {
    res.sendFile('index-multiple-device.html', {root:__dirname});
})


const createSession = function(id, description, io){
    const SESSION_FILE_PATH = `./whatsapp-session-${id}.json`;
    let sessionCfg;
    if (fs.existsSync(SESSION_FILE_PATH)) {
        sessionCfg = require(SESSION_FILE_PATH);
    }
    const client = new Client({ 
        puppeteer: { 
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process', // <- this one doesn't works in Windows
                '--disable-gpu'
            ],
        }, 
        session: sessionCfg 
    });

    client.on('qr', (qr) => {
        console.log('QR RECEIVED', qr);
        qrcode.toDataURL(qr, (err, url) => {
            io.emit('qr', url);
            io.emit('message','QR Code received, scan please!');
        })
    });

    client.on('ready', () => {
        io.emit('ready', {id: id});
        io.emit('message',{id: id, text: 'Whatsapp is ready'});
    });

    client.on('auth_failure', () => {
        io.emit('message',{id: id, text: 'Auth Failure, restarting ...'});
    })

    client.on('authenticated', (session) => {
        io.emit('authenticated',{id:id});
        io.emit('message', {id: id, text:'Whatsapp is authenticated'});
        console.log('AUTHENTICATED', session);

        sessionCfg=session;
        fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
            if (err) {
                console.error(err);
            }
        });
        client.destroy();
        client.initialize();
    });
}


io.on('connection', function(socket){
    socket.on('create-session', function(data){
        console.log('Create Session '+data.id);
        createSession(data.id, data.description, io);
    })
});
// io.on('connection', function(socket){
//     socket.emit('message', 'connecting...');

//     client.on('qr', (qr) => {
//         console.log('QR RECEIVED', qr);
//         qrcode.toDataURL(qr, (err, url) => {
//             socket.emit('qr', url);
//             socket.emit('message','QR Code received, scan please!');
//         })
//     });

//     client.on('ready', () => {
//         socket.emit('ready','Whatsapp is ready');
//         socket.emit('message','Whatsapp is ready');
//     });

//     client.on('authenticated', (session) => {
//         socket.emit('authenticated','Whatsapp is authenticated');
//         socket.emit('message','Whatsapp is authenticated');
//         console.log('AUTHENTICATED', session);

//         sessionCfg=session;
//         fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
//             if (err) {
//                 console.error(err);
//             }
//         });
//     });
// })

// send message
app.post('/send-message', (req, res) => {
    client.sendMessage(number, message).then(response => {
        res.status(200).json({
            status: true,
            response: response
        })
    }).catch(err => {
        res.status(500).json({
            status: false,
            response: err
        })
    })
})

server.listen(8000, function(){
    console.log("App running on port 8000");
})