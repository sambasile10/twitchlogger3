import { RemovalPolicy, Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
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
      maxAzs: 1,
      natGateways: 1
    });

    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'cd /home/ec2-user',
      'echo "Elevated to superuser" >> install.log',
      'sudo yum update -y >> install.log',
      'sudo yum install git -y >> install.log',
      'echo "Updated packages" >> install.log',
      'sudo chown ec2-user:ec2-user install.log',
      'su - ec2-user',
      'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash >> install.log',
      'source /home/ec2-user/.nvm/nvm.sh',
      'nvm install 16 >> install.log',
      'echo "Installed node 16" >> install.log',
      'git clone https://github.com/sambasile10/twitchlogger3.git >> install.log',
      'sudo chown -R ec2-user:ec2-user twitchlogger3',
      'echo "Cloned into repo" >> install.log',
      'cd twitchlogger3',
      'npm i >> install.log',
      'echo "Installed npm packages" >> ../install.log',
      'npx ts-node src/logger/src/Chat.ts'
    );

    const ec2Role = new iam.Role(this, 'Ec2DynamoAccess', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com')
    });

    ec2Role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'));

    const instance = new ec2.Instance(this, 'Logger', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      vpc: vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      allowAllOutbound: true,
      userData: userData,
      role: ec2Role
    });

    instance.connections.allowFromAnyIpv4(ec2.Port.tcp(22)); // Allow SSH

    /**
     *  DynamoDB
     */
    const tables: Array<Table> = [];

    channelList.forEach((channelName) => {
      const lcName = channelName.toLowerCase();
      const table = new Table(this, lcName, {
        billingMode: BillingMode.PAY_PER_REQUEST,
        partitionKey: { name: 'username', type: AttributeType.STRING },
        sortKey: { name: 'weekOfYear', type: AttributeType.NUMBER },
        removalPolicy: RemovalPolicy.DESTROY,
        tableName: lcName,
      });

      table.grantFullAccess(instance);
      tables.push(table);
    });
  }
}