/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

const mockConfigReader = jest.fn();
const mockGetJSONFileNames = jest.fn();
const mockConvertFileToObject = jest.fn();

mockConfigReader.mockImplementation(() => ({
  getJSONFileNames: mockGetJSONFileNames,
  convertFileToObject: mockConvertFileToObject
}));

export const ConfigPath = {
  firewallDirectory: '/default/mock/path'
};

export const ConfigReader = mockConfigReader;

export const __mocks = {
  mockConfigReader,
  mockGetJSONFileNames,
  mockConvertFileToObject,
  reset: () => {
    mockConfigReader.mockClear();
    mockGetJSONFileNames.mockClear();
    mockConvertFileToObject.mockClear();
  },
  __setMocks: (mocks: { ConfigPath?: any, ConfigReader?: any }) => {
    if (mocks.ConfigPath) {
      Object.assign(ConfigPath, mocks.ConfigPath);
    }
    if (mocks.ConfigReader) {
      ConfigReader.mockImplementation(mocks.ConfigReader);
    }
  }
};
