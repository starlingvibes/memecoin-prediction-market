use crate::Proposal;
use anchor_lang::prelude::*;

pub fn create_proposal(
    ctx: Context<CreateProposal>,
    coin: Pubkey,
    price: u64,
    expiry: i64,
) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;

    proposal.authority = *ctx.accounts.authority.key;
    proposal.coin = coin;
    proposal.price = price;
    proposal.price_on_expiry = 0;
    proposal.expiry = expiry;
    proposal.settled = false;

    Ok(())
}

#[derive(Accounts)]
pub struct CreateProposal<'info> {
    #[account(init, payer = authority, space = 8 + Proposal::INIT_SPACE)]
    pub proposal: Account<'info, Proposal>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}
