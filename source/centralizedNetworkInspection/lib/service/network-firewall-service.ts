/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  NetworkFirewallClient,
  CreateFirewallCommand,
  CreateFirewallPolicyCommand,
  CreateRuleGroupCommand,
  DescribeFirewallCommand,
  DescribeFirewallPolicyCommand,
  DescribeRuleGroupCommand,
  AssociateFirewallPolicyCommand,
  TagResourceCommand,
  UpdateFirewallPolicyCommand,
  UpdateRuleGroupCommand,
  UpdateFirewallDescriptionCommand,
  UpdateFirewallDeleteProtectionCommand,
  UpdateFirewallPolicyChangeProtectionCommand,
  UpdateSubnetChangeProtectionCommand,
  DescribeLoggingConfigurationCommand,
  UpdateLoggingConfigurationCommand,
  DeleteRuleGroupCommand,
  CreateFirewallRequest,
  CreateFirewallPolicyRequest,
  CreateRuleGroupRequest,
  AssociateFirewallPolicyRequest,
  TagResourceRequest,
  UpdateFirewallPolicyRequest,
  UpdateRuleGroupRequest,
  UpdateFirewallDescriptionRequest,
  UpdateFirewallDeleteProtectionRequest,
  UpdateFirewallPolicyChangeProtectionRequest,
  UpdateSubnetChangeProtectionRequest,
  LoggingConfiguration,
  DescribeFirewallCommandOutput,
  DescribeFirewallPolicyCommandOutput,
  DescribeRuleGroupCommandOutput,
  RuleGroupType,
  UpdateLoggingConfigurationCommandInput,
  DescribeLoggingConfigurationCommandOutput
} from '@aws-sdk/client-network-firewall';
import { AwsClientConfig } from './awsClientConfig';
import { LOG_LEVEL, Logger } from '../common/logger';
import { AwsErrorFormatter } from '../common/aws-error-formatter';

// Define the retry count for API calls
const MIN_RETRY = 3;
// Maximum number of retries for update token issues
const MAX_TOKEN_RETRIES = 5;

/**
 * Service class which handles all the Network Firewall API integrations.
 */
export class NetworkFirewallService {
  private networkFirewallClient: NetworkFirewallClient;
  count: number;

  constructor() {
    const config = new AwsClientConfig().getRetryConfigurationOptions();
    this.count = 0;
    this.networkFirewallClient = new NetworkFirewallClient(config);
  }
  
  /** Creates Firewall configurations returns an void/undefined if the firewall doesn't not exist.  */
  async createFirewall(props: CreateFirewallRequest) {
    Logger.log(LOG_LEVEL.INFO, 'Creating Firewall');
    try {
      const command = new CreateFirewallCommand(props);
      const response = await this.networkFirewallClient.send(command);
      return Promise.resolve(response);
    } catch (e: any) {
      if (e.name === 'ResourceNotFoundException') {
        Logger.log(LOG_LEVEL.INFO, 'Firewall Not Found');
        return;
      }
      return Promise.reject(e);
    }
  }

  /** Creates a firewall policy and returns the response object received
   *  from the Network Firewall API. */
  async createFirewallPolicy(props: CreateFirewallPolicyRequest) {
    Logger.log(LOG_LEVEL.INFO, 'Creating Firewall Policy');
    const command = new CreateFirewallPolicyCommand(props);
    return this.networkFirewallClient.send(command);
  }

  /** Creates a rule group and returns the response object received from the Network Firewall API */
  async createRuleGroup(props: CreateRuleGroupRequest) {
    Logger.log(LOG_LEVEL.INFO, 'Create Rule Group');
    Logger.log(LOG_LEVEL.DEBUG, props);
    const command = new CreateRuleGroupCommand(props);
    return this.networkFirewallClient.send(command);
  }

  /** Describes the firewall based on the input param firewallName, return void/undefined if there is not firewall with the firewall Name defined. */
  async describeFirewall(firewallName: string): Promise<DescribeFirewallCommandOutput | void> {
    Logger.log(LOG_LEVEL.INFO, 'Describe Firewall');
    Logger.log(LOG_LEVEL.INFO, `Print Firewall Name: ${firewallName}`);
    try {
      const command = new DescribeFirewallCommand({
        FirewallName: firewallName,
      });
      const response = await this.networkFirewallClient.send(command);
      return Promise.resolve(response);
    } catch (error: any) {
      Logger.log(LOG_LEVEL.INFO, 'Firewall error:', AwsErrorFormatter.format(error));
      if (error.name === 'ResourceNotFoundException') {
        Logger.log(LOG_LEVEL.INFO, 'Firewall Not Found.');
        return Promise.resolve();
      }
      return Promise.reject(error);
    }
  }

