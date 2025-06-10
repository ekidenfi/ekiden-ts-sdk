import BigNumber from "bignumber.js";

BigNumber.config({
  EXPONENTIAL_AT: [-100, 100],
  FORMAT: {
    decimalSeparator: ".",
    groupSeparator: "",
    groupSize: 3,
    secondaryGroupSize: 0,
    fractionGroupSeparator: " ",
    fractionGroupSize: 0,
  },
});

type Value = BN | BigNumber.Value;

const bignumberify = (n: any): string | number => {
  if (n && n.toString) {
    const primitive = n.toString();

    if (typeof primitive !== "object") {
      return primitive;
    }
  }

  return n;
};

export class BN extends BigNumber {
  constructor(n: Value, base?: number) {
    super(bignumberify(n), base);
  }

  abs = (): BN => {
    return new BN(super.abs());
  };

  div = (n: Value, base?: number): BN => {
    return new BN(super.div(bignumberify(n), base));
  };

  dividedBy = this.div;

  pow = (n: Value, m?: Value): BN => {
    return new BN(super.pow(bignumberify(n), bignumberify(m)));
  };

  exponentiatedBy = this.pow;

  minus = (n: Value, base?: number): BN => {
    return new BN(super.minus(bignumberify(n), base));
  };

  mod = (n: Value, base?: number): BN => {
    return new BN(super.mod(bignumberify(n), base));
  };

  modulo = this.mod;

  times = (n: Value, base?: number): BN => {
    return new BN(super.times(bignumberify(n), base));
  };

  multipliedBy = this.times;

  negated = (): BN => {
    return new BN(super.negated());
  };

  plus = (n: Value, base?: number): BN => {
    return new BN(super.plus(bignumberify(n), base));
  };

  sqrt = (): BN => {
    return new BN(super.sqrt());
  };

  squareRoot = this.sqrt;

  toDecimalPlaces = (
    decimalPlaces: number,
    roundingMode: BigNumber.RoundingMode = BigNumber.ROUND_DOWN,
  ): BN => {
    return new BN(super.dp(decimalPlaces, roundingMode));
  };

  /**
   * @example
   * new BN('1234.5678').toSignificant(2) === 1,234.56
   * new BN('1234.506').toSignificant(2) === 1,234.5
   * new BN('123.0000').toSignificant(2) === 123
   * new BN('0.001234').toSignificant(2) === 0.0012
   */
  toSignificant = (
    significantDigits: number,
    roundingMode: BigNumber.RoundingMode = BigNumber.ROUND_DOWN,
    formatOption?: BigNumber.Format,
  ): string => {
    const isAboveOneOrZeroDigits = this.gte(1) || significantDigits === 0;

    if (isAboveOneOrZeroDigits) {
      return this.toFormat(
        significantDigits,
        roundingMode,
        formatOption,
      ).replace(/(\.[0-9]*[1-9])0+$|\.0+$/, "$1");
    } else {
      const preciseNumber = super.precision(significantDigits, roundingMode);
      if (formatOption) {
        return preciseNumber.toFormat(formatOption);
      } else {
        return preciseNumber.toString();
      }
    }
  };

  clamp = (min: Value, max: Value): BN => {
    return BN.min(BN.max(this, min), max);
  };

  toBigInt = () => {
    return BigInt(this.toString());
  };

  preventNegative = () => {
    return this.lt(0) ? BN.ZERO : this;
  };

  ifNaNThen = (value: Value) => {
    return this.isNaN() ? new BN(value) : this;
  };

  dividedToIntegerBy = (n: Value, base?: number): BN => {
    return new BN(super.dividedToIntegerBy(bignumberify(n), base));
  };

  static clamp = (number: Value, min: Value, max: Value): BN => {
    return BN.min(BN.max(number, min), max);
  };

  static max = (...n: Value[]): BN => {
    return new BN(super.max(...n.map(bignumberify)));
  };

  static min = (...n: Value[]): BN => {
    return new BN(super.min(...n.map(bignumberify)));
  };

  static sum = (...n: Value[]): BN => {
    if (!n.length) {
      return BN.ZERO;
    }

    return new BN(super.sum(...n.map(bignumberify)));
  };

  static toBN = (p: Promise<number | string | bigint>): Promise<BN> => {
    return p.then((v) => new BN(v.toString()));
  };

  static from = (p: bigint): BN => {
    return new BN(p.toString());
  };

  static parseUnits = (value: Value, decimals = 18): BN => {
    return new BN(10).pow(decimals).times(bignumberify(value));
  };

  static formatUnits = (value: Value, decimals = 18): BN => {
    return new BN(value).div(new BN(10).pow(decimals));
  };

  static percentOf = (value: Value, percent: Value): BN => {
    return new BN(new BN(value).times(percent).div(100).toFixed(0));
  };

  static ratioOf = (valueA: Value, valueB: Value): BN => {
    if (new BN(valueB).isZero()) {
      return BN.ZERO;
    }

    return new BN(valueA).div(valueB).times(100);
  };

  static ZERO = new BN(0);
}
