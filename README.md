# Kuroyomi

Kuroyomi is a lightweight, responsive, and retro-styled comic/manga reader web client. It interfaces directly with a local **Suwayomi-Server** (or compatible Tachiyomi/Mihon-based server APIs) to fetch, track, and read manga using native web technologies.

## Features

- **Multi-User Isolation:** Multi-user logins with separate libraries, reading history, and progress tracking saved locally and synced with the backend.
- **Custom Localization (i18n):** Native, zero-dependency lightweight localization system supporting both **English** and **Indonesian**.
- **Role-Based Access Control:** Restricted access to administrative settings (like "Kuroyomi Server Status" and "Extension Repositories") to the `admin` account only.
- **Dual Reading Modes:**
  - **Webtoon Mode:** Continuous vertical scroll with intersection observers tracking page progress dynamically.
  - **Single Page Mode:** Page-by-page rendering with arrow key navigation.
- **Default Application Configurations:**
  - **Theme:** Dark Mode (Tokyo Night Day / Tokyo Night Classic themes supported).
  - **Reading Mode:** Webtoon / vertical scroll default.
  - **Language:** English default.
- **Library Categories:** Organize manga into categories (like *Membaca* / *Selesai*) with customizable sorting and category deletion.
- **Image Prefetching:** Automatic background loading of upcoming pages to minimize server spikes and delay.

## Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Styling:** CSS Custom Properties (Variables) for retro comic theme styling and layouts
- **Icons:** Lucide React
- **API Integration:** REST API & GraphQL client querying local Suwayomi endpoints

## Getting Started

### Prerequisites

1. Ensure **Suwayomi-Server** is running on your machine or network (default port `4567`).
2. Node.js (v18 or higher recommended).

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/kuroyomi.git
   cd kuroyomi
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build the application for production:
   ```bash
   npm run build
   ```

## Configuration

- By default, the application runs on port `5173` or `5174` and communicates with the backend Suwayomi server at `http://localhost:4567`.
- Go to the **Settings** tab to change the application language, default reading modes, themes, or manage your account password.
- Log in as the `admin` user to manage extension repositories (e.g. adding the Keiyoushi repository) and view server connection parameters.
