import { Message as OctoprintMessage } from './octoprint.js';

interface BaseMessage {
  printer: string;
}

export interface StatusMessage extends BaseMessage {
  kind: 'status';
  msg: OctoprintMessage;
}

export type OctoprintColor =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'violet'
  | 'black'
  | 'white'
  | 'default';

export interface SettingsMessage extends BaseMessage {
  kind: 'settings';
  name: string;
  color: OctoprintColor;
}

export type Message = StatusMessage | SettingsMessage;
