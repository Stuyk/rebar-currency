export type CharacterCurrencies = {
    bank: number;
    cash: number;
    // Add new currencies here
};

export type AccountCurrencies = {
    points: number;
    // Add new currencies here
};

export type AllCurrencyTypes = keyof CharacterCurrencies | keyof AccountCurrencies;
export type AllCurrencies = CharacterCurrencies & AccountCurrencies;
