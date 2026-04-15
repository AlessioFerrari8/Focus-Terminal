# 🎯 Focus Terminal

```
 ____                                 ______                                                ___      
/\  _`\                              /\__  _\                          __                  /\_ \     
\ \ \L\_\___     ___   __  __    ____\/_/\ \/    __   _ __    ___ ___ /\_\    ___      __  \//\ \    
 \ \  _\/ __`\  /'___\/\ \/\ \  /',__\  \ \ \  /'__`\/\`'__\/' __` __`\/\ \ /' _ `\  /'__`\  \ \ \   
  \ \ \/\ \L\ \/\ \__/\ \ \_\ \/\__, `\  \ \ \/\  __/\ \ \/ /\ \/\ \/\ \ \ \/\ \/\ \/\ \L\.\_ \_\ \_ 
   \ \_\ \____/\ \____\\ \____/\/\____/   \ \_\ \____\\ \_\ \ \_\ \_\ \_\ \_\ \_\ \_\ \__/.\_\/\____\
    \/_/\/___/  \/____/ \/___/  \/___/     \/_/\/____/ \/_/  \/_/\/_/\/_/\/_/\/_/\/_/\/__/\/_/\/____/
```

A web-based terminal emulator built with Angular that combines productivity tools with a focus session timer. Replicate the feel of a classic terminal while managing your tasks, pomodoro sessions, and productivity metrics.

## ✨ Features

- **⏱️ Pomodoro Timer** - Customizable work/break intervals with automatic switching
- **📝 Task Management** - Add, complete, and track your daily tasks in a terminal interface
- **🎵 Ambient Sounds** - Play background music (rain, white noise, lofi) while working
- **👤 User Authentication** - Firebase auth for syncing data across devices
- **📊 Productivity Stats** - Track sessions, daily streaks, weekly stats, and personal records
- **🎨 Theme System** - Multiple color themes (green, amber, red, cyan)
- **💾 Data Persistence** - Cloud sync with Firestore for all data
- **⚙️ Customizable Settings** - Adjust pomodoro durations to your preference

## 🚀 Quick Start

### Online
Visit the deployed website directly (no setup needed)

### Local Development

```bash
# Install dependencies
npm install

# Start dev server
ng serve

# Navigate to http://localhost:4200/
```

## 📋 Available Commands

### Timer Commands
- `start [min]` — Start a focus session (default: 25 min)
- `stop` — Stop the current session
- `status` — Show active timer details
- `pomodoro` — Start pomodoro mode (25min work / 5min break)

### Task Management
- `add [task]` — Add a new task
- `done [n]` — Mark task n as completed
- `todos` — List all tasks
- `clear` — Clear the terminal

### Settings
- `settings` — View current settings
- `settings <key> <value>` — Update a setting
  - `pomodoro-work [minutes]` — Set work duration
  - `pomodoro-break [minutes]` — Set break duration

### Statistics & Profile
- `sessions` — View all completed sessions
- `stats` — Show productivity statistics
- `weekly` — View weekly breakdown
- `profile` — Display user profile and achievements

### Customization
- `theme [color]` — Change theme (green, amber, red, cyan)
- `play [type]` — Play ambient sounds (rain, white-noise, lofi)
- `pause` — Stop music

### Authentication
- `auth login <email> <password>` — Login to your account
- `auth register <email> <password>` — Create a new account
- `auth logout` — Logout from current session
- `auth status` — Show currently logged user

### Help
- `help` — Show all available commands

## 🛠️ Tech Stack

### Frontend
- **Angular 19+** - Modern component framework with signals
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **RxJS** - Reactive programming library

### Backend & Services
- **Firebase Authentication** - Secure user authentication
- **Firestore** - Real-time cloud database
- **Web Audio API** - Ambient sound playback

### Build Tools
- **Vite** - Lightning fast build tool
- **Vitest** - Unit testing framework
- **Angular CLI** - Development server & build tooling

## 📁 Project Structure

```
focus-terminal/
├── src/
│   ├── app/
│   │   ├── services/
│   │   │   ├── timer.ts           # Pomodoro timer logic
│   │   │   ├── todo.ts            # Task management
│   │   │   ├── command-parser.ts   # CLI command parsing
│   │   │   ├── audio.ts           # Sound playback
│   │   │   ├── auth.ts            # Firebase authentication
│   │   │   └── firestore-sync.ts   # Cloud data sync
│   │   ├── app.ts                 # Main terminal component
│   │   ├── app.routes.ts          # Route definitions
│   │   └── core/
│   │       └── interceptors/
│   │           └── error-interceptor.ts
│   ├── index.html
│   ├── main.ts
│   └── styles.css
├── public/
│   ├── banner.txt                 # Terminal ASCII art
│   └── config.json                # App configuration
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── angular.json
```

## 🔧 Development

### Generate new component
```bash
ng generate component path/to/component-name
```

### Run tests
```bash
ng test
```

### Build for production
```bash
ng build --configuration production
```

The build output will be stored in the `dist/` directory, optimized for performance.

## 🔐 Configuration

Create a `config.json` in the `public/` folder for Firebase and app settings:

```json
{
  "firebase": {
    "apiKey": "YOUR_API_KEY",
    "projectId": "YOUR_PROJECT_ID",
    "authDomain": "YOUR_AUTH_DOMAIN"
  }
}
```

## 📊 Data Stored in Firestore

When logged in, the following data syncs to the cloud:
- **Sessions** - Completed timer sessions with timestamps and durations
- **Tasks** - Your todo list items
- **Theme** - Your preferred color theme
- **Settings** - Custom pomodoro durations

## 🎮 Usage Tips

1. **First Time?** Type `help` to see all available commands
2. **Focus Mode** - Use `pomodoro` to auto-switch between work and break periods
3. **Custom Duration** - Adjust settings with `settings pomodoro-work 30` for 30-minute sessions
4. **Sync Across Devices** - Login with your account to access your data everywhere
5. **Track Progress** - Use `stats` and `weekly` commands to monitor your productivity

## 🚀 Deployment

The app is deployed on Vercel. Push to the main branch to trigger automatic deployment.

## 📝 License

Built with ❤️ by Ferro

---

**Happy Focusing! 🎯**