/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  CreateRouteCommandInput,
  CreateRouteCommandOutput,
  DeleteRouteCommandInput,
  DescribeRouteTablesCommandOutput,
  EC2,
  ModifyTransitGatewayVpcAttachmentCommandInput,
  RouteTable,
} from '@aws-sdk/client-ec2';

import { AwsClientConfig } from './awsClientConfig';
import { Logger, LOG_LEVEL } from '../common/logger';
import { AwsErrorFormatter } from '../common/aws-error-formatter';

/**
 * Service class which handles all the EC2 API integrations.
 */
export class Ec2Service {
  private Ec2Client: EC2;
  config: any; // Updated from ConfigurationOptions to use SDK v3 type

  constructor() {
    this.config = new AwsClientConfig().getRetryConfigurationOptions();
    this.Ec2Client = new EC2(this.config);
  }

  /** Describes the route. */
  async describeRouteTables(routeTableId: string): Promise<Array<RouteTable> | undefined> {
    Logger.log(LOG_LEVEL.INFO, 'Describe Route Table');
    Logger.log(LOG_LEVEL.INFO, `Print Route Table Id: ${routeTableId}`);
    let response: DescribeRouteTablesCommandOutput;
    try {
      response = await this.Ec2Client.describeRouteTables({
        RouteTableIds: [routeTableId],
      });

      let nextToken = response.NextToken;
      let routeTables = response.RouteTables;

      // handle next token
      while (nextToken) {
        response = await this.Ec2Client.describeRouteTables({
          RouteTableIds: [routeTableId],
          NextToken: nextToken,
        });
        if (response.RouteTables) {
          routeTables = routeTables?.concat(response.RouteTables);
        }
        nextToken = response.NextToken;
      }
      return Promise.resolve(routeTables);
    } catch (error: any) {
      Logger.log(LOG_LEVEL.INFO, 'Route Table error:', AwsErrorFormatter.format(error));
      return Promise.reject(error);
    }
  }

  /** Creates route in the given route table. */
  async createRoute(props: CreateRouteCommandInput): Promise<CreateRouteCommandOutput | void> {
    Logger.log(LOG_LEVEL.INFO, 'Create Route');
    Logger.log(LOG_LEVEL.INFO, `Print Props: `, props);
    try {
      const response = await this.Ec2Client.createRoute(props);
      return Promise.resolve(response);
    } catch (error: any) {
      Logger.log(LOG_LEVEL.INFO, 'Create Route error:', AwsErrorFormatter.format(error));
      return Promise.reject(error);
    }
  }

  async deleteRoute(props: DeleteRouteCommandInput): Promise<DeleteRouteCommandInput | void> {
    Logger.log(LOG_LEVEL.INFO, 'delete Route');
    Logger.log(LOG_LEVEL.INFO, `Print Props: `, props);
    try {
      await this.Ec2Client.deleteRoute(props);
      return Promise.resolve();
    } catch (error: any) {
      Logger.log(LOG_LEVEL.INFO, 'Delete Route error:', AwsErrorFormatter.format(error));
      return Promise.reject(error);
    }
  }

  async modifyTransitGatewayAttachment(props: ModifyTransitGatewayVpcAttachmentCommandInput) {
    Logger.log(LOG_LEVEL.INFO, `modify the transit gateway attachment`);
    Logger.log(LOG_LEVEL.INFO, `Print Props: `, props);
    try {
      const response = await this.Ec2Client.modifyTransitGatewayVpcAttachment(props);
      return Promise.resolve(response);
    } catch (error: any) {
      Logger.log(LOG_LEVEL.INFO, 'Transit Gateway attachment error:', AwsErrorFormatter.format(error));
      return Promise.reject(error);
    }
  }
}
