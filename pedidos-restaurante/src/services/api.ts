const API_URL = 'http://192.168.1.100:8000/api';

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PUT';
  body?: Record<string, unknown>;
  token?: string;
};

export async function apiRequest<T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(
        'El servidor devolvió una respuesta inesperada. Revisa la terminal de Laravel.'
      );
    }

    if (!response.ok) {
      const validationErrors = data.errors as
        | Record<string, string[]>
        | undefined;

      const firstError = validationErrors
        ? Object.values(validationErrors)[0]?.[0]
        : undefined;

      const message =
        firstError ??
        (response.status === 429
          ? 'Demasiados intentos. Espera un minuto y vuelve a probar.'
          : data.message ?? 'No se pudo completar la solicitud.');

      throw new Error(message);
    }

    return data as T;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(
        'El servidor tardó demasiado en responder. Comprueba la conexión.'
      );
    }

    if (error instanceof TypeError) {
      throw new Error(
        'No se pudo conectar con el servidor. Revisa que Laravel esté encendido y ambos dispositivos estén en la misma red.'
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}