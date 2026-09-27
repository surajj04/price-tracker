# 📉 Price Tracker System

A full-stack price tracking platform that lets users paste product links from
Amazon, Flipkart, Myntra, Ajio, and Meesho — and get notified when prices
drop below their target.

Built with **FastAPI** (backend), **Python scrapers** (trackers),
and **React + Vite + TailwindCSS** (frontend).

---

## ✨ Features

- 🔗 **Paste any product link** from Amazon, Flipkart, Myntra, Ajio, Meesho
- 🕷️ **Automatic scraping** — title, price, MRP, rating, reviews, specs
- 🎯 **Target price alerts** — get notified when price drops
- 📅 **Custom tracking schedules** — every 6h / 12h / daily / every 2 days
- 📊 **Price history** — line chart + detailed table with change tracking
- 📬 **Email & Push notifications**
- 📱 **Responsive dashboard** — list view with search and filters
- 🔐 **Auth pages** — Sign in / Register with validation

---

## 📁 Project Structure

```
price-tracker-system/
├── backend/          # FastAPI backend (Python)
│   ├── api/          # API routes
│   ├── crud/         # Database operations
│   ├── models/       # SQLAlchemy models
│   ├── schema/       # Pydantic schemas
│   ├── services/     # Business logic
│   ├── database.py   # DB connection
│   └── main.py       # App entry point
│
├── trackers/         # Web scrapers
│   ├── flipkart/     # Flipkart scraper
│   ├── amazon/       # Amazon scraper
│   └── ...           # Other stores
│
├── ui/               # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/   # API layer (axios)
│   │   └── App.jsx
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🛠 Tech Stack

### Backend
- **FastAPI** — Modern Python web framework
- **SQLAlchemy** — ORM
- **PostgreSQL** — Database
- **Pydantic** — Data validation
- **Uvicorn** — ASGI server

### Trackers
- **Python** — Scraping scripts
- **BeautifulSoup / Playwright** — HTML parsing & browser automation

### Frontend
- **React 18** — UI library
- **Vite** — Build tool
- **React Router v6** — Client-side routing
- **TailwindCSS** — Utility-first styling
- **Axios** — HTTP client

---

## 🚀 Getting Started

### Prerequisites

- **Python** 3.10+
- **Node.js** 18+
- **PostgreSQL** 14+

---

### 1️⃣ Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate (Linux/Mac)
source .venv/bin/activate

# Activate (Windows)
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env
# Edit .env with your DB credentials

# Run server
uvicorn main:app --reload
```

Backend runs on: **http://localhost:8000**
API docs (Swagger): **http://localhost:8000/docs**

---

### 2️⃣ Trackers Setup

```bash
cd trackers

# If separate venv
python -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt
```

---

### 3️⃣ UI Setup

```bash
cd ui

# Install dependencies
npm install

# Setup env
cp .env.example .env

# Run dev server
npm run dev
```

UI runs on: **http://localhost:5173**

---

## 🔑 Environment Variables

### `backend/.env`

```env
DATABASE_URL=postgresql://user:password@localhost:5432/price_tracker
SECRET_KEY=your-secret-key-here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### `ui/.env`

```env
VITE_API_BASE_URL=http://localhost:8000
```

⚠️ **Never commit actual `.env` files** — only `.env.example`.

---

## 📡 API Endpoints

### Products

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/product/track/` | Scrape product details from a link |
| `POST` | `/product/add-product/` | Save a tracked product |
| `GET` | `/product/user/{user_id}` | Get all products for a user |
| `GET` | `/product/detail/{product_id}` | Get single product details |

### Query Params

- `/product/track/?product_link=<url>`
- `/product/add-product/?user_id=<id>`

---

## 🖥 UI Pages

| Page | Route | Description |
|---|---|---|
| **Home** | `/` | Landing page — paste link to start tracking |
| **Add Product** | `/add-product` | 3-step flow: paste link → scrape → confirm |
| **Dashboard** | `/dashboard` | List of tracked products with filters |
| **Product Detail** | `/product/:id` | Price history chart, table, specifications |
| **Sign In / Register** | `/signin` | Auth with validation |
| **Pricing** | `/pricing` | Pricing plans (placeholder) |

---

## 🔄 How It Works

```
User pastes link
       ↓
POST /product/track/     →  Scraper fetches product page
       ↓
Preview shown            →  Title, price, MRP, rating, specs
       ↓
User sets target price   →  + schedule + notifications
       ↓
POST /product/add-product/   →  Saved to database
       ↓
Scheduler checks price   →  On schedule (6h / 12h / daily)
       ↓
Price drops below target →  Email + Push notification
```

---

## 📸 Screenshots

> Coming soon — will add once UI is finalized.

---

## 🧪 Testing

```bash
# Backend
cd backend
pytest

# UI (when tests are added)
cd ui
npm test
```

---

## 📋 Roadmap

- [x] FastAPI backend with product CRUD
- [x] Web scrapers for major stores
- [x] React frontend with dashboard
- [x] Add product flow with scraping animation
- [x] Price history chart + table
- [ ] Scheduled price tracking (cron/worker)
- [ ] Email + Push notifications
- [ ] Authentication with JWT
- [ ] Multi-user support
- [ ] Deploy to production

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first.

```bash
# Fork the repo
git clone https://github.com/YOUR_USERNAME/price-tracker-system.git
cd price-tracker-system

# Create feature branch
git checkout -b feature/amazing-feature

# Commit changes
git commit -m "feat: add amazing feature"

# Push
git push origin feature/amazing-feature

# Open PR on GitHub
```

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 👤 Author

**Suraj Jadhav**
- GitHub: [@your-username](https://github.com/your-username)

---

## 🙏 Acknowledgements

- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [TailwindCSS](https://tailwindcss.com/)

---

⭐ **If you find this project useful, give it a star!**