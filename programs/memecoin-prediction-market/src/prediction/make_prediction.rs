use crate::{Bank, MyErrors, Proposal, UserPrediction};
use anchor_lang::prelude::*;

pub fn make_prediction(ctx: Context<MakePrediction>, go_long: bool, amount: u64) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    let bank = &mut ctx.accounts.bank;

    if proposal.settled {
        return Err(MyErrors::ProposalAlreadySettled.into());
    }

    let clock: Clock = Clock::get()?;

    if proposal.expiry < clock.unix_timestamp {
        return Err(MyErrors::ProposalHasExpired.into());
    }

    let user_prediction = &mut ctx.accounts.user_prediction;

    user_prediction.authority = *ctx.accounts.user.key;
    user_prediction.go_long = go_long;
    user_prediction.amount = amount;
    user_prediction.resolved = false;

    let lamports_needed = amount;

    anchor_lang::system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: bank.to_account_info(),
            },
        ),
        lamports_needed,
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct MakePrediction<'info> {
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,

    #[account(mut, seeds = [b"bank"], bump)]
    pub bank: Account<'info, Bank>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + UserPrediction::INIT_SPACE,
        seeds = [b"prediction", proposal.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub user_prediction: Account<'info, UserPrediction>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}
