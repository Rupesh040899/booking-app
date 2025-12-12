# Ticket Booking System (Full Project)

This archive contains a runnable backend and frontend for a demo Ticket Booking System with concurrency-safe seat booking.

## Quickstart (using Docker Compose) - recommended
1. Ensure Docker & Docker Compose installed.
2. From repository root run:
   ```sh
   docker-compose up --build
   ```
3. Run migrations (once DB is ready):
   ```sh
   docker exec -it <backend_container_id> node migrate.js
   ```
4. Backend: http://localhost:4000
5. Frontend: http://localhost:5173

## Quickstart (local)
### Backend
```sh
cd backend
npm install
cp .env.example .env       # edit if needed
npm run migrate
npm start
```

### Frontend
```sh
cd frontend
npm install
npm run dev
```

## Concurrency test
From `backend/` run:
```sh
npm run concurrency-test
```
This will simulate multiple clients trying to book the same seat (configure env vars SHOW_ID, SEAT, CLIENTS)

# booking-app
