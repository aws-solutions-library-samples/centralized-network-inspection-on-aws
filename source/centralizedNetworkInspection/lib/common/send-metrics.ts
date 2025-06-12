/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { v4 as uuidv4 } from 'uuid';
import { SSM } from '@aws-sdk/client-ssm';
import axios from 'axios';
import { Logger, LOG_LEVEL } from './logger';
import { AwsErrorFormatter } from './aws-error-formatter';
import { AwsClientConfig } from '../service/awsClientConfig';

export interface NetworkFirewallMetrics {
  numberOfFirewalls: number;
  numberOfStatefulRuleGroups: number;
  numberOfStatelessRuleGroups: number;
  numberOfPolicies: number;
  numberOfSuricataRules: number;
  logType?: string;
  logDestinationType?: string;
}

export class MetricsManager {

  /**
   * Get UUID from SSM parameter store or create a new one if it doesn't exist
   */
  private static async getOrCreateUuid(ssmInstance: SSM, ssmUUIDKey: string): Promise<string> {
    try {
      const ssmGetParamResponse = await ssmInstance.getParameter({
        Name: ssmUUIDKey,
      });
      return ssmGetParamResponse.Parameter?.Value || uuidv4();
    } catch (error: any) {
      const formattedError = AwsErrorFormatter.format(error);
      Logger.log(LOG_LEVEL.ERROR, "Error while getting the parameter:", formattedError);

      if (error.code === 'ParameterNotFound' || error.name === 'ParameterNotFound') {
        const uuid = uuidv4();
        try {
          await ssmInstance.putParameter({
            Name: ssmUUIDKey,
            Value: uuid,
            Type: 'String',
          });
          return uuid;
        } catch (putError: any) {
          Logger.log(LOG_LEVEL.ERROR, "Error while creating parameter:", AwsErrorFormatter.format(putError));
          // Even if parameter creation fails, return the UUID so we can continue
          return uuid;
        }
      }
      
      // For other errors, still return a UUID to allow the process to continue
      Logger.log(LOG_LEVEL.WARN, "Using generated UUID due to SSM error");
      return uuidv4();
    }
  }


  /**
   * Send metrics data to the metrics endpoint
   */
  private static async sendMetricsData(data: NetworkFirewallMetrics, uuid: string): Promise<void> {
    // Send metrics without validation - accept any data structure
    const metricsUrl = process.env.METRICS_URL || '';
    const hasValidUrl = metricsUrl.length > 0;
    
    if (!hasValidUrl) {
      Logger.log(LOG_LEVEL.WARN, "Metrics URL is not configured, skipping metrics send");
      return;
    }
    
    try {
      const solutionId = process.env.SOLUTION_ID;
      const timestamp = new Date().toISOString();
      
      // Create a new object instead of mutating the input data
      const enrichedData = {
        ...data,
        logDestinationType: process.env.LOG_DESTINATION_TYPE,
        logType: process.env.LOG_TYPE,
      };
      
      const metricsData = {
        Solution: solutionId,
        TimeStamp: timestamp,
        UUID: uuid,
        Data: enrichedData,
      };
      
      Logger.log(LOG_LEVEL.DEBUG, 'metrics data: ', metricsData);
      
      const requestConfig = {
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': JSON.stringify(enrichedData).length,
        },
        timeout: 5000 // Add timeout to prevent hanging requests
      };
      
      const response = await axios.post(metricsUrl, JSON.stringify(metricsData), requestConfig);
      Logger.log(LOG_LEVEL.DEBUG, 'Metrics response status:', response.status);
    } catch (error) {
      this.handleMetricsError(error);
    }
  }
  
  /**
   * Handle errors that occur during metrics sending
   */
  private static handleMetricsError(error: unknown): void {
    if (axios.isAxiosError(error)) {
      Logger.log(LOG_LEVEL.WARN, 'Metrics API request failed:', {
        message: error.message,
        url: error.config?.url,
        status: error.response?.status,
        data: error.response?.data
      });
    } else {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.log(LOG_LEVEL.WARN, 'Error sending metrics:', errorMessage);
    }
  }

  /**
   * Send metrics about Network Firewall resources
   */
  static async sendMetrics(data: NetworkFirewallMetrics): Promise<void> {
    const sendAnonymizedMetrics = (process.env.SEND_ANONYMIZED_METRICS || 'No').toUpperCase();
    const metricsEnabled = sendAnonymizedMetrics === 'YES';
    
    if (!metricsEnabled) {
      return;
    }
    
    try {
      const ssmParameterForUUID = process.env.SSM_PARAM_FOR_UUID || 'centralized-network-inspection-solution-uuid';
      const stackId = process.env.STACK_ID ? process.env.STACK_ID.slice(-36) : '';
      const ssmUUIDKey = `${ssmParameterForUUID}-${stackId}`;
      
      Logger.log(LOG_LEVEL.DEBUG, `ssm parameter uuid key ${ssmUUIDKey}`);
      
      const ssmInstance = new SSM(new AwsClientConfig().getRetryConfigurationOptions());
      const uuid = await this.getOrCreateUuid(ssmInstance, ssmUUIDKey);
      
      Logger.log(LOG_LEVEL.DEBUG, 'uuid: ', uuid);
      await this.sendMetricsData(data, uuid);
    } catch (error) {
      const formattedError = error instanceof Error ? AwsErrorFormatter.format(error) : error;
      Logger.log(LOG_LEVEL.DEBUG, "Error in send-metrics:", formattedError);
    }
  }
}
