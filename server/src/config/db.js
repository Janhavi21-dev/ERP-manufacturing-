import mongoose from 'mongoose';
import dns from 'node:dns';

let supportsTransactions = false;
let mongodInstance = null;

// Configure reliable DNS servers (both IPv6 and IPv4) to fix Atlas SRV lookup failures on ISP / Windows networks
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers([
    '2001:4860:4860::8888', // Google IPv6 Primary (critical for IPv6 connections)
    '2001:4860:4860::8844', // Google IPv6 Secondary
    '2606:4700:4700::1111', // Cloudflare IPv6
    '8.8.8.8',              // Google IPv4 Primary
    '8.8.4.4',              // Google IPv4 Secondary
    '1.1.1.1',              // Cloudflare IPv4
  ]);
} catch (dnsErr) {
  // Continue if system prevents overriding DNS servers
}

export const connectDB = async () => {
  // If already connected, do not re-connect
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // Handle in-memory database option if requested
  if (process.env.USE_IN_MEMORY_DB === 'true') {
    try {
      console.log('🧪 Starting in-memory MongoDB server...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create({
        binary: { version: '4.4.18' }, // 4.4.x runs without requiring AVX instructions
      });
      const inMemoryUri = mongodInstance.getUri();
      console.log(`📡 Connecting to In-Memory MongoDB at ${inMemoryUri}...`);
      await mongoose.connect(inMemoryUri);
      console.log('✅ In-Memory MongoDB connected successfully.');
      supportsTransactions = false;
      return;
    } catch (inMemErr) {
      console.error('❌ Failed to launch in-memory MongoDB:', inMemErr.message);
      throw inMemErr;
    }
  }

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/manufacturing_erp';
  const isAtlas = uri.startsWith('mongodb+srv://') || uri.includes('.mongodb.net');

  const mongooseOptions = {
    serverSelectionTimeoutMS: 10000,
    autoIndex: true,
  };

  // SSL / TLS configuration for cloud / encrypted connections
  if (isAtlas || uri.includes('ssl=true') || uri.includes('tls=true')) {
    mongooseOptions.tls = true;
    if (process.env.TLS_ALLOW_INVALID_CERTS === 'true' || process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
      mongooseOptions.tlsAllowInvalidCertificates = true;
    }
  }

  try {
    const maskedUri = uri.replace(/\/\/(.*):(.*)@/, '//***:***@');
    console.log(`📡 Connecting to MongoDB at ${maskedUri}...`);

    await mongoose.connect(uri, mongooseOptions);
    console.log(`✅ MongoDB connected successfully.`);

    // Check if replica set is supported for transactions
    try {
      const adminDb = mongoose.connection.db.admin();
      const serverStatus = await adminDb.serverStatus();
      if (serverStatus.repl) {
        supportsTransactions = true;
        console.log('✅ MongoDB ReplicaSet detected: Multi-document transactions enabled.');
      } else {
        supportsTransactions = false;
        console.log('ℹ️ Standalone MongoDB: Single-document atomic operations will be used.');
      }
    } catch {
      supportsTransactions = false;
    }
  } catch (error) {
    console.error('\n❌ MongoDB Connection Error:', error.message);

    if (error.message.includes('querySrv') || error.message.includes('ENOTFOUND') || error.message.includes('EREFUSED')) {
      console.error('\n🔍 [DNS Error Detected]');
      console.error('Cause: Your network/ISP or VPN could not resolve MongoDB Atlas DNS SRV records.');
      console.error('Fixes:');
      console.error(' 1. Use the Standard (Non-SRV) connection string from Atlas (starts with mongodb:// instead of mongodb+srv://).');
      console.error(' 2. Check if your Atlas cluster URL was copied accurately into server/.env.');
    } else if (error.message.includes('SSL') || error.message.includes('TLS') || error.message.includes('closed') || error.message.includes('CERT')) {
      console.error('\n🔒 [Encryption / TLS / Connection Closed Error Detected]');
      console.error('Cause: MongoDB Atlas closed the TLS connection or rejected the handshake.');
      console.error('Fixes:');
      console.error(' 1. Whitelist your IP in MongoDB Atlas: Go to Network Access -> Add IP Address -> Add "0.0.0.0/0" (Allow access from anywhere).');
      console.error(' 2. Check database user password: If your password has special characters (@, #, %, etc.), URL-encode them.');
      console.error(' 3. Set TLS_ALLOW_INVALID_CERTS=true in server/.env if an antivirus/proxy is inspecting HTTPS/TLS traffic.');
    } else if (error.message.includes('ECONNREFUSED') && (uri.includes('127.0.0.1') || uri.includes('localhost'))) {
      console.error('\n💻 [Local MongoDB Not Running Detected]');
      console.error('Cause: MongoDB service is not running locally on port 27017.');
      console.error('Notice: On CPUs without AVX (such as Intel Celeron N4020), MongoDB 5.0+ cannot start.');
      console.error('Recommended: Use a free cloud MongoDB Atlas URI in server/.env or MongoDB 4.4.');
    }

    throw error;
  }
};

export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongodInstance) {
    await mongodInstance.stop();
    mongodInstance = null;
  }
};

/**
 * Execute operations within a database transaction if supported,
 * or safely execute with sequential checks if running on standalone.
 * @param {Function} callback - Function receiving (session)
 */
export const withTransaction = async (callback) => {
  if (!supportsTransactions) {
    return await callback(null);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const result = await callback(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const checkTransactionSupport = () => supportsTransactions;
