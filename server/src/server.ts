import * as fs from 'fs';

import * as express from 'express';
import * as httpProxy from 'http-proxy';
import * as yaml from 'js-yaml';
import * as expressWs from 'express-ws';
import * as WebSocket from 'ws';

import { ExtendedMessage } from '../../types/messages';
import OctoPrintConnection from './OctoPrintConnection';

const PORT = process.env.PORT || 1234;

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
let octoprintConnections: OctoPrintConnection[] = [];

function broadcast(data: WebSocket.Data) {
  wsInstance.getWss().clients.forEach((client: WebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

function broadcastPayload(payload: ExtendedMessage) {
  broadcast(JSON.stringify(payload));
}

const wsInstance = expressWs(express());
const app = wsInstance.app;

app.ws('/ws', function (ws, req) {
  octoprintConnections.forEach((op: OctoPrintConnection) => op.send_init(ws));
});

app.get('/webcam/:printer', (req, res) => {
  let printer: OctoPrintConnection | undefined = octoprintConnections.find(
    (op) => op.slug === req.params.printer
  );
  if (printer?.webcamURL) {
    req.url = ''; // truncate the url for passing to the proxy
    proxy.web(req, res, { target: printer.webcamURL.toString() });
  } else res.status(404).send('Not Found: Printer not known or has no webcam.');
});

app.listen(PORT);

function initPrinters() {
  octoprintConnections = Object.entries(config.printers).map(
    ([slug, printer]) =>
      new OctoPrintConnection(slug, printer.address, printer.apikey, broadcastPayload)
  );
}

initPrinters();
