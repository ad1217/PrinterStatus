import * as ffmpeg from 'fluent-ffmpeg';
import * as Mp4Frag from 'mp4frag';
import { PassThrough } from 'stream';

const RECONNECT_TIME = 5000;

interface WebcamSettings {
  flipH: boolean;
  flipV: boolean;
  rotate90: boolean;
}

function start_ffmpeg(
  url: URL | string,
  webcamSettings: WebcamSettings,
  mp4frag: Mp4Frag
) {
  let transforms = [];
  if (webcamSettings.flipH) {
    transforms.push('hflip');
  }
  if (webcamSettings.flipV) {
    transforms.push('vflip');
  }
  if (webcamSettings.rotate90) {
    transforms.push('transpose=2');
  }

  const command = ffmpeg(url.toString())
    .nativeFramerate()
    .inputOptions([
      '-timeout 5000000',
      '-probesize 1048576',
      '-analyzeduration 10000000',
      '-use_wallclock_as_timestamps 1',
    ])
    .noAudio()
    .videoCodec('libx264')
    .size('640x480')
    .autopad()
    .videoFilter('hqdn3d')
    .videoFilters(transforms)
    .format('mp4')
    .outputOptions([
      '-tune zerolatency',
      '-min_frag_duration 6000000',
      '-frag_duration 6000000',
      '-crf 36',
      '-preset veryfast',
      '-profile:v baseline',
      '-level:v 3.1',
      '-pix_fmt yuv420p',
      '-movflags +dash+negative_cts_offsets',
    ])
    .on('start', function (commandLine) {
      console.log('Spawned FFmpeg for ' + url.toString());
    });

  let pipe = command.pipe(undefined, { end: false }) as PassThrough;
  pipe.pipe(mp4frag);

  function reconnect() {
    start_ffmpeg(url, webcamSettings, mp4frag);
  }

  command.once('error', (err) => {
    console.log(
      `FFmpeg error occurred, reconnecting in ${RECONNECT_TIME}ms: ${err.message}`
    );
    pipe.unpipe();
    command.kill('SIGKILL');
    setTimeout(() => reconnect(), RECONNECT_TIME);
  });

  command.once('end', () => {
    console.log(`FFmpeg stream ended, reconnecting in ${RECONNECT_TIME}ms:`);
    pipe.unpipe();
    setTimeout(() => reconnect(), RECONNECT_TIME);
  });
}

export function make_mp4frag(
  slug: string,
  url: URL | string,
  webcamSettings: WebcamSettings
): Mp4Frag {
  const mp4frag = new Mp4Frag({
    hlsPlaylistBase: slug,
  });

  start_ffmpeg(url, webcamSettings, mp4frag);

  return mp4frag;
}
