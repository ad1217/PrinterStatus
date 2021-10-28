import * as fs from 'fs';
import * as path from 'path';

import * as express from 'express';
import fetch from 'node-fetch';
import * as httpProxy from 'http-proxy';
import * as WebSocket from 'ws';
import * as yaml from 'js-yaml';
import * as expressWs from 'express-ws';

import * as messages from '../types/messages';
import * as octoprint from '../types/octoprint';

const PORT = process.env.PORT || 1234;

const PING_TIME = 10000;

type Timeout = ReturnType<typeof setTimeout>;

type configuration = {
  printers: {
    [key: string]: { address: string; apikey: string };
  };
};

// Load config
const config: configuration = yaml.load(
  fs.readFileSync('config.yaml', 'utf8')
) as configuration;

const proxy = httpProxy.createProxyServer({});
proxy.on('error', function (e) {
  console.error('Proxy failed:');
  console.error(e);
});
let printerStatuses: PrinterStatus[] = [];

function broadcast(data: WebSocket.Data) {
  wsInstance.getWss().clients.forEach((client: WebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

function broadcastPayload(payload: messages.ExtendedMessage) {
  broadcast(JSON.stringify(payload));
}

const wsInstance = expressWs(express());
const app = wsInstance.app;

app.ws('/ws', function (ws, req) {
  printerStatuses.forEach((ps: PrinterStatus) => ps.send_init(ws));
});

app.get('/webcam/:printer', (req, res) => {
  let printer: PrinterStatus | undefined = printerStatuses.find(
    (p) => p.slug === req.params.printer
  );
  if (printer?.webcamURL) {
    req.url = ''; // truncate the url for passing to the proxy
    proxy.web(req, res, { target: printer.webcamURL.toString() });
  } else res.status(404).send('Not Found: Printer not known or has no webcam.');
});

app.listen(PORT);

class PrinterStatus {
  slug: string;
  address: string;
  apikey: string;

  webcamURL?: URL;
  name?: string;
  lastStatus?: messages.ExtendedMessage;

  constructor(slug: string, address: string, apikey: string) {
    this.slug = slug;
    this.address = address;
    this.apikey = apikey;

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
    this.webcamURL = new URL(settings.webcam.streamUrl, this.address);
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

        let ext_event: messages.ExtendedMessage = {
          ...event,
          printer: this.slug,
          name: this.name,
        };
        broadcastPayload(ext_event);

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
    let payload: messages.ExtendedMessage;
    if (this.lastStatus) {
      payload = this.lastStatus;
    } else {
      payload = { init: null, printer: this.slug, name: this.name };
    }
    ws.send(JSON.stringify(payload));
  }
}

function initPrinters() {
  printerStatuses = Object.entries(config.printers).map(
    ([slug, printer]) =>
      new PrinterStatus(slug, printer.address, printer.apikey)
  );
}

initPrinters();
