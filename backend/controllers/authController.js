const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function login(req, res) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // For the demo, we bypass strict password hashing check, just ensure they provided something
    // Return user info and a mock token
    res.json({
      success: true,
      token: 'demo-jwt-token-12345',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        privacyScore: user.privacyScore
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered.' });
    }

    // Create the user
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash: password, // Store password directly for demo simplicity
        privacyScore: 75
      }
    });

    // Auto-seed footprint for the new user so they have data in the demo
    const shopEase = await prisma.website.findUnique({ where: { id: 'web_shopease' } });
    const socialHub = await prisma.website.findUnique({ where: { id: 'web_socialhub' } });
    
    if (shopEase && socialHub) {
      // Create some default data items
      await prisma.dataItem.createMany({
        data: [
          { userId: user.id, websiteId: shopEase.id, dataType: 'Email' },
          { userId: user.id, websiteId: shopEase.id, dataType: 'Phone' },
          { userId: user.id, websiteId: socialHub.id, dataType: 'Email' },
          { userId: user.id, websiteId: socialHub.id, dataType: 'Location' }
        ]
      });

      // Create some active consents
      await prisma.consent.createMany({
        data: [
          { userId: user.id, websiteId: shopEase.id, consentType: 'Account Creation', status: 'ACTIVE' },
          { userId: user.id, websiteId: shopEase.id, consentType: 'Marketing Emails', status: 'ACTIVE' },
          { userId: user.id, websiteId: socialHub.id, consentType: 'Account Creation', status: 'ACTIVE' },
          { userId: user.id, websiteId: socialHub.id, consentType: 'Targeted Advertising', status: 'ACTIVE' }
        ]
      });

      // Create a default audit log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          websiteId: shopEase.id,
          action: 'EVENT_DETECTED',
          description: `Passive MV3 Extension detected account creation and marketing consents on ShopEase for ${user.name}.`
        }
      });
    }

    res.status(201).json({
      success: true,
      token: 'demo-jwt-token-12345',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        privacyScore: user.privacyScore
      }
    });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: 'Internal server error during registration.' });
  }
}

module.exports = {
  login,
  register
};
