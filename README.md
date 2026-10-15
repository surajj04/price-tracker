# 🛍️ Price Tracker System

Track product prices across popular Indian e-commerce platforms from one place. Add a product URL, review the scraped details, set a target price, and keep an eye on price changes through a simple dashboard.

Built with **FastAPI**, **React**, and **PostgreSQL**. The application can also be run with **Docker Compose** for a containerized setup.

## ✨ Features

- Track products from Amazon, Flipkart, Myntra, Ajio, and Meesho.
- Scrape product details including title, price, MRP, rating, reviews, and specifications.
- Set a target price and tracking interval.
- View price history in a chart and detailed table.
- Manage tracked products using dashboard search and filters.
- Sign-in and registration screens with form validation.
- Email and push notification functionality; delivery requires the relevant services to be configured.

## 🧰 Technology stack

| Area | Technologies |
|---|---|
| Backend | Python, FastAPI, SQLAlchemy, Pydantic, Uvicorn |
| Database | PostgreSQL |
| Product trackers | Python, BeautifulSoup, Playwright |
| Frontend | React 18, Vite, React Router, Tailwind CSS, Axios |
| Containers | Docker, Docker Compose |

## 📁 Project structure

```text
price-tracker-system/
├── backend/              # FastAPI application
│   ├── api/              # API routes
│   ├── crud/             # Database operations
│   ├── models/           # SQLAlchemy models
│   ├── schema/            # Pydantic schemas
│   ├── services/         # Application services
│   ├── database.py       # Database connection
│   └── main.py           # Application entry point
├── trackers/             # Store-specific product scrapers
├── ui/                   # React and Vite frontend
│   └── src/
│       ├── components/
│       ├── pages/
│       └── services/     # API client layer
└── README.md
```

## 🚀 Getting started

### Run with Docker Compose

**Prerequisites:** [Docker](https://docs.docker.com/get-docker/) with the Docker Compose plugin.

From the project root, configure any environment variables required by your Compose setup, then start the application:

```bash
docker compose up --build
```

To run the containers in the background:

```bash
docker compose up --build -d
```

Stop the application with:

```bash
docker compose down
```

Check the Compose configuration for the services and host ports enabled in your setup. The API's interactive documentation is available at `http://localhost:8000/docs` when the backend is published on port `8000`.

### Run locally

#### Prerequisites

- Python 3.10 or later
- Node.js 18 or later and npm
- PostgreSQL 14 or later

#### 1. Start the backend

Create a PostgreSQL database and configure the backend environment variables (see [Configuration](#configuration)).

```bash
cd backend
python -m venv .venv

# Linux / macOS
source .venv/bin/activate

# Windows PowerShell: .venv\Scripts\Activate.ps1

pip install -r requirements.txt
uvicorn main:app --reload
```

The API runs at `http://localhost:8000`; interactive documentation is at `http://localhost:8000/docs`.

#### 2. Install tracker dependencies

If `trackers/` contains its own `requirements.txt`, install it in the environment used to run the trackers:

```bash
cd trackers
pip install -r requirements.txt
```

#### 3. Start the frontend

```bash
cd ui
npm install
npm run dev
```

The Vite development server runs at `http://localhost:5173`.

## ⚙️ Configuration

Set backend values in `backend/.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/price_tracker
SECRET_KEY=replace-with-a-long-random-secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-email-app-password
```

Set the frontend API URL in `ui/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

For Docker, provide environment values as expected by the project's Compose configuration. Use the relevant `.env.example` files when available. Never commit credentials, secret keys, or populated environment files.

## 🔌 API overview

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/product/track/?product_link=<url>` | Fetch product details from a URL |
| `POST` | `/product/add-product/?user_id=<id>` | Add a product to tracking |
| `GET` | `/product/user/{user_id}` | List products for a user |
| `GET` | `/product/detail/{product_id}` | Retrieve product details |

See `/docs` for request schemas and interactive API exploration.

## 🖥️ Frontend routes

| Route | Description |
|---|---|
| `/` | Landing page |
| `/add-product` | Add-product flow |
| `/dashboard` | Tracked products, search, and filters |
| `/product/:id` | Product details and price history |
| `/signin` | Sign-in and registration experience |
| `/pricing` | Pricing page placeholder |

## 🔄 Typical workflow

1. Submit a supported product URL.
2. Review the scraped product details.
3. Choose a target price and tracking preferences.
4. Save the product and follow its price history from the dashboard.

## 🧪 Testing

Run backend tests from the backend directory:

```bash
cd backend
pytest
```

Frontend test commands depend on the scripts defined in `ui/package.json`.

## 🤝 Contributing

Contributions are welcome. For significant changes, open an issue first. A typical workflow:

```bash
git checkout -b feature/your-change
git commit -m "feat: describe your change"
git push origin feature/your-change
```

Then open a pull request with a concise summary and relevant testing details.

## 👤 Author

**Suraj Jadhav** · [GitHub](https://github.com/surajj04/)

## 🙏 Acknowledgements

[FastAPI](https://fastapi.tiangolo.com/) · [React](https://react.dev/) · [Vite](https://vitejs.dev/) · [Tailwind CSS](https://tailwindcss.com/) · [Docker](https://www.docker.com/)

---

If you find this project useful, consider giving it a ⭐.