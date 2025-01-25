<template>
  <h1>Hello world!</h1>
  <MoxfieldParser @parsedInput="handleParsedInput"/>
<!--  <button @click="fetchAll">retrieveCardPrintings</button>-->
<!--  <button @click="readLocalStorageForAll">readLocalStorageForAll</button>-->
<!--  <button @click="getCardSetsOnly">printSets</button>-->
<!--  <button @click="()=> getGroupedSets(cardNames)">getGroupedSets</button>-->
<!--  <button @click="getGroupAllSetsByCode">getGroupAllSetsByCode</button>-->
<!--  <br>-->
<!--  <div>-->
<!--    <pre>{{ sharedSetsDisplay }}</pre>-->
<!--  </div>-->

  <br>
  <br>
  <button @click="loadAllSets">Load All Sets</button>


  <div v-show="pickedSets.length">
    <br><br>
   <h2> Sets Chosen:</h2>
    <div v-for="setCode in pickedSets" :key="setCode">
      <span class="set-name-header">{{allSetsByCode[setCode].name}} ({{setCode }}) ({{cardsInPickedSet[setCode]?.length}} cards) </span>
      <pre style="white-space: pre-wrap"> {{ cardsInPickedSet[setCode]?.join(", ") }}</pre>
    </div>
  </div>
  <br>
  <br>

  <div>
    <div v-for="set in availableSetsAndCardsPerSet" :key="set.setCode+set.cards.length">
      <button @click="()=> pickSet(set.setCode)"><span class="set-name-header">{{allSetsByCode[set.setCode].name}} ({{set.setCode }}) ({{set.cards.length}} cards) </span></button>
      <pre style="white-space: pre-wrap">{{ set.cards.join(", ") }}</pre>
      <br>
<!--      <button @click="()=> pickSet(set.setCode)">Pick this set {{set.setCode}}</button>-->
    </div>
  </div>

</template>

<script setup lang="ts">
import {ScryFall} from '../apiWrapper/ScryFall.ts'
import {reactive, type Ref, ref} from "vue";
import MoxfieldParser from "./MoxfieldParser.vue";

const scryFall = new ScryFall()


function handleParsedInput(parsedInput: Array<Record<string, string>>) {
  // Removes land as it's not relevant for opening packs
  // console.log("received input", parsedInput)
  // const basicLands = [
  //   { name: "plains", type: "Basic Land", color: "White" },
  //   { name: "island", type: "Basic Land", color: "Blue" },
  //   { name: "swamp", type: "Basic Land", color: "Black" },
  //   { name: "mountain", type: "Basic Land", color: "Red" },
  //   { name: "forest", type: "Basic Land", color: "Green" }
  // ];
  const basicLands = ["plains", "island", "mountain", "forest", "swamp"];
  cardNames = []
  for (const card of parsedInput) {
    if(!cardNames.includes(card.name) && !basicLands.includes(card.name.toLowerCase()) ) {
        cardNames.push(card.name)
    }
  }
  console.log("Card names!", cardNames)
}
 console.log("dummy")
let cardNames = ["Lightning Bolt", "Shock"]
const sharedSetsDisplay: Ref<any> = ref(null)

const pickedCards = ref<string[]>([])
const pickedSets= ref<string[]>([])
const cardsInPickedSet = reactive({})

const availableSetsAndCardsPerSet = ref<Record<string, any>[]>([])

// warning this will be an issue
// let allSetsByCode = ref<Record<string, any>>({})
let allSetsByCode = {}
async function loadAllSets() {
  allSetsByCode = await getGroupAllSetsByCode()
  await buildAvailableSets(cardNames)
}

async function buildAvailableSets(cardNames: string[], setCodesToIgnore: string[] = [], alreadyPickedCards:string[] = []) {
   const setsAvailable = Object.entries(await getGroupedSets(cardNames, alreadyPickedCards))
      .filter(([setCode]) => !setCodesToIgnore.includes(setCode))
      .map(([setCode, cards]) => ({ setCode, cards }));

   // sort by number of cards
   setsAvailable.sort((a, b) => b.cards.length - a.cards.length);


   availableSetsAndCardsPerSet.value = [...setsAvailable]
  console.log("availableSetsAndCardsPerSet", availableSetsAndCardsPerSet.value)

}