  /** Describes the firewall policy and returns void/undefined if there is no firewall policy with the Name and/or Arn defined */
  async describeFirewallPolicy(
    firewallPolicyName: string
  ): Promise<DescribeFirewallPolicyCommandOutput | void> {
    try {
      const command = new DescribeFirewallPolicyCommand({
        FirewallPolicyName: firewallPolicyName,
      });
      const response = await this.networkFirewallClient.send(command);
      return Promise.resolve(response);
    } catch (error: any) {
      Logger.log(LOG_LEVEL.INFO, 'Firewall Policy error:', AwsErrorFormatter.format(error));
      if (error.name === 'ResourceNotFoundException') {
        Logger.log(LOG_LEVEL.INFO, 'Firewall Policy Not Found.');
        return Promise.resolve();
      }
      return Promise.reject(error);
    }
  }

  /** Describes the rule group and returns an rule response object from the api, return void/undefined in case none is found, the
   *  method will retry API calls for a maximum of MIN_RETRY value.
   */
  async describeRuleGroup(
    RuleGroupName: string,
    Type: string
  ): Promise<DescribeRuleGroupCommandOutput | void> {
    // reset the count to 0 in case anyother call has been made
    this.count = 0;
    do {
      try {
        Logger.log(LOG_LEVEL.INFO, `Describing Rule Group: ${RuleGroupName} | Type: ${Type}`);
        const command = new DescribeRuleGroupCommand({
          RuleGroupName: RuleGroupName,
          Type: Type as RuleGroupType,
        });
        const response = await this.networkFirewallClient.send(command);
        return Promise.resolve(response);
      } catch (error: any) {
        Logger.log(LOG_LEVEL.INFO, 'Rule Group error:', AwsErrorFormatter.format(error));
        if (error.name === 'ThrottlingException') {
          this.count++; //increment the count
          Logger.log(LOG_LEVEL.INFO, `Caught throttling exception, trying count: ${this.count}`);
        }
        if (error.name === 'ResourceNotFoundException') {
          Logger.log(LOG_LEVEL.INFO, 'Rule Group Not Found.');
          return Promise.resolve();
        }
      }
    } while (this.count < MIN_RETRY);
    Logger.log(LOG_LEVEL.ERROR, `Unable to retrieve rule group and exceeded the retry count`);
    return Promise.reject({ message: 'Unable to resolve request and completed retries.' });
  }

  /** Associates the firewall policy to the firewall. */
  async associateFirewallPolicy(request: AssociateFirewallPolicyRequest) {
    try {
      const command = new AssociateFirewallPolicyCommand(request);
      return this.networkFirewallClient.send(command);
    } catch (error) {
      Logger.log(LOG_LEVEL.DEBUG, error);
      return Promise.reject(error);
    }
  }

  /** associate tags to the firewall resource. */
  async tagResource(request: TagResourceRequest) {
    try {
      const command = new TagResourceCommand(request);
      return this.networkFirewallClient.send(command);
    } catch (error) {
      Logger.log(LOG_LEVEL.ERROR, `Failed to update tags for the firewall ${error}`);
      // returning resolve to avoid pipeline failure due to tag change failure.
      return Promise.resolve();
    }
  }

  /** Updates the firewall policy and will override any configurations done to the firewall policy in the AWS console. 
   * Method will attempt multiple updates until successful or maximum retries are reached.
   */
  async updateFirewallPolicy(request: UpdateFirewallPolicyRequest) {
    let tokenRetryCount = 0;
    do {
      try {
        const command = new UpdateFirewallPolicyCommand(request);
        const result = await this.networkFirewallClient.send(command);
        
        request.UpdateToken = '';
        return result;
      } catch (error: any) {
        const isInvalidTokenError = (error.message === 'Update token is invalid.');
        
        if (!isInvalidTokenError) {
          Logger.log(LOG_LEVEL.DEBUG, error);
          return Promise.reject(error);
        }
        
        tokenRetryCount++;
        const hasExceededRetryLimit = tokenRetryCount >= MAX_TOKEN_RETRIES;
        
        if (hasExceededRetryLimit) {
          const errorMessage = 'Maximum token retry attempts exceeded for firewall policy update';
          Logger.log(LOG_LEVEL.ERROR, `${errorMessage} (${MAX_TOKEN_RETRIES})`);
          return Promise.reject(new Error(errorMessage));
        }
        
        const describeCommand = new DescribeFirewallPolicyCommand({
          FirewallPolicyName: request.FirewallPolicyName,
        });
        const describeResponse = await this.networkFirewallClient.send(describeCommand);
        const hasValidToken = describeResponse && describeResponse.UpdateToken;
        
        if (hasValidToken) {
          request.UpdateToken = describeResponse.UpdateToken;
        } else {
          Logger.log(LOG_LEVEL.ERROR, `Failed to get valid update token for firewall policy`);
          return Promise.reject(new Error('Failed to get valid update token for firewall policy'));
        }
      }
    } while (request.UpdateToken);
    
    return Promise.resolve();
  }

