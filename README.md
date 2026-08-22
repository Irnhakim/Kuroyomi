<p align="center">
  <img src="public/logo.svg" alt="Kuroyomi Logo" width="320" />
</p>

<p align="center">
  <strong>Web-based manga reader client built for Suwayomi-Server</strong>
</p>

---

Kuroyomi is a lightweight, responsive, and retro-themed web client for manga readers. It integrates directly with your self-hosted [Suwayomi-Server](https://github.com/Suwayomi/Suwayomi-Server) backend, using its GraphQL and REST APIs to manage your libraries, extensions, reading history, and progress.

Designed with a neo-brutalist Tokyo Night color scheme, it scales dynamically from small mobile viewports to large desktop monitors.

## Core Features

- **Direct Suwayomi Integration:** Serves as a full replacement for the default web UI. Directly loaded and served by your Kotlin backend.
- **Dynamic Multi-User Support:** User accounts with isolated library categories, reading history, and custom configurations.
- **Multi-Repository Extension Manager:** List, add, and remove multiple extension sources (e.g. Keiyoushi) through the admin panel. Handles network timeouts gracefully via offline fallbacks.
- **Two Reading Engines:**
  - *Webtoon Mode:* Vertical continuous scroll with page-change detection via intersection observers.
  - *Single Page Mode:* Left-to-right keyboard-controlled page swapper.
- **Lightweight Design:** Responsive, low-contrast Tokyo Night themes (Day and Classic Night styles) that load fast and reduce eye strain.
- **Preloading Engine:** Pre-fetches upcoming images in the background to prevent loading gaps during fast reading.

---

## Technical Architecture

```
┌──────────────────┐      Vite Dev / Nginx
│  Kuroyomi Client │  ◄───────────────────────►  Web Browser
└────────┬─────────┘                             (Port 5173 / 4567)
         │
         │ REST & GraphQL (CORS-safe dynamic routing)
         ▼
┌──────────────────┐
│ Suwayomi-Server  │  ◄──► Local database & cache directory
└──────────────────┘
```

---

## Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **Java Runtime Environment (JRE 17+)** (needed to run the Suwayomi backend)

### Installation
1. Clone this repository to your workspace:
   ```bash
   git clone https://github.com/Irnhakim/Kuroyomi.git
   cd Kuroyomi
   ```

2. Install the node modules:
   ```bash
   npm install
   ```

### Local Development
To run both Vite's hot-reload server and the Kotlin Suwayomi server concurrently:
```bash
npm run dev
```
Once initialized:
- Open your browser at `http://localhost:5173` (Vite dev server with Hot Module Replacement).
- The Suwayomi-Server backend runs on `http://localhost:4567`.

---

## Production Deployment (CasaOS / Linux VPS)

To deploy Kuroyomi efficiently on low-resource hardware (e.g., CasaOS with 2GB RAM) without Docker, you can run it as a single process managed by **PM2**.

### 1. Build the production bundle (Lokal)
Compile your TypeScript and bundle static assets into the `dist/` directory:
```bash
npm run build
```

### 2. Compile the backend Jar (Lokal)
Kombilasi source code Kotlin backend menjadi file `.jar` mandiri:
```bash
cd server
# Windows:
.\gradlew.bat server:shadowJar
# Linux/macOS:
chmod +x gradlew && ./gradlew server:shadowJar
```
This produces the artifact under `server/server/build/libs/server-<version>-all.jar`.

### 3. Deploy to Server
1. Create a directory on your Linux server (e.g., `/var/www/kuroyomi`).
2. Upload the `dist/` folder and the compiled `server.jar` to this directory.
   ```text
   /var/www/kuroyomi/
     ├── server.jar
     └── dist/
   ```

### 4. Run with PM2
Launch the backend using PM2 with maximum JVM RAM limits to keep it lightweight (~250MB RAM):
```bash
cd /var/www/kuroyomi
pm2 start "java -Xmx256m -Xms128m -jar server.jar" --name "kuroyomi"
```

Access the unified application directly in your browser at `http://<YOUR-SERVER-IP>:4567`.

---

## Development Customizations

- **API Endpoints:** Managed dynamically in [api.ts](src/services/api.ts). Base hosts are dynamically bound to the current window location to prevent cross-origin CORS errors.
- **Custom Coloring:** Theme stylesheets are located in [index.css](src/index.css) using CSS variable overrides (`--bg-color`, `--text-color`, etc.).
