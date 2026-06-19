import Big from "big.js";

export const addThousandSeparator = (numberString: string) => {
  if (!numberString) return "0";
  const parts = String(numberString).split(".");
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const decimalPart = parts[1] ? `.${parts[1]}` : "";
  return integerPart + decimalPart;
};

const isZeroValue = (
  value: string | number | Big.Big | undefined | null
): boolean => {
  if (value === undefined || value === null || value === "") {
    return true;
  }
  try {
    return Big(value).eq(0);
  } catch {
    return true;
  }
};

export const formatNumber = (
  value: string | number | Big.Big | undefined,
  precision: number,
  isSimple?: boolean,
  options?: {
    // resolve the issue of displaying values like $< 0.01
    // it should display as < $0.01
    prefix?: string;
    // when it is less than a certain value
    // 0 should be displayed in the integer part
    // not in the decimal part
    isLTIntegerZero?: boolean;
    // should zeros be added at the end
    isZeroPrecision?: boolean;
    isShort?: boolean;
    isShortUppercase?: boolean;
    round?: Big.RoundingMode;
    isLessPrecision?: boolean;
  }
): any => {
  const {
    prefix = "",
    isLTIntegerZero,
    isZeroPrecision,
    isShort,
    isShortUppercase,
    round = Big.roundHalfUp,
    isLessPrecision = true,
  } = options || {};

  if (isZeroValue(value)) {
    if (isSimple) {
      if (isZeroPrecision) {
        return `${prefix}${Big(0).toFixed(precision, round)}`;
      }
      return `${prefix}0`;
    }
    if (isZeroPrecision) {
      return {
        integer: `${prefix}0`,
        decimal: Big(0).toFixed(precision, round).replace(/^\d/, "")
      };
    }
    return {
      integer: `${prefix}0`,
      decimal: ""
    };
  }

  const bigValue = Big(value as string | number | Big.Big);

  if (isLessPrecision && bigValue.lt(Big(10).pow(-precision))) {
    if (isSimple) {
      return `< ${prefix}${Big(10).pow(-precision).toFixed(precision, round)}`;
    }
    if (isLTIntegerZero) {
      return {
        integer: `< ${prefix}0`,
        decimal: Big(10)
          .pow(-precision)
          .toFixed(precision, round)
          .replace(/^\d/, "")
      };
    }
    return {
      integer: "",
      decimal: `< ${prefix}${Big(10).pow(-precision).toFixed(precision, round)}`
    };
  }

  const finalValue = addThousandSeparator(bigValue.toFixed(precision, round));
  const firstPart = finalValue.split(".")[0];
  let secondPart = finalValue.split(".")[1] || "";
  if (secondPart) {
    secondPart = "." + secondPart;
  }
  if (isSimple) {
    if (isShort) {
      const formatter = (split: number, unit: string): string => {
        const _num = bigValue
          .div(split)
          .toFixed(precision, 0)
          .replace(/(?:\.0*|(\.\d+?)0+)$/, "$1");
        const inter = _num.split(".")?.[0]?.replace(/\d(?=(\d{3})+\b)/g, "$&,");
        const decimal = _num.split(".")?.[1] ?? "";
        return `${prefix}${inter}${decimal ? "." + decimal : ""}${unit}`;
      };
      // septillion
      // if (Big(value).gte(1e24)) {
      //   return formatter(1e24, 't');
      // }
      // sextillion
      // if (Big(value).gte(1e21)) {
      //   return formatter(1e21, 's');
      // }
      // quintillion
      // if (Big(value).gte(1e18)) {
      //   return formatter(1e18, 'r');
      // }
      // quadrillion
      // if (Big(value).gte(1e15)) {
      //   return formatter(1e15, 'q');
      // }
      // trillion
      if (bigValue.gte(1e12)) {
        return formatter(1e12, isShortUppercase ? "T" : "t");
      }
      // billion
      if (bigValue.gte(1e9)) {
        return formatter(1e9, isShortUppercase ? "B" : "b");
      }
      // million
      if (bigValue.gte(1e6)) {
        return formatter(1e6, isShortUppercase ? "M" : "m");
      }
      // thousand
      if (bigValue.gte(1e3)) {
        return formatter(1e3, isShortUppercase ? "K" : "k");
      }
    }
    if (isZeroPrecision) {
      return `${prefix}${firstPart}${secondPart}`;
    }
    return `${prefix}${firstPart}${secondPart.replace(/[.]?0*$/, "")}`;
  }
  if (isZeroPrecision) {
    return {
      integer: `${prefix}${firstPart}`,
      decimal: secondPart
    };
  }
  return {
    integer: `${prefix}${firstPart}`,
    decimal: secondPart.replace(/[.]?0*$/, "")
  };
};

export const removeNumberEndZero = (value: string) => {
  return value.replace("-", "").replace(/\.?0+$/, "");
};

export function formatLongText(
  text?: string,
  front: number = 4,
  ending: number = 2
) {
  if (!text) return text;
  if (text.length <= front + ending) {
    return text;
  }
  return `${text.slice(0, front)}...${text.slice(-ending)}`;
}
