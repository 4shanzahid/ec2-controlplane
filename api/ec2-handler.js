const { EC2Client, DescribeInstancesCommand, StartInstancesCommand, StopInstancesCommand } = require("@aws-sdk/client-ec2");

// Initialize the EC2 Client.
// The AWS credentials will be automatically picked up from Vercel's Environment Variables.
const ec2Client = new EC2Client({
  region: process.env.AWS_REGION,
  credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

// The main function that Vercel will run
export default async function handler(request, response) {
  // Allow requests from any origin (you can restrict this to your domain in Vercel settings)
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle pre-flight requests for CORS
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }
  
  try {
    if (request.method === 'GET') {
      const instanceId = request.query.instanceId;
      if (!instanceId) return response.status(400).json({ message: "Instance ID is required." });

      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] }));
      const status = Reservations[0].Instances[0].State.Name;
      return response.status(200).json({ status });

    } else if (request.method === 'POST') {
      const { instanceId, action } = request.body;
      if (!instanceId || !action) return response.status(400).json({ message: "Instance ID and action are required." });

      if (action === 'start') {
        await ec2Client.send(new StartInstancesCommand({ InstanceIds: [instanceId] }));
        return response.status(200).json({ message: 'Start command sent.' });
      } else if (action === 'stop') {
        await ec2Client.send(new StopInstancesCommand({ InstanceIds: [instanceId] }));
        return response.status(200).json({ message: 'Stop command sent.' });
      } else {
        return response.status(400).json({ message: "Invalid action." });
      }
    } else {
        return response.status(405).json({ message: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error("AWS API Error:", error);
    return response.status(500).json({ message: "An error occurred with the AWS API." });
  }
}

