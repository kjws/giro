import { STATUS_CODES } from 'http';

import { Request, Response, NextFunction } from 'express';
import fetch from 'node-fetch';

import { Base, BaseOptions } from './Base';
import { ErrorCode } from './ErrorCode';

export interface EpsOptions extends BaseOptions { }

export interface CheckBankstatusParams {
  bic: string;
}

export interface CheckBankstatusResult {
  rc: ErrorCode;
  msg: string;
  bankcode?: number;
  bic?: string;
  bankname?: string;
  eps?: 0 | 1;
}

export interface EpsIssuerBankRequestResult {
  rc: ErrorCode;
  msg: string;
  issuer?: { [bic: string]: string };
}

export interface InitEpsPaymentParams {
  merchantTxId: string;
  amount: number;
  currency: 'EUR';
  purpose: string;
  bic: string;
  urlRedirect: string;
  urlNotify: string;
}

export interface InitEpsPaymentResult {
  rc: ErrorCode;
  msg: string;
  reference?: string;
  redirect?: string;
}

export class Eps extends Base {

  constructor(options: EpsOptions) {
    super(options);
  }

  checkBankstatus(params: CheckBankstatusParams): Promise<CheckBankstatusResult> {
    const API_URL = 'https://payment.girosolution.de/girocheckout/api/v2/eps/bankstatus';
    const PROPERTIES = ['bic'];

    params = Object.assign({}, params);

    const form = this.makeForm(params, PROPERTIES);

    return fetch(API_URL, { method: 'POST', body: form })
      .then(res => this.verifyResponse(res))
      .then(body => JSON.parse(body))
      ;
  }

  epsIssuerBankRequest(): Promise<EpsIssuerBankRequestResult> {
    const API_URL = 'https://payment.girosolution.de/girocheckout/api/v2/eps/issuer';
    const PROPERTIES = [];

    const form = this.makeForm({}, PROPERTIES);

    return fetch(API_URL, { method: 'POST', body: form })
      .then(res => this.verifyResponse(res))
      .then(body => JSON.parse(body))
      ;
  }

  initEpsPayment(params: InitEpsPaymentParams): Promise<InitEpsPaymentResult> {
    const API_URL = 'https://payment.girosolution.de/girocheckout/api/v2/transaction/start';
    const PROPERTIES = [
      'merchantTxId',
      'amount',
      'currency',
      'purpose',
      'bic',
      'urlRedirect',
      'urlNotify',
    ];

    // Clone params
    params = Object.assign({}, params);
    // use smallest unit of currency
    params.amount = this.encodeAmount(params.amount, params.currency);

    const form = this.makeForm(params, PROPERTIES);

    return fetch(API_URL, { method: 'POST', body: form })
      .then(res => this.verifyResponse(res))
      .then(body => JSON.parse(body))
      ;
  }

  verifyMiddlewareFactory() {
    const HASH_KEY = 'gcHash';
    const PROPERTIES = [
      'gcReference',
      'gcMerchantTxId',
      'gcBackendTxId',
      'gcAmount',
      'gcCurrency',
      'gcResultPayment',
    ];

    return (req: Request, res: Response, next: NextFunction) => {
      const { gcAmount, gcCurrency } = req.query;

      if (this.verifyByObj(req.query, PROPERTIES, req.query[HASH_KEY])) {
        if (gcCurrency) {
          req.query.gcAmount = this.decodeAmount(gcAmount, gcCurrency);
        }
        return next();
      }
      res.status(400).end(`400 ${STATUS_CODES[400]}`);
    };
  }
}
