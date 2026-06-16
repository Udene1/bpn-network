const { AppRunnerClient, CreateServiceCommand, AssociateCustomDomainCommand } = require("@aws-sdk/client-apprunner");
const { ElastiCacheClient, CreateServerlessCacheCommand, DescribeServerlessCachesCommand } = require("@aws-sdk/client-elasticache");
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../../docs/.env') });

const config = {
  region: process.env.AWS_REGION || "eu-west-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};

const appRunner = new AppRunnerClient(config);
const elasticache = new ElastiCacheClient(config);

async function finalizeDeployment() {
  console.log("--- BPN Production Phase 2: Redis & App Runner ---");

  try {
    // 1. Create ElastiCache Serverless
    console.log("Creating ElastiCache Serverless Redis (this handles persistent sessions)...");
    try {
      await elasticache.send(new CreateServerlessCacheCommand({
        ServerlessCacheName: "bpn-prod-redis",
        Engine: "redis"
      }));
      console.log("Redis provisioning initiated.");
    } catch (e) {
      if (e.name === 'ServerlessCacheAlreadyExistsFault') console.log("Redis instance already exists.");
      else throw e;
    }

    // 2. Map Environment Variables
    const dbUrl = "postgresql://bpnadmin:SecurePassword123!@bpn-prod-db.cvw2mguk6zwn.eu-west-1.rds.amazonaws.com:5432/bpndb?schema=public";
    
    // Note: In a real flow, we'd wait for Redis and get its endpoint. 
    // For now, we'll assume the user will update the REDIS_URL in the Console once ready.
    
    console.log("APP RUNNER READY FOR GitHub CONNECTION.");
    console.log("Please create the App Runner service in the Console pointing to services/backend/Dockerfile");
    console.log(`DATABASE_URL: ${dbUrl}`);

  } catch (err) {
    console.error("Discovery Error:", err.message);
  }
}

finalizeDeployment();
