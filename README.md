# Vines Backend

The **Vines Backend** powers the core logic, data management, and API services for the Vines ecosystem.  
Built with **Node.js**, **Express**, and **PostgreSQL**, it is designed for scalability, security, and smooth integration with mobile and web clients.

---

## Features

- RESTful API built with Express.js  
- PostgreSQL database with structured schema  
- JWT authentication and user management  
- Environment-based configuration  
- Dockerized for easy deployment  
- Modular architecture with controllers and routes  
- Compatible with Vercel, Railway, or Render deployments  

---

## Tech Stack

| Layer | Technology |
|-------|-------------|
| Runtime | Node.js (v18+) |
| Framework | Express.js |
| Database | PostgreSQL |
| ORM / Query | pg / native SQL |
| Environment | dotenv / vines.env |
| Deployment | Docker, Vercel, or Railway |
| Logging | console / middleware logs |

---

## Project Structure

```bash
Vines-backend/
├── app.js               # Main Express app configuration
├── server.js            # Entry point - starts the HTTP server
├── package.json         # Dependencies and scripts
├── Dockerfile           # Docker build instructions
├── .env                 # Environment variables (local)
├── vines.env            # Deployment environment file
├── subnets.json         # Network or subnet configuration
├── .gitignore           # Git ignore rules
└── README.md            # Project documentation
```

> Additional folders like `/controllers`, `/routes`, `/models`, or `/config` may exist in development branches.

---

## Installation and Setup

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/Vines-backend.git
cd Vines-backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file in the project root (or use `vines.env`) with:
```bash
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/vines
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

### 4. Run the server (development mode)
```bash
npm run dev
```

Or in production:
```bash
npm start
```

---

## Run with Docker

### Build image
```bash
docker build -t vines-backend .
```

### Run container
```bash
docker run -p 5000:5000 --env-file .env vines-backend
```

---

## Database Setup

Ensure PostgreSQL is running locally or remotely.

Create the database:
```bash
createdb vines
```

Then initialize your schema (if a `db/init.sql` file is included):
```bash
psql -U postgres -d vines -f db/init.sql
```

Use pgAdmin or `psql` CLI to verify connection.

---

## API Overview

| Method | Endpoint | Description |
|--------|-----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Authenticate and receive a JWT token |
| GET | `/api/users/:id` | Fetch user by ID |
| PUT | `/api/users/:id` | Update user information |
| DELETE | `/api/users/:id` | Delete a user |
| GET | `/api/health` | Server health check |
| GET | `/api/diary` | Fetch diary entries for a user |
| POST | `/api/diary` | Create a new diary entry |
| PUT | `/api/diary/:entry_id` | Update a diary entry |
| DELETE | `/api/diary/:entry_id` | Delete a diary entry |
| POST | `/api/reactions` | Add or update a reaction |
| GET | `/api/reactions/:entry_id` | Get all reactions for a diary entry |
| POST | `/api/garden/checkin` | Check in flower data for a specific date |
| GET | `/api/garden/:user_id` | Retrieve weekly garden progress |

> The above endpoints are examples of how the API is organized.  
> Refer to `/routes` and `/controllers` for complete implementation details.

---

## Environment Variables

| Variable | Description | Example |
|-----------|--------------|---------|
| `PORT` | API server port | 5000 |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/vines` |
| `JWT_SECRET` | JWT encryption key | `supersecretkey` |
| `NODE_ENV` | Application environment | `development` |
| `VERCEL_URL` | (Optional) Deployment URL | `https://vines.vercel.app` |
| `LOG_LEVEL` | Logging level | `info` |
| `ALLOWED_ORIGINS` | Allowed CORS origins | `http://localhost:3000` |

---

## Deployment

### Deploy to Vercel
1. Push your code to GitHub.  
2. Import the repository in [Vercel Dashboard](https://vercel.com/).  
3. Add environment variables from `.env` to project settings.  
4. Deploy. Vercel will automatically build and run the backend.

### Deploy via Docker (self-hosted)
```bash
docker-compose up -d
```

### Deploy to Railway
1. Create a new project on [Railway.app](https://railway.app).  
2. Link your GitHub repository.  
3. Add environment variables.  
4. Deploy automatically via CI/CD pipeline.

---

## Development Guidelines

- Use consistent naming conventions for routes, controllers, and models.  
- Handle errors with async/await and centralized error middleware.  
- Validate all input data using middleware or validation libraries.  
- Follow commit message conventions:  
  - `feat:` for new features  
  - `fix:` for bug fixes  
  - `refactor:` for internal changes  
  - `docs:` for documentation updates  
  - `chore:` for maintenance tasks  
- Use ESLint for linting and maintain consistent code style.  
- Use Prettier for code formatting if integrated.

---

## Scripts

| Command | Description |
|----------|-------------|
| `npm start` | Start the server in production mode |
| `npm run dev` | Start the server in development with nodemon |
| `npm run lint` | Run ESLint checks |
| `npm run build` | (Optional) Build or prepare for deployment |

---

## Logging and Monitoring

- Logs are output to the console by default.  
- For production, use a process manager such as **PM2** for log rotation and uptime.  
- Optionally integrate with services like **Logtail**, **Datadog**, or **Grafana** for observability.

---

## Error Handling

All routes are wrapped with async error handlers to ensure server stability.  
Custom middleware handles:
- Validation errors  
- Authentication errors  
- Database query exceptions  
- 404 Not Found responses  

Example:
```js
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message });
});
```

---

## Security Best Practices

- Use HTTPS in production environments.  
- Store secrets in `.env`, not in version control.  
- Sanitize user input to prevent SQL injection or XSS attacks.  
- Set appropriate CORS headers using allowed origin lists.  
- Use `helmet` middleware for securing HTTP headers.

---

## License

This project is licensed under the **MIT License**.  
See the [LICENSE](./LICENSE) file for details.

---

## Contributing

Pull requests are welcome.  
Please open an issue first to discuss major changes before submitting a PR.

1. Fork the repository  
2. Create a feature branch (`git checkout -b feature/your-feature`)  
3. Commit your changes (`git commit -m 'feat: add new feature'`)  
4. Push to the branch (`git push origin feature/your-feature`)  
5. Open a Pull Request  

---

## Contact

**Project Maintainer:** vines.dev.team@example.com  
**GitHub:** [https://github.com/yourusername](https://github.com/yourusername)