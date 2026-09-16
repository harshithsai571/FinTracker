# FinTracker — Version 1.0.0

> **Premium Local-First Personal Finance Management PWA**  
> *Track expenses, income, and external family money with Indian Rupee (₹) precision, zero cloud dependencies, and full offline capability.*

---

## 1. Project Overview

**FinTracker** is an installable, mobile-first progressive web application (PWA) designed to provide individuals, students, and professionals with total command over their daily finances.

Unlike generic spreadsheets or cloud-dependent finance trackers, FinTracker operates on a **local-first architecture**:
* All data resides securely on the user's device using **IndexedDB**.
* No external backend, telemetry, or server login is required for V1.
* Works seamlessly **offline** and can be installed directly from modern browsers to iOS and Android home screens.
* Deployed as a static SPA on **GitHub Pages** with automated GitHub Actions CI/CD.

---

## 2. Key Features

### 💎 Dashboard & Overview
* **Total Available Balance**: Instantly displays your current liquid financial standing (Regular Income + External Received Money − Total Expenses).
* **Monthly Summary Card**: Switch between any month (current, previous, or custom) to view Monthly Income, Expenses, Net Savings, and Transaction Count.
* **Spending Category Breakdown**: Visual progress bars ranking top spending categories for the active month.
* **Other Money Summary Widget**: Compact preview showing Total Received, Used, and Remaining for family funds.
* **Recent Transactions**: Quick access to recent activity with category icons, date/time, and a "View All" link.

