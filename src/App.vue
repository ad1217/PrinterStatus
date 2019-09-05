<template>
  <div>
    <PrinterTile
      v-for="printer in printers"
      :key="printer.address"
      v-bind="printer"
    >
    </PrinterTile>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';

import PrinterTile from './PrinterTile.vue';

@Component({ components: { PrinterTile } })
export default class App extends Vue {
  printers = [
    {
      address: 'http://octopi.local:5000/',
      apikey: 'BEF073DD42A64431BDD72D83FA563DF5',
    },
    {
      address: 'http://octopi.local:5000/',
      apikey: 'BEF073DD42A64431BDD72D83FA563DF5',
    },
  ];
}
</script>
