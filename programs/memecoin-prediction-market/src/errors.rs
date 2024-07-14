use anchor_lang::error_code;

#[error_code]
pub enum MyErrors {
    #[msg("Proposal has expired and it's not possible to add predictions")]
    ProposalHasExpired,
    #[msg("Proposal has not expired yet")]
    ProposalNotExpired,
    #[msg("Proposal has already been settled")]
    ProposalAlreadySettled,
    #[msg("Proposal has not been settled yet")]
    ProposalNotSettled,
    #[msg("Prediction has already been resolved")]
    PredictionAlreadyResolved,
}
