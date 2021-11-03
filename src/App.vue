<template>
  <div>
    <div
      class="d-flex align-items-center justify-content-center"
      style="height: 100vh"
      v-if="!hasPrinters"
    >
      <div class="spinner-border" style="width: 7vw; height: 7vw" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    <div
      v-else
      class="
        row row-cols-1 row-cols-md-2 row-cols-xxl-3
        m-1 m-md-3
        g-4
        justify-content-center
      "
    >
      <div class="col" v-for="({ name, status }, slug) in printers" :key="slug">
        <PrinterCard :slug="slug as string" :name="name" :status="status">
        </PrinterCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, Ref } from 'vue';

import * as messages from '../types/messages';
import * as octoprint from '../types/octoprint';
import PrinterCard from './PrinterCard.vue';

const printers: Ref<{
  [key: string]: {
    name?: string;
    status: octoprint.CurrentOrHistoryPayload | null;
  };
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

    if (!(event.printer in printers.value)) {
      printers.value[event.printer] = { status: null };
    }
    printers.value[event.printer].name = event.name;

    if ('init' in event) {
      printers.value[event.printer].status = null;
    } else if ('current' in event && event.current) {
      printers.value[event.printer].status = event.current;
    } else if ('history' in event && event.history) {
      printers.value[event.printer].status = event.history;
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
