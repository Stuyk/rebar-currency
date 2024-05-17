import * as alt from 'alt-server';

import { useRebar } from '@Server/index.js';
import { CharacterCurrencies, AccountCurrencies, AllCurrencyTypes } from '../shared/config.js';
import { CollectionNames } from '@Server/document/shared.js';

type CurrencyChangeCallback = (player: alt.Player, type: AllCurrencyTypes, amount: number) => void;

const API_NAME = 'currency-api';
const Rebar = useRebar();
const callbacks: CurrencyChangeCallback[] = [];

type CurrencyDefinitions = {
    Character: CharacterCurrencies;
    Account: AccountCurrencies;
};

function updateCurrency(player: alt.Player, type: AllCurrencyTypes, value: number) {
    for (let cb of callbacks) {
        cb(player, type, value);
    }
}

function useCurrency<K extends keyof CurrencyDefinitions>(playerOrDatabaseId: alt.Player | string, type: K) {
    // Omits keys which we are not interested in to be used for all functions below
    type CurrencyType = K extends 'Character' ? keyof CharacterCurrencies : keyof AccountCurrencies;

    let document:
        | ReturnType<typeof Rebar.document.virtual.useVirtual>
        | ReturnType<typeof Rebar.document.account.useAccount>
        | ReturnType<typeof Rebar.document.character.useCharacter>;

    if (type === 'Character') {
        document =
            typeof playerOrDatabaseId === 'string'
                ? Rebar.document.virtual.useVirtual(playerOrDatabaseId, CollectionNames.Characters)
                : Rebar.document.character.useCharacter(playerOrDatabaseId);
    } else {
        document =
            typeof playerOrDatabaseId === 'string'
                ? Rebar.document.virtual.useVirtual(playerOrDatabaseId, CollectionNames.Accounts)
                : Rebar.document.account.useAccount(playerOrDatabaseId);
    }

    /**
     * Add a currency of a given type and a given amount
     *
     * @param {CurrencyType} type
     * @param {number} amount
     * @return
     */
    async function add(type: CurrencyType, amount: number) {
        const parameterName = String(type);
        const data = await document.get<CurrencyDefinitions[K]>();
        const value = data[parameterName] ? data[parameterName] : 0;

        let amountChangedTo = 0;
        if (value + amount > Number.MAX_SAFE_INTEGER) {
            amountChangedTo = Number.MAX_SAFE_INTEGER;
            await document.set(type, Number.MAX_SAFE_INTEGER);
        } else {
            amountChangedTo = value + amount;
            await document.set(type, value + amount);
        }

        if (playerOrDatabaseId instanceof alt.Player) {
            updateCurrency(playerOrDatabaseId, type, amount);
        }

        return true;
    }

    /**
     * Subtracts a given currency type from an amount
     * Returns `false` if minimum amount is unavailable
     *
     * @param {CurrencyType} type
     * @param {number} amount
     * @return
     */
    async function sub(type: CurrencyType, amount: number) {
        const parameterName = String(type);
        const data = await document.get<CurrencyDefinitions[K]>();
        const value = data[parameterName] ? data[parameterName] : 0;
        if (value < amount) {
            return false;
        }

        const newAmount = value - amount;
        await document.set(type, newAmount);

        if (playerOrDatabaseId instanceof alt.Player) {
            updateCurrency(playerOrDatabaseId, type, amount);
        }

        return true;
    }

    /**
     * Override current currency amount, and set it to the exact amount.
     *
     * @param {CurrencyType} type
     * @param {number} amount
     * @return
     */
    async function set(type: CurrencyType, amount: number) {
        await document.set(type, amount);

        if (playerOrDatabaseId instanceof alt.Player) {
            updateCurrency(playerOrDatabaseId, type, amount);
        }

        return true;
    }

    /**
     * Check if a given currency type has a certain amount.
     *
     * @param {CurrencyType} type
     * @param {number} amount
     * @return
     */
    async function has(type: CurrencyType, amount: number) {
        const currency = await document.getField<AccountCurrencies | CharacterCurrencies>(
            type as keyof CharacterCurrencies & keyof AccountCurrencies,
        );

        return currency > amount;
    }

    /**
     * Return the given amount for a currency type.
     * Automatically returns `0` if currency type is undefined.
     *
     * @param {CurrencyType} type
     * @return
     */
    async function get(type: CurrencyType) {
        const currency = await document.getField<AccountCurrencies | CharacterCurrencies>(
            type as keyof CharacterCurrencies & keyof AccountCurrencies,
        );

        return currency ? currency : 0;
    }

    return {
        add,
        get,
        has,
        set,
        sub,
    };
}

function useApi() {
    function onChange(callback: CurrencyChangeCallback) {
        callbacks.push(callback);
    }

    return {
        useCurrency,
        onChange,
    };
}

declare global {
    export interface ServerPlugin {
        [API_NAME]: ReturnType<typeof useApi>;
    }
}

Rebar.useApi().register(API_NAME, useApi());