async function pickSet(setCode: string) {
  pickedSets.value.push(setCode)
  let remainingCards = cardNames.filter(cardName => !pickedCards.value.includes(cardName))
  // this could be saved off so we don't have to rebuild everytime
  // is this gonna cause issues?? with passing in pickedCards
  const originalCardsBySet: Record<string, any> = await getGroupedSets(remainingCards, pickedCards.value)
  const cardsPicked = originalCardsBySet[setCode]
  cardsInPickedSet[setCode] = cardsPicked
  for (const card of cardsPicked) {
    if(!pickedCards.value.includes(card)) {
      pickedCards.value.push(card)
    }
  }
  console.log("picked Cards", pickedCards.value)

  remainingCards = cardNames.filter(cardName => !pickedCards.value.includes(cardName))
  console.log("remaining cards", remainingCards)
  const remainingCardsBySet = Object.fromEntries(
      Object.entries(await getGroupedSets(remainingCards, pickedCards.value))
          .filter(([setCode, _cards]) => !pickedSets.value.includes(setCode))
  )
  console.log("cardsBySet", remainingCardsBySet)
  if(Object.keys(remainingCardsBySet).length === 0) {
    console.log("ALL DONE!")
  }
  console.log("cardsPicked", cardsPicked)


  await buildAvailableSets(remainingCards, pickedSets.value, pickedCards.value)
}

async function getGroupAllSetsByCode() {
  let allSets: Array<any> = checkStorage("allSets")
  console.log("all sets check")
  if (!allSets) {
    allSets = await scryFall.getAllSets()
    localStorage.setItem("allSets", JSON.stringify(allSets));
  }
  const setsByCode: Record<string, any> = {}
  allSets.forEach((setObj: any) => {
    setsByCode[setObj.code] = {...setObj}
  })
  console.log("setsByCode", setsByCode)
  return setsByCode
}




// ignored cards names just aren't copied from the set data
async function getGroupedSets(cardNames: string[], ignoredCardNames: string[] = []) {
  if (!cardNames.length) {
    return {}
  }
  const sets = await groupBySets();
  // console.log("sets", sets)
  const filteredSets = {}
  const setSeen = new Set()
  const cardsAdded = new Set()

  const sortedData =
      Object.entries(sets).sort(([, a], [, b]) => {
        // console.log(a)
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
      const cardsList = setData[1].filter( cardName => !ignoredCardNames.includes(cardName))
      // console.log('setId', setId, cardsList)
      if (!cardsList.includes(cardName)) {
        continue;
      }
      if (!setSeen.has(setId) && cardsList.length) {
        setSeen.add(cardName);
        // remove the set list by that id

        const hasMultiple = cardsList.length > 1
        if (hasMultiple) {
          for (const card of cardsList) {
            cardsAdded.add(card);
          }
          filteredSets[setId] = [...cardsList]
          // delete cardsList[setId];
          // break;
        }
      }
    }
  }

  console.log("filteredSets before adding singles", filteredSets)
  for (const setData of sortedData) {
    // console.log("setData", setData)
    const setId = setData[0]
    const cardsList = setData[1].filter(cardName => !ignoredCardNames.includes(cardName))

    // this is stupid don't add cards you've seen before baka!
    if (!setSeen.has(setId) && cardsList.length) {
      filteredSets[setId] = [...cardsList]
    }
  }
  // returns all grouped cards if possible and then returns all remaining singles should probably filter out if the card has been seen before
  return filteredSets
}


// fetches or reads from local storage
async function fetchAll() {
  const delay = 100;

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
  const storage = checkStorage("allSetsByCode")
  if (storage) {
    return storage
  }
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

  localStorage.setItem("allSetsByCode", JSON.stringify(cardSetsOnly));
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


function checkStorage(storageKey: string) {
  const storage = localStorage.getItem(storageKey);
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
.set-name-header {
  font-weight: bold;
  font-size: 1.2rem;
}
</style>
