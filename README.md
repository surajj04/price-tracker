# Price Tracker System

A full-stack application for tracking product prices across popular Indian e-commerce platforms. Add a product URL, review the scraped product information, set a target price, and follow price changes from a single dashboard.

The project consists of a **FastAPI** backend, Python-based product trackers, and a **React** frontend built with Vite and Tailwind CSS.

## Contents

- [Features](#features)
- [Technology stack](#technology-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [API overview](#api-overview)
- [Frontend routes](#frontend-routes)
- [Testing](#testing)
- [Contributing](#contributing)

## Features

- Track products from Amazon, Flipkart, Myntra, Ajio, and Meesho.
- Scrape product information such as title, price, MRP, rating, reviews, and specifications.
- Set a target price and choose a tracking interval.
- Review price history in a chart and detailed table.
- Manage tracked items from a responsive dashboard with search and filters.
- Sign-in and registration screens with form validation.
- Email and push notification functionality is part of the product experience; delivery requires the relevant services to be configured.

## Technology stack

| Area | Technologies |
|---|---|
| Backend | Python, FastAPI, SQLAlchemy, Pydantic, Uvicorn |
| Database | PostgreSQL |
| Trackers | Python, BeautifulSoup, Playwright |
| Frontend | React 18, Vite, React Router, Tailwind CSS, Axios |

## Project structure

```text
price-tracker-system/
├── backend/              # FastAPI application
│   ├── api/              # API routes
│   ├── crud/             # Database operations
│   ├── models/           # SQLAlchemy models
│   ├── schema/           # Pydantic schemas
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

## Getting started

### Prerequisites

- Python 3.10 or later
- Node.js 18 or later and npm
- PostgreSQL 14 or later

### 1. Configure and run the backend

Create a PostgreSQL database, then configure the backend environment variables (see [Configuration](#configuration)).

```bash
cd backend
python -m venv .venv

# Linux / macOS
source .venv/bin/activate

# Windows PowerShell: .venv\Scripts\Activate.ps1

pip install -r requirements.txt
uvicorn main:app --reload
```

The API is available at `http://localhost:8000`. Interactive API documentation is at `http://localhost:8000/docs`.

### 2. Install tracker dependencies

If the trackers directory contains its own `requirements.txt`, install those dependencies in the environment used to run the trackers:

```bash
cd trackers
pip install -r requirements.txt
```

### 3. Run the frontend

```bash
cd ui
npm install
npm run dev
```

The Vite development server is available at `http://localhost:5173`.

## Configuration

Set the backend configuration in `backend/.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/price_tracker
SECRET_KEY=replace-with-a-long-random-secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-email-app-password
```

Configure the frontend API URL in `ui/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Create local `.env` files from the relevant `.env.example` files when available. Never commit credentials, secret keys, or populated environment files.

## API overview

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/product/track/?product_link=<url>` | Fetch product details from a URL |
| `POST` | `/product/add-product/?user_id=<id>` | Add a product to tracking |
| `GET` | `/product/user/{user_id}` | List products for a user |
| `GET` | `/product/detail/{product_id}` | Retrieve product details |

See the Swagger UI at `/docs` for request schemas and interactive API exploration.

## Frontend routes

| Route | Description |
|---|---|
| `/` | Landing page |
| `/add-product` | Add-product flow |
| `/dashboard` | Tracked products, search, and filters |
| `/product/:id` | Product details and price history |
| `/signin` | Sign-in and registration experience |
| `/pricing` | Pricing page placeholder |

## Typical workflow

1. Submit a supported product URL to the tracking endpoint.
2. Review the scraped product details.
3. Choose a target price and tracking preferences.
4. Save the product and review its recorded price history in the dashboard.

## Testing

Run backend tests from the backend directory:

```bash
cd backend
pytest
```

Frontend test scripts depend on the scripts defined in `ui/package.json`.

## Contributing

Contributions are welcome. For significant changes, open an issue first. A typical contribution workflow is:

```bash
git checkout -b feature/your-change
git commit -m "feat: describe your change"
git push origin feature/your-change
```

Then open a pull request with a concise summary and relevant testing details.

## Author

**Suraj Jadhav** · [GitHub](https://github.com/surajj04/)

## Acknowledgements

[FastAPI](https://fastapi.tiangolo.com/) · [React](https://react.dev/) · [Vite](https://vitejs.dev/) · [Tailwind CSS](https://tailwindcss.com/)

---

If you find this project useful, consider giving it a star.