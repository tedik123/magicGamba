// Sample Moxfield data
export const sampleMoxfieldData = `
1 Mabel, Heir to Cragflame (BLB) 224
1 Abraded Bluffs (OTJ) 251
1 Ajani's Welcome (M19) 6
1 Andúril, Narsil Reforged (LTC) 491
1 Axgard Armory (KHM) 250
1 Blasphemous Act (LCC) 216
1 Bloodforged Battle-Axe (PIP) 226
1 Boros Garrison (ZNC) 122
1 Brambleguard Captain (BLB) 127
1 Brave the Sands (KTK) 5
1 Canyon Jerboa (ZNR) 7
1 Cheeky House-Mouse // Squeak By (WOE) 7
1 Clifftop Retreat (DOM) 239
1 Command Tower (WHO) 265
1 Dawn's Truce (BLB) 9
1 Demonic Ruckus (OTJ) 120
1 Dreadmaw's Ire (LCI) 147
1 Embercleave (ELD) 120
1 Emberheart Challenger (BLB) 133
1 Fighter Class (AFR) 222
1 Flawless Maneuver (SLD) 1728
1 Flowerfoot Swordmaster (BLB) 14
1 Forge Anew (LTR) 17
1 Goblin Oriflamme (FDN) 539
1 Gods Willing (STA) 7
1 Halvar, God of Battle // Sword of the Realms (KHM) 299
1 Hammer of Nazahn (C17) 51
1 Heartfire Hero (BLB) 138
1 Helm of the Host (PDOM) 217p
1 Herald's Horn (JMP) 469
1 Intangible Virtue (WOT) 6
1 Inventory Management (PIP) 105
1 Loxodon Warhammer (CM2) 199
1 Luminous Rebuke (FDN) 20
1 Lupinflower Village (BLB) 256
1 Manifold Mouse (BLB) 143
1 Masterwork of Ingenuity (PIP) 234
1 Metallic Mimic (KLR) 251
1 Might of the Meek (BLB) 144
1 Mirror Entity (MKC) 75
1 Monumental Henge (MH3) 222
9 Mountain (FDN) 279
1 Mouse Trapper (BLB) 22
1 Nettle Guard (BLB) 23
1 Pacifism (FDN) 501
1 Patchwork Banner (BLB) 247
1 Path of Ancestry (M3C) 363
9 Plains (FDN) 273
1 Puresteel Paladin (PIP) 170
1 Raging Battle Mouse (WOE) 143
1 Raise the Past (FDN) 22
1 Rally the Ranks (KHM) 20
1 Recommission (BRO) 22
1 Roaming Throne (LCI) 258
1 Rockface Village (BLB) 259
1 Roughshod Duo (BLB) 150
1 Rugged Prairie (OTC) 314
1 Sacred Foundry (GRN) 254
1 Seedglaive Mentor (BLB) 231
1 Sevinne's Reclamation (MKC) 83
1 Shadowspear (THB) 236
1 Slayers' Stronghold (MKC) 295
1 Sol Ring (PIP) 239
1 Sram, Senior Edificer (AER) 23
1 Steelburr Champion (BLC) 12
1 Sundown Pass (WHO) 310
1 Swiftfoot Boots (FDN) 258
1 Sword of the Meek (BRR) 59
1 Sword of the Squeak (BLC) 72
1 Take Heart (GRN) 28
1 Temple of Triumph (FDN) 705
1 Thistledown Players (BLB) 35
1 Three Blind Mice (WOE) 35
1 Trailblazer's Boots (LTR) 398 *F*
1 Uncharted Haven (BLB) 261
1 Valley Flamecaller (BLB) 158
1 Valley Questcaller (BLB) 36
1 Valorous Stance (FDN) 583
1 Vanquisher's Banner (XLN) 251
1 Warleader's Call (MKM) 242
1 Wear // Tear (PIP) 222
1 Whiskerquill Scribe (BLB) 161
1 Whiskervale Forerunner (BLB) 40
1 Wind-Scarred Crag (FDN) 271

SIDEBOARD:
1 Austere Command (LCC) 126
1 Fumigate (MKC) 66
1 Wrath of God (DMR) 279
`;

// Function to parse the Moxfield data into an array of objects
export function parseMoxfieldData(data) {
    const lines = data.split('\n').filter(line => line.trim() !== '');
    const parsedData = [];
    let isSideboard = false;

    lines.forEach(line => {
        // Skip empty lines and sideboard marker
        if (line.toLowerCase() === 'sideboard:') {
            isSideboard = true;
            return;
        }

        // Try matching full format first: quantity + name + (set) + number
        const fullFormatRegex = /^(\d+)\s+(.+?)\s+\((\w+)\)\s+(\d+.*)/;
        const fullMatch = line.match(fullFormatRegex);

        if (fullMatch) {
            const [_, quantity, name, set, cardNumber] = fullMatch;
            parsedData.push({
                quantity: parseInt(quantity, 10),
                name: name.trim(),
                set: set.trim(),
                cardNumber: cardNumber.trim(),
                sideboard: isSideboard
            });
            return;
        }

        // Try matching simple format: quantity + name
        const simpleFormatRegex = /^(\d+)\s+(.+)$/;
        const simpleMatch = line.match(simpleFormatRegex);

        if (simpleMatch) {
            const [_, quantity, name] = simpleMatch;
            parsedData.push({
                quantity: parseInt(quantity, 10),
                name: name.trim(),
                set: null,
                cardNumber: null,
                sideboard: isSideboard
            });
        }
    });

    return parsedData;
}

