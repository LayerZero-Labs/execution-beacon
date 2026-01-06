use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::{AccountMeta, Instruction};
use anchor_lang::solana_program::program::invoke;

declare_id!("mPe3a6UtyX7gQmjfdsqEWRC2V72RRZM5FQZ1BAH44e1");

#[program]
pub mod execution_beacon {
    use super::*;

    pub fn emit_execution(
        ctx: Context<EmitExecution>,
        quote_id: [u8; 32],
    ) -> Result<()> {
        emit!(ExecutionObserved {
            payer: ctx.accounts.payer.key(),
            quote_id,
        });
        Ok(())
    }
}

#[derive(Accounts)]
pub struct EmitExecution<'info> {
    #[account(signer)]
    pub payer: Signer<'info>,
}

#[event]
pub struct ExecutionObserved {
    pub payer: Pubkey,
    pub quote_id: [u8; 32],
}