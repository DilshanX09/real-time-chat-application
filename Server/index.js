const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const { v4: UUIDv4 } = require("UUID");
const cookie = require("cookie-parser");
const multer = require("multer");
const path = require('path');
const WebSocket = require('ws');
const fs = require('fs');
const currentDate = require("./date-format/currentDate");
const database = require("./connection");
const Validator = require("./validation/AuthDataValidate");
require("dotenv").config();


/*
  * Multer Storage Configuration
  * handles file uploads for images, videos, and voice messages
  * stores files in the 'uploads' directory with a unique filename
  * used in endpoints that require file uploads
*/
const storage = multer.diskStorage({

  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});


/*
  * Multer Upload Middleware
  * configured to use the defined storage settings
  * used to handle multipart/form-data requests for file uploads
*/
const upload = multer({ storage });

const app = express();
const PORT = 5000;
const server = new WebSocket.Server({ port: 5005 });


/*
  * Express Middleware
  * serves static files from the 'uploads' directory
  * parses JSON request bodies
  * handles cookies
  * enables CORS for requests from the React front-end
  * used for general request handling in the application
  * CORS settings allow credentials and specify the front-end origin
*/
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(cookie());
app.use(cors({ origin: "http://localhost:3000", credentials: true, }));

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

function getEmailVerifyTemplate(username, email, otp) {
  const templatePath = path.json(__dirname, 'template', 'email-verify-template.html');
  let html = fs.readFileSync(templatePath, 'utf8');
  html = html.replace('{{username}}', username).replace('{{email}}', email).replace('{{OTP}}', otp);
  return html;

}

function get2FATemplate(code, email) {
  const templatePath = path.join(__dirname, 'templates', '2fa-email-template.html');
  let html = fs.readFileSync(templatePath, 'utf8');
  html = html.replace('{{OTP}}', code).replace('{{email}}', email);
  return html;
}

function generateOTP() {
  let code;
  code = Math.floor(1000 + Math.random() * 9000);
  return code;
}

database.connect((err) => {
  if (err) console.error("Error connection to the database", err);
  console.log("Connected to Mysql database");
});

const clients = new Map();


/*
  * WebSocket Server
  * handles real-time communication for chat messages, user status updates, typing indicators, and message deletions
  * manages connected clients and broadcasts relevant events to appropriate users
  * listens for various message types and performs corresponding actions
  * used for real-time chat functionality in the application
  * events: connection, message, close
  * message types: set_user_id, message, logged_status, typing, stopTyping, delete_message, updateFriendList, delivered, read
  * manages user online/offline status and notifies friends of status changes
  * updates message status (sent, delivered, read) in the database and notifies senders
  * handles file deletions when messages are deleted
  * maintains a map of connected clients for efficient message routing
  * ensures data integrity and consistency in message status updates
  * integrates with the MySQL database for persistent storage of chat data and user information
  * error handling for JSON parsing and database operations
  * scalable to support multiple concurrent users and real-time interactions
  * secure communication through WebSocket protocol
  * optimized for low latency and high throughput in message delivery
  * designed for easy integration with front-end applications
*/
server.on('connection', (socket) => {

  socket.userId = null;

  socket.on('close', () => {
    if (socket.userId) {

      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && client.userId !== socket.userId) {
          client.send(JSON.stringify({
            type: 'status',
            userId: socket.userId,
            status: 'Offline',
            LAST_LOGIN: new Date(),
          }));
        }
      });

      clients.delete(socket.userId);
      updateUserStatus(socket.userId, 'Offline');
    }
  });

  socket.on('message', async (data) => {


    try {

      const message = JSON.parse(data);

      switch (message.type) {
        case 'set_user_id':
          if (message.userId) {
            socket.userId = message.userId;
            clients.set(message.userId, socket);

            clients.forEach(client => {
              if (client.readyState === WebSocket.OPEN && client.userId !== message.userId) {
                client.send(JSON.stringify({
                  type: 'status',
                  userId: message.userId,
                  status: 'Online',
                }));
              }
            });

            updateUserStatus(message.userId, 'Online');
          }

          break;

        case 'message':
          if (message.RECEIVER) {
            const receiverSocket = clients.get(message.RECEIVER);
            if (receiverSocket && receiverSocket.readyState === WebSocket.OPEN) {
              receiverSocket.send(JSON.stringify(message));
            }
          }

          break;

        case 'logged_status':
          if (message.userId) {
            updateUserStatus(message.userId, 'Offline');
          }

          break;

        case 'typing':
        case 'stopTyping':
          if (message.to) {
            const receiverSocket = clients.get(message.to);
            if (receiverSocket && receiverSocket.readyState === WebSocket.OPEN) {
              receiverSocket.send(JSON.stringify(message));
            }
          }

          break;

        case 'delete_message':

          [message.logged_user, message.selected_user].forEach(userId => {
            const client = clients.get(userId);
            if (client && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: "delete_message",
                chat_id: message.chat_id
              }));
              deleteChat(message.chat_id, message.user, message.selected_user);
            }
          });

          break;

        case 'updateFriendList':
          if (message.from && message.to) {
            const receiver = clients.get(message.to);
            if (receiver && receiver.readyState === WebSocket.OFPEN) {
              receiver.send(JSON.stringify(message));
            }
          }

        case 'delivered':
          if (message.from && message.to && message.CHAT_ID) {
            database.query("UPDATE chat SET STATUS = ? WHERE CHAT_ID = ?", ['delivered', message.CHAT_ID], (err) => {
              if (err) return;

              const senderSocket = clients.get(message.to);
              if (senderSocket && senderSocket.readyState === WebSocket.OPEN) {
                senderSocket.send(JSON.stringify({
                  type: 'delivered',
                  CHAT_ID: message.CHAT_ID,
                  from: message.from,
                  to: message.to,
                }));
              }
            });
          }

          break;

        case 'read':

          if (message.from && message.to) {

            const updateQuery = "UPDATE chat SET STATUS = 'read' WHERE SENDER = ? AND RECEIVER = ? AND STATUS != 'read'";
            database.query(updateQuery, [message.to, message.from], (err) => {
              if (err) return;

              const selectQuery = "SELECT CHAT_ID FROM chat WHERE SENDER = ? AND RECEIVER = ? AND STATUS = 'read'";
              database.query(selectQuery, [message.to, message.from], (err, results) => {
                if (err) return;

                const senderSocket = clients.get(message.to);

                if (senderSocket && senderSocket.readyState === WebSocket.OPEN) {

                  senderSocket.send(JSON.stringify({

                    type: 'read',
                    CHAT_ID: message.CHAT_ID,
                    from: message.from,
                    to: message.to

                  }));
                }

              });
            });
          }

          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }


    const query = "SELECT CHAT_ID, SENDER FROM chat WHERE RECEIVER = ? AND STATUS = 'sent'";
    database.query(query, [socket.userId], (err, results) => {
      if (err) return;
      results.forEach(row => {
        database.query("UPDATE chat SET STATUS = 'delivered' WHERE CHAT_ID = ?", [row.CHAT_ID]);
        const senderSocket = clients.get(row.SENDER);
        if (senderSocket && senderSocket.readyState === WebSocket.OPEN) {
          senderSocket.send(JSON.stringify({
            type: 'delivered',
            CHAT_ID: row.CHAT_ID,
            from: socket.userId,
            to: row.SENDER
          }));
        }
      });
    });

  });
});

