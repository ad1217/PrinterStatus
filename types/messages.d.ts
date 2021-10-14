import { Message } from './octoprint';

export type ExtendedMessage = (Message | { init?: null }) & {
  printer: string;
  name?: string;
};
