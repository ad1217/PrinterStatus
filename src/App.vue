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
      <div class="col" v-for="(printer, slug) in printers" :key="slug">
        <PrinterCard :slug="slug as string" v-bind="printer" :now="now">
        </PrinterCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, Ref } from 'vue';

import { Message } from '../types/messages';
import PrinterCard, { PrinterInfo } from './PrinterCard.vue';

const printers: Ref<{ [key: string]: PrinterInfo }> = ref({});
const hasPrinters = computed(() => Object.keys(printers.value).length > 0);

let now: Ref<Date> = ref(new Date());
setInterval(() => (now.value = new Date()), 1000);

let websocket!: WebSocket;

function connectWebsocket() {
  let loc = window.location;
  const ws_uri: string =
    (loc.protocol === 'https:' ? 'wss://' : 'ws://') + loc.host + '/ws';
  websocket = new WebSocket(ws_uri);
  websocket.addEventListener('message', (ev: MessageEvent) => {
    const event: Message = JSON.parse(ev.data as string);
    console.log(event);

    if (!(event.printer in printers.value)) {
      printers.value[event.printer] = {
        status: null,
        color: null,
        lastUpdate: new Date(),
      };
    }
    printers.value[event.printer].lastUpdate = new Date();

    if (event.kind === 'settings') {
      printers.value[event.printer].name = event.name;
      printers.value[event.printer].color = event.color;
    } else if (event.kind === 'status') {
      if ('current' in event.msg && event.msg.current) {
        printers.value[event.printer].status = event.msg.current;
      } else if ('history' in event.msg && event.msg.history) {
        printers.value[event.printer].status = event.msg.history;
      } else if ('remote_ws_status' in event.msg) {
      }
    }
  });

  websocket.addEventListener('close', () => {
    console.log('Lost connection to server reconnecting in 5 sec');
    window.setTimeout(connectWebsocket, 5000);
  });
}

connectWebsocket();
</script>
