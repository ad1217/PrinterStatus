<template>
  <div class="card h-100">
    <h3 class="card-header" :data-color="color">
      {{ name || 'Unknown' }}
    </h3>
    <img
      class="card-img webcam"
      :style="webcamTransform"
      :src="'/webcam/' + slug"
    />
    <div class="card-body" v-if="status">
      <div>{{ status.state.text }}</div>
      <div>Job File Name: {{ status.job.file.name || 'None' }}</div>
      <div v-if="status.progress.completion">
        <div>
          Job Completion:
          {{ status.progress.completion.toFixed(2) }}%
          <progress :value="status.progress.completion" max="100"></progress>
        </div>
        <div>
          Job Time: {{ formatDuration(status.progress.printTime) }} elapsed,
          {{ formatDuration(status.progress.printTimeLeft) }} left
        </div>
      </div>
      <div>User: {{ status.job.user || '-' }}</div>
    </div>
    <div class="card-footer">Last updated {{ lastUpdateString }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import prettyMilliseconds from 'pretty-ms';

import { CurrentOrHistoryPayload } from '../types/octoprint';
import { WebcamSettings, OctoprintColor } from '../types/messages';

interface Props {
  slug: string;
  name?: string;
  lastUpdate: Date;
  now: Date;
  status: CurrentOrHistoryPayload | null;
  webcam: WebcamSettings | null;
  color: OctoprintColor | null;
}

export type PrinterInfo = Omit<Props, 'slug' | 'now'>;

const props = defineProps<Props>();

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

const webcamTransform = computed(() => {
  if (props.webcam) {
    const transforms = [];
    if (props.webcam.flipH) {
      transforms.push('scaleX(-1)');
    }
    if (props.webcam.flipV) {
      transforms.push('scaleY(-1)');
    }
    if (props.webcam.rotate90) {
      transforms.push('rotate(90)');
    }
    return { transform: transforms.join(' ') };
  } else {
    return {};
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
</style>
