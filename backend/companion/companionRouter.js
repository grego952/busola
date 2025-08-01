import express from 'express';
import { TokenManager } from './TokenManager';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import escape from 'lodash.escape';
import addLogger from '../logging';

const config = require('../config.js');

const tokenManager = new TokenManager();
const COMPANION_API_BASE_URL = `${config.features?.KYMA_COMPANION?.config
  ?.apiBaseUrl ?? ''}/api/conversations/`;
const router = express.Router();

router.use(express.json());

async function handlePromptSuggestions(req, res) {
  const { namespace, resourceType, groupVersion, resourceName } = JSON.parse(
    req.body.toString(),
  );
  const clusterUrl = req.headers['x-cluster-url'];
  const certificateAuthorityData =
    req.headers['x-cluster-certificate-authority-data'];
  const clusterToken = req.headers['x-k8s-authorization']?.replace(
    /^Bearer\s+/i,
    '',
  );
  const clientCertificateData = req.headers['x-client-certificate-data'];
  const clientKeyData = req.headers['x-client-key-data'];

  try {
    const endpointUrl = COMPANION_API_BASE_URL;
    const payload = {
      resource_kind: resourceType,
      resource_api_version: groupVersion,
      resource_name: resourceName,
      namespace: namespace,
    };

    const AUTH_TOKEN = await tokenManager.getToken();

    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AUTH_TOKEN}`,
      'X-Cluster-Certificate-Authority-Data': certificateAuthorityData,
      'X-Cluster-Url': clusterUrl,
    };

    if (clusterToken) {
      headers['X-K8s-Authorization'] = clusterToken;
    } else if (clientCertificateData && clientKeyData) {
      headers['X-Client-Certificate-Data'] = clientCertificateData;
      headers['X-Client-Key-Data'] = clientKeyData;
    } else {
      throw new Error('Missing authentication credentials');
    }

    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    res.json({
      promptSuggestions: data?.initial_questions,
      conversationId: data?.conversation_id,
    });
  } catch (error) {
    req.log.warn(error);
    res.status(500).json({
      error: 'Failed to fetch AI chat data. Request ID: ' + escape(req.id),
    });
  }
}

async function handleChatMessage(req, res) {
  const {
    query,
    namespace,
    resourceType,
    groupVersion,
    resourceName,
  } = JSON.parse(req.body.toString());

  const clusterUrl = req.headers['x-cluster-url'];
  const certificateAuthorityData =
    req.headers['x-cluster-certificate-authority-data'];
  const clusterToken = req.headers['x-k8s-authorization']?.replace(
    /^Bearer\s+/i,
    '',
  );
  const clientCertificateData = req.headers['x-client-certificate-data'];
  const clientKeyData = req.headers['x-client-key-data'];
  const sessionId = req.headers['session-id'];
  const conversationId = sessionId;

  try {
    const uuidPattern = /^[a-f0-9]{32}$/i;
    if (!uuidPattern.test(conversationId)) {
      throw new Error('Invalid session ID ');
    }

    const endpointUrl = new URL(
      `${encodeURIComponent(conversationId)}/messages`,
      COMPANION_API_BASE_URL,
    );

    const payload = {
      query,
      resource_kind: resourceType,
      resource_api_version: groupVersion,
      resource_name: resourceName,
      namespace: namespace,
    };

    const AUTH_TOKEN = await tokenManager.getToken();

    // Set up headers for streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const headers = {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AUTH_TOKEN}`,
      'X-Cluster-Certificate-Authority-Data': certificateAuthorityData,
      'X-Cluster-Url': clusterUrl,
      'Session-Id': sessionId,
    };

    if (clusterToken) {
      headers['X-K8s-Authorization'] = clusterToken;
    } else if (clientCertificateData && clientKeyData) {
      headers['X-Client-Certificate-Data'] = clientCertificateData;
      headers['X-Client-Key-Data'] = clientKeyData;
    } else {
      throw new Error('Missing authentication credentials');
    }

    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = new Error();
      error.status = response.status;

      if (response.status >= 500) {
        error.message = 'A temporary interruption occurred. Please try again.';
        error.error = 'Service is interrupted';
      } else {
        const respJson = await response?.json();
        error.message =
          respJson?.message ??
          'A temporary interruption occurred. Please try again.';
        error.error = respJson?.error ?? response?.statusText;
      }

      throw error;
    }

    const stream = Readable.fromWeb(response.body);
    await pipeline(stream, res);
  } catch (error) {
    req.log.warn(error);
    if (!res.headersSent) {
      res.status(error.status).json({
        error: error.error,
        message: error.message,
      });
    } else {
      res.write(
        JSON.stringify({
          streamingError: {
            message:
              'An error occured during streaming. Request ID: ' +
              escape(req.id),
          },
        }) + '\n',
      );
      res.end();
    }
  }
}

async function handleFollowUpSuggestions(req, res) {
  const clusterUrl = req.headers['x-cluster-url'];
  const certificateAuthorityData =
    req.headers['x-cluster-certificate-authority-data'];
  const clusterToken = req.headers['x-k8s-authorization']?.replace(
    /^Bearer\s+/i,
    '',
  );
  const clientCertificateData = req.headers['x-client-certificate-data'];
  const clientKeyData = req.headers['x-client-key-data'];
  const sessionId = req.headers['session-id'];
  const conversationId = sessionId;

  try {
    const endpointUrl = new URL(
      `${encodeURIComponent(conversationId)}/questions`,
      COMPANION_API_BASE_URL,
    );

    const AUTH_TOKEN = await tokenManager.getToken();

    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AUTH_TOKEN}`,
      'X-Cluster-Certificate-Authority-Data': certificateAuthorityData,
      'X-Cluster-Url': clusterUrl,
      'Session-Id': sessionId,
    };

    if (clusterToken) {
      headers['X-K8s-Authorization'] = clusterToken;
    } else if (clientCertificateData && clientKeyData) {
      headers['X-Client-Certificate-Data'] = clientCertificateData;
      headers['X-Client-Key-Data'] = clientKeyData;
    } else {
      throw new Error('Missing authentication credentials');
    }

    const response = await fetch(endpointUrl, {
      method: 'GET',
      headers,
    });

    const data = await response.json();
    res.json({
      promptSuggestions: data?.questions,
      conversationId: data?.conversation_id,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch AI chat data' });
  }
}

router.post('/suggestions', addLogger(handlePromptSuggestions));
router.post('/messages', addLogger(handleChatMessage));
router.post('/followup', addLogger(handleFollowUpSuggestions));

export default router;
