import { RemovalPolicy, Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

// Placeholder
const channelList: Array<string> = ['xQc'];

export class TwitchLoggerStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    /**
     *  EC2
     */
    const vpc = new ec2.Vpc(this, 'LoggerVpc', {
      maxAzs: 1
    });

    const instance = new ec2.Instance(this, 'Logger', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      vpc: vpc
    });

    instance.connections.allowFromAnyIpv4(ec2.Port.tcp(22)); // Allow SSH

    new CfnOutput(this, 'InstancePublicIp', {
      value: instance.instancePublicIp
    });

    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'sudo su',
      'apt-get update -y',
      'git clone https://github.com/sambasile10/twitchlogger3.git',
      'npx ts-node src/Chat.ts'
    );

    /**
     *  DynamoDB
     */
    const tables: Array<Table> = [];

    channelList.forEach((channelName) => {
      const table = new Table(this, channelName, {
        billingMode: BillingMode.PAY_PER_REQUEST,
        partitionKey: { name: 'userId', type: AttributeType.STRING },
        sortKey: { name: 'weekOfYear', type: AttributeType.NUMBER },
        removalPolicy: RemovalPolicy.DESTROY,
        tableName: channelName,
      });

      table.grantReadWriteData(instance);
      tables.push(table);
    });
  }
}