/*
  * Unread Counts Endpoint
  * request param: { userId }
  * response: [ { friendId, count } ]
  * fetches the count of unread messages grouped by sender for a specific user
  * used to display unread message counts in the chat list
*/
app.get('/api/v1/unread-counts/:userId', (req, res) => {
  const userId = req.params.userId;

  const sql = `
        SELECT SENDER as friendId, COUNT(*) as count
        FROM chat
        WHERE RECEIVER = ? AND STATUS != 'read'
        GROUP BY SENDER
    `;

  database.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching unread counts:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);

  });
});

function sendUnreadCountUpdate(receiverId, senderId) {
  database.query(
    "SELECT COUNT(*) as count FROM chat WHERE SENDER = ? AND RECEIVER = ? AND STATUS != 'read'",
    [senderId, receiverId],
    (err, results) => {
      if (err) return;
      const count = results[0].count;
      const receiverSocket = clients.get(receiverId);
      if (receiverSocket && receiverSocket.readyState === WebSocket.OPEN) {
        receiverSocket.send(JSON.stringify({
          type: "unread_count_update",
          friendId: senderId,
          count
        }));
      }
    }
  );
}


/*
  * Delete Chat Function
  * parameters: chat_id (ID of the chat message), sender (ID of the sender), receiver (ID of the receiver)
  * deletes a chat message and its associated media file if it exists
  * also updates any messages that were replying to the deleted message
  * called when a user deletes a chat message
*/
const deleteChat = (chat_id, sender, receiver) => {

  const imageSelectQuery = `SELECT IMAGE_URL FROM chat WHERE CHAT_ID = ?`;
  const imageSelectParams = [chat_id];

  const chatDeleteQuery = `DELETE FROM chat WHERE CHAT_ID = ? AND SENDER = ? AND RECEIVER = ?`;
  const chatDeleteParams = [chat_id, sender, receiver];

  const updateQuery = `UPDATE chat SET REPLAY_TO = NULL, REPLAY_MESSAGE = "Original message deleted" WHERE REPLAY_TO = ?`;
  const updateParams = [chat_id];

  database.query(imageSelectQuery, imageSelectParams, (error, results) => {

    if (error) return console.error("Database error");

    if (results.length === 0) return;

    const imageUrl = results[0].IMAGE_URL;

    if (imageUrl) {

      const filename = path.basename(imageUrl);
      const imagePath = path.join(__dirname, './uploads', filename);

      fs.unlink(imagePath, (error) => {
        if (error && error.code !== 'ENOENT') {
          console.error('Error deleting image:', error);
        }
      });

    }
  });

  database.query(chatDeleteQuery, chatDeleteParams, (error) => {

    if (error) return console.error('DB DELETE error:', error);

    database.query(updateQuery, updateParams, (error) => {

      if (error) console.error('DB UPDATE reply messages error:', err);

    }

    );
  }

  );

};

