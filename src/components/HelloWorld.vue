<template>
  <h1>Heello world</h1>
  <button @click="retrieveAll">retrieveCardPrintings</button>
  <button @click="readLocalStorageForAll">readLocalStorageForAll</button>
  <button @click="getCardSetsOnly">printSets</button>
  <button @click="groupBySharedGroups">groupByDuplicateGroups</button>
</template>

<script setup lang="ts">
import {ScryFall} from '../apiWrapper/ScryFall.ts'

const scryFall = new ScryFall()


const cardNames = ["Lightning Bolt", "Shock"]


// fetches or reads from local storage
async function fetchAll() {
  const delay = 50;

  // Initialize an empty object to accumulate the results
  const result: Record<string, Record<any, any>> = {};

  const promises = cardNames.map((cardName, index) => {
    return new Promise((resolve) => {
      setTimeout(async () => {
         // Await the async function
        result[cardName] = await getCardPrintings(cardName); // Add the result to the dictionary
        resolve(); // Resolve the promise when done
      }, delay * index);
    });
  });

  await Promise.all(promises); // Wait for all promises to resolve

  return result; // Return the combined result object
}

function readLocalStorageForAll() {
  const data: Record<string, Object> = {}
  for (const cardName of cardNames) {
    let value = localStorage.getItem(cardName) ?? "{}"
    data[cardName] = JSON.parse(value)
  }
  // console.log("ALL DATA", data)
  return data
}

async function getCardSetsOnly() {
  // const data = readLocalStorageForAll();
  const data = await fetchAll();
  console.log("fetchAll", data);
  const cardSetsOnly: Record<string, Array<string>> = {}
  for (const cardName of cardNames) {
    const cardData: Array<any> = data[cardName]
    const sets = []
    for (const cardSet of cardData) {
      sets.push(cardSet.set)
    }
    cardSetsOnly[cardName] = sets
  }
  return cardSetsOnly
}

const getCardPrintings = async (cardName: string) => {
  const storage = checkStorage(cardName)
  if (storage) {
    return storage
  }
  const json = await scryFall.getCardPrintings(cardName, true);
  localStorage.setItem(cardName, JSON.stringify(json));
  return json;
}


function checkStorage(cardName: string) {
  const storage = localStorage.getItem(cardName);
  if (storage) {
    return JSON.parse(storage)
  }
  return null;
}

async function groupBySharedGroups() {
  const cardSetsOnly: Record<any, any> = await getCardSetsOnly();
  const allSets: Record<string, Array<string>> = {}
  for (const [cardName, cardSets] of Object.entries(cardSetsOnly)) {
    if (allSets[cardName]) {
      continue;
    }
    for (const set of cardSets) {
      // console.log(set)
      if (allSets[set]) {
        allSets[set].push(cardName);
      } else {
        allSets[set] = [cardName];
      }
    }
  }
  console.log("allSets", allSets);

  const sharedSets: Record<string, Array<string>> = {}
  for (const [setName, cardsInSet] of Object.entries(allSets)) {
    if( cardsInSet.length > 1) {
      sharedSets[setName] = cardsInSet
    }
  }
  console.log("sharedSets", sharedSets);

}

</script>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
