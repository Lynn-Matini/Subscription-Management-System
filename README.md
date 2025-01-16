# 🔄 Subscription Management System

## 📝 Description

A decentralized subscription management system built on Avalanche blockchain, enabling automated recurring payments and subscription management for SaaS, newsletters, and streaming platforms.

## ✨ Features

➡️ **Subscription Management**

- Create subscriptions with custom pricing and duration
- View subscription details and status
- Process automated payments
- Automatic renewal tracking
- Toggle auto-renewal settings

➡️ **Wallet Integration**

- Seamless Core Wallet connection
- Secure payment processing
- Real-time balance updates
- Network verification (Fuji C-Chain)
- Address display toggle

➡️ **User Interface**

- Dark/Light mode toggle
- Responsive design
- Service-specific subscription plans
- Interactive subscription cards
- Real-time countdown timers

➡️ **Service Integration**

- Nation Media 📰
  - Daily news access
  - E-paper access
  - Premium content
- Showmax Kenya 🎬
  - HD streaming
  - Multiple device access
  - Offline viewing
- DSTV 📺
  - Live TV channels
  - Premium content
  - DVR functionality
- Mdundo 🎵
  - Music streaming
  - Playlist management
  - Offline downloads
- Elimu Library 📚
  - Educational resources
  - Research tools
  - Citation management

## 🛠️ Tech Stack

- Languages:

  - <img src="https://img.shields.io/badge/Solidity-%23363636.svg?style=flat&logo=solidity&logoColor=white"/>
  - <img src="https://img.shields.io/badge/JavaScript-%23F7DF1E.svg?style=flat&logo=javascript&logoColor=black"/>
  - <img src="https://img.shields.io/badge/CSS3-%231572B6.svg?style=flat&logo=css3&logoColor=white"/>

- Framework:

  - <img src="https://img.shields.io/badge/React-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB"/>

- Backend:

  - <img src="https://img.shields.io/badge/Firebase-%23FFCA28.svg?style=flat&logo=firebase&logoColor=black"/>

- Blockchain:

  - <img src="https://img.shields.io/badge/Avalanche-%23E84142.svg?style=flat&logo=avalanche&logoColor=white"/>

- Tools:
  - <img src="https://img.shields.io/badge/Web3.js-%23F16822.svg?style=flat&logo=web3dotjs&logoColor=white"/>
  - <img src="https://img.shields.io/badge/Core_Wallet-black?style=flat"/>
  - <img src="https://img.shields.io/badge/Hardhat-yellow?style=flat"/>

## 🚀 Setup Instructions

1. Clone repository
2. Install dependencies: `npm install`
3. Deploy smart contract & obtain contract address to be stored in `.env`
4. Set up Firebase configuration in `.env`
5. Start development server: `npm start`

## ⛰️ Avalanche Integration

- Smart contracts deployed on Avalanche Fuji C-Chain (TestNet)
- Chain ID: 43113
- Network verification for secure transactions
- Utilizing Avalanche's fast finality for instant payment confirmation
- Low transaction fees for subscription processing

## 💾 Database Structure

- Users collection: Stores wallet addresses and connection history
- Subscription Plans collection: Stores service-specific subscription plans
- User Subscriptions collection: Tracks active subscriptions and their status

## 👥 Team

- Lynn Matini
- Aristo Ayako

## 🔒 Security Features

- Network verification
- Secure wallet connections
- Protected Firebase configuration
- Smart contract security measures