/*
  * Update User Status Function
  * parameters: userId (user ID), status (new status)
  * updates the user's status and last login time in the database
  * used when a user connects or disconnects from the WebSocket server
*/

const updateUserStatus = (userId, status) => {

  let last = currentDate();

  const query = "UPDATE `users` SET `STATUS` = ? ,`LAST_LOGIN` = ? WHERE `UUID` = ?";
  const params = [status, last, userId];

  database.query(query, params, (error) => {
    if (error) return false;
  });

  return true;

};

/*
  * Send Email Endpoint
  * request body: { email, password, username }
  * response: { response, UUID } or error message
  * handles user registration and sends verification OTP email
*/
app.post("/api/v1/send-email", (req, res) => {

  const { email, password, username } = req.body;

  if (Validator.isUsernameValid(username)) return res.json(Validator.isUsernameValid(username));
  else if (Validator.isEmailValid(email)) return res.json(Validator.isEmailValid(email));
  else if (Validator.isPasswordValid(password)) return res.json(Validator.isPasswordValid(password));

  const otp = generateOTP();
  const UUID = UUIDv4();
  const date = currentDate();

  let mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Your Convo Chat Account Verification OTP Code",
    html: getEmailVerifyTemplate(username, email, otp),
  };

  const selectQuery = "SELECT * FROM `users` WHERE `EMAIL` = ? AND `PASSWORD` = ?";
  const selectParams = [email, password];
  const insertQuery = "INSERT INTO `users` ( `UUID` , `USERNAME` ,  `EMAIL` , `PASSWORD` , `JOINED_DATE` , `VCODE` , `IS_ACTIVE` , `IS_VERIFIED` ) VALUES ( ? , ? , ? , ? , ? , ? , ? , ? )";
  const insertParams = [UUID, username, email, password, date, OTP, "true", 1];

  database.query(selectQuery, selectParams, (error, results) => {

    if (error) return res.status(500).json({ error: "Database error" });

    if (results.length === 0) {

      database.query(insertQuery, insertParams, (error) => {

        if (error) return res.status(500).json({ error: "Database error" });

        res.status(200).json({ response: "success", UUID: UUID, });
      }

      );

    } else return res.status(200).json({ err: "user already exists! Please sign in." });

  }
  );

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).send({ error: "Failed to send email" });
    }
  });

});

/*
  * Log In Endpoint
  * request body: { email, password }
  * response: { response, status, uuid } or { error }
  * handles user login, including 2FA and account verification checks
*/
app.post("/auth/api/v1/log-in", (req, res) => {

  const { email, password } = req.body;

  if (Validator.isEmailValid(email)) return res.json(Validator.isEmailValid(email));
  else if (Validator.isPasswordValid(password)) return res.json(Validator.isPasswordValid(password));

  const query = "SELECT * FROM `users` WHERE `EMAIL` = ? AND `PASSWORD` = ?";
  const params = [email, password];

  database.query(query, params, (error, results) => {

    if (error) return res.status(404).json({ error: "Database error" });

    let id = results[0].UUID;
    let email = results[0].EMAIL;
    let isVerified = results[0].IS_VERIFIED;
    let is2FA = results[0].AUTH_2FA;

    if (results.length === 1) {

      if (is2FA === 1) {

        res.status(200).json({ response: "Two Factor Authentication is enabled!", status: "2FA", uuid: id, email: email });

        var response = send2FACode(id, email);
        console.log(response);
      }

      else if (isVerified === 2) {

        res.cookie("UUID", id, { path: "/", httpOnly: false, maxAge: 30 * 24 * 60 * 60 * 1000, secure: false, });

        res.status(200).json({ response: "Authentication is Success!", status: 200, uuid: id });

      }

      else return res.json({ error: "your account is not verified!", status: "error", uuid: id, });

    } else return res.json({ error: "your email or password invalid!" });

  }

  );

});

/*
  * Resend OTP Endpoint
  * request body: { id }
  * response: { message } or error message
  * resends the OTP code to the user's email
  * used when the user requests to resend the OTP during verification
*/
app.post('/api/v1/resend-otp', (req, res) => {

  let email;

  const { id } = req.body;

  if (!id) return "Somthing went wrong.. Please try again later..";

  const selectQuery = "SELECT EMAIL FROM `users` WHERE `UUID` = ?";
  const selectParams = [id];

  database.query(selectQuery, selectParams, (error, results) => {

    if (error) return res.status(404).json({ error: "Database error" });

    if (results.length === 0) return res.status(404).json({ error: "User not found" });

    email = results[0].EMAIL;

    send2FACode(id, email);

  });


});


