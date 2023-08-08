import { SecretsManager } from "@aws-sdk/client-secrets-manager";

const secretManager = new SecretsManager({ region: 'us-west-2' });

export async function getSecret(secretId: string): Promise<string> {
    if (!secretId || secretId.length < 1) throw new Error(`Secret ID is empty.`);
    
    const secret = await secretManager.getSecretValue({ SecretId: secretId });
    if (secret.SecretString == null) throw new Error(`Secret response for ID '${secretId}' was null.`);
    return secret.SecretString;
}