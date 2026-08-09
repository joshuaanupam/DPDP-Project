const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function nominateUser(req, res) {
  try {
    const { userId, nomineeName, nomineeEmail } = req.body;
    if (!userId || !nomineeName || !nomineeEmail) {
      return res.status(400).json({ success: false, error: 'Missing required fields: userId, nomineeName, nomineeEmail' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        nomineeName,
        nomineeEmail,
        nomineeConfirmed: false
      }
    });

    res.json({
      success: true,
      message: 'Nomination saved successfully. Awaiting confirmation.',
      user: {
        id: updatedUser.id,
        nomineeName: updatedUser.nomineeName,
        nomineeEmail: updatedUser.nomineeEmail,
        nomineeConfirmed: updatedUser.nomineeConfirmed
      }
    });
  } catch (err) {
    console.error('Error nominating user:', err);
    res.status(500).json({ success: false, error: 'Failed to save nominee details', details: err.message });
  }
}

async function confirmNomination(req, res) {
  try {
    const { userId, confirm } = req.body;
    if (!userId || confirm === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required fields: userId, confirm' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        nomineeConfirmed: !!confirm
      }
    });

    res.json({
      success: true,
      message: `Nomination ${confirm ? 'confirmed' : 'declined'} successfully.`,
      user: {
        id: updatedUser.id,
        nomineeName: updatedUser.nomineeName,
        nomineeEmail: updatedUser.nomineeEmail,
        nomineeConfirmed: updatedUser.nomineeConfirmed
      }
    });
  } catch (err) {
    console.error('Error confirming nomination:', err);
    res.status(500).json({ success: false, error: 'Failed to confirm nomination', details: err.message });
  }
}

module.exports = {
  nominateUser,
  confirmNomination
};