/*
  * Send 2FA Code Function
  * parameters: id (user ID), email (user email)
  * generates a 2FA OTP code, updates it in the database, and sends it via email
  * used during the login process when 2FA is enabled
*/
function send2FACode(id, email) {

  const otp = generateOTP();

  console.log(otp)
  console.log(id)
  console.log(email)

  const query = "UPDATE `users` SET `VCODE` = ? WHERE `UUID` = ?";
  const params = [otp, id];

  database.query(query, params, (error) => {

    if (error) return "Database error";

    let mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Convo Chat Two Factor Authentication",
      html: get2FATemplate(otp, email),
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) console.log("Email sending failed  please try again later");
    });

  }

  );
}

/*
  * Verify OTP Endpoint
  * request body: { code, uuid }
  * response: { response } or { err }
  * verifies the OTP code for a user and updates their verification status
  * used during account verification process
*/
app.post("/api/v1/verify-otp", (req, res) => {

  const { code, uuid } = req.body;

  if (!uuid) return res.status(404).json({ error: "user id is required" });
  else if (!code) res.json({ error: "Please enter your OTP Code" });

  const query = "SELECT * FROM `users` WHERE `UUID` = ? AND `VCODE` = ?";
  const params = [uuid, code];

  database.query(query, params, (error, results) => {

    if (error) return res.status(500).json({ error: "Database error" });

    if (results.length === 1) {

      const updateQuery = "UPDATE `users` SET `IS_VERIFIED` = ? WHERE `UUID` = ?";
      const updateParams = [2, uuid];

      database.query(updateQuery, updateParams, (error) => {

        if (error) return res.status(500).json({ error: "Database error" });

        return res.status(200).json({ response: "success" });

      }
      );

    } else return res.json({ err: "Your OTP Code is invalid!" });

  }
  );

});

/*
  * Fetch User Endpoint
  * request body: { user }
  * response: { username, email, profile_url }
  * fetches user information by user ID
  * used to get user info for chat header
*/
app.post("/api/v1/fetch-user", (req, res) => {

  const user = req.body.user;

  if (!user) return res.status(404).json({ error: "user is required" });

  const query = "SELECT USERNAME , EMAIL , PROFILE_IMAGE_URL FROM `users` WHERE `UUID` = ?";
  const params = [user];

  database.query(query, params, (error, results) => {

    if (error) return res.status(500).json({ error: "Database error" });

    if (results.length === 1) res.json({ username: results[0].USERNAME, email: results[0].EMAIL, profile_url: results[0].PROFILE_IMAGE_URL, });
  }
  );

});

/*
  * Search User Endpoint
  * request body: { keyword }
  * response: [ { user objects } ]
  * searches for users by username
*/
app.post("/api/v1/search-user", (req, res) => {

  const keyword = req.body.keyword;

  if (!keyword) return res.status(404).json({ error: "Keyword is required" });

  const query = "SELECT * FROM `users` WHERE `USERNAME` = ?";
  const params = [keyword];

  database.query(query, params, (error, results) => {

    if (error) return res.status(5000).json({ error: "Keyword is required" });

    res.status(200).json(results);
  }
  );

});

/*
  * Add Friend Endpoint
  * request body: { cookieUser, friend_uuid }
  * response: { status, response } or { err }
  * adds a friend relationship between the authenticated user and another user
*/
app.post("/api/v1/friends/add-friend", (req, res) => {

  const { cookieUser, friend_uuid } = req.body;
  const add_date = currentDate();

  if (cookieUser === friend_uuid) return;

  const selectQuery = "SELECT * FROM `friend` WHERE `USER_ID` = ? AND `FRIEND_ID` = ?";
  const selectParams = [cookieUser, friend_uuid];

  const insertQuery = "INSERT INTO `friend` (`USER_ID`,`FRIEND_ID`,`ADDED_DATE`) VALUES (? , ? , ?)";
  const insertParams = [cookieUser, friend_uuid, add_date];

  database.query(selectQuery, selectParams, (error, results) => {

    if (error) return res.status(500).json({ error: "Database error" });

    if (results.length === 1) res.json({ err: "this user already added!!", });

    database.query(insertQuery, insertParams, (error) => {

      if (error) return res.status(500).json({ error: "Database error" });

      res.json({ status: "success", response: "user added success", });

    }

    );

  }

  );

});

/*
  * Fetch Chat Messages Endpoint
  * request body: { user, friend }
  * response: [ { chat message objects } ]
  * fetches chat messages between the authenticated user and a specified friend, ordered by date
*/
app.post("/api/v1/chat", (req, res) => {

  const sender = req.body.user;
  const receiver = req.body.friend;

  if (!sender || !receiver) return res.status(500).json({ error: "Sender or Receiver is required " });

  const query = "SELECT * FROM `chat` WHERE ( SENDER = ? AND RECEIVER = ? ) OR ( SENDER = ? AND RECEIVER = ?)  ORDER BY DATE ASC";
  const params = [sender, receiver, receiver, sender];

  database.query(query, params, (error, results) => {
    if (error) return res.status(500).json({ error: "Database error" });
    res.status(200).json(results);
  });
});

