import { STATUS_CODES } from 'http';

import { Request, Response, NextFunction } from 'express';
import fetch from 'node-fetch';

import { Base, BaseOptions } from './Base';
import { ErrorCode } from './ErrorCode';

export interface GiropayOptions extends BaseOptions { }

export interface GiropayCheckBankstatusParams {
  bic: string;
}

export interface GiropayCheckBankstatusResult {
  rc: ErrorCode;
  msg: string;
  bankcode?: number;
  bic?: string;
  bankname?: string;
  giropay?: 0 | 1;
  giropayid?: 0 | 1;
}

export interface GiropayIssuerBankRequestResult {
  rc: ErrorCode;
  msg: string;
  bankcode?: number;
  issuer?: { [bic: string]: string };
}

export interface InitGiropayPaymentParams {
  merchantTxId: string;
  amount?: number;
  currency?: 'EUR';
  purpose?: string;
  bic: string;
  iban?: string;
  info1Label?: string;
  info1Text?: string;
  info2Label?: string;
  info2Text?: string;
  info3Label?: string;
  info3Text?: string;
  info4Label?: string;
  info4Text?: string;
  info5Label?: string;
  info5Text?: string;
  urlRedirect: string;
  urlNotify: string;
}

export interface InitGiropayPaymentResult {
  rc: ErrorCode;
  msg: string;
  reference?: string;
  redirect?: string;
}

export class Giropay extends Base {

  constructor(options: GiropayOptions) {
    super(options);
  }

  checkBankstatus(params: GiropayCheckBankstatusParams): Promise<GiropayCheckBankstatusResult> {
    const API_URL = 'https://payment.girosolution.de/girocheckout/api/v2/giropay/bankstatus';
    const PROPERTIES = ['bic'];

    params = Object.assign({}, params);

    const form = this.makeForm(params, PROPERTIES);

    return fetch(API_URL, { method: 'POST', body: form })
      .then(res => this.verifyResponse(res))
      .then(body => JSON.parse(body))
      ;
  }

  giropayIssuerBankRequest(): Promise<GiropayIssuerBankRequestResult> {
    const API_URL = 'https://payment.girosolution.de/girocheckout/api/v2/giropay/issuer';
    const PROPERTIES = [];

    const form = this.makeForm({}, PROPERTIES);

    return fetch(API_URL, { method: 'POST', body: form })
      .then(res => this.verifyResponse(res))
      .then(body => JSON.parse(body))
      ;
  }

  initGiropayPayment(params: InitGiropayPaymentParams): Promise<InitGiropayPaymentResult> {
    const API_URL = 'https://payment.girosolution.de/girocheckout/api/v2/transaction/start';
    const PROPERTIES = [
      'merchantTxId',
      'amount',
      'currency',
      'purpose',
      'bic',
      'iban',
      'info1Label',
      'info1Text',
      'info2Label',
      'info2Text',
      'info3Label',
      'info3Text',
      'info4Label',
      'info4Text',
      'info5Label',
      'info5Text',
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
      'gcResultAVS',
      'gcObvName',
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
