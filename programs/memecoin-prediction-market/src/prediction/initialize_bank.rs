use crate::Bank;
use anchor_lang::prelude::*;

pub fn initialize_bank(ctx: Context<InitializeBank>) -> Result<()> {
    msg!("Initializing bank from: {:?}", ctx.program_id);
    Ok(())
}

#[derive(Accounts)]
pub struct InitializeBank<'info> {
    #[account(init_if_needed, payer = owner, space = 8, seeds = [b"bank"], bump)]
    pub bank: Account<'info, Bank>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}