app.post("/api/v1/user-profile", (req, res) => {

  const user = req.body.friend;

  const query = "SELECT  USERNAME , PROFILE_IMAGE_URL , EMAIL , BIO , MOBILE , LAST_LOGIN , JOINED_DATE , STATUS , UUID FROM  `users` WHERE `UUID` = ?";
  const params = [user];

  database.query(query, params, (error, results) => {

    if (error) return res.status(500).json({ error: "Database error" });
    res.status(200).json(results);

  }

  );

});

/*
  * Store Message Endpoint
  * request body: { senderId, receiverId, messageText, replayTo, status }
  * file: (optional) image, video, or voice file
  * response: { message, imageUrl, videoUrl, voiceUrl, chatId, replayMessage, replayImageUrl, replayTo }
  * stores a chat message along with optional media file and reply information
*/
app.post('/api/v1/store-messages', upload.single('file'), async (req, res) => {

  const { senderId, receiverId, messageText, replayTo, status } = req.body;

  const file = req.file;
  const date = currentDate();

  let imageUrl = null;
  let videoUrl = null;
  let voiceUrl = null;
  let replayMessage = null;
  let replayImageUrl = null;

  const getReplayData = () => {

    return new Promise((resolve) => {

      if (!replayTo) return resolve();

      const query = "SELECT MESSAGE, IMAGE_URL FROM chat WHERE CHAT_ID = ?";
      const params = [replayTo];

      database.query(query, params, (error, results) => {

        if (error) return resolve();

        if (results.length > 0) {

          replayMessage = results[0].MESSAGE || null;
          replayImageUrl = results[0].IMAGE_URL || null;
        }

        resolve();
      }

      );

    });

  };

  const processFile = () => {

    return new Promise((resolve, reject) => {

      if (!file) return resolve();

      const filename = file.originalname.replace(/\s+/g, '_');

      const uploadPath = path.join(__dirname, 'uploads', filename);


      fs.rename(file.path, uploadPath, (error) => {

        if (error) return reject(new Error("File handling failed"));

        const fileUrl = `/uploads/${filename}`;

        if (file.mimetype.startsWith('image/')) {
          imageUrl = fileUrl;
        } else if (file.mimetype.startsWith('video/')) {
          videoUrl = fileUrl;
        } else if (file.mimetype.startsWith('audio/')) {
          voiceUrl = fileUrl;
        }

        resolve();

      });
    });
  };

  const insertMessage = async () => {

    if (!messageText && !imageUrl && !videoUrl && !voiceUrl && !status) return res.status(400).json({ error: 'Empty message and no file provided' });

    const insertQuery = "INSERT INTO chat (MESSAGE, IMAGE_URL, VIDEO_URL, VOICE_URL, SENDER, RECEIVER, DATE, REPLAY_TO, REPLAY_MESSAGE, REPLAY_IMAGE_URL , STATUS) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)";
    const insertParams = [messageText || null, imageUrl, videoUrl, voiceUrl, senderId, receiverId, date, replayTo || null, replayMessage, replayImageUrl, status];

    database.query(insertQuery, insertParams, (error, results) => {

      if (error) return res.status(500).json({ error: 'Failed to store message' });

      res.json({ message: messageText, imageUrl, videoUrl, voiceUrl, chatId: results.insertId, replayMessage, replayImageUrl, replayTo });
    }

    );

  };

  try {

    await getReplayData();
    await processFile();
    await insertMessage();
    sendUnreadCountUpdate(receiverId, senderId);
  } catch (Exception) {

    res.status(500).json({ error: Exception.message });
  }

});


/*
  * Fetch User Profile Endpoint
  * request param: { id }
  * response: { username, email, profile_image_url, bio, mobile }
  * fetches the profile information for a user by their ID
*/
app.get('/api/v1/user/profile/:id', (req, res) => {

  const user = req.params.id;

  if (!user) return res.status(400).json({ error: 'User ID is required' });

  const query = "SELECT USERNAME , EMAIL , PROFILE_IMAGE_URL , BIO , MOBILE FROM users WHERE UUID = ?";
  const params = [user];

  database.query(query, params, (error, results) => {

    if (error) return res.status(500).json({ error: "Database error" });

    res.status(200).json(results);

  })

});


