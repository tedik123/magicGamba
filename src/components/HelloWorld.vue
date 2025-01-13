<template>
  <h1>Heello world</h1>
  <button @click="fetchAll">retrieveCardPrintings</button>
  <button @click="readLocalStorageForAll">readLocalStorageForAll</button>
  <button @click="getCardSetsOnly">printSets</button>
  <button @click="getGroupedSets">getGroupedSets</button>
  <br>
  <div>
    <pre>{{ sharedSetsDisplay }}</pre>
  </div>
</template>

<script setup lang="ts">
import {ScryFall} from '../apiWrapper/ScryFall.ts'
import {type Ref, ref} from "vue";

const scryFall = new ScryFall()


const cardNames = ["Lightning Bolt", "Shock"]
const sharedSetsDisplay: Ref<any> = ref(null)


async function getGroupedSets() {
  const sets = await groupBySets();
  console.log("sets", sets)
  const filteredSets = {
    "shared": {},
    "singles": {}
  }
  const setSeen = new Set()
  const cardsAdded = new Set()

  const sortedData =
      Object.entries(sets).sort(([, a], [, b]) => {
        console.log(a)
        return b.length - a.length
      })
  // sorted data where each value is [setId, [...array_values]]

  for (const cardName of cardNames) {
    // if (cardsAdded.has(cardName)) {
    //   console.log("card already seen in another set skipping!")
    //   continue;
    // }

    // console.log("cardname", cardName)
    // console.log("sortedData", sortedData)
    for (const setData of sortedData) {
      // console.log("setData", setData)
      const setId = setData[0]
      const cardsList = setData[1]
      // console.log('setId', setId, cardsList)
      if (!cardsList.includes(cardName)) {
        continue;
      }
      if (!setSeen.has(setId)) {
        setSeen.add(cardName);
        // remove the set list by that id

        const hasMultiple = cardsList.length > 1
        if (hasMultiple) {
          for (const card of cardsList) {
            cardsAdded.add(card);
          }
          filteredSets["shared"][setId] = [...cardsList]
          // delete cardsList[setId];
          // break;
        }
      }
    }

  }
  console.log("filteredSets", filteredSets)
  console.log("filteredSets SHARED", filteredSets["shared"])
  for (const setData of sortedData) {
    // console.log("setData", setData)
    const setId = setData[0]
    const cardsList = setData[1]
    // this is stupid don't add cards you've seen before baka!
    if (!setSeen.has(setId)) {
      filteredSets["singles"][setId] = [...cardsList]
    }
  }
  console.log("filteredSets Singles", filteredSets["singles"])
  // returns all grouped cards if possible and then returns all remaining singles should probably filter out if the card has been seen before
  return filteredSets
}

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

// groups the cards by sets does NOT do any filtering or grouping beyond that
async function groupBySets() {
  const cardSetsOnly: Record<any, any> = await getCardSetsOnly();
  const allSets: Record<string, Array<string>> = {}

  for (const [cardName, cardSets] of Object.entries(cardSetsOnly)) {
    // just in case prevent duplicate work
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

  return allSets;
}

</script>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
