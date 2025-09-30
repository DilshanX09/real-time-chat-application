# ConvoChat

ConvoChat is a **feature-rich, cross-platform real-time chat application** built with a modern full-stack architecture. It delivers a seamless messaging experience with a focus on speed, responsiveness, and user-friendly design. Powered by **WebSocket** for instant communication, ConvoChat combines robust back-end logic with a polished, professional UI.

## Features

* **Light & Dark theme support**
* **Real-time chat**: Send, receive, delivered, and seen states
* **Online/Offline friend status** with real-time “Last Seen” updates
* **Image and resource sharing**
* **Message reply system** in real time
* **Friend search and add functionality**
* **Two-Factor Authentication (2FA)**
* **Session management** with device information
* **Auto-refreshing friend list**
* **Unread message counts** updated in real time
* Smooth animations for a professional UI/UX experience

## Tech Stack

**Frontend**: React, Electron, Tailwind CSS, DaisyUI, Framer Motion
**Backend**: Node.js, Express.js, MySQL
**Real-time Communication**: WebSocket
**Design Tools**: Figma, Adobe XD, Photoshop, Illustrator

## 📂 Project Structure


<img width="367" height="743" alt="image" src="https://github.com/user-attachments/assets/44f6b818-6088-45e9-8338-fdfcd9452a7f" />


```


## ⚙️ Installation & Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/DilshanX09/real-time-chat-application.git
   cd real-time-chat-application
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment**
   Inside the server directory, create a .env file and add:

   ```env
   DB_HOST="localhost"
   DB_USER="root"
   DB_PASSWORD="*******"
   DB_NAME="chat_app"

   SESSION_SECRET=""
   PORT=5000

   EMAIL="*******@gmail.com"
   PASSWORD="***********"
   ORIGIN="http://localhost:3000"

   ```

4. **Run backend server**

   ```bash
   npm run server
   ```

5. **Run frontend (React)**

   ```bash
   npm run react
   ```

5. **Run full application (React + Express + Electron)**

   ```bash
   npm run dev
   ```


## 📜 License

This project is licensed under the **MIT License**.


Chamod Dilshan 2025 @