/*
  * Update Profile Endpoint
  * request body: { bio, user, mobile }
  * response: { status, image, message }
  * updates the user's profile information including bio, profile image, and mobile number
*/
app.put('/api/v1/user/update-profile', upload.single('image'), (req, res) => {

  const { bio, user, mobile } = req.body;

  const query = "SELECT PROFILE_IMAGE_URL FROM users WHERE UUID = ?";
  const params = [user];

  if (req.file) {

    database.query(query, params, (error, results) => {

      if (error) return false;

      const currentImage = results[0]?.PROFILE_IMAGE_URL;

      if (currentImage) {

        const filename = path.basename(currentImage);
        const imagePath = path.join(__dirname, './uploads', filename);

        fs.unlink(imagePath, (error) => {

          if (error) {

            if (error.code === 'ENOENT') {

              console.log('File not found, skipping delete');

            } else {

              console.error('Error deleting image:', error);
            }

          } else {

            console.log('Image deleted:', imagePath);
          }
        });
      }
    });
  }

  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

  let sql;
  let values;

  const selectedQuery = "SELECT PROFILE_IMAGE_URL FROM users WHERE UUID = ?";

  if (imagePath) {

    database.query(selectedQuery, params, (error, results) => {

      if (error) {

        return res.status(500).json({ error: 'Database error' });
      }

      const oldImagePath = results[0]?.PROFILE_IMAGE_URL;

      if (oldImagePath) {

        const oldImageFullPath = path.join(__dirname, oldImagePath);

        fs.unlink(oldImageFullPath, (error) => {

          if (error) console.log('Error removing old image:', error);

        });
      }
    });
  }

  if (imagePath && bio !== null && mobile !== null) {
    sql = 'UPDATE `users` SET BIO = ?, PROFILE_IMAGE_URL = ?, MOBILE = ? WHERE `UUID` = ?';
    values = [bio, imagePath, mobile, user];
  } else if (imagePath && bio !== null) {
    sql = 'UPDATE `users` SET BIO = ?, PROFILE_IMAGE_URL = ? WHERE `UUID` = ?';
    values = [bio, imagePath, user];
  } else if (imagePath && mobile !== null) {
    sql = 'UPDATE `users` SET PROFILE_IMAGE_URL = ?, MOBILE = ? WHERE `UUID` = ?';
    values = [imagePath, mobile, user];
  } else if (bio !== null && mobile !== null) {
    sql = 'UPDATE `users` SET BIO = ?, MOBILE = ? WHERE `UUID` = ?';
    values = [bio, mobile, user];
  } else if (imagePath) {
    sql = 'UPDATE `users` SET PROFILE_IMAGE_URL = ? WHERE `UUID` = ?';
    values = [imagePath, user];
  } else if (bio !== null) {
    sql = 'UPDATE `users` SET BIO = ? WHERE `UUID` = ?';
    values = [bio, user];
  } else if (mobile !== null) {
    sql = 'UPDATE `users` SET MOBILE = ? WHERE `UUID` = ?';
    values = [mobile, user];
  } else {
    return res.status(400).json({ error: 'No data to update' });
  }

  database.query(sql, values, (error) => {

    if (error) {

      res.status(500).json({ error: 'Database error' });
    } else {

      res.status(200).json({
        status: 200,
        image: imagePath,
        message: 'Profile updated successfully!',
      });
    }
  });

});

/*
  * Fetch Favorite Friends Endpoint
  * request body: { user }
  * response: { friends }
  * fetches the favorite friends for a user
*/
app.get('/api/v1/fetch-favorite-friends/:id', (req, res) => {

  const user = req.params.id;

  if (!user) return res.status(400).json({ error: 'User ID is required' });

  const sql = `
     SELECT
  u.USERNAME,
  u.PROFILE_IMAGE_URL,
  u.UUID,
  u.STATUS,
  c.MESSAGE,
  c.DATE,
  c.IMAGE_URL,
  c.VIDEO_URL,
  c.VOICE_URL
FROM favorite f
INNER JOIN users u ON f.FRIEND_ID = u.UUID
LEFT JOIN (
  SELECT ch.*
  FROM chat ch
  INNER JOIN (
    SELECT
      CASE
        WHEN SENDER < RECEIVER THEN CONCAT(SENDER, '_', RECEIVER)
        ELSE CONCAT(RECEIVER, '_', SENDER)
      END AS chat_key,
      MAX(DATE) AS latest_date
    FROM chat
    GROUP BY chat_key
  ) lc ON (
    (CASE
      WHEN ch.SENDER < ch.RECEIVER THEN CONCAT(ch.SENDER, '_', ch.RECEIVER)
      ELSE CONCAT(ch.RECEIVER, '_', ch.SENDER)
    END) = lc.chat_key AND ch.DATE = lc.latest_date
  )
) c ON (
  (c.SENDER = f.USER_ID AND c.RECEIVER = f.FRIEND_ID) OR
  (c.SENDER = f.FRIEND_ID AND c.RECEIVER = f.USER_ID)
)
WHERE f.USER_ID = ?
ORDER BY c.DATE IS NULL, c.DATE DESC
  `;

  const params = [user, user, user, user, user, user, user];

  database.query(sql, params, (error, results) => {

    if (error) return res.status(500).json({ error: 'Database error' });

    res.status(200).json(results);

  });

});

