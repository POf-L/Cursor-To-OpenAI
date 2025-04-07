const express = require('express');
const router = express.Router();

const { v4: uuidv4 } = require('uuid');
const { generatePkcePair, queryAuthPoll } = require('../tool/cursorLogin.js');

router.get("/loginDeepControl", async (req, res) => {
  let bearerToken = req.headers.authorization?.replace('Bearer ', '');
  const { verifier, challenge } = generatePkcePair();
  const uuid = uuidv4();
  const resposne = await fetch("https://www.cursor.com/api/auth/loginDeepCallbackControl", {
    method: 'POST',
    headers: {
      "Accept": "*/*",
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.6834.210 Safari/537.36',
      'Cookie': `WorkosCursorSessionToken=${bearerToken}`
    },
    body: JSON.stringify({
      "uuid": uuid,
      "challenge": challenge
    })
  })

  let token = undefined
  const retryAttempts = 60
  for (let i = 0; i < retryAttempts; i++) {
    const ret = await queryAuthPoll(uuid, verifier);
    if (ret) {
      token = ret
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
    if (i === retryAttempts - 1) {
      return res.status(500).json({
        error: 'Internal server error',
      });
    }
  }
  return res.json({
    "token": token,
  })
})

module.exports = router;
