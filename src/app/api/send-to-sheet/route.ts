// src/app/api/send-to-sheet/route.ts
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { suggestedTitle, suggestedContent, avatarId, aiCategory } = body;

    // Validar que los datos necesarios están presentes (puedes añadir validación más robusta con Zod si es necesario)
    if (!suggestedTitle || !suggestedContent || !avatarId || !aiCategory) {
      return NextResponse.json({ error: 'Missing required fields in request body' }, { status: 400 });
    }

    const googleScriptUrl = process.env.GOOGLE_SCRIPT_URL;

    if (!googleScriptUrl) {
      console.error('GOOGLE_SCRIPT_URL environment variable is not set.');
      return NextResponse.json({ error: 'Server configuration error: Google Script URL not found.' }, { status: 500 });
    }

    const responseFromGoogleScript = await fetch(googleScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        suggestedTitle,
        suggestedContent,
        avatarId,
        aiCategory,
      }),
      // Consider adding a timeout if Google Apps Script can be slow
      // signal: AbortSignal.timeout(10000) // 10 seconds timeout (example)
    });

    if (!responseFromGoogleScript.ok) {
      const errorText = await responseFromGoogleScript.text();
      console.error(`Error from Google Apps Script: ${responseFromGoogleScript.status} ${responseFromGoogleScript.statusText}`, errorText);
      return NextResponse.json({ error: `Error from Google Apps Script: ${errorText || responseFromGoogleScript.statusText}` }, { status: responseFromGoogleScript.status });
    }

    const responseText = await responseFromGoogleScript.text();

    return NextResponse.json({ response: responseText });

  } catch (error) {
    console.error('Error in /api/send-to-sheet endpoint:', error);
    let errorMessage = 'An unexpected error occurred.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/*
  Ejemplo de cómo llamar a este endpoint desde el frontend:

  async function sendDataToApi(data) {
    try {
      const response = await fetch('/api/send-to-sheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Response from API:', result);
      // result.response contendrá el texto de la respuesta de Google Apps Script
      // Ejemplo: JSON.parse(result.response) para obtener el objeto si Apps Script devuelve JSON
      alert('Data sent successfully! Response: ' + result.response);

    } catch (error) {
      console.error('Error sending data to API:', error);
      alert('Failed to send data: ' + error.message);
    }
  }

  // Uso del ejemplo:
  const dataToSend = {
    suggestedTitle: "Título desde el frontend",
    suggestedContent: "Contenido detallado desde el frontend.",
    avatarId: "avatarFrontend123",
    aiCategory: "Frontend Test"
  };
  // sendDataToApi(dataToSend);
*/
