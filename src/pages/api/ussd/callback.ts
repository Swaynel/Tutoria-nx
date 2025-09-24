// USSD request parameters
export interface USSDRequest {
  sessionId: string
  phoneNumber: string
  text: string
}

// USSD response is always a string (Africa's Talking expects plain text)
export type USSDResponse = string

/**
 * Processes a USSD request and returns the response string
 */
export async function processUSSDResponse(
  sessionId: string,
  phoneNumber: string,
  text: string
): Promise<USSDResponse> {
  // Example: split user input by "*"
  const userInput = text.split('*').filter(Boolean)

  // Implement your USSD menu logic here
  if (userInput.length === 0) {
    return 'CON Welcome to My Service\n1. Check Balance\n2. Buy Airtime'
  }

  switch (userInput[0]) {
    case '1':
      return 'END Your balance is KES 1,234.56'
    case '2':
      return 'CON Enter amount to buy airtime:'
    default:
      return 'END Invalid option. Please try again.'
  }
}
