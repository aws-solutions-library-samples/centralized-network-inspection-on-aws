/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { MetricsManager, NetworkFirewallMetrics } from '../lib/common/send-metrics';
import { SSM } from '@aws-sdk/client-ssm';
import axios from 'axios';
import { Logger } from '../lib/common/logger';

jest.mock('@aws-sdk/client-ssm', () => {
  return {
    __esModule: true,
    SSM: jest.fn().mockImplementation(() => {
      return {
        getParameter: jest.fn(),
        putParameter: jest.fn()
      };
    })
  };
});

jest.mock('axios', () => {
  return {
    __esModule: true,
    default: {
      post: jest.fn(),
      isAxiosError: jest.fn()
    }
  };
});

jest.mock('uuid', () => {
  return {
    __esModule: true,
    v4: jest.fn().mockReturnValue('test-uuid-value')
  };
});

jest.mock('../lib/common/logger', () => {
  return {
    Logger: {
      log: jest.fn()
    },
    LOG_LEVEL: {
      INFO: 'INFO',
      DEBUG: 'DEBUG',
      ERROR: 'ERROR',
      WARN: 'WARN'
    }
  };
});

describe('Enhanced MetricsManager Tests', () => {
  const originalEnv = process.env;
  
  const getParameterMock = jest.fn();
  
  const putParameterMock = jest.fn();

  const postMock = jest.fn();

  const isAxiosErrorMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    process.env = { ...originalEnv };

    (SSM as unknown as jest.Mock).mockImplementation(() => ({
      getParameter: getParameterMock,
      putParameter: putParameterMock
    }));
    
    axios.post = postMock;
    axios.isAxiosError = isAxiosErrorMock as unknown as typeof axios.isAxiosError;
  });
  
  afterEach(() => {
    process.env = originalEnv;
  });

  it('should handle case when metrics are disabled', async () => {
    process.env.SEND_ANONYMIZED_METRICS = 'No';
    const testMetrics: NetworkFirewallMetrics = {
      numberOfFirewalls: 1,
      numberOfPolicies: 2,
      numberOfStatefulRuleGroups: 3,
      numberOfStatelessRuleGroups: 4,
      numberOfSuricataRules: 5
    };
    
    await MetricsManager.sendMetrics(testMetrics);

    expect(SSM).not.toHaveBeenCalled();
    expect(postMock).not.toHaveBeenCalled();
  });

  it('should handle case when metrics URL is not configured', async () => {
    process.env.SEND_ANONYMIZED_METRICS = 'YES';
    process.env.METRICS_URL = '';
    process.env.SSM_PARAM_FOR_UUID = 'test-param';
    process.env.STACK_ID = 'test-stack';
    
    getParameterMock.mockResolvedValue({
      Parameter: { Value: 'existing-uuid' }
    });
    
    const testMetrics: NetworkFirewallMetrics = {
      numberOfFirewalls: 1,
      numberOfPolicies: 2,
      numberOfStatefulRuleGroups: 3,
      numberOfStatelessRuleGroups: 4,
      numberOfSuricataRules: 5
    };

    await MetricsManager.sendMetrics(testMetrics);

    expect(SSM).toHaveBeenCalled();
    expect(getParameterMock).toHaveBeenCalled();
    expect(postMock).not.toHaveBeenCalled();
    expect(Logger.log).toHaveBeenCalledWith('WARN', 'Metrics URL is not configured, skipping metrics send');
  });

  it('should handle ParameterNotFound error by creating a new UUID', async () => {
    process.env.SEND_ANONYMIZED_METRICS = 'YES';
    process.env.METRICS_URL = 'https://example.com/metrics';
    process.env.SSM_PARAM_FOR_UUID = 'test-param';
    process.env.STACK_ID = 'test-stack';
    
    const parameterError = new Error('Parameter not found');
    parameterError.name = 'ParameterNotFound';
    getParameterMock.mockRejectedValue(parameterError);
    putParameterMock.mockResolvedValue({});
    postMock.mockResolvedValue({ status: 200, data: 'Success' });
    
    const testMetrics: NetworkFirewallMetrics = {
      numberOfFirewalls: 1,
      numberOfPolicies: 2,
      numberOfStatefulRuleGroups: 3,
      numberOfStatelessRuleGroups: 4,
      numberOfSuricataRules: 5
    };

    await MetricsManager.sendMetrics(testMetrics);

    expect(getParameterMock).toHaveBeenCalled();
    expect(putParameterMock).toHaveBeenCalledWith({
      Name: 'test-param-test-stack',
      Value: 'test-uuid-value',
      Type: 'String'
    });
    expect(postMock).toHaveBeenCalled();
  });

  it('should handle case when parameter contains null value', async () => {
    process.env.SEND_ANONYMIZED_METRICS = 'YES';
    process.env.METRICS_URL = 'https://example.com/metrics';
    process.env.SSM_PARAM_FOR_UUID = 'test-param';
    process.env.STACK_ID = 'test-stack';
    
    getParameterMock.mockResolvedValue({
      Parameter: { Value: null } // Null value case
    });
    postMock.mockResolvedValue({ status: 200, data: 'Success' });
    
    const testMetrics: NetworkFirewallMetrics = {
      numberOfFirewalls: 1,
      numberOfPolicies: 2,
      numberOfStatefulRuleGroups: 3,
      numberOfStatelessRuleGroups: 4,
      numberOfSuricataRules: 5
    };

    await MetricsManager.sendMetrics(testMetrics);

    expect(getParameterMock).toHaveBeenCalled();
    expect(postMock).toHaveBeenCalled();
    expect(postMock.mock.calls[0][1]).toContain('test-uuid-value');
  });

  it('should handle Axios errors during metrics posting', async () => {
    process.env.SEND_ANONYMIZED_METRICS = 'YES';
    process.env.METRICS_URL = 'https://example.com/metrics';
    process.env.SSM_PARAM_FOR_UUID = 'test-param';
    process.env.STACK_ID = 'test-stack';
    
    getParameterMock.mockResolvedValue({
      Parameter: { Value: 'existing-uuid' }
    });
    
    const axiosError = new Error('Network error');
    postMock.mockRejectedValue(axiosError);
    isAxiosErrorMock.mockReturnValue(true);
    
    const testMetrics: NetworkFirewallMetrics = {
      numberOfFirewalls: 1,
      numberOfPolicies: 2,
      numberOfStatefulRuleGroups: 3,
      numberOfStatelessRuleGroups: 4,
      numberOfSuricataRules: 5
    };

    await MetricsManager.sendMetrics(testMetrics);
    
    expect(getParameterMock).toHaveBeenCalled();
    expect(postMock).toHaveBeenCalled();
    expect(isAxiosErrorMock).toHaveBeenCalled();
    expect(Logger.log).toHaveBeenCalledWith(expect.anything(), 'Metrics API request failed:', expect.anything());
  });

  it('should handle non-Axios errors during metrics posting', async () => {
    process.env.SEND_ANONYMIZED_METRICS = 'YES';
    process.env.METRICS_URL = 'https://example.com/metrics';
    process.env.SSM_PARAM_FOR_UUID = 'test-param';
    process.env.STACK_ID = 'test-stack';
    
    getParameterMock.mockResolvedValue({
      Parameter: { Value: 'existing-uuid' }
    });
    
    const genericError = new Error('Generic error');
    postMock.mockRejectedValue(genericError);
    isAxiosErrorMock.mockReturnValue(false);
    
    const testMetrics: NetworkFirewallMetrics = {
      numberOfFirewalls: 1,
      numberOfPolicies: 2,
      numberOfStatefulRuleGroups: 3,
      numberOfStatelessRuleGroups: 4,
      numberOfSuricataRules: 5
    };
    
    await MetricsManager.sendMetrics(testMetrics);
    
    expect(getParameterMock).toHaveBeenCalled();
    expect(postMock).toHaveBeenCalled();
    expect(isAxiosErrorMock).toHaveBeenCalled();
    expect(Logger.log).toHaveBeenCalledWith(expect.anything(), 'Error sending metrics:', 'Generic error');
  });

  it('should handle missing metrics fields', async () => {
    process.env.SEND_ANONYMIZED_METRICS = 'YES';
    process.env.METRICS_URL = 'https://example.com/metrics';
    process.env.SSM_PARAM_FOR_UUID = 'test-param';
    process.env.STACK_ID = 'test-stack';
    
    getParameterMock.mockResolvedValue({
      Parameter: { Value: 'existing-uuid' }
    });
    postMock.mockResolvedValue({ status: 200, data: 'Success' });
    
    const partialMetrics = {
      numberOfFirewalls: 1,
      numberOfStatelessRuleGroups: 4,
    } as NetworkFirewallMetrics;
    
    await MetricsManager.sendMetrics(partialMetrics);
    
    expect(getParameterMock).toHaveBeenCalled();
    expect(postMock).toHaveBeenCalled();

    const postedData = JSON.parse(postMock.mock.calls[0][1]);
    expect(postedData.Data).toEqual(expect.objectContaining({
      numberOfFirewalls: 1,
      numberOfStatelessRuleGroups: 4,
    }));
  });
});
