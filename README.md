# Currency for Rebar Framework

This currency plugin lets you easily add, subtract, and get player currency.

You can even create your own currency by adjusting the `config.ts` file after installation.

## Requires

You must have some form of character binder for this to work.

A player must have a character selected for any currency updates to work.

-   [Rebar Character Select](https://github.com/Stuyk/rebar-character-select)

## Features

-   Create any currency
-   Listen for callbacks when a player's currency updates
-   Add, remove, get, and set player currency values
-   Bind a specific currency to an account, rather than a character

## API

If you need to listen for when a player has selected a character you can use the `character-select-api`.

```ts
import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';

const Rebar = useRebar();
const api = Rebar.useApi();

async function giveMoney(player: alt.Player) {
    await alt.Utils.wait(5000);

    const { showNotification } = Rebar.player.useNotify(player);

    const { useCurrency } = await api.getAsync('currency-api');
    const accountCurrency = useCurrency(player, 'Account');
    const characterCurrency = useCurrency(player, 'Character');

    await accountCurrency.add('points', 5);
    await characterCurrency.add('bank', 5);
    await characterCurrency.add('cash', 5);

    let points = await accountCurrency.get('points');
    let bank = await characterCurrency.get('bank');
    let cash = await characterCurrency.get('cash');

    showNotification(`Points: ${points}`);
    showNotification(`Bank: ${bank}`);
    showNotification(`Cash: ${cash}`);

    await accountCurrency.sub('points', 5);
    await characterCurrency.sub('bank', 5);
    await characterCurrency.sub('cash', 5);
}
```

## Installation

From the main directory of your `Rebar` framework.

```
git clone https://github.com/Stuyk/rebar-currency src/plugins/currency
```

That's it.

If you wish to save the plugin in your own repository, go to the `src/plugins/currency` folder and delete the `.git` folder.
