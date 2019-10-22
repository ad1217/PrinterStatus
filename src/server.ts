import * as fs from 'fs';
import * as url from 'url';
import * as path from 'path';

import * as express from 'express';
import fetch from 'node-fetch';
import * as httpProxy from 'http-proxy';
import * as WebSocket from 'ws';
import * as yaml from 'js-yaml';
import * as Bundler from 'parcel-bundler';
import * as expressWs from 'express-ws';

import * as messages from './messages';
import * as octoprint from './octoprint';

// Load config
const config: {
  printers: { address: string; apikey: string }[];
} = yaml.safeLoad(fs.readFileSync('config.yaml', 'utf8'));

const proxy = httpProxy.createProxyServer({});
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

app.ws('/ws', function(ws, req) {
  printerStatuses.forEach((ps: PrinterStatus) => ps.send_init(ws));
});

app.get('/webcam/:printer', (req, res) => {
  let printer: PrinterStatus | undefined = printerStatuses.find(
    p => p.name === req.params.printer
  );
  if (printer && printer.webcamURL) {
    req.url = ''; // truncate the url for passing to the proxy
    proxy.web(req, res, { target: printer.webcamURL });
  } else res.status(404).send('Not Found: Printer not known or has no webcam.');
});

let bundler = new Bundler(path.join(__dirname, 'index.html'));
app.use(bundler.middleware());

app.listen(1234);

class PrinterStatus {
  address: string;
  apikey: string;

  webcamURL?: string;
  name?: string;

  websocket?: WebSocket;
  lastStatus?: messages.ExtendedMessage;

  constructor(address: string, apikey: string) {
    this.address = address;
    this.apikey = apikey;

    try {
      this.init(); // async init
    } catch (e) {
      throw 'Failed to Init' + e;
    }
  }

  async init() {
    // TODO: error handling (try/catch)
    const settings = await this.api_get('settings');
    this.webcamURL = settings.webcam.streamUrl;
    this.name = settings.appearance.name;

    // do passive login to get a session key from the API key
    const login: octoprint.LoginResponse = await this.api_post('login', {
      passive: 'true',
    });

    this.websocket = new WebSocket(
      url.resolve(this.address, '/sockjs/websocket')
    );
    this.websocket
      .on('open', () => {
        this.websocket!.send(
          JSON.stringify({ auth: login.name + ':' + login.session })
        );
      })
      .on('message', (data: WebSocket.Data) => {
        const event: octoprint.Message = JSON.parse(data as string);
        console.log(event);

        let ext_event: messages.ExtendedMessage = {
          ...event,
          printer: this.name!,
        };
        broadcastPayload(ext_event);

        if ('current' in event || 'history' in event) {
          this.lastStatus = ext_event;
        }
      });
  }

  async api_get(endpoint: string): Promise<any> {
    const r = await fetch(url.resolve(this.address, '/api/' + endpoint), {
      headers: { 'X-Api-Key': this.apikey },
    });
    return await r.json();
  }

  async api_post(endpoint: string, data: any): Promise<any> {
    const r = await fetch(url.resolve(this.address, '/api/' + endpoint), {
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
    console.log(this.lastStatus);
    if (this.lastStatus) {
      payload = this.lastStatus;
    } else {
      payload = { init: null, printer: this.name! };
    }
    ws.send(JSON.stringify(payload));
  }
}

function initPrinters() {
  printerStatuses = config.printers.map(
    printer => new PrinterStatus(printer.address, printer.apikey)
  );
}

initPrinters();