  /**
   * Update a rule group with retry protection against token validation errors.
   * @param updateRuleGroupRequest UpdateRuleGroupRequest
   */
  async updateRuleGroup(updateRuleGroupRequest: UpdateRuleGroupRequest) {
    let updateResponse;
    let tokenRetryCount = 0;
    
    // Loop until token is cleared or max retries reached
    do {
      try {
        // Attempt the update operation
        const command = new UpdateRuleGroupCommand(updateRuleGroupRequest);
        updateResponse = await this.networkFirewallClient.send(command);
        updateRuleGroupRequest.UpdateToken = '';
      } catch (error: any) {
        const isInvalidTokenError = error.message === 'Update token is invalid.';
        
        if (!isInvalidTokenError) {
          Logger.log(
            LOG_LEVEL.INFO, 
            `Error while trying to update the rule group ${updateRuleGroupRequest}: ${error}`
          );
          return Promise.reject(error);
        }
        
        tokenRetryCount++;
        const hasExceededRetryLimit = tokenRetryCount >= MAX_TOKEN_RETRIES;
        
        if (hasExceededRetryLimit) {
          const errorMessage = 'Maximum token retry attempts exceeded for rule group update';
          Logger.log(LOG_LEVEL.ERROR, `${errorMessage} (${MAX_TOKEN_RETRIES})`);
          return Promise.reject(new Error(errorMessage));
        }
        
        const describeCommand = new DescribeRuleGroupCommand({
          RuleGroupArn: updateRuleGroupRequest.RuleGroupArn,
        });
        const describeResponse = await this.networkFirewallClient.send(describeCommand);
        const hasValidToken = describeResponse && describeResponse.UpdateToken;
        
        if (hasValidToken) {
          updateRuleGroupRequest.UpdateToken = describeResponse.UpdateToken;
        } else {
          Logger.log(LOG_LEVEL.ERROR, `Failed to get valid update token for rule group`);
          return Promise.reject(new Error('Failed to get valid update token for rule group'));
        }
      }
    } while (updateRuleGroupRequest.UpdateToken);
    
    Logger.log(LOG_LEVEL.INFO, `update response ${JSON.stringify(updateResponse)}`);
    return Promise.resolve(updateResponse);
  }

  /**
   * Update the firewall description.
   * @param request UpdateFirewallDescriptionRequest
   */
  async updateFirewallDescription(request: UpdateFirewallDescriptionRequest) {
    try {
      const command = new UpdateFirewallDescriptionCommand(request);
      return await this.networkFirewallClient.send(command);
    } catch (error) {
      Logger.log(LOG_LEVEL.DEBUG, error);
      return Promise.reject(error);
    }
  }
  /**
   * Update the firewall delete protection attribute.
   * @param request UpdateFirewallDeleteProtectionRequest
   */
  async updateFirewallDeleteProtection(request: UpdateFirewallDeleteProtectionRequest) {
    try {
      const command = new UpdateFirewallDeleteProtectionCommand(request);
      return await this.networkFirewallClient.send(command);
    } catch (error) {
      Logger.log(LOG_LEVEL.DEBUG, error);
      return Promise.reject(error);
    }
  }

  /**
   * Update the firewall policy change protection attribute.
   * @param request UpdateFirewallPolicyChangeProtectionRequest
   */
  async updateFirewallPolicyChangeProtection(
    request: UpdateFirewallPolicyChangeProtectionRequest
  ) {
    try {
      const command = new UpdateFirewallPolicyChangeProtectionCommand(request);
      return await this.networkFirewallClient.send(command);
    } catch (error) {
      Logger.log(LOG_LEVEL.DEBUG, error);
      return Promise.reject(error);
    }
  }
  /**
   * Update the subnet change protection attribute.
   * @param request UpdateSubnetChangeProtectionRequest
   */
  async updateSubnetChangeProtection(request: UpdateSubnetChangeProtectionRequest) {
    try {
      const command = new UpdateSubnetChangeProtectionCommand(request);
      return await this.networkFirewallClient.send(command);
    } catch (error) {
      Logger.log(LOG_LEVEL.DEBUG, error);
      return Promise.reject(error);
    }
  }

