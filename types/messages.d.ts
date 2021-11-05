import { Message as OctoprintMessage } from './octoprint';

interface BaseMessage {
  printer: string;
}

export interface StatusMessage extends BaseMessage {
  kind: 'status';
  msg: OctoprintMessage;
}

export interface WebcamSettings {
  flipH: boolean;
  flipV: boolean;
  rotate90: boolean;
}

export type OctoprintColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'violet' | 'black' | 'white' | 'default';

export interface SettingsMessage extends BaseMessage {
  kind: 'settings';
  name: string;
  webcam: WebcamSettings;
  color: OctoprintColor;
}

export type Message = StatusMessage | SettingsMessage;
