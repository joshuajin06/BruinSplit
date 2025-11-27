import express from 'express';
import { signup, login } from '../controllers/authController.js';
import { authenticateUser } from '../middleware/authenticateUser.js';
import { comparePassword, hashPassword } from '../utils/auth.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);

router.get('/me', authenticateUser, async (req, res) => {
  try {
    res.json(req.user);
  } catch(error) {
    res.status(400).json({error: error.message});
  }
})


router.post('/logout', authenticateUser, async (req, res) => {
  res.json({message: 'Logged out successfully'});
})


router.post('/change-password', authenticateUser, async (req, res) => {
  try {
    const {currentPassword, newPassword} = req.body;

    if(!currentPassword || !newPassword) {
      res.status(400).json({error: "Current and new password are both required"});
    }

    if(newPassword.length < 8) {
      res.status(400).json({error: "Password length must be longer than 8"});
    }

    if(currentPassword == newPassword) {
      res.status(400).json({error: "New Password cannot be the same as the old password"});
    }

    const {data: user} = await supabase
      .from('profiles')
      .select('password_hash')
      .eq('id', user.id)
      .single()

    const validPassword = comparePassword(currentPassword, user.password_hash);

    if(!validPassword) {
      res.status(400).json({error: "Current password is not valid"});
    }

    const newPasswordHash = hashPassword(newPassword);

    const { error } = await supabase
      .from('profiles')
      .update({password_hash : newPasswordHash})
      .eq('id', user.id)

    if(error) throw error;

    res.json({ message: 'Password changed successfully' });
  } catch {
    res.status(400).json({ error: error.message });
  }
})

export default router;

