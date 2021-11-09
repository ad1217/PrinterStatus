import * as fs from 'fs';

import * as express from 'express';
import * as yaml from 'js-yaml';
import * as expressWs from 'express-ws';
import * as WebSocket from 'ws';

import { Message } from '../../types/messages';
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

let octoprintConnections: OctoPrintConnection[] = [];

function broadcast(data: WebSocket.Data) {
  wsInstance.getWss().clients.forEach((client: WebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

function broadcastPayload(payload: Message) {
  broadcast(JSON.stringify(payload));
}

const wsInstance = expressWs(express());
const app = wsInstance.app;

app.ws('/ws', function (ws, req) {
  octoprintConnections.forEach((op: OctoPrintConnection) => op.send_init(ws));
});

app.get('/webcam/:printer.m3u8', (req, res) => {
  const printer: OctoPrintConnection | undefined = octoprintConnections.find(
    (op) => op.slug === req.params.printer
  );

  if (printer?.webcamStream) {
    if (printer.webcamStream.m3u8) {
      res.writeHead(200, { 'Content-Type': 'application/vnd.apple.mpegurl' });
      res.end(printer.webcamStream.m3u8.replace(/(.*\.m4s)/g, '/webcam/$1'));
    } else {
      res.set('Retry-After', '1.0');
      res.status(503).send('m3u8 not ready');
    }
  } else res.status(404).send('Not Found: Printer not known or has no webcam.');
});

app.get('/webcam/init-:printer.mp4', (req, res) => {
  const printer: OctoPrintConnection | undefined = octoprintConnections.find(
    (op) => op.slug === req.params.printer
  );

  if (printer?.webcamStream) {
    if (printer.webcamStream.initialization) {
      res.writeHead(200, { 'Content-Type': 'video/mp4' });
      res.end(printer.webcamStream.initialization);
    } else {
      res.set('Retry-After', '4.0');
      res.status(503).send('initialization not ready');
    }
  } else res.status(404).send('Not Found: Printer not known or has no webcam.');
});

app.get('/webcam/:printer([^\\d]+):id(\\d+).m4s', (req, res) => {
  const printer: OctoPrintConnection | undefined = octoprintConnections.find(
    (op) => op.slug === req.params.printer
  );

  if (printer?.webcamStream) {
    const segment = printer.webcamStream.getSegment(req.params.id);
    if (segment) {
      res.writeHead(200, { 'Content-Type': 'video/mp4' });
      res.end(segment);
    } else {
      res.sendStatus(503);
    }
  } else res.status(404).send('Not Found: Printer not known or has no webcam.');
});

app.listen(PORT);

function initPrinters() {
  octoprintConnections = Object.entries(config.printers).map(
    ([slug, printer]) =>
      new OctoPrintConnection(
        slug,
        printer.address,
        printer.apikey,
        broadcastPayload
      )
  );
}

initPrinters();
