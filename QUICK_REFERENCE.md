# 🎙️ Quick Reference: Network Audio Calls

## For YOU (Host)
Your IP: `172.23.216.81`

```bash
# 1. Run setup (OPTIONAL - already configured)
./setup-network.sh

# 2. Start backend
cd backend
node server.js

# 3. Start frontend (new terminal)
cd frontend/bruinsplit
npm run dev
```

---

## For YOUR FRIEND

```bash
# 1. Run setup script
./setup-network.sh

# 2. Choose 'n' (not host)

# 3. Enter your IP: 172.23.216.81

# 4. Start frontend ONLY
cd frontend/bruinsplit
npm run dev

# DON'T start backend!
```

---

## OR Manual Setup for Friend

Create `frontend/bruinsplit/.env.local`:
```
VITE_API_URL=http://172.23.216.81:8080/api
```

Then:
```bash
cd frontend/bruinsplit
npm run dev
```

---

## Making the Call

1. ✅ Both login to BruinSplit
2. ✅ Both navigate to **same ride/conversation**
3. ✅ You click phone icon 📞
4. ✅ Friend clicks phone icon 📞 (within 5 seconds)
5. ✅ Allow mic permissions
6. ✅ You should hear each other!

---

## Expected Backend Logs

```
[JOIN] 👤 User a12b03ee... joined call
[JOIN] 📊 Total participants in call: 1

[JOIN] 👤 User f6e11d5b... joined call
[JOIN] 📊 Total participants in call: 2  ← ✅ This means it works!
```

---

## Troubleshooting

### Friend can't connect?
- Check same WiFi network
- Verify IP: `172.23.216.81`
- Check `.env.local` file exists
- Restart frontend after changing `.env.local`

### Only 1 participant showing?
- Friend is on their own backend
- Check friend's browser console for `localhost` in URLs
- Should see `172.23.216.81` instead

### No audio?
- Check microphone permissions
- Check system volume
- Verify 2 participants showing
- Check browser console for errors

---

## Files Changed

✅ `frontend/bruinsplit/.env.local` - Backend URL config
✅ All API files updated to use `VITE_API_URL`
✅ `setup-network.sh` - Automated setup script
✅ CORS enabled on backend (already done)

Ready to test! 🚀
