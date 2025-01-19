<template>
<div>
  <textarea cols="90" rows="50" placeholder="Paste your exported deck here" v-model="textAreaInput">
  </textarea>
  <br>
  <button @click="parseInput">Parse</button>
</div>

</template>

<script setup lang="ts">

import {onMounted, ref} from "vue";

const emits = defineEmits(["parsedInput"])

const textAreaInput = ref("")

import {parseMoxfieldData, sampleMoxfieldData} from "../helpers/moxfieldParser"

onMounted(()=> {
  console.log("setting initial data!")
  textAreaInput.value = sampleMoxfieldData
})


// Parse the data
function parseInput() {
  console.log(textAreaInput.value)
  const parsedCards = parseMoxfieldData(textAreaInput.value);
  // Log the parsed data
  console.log("parsedCards", parsedCards);
  emits("parsedInput", parsedCards);
}

</script>


<style scoped>

</style>