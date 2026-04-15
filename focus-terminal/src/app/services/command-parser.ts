import { Injectable } from '@angular/core';

export type CommandResult = {
  output: string[];
  action?: 'START_TIMER' | 'STOP_TIMER' | 'RESET' | 'CLEAR' 
  | 'HELP' | 'SESSIONS_HISTORY' | 'STATUS' | 'CHANGE_THEME' 
  | 'ADD_TASK' | 'TODOS' | 'DONE' | 'POMODORO' | 'PLAY' 
  | 'PAUSE' | 'LOGIN' | 'REGISTER' | 'LOGOUT' | 'AUTH_STATUS'
  | 'STATS' | 'WEEKLY' | 'PROFILE' | 'SETTINGS' 
  | 'DRINK' | 'DRINKS';
  duration?: number; // durata del timer
  theme?: string;
  task?: string;
  n?: number;
  genre?: string;
  email?: string;
  password?: string;
  key?: string; // chiave del setting 
  drinkType?: string; // monster, redbull
}

// help
const HELP_TEXT = [  
  'Available commands:',
  '  add [task]         — adds a task',
  '  auth login         — login with email and password',
  '  auth logout        — logout from account',
  '  auth register      — register with email and password',
  '  auth status        — current user',
  '  clear              — clean the terminal',
  '  done [n]           — completes a task',
  '  drink [type]       — log a beverage (monster, coffee, energy)',
  '  drinks             — show today beverages',
  '  help               — show this message',
  '  pause              — stop music',
  '  play [type]        — plays some music',
  '  pomodoro           — start a session with 5 min pause',
  '  profile            — shows the profile of a user',
  '  sessions           — shows history',
  '  settings           — view settings or "settings <key> <value>"',
  '  start [min]        — start a session (default 25 min)',
  '  stats              — shows stats with sessions',
  '  status             — shows the active timer',
  '  stop               — stops a session',
  '  theme [color]      — choose theme',
  '  todos              — shows all tasks',
  '  weekly             — stats for every day of the week',
];

// opzioni disponibili per i comandi
const COMMAND_OPTIONS = {
  theme: ['green', 'amber', 'red', 'cyan'],
  play: ['rain', 'white-noise', 'lofi'],
};

@Injectable({providedIn: 'root',})
export class CommandParser {
  parse(input: string): CommandResult {
    const [cmd, ...args] = input.trim().toLowerCase().split(' ');
    
    switch (cmd) {
      case 'help':
        return { output: HELP_TEXT, action: 'HELP' };
      case 'start':
        const minutes = parseInt(args[0]) || 25
        return { output: [`▶️ Starting ${minutes}min focus session...`], action: 'START_TIMER', duration: minutes };
      case 'stop':
        return { output: ['⏹️ Session stopped.'], action: 'STOP_TIMER' }
      case 'clear':
        return { output: [], action: 'CLEAR' };
      case 'status':
        return { output: ['⏱️ No active session.'], action: 'STATUS' };
      case 'sessions':
        return { output: [], action: 'SESSIONS_HISTORY'}
      case 'theme':
        const theme = args[0] || null;
        if (!theme) {
          return { 
            output: ['🎨 Available themes:', `  ${COMMAND_OPTIONS.theme.join('  ')}`, '  Usage: theme [color]'], 
            action: 'CHANGE_THEME' 
          };
        }
        return { output: [`🎨 Switching to ${theme} theme`], action: 'CHANGE_THEME', theme }
      case 'settings':
        const key = args[0];
        const value = args[1];
        if (!key) {
          // mostra tutti i settings correnti
          return { 
            output: ['Settings available:', '  pomodoro-work (minutes)', '  pomodoro-break (minutes)', 'Usage: settings <key> <value>'], 
            action: 'SETTINGS'
          };
        }
        if (!value) {
          return { output: [`Usage: settings ${key} <value>`], action: 'SETTINGS' };
        }
        // parso il valore in pos 1
        const numValue = parseInt(value);
        if (isNaN(numValue) || numValue <= 0) {
          return { output: ['Value must be a positive number'], action: 'SETTINGS' };
        }
        return { output: [`⚙️ Settings updated!`], action: 'SETTINGS', key, n: numValue }
      case 'add':
        const task = args.join(' ') || '';
        return { output: [`✅ Task added correctly`], action: 'ADD_TASK', task }
      case 'todos':
        return { output: [], action: 'TODOS' }
      case 'done':
        const n = parseInt(args[0]);
        if (isNaN(n)) return { output: ['Usage: done [number]'] };
        return { output: [`✅ Task ${n} completed!`], action: 'DONE', n }
      case 'pomodoro':
        return { output: [`🍅 Starting Pomodoro mode...`], action: 'POMODORO'}
      case 'play':
        const genre = args.join('') || null;
        if (!genre) {
          return { 
            output: ['🎵 Available music types:', `  ${COMMAND_OPTIONS.play.join('  ')}`, '  Usage: play [type]'], 
            action: 'PLAY' 
          };
        }
        return { output: [`🎵 Starting ${genre} music`], action: 'PLAY', genre}
      case 'pause':
        return { output: [`⏸️ Stopping music`], action: 'PAUSE'}
      case 'auth':
        // gestisco i vari sottocomandi
        const subcommand = args[0];
        if (subcommand === 'login') {
          // 2 args
          const authEmail = args[1];
          const authPassword = args[2];
          if (!authEmail || !authPassword) {
            return { output: ['Usage: auth login <email> <password>'] };
          }
          return { output: [`🔐 Logging in as ${authEmail}...`], action: 'LOGIN', email: authEmail, password: authPassword};
        } else if (subcommand === 'register') {
          const authEmail = args[1];
          const authPassword = args[2];
          if (!authEmail || !authPassword) {
            return { output: ['Usage: auth register <email> <password>'] };
          }
          return { output: [`📝 Registering ${authEmail}...`], action: 'REGISTER', email: authEmail, password: authPassword};
        } else if (subcommand === 'logout') {
          return { output: ['🚪 Logging out...'], action: 'LOGOUT'};
        } else if (subcommand === 'status') {
          return { output: [], action: 'AUTH_STATUS'};
        } else {
          return { output: ['Auth subcommands: login, register, logout, status'] };
        } 
      case 'stats':
        return { output: [`📊 Showing stats`], action: 'STATS'}
      case 'weekly':
        return { output: [`📈 Showing weekly stats`], action: 'WEEKLY'}
      case 'profile':
        return { output: [`👤 Showing profile`], action: 'PROFILE'}
      case 'drink':
        const drinkType = args.join(' ') || null;
        if (!drinkType) {
          return { output: ['🥤 Usage: drink <type>'], action: 'DRINK' };
        }
        return { output: [`🥤 ${drinkType} logged!`], action: 'DRINK', drinkType: drinkType };
      case 'drinks':
        return { output: [], action: 'DRINKS' }
      default:
        return { output: [`Command not found: '${cmd}'. Type 'help' for commands.`] };
    }
  }
}


