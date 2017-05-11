import * as crypto from 'crypto';

import * as FormData from 'form-data';
import { Response } from 'node-fetch';

export interface BaseOptions {
  merchantId: number;
  projectId: number;
  projectPassphrase: string;
}

const CurrencyUnit = {
  EUR: 100,
};

const Locale = {
  'de': true,
  'en': true,
  'es': true,
  'fr': true,
  'it': true,
  'ja': true,
  'pt': true,
  'nl': true,
  'cs': true,
  'sv': true,
  'da': true,
  'pl': true,
  'spde': true,
  'spen': true,
  'de_DE_stadtn': true,
};

export class Base {
  private _merchantId: number;
  private _projectId: number;
  private _projectPassphrase: string;

  get merchantId(): number { return this._merchantId; }
  get projectId(): number { return this._projectId; }
  get projectPassphrase(): string { return this._projectPassphrase; }

  constructor(options: BaseOptions) {
    this._merchantId = options.merchantId;
    this._projectId = options.projectId;
    this._projectPassphrase = options.projectPassphrase;
  }

  makeForm(obj, properties: string[]) {
    const form = new FormData();

    form.append('merchantId', this.merchantId);
    form.append('projectId', this.projectId);

    properties.forEach(p => {
      if (obj[p] === void 0) { return; }
      form.append(p, obj[p]);
    });

    form.append('hash', this.encodeHashByObj({
      merchantId: this.merchantId,
      projectId: this.projectId,
      ...obj
    }, ['merchantId', 'projectId', ...properties]));

    return form;
  }

  encodeAmount(amount: number, currency: string) {
    const unit = CurrencyUnit[currency];
    if (!unit) { throw new Error('Unsupported currency'); }
    amount *= unit;
    if (amount % 1 !== 0) { throw new Error('Invalid amount'); }
    return amount;
  }

  decodeAmount(amount: number | string, currency: string) {
    const unit = CurrencyUnit[currency];
    if (!unit) { throw new Error('Unsupported currency'); }

    if (typeof amount === 'string') {
      amount = parseInt(amount, 10);
    }

    amount /= unit;
    return amount;
  }

  supportedLocale(locale) {
    return Locale[locale] ? locale : 'en';
  }

  verify(data, hash) {
    return this.encodeHash(data) === hash;
  }

  verifyByObj(obj, properties: string[], hash) {
    return this.encodeHashByObj(obj, properties) === hash;
  }

  verifyResponse(res: Response) {
    return res.text()
      .then(text => {
        const hash = res.headers.get('hash');
        if (this.verify(text, hash)) { return text; }
        throw new Error('Invalid Response Hash');
      });
  }

  concatValue(obj, properties: string[]) {
    let str = '';
    properties.forEach(p => {
      if (obj[p] === void 0) { return; }
      str += obj[p];
    });
    return str;
  }

  encodeHash(data) {
    const hmac = crypto.createHmac('md5', this.projectPassphrase);
    hmac.update(data);
    return hmac.digest('hex');
  }

  encodeHashByObj(obj, properties: string[]) {
    return this.encodeHash(this.concatValue(obj, properties));
  }
}
