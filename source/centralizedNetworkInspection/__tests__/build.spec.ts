/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

describe('build.ts Script', () => {
  const mockValidate = jest.fn();
  const mockLoggerLog = jest.fn();
  const mockExit = jest.spyOn(process, 'exit').mockImplementation((_code?: string | number | null | undefined) => {
    return undefined as never;
  });

  const mockFirewallConfigValidationInstance = {
    validate: mockValidate
  };
  const mockFirewallConfigValidation = jest.fn().mockImplementation(() => mockFirewallConfigValidationInstance);
  
  const mockLOG_LEVEL = {
    INFO: 'INFO',
    DEBUG: 'DEBUG',
    ERROR: 'ERROR',
    WARN: 'WARN'
  };
  
  const mockLogger = {
    log: mockLoggerLog
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockExit.mockRestore();
  });
  
  async function runBuildScript() {
    try {
      const firewallConfigValidation = new mockFirewallConfigValidation();
      await firewallConfigValidation.validate();
    } catch (error) {
      mockLogger.log(mockLOG_LEVEL.ERROR, 'Error in firewall config validation', error);
      process.exit(1);
    }
  }

  it('should call FirewallConfigValidation.validate when executed', async () => {
    mockValidate.mockResolvedValueOnce(undefined);
    
    await runBuildScript();
    
    expect(mockFirewallConfigValidation).toHaveBeenCalledTimes(1);
    expect(mockValidate).toHaveBeenCalledTimes(1);
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('should exit with code 1 when validation fails', async () => {
    const testError = new Error('Validation failed');
    mockValidate.mockRejectedValueOnce(testError);
    
    await runBuildScript();

    expect(mockValidate).toHaveBeenCalledTimes(1);
    expect(mockLoggerLog).toHaveBeenCalledWith(mockLOG_LEVEL.ERROR, 'Error in firewall config validation', testError);
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should catch and handle unexpected errors', async () => {
    const unexpectedError = new TypeError('Unexpected error');
    mockValidate.mockImplementationOnce(() => {
      throw unexpectedError;
    });
    
    await runBuildScript();
    
    expect(mockLoggerLog).toHaveBeenCalledWith(mockLOG_LEVEL.ERROR, 'Error in firewall config validation', unexpectedError);
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});