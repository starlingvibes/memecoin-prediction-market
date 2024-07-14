# Memecoin Prediction Market
Using binary option models, create a prediction market for Solana meme coin prices. Users should be able to predict if a meme coin price will end higher or lower within a specified timeframe.


Additionally, develop a Blink for this program — this is optional.

 - Develop a prediction market using binary options for Solana meme coins.

 - Allow users to enter a meme coin and make price predictions.

 - Optional: Create a blink to demonstrate the program.

## Requirements

  <ul>
    <li>Rust installation: <a href="https://www.rust-lang.org/tools/install">here</a></li>
    <li>Solana installation: <a href="https://docs.solana.com/cli/install-solana-cli-tools">here</a></li>
    <li>Yarn installation: <a href="https://yarnpkg.com/getting-started/install">here</a></li>
    <li>Anchor installation: <a href="https://www.anchor-lang.com/docs/installation">here</a>
    <li>Git installation: <a href="https://git-scm.com/book/en/v2/Getting-Started-Installing-Git">here</a>
  </ul>


## Getting Started

### Cloning project

```bash
git clone https://github.com/starlingvibes/memecoin-prediction-market.git
code memecoin-prediction-market
```
### Creating local wallet

```bash
solana-keygen new 
```

<h4>Verify keypair</h4>

```bash
solana-keygen pubkey ~/.config/solana/id.json
```

<h5>Output</h5>

```bash
CBEPKK5C5CYDbCDhsk1TaFLUXVNnw7QnXTc2ueqTgXvy
```

```bash
solana-keygen verify <PUBKEY> ~/.config/solana/id.json
```

<h3>Anchor.toml</h3>

```
[provider]
cluster = "localnet"
wallet = "~/.config/solana/id.json"
```

### Building

```bash
yarn
```

```bash
anchor build
anchor keys list
```
  Take the output of program id. Copy and paste it into Anchor.toml ```memecoin-prediction-market = "CBEPKK5C5CYDbCDhsk1TaFLUXVNnw7QnXTc2ueqTgXvy"``` and ```declare_id!("CBEPKK5C5CYDbCDhsk1TaFLUXVNnw7QnXTc2ueqTgXvy");``` here.

Build again

```bash
anchor build
```

### Test

```bash
anchor test
```