export const VARIABLE_TYPE = {
  CUSTOM: 'CUSTOM',
  CUSTOM_VALUE_FROM: 'CUSTOM_VALUE_FROM',
  CONFIG_MAP: 'CONFIG_MAP',
  SECRET: 'SECRET',
};

export const VARIABLE_VALIDATION = {
  NONE: 'NONE',
  EMPTY: 'EMPTY',
  INVALID: 'INVALID',
  INVALID_SECRET: 'INVALID_SECRET',
  INVALID_CONFIG: 'INVALID_CONFIG',
  DUPLICATED: 'DUPLICATED',
  RESTRICTED: 'RESTRICTED',
  CAN_OVERRIDE_BY_CUSTOM_ENV: 'CAN_OVERRIDE_BY_CUSTOM_ENV',
};

export const ERROR_VARIABLE_VALIDATION = [
  VARIABLE_VALIDATION.EMPTY,
  VARIABLE_VALIDATION.INVALID,
  VARIABLE_VALIDATION.DUPLICATED,
  VARIABLE_VALIDATION.RESTRICTED,
  VARIABLE_VALIDATION.INVALID_SECRET,
  VARIABLE_VALIDATION.INVALID_CONFIG,
];

export const ALL_KEYS = '<ALL_KEYS>';