/*
  * ===========================
  * Fetch Friend List Endpoint
  * request body: { user }
  * response: { friends }
  * fetches the friend list for a user along with the latest message details
*/
app.post("/api/v1/fetch-friend", (req, res) => {

  const userId = req.body.user;

  if (!userId) return res.status(400).json({ error: 'User ID is required' });

  const sql = `
  SELECT 
  u.USERNAME,
  u.PROFILE_IMAGE_URL,
  u.UUID,
  u.STATUS,
  u.LAST_LOGIN,
  c.MESSAGE,
  c.DATE,
  c.IMAGE_URL,
  c.VIDEO_URL,
  c.VOICE_URL
FROM friend f
INNER JOIN users u ON f.FRIEND_ID = u.UUID
LEFT JOIN (
  SELECT c1.*
  FROM chat c1
  INNER JOIN (
    SELECT 
      CASE 
        WHEN SENDER < RECEIVER THEN CONCAT(SENDER, '_', RECEIVER)
        ELSE CONCAT(RECEIVER, '_', SENDER)
      END AS chat_key,
      MAX(DATE) AS latest_date
    FROM chat
    WHERE SENDER = ? OR RECEIVER = ?
    GROUP BY chat_key
  ) c2 ON 
    (
      (c1.SENDER < c1.RECEIVER AND CONCAT(c1.SENDER, '_', c1.RECEIVER) = c2.chat_key) OR
      (c1.SENDER > c1.RECEIVER AND CONCAT(c1.RECEIVER, '_', c1.SENDER) = c2.chat_key)
    )
    AND c1.DATE = c2.latest_date
) c ON 
  (
    (c.SENDER = f.FRIEND_ID AND c.RECEIVER = ?) OR 
    (c.SENDER = ? AND c.RECEIVER = f.FRIEND_ID)
  )
WHERE f.USER_ID = ?
ORDER BY c.DATE DESC
  `;

  const params = [userId, userId, userId, userId, userId, userId, userId];

  database.query(sql, params, (err, results) => {

    if (err) return res.status(500).json({ error: "Database error" });

    res.status(200).json(results);

  });

});


/*
  * ===========================
  * Add to favorite Endpoint
  * request body: { user, friend }
  * response: { status, message }
  * adds a friend to the user's favorite list
*/
app.post('/api/v1/friends/add-to-favorite', (req, res) => {

  const { user, friend } = req.body;

  if (!user || !friend) return res.status(400).json({ err: 'User and friend IDs are required' });

  const query = "SELECT * FROM favorite WHERE `FRIEND_ID` = ? AND `USER_ID` = ?";
  const params = [friend, user];

  database.query(query, params, (error, result) => {

    if (error) return res.status(500).json({ error: 'Database error' });

    if (result.length === 0) {

      const date = currentDate();
      const insertQuery = "INSERT INTO `favorite` (`ADDED_DATE`,`FRIEND_ID`,`USER_ID`) VALUES (? , ? , ?)";
      const insertParams = [date, friend, user];

      database.query(insertQuery, insertParams, (error) => {
        if (error) return res.status(500).json({ error: 'Database error' });
        res.status(200).json({ status: 200, message: 'Friend added to favorites successfully!' });
      });

    } else {

      res.json({ err: 'friend already added!' })

    }


  })

});

/* 
 * 2 factor authentication sessions Endpoint ( 2FA )
  * request body: { userId }
  * response: { sessions }
  * fetches device information for a user
 */
app.post('/api/v1/user/sessions', (req, res) => {

  const userId = req.body.userId;

  if (!userId) return res.status(400).json({ error: 'User ID is required' });

  const query = "SELECT BROWSER_NAME , BROWSER_VERSION , PLATFORM , IP_ADDRESS , STATUS , DATE , LOCATION FROM device_information WHERE UUID = ?";
  const params = [userId];

  database.query(query, params, (error, results) => {
    if (error) return res.status(500).json({ error: 'Database error' });
    res.json({ sessions: results });
  });

});


/*
  * ===========================
  * 2 factor authentication handle Endpoint ( 2FA )
  * request body: { id, status }
  * response: { message }
  * enables or disables 2FA for a user based on the status
*/
app.post('/api/v1/user/2FA-Handle', (req, res) => {

  const { id, status } = req.body;

  if (!id && !status) res.status(404).json({ error: 'User ID and status are required' });

  const query = "SELECT AUTH_2FA FROM `users` WHERE UUID = ?";
  const params = [id];

  database.query(query, params, (error, results) => {

    if (error) return res.status(500).json({ error: 'Database error' });

    if (status) {

      database.query("UPDATE `users` SET `AUTH_2FA` = ? WHERE UUID = ?", [1, id], (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
      });

    } else {

      if (results[0].AUTH_2FA === 1) {
        database.query("UPDATE `users` SET `AUTH_2FA` = ? WHERE UUID = ?", [0, id], (err) => {
          if (err) return res.status(500).json({ error: 'Database error' });
        });
      }

    }

  });

});


