const { CloudWatchLogsClient, GetLogEventsCommand, DescribeLogStreamsCommand } = require("@aws-sdk/client-cloudwatch-logs");
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../../docs/.env') });

const region = process.env.AWS_REGION || "us-east-1";
const config = {
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};

const cwlogs = new CloudWatchLogsClient(config);
const LOG_GROUP = "/ecs/bpn-backend";

async function getLogs() {
  console.log(`--- Fetching Logs for ${LOG_GROUP} ---`);
  
  try {
    // 1. Get the latest log stream
    const streamsRes = await cwlogs.send(new DescribeLogStreamsCommand({
      logGroupName: LOG_GROUP,
      orderBy: "LastEventTime",
      descending: true,
      limit: 1
    }));

    if (!streamsRes.logStreams || streamsRes.logStreams.length === 0) {
      console.log("No log streams found.");
      return;
    }

    const streamName = streamsRes.logStreams[0].logStreamName;
    console.log(`Latest Stream: ${streamName}`);

    // 2. Get events
    const eventsRes = await cwlogs.send(new GetLogEventsCommand({
      logGroupName: LOG_GROUP,
      logStreamName: streamName,
      limit: 50
    }));

    eventsRes.events.forEach(e => {
      const date = new Date(e.timestamp).toISOString();
      console.log(`[${date}] ${e.message}`);
    });

  } catch (err) {
    console.error("Log Fetch Error:", err.message);
  }
}

getLogs();
