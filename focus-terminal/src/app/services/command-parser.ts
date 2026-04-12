import { Injectable } from '@angular/core';

export type CommandResult = {
  output: string[];
  action?: 'START_TIMER' | 'STOP_TIMER' | 'RESET' | 'CLEAR' | 'HELP' | 'SESSIONS_HISTORY' | 'STATUS' | 'CHANGE_THEME';
  duration?: number; // durata del timer
  theme?: string;
}

// help
const HELP_TEXT = [  
  'Available commands:',
  '  start [min]   — start a session (default 25 min)',
  '  stop          — stops a session',
  '  status        — shows the active timer',
  '  sessions      — shows history',
  '  clear         — clean the terminal',
  '  theme [color] — choose theme',
  '  help         — show this message',
];

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
        const theme = args[0] || 'green';
        return { output: [`Switching to ${theme} theme`], action: 'CHANGE_THEME', theme }
      default:
        return { output: [`Command not found: '${cmd}'. Type 'help' for commands.`] };
    }
  }
}


