// This is TYPES not interfaces which are bit more declarative

export type cardName = string;
export type setCode = string;
export type setWithCards = {
    setCode: string;
    cards: string[];
};