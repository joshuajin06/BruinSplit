# Network Audio Call Setup Guide

## 🎯 Goal
Enable users on **different computers** to make audio calls by connecting to the **same backend server**.

## 📋 Prerequisites
- Two or more computers on the same WiFi network (or accessible via internet)
- Host computer will run the backend server
- All other computers will connect to the host's backend

---

## 🖥️ Setup Instructions

### Option 1: Automated Setup (Recommended)

#### For the HOST (running backend):

1. **Run the setup script:**
   ```bash
   chmod +x setup-network.sh
   ./setup-network.sh
   ```

2. **Choose 'y' when asked if you're the host**

3. **Note your IP address** displayed (e.g., `192.168.1.100`)

4. **Start your servers:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   node server.js

   # Terminal 2 - Frontend  
   cd frontend/bruinsplit
   npm run dev
   ```

5. **Share your IP address** with your friends

#### For FRIENDS (clients):

1. **Get the host's IP address** from your friend

2. **Run the setup script:**
   ```bash
   chmod +x setup-network.sh
   ./setup-network.sh
   ```

3. **Choose 'n' when asked if you're the host**

4. **Enter the host's IP address** when prompted

5. **Start ONLY your frontend:**
   ```bash
   cd frontend/bruinsplit
   npm run dev
   ```

6. **Do NOT run the backend** - you'll connect to your friend's backend

---

### Option 2: Manual Setup

#### For the HOST:

1. **Find your IP address:**
   ```bash
   # macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Windows
   ipconfig
   ```
   Look for something like `192.168.1.100` or `10.0.0.5`

2. **Your `.env.local` should have:**
   ```bash
   VITE_API_URL=http://localhost:8080/api
   ```
   (This is the default, no changes needed)

3. **Start both servers:**
   ```bash
   # Backend
   cd backend && node server.js
   
   # Frontend
   cd frontend/bruinsplit && npm run dev
   ```

#### For FRIENDS:

1. **Get host's IP** (e.g., `192.168.1.100`)

2. **Create `.env.local` file:**
   ```bash
   cd frontend/bruinsplit
   ```
   
   Create a file named `.env.local` with this content:
   ```
   VITE_API_URL=http://192.168.1.100:8080/api
   ```
   (Replace `192.168.1.100` with actual host IP)

3. **Start ONLY frontend:**
   ```bash
   cd frontend/bruinsplit
   npm run dev
   ```

4. **Do NOT run backend** on your computer

---

## ✅ Verify Configuration

### Check if it's working:

1. **Open browser console** (F12)

2. **Look at any API request** in the Network tab

3. **Check the URL:**
   - ✅ Host should see: `http://localhost:8080/api/...`
   - ✅ Friend should see: `http://192.168.1.100:8080/api/...`

4. **Test login** - if you can log in, the connection works!

---

## 🎙️ Making an Audio Call

Once everyone is connected to the same backend:

1. **Both users** log in to their accounts

2. **Both users** navigate to the same ride/conversation

3. **User 1** clicks the phone icon (📞)

4. **User 2** clicks the phone icon (📞) within 5 seconds

5. **Allow microphone access** when prompted

6. **Wait 1-2 seconds** for connection to establish

7. **You should hear each other!**

### Backend Terminal Should Show:
```
[JOIN] 👤 User a12b03ee... joined call 00a8ed76...
[JOIN] 📊 Total participants in call: 1

[JOIN] 👤 User f6e11d5b... joined call 00a8ed76...
[JOIN] 📊 Total participants in call: 2
[JOIN] 👥 Participant IDs: [ 'a12b03ee...', 'f6e11d5b...' ]
```

---

## 🔧 Troubleshooting

### "Cannot connect to backend"
**Problem:** Friend's computer can't reach host's backend

**Solutions:**
1. Verify both computers are on same WiFi network
2. Check host's firewall allows port 8080
3. Verify host's IP address is correct
4. Try pinging host from friend's computer: `ping 192.168.1.100`

### "Only showing 1 participant in call"
**Problem:** Users are on different backend instances

**Solutions:**
1. Verify friend's `.env.local` has correct host IP
2. Check friend's browser console for API URLs
3. Restart friend's frontend after changing `.env.local`
4. Verify host's backend is still running

### "Connection refused"
**Problem:** Backend not running or port blocked

**Solutions:**
1. Confirm host's backend is running: check terminal for "Server is running on port 8080"
2. Check firewall settings on host computer
3. Try accessing http://HOST_IP:8080 in browser - should see JSON response

### "No audio during call"
**Problem:** WebRTC connection issue

**Solutions:**
1. Check both users granted microphone permissions
2. Verify both users see "2 participants" in call
3. Check browser console for WebRTC errors
4. Try on same WiFi network (eliminates NAT issues)
5. Check system audio settings (not muted)

---

## 🔐 Security Note

The current setup allows ANY computer on your network to connect. For production:

1. Add authentication to backend
2. Use HTTPS instead of HTTP
3. Configure CORS to only allow specific origins
4. Deploy backend to cloud service

---

## 🌐 Internet Access (Advanced)

To make audio calls over the internet (not just local WiFi):

### Option 1: Port Forwarding
1. Forward port 8080 on host's router to host computer
2. Use host's public IP instead of local IP
3. **Security risk** - not recommended without HTTPS

### Option 2: Deploy Backend to Cloud
1. Deploy backend to Heroku, AWS, or similar
2. Update `.env.local` for ALL users:
   ```
   VITE_API_URL=https://your-app.herokuapp.com/api
   ```
3. More secure and reliable

### Option 3: Use ngrok (Quick Testing)
1. Install ngrok: https://ngrok.com/
2. Run on host: `ngrok http 8080`
3. Use ngrok URL in friend's `.env.local`:
   ```
   VITE_API_URL=https://abc123.ngrok.io/api
   ```

---

## 📝 Summary

✅ **Host runs:** Backend + Frontend, uses `localhost`
✅ **Friends run:** Frontend only, use host's IP in `.env.local`
✅ **All users:** Connect to same backend = can make audio calls
✅ **Test:** Login, navigate to same ride, click phone button

That's it! The audio call feature will work across different computers. 🎉
