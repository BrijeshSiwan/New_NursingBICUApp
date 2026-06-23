import React from 'react';
import { randomBytes } from 'react-native-randombytes';
import CryptoJS from 'crypto-js';

class EncryptionHelper extends React.Component {

  /**
   * Pads the data using PKCS7 padding.
   * @param {string} data - The data to be padded.
   * @returns {string} - The padded data.
   */
  static padPKCS7(data) {
    const blockSize = 16; // AES block size
    const paddingLength = blockSize - (data.length % blockSize);
    const padding = String.fromCharCode(paddingLength).repeat(paddingLength);
    return data + padding;
  }

  /**
   * Generates a random initialization vector (IV).
   * @returns {Promise<Object>} - A promise that resolves to the IV.
   */
  static generateIV() {
    return new Promise((resolve, reject) => {
      randomBytes(16, (err, bytes) => {
        if (err) reject(err);
        resolve(CryptoJS.enc.Hex.parse(bytes.toString('hex')));
      });
    });
  }

  /**
   * Encrypts the given data using AES encryption.
   * @param {Object} data - The data to encrypt.
   * @param {string} secretKey - The secret key for encryption.
   * @returns {Promise<Object>} - A promise that resolves to the IV and ciphertext.
   */
  static async encryptMessage(data, secretKey) {
    try {
      const iv = await EncryptionHelper.generateIV();
      const message = JSON.stringify(data);
      const paddedMessage = EncryptionHelper.padPKCS7(message);

      const key = CryptoJS.SHA256(secretKey);
      const encrypted = CryptoJS.AES.encrypt(paddedMessage, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.NoPadding,
      });

      const ivBase64 = CryptoJS.enc.Base64.stringify(iv);
      const ciphertextBase64 = encrypted.ciphertext.toString(CryptoJS.enc.Base64);
      const ciphertextUrlSafe = ciphertextBase64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      return {
        iv: ivBase64,
        ciphertext: ciphertextUrlSafe,
      };
    } catch (error) {
      console.error('Error encrypting message:', error);
      throw error;
    }
  }
};

export default EncryptionHelper;
