const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })
const lib = require('../src/lib/africastalking').default

;(async () => {
  try {
    const res = await lib.sendSMS(['+254711929567'], 'Test SMS from script')
    console.log('sendSMS result:', res)
  } catch (err) {
    console.error('sendSMS script error:', err)
  }
})()
