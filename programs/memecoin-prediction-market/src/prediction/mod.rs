use anchor_lang::prelude::*;
// use errors::*;

pub mod create_proposal;
pub mod credit_bank;
pub mod credit_winner;
pub mod initialize_bank;
pub mod make_prediction;
pub mod settle_proposal;

pub use create_proposal::*;
pub use credit_bank::*;
pub use credit_winner::*;
pub use initialize_bank::*;
pub use make_prediction::*;
pub use settle_proposal::*;

#[account]
#[derive(InitSpace)]
pub struct Proposal {
    pub authority: Pubkey,
    pub coin: Pubkey, // address of meme coin
    pub price: u64,
    pub price_on_expiry: u64,
    pub expiry: i64,
    pub settled: bool,
}

#[account]
pub struct Bank {}

#[account]
#[derive(InitSpace)]
pub struct UserPrediction {
    pub authority: Pubkey,
    pub go_long: bool,
    pub amount: u64,
    pub resolved: bool,
}
