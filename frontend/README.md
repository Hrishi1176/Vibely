# Vibely — Frontend Web & Mobile App (PWA)

React + Vite + Tailwind CSS frontend for **Vibely AI Social Platform**.

## 🚀 Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start local development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

3. Production Build:
   ```bash
   npm run build
   ```

---

## ⚙️ Environment Variables

Create a `.env` file in `frontend/`:

```env
# Optional: Set live backend URL for production deployment (defaults to http://localhost:8000/api/v1)
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

## 📱 Progressive Web App (PWA) Features

Vibely is configured with `manifest.json` and mobile touch viewport meta tags:
- **Mobile Installation**: Tap "Add to Home Screen" in Chrome (Android) or Safari (iOS).
- **Responsive Layout**: Includes desktop `Sidebar` and mobile `BottomNav` tab bar.
