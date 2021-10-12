export interface JobInformation {
  file: {
    name: string;
    display: string;
    path: string;
    type: string;
    typePath: Array<string>;
  };
  user?: string;
  estimatedPrintTime?: number;
  lastPrintTime?: number;
  filament?: {
    length?: number;
    volume?: number;
  };
}

export interface JobResponse {
  job: JobInformation;
  progress: ProgressInformation;
  state: string;
}

export interface ProgressInformation {
  completion: number;
  filepos: number;
  printTime: number;
  printTimeLeft: number;
}

export interface PrinterState {
  text: string;
  flags: {
    operational: boolean;
    paused: boolean;
    printing: boolean;
    pausing: boolean;
    cancelling: boolean;
    sdReady: boolean;
    error: boolean;
    ready: boolean;
    closedOrError: boolean;
  };
}

export interface TemperatureOffsets {
  // 'tool{n}' or 'bed'
  [key: string]: number;
}

export interface TemperatureData {
  actual: number;
  target: number;
  offset?: number;
}

export interface HistoricTemperatureDataPoint {
  time: number; // unix timestamp
  bed: TemperatureData;
  // 'tool{n}'
  [key: string]: TemperatureData | number;
}

export interface LoginResponse {
  name: string;
  active: boolean;
  admin: boolean;
  user: boolean;
  apikey: string;
  settings: { [key: string]: string };
  session: string;
  _is_external_client: boolean;
}

export interface CurrentOrHistoryPayload {
  state: PrinterState;
  job: JobInformation;
  progress: ProgressInformation;
  currentZ: number;
  offsets?: TemperatureOffsets;
  temps: HistoricTemperatureDataPoint;
}

export interface SlicingProgressMessage {
  slicingProgress: {
    slicer: string;
    source_location: string;
    source_path: string;
    dest_location: string;
    dest_path: string;
    progress: number;
  };
}

interface ConnectedMessage {
  connected: {
    apikey: string;
    version: string;
    branch: string;
    display_version: string;
    plugin_hash: string;
    config_hash: string;
  };
}

interface CurrentOrHistoryMessage {
  current: CurrentOrHistoryPayload;
  history: CurrentOrHistoryPayload;
}

export type Message = Partial<
  SlicingProgressMessage | ConnectedMessage | CurrentOrHistoryMessage
>;
