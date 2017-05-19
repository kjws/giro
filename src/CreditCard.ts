import { STATUS_CODES } from 'http';

import { Request, Response, NextFunction } from 'express';
import fetch from 'node-fetch';

import { Base, BaseOptions } from './Base';
import { ErrorCode } from './ErrorCode';
import { PaymentResultCode } from './PaymentResultCode';

export interface CreditCardOptions extends BaseOptions { }

export interface CreatePaymentParams {
  merchantTxId: string;
  amount: number;
  currency: 'EUR';
  purpose: string;
  type?: 'SALE' | 'AUTH';
  locale?: 'de' | 'en' | 'es' | 'fr' | 'it' | 'ja' | 'pt' | 'nl' | 'cs' | 'sv' | 'da' | 'pl' | 'spde' | 'spen' | 'de_DE_stadtn';
  mobile?: 0 | 1;
  pkn?: string;
  recurring?: 0 | 1;
  urlRedirect: string;
  urlNotify: string;
}

export interface CreatePaymentResult {
  rc: ErrorCode;
  msg: string;
  reference?: string;
  redirect?: string;
}

export interface RefundParams {
  merchantTxId: string;
  amount: number;
  currency: string;
  reference: string;
}

export interface RefundResult {
  rc: ErrorCode;
  msg: string;
  reference: string;
  referenceParent: string;
  merchantTxId: string;
  backendTxId: string;
  amount: number;
  currency: string;
  resultPayment: PaymentResultCode | ErrorCode;
}

export interface VoidParams {
  merchantTxId: string;
  reference: string;
}

export interface VoidResult {
  rc: ErrorCode;
  msg: string;
  reference: string;
  referenceParent: string;
  merchantTxId: string;
  backendTxId: string;
  amount: number;
  currency: string;
  resultPayment: PaymentResultCode | ErrorCode;
}

export class CreditCard extends Base {

  constructor(options: CreditCardOptions) {
    super(options);
  }

  createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
    const API_URL = 'https://payment.girosolution.de/girocheckout/api/v2/transaction/start';
    const PROPERTIES = [
      'merchantTxId',
      'amount',
      'currency',
      'purpose',
      'type',
      'locale',
      'mobile',
      'pkn',
      'recurring',
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

  refund(params: RefundParams): Promise<RefundResult> {
    const API_URL = 'https://payment.girosolution.de/girocheckout/api/v2/transaction/refund';
    const PROPERTIES = [
      'merchantTxId',
      'amount',
      'currency',
      'reference',
    ];

    // Clone params
    params = Object.assign({}, params);
    // use smallest unit of currency
    params.amount = this.encodeAmount(params.amount, params.currency);

    const form = this.makeForm(params, PROPERTIES);

    return fetch(API_URL, { method: 'POST', body: form })
      .then(res => this.verifyResponse(res))
      .then(body => JSON.parse(body))
      .then(json => {
        if (json.currency) {
          json.amount = this.decodeAmount(json.amount, json.currency);
        }
        return json;
      })
      ;
  }

  void(params: VoidParams): Promise<VoidResult> {
    const API_URL = 'https://payment.girosolution.de/girocheckout/api/v2/transaction/void';
    const PROPERTIES = [
      'merchantTxId',
      'reference',
    ];

    // Clone params
    params = Object.assign({}, params);

    const form = this.makeForm(params, PROPERTIES);

    return fetch(API_URL, { method: 'POST', body: form })
      .then(res => this.verifyResponse(res))
      .then(body => JSON.parse(body))
      .then(json => {
        if (json.currency) {
          json.amount = this.decodeAmount(json.amount, json.currency);
        }
        return json;
      })
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
