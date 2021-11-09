import * as ffmpeg from 'fluent-ffmpeg';
import * as Mp4Frag from 'mp4frag';

export function make_mp4frag(slug: string, url: URL | string): Mp4Frag {
  const command = ffmpeg(url.toString())
    .nativeFramerate()
    .inputOptions([
      '-probesize 1048576',
      '-analyzeduration 10000000',
      '-use_wallclock_as_timestamps 1',
    ])
    .noAudio()
    .videoCodec('libx264')
    .size('640x480')
    .videoFilter('hqdn3d')
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

    .on('error', function (err) {
      console.log('ffmpeg error occurred: ' + err.message);
    });

  const mp4frag = new Mp4Frag({
    hlsPlaylistBase: slug,
  });

  command.pipe(mp4frag);

  return mp4frag;
}
