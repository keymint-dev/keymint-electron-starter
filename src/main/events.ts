import { EventEmitter } from 'events';

// Lets ipc.ts tell index.ts about license changes without a circular import.
export const licenseEvents = new EventEmitter();
