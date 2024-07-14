use crate::{MyErrors, Proposal};
use anchor_lang::prelude::*;

// manual settlement
pub fn settle_proposal(ctx: Context<SettleProposal>, price_on_expiry: u64) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;

    if proposal.settled {
        return Err(MyErrors::ProposalAlreadySettled.into());
    }

    let clock: Clock = Clock::get()?;

    if clock.unix_timestamp < proposal.expiry {
        return Err(MyErrors::ProposalNotExpired.into());
    }

    proposal.settled = true;
    proposal.price_on_expiry = price_on_expiry;

    Ok(())
}

#[derive(Accounts)]
pub struct SettleProposal<'info> {
    #[account(mut, has_one = authority)]
    pub proposal: Account<'info, Proposal>,

    #[account(mut)]
    pub authority: Signer<'info>,
}
