<template>
  <div v-if="currentJob" class="card">
    <div class="card-header">{{ name || 'Unknown' }}</div>
    <div v-if="webcamURL">
      <img class="webcam" :src="webcamURL" />
    </div>
    <div>Job File Name: {{ currentJob.job.file.name || 'None' }}</div>
    <div>
      Job Completion:
      <progress
        v-if="currentJob.progress.completion"
        :value="currentJob.progress.completion"
      >
        {{ currentJob.progress.completion }}
      </progress>
      <span v-else> - </span>
    </div>
    <div>User: {{ currentJob.job.user || '-' }}</div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';

interface IJobInfo {
  job: {
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
  };
  progress: {
    completion: number;
    filepos: number;
    printTime: number;
    printTimeLeft: number;
  };
  state: string;
}

@Component
export default class PrinterTile extends Vue {
  @Prop(String) readonly address!: string;
  @Prop(String) readonly apikey!: string;

  name: string = '';
  webcamURL: string | null = null;
  currentJob: IJobInfo | null = null;

  mounted() {
    fetch(this.address + '/api/settings', {
      headers: {
        'X-Api-Key': this.apikey,
      },
    })
      .then(r => r.json())
      .then(r => {
        this.webcamURL = r.webcam.streamUrl;
        this.name = r.appearance.name;
      })
      .then(() =>
        fetch(this.address + '/api/job', {
          headers: {
            'X-Api-Key': this.apikey,
          },
        })
      )
      .then(r => r.json())
      .then(r => {
        this.currentJob = r;
      })
      .catch(console.error);
  }
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
}

.webcam {
  max-width: 100%;
}
</style>
