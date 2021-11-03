<template>
  <div class="card">
    <h3 class="card-header">{{ name || 'Unknown' }}</h3>
    <img class="card-img webcam" :src="'/webcam/' + slug" />
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

import * as octoprint from '../types/octoprint';

const props = defineProps<{
  slug: string;
  name?: string;
  lastUpdate: Date;
  now: Date;
  status: octoprint.CurrentOrHistoryPayload | null;
}>();

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
</script>
