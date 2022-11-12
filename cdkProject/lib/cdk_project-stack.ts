import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CdkProjectStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const role = new cdk.aws_iam.Role(this, "access-glue", {
      assumedBy: new cdk.aws_iam.ServicePrincipal('glue.amazonaws.com'),
    });
    
    // Add AWSGlueServiceRole to role.
    const gluePolicy = cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSGlueServiceRole");
    role.addManagedPolicy(gluePolicy);

    const bucketName = 'cdk-glue-tomtom-bucket';
    
    const glueS3Bucket = new cdk.aws_s3.Bucket(this, bucketName ,{
      versioned: true,
      bucketName: bucketName,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      blockPublicAccess: cdk.aws_s3.BlockPublicAccess.BLOCK_ALL,
      autoDeleteObjects: true,
    });

    // Assign role to S3 bucket
    glueS3Bucket.grantReadWrite(role);

    // Job - Deploy script to get data and put in s3
    const jobName = 'cdk-glue-job';
    //const srcBucket = 'python-gluejob-tomtom';

    const glueJob = new cdk.aws_glue.CfnJob(this, jobName, {
      name: jobName,
      role: role.roleArn,
      description: "cdk test",
      command: {
        name: "glueetl", 
        pythonVersion: "3",
        scriptLocation: "s3://" + bucketName + "/glue-job.py"
      },
      defaultArguments:{
        "--TempDir":"s3://" + bucketName + "/lib",
        "--job-language":"python",
        "--additional-python-modules":"mojimoji"
      },
      glueVersion : "3.0",
      maxRetries: 0, 
      allocatedCapacity: 5
    });

    // Deploy glue job to s3 bucket
    new cdk.aws_s3_deployment.BucketDeployment(this, 'DeployGlueJobFiles', {
      sources: [cdk.aws_s3_deployment.Source.asset('./resources')],
      destinationBucket: glueS3Bucket
    });

    // new cdk.aws_s3_deployment.BucketDeployment(this, 'DeployGlueJobFiles', {
    //   sources: [cdk.aws_s3_deployment.Source.asset('./resources')],
    //   destinationBucket: glueS3Bucket,
    //   destinationKeyPrefix: 'Scripts'
    // });
  }
}
