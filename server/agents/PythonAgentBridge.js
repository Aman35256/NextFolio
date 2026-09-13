/**
 * Invokes a Python agent action by sending an HTTP POST request to the NextFolio FastAPI server,
 * rather than spawning a slow child process.
 * 
 * @param {string} agentAction The name of the agent action (e.g. 'offer.analyze')
 * @param {object} payload The payload arguments passed to the action
 * @returns {Promise<object>} The JSON result from the FastAPI agent
 */
export async function runPythonAgent(agentAction, payload = {}) {
  const fastapiUrl = process.env.LOCAL_LLM_API_URL || 'http://127.0.0.1:8000';
  const url = `${fastapiUrl}/api/agents/${agentAction}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.SECRET_KEY || 'super_secure_secret_key_nextfolio_123!'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`FastAPI server returned status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Unknown error returned by FastAPI agent');
    }
    return data.result;
  } catch (err) {
    throw new Error(
      `Failed to communicate with NextFolio FastAPI agent server at ${url}. ` +
      `Ensure the FastAPI server is running (e.g., via docker-compose or uvicorn). Details: ${err.message}`
    );
  }
}

export default runPythonAgent;

