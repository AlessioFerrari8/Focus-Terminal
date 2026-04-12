import { Injectable } from '@angular/core';

export type CommandResult = {
  output: string[];
  action?: 'START_TIMER' | 'STOP_TIMER' | 'RESET' | 'CLEAR' | 'HELP' | 'SESSIONS_HISTORY' | 'STATUS' | 'CHANGE_THEME' | 'ADD_TASK' | 'TODOS' | 'DONE' | 'POMODORO';
  duration?: number; // durata del timer
  theme?: string;
  task?: string;
  n?: number;
}

// help
const HELP_TEXT = [  
  'Available commands:',
  '  start [min]   — start a session (default 25 min)',
  '  stop          — stops a session',
  '  status        — shows the active timer',
  '  add [task]    — adds a task',
  '  done [n]      — completes a task',
  '  todos         — shows all tasks',
  '  pomodoro      — start a session with 5 min pause',
  '  sessions      — shows history',
  '  clear         — clean the terminal',
  '  theme [color] — choose theme',
  '  help          — show this message',
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
        return { output: [`Start pomodoro`], action: 'POMODORO'}
      default:
        return { output: [`Command not found: '${cmd}'. Type 'help' for commands.`] };
    }
  }
}


