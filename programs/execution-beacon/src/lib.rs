use anchor_lang::prelude::*;

declare_id!("BRoueHsu3h2SfEse9ohXipm1R9uRGRSe3zPYsAT8RySr");

#[program]
pub mod execution_beacon {
    use super::*;

    pub fn emit_execution(
        ctx: Context<EmitExecution>,
        quote_id: [u8; 32],
    ) -> Result<()> {
        emit_cpi!(ExecutionObserved {
            payer: ctx.accounts.payer.key(),
            quote_id,
        });
        Ok(())
    }
}

#[event_cpi]
#[derive(Accounts)]
pub struct EmitExecution<'info> {
    pub payer: Signer<'info>,
}

#[event]
pub struct ExecutionObserved {
    pub payer: Pubkey,
    pub quote_id: [u8; 32],
}