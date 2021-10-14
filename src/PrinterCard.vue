<template>
  <div class="card">
    <div class="card-header">{{ name || 'Unknown' }}</div>
    <img class="webcam" :src="'/webcam/' + slug" />
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

<style lang="scss">
.card {
  display: inline-block;
  margin: 1em;
  padding: 1em;
  border-radius: 3px;
  box-shadow: rgba(0, 0, 0, 0.2) 0px 3px 1px -2px,
    rgba(0, 0, 0, 0.14) 0px 2px 2px 0px, rgba(0, 0, 0, 0.12) 0px 1px 5px 0px;

  .card-header {
    font-weight: bold;
    font-size: 1.5em;
    text-align: center;
    padding-bottom: 0.25em;
  }

  .webcam {
    width: 480px;
    max-width: 100%;
  }
}
</style>
