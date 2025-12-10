/**
 * Script to assign admin role to a specific user ID
 * 
 * Usage: node scripts/assign-admin-role.js <userId>
 * Example: node scripts/assign-admin-role.js 693992b8f8ec79fd6f0f3f9d
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const userId = process.argv[2];

if (!userId) {
  console.error('Please provide a userId');
  console.log('Usage: node scripts/assign-admin-role.js <userId>');
  process.exit(1);
}

async function assignAdminRole() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Find user
    let user;
    try {
      user = await db.collection('users').findOne({
        _id: new ObjectId(userId),
      });
    } catch (e) {
      user = await db.collection('users').findOne({
        _id: userId,
      });
    }
    
    if (!user) {
      console.error('User not found with ID:', userId);
      process.exit(1);
    }
    
    console.log('Found user:', user.email || user.name);
    
    // Assign admin role
    await db.collection('userRoles').updateOne(
      { userId: user._id.toString() },
      {
        $set: {
          roles: ['admin'],
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );
    
    console.log('✅ Admin role assigned successfully!');
    console.log('User ID:', user._id.toString());
    console.log('User Email:', user.email);
    console.log('\nUser needs to sign out and sign in again for changes to take effect.');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

assignAdminRole();

