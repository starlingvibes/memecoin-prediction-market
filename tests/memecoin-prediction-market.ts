import * as anchor from "@coral-xyz/anchor";
import { MemecoinPredictionMarket } from "../target/types/memecoin_prediction_market";
import { assert } from "chai";
import { PublicKey } from '@solana/web3.js';
import { makeKeypairs, confirmTransaction } from '@solana-developers/helpers';
import { setTimeout } from 'timers/promises';

/**
 * Requests an airdrop of lamports to the given publicKey and waits for the transaction to be confirmed.
 *
 * @param provider The anchor provider.
 * @param publicKey The public key of the account to receive the airdrop.
 * @param lamports The amount of lamports to airdrop.
 * @returns a promise that resolves when the transaction is confirmed.
 */
async function airdropSOL(
  provider: anchor.AnchorProvider,
  publicKey: anchor.web3.PublicKey,
  lamports: number,
): Promise<void> {
  const signature = await provider.connection.requestAirdrop(publicKey, lamports);
  await confirmTransaction(provider.connection, signature);
  // await provider.connection.confirmTransaction(signature);
}

describe("Test Memecoin Prediction Market", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.local();
  anchor.setProvider(provider);

  const program = anchor.workspace.MemecoinPredictionMarket as anchor.Program<MemecoinPredictionMarket>;

  let [bankPda, _] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("bank")],
    program.programId
  );

  const jupPubkey = new anchor.web3.PublicKey('JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN');
  const jupPrice = new anchor.BN(2000);
  const finalPrice = new anchor.BN(3220);
  const predictionAmount = 1 * anchor.web3.LAMPORTS_PER_SOL;

  it("should initialize the bank and credit with Sol", async () => {
    await program.methods
      .initializeABank()
      .accounts({
        owner: provider.wallet.publicKey
      })
      .rpc();

    const initialBalance = await provider.connection.getBalance(bankPda);

    await program.methods
      .creditBankBalance(new anchor.BN(5))
      .accounts({
        owner: provider.wallet.publicKey,
      })
      .rpc();

    const finalBalance = await provider.connection.getBalance(bankPda);
    assert.equal(finalBalance - initialBalance, 5 * anchor.web3.LAMPORTS_PER_SOL)
  });

  it('should create a new proposal for the JUP memecoin', async () => {
    const currentSlot = await program.provider.connection.getSlot();
    const currentBlocktime = await program.provider.connection.getBlockTime(currentSlot);

    await program.methods
      .initializeABank()
      .accounts({
        owner: provider.wallet.publicKey
      })
      .rpc();

    await program.methods
      .creditBankBalance(new anchor.BN(5))
      .accounts({
        owner: provider.wallet.publicKey,
      })
      .rpc();

    const proposalAccount = anchor.web3.Keypair.generate();

    await program.methods
      .createAProposal(jupPubkey, jupPrice, new anchor.BN(currentBlocktime + 60))
      .accounts({
        proposal: proposalAccount.publicKey,
        authority: provider.wallet.publicKey
      })
      .signers([proposalAccount])
      .rpc();

    const proposalData = await program.account.proposal.fetch(proposalAccount.publicKey);

    assert.equal(proposalData.authority.toString(), provider.wallet.publicKey.toString());
    assert.equal(proposalData.coin.toString(), jupPubkey.toString());
    assert.equal(proposalData.price.toNumber(), jupPrice.toNumber());
    assert.equal(proposalData.priceOnExpiry.toNumber(), 0);
    assert.equal(proposalData.settled, false);
    assert.equal(proposalData.expiry.toNumber(), currentBlocktime + 60);
  });

  it('should create a long prediction for the memecoin', async () => {
    const currentSlot = await program.provider.connection.getSlot();
    const currentBlocktime = await program.provider.connection.getBlockTime(currentSlot);
    
    await program.methods
      .initializeABank()
      .accounts({
        owner: provider.wallet.publicKey
      })
      .rpc();

    await program.methods
      .creditBankBalance(new anchor.BN(2))
      .accounts({
        owner: provider.wallet.publicKey,
      })
      .rpc();

    const proposalAccount = anchor.web3.Keypair.generate();

    await program.methods
      .createAProposal(jupPubkey, jupPrice, new anchor.BN(currentBlocktime + 60))
      .accounts({
        proposal: proposalAccount.publicKey,
        authority: provider.wallet.publicKey
      })
      .signers([proposalAccount])
      .rpc();

    const bankBalance = await provider.connection.getBalance(bankPda);
    const walletBalance = await provider.connection.getBalance(provider.wallet.publicKey);

    await program.methods
      .makeAPrediction(true, new anchor.BN(predictionAmount)) // higher and 1 SOL
      .accounts({
        proposal: proposalAccount.publicKey,
        user: provider.wallet.publicKey,
      })
      .rpc();

    const [predictionPda, bump] = await PublicKey.findProgramAddressSync(
      [
        Buffer.from("prediction"),
        proposalAccount.publicKey.toBuffer(),
        provider.wallet.publicKey.toBuffer(),
      ],
      program.programId
    );

    const predictionAccount = await program.account.userPrediction.fetch(predictionPda);

    assert.equal(predictionAccount.authority.toString(), provider.wallet.publicKey.toString());
    assert.ok(predictionAccount.goLong);
    assert.equal(predictionAccount.amount.toNumber(), predictionAmount);
    assert.notOk(predictionAccount.resolved);

    const latestBankBalance = await provider.connection.getBalance(bankPda);
    const latestWalletBalance = await provider.connection.getBalance(provider.wallet.publicKey);

    assert.equal(latestBankBalance, bankBalance + predictionAmount);
    assert(latestWalletBalance < walletBalance - predictionAmount); 
  });

  it("should fail if already expired", async () => {
    const currentSlot = await program.provider.connection.getSlot();
    const currentBlocktime = await program.provider.connection.getBlockTime(currentSlot);
    
    await program.methods
      .initializeABank()
      .accounts({
        owner: provider.wallet.publicKey
      })
      .rpc();


    const proposalAccount = anchor.web3.Keypair.generate();

    await program.methods
      .createAProposal(jupPubkey, jupPrice, new anchor.BN(currentBlocktime))
      .accounts({
        proposal: proposalAccount.publicKey,
        authority: provider.wallet.publicKey
      })
      .signers([proposalAccount])
      .rpc();

    try {
      await program.methods
        .makeAPrediction(true, new anchor.BN(predictionAmount))
        .accounts({
          proposal: proposalAccount.publicKey,
          user: provider.wallet.publicKey,
        })
        .rpc();

    } catch(err) {
      assert.equal(err.error.errorCode.code, 'ProposalHasExpired');
      assert.equal(err.error.errorMessage, "Proposal has expired and it's not possible to add predictions");
    }
  });

  it('should settle a proposal with a final price', async () => {
    const currentSlot = await program.provider.connection.getSlot();
    const currentBlocktime = await program.provider.connection.getBlockTime(currentSlot);
    
    await program.methods
      .initializeABank()
      .accounts({
        owner: provider.wallet.publicKey
      })
      .rpc();

    const proposalAccount = anchor.web3.Keypair.generate();

    await program.methods
      .createAProposal(jupPubkey, jupPrice, new anchor.BN(currentBlocktime))
      .accounts({
        proposal: proposalAccount.publicKey,
        authority: provider.wallet.publicKey
      })
      .signers([proposalAccount])
      .rpc();

    await program.methods
      .settleAProposal(finalPrice)
      .accounts({
        proposal: proposalAccount.publicKey,
        authority: provider.wallet.publicKey,
      })
      .rpc();

      const proposalData = await program.account.proposal.fetch(proposalAccount.publicKey);

      assert.equal(proposalData.priceOnExpiry.toNumber(), finalPrice.toNumber());
      assert.equal(proposalData.settled, true);
  });

  it('should fail to settle an already executed proposal', async () => {
    const currentSlot = await program.provider.connection.getSlot();
    const currentBlocktime = await program.provider.connection.getBlockTime(currentSlot);
    
    await program.methods
      .initializeABank()
      .accounts({
        owner: provider.wallet.publicKey
      })
      .rpc();

    const proposalAccount = anchor.web3.Keypair.generate();

    await program.methods
      .createAProposal(jupPubkey, jupPrice, new anchor.BN(currentBlocktime))
      .accounts({
        proposal: proposalAccount.publicKey,
        authority: provider.wallet.publicKey
      })
      .signers([proposalAccount])
      .rpc();

    await program.methods
      .settleAProposal(finalPrice)
      .accounts({
        proposal: proposalAccount.publicKey,
        authority: provider.wallet.publicKey,
      })
      .rpc();


    try {
      await program.methods
      .settleAProposal(finalPrice)
      .accounts({
        proposal: proposalAccount.publicKey,
        authority: provider.wallet.publicKey,
      })
      .rpc();
    } catch(err) {
      assert.equal(err.error.errorCode.code, 'ProposalAlreadySettled');
      assert.equal(err.error.errorMessage, "Proposal has already been settled");
    }
  });

  
  it('should reward the winners', async () => {
    const currentSlot = await program.provider.connection.getSlot();
    const currentBlocktime = await program.provider.connection.getBlockTime(currentSlot);
    const keypairs = makeKeypairs(2);

    await program.methods
      .initializeABank()
      .accounts({
        owner: provider.wallet.publicKey
      })
      .rpc();

    await program.methods
      .creditBankBalance(new anchor.BN(5))
      .accounts({
        owner: provider.wallet.publicKey,
      })
      .rpc();

    const proposalAccount = anchor.web3.Keypair.generate();

    await program.methods
      .createAProposal(jupPubkey, jupPrice, new anchor.BN(currentBlocktime + 5))
      .accounts({
        proposal: proposalAccount.publicKey,
        authority: provider.wallet.publicKey
      })
      .signers([proposalAccount])
      .rpc();

    for(let i=0; i< keypairs.length; i++) {
      await airdropSOL(provider, keypairs[i].publicKey, predictionAmount * 2);

      await program.methods
        .makeAPrediction(i == 0, new anchor.BN(predictionAmount))
        .accounts({
          proposal: proposalAccount.publicKey,
          user: keypairs[i].publicKey,
        })
        .signers([keypairs[i]])
        .rpc();
    }

    await setTimeout(6000);

    await program.methods
      .settleAProposal(finalPrice)
      .accounts({
        proposal: proposalAccount.publicKey,
        authority: provider.wallet.publicKey,
      })
      .rpc();

    for(let i = 0; i< keypairs.length; i++) {
      const bankBalance = await provider.connection.getBalance(bankPda);
      const userBalance = await provider.connection.getBalance(keypairs[i].publicKey);

      await program.methods
        .creditTheWinner()
        .accounts({
          proposal: proposalAccount.publicKey,
          user: keypairs[i].publicKey,
          authority: provider.wallet.publicKey,
        })
        .rpc();

        const latestBankBalance = await provider.connection.getBalance(bankPda);
        const latestUserBalance = await provider.connection.getBalance(keypairs[i].publicKey);

        if (i == 0) {
          assert.equal(latestUserBalance, userBalance + 2 * predictionAmount);
          assert.equal(latestBankBalance, bankBalance - 2 * predictionAmount);
        } else {
          assert.equal(latestUserBalance, userBalance);
          assert.equal(latestBankBalance, bankBalance);
        }

        const [predictionPda, bump] = await PublicKey.findProgramAddressSync(
          [
            Buffer.from("prediction"),
            proposalAccount.publicKey.toBuffer(),
            keypairs[i].publicKey.toBuffer(),
          ],
          program.programId
        );

        const predictionAccount = await program.account.userPrediction.fetch(predictionPda);

        assert.ok(predictionAccount.resolved);
      }
  });
});