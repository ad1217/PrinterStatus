<template>
  <div class="card">
    <div class="card-header">{{ name || 'Unknown' }}</div>
    <img
      v-if="name"
      class="webcam"
      :src="'http://localhost:1234/webcam/' + name"
    />
    <div v-if="status">
      <div>{{ status.state.text }}</div>
      <div>Job File Name: {{ status.job.file.name || 'None' }}</div>
      <div>
        Job Completion:
        <progress
          v-if="status.progress.completion"
          :value="status.progress.completion"
        >
          {{ status.progress.completion }}
        </progress>
        <span v-else> - </span>
      </div>
      <div>User: {{ status.job.user || '-' }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';

import * as octoprint from './octoprint';

@Component
export default class PrinterCard extends Vue {
  @Prop(String) readonly name!: string;
  @Prop(Object) readonly status?: octoprint.CurrentOrHistoryPayload;
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