/*
  * ===========================
  * 2 factor authentication status Endpoint ( 2FA )
  * request body: { userId }
  * response: { status }
  * checks if 2FA is enabled for a user
*/
app.post('/api/v1/user/2FA-status', (req, res) => {

  const { userId } = req.body;

  if (!userId) return res.status(400).json({ error: 'User ID is required' });

  const query = "SELECT AUTH_2FA FROM `users` WHERE UUID = ?";
  const params = [userId];

  database.query(query, params, (error, results) => {

    if (error) return res.status(500).json({ error: 'Database error' });

    if (results.length > 0) {
      return res.status(200).json({ status: results[0].AUTH_2FA });
    }

  });


});


/* 
  * ===========================
  * 2 factor authentication verify Endpoint ( 2FA )
  * request body: { uuid, code }
  * response: { message }
  * verifies the 2FA code for a user and updates their verification status
  * ===========================
*/
app.post('/api/v1/user/2FA-verify', (req, res) => {

  const { uuid, code } = req.body;

  if (!uuid || !code) return res.status(400).json({ error: 'user id and verification code are required' });

  const query = "SELECT VCODE FROM users WHERE UUID = ?";
  const params = [uuid];

  const updateQuery = "UPDATE users SET IS_VERIFIED = ? WHERE UUID = ?";
  const updateParams = [2, uuid];


  database.query(query, params, (error, results) => {

    if (error) return res.status(500).json({ error: 'Database error' });

    if (results.length > 0 && results[0].VCODE === code) {

      database.query(updateQuery, updateParams, (error) => {

        if (error) return res.status(500).json({ error: 'Database error' });

        res.cookie("UUID", uuid, {
          path: "/",
          httpOnly: false,
          maxAge: 30 * 24 * 60 * 60 * 1000,
          secure: false,
        });

        return res.status(200).json({ message: 'Two-factor authentication verified successfully' });

      });
    } else {
      return res.status(400).json({ error: 'Invalid verification code' });
    }
  });

});

/* 
  * ===========================
  *  Store Device Information Endpoint ( Sessions )
  *  request body: { userId, data }
  *  stores or updates device information for a user
  * ===========================
*/
app.post('/api/v1/sessions/store-device-information', (req, res) => {

  const { userId, data } = req.body;
  const date = currentDate();

  if (!userId || !data) return res.status(400).json({ error: 'User ID and data are required' });

  const checkQuery = `SELECT UUID FROM device_information 
  WHERE UUID = ? AND BROWSER_NAME = ? AND BROWSER_VERSION = ? AND PLATFORM = ? AND IP_ADDRESS = ?`;

  const checkParams = [userId, data.browserName, data.browserVersion, data.platform, data.ipAddress];

  database.query(checkQuery, checkParams, (err, results) => {

    if (err) return res.status(500).json({ error: 'Database error' });

    if (results.length === 0) {

      const insertQuery = `
        INSERT INTO device_information (UUID, BROWSER_NAME, BROWSER_VERSION, PLATFORM, IP_ADDRESS, STATUS, DATE, AGENT, LOCATION, LANGUAGE)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const insertParams = [
        userId, data.browserName, data.browserVersion, data.platform, data.ipAddress,
        data.online ? 'online' : 'offline', date, data.userAgent, data.location, data.language
      ];


      database.query(insertQuery, insertParams, (insertErr) => {
        if (insertErr) {
          console.error('Error inserting device information:', insertErr);
        }
      });

    } else {

      const updateQuery = `
        UPDATE device_information
        SET STATUS = ?, DATE = ?, AGENT = ?, LOCATION = ?, LANGUAGE = ?
        WHERE UUID = ? AND BROWSER_NAME = ? AND BROWSER_VERSION = ? AND PLATFORM = ? AND IP_ADDRESS = ?
      `;

      const updateParams = [
        userId ? 'online' : 'offline', date, data.userAgent, data.location, data.language,
        data.userId, data.browserName, data.browserVersion, data.platform, data.ipAddress
      ];

      database.query(updateQuery, updateParams, (updateErr) => {
        if (updateErr) {
          console.error('Error updating device information:', updateErr);
        }
      });

    }
  });
});


/* 
  * ===========================
  * Media Messages Endpoint ( Images )
  * request body: { sender, receiver }
  * response: [ { IMAGE_URL, MESSAGE } ]
  * returns a list of media messages exchanged between the sender and receiver
  * ===========================
*/
app.post("/api/v1/media", (req, res) => {

  const { sender, receiver } = req.body;

  if (!sender || !receiver) return res.status(404).json({ error: "Sender or Receiver ID can't find....!" });

  const query = "SELECT IMAGE_URL , MESSAGE FROM `chat` WHERE ((`SENDER` = ? AND `RECEIVER` = ?) OR (`SENDER` = ? AND `RECEIVER` = ?)) AND IMAGE_URL IS NOT NULL";

  const params = [sender, receiver, receiver, sender];

  database.query(query, params, (error, results) => {
    if (error) {
      return res.status(500).json({ error: "Database error" });
    } else {
      return res.status(200).json(results);
    }
  });

});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});