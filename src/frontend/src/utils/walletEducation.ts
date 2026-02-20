export const SECURITY_WARNINGS = {
  PRIVATE_KEY_ACCESS: 'Anyone with access to your private key can control and spend your Bitcoin. Never share it with anyone.',
  IRREVERSIBLE_TRANSACTIONS: 'Bitcoin transactions are irreversible. Lost or stolen Bitcoin cannot be recovered.',
  SELF_CUSTODY_RESPONSIBILITY: 'With self-custody comes full responsibility for securing your private keys. There is no customer support to recover lost keys.',
  PHISHING_AWARENESS: 'Be cautious of phishing attempts. Always verify you are on the correct website before entering sensitive information.',
  SECURE_STORAGE: 'Store private keys offline in a secure location. Never store them in cloud services, email, or take photos of them.',
  THRESHOLD_ECDSA: 'This application uses threshold ECDSA, which means private keys are never stored in plaintext or exposed to users.',
} as const;

export const BEST_PRACTICES = {
  OFFLINE_STORAGE: 'Write down your private key on paper and store it in a secure location like a safe.',
  PASSWORD_MANAGER: 'Use a reputable password manager with strong encryption to store your keys.',
  ENCRYPTED_BACKUP: 'Create encrypted backups of your keys and store them in multiple secure locations.',
  HARDWARE_WALLET: 'Consider using a hardware wallet for maximum security.',
  REGULAR_VERIFICATION: 'Periodically verify that you can still access your backup keys.',
  MULTIPLE_COPIES: 'Keep multiple copies of your keys in different secure locations.',
  NO_DIGITAL_PHOTOS: 'Never take photos of your private keys or store them on devices connected to the internet.',
} as const;

export const WALLET_EDUCATION = {
  CUSTODIAL_VS_NON_CUSTODIAL: {
    title: 'Custodial vs Non-Custodial Wallets',
    content: 'Custodial wallets are controlled by a third party who holds your private keys. Non-custodial wallets give you full control and responsibility for your keys.',
  },
  THRESHOLD_ECDSA_EXPLANATION: {
    title: 'Threshold ECDSA Security',
    content: 'Threshold ECDSA distributes private key material across multiple parties so no single entity has access to the complete key. Signatures are generated through secure multi-party computation.',
  },
  INTERNET_IDENTITY_CONTROL: {
    title: 'Internet Identity Authentication',
    content: 'Your Bitcoin is controlled through your Internet Identity credentials. Secure your Internet Identity with strong authentication methods and recovery phrases.',
  },
} as const;

export const TOOLTIP_CONTENT = {
  PUBLIC_KEY: 'Your public key is safe to share. It\'s used to derive Bitcoin addresses and verify signatures, but cannot be used to spend your Bitcoin.',
  PRIVATE_KEY: 'Your private key must be kept secret. Anyone with access to it can spend your Bitcoin.',
  ADDRESS: 'Your Bitcoin address is like an account number. It\'s safe to share for receiving Bitcoin.',
  THRESHOLD_ECDSA: 'A cryptographic protocol that provides enhanced security by distributing key material across multiple parties.',
} as const;

export const SELF_CUSTODY_EDUCATION = {
  CRITICAL_WARNING: 'Self-custody wallets give you complete control, but also complete responsibility. The platform CANNOT recover lost self-custody wallet keys.',
  WHAT_IS_SELF_CUSTODY: 'Self-custody means you directly control the private keys to your Bitcoin addresses. Unlike threshold ECDSA managed addresses where keys are distributed across multiple parties, self-custody wallets give you the actual private key that you must securely backup and protect.',
  RESPONSIBILITY_BACKUP: 'You must backup your private key immediately and store it securely offline (paper, hardware wallet, etc.)',
  RESPONSIBILITY_SECURITY: 'You are solely responsible for protecting your private key from theft, loss, or damage',
  RESPONSIBILITY_NO_RECOVERY: 'If you lose your private key, your Bitcoin is permanently lost - the platform cannot help you recover it',
  RESPONSIBILITY_VERIFICATION: 'You must verify addresses carefully before sending funds - Bitcoin transactions are irreversible',
  ACK_SECURITY: 'I understand that I am solely responsible for the security of my self-custody wallet private keys',
  ACK_BACKUP: 'I understand that I must backup my private keys securely and that failure to do so may result in permanent loss of funds',
  ACK_RECOVERY: 'I understand that the platform cannot recover lost self-custody wallet keys and that lost keys mean permanently lost Bitcoin',
  ACK_FUNDS: 'I understand that Bitcoin transactions are irreversible and that I must verify all addresses before transferring funds',
} as const;
