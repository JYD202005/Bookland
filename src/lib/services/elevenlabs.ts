// Archivo: src/services/elevenlabs.ts

// Usamos import.meta.env porque asumo que estás en Vite
const ELEVENLABS_API_KEY: string = import.meta.env.VITE_ELEVENLABS_API_KEY;
const VOICE_ID: string = import.meta.env.VITE_VOICE_ID;

interface VoiceSettings {
    stability: number;
    similarity_boost: number;
}

interface ElevenLabsPayload {
    text: string;
    model_id: string;
    voice_settings: VoiceSettings;
}

// Fíjate en el "export" aquí
export async function narrarTexto(textoParaLeer: string): Promise<void> {
    const url: string = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

    // Creamos el objeto asegurándonos de que cumple con la interfaz
    const payload: ElevenLabsPayload = {
        text: textoParaLeer,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
        }
    };

    try {
        console.log("Generando audio...");

        const respuesta: Response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': ELEVENLABS_API_KEY
            },
            body: JSON.stringify(payload)
        });

        if (!respuesta.ok) {
            throw new Error(`Error de ElevenLabs: ${respuesta.status} - ${respuesta.statusText}`);
        }

        // Le decimos a TypeScript explícitamente que esperamos un Blob
        const audioBlob: Blob = await respuesta.blob();
        const audioUrl: string = URL.createObjectURL(audioBlob);

        // HTMLAudioElement es el tipo correcto para la etiqueta Audio en TS
        const reproductor: HTMLAudioElement = new Audio(audioUrl);
        reproductor.play();

        console.log("¡Reproduciendo!");

    } catch (error: unknown) {
        // En TS moderno, los errores en un catch son 'unknown', así que es buena práctica verificar
        if (error instanceof Error) {
            console.error("Hubo un problema al generar el audio:", error.message);
        } else {
            console.error("Hubo un error desconocido", error);
        }
    }
}
