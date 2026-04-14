import { Injectable } from '@angular/core';

export type CommandResult = {
  output: string[];
  action?: 'START_TIMER' | 'STOP_TIMER' | 'RESET' | 'CLEAR' 
  | 'HELP' | 'SESSIONS_HISTORY' | 'STATUS' | 'CHANGE_THEME' 
  | 'ADD_TASK' | 'TODOS' | 'DONE' | 'POMODORO' | 'PLAY' 
  | 'PAUSE' | 'LOGIN' | 'REGISTER' | 'LOGOUT' | 'AUTH_STATUS'
  | 'STATS';
  duration?: number; // durata del timer
  theme?: string;
  task?: string;
  n?: number;
  genre?: string;
  email?: string;
  password?: string;
}

// help
const HELP_TEXT = [  
  'Available commands:',
  '  auth login    — login with email and password',
  '  auth register — register with email and password',
  '  auth logout   — logout from account',
  '  auth status   — current user',
  '  start [min]   — start a session (default 25 min)',
  '  stop          — stops a session',
  '  status        — shows the active timer',
  '  add [task]    — adds a task',
  '  done [n]      — completes a task',
  '  todos         — shows all tasks',
  '  pomodoro      — start a session with 5 min pause',
  '  sessions      — shows history',
  '  stats         — shows stats with sessions',
  '  play [type]   — plays some music',
  '  pause         — stop music',
  '  clear         — clean the terminal',
  '  theme [color] — choose theme',
  '  help          — show this message',
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
        return { output: [`Starting ${minutes}min focus session...`], action: 'START_TIMER', duration: minutes };
      case 'stop':
        return { output: ['Session stopped.'], action: 'STOP_TIMER' }
      case 'clear':
        return { output: [], action: 'CLEAR' };
      case 'status':
        return { output: ['No active session.'], action: 'STATUS' };
      case 'sessions':
        return { output: [], action: 'SESSIONS_HISTORY'}
      case 'theme':
        const theme = args[0] || null;
        if (!theme) {
          return { 
            output: ['Available themes:', `  ${COMMAND_OPTIONS.theme.join('  ')}`, '  Usage: theme [color]'], 
            action: 'CHANGE_THEME' 
          };
        }
        return { output: [`Switching to ${theme} theme`], action: 'CHANGE_THEME', theme }
      case 'add':
        const task = args.join(' ') || '';
        return { output: [`Task ${task} added correctly`], action: 'ADD_TASK', task }
      case 'todos':
        return { output: [], action: 'TODOS' }
      case 'done':
        const n = parseInt(args[0]);
        if (isNaN(n)) return { output: ['Usage: done [number]'] };
        return { output: [`Task ${n} completed!`], action: 'DONE', n }
      case 'pomodoro':
        return { output: [`Starting Pomodoro mode — 25min work / 5min break`], action: 'POMODORO'}
      case 'play':
        const genre = args.join('') || null;
        if (!genre) {
          return { 
            output: ['Available music types:', `  ${COMMAND_OPTIONS.play.join('  ')}`, '  Usage: play [type]'], 
            action: 'PLAY' 
          };
        }
        return { output: [`Starting ${genre} music`], action: 'PLAY', genre}
      case 'pause':
        return { output: [`Stopping music`], action: 'PAUSE'}
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
          return { output: [`Logging in as ${authEmail}...`], action: 'LOGIN', email: authEmail, password: authPassword};
        } else if (subcommand === 'register') {
          const authEmail = args[1];
          const authPassword = args[2];
          if (!authEmail || !authPassword) {
            return { output: ['Usage: auth register <email> <password>'] };
          }
          return { output: [`Registering ${authEmail}...`], action: 'REGISTER', email: authEmail, password: authPassword};
        } else if (subcommand === 'logout') {
          return { output: ['Logging out...'], action: 'LOGOUT'};
        } else if (subcommand === 'status') {
          return { output: [], action: 'AUTH_STATUS'};
        } else {
          return { output: ['Auth subcommands: login, register, logout, status'] };
        } 
      case 'stats':
        return { output: [`Showing stats`], action: 'STATS'}
      default:
        return { output: [`Command not found: '${cmd}'. Type 'help' for commands.`] };
    }
  }
}


