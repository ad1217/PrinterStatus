import * as WebSocket from 'ws';
import fetch from 'node-fetch';
/// <reference path="mjpeg-proxy.d.ts"/>
import { MjpegProxy } from 'mjpeg-proxy';

import {ExtendedMessage} from '../../types/messages';
import * as octoprint from '../../types/octoprint';

const PING_TIME = 10000;

type Timeout = ReturnType<typeof setTimeout>;

export default class OctoprintConnection {
  public name?: string;
  public webcamProxy?: MjpegProxy;
  protected lastStatus?: ExtendedMessage;

  constructor(
    public slug: string,
    public address: string,
    protected apikey: string,
    protected broadcast: (msg: ExtendedMessage) => void
  ) {
    this.try_connect_websocket();
  }

  try_connect_websocket() {
    this.connect_websocket().catch((e) => {
      console.error(
        `Failed to connect to "${this.slug}", attempting reconnection in 5 seconds`
      );
      console.error(e);
      setTimeout(() => this.try_connect_websocket(), 5000);
    });
  }

  async connect_websocket() {
    const settings = await this.api_get('settings');
    const webcamURL = new URL(settings.webcam.streamUrl, this.address);
    // TODO: handle recreating proxy on URL change
    if (this.webcamProxy === undefined) {
      this.webcamProxy = new MjpegProxy(webcamURL.toString());
    }
    this.name = settings.appearance.name;

    // do passive login to get a session key from the API key
    const login: octoprint.LoginResponse = await this.api_post('login', {
      passive: 'true',
    });
    const session_key = login.name + ':' + login.session;

    let pingSender: ReturnType<typeof setInterval>;
    let pongTimeout: Timeout;

    const url = new URL('/sockjs/websocket', this.address);
    url.protocol = 'ws';
    let websocket = new WebSocket(url.toString());
    websocket
      .on('open', () => {
        pingSender = setInterval(() => websocket.ping(), PING_TIME);
        pongTimeout = this.heartbeat(websocket, pongTimeout);

        console.log(`Connected to "${this.slug}"`);
        websocket.send(JSON.stringify({ auth: session_key }));
      })
      .on('message', (data: WebSocket.Data) => {
        const event: octoprint.Message = JSON.parse(data as string);

        let ext_event: ExtendedMessage = {
          ...event,
          printer: this.slug,
          name: this.name,
        };
        this.broadcast(ext_event);

        if ('current' in event || 'history' in event) {
          this.lastStatus = ext_event;
        }
      })
      .on('pong', () => {
        pongTimeout = this.heartbeat(websocket, pongTimeout);
      })
      .on('close', () => {
        clearInterval(pingSender);
        clearTimeout(pongTimeout);

        console.log(
          `Lost connection to "${this.slug}", attempting reconnection in 5 seconds`
        );
        setTimeout(() => this.try_connect_websocket(), 5000);
      });
  }

  heartbeat(websocket: WebSocket, pongTimeout: Timeout): Timeout {
    clearTimeout(pongTimeout);
    return setTimeout(() => {
      console.log(`Missed 2 heartbeats for "${this.slug}", disconnecting`);
      websocket.terminate();
    }, PING_TIME * 2);
  }

  async api_get(endpoint: string): Promise<any> {
    const r = await fetch(new URL('/api/' + endpoint, this.address), {
      headers: { 'X-Api-Key': this.apikey },
    });
    return await r.json();
  }

  async api_post(endpoint: string, data: any): Promise<any> {
    const r = await fetch(new URL('/api/' + endpoint, this.address), {
      headers: {
        'X-Api-Key': this.apikey,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(data),
    });
    return await r.json();
  }

  send_init(ws: WebSocket) {
    let payload: ExtendedMessage;
    if (this.lastStatus) {
      payload = this.lastStatus;
    } else {
      payload = { init: null, printer: this.slug, name: this.name };
    }
    ws.send(JSON.stringify(payload));
  }
}
