declare module 'mjpeg-proxy' {
  import {Request, Response} from 'express';
  export class MjpegProxy {
    mjpegOptions: URL;

    constructor(mjpegUrl: string | URL);
    proxyRequest(
      req: Request,
      res: Response
    ): void;
  }
}
