// Initialize the database and create collections
db = db.getSiblingDB('enki_cards');

// Create users collection
db.createCollection('users');

// Create cards collection
db.createCollection('cards');

// Create indexes for better performance
db.cards.createIndex({ "userId": 1 });
db.cards.createIndex({ "word": 1 });
db.cards.createIndex({ "createdAt": 1 });
db.cards.createIndex({ "isKnown": 1 });

// Create a default user for development
db.users.insertOne({
  _id: ObjectId(),
  username: "default_user",
  email: "user@example.com",
  createdAt: new Date(),
  updatedAt: new Date()
});

print('Database initialized successfully!');