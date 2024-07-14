use crate::Bank;
use anchor_lang::prelude::*;

pub fn credit_bank(ctx: Context<CreditBank>, amount: u64) -> Result<()> {
    // convert sol to lamports
    let lamports_needed = amount * 1_000_000_000;

    anchor_lang::system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.owner.to_account_info(),
                to: ctx.accounts.bank.to_account_info(),
            },
        ),
        lamports_needed,
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct CreditBank<'info> {
    #[account(mut, seeds = [b"bank"], bump)]
    pub bank: Account<'info, Bank>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}
