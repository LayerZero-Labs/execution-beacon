# Execution Beacon Solana

## Setup

<details>
<summary>Docker</summary>
<br>

[Docker](https://docs.docker.com/get-started/get-docker/) is required to build using anchor. We highly recommend that you use the most up-to-date Docker version to avoid any issues with anchor
builds.

</details>

<details>
<summary>Install Rust</summary>
<br>

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
```

</details>

<details>
<summary>Install Solana <code>2.3.0</code></summary>
<br>

```bash
sh -c "$(curl -sSfL https://release.anza.xyz/v2.3.0/install)"
```

</details>

<details>
<summary>Install Anchor <code>0.32.1</code> </summary>
<br>

```bash
cargo install --git https://github.com/solana-foundation/anchor --tag v0.32.1 anchor-cli --locked
```

</details>

## Build

### Prepare the Solana OFT Program keypair

Create the OFT program ID keypair by running:
```
anchor keys sync -p oft
```

View the program ID's based on the generated keypairs:
```
anchor keys list
```

You will see an output such as:
```
oft: FfUKyGjrUREsjBhsykyAHUMy12qVHbSsuCiqSSAaJpwp
```

Copy the OFT program ID value for use in the build step later.

### Building the Solana OFT Program

Ensure you have Docker running before running the build command.

```
anchor build -v -e OFT_ID=<OFT_PROGRAM_ID>
```

Where `<OFT_PROGRAM_ID>` is replaced with your OFT program ID copied from the previous step.

> :information_source: For a breakdown of expected rent-exempt costs before deployment, see https://docs.layerzero.network/v2/developers/solana/technical-reference/solana-guidance#previewing-solana-rent-costs.


## Deploy

#### (Recommended) Deploying with a priority fee

The `deploy` command will run with a priority fee. Read the section on ['Deploying Solana programs with a priority fee'](https://docs.layerzero.network/v2/developers/solana/technical-reference/solana-guidance#deploying-solana-programs-with-a-priority-fee) to learn more.

#### Run the deploy command

```bash
solana program deploy --program-id target/deploy/oft-keypair.json target/verifiable/oft.so -u devnet --with-compute-unit-price <COMPUTE_UNIT_PRICE_IN_MICRO_LAMPORTS>
```

<details>

:information_source: the `-u` flag specifies the RPC URL that should be used. The options are `mainnet-beta, devnet, testnet, localhost`, which also have their respective shorthands: `-um, -ud, -ut, -ul`

:warning: If the deployment is slow, it could be that the network is congested and you might need to increase the priority fee.

</details>

## Tests

Ensure you have platform tools installed:
```
cargo build-sbf --force-tools-install
```

### Run tests
```
anchor test