  async updateLoggingConfiguration(
    firewallName: string,
    loggingConfiguration: LoggingConfiguration
  ) {
    Logger.log(LOG_LEVEL.INFO, loggingConfiguration);
    let describeFirewallLoggingResponse: DescribeLoggingConfigurationCommandOutput;
    try {
      const describeCommand = new DescribeLoggingConfigurationCommand({
        FirewallName: firewallName,
      });
      describeFirewallLoggingResponse = await this.networkFirewallClient.send(describeCommand);
      Logger.log(LOG_LEVEL.INFO, describeFirewallLoggingResponse);
      while (
        describeFirewallLoggingResponse.LoggingConfiguration &&
        describeFirewallLoggingResponse.LoggingConfiguration.LogDestinationConfigs &&
        describeFirewallLoggingResponse.LoggingConfiguration.LogDestinationConfigs.length > 0
      ) {
        Logger.log(LOG_LEVEL.INFO, describeFirewallLoggingResponse);
        if (describeFirewallLoggingResponse.LoggingConfiguration) {
          describeFirewallLoggingResponse.LoggingConfiguration.LogDestinationConfigs.pop();
        }

        const updateInput: UpdateLoggingConfigurationCommandInput = {
          FirewallName: firewallName,
          LoggingConfiguration: describeFirewallLoggingResponse.LoggingConfiguration
        };
        const updateCommand = new UpdateLoggingConfigurationCommand(updateInput);
        describeFirewallLoggingResponse = await this.networkFirewallClient.send(updateCommand);
      }

      if (loggingConfiguration.LogDestinationConfigs) {
        for (let config of loggingConfiguration.LogDestinationConfigs) {
          if (!describeFirewallLoggingResponse.LoggingConfiguration) {
            describeFirewallLoggingResponse.LoggingConfiguration = {
              LogDestinationConfigs: []
            };
          }
          
          if (!describeFirewallLoggingResponse.LoggingConfiguration.LogDestinationConfigs) {
            describeFirewallLoggingResponse.LoggingConfiguration.LogDestinationConfigs = [];
          }
          
          describeFirewallLoggingResponse.LoggingConfiguration.LogDestinationConfigs.push(config);
          
          const updateInput: UpdateLoggingConfigurationCommandInput = {
            FirewallName: firewallName,
            LoggingConfiguration: describeFirewallLoggingResponse.LoggingConfiguration
          };
          const updateCommand = new UpdateLoggingConfigurationCommand(updateInput);
          describeFirewallLoggingResponse = await this.networkFirewallClient.send(updateCommand);
        }
      }

      Logger.log(LOG_LEVEL.INFO, describeFirewallLoggingResponse);
    } catch (error) {
      Logger.log(LOG_LEVEL.INFO, `Failed to update firewall logging configuration`, error);
      return Promise.resolve();
    }
    return Promise.resolve(describeFirewallLoggingResponse);
  }

  async listRuleGroupsForPolicy(firewallPolicyName: string): Promise<string[]> {
    let ruleGroupArns: string[] = [];
    let response;

    try {
      const command = new DescribeFirewallPolicyCommand({
        FirewallPolicyName: firewallPolicyName,
      });
      response = await this.networkFirewallClient.send(command);
      if (response && response.FirewallPolicy) {
        response.FirewallPolicy?.StatefulRuleGroupReferences?.forEach((ruleGroup: any) => {
          ruleGroupArns.push(ruleGroup.ResourceArn);
        });
        response.FirewallPolicy?.StatelessRuleGroupReferences?.forEach((ruleGroup: any) => {
          ruleGroupArns.push(ruleGroup.ResourceArn);
        });
      } else {
        Logger.log(LOG_LEVEL.INFO, `No firewall policy of the name: ${firewallPolicyName}`);
        return Promise.resolve([]);
      }
      return Promise.resolve(ruleGroupArns);
    } catch (error: any) {
      Logger.log(LOG_LEVEL.INFO, 'Error trying to retrieve current rule groups:', AwsErrorFormatter.format(error));
      return Promise.resolve([]);
    }
  }

  async deleteRuleGroup(ruleGroupArn: string) {
    try {
      const command = new DeleteRuleGroupCommand({ RuleGroupArn: ruleGroupArn });
      await this.networkFirewallClient.send(command);
    } catch (error: any) {
      Logger.log(LOG_LEVEL.INFO, 'Unable to delete rule group:', AwsErrorFormatter.format(error));
    }
  }
}
