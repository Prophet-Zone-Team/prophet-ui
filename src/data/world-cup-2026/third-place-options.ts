export type ThirdPlaceWinnerSeed = '1A' | '1B' | '1D' | '1E' | '1G' | '1I' | '1K' | '1L';

export interface ThirdPlaceAllocationOption {
  option: number;
  qualifiedThirdGroups: string[];
  assignments: Record<ThirdPlaceWinnerSeed, string>;
}

/**
 * 2026 FIFA World Cup Annexe C -
 * combinations for the eight best third-placed teams.
 *
 * Data columns:
 * - qualifiedThirdGroups: the eight groups whose third-placed teams advance
 * - assignments: which third-placed seed faces each group winner in the Round of 32
 */
export const THIRD_PLACE_ALLOCATION_OPTIONS: ThirdPlaceAllocationOption[] = [
  {
    "option": 1,
    "qualifiedThirdGroups": [
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3I",
      "1E": "3F",
      "1G": "3H",
      "1I": "3G",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 2,
    "qualifiedThirdGroups": [
      "D",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3I",
      "1E": "3D",
      "1G": "3J",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 3,
    "qualifiedThirdGroups": [
      "D",
      "E",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3I",
      "1E": "3D",
      "1G": "3H",
      "1I": "3G",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 4,
    "qualifiedThirdGroups": [
      "D",
      "E",
      "F",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3I",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 5,
    "qualifiedThirdGroups": [
      "D",
      "E",
      "F",
      "G",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3I",
      "1E": "3D",
      "1G": "3J",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 6,
    "qualifiedThirdGroups": [
      "D",
      "E",
      "F",
      "G",
      "H",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3J",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 7,
    "qualifiedThirdGroups": [
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3I",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 8,
    "qualifiedThirdGroups": [
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3J",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 9,
    "qualifiedThirdGroups": [
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3J",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 10,
    "qualifiedThirdGroups": [
      "C",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3I",
      "1E": "3C",
      "1G": "3J",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 11,
    "qualifiedThirdGroups": [
      "C",
      "E",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3I",
      "1E": "3C",
      "1G": "3H",
      "1I": "3G",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 12,
    "qualifiedThirdGroups": [
      "C",
      "E",
      "F",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3I",
      "1E": "3C",
      "1G": "3H",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 13,
    "qualifiedThirdGroups": [
      "C",
      "E",
      "F",
      "G",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3I",
      "1E": "3C",
      "1G": "3J",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 14,
    "qualifiedThirdGroups": [
      "C",
      "E",
      "F",
      "G",
      "H",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3J",
      "1E": "3C",
      "1G": "3H",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 15,
    "qualifiedThirdGroups": [
      "C",
      "E",
      "F",
      "G",
      "H",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3I",
      "1E": "3C",
      "1G": "3H",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 16,
    "qualifiedThirdGroups": [
      "C",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3J",
      "1E": "3C",
      "1G": "3H",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 17,
    "qualifiedThirdGroups": [
      "C",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3J",
      "1E": "3C",
      "1G": "3H",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 18,
    "qualifiedThirdGroups": [
      "C",
      "D",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3I",
      "1E": "3C",
      "1G": "3J",
      "1I": "3D",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 19,
    "qualifiedThirdGroups": [
      "C",
      "D",
      "F",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3J",
      "1D": "3I",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 20,
    "qualifiedThirdGroups": [
      "C",
      "D",
      "F",
      "G",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3I",
      "1E": "3D",
      "1G": "3J",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 21,
    "qualifiedThirdGroups": [
      "C",
      "D",
      "F",
      "G",
      "H",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3J",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 22,
    "qualifiedThirdGroups": [
      "C",
      "D",
      "F",
      "G",
      "H",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3I",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 23,
    "qualifiedThirdGroups": [
      "C",
      "D",
      "F",
      "G",
      "H",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3J",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 24,
    "qualifiedThirdGroups": [
      "C",
      "D",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3J",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 25,
    "qualifiedThirdGroups": [
      "C",
      "D",
      "E",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3I",
      "1E": "3C",
      "1G": "3H",
      "1I": "3D",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 26,
    "qualifiedThirdGroups": [
      "C",
      "D",
      "E",
      "G",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3I",
      "1E": "3C",
      "1G": "3J",
      "1I": "3D",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 27,
    "qualifiedThirdGroups": [
      "C",
      "D",
      "E",
      "G",
      "H",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3J",
      "1E": "3C",
      "1G": "3H",
      "1I": "3D",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 28,
    "qualifiedThirdGroups": [
      "C",
      "D",
      "E",
      "G",
      "H",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3I",
      "1E": "3C",
      "1G": "3H",
      "1I": "3D",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 29,
    "qualifiedThirdGroups": [
      "C",
      "D",
      "E",
      "G",
      "H",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3J",
      "1E": "3C",
      "1G": "3H",
      "1I": "3D",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 30,
    "qualifiedThirdGroups": [
      "C",
      "D",
      "E",
      "G",
      "H",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3J",
      "1E": "3C",
      "1G": "3H",
      "1I": "3D",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 31,
    "qualifiedThirdGroups": [
      "C",
      "D",
      "E",
      "F",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3J",
      "1D": "3E",
      "1E": "3D",
      "1G": "3I",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 32,
    "qualifiedThirdGroups": [
      "C",
      "D",
      "E",
      "F",
      "H",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3J",
      "1D": "3E",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 33,
    "qualifiedThirdGroups": [
      "C",
      "D",
      "E",
      "F",
      "H",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3E",
      "1D": "3I",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 34,
    "qualifiedThirdGroups": [
      "C",
      "D",
      "E",
      "F",
      "H",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3J",
      "1D": "3E",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 35,
    "qualifiedThirdGroups": [
      "C",
      "D",
      "E",
      "F",
      "H",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3J",
      "1D": "3E",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 36,
    "qualifiedThirdGroups": [
      "C",
      "D",
      "E",
      "F",
      "G",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3E",
      "1E": "3D",
      "1G": "3J",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 37,
    "qualifiedThirdGroups": [
      "C",
      "D",
      "E",
      "F",
      "G",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3E",
      "1E": "3D",
      "1G": "3I",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 38,
    "qualifiedThirdGroups": [
      "C",
      "D",
      "E",
      "F",
      "G",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3E",
      "1E": "3D",
      "1G": "3J",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 39,
    "qualifiedThirdGroups": [
      "C",
      "D",
      "E",
      "F",
      "G",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3E",
      "1E": "3D",
      "1G": "3J",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 40,
    "qualifiedThirdGroups": [
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3E",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 41,
    "qualifiedThirdGroups": [
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3J",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3L",
      "1L": "3E"
    }
  },
  {
    "option": 42,
    "qualifiedThirdGroups": [
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3J",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3E",
      "1L": "3K"
    }
  },
  {
    "option": 43,
    "qualifiedThirdGroups": [
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3E",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 44,
    "qualifiedThirdGroups": [
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "K"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3E",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 45,
    "qualifiedThirdGroups": [
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3J",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3E",
      "1L": "3I"
    }
  },
  {
    "option": 46,
    "qualifiedThirdGroups": [
      "B",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3F",
      "1G": "3I",
      "1I": "3G",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 47,
    "qualifiedThirdGroups": [
      "B",
      "E",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3I",
      "1E": "3B",
      "1G": "3H",
      "1I": "3G",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 48,
    "qualifiedThirdGroups": [
      "B",
      "E",
      "F",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3F",
      "1G": "3I",
      "1I": "3H",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 49,
    "qualifiedThirdGroups": [
      "B",
      "E",
      "F",
      "G",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3F",
      "1G": "3I",
      "1I": "3G",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 50,
    "qualifiedThirdGroups": [
      "B",
      "E",
      "F",
      "G",
      "H",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3F",
      "1G": "3H",
      "1I": "3G",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 51,
    "qualifiedThirdGroups": [
      "B",
      "E",
      "F",
      "G",
      "H",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3F",
      "1G": "3I",
      "1I": "3H",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 52,
    "qualifiedThirdGroups": [
      "B",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3F",
      "1G": "3H",
      "1I": "3G",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 53,
    "qualifiedThirdGroups": [
      "B",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3F",
      "1G": "3H",
      "1I": "3G",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 54,
    "qualifiedThirdGroups": [
      "B",
      "D",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3I",
      "1I": "3G",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 55,
    "qualifiedThirdGroups": [
      "B",
      "D",
      "F",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3I",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 56,
    "qualifiedThirdGroups": [
      "B",
      "D",
      "F",
      "G",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3I",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3J",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 57,
    "qualifiedThirdGroups": [
      "B",
      "D",
      "F",
      "G",
      "H",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3J",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 58,
    "qualifiedThirdGroups": [
      "B",
      "D",
      "F",
      "G",
      "H",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3I",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 59,
    "qualifiedThirdGroups": [
      "B",
      "D",
      "F",
      "G",
      "H",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3J",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 60,
    "qualifiedThirdGroups": [
      "B",
      "D",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3J",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 61,
    "qualifiedThirdGroups": [
      "B",
      "D",
      "E",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3I",
      "1I": "3H",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 62,
    "qualifiedThirdGroups": [
      "B",
      "D",
      "E",
      "G",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3I",
      "1I": "3G",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 63,
    "qualifiedThirdGroups": [
      "B",
      "D",
      "E",
      "G",
      "H",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3H",
      "1I": "3G",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 64,
    "qualifiedThirdGroups": [
      "B",
      "D",
      "E",
      "G",
      "H",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3I",
      "1I": "3H",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 65,
    "qualifiedThirdGroups": [
      "B",
      "D",
      "E",
      "G",
      "H",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3H",
      "1I": "3G",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 66,
    "qualifiedThirdGroups": [
      "B",
      "D",
      "E",
      "G",
      "H",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3H",
      "1I": "3G",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 67,
    "qualifiedThirdGroups": [
      "B",
      "D",
      "E",
      "F",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3I",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 68,
    "qualifiedThirdGroups": [
      "B",
      "D",
      "E",
      "F",
      "H",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 69,
    "qualifiedThirdGroups": [
      "B",
      "D",
      "E",
      "F",
      "H",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3I",
      "1D": "3B",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 70,
    "qualifiedThirdGroups": [
      "B",
      "D",
      "E",
      "F",
      "H",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 71,
    "qualifiedThirdGroups": [
      "B",
      "D",
      "E",
      "F",
      "H",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 72,
    "qualifiedThirdGroups": [
      "B",
      "D",
      "E",
      "F",
      "G",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3J",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 73,
    "qualifiedThirdGroups": [
      "B",
      "D",
      "E",
      "F",
      "G",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3I",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 74,
    "qualifiedThirdGroups": [
      "B",
      "D",
      "E",
      "F",
      "G",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3J",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 75,
    "qualifiedThirdGroups": [
      "B",
      "D",
      "E",
      "F",
      "G",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3J",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 76,
    "qualifiedThirdGroups": [
      "B",
      "D",
      "E",
      "F",
      "G",
      "H",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 77,
    "qualifiedThirdGroups": [
      "B",
      "D",
      "E",
      "F",
      "G",
      "H",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3J",
      "1I": "3F",
      "1K": "3L",
      "1L": "3E"
    }
  },
  {
    "option": 78,
    "qualifiedThirdGroups": [
      "B",
      "D",
      "E",
      "F",
      "G",
      "H",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3J",
      "1I": "3F",
      "1K": "3E",
      "1L": "3K"
    }
  },
  {
    "option": 79,
    "qualifiedThirdGroups": [
      "B",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 80,
    "qualifiedThirdGroups": [
      "B",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "K"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 81,
    "qualifiedThirdGroups": [
      "B",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3J",
      "1I": "3F",
      "1K": "3E",
      "1L": "3I"
    }
  },
  {
    "option": 82,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3I",
      "1I": "3G",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 83,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "F",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3I",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 84,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "F",
      "G",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3I",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3J",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 85,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "F",
      "G",
      "H",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3J",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 86,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "F",
      "G",
      "H",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3I",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 87,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "F",
      "G",
      "H",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3J",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 88,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3J",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 89,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "E",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3I",
      "1I": "3H",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 90,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "E",
      "G",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3I",
      "1I": "3G",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 91,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "E",
      "G",
      "H",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3H",
      "1I": "3G",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 92,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "E",
      "G",
      "H",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3I",
      "1I": "3H",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 93,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "E",
      "G",
      "H",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3H",
      "1I": "3G",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 94,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "E",
      "G",
      "H",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3H",
      "1I": "3G",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 95,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "E",
      "F",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3I",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 96,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "E",
      "F",
      "H",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3H",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 97,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "E",
      "F",
      "H",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3I",
      "1D": "3B",
      "1E": "3C",
      "1G": "3H",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 98,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "E",
      "F",
      "H",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3H",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 99,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "E",
      "F",
      "H",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3H",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 100,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "E",
      "F",
      "G",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3J",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 101,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "E",
      "F",
      "G",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3I",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 102,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "E",
      "F",
      "G",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3J",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 103,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "E",
      "F",
      "G",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3J",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 104,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "E",
      "F",
      "G",
      "H",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3H",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 105,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "E",
      "F",
      "G",
      "H",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3J",
      "1I": "3F",
      "1K": "3L",
      "1L": "3E"
    }
  },
  {
    "option": 106,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "E",
      "F",
      "G",
      "H",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3J",
      "1I": "3F",
      "1K": "3E",
      "1L": "3K"
    }
  },
  {
    "option": 107,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "E",
      "F",
      "G",
      "H",
      "I",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3H",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 108,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "E",
      "F",
      "G",
      "H",
      "I",
      "K"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3H",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 109,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3J",
      "1I": "3F",
      "1K": "3E",
      "1L": "3I"
    }
  },
  {
    "option": 110,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3I",
      "1I": "3D",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 111,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "G",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3I",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3J",
      "1I": "3D",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 112,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "G",
      "H",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3J",
      "1I": "3D",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 113,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "G",
      "H",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3I",
      "1I": "3D",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 114,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "G",
      "H",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3J",
      "1I": "3D",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 115,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "G",
      "H",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3J",
      "1I": "3D",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 116,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "F",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3I",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 117,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "F",
      "H",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 118,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "F",
      "H",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3I",
      "1D": "3B",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 119,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "F",
      "H",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 120,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "F",
      "H",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 121,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "F",
      "G",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3J",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 122,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "F",
      "G",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3I",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 123,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "F",
      "G",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3J",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 124,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "F",
      "G",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3J",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 125,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "F",
      "G",
      "H",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 126,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "F",
      "G",
      "H",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3L",
      "1L": "3J"
    }
  },
  {
    "option": 127,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "F",
      "G",
      "H",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3J",
      "1I": "3F",
      "1K": "3D",
      "1L": "3K"
    }
  },
  {
    "option": 128,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "F",
      "G",
      "H",
      "I",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 129,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "F",
      "G",
      "H",
      "I",
      "K"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 130,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "F",
      "G",
      "H",
      "I",
      "J"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3J",
      "1I": "3F",
      "1K": "3D",
      "1L": "3I"
    }
  },
  {
    "option": 131,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "E",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3I",
      "1I": "3D",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 132,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "E",
      "H",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3H",
      "1I": "3D",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 133,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "E",
      "H",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3I",
      "1D": "3B",
      "1E": "3C",
      "1G": "3H",
      "1I": "3D",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 134,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "E",
      "H",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3H",
      "1I": "3D",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 135,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "E",
      "H",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3H",
      "1I": "3D",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 136,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "E",
      "G",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3J",
      "1I": "3D",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 137,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "E",
      "G",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3I",
      "1I": "3D",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 138,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "E",
      "G",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3J",
      "1I": "3D",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 139,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "E",
      "G",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3J",
      "1I": "3D",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 140,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "E",
      "G",
      "H",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3H",
      "1I": "3D",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 141,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "E",
      "G",
      "H",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3J",
      "1I": "3D",
      "1K": "3L",
      "1L": "3E"
    }
  },
  {
    "option": 142,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "E",
      "G",
      "H",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3J",
      "1I": "3D",
      "1K": "3E",
      "1L": "3K"
    }
  },
  {
    "option": 143,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "E",
      "G",
      "H",
      "I",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3H",
      "1I": "3D",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 144,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "E",
      "G",
      "H",
      "I",
      "K"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3H",
      "1I": "3D",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 145,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "E",
      "G",
      "H",
      "I",
      "J"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3J",
      "1I": "3D",
      "1K": "3E",
      "1L": "3I"
    }
  },
  {
    "option": 146,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "E",
      "F",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3E",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 147,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "E",
      "F",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3E",
      "1D": "3B",
      "1E": "3D",
      "1G": "3I",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 148,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "E",
      "F",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3E",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 149,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "E",
      "F",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3E",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 150,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "E",
      "F",
      "H",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3E",
      "1D": "3B",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 151,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "E",
      "F",
      "H",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3L",
      "1L": "3E"
    }
  },
  {
    "option": 152,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "E",
      "F",
      "H",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3E",
      "1L": "3K"
    }
  },
  {
    "option": 153,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "E",
      "F",
      "H",
      "I",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3E",
      "1D": "3B",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 154,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "E",
      "F",
      "H",
      "I",
      "K"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3E",
      "1D": "3B",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 155,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "E",
      "F",
      "H",
      "I",
      "J"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3E",
      "1L": "3I"
    }
  },
  {
    "option": 156,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3E",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 157,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3J",
      "1I": "3F",
      "1K": "3L",
      "1L": "3E"
    }
  },
  {
    "option": 158,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3J",
      "1I": "3F",
      "1K": "3E",
      "1L": "3K"
    }
  },
  {
    "option": 159,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "I",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3E",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 160,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "I",
      "K"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3E",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 161,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "I",
      "J"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3J",
      "1I": "3F",
      "1K": "3E",
      "1L": "3I"
    }
  },
  {
    "option": 162,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3L",
      "1L": "3E"
    }
  },
  {
    "option": 163,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "K"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3E",
      "1L": "3K"
    }
  },
  {
    "option": 164,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "J"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3J",
      "1I": "3F",
      "1K": "3D",
      "1L": "3E"
    }
  },
  {
    "option": 165,
    "qualifiedThirdGroups": [
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3H",
      "1I": "3F",
      "1K": "3E",
      "1L": "3I"
    }
  },
  {
    "option": 166,
    "qualifiedThirdGroups": [
      "A",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3I",
      "1E": "3F",
      "1G": "3A",
      "1I": "3G",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 167,
    "qualifiedThirdGroups": [
      "A",
      "E",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3I",
      "1E": "3A",
      "1G": "3H",
      "1I": "3G",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 168,
    "qualifiedThirdGroups": [
      "A",
      "E",
      "F",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3I",
      "1E": "3F",
      "1G": "3A",
      "1I": "3H",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 169,
    "qualifiedThirdGroups": [
      "A",
      "E",
      "F",
      "G",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3I",
      "1E": "3F",
      "1G": "3A",
      "1I": "3G",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 170,
    "qualifiedThirdGroups": [
      "A",
      "E",
      "F",
      "G",
      "H",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3J",
      "1E": "3F",
      "1G": "3A",
      "1I": "3H",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 171,
    "qualifiedThirdGroups": [
      "A",
      "E",
      "F",
      "G",
      "H",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3I",
      "1E": "3F",
      "1G": "3A",
      "1I": "3H",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 172,
    "qualifiedThirdGroups": [
      "A",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3J",
      "1E": "3F",
      "1G": "3A",
      "1I": "3H",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 173,
    "qualifiedThirdGroups": [
      "A",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3J",
      "1E": "3F",
      "1G": "3A",
      "1I": "3H",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 174,
    "qualifiedThirdGroups": [
      "A",
      "D",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3I",
      "1E": "3D",
      "1G": "3A",
      "1I": "3G",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 175,
    "qualifiedThirdGroups": [
      "A",
      "D",
      "F",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3I",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 176,
    "qualifiedThirdGroups": [
      "A",
      "D",
      "F",
      "G",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3I",
      "1B": "3G",
      "1D": "3J",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 177,
    "qualifiedThirdGroups": [
      "A",
      "D",
      "F",
      "G",
      "H",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3J",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 178,
    "qualifiedThirdGroups": [
      "A",
      "D",
      "F",
      "G",
      "H",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3I",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 179,
    "qualifiedThirdGroups": [
      "A",
      "D",
      "F",
      "G",
      "H",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3J",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 180,
    "qualifiedThirdGroups": [
      "A",
      "D",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3J",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 181,
    "qualifiedThirdGroups": [
      "A",
      "D",
      "E",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3I",
      "1E": "3D",
      "1G": "3A",
      "1I": "3H",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 182,
    "qualifiedThirdGroups": [
      "A",
      "D",
      "E",
      "G",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3I",
      "1E": "3D",
      "1G": "3A",
      "1I": "3G",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 183,
    "qualifiedThirdGroups": [
      "A",
      "D",
      "E",
      "G",
      "H",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3J",
      "1E": "3D",
      "1G": "3A",
      "1I": "3H",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 184,
    "qualifiedThirdGroups": [
      "A",
      "D",
      "E",
      "G",
      "H",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3I",
      "1E": "3D",
      "1G": "3A",
      "1I": "3H",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 185,
    "qualifiedThirdGroups": [
      "A",
      "D",
      "E",
      "G",
      "H",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3J",
      "1E": "3D",
      "1G": "3A",
      "1I": "3H",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 186,
    "qualifiedThirdGroups": [
      "A",
      "D",
      "E",
      "G",
      "H",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3J",
      "1E": "3D",
      "1G": "3A",
      "1I": "3H",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 187,
    "qualifiedThirdGroups": [
      "A",
      "D",
      "E",
      "F",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3I",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 188,
    "qualifiedThirdGroups": [
      "A",
      "D",
      "E",
      "F",
      "H",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3E",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 189,
    "qualifiedThirdGroups": [
      "A",
      "D",
      "E",
      "F",
      "H",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3E",
      "1D": "3I",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 190,
    "qualifiedThirdGroups": [
      "A",
      "D",
      "E",
      "F",
      "H",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3E",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 191,
    "qualifiedThirdGroups": [
      "A",
      "D",
      "E",
      "F",
      "H",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3E",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 192,
    "qualifiedThirdGroups": [
      "A",
      "D",
      "E",
      "F",
      "G",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3J",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 193,
    "qualifiedThirdGroups": [
      "A",
      "D",
      "E",
      "F",
      "G",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3I",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 194,
    "qualifiedThirdGroups": [
      "A",
      "D",
      "E",
      "F",
      "G",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3J",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 195,
    "qualifiedThirdGroups": [
      "A",
      "D",
      "E",
      "F",
      "G",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3J",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 196,
    "qualifiedThirdGroups": [
      "A",
      "D",
      "E",
      "F",
      "G",
      "H",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3E",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 197,
    "qualifiedThirdGroups": [
      "A",
      "D",
      "E",
      "F",
      "G",
      "H",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3J",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3E"
    }
  },
  {
    "option": 198,
    "qualifiedThirdGroups": [
      "A",
      "D",
      "E",
      "F",
      "G",
      "H",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3J",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3E",
      "1L": "3K"
    }
  },
  {
    "option": 199,
    "qualifiedThirdGroups": [
      "A",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3E",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 200,
    "qualifiedThirdGroups": [
      "A",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3E",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 201,
    "qualifiedThirdGroups": [
      "A",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3J",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3E",
      "1L": "3I"
    }
  },
  {
    "option": 202,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3I",
      "1E": "3C",
      "1G": "3A",
      "1I": "3G",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 203,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "F",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3I",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 204,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "F",
      "G",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3I",
      "1B": "3G",
      "1D": "3J",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 205,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "F",
      "G",
      "H",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3J",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 206,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "F",
      "G",
      "H",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3I",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 207,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "F",
      "G",
      "H",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3J",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 208,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3J",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 209,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "E",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3I",
      "1E": "3C",
      "1G": "3A",
      "1I": "3H",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 210,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "E",
      "G",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3I",
      "1E": "3C",
      "1G": "3A",
      "1I": "3G",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 211,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "E",
      "G",
      "H",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3J",
      "1E": "3C",
      "1G": "3A",
      "1I": "3H",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 212,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "E",
      "G",
      "H",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3I",
      "1E": "3C",
      "1G": "3A",
      "1I": "3H",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 213,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "E",
      "G",
      "H",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3J",
      "1E": "3C",
      "1G": "3A",
      "1I": "3H",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 214,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "E",
      "G",
      "H",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3J",
      "1E": "3C",
      "1G": "3A",
      "1I": "3H",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 215,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "E",
      "F",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3I",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 216,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "E",
      "F",
      "H",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3E",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 217,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "E",
      "F",
      "H",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3E",
      "1D": "3I",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 218,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "E",
      "F",
      "H",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3E",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 219,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "E",
      "F",
      "H",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3E",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 220,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "E",
      "F",
      "G",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3J",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 221,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "E",
      "F",
      "G",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3I",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 222,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "E",
      "F",
      "G",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3J",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 223,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "E",
      "F",
      "G",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3J",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 224,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "E",
      "F",
      "G",
      "H",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3E",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 225,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "E",
      "F",
      "G",
      "H",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3J",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3E"
    }
  },
  {
    "option": 226,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "E",
      "F",
      "G",
      "H",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3J",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3E",
      "1L": "3K"
    }
  },
  {
    "option": 227,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "E",
      "F",
      "G",
      "H",
      "I",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3E",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 228,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "E",
      "F",
      "G",
      "H",
      "I",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3E",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 229,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3J",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3E",
      "1L": "3I"
    }
  },
  {
    "option": 230,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3I",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 231,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "G",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3I",
      "1B": "3G",
      "1D": "3J",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 232,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "G",
      "H",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3J",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 233,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "G",
      "H",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3I",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 234,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "G",
      "H",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3J",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 235,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "G",
      "H",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3J",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 236,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "F",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3J",
      "1D": "3I",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 237,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "F",
      "H",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3F",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 238,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "F",
      "H",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3F",
      "1D": "3I",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 239,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "F",
      "H",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3F",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 240,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "F",
      "H",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3F",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 241,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "F",
      "G",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3J",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 242,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "F",
      "G",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3I",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 243,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "F",
      "G",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3J",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 244,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "F",
      "G",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3J",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 245,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "F",
      "G",
      "H",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3F",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 246,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "F",
      "G",
      "H",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3J",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3H"
    }
  },
  {
    "option": 247,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "F",
      "G",
      "H",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3J",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3D",
      "1L": "3K"
    }
  },
  {
    "option": 248,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "F",
      "G",
      "H",
      "I",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3F",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 249,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "F",
      "G",
      "H",
      "I",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3F",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 250,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "F",
      "G",
      "H",
      "I",
      "J"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3J",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3D",
      "1L": "3I"
    }
  },
  {
    "option": 251,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "E",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3I",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 252,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "E",
      "H",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3E",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 253,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "E",
      "H",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3E",
      "1D": "3I",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 254,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "E",
      "H",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3E",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 255,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "E",
      "H",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3E",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 256,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "E",
      "G",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3J",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 257,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "E",
      "G",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3I",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 258,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "E",
      "G",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3J",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 259,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "E",
      "G",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3J",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 260,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "E",
      "G",
      "H",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3E",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 261,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "E",
      "G",
      "H",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3J",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3E"
    }
  },
  {
    "option": 262,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "E",
      "G",
      "H",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3J",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3E",
      "1L": "3K"
    }
  },
  {
    "option": 263,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "E",
      "G",
      "H",
      "I",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3E",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 264,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "E",
      "G",
      "H",
      "I",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3E",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 265,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "E",
      "G",
      "H",
      "I",
      "J"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3J",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3E",
      "1L": "3I"
    }
  },
  {
    "option": 266,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "E",
      "F",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3J",
      "1D": "3E",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 267,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "E",
      "F",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3E",
      "1D": "3I",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 268,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "E",
      "F",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3J",
      "1D": "3E",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 269,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "E",
      "F",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3J",
      "1D": "3E",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 270,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "E",
      "F",
      "H",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3E",
      "1D": "3F",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 271,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "E",
      "F",
      "H",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3F",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3E"
    }
  },
  {
    "option": 272,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "E",
      "F",
      "H",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3E",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3D",
      "1L": "3K"
    }
  },
  {
    "option": 273,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "E",
      "F",
      "H",
      "I",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3E",
      "1D": "3F",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 274,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "E",
      "F",
      "H",
      "I",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3E",
      "1D": "3F",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 275,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "E",
      "F",
      "H",
      "I",
      "J"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3E",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3D",
      "1L": "3I"
    }
  },
  {
    "option": 276,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "E",
      "F",
      "G",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3E",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 277,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "E",
      "F",
      "G",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3J",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3E"
    }
  },
  {
    "option": 278,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "E",
      "F",
      "G",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3J",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3E",
      "1L": "3K"
    }
  },
  {
    "option": 279,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "E",
      "F",
      "G",
      "I",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3E",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 280,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "E",
      "F",
      "G",
      "I",
      "K"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3E",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 281,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "E",
      "F",
      "G",
      "I",
      "J"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3J",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3E",
      "1L": "3I"
    }
  },
  {
    "option": 282,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3F",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3E"
    }
  },
  {
    "option": 283,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3E",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3D",
      "1L": "3K"
    }
  },
  {
    "option": 284,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "J"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3J",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3D",
      "1L": "3E"
    }
  },
  {
    "option": 285,
    "qualifiedThirdGroups": [
      "A",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3E",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3D",
      "1L": "3I"
    }
  },
  {
    "option": 286,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3A",
      "1G": "3I",
      "1I": "3G",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 287,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "F",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3A",
      "1G": "3I",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 288,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "F",
      "G",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3I",
      "1B": "3J",
      "1D": "3B",
      "1E": "3F",
      "1G": "3A",
      "1I": "3G",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 289,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "F",
      "G",
      "H",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3F",
      "1G": "3A",
      "1I": "3G",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 290,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "F",
      "G",
      "H",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3A",
      "1G": "3I",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 291,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "F",
      "G",
      "H",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3F",
      "1G": "3A",
      "1I": "3G",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 292,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3F",
      "1G": "3A",
      "1I": "3G",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 293,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "E",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3A",
      "1G": "3I",
      "1I": "3H",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 294,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "E",
      "G",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3A",
      "1G": "3I",
      "1I": "3G",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 295,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "E",
      "G",
      "H",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3A",
      "1G": "3H",
      "1I": "3G",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 296,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "E",
      "G",
      "H",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3A",
      "1G": "3I",
      "1I": "3H",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 297,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "E",
      "G",
      "H",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3A",
      "1G": "3H",
      "1I": "3G",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 298,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "E",
      "G",
      "H",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3A",
      "1G": "3H",
      "1I": "3G",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 299,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "E",
      "F",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3A",
      "1G": "3I",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 300,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "E",
      "F",
      "H",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3F",
      "1G": "3A",
      "1I": "3H",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 301,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "E",
      "F",
      "H",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3I",
      "1D": "3B",
      "1E": "3F",
      "1G": "3A",
      "1I": "3H",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 302,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "E",
      "F",
      "H",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3F",
      "1G": "3A",
      "1I": "3H",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 303,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "E",
      "F",
      "H",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3F",
      "1G": "3A",
      "1I": "3H",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 304,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "E",
      "F",
      "G",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3F",
      "1G": "3A",
      "1I": "3G",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 305,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "E",
      "F",
      "G",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3A",
      "1G": "3I",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 306,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "E",
      "F",
      "G",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3F",
      "1G": "3A",
      "1I": "3G",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 307,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "E",
      "F",
      "G",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3F",
      "1G": "3A",
      "1I": "3G",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 308,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "E",
      "F",
      "G",
      "H",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3F",
      "1G": "3A",
      "1I": "3H",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 309,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "E",
      "F",
      "G",
      "H",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3F",
      "1G": "3A",
      "1I": "3G",
      "1K": "3L",
      "1L": "3E"
    }
  },
  {
    "option": 310,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "E",
      "F",
      "G",
      "H",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3F",
      "1G": "3A",
      "1I": "3G",
      "1K": "3E",
      "1L": "3K"
    }
  },
  {
    "option": 311,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "E",
      "F",
      "G",
      "H",
      "I",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3F",
      "1G": "3A",
      "1I": "3H",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 312,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "E",
      "F",
      "G",
      "H",
      "I",
      "K"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3F",
      "1G": "3A",
      "1I": "3H",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 313,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3F",
      "1G": "3A",
      "1I": "3G",
      "1K": "3E",
      "1L": "3I"
    }
  },
  {
    "option": 314,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3I",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3H",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 315,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "G",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3I",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3G",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 316,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "G",
      "H",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3G",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 317,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "G",
      "H",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3I",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3H",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 318,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "G",
      "H",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3G",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 319,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "G",
      "H",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3G",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 320,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "F",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3I",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 321,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "F",
      "H",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 322,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "F",
      "H",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3I",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 323,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "F",
      "H",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 324,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "F",
      "H",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 325,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "F",
      "G",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3F",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3G",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 326,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "F",
      "G",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3I",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 327,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "F",
      "G",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3F",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3G",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 328,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "F",
      "G",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3F",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3G",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 329,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "F",
      "G",
      "H",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 330,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "F",
      "G",
      "H",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3J"
    }
  },
  {
    "option": 331,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "F",
      "G",
      "H",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3J",
      "1L": "3K"
    }
  },
  {
    "option": 332,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "F",
      "G",
      "H",
      "I",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 333,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "F",
      "G",
      "H",
      "I",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 334,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "F",
      "G",
      "H",
      "I",
      "J"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3I",
      "1L": "3J"
    }
  },
  {
    "option": 335,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "E",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3A",
      "1G": "3I",
      "1I": "3D",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 336,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "E",
      "H",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3H",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 337,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "E",
      "H",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3I",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3H",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 338,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "E",
      "H",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3H",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 339,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "E",
      "H",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3H",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 340,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "E",
      "G",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3G",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 341,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "E",
      "G",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3A",
      "1G": "3I",
      "1I": "3D",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 342,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "E",
      "G",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3G",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 343,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "E",
      "G",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3G",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 344,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "E",
      "G",
      "H",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3H",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 345,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "E",
      "G",
      "H",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3G",
      "1K": "3L",
      "1L": "3E"
    }
  },
  {
    "option": 346,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "E",
      "G",
      "H",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3G",
      "1K": "3E",
      "1L": "3K"
    }
  },
  {
    "option": 347,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "E",
      "G",
      "H",
      "I",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3H",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 348,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "E",
      "G",
      "H",
      "I",
      "K"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3H",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 349,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "E",
      "G",
      "H",
      "I",
      "J"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3G",
      "1K": "3E",
      "1L": "3I"
    }
  },
  {
    "option": 350,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "E",
      "F",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 351,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "E",
      "F",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3I",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 352,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "E",
      "F",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 353,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "E",
      "F",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 354,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "E",
      "F",
      "H",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3E",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 355,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "E",
      "F",
      "H",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3E"
    }
  },
  {
    "option": 356,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "E",
      "F",
      "H",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3E",
      "1L": "3K"
    }
  },
  {
    "option": 357,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "E",
      "F",
      "H",
      "I",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3E",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 358,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "E",
      "F",
      "H",
      "I",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3E",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 359,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "E",
      "F",
      "H",
      "I",
      "J"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3E",
      "1L": "3I"
    }
  },
  {
    "option": 360,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "E",
      "F",
      "G",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 361,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "E",
      "F",
      "G",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3J"
    }
  },
  {
    "option": 362,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "E",
      "F",
      "G",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3J",
      "1L": "3K"
    }
  },
  {
    "option": 363,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "E",
      "F",
      "G",
      "I",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 364,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "E",
      "F",
      "G",
      "I",
      "K"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 365,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "E",
      "F",
      "G",
      "I",
      "J"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3I",
      "1L": "3J"
    }
  },
  {
    "option": 366,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "E",
      "F",
      "G",
      "H",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3E"
    }
  },
  {
    "option": 367,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "E",
      "F",
      "G",
      "H",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3E",
      "1L": "3K"
    }
  },
  {
    "option": 368,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "E",
      "F",
      "G",
      "H",
      "J"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3E",
      "1L": "3J"
    }
  },
  {
    "option": 369,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3E",
      "1L": "3I"
    }
  },
  {
    "option": 370,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3I",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3H",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 371,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "G",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3I",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3G",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 372,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "G",
      "H",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3G",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 373,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "G",
      "H",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3I",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3H",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 374,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "G",
      "H",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3G",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 375,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "G",
      "H",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3G",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 376,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "F",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3I",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 377,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "F",
      "H",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 378,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "F",
      "H",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3I",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 379,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "F",
      "H",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 380,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "F",
      "H",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 381,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "F",
      "G",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3J",
      "1D": "3B",
      "1E": "3F",
      "1G": "3A",
      "1I": "3G",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 382,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "F",
      "G",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3I",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 383,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "F",
      "G",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3J",
      "1D": "3B",
      "1E": "3F",
      "1G": "3A",
      "1I": "3G",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 384,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "F",
      "G",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3J",
      "1D": "3B",
      "1E": "3F",
      "1G": "3A",
      "1I": "3G",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 385,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "F",
      "G",
      "H",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 386,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "F",
      "G",
      "H",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3J"
    }
  },
  {
    "option": 387,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "F",
      "G",
      "H",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3J",
      "1L": "3K"
    }
  },
  {
    "option": 388,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "F",
      "G",
      "H",
      "I",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 389,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "F",
      "G",
      "H",
      "I",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 390,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "F",
      "G",
      "H",
      "I",
      "J"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3I",
      "1L": "3J"
    }
  },
  {
    "option": 391,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "E",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3A",
      "1G": "3I",
      "1I": "3C",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 392,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "E",
      "H",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3H",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 393,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "E",
      "H",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3I",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3H",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 394,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "E",
      "H",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3H",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 395,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "E",
      "H",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3H",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 396,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "E",
      "G",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3G",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 397,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "E",
      "G",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3A",
      "1G": "3I",
      "1I": "3C",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 398,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "E",
      "G",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3G",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 399,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "E",
      "G",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3G",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 400,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "E",
      "G",
      "H",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3H",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 401,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "E",
      "G",
      "H",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3G",
      "1K": "3L",
      "1L": "3E"
    }
  },
  {
    "option": 402,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "E",
      "G",
      "H",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3G",
      "1K": "3E",
      "1L": "3K"
    }
  },
  {
    "option": 403,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "E",
      "G",
      "H",
      "I",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3H",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 404,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "E",
      "G",
      "H",
      "I",
      "K"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3H",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 405,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "E",
      "G",
      "H",
      "I",
      "J"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3G",
      "1K": "3E",
      "1L": "3I"
    }
  },
  {
    "option": 406,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "E",
      "F",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 407,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "E",
      "F",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3I",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 408,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "E",
      "F",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 409,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "E",
      "F",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 410,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "E",
      "F",
      "H",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3E",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 411,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "E",
      "F",
      "H",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3E"
    }
  },
  {
    "option": 412,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "E",
      "F",
      "H",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3E",
      "1L": "3K"
    }
  },
  {
    "option": 413,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "E",
      "F",
      "H",
      "I",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3E",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 414,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "E",
      "F",
      "H",
      "I",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3E",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 415,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "E",
      "F",
      "H",
      "I",
      "J"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3E",
      "1L": "3I"
    }
  },
  {
    "option": 416,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "E",
      "F",
      "G",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 417,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "E",
      "F",
      "G",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3J"
    }
  },
  {
    "option": 418,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "E",
      "F",
      "G",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3J",
      "1L": "3K"
    }
  },
  {
    "option": 419,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "E",
      "F",
      "G",
      "I",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 420,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "E",
      "F",
      "G",
      "I",
      "K"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 421,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "E",
      "F",
      "G",
      "I",
      "J"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3I",
      "1L": "3J"
    }
  },
  {
    "option": 422,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "E",
      "F",
      "G",
      "H",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3E"
    }
  },
  {
    "option": 423,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "E",
      "F",
      "G",
      "H",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3E",
      "1L": "3K"
    }
  },
  {
    "option": 424,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "E",
      "F",
      "G",
      "H",
      "J"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3E",
      "1L": "3J"
    }
  },
  {
    "option": 425,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "E",
      "F",
      "G",
      "H",
      "I"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3E",
      "1L": "3I"
    }
  },
  {
    "option": 426,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "I",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3I",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 427,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "H",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 428,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "H",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3I",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 429,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "H",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 430,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "H",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 431,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "G",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3G",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 432,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "G",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3I",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 433,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "G",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3G",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 434,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "G",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3G",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 435,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "G",
      "H",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 436,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "G",
      "H",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3J"
    }
  },
  {
    "option": 437,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "G",
      "H",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3J",
      "1L": "3K"
    }
  },
  {
    "option": 438,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "G",
      "H",
      "I",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 439,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "G",
      "H",
      "I",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 440,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "G",
      "H",
      "I",
      "J"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3I",
      "1L": "3J"
    }
  },
  {
    "option": 441,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "F",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 442,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "F",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3I",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 443,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "F",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 444,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "F",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 445,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "F",
      "H",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3F",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 446,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "F",
      "H",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3H"
    }
  },
  {
    "option": 447,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "F",
      "H",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3D",
      "1L": "3K"
    }
  },
  {
    "option": 448,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "F",
      "H",
      "I",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3F",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 449,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "F",
      "H",
      "I",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3F",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 450,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "F",
      "H",
      "I",
      "J"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3D",
      "1L": "3I"
    }
  },
  {
    "option": 451,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "F",
      "G",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 452,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "F",
      "G",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3J"
    }
  },
  {
    "option": 453,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "F",
      "G",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3J",
      "1L": "3K"
    }
  },
  {
    "option": 454,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "F",
      "G",
      "I",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 455,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "F",
      "G",
      "I",
      "K"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 456,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "F",
      "G",
      "I",
      "J"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3I",
      "1L": "3J"
    }
  },
  {
    "option": 457,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "F",
      "G",
      "H",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3H"
    }
  },
  {
    "option": 458,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "F",
      "G",
      "H",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3D",
      "1L": "3K"
    }
  },
  {
    "option": 459,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "F",
      "G",
      "H",
      "J"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3D",
      "1L": "3J"
    }
  },
  {
    "option": 460,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "F",
      "G",
      "H",
      "I"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3D",
      "1L": "3I"
    }
  },
  {
    "option": 461,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "J",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 462,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "I",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3I",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 463,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "I",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 464,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "I",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 465,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "H",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3E",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 466,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "H",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3E"
    }
  },
  {
    "option": 467,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "H",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3E",
      "1L": "3K"
    }
  },
  {
    "option": 468,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "H",
      "I",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3E",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 469,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "H",
      "I",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3E",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 470,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "H",
      "I",
      "J"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3E",
      "1L": "3I"
    }
  },
  {
    "option": 471,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "G",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 472,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "G",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3J"
    }
  },
  {
    "option": 473,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "G",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3J",
      "1L": "3K"
    }
  },
  {
    "option": 474,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "G",
      "I",
      "L"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 475,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "G",
      "I",
      "K"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 476,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "G",
      "I",
      "J"
    ],
    "assignments": {
      "1A": "3E",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3I",
      "1L": "3J"
    }
  },
  {
    "option": 477,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "G",
      "H",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3E"
    }
  },
  {
    "option": 478,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "G",
      "H",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3E",
      "1L": "3K"
    }
  },
  {
    "option": 479,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "G",
      "H",
      "J"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3E",
      "1L": "3J"
    }
  },
  {
    "option": 480,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "G",
      "H",
      "I"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3E",
      "1L": "3I"
    }
  },
  {
    "option": 481,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "K",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3E",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3K"
    }
  },
  {
    "option": 482,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "J",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3E"
    }
  },
  {
    "option": 483,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "J",
      "K"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3E",
      "1L": "3K"
    }
  },
  {
    "option": 484,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "I",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3E",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3I"
    }
  },
  {
    "option": 485,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "I",
      "K"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3E",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3I",
      "1L": "3K"
    }
  },
  {
    "option": 486,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "I",
      "J"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3J",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3E",
      "1L": "3I"
    }
  },
  {
    "option": 487,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "H",
      "L"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3F",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3D",
      "1K": "3L",
      "1L": "3E"
    }
  },
  {
    "option": 488,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "H",
      "K"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3E",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3D",
      "1L": "3K"
    }
  },
  {
    "option": 489,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "H",
      "J"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3J",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3D",
      "1L": "3E"
    }
  },
  {
    "option": 490,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "H",
      "I"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3E",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3D",
      "1L": "3I"
    }
  },
  {
    "option": 491,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "L"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3L",
      "1L": "3E"
    }
  },
  {
    "option": 492,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "K"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3E",
      "1L": "3K"
    }
  },
  {
    "option": 493,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "J"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3E",
      "1L": "3J"
    }
  },
  {
    "option": 494,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "I"
    ],
    "assignments": {
      "1A": "3C",
      "1B": "3G",
      "1D": "3B",
      "1E": "3D",
      "1G": "3A",
      "1I": "3F",
      "1K": "3E",
      "1L": "3I"
    }
  },
  {
    "option": 495,
    "qualifiedThirdGroups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H"
    ],
    "assignments": {
      "1A": "3H",
      "1B": "3G",
      "1D": "3B",
      "1E": "3C",
      "1G": "3A",
      "1I": "3F",
      "1K": "3D",
      "1L": "3E"
    }
  }
];
