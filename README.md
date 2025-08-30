# Vines-backend

# File Structure Recommand

## 📂 config/
- `db.js` — PostgreSQL connection config, initialising connection pool, providing query functions
- `aws.js` — (Optional) AWS S3 config for media storage

## 📂 controllers/
- `authController.js`
- `userController.js`
- `mediaController.js`
- `metricsController.js`
- `gpsController.js`
- `scoreController.js`
- `friendController.js`
‹
## 📂 middleware/
- `auth.js` — JWT verification middleware
- `errorHandler.js`
- `upload.js` — Multer middleware for media uploads

## 📂 models/
- `userModel.js`
- `mediaModel.js`
- `metricsModel.js`
- `gpsModel.js`
- `scoreModel.js`
- `friendModel.js`

## 📂 routes/
- `authRoutes.js`
- `userRoutes.js`
- `mediaRoutes.js`
- `metricsRoutes.js`
- `gpsRoutes.js`
- `scoreRoutes.js`
- `friendRoutes.js`

## 📂 utils/
- `scoreCalculator.js` — Compute mental health score based on metrics
- `locationUtils.js` — e.g., calculate distance, movement range

---

- `.env` — Environment variables
- `.gitignore`
- `app.js` — Main Express app config
- `server.js` — App entry point
- `package.json`
- `README.md`

