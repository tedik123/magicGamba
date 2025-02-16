<template>
  <h1>Hello world!</h1>
  <MoxfieldParser @parsedInput="handleParsedInput"/>
  <br>
  <br>
  <button @click="initialize">Load All Sets</button>


<!--  <div v-show="pickedSets.length">-->
<!--    <br><br>-->
<!--   <h2> Sets Chosen:</h2>-->
<!--    <div v-for="setCode in pickedSets" :key="setCode">-->
<!--      <span class="set-name-header">{{allSetsByCode[setCode].name}} ({{setCode }}) ({{cardsInPickedSet[setCode]?.length}} cards) </span>-->
<!--      <pre style="white-space: pre-wrap"> {{ cardsInPickedSet[setCode]?.join(", ") }}</pre>-->
<!--      <br>-->
<!--      <pre style="white-space: pre-wrap"> Additionally:{{originalSetsByCard[setCode]?.join(", ")}}</pre>-->
<!--    </div>-->
<!--  </div>-->
<!--  <br>-->
<!--  <br>-->

  <div v-if="gambaWrapper && gambaWrapper.runningAvailableSetsAndCardsPerSet.length">
    <div v-for="set in gambaWrapper.runningAvailableSetsAndCardsPerSet" :key="set.setCode+set.cards.length">
      <button @click="()=> gambaWrapper.pickSet(set.setCode)"><span class="set-name-header">{{gambaWrapper.setsByCode[set.setCode].name}} ({{set.setCode }}) ({{set.cards.length}} cards) </span></button>
      <pre style="white-space: pre-wrap">{{ set.cards.join(", ") }}</pre>
      <br>
    </div>
  </div>

</template>

<script setup lang="ts">

import MoxfieldParser from "./MoxfieldParser.vue";
import {GambaWrapper} from "../helpers/gambaWrapper/gambaWrapper.ts";
import {reactive, toValue, watch} from "vue";

const cardNames = ["Lightning Bolt", "Shock", "Ajani's Welcome"]
// todo this won't respect the parsed input stuff
// also this entire thing is reactive which scares me! I would like to optimize to make it shallower
const gambaWrapper = reactive(new GambaWrapper(cardNames));


function handleParsedInput(parsedInput: Array<Record<string, string>>) {
  // Removes land as it's not relevant for opening packs
  const basicLands = ["plains", "island", "mountain", "forest", "swamp"];
  for (const card of parsedInput) {
    if(!cardNames.includes(card.name) && !basicLands.includes(card.name.toLowerCase()) ) {
        cardNames.push(card.name)
    }
  }
  console.log("Card names!", cardNames)
}

function initialize() {
  gambaWrapper.loadAllSets();
}

//TODO this might need to be optimized as it should be relatively big
// const availableSetsAndCardsPerSet = reactive(gambaWrapper.runningAvailableSetsAndCardsPerSet)

watch(()=> toValue(gambaWrapper.runningAvailableSetsAndCardsPerSet), (data) => {
  console.log("Changed! ", data);
}, { deep: true})

</script>

<style scoped>
.read-the-docs {
  color: #888;
}
.set-name-header {
  font-weight: bold;
  font-size: 1.2rem;
}
</style>
