<template>
  <div class="card">
    <h3 class="card-header">{{ name || 'Unknown' }}</h3>
    <img class="card-img webcam" :src="'/webcam/' + slug" />
    <div v-if="status">
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
  </div>
</template>

<script setup lang="ts">
import prettyMilliseconds from 'pretty-ms';

import * as octoprint from '../types/octoprint';

defineProps<{
  slug: string;
  name?: string;
  status: octoprint.CurrentOrHistoryPayload | null;
}>();

function formatDuration(seconds: number): string {
  return prettyMilliseconds(seconds * 1000);
}
</script>
