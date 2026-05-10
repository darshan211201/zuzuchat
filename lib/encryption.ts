import CryptoJS from "crypto-js"

const SECRET_KEY =
  process.env.NEXT_PUBLIC_CHAT_ENCRYPTION_KEY || "zuzuchat-default-secret-key"

export function encryptMessage(message: string) {
  return CryptoJS.AES.encrypt(message, SECRET_KEY).toString()
}

export function decryptMessage(encryptedMessage: string) {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, SECRET_KEY)
    return bytes.toString(CryptoJS.enc.Utf8) || encryptedMessage
  } catch {
    return encryptedMessage
  }
}