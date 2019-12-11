const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

class CryptoController {
    constructor() {
        this._publicKey = '';
        this._privateKey = '';
        this._password = 'adib mito';
    }


    generateRSAPairKeys() {
        const {
            privateKey,
            publicKey
        } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'pkcs1',
                format: 'pem',
            },
            privateKeyEncoding: {
                type: 'pkcs1',
                format: 'pem',
                cipher: 'aes-256-cbc',
                passphrase: '',
            },
        })

        fs.writeFileSync('private.pem', privateKey)
        fs.writeFileSync('public.pem', publicKey)

        this._privateKey = privateKey;
        this._publicKey = publicKey;
    }

    getPublicKey() {
        return this._publicKey;
    }

    encryptRSA(publicKey) {
        const buffer = Buffer.from(this._password, 'utf8');
        const encrypted = crypto.publicEncrypt(publicKey, buffer);
        return encrypted.toString('base64');
    }

    encryptRSAPrivate(toEncrypt) {
        const absolutePath = path.resolve('private.pem');
        const privateKey = fs.readFileSync(absolutePath, 'utf8');
        const buffer = Buffer.from(toEncrypt, 'utf8');
        const encrypted = crypto.privateEncrypt({
            key: privateKey,
            passphrase: ''
        }, buffer);
        return encrypted.toString('base64');
    }

    decryptRSA(toDecrypt) {
        const absolutePath = path.resolve('private.pem')
        const privateKey = fs.readFileSync(absolutePath, 'utf8')
        const buffer = Buffer.from(toDecrypt, 'base64')
        const decrypted = crypto.privateDecrypt({
                key: privateKey.toString(),
                passphrase: '',
            },
            buffer,
        )
        return decrypted.toString('utf8')
    }

    decryptRSA(toDecrypt, publicKey) {
        const buffer = Buffer.from(toDecrypt, 'base64')
        try {
            const decrypted = crypto.publicDecrypt({
                    key: publicKey.toString(),
                    passphrase: '',
                },
                buffer,
            )
            return decrypted.toString('utf8');
        } catch (error) {
            return error;
        }
    }

    encryptAES(text) {
        const cipher = crypto.createCipher('aes-256-cbc', this._password);
        let encrypted = cipher.update(JSON.stringify(text), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }

    decryptAES(text) {
        const decipher = crypto.createDecipher('aes-256-cbc', this._password);
        let decrypted = decipher.update(text, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return JSON.parse(decrypted);
    }

    verifyIntegrity(text) {
        const hash = crypto.createHash('sha1').update(JSON.stringify(text)).digest('hex');
        return hash;
    }

    verifySignature(text, publicKey) {
        const decrypted = this.decryptRSA(text, publicKey);
        console.info(decrypted);
    }
}

module.exports = new CryptoController();