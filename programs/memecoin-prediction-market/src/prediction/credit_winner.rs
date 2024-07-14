use crate::{Bank, MyErrors, Proposal, UserPrediction};
use anchor_lang::prelude::*;

pub fn credit_winner(ctx: Context<CreditWinner>) -> Result<()> {
    let proposal = &ctx.accounts.proposal;

    if !proposal.settled {
        return Err(MyErrors::ProposalNotSettled.into());
    }

    let user_prediction = &mut ctx.accounts.user_prediction;

    if user_prediction.resolved {
        return Err(MyErrors::PredictionAlreadyResolved.into());
    }

    let vault = &mut ctx.accounts.bank;

    if (user_prediction.go_long && proposal.price_on_expiry > proposal.price)
        || (!user_prediction.go_long && proposal.price_on_expiry < proposal.price)
    {
        let payout = user_prediction.amount * 2;

        **vault.to_account_info().try_borrow_mut_lamports()? -= payout;
        **ctx
            .accounts
            .user
            .to_account_info()
            .try_borrow_mut_lamports()? += payout;
    }

    user_prediction.resolved = true;

    Ok(())
}

#[derive(Accounts)]
pub struct CreditWinner<'info> {
    #[account(mut, has_one = authority)]
    pub proposal: Account<'info, Proposal>,

    #[account(
        mut,
        seeds = [b"bank"], 
        bump
    )]
    pub bank: Account<'info, Bank>,

    #[account(
        mut,
        seeds = [
            b"prediction", 
            proposal.key().as_ref(),
            user.key().as_ref(),
        ],
        bump,
    )]
    pub user_prediction: Account<'info, UserPrediction>,

    /// CHECK: abeg
    #[account(mut, address = user_prediction.authority)]
    pub user: UncheckedAccount<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,
}
