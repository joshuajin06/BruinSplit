Ride join/leave integration test

Run the test against a locally running backend.

Requirements:
- Node 18+ (for native fetch)
- Backend server running (default: http://localhost:8080)

Run:

```bash
# from repo root
cd backend
./tests/rideTesting/testJoinLeave.sh
```

You can override the backend URL with `API_URL` environment variable:

```bash
API_URL=http://localhost:8080 ./tests/rideTesting/testJoinLeave.sh
```

for rideCrud.test.js

npm install --save-dev supertest jest
npx jest tests/rideTesting/rideCrud.test.js
npm run test:ride