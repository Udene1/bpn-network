const { AmplifyClient, ListAppsCommand } = require("@aws-sdk/client-amplify");
const { Route53Client, ListHostedZonesByNameCommand } = require("@aws-sdk/client-route-53");
require('dotenv').config();

const REGION = "us-east-1";
const DOMAIN_NAME = "verimut.icu";

async function guide() {
    console.log("\n--- AWS Amplify Web Deployment Guide (Mobile Apps) ---");
    console.log("Expo apps can be hosted as web apps on AWS Amplify for easy browser access.\n");
    
    console.log("1. Go to AWS Amplify Console: https://console.aws.amazon.com/amplify/home");
    console.log("2. Create TWO new apps (or one with multiple branches if preferred):");
    
    console.log("\n   A. BPN Buyer Web");
    console.log("      - Root directory: apps/buyer");
    console.log("      - App URL: https://app.verimut.icu");
    console.log("      - Env Var: EXPO_PUBLIC_API_URL=https://api.verimut.icu");
    
    console.log("\n   B. BPN Seller POS Web");
    console.log("      - Root directory: apps/seller");
    console.log("      - App URL: https://pos.verimut.icu");
    console.log("      - Env Var: EXPO_PUBLIC_API_URL=https://api.verimut.icu");
    
    console.log("\n3. Under 'Domain Management', map the subdomains 'app' and 'pos' to these apps.");
    console.log("   Amplify will handle the SSL and DNS automatically in Route 53.");

    console.log("\n--- Native Build Guidance (EAS) ---");
    console.log("To create actual Android/iOS apps, use Expo Application Services (EAS):\n");
    console.log("1. Install EAS CLI: npm install -g eas-cli");
    console.log("2. Log in: eas login");
    console.log("3. Initialize (run in apps/buyer or apps/seller): eas build:configure");
    console.log("4. Build Android: eas build --platform android --profile production");
    console.log("5. Build iOS: eas build --platform ios --profile production");
}

guide();
