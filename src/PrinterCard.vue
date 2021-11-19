<template>
  <div class="card h-100">
    <h3 class="card-header" :data-color="color">
      {{ name || 'Unknown' }}
    </h3>
    <video
      muted
      class="card-img webcam"
      ref="video"
    ></video>
    <div class="card-body" v-if="status">
      <div>{{ status.state.text }}</div>
      <div>
        Job File Name:
        <span class="font-monospace">{{ status.job.file.name || 'None' }}</span>
      </div>
      <div v-if="status.progress.completion">
        <div class="d-flex">
          Job Completion:
          <div class="progress flex-fill ms-2" style="height: 2em">
            <div
              class="progress-bar"
              :class="{
                'progress-bar-striped': status.state.flags.printing,
                'progress-bar-animated': status.state.flags.printing,
              }"
              role="progressbar"
              :style="{ width: status.progress.completion + '%' }"
              :aria-valuenow="status.progress.completion.toFixed(2)"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              {{ status.progress.completion.toFixed(2) }}%
            </div>
          </div>
        </div>
        <div>
          Job Time: {{ formatDuration(status.progress.printTime) }} elapsed<span
            v-show="status.progress.printTimeLeft"
            >, {{ formatDuration(status.progress.printTimeLeft) }} left
          </span>
        </div>
      </div>
      <div>User: {{ status.job.user || '-' }}</div>
    </div>
    <div class="card-footer">Last updated {{ lastUpdateString }}</div>
  </div>
</template>

<script setup lang="ts">
import Hls from 'hls.js';
import { computed, onMounted, Ref, ref, watchEffect } from 'vue';
import prettyMilliseconds from 'pretty-ms';

import { CurrentOrHistoryPayload } from '../types/octoprint';
import { OctoprintColor } from '../types/messages';

interface Props {
  slug: string;
  name?: string;
  lastUpdate: Date;
  now: Date;
  status: CurrentOrHistoryPayload | null;
  color: OctoprintColor | null;
}

export type PrinterInfo = Omit<Props, 'slug' | 'now'>;

const props = defineProps<Props>();
const video: Ref<HTMLMediaElement | null> = ref(null);

const hls: Ref<Hls | null> = ref(null);

if (Hls.isSupported()) {
  hls.value = new Hls({
    liveDurationInfinity: true,
    backBufferLength: 30,
    manifestLoadingTimeOut: 1000,
    manifestLoadingMaxRetry: 30,
    manifestLoadingRetryDelay: 500,
    //debug: true,
  });
  hls.value.on(Hls.Events.MEDIA_ATTACHED, () => {
    hls.value!.loadSource(`/webcam/${props.slug}.m3u8`);
    hls.value!.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
      video.value?.play();
      console.log(
        'manifest loaded, found ' + data.levels.length + ' quality level'
      );
    });
  });

  hls.value.on(Hls.Events.ERROR, (event, data) => {
    console.log(data);
  });
}

function formatDuration(seconds: number): string {
  return prettyMilliseconds(seconds * 1000);
}

const lastUpdateString = computed(() => {
  if (props.status !== null) {
    const elapsed = props.now.getTime() - props.lastUpdate.getTime();
    if (elapsed < 10_000) {
      return 'seconds ago';
    } else if (elapsed < 60_000) {
      return 'less than a minute ago';
    } else {
      return (
        prettyMilliseconds(elapsed, { compact: true, verbose: true }) + ' ago'
      );
    }
  }
});

watchEffect(() => {
  console.log(video.value, hls.value);
  if (hls.value && video.value) {
    // if hls and video element are valid, bind them together
    hls.value.attachMedia(video.value);
    console.log('video and hls.js are now bound together !');
  }
});
</script>

<style lang="scss">
$bs-colors: ('red', 'orange', 'yellow', 'green', 'blue', 'white');

.card-header[data-color] {
  background-image: var(--bs-gradient);

  @each $color in $bs-colors {
    &[data-color='#{$color}'] {
      background-color: var(--bs-#{$color});
    }
  }

  &[data-color='violet'] {
    background-color: var(--bs-purple);
  }

  &[data-color='black'] {
    background-color: var(--bs-purple);
  }

  &[data-color='blue'],
  &[data-color='green'],
  &[data-color='violet'],
  &[data-color='black'] {
    color: var(--bs-light);
  }
}

.webcam {
  background-color: black;
}
</style>
