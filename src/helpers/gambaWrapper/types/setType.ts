export type IScryfallSet = {
    object: "set";
    id: string;
    code: string;
    tcgplayer_id: number;
    name: string;
    uri: string;
    scryfall_uri: string;
    search_uri: string;
    released_at: string; // ISO date format (YYYY-MM-DD)
    set_type: string;
    card_count: number;
    digital: boolean;
    nonfoil_only: boolean;
    foil_only: boolean;
    block_code?: string; // Optional since not all sets may have this
    block?: string; // Optional since not all sets may have this
    icon_svg_uri: string;
};
