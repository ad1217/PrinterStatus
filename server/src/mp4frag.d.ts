declare module 'mp4frag' {
  import { Transform } from 'stream';

  namespace Mp4Frag {
    interface SegmentObject {
      segment: Buffer;
      sequence: number;
      duration: number;
      timestamp: number;
      keyframe: number;
    }
  }

  export = Mp4Frag;

  /**
   * @fileOverview
   * <ul>
   * <li>Creates a stream transform for piping a fmp4 (fragmented mp4) from ffmpeg.</li>
   * <li>Can be used to generate a fmp4 m3u8 HLS playlist and compatible file fragments.</li>
   * <li>Can be used for storing past segments of the mp4 video in a buffer for later access.</li>
   * <li>Must use the following ffmpeg args <b><i>-movflags +frag_keyframe+empty_moov+default_base_moof</i></b> to generate
   * a valid fmp4 with a compatible file structure : ftyp+moov -> moof+mdat -> moof+mdat -> moof+mdat ...</li>
   * </ul>
   * @requires stream.Transform
   */
  class Mp4Frag extends Transform {
    /**
     * @constructor
     * @param {Object} [options] - Configuration options.
     * @param {String} [options.hlsPlaylistBase] - Base name of files in m3u8 playlist. Affects the generated m3u8 playlist by naming file fragments. Must be set to generate m3u8 playlist. e.g. 'front_door'
     * @param {Number} [options.hlsPlaylistSize = 4] - Number of segments to use in m3u8 playlist. Must be an integer ranging from 2 to 20.
     * @param {Number} [options.hlsPlaylistExtra = 0] - Number of extra segments to keep in memory. Must be an integer ranging from 0 to 10.
     * @param {Boolean} [options.hlsPlaylistInit = true] - Indicates that m3u8 playlist should be generated after [initialization]{@link Mp4Frag#initialization} is created and before media segments are created.
     * @param {Number} [options.segmentCount = 2] - Number of segments to keep in memory. Has no effect if using options.hlsPlaylistBase. Must be an integer ranging from 2 to 30.
     * @returns {Mp4Frag} this - Returns reference to new instance of Mp4Frag for chaining event listeners.
     * @throws Will throw an error if options.hlsPlaylistBase contains characters other than letters(a-zA-Z) and underscores(_).
     */
    constructor(options?: {
      hlsPlaylistBase?: string;
      hlsPlaylistSize?: number;
      hlsPlaylistExtra?: number;
      hlsPlaylistInit?: boolean;
      segmentCount?: number;
    });
    /**
     * - Returns the audio codec information as a <b>String</b>.
     *
     * - Returns <b>Null</b> if requested before [initialized event]{@link Mp4Frag#event:initialized}.
     */
    get audioCodec(): string | null;
    /**
     * - Returns the video codec information as a <b>String</b>.
     *
     * - Returns <b>Null</b> if requested before [initialized event]{@link Mp4Frag#event:initialized}.
     */
    get videoCodec(): string | null;
    /**
     * - Returns the mime type information as a <b>String</b>.
     *
     * - Returns <b>Null</b> if requested before [initialized event]{@link Mp4Frag#event:initialized}.
     */
    get mime(): string | null;
    /**
     * - Returns the Mp4 initialization fragment as a <b>Buffer</b>.
     *
     * - Returns <b>Null</b> if requested before [initialized event]{@link Mp4Frag#event:initialized}.
     */
    get initialization(): Buffer | null;
    /**
     * - Returns the latest Mp4 segment as a <b>Buffer</b>.
     *
     * - Returns <b>Null</b> if requested before first [segment event]{@link Mp4Frag#event:segment}.
     */
    get segment(): Buffer | null;
    /**
     * - Returns the latest Mp4 segment as an <b>Object</b>.
     *
     *  - <b><code>{segment, sequence, duration, timestamp, keyframe}</code></b>
     *
     * - Returns <b>{segment: null, sequence: -1, duration: -1; timestamp: -1, keyframe: -1}</b> if requested before first [segment event]{@link Mp4Frag#event:segment}.
     */
    get segmentObject(): Mp4Frag.SegmentObject;
    /**
     * - Returns the timestamp of the latest Mp4 segment as an <b>Integer</b>(<i>milliseconds</i>).
     *
     * - Returns <b>-1</b> if requested before first [segment event]{@link Mp4Frag#event:segment}.
     */
    get timestamp(): number;
    /**
     * - Returns the duration of latest Mp4 segment as a <b>Float</b>(<i>seconds</i>).
     *
     * - Returns <b>-1</b> if requested before first [segment event]{@link Mp4Frag#event:segment}.
     */
    get duration(): number;
    /**
     * - Returns the total duration of all Mp4 segments as a <b>Float</b>(<i>seconds</i>).
     *
     * - Returns <b>-1</b> if requested before first [segment event]{@link Mp4Frag#event:segment}.
     */
    get totalDuration(): number;
    /**
     * - Returns the total byte length of the Mp4 initialization and all Mp4 segments as ant <b>Int</b>(<i>bytes</i>).
     *
     * - Returns <b>-1</b> if requested before [initialized event]{@link Mp4Frag#event:initialized}.
     */
    get totalByteLength(): number;
    /**
     * - Returns the fmp4 HLS m3u8 playlist as a <b>String</b>.
     *
     * - Returns <b>Null</b> if requested before [initialized event]{@link Mp4Frag#event:initialized}.
     */
    get m3u8(): string | null;
    /**
     * - Returns the sequence of the latest Mp4 segment as an <b>Integer</b>.
     *
     * - Returns <b>-1</b> if requested before first [segment event]{@link Mp4Frag#event:segment}.
     */
    get sequence(): number;
    /**
     * - Returns the nal keyframe index of the latest Mp4 segment as an <b>Integer</b>.
     *
     * - Returns <b>-1</b> if segment contains no keyframe nal.
     */
    get keyframe(): number;
    /**
     * - Returns a boolean indicating if all segments contain a keyframe.
     *
     * - Returns <b>false</b> if any segments do not contain a keyframe.
     */
    get allKeyframes(): boolean;
    /**
     * - Returns the Mp4 segments as an <b>Array</b> of <b>Objects</b>
     *
     * - <b><code>[{segment, sequence, duration, timestamp, keyframe},...]</code></b>
     *
     * - Returns <b>Null</b> if requested before first [segment event]{@link Mp4Frag#event:segment}.
     */
    get segmentObjects(): Mp4Frag.SegmentObject[];
    /**
     * @param {Number|String} sequence - sequence number
     * @returns {Object|null}
     * - Returns the Mp4 segment that corresponds to the numbered sequence as an <b>Object</b>.
     *
     * - <b><code>{segment, sequence, duration, timestamp, keyframe}</code></b>
     *
     * - Returns <b>Null</b> if there is no segment that corresponds to sequence number.
     */
    getSegmentObject(sequence: number | string): Mp4Frag.SegmentObject | null;
    /**
     * Clear cached values
     */
    resetCache(): void;
  }
}
