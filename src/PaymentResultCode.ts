export enum PaymentResultCode {
  TransactionSuccessful = 4000,
  // giropay
  BankOffline = 4001,
  OnlineBankingAccountInvalid = 4002,
  ZahlungsaugangUnbekannt = 4500,
  // Lastschrift
  InvalidBankAccount = 4051,
  // Kreditkarte
  IssuingCountryInvalidOrUnknown = 4101,
  ThreeDSecureOrMasterCardSecureCodeAuthorizationFailed = 4102,
  ValidationDateOfCardExceeded = 4103,
  InvalidOrUnknownCardType = 4104,
  LimitedUseCard = 4105,
  InvalidPseudoCardnumber = 4106,
  CardStolenSuspiciousOrMarkedToMoveIn = 4107,
  // PayPal
  InvalidPayPalToken = 4151,
  PostProcessingNecessaryAtPayPal = 4152,
  ChangePayPalPaymentMethod = 4153,
  PayPalPaymentIsNotCompleted = 4154,
  // Allgemein
  TimeoutNoUserInput = 4501,
  UserAborted = 4502,
  DuplicateTransaction = 4503,
  UspicionOfManipulationOrPaymentMethodTemporarilyBlocked = 4504,
  PaymentMethodBlockedOrRejected = 4505,
  InvalidBlueCodeBarcode = 4506,
  TransactionRejected = 4900,
}


