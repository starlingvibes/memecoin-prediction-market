use anchor_lang::prelude::*;
use prediction::*;

pub mod errors;
pub mod prediction;

pub use errors::*;

declare_id!("CBEPKK5C5CYDbCDhsk1TaFLUXVNnw7QnXTc2ueqTgXvy");

#[program]
pub mod memecoin_prediction_market {
    use super::*;

    use prediction::create_proposal;
    use prediction::credit_bank;
    use prediction::credit_winner;
    use prediction::initialize_bank;
    use prediction::make_prediction;
    use prediction::settle_proposal;

    pub fn initialize_a_bank(ctx: Context<InitializeBank>) -> Result<()> {
        return initialize_bank(ctx);
    }

    pub fn credit_bank_balance(ctx: Context<CreditBank>, amount: u64) -> Result<()> {
        return credit_bank(ctx, amount);
    }

    pub fn create_a_proposal(
        ctx: Context<CreateProposal>,
        coin: Pubkey,
        price: u64,
        expiry: i64,
    ) -> Result<()> {
        return create_proposal(ctx, coin, price, expiry);
    }

    pub fn make_a_prediction(
        ctx: Context<MakePrediction>,
        go_long: bool,
        amount: u64,
    ) -> Result<()> {
        return make_prediction(ctx, go_long, amount);
    }

    pub fn settle_a_proposal(ctx: Context<SettleProposal>, price_on_expiry: u64) -> Result<()> {
        return settle_proposal(ctx, price_on_expiry);
    }

    pub fn credit_the_winner(ctx: Context<CreditWinner>) -> Result<()> {
        return credit_winner(ctx);
    }
}

// #[derive(Accounts)]
// pub struct Initialize {}