### ⚡ Fast Transaction System
* **Instant Entry Modal**: Accessible via the prominent central **+** button on mobile or desktop header.
* **Large Amount Input**: Prominent keypad-ready numeric field with ₹ currency indicator.
* **Expense vs. Income Switch**: Quick pill toggle with tactile color indicators.
* **Category Picker**: Categorized grid with customized icons and color badges.
* **Paid From (Source Linking)**: Option to link an expense to an "Other Money" source (e.g. *Dad's Money*) to deduct directly from that pool.
* **Payment Methods**: Cash, UPI, Card, Bank, and Other.
* **Daily Grouping**: Transactions are organized by day ("Today", "Yesterday", "Sep 16, 2026") with day-by-day expenditure totals.
* **Details & Editing**: Tap any transaction to view timestamps, edit fields, or safely delete with confirmation.

### 👨‍👩‍👧 Dedicated "Other Money" System
Designed for funds received from parents, family, stipends, or scholarships that need isolated tracking:
* **Custom Sources**: Pre-seeded with *Dad's Money*, *Mom's Money*, *Scholarship*, and *Freelance*, plus the ability to create new custom sources.
* **Fund Formula**: `Total Received − Money Used = Remaining Balance`.
* **Deposit History**: Record individual deposits with timestamps and notes (e.g. "Monthly money ₹3,000", "Exam fee support ₹2,000").
* **Expense Tracking**: View all expenses linked to each specific source.
* **Source Editing & Deletion Safeguards**: Protects sources while preserving transaction data.

### 📊 Reports & Actionable Insights
* **Flexible Timeframes**: Analyze by *This Month*, *Last Month*, *Last 3 Months*, *This Year*, or *All Time*.
* **Key Metric Highlights**: Total Income, Total Expenses, Net Savings Rate (%), Highest Spending Category, and Average Daily Spend.
* **Monthly Trend Chart**: Responsive SVG dual-bar chart visualizing income vs. expense progression over recent months.
* **Category Spending Table**: Complete percentage distribution with color-coded progress bars.

### 🏷️ Category Management
* **Comprehensive Default Set**: Over 25 standard categories across Food, Travel, Personal, Bills, Income, and Other.
* **Custom Categories**: Add custom categories with custom Lucide icons and vibrant color accents.
* **Protective Migration**: Deleting a category with existing transactions prompts the user to migrate those transactions to another category, preventing orphaned records.

### 🛡️ Defensive Data Import & Export
* **JSON Full Backup**: Exports the entire database (transactions, categories, sources, receipts, settings) into a single timestamped JSON file (`FinTracker_Backup_YYYY-MM-DD.json`).
* **CSV Export**: Clean, spreadsheet-friendly export compatible with Excel, Google Sheets, and LibreOffice with sanitization against formula injection (`=`, `@`, `+`, `-`).
* **Defensive Import Validator**:
  * Reads JSON backups or CSV files.
  * Validates required columns, positive amounts, dates, and categories.
  * Detects potential duplicates against existing records.
  * Displays an interactive **Preview Modal** with record counts and issue summaries before committing changes.
  * Offers **Merge Data** or **Replace Everything** import modes.

### 📱 Installable PWA & Update Engine
* **Web App Manifest**: Configured for standalone display mode, orientation lock, and dark/light theme integration.
* **Offline Caching**: Service worker precaches all application assets and icons.
* **In-App Version Update Alert**: When a new version is deployed to GitHub Pages, a polite slide-up notification offers **"Update Now"** (activates new worker and reloads without interrupting active forms) or **"Later"**.
* **PWA Install Banner**: Displays an "Install FinTracker" banner when viewed in compatible mobile browsers.

### 🌓 Themes & Accessibility
* **Dark, Light, and System Modes**: Seamless toggle with high-contrast surfaces, readable text, and persistent preferences.
* **Responsive Layout**: Mobile bottom navigation bar with elevated floating **+** button; desktop sidebar layout for larger screens.

---

## 3. Technologies Used

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) | Type-safe UI components and state management |
| **Build Tool** | [Vite 5](https://vitejs.dev/) | Sub-second HMR and optimized production bundling |
| **Styling** | [Tailwind CSS 3](https://tailwindcss.com/) | Utility-first styling with custom fintech color palette and dark mode |
| **Icons** | [Lucide React](https://lucide.dev/) | Clean, consistent icons for categories and UI |
| **Routing** | [React Router 6](https://reactrouter.com/) (`HashRouter`) | Zero-404 routing across GitHub Pages subpaths and offline environments |
| **Local Database** | [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) via [`idb`](https://github.com/jakearchibald/idb) | Transactional, structured local-first persistence |
| **PWA & SW** | [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/) (Workbox) | Offline precaching, service worker generation, and update detection |
| **Native Shell** | [Capacitor 8](https://capacitorjs.com/) (`@capacitor/android`, `@capacitor/app`, etc.) | Android runtime shell, back button handling, status bar, and splash screen |
| **CI/CD** | GitHub Actions | Automated build and deployment to GitHub Pages |

---

## 4. Project Structure

```text
FinTracker/
├── .github/
│   └── workflows/
│       └── deploy.yml              # Automated GitHub Pages CI/CD workflow
├── android/                        # Capacitor native Android project
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml # Zero-privilege manifest (INTERNET only)
│   │   │   ├── java/com/fintracker/app/MainActivity.java
│   │   │   └── res/                # Branded ₹ adaptive launcher icons & splash screens
│   │   └── build.gradle
│   ├── gradle/
│   └── build.gradle
├── public/
│   ├── favicon.svg                 # Indian Rupee vector favicon
│   ├── pwa-192x192.png             # PWA app icon (192x192)
│   ├── pwa-512x512.png             # PWA app icon (512x512)
│   └── pwa-512x512-maskable.png    # Maskable PWA app icon
├── scripts/
│   └── postbuild.js                # Generates dist/404.html for GitHub Pages SPA
├── tests/
│   └── test-logic.js               # Node.js unit tests for calculations & formatting
├── src/
│   ├── assets/                     # SVG logos and brand assets
│   ├── components/
│   │   ├── common/                 # Button, Modal, Card, Badge, EmptyState, ConfirmDialog
│   │   ├── dashboard/              # BalanceCard, MonthlySummary, SpendingOverview, RecentTransactions, OtherMoneyWidget
│   │   ├── layout/                 # AppLayout, Header, BottomNav, DesktopSidebar
│   │   ├── otherMoney/             # AddMoneyReceiptModal, AddMoneySourceModal, SourceDetailModal
│   │   ├── pwa/                    # UpdateNotificationPrompt, InstallPwaBanner
│   │   ├── settings/               # DataImportModal
│   │   └── transactions/           # TransactionFormModal, TransactionDetailModal, TransactionItem
│   ├── config/
│   │   ├── defaultCategories.ts    # 25+ default categories & initial money sources
│   │   └── version.ts              # Centralized versioning (v1.0.0) and changelog
│   ├── context/
│   │   ├── FinanceContext.tsx       # Global finance state & IndexedDB synchronization
│   │   ├── ThemeContext.tsx         # Dark / Light / System theme manager
│   │   └── ToastContext.tsx         # In-app toast alerts
│   ├── db/
│   │   ├── index.ts                # Repositories (Transaction, Category, Source, Receipt, Settings)
│   │   └── schema.ts               # IDB schema v1 definition
│   ├── hooks/
│   │   ├── useNativeApp.ts          # Android hardware back button, status bar & keyboard bridge
│   │   └── usePwaUpdate.ts          # Service worker update detection hook
│   ├── pages/
│   │   ├── CategoriesPage.tsx      # Custom category manager with migration safeguards
│   │   ├── DashboardPage.tsx       # Primary financial dashboard
│   │   ├── MorePage.tsx            # Mobile navigation hub
│   │   ├── OtherMoneyPage.tsx      # Family/scholarship money tracker
│   │   ├── ReportsPage.tsx         # Analytics and visual trend reports
│   │   ├── SettingsPage.tsx        # Preferences, backups, and app info
│   │   └── TransactionsPage.tsx    # Transaction history with search & filters
│   ├── services/
│   │   ├── exportService.ts        # JSON backup & CSV spreadsheet generation
│   │   ├── importService.ts        # Defensive JSON/CSV parser and duplicate detector
│   │   └── native/                 # Platform detection & future native detection interface
│   ├── types/
│   │   ├── category.ts
│   │   ├── otherMoney.ts
│   │   ├── settings.ts
│   │   └── transaction.ts
│   ├── utils/
│   │   ├── cn.ts                   # Tailwind class merge helper
│   │   ├── currency.ts             # Indian Rupee (₹) formatting with Lakhs/Crores
│   │   ├── dates.ts                # Date formatting and grouping helpers
│   │   └── sanitize.ts             # CSV and text sanitization
│   ├── App.tsx                     # Top-level routing & context providers
│   ├── index.css                   # Tailwind styles and mobile safe-area insets
│   └── main.tsx                    # React mounting entry point
├── capacitor.config.ts             # Capacitor configuration (appId: com.fintracker.app)
├── index.html                      # HTML root with PWA meta tags
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts                  # Vite + PWA + Rollup manualChunks config
```

---

## 5. How to Run Locally

### Prerequisites
* **Node.js**: `v18+` (Tested on `v22.14.0`)
* **npm**: `v9+` (Tested on `10.9.2`)

### Steps
1. Clone or open the repository:
   ```bash
   cd FinTracker
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the local development server:
   ```bash
   npm run dev
   ```
4. Open the displayed URL in your browser:
   ```text
   http://localhost:5173/
   ```

### Running Unit Tests
To verify all calculation logic, formatting, and sanitization:
```bash
npm test
```
*(Runs `node --test tests/test-logic.js`)*

---

## 6. How to Build Production Version

To produce the optimized static bundle:
```bash
npm run build
```

This will:
1. Run `tsc -b` for strict type checking.
2. Build minified JavaScript and CSS assets into `dist/`.
3. Split vendor chunks (`vendor-react`, `vendor-idb`).
4. Generate `dist/sw.js` and precached Workbox assets for PWA offline operation.
5. Execute `scripts/postbuild.js` to create `dist/404.html` for GitHub Pages.

To preview the built production site locally:
```bash
npm run preview
```

---

## 7. How to Deploy to GitHub Pages

FinTracker includes a preconfigured GitHub Actions workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

### Step-by-Step Setup:
1. **Initialize Git Repository** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial release of FinTracker V1"
   ```
2. **Create a GitHub Repository**:
   * Create a new repository on GitHub named `FinTracker` (or your preferred name).
3. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/<your-username>/FinTracker.git
   git branch -M main
   git push -u origin main
   ```
4. **Enable GitHub Pages**:
   * Go to your repository on GitHub: **Settings** > **Pages**.
   * Under **Build and deployment** > **Source**, select **GitHub Actions**.
5. **Automatic Deployment**:
   * Pushing to `main` will automatically trigger the workflow in `.github/workflows/deploy.yml`.
   * The workflow builds the project with `VITE_BASE_PATH: './'` and publishes `dist/` directly to GitHub Pages.
6. **Accessing the App**:
   * Once the action completes (typically 1–2 minutes), your PWA will be live at:
     ```text
     https://<your-username>.github.io/FinTracker/
     ```

---

## 8. How to Install the PWA on Mobile Devices

### On Android (Chrome / Edge / Brave / Firefox)
1. Open the deployed application URL in Chrome: `https://<your-username>.github.io/FinTracker/`.
2. A prompt **"Install FinTracker PWA"** will appear automatically at the top of the screen. Tap **Install**.
3. If not shown, tap the browser's **three dots (⋮)** menu and select **"Add to Home screen"** or **"Install App"**.
4. FinTracker will appear on your home screen and app drawer with the native ₹ logo and launch in standalone full-screen mode.

### On iOS (Safari)
1. Open the deployed application URL in Safari: `https://<your-username>.github.io/FinTracker/`.
2. Tap the **Share button** (square with an upward arrow) at the bottom toolbar.
3. Scroll down and tap **"Add to Home Screen"**.
4. Confirm the name **FinTracker** and tap **Add**.
5. FinTracker will launch without Safari URL bars and function offline.

---

## 9. Android App Development & Native Build (Capacitor)

FinTracker includes a complete native Android application shell built with **Capacitor 8**. The native Android project is located in `android/` with package ID `com.fintracker.app`.

### 🏗️ Hybrid Architecture Overview
* **Web UI Layer**: The production React 18 SPA (compiled into `dist/`) is copied into `android/app/src/main/assets/public/` during sync.
* **Capacitor Native Shell**: Boots the WebView at `http://localhost`, maintaining identical IndexedDB persistence, PWA offline caching, and responsive rendering.
* **Hardware Bridge**:
  * **Android Back Button**: Handled via `@capacitor/app`. Hardware back presses pop open modals first; if no modals are active, navigate backward in history; and only exit the application when at the root route (`/`).
  * **Status Bar Integration**: Dynamically toggles between Light and Dark status bar styles via `@capacitor/status-bar` to seamlessly match FinTracker's theme palette.
  * **Splash Screen**: Managed via `@capacitor/splash-screen` with a custom emerald theme (`#059669`) and Indian Rupee brand icon.
  * **Keyboard Resizing**: Configured with `KeyboardResize.Body` to ensure form inputs remain fully visible when the soft keyboard appears.
* **Zero-Permission Privacy Guarantee**: FinTracker's `AndroidManifest.xml` only requests standard `android.permission.INTERNET`. No background SMS reading, notification listening, or sensitive phone permissions are requested in this phase.

### 📋 Prerequisites
* **Node.js**: `v18+` (Tested on `v22.14.0`)
* **Java Development Kit (JDK)**: JDK 17 or JDK 21 (Tested on `openjdk 21.0.9`)
* **Android SDK**: Android 14+ (API 34/35/36) installed via Android Studio or command-line tools
  * Set `ANDROID_HOME` or configure `android/local.properties`:
    ```properties
    sdk.dir=C:\\Android\\Sdk
    ```

### 🛠️ CLI Commands & Workflow

#### 1. Build and Synchronize Web Assets to Android
Whenever you modify web source files, sync them to the Android project:
```bash
npm run android:sync
```
*(Runs `npm run build && npx cap sync android`)*

#### 2. Open Project in Android Studio
To inspect native code, run in Android emulators, or use the visual layout inspector:
```bash
npm run android:open
```
*(Runs `npx cap open android`)*

#### 3. Build Debug APK via Command Line
To compile a standalone debug APK without opening Android Studio:
```bash
npm run android:build
```
The compiled APK will be generated at:
```text
android/app/build/outputs/apk/debug/app-debug.apk
```

#### 4. Install APK on a Physical Android Device
1. Enable **Developer Options** and **USB Debugging** on your Android device.
2. Connect your device via USB.
3. Install and run via `adb`:
   ```bash
   adb install -r android/app/build/outputs/apk/debug/app-debug.apk
   ```

---

## 10. Future Native Feature Architecture (V2 Specification)

> [!NOTE]
> FinTracker V1 intentionally omits background SMS reading and notification listener services to ensure maximum platform stability, privacy compliance, and cross-platform consistency. The architecture is designed with modular abstractions in `src/services/native/` ready for future expansion.

```mermaid
graph TD
    A["Android Native Service<br/>(SMS Receiver / NotificationListener)"] -->|"Extract raw message string"| B["Local Regex Extraction Engine<br/>(UPI ref, Bank, Amount, Date)"]
    B -->|"Draft Transaction Payload"| C["Staging Review Queue<br/>(Pending Approval Table)"]
    C -->|"Notify UI"| D["FinTracker Review Modal<br/>(Amount, Category, Paid-From)"]
    D -->|"User Approves & Assigns"| E["FinanceContext / IndexedDB<br/>(Committed to Ledger)"]
    D -->|"User Dismisses"| F["Discard Draft<br/>(Zero False Records)"]
```

### Future Transaction Pipeline (6 Stages):
1. **SMS & Notification Ingestion**: Android native `BroadcastReceiver` / `NotificationListenerService` capturing incoming SMS or banking push notifications (e.g. HDFC, SBI, ICICI, Google Pay, PhonePe, Paytm).
2. **Local Regex Extraction**: Extracts transaction amount (`₹X,XXX.XX`), transaction type (`debited` vs `credited`), counterparty/merchant, and bank/UPI reference number entirely on-device without cloud transmission.
3. **Staging Review Queue**: Incoming detections are placed in a staging queue (`pendingTransactions`). **No transactions are ever automatically written to the main ledger without explicit user confirmation.**
4. **Interactive Approval UI**: When the user opens the app, a banner alerts them: *"1 new transaction detected from UPI: ₹450 to Swiggy. Review?"*
5. **Smart Category Suggestion & Memory**: Suggests categories based on past merchant mappings (e.g. "Swiggy" → *Food & Dining*).
6. **Persistence**: Upon user confirmation, commits the transaction to IndexedDB with full balance recalculation.

---

## 11. How the Update System Works

1. When a new version is pushed to GitHub Pages, the browser's background Service Worker detects the updated build hash during its registration cycle.
2. The `usePwaUpdate` hook listens for the `needRefresh` event from Workbox.
3. A non-intrusive slide-up modal appears:
   > **New FinTracker version available**  
   > *We've added improvements and fixes. Your financial data is securely preserved.*  
   > `[Later]` `[Update now]`
4. **If the user taps "Later"**: The notification is dismissed, and the user can continue logging transactions uninterrupted.
5. **If the user taps "Update now"**:
   * `updateServiceWorker(true)` is invoked.
   * The new Service Worker calls `skipWaiting()`.
   * The window reloads smoothly.
   * **All financial records in IndexedDB remain 100% untouched and preserved.**
6. *On native Android builds, the app runs offline from local assets with no update prompt displayed.*

---

## 12. How Data is Stored

All application state is persisted in the client's browser using **IndexedDB**:
* **Database Name**: `fintracker_db`
* **Version**: `1`
* **Object Stores**:
  * `transactions`: Keyed by `id`, indexed by `date`, `categoryId`, `sourceId`, and `type`.
  * `categories`: Keyed by `id`, indexed by `group` and `type`.
  * `moneySources`: Keyed by `id`.
  * `moneyReceipts`: Keyed by `id`, indexed by `sourceId` and `date`.
  * `settings`: Key-value configuration for currency, active theme, and app version.

The data layer uses an abstracted repository architecture (`src/db/index.ts`). UI components interact only through `FinanceContext`, ensuring that future database upgrades or remote adapters can be plugged in without refactoring UI components.

---

## 13. Known Limitations in V1

* **Single Device Persistence**: Because V1 is local-first without a cloud database, data entered on one phone does not automatically sync to another phone without using the **JSON Export & Import** feature.
* **Browser Storage Eviction Safeguard**: While modern browsers preserve IndexedDB reliably, clearing browser site data manually in browser settings will delete local storage. *Always keep regular JSON backups via Settings > Export JSON Backup.*
* **PWA on Incognito / Private Mode**: Browsers disable IndexedDB persistence across sessions in private browsing windows.

---

## 14. Recommended Roadmap for V2

1. **Optional Google / Passkey Cloud Sync**:
   * End-to-end encrypted backup to Google Drive or optional private cloud server.
   * Multi-device synchronization with conflict resolution.
2. **Native SMS & Notification Transaction Detection**:
   * Add Android SMS receiver and notification listener plugins for automated transaction drafts as designed in Section 10.
3. **Budgeting & Spending Limits**:
   * Monthly budget limits per category (e.g. Food budget of ₹5,000) with visual warning alerts.
4. **Recurring Transactions**:
   * Automated scheduling for monthly rents, subscriptions, recharge, or salaries.
5. **Biometric Security**:
   * Native biometric authentication (Fingerprint / Face Unlock) via `@capacitor/biometrics`.
6. **Receipt Attachment Support**:
   * Store compressed bill/receipt photos offline using IndexedDB Blob storage.

