const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Message = require('./models/Message');
const ws = require('ws');
const fs = require('fs');

dotenv.config();
mongoose.connect(process.env.MONGO_URL);
    
const jsonSecret = process.env.JSON_SECRET;
const bcryptSalt = bcrypt.genSaltSync(10);


const app = express();
app.use('/Uploads', express.static(__dirname + '/Uploads'));
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    credentials:true,
    origin: process.env.CLIENT_URL,
}));

async function getUserDataFromRequest(req) {
    return new Promise((resolve, reject) =>{
        const token = req.cookies?.token;
        if(token){
            jwt.verify(token, jsonSecret, {}, (err, userData) =>{
                if(err) throw err;
                resolve(userData);
            });
        }else{
            reject('no token');
        }
    });
}

app.get('/test', (req,res) =>{
    res.json('test ok');
});


//GET request which differentiates between who a sender and recipient are id-wise
app.get('/messages/:userId', async(req,res) =>{
    const {userId} = req.params;
    const userData = await getUserDataFromRequest(req);
    const ourUserId = userData.userId;
    const messages = await Message.find({
        sender: {$in:[userId, ourUserId]},
        recipient:{$in:[userId, ourUserId]},
    }).sort({createdAt: 1});
    res.json(messages);
});

app.get('/people', async (req,res) =>{
   const users = await User.find({}, {'_id': 1, username:1});
   res.json(users);
});

app.get('/profile', (req,res) =>{
    const token = req.cookies?.token;
    if(token){
    jwt.verify(token,jsonSecret,{},(err, userData) =>{
        if(err) throw err;
        res.json(userData);
    });
}else{
    res.status(401).json('no token');
}
});


//POST request for Login of username/password
app.post('/login',async (req,res) =>{
    const {username, password} = req.body;
    const foundUser = await User.findOne({username});
    if (foundUser){
       const passOk = bcrypt.compareSync(password, foundUser.password);
       if(passOk){
        jwt.sign({userId:createdUser._id,username}, jsonSecret, {}, (err,token) =>{
            res.cookie('token', token, {sameSite:'none', secure:true}).json({
            id: foundUser._id,
        });
       });
       }
    }
});


//POST request for registration 

app.post('/register', async (req,res) =>{
    const {username, password} = req.body;
    try{
        const hashedPassword = bcrypt.hashSync(password, bcryptSalt)
        const createUser = await User.create({
            username:username, 
            password:hashedPassword,
        });
        
        jwt.sign({userId: createUser._id, username}, jsonSecret,{}, (err, token) => {
            if (err) throw err;
            res.cookie('token', token, {sameSite:'none', secure:true}).status(201).json({
                id: createUser._id,
            });
            
        });

    }catch(err){
        if(err) throw err;
        res.status(500).json('error');

    }
});
    

    
 



//WebSocketServer logic


const server = app.listen(5173);

const wss=new ws.WebSocketServer({server});

wss.on('connection',(connection, req) =>{

    function notifyAboutOnline(){
        [...wss.clients].forEach(client =>{
            client.send(JSON.stringify({
                online: [...wss.clients].map(c => ({userId:c.userId, username:c.username})),
            }));
        });
    }

    connection.isAlive = true;

    //Clear offline or dead connections

    connection.timer = setInterval(() =>{
        connection.ping();
        connection.deathTimer = setTimeout(() =>{
            connection.isAlive = false;
            clearInterval(connection.timer);
            connection.terminate();
            notifyAboutOnline();
            console.log('dead');
        }, 1000);
    }, 5000);

    connection.on('pong', () =>{
        clearTimeout(connection.deathTimer);
    });

    //read user and id from the cookie for this connection
 const cookies = req.headers.cookie;
 if (cookies){
    const tokenCookieString = cookies.split(';').find(str => str.startsWith("token="));
    if(tokenCookieString){
        const token = tokenCookieString.split('=')[1];
        if(token){
            jwt.verify(token,jsonSecret,{},(error,userData) =>{
                if(err) throw err;
                const {userId,username} = userData;
                connection.userId = userId;
                connection.username = username;


            });
        }
    }
 }    

 //Logic for sending messages from one connection to another.

 connection.on('message',async (message) => {
    const messageData = JSON.parse(message.toString());
    const {recipient, text} = messageData;
    let filename = null;
    if(file){
        const parts = file.name.split('.');
        const ext = parts[parts.length -1];
        filename = Date.now() + '.' + ext;
        const path = __dirname + '/Uploads/' + filename;
        const bufferData = new Buffer(file.data.split('.')[1], 'base64');

        fs.writeFile(path,bufferData, () =>{
            console.log('file saved: ' +path);
        });
    }
    
    
    if(recipient && (text || file)){
       const messageDoc = await Message.create({
            sender: connection.userId,
            recipient,
            text,
            file: file ? filename : null,
        });
        [...wss.clients]
        .filter(c=>c.userId === recipient)
        .forEach(c=>c.send(JSON.stringify({
            text, 
            sender: connection.userId,
            recipient,
            file: file ? filename: null ,
            _id: messageDoc._id,

        })));
    }
    
 });

 //notify everyone about online people(when new connection)
[...wss.clients].forEach(client => {
    client.send(JSON.stringify({
      online:  [...wss.clients].map(c => ({userId:c.userId,username:c.username}))
    }));
});
});

wss.on('close', data=>{
    console.log('close',data);
});



//DB Pass: fzhQw778tOHjuY7r