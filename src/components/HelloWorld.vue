<template>
  <h1>Heello world</h1>
  <button @click="getExactCardName">Exact Name</button>
  <button @click="getCardPrintings">Get Card Printings</button>
</template>

<script setup lang="ts">
import {ScryFall} from '../apiWrapper/ScryFall.ts'
const scryFall = new ScryFall()

const getExactCardName = async () => {
  const json = await scryFall.getCardByExactName("Lightning Bolt")
  console.log(json);
}

const getCardPrintings = async () => {
  const json = await scryFall.getCardPrintings("Lightning Bolt", true);
  console.log(json);
}

</script>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
