import {ScryFall} from "../../apiWrapper/ScryFall.ts";
import type {IScryfallSet} from "./types/setType.ts";

//global for now to keep things simple
const scryFall = new ScryFall();

function checkStorage(storageKey: string) {
    const storage = localStorage.getItem(storageKey);
    if (storage) {
        return JSON.parse(storage)
    }
    return null;
}


async function getCardSetsOnly(cardNames: string[]): Promise<IScryfallSet[]> {
    const stringKey = cardNames.join("")
    const storage = checkStorage(stringKey)
    if (storage) {
        return storage
    }
    const data = await fetchAll(cardNames);
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

    localStorage.setItem("stringKey", JSON.stringify(cardSetsOnly));
    return cardSetsOnly
}

// this feels like it can be seperated out to another class
async function getCardPrintings(cardName: string) {
    const storage = checkStorage(cardName)
    if (storage) {
        return storage
    }
    const json = await scryFall.getCardPrintings(cardName, true);
    localStorage.setItem(cardName, JSON.stringify(json));
    return json;
}

// groups the cards by sets does NOT do any filtering or grouping beyond that
async function groupBySets(cardNames: string[]): Promise<IScryfallSet[]> {
    const cardSetsOnly: Record<any, any> = await getCardSetsOnly(cardNames);
    const allSets: Record<string, Array<string>> = {}

    for (const [cardName, cardSets] of Object.entries(cardSetsOnly)) {

        for (const set of cardSets) {
            if(set.length === 4) {
                console.log("uh oh this is an unofficial set, skipping!", set)
                continue
            }
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


// fetches all the cards to get their card printings or reads from local storage
async function fetchAll(cardNames: string[]): Promise<IScryfallSet[]> {
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


export class GambaWrapper {
    private scryFall: ScryFall;
    private initialCardNames: string[];
    //todo type this!!!!
    private originalSetsByCard: Record<any, any>

    // This only runs once, for now used to just fetch names and basic data from the set
    public setsByCode: Record<string, IScryfallSet> = {}


    // this is the current set and cards
    public runningAvailableSetsAndCardsPerSet;

    // const pickedCards = ref<string[]>([])
    // const pickedSets= ref<string[]>([])
    // const cardsInPickedSet = reactive({})

    private pickedCards;
    private pickedSets;
    private cardsInPickedSet: Record<string, string>;

    private cardNames;

    constructor(initialCardNames: string[]) {
        this.scryFall = new ScryFall()
        // idk what the difference is between these two, i guess card names is the running card names (updating/in progress)
        this.initialCardNames = initialCardNames
        this.cardNames = initialCardNames

        //defaults

        this.pickedCards = [];
        this.pickedSets = [];
        this.cardsInPickedSet = {};
        // for the love of god type this
        this.runningAvailableSetsAndCardsPerSet = [];

    }

    async getGroupAllSetsByCode() {
        let allSets: Array<any> = checkStorage("allSets")
        console.log("all sets check")
        if (!allSets) {
            allSets = await this.scryFall.getAllSets()
            localStorage.setItem("allSets", JSON.stringify(allSets));
        }
        const setsByCode: Record<string, IScryfallSet> = {}
        allSets.forEach((setObj: IScryfallSet) => {
            setsByCode[setObj.code] = {...setObj}
        })
        console.log("setsByCode", setsByCode)
        return setsByCode
    }


    // ignored cards names just aren't copied from the set data
    // this also feels like it can be seperated out to another class
    async getGroupedSets(cardNames: string[], ignoredCardNames: string[] = []) {
        if (!cardNames.length) {
            return {}
        }
        const sets = await groupBySets(cardNames);
        // console.log("sets", sets)

        const filteredSets: Record<string, string[]> = {}
        const setSeen = new Set()
        const cardsAdded = new Set()

        const sortedData =
            Object.entries(sets).sort(([, a], [, b]) => {
                // console.log(a)
                return b.length - a.length
            })
        // sorted data where each value is [setId, [...array_values]]

        for (const cardName of cardNames) {

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


    // this can definitely be seperated out to another class!!!!
    async buildAvailableSets(cardNames: string[], setCodesToIgnore: string[] = [], alreadyPickedCards:string[] = []) {
        // this calculates how many sets are remaining to pick from based on card names and cards to ignore
        const setsAvailable = Object.entries(await this.getGroupedSets(cardNames, alreadyPickedCards))
            .filter(([setCode]) => !setCodesToIgnore.includes(setCode))
            .map(([setCode, cards]) => ({ setCode, cards }));

        // sort by number of cards
        setsAvailable.sort((a, b) => b.cards.length - a.cards.length);


        this.runningAvailableSetsAndCardsPerSet.splice(0, this.runningAvailableSetsAndCardsPerSet.length);
        this.runningAvailableSetsAndCardsPerSet.push(...setsAvailable)

        // Object.assign(this.runningAvailableSetsAndCardsPerSet, setsAvailable);
        console.log("availableSetsAndCardsPerSet", this.runningAvailableSetsAndCardsPerSet)

    }


    // this is the entry point
    async loadAllSets() {
        this.setsByCode = await this.getGroupAllSetsByCode()
        this.originalSetsByCard = await this.getGroupedSets(this.initialCardNames)
        // deep copy original
        await this.buildAvailableSets(this.initialCardNames)
    }

    // TODO pick set logic
    // pickSets definitely should be part of gamba wrapper but writes to a reactive object perhaps??
    async pickSet(setCode: string) {
        console.log("set code chosen", setCode)
        this.pickedSets.push(setCode)
        console.log("this card names", this.pickedCards)
        let remainingCards = this.cardNames.filter(cardName => !this.pickedCards.includes(cardName))
        // this could be saved off so we don't have to rebuild everytime
        // is this gonna cause issues?? with passing in pickedCards,
        console.log("remaing ", remainingCards, "picked sets", this.pickedCards)
        const originalCardsBySet: Record<string, any> = await this.getGroupedSets(remainingCards, this.pickedCards)
        console.log("cards picked set thingy plz check", originalCardsBySet, "setcode", originalCardsBySet[setCode])
        const cardsPicked = originalCardsBySet[setCode]
        this.cardsInPickedSet[setCode] = cardsPicked
        for (const card of cardsPicked) {
            if(!this.pickedCards.includes(card)) {
                this.pickedCards.push(card)
            }
        }
        console.log("picked Cards", this.pickedCards)

        remainingCards = this.cardNames.filter(cardName => !this.pickedCards.includes(cardName))
        console.log("remaining cards", remainingCards)
        const remainingCardsBySet = Object.fromEntries(
            Object.entries(await this.getGroupedSets(remainingCards, this.pickedCards))
                .filter(([setCode, _cards]) => !this.pickedSets.includes(setCode))
        )
        console.log("cardsBySet", remainingCardsBySet)
        if(Object.keys(remainingCardsBySet).length === 0) {
            console.log("ALL DONE!")
        }
        console.log("cardsPicked", cardsPicked)

        await this.buildAvailableSets(remainingCards, this.pickedSets, this.pickedCards)
    }


}