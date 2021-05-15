<template>
  <div>
    <div class="loading" v-show="Object.keys(printers).length === 0">
      <div class="loading-spinner"></div>
    </div>
    <PrinterCard
      v-for="(status, name) in printers"
      :key="name"
      :name="name"
      :status="status"
    >
    </PrinterCard>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';

import * as messages from './messages';
import * as octoprint from './octoprint';
import PrinterCard from './PrinterCard.vue';

@Component({ components: { PrinterCard } })
export default class App extends Vue {
  websocket!: WebSocket;
  printers: {
    [key: string]: octoprint.CurrentOrHistoryPayload | null;
  } = {};

  mounted() {
    this.connectWebsocket();
  }

  connectWebsocket() {
    let loc = window.location;
    const ws_uri: string =
      (loc.protocol === 'https:' ? 'wss://' : 'ws://') + loc.host + '/ws';
    this.websocket = new WebSocket(ws_uri);
    this.websocket.addEventListener('message', (ev: MessageEvent) => {
      const event: messages.ExtendedMessage = JSON.parse(ev.data as string);
      console.log(event);

      if ('init' in event) {
        this.$set(this.printers, event.printer, null);
      } else if ('current' in event) {
        this.$set(this.printers, event.printer, event.current);
      } else if ('history' in event) {
        this.$set(this.printers, event.printer, event.history);
      } else if ('remote_ws_status' in event) {
      }
    });

    this.websocket.addEventListener('close', () => {
      console.log('Lost connection to server reconnecting in 5 sec');
      window.setTimeout(this.connectWebsocket, 5000);
    });
  }
}
</script>

<style>
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 90vh;
}

@keyframes spinner {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.loading-spinner {
  display: block;
  height: 10vh;
  width: 10vh;
  border: solid 1vh transparent;
  border-top-color: #1c87c9;
  border-radius: 50%;
  animation: 2s linear infinite spinner;
}
</style>
