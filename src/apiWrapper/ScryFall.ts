const baseUrl = 'https://api.scryfall.com';

export class ScryFall {

    constructor() {

    }

    async getCardByExactName(exactCardName: string) {
        const encodedName = encodeURIComponent(`!"${exactCardName}"`);
        const url = `${baseUrl}/cards/search?q=${encodedName}`;
        const cardResponse = await fetch(url);
        console.log(cardResponse);
        const cardResponseJson = (await cardResponse.json())?.data;
        console.log("cardResponseJson", cardResponseJson);
        return cardResponseJson && cardResponseJson.length ? cardResponseJson[0] : null;
    }

    async getCardPrintings(exactCardName: string, uniqueSets = false) {
        /**
         * Search for all printings of a card across different sets using the Scryfall API.
         *
         * @param {string} cardName - The exact card name to search for
         * @returns {Promise<Array<Object>>} Array of objects containing set information for each printing
         * @throws {Error} If the API request fails or no cards are found
         */

            // URL encode the card name for the API request with exact matching
        const cardJson = await this.getCardByExactName(exactCardName);
        if (!cardJson) {
            return null;
        }
        const printsUri = cardJson.prints_search_uri;
        if (!printsUri) {
            console.error('No Prints Found');
            return null;
        }

        try {
            const response = await fetch(printsUri);

            if (!response.ok) {
                throw new Error(`API request failed with status: ${response.status}`);
            }

            const data = await response.json();

            if (data.total_cards === 0) {
                throw new Error(`No cards found with name: ${exactCardName}`);
            }

            // Extract relevant set information for each printing
            // const printings = data.data.map(card => ({
            //     setName: card.set_name,
            //     setCode: card.set,
            //     set_type: card.set_type,
            //     set_uri: card.set_uri,
            //     collectorNumber: card.collector_number,
            //     rarity: card.rarity,
            //     releaseDate: card.released_at,
            //     imageUrl: card.image_uris?.normal || null
            // }));

            const printings = data.data;
            if (!uniqueSets) {
                return printings;
            }

            // filter out any that share the same unique set
            const set = new Set();
            const uniquePrintings = [];
            for (const print of printings) {
                if (!set.has(print.set)) {
                    set.add(print.set);
                    uniquePrintings.push(print);
                }
            }
            return uniquePrintings;


        } catch (error) {
            throw new Error(`Failed to fetch card data: ${error.message}`);
        }
    }

// // Example usage
//     async example() {
//         try {
//             const cardName = "Lightning Bolt";
//             const printings = await this.getCardPrintings(cardName);
//
//             console.log(`\nPrintings of ${cardName}:`);
//             printings.forEach(printing => {
//                 console.log(`\nSet: ${printing.setName} (${printing.setCode.toUpperCase()})`);
//                 console.log(`Collector Number: ${printing.collectorNumber}`);
//                 console.log(`Rarity: ${printing.rarity.charAt(0).toUpperCase() + printing.rarity.slice(1)}`);
//                 console.log(`Release Date: ${printing.releaseDate}`);
//             });
//
//         } catch (error) {
//             console.error(`Error: ${error.message}`);
//         }
//     }

}