<template>
  <div>
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
    let loc = window.location;
    const ws_uri: string =
      loc.protocol === 'https' ? 'wss://' : 'ws://' + loc.host + '/ws';
    this.websocket = new WebSocket(ws_uri);
    this.websocket.onmessage = (ev: MessageEvent) => {
      const event: messages.ExtendedMessage = JSON.parse(ev.data as string);
      console.log(event);

      if ('init' in event) {
        this.$set(this.printers, event.printer, null);
      } else if ('current' in event) {
        this.$set(this.printers, event.printer, event.current);
      } else if ('history' in event) {
        this.$set(this.printers, event.printer, event.history);
      }
    };
  }
}
</script>
