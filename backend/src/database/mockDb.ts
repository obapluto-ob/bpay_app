// Simple in-memory database for testing
export const mockUsers: any[] = [
  {
    id: 'user_test_123',
    email: 'obedemoni@gmail.com',
    password: '$2a$12$7mgm4xcBENri/rgu1IXfruvmF5/RBczTQ0jZucdcnw4vEBWv03h8C',
    first_name: 'obed',
    last_name: 'emoni',
    phone_number: '0729237059',
    country: 'KE',
    preferred_currency: 'KES',
    verification_code: null,
    verification_code_expires: null,
    email_verified: true,
    created_at: new Date()
  }
];
export const mockTrades: any[] = [];

export const mockQuery = async (text: string, params: any[] = []) => {
  console.log('Mock Query:', text, params);
  
  // Handle user registration
  if (text.includes('INSERT INTO users')) {
    const [email, password, firstName, lastName, phoneNumber, country, currency, code, expires] = params;
    const user = {
      id: `user_${Date.now()}`,
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      phone_number: phoneNumber,
      country,
      preferred_currency: currency,
      verification_code: code,
      verification_code_expires: expires,
      email_verified: false,
      created_at: new Date()
    };
    mockUsers.push(user);
    return { rows: [{ id: user.id, email: user.email }] };
  }
  
  // Handle user lookup
  if (text.includes('SELECT') && text.includes('FROM users')) {
    if (text.includes('WHERE email = $1')) {
      const user = mockUsers.find(u => u.email === params[0]);
      console.log('Found user:', user ? 'Yes' : 'No', 'for email:', params[0]);
      return { rows: user ? [user] : [] };
    }
  }
  
  // Handle user updates
  if (text.includes('UPDATE users')) {
    const user = mockUsers.find(u => u.email === params[params.length - 1] || u.id === params[params.length - 1]);
    if (user) {
      if (text.includes('email_verified = TRUE')) {
        user.email_verified = true;
        user.verification_code = null;
      }
      if (text.includes('verification_code =')) {
        user.verification_code = params[0];
        user.verification_code_expires = params[1];
      }
    }
    return { rows: [] };
  }
  
  // Handle wallet creation
  if (text.includes('INSERT INTO user_wallets')) {
    return { rows: [] };
  }
  
  // Handle transactions
  if (text.includes('BEGIN') || text.includes('COMMIT') || text.includes('ROLLBACK')) {
    return { rows: [] };
  }
  
  return { rows: [] };
};