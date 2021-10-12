<template>
  <div>
    <div v-if="!hasPrinters">
      <div class="loading-spinner"></div>
    </div>
    <PrinterCard
      v-else
      v-for="(status, name) in printers"
      :key="name"
      :name="name as string"
      :status="status"
    >
    </PrinterCard>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, Ref } from 'vue';

import * as messages from '../types/messages';
import * as octoprint from '../types/octoprint';
import PrinterCard from './PrinterCard.vue';

const printers: Ref<{
  [key: string]: octoprint.CurrentOrHistoryPayload | null;
}> = ref({});
const hasPrinters = computed(() => Object.keys(printers.value).length > 0);

let websocket!: WebSocket;

function connectWebsocket() {
  let loc = window.location;
  const ws_uri: string =
    (loc.protocol === 'https:' ? 'wss://' : 'ws://') + loc.host + '/ws';
  websocket = new WebSocket(ws_uri);
  websocket.addEventListener('message', (ev: MessageEvent) => {
    const event: messages.ExtendedMessage = JSON.parse(ev.data as string);
    console.log(event);

    if ('init' in event) {
      printers.value[event.printer] = null;
    } else if ('current' in event) {
      printers.value[event.printer] = event.current!;
    } else if ('history' in event) {
      printers.value[event.printer] = event.history!;
    } else if ('remote_ws_status' in event) {
    }
  });

  websocket.addEventListener('close', () => {
    console.log('Lost connection to server reconnecting in 5 sec');
    window.setTimeout(connectWebsocket, 5000);
  });
}

connectWebsocket();
